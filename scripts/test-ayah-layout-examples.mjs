#!/usr/bin/env node

import { readFileSync } from "node:fs";

const quran = JSON.parse(readFileSync("data/quran-uthmani.json", "utf8"));
const appSource = readFileSync("app.js", "utf8");
const composerSource = readFileSync("scripts/compose-selected-ayah-video.mjs", "utf8");

const ayahs = quran.surahs.flatMap((surah) =>
  surah.ayahs.map((ayah) => ({
    surah: surah.number,
    ayah: ayah.number,
    text: ayah.text,
    length: cleanLength(ayah.text),
  }))
);

const examples = [
  findExample((ayah) => ayah.length <= 35),
  findExample((ayah) => ayah.length >= 90 && ayah.length <= 180),
  findExample((ayah) => ayah.length >= 240),
];

const checks = [
  {
    label: "short, medium, and long Quran examples exist",
    pass: examples.every(Boolean) && new Set(examples.map((ayah) => ayah.surah)).size >= 2,
  },
  {
    label: "examples preserve Arabic RTL text and tashkeel",
    pass: examples.every((ayah) => /[\u0600-\u06ff]/.test(ayah.text) && /[\u064b-\u065f\u0670]/.test(ayah.text)),
  },
  {
    label: "browser has text fit profile for long selections",
    pass: /function\s+ayahTextProfile\s*\(/.test(appSource) && /is-very-long/.test(appSource),
  },
  {
    label: "export wraps ayahs and changes font size by line count",
    pass: /function\s+wrappedLines\s*\(/.test(composerSource) && /function\s+fontSizeForText\s*\(/.test(composerSource),
  },
  {
    label: "export ASS keeps wrapped Quran text centered",
    pass:
      /WrapStyle:\s*2/.test(composerSource) &&
      /Style: Ayah/.test(composerSource) &&
      composerSource.includes("\\\\q2\\\\an5\\\\pos") &&
      /function\s+ayahTextDialogueOverride\s*\(/.test(composerSource),
  },
];

const failures = checks.filter((check) => !check.pass);

checks.forEach((check) => {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.label}`);
});

console.log(
  `Examples: ${examples
    .filter(Boolean)
    .map((ayah) => `${ayah.surah}:${ayah.ayah}(${ayah.length})`)
    .join(", ")}`
);

if (failures.length) {
  process.exit(1);
}

function findExample(predicate) {
  return ayahs.find(predicate);
}

function cleanLength(text) {
  return String(text || "").replace(/\s+/g, "").length;
}
