#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-quran-import-"));
const sourcePath = join(tempDir, "official-like-source.csv");
const sourceDir = join(tempDir, "source");
const outputPath = join(tempDir, "quran-uthmani.json");
const checklistPath = join(tempDir, "checklist.md");
const authorityPath = join(tempDir, "authority.json");

try {
  writeFileSync(sourcePath, [
    "sura_no,aya_no,aya_text",
    "1,1,نص عربي للاختبار فقط",
    "1,2,نص عربي ثان للاختبار فقط",
    "",
  ].join("\n"), "utf8");
  writeFileSync(authorityPath, JSON.stringify({
    authority: {
      name: "Import Test Source",
      officialSiteUrl: "https://example.com/",
      developerPlatformUrl: "https://example.com/developer/",
      acceptedSourceDomains: ["example.com"],
      acceptedFormats: ["csv"],
      reviewed: false,
    },
  }, null, 2), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/import-quran-source.mjs",
    "--input", sourcePath,
    "--source-dir", sourceDir,
    "--output", outputPath,
    "--source-name", "Import Test Source",
    "--source-url", "https://example.com/import-test-source.csv",
    "--source-edition", "Import Test Edition",
    "--authority", authorityPath,
    "--checklist", checklistPath,
    "--allow-incomplete",
  ], {
    encoding: "utf8",
    windowsHide: true,
  });

  assert(result.status === 0, `${result.stdout || ""}${result.stderr || ""}`.trim());
  assert(existsSync(join(sourceDir, "official-like-source.csv")), "raw source was not archived");
  assert(existsSync(outputPath), "prepared Quran output was not written");
  assert(existsSync(checklistPath), "production checklist was not written");

  const prepared = JSON.parse(readFileSync(outputPath, "utf8"));
  assert(prepared.source?.name === "Import Test Source", "source.name was not preserved");
  assert(prepared.source?.edition === "Import Test Edition", "source.edition was not preserved");
  assert(prepared.source?.reviewed === false, "source.reviewed should default to false");
  assert(prepared.surahs?.[0]?.number === 1, "surah was not normalized");
  assert(prepared.surahs?.[0]?.ayahs?.[0]?.number === 1, "ayah number was not normalized");
  assert(prepared.surahs?.[0]?.ayahs?.[0]?.text === "نص عربي للاختبار فقط", "ayah text was not normalized");

  const checklist = readFileSync(checklistPath, "utf8");
  assert(checklist.includes("Ayah Studio Production Readiness Checklist"), "checklist title missing");

  console.log("PASS Quran source import test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
