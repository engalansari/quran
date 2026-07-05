#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.file) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const manifestPath = resolve(args.file);
const manifest = readJson(manifestPath);
const report = validateManifest(manifest, manifestPath);

if (args.json) {
  printJson(report);
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
    } else if (token === "--json") {
      parsed.json = true;
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
    console.error(`Could not read export manifest: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateManifest(manifest, path) {
  const issues = [];
  const requiredInputs = Array.isArray(manifest.requiredInputs) ? manifest.requiredInputs : [];
  const requiredIds = new Set(requiredInputs.map((input) => input.id));
  const expectedIds = [
    "source-video",
    "background-media",
    "uthmani-font",
    "quran-data",
    "background-catalog",
    "font-manifest",
    "project-json",
    "ffmpeg-plan",
  ];

  if (!manifest.app) issues.push("missing app");
  if (!manifest.account) issues.push("missing account");
  if (!manifest.output?.fileName) issues.push("missing output.fileName");
  if (!requiredInputs.length) issues.push("missing requiredInputs[]");
  expectedIds.forEach((id) => {
    if (!requiredIds.has(id)) issues.push(`requiredInputs missing ${id}`);
  });

  requiredInputs.forEach((input) => {
    if (!input.id) issues.push("requiredInputs entry missing id");
    if (!input.fileName) issues.push(`${input.id || "required input"} missing fileName`);
    if (typeof input.ready !== "boolean") issues.push(`${input.id || "required input"} ready must be boolean`);
  });

  const missingInputs = Array.isArray(manifest.missingInputs) ? manifest.missingInputs : [];
  const notReady = requiredInputs.filter((input) => input.ready !== true);
  if (missingInputs.length !== notReady.length) {
    issues.push(`missingInputs count ${missingInputs.length} does not match not-ready inputs ${notReady.length}`);
  }

  const backend = manifest.backendScript || {};
  [
    "fileName",
    "dryRunCommand",
    "renderCommand",
    "auditCommand",
    "productionAssetsValidationCommand",
    "backgroundCatalogValidationCommand",
    "fontManifestValidationCommand",
  ].forEach((key) => {
    if (!backend[key]) issues.push(`backendScript missing ${key}`);
  });

  const gates = manifest.gates || {};
  ["quranTextReady", "quranSourceReviewed", "ayahSelectionConfirmed", "timingValid", "backgroundSourceApproved"].forEach((key) => {
    if (typeof gates[key] !== "boolean") issues.push(`gates.${key} must be boolean`);
  });

  return {
    report: "Ayah Studio export manifest validation",
    generatedAt: new Date().toISOString(),
    path,
    totalInputs: requiredInputs.length,
    missingInputs: notReady.length,
    ready: issues.length === 0 && notReady.length === 0,
    structureOk: issues.length === 0,
    issues,
  };
}

function printJson(report) {
  console.log(JSON.stringify(report, null, 2));
}

function printReport(report) {
  console.log(`Export manifest validation: ${report.ready ? "ready" : "not ready"}`);
  console.log(`Manifest: ${report.path}`);
  console.log(`Required inputs: ${report.totalInputs}`);
  console.log(`Missing inputs: ${report.missingInputs}`);
  if (report.ready) {
    console.log("PASS Export manifest is complete and all required inputs are ready.");
    return;
  }
  if (report.structureOk) {
    console.log("FAIL Export manifest structure is valid, but required inputs are not all ready.");
    return;
  }
  console.log("FAIL Export manifest structure needs fixes.");
  report.issues.forEach((issue) => console.log(`- ${issue}`));
}

function printHelp() {
  console.log(`
Ayah Studio export manifest validator

Usage:
  node scripts/validate-export-manifest.mjs --file ayah-studio-export-manifest.json

Options:
  --file  Required. Export manifest JSON downloaded from Ayah Studio.
  --json  Print a machine-readable JSON report.
`);
}
