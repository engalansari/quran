#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createWorker } from "tesseract.js";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.video || !args.quran) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const videoPath = resolve(args.video);
const quranPath = resolve(args.quran);
const ffmpegPath = resolve(args.ffmpeg || "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
const langPath = resolve(args["lang-path"] || "tools/tessdata");
const keepTemp = args["keep-temp"] === true;
const maxCandidates = Number(args["max-candidates"] || 8);
const frameSeconds = String(args.frames || "3,8,15,30")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value) && value >= 0);

const report = await run();
console.log(JSON.stringify(report, null, 2));
process.exit(report.candidates?.length ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--keep-temp") {
      parsed["keep-temp"] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

async function run() {
  const missing = [];
  if (!existsSync(videoPath)) missing.push(`video not found: ${videoPath}`);
  if (!existsSync(quranPath)) missing.push(`Quran file not found: ${quranPath}`);
  if (!existsSync(ffmpegPath)) missing.push(`FFmpeg not found: ${ffmpegPath}`);
  if (!existsSync(join(langPath, "ara.traineddata.gz"))) missing.push(`Arabic OCR data not found: ${join(langPath, "ara.traineddata.gz")}`);
  if (missing.length) return failure("missing-inputs", missing);

  const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-ocr-"));
  const quran = readJson(quranPath);
  const ayahs = extractAyahs(quran);
  const framePaths = [];
  const ocrResults = [];

  try {
    for (const second of frameSeconds) {
      const framePath = join(tempDir, `frame-${second}.png`);
      const extracted = extractSubtitleFrame(second, framePath);
      if (extracted.status === 0 && existsSync(framePath)) framePaths.push({ second, framePath });
    }

    const worker = await createWorker("ara", 1, { langPath, gzip: true });
    await worker.setParameters({
      tessedit_pageseg_mode: "11",
      preserve_interword_spaces: "1",
    });

    for (const frame of framePaths) {
      const result = await worker.recognize(frame.framePath);
      ocrResults.push({
        second: frame.second,
        text: result.data.text.trim(),
        confidence: result.data.confidence,
        fragments: extractArabicFragments(result.data.text),
      });
    }

    await worker.terminate();

    const candidates = rankCandidates(ayahs, ocrResults).slice(0, maxCandidates);
    return {
      report: "Ayah Studio silent video OCR Quran candidates",
      ready: false,
      status: candidates.length ? "visual-candidates" : "not-found",
      policy: "visual OCR never auto-selects; show candidates for user confirmation only",
      video: videoPath,
      frames: frameSeconds,
      ocrResults,
      candidates,
      message: candidates.length
        ? "Visual OCR found Quran candidate ayahs. User confirmation is required."
        : "Visual OCR did not find reliable Quran candidates.",
    };
  } catch (error) {
    return failure("ocr-failed", [error.message]);
  } finally {
    if (!keepTemp) rmSync(tempDir, { recursive: true, force: true });
  }
}

function extractSubtitleFrame(second, outputPath) {
  return spawnSync(ffmpegPath, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(second),
    "-i",
    videoPath,
    "-frames:v",
    "1",
    "-vf",
    "crop=iw:ih*0.30:0:ih*0.36,scale=2160:-1,format=gray,eq=contrast=3.0:brightness=0.12,negate",
    outputPath,
  ], {
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024,
  });
}

function rankCandidates(ayahs, ocrResults) {
  const fragments = unique(
    ocrResults.flatMap((result) => result.fragments)
      .map((fragment) => normalizeArabicForMatching(fragment))
      .filter((fragment) => fragment.length >= 5)
  );
  const scored = [];

  for (const ayah of ayahs) {
    const matched = fragments.filter((fragment) => ayah.normalizedText.includes(fragment));
    const score = matched.reduce((total, fragment) => total + fragment.length, 0);
    if (score < 7) continue;
    scored.push({
      surahNumber: ayah.surahNumber,
      ayahStart: ayah.ayahNumber,
      ayahEnd: ayah.ayahNumber,
      ayahCount: 1,
      score,
      matchedFragments: matched,
      matchedTextPreview: ayah.text.slice(0, 220),
    });
  }

  return scored.sort((left, right) => right.score - left.score || left.surahNumber - right.surahNumber || left.ayahStart - right.ayahStart);
}

function extractArabicFragments(text) {
  const fragments = [];
  const lines = String(text || "").split(/\r?\n/);
  for (const line of lines) {
    const words = line.match(/[\u0600-\u06FF]+/g) || [];
    for (const word of words) fragments.push(word);
    for (let index = 0; index < words.length - 1; index += 1) {
      fragments.push(`${words[index]}${words[index + 1]}`);
    }
    if (words.length > 2) fragments.push(words.join(""));
  }
  return fragments;
}

function extractAyahs(data) {
  const ayahs = [];
  if (Array.isArray(data?.surahs)) {
    data.surahs.forEach((surah) => {
      const surahNumber = Number(surah.number ?? surah.id);
      if (!surahNumber || !Array.isArray(surah.ayahs)) return;
      surah.ayahs.forEach((ayah, index) => {
        const text = typeof ayah === "string"
          ? ayah
          : ayah.text || ayah.uthmani || ayah.uthmaniText || ayah.aya_text || ayah.ayaText || ayah.ayahText || "";
        if (text) {
          ayahs.push({
            surahNumber,
            ayahNumber: index + 1,
            text,
            normalizedText: normalizeArabicForMatching(text),
          });
        }
      });
    });
  }
  return ayahs;
}

function normalizeArabicForMatching(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/([إأآٱا])ل[\u064B-\u065F\u06D6-\u06ED]*\u0651(?=[\u064B-\u065F\u06D6-\u06ED]*ي)/g, "$1لل")
    .replace(/ذ[\u064B-\u065F\u06D6-\u06ED]*\u0670(?=[\u064B-\u065F\u06D6-\u06ED]*ل)/g, "ذ")
    .replace(/ى\u0670/g, "ى")
    .replace(/\u0670/g, "ا")
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[إأآٱا]/g, "ا")
    .replace(/[ؤئء]/g, "")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ابتثجحخدذرزسشصضطظعغفقكلمنهوي]/g, "");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function unique(values) {
  return [...new Set(values)];
}

function failure(code, issues) {
  return {
    report: "Ayah Studio silent video OCR Quran candidates",
    ready: false,
    status: "not-found",
    code,
    issues,
    candidates: [],
  };
}

function printHelp() {
  console.log(`
Ayah Studio silent-video OCR fallback

Usage:
  node scripts/ocr-video-quran.mjs --video recitation.mp4 --quran data/quran-uthmani.json --json

Policy:
  OCR output is never used as an automatic Quran selection. It only produces
  candidate ayahs for user confirmation.
`.trim());
}
