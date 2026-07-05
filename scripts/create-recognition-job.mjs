#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.audio || !args.out) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const audioPath = resolve(args.audio);
if (!existsSync(audioPath)) fail(`Audio/video file does not exist: ${audioPath}`);

const project = args.project ? readJson(resolve(args.project), "project") : {};
const stats = statSync(audioPath);
const minConfidence = Number(args["min-confidence"] ?? 1);
if (minConfidence !== 1) {
  fail("Quran surah/ayah recognition handoff requires --min-confidence 1. Approximate matches are not acceptable.");
}
const job = {
  jobType: "ayah-studio-recognition-job",
  generatedAt: new Date().toISOString(),
  sourceAudio: {
    fileName: basename(audioPath),
    path: audioPath,
    sizeBytes: stats.size,
    sha256: sha256File(audioPath),
  },
  projectContext: {
    app: project.app || "Ayah Studio",
    account: project.account || "@tilawat_alquran30",
    currentSurah: project.surah ?? null,
    currentAyahStart: project.ayahStart ?? null,
    currentAyahCount: project.ayahCount ?? null,
    ayahSelectionConfirmed: project.ayahSelectionConfirmed === true,
    reciter: project.reciter || "",
    riwayah: project.riwayah || "",
  },
  requestedOutput: {
    format: "assets/recognition-result.example.json",
    minConfidence,
    requireExactMatch: true,
    requireSurahDetection: true,
    requireAyahStartDetection: true,
    requireAyahCount: true,
    requireSegmentTiming: Boolean(args["require-segments"]),
    requiresManualConfirmation: true,
  },
  instructions: [
    "Return a recognition-result JSON matching assets/recognition-result.example.json.",
    "Only return a surah/ayah selection when it is an exact match with confidence 1.",
    "If the engine cannot guarantee an exact match, return no selection and require manual entry.",
    "Set result.requiresManualConfirmation to true.",
    "Do not mark the Ayah Studio project confirmed; the user must review the suggestion.",
  ],
};

writeFileSync(resolve(args.out), `${JSON.stringify(job, null, 2)}\n`, "utf8");

console.log("PASS Recognition job written.");
console.log(`Job: ${resolve(args.out)}`);
console.log(`Source SHA-256: ${job.sourceAudio.sha256}`);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--require-segments") {
      parsed["require-segments"] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function readJson(path, label) {
  if (!existsSync(path)) fail(`${label} file does not exist: ${path}`);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Could not read ${label} JSON: ${path}\n${error.message}`);
  }
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Ayah Studio recognition job creator

Usage:
  node scripts/create-recognition-job.mjs --audio recitation.mp4 --project ayah-studio-project.json --out recognition-job.json

Options:
  --audio FILE             Source recitation audio/video file.
  --project FILE           Optional Ayah Studio project JSON for context.
  --out FILE               Output recognition job JSON.
  --min-confidence NUMBER  Must be 1 for Quran surah/ayah recognition. Defaults to 1.
  --require-segments       Request ayah segment timing in the recognition result.

This script does not recognize Quran audio or accept approximate matching. It creates a deterministic handoff
job for an external recognition engine, whose result can later be validated and
applied with validate-recognition-result.mjs and apply-recognition-result.mjs.
`.trim());
}
