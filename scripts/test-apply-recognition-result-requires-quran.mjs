#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-require-quran-"));
const projectPath = join(tempDir, "project.json");
const recognitionPath = join(tempDir, "recognition.json");
const outPath = join(tempDir, "project.suggested.json");

try {
  writeFileSync(projectPath, JSON.stringify({
    app: "Ayah Studio",
    account: "@tilawat_alquran30",
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
        description: "Synthetic exact match evidence for quran-required test.",
      },
      requiresManualConfirmation: true,
    },
  }, null, 2), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/apply-recognition-result.mjs",
    "--project", projectPath,
    "--recognition", recognitionPath,
    "--out", outPath,
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  assert(result.status !== 0, "apply-recognition-result must require --quran");
  assert(!existsSync(outPath), "output project must not be written without --quran");

  console.log("PASS Recognition application requires Quran data test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
