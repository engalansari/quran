#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const sourceName = args["source-name"] || "King Fahd Glorious Quran Printing Complex";
const sourceUrl = args["source-url"] || args.url || "";
const sourceEdition = args["source-edition"] || "Madinah Mushaf Uthmani Unicode dataset";
const sourceDir = resolve(args["source-dir"] || "data/source");
const outputPath = resolve(args.output || "data/quran-uthmani.json");
const checklistPath = args.checklist ? resolve(args.checklist) : "";
const authorityPath = args.authority ? resolve(args.authority) : "";

mkdirSync(sourceDir, { recursive: true });
if (authorityPath) validateSourceAuthority(authorityPath, sourceUrl);
const inputPath = resolveInput();

const rawPath = copyRawSource(inputPath, sourceDir);
run("prepare Quran data", [
  "scripts/prepare-quran-data.mjs",
  "--input", rawPath,
  "--output", outputPath,
  "--source-name", sourceName,
  "--source-url", sourceUrl,
  "--source-edition", sourceEdition,
]);

run("validate Quran data", [
  "scripts/validate-quran-data.mjs",
  "--file", outputPath,
], { allowFailure: Boolean(args["allow-incomplete"]) });

if (args["reviewed-by"] || args["review-note"]) {
  if (!args["reviewed-by"] || !args["review-note"]) {
    fail("Both --reviewed-by and --review-note are required when marking the source reviewed.");
  }
  run("mark Quran source reviewed", [
    "scripts/mark-quran-source-reviewed.mjs",
    "--file", outputPath,
    "--reviewed-by", args["reviewed-by"],
    "--review-note", args["review-note"],
    ...(args["review-date"] ? ["--review-date", args["review-date"]] : []),
  ]);
}

if (checklistPath) {
  run("write production checklist", [
    "scripts/write-production-checklist.mjs",
    "--out", checklistPath,
    "--quran", outputPath,
  ], { allowFailure: true });
}

console.log("Quran source import completed.");
console.log(`Raw source: ${rawPath}`);
console.log(`Prepared Quran data: ${outputPath}`);
console.log("Production export still requires reviewed Quran text, licensed backgrounds, approved font, and MP4 inputs.");

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

function resolveInput() {
  if (args.input) {
    const path = resolve(args.input);
    if (!existsSync(path)) fail(`Input file does not exist: ${path}`);
    return path;
  }

  if (args.url) {
    return downloadUrl(args.url, sourceDir);
  }

  printHelp();
  process.exit(1);
}

function copyRawSource(path, dir) {
  const name = sanitizeFileName(basename(path) || `quran-source${extname(path) || ".json"}`);
  const target = resolve(join(dir, name));
  const raw = readFileSync(path);
  writeFileSync(target, raw);
  return target;
}

function downloadUrl(url, dir) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail(`Invalid --url: ${url}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    fail("--url must start with http:// or https://");
  }

  const result = spawnSync(process.execPath, [
    "-e",
    `
const { writeFileSync } = require("node:fs");
const url = process.argv[1];
const out = process.argv[2];
fetch(url).then(async (response) => {
  if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(out, buffer);
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
`,
    url,
    resolve(join(dir, sanitizeFileName(basename(parsed.pathname) || "quran-source.json"))),
  ], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0) {
    fail(`Could not download Quran source.\n${`${result.stdout || ""}${result.stderr || ""}`.trim()}`);
  }

  return resolve(join(dir, sanitizeFileName(basename(parsed.pathname) || "quran-source.json")));
}

function run(label, commandArgs, options = {}) {
  const result = spawnSync(process.execPath, commandArgs, {
    encoding: "utf8",
    windowsHide: true,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  if (output) console.log(output);
  if (result.status !== 0 && !options.allowFailure) {
    fail(`${label} failed with exit code ${result.status ?? 1}.`);
  }
}

function validateSourceAuthority(path, url) {
  if (!url) fail("--source-url or --url is required when --authority is provided.");
  run("validate Quran source authority", [
    "scripts/validate-quran-source-authority.mjs",
    "--file", path,
    "--source-url", url,
  ]);
}

function sanitizeFileName(value) {
  return String(value || "quran-source.json").replace(/[<>:"/\\|?*\x00-\x1F]/g, "-");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Ayah Studio Quran source importer

Usage:
  node scripts/import-quran-source.mjs --input data/source/king-fahd-quran-source.json --source-url OFFICIAL_URL

Options:
  --input FILE              Local raw Quran source file. JSON, CSV, or TXT.
  --url URL                 Download raw Quran source from a trusted URL.
  --output FILE             Prepared output. Defaults to data/quran-uthmani.json.
  --source-dir DIR          Raw source archive folder. Defaults to data/source.
  --source-name TEXT        Source name metadata.
  --source-url URL          Official source URL metadata.
  --source-edition TEXT     Source edition/version metadata.
  --authority FILE          Trusted source authority manifest for source URL validation.
  --reviewed-by TEXT        Optional reviewer name/reference. Requires --review-note.
  --review-note TEXT        Optional review note. Requires --reviewed-by.
  --review-date YYYY-MM-DD  Optional review date.
  --checklist FILE          Optional production readiness checklist output.
  --allow-incomplete        Test-only: continue after validation reports incomplete Quran data.

This automates file preparation and validation. It does not certify Quran text correctness by itself.
`.trim());
}
