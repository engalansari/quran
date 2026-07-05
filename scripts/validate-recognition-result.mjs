#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const quranCatalog = [
  [1, "الفاتحة", 7], [2, "البقرة", 286], [3, "آل عمران", 200], [4, "النساء", 176],
  [5, "المائدة", 120], [6, "الأنعام", 165], [7, "الأعراف", 206], [8, "الأنفال", 75],
  [9, "التوبة", 129], [10, "يونس", 109], [11, "هود", 123], [12, "يوسف", 111],
  [13, "الرعد", 43], [14, "إبراهيم", 52], [15, "الحجر", 99], [16, "النحل", 128],
  [17, "الإسراء", 111], [18, "الكهف", 110], [19, "مريم", 98], [20, "طه", 135],
  [21, "الأنبياء", 112], [22, "الحج", 78], [23, "المؤمنون", 118], [24, "النور", 64],
  [25, "الفرقان", 77], [26, "الشعراء", 227], [27, "النمل", 93], [28, "القصص", 88],
  [29, "العنكبوت", 69], [30, "الروم", 60], [31, "لقمان", 34], [32, "السجدة", 30],
  [33, "الأحزاب", 73], [34, "سبأ", 54], [35, "فاطر", 45], [36, "يس", 83],
  [37, "الصافات", 182], [38, "ص", 88], [39, "الزمر", 75], [40, "غافر", 85],
  [41, "فصلت", 54], [42, "الشورى", 53], [43, "الزخرف", 89], [44, "الدخان", 59],
  [45, "الجاثية", 37], [46, "الأحقاف", 35], [47, "محمد", 38], [48, "الفتح", 29],
  [49, "الحجرات", 18], [50, "ق", 45], [51, "الذاريات", 60], [52, "الطور", 49],
  [53, "النجم", 62], [54, "القمر", 55], [55, "الرحمن", 78], [56, "الواقعة", 96],
  [57, "الحديد", 29], [58, "المجادلة", 22], [59, "الحشر", 24], [60, "الممتحنة", 13],
  [61, "الصف", 14], [62, "الجمعة", 11], [63, "المنافقون", 11], [64, "التغابن", 18],
  [65, "الطلاق", 12], [66, "التحريم", 12], [67, "الملك", 30], [68, "القلم", 52],
  [69, "الحاقة", 52], [70, "المعارج", 44], [71, "نوح", 28], [72, "الجن", 28],
  [73, "المزمل", 20], [74, "المدثر", 56], [75, "القيامة", 40], [76, "الإنسان", 31],
  [77, "المرسلات", 50], [78, "النبأ", 40], [79, "النازعات", 46], [80, "عبس", 42],
  [81, "التكوير", 29], [82, "الانفطار", 19], [83, "المطففين", 36], [84, "الانشقاق", 25],
  [85, "البروج", 22], [86, "الطارق", 17], [87, "الأعلى", 19], [88, "الغاشية", 26],
  [89, "الفجر", 30], [90, "البلد", 20], [91, "الشمس", 15], [92, "الليل", 21],
  [93, "الضحى", 11], [94, "الشرح", 8], [95, "التين", 8], [96, "العلق", 19],
  [97, "القدر", 5], [98, "البينة", 8], [99, "الزلزلة", 8], [100, "العاديات", 11],
  [101, "القارعة", 11], [102, "التكاثر", 8], [103, "العصر", 3], [104, "الهمزة", 9],
  [105, "الفيل", 5], [106, "قريش", 4], [107, "الماعون", 7], [108, "الكوثر", 3],
  [109, "الكافرون", 6], [110, "النصر", 3], [111, "المسد", 5], [112, "الإخلاص", 4],
  [113, "الفلق", 5], [114, "الناس", 6],
].map(([number, name, ayahCount]) => ({ number, name, ayahCount }));

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.file) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const minConfidence = Number(args["min-confidence"] ?? 0.8);
const filePath = resolve(args.file);
const data = readJson(filePath);
const report = validateRecognitionResult(data, {
  minConfidence,
  requireExactMatch: Boolean(args["require-exact-match"]),
});

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
    } else if (token === "--require-exact-match") {
      parsed["require-exact-match"] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read recognition result: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateRecognitionResult(data, options) {
  const result = data?.result || data || {};
  const engine = data?.engine || {};
  const issues = [];
  const status = String(result.status || "unique").trim();
  const candidates = Array.isArray(result.candidates) ? result.candidates : [];
  const surahNumber = Number(result.surahNumber || result.surah);
  const ayahStart = Number(result.ayahStart || result.startAyah);
  const ayahCount = Number(result.ayahCount || 1);
  const confidence = Number(result.confidence);
  const surah = quranCatalog.find((item) => item.number === surahNumber);
  const segments = Array.isArray(result.segments) ? result.segments : [];
  const ambiguous = status === "ambiguous";

  if (!String(engine.name || "").trim()) issues.push("missing engine.name");
  if (!String(engine.provider || "").trim()) issues.push("missing engine.provider");
  if (!String(engine.version || "").trim()) issues.push("missing engine.version");
  if (!["unique", "ambiguous"].includes(status)) issues.push("result.status must be unique or ambiguous");
  if (ambiguous) {
    validateCandidates(candidates, issues);
  } else {
    if (!surah) issues.push("result.surahNumber must be between 1 and 114");
    if (!Number.isInteger(ayahStart) || ayahStart < 1) issues.push("result.ayahStart must be a positive integer");
    if (!Number.isInteger(ayahCount) || ayahCount < 1) issues.push("result.ayahCount must be a positive integer");
    if (surah && ayahStart + ayahCount - 1 > surah.ayahCount) {
      issues.push(`result ayah range exceeds ${surah.name} (${surah.ayahCount} ayahs)`);
    }
  }
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    issues.push("result.confidence must be between 0 and 1");
  } else if (!ambiguous && confidence < options.minConfidence) {
    issues.push(`result.confidence must be at least ${options.minConfidence}`);
  }
  if (!String(result.method || "").trim()) issues.push("missing result.method");
  if (options.requireExactMatch) {
    if (ambiguous) issues.push("ambiguous recognition candidates cannot be applied as an exact match");
    if (result.exactMatch !== true) issues.push("result.exactMatch must be true for Quran selection handoff");
    if (confidence !== 1) issues.push("result.confidence must be exactly 1 when exact match is required");
    if (!String(result.matchEvidence?.method || "").trim()) issues.push("missing result.matchEvidence.method for exact match");
    if (!String(result.matchEvidence?.description || "").trim()) issues.push("missing result.matchEvidence.description for exact match");
  }
  if (result.requiresManualConfirmation !== true) {
    issues.push("result.requiresManualConfirmation must be true");
  }
  if (segments.length) validateSegments(segments, { surah, ayahStart, ayahCount, issues });

  return {
    report: "Ayah Studio recognition result validation",
    ready: issues.length === 0,
    minConfidence: options.minConfidence,
    requireExactMatch: options.requireExactMatch,
    result: {
      surahNumber,
      surahName: surah?.name || "",
      ayahStart,
      ayahCount,
      confidence: Number.isFinite(confidence) ? confidence : null,
      method: String(result.method || "").trim(),
      status,
      requiresManualConfirmation: result.requiresManualConfirmation === true,
      segmentCount: segments.length,
      candidateCount: candidates.length,
    },
    issues,
  };
}

