#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-find-ffmpeg-"));
const fakeFfmpeg = join(tempDir, "ffmpeg.cmd");

try {
  writeFileSync(fakeFfmpeg, [
    "@echo off",
    "if \"%1\"==\"-version\" (",
    "  echo ffmpeg version test-build",
    "  exit /b 0",
    ")",
    "if \"%2\"==\"-filters\" (",
    "  echo  T.C subtitles Render text subtitles using libass",
    "  exit /b 0",
    ")",
    "exit /b 1",
    "",
  ].join("\r\n"), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/find-ffmpeg.mjs",
    "--ffmpeg",
    fakeFfmpeg,
    "--json",
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  assert(result.status === 0, `${result.stdout || ""}${result.stderr || ""}`.trim());
  const report = JSON.parse(result.stdout);
  assert(report.ready === true, "fake ffmpeg should be ready");
  assert(report.selected.candidate === fakeFfmpeg, "fake ffmpeg should be selected first");
  assert(report.selected.hasSubtitlesFilter === true, "subtitles filter should be detected");

  console.log("PASS FFmpeg discovery test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
