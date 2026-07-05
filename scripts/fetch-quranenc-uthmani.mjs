#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const quranCatalog = [
  [1, 7], [2, 286], [3, 200], [4, 176], [5, 120], [6, 165], [7, 206], [8, 75], [9, 129], [10, 109],
  [11, 123], [12, 111], [13, 43], [14, 52], [15, 99], [16, 128], [17, 111], [18, 110], [19, 98], [20, 135],
  [21, 112], [22, 78], [23, 118], [24, 64], [25, 77], [26, 227], [27, 93], [28, 88], [29, 69], [30, 60],
  [31, 34], [32, 30], [33, 73], [34, 54], [35, 45], [36, 83], [37, 182], [38, 88], [39, 75], [40, 85],
  [41, 54], [42, 53], [43, 89], [44, 59], [45, 37], [46, 35], [47, 38], [48, 29], [49, 18], [50, 45],
  [51, 60], [52, 49], [53, 62], [54, 55], [55, 78], [56, 96], [57, 29], [58, 22], [59, 24], [60, 13],
  [61, 14], [62, 11], [63, 11], [64, 18], [65, 12], [66, 12], [67, 30], [68, 52], [69, 52], [70, 44],
  [71, 28], [72, 28], [73, 20], [74, 56], [75, 40], [76, 31], [77, 50], [78, 40], [79, 46], [80, 42],
  [81, 29], [82, 19], [83, 36], [84, 25], [85, 22], [86, 17], [87, 19], [88, 26], [89, 30], [90, 20],
  [91, 15], [92, 21], [93, 11], [94, 8], [95, 8], [96, 19], [97, 5], [98, 8], [99, 8], [100, 11],
  [101, 11], [102, 8], [103, 3], [104, 9], [105, 5], [106, 4], [107, 7], [108, 3], [109, 6], [110, 3],
  [111, 5], [112, 4], [113, 5], [114, 6],
].map(([number, ayahCount]) => ({ number, ayahCount }));

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const translation = args.translation || "english_saheeh";
const sourceUrl = "https://quranenc.com/api/v1/translation/sura";
const rawPath = resolve(args.raw || "data/source/quranenc-uthmani.json");
const outputPath = resolve(args.output || "data/quran-uthmani.json");
const sourceName = args["source-name"] || "QuranEnc API";
const sourceEdition = args["source-edition"] || `QuranEnc arabic_text via ${translation}`;

mkdirSync(resolve("data/source"), { recursive: true });

const entries = [];
for (const surah of quranCatalog) {
  const ayahs = await fetchSurah(translation, surah.number);
  if (ayahs.length !== surah.ayahCount) {
    fail(`Surah ${surah.number} returned ${ayahs.length} ayahs, expected ${surah.ayahCount}.`);
  }
  ayahs.forEach((ayah) => {
    const surahNumber = Number(ayah.sura);
    const ayahNumber = Number(ayah.aya);
    const text = String(ayah.arabic_text || "").trim();
    if (surahNumber !== surah.number) fail(`Unexpected surah number in API result: ${surahNumber}, expected ${surah.number}.`);
    if (!ayahNumber || !text) fail(`Missing ayah number or arabic_text in surah ${surah.number}.`);
    entries.push({
      surah: surahNumber,
      ayah: ayahNumber,
      text,
      quranencId: String(ayah.id || "").trim(),
    });
  });
}

writeFileSync(rawPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");

run("prepare Quran data", [
  "scripts/prepare-quran-data.mjs",
  "--input", rawPath,
  "--output", outputPath,
  "--source-name", sourceName,
  "--source-url", `${sourceUrl}/${translation}`,
  "--source-edition", sourceEdition,
]);

run("validate Quran data", [
  "scripts/validate-quran-data.mjs",
  "--file", outputPath,
]);

console.log("PASS QuranEnc Uthmani Quran data fetched and prepared.");
console.log(`Raw source: ${rawPath}`);
console.log(`Prepared Quran data: ${outputPath}`);
console.log("Review is still required before production export: source.reviewed remains false.");

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

async function fetchSurah(translation, surahNumber) {
  const url = `${sourceUrl}/${encodeURIComponent(translation)}/${surahNumber}`;
  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "Ayah Studio Quran data importer",
    },
  });
  if (!response.ok) {
    fail(`QuranEnc request failed for surah ${surahNumber}: HTTP ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (!Array.isArray(data.result)) {
    fail(`QuranEnc response for surah ${surahNumber} does not contain result[].`);
  }
  return data.result;
}

function run(label, commandArgs) {
  const result = spawnSync(process.execPath, commandArgs, {
    encoding: "utf8",
    windowsHide: true,
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  if (output) console.log(output);
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status ?? 1}.`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Ayah Studio QuranEnc Uthmani importer

Usage:
  node scripts/fetch-quranenc-uthmani.mjs

Options:
  --translation KEY        QuranEnc translation key used as API transport. Defaults to english_saheeh.
  --raw FILE              Raw flat Quran source output. Defaults to data/source/quranenc-uthmani.json.
  --output FILE           Prepared app Quran file. Defaults to data/quran-uthmani.json.
  --source-name TEXT      Source name metadata. Defaults to QuranEnc API.
  --source-edition TEXT   Source edition metadata.

This fetches QuranEnc result[].arabic_text for all 114 surahs, then validates
the prepared 6,236-ayah file. It does not mark the source reviewed.
`.trim());
}
