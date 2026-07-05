#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const checks = [
  {
    id: "quran-data",
    label: "Reviewed Quran data",
    command: [process.execPath, "scripts/validate-quran-data.mjs", "--file", args.quran || "data/quran-uthmani.json", "--require-reviewed"],
  },
  {
    id: "quran-source-authority",
    label: "Reviewed Quran source authority",
    command: [
      process.execPath,
      "scripts/validate-quran-source-authority.mjs",
      "--file",
      args.quranAuthority || args["quran-authority"] || "data/quran-source-authority.quranenc.example.json",
      "--require-reviewed",
    ],
  },
  {
    id: "background-catalog",
    label: "Licensed background catalog",
    command: [
      process.execPath,
      "scripts/validate-background-catalog.mjs",
      "--file",
      args.backgrounds || "assets/licensed-backgrounds.example.json",
      ...(args["require-background-files"] ? ["--require-files"] : []),
    ],
  },
  {
    id: "font-manifest",
    label: "Reviewed Quran font manifest",
    command: [
      process.execPath,
      "scripts/validate-font-manifest.mjs",
      "--file",
      args.fontManifest || args["font-manifest"] || "assets/quran-font.example.json",
      ...(args["require-font-file"] ? ["--require-file"] : []),
    ],
  },
  {
    id: "recognition-engine",
    label: "Reviewed recognition engine",
    command: [
      process.execPath,
      "scripts/validate-recognition-manifest.mjs",
      "--file",
      args.recognition || args["recognition-manifest"] || "assets/recognition-engine.example.json",
      ...(args["require-recognition-model"] ? ["--require-model-file"] : []),
    ],
  },
];

if (args.manifest) {
  checks.push({
    id: "export-manifest",
    label: "Export manifest handoff",
    command: [process.execPath, "scripts/validate-export-manifest.mjs", "--file", args.manifest],
  });
}

if (args.project) {
  checks.push({
    id: "mp4-readiness",
    label: "MP4 readiness audit",
    command: [
      process.execPath,
      "scripts/audit-readiness.mjs",
      "--project",
      args.project,
      ...(args.manifest ? ["--manifest", args.manifest] : []),
      ...(args.video ? ["--video", args.video] : []),
      ...(args.background ? ["--background", args.background] : []),
      ...(args.font ? ["--font", args.font] : []),
      "--font-manifest",
      args.fontManifest || args["font-manifest"] || "assets/quran-font.example.json",
      ...(args.ffmpeg ? ["--ffmpeg", args.ffmpeg] : []),
    ],
  });
}

