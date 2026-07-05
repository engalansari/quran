#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-checklist-"));
const outputPath = join(tempDir, "production-readiness-checklist.md");

try {
  const result = spawnSync(process.execPath, [
    "scripts/write-production-checklist.mjs",
    "--out", outputPath,
  ], {
    encoding: "utf8",
    windowsHide: true,
  });

  assert(result.status === 1, "checklist writer should fail until exact transcript recognition is ready");
  assert(existsSync(outputPath), "checklist writer did not create the Markdown file");

  const checklist = readFileSync(outputPath, "utf8");
  assert(checklist.includes("# Ayah Studio Production Readiness Checklist"), "checklist is missing the title");
  assert(checklist.includes("Ready: no"), "checklist should show the current production state");
  assert(checklist.includes("Reviewed Quran data"), "checklist is missing the Quran data section");
  assert(checklist.includes("Reviewed Quran source authority"), "checklist is missing the Quran source authority section");
  assert(checklist.includes("Licensed background catalog"), "checklist is missing the background catalog section");
  assert(checklist.includes("Reviewed Quran font manifest"), "checklist is missing the font manifest section");
  assert(checklist.includes("Reviewed recognition engine"), "checklist is missing the recognition engine section");
  assert(checklist.includes("ASR") || checklist.includes("transcript"), "checklist should mention transcript recognition blocker");

  console.log("PASS Production checklist test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
