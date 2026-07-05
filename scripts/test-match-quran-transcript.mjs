#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-transcript-match-"));
const quranPath = join(tempDir, "quran.json");

try {
  writeFileSync(quranPath, JSON.stringify({
    source: {
      name: "Test Quran fixture",
      url: "https://example.test/quran",
      edition: "fixture",
      rawSha256: "a".repeat(64),
      reviewed: true,
    },
    surahs: [
      {
        number: 1,
        ayahs: [
          { text: "الحمد لله رب العالمين" },
          { text: "الرحمن الرحيم" },
          { text: "مالك يوم الدين" },
        ],
      },
      {
        number: 2,
        ayahs: [
          { text: "الحمد لله رب العالمين" },
          { text: "ذلك الكتاب لا ريب فيه" },
        ],
      },
    ],
  }, null, 2), "utf8");

  const unique = run([
    "scripts/match-quran-transcript.mjs",
    "--quran",
    quranPath,
    "--transcript",
    "مالك يوم الدين",
    "--analyzed-seconds",
    "7",
    "--json",
  ], 0);
  const uniqueReport = JSON.parse(unique.stdout);
  assert(uniqueReport.status === "unique", "unique transcript should have one match");
  assert(uniqueReport.result.surahNumber === 1, "unique match surah should be 1");
  assert(uniqueReport.result.ayahStart === 3, "unique match ayah should be 3");
  assert(uniqueReport.exactMatch === true, "unique match should be exact");

  const ambiguous = run([
    "scripts/match-quran-transcript.mjs",
    "--quran",
    quranPath,
    "--transcript",
    "الحمد لله رب العالمين",
    "--json",
  ], 0);
  const ambiguousReport = JSON.parse(ambiguous.stdout);
  assert(ambiguousReport.status === "ambiguous", "duplicate transcript should be ambiguous");
  assert(ambiguousReport.candidates.length === 2, "ambiguous match should list both candidates");
  assert(ambiguousReport.exactMatch === false, "ambiguous match must not be exact");

  const missing = run([
    "scripts/match-quran-transcript.mjs",
    "--quran",
    quranPath,
    "--transcript",
    "نص لا يطابق المصحف",
    "--analyzed-seconds",
    "7",
    "--next-analysis-seconds",
    "15",
    "--json",
  ], 1);
  const missingReport = JSON.parse(missing.stdout);
  assert(missingReport.status === "not-found", "missing transcript should ask for wider analysis");
  assert(missingReport.message.includes("15"), "missing transcript should include next analysis window");

  if (existsSync("data/quran-uthmani.json")) {
    const duha = run([
      "scripts/match-quran-transcript.mjs",
      "--quran",
      "data/quran-uthmani.json",
      "--transcript",
      "\u0648\u0627\u0644\u0636\u062d\u0649 \u0648\u0627\u0644\u0644\u064a\u0644 \u0625\u0630\u0627 \u0633\u062c\u0649",
      "--json",
    ], 0);
    const duhaReport = JSON.parse(duha.stdout);
    assert(duhaReport.status === "unique", "Uthmani dagger alif in ad-Duha should match ordinary Arabic transcript");
    assert(duhaReport.result.surahNumber === 93, "ad-Duha match should be surah 93");
    assert(duhaReport.result.ayahStart === 1, "ad-Duha match should start at ayah 1");
    assert(duhaReport.result.ayahEnd === 2, "ad-Duha match should include ayah 2");

    const baqarah = run([
      "scripts/match-quran-transcript.mjs",
      "--quran",
      "data/quran-uthmani.json",
      "--transcript",
      "\u0630\u0644\u0643 \u0627\u0644\u0643\u062a\u0627\u0628 \u0644\u0627 \u0631\u064a\u0628 \u0641\u064a\u0647",
      "--json",
    ], 0);
    const baqarahReport = JSON.parse(baqarah.stdout);
    assert(baqarahReport.status === "unique", "mixed dagger alif words should match ordinary Arabic transcript");
    assert(baqarahReport.result.surahNumber === 2, "baqarah match should be surah 2");
    assert(baqarahReport.result.ayahStart === 2, "baqarah match should be ayah 2");
  }

  console.log("PASS Quran transcript matching test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function run(args, expectedStatus) {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== expectedStatus) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    throw new Error(`Expected ${expectedStatus}, got ${result.status}\n${output}`);
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
