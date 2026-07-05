#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-reject-incomplete-quran-"));
const projectPath = join(tempDir, "project.json");
const recognitionPath = join(tempDir, "recognition.json");
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
    result: {
      surahNumber: 78,
      ayahStart: 1,
      ayahCount: 1,
      confidence: 1,
      method: "external-recognition-engine",
      exactMatch: true,
      matchEvidence: {
        method: "test-exact-alignment",
        description: "Synthetic exact match evidence for incomplete Quran rejection test.",
      },
      requiresManualConfirmation: true,
    },
  }, null, 2), "utf8");

  writeFileSync(quranPath, JSON.stringify({
    source: {
      name: "Reviewed but incomplete test Quran source",
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
    "--quran", quranPath,
    "--out", outPath,
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  assert(result.status !== 0, "recognition result must be rejected when Quran data is incomplete");
  assert(output.includes("Quran data did not pass full reviewed validation"), "full Quran validation rejection message missing");
  assert(!existsSync(outPath), "output project must not be written when Quran data is incomplete");

  console.log("PASS Incomplete Quran data recognition rejection test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
