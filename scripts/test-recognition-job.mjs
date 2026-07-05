#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-recognition-job-validation-"));
const audioPath = join(tempDir, "recitation.mp4");
const jobPath = join(tempDir, "recognition-job.json");

try {
  writeFileSync(audioPath, "original recitation bytes", "utf8");

  const create = spawnSync(process.execPath, [
    "scripts/create-recognition-job.mjs",
    "--audio", audioPath,
    "--out", jobPath,
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  assert(create.status === 0, `${create.stdout || ""}${create.stderr || ""}`.trim());
  assert(existsSync(jobPath), "recognition job was not created");

  const valid = runValidator(jobPath);
  assert(valid.status === 0, valid.output || "valid recognition job should pass");

  writeFileSync(audioPath, "changed recitation bytes", "utf8");
  const invalid = runValidator(jobPath);
  assert(invalid.status !== 0, "changed source file should fail hash validation");
  assert(invalid.output.includes("sourceAudio.sha256 does not match"), "hash mismatch message missing");

  console.log("PASS Recognition job validation test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function runValidator(path) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-recognition-job.mjs",
    "--file", path,
    "--require-source-file",
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
