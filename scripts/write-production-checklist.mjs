#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const outputPath = resolve(args.out || "production-readiness-checklist.md");
const validatorArgs = [
  "scripts/validate-production-assets.mjs",
  "--json",
  ...args.passThrough,
];

const result = spawnSync(process.execPath, validatorArgs, {
  encoding: "utf8",
  windowsHide: true,
});

if (!result.stdout.trim()) {
  console.error(result.stderr || "Production validator did not return a JSON report.");
  process.exit(result.status ?? 1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch (error) {
  console.error("Could not parse production validator JSON output.");
  console.error(error.message);
  process.exit(1);
}

writeFileSync(outputPath, renderChecklist(report), "utf8");
console.log(`Production readiness checklist written: ${outputPath}`);
console.log(`Ready: ${report.ready ? "yes" : "no"} (${report.passed}/${report.total} passed)`);

process.exit(report.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {
    passThrough: [],
  };

  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--out") {
      parsed.out = input[index + 1];
      index += 1;
    } else {
      parsed.passThrough.push(token);
      if (token.startsWith("--") && input[index + 1] && !input[index + 1].startsWith("--")) {
        parsed.passThrough.push(input[index + 1]);
        index += 1;
      }
    }
  }

  return parsed;
}

function renderChecklist(report) {
  const lines = [
    "# Ayah Studio Production Readiness Checklist",
    "",
    `Generated: ${report.generatedAt}`,
    `Ready: ${report.ready ? "yes" : "no"}`,
    `Passed: ${report.passed}/${report.total}`,
    "",
  ];

  report.results.forEach((result) => {
    lines.push(`## ${result.pass ? "[x]" : "[ ]"} ${result.label}`);
    lines.push("");
    lines.push(`- Check id: \`${result.id}\``);
    lines.push(`- Status: ${result.pass ? "PASS" : "FAIL"}`);
    lines.push(`- Command: \`${formatCommand(result.command)}\``);

    if (result.output) {
      lines.push("- Output:");
      lines.push("");
      lines.push("```text");
      lines.push(result.output);
      lines.push("```");
    }

    if (!result.pass && Array.isArray(result.nextSteps) && result.nextSteps.length) {
      lines.push("- Next steps:");
      result.nextSteps.forEach((step) => {
        lines.push(`  - [ ] ${step}`);
      });
    }

    lines.push("");
  });

  return `${lines.join("\n").trim()}\n`;
}

function formatCommand(command) {
  return (command || []).map((part) => {
    const text = String(part);
    return /\s/.test(text) ? `"${text.replaceAll('"', '\\"')}"` : text;
  }).join(" ");
}

function printHelp() {
  console.log(`
Ayah Studio production readiness checklist writer

Usage:
  node scripts/write-production-checklist.mjs --out production-readiness-checklist.md

Options:
  --out FILE                    Markdown output path. Defaults to production-readiness-checklist.md.

All other options are passed through to scripts/validate-production-assets.mjs, for example:
  --quran FILE
  --quran-authority FILE
  --backgrounds FILE
  --font-manifest FILE
  --require-background-files
  --require-font-file
  --project FILE
  --manifest FILE
  --video FILE
  --background FILE
  --font FILE
  --ffmpeg FILE
`);
}
