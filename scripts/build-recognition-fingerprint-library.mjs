#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const expectedAyahCounts = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128,
  111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30,
  73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29,
  18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18,
  12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19,
  5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6,
];

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.out || (!args["source-template"] && !args["source-dir"])) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const provider = String(args.provider || "").trim();
const version = String(args.version || "").trim();
const sourceUrl = String(args["source-url"] || args["source-template"] || "").trim();
const outPath = resolve(args.out);
const cacheDir = args["cache-dir"] ? resolve(args["cache-dir"]) : "";
const ffmpegPath = args.ffmpeg ? resolve(args.ffmpeg) : findLocalFfmpeg();
const limit = args.limit ? Number(args.limit) : 0;
const selectedSurah = args.surah ? Number(args.surah) : 0;
const selectedAyah = args.ayah ? Number(args.ayah) : 0;
const entries = [];
const targets = listTargets({ selectedSurah, selectedAyah, limit });

if (cacheDir) mkdirSync(cacheDir, { recursive: true });

for (const target of targets) {
  const source = resolveSource(target);
  const bytes = await loadAudio(source, target);
  const audioSha256 = sha256(bytes);
  const fingerprint = makeFingerprint({ bytes, source, ffmpegPath });
  entries.push({
    surah: target.surah,
    ayah: target.ayah,
    fingerprint,
    fingerprintAlgorithm: fingerprint.startsWith("chromaprint:")
      ? "ffmpeg-chromaprint+sha256"
      : "audio-file-sha256",
    sourceUrl: source.publicUrl,
    audioSha256,
    bytes: bytes.length,
  });
}

const complete = entries.length === expectedAyahCounts.reduce((sum, count) => sum + count, 0);
const reviewed = args.reviewed === true;
const exportReady = args["export-ready"] === true && reviewed && complete;

const library = {
  library: {
    name: String(args.name || "Quran exact audio fingerprint reference library"),
    provider,
    version,
    sourceUrl,
    matchPolicy: "exact-fingerprint-only",
    reviewed,
    exportReady,
    reviewNote: exportReady
      ? "Complete reviewed exact-fingerprint library."
      : "Generated automatically. Do not mark production-ready until all 6,236 ayahs and source permissions are reviewed.",
    entries,
  },
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(library, null, 2)}\n`, "utf8");

console.log(`Wrote ${entries.length} fingerprint entries to ${outPath}`);
console.log(`Complete: ${complete ? "yes" : "no"}`);
console.log(`Reviewed: ${reviewed ? "yes" : "no"}`);
console.log(`Export ready: ${exportReady ? "yes" : "no"}`);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--reviewed" || token === "--export-ready") {
      parsed[token.slice(2)] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function listTargets({ selectedSurah, selectedAyah, limit }) {
  const output = [];
  expectedAyahCounts.forEach((count, surahIndex) => {
    const surah = surahIndex + 1;
    if (selectedSurah && surah !== selectedSurah) return;
    for (let ayah = 1; ayah <= count; ayah += 1) {
      if (selectedAyah && ayah !== selectedAyah) continue;
      output.push({ surah, ayah });
      if (limit && output.length >= limit) return;
    }
  });
  if (!output.length) throw new Error("No ayahs selected.");
  return limit ? output.slice(0, limit) : output;
}

function resolveSource(target) {
  const fileName = renderTemplate("{surah3}{ayah3}.mp3", target);
  if (args["source-dir"]) {
    const filePath = resolve(args["source-dir"], fileName);
    return {
      type: "file",
      filePath,
      publicUrl: `file:${fileName}`,
    };
  }

  const url = renderTemplate(args["source-template"], target);
  const cachePath = cacheDir ? join(cacheDir, basename(new URL(url).pathname)) : "";
  return {
    type: "url",
    url,
    cachePath,
    publicUrl: url,
  };
}

function renderTemplate(template, target) {
  return String(template)
    .replaceAll("{surah}", String(target.surah))
    .replaceAll("{ayah}", String(target.ayah))
    .replaceAll("{surah3}", String(target.surah).padStart(3, "0"))
    .replaceAll("{ayah3}", String(target.ayah).padStart(3, "0"))
    .replaceAll("{surahayah3}", `${String(target.surah).padStart(3, "0")}${String(target.ayah).padStart(3, "0")}`);
}

async function loadAudio(source, target) {
  if (source.type === "file") {
    if (!existsSync(source.filePath)) {
      throw new Error(`Missing local audio for ${target.surah}:${target.ayah}: ${source.filePath}`);
    }
    return readFileSync(source.filePath);
  }

  if (source.cachePath && existsSync(source.cachePath)) {
    return readFileSync(source.cachePath);
  }

  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Could not download audio for ${target.surah}:${target.ayah}: ${source.url} (${response.status})`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) {
    throw new Error(`Could not download audio for ${target.surah}:${target.ayah}: ${source.url}`);
  }

  if (source.cachePath) writeFileSync(source.cachePath, bytes);
  return bytes;
}

function makeFingerprint({ bytes, ffmpegPath }) {
  if (!ffmpegPath || !existsSync(ffmpegPath)) return `sha256:${sha256(bytes)}`;

  const result = spawnSync(ffmpegPath, [
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    "pipe:0",
    "-f",
    "chromaprint",
    "-",
  ], {
    input: bytes,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });

  const chromaprint = String(result.stdout || "").trim();
  if (result.status === 0 && chromaprint) {
    return `chromaprint:${sha256(Buffer.from(chromaprint, "utf8"))}`;
  }
  return `sha256:${sha256(bytes)}`;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function findLocalFfmpeg() {
  const candidate = resolve("tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
  return existsSync(candidate) ? candidate : "";
}

function printHelp() {
  console.log(`
Build an exact Quran audio fingerprint library.

Usage:
  node scripts/build-recognition-fingerprint-library.mjs --source-template "https://everyayah.com/data/AbdulSamad_64kbps_QuranExplorer.Com/{surah3}{ayah3}.mp3" --provider EveryAyah --version AbdulSamad_64kbps_QuranExplorer.Com --source-url https://everyayah.com --out assets/recognition-fingerprints.everyayah-abdulsamad.json --cache-dir data/source/audio-cache

Options:
  --source-template URL   URL template with {surah3} and {ayah3}.
  --source-dir DIR        Local test/source directory containing 001001.mp3 names.
  --out FILE             Output fingerprint library JSON.
  --provider TEXT        Source/provider name.
  --version TEXT         Source/version/reciter key.
  --source-url URL       Human-reviewable source URL.
  --cache-dir DIR        Cache downloaded audio files.
  --ffmpeg FILE          FFmpeg path for chromaprint fingerprints.
  --limit N              Build only first N ayahs for testing.
  --surah N --ayah N     Build a specific ayah.
  --reviewed             Mark library as reviewed.
  --export-ready         Mark export ready only when reviewed and complete.

The output remains not production-ready unless all 6,236 ayahs are present and
the source has been reviewed. No nearest-match Quran selection is generated.
`.trim());
}
