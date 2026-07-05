#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.quran || (!args.transcript && !args["transcript-file"])) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const quranPath = resolve(args.quran);
const transcript = args["transcript-file"]
  ? readFileSync(resolve(args["transcript-file"]), "utf8")
  : String(args.transcript || "");
const analyzedSeconds = Number(args["analyzed-seconds"] ?? 7);
const nextAnalysisSeconds = Number(args["next-analysis-seconds"] ?? 15);
const maxCandidates = Number(args["max-candidates"] ?? 12);
const minLetters = Number(args["min-letters"] ?? 10);

const quran = readJson(quranPath, "Quran data");
const index = buildQuranIndex(quran);
const report = matchTranscript({
  transcript,
  index,
  quranPath,
  analyzedSeconds,
  nextAnalysisSeconds,
  maxCandidates,
  minLetters,
});

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}

process.exit(report.status === "not-found" ? 1 : 0);

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

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read ${label}: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function matchTranscript({ transcript, index, quranPath, analyzedSeconds, nextAnalysisSeconds, maxCandidates, minLetters }) {
  const normalizedTranscript = normalizeArabicForMatching(transcript);
  const base = {
    report: "Ayah Studio transcript-to-Quran matching",
    quranPath,
    analyzedSeconds,
    nextAnalysisSeconds,
    normalizedTranscriptLength: normalizedTranscript.length,
    method: "normalized-transcript-exact-substring",
    policy: "unique-match-auto-suggestion; ambiguous-match-user-choice; no-nearest-match",
  };

  if (normalizedTranscript.length < minLetters) {
    return {
      ...base,
      status: "not-found",
      exactMatch: false,
      confidence: 0,
      candidates: [],
      message: `Transcript is too short after normalization; extend analysis beyond ${analyzedSeconds} seconds.`,
    };
  }

  const candidates = uniqueCandidates((index.variants || [index]).flatMap((variant) => {
    const variantTranscript = normalizeArabicForMatching(transcript, { daggerAlif: variant.daggerAlif });
    const matches = findAllMatches(variant.normalized, variantTranscript);
    return matches.map((start) => candidateForMatch(variant, start, variantTranscript.length));
  }))
    .slice(0, maxCandidates);

  if (candidates.length === 1) {
    return {
      ...base,
      status: "unique",
      exactMatch: true,
      confidence: 1,
      result: candidates[0],
      candidates,
      message: "Unique exact normalized transcript match found.",
    };
  }

  if (candidates.length > 1) {
    return {
      ...base,
      status: "ambiguous",
      exactMatch: false,
      confidence: 0,
      candidates,
      message: "Multiple Quran locations match this transcript. Show candidates for user selection; do not select automatically.",
    };
  }

  return {
    ...base,
    status: "not-found",
    exactMatch: false,
    confidence: 0,
    candidates: [],
    message: `No exact normalized match in first ${analyzedSeconds} seconds; extend transcript analysis to ${nextAnalysisSeconds} seconds or more.`,
  };
}

function buildQuranIndex(data) {
  const ayahs = extractAyahs(data);
  const variants = [
    buildQuranIndexVariant(ayahs, "keep"),
    buildQuranIndexVariant(ayahs, "drop"),
  ];
  return {
    ...variants[0],
    variants,
  };
}

function buildQuranIndexVariant(ayahs, daggerAlif) {
  let normalized = "";
  const ranges = [];

  ayahs.forEach((ayah) => {
    const start = normalized.length;
    const normalizedText = normalizeArabicForMatching(ayah.text, { daggerAlif });
    normalized += normalizedText;
    ranges.push({
      ...ayah,
      start,
      end: normalized.length,
      normalizedText,
    });
  });

  return { daggerAlif, normalized, ranges };
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
        if (text) ayahs.push({ surahNumber, ayahNumber: index + 1, text });
      });
    });
    return ayahs;
  }

  if (Array.isArray(data)) {
    data.forEach((entry) => {
      const surahNumber = Number(fieldOf(entry, ["surah", "surahNumber", "sura", "suraNo", "sora", "soraNo", "chapter", "chapterNumber"]));
      const ayahNumber = Number(fieldOf(entry, ["numberInSurah", "ayah", "ayahNumber", "aya", "ayaNo", "aya_no", "verse", "verseNumber"]));
      const text = entry.text || entry.uthmani || entry.uthmaniText || entry.aya_text || entry.ayaText || entry.ayahText || "";
      if (surahNumber && ayahNumber && text) ayahs.push({ surahNumber, ayahNumber, text });
    });
  }
  return ayahs.sort((left, right) => left.surahNumber - right.surahNumber || left.ayahNumber - right.ayahNumber);
}

