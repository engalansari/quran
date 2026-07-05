#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const candidates = buildCandidates(args);
const checked = candidates.map(checkCandidate);
const working = checked.find((item) => item.versionWorks);
const report = {
  report: "Ayah Studio FFmpeg discovery",
  ready: Boolean(working?.hasSubtitlesFilter),
  selected: working || null,
  checked,
  nextSteps: buildNextSteps(working),
};

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}

process.exit(report.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--json") {
      parsed.json = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function buildCandidates(options) {
  const values = [
    options.ffmpeg,
    process.env.FFMPEG,
    "tools\\ffmpeg\\ffmpeg-master-latest-win64-gpl\\bin\\ffmpeg.exe",
    "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe",
    "ffmpeg",
    "ffmpeg.exe",
    "C:\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
    "C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe",
    join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg*", "ffmpeg.exe"),
  ];
  return [...new Set(values.filter(Boolean).map((value) => String(value).trim()))];
}

function checkCandidate(candidate) {
  const isPath = /[\\/]/.test(candidate) || /^[A-Za-z]:/.test(candidate);
  const exists = isPath ? existsSync(resolve(candidate)) : null;
  const version = spawn(candidate, ["-version"]);
  const filters = version.status === 0 ? spawn(candidate, ["-hide_banner", "-filters"]) : { status: 1, output: "" };
  const hasSubtitlesFilter = filters.status === 0
    && filters.output.split(/\r?\n/).some((line) => line.trim().split(/\s+/).includes("subtitles"));
  return {
    candidate,
    exists,
    versionWorks: version.status === 0,
    versionLine: firstLine(version.output),
    hasSubtitlesFilter,
  };
}

function spawn(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    encoding: "utf8",
    shell: process.platform === "win32" && /\.(cmd|bat)$/i.test(command),
    windowsHide: true,
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

function firstLine(text) {
  return String(text || "").split(/\r?\n/).find(Boolean) || "";
}

function buildNextSteps(working) {
  if (working?.hasSubtitlesFilter) {
    return [
      `Use this executable with MP4 commands: --ffmpeg "${working.candidate}"`,
      "Run: node scripts\\test-mp4-render-smoke.mjs",
    ];
  }
  if (working) {
    return [
      "Install or choose an FFmpeg build with the subtitles/libass filter.",
      `Current executable responds but is not ready for ASS overlays: ${working.candidate}`,
    ];
  }
  return [
    "Install FFmpeg, then restart the terminal so PATH is refreshed.",
    "Windows winget: winget install Gyan.FFmpeg",
    "Windows Chocolatey: choco install ffmpeg",
    "Or set FFMPEG to the full ffmpeg.exe path before running Ayah Studio scripts.",
  ];
}

function printReport(report) {
  console.log(`FFmpeg discovery: ${report.ready ? "ready" : "not ready"}`);
  if (report.selected) {
    console.log(`Selected: ${report.selected.candidate}`);
    console.log(`Version: ${report.selected.versionLine || "unknown"}`);
    console.log(`Subtitles filter: ${report.selected.hasSubtitlesFilter ? "yes" : "no"}`);
  } else {
    console.log("Selected: none");
  }
  console.log("Checked:");
  report.checked.forEach((item) => {
    console.log(`- ${item.candidate}: ${item.versionWorks ? "works" : "not found"}${item.hasSubtitlesFilter ? ", subtitles=yes" : ""}`);
  });
  console.log("Next steps:");
  report.nextSteps.forEach((step) => console.log(`- ${step}`));
}

function printHelp() {
  console.log(`
Ayah Studio FFmpeg discovery

Usage:
  node scripts/find-ffmpeg.mjs

Options:
  --ffmpeg FILE  Check this executable first.
  --json         Print a machine-readable report.

This finds an FFmpeg executable and confirms the subtitles/libass filter needed for ASS ayah overlays.
`.trim());
}