const results = checks.map(runCheck);
const summary = buildSummary(results);
if (args.json) {
  printJson(summary);
} else {
  printSummary(summary);
}
process.exit(summary.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--require-background-files" || token === "--require-font-file" || token === "--require-recognition-model" || token === "--json") {
      parsed[token.slice(2)] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function runCheck(check) {
  const result = spawnSync(check.command[0], check.command.slice(1), {
    encoding: "utf8",
    windowsHide: true,
  });
  const pass = result.status === 0;
  return {
    id: check.id,
    label: check.label,
    command: check.command.map((part) => String(part)),
    pass,
    status: result.status ?? 1,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
    nextSteps: pass ? [] : nextStepsFor(check.id, args),
  };
}

function buildSummary(results) {
  const passed = results.filter((result) => result.pass).length;
  return {
    report: "Ayah Studio production asset validation",
    generatedAt: new Date().toISOString(),
    ready: passed === results.length,
    passed,
    total: results.length,
    results,
  };
}

function printJson(summary) {
  console.log(JSON.stringify(summary, null, 2));
}

function printSummary(summary) {
  const { results } = summary;
  console.log("Ayah Studio production asset validation");
  console.log(`Passed: ${summary.passed}/${summary.total}`);
  results.forEach((result) => {
    console.log(`\n${result.pass ? "PASS" : "FAIL"} ${result.id}: ${result.label}`);
    if (result.output) {
      console.log(indent(result.output));
    }
    if (!result.pass && result.nextSteps.length) {
      console.log("  Next steps:");
      result.nextSteps.forEach((step) => {
        console.log(`  - ${step}`);
      });
    }
  });
}

function indent(text) {
  return text
    .split(/\r?\n/)
    .map((line) => `  ${line}`)
    .join("\n");
}

function nextStepsFor(id, options) {
  const quranFile = options.quran || "data/quran-uthmani.json";
  const sourceFile = "data\\source\\king-fahd-quran-source.json";
  const quranAuthority = options.quranAuthority || options["quran-authority"] || "data/quran-source-authority.quranenc.example.json";
  const backgroundsFile = options.backgrounds || "assets/licensed-backgrounds.example.json";
  const fontManifest = options.fontManifest || options["font-manifest"] || "assets/quran-font.example.json";
  const recognitionManifest = options.recognition || options["recognition-manifest"] || "assets/recognition-engine.example.json";

  if (id === "quran-data") {
    return [
      "Refresh the current QuranEnc source if needed: node scripts\\fetch-quranenc-uthmani.mjs",
      `Run: node scripts\\validate-quran-data.mjs --file ${quranFile}`,
      `Write review evidence: node scripts\\write-quran-source-review-report.mjs --quran ${quranFile} --authority ${quranAuthority}`,
      `After human comparison, run: node scripts\\mark-quran-source-reviewed.mjs --file ${quranFile} --reviewed-by "Reviewer Name" --review-note "Compared against the trusted Mushaf source."`,
    ];
  }

  if (id === "quran-source-authority") {
    return [
      `Fill and review the trusted Quran source authority manifest: ${quranAuthority}.`,
      `Run: node scripts\\validate-quran-source-authority.mjs --file ${quranAuthority} --source-url "https://quranenc.com/api/v1/translation/sura/english_saheeh/1"`,
      "Set authority.reviewed:true only after confirming the exact trusted API/source channel.",
    ];
  }

  if (id === "background-catalog") {
    return [
      `Fill real sourceName, sourceUrl, license, reviewed:true, and exportReady:true in ${backgroundsFile}.`,
      "Use production image/video files with clear usage rights, then rerun with --require-background-files when local file paths are final.",
      `Run: node scripts\\validate-background-catalog.mjs --file ${backgroundsFile}`,
    ];
  }

  if (id === "font-manifest") {
    return [
      `Fill font sourceName, sourceUrl, license, reviewed:true, and exportReady:true in ${fontManifest}.`,
      "Put the approved Quran font file in the path referenced by the manifest.",
      `Run: node scripts\\validate-font-manifest.mjs --file ${fontManifest} --require-file`,
    ];
  }

  if (id === "recognition-engine") {
    return [
      "Select and validate an Arabic Quran ASR provider that can transcribe recitation audio.",
      "Use the first 7 seconds for the first transcript match, then extend the analysis window when no unique match is found.",
      "Run transcript matching with: node scripts\\match-quran-transcript.mjs --quran data\\quran-uthmani.json --transcript \"TRANSCRIBED_TEXT\" --analyzed-seconds 7 --json",
      "If multiple candidates are returned, show them for user choice and do not select automatically.",
      `Run: node scripts\\validate-recognition-manifest.mjs --file ${recognitionManifest}`,
      "Do not allow approximate or nearest-match Quran selection.",
    ];
  }

  if (id === "export-manifest") {
    return [
      "Export a fresh manifest from Ayah Studio after Quran text, background licensing, and font metadata are complete.",
      "Make sure every required input has a real file path before handing it to the MP4 renderer.",
    ];
  }

  if (id === "mp4-readiness") {
    return [
      "Install FFmpeg or pass its executable with --ffmpeg.",
      "Pass real files with --project, --manifest, --video, --background, and --font.",
      "Confirm the FFmpeg build supports the subtitles filter/libass before final rendering.",
    ];
  }

  return ["Fix the reported validation errors, then rerun this command."];
}

function printHelp() {
  console.log(`
Ayah Studio production asset validator

Usage:
  node scripts/validate-production-assets.mjs

Options:
  --quran FILE                  Quran JSON file. Defaults to data/quran-uthmani.json.
  --quran-authority FILE        Trusted Quran source authority manifest.
  --backgrounds FILE            Licensed background catalog JSON.
  --font-manifest FILE          Quran font manifest JSON.
  --recognition-manifest FILE   Recognition engine manifest JSON.
  --require-background-files    Require referenced background files to exist locally.
  --require-font-file           Require the referenced font file to exist locally.
  --require-recognition-model   Require the referenced recognition model file to exist locally.
  --project FILE                Also run MP4 readiness audit for a project JSON.
  --manifest FILE               Export manifest JSON for MP4 audit.
  --video FILE                  Source recitation video for MP4 audit.
  --background FILE             Background media for MP4 audit.
  --font FILE                   Quran font file for MP4 audit.
  --ffmpeg FILE                 FFmpeg executable for MP4 audit.
  --json                        Print a machine-readable JSON report.
`);
}
