#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const filePath = resolve(args.file || "data/quran-uthmani.json");
const reviewedBy = String(args["reviewed-by"] || "").trim();
const reviewNote = String(args["review-note"] || "").trim();
const reviewDate = String(args["review-date"] || new Date().toISOString().slice(0, 10)).trim();
const allowIncomplete = Boolean(args["allow-incomplete"]);

if (!reviewedBy || !reviewNote) {
  fail("Both --reviewed-by and --review-note are required.");
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(reviewDate)) {
  fail("--review-date must use YYYY-MM-DD.");
}

const quranData = readJson(filePath);
quranData.source = normalizeSource(quranData.source);
validateSourceMetadata(quranData.source);

if (!allowIncomplete) {
  runValidation(filePath);
}

quranData.source.reviewed = true;
quranData.source.reviewedBy = reviewedBy;
quranData.source.reviewDate = reviewDate;
quranData.source.reviewNote = reviewNote;
quranData.source.reviewUpdatedAt = new Date().toISOString();

writeFileSync(filePath, `${JSON.stringify(quranData, null, 2)}\n`, "utf8");

console.log(`Marked Quran source reviewed: ${filePath}`);
console.log(`Reviewer: ${reviewedBy}`);
console.log(`Review date: ${reviewDate}`);
if (allowIncomplete) {
  console.log("Warning: --allow-incomplete was used. Do not use this output for production export.");
}

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--allow-incomplete") {
      parsed["allow-incomplete"] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Could not read Quran JSON: ${path}\n${error.message}`);
  }
}

function normalizeSource(source) {
  if (!source || typeof source !== "object") return {};
  return {
    ...source,
    name: String(source.name || source.sourceName || source.title || "").trim(),
    url: String(source.url || source.sourceUrl || source.link || "").trim(),
    edition: String(source.edition || source.version || source.release || "").trim(),
    rawSourceFile: String(source.rawSourceFile || "").trim(),
    rawSha256: String(source.rawSha256 || source.sha256 || "").trim(),
  };
}

function validateSourceMetadata(source) {
  const issues = [];
  if (!source.name) issues.push("missing source.name");
  if (!looksLikeHttpUrl(source.url)) issues.push("missing or invalid source.url");
  if (!source.edition) issues.push("missing source.edition");
  if (!source.rawSha256) issues.push("missing source.rawSha256");
  if (source.rawSha256 && !/^[a-f0-9]{64}$/i.test(source.rawSha256)) issues.push("invalid source.rawSha256");
  if (issues.length > 0) {
    fail(`Quran source metadata is incomplete: ${issues.join("; ")}`);
  }
}

function runValidation(path) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-quran-data.mjs",
    "--file",
    path,
    "--json",
  ], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    fail(`Quran data is not ready for source review marking.\n${output}`);
  }
}

function looksLikeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Ayah Studio Quran source review marker

Usage:
  node scripts/mark-quran-source-reviewed.mjs --file data/quran-uthmani.json --reviewed-by "Reviewer Name" --review-note "Compared against official Mushaf source."

Options:
  --file FILE              Quran JSON file. Defaults to data/quran-uthmani.json.
  --reviewed-by TEXT       Required reviewer name or internal review reference.
  --review-note TEXT       Required review note.
  --review-date YYYY-MM-DD Review date. Defaults to today.
  --allow-incomplete       Test-only escape hatch for partial non-production files.

Default behavior runs validate-quran-data before writing source.reviewed=true.
`.trim());
}
