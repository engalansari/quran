#!/usr/bin/env node

import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-whispercpp-test-"));
const audioPath = join(tempDir, "recitation.mp4");
const quranPath = join(tempDir, "quran.json");

try {
  writeFileSync(audioPath, "fake audio");
  writeFileSync(quranPath, JSON.stringify({
    source: {
      name: "Fixture",
      url: "https://example.test/quran",
      edition: "fixture",
      rawSha256: "a".repeat(64),
      reviewed: true,
    },
    surahs: [{ number: 1, ayahs: [{ text: "الحمد لله رب العالمين" }] }],
  }), "utf8");

  const result = spawnSync(process.execPath, [
    "scripts/transcribe-and-match-whispercpp.mjs",
    "--audio",
    audioPath,
    "--quran",
    quranPath,
    "--whisper",
    join(tempDir, "missing-whisper-cli.exe"),
    "--model",
    join(tempDir, "missing-model.bin"),
    "--json",
  ], {
    encoding: "utf8",
    windowsHide: true,
  });

  assert(result.status === 1, "missing whisper.cpp inputs should fail readiness");
  const report = JSON.parse(result.stdout);
  assert(report.ready === false, "report should not be ready");
  assert(report.provider === "whisper.cpp local", "provider should be whisper.cpp local");
  assert(report.code === "missing-inputs", "missing inputs should be reported");
  assert(report.issues.some((issue) => issue.includes("whisper.cpp executable")), "missing executable issue expected");
  assert(report.issues.some((issue) => issue.includes("model file")), "missing model issue expected");

  const ffmpegPath = "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe";
  const ffprobePath = "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe";
  if (existsSync(ffmpegPath) && existsSync(ffprobePath)) {
    const videoOnlyPath = join(tempDir, "video-only.mp4");
    const fakeWhisperPath = join(tempDir, "whisper-cli.exe");
    const fakeModelPath = join(tempDir, "model.bin");
    writeFileSync(fakeWhisperPath, "placeholder");
    writeFileSync(fakeModelPath, "placeholder");

    const videoOnly = spawnSync(ffmpegPath, [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=160x284:d=1",
      "-an",
      videoOnlyPath,
    ], {
      encoding: "utf8",
      windowsHide: true,
    });
    assert(videoOnly.status === 0, "video-only fixture should be generated");

    const noAudio = spawnSync(process.execPath, [
      "scripts/transcribe-and-match-whispercpp.mjs",
      "--audio",
      videoOnlyPath,
      "--quran",
      quranPath,
      "--whisper",
      fakeWhisperPath,
      "--model",
      fakeModelPath,
      "--ffmpeg",
      ffmpegPath,
      "--ffprobe",
      ffprobePath,
      "--json",
    ], {
      encoding: "utf8",
      windowsHide: true,
    });
    assert(noAudio.status === 1, "video-only input should fail readiness");
    const noAudioReport = JSON.parse(noAudio.stdout);
    assert(noAudioReport.code === "no-audio-stream", "video-only input should report no-audio-stream");
  }

  console.log("PASS whisper.cpp transcript matcher readiness test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
