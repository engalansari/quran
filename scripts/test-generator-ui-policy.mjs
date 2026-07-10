#!/usr/bin/env node

import { readFileSync } from "node:fs";

const indexHtml = readFileSync("index.html", "utf8");
const appJs = readFileSync("app.js", "utf8");
const backendJs = readFileSync("scripts/serve-mobile-backend.mjs", "utf8");

const required = [
  ["index.html", indexHtml, "إنشاء فيديو MP4"],
  ["index.html", indexHtml, "surahSelect"],
  ["index.html", indexHtml, "reciterSelect"],
  ["index.html", indexHtml, "backgroundSelect"],
  ["index.html", indexHtml, "backgroundGrid"],
  ["index.html", indexHtml, "suggestBackgrounds"],
  ["index.html", indexHtml, "backgroundSearch"],
  ["index.html", indexHtml, "backgroundCategoryFilters"],
  ["index.html", indexHtml, "backgroundLoadMore"],
  ["index.html", indexHtml, "audioMode"],
  ["index.html", indexHtml, "externalAudioFile"],
  ["index.html", indexHtml, "externalUseAyahs"],
  ["index.html", indexHtml, "renderJobPanel"],
  ["index.html", indexHtml, "rangeSummary"],
  ["index.html", indexHtml, "ayahStartMinus"],
  ["index.html", indexHtml, "ayahStartPlus"],
  ["index.html", indexHtml, "surahAyahTotal"],
  ["index.html", indexHtml, "ayahCountMinus"],
  ["index.html", indexHtml, "ayahCountPlus"],
  ["index.html", indexHtml, "selectedAyahCountLabel"],
  ["app.js", appJs, "setAyahStartByStep"],
  ["app.js", appJs, "syncAyahStartControls"],
  ["app.js", appJs, "setAyahCountByStep"],
  ["app.js", appJs, "syncAyahCountControls"],
  ["app.js", appJs, "bindNumericStepperInput"],
  ["app.js", appJs, "sanitizeNumericInput"],
  ["app.js", appJs, "handleSurahSelectionChange"],
  ["app.js", appJs, "readSelectedSurahNumber"],
  ["app.js", appJs, "beforeinput"],
  ["app.js", appJs, "replaceNextDigit"],
  ["styles.css", readFileSync("styles.css", "utf8"), "unicode-bidi: plaintext"],
  ["index.html", indexHtml, "assets/production/makkah.mp4"],
  ["index.html", indexHtml, "app.js?v="],
  ["index.html", indexHtml, "20260710-surah-required-v1"],
  ["app.js", appJs, "اختر السورة"],
  ["app.js", appJs, "/api/render"],
  ["app.js", appJs, "waitForRenderJob"],
  ["app.js", appJs, "showRenderJobStatus"],
  ["app.js", appJs, "generationFailurePrefix"],
  ["app.js", appJs, "/api/compose-external-audio-video"],
  ["app.js", appJs, "data/quran-uthmani.json"],
  ["app.js", appJs, "assets/recitation-catalog.json"],
  ["app.js", appJs, "assets/background-library/catalog.json"],
  ["app.js", appJs, "updateRangeSummary"],
  ["app.js", appJs, "scoreBackgroundsForAyahs"],
  ["app.js", appJs, "background-card"],
  ["app.js", appJs, "visibleBackgroundLimit"],
  ["app.js", appJs, "backgroundBatchSize"],
  ["scripts/serve-mobile-backend.mjs", backendJs, "hint: finalJob.result?.hint"],
  ["scripts/serve-mobile-backend.mjs", backendJs, "code: finalJob.result?.code"],
];

const forbidden = [
  ["index.html", indexHtml, "videoInput"],
  ["index.html", indexHtml, "recognitionStatus"],
  ["index.html", indexHtml, "externalInstagramUrl"],
  ["index.html", indexHtml, "externalUseBrowserCookies"],
  ["index.html", indexHtml, "externalCookiesFile"],
  ["app.js", appJs, 'form.append("sourceUrl"'],
  ["app.js", appJs, "useBrowserCookies"],
  ["app.js", appJs, "externalCookiesFile"],
  ["app.js", appJs, "instagram-download-failed"],
  ["app.js", appJs, 'fetch("/api/compose-selected-video"'],
  ["index.html", indexHtml, "رفع فيديو"],
  ["index.html", indexHtml, "التعرف"],
  ["index.html", indexHtml, "التعرّف"],
];

const failures = [];

required.forEach(([file, content, token]) => {
  if (!content.includes(token)) failures.push(`${file} is missing ${token}`);
});

if (!/<input[^>]+id=["']ayahCount["'][^>]+inputmode=["']numeric["'][^>]*>/i.test(indexHtml)) {
  failures.push("index.html ayahCount must allow numeric typing inside the stepper.");
}

if (/<input[^>]+id=["']ayahCount["'][^>]+readonly/i.test(indexHtml)) {
  failures.push("index.html ayahCount must not be readonly.");
}

if (!/<input[^>]+id=["']ayahStart["'][^>]+inputmode=["']numeric["'][^>]*>/i.test(indexHtml)) {
  failures.push("index.html ayahStart must allow numeric typing inside the stepper.");
}

if (/<input[^>]+id=["']ayahStart["'][^>]+readonly/i.test(indexHtml)) {
  failures.push("index.html ayahStart must not be readonly.");
}

forbidden.forEach(([file, content, token]) => {
  if (token.includes("رفع فيديو") && indexHtml.includes("externalAudioFile")) return;
  if (token.includes("ÙØ¹") && indexHtml.includes("externalAudioFile")) return;
  if (content.includes(token)) failures.push(`${file} still includes old UI token ${token}`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("PASS generator UI is clean and wired to compose endpoint.");
