#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const quranPath = resolve(args.quran || "data/quran-uthmani.json");
const authorityPath = resolve(args.authority || "data/quran-source-authority.quranenc.example.json");
const outPath = resolve(args.out || "quran-source-review-report.md");

const quran = readJson(quranPath, "Quran data");
const source = quran.source || {};
const quranValidation = runJson("validate Quran data", [
  "scripts/validate-quran-data.mjs",
  "--file", quranPath,
  "--json",
]);
const authorityValidation = existsSync(authorityPath)
  ? runJson("validate Quran source authority", [
    "scripts/validate-quran-source-authority.mjs",
    "--file", authorityPath,
    ...(source.url ? ["--source-url", source.url] : []),
    "--json",
  ], { allowFailure: true })
  : null;

const rawSourcePath = source.rawSourceFile ? resolve(source.rawSourceFile) : "";
const rawSourceHash = rawSourcePath && existsSync(rawSourcePath)
  ? sha256File(rawSourcePath)
  : "";

writeFileSync(outPath, renderReport({
  quranPath,
  authorityPath: existsSync(authorityPath) ? authorityPath : "",
  quranValidation,
  authorityValidation,
  source,
  rawSourcePath,
  rawSourceHash,
}), "utf8");

console.log(`Quran source review report written: ${outPath}`);
console.log(`Quran complete: ${quranValidation.complete ? "yes" : "no"} (${quranValidation.loadedAyahs}/${quranValidation.expectedAyahs})`);
console.log(`Source reviewed: ${source.reviewed === true ? "yes" : "no"}`);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function readJson(path, label) {
  if (!existsSync(path)) {
    console.error(`${label} file does not exist: ${path}`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read ${label}: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function runJson(label, commandArgs, options = {}) {
  const result = spawnSync(process.execPath, commandArgs, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0 && !options.allowFailure) {
    console.error(`${label} failed.`);
    console.error(`${result.stdout || ""}${result.stderr || ""}`.trim());
    process.exit(result.status || 1);
  }
  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    console.error(`${label} did not return valid JSON.`);
    console.error(error.message);
    process.exit(1);
  }
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function renderReport(context) {
  const source = context.source || {};
  const quran = context.quranValidation;
  const authority = context.authorityValidation;
  const rawHashStatus = source.rawSha256 && context.rawSourceHash
    ? source.rawSha256.toLowerCase() === context.rawSourceHash.toLowerCase()
    : false;

  const lines = [
    "# Quran Source Review Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Quran Data",
    "",
    `- File: \`${context.quranPath}\``,
    `- Complete: ${quran.complete ? "yes" : "no"}`,
    `- Loaded ayahs: ${quran.loadedAyahs}/${quran.expectedAyahs}`,
    `- Loaded surahs: ${quran.loadedSurahs}/${quran.expectedSurahs}`,
    `- Text quality: ${quran.text?.ready ? "PASS" : "FAIL"}`,
    `- Source metadata: ${quran.source?.documented ? "documented" : "incomplete"}`,
    `- Source reviewed: ${source.reviewed === true ? "yes" : "no"}`,
    "",
    "## Source",
    "",
    `- Name: ${source.name || "missing"}`,
    `- URL: ${source.url || "missing"}`,
    `- Edition: ${source.edition || "missing"}`,
    `- Raw source file: ${context.rawSourcePath || "missing"}`,
    `- Recorded raw SHA-256: ${source.rawSha256 || "missing"}`,
    `- Current raw SHA-256: ${context.rawSourceHash || "missing"}`,
    `- Raw hash match: ${rawHashStatus ? "yes" : "no"}`,
    "",
    "## Authority",
    "",
    `- File: ${context.authorityPath ? `\`${context.authorityPath}\`` : "missing"}`,
    `- Authority ready: ${authority?.ready ? "yes" : "no"}`,
    `- Authority reviewed: ${authority?.authority?.reviewed ? "yes" : "no"}`,
  ];

  const issues = [
    ...(quran.source?.issues || []),
    ...(quran.text?.issues || []),
    ...(authority?.issues || []),
  ];

  lines.push("");
  lines.push("## Review Gate");
  lines.push("");
  lines.push("- This report does not certify Quran text correctness.");
  lines.push("- Mark `source.reviewed` only after human comparison against the trusted Mushaf source.");
  lines.push("- Keep this report with the reviewer name/date/note used by `mark-quran-source-reviewed.mjs`.");
  lines.push("");

  if (issues.length) {
    lines.push("## Issues");
    lines.push("");
    issues.slice(0, 40).forEach((issue) => lines.push(`- ${issue}`));
    lines.push("");
  }

  lines.push("## Commands");
  lines.push("");
  lines.push("```powershell");
  lines.push(`node scripts\\validate-quran-data.mjs --file ${formatPath(context.quranPath)}`);
  lines.push(`node scripts\\validate-quran-source-authority.mjs --file ${formatPath(context.authorityPath)} --source-url "${source.url || "SOURCE_URL"}"`);
  lines.push(`node scripts\\mark-quran-source-reviewed.mjs --file ${formatPath(context.quranPath)} --reviewed-by "Reviewer Name" --review-note "Compared against the trusted Mushaf source."`);
  lines.push("```");

  return `${lines.join("\n").trim()}\n`;
}

function formatPath(path) {
  return String(path || "").replace(resolve(".") + "\\", "");
}

function printHelp() {
  console.log(`
Ayah Studio Quran source review report writer

Usage:
  node scripts/write-quran-source-review-report.mjs --out quran-source-review-report.md

Options:
  --quran FILE       Quran data file. Defaults to data/quran-uthmani.json.
  --authority FILE   Source authority file. Defaults to data/quran-source-authority.quranenc.example.json.
  --out FILE         Markdown report output. Defaults to quran-source-review-report.md.

This writes review evidence and validation status. It does not mark the Quran
source reviewed and does not replace human comparison against the trusted Mushaf.
`.trim());
}
