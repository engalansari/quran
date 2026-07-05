#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-reject-approx-recognition-"));
const projectPath = join(tempDir, "project.json");
const recognitionPath = join(tempDir, "recognition.approximate.json");
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
    confirmedAyahSelectionSignature: "112:1:4",
  }, null, 2), "utf8");

  writeFileSync(recognitionPath, JSON.stringify({
    engine: {
      name: "Quran audio recognition engine",
      provider: "Example Provider",
      version: "0.0.0",
    },
    result: {
      surahNumber: 78,
      ayahStart: 1,
      ayahCount: 3,
      confidence: 0.99,
      method: "approximate-recognition",
      exactMatch: false,
      requiresManualConfirmation: true,
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
    "--project", projectPath,
    "--recognition", recognitionPath,
    "--quran", quranPath,
    "--test-allow-incomplete-quran",
    "--out", outPath,
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  assert(result.status !== 0, "approximate recognition result must be rejected");
  assert(output.includes("result.exactMatch must be true"), "exactMatch rejection message missing");
  assert(output.includes("result.confidence must be exactly 1"), "confidence rejection message missing");
  assert(!existsSync(outPath), "output project must not be written for approximate recognition");

  console.log("PASS Approximate recognition application rejection test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
