#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-ambiguous-recognition-"));
const recognitionPath = join(tempDir, "ambiguous-result.json");

try {
  writeFileSync(recognitionPath, JSON.stringify({
    engine: { name: "Transcript Matcher", provider: "Ayah Studio", version: "0.1.0" },
    result: {
      status: "ambiguous",
      confidence: 0,
      method: "normalized-transcript-exact-substring",
      exactMatch: false,
      requiresManualConfirmation: true,
      candidates: [
        { surahNumber: 1, ayahStart: 1, ayahCount: 1 },
        { surahNumber: 2, ayahStart: 1, ayahCount: 1 },
      ],
    },
  }, null, 2), "utf8");

  const reviewable = run(["scripts/validate-recognition-result.mjs", "--file", recognitionPath, "--json"], 0);
  const report = JSON.parse(reviewable.stdout);
  assert(report.ready === true, "ambiguous candidates should be valid for review");
  assert(report.result.status === "ambiguous", "status should be ambiguous");
  assert(report.result.candidateCount === 2, "candidate count should be preserved");

  const exact = run(["scripts/validate-recognition-result.mjs", "--file", recognitionPath, "--require-exact-match"], 1);
  const output = `${exact.stdout || ""}${exact.stderr || ""}`;
  assert(output.includes("ambiguous recognition candidates cannot be applied"), "ambiguous exact-match rejection missing");

  console.log("PASS Ambiguous recognition candidates validation test completed.");
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
