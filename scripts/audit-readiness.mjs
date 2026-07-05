#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.project) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const projectPath = resolve(args.project);
const project = readJson(projectPath, "project JSON");
const manifest = args.manifest ? readJson(resolve(args.manifest), "export manifest") : null;
const checks = [];

addCheck("project-json", true, `Project loaded: ${projectPath}`);
addCheck("quran-source-reviewed", Boolean(project.quranSourceReviewed), "Quran source is marked reviewed.");
addCheck("quran-text-ready", Boolean(project.quranTextReady ?? project.ayahText?.length), "Selected Quran text is present in project JSON.");
addCheck("ayah-selection-confirmed", Boolean(project.ayahSelectionConfirmed), "Surah, start ayah, and ayah count are manually confirmed.");
addCheck("ayah-schedule", Array.isArray(project.ayahSchedule) && project.ayahSchedule.length > 0, "Ayah timing schedule exists.");
addCheck("timing-valid", timingValid(project.ayahSchedule), "All ayah timing windows have end after start.");

const ffmpeg = args.ffmpeg || manifest?.backendScript?.ffmpeg || "ffmpeg";
const ffmpegWorks = commandWorks(ffmpeg, ["-version"]);
addCheck("ffmpeg", ffmpegWorks, `FFmpeg executable works: ${ffmpeg}`);
addCheck(
  "ffmpeg-subtitles-filter",
  ffmpegWorks && ffmpegHasFilter(ffmpeg, "subtitles"),
  "FFmpeg build supports the subtitles filter for ASS/libass ayah overlays.",
);

const sourceVideo = args.video || project.sourceVideo || manifestInput(manifest, "source-video");
addCheck("source-video", fileExists(sourceVideo), `Source recitation video exists: ${sourceVideo || "missing"}`);

const background = args.background || project.customBackgroundName || manifestInput(manifest, "background-media");
addCheck("background-media", fileExists(background), `Background media exists: ${background || "missing"}`);

const font = args.font || manifestInput(manifest, "uthmani-font") || "UTHMANI_QURAN_FONT.ttf";
addCheck("uthmani-font", fileExists(font), `Reviewed Uthmani font exists: ${font || "missing"}`);

if (args["font-manifest"]) {
  const fontManifestPath = resolve(args["font-manifest"]);
  const fontManifest = readJson(fontManifestPath, "Quran font manifest");
  const fontManifestReport = validateFontManifest(fontManifest);
  addCheck("font-manifest", fontManifestReport.ready, fontManifestReport.message);
}

if (project.customBackgroundType && project.customBackgroundType !== "placeholder") {
  addCheck("background-source-approved", Boolean(project.sourceApproved), "Custom background source/license approved.");
} else {
  addCheck("background-source-approved", Boolean(project.backgroundData?.exportReady), "Selected catalog background is export-ready.");
}

if (manifest) {
  const missingInputs = Array.isArray(manifest.missingInputs) ? manifest.missingInputs : [];
  addCheck("manifest-missing-inputs", missingInputs.length === 0, `Manifest reports ${missingInputs.length} missing input(s).`);
}

printReport();

const failed = checks.filter((check) => !check.pass);
process.exit(failed.length ? 1 : 0);

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
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read ${label}: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function addCheck(id, pass, message) {
  checks.push({ id, pass: Boolean(pass), message });
}

function fileExists(path) {
  return Boolean(path) && existsSync(resolve(path));
}

function commandWorks(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0;
}

function ffmpegHasFilter(command, filterName) {
  const result = spawnSync(command, ["-hide_banner", "-filters"], {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status !== 0) return false;
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  return output.split(/\r?\n/).some((line) => {
    const columns = line.trim().split(/\s+/);
    return columns.includes(filterName);
  });
}

function timingValid(schedule) {
  return Array.isArray(schedule)
    && schedule.length > 0
    && schedule.every((item) => Number(item.end) > Number(item.start));
}

function manifestInput(manifest, id) {
  const input = manifest?.requiredInputs?.find((item) => item.id === id);
  return input?.fileName;
}

function validateFontManifest(manifest) {
  const font = manifest?.font || manifest || {};
  const issues = [];
  if (!String(font.file || "").trim()) issues.push("missing font.file");
  if (!String(font.familyName || "").trim()) issues.push("missing font.familyName");
  if (!String(font.sourceName || "").trim()) issues.push("missing font.sourceName");
  if (!looksLikeUrl(font.sourceUrl)) issues.push("missing or invalid font.sourceUrl");
  if (!String(font.license || "").trim()) issues.push("missing font.license");
  if (font.reviewed !== true) issues.push("font.reviewed must be true");
  if (font.exportReady !== true) issues.push("font.exportReady must be true");
  return {
    ready: issues.length === 0,
    message: issues.length
      ? `Quran font manifest is incomplete: ${issues.join("; ")}`
      : `Quran font manifest is reviewed: ${font.familyName}.`,
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

function printReport() {
  const passed = checks.filter((check) => check.pass).length;
  const failed = checks.length - passed;
  console.log(`Ayah Studio readiness audit: ${passed}/${checks.length} passed`);
  checks.forEach((check) => {
    console.log(`${check.pass ? "PASS" : "FAIL"} ${check.id}: ${check.message}`);
  });
  if (failed) {
    console.log(`\nNot ready: ${failed} blocker(s) remain.`);
  } else {
    console.log("\nReady for backend MP4 render.");
  }
}

function printHelp() {
  console.log(`
Ayah Studio readiness audit

Usage:
  node scripts/audit-readiness.mjs --project ayah-studio-project.json --manifest ayah-studio-export-manifest.json

Options:
  --project     Required. Ayah Studio project JSON.
  --manifest    Optional export manifest JSON.
  --video       Optional source recitation video path override.
  --background  Optional background media path override.
  --font        Optional reviewed Uthmani font path override.
  --font-manifest Optional reviewed Quran font metadata JSON.
  --ffmpeg      Optional FFmpeg executable path override. Must support subtitles/libass.
`);
}
