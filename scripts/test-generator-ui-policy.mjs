#!/usr/bin/env node

import { readFileSync } from "node:fs";

const indexHtml = readFileSync("index.html", "utf8");
const appJs = readFileSync("app.js", "utf8");

const required = [
  ["index.html", indexHtml, "توليد فيديو MP4"],
  ["index.html", indexHtml, "surahSelect"],
  ["index.html", indexHtml, "reciterSelect"],
  ["index.html", indexHtml, "backgroundSelect"],
  ["index.html", indexHtml, "backgroundGrid"],
  ["index.html", indexHtml, "suggestBackgrounds"],
  ["index.html", indexHtml, "backgroundSearch"],
  ["index.html", indexHtml, "backgroundCategoryFilters"],
  ["index.html", indexHtml, "backgroundLoadMore"],
  ["index.html", indexHtml, "rangeSummary"],
  ["index.html", indexHtml, "assets/production/makkah.mp4"],
  ["index.html", indexHtml, "app.js?v="],
  ["app.js", appJs, "/api/compose-selected-video"],
  ["app.js", appJs, "data/quran-uthmani.json"],
  ["app.js", appJs, "assets/recitation-catalog.json"],
  ["app.js", appJs, "assets/background-library/catalog.json"],
  ["app.js", appJs, "updateRangeSummary"],
  ["app.js", appJs, "scoreBackgroundsForAyahs"],
  ["app.js", appJs, "background-card"],
  ["app.js", appJs, "visibleBackgroundLimit"],
  ["app.js", appJs, "backgroundBatchSize"],
];

const forbidden = [
  ["index.html", indexHtml, "videoInput"],
  ["index.html", indexHtml, "recognitionStatus"],
  ["index.html", indexHtml, "رفع فيديو"],
  ["index.html", indexHtml, "التعرف"],
  ["index.html", indexHtml, "التعرّف"],
];

const failures = [];

required.forEach(([file, content, token]) => {
  if (!content.includes(token)) failures.push(`${file} is missing ${token}`);
});

forbidden.forEach(([file, content, token]) => {
  if (content.includes(token)) failures.push(`${file} still includes old UI token ${token}`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("PASS generator UI is clean and wired to compose endpoint.");
