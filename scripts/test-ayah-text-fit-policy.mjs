#!/usr/bin/env node

import { readFileSync } from "node:fs";

const appSource = readFileSync("app.js", "utf8");
const cssSource = readFileSync("styles.css", "utf8");
const todoSource = readFileSync("TODO.md", "utf8");
const composerSource = readFileSync("scripts/compose-selected-ayah-video.mjs", "utf8");
const dockerSource = readFileSync("Dockerfile", "utf8");
const deploySource = readFileSync("scripts/deploy-cloud-run.ps1", "utf8");

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
    label: "export uses HTML auto Quran caption layout",
    pass:
      /htmlQuranRenderer/.test(composerSource)
      && /function\s+buildAyahOverlayHtml\s*\(/.test(composerSource)
      && /scrollWidth/.test(composerSource)
      && /scrollHeight/.test(composerSource)
      && /minFont:\s*50/.test(composerSource)
      && /balancedLines/.test(composerSource),
  },
  {
    label: "cloud render uses measured Pango Quran renderer",
    pass:
      /QURAN_TEXT_RENDERER=pango/.test(dockerSource)
      && /QURAN_TEXT_RENDERER=pango/.test(deploySource)
      && /function\s+pangoAyahLayout\s*\(/.test(composerSource)
      && /probeImageSize\(pngPath\)/.test(composerSource),
  },
  {
    label: "Chromium renderer uses container-safe screenshot flags",
    pass:
      /--no-zygote/.test(composerSource)
      && /--single-process/.test(composerSource)
      && /--disable-crashpad/.test(composerSource)
      && /--allow-file-access-from-files/.test(composerSource)
      && !/--disable-software-rasterizer/.test(composerSource),
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