function fieldOf(value, names) {
  if (!value || typeof value !== "object") return undefined;
  const normalized = new Map();
  Object.keys(value).forEach((key) => normalized.set(String(key).toLowerCase().replace(/[^a-z0-9]/g, ""), value[key]));
  for (const name of names) {
    if (value[name] !== undefined) return value[name];
    const found = normalized.get(String(name).toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (found !== undefined) return found;
  }
  return undefined;
}

function normalizeArabicForMatching(value, options = {}) {
  const daggerAlif = options.daggerAlif || "keep";
  return String(value || "")
    .normalize("NFKD")
    .replace(/([إأآٱا])ل[\u064B-\u065F\u06D6-\u06ED]*\u0651(?=[\u064B-\u065F\u06D6-\u06ED]*ي)/g, "$1لل")
    .replace(/ذ[\u064B-\u065F\u06D6-\u06ED]*\u0670(?=[\u064B-\u065F\u06D6-\u06ED]*ل)/g, "ذ")
    .replace(/ى\u0670/g, "ى")
    .replace(/\u0670/g, daggerAlif === "drop" ? "" : "ا")
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[إأآٱا]/g, "ا")
    .replace(/[ؤئء]/g, "")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^ابتثجحخدذرزسشصضطظعغفقكلمنهوي]/g, "");
}

function findAllMatches(haystack, needle) {
  const starts = [];
  let offset = 0;
  while (offset <= haystack.length) {
    const found = haystack.indexOf(needle, offset);
    if (found === -1) break;
    starts.push(found);
    offset = found + 1;
  }
  return starts;
}

function candidateForMatch(index, start, length) {
  const end = start + length;
  const startAyah = index.ranges.find((range) => start >= range.start && start < range.end)
    || index.ranges.find((range) => range.end === start);
  const endAyah = index.ranges.find((range) => end > range.start && end <= range.end)
    || index.ranges.find((range) => range.start === end);
  const ayahs = index.ranges.filter((range) => range.end > start && range.start < end);
  const first = startAyah || ayahs[0];
  const last = endAyah || ayahs[ayahs.length - 1] || first;
  return {
    surahNumber: first?.surahNumber || 0,
    ayahStart: first?.ayahNumber || 0,
    ayahEnd: last?.ayahNumber || first?.ayahNumber || 0,
    ayahCount: first && last && first.surahNumber === last.surahNumber
      ? Math.max(1, last.ayahNumber - first.ayahNumber + 1)
      : Math.max(1, ayahs.length),
    matchStart: start,
    matchEnd: end,
    matchedTextPreview: ayahs.map((ayah) => ayah.text).join(" ").slice(0, 220),
  };
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    const key = `${candidate.surahNumber}:${candidate.ayahStart}:${candidate.ayahEnd}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function printReport(report) {
  console.log(`Transcript Quran match: ${report.status}`);
  console.log(`Analyzed seconds: ${report.analyzedSeconds}`);
  console.log(`Candidates: ${report.candidates.length}`);
  console.log(report.message);
  report.candidates.forEach((candidate) => {
    console.log(`- surah ${candidate.surahNumber}, ayah ${candidate.ayahStart}-${candidate.ayahEnd}`);
  });
}

function printHelp() {
  console.log(`
Ayah Studio transcript-to-Quran matcher

Usage:
  node scripts/match-quran-transcript.mjs --quran data/quran-uthmani.json --transcript "الحمد لله رب العالمين" --json

Options:
  --quran FILE                  Reviewed Quran JSON.
  --transcript TEXT             Transcript text, usually from the first analysis window.
  --transcript-file FILE        Read transcript from a text file.
  --analyzed-seconds NUMBER     Audio window used for the transcript. Defaults to 7.
  --next-analysis-seconds N     Suggested wider window when no match is found. Defaults to 15.
  --min-letters NUMBER          Minimum normalized Arabic letters. Defaults to 10.
  --max-candidates NUMBER       Maximum candidates to print. Defaults to 12.
  --json                        Print machine-readable JSON.

Policy:
  - One unique exact normalized match can become an unconfirmed suggestion.
  - Multiple matches are candidates for user choice only.
  - No match means extend the analyzed audio duration; never select nearest match.
`.trim());
}
