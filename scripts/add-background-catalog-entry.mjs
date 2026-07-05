#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.catalog || !args.file || !args.id || !args.name || !args.category) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const catalogPath = resolve(args.catalog);
const mediaPath = resolve(args.file);
if (!existsSync(mediaPath)) fail(`Background media file does not exist: ${mediaPath}`);

const catalog = readCatalog(catalogPath);
const backgrounds = Array.isArray(catalog.backgrounds) ? catalog.backgrounds : [];
const entry = {
  id: String(args.id).trim(),
  name: String(args.name).trim(),
  category: String(args.category).trim(),
  file: normalizePathForCatalog(mediaPath),
  fileName: basename(mediaPath),
  sha256: sha256File(mediaPath),
  sourceName: String(args["source-name"] || "").trim(),
  sourceUrl: String(args["source-url"] || "").trim(),
  license: String(args.license || "").trim(),
  noAttributionRequired: Boolean(args["no-attribution-required"]),
  reviewed: Boolean(args.reviewed),
  exportReady: Boolean(args["export-ready"]),
  reviewNote: String(args["review-note"] || "").trim(),
};

const existingIndex = backgrounds.findIndex((item) => item.id === entry.id);
if (existingIndex >= 0) {
  backgrounds[existingIndex] = {
    ...backgrounds[existingIndex],
    ...entry,
  };
} else {
  backgrounds.push(entry);
}

catalog.backgrounds = backgrounds;
mkdirSync(dirname(catalogPath), { recursive: true });
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(existingIndex >= 0 ? "PASS Background catalog entry updated." : "PASS Background catalog entry added.");
console.log(`Catalog: ${catalogPath}`);
console.log(`Entry: ${entry.id}`);
console.log(`SHA-256: ${entry.sha256}`);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--reviewed" || token === "--export-ready" || token === "--no-attribution-required") {
      parsed[token.slice(2)] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function readCatalog(path) {
  if (!existsSync(path)) {
    return {
      version: 1,
      purpose: "Production background catalog for Ayah Studio.",
      backgrounds: [],
    };
  }
  try {
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (Array.isArray(data)) return { version: 1, backgrounds: data };
    if (!Array.isArray(data.backgrounds)) data.backgrounds = [];
    return data;
  } catch (error) {
    fail(`Could not read background catalog: ${path}\n${error.message}`);
  }
}

function normalizePathForCatalog(path) {
  const cwd = `${process.cwd()}\\`;
  return path.startsWith(cwd)
    ? path.slice(cwd.length).replaceAll("\\", "/")
    : path.replaceAll("\\", "/");
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
Ayah Studio background catalog entry tool

Usage:
  node scripts/add-background-catalog-entry.mjs --catalog assets/licensed-backgrounds.example.json --file assets/production/makkah.mp4 --id makkah-production --name "Makkah Production" --category landmark --source-name SOURCE --source-url URL --license LICENSE --reviewed --export-ready

Options:
  --catalog FILE                 Background catalog JSON to create or update.
  --file FILE                    Local background image/video file.
  --id TEXT                      Stable background id.
  --name TEXT                    Display name.
  --category TEXT                Category such as landmark, masjid, nature, calm.
  --source-name TEXT             Source/provider name.
  --source-url URL               Source/license URL.
  --license TEXT                 License summary.
  --reviewed                    Mark metadata and visual review complete.
  --export-ready                Mark ready for final MP4 use.
  --no-attribution-required     Record that no visible attribution is required.
  --review-note TEXT             Optional review note.

This records metadata and SHA-256 for a licensed background file. It does not replace human license review.
`.trim());
}
