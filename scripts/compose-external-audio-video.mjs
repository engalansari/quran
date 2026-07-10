#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.audio) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const audioInput = resolve(args.audio);
const background = resolve(args.background || "assets/production/nature.mp4");
const quranPath = resolve(args.quran || "data/quran-uthmani.json");
const font = resolve(args.font || "assets/fonts/hafs.18.ttf");
const out = resolve(args.out || `outputs/external-audio-${Date.now()}.mp4`);
const workDir = resolve(args["work-dir"] || "outputs/work");
const ffmpeg = executableArg(args.ffmpeg, process.env.FFMPEG, "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe", "ffmpeg");
const ffprobe = executableArg(args.ffprobe, process.env.FFPROBE, "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe", "ffprobe");
const fontName = args["font-name"] || "KFGQPC HAFS Uthmanic Script";
const accountName = args.account || "@tilawat_alquran30";
const reciterName = cleanText(args["reciter-name"] || "");
const surah = numberArg(args.surah || 0);
const ayahStart = numberArg(args["ayah-start"] || 0);
const ayahCount = numberArg(args["ayah-count"] || 0);

const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس",
];

for (const [path, label] of [[audioInput, "audio/video input"], [background, "background"], [font, "font"]]) {
  if (!existsSync(path)) fail(`Missing ${label}: ${path}`);
}
for (const [command, label] of [[ffmpeg, "FFmpeg"], [ffprobe, "FFprobe"]]) {
  if (!commandWorks(command)) fail(`Missing ${label}: ${command}`);
}

mkdirSync(dirname(out), { recursive: true });
mkdirSync(workDir, { recursive: true });

const audioPath = resolve(workDir, `external-audio-${Date.now()}.m4a`);
const subtitlePath = out.replace(/\.mp4$/i, ".ayahs.ass");

run(ffmpeg, [
  "-y",
  "-hide_banner",
  "-loglevel", "error",
  "-i", audioInput,
  "-map", "0:a:0",
  "-vn",
  "-c:a", "aac",
  "-b:a", "192k",
  audioPath,
]);

const duration = probeDuration(audioPath);
const schedule = buildOptionalSchedule(duration);
const meta = {
  accountName,
  reciterName: cleanOverlayName(reciterName),
  riwayah: schedule.length ? "صوت خارجي" : "",
  reference: schedule.length ? referenceLabel(surah, ayahStart, ayahCount) : "",
};
writeSubtitleFile(subtitlePath, schedule, meta, duration);

run(ffmpeg, [
  "-y",
  "-hide_banner",
  "-stream_loop", "-1",
  "-i", background,
  "-i", audioPath,
  "-filter_complex", buildVideoFilter(subtitlePath, dirname(font), schedule),
  "-map", "[vout]",
  "-map", "1:a:0",
  "-c:v", "libx264",
  "-profile:v", "high",
  "-level", "4.1",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "192k",
  "-t", formatSeconds(duration),
  "-shortest",
  "-movflags", "+faststart",
  out,
]);

console.log(JSON.stringify({
  ready: true,
  mode: "external-audio",
  out: relativePath(out),
  subtitles: relativePath(subtitlePath),
  audio: relativePath(audioPath),
  duration: round(duration),
  reciterName,
  surah: schedule.length ? surah : null,
  surahName: schedule.length ? surahName(surah) : "",
  ayahStart: schedule.length ? ayahStart : null,
  ayahCount: schedule.length ? ayahCount : null,
  schedule,
}, null, 2));

function buildOptionalSchedule(duration) {
  if (!surah || !ayahStart || !ayahCount) return [];
  const quran = readJson(quranPath);
  const ayahs = selectedAyahs(quran, surah, ayahStart, ayahCount);
  const slice = duration / ayahs.length;
  return ayahs.map((ayah, index) => ({
    surah,
    ayah: ayah.ayah,
    start: round(index * slice),
    end: round(index === ayahs.length - 1 ? duration : (index + 1) * slice),
    text: ayah.text,
  }));
}

function selectedAyahs(quran, surahNumber, start, count) {
  const surahData = quran.surahs?.find((item) => Number(item.number) === surahNumber);
  if (!surahData) fail(`Surah ${surahNumber} was not found in ${quranPath}.`);
  const ayahs = [];
  for (let offset = 0; offset < count; offset += 1) {
    const ayahNumber = start + offset;
    const ayah = surahData.ayahs?.find((item) => Number(item.number) === ayahNumber);
    if (!ayah?.text) fail(`Ayah ${surahNumber}:${ayahNumber} was not found in ${quranPath}.`);
    ayahs.push({ ayah: ayahNumber, text: ayah.text });
  }
  return ayahs;
}

