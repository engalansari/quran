#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-recognition-result-"));
const goodPath = join(tempDir, "good-result.json");
const badPath = join(tempDir, "bad-result.json");

try {
  writeFileSync(goodPath, JSON.stringify({
    engine: { name: "Test Engine", provider: "Test Provider", version: "1.0.0" },
    result: {
      surahNumber: 1,
      ayahStart: 1,
      ayahCount: 2,
      confidence: 1,
      method: "test-recognition",
      exactMatch: true,
      matchEvidence: {
        method: "test-exact-alignment",
        description: "Synthetic exact match evidence for validator test.",
      },
      requiresManualConfirmation: true,
      segments: [
        { ayahNumber: 1, start: 0, end: 2, confidence: 1 },
        { ayahNumber: 2, start: 2, end: 4, confidence: 1 },
      ],
    },
  }, null, 2), "utf8");

  writeFileSync(badPath, JSON.stringify({
    engine: { name: "Test Engine" },
    result: {
      surahNumber: 1,
      ayahStart: 8,
      ayahCount: 1,
      confidence: 0.2,
      method: "",
      requiresManualConfirmation: false,
    },
  }, null, 2), "utf8");

  run(["scripts/validate-recognition-result.mjs", "--file", goodPath, "--require-exact-match"], 0);
  const bad = run(["scripts/validate-recognition-result.mjs", "--file", badPath, "--json"], 1);
  const report = JSON.parse(bad.stdout);
  assert(report.ready === false, "bad recognition result should not be ready");
  assert(report.issues.length >= 4, "bad recognition result should report several issues");

  console.log("PASS Recognition result validation test completed.");
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
  if (!condition) {
    throw new Error(message);
  }
}
