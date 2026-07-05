#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const inputPath = resolve(args.file || "assets/licensed-backgrounds.example.json");
const requireFiles = Boolean(args["require-files"]);
const data = readJson(inputPath);
const backgrounds = normalizeCatalog(data);
const report = buildReport(backgrounds, inputPath, requireFiles);

printReport(report);
process.exit(report.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--require-files") {
      parsed["require-files"] = true;
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
    console.error(`Could not read background catalog: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function normalizeCatalog(data) {
  const entries = Array.isArray(data) ? data : data?.backgrounds;
  return Array.isArray(entries) ? entries : [];
}

function buildReport(entries, path, requireFiles) {
  const seenIds = new Set();
  const rows = entries.map((entry, index) => {
    const id = String(entry.id || "").trim();
    const file = String(entry.file || "").trim();
    const issues = [];
    if (!id) issues.push("missing id");
    if (id && seenIds.has(id)) issues.push("duplicate id");
    if (id) seenIds.add(id);
    if (!String(entry.name || "").trim()) issues.push("missing name");
    if (!String(entry.category || "").trim()) issues.push("missing category");
    if (!file) issues.push("missing file");
    if (!String(entry.sourceName || "").trim()) issues.push("missing sourceName");
    if (!looksLikeUrl(entry.sourceUrl)) issues.push("missing or invalid sourceUrl");
    if (!String(entry.license || "").trim()) issues.push("missing license");
    if (entry.reviewed !== true) issues.push("reviewed must be true");
    if (entry.exportReady !== true) issues.push("exportReady must be true");
    const resolvedFile = file ? resolve(file) : "";
    if (requireFiles && file && !existsSync(resolvedFile)) issues.push(`file not found: ${file}`);
    if (requireFiles && file && existsSync(resolvedFile) && entry.sha256) {
      const actualHash = sha256File(resolvedFile);
      if (actualHash !== String(entry.sha256).toLowerCase()) issues.push("sha256 does not match local file");
    }
    return {
      index: index + 1,
      id: id || `(entry ${index + 1})`,
      file,
      ready: issues.length === 0,
      issues,
    };
  });
  return {
    path,
    requireFiles,
    total: rows.length,
    readyCount: rows.filter((row) => row.ready).length,
    ready: rows.length > 0 && rows.every((row) => row.ready),
    rows,
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

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function printReport(report) {
  console.log(`Background catalog validation: ${report.readyCount}/${report.total} export-ready entries`);
  console.log(`Catalog: ${report.path}`);
  console.log(`Require local files: ${report.requireFiles ? "yes" : "no"}`);
  if (report.ready) {
    console.log("PASS Background catalog is ready for production import.");
    return;
  }
  if (!report.total) {
    console.log("FAIL No backgrounds found. Expected a JSON array or an object with backgrounds[].");
    return;
  }
  console.log(`FAIL ${report.total - report.readyCount} background(s) need review or metadata fixes.`);
  report.rows
    .filter((row) => !row.ready)
    .slice(0, 12)
    .forEach((row) => {
      console.log(`- ${row.id}: ${row.issues.join("; ")}`);
    });
}

function printHelp() {
  console.log(`
Ayah Studio licensed background catalog validator

Usage:
  node scripts/validate-background-catalog.mjs --file assets/licensed-backgrounds.example.json

Options:
  --file           Catalog JSON file. Defaults to assets/licensed-backgrounds.example.json.
  --require-files  Also require every referenced media file to exist locally.
`);
}
