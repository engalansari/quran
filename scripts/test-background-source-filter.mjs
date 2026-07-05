#!/usr/bin/env node

import { inferStrictCategory, isSuitableBackgroundEntry } from "./background-source-filter.mjs";

const cases = [
  {
    name: "makkah kaaba accepted",
    entry: { id: "candidate-makkah", title: "Makkah Masjid Al Haram Kaaba view", category: "makkah" },
    expected: true,
  },
  {
    name: "madinah nabawi accepted",
    entry: { id: "candidate-madinah", title: "Madinah Prophet Mosque Nabawi courtyard", category: "madinah" },
    expected: true,
  },
  {
    name: "calm nature accepted",
    entry: { id: "candidate-forest", title: "Rain falling in a quiet forest full of trees", category: "nature" },
    expected: true,
  },
  {
    name: "nature road rejected",
    entry: { id: "candidate-road", title: "Curvy road on a tree covered hill", category: "nature" },
    expected: false,
  },
  {
    name: "beach people rejected",
    entry: { id: "candidate-people", title: "People surfing on a sunny beach", category: "sea" },
    expected: false,
  },
  {
    name: "generic islamic design rejected",
    entry: { id: "candidate-design", title: "Islamic background design with calligraphy", category: "mosque" },
    expected: false,
  },
];

const failures = [];

for (const testCase of cases) {
  const actual = isSuitableBackgroundEntry(testCase.entry, testCase.entry.category);
  if (actual !== testCase.expected) {
    failures.push(`${testCase.name}: expected ${testCase.expected}, got ${actual}`);
  }
}

const inferred = inferStrictCategory("Madinah Nabawi Prophet Mosque aerial view");
if (inferred !== "madinah") {
  failures.push(`category inference: expected madinah, got ${inferred}`);
}

if (failures.length) {
  console.error("FAIL background source filter");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("PASS background source filter keeps Quran-appropriate background candidates.");
