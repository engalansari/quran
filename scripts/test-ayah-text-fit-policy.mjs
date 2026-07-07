#!/usr/bin/env node

import { readFileSync } from "node:fs";

const appSource = readFileSync("app.js", "utf8");
const cssSource = readFileSync("styles.css", "utf8");
const todoSource = readFileSync("TODO.md", "utf8");
const composerSource = readFileSync("scripts/compose-selected-ayah-video.mjs", "utf8");

const checks = [
  {
    label: "dynamic ayah limit exists",
    pass: /function\s+recommendedAyahLimit\s*\(/.test(appSource) && /els\.ayahCount\.max\s*=\s*String\(maxCount\)/.test(appSource),
  },
  {
    label: "text profile warning exists",
    pass: /function\s+ayahTextProfile\s*\(/.test(appSource) && /function\s+ayahLengthWarning\s*\(/.test(appSource),
  },
  {
    label: "phone preview text fit classes are applied",
    pass: /applyPhoneAyahFit\(ayahs\)/.test(appSource) && /is-very-long/.test(appSource),
  },
  {
    label: "range summary warning style exists",
    pass: /\.range-summary\.warning/.test(cssSource),
  },
  {
    label: "phone ayah long styles exist",
    pass: /\.phone-ayah\.is-long/.test(cssSource) && /\.phone-ayah\.is-very-long/.test(cssSource),
  },
  {
    label: "export ayah frame keeps text inside",
    pass:
      /estimatedRenderedLineCount/.test(composerSource)
      && /const minimum = longest <= 32 && lines\.length <= 1 \? 820 : 560/.test(composerSource)
      && /estimatedLines \* fontSize \* 1\.46 \+ 168/.test(composerSource)
      && /--width=\$\{layout\.width - 132\}/.test(composerSource),
  },
  {
    label: "TODO tracks text fit work",
    pass: /الآيات الطويلة/.test(todoSource) && /طويل/.test(todoSource) && /فيديو قصير/.test(todoSource),
  },
];

const failures = checks.filter((check) => !check.pass);

checks.forEach((check) => {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.label}`);
});

if (failures.length) {
  process.exit(1);
}
