#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-recognition-job-"));
const audioPath = join(tempDir, "recitation.mp4");
const projectPath = join(tempDir, "project.json");
const outPath = join(tempDir, "recognition-job.json");
const audioBytes = "fake recitation bytes for recognition job";

try {
  writeFileSync(audioPath, audioBytes, "utf8");
  writeFileSync(projectPath, JSON.stringify({
    app: "Ayah Studio",
    account: "@tilawat_alquran30",
    surah: 78,
    ayahStart: 1,
    ayahCount: 3,
    ayahSelectionConfirmed: true,
    reciter: "Test Reciter",
    riwayah: "Hafs",
  }, null, 2), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/create-recognition-job.mjs",
    "--audio", audioPath,
    "--project", projectPath,
    "--out", outPath,
    "--min-confidence", "1",
    "--require-segments",
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  assert(result.status === 0, `${result.stdout || ""}${result.stderr || ""}`.trim());
  assert(existsSync(outPath), "recognition job was not written");

  const job = JSON.parse(readFileSync(outPath, "utf8"));
  const expectedHash = createHash("sha256").update(audioBytes).digest("hex");
  assert(job.jobType === "ayah-studio-recognition-job", "jobType is incorrect");
  assert(job.sourceAudio.sha256 === expectedHash, "source SHA-256 is incorrect");
  assert(job.projectContext.currentSurah === 78, "project surah context missing");
  assert(job.projectContext.currentAyahStart === 1, "project ayah start context missing");
  assert(job.requestedOutput.minConfidence === 1, "min confidence missing");
  assert(job.requestedOutput.requireExactMatch === true, "exact match requirement missing");
  assert(job.requestedOutput.requireSegmentTiming === true, "segment timing request missing");
  assert(job.requestedOutput.requiresManualConfirmation === true, "manual confirmation requirement missing");

  console.log("PASS Recognition job creation test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
