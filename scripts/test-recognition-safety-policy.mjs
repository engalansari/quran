#!/usr/bin/env node

import { readFileSync } from "node:fs";

const app = readFileSync("app.js", "utf8");

assert(!/els\.surahSelect\.value\s*=\s*String\(foundSurah\.number\)/.test(app), "filename hints must not change surah selection");
assert(!/els\.ayahStart\.value\s*=\s*["']1["']/.test(extractFunction(app, "fakeRecognizeFromFilename")), "filename hints must not change ayah start");
assert(!/source:\s*["']filename\+audio["']/.test(app), "audio timing must not upgrade filename hints into recognition");
assert(/source:\s*["']filename-hint["']/.test(app), "filename hints should be explicitly labeled as hints");
assert(/confidence:\s*0/.test(extractFunction(app, "fakeRecognizeFromFilename")), "filename hints must not carry recognition confidence");
assert(/confidence:\s*0/.test(extractFunction(app, "updateRecognitionFromAudio")), "audio timing must not carry recognition confidence");
assert(app.includes("مطابقة قطعية 100%"), "UI must state exact-match-only Quran selection policy");

console.log("PASS Recognition safety policy test completed.");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert(start >= 0, `missing function ${name}`);
  const next = source.indexOf("\nfunction ", start + 1);
  return source.slice(start, next === -1 ? source.length : next);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
