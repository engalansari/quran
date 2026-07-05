#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

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

if (args.help || !args.file) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const filePath = resolve(args.file);
const data = readJson(filePath);
const report = validateLibrary(data, {
  requireComplete: Boolean(args["require-complete"]),
  requireAudioHashes: Boolean(args["require-audio-hashes"]),
});

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
    } else if (token === "--json" || token === "--require-complete" || token === "--require-audio-hashes") {
      parsed[token.slice(2)] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Fingerprint library file does not exist: ${path}`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read fingerprint library: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateLibrary(data, options) {
  const library = data?.library || data || {};
  const entries = Array.isArray(library.entries) ? library.entries : [];
  const issues = [];
  const seen = new Set();

  if (!String(library.name || "").trim()) issues.push("missing library.name");
  if (!String(library.provider || "").trim()) issues.push("missing library.provider");
  if (!String(library.version || "").trim()) issues.push("missing library.version");
  if (!looksLikeUrl(library.sourceUrl)) issues.push("missing or invalid library.sourceUrl");
  if (library.matchPolicy !== "exact-fingerprint-only") issues.push("library.matchPolicy must be exact-fingerprint-only");
  if (library.reviewed !== true) issues.push("library.reviewed must be true");
  if (library.exportReady !== true) issues.push("library.exportReady must be true");
  if (!entries.length) issues.push("library.entries must contain reference ayah fingerprints");

  entries.forEach((entry, index) => {
    const label = `entry ${index + 1}`;
    const surah = Number(entry.surah);
    const ayah = Number(entry.ayah);
    const key = `${surah}:${ayah}`;
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) issues.push(`${label} has invalid surah`);
    if (!Number.isInteger(ayah) || ayah < 1 || ayah > (expectedAyahCounts[surah - 1] || 0)) issues.push(`${label} has invalid ayah`);
    if (seen.has(key)) issues.push(`${label} duplicates ${key}`);
    seen.add(key);
    if (!String(entry.fingerprint || "").trim()) issues.push(`${label} missing fingerprint`);
    if (!String(entry.fingerprintAlgorithm || "").trim()) issues.push(`${label} missing fingerprintAlgorithm`);
    if (!looksLikeUrl(entry.sourceUrl)) issues.push(`${label} missing or invalid sourceUrl`);
    if (options.requireAudioHashes && !/^[a-f0-9]{64}$/i.test(String(entry.audioSha256 || ""))) {
      issues.push(`${label} missing valid audioSha256`);
    }
  });

  const expectedAyahs = expectedAyahCounts.reduce((sum, count) => sum + count, 0);
  const complete = expectedAyahCounts.every((count, surahIndex) => {
    for (let ayah = 1; ayah <= count; ayah += 1) {
      if (!seen.has(`${surahIndex + 1}:${ayah}`)) return false;
    }
    return true;
  });
  if (options.requireComplete && !complete) {
    issues.push(`fingerprint library must cover all ${expectedAyahs} ayahs`);
  }

  return {
    report: "Ayah Studio recognition fingerprint library validation",
    ready: issues.length === 0,
    requireComplete: options.requireComplete,
    expectedAyahs,
    loadedEntries: entries.length,
    complete,
    library: {
      name: String(library.name || "").trim(),
      provider: String(library.provider || "").trim(),
      version: String(library.version || "").trim(),
      sourceUrl: String(library.sourceUrl || "").trim(),
      matchPolicy: String(library.matchPolicy || "").trim(),
      reviewed: library.reviewed === true,
      exportReady: library.exportReady === true,
    },
    issues,
  };
}

function looksLikeUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function printReport(report) {
  console.log(`Recognition fingerprint library validation: ${report.ready ? "ready" : "not ready"}`);
  console.log(`Entries: ${report.loadedEntries}/${report.expectedAyahs}`);
  console.log(`Complete: ${report.complete ? "yes" : "no"}`);
  if (report.ready) {
    console.log("PASS Recognition fingerprint library is ready.");
    return;
  }
  console.log("FAIL Recognition fingerprint library needs fixes.");
  report.issues.slice(0, 30).forEach((issue) => console.log(`- ${issue}`));
}

function printHelp() {
  console.log(`
Ayah Studio recognition fingerprint library validator

Usage:
  node scripts/validate-recognition-fingerprint-library.mjs --file assets/recognition-fingerprints.example.json

Options:
  --file FILE              Fingerprint library JSON.
  --require-complete       Require all 6,236 ayahs to have fingerprints.
  --require-audio-hashes   Require SHA-256 for every source audio file.
  --json                   Print a machine-readable report.

This validates an exact-match reference library. It does not perform fuzzy
recognition and does not allow nearest-match Quran selection.
`.trim());
}
