#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const localFfmpeg = resolve(repoRoot, "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
const ffmpeg = process.env.FFMPEG || (existsSync(localFfmpeg) ? localFfmpeg : "ffmpeg");

if (!commandWorks(ffmpeg, ["-version"])) {
  console.log("SKIP MP4 render smoke test: FFmpeg is not available. Install FFmpeg or set FFMPEG to its executable path.");
  process.exit(0);
}

if (!ffmpegHasFilter(ffmpeg, "subtitles")) {
  console.log("SKIP MP4 render smoke test: FFmpeg is available but lacks the subtitles/libass filter.");
  process.exit(0);
}

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-mp4-smoke-"));

try {
  const sourcePath = join(tempDir, "source.mp4");
  const backgroundPath = join(tempDir, "background.mp4");
  const fontPath = join(tempDir, "SMOKE_QURAN_FONT.ttf");
  const projectPath = join(tempDir, "project.json");
  const subtitlePath = join(tempDir, "output.ayahs.ass");
  const outputPath = join(tempDir, "output.mp4");

  createSourceVideo(sourcePath);
  createBackgroundVideo(backgroundPath);
  writeFileSync(fontPath, "placeholder font path for FFmpeg font fallback", "utf8");
  writeFileSync(projectPath, JSON.stringify({
    ayahSelectionConfirmed: true,
    quranSourceReviewed: true,
    ayahFontSize: 54,
    ayahBoxOpacity: 58,
    ayahPosition: "center",
    template: "Noor Classic",
    quranFontName: "Arial",
    ayahSchedule: [
      {
        ayahNumber: 1,
        text: "Ayah Studio MP4 smoke test",
        start: 0,
        end: 1.8,
      },
    ],
  }, null, 2), "utf8");

  const render = spawnSync(process.execPath, [
    resolve(repoRoot, "scripts/export-mp4.mjs"),
    "--project", projectPath,
    "--video", sourcePath,
    "--background", backgroundPath,
    "--font", fontPath,
    "--font-name", "Arial",
    "--subtitles", subtitlePath,
    "--out", outputPath,
    "--ffmpeg", ffmpeg,
    "--execute",
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  assert(render.status === 0, `${render.stdout || ""}\n${render.stderr || ""}`.trim() || "FFmpeg render failed");
  assert(existsSync(outputPath), "MP4 output was not created");
  assert(statSync(outputPath).size > 1000, "MP4 output is unexpectedly small");
  assert(existsSync(subtitlePath), "ASS subtitle output was not created");

  console.log("PASS MP4 render smoke test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function createSourceVideo(path) {
  const result = spawnSync(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-f", "lavfi",
    "-i", "color=c=black:s=1080x1920:d=2:r=24",
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-shortest",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-t", "2",
    path,
  ], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert(result.status === 0, result.stderr || "Could not create source smoke video");
}

function createBackgroundVideo(path) {
  const result = spawnSync(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-f", "lavfi",
    "-i", "color=c=#101820:s=1080x1920:d=2:r=24",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-t", "2",
    path,
  ], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert(result.status === 0, result.stderr || "Could not create background smoke video");
}

function commandWorks(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0;
}

function ffmpegHasFilter(command, filterName) {
  const result = spawnSync(command, ["-hide_banner", "-filters"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) return false;
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  return output.split(/\r?\n/).some((line) => line.trim().split(/\s+/).includes(filterName));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
