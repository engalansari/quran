#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.project || !args.recognition || !args.quran || !args.out) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const minConfidence = Number(args["min-confidence"] ?? 1);
if (minConfidence !== 1) {
  fail("Applying Quran recognition results requires --min-confidence 1. Approximate matches are not acceptable.");
}
const projectPath = resolve(args.project);
const recognitionPath = resolve(args.recognition);
const outPath = resolve(args.out);
const jobPath = args.job ? resolve(args.job) : "";
const quranPath = resolve(args.quran);
const allowIncompleteQuranForTests = args["test-allow-incomplete-quran"] === true;

const validation = validateRecognitionResult(recognitionPath, minConfidence);
const project = readJson(projectPath, "project");
const recognition = readJson(recognitionPath, "recognition result");
const jobMatch = jobPath ? validateRecognitionJobMatch(jobPath, recognition) : null;
const result = recognition.result || recognition;
const engine = recognition.engine || {};
const confidencePercent = Math.round(Number(result.confidence) * 100);
const quranValidation = allowIncompleteQuranForTests ? null : validateCompleteQuranData(quranPath);
const quranMatch = validateQuranRange(quranPath, result, quranValidation);

const updatedProject = {
  ...project,
  surah: Number(result.surahNumber || result.surah),
  ayahStart: Number(result.ayahStart || result.startAyah),
  ayahCount: Number(result.ayahCount || 1),
  ayahSelectionConfirmed: false,
  confirmedAyahSelectionSignature: "",
  recognitionSuggestion: {
    source: "external-recognition-result",
    confidence: confidencePercent,
    method: String(result.method || "").trim(),
    message: "اقتراح مستورد من محرك تعرف خارجي.",
    reason: "يتطلب مراجعة بشرية قبل التصدير.",
    engine: {
      name: String(engine.name || "").trim(),
      provider: String(engine.provider || "").trim(),
      version: String(engine.version || "").trim(),
    },
    sourceAudio: recognition.sourceAudio || {},
    recognitionJob: jobMatch,
    quranData: quranMatch,
    importedAt: new Date().toISOString(),
    validation,
  },
};

writeFileSync(outPath, `${JSON.stringify(updatedProject, null, 2)}\n`, "utf8");

console.log("PASS Recognition result applied to project as an unconfirmed suggestion.");
console.log(`Project: ${outPath}`);
console.log(`Selection: surah ${updatedProject.surah}, ayah ${updatedProject.ayahStart}, count ${updatedProject.ayahCount}`);
console.log("Manual confirmation is still required before export.");

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--test-allow-incomplete-quran") {
      parsed["test-allow-incomplete-quran"] = true;
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

function fail(message) {
  console.error(message);
  process.exit(1);
}

function validateRecognitionResult(filePath, minConfidence) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-recognition-result.mjs",
    "--file",
    filePath,
    "--min-confidence",
    String(minConfidence),
    "--require-exact-match",
    "--json",
  ], {
    cwd: resolve("."),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  if (result.status !== 0) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    console.error("Recognition result did not pass validation.");
    if (output) console.error(output);
    process.exit(result.status || 1);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    console.error("Recognition validator did not return valid JSON.");
    console.error(error.message);
    process.exit(1);
  }
}

function validateRecognitionJobMatch(path, recognition) {
  const job = readJson(path, "recognition job");
  const jobHash = String(job?.sourceAudio?.sha256 || "").trim().toLowerCase();
  const resultHash = String(recognition?.sourceAudio?.sha256 || "").trim().toLowerCase();
  if (!jobHash) fail("Recognition job is missing sourceAudio.sha256.");
  if (!resultHash) fail("Recognition result is missing sourceAudio.sha256.");
  if (jobHash !== resultHash) {
    fail("Recognition result sourceAudio.sha256 does not match the recognition job.");
  }
  return {
    jobType: String(job.jobType || "").trim(),
    sourceFileName: String(job.sourceAudio?.fileName || "").trim(),
    sha256: jobHash,
  };
}

function validateCompleteQuranData(path) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-quran-data.mjs",
    "--file",
    path,
    "--require-reviewed",
    "--json",
  ], {
    cwd: resolve("."),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  if (result.status !== 0) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    console.error("Quran data did not pass full reviewed validation.");
    if (output) console.error(output);
    process.exit(result.status || 1);
  }

  try {
    return JSON.parse(result.stdout);
  } catch (error) {
    console.error("Quran data validator did not return valid JSON.");
    console.error(error.message);
    process.exit(1);
  }
}