function writeSubtitleFile(path, schedule, meta, duration) {
  const start = "0:00:00.00";
  const end = formatAssTime(Math.max(duration, 1));
  const fixedEvents = [
    `Dialogue: 1,${start},${end},Account,,0,0,0,,${escapeAssText(meta.accountName)}`,
    meta.reciterName ? `Dialogue: 1,${start},${end},MetaReciter,,0,0,0,,${escapeAssText(meta.reciterName)}` : "",
    meta.reference ? `Dialogue: 1,${start},${end},MetaReference,,0,0,0,,${escapeAssText(meta.reference)}` : "",
    meta.riwayah ? `Dialogue: 1,${start},${end},MetaRiwayah,,0,0,0,,${escapeAssText(meta.riwayah)}` : "",
  ].filter(Boolean);
  const events = schedule.flatMap((item) => {
    const layout = ayahTextLayout(item.text || "");
    return [
      roundedAyahBoxDialogue(item, layout),
      `Dialogue: 1,${formatAssTime(item.start)},${formatAssTime(item.end)},Ayah,,0,0,0,,${ayahTextDialogueOverride(layout, item.text)}${wrapAssText(item.text)}`,
    ];
  });
  const body = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: AyahBox,Arial,20,&H66171909,&H66171909,&H99E8F8FF,&H00000000,0,0,0,0,100,100,0,0,1,3,0,7,0,0,0,1",
    `Style: Ayah,${fontName},88,&H00FFF8E8,&H00FFF8E8,&H88000000,&H66000000,1,0,0,0,103,103,0,0,1,2,1,8,92,92,620,1`,
    "Style: Account,Segoe UI,54,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,0,0,0,0,100,100,0,0,3,10,0,7,54,54,132,1",
    "Style: MetaReciter,Segoe UI,72,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,3,12,0,2,90,90,410,1",
    "Style: MetaReference,Segoe UI,64,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,3,12,0,2,150,150,320,1",
    "Style: MetaRiwayah,Segoe UI,50,&H00BFF1FF,&H00BFF1FF,&H66143B35,&H66143B35,1,0,0,0,100,100,0,0,3,10,0,2,300,300,240,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...fixedEvents,
    ...events,
    "",
  ].join("\n");
  writeFileSync(path, body, "utf8");
}

function buildVideoFilter(subtitlePath, fontsDir, schedule) {
  return [
    [
      "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
      "format=yuv420p[base]",
    ].join(","),
    `[base]subtitles='${escapeFilter(subtitlePath)}':fontsdir='${escapeFilter(fontsDir)}'[vout]`,
  ].join(";");
}

function textBoxFilter(item) {
  const { x, y, width, height } = ayahTextLayout(item.text || "");
  const start = Number(item.start).toFixed(2);
  const end = Number(item.end).toFixed(2);
  const enable = `enable='between(t,${start},${end})'`;
  return [
    `drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=0x091917@0.62:t=fill:${enable}`,
    `drawbox=x=${x}:y=${y}:w=${width}:h=${height}:color=0xfff8e8@0.28:t=3:${enable}`,
  ].join(",");
}

function roundedAyahBoxDialogue(item, layout) {
  const start = formatAssTime(item.start);
  const end = formatAssTime(item.end);
  const path = roundedRectPath(layout.width, layout.height, 24);
  return `Dialogue: 0,${start},${end},AyahBox,,0,0,0,,{\\p1\\an7\\pos(${layout.x},${layout.y})}${path}`;
}

function ayahTextDialogueOverride(layout, value = "") {
  const shortText = cleanQuranTextLength(value) <= 12;
  const visualCenterOffset = shortText ? Math.round(layout.fontSize * 0.16) : 0;
  const centerX = Math.round(layout.x + layout.width / 2 + visualCenterOffset);
  const centerY = Math.round(layout.y + layout.height / 2);
  return `{\\q2\\an5\\pos(${centerX},${centerY})\\fs${layout.fontSize}\\bord2\\shad1}`;
}

function roundedRectPath(width, height, radius) {
  const w = Math.round(width);
  const h = Math.round(height);
  const r = Math.min(Math.round(radius), Math.floor(w / 2), Math.floor(h / 2));
  const c = Math.round(r * 0.5523);
  return [
    `m ${r} 0`,
    `l ${w - r} 0`,
    `b ${w - r + c} 0 ${w} ${r - c} ${w} ${r}`,
    `l ${w} ${h - r}`,
    `b ${w} ${h - r + c} ${w - r + c} ${h} ${w - r} ${h}`,
    `l ${r} ${h}`,
    `b ${r - c} ${h} 0 ${h - r + c} 0 ${h - r}`,
    `l 0 ${r}`,
    `b 0 ${r - c} ${r - c} 0 ${r} 0`,
  ].join(" ");
}

