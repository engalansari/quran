#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-reject-job-mismatch-"));
const projectPath = join(tempDir, "project.json");
const recognitionPath = join(tempDir, "recognition.json");
const jobPath = join(tempDir, "recognition-job.json");
const quranPath = join(tempDir, "quran.json");
const outPath = join(tempDir, "project.suggested.json");

try {
  writeFileSync(projectPath, JSON.stringify({
    app: "Ayah Studio",
    account: "@tilawat_alquran30",
    surah: 112,
    ayahStart: 1,
    ayahCount: 4,
    ayahSelectionConfirmed: true,
  }, null, 2), "utf8");

  writeFileSync(recognitionPath, JSON.stringify({
    engine: {
      name: "Quran audio recognition engine",
      provider: "Example Provider",
      version: "0.0.0",
    },
    sourceAudio: {
      fileName: "recitation-a.mp4",
      sha256: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    result: {
      surahNumber: 78,
      ayahStart: 1,
      ayahCount: 1,
      confidence: 1,
      method: "external-recognition-engine",
      exactMatch: true,
      matchEvidence: {
        method: "test-exact-alignment",
        description: "Synthetic exact match evidence for mismatch test.",
      },
      requiresManualConfirmation: true,
    },
  }, null, 2), "utf8");

  writeFileSync(jobPath, JSON.stringify({
    jobType: "ayah-studio-recognition-job",
    sourceAudio: {
      fileName: "recitation-b.mp4",
      sha256: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
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
        ],
      },
    ],
  }, null, 2), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/apply-recognition-result.mjs",
    "--project", projectPath,
    "--recognition", recognitionPath,
    "--job", jobPath,
    "--quran", quranPath,
    "--test-allow-incomplete-quran",
    "--out", outPath,
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  assert(result.status !== 0, "recognition result with a mismatched job hash must be rejected");
  assert(output.includes("does not match the recognition job"), "job mismatch rejection message missing");
  assert(!existsSync(outPath), "output project must not be written when job hash mismatches");

  console.log("PASS Recognition job mismatch rejection test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
