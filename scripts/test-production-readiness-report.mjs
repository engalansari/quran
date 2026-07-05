#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, [
  "scripts/validate-production-assets.mjs",
  "--json",
], {
  encoding: "utf8",
  windowsHide: true,
});

assert(result.status === 1, "production readiness report should fail until exact transcript recognition is ready");

const report = JSON.parse(result.stdout);
assert(report.ready === false, "report.ready should be false without exact transcript recognition");
assert(Array.isArray(report.results), "report.results must be an array");

const requiredPasses = [
  "quran-data",
  "quran-source-authority",
  "background-catalog",
  "font-manifest",
];

requiredPasses.forEach((id) => {
  const item = report.results.find((entry) => entry.id === id);
  assert(item, `missing ${id} result`);
  assert(item.pass === true, `${id} should pass after Quran source approval`);
});

const recognition = report.results.find((entry) => entry.id === "recognition-engine");
assert(recognition, "missing recognition-engine result");
assert(recognition.pass === false, "recognition-engine should fail until exact transcript matching is complete");
assert(
  recognition.output.includes("asrProvider") || recognition.nextSteps.some((step) => step.includes("ASR") || step.includes("transcript")),
  "recognition failure should mention ASR transcript matching",
);

console.log("PASS Production readiness report test completed.");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
