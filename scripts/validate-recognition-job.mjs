#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.file) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const filePath = resolve(args.file);
const job = readJson(filePath);
const report = validateRecognitionJob(job, {
  requireSourceFile: Boolean(args["require-source-file"]),
  verifyHash: args["verify-hash"] !== false,
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
    } else if (token === "--json" || token === "--require-source-file") {
      parsed[token.slice(2)] = true;
    } else if (token === "--no-verify-hash") {
      parsed["verify-hash"] = false;
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
    console.error(`Could not read recognition job: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateRecognitionJob(job, options) {
  const issues = [];
  const sourceAudio = job?.sourceAudio || {};
  const requestedOutput = job?.requestedOutput || {};
  const sourcePath = String(sourceAudio.path || "").trim();
  const minConfidence = Number(requestedOutput.minConfidence);

  if (job?.jobType !== "ayah-studio-recognition-job") issues.push("jobType must be ayah-studio-recognition-job");
  if (!validIsoDate(job?.generatedAt)) issues.push("generatedAt must be a valid ISO date");
  if (!String(sourceAudio.fileName || "").trim()) issues.push("missing sourceAudio.fileName");
  if (!sourcePath) issues.push("missing sourceAudio.path");
  if (!Number.isFinite(Number(sourceAudio.sizeBytes)) || Number(sourceAudio.sizeBytes) <= 0) {
    issues.push("sourceAudio.sizeBytes must be positive");
  }
  if (!/^[a-f0-9]{64}$/i.test(String(sourceAudio.sha256 || ""))) {
    issues.push("sourceAudio.sha256 must be a 64-character hex hash");
  }
  if (!String(requestedOutput.format || "").trim()) issues.push("missing requestedOutput.format");
  if (!Number.isFinite(minConfidence) || minConfidence !== 1) {
    issues.push("requestedOutput.minConfidence must be exactly 1 for Quran surah/ayah handoff");
  }
  if (requestedOutput.requireExactMatch !== true) issues.push("requestedOutput.requireExactMatch must be true");
  if (requestedOutput.requireSurahDetection !== true) issues.push("requestedOutput.requireSurahDetection must be true");
  if (requestedOutput.requireAyahStartDetection !== true) issues.push("requestedOutput.requireAyahStartDetection must be true");
  if (requestedOutput.requireAyahCount !== true) issues.push("requestedOutput.requireAyahCount must be true");
  if (requestedOutput.requiresManualConfirmation !== true) {
    issues.push("requestedOutput.requiresManualConfirmation must be true");
  }

  const sourceExists = Boolean(sourcePath) && existsSync(sourcePath);
  if (options.requireSourceFile && !sourceExists) {
    issues.push("source audio/video file must exist");
  }
  if (options.verifyHash && sourceExists) {
    const actualHash = sha256File(sourcePath);
    if (actualHash !== String(sourceAudio.sha256 || "").toLowerCase()) {
      issues.push("sourceAudio.sha256 does not match the current source file");
    }
  }

  return {
    report: "Ayah Studio recognition job validation",
    ready: issues.length === 0,
    sourceAudio: {
      fileName: String(sourceAudio.fileName || "").trim(),
      path: sourcePath,
      exists: sourceExists,
      sizeBytes: Number(sourceAudio.sizeBytes) || null,
      sha256: String(sourceAudio.sha256 || "").trim(),
    },
    requestedOutput: {
      format: String(requestedOutput.format || "").trim(),
      minConfidence: Number.isFinite(minConfidence) ? minConfidence : null,
      requireSegmentTiming: requestedOutput.requireSegmentTiming === true,
      requiresManualConfirmation: requestedOutput.requiresManualConfirmation === true,
    },
    issues,
  };
}

function validIsoDate(value) {
  const time = Date.parse(String(value || ""));
  return Number.isFinite(time);
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function printReport(report) {
  console.log(`Recognition job validation: ${report.ready ? "ready" : "not ready"}`);
  console.log(`Source: ${report.sourceAudio.fileName || "missing"}`);
  console.log(`Source file exists: ${report.sourceAudio.exists ? "yes" : "no"}`);
  if (report.ready) {
    console.log("PASS Recognition job is ready for external engine handoff.");
    return;
  }
  console.log("FAIL Recognition job needs fixes before handoff.");
  report.issues.forEach((issue) => console.log(`- ${issue}`));
}

function printHelp() {
  console.log(`
Ayah Studio recognition job validator

Usage:
  node scripts/validate-recognition-job.mjs --file recognition-job.json

Options:
  --file FILE             Recognition job JSON.
  --require-source-file   Require the referenced audio/video file to exist.
  --no-verify-hash        Skip SHA-256 comparison when the source file exists.
  --json                  Print a machine-readable report.

This validates the handoff job sent to an external Quran recitation recognition engine.
`.trim());
}
