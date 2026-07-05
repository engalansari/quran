#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.audio || !args.quran || !args.whisper || !args.model) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const audioPath = resolve(args.audio);
const quranPath = resolve(args.quran);
const whisperPath = resolve(args.whisper);
const modelPath = resolve(args.model);
const ffmpegPath = args.ffmpeg ? resolve(args.ffmpeg) : findLocalFfmpeg();
const ffprobePath = args.ffprobe ? resolve(args.ffprobe) : findLocalFfprobe(ffmpegPath);
const analyzedSeconds = Number(args["analyzed-seconds"] ?? 7);
const nextAnalysisSeconds = Number(args["next-analysis-seconds"] ?? 15);
const language = String(args.language || "ar");
const keepTemp = args["keep-temp"] === true;

const report = runWorkflow();
if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}
process.exit(report.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--json" || token === "--keep-temp") {
      parsed[token.slice(2)] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function runWorkflow() {
  const missing = [];
  if (!existsSync(audioPath)) missing.push(`audio file not found: ${audioPath}`);
  if (!existsSync(quranPath)) missing.push(`Quran file not found: ${quranPath}`);
  if (!existsSync(whisperPath)) missing.push(`whisper.cpp executable not found: ${whisperPath}`);
  if (!existsSync(modelPath)) missing.push(`whisper.cpp model file not found: ${modelPath}`);
  if (!ffmpegPath || !existsSync(ffmpegPath)) missing.push("FFmpeg executable not found; pass --ffmpeg");
  if (!ffprobePath || !existsSync(ffprobePath)) missing.push("FFprobe executable not found; pass --ffprobe");
  if (!Number.isFinite(analyzedSeconds) || analyzedSeconds <= 0) missing.push("--analyzed-seconds must be positive");
  if (missing.length) return buildFailure("missing-inputs", missing);

  const audioProbe = probeAudioStream(audioPath);
  if (!audioProbe.hasAudio) {
    return buildFailure("no-audio-stream", [
      "The uploaded media file has no readable audio stream.",
      "whisper.cpp can only identify the surah and ayah from recited audio. This file appears to contain video only.",
      audioProbe.output,
    ]);
  }

  const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-whispercpp-"));
  const wavPath = join(tempDir, `${basename(audioPath).replace(/\.[^.]+$/, "")}-${analyzedSeconds}s.wav`);
  const whisperOutBase = join(tempDir, "transcript");

  try {
    const extract = spawn(ffmpegPath, [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      audioPath,
      "-t",
      String(analyzedSeconds),
      "-vn",
      "-ac",
      "1",
      "-ar",
      "16000",
      wavPath,
    ]);
    if (extract.status !== 0) {
      return buildFailure("ffmpeg-failed", [`FFmpeg failed to extract first ${analyzedSeconds} seconds.`, extract.output]);
    }

    const whisper = spawn(whisperPath, [
      "-m",
      modelPath,
      "-f",
      wavPath,
      "-l",
      language,
      "-otxt",
      "-of",
      whisperOutBase,
    ]);
    if (whisper.status !== 0) {
      return buildFailure("whisper-failed", ["whisper.cpp failed to transcribe the audio window.", whisper.output]);
    }

    const transcriptPath = `${whisperOutBase}.txt`;
    const transcript = existsSync(transcriptPath)
      ? readFileSync(transcriptPath, "utf8").trim()
      : cleanWhisperStdout(whisper.output);
    if (!transcript) {
      return buildFailure("empty-transcript", [`whisper.cpp returned an empty transcript for first ${analyzedSeconds} seconds.`]);
    }

    const match = spawn(process.execPath, [
      "scripts/match-quran-transcript.mjs",
      "--quran",
      quranPath,
      "--transcript",
      transcript,
      "--analyzed-seconds",
      String(analyzedSeconds),
      "--next-analysis-seconds",
      String(nextAnalysisSeconds),
      "--json",
    ]);
    const matchReport = parseJson(match.output);
    if (!matchReport) {
      return buildFailure("match-failed", ["Transcript matcher did not return valid JSON.", match.output]);
    }

    return {
      report: "Ayah Studio whisper.cpp transcription and Quran matching",
      ready: matchReport.status === "unique",
      provider: "whisper.cpp local",
      analyzedSeconds,
      nextAnalysisSeconds,
      language,
      audio: audioPath,
      model: modelPath,
      whisper: whisperPath,
      transcript,
      match: matchReport,
      nextSteps: buildNextSteps(matchReport),
    };
  } finally {
    if (!keepTemp) rmSync(tempDir, { recursive: true, force: true });
  }
}

function buildFailure(code, issues) {
  return {
    report: "Ayah Studio whisper.cpp transcription and Quran matching",
    ready: false,
    provider: "whisper.cpp local",
    code,
    analyzedSeconds,
    nextAnalysisSeconds,
    issues: issues.filter(Boolean),
    nextSteps: [
      "Install whisper.cpp and download a multilingual model.",
      "Pass the local executable with --whisper and the model with --model.",
      "Run again with --analyzed-seconds 7, then expand to 15 or 30 only if the transcript is not unique.",
    ],
  };
}

function buildNextSteps(matchReport) {
  if (matchReport.status === "unique") {
    return [
      "Import the unique result as an unconfirmed suggestion.",
      "Keep manual confirmation required before export.",
    ];
  }
  if (matchReport.status === "ambiguous") {
    return [
      "Show all candidate ayahs for user choice.",
      "Do not select automatically.",
    ];
  }
  return [
    `Expand analysis to ${nextAnalysisSeconds} seconds and run transcription again.`,
    "Do not use nearest-match Quran selection.",
  ];
}

function probeAudioStream(path) {
  const result = spawn(ffprobePath, [
    "-v",
    "error",
    "-select_streams",
    "a",
    "-show_entries",
    "stream=index,codec_name",
    "-of",
    "json",
    path,
  ]);
  const parsed = parseJson(result.output);
  return {
    hasAudio: Boolean(parsed?.streams?.length),
    output: result.output,
  };
}

function spawn(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 25 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanWhisperStdout(output) {
  return String(output || "")
    .split(/\r?\n/)
    .filter((line) => !/^\s*(whisper_|system_info|main:|ggml_|sampling|processing)/i.test(line))
    .join(" ")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findLocalFfmpeg() {
  const candidate = resolve("tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
  return existsSync(candidate) ? candidate : "";
}

function findLocalFfprobe(pathToFfmpeg) {
  const sibling = pathToFfmpeg ? resolve(pathToFfmpeg, "..", "ffprobe.exe") : "";
  if (sibling && existsSync(sibling)) return sibling;
  const candidate = resolve("tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe");
  return existsSync(candidate) ? candidate : "";
}

function printReport(report) {
  console.log(`whisper.cpp Quran match: ${report.ready ? "ready" : "not ready"}`);
  if (report.code) console.log(`Code: ${report.code}`);
  if (report.transcript) console.log(`Transcript: ${report.transcript}`);
  if (report.match) {
    console.log(`Match status: ${report.match.status}`);
    console.log(`Candidates: ${report.match.candidates?.length ?? 0}`);
  }
  const issues = report.issues || [];
  issues.forEach((issue) => console.log(`- ${issue}`));
  if (report.nextSteps?.length) {
    console.log("Next steps:");
    report.nextSteps.forEach((step) => console.log(`- ${step}`));
  }
}

function printHelp() {
  console.log(`
Ayah Studio whisper.cpp ASR + Quran transcript matching

Usage:
  node scripts/transcribe-and-match-whispercpp.mjs --audio recitation.mp4 --quran data/quran-uthmani.json --whisper tools/whisper.cpp/Release/whisper-cli.exe --model tools/whisper.cpp/models/ggml-small.bin

Options:
  --audio FILE                Recitation audio/video.
  --quran FILE                Reviewed Quran JSON.
  --whisper FILE              whisper.cpp executable, usually whisper-cli.exe.
  --model FILE                whisper.cpp multilingual model.
  --ffmpeg FILE               FFmpeg executable. Auto-detects local portable FFmpeg.
  --ffprobe FILE              FFprobe executable. Auto-detects local portable FFprobe.
  --analyzed-seconds NUMBER   First audio window. Defaults to 7.
  --next-analysis-seconds N   Suggested wider window. Defaults to 15.
  --language CODE             Whisper language code. Defaults to ar.
  --keep-temp                 Keep extracted WAV and transcript for inspection.
  --json                      Print machine-readable JSON.

Policy:
  A unique transcript match can become an unconfirmed suggestion. Multiple
  candidates are shown for user choice. No nearest-match selection is allowed.
`.trim());
}
