#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const checks = [
  {
    label: "syntax app",
    args: ["--check", "app.js"],
  },
  {
    label: "syntax mobile backend server",
    args: ["--check", "scripts/serve-mobile-backend.mjs"],
  },
  {
    label: "syntax recitation audio downloader",
    args: ["--check", "scripts/download-recitation-audio.mjs"],
  },
  {
    label: "syntax selected ayah video composer",
    args: ["--check", "scripts/compose-selected-ayah-video.mjs"],
  },
  {
    label: "generator UI policy",
    args: ["scripts/test-generator-ui-policy.mjs"],
  },
  {
    label: "static video range support",
    args: ["scripts/test-static-video-range.mjs"],
  },
  {
    label: "background library",
    args: ["scripts/test-background-library.mjs"],
  },
  {
    label: "background catalog UX readiness",
    args: ["scripts/test-background-catalog-ux.mjs"],
  },
  {
    label: "background source audit",
    args: ["scripts/audit-background-sources.mjs"],
  },
  {
    label: "background source filter",
    args: ["scripts/test-background-source-filter.mjs"],
  },
  {
    label: "backend background readiness",
    args: ["scripts/test-backend-background-readiness.mjs"],
  },
  {
    label: "quran data pipeline",
    args: ["scripts/test-quran-data-pipeline.mjs"],
  },
  {
    label: "ffmpeg discovery",
    args: ["scripts/test-find-ffmpeg.mjs"],
  },
  {
    label: "mp4 render smoke",
    args: ["scripts/test-mp4-render-smoke.mjs"],
  },
];

const failures = [];

checks.forEach((check) => {
  const result = spawnSync(process.execPath, check.args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  if (result.status === 0) {
    console.log(`PASS ${check.label}`);
    printOutput(result);
    return;
  }

  failures.push(check.label);
  console.log(`FAIL ${check.label}`);
  printOutput(result);
});

if (failures.length) {
  console.log(`\nFailed checks: ${failures.join(", ")}`);
  process.exit(1);
}

console.log("\nPASS Ayah Studio generator checks completed.");

function printOutput(result) {
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  if (!output) return;
  console.log(
    output
      .split(/\r?\n/)
      .map((line) => `  ${line}`)
      .join("\n")
  );
}
