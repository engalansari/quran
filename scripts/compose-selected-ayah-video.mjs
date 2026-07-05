#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const reciter = String(args.reciter || "ar.alafasy");
const surah = numberArg(args.surah, "surah");
const ayahStart = numberArg(args["ayah-start"] || args.ayah, "ayah-start");
const ayahCount = numberArg(args["ayah-count"] || 1, "ayah-count");
const quranPath = resolve(args.quran || "data/quran-uthmani.json");
const background = resolve(args.background || "assets/production/nature.mp4");
const font = resolve(args.font || "assets/fonts/hafs.18.ttf");
const out = resolve(args.out || `outputs/ayah-${surah}-${ayahStart}-${ayahCount}-${reciter}.mp4`);
const workDir = resolve(args["work-dir"] || "outputs/work");
const audioDir = resolve(args["audio-dir"] || "assets/audio");
const ffmpeg = resolve(args.ffmpeg || "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
const ffprobe = resolve(args.ffprobe || "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe");
const fontName = args["font-name"] || "KFGQPC HAFS Uthmanic Script";
const accountName = args.account || "@tilawat_alquran30";

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

const RECITER_NAMES = {
  "ar.alafasy": "مشاري راشد العفاسي",
  "ar.abdulbasitmurattal": "عبدالباسط عبدالصمد - مرتل",
  "ar.abdullahbasfar": "عبد الله بصفر",
  "ar.abdurrahmaansudais": "عبدالرحمن السديس",
  "ar.abdulsamad": "عبدالباسط عبدالصمد",
  "ar.shaatree": "أبو بكر الشاطري",
  "ar.ahmedajamy": "أحمد بن علي العجمي",
  "ar.minshawi": "محمد صديق المنشاوي",
  "ar.hanirifai": "هاني الرفاعي",
  "ar.husary": "محمود خليل الحصري",
  "ar.husarymujawwad": "محمود خليل الحصري - المجود",
  "ar.hudhaify": "علي بن عبدالرحمن الحذيفي",
  "ar.ibrahimakhbar": "إبراهيم الأخضر",
  "ar.mahermuaiqly": "ماهر المعيقلي",
  "ar.minshawimujawwad": "محمد صديق المنشاوي - المجود",
  "ar.muhammadayyoub": "محمد أيوب",
  "ar.muhammadjibreel": "محمد جبريل",
  "ar.saoodshuraym": "سعود الشريم",
  "ar.parhizgar": "شهريار پرهيزگار",
  "ar.aymanswoaid": "أيمن سويد",
};

if (!surah || !ayahStart || !ayahCount) {
  printHelp();
  process.exit(1);
}

for (const [path, label] of [[quranPath, "Quran data"], [background, "background"], [font, "font"], [ffmpeg, "FFmpeg"], [ffprobe, "FFprobe"]]) {
  if (!existsSync(path)) fail(`Missing ${label}: ${path}`);
}

mkdirSync(dirname(out), { recursive: true });
mkdirSync(workDir, { recursive: true });

const quran = readJson(quranPath);
const selected = selectedAyahs(quran, surah, ayahStart, ayahCount);
const audioFiles = selected.map((item) => resolve(audioDir, reciter, pad3(surah), `${pad3(item.ayah)}.mp3`));

if (args.download && audioFiles.some((file) => !existsSync(file))) {
  run(process.execPath, [
    "scripts/download-recitation-audio.mjs",
    "--reciter", reciter,
    "--surah", String(surah),
    "--ayah-start", String(ayahStart),
    "--ayah-count", String(ayahCount),
    "--out-dir", audioDir,
  ]);
}

audioFiles.forEach((file) => {
  if (!existsSync(file)) fail(`Missing recitation audio: ${file}\nRun with --download to fetch missing files.`);
});

const concatList = join(workDir, `audio-${surah}-${ayahStart}-${ayahCount}-${reciter}.txt`);
const combinedAudio = join(workDir, `audio-${surah}-${ayahStart}-${ayahCount}-${reciter}.m4a`);
const finalAudio = join(workDir, `audio-${surah}-${ayahStart}-${ayahCount}-${reciter}.trimmed.m4a`);
const subtitlePath = out.replace(/\.mp4$/i, ".ayahs.ass");
writeFileSync(concatList, audioFiles.map((file) => `file '${escapeConcatPath(file)}'`).join("\n"), "utf8");

run(ffmpeg, [
  "-y",
  "-hide_banner",
  "-loglevel", "error",
  "-f", "concat",
  "-safe", "0",
  "-i", concatList,
  "-c:a", "aac",
  "-b:a", "192k",
  combinedAudio,
]);

trimFinalSilence(combinedAudio, finalAudio);
const finalAudioDuration = probeDuration(finalAudio);
const schedule = clampScheduleEnd(buildSchedule(selected, audioFiles), finalAudioDuration);
const meta = {
  accountName,
  reciterName: RECITER_NAMES[reciter] || reciter,
  reference: referenceLabel(surah, selected),
};
writeSubtitleFile(subtitlePath, schedule, meta);

run(ffmpeg, [
  "-y",
  "-hide_banner",
  "-stream_loop", "-1",
  "-i", background,
  "-i", finalAudio,
  "-filter_complex", buildVideoFilter(subtitlePath, dirname(font), schedule),
  "-map", "[vout]",
  "-map", "1:a:0",
  "-c:v", "libx264",
  "-profile:v", "high",
  "-level", "4.1",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-b:a", "192k",
  "-t", formatSeconds(finalAudioDuration),
  "-shortest",
  "-movflags", "+faststart",
  out,
]);

const result = {
  ready: true,
  out: relativePath(out),
  subtitles: relativePath(subtitlePath),
  audio: relativePath(finalAudio),
  duration: round(finalAudioDuration),
  reciter,
  reciterName: meta.reciterName,
  surah,
  surahName: surahName(surah),
  ayahStart,
  ayahCount,
  schedule,
};
console.log(JSON.stringify(result, null, 2));

function trimFinalSilence(input, output) {
  run(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", input,
    "-af", "areverse,silenceremove=start_periods=1:start_duration=0.18:start_threshold=-48dB,areverse",
    "-c:a", "aac",
    "-b:a", "192k",
    output,
  ]);
}

