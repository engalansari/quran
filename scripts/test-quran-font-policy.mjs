#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const cssSource = readFileSync("styles.css", "utf8");
const composerSource = readFileSync("scripts/compose-selected-ayah-video.mjs", "utf8");
const todoSource = readFileSync("TODO.md", "utf8");

const browserFontFile = "assets/fonts/hafs.18.ttf";
const exportFontFile = "assets/fonts/hafs.18.ttf";
const browserFontFamily = "KFGQPCHAFSUthmanicScript-Regula";
const exportFontFamily = "KFGQPC HAFS Uthmanic Script";

const checks = [
  {
    label: "reviewed font file exists",
    pass: existsSync(browserFontFile) && existsSync(exportFontFile),
  },
  {
    label: "browser loads reviewed Uthmani font",
    pass: cssSource.includes(`font-family: "${browserFontFamily}"`) && cssSource.includes(`url("${browserFontFile}")`),
  },
  {
    label: "export uses agreed Uthmani font file",
    pass: composerSource.includes(`const font = resolve(args.font || "${exportFontFile}")`),
  },
  {
    label: "Quran text uses one shared font family variable",
    pass: cssSource.includes("--quran-font-family") && cssSource.match(/font-family:\s*var\(--quran-font-family\)/g)?.length >= 2,
  },
  {
    label: "export uses matching libass font family",
    pass: composerSource.includes(`const fontName = args["font-name"] || "${exportFontFamily}"`),
  },
  {
    label: "TODO tracks font readiness",
    pass: /خط عثماني/.test(todoSource) && /خط التصدير/.test(todoSource),
  },
];

const failures = checks.filter((check) => !check.pass);

checks.forEach((check) => {
  console.log(`${check.pass ? "PASS" : "FAIL"} ${check.label}`);
});

if (failures.length) {
  process.exit(1);
}
