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
const inputPath = resolve(args.file || "data/quran-uthmani.json");
const data = readJson(inputPath);
const normalized = normalizeQuranData(data);
const report = buildReport(normalized, inputPath);

if (args.json) {
  printJson(report);
} else {
  printReport(report);
}
process.exit(report.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--json") {
      parsed.json = true;
    } else if (token === "--require-reviewed") {
      parsed["require-reviewed"] = true;
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
    if (args.json) {
      printJson({
        report: "Quran data validation",
        generatedAt: new Date().toISOString(),
        path,
        complete: false,
        error: error.message,
      });
      process.exit(1);
    }
    console.error(`Could not read Quran JSON: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function normalizeQuranData(data) {
  const map = new Map();
  const source = normalizeSource(data?.source || data?.metadata?.source || data?.meta?.source || data?.metadata || data?.meta);
  if (Array.isArray(data?.surahs)) {
    data.surahs.forEach((surah) => {
      const number = Number(surah.number ?? surah.id);
      if (!number) return;
      const ayahs = Array.isArray(surah.ayahs) ? surah.ayahs : [];
      map.set(number, ayahs.map((ayah) => typeof ayah === "string" ? ayah : ayah.text || ayah.uthmani || ayah.uthmaniText || ayah.aya_text || ayah.ayaText || ayah.ayahText || ""));
    });
  } else if (Array.isArray(data)) {
    data.forEach((entry) => {
      const surah = Number(fieldOf(entry, ["surah", "surahNumber", "sura", "suraNo", "sora", "soraNo", "chapter", "chapterNumber"]));
      const ayah = Number(fieldOf(entry, ["numberInSurah", "ayah", "ayahNumber", "aya", "ayaNo", "aya_no", "verse", "verseNumber"]));
      const text = entry.text || entry.uthmani || entry.uthmaniText || entry.aya_text || entry.ayaText || entry.ayahText || "";
      if (!surah || !ayah || !text) return;
      const list = map.get(surah) || [];
      list[ayah - 1] = text;
      map.set(surah, list);
    });
  }
  return { map, source };
}

function fieldOf(value, names) {
  if (!value || typeof value !== "object") return undefined;
  for (const name of names) {
    if (value[name] !== undefined) return value[name];
  }

  const normalized = new Map();
  Object.keys(value).forEach((key) => {
    normalized.set(normalizeKey(key), value[key]);
  });

  for (const name of names) {
    const found = normalized.get(normalizeKey(name));
    if (found !== undefined) return found;
  }

  return undefined;
}

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeSource(source) {
  if (!source || typeof source !== "object") return {};
  return {
    name: String(source.name || source.sourceName || source.title || "").trim(),
    url: String(source.url || source.sourceUrl || source.link || "").trim(),
    edition: String(source.edition || source.version || source.release || "").trim(),
    rawSourceFile: String(source.rawSourceFile || "").trim(),
    rawSha256: String(source.rawSha256 || source.sha256 || "").trim(),
    reviewed: source.reviewed === true,
  };
}

function validateSource(source) {
  const issues = [];
  if (!source.name) issues.push("missing source.name");
  if (!looksLikeHttpUrl(source.url)) issues.push("missing or invalid source.url");
  if (!source.edition) issues.push("missing source.edition");
  if (!source.rawSha256) issues.push("missing source.rawSha256");
  if (source.rawSha256 && !/^[a-f0-9]{64}$/i.test(source.rawSha256)) issues.push("invalid source.rawSha256");
  if (args["require-reviewed"] && source.reviewed !== true) issues.push("source.reviewed must be true");
  return {
    ...source,
    documented: issues.filter((issue) => issue !== "source.reviewed must be true").length === 0,
    ready: issues.length === 0,
    requireReviewed: Boolean(args["require-reviewed"]),
    issues,
  };
}

function looksLikeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildReport(normalized, path) {
  const { map, source } = normalized;
  const surahs = quranCatalog.map((surah) => {
    const ayahs = map.get(surah.number) || [];
    const missingAyahs = [];
    for (let index = 0; index < surah.ayahCount; index += 1) {
      if (!ayahs[index]) missingAyahs.push(index + 1);
    }
    return {
      number: surah.number,
      name: surah.name,
      expectedAyahs: surah.ayahCount,
      loadedAyahs: ayahs.filter(Boolean).length,
      complete: missingAyahs.length === 0,
      missingAyahs,
    };
  });
  const loadedAyahs = surahs.reduce((sum, surah) => sum + surah.loadedAyahs, 0);
  const expectedAyahs = surahs.reduce((sum, surah) => sum + surah.expectedAyahs, 0);
  const complete = loadedAyahs === expectedAyahs && surahs.every((surah) => surah.complete);
  const sourceReport = validateSource(source);
  const textReport = validateLoadedText(map);
  return {
    report: "Quran data validation",
    generatedAt: new Date().toISOString(),
    path,
    ready: complete && sourceReport.ready && textReport.ready,
    expectedSurahs: quranCatalog.length,
    loadedSurahs: surahs.filter((surah) => surah.complete).length,
    expectedAyahs,
    loadedAyahs,
    complete,
    source: sourceReport,
    text: textReport,
    incompleteSurahs: surahs.filter((surah) => !surah.complete),
  };
}

function validateLoadedText(map) {
  const issues = [];
  let checkedAyahs = 0;
  for (const [surahNumber, ayahs] of map.entries()) {
    ayahs.forEach((text, index) => {
      if (!text) return;
      checkedAyahs += 1;
      const label = `${surahNumber}:${index + 1}`;
      if (!hasArabicLetter(text)) {
        issues.push(`${label} has no Arabic letters`);
      }
      if (looksLikePlaceholderText(text)) {
        issues.push(`${label} looks like placeholder text`);
      }
    });
  }
  return {
    checkedAyahs,
    ready: issues.length === 0,
    issueCount: issues.length,
    issues: issues.slice(0, 40),
  };
}

function hasArabicLetter(text) {
  return /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(String(text || ""));
}

function looksLikePlaceholderText(text) {
  return /\b(sample|test|lorem|placeholder|dummy|example)\b/i.test(String(text || ""))
    || /نص\s+تجريبي|مثال|اختبار/.test(String(text || ""));
}

function printJson(report) {
  console.log(JSON.stringify(report, null, 2));
}

function printReport(report) {
  console.log(`Quran data validation: ${report.loadedAyahs}/${report.expectedAyahs} ayahs`);
  console.log(`Complete surahs: ${report.loadedSurahs}/${report.expectedSurahs}`);
  if (report.source.ready) {
    console.log(`Source metadata: PASS ${report.source.name} (${report.source.edition})`);
  } else {
    console.log(`Source metadata: FAIL ${report.source.issues.join("; ")}`);
  }
  if (report.text.ready) {
    console.log(`Text quality: PASS ${report.text.checkedAyahs} loaded ayahs checked`);
  } else {
    console.log(`Text quality: FAIL ${report.text.issueCount} issue(s)`);
    report.text.issues.slice(0, 8).forEach((issue) => console.log(`- ${issue}`));
  }
  if (report.ready) {
    console.log("PASS Quran data is complete and source metadata is ready.");
    return;
  }
  if (report.complete) {
    console.log("PASS Quran data is complete by catalog count.");
  } else {
    console.log(`FAIL Missing or incomplete surahs: ${report.incompleteSurahs.length}`);
    report.incompleteSurahs.slice(0, 12).forEach((surah) => {
      const preview = surah.missingAyahs.slice(0, 20).join(", ");
      console.log(`- ${surah.number}. ${surah.name}: ${surah.loadedAyahs}/${surah.expectedAyahs}; missing ${preview}${surah.missingAyahs.length > 20 ? ", ..." : ""}`);
    });
  }
}