function ayahTextLayout(value) {
  const lines = wrappedLines(value);
  const fontSize = fontSizeForText(value);
  const width = ayahBoxWidth(lines, fontSize);
  const shortText = cleanQuranTextLength(value) <= 12 && lines.length <= 1;
  const height = clamp(Math.round(lines.length * fontSize * 1.08 + (shortText ? 60 : 128)), shortText ? 200 : 220, 980);
  const x = Math.round((1080 - width) / 2);
  const y = clamp(Math.round(760 - height / 2), 300, 700);
  return { x, y, width, height, fontSize, textY: y + 48 };
}

function ayahBoxWidth(lines, fontSize) {
  const longest = Math.max(0, ...lines.map((line) => cleanQuranTextLength(line)));
  const minimum = longest <= 12 && lines.length <= 1 ? 240 : longest <= 28 && lines.length <= 1 ? 380 : 520;
  const padding = longest <= 12 && lines.length <= 1 ? 96 : longest <= 28 && lines.length <= 1 ? 150 : 180;
  return clamp(Math.round(longest * fontSize * 0.24 + padding), minimum, 948);
}

function fontSizeForText(value) {
  const lines = wrappedLines(value);
  const length = cleanQuranTextLength(value);
  if (length <= 12 && lines.length <= 1) return 164;
  if (length <= 28 && lines.length <= 1) return 108;
  if (lines.length <= 1) return 108;
  if (lines.length <= 2) return 100;
  if (lines.length <= 3) return 90;
  if (lines.length <= 4) return 84;
  return 78;
}

function wrappedLines(value) {
  const words = String(value).replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > 56 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function cleanQuranTextLength(value) {
  return String(value || "")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\s+/g, "")
    .length;
}

function probeDuration(file) {
  const result = spawnSync(ffprobe, [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=nokey=1:noprint_wrappers=1",
    file,
  ], { encoding: "utf8", windowsHide: true });
  const duration = Number(String(result.stdout || "").trim());
  if (!Number.isFinite(duration) || duration <= 0) fail(`Could not read duration for ${file}.`);
  return duration;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: "inherit", windowsHide: true });
  if ((result.status ?? 1) !== 0) fail(`Command failed: ${command} ${commandArgs.join(" ")}`);
}

function executableArg(explicitValue, envValue, localPath, commandName) {
  if (explicitValue) return resolve(explicitValue);
  if (envValue) return /[\\/]/.test(envValue) || /^[A-Za-z]:/.test(envValue) ? resolve(envValue) : envValue;
  const resolvedLocal = resolve(localPath);
  return existsSync(resolvedLocal) ? resolvedLocal : commandName;
}

function commandWorks(command) {
  const result = spawnSync(command, ["-version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  return (result.status ?? 1) === 0;
}

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
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
    fail(`Could not read JSON ${path}: ${error.message}`);
  }
}

function numberArg(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function referenceLabel(surahNumber, start, count) {
  const first = start;
  const last = start + count - 1;
  return `${surahName(surahNumber)} ${first === last ? first : `\u200e${last}-${first}\u200e`}`;
}

function surahName(number) {
  return SURAH_NAMES[number - 1] || `سورة ${number}`;
}

function wrapAssText(value) {
  return wrappedLines(value).map(escapeAssText).join("\\N");
}

function escapeAssText(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("{", "\\{").replaceAll("}", "\\}");
}

function formatAssTime(value) {
  const total = Math.max(0, Number(value) || 0);
  const rounded = Math.round(total * 100);
  const hours = Math.floor(rounded / 360000);
  const minutes = Math.floor((rounded % 360000) / 6000);
  const seconds = Math.floor((rounded % 6000) / 100);
  const centiseconds = rounded % 100;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function escapeFilter(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(":", "\\:").replaceAll("'", "\\'");
}

function cleanText(value) {
  return String(value || "").replace(/[\x00-\x1F<>|]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

function cleanOverlayName(value) {
  return String(value || "").split(" - ")[0].trim();
}

function formatSeconds(value) {
  return Math.max(0, Number(value) || 0).toFixed(3);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function relativePath(path) {
  return relative(process.cwd(), resolve(path)).replaceAll("\\", "/");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Compose a Quran vertical video from an uploaded external audio/video file.

Usage:
  node scripts/compose-external-audio-video.mjs --audio upload.mp4 --background assets/production/makkah.mp4 --out outputs/external.mp4

Options:
  --audio FILE          Uploaded audio/video input. First audio stream is used.
  --background FILE     Background video.
  --reciter-name TEXT   Optional reciter name overlay.
  --surah NUMBER        Optional surah number for Quran text overlay.
  --ayah-start NUMBER   Optional first ayah number.
  --ayah-count NUMBER   Optional ayah count.
`);
}