function clampScheduleEnd(schedule, finalDuration) {
  if (!schedule.length) return schedule;
  const last = schedule[schedule.length - 1];
  if (Number.isFinite(finalDuration) && finalDuration > 0 && finalDuration < last.end) {
    last.end = round(finalDuration);
  }
  return schedule;
}

function buildSchedule(ayahs, files) {
  let cursor = 0;
  return ayahs.map((ayah, index) => {
    const duration = probeDuration(files[index]);
    const start = cursor;
    const end = cursor + duration;
    cursor = end;
    return {
      surah,
      ayah: ayah.ayah,
      start: round(start),
      end: round(end),
      text: ayah.text,
    };
  });
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

function formatSeconds(value) {
  return Math.max(0, Number(value) || 0).toFixed(3);
}

function writeSubtitleFile(path, schedule, meta) {
  const start = "0:00:00.00";
  const end = formatAssTime(Math.max(...schedule.map((item) => item.end), 1));
  const fixedEvents = [
    `Dialogue: 1,${start},${end},Account,,0,0,0,,${escapeAssText(meta.accountName)}`,
    `Dialogue: 1,${start},${end},MetaLeft,,0,0,0,,${escapeAssText(meta.reference)}`,
    `Dialogue: 1,${start},${end},MetaRight,,0,0,0,,${escapeAssText(meta.reciterName)}`,
  ];
  const events = schedule.map((item) => {
    const layout = ayahTextLayout(item.text || "");
    return `Dialogue: 0,${formatAssTime(item.start)},${formatAssTime(item.end)},Ayah,,0,0,${layout.textY},,{\\q2\\fs${layout.fontSize}\\bord1\\shad0}${wrapAssText(item.text)}`;
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
    `Style: Ayah,${fontName},84,&H00FFF8E8,&H00FFF8E8,&H66000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,8,92,92,620,1`,
    "Style: Account,Segoe UI,64,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,3,12,0,7,54,54,54,1",
    "Style: MetaLeft,Segoe UI,76,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,3,12,0,1,60,60,132,1",
    "Style: MetaRight,Segoe UI,76,&H00FFFFFF,&H00FFFFFF,&H66000000,&H66000000,1,0,0,0,100,100,0,0,3,12,0,3,60,60,132,1",
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
  const textBoxes = schedule.map(textBoxFilter);
  return [
    [
      "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
      ...textBoxes,
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

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    windowsHide: true,
  });
  if ((result.status ?? 1) !== 0) fail(`Command failed: ${command} ${commandArgs.join(" ")}`);
}

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--download") {
      parsed.download = true;
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

function numberArg(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    if (value !== undefined) fail(`--${label} must be a positive integer.`);
    return 0;
  }
  return number;
}

function wrapAssText(value) {
  return wrappedLines(value).map(escapeAssText).join("\\N");
}

function ayahTextLayout(value) {
  const lines = wrappedLines(value);
  const fontSize = fontSizeForText(value);
  const width = 948;
  const height = clamp(Math.round(lines.length * fontSize * 1.22 + 104), 220, 640);
  const x = 66;
  const y = clamp(Math.round(768 - height / 2), 420, 700);
  return {
    x,
    y,
    width,
    height,
    fontSize,
    textY: y + 48,
  };
}

function fontSizeForText(value) {
  const lines = wrappedLines(value);
  if (lines.length <= 2) return 90;
  if (lines.length <= 3) return 86;
  if (lines.length <= 4) return 80;
  return 74;
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

function escapeConcatPath(value) {
  return String(value).replaceAll("\\", "/").replaceAll("'", "'\\''");
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

function surahName(number) {
  return SURAH_NAMES[number - 1] || `سورة ${number}`;
}

function referenceLabel(surahNumber, ayahs) {
  const first = ayahs[0]?.ayah || ayahStart;
  const last = ayahs[ayahs.length - 1]?.ayah || first;
  return `${surahName(surahNumber)} ${formatAyahRange(first, last)}`;
}

function formatAyahRange(first, last) {
  return first === last ? String(first) : `\u200e${last}-${first}\u200e`;
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function relativePath(path) {
  return resolve(path).replace(`${process.cwd()}\\`, "").replaceAll("\\", "/");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Compose a Quran video from explicit surah/ayah/reciter choices. No recognition is used.

Usage:
  node scripts/compose-selected-ayah-video.mjs --surah 1 --ayah-start 1 --ayah-count 3 --reciter ar.alafasy --background assets/production/makkah.mp4 --download --out outputs/fatiha.mp4

Options:
  --surah NUMBER        Surah number.
  --ayah-start NUMBER   First ayah number.
  --ayah-count NUMBER   Number of ayahs.
  --reciter ID          Reciter id from assets/recitation-catalog.json.
  --background FILE     Background image/video. Defaults to assets/production/nature.mp4.
  --download            Download missing recitation MP3 files first.
  --out FILE            Output MP4.
  --quran FILE          Quran JSON. Defaults to data/quran-uthmani.json.
  --audio-dir DIR       Audio library directory. Defaults to assets/audio.
  --font FILE           Uthmani font file.
  --ffmpeg FILE         FFmpeg executable.
  --ffprobe FILE        FFprobe executable.
`.trim());
}
