#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.file) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const filePath = resolve(args.file);
const requireModelFile = Boolean(args["require-model-file"]);
const manifest = readJson(filePath);
const report = validateRecognitionManifest(manifest, { requireModelFile });

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
    } else if (token === "--json" || token === "--require-model-file") {
      parsed[token.slice(2)] = true;
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
    console.error(`Could not read recognition manifest: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateRecognitionManifest(manifest, options) {
  const engine = manifest?.engine || manifest || {};
  const issues = [];
  const modelFile = String(engine.modelFile || "").trim();
  const asrExecutable = String(engine.asrExecutable || "").trim();
  const mode = String(engine.mode || "engine").trim();
  const manualOnly = mode === "manual-only";
  const exactFingerprint = mode === "audio-fingerprint-exact";
  const transcriptExact = mode === "transcript-exact-match";
  const fingerprintLibrary = String(engine.fingerprintLibrary || "").trim();
  const transcriptInitialSeconds = Number(engine.transcriptInitialSeconds);
  const transcriptExpansionSeconds = Array.isArray(engine.transcriptExpansionSeconds) ? engine.transcriptExpansionSeconds.map(Number) : [];

  if (!String(engine.name || "").trim()) issues.push("missing engine.name");
  if (!String(engine.provider || "").trim()) issues.push("missing engine.provider");
  if (!String(engine.version || "").trim()) issues.push("missing engine.version");
  if (!looksLikeUrl(engine.sourceUrl)) issues.push("missing or invalid engine.sourceUrl");
  if (!String(engine.method || "").trim()) issues.push("missing engine.method");
  if (!manualOnly && engine.supportsSurahDetection !== true) issues.push("engine.supportsSurahDetection must be true");
  if (!manualOnly && engine.supportsAyahStartDetection !== true) issues.push("engine.supportsAyahStartDetection must be true");
  if (!manualOnly && engine.supportsConfidenceScore !== true) issues.push("engine.supportsConfidenceScore must be true");
  if (engine.requiresManualConfirmation !== true) issues.push("engine.requiresManualConfirmation must remain true");
  if (manualOnly && engine.allowsAutomaticSelection === true) issues.push("manual-only mode must not allow automatic selection");
  if (exactFingerprint && engine.allowsAutomaticSelection !== true) issues.push("audio-fingerprint-exact mode must explicitly allow automatic exact selections");
  if (exactFingerprint && engine.automaticSelectionPolicy !== "exact-fingerprint-only") issues.push("automaticSelectionPolicy must be exact-fingerprint-only");
  if (transcriptExact && engine.allowsAutomaticSelection !== true) issues.push("transcript-exact-match mode must allow only unique exact transcript suggestions");
  if (transcriptExact && engine.automaticSelectionPolicy !== "unique-normalized-transcript-only") issues.push("automaticSelectionPolicy must be unique-normalized-transcript-only");
  if (transcriptExact && !String(engine.asrProvider || "").trim()) issues.push("missing engine.asrProvider");
  if (transcriptExact && !asrExecutable) issues.push("missing engine.asrExecutable");
  if (transcriptExact && transcriptInitialSeconds !== 7) issues.push("engine.transcriptInitialSeconds must be 7");
  if (transcriptExact && !transcriptExpansionSeconds.some((seconds) => Number.isFinite(seconds) && seconds > 7)) {
    issues.push("engine.transcriptExpansionSeconds must include a window greater than 7 seconds");
  }
  if (transcriptExact && engine.ambiguousCandidatePolicy !== "show-candidates-for-user-choice") {
    issues.push("engine.ambiguousCandidatePolicy must be show-candidates-for-user-choice");
  }
  if (transcriptExact && engine.noMatchPolicy !== "extend-analysis-window") {
    issues.push("engine.noMatchPolicy must be extend-analysis-window");
  }
  if (exactFingerprint && !fingerprintLibrary) issues.push("missing engine.fingerprintLibrary");
  if (exactFingerprint && fingerprintLibrary) {
    const libraryReport = validateFingerprintLibrary(fingerprintLibrary);
    if (!libraryReport.ready) issues.push(...libraryReport.issues.map((issue) => `fingerprint library: ${issue}`));
  }
  if (engine.reviewed !== true) issues.push("engine.reviewed must be true");
  if (engine.exportReady !== true) issues.push("engine.exportReady must be true");
  if (options.requireModelFile && !modelFile) issues.push("missing engine.modelFile");
  if (options.requireModelFile && modelFile && !existsSync(resolve(modelFile))) {
    issues.push(`missing model file: ${modelFile}`);
  }
  if (options.requireModelFile && transcriptExact && asrExecutable && !existsSync(resolve(asrExecutable))) {
    issues.push(`missing ASR executable: ${asrExecutable}`);
  }

  return {
    report: "Ayah Studio recognition manifest validation",
    ready: issues.length === 0,
    requireModelFile: options.requireModelFile,
    engine: {
      name: String(engine.name || "").trim(),
      provider: String(engine.provider || "").trim(),
      version: String(engine.version || "").trim(),
      sourceUrl: String(engine.sourceUrl || "").trim(),
      modelFile,
      asrExecutable,
      mode,
      fingerprintLibrary,
      asrProvider: String(engine.asrProvider || "").trim(),
      transcriptInitialSeconds: Number.isFinite(transcriptInitialSeconds) ? transcriptInitialSeconds : null,
      transcriptExpansionSeconds,
      ambiguousCandidatePolicy: String(engine.ambiguousCandidatePolicy || "").trim(),
      noMatchPolicy: String(engine.noMatchPolicy || "").trim(),
      method: String(engine.method || "").trim(),
      supportsSurahDetection: engine.supportsSurahDetection === true,
      supportsAyahStartDetection: engine.supportsAyahStartDetection === true,
      supportsConfidenceScore: engine.supportsConfidenceScore === true,
      requiresManualConfirmation: engine.requiresManualConfirmation === true,
      allowsAutomaticSelection: engine.allowsAutomaticSelection === true,
      automaticSelectionPolicy: String(engine.automaticSelectionPolicy || "").trim(),
      reviewed: engine.reviewed === true,
      exportReady: engine.exportReady === true,
    },
    issues,
  };
}

function validateFingerprintLibrary(path) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-recognition-fingerprint-library.mjs",
    "--file", path,
    "--require-complete",
    "--require-audio-hashes",
    "--json",
  ], {
    encoding: "utf8",
    windowsHide: true,
  });
  try {
    return JSON.parse(result.stdout);
  } catch {
    return {
      ready: false,
      issues: [`could not validate fingerprint library ${path}`],
    };
  }
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
  console.log(`Recognition manifest validation: ${report.ready ? "ready" : "not ready"}`);
  console.log(`Engine: ${report.engine.name || "missing"}`);
  console.log(`Provider: ${report.engine.provider || "missing"}`);
  console.log(`Require model file: ${report.requireModelFile ? "yes" : "no"}`);
  if (report.ready) {
    console.log("PASS Recognition manifest is ready for production review.");
    return;
  }
  console.log(`FAIL Recognition engine manifest needs review or implementation fixes.`);
  report.issues.forEach((issue) => console.log(`- ${issue}`));
}

function printHelp() {
  console.log(`
Ayah Studio recognition manifest validator

Usage:
  node scripts/validate-recognition-manifest.mjs --file assets/recognition-engine.example.json

Options:
  --file FILE              Recognition manifest JSON.
  --require-model-file     Require the referenced local model file to exist.
  --json                   Print a machine-readable report.

This validates metadata for a real Quran audio recognition engine, an exact
transcript matching workflow, or a reviewed manual-only confirmation policy. It
does not perform recognition by itself.
`.trim());
}
