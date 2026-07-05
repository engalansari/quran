#!/usr/bin/env node

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-quran-"));
const sourcePath = join(tempDir, "source.json");
const csvSourcePath = join(tempDir, "source.csv");
const outputPath = join(tempDir, "quran-uthmani.json");
const officialLikeOutputPath = join(tempDir, "quran-uthmani.official-like.json");
const officialLikeCsvOutputPath = join(tempDir, "quran-uthmani.official-like-csv.json");

try {
  writeFileSync(sourcePath, JSON.stringify({
    ayahs: [
      { surah: 1, ayah: 1, uthmaniText: "sample text 1" },
      { surah: 1, ayah: 2, uthmaniText: "sample text 2" },
    ],
  }, null, 2), "utf8");

  run("prepare", [
    "scripts/prepare-quran-data.mjs",
    "--input", sourcePath,
    "--output", outputPath,
    "--source-name", "Pipeline Test Source",
    "--source-url", "https://example.com/quran-source",
    "--source-edition", "Pipeline Test Edition",
  ], 0);

  const prepared = JSON.parse(readFileSync(outputPath, "utf8"));
  assert(prepared.source?.name === "Pipeline Test Source", "source.name was not preserved");
  assert(prepared.source?.url === "https://example.com/quran-source", "source.url was not preserved");
  assert(prepared.source?.edition === "Pipeline Test Edition", "source.edition was not preserved");
  assert(/^[a-f0-9]{64}$/i.test(prepared.source?.rawSha256 || ""), "source.rawSha256 was not recorded");
  assert(prepared.source?.reviewed === false, "prepared source.reviewed must default to false");
  assert(prepared.surahs?.[0]?.number === 1, "surah number was not normalized");
  assert(prepared.surahs?.[0]?.ayahs?.length === 2, "ayah list was not normalized");

  run("mark reviewed test file", [
    "scripts/mark-quran-source-reviewed.mjs",
    "--file", outputPath,
    "--reviewed-by", "Pipeline Test Reviewer",
    "--review-note", "Pipeline test only; not production Quran text.",
    "--review-date", "2026-01-01",
    "--allow-incomplete",
  ], 0);

  const marked = JSON.parse(readFileSync(outputPath, "utf8"));
  assert(marked.source?.reviewed === true, "source.reviewed was not set");
  assert(marked.source?.reviewedBy === "Pipeline Test Reviewer", "source.reviewedBy was not preserved");
  assert(marked.source?.reviewDate === "2026-01-01", "source.reviewDate was not preserved");

  writeFileSync(sourcePath, JSON.stringify([
    { sora: 1, aya_no: 1, aya_text: "نص عربي للاختبار فقط" },
    { sora: 1, aya_no: 2, aya_text: "نص عربي ثان للاختبار فقط" },
  ], null, 2), "utf8");

  run("prepare official-like field names", [
    "scripts/prepare-quran-data.mjs",
    "--input", sourcePath,
    "--output", officialLikeOutputPath,
    "--source-name", "Official-like Field Test Source",
    "--source-url", "https://qurancomplex.gov.sa/",
    "--source-edition", "Unicode JSON field compatibility test",
  ], 0);

  const officialLike = JSON.parse(readFileSync(officialLikeOutputPath, "utf8"));
  assert(officialLike.surahs?.[0]?.number === 1, "official-like sora field was not normalized");
  assert(officialLike.surahs?.[0]?.ayahs?.[0]?.number === 1, "official-like aya_no field was not normalized");
  assert(
    officialLike.surahs?.[0]?.ayahs?.[0]?.text === "نص عربي للاختبار فقط",
    "official-like aya_text field was not normalized",
  );

  writeFileSync(csvSourcePath, [
    "sura_no,aya_no,aya_text",
    "1,1,نص عربي للاختبار فقط",
    "1,2,نص عربي ثان للاختبار فقط",
    "",
  ].join("\n"), "utf8");

  run("prepare official-like CSV field names", [
    "scripts/prepare-quran-data.mjs",
    "--input", csvSourcePath,
    "--output", officialLikeCsvOutputPath,
    "--source-name", "Official-like CSV Field Test Source",
    "--source-url", "https://qurancomplex.gov.sa/",
    "--source-edition", "Unicode CSV field compatibility test",
  ], 0);

  const officialLikeCsv = JSON.parse(readFileSync(officialLikeCsvOutputPath, "utf8"));
  assert(officialLikeCsv.surahs?.[0]?.number === 1, "official-like CSV sura_no field was not normalized");
  assert(officialLikeCsv.surahs?.[0]?.ayahs?.[0]?.number === 1, "official-like CSV aya_no field was not normalized");
  assert(
    officialLikeCsv.surahs?.[0]?.ayahs?.[0]?.text === "نص عربي للاختبار فقط",
    "official-like CSV aya_text field was not normalized",
  );

  const validation = run("validate partial data", [
    "scripts/validate-quran-data.mjs",
    "--file", outputPath,
    "--json",
  ], 1);
  const validationReport = JSON.parse(validation.stdout);
  assert(validationReport.complete === false, "partial test data must not be complete");
  assert(validationReport.source?.ready === true, "documented source metadata should be ready");
  assert(validationReport.text?.ready === false, "sample placeholder text must fail text quality checks");
  assert(validationReport.text?.issueCount >= 2, "placeholder text issues were not reported");

  const reviewedValidation = run("validate reviewed gate", [
    "scripts/validate-quran-data.mjs",
    "--file", outputPath,
    "--require-reviewed",
    "--json",
  ], 1);
  const reviewedReport = JSON.parse(reviewedValidation.stdout);
  assert(
    reviewedReport.source?.ready === true,
    "reviewed source metadata should pass after marking",
  );
  assert(reviewedReport.ready === false, "partial placeholder data must still fail production readiness");

  console.log("PASS Quran data pipeline test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function run(label, args, expectedStatus) {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== expectedStatus) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    throw new Error(`${label} exited with ${result.status}; expected ${expectedStatus}\n${output}`);
  }
  return result;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
