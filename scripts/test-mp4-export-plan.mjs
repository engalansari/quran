#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-mp4-plan-"));

try {
  const projectPath = join(tempDir, "project.json");
  const sourceVideoPath = join(tempDir, "source.mp4");
  const backgroundPath = join(tempDir, "background.mp4");
  const fontPath = join(tempDir, "UTHMANI_QURAN_FONT.ttf");
  const subtitlePath = join(tempDir, "output.ayahs.ass");
  const outputPath = join(tempDir, "output.mp4");

  writeFileSync(sourceVideoPath, "placeholder source video for dry run", "utf8");
  writeFileSync(backgroundPath, "placeholder background video for dry run", "utf8");
  writeFileSync(fontPath, "placeholder font for dry run", "utf8");
  writeFileSync(projectPath, JSON.stringify({
    ayahSelectionConfirmed: true,
    quranSourceReviewed: true,
    ayahFontSize: 62,
    ayahBoxOpacity: 58,
    ayahPosition: "center",
    template: "Noor Classic",
    quranFontName: "Test Quran Font",
    ayahSchedule: [
      {
        ayahNumber: 1,
        text: "نص عربي للاختبار فقط",
        start: 0,
        end: 1.5,
      },
      {
        ayahNumber: 2,
        text: "نص عربي ثان للاختبار فقط",
        start: 1.5,
        end: 3,
      },
    ],
  }, null, 2), "utf8");

  const result = spawnSync(process.execPath, [
    resolve(repoRoot, "scripts/export-mp4.mjs"),
    "--project", projectPath,
    "--video", sourceVideoPath,
    "--background", backgroundPath,
    "--font", fontPath,
    "--font-name", "Test Quran Font",
    "--subtitles", subtitlePath,
    "--out", outputPath,
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    windowsHide: true,
  });

  assert(result.status === 0, result.stderr || result.stdout || "export-mp4 dry run failed");
  assert(result.stdout.includes("FFmpeg command:"), "dry run did not print the FFmpeg command");
  assert(result.stdout.includes("Dry run only"), "dry run did not stop before rendering");
  assert(existsSync(subtitlePath), "dry run did not write the ASS subtitle file");

  const subtitle = readFileSync(subtitlePath, "utf8");
  assert(subtitle.includes("[Events]"), "ASS subtitle is missing the Events section");
  assert(subtitle.includes("Dialogue:"), "ASS subtitle is missing dialogue entries");
  assert(subtitle.includes("نص عربي للاختبار فقط"), "ASS subtitle is missing the ayah text");

  console.log("PASS MP4 export dry-run plan test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
