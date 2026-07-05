#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const inputPath = resolve(args.file || "assets/quran-font.example.json");
const requireFontFile = Boolean(args["require-file"]);
const manifest = readJson(inputPath);
const report = buildReport(manifest, inputPath, requireFontFile);

printReport(report);
process.exit(report.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--require-file") {
      parsed["require-file"] = true;
    } else if (token === "--help" || token === "-h") {
      printHelp();
      process.exit(0);
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
    console.error(`Could not read Quran font manifest: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function buildReport(manifest, path, requireFontFile) {
  const font = manifest?.font || manifest || {};
  const file = String(font.file || "").trim();
  const issues = [];
  if (!file) issues.push("missing font.file");
  if (!String(font.familyName || "").trim()) issues.push("missing font.familyName");
  if (!String(font.sourceName || "").trim()) issues.push("missing font.sourceName");
  if (!looksLikeUrl(font.sourceUrl)) issues.push("missing or invalid font.sourceUrl");
  if (!String(font.license || "").trim()) issues.push("missing font.license");
  if (font.reviewed !== true) issues.push("font.reviewed must be true");
  if (font.exportReady !== true) issues.push("font.exportReady must be true");
  if (requireFontFile && file && !existsSync(resolve(file))) issues.push(`font file not found: ${file}`);
  return {
    path,
    requireFontFile,
    file,
    familyName: String(font.familyName || "").trim(),
    ready: issues.length === 0,
    issues,
  };
}

function looksLikeUrl(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function printReport(report) {
  console.log(`Quran font manifest validation: ${report.ready ? "ready" : "not ready"}`);
  console.log(`Manifest: ${report.path}`);
  console.log(`Font file: ${report.file || "missing"}`);
  console.log(`Font family: ${report.familyName || "missing"}`);
  console.log(`Require local font file: ${report.requireFontFile ? "yes" : "no"}`);
  if (report.ready) {
    console.log("PASS Quran font manifest is ready for production export.");
    return;
  }
  console.log("FAIL Quran font manifest needs review or metadata fixes.");
  report.issues.forEach((issue) => console.log(`- ${issue}`));
}

function printHelp() {
  console.log(`
Ayah Studio Quran font manifest validator

Usage:
  node scripts/validate-font-manifest.mjs --file assets/quran-font.example.json

Options:
  --file          Font manifest JSON file. Defaults to assets/quran-font.example.json.
  --require-file  Also require the referenced font file to exist locally.
`);
}
