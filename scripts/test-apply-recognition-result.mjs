#!/usr/bin/env node

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-apply-recognition-"));
const projectPath = join(tempDir, "project.json");
const recognitionPath = join(tempDir, "recognition.json");
const jobPath = join(tempDir, "recognition-job.json");
const quranPath = join(tempDir, "quran.json");
const outPath = join(tempDir, "project.suggested.json");
const sourceHash = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

writeFileSync(projectPath, JSON.stringify({
  app: "Ayah Studio",
  account: "@tilawat_alquran30",
  surah: 112,
  ayahStart: 1,
  ayahCount: 4,
  ayahSelectionConfirmed: true,
  confirmedAyahSelectionSignature: "112:1:4",
}, null, 2), "utf8");

writeFileSync(recognitionPath, JSON.stringify({
  engine: {
    name: "Quran audio recognition engine",
    provider: "Example Provider",
    version: "0.0.0",
  },
  sourceAudio: {
    fileName: "recitation.mp4",
    sha256: sourceHash,
  },
  result: {
    surahNumber: 78,
    ayahStart: 1,
    ayahCount: 3,
    confidence: 1,
    method: "external-recognition-engine",
    exactMatch: true,
    matchEvidence: {
      method: "test-exact-alignment",
      description: "Synthetic exact match evidence for applier test.",
    },
    requiresManualConfirmation: true,
    segments: [
      { ayahNumber: 1, start: 0, end: 4, confidence: 1 },
      { ayahNumber: 2, start: 4, end: 8, confidence: 1 },
      { ayahNumber: 3, start: 8, end: 12, confidence: 1 },
    ],
  },
}, null, 2), "utf8");
writeFileSync(jobPath, JSON.stringify({
  jobType: "ayah-studio-recognition-job",
  sourceAudio: {
    fileName: "recitation.mp4",
    sha256: sourceHash,
  },
}, null, 2), "utf8");
writeFileSync(quranPath, JSON.stringify({
  source: {
    name: "Reviewed test Quran source",
    reviewed: true,
  },
  surahs: [
    {
      number: 78,
      ayahs: [
        { number: 1, text: "نص عربي للاختبار فقط" },
        { number: 2, text: "نص عربي ثان للاختبار فقط" },
        { number: 3, text: "نص عربي ثالث للاختبار فقط" },
      ],
    },
  ],
}, null, 2), "utf8");

const result = spawnSync(process.execPath, [
  "scripts/apply-recognition-result.mjs",
  "--project",
  projectPath,
  "--recognition",
  recognitionPath,
  "--job",
  jobPath,
  "--quran",
  quranPath,
  "--test-allow-incomplete-quran",
  "--out",
  outPath,
], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(result.status || 1);
}

const updated = JSON.parse(readFileSync(outPath, "utf8"));

assertEqual(updated.surah, 78, "surah should come from recognition result");
assertEqual(updated.ayahStart, 1, "ayahStart should come from recognition result");
assertEqual(updated.ayahCount, 3, "ayahCount should come from recognition result");
assertEqual(updated.ayahSelectionConfirmed, false, "manual confirmation must be cleared");
assertEqual(updated.confirmedAyahSelectionSignature, "", "old confirmation signature must be cleared");
assertEqual(updated.recognitionSuggestion.source, "external-recognition-result", "recognition source should be external");
assertEqual(updated.recognitionSuggestion.confidence, 100, "confidence should be stored as percent");
assertEqual(updated.recognitionSuggestion.validation.ready, true, "validation report should be attached");
assertEqual(updated.recognitionSuggestion.recognitionJob.sha256, sourceHash, "recognition job hash should be attached");
assertEqual(updated.recognitionSuggestion.quranData.reviewed, true, "reviewed Quran data should be attached");

console.log("PASS Recognition result applier test completed.");

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`FAIL ${message}`);
    console.error(`Expected: ${expected}`);
    console.error(`Actual: ${actual}`);
    process.exit(1);
  }
}