function validateCandidates(candidates, issues) {
  if (candidates.length < 2) issues.push("ambiguous result must include at least two candidates");
  candidates.forEach((candidate, index) => {
    const label = `candidate ${index + 1}`;
    const surahNumber = Number(candidate.surahNumber || candidate.surah);
    const ayahStart = Number(candidate.ayahStart || candidate.startAyah);
    const ayahCount = Number(candidate.ayahCount || 1);
    const surah = quranCatalog.find((item) => item.number === surahNumber);
    if (!surah) issues.push(`${label} surahNumber must be between 1 and 114`);
    if (!Number.isInteger(ayahStart) || ayahStart < 1) issues.push(`${label} ayahStart must be a positive integer`);
    if (!Number.isInteger(ayahCount) || ayahCount < 1) issues.push(`${label} ayahCount must be a positive integer`);
    if (surah && ayahStart + ayahCount - 1 > surah.ayahCount) {
      issues.push(`${label} ayah range exceeds ${surah.name} (${surah.ayahCount} ayahs)`);
    }
  });
}

function validateSegments(segments, context) {
  let lastEnd = -1;
  segments.forEach((segment, index) => {
    const label = `segment ${index + 1}`;
    const ayahNumber = Number(segment.ayahNumber || segment.ayah);
    const start = Number(segment.start);
    const end = Number(segment.end);
    const confidence = Number(segment.confidence);
    if (!Number.isInteger(ayahNumber)) context.issues.push(`${label} missing ayahNumber`);
    if (context.surah && (ayahNumber < context.ayahStart || ayahNumber >= context.ayahStart + context.ayahCount)) {
      context.issues.push(`${label} ayahNumber is outside the recognized range`);
    }
    if (!Number.isFinite(start) || start < 0) context.issues.push(`${label} start must be >= 0`);
    if (!Number.isFinite(end) || end <= start) context.issues.push(`${label} end must be after start`);
    if (Number.isFinite(start) && start < lastEnd) context.issues.push(`${label} overlaps previous segment`);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      context.issues.push(`${label} confidence must be between 0 and 1`);
    }
    if (Number.isFinite(end)) lastEnd = end;
  });
}

function printReport(report) {
  console.log(`Recognition result validation: ${report.ready ? "ready" : "not ready"}`);
  console.log(`Status: ${report.result.status}`);
  console.log(`Selection: ${report.result.surahName || "missing"} ${report.result.ayahStart || "?"}`);
  if (report.result.status === "ambiguous") console.log(`Candidates: ${report.result.candidateCount}`);
  console.log(`Confidence: ${report.result.confidence ?? "missing"} (minimum ${report.minConfidence})`);
  if (report.requireExactMatch) console.log("Exact match required: yes");
  if (report.ready) {
    console.log("PASS Recognition result is structurally ready for manual confirmation.");
    return;
  }
  console.log("FAIL Recognition result needs fixes before it can be reviewed.");
  report.issues.forEach((issue) => console.log(`- ${issue}`));
}

function printHelp() {
  console.log(`
Ayah Studio recognition result validator

Usage:
  node scripts/validate-recognition-result.mjs --file recognition-result.json

Options:
  --file FILE              Recognition result JSON.
  --min-confidence NUMBER  Minimum accepted confidence. Defaults to 0.8.
  --require-exact-match    Require exactMatch:true, confidence:1, and match evidence.
  --json                   Print a machine-readable report.

This validates the output contract from an external recognition engine. It does not replace manual confirmation or allow approximate Quran selection.
`.trim());
}
