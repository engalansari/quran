#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const inputPath = args.input ? resolve(args.input) : "";
const outputPath = resolve(args.output || "data/quran-uthmani.json");
const sourceName = args["source-name"] || "Reviewed Uthmani Quran source";
const sourceUrl = args["source-url"] || "";
const sourceEdition = args["source-edition"] || "";

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!inputPath) {
  printHelp();
  process.exit(1);
}

const raw = readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const rawSha256 = createHash("sha256").update(raw, "utf8").digest("hex");
const entries = normalizeInput(raw, args.format || guessFormat(inputPath, raw));
const surahs = buildSurahs(entries);

writeFileSync(outputPath, `${JSON.stringify({
  source: {
    name: sourceName,
    url: sourceUrl,
    edition: sourceEdition,
    rawSourceFile: inputPath,
    rawSha256,
    reviewed: false,
    reviewNote: "Set reviewed to true only after human comparison with the trusted Mushaf source.",
  },
  surahs,
}, null, 2)}\n`, "utf8");

console.log(`Prepared Quran data: ${outputPath}`);
console.log(`Ayahs written: ${entries.length}`);
console.log("Next: node scripts\\validate-quran-data.mjs --file data\\quran-uthmani.json");

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help") {
      parsed.help = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function guessFormat(path, text) {
  if (/\.json$/i.test(path) || /^\s*[\[{]/.test(text)) return "json";
  if (/\.csv$/i.test(path)) return "csv";
  return "txt";
}

function normalizeInput(text, format) {
  if (format === "json") return normalizeJson(JSON.parse(text));
  if (format === "csv") return normalizeCsv(text);
  if (format === "txt") return normalizeText(text);
  throw new Error(`Unsupported format: ${format}`);
}

function normalizeJson(data) {
  const entries = [];
  if (Array.isArray(data?.surahs)) {
    data.surahs.forEach((surah) => {
      const surahNumber = asNumber(surah.number ?? surah.id ?? surah.index);
      const ayahs = Array.isArray(surah.ayahs) ? surah.ayahs : [];
      ayahs.forEach((ayah, index) => {
        const ayahNumber = asNumber(ayah?.numberInSurah ?? ayah?.ayah ?? ayah?.aya ?? ayah?.ayaNo ?? ayah?.verseNumber ?? ayah?.id ?? index + 1);
        const text = textOf(ayah);
        addEntry(entries, surahNumber, ayahNumber, text);
      });
    });
    return entries;
  }

  const list = Array.isArray(data) ? data : Array.isArray(data?.ayahs) ? data.ayahs : [];
  list.forEach((entry, index) => {
    const surahNumber = asNumber(fieldOf(entry, [
      "surah",
      "sura",
      "sora",
      "surahNumber",
      "suraNo",
      "soraNo",
      "chapter",
      "chapterNumber",
    ]));
    const ayahNumber = asNumber(fieldOf(entry, [
      "numberInSurah",
      "ayah",
      "aya",
      "ayaNo",
      "aya_no",
      "ayahNumber",
      "verse",
      "verseNumber",
    ]) ?? index + 1);
    addEntry(entries, surahNumber, ayahNumber, textOf(entry));
  });
  return entries;
}

function normalizeCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((cell) => normalizeKey(cell));
  const hasHeader = header.some((key) => ["surah", "sura", "ayah", "aya", "text", "uthmani"].includes(key));
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const entries = [];

  dataRows.forEach((row, index) => {
    const record = {};
    if (hasHeader) {
      header.forEach((key, cellIndex) => {
        record[key] = row[cellIndex] || "";
      });
    } else {
      record.surah = row[0];
      record.ayah = row[1];
      record.text = row.slice(2).join(",");
    }
    addEntry(
      entries,
      asNumber(record.surah ?? record.sura ?? record.sora ?? record.surahnumber ?? record.surano ?? record.sorano ?? record.chapternumber ?? record.chapter),
      asNumber(record.numberinsurah ?? record.ayah ?? record.aya ?? record.ayano ?? record.ayahnumber ?? record.versenumber ?? record.verse ?? index + 1),
      record.uthmani || record.uthmanitext || record.text || record.ayahtext || record.versetext || record.ayatext
    );
  });
  return entries;
}

function normalizeText(text) {
  const entries = [];
  text.split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const pipe = trimmed.match(/^(\d+)\|(\d+)\|(.+)$/);
    const tab = trimmed.match(/^(\d+)\t(\d+)\t(.+)$/);
    const match = pipe || tab;
    if (!match) {
      addEntry(entries, 0, index + 1, trimmed);
      return;
    }
    addEntry(entries, asNumber(match[1]), asNumber(match[2]), match[3]);
  });
  return entries;
}

function buildSurahs(entries) {
  const bySurah = new Map();
  entries.forEach((entry) => {
    const list = bySurah.get(entry.surah) || [];
    list[entry.ayah - 1] = { number: entry.ayah, text: entry.text };
    bySurah.set(entry.surah, list);
  });

  return [...bySurah.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, ayahs]) => ({
      number,
      ayahs: ayahs.filter(Boolean),
    }));
}

function addEntry(entries, surah, ayah, text) {
  const cleanText = String(text || "").trim();
  if (!surah || !ayah || !cleanText) return;
  entries.push({ surah, ayah, text: cleanText });
}

function textOf(value) {
  if (typeof value === "string") return value;
  return fieldOf(value, [
    "text",
    "uthmani",
    "uthmaniText",
    "ayaText",
    "aya_text",
    "ayahText",
    "verseText",
  ]) || "";
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function fieldOf(value, names) {
  if (!value || typeof value !== "object") return undefined;
  for (const name of names) {
    if (value[name] !== undefined) return value[name];
  }

  const normalized = new Map();
  Object.keys(value).forEach((key) => {
    normalized.set(normalizeKey(key), value[key]);
  });

  for (const name of names) {
    const found = normalized.get(normalizeKey(name));
    if (found !== undefined) return found;
  }

  return undefined;
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === "\"" && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function printHelp() {
  console.log(`
Ayah Studio Quran data preparer

Usage:
  node scripts/prepare-quran-data.mjs --input SOURCE_FILE --output data/quran-uthmani.json

Options:
  --input FILE             Source JSON, CSV, or TXT file from a reviewed Mushaf source.
  --output FILE            Output file. Defaults to data/quran-uthmani.json.
  --format json|csv|txt    Optional source format override.
  --source-name TEXT       Source name recorded in the output metadata.
  --source-url URL         Source URL recorded in the output metadata.
  --source-edition TEXT    Source edition/version recorded in the output metadata.

Accepted inputs:
  JSON with surahs[].ayahs[], flat JSON ayah list, CSV with surah/ayah/text columns,
  or TXT lines shaped as surah|ayah|text or surah<TAB>ayah<TAB>text.

This script prepares structure only. Human review against the trusted Mushaf source is still required.
`.trim());
}