function validateQuranRange(path, result, validation) {
  const data = readJson(path, "Quran data");
  const surahNumber = Number(result.surahNumber || result.surah);
  const ayahStart = Number(result.ayahStart || result.startAyah);
  const ayahCount = Number(result.ayahCount || 1);
  const ayahs = findSurahAyahs(data, surahNumber);
  if (!ayahs.length) fail(`Quran data does not contain surah ${surahNumber}.`);
  const missing = [];
  for (let index = 0; index < ayahCount; index += 1) {
    const ayahNumber = ayahStart + index;
    if (!ayahs[ayahNumber - 1]) missing.push(ayahNumber);
  }
  if (missing.length) {
    fail(`Quran data is missing recognized ayah range: surah ${surahNumber}, ayah(s) ${missing.join(", ")}.`);
  }
  const source = data?.source || data?.metadata?.source || data?.meta?.source || {};
  if (source.reviewed !== true) {
    fail("Quran data source must be reviewed before applying recognition results.");
  }
  return {
    path,
    surahNumber,
    ayahStart,
    ayahCount,
    sourceName: String(source.name || source.sourceName || "").trim(),
    reviewed: true,
    fullValidation: validation ? {
      ready: validation.ready === true,
      loadedAyahs: validation.loadedAyahs,
      expectedAyahs: validation.expectedAyahs,
      sourceName: validation.source?.name || "",
    } : {
      skippedForTest: true,
    },
  };
}

function findSurahAyahs(data, surahNumber) {
  if (Array.isArray(data?.surahs)) {
    const surah = data.surahs.find((item) => Number(item.number ?? item.id) === surahNumber);
    return Array.isArray(surah?.ayahs)
      ? surah.ayahs.map((ayah) => typeof ayah === "string" ? ayah : ayah.text || ayah.uthmani || ayah.uthmaniText || ayah.aya_text || ayah.ayaText || ayah.ayahText || "")
      : [];
  }
  if (Array.isArray(data)) {
    const ayahs = [];
    data.forEach((entry) => {
      const surah = Number(fieldOf(entry, ["surah", "surahNumber", "sura", "suraNo", "sora", "soraNo", "chapter", "chapterNumber"]));
      const ayah = Number(fieldOf(entry, ["numberInSurah", "ayah", "ayahNumber", "aya", "ayaNo", "aya_no", "verse", "verseNumber"]));
      if (surah !== surahNumber || !ayah) return;
      ayahs[ayah - 1] = entry.text || entry.uthmani || entry.uthmaniText || entry.aya_text || entry.ayaText || entry.ayahText || "";
    });
    return ayahs;
  }
  return [];
}

function fieldOf(value, names) {
  if (!value || typeof value !== "object") return undefined;
  const normalized = new Map();
  Object.keys(value).forEach((key) => normalized.set(String(key).toLowerCase().replace(/[^a-z0-9]/g, ""), value[key]));
  for (const name of names) {
    const direct = value[name];
    if (direct !== undefined) return direct;
    const found = normalized.get(String(name).toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (found !== undefined) return found;
  }
  return undefined;
}

function printHelp() {
  console.log(`
Ayah Studio recognition result applier

Usage:
  node scripts/apply-recognition-result.mjs --project ayah-studio-project.json --recognition recognition-result.json --out ayah-studio-project.suggested.json

Options:
  --project FILE           Existing Ayah Studio project JSON.
  --recognition FILE       Validated external recognition result JSON.
  --job FILE               Optional recognition job JSON; validates sourceAudio.sha256 match.
  --quran FILE             Required complete reviewed Quran data JSON; validates full data and selected ayah range.
  --out FILE               Output project JSON with an unconfirmed suggestion.
  --min-confidence NUMBER  Must be 1 for Quran surah/ayah application. Defaults to 1.
  --test-allow-incomplete-quran
                           Test-only: skip full Quran completeness validation for small fixtures.

This script does not perform audio recognition. It safely imports a recognized
surah/ayah suggestion only after exact-match validation and keeps manual confirmation required.
`.trim());
}
