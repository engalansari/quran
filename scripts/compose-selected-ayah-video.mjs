#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
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
const catalogPath = resolve(args.catalog || "assets/recitation-catalog.json");
const background = resolve(args.background || "assets/production/nature.mp4");
const font = resolve(args.font || "assets/fonts/hafs.18.ttf");
const out = resolve(args.out || `outputs/ayah-${surah}-${ayahStart}-${ayahCount}-${reciter}.mp4`);
const workDir = resolve(args["work-dir"] || "outputs/work");
const audioDir = resolve(args["audio-dir"] || "assets/audio");
const ffmpeg = executableArg(args.ffmpeg, process.env.FFMPEG, "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe", "ffmpeg");
const ffprobe = executableArg(args.ffprobe, process.env.FFPROBE, "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffprobe.exe", "ffprobe");
const fontName = args["font-name"] || "KFGQPC HAFS Uthmanic Script";
const accountName = args.account || "@tilawat_alquran30";
const quranRenderer = String(args["quran-renderer"] || process.env.QURAN_TEXT_RENDERER || "ass").toLowerCase();
const htmlQuranRenderer = quranRenderer === "html" || quranRenderer === "chromium";
const chromium = executableArg(args.chromium, process.env.CHROMIUM, "", "chromium");
const pangoView = executableArg(args["pango-view"], process.env.PANGO_VIEW, "", "pango-view");

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

for (const [path, label] of [[quranPath, "Quran data"], [catalogPath, "recitation catalog"], [background, "background"], [font, "font"]]) {
  if (!existsSync(path)) fail(`Missing ${label}: ${path}`);
}
for (const [command, label] of [[ffmpeg, "FFmpeg"], [ffprobe, "FFprobe"]]) {
  if (!commandWorks(command)) fail(`Missing ${label}: ${command}`);
}
if (htmlQuranRenderer && !commandWorks(chromium)) {
  fail(`Missing Chromium Quran text renderer: ${chromium}`);
}
if (quranRenderer === "pango" && !commandWorks(pangoView, ["--help"])) {
  fail(`Missing Pango Quran text renderer: ${pangoView}`);
}

mkdirSync(dirname(out), { recursive: true });
mkdirSync(workDir, { recursive: true });

const quran = readJson(quranPath);
const recitationCatalog = readJson(catalogPath);
const catalogReciter = recitationCatalog.reciters?.find((item) => item.id === reciter);
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
  reciterName: cleanOverlayName(catalogReciter?.name || RECITER_NAMES[reciter] || reciter),
  riwayah: catalogReciter?.riwayah || "حفص عن عاصم",
  reference: referenceLabel(surah, selected),
  duration: finalAudioDuration,
};
const ayahOverlays = htmlQuranRenderer || quranRenderer === "pango" ? writeAyahOverlayPngs(schedule, workDir) : [];
writeSubtitleFile(subtitlePath, schedule, meta, {
  includeAyahBoxes: quranRenderer === "pango" || !ayahOverlays.length,
  includeAyahText: !ayahOverlays.length,
  ayahLayouts: ayahOverlays.map((overlay) => overlay.layout),
});

run(ffmpeg, [
  "-y",
  "-hide_banner",
  "-stream_loop", "-1",
  "-i", background,
  "-i", finalAudio,
  ...ayahOverlays.flatMap((overlay) => ["-i", overlay.path]),
  "-filter_complex", buildVideoFilter(subtitlePath, dirname(font), schedule, ayahOverlays),
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
  quranRenderer,
  ayahOverlays: ayahOverlays.map((overlay) => relativePath(overlay.path)),
  audio: relativePath(finalAudio),
  duration: round(finalAudioDuration),
  reciter,
  reciterName: meta.reciterName,
  riwayah: meta.riwayah,
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

function writeSubtitleFile(path, schedule, meta, options = {}) {
  const includeAyahBoxes = options.includeAyahBoxes ?? true;
  const includeAyahText = options.includeAyahText ?? true;
  const ayahLayouts = options.ayahLayouts || [];
  const start = "0:00:00.00";
  const end = formatAssTime(schedule.length ? Math.max(...schedule.map((item) => item.end), 1) : Math.max(Number(meta.duration) || 1, 1));
  const fixedEvents = [
    `Dialogue: 1,${start},${end},Account,,0,0,0,,${escapeAssText(meta.accountName)}`,
    `Dialogue: 1,${start},${end},MetaReciter,,0,0,0,,${escapeAssText(meta.reciterName)}`,
    `Dialogue: 1,${start},${end},MetaReference,,0,0,0,,${escapeAssText(meta.reference)}`,
    `Dialogue: 1,${start},${end},MetaRiwayah,,0,0,0,,${escapeAssText(meta.riwayah)}`,
  ];
  const events = schedule.flatMap((item, index) => {
    const layout = ayahLayouts[index] || ayahTextLayout(item.text || "");
    const itemEvents = [];
    if (includeAyahBoxes) itemEvents.push(roundedAyahBoxDialogue(item, layout));
    if (includeAyahText) {
      itemEvents.push(`Dialogue: 1,${formatAssTime(item.start)},${formatAssTime(item.end)},Ayah,,0,0,0,,${ayahTextDialogueOverride(layout, item.text)}${wrapAssText(item.text)}`);
    }
    return itemEvents;
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

function buildVideoFilter(subtitlePath, fontsDir, schedule, overlays = []) {
  if (overlays.length) {
    const filters = [
      [
        "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
        "format=yuv420p[base]",
      ].join(","),
      `[base]subtitles='${escapeFilter(subtitlePath)}':fontsdir='${escapeFilter(fontsDir)}'[subbed]`,
    ];
    let current = "subbed";
    schedule.forEach((item, index) => {
      const next = index === overlays.length - 1 ? "texted" : `ayahov${index}`;
      const layout = overlays[index]?.layout || ayahTextLayout(item.text || "");
      const x = layout.fullFrame ? "0" : "(W-w)/2";
      const y = layout.fullFrame ? "0" : `${layout.y}+(${layout.height}-h)/2`;
      filters.push(`[${current}][${index + 2}:v]overlay=x='${x}':y='${y}':enable='between(t,${Number(item.start).toFixed(2)},${Number(item.end).toFixed(2)})'[${next}]`);
      current = next;
    });
    filters.push(`[${current}]copy[vout]`);
    return filters.join(";");
  }
  return [
    [
      "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
      "format=yuv420p[base]",
    ].join(","),
    `[base]subtitles='${escapeFilter(subtitlePath)}':fontsdir='${escapeFilter(fontsDir)}'[vout]`,
  ].join(";");
}

function writeAyahOverlayPngs(schedule, dir) {
  const overlaysDir = join(dir, "ayah-overlays");
  mkdirSync(overlaysDir, { recursive: true });
  return schedule.map((item, index) => {
    const htmlPath = join(overlaysDir, `ayah-${surah}-${item.ayah}-${index}.html`);
    const pngPath = join(overlaysDir, `ayah-${surah}-${item.ayah}-${index}.png`);
    if (quranRenderer === "pango") {
      writeAyahOverlayWithPango(item, pngPath, overlaysDir, index);
    } else {
      writeFileSync(htmlPath, buildAyahOverlayHtml(item.text || "", item.ayah), "utf8");
      screenshotWithChromium(htmlPath, pngPath, overlaysDir, index);
    }
    if (!existsSync(pngPath)) fail(`Quran text renderer did not create overlay: ${pngPath}`);
    return {
      path: pngPath,
      layout: quranRenderer === "pango" ? pangoAyahLayout(item.text || "", pngPath) : { fullFrame: true, x: 0, y: 0, width: 1080, height: 1920 },
    };
  });
}

function writeAyahOverlayWithPango(item, pngPath, overlaysDir, index) {
  const layout = ayahTextLayout(item.text || "");
  const textPath = join(overlaysDir, `ayah-${surah}-${item.ayah}-${index}.txt`);
  writeFileSync(textPath, item.text || "", "utf8");
  const maxTextWidth = layout.width - 132;
  const maxTextHeight = 660;
  for (const fontSize of pangoFontCandidates(item.text || "")) {
    runPangoView(textPath, pngPath, fontSize, maxTextWidth);
    const size = probeImageSize(pngPath);
    if (size.width <= maxTextWidth + 8 && size.height <= maxTextHeight) return;
  }
  fitPangoOverlayPng(pngPath, maxTextWidth, maxTextHeight);
}

function runPangoView(textPath, pngPath, fontSize, width) {
  run(pangoView, [
    "--no-display",
    `--font=${fontName} ${fontSize}`,
    "--foreground=#fff8e8",
    "--background=transparent",
    "--align=center",
    "--rtl",
    `--width=${width}`,
    "--margin=0",
    `--output=${pngPath}`,
    textPath,
  ]);
}

function pangoFontCandidates(value) {
  const start = fontSizeForText(value);
  const candidates = [];
  for (let size = start; size >= 42; size -= 6) candidates.push(size);
  return candidates;
}

function pangoAyahLayout(value, pngPath) {
  const base = ayahTextLayout(value);
  const size = probeImageSize(pngPath);
  const shortText = cleanQuranTextLength(value) <= 12;
  const horizontalPadding = shortText ? 80 : 116;
  const verticalPadding = shortText ? 72 : 96;
  const width = clamp(size.width + horizontalPadding, shortText ? 240 : 560, 1012);
  const height = clamp(size.height + verticalPadding, shortText ? 160 : 240, 860);
  const x = Math.round((1080 - width) / 2);
  const y = clamp(Math.round(760 - height / 2), 240, 760);
  return {
    ...base,
    x,
    y,
    width,
    height,
  };
}

function fitPangoOverlayPng(pngPath, maxWidth, maxHeight) {
  const fittedPath = pngPath.replace(/\.png$/i, ".fit.png");
  run(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-i", pngPath,
    "-vf", `scale=${Math.round(maxWidth)}:${Math.round(maxHeight)}:force_original_aspect_ratio=decrease`,
    "-frames:v", "1",
    fittedPath,
  ]);
  renameSync(fittedPath, pngPath);
}

function probeImageSize(path) {
  const result = spawnSync(ffprobe, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=s=x:p=0",
    path,
  ], { encoding: "utf8", windowsHide: true });
  const [width, height] = String(result.stdout || "").trim().split("x").map(Number);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    fail(`Could not read Quran overlay image size: ${path}`);
  }
  return { width, height };
}

function screenshotWithChromium(htmlPath, pngPath, overlaysDir, index) {
  const commonFlags = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-zygote",
    "--single-process",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-sync",
    "--disable-crashpad",
    "--disable-features=Crashpad",
    "--disable-breakpad",
    "--disable-crash-reporter",
    "--allow-file-access-from-files",
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "--password-store=basic",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=1000",
    `--user-data-dir=${join(overlaysDir, `profile-${index}`)}`,
    `--data-path=${join(overlaysDir, `data-${index}`)}`,
    `--disk-cache-dir=${join(overlaysDir, `cache-${index}`)}`,
    `--crash-dumps-dir=${join(overlaysDir, `crash-${index}`)}`,
    "--default-background-color=00000000",
    "--window-size=1080,1920",
    `--screenshot=${pngPath}`,
    pathToFileURL(htmlPath).href,
  ];
  const attempts = [
    ["--headless=new", ...commonFlags],
    ["--headless", ...commonFlags],
  ];

  for (const commandArgs of attempts) {
    const result = spawnSync(chromium, commandArgs, {
      encoding: "utf8",
      windowsHide: true,
    });
    if ((result.status ?? 1) === 0 || existsSync(pngPath)) return;
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    if (output) console.error(output);
  }

  fail(`Command failed: ${chromium} ${attempts[attempts.length - 1].join(" ")}`);
}

function buildAyahOverlayHtml(text, ayahNumber = "") {
  const safeText = escapeHtml(text);
  const safeAyahNumber = escapeHtml(ayahNumber ? ` ﴿${ayahNumber}﴾` : "");
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<style>
@font-face {
  font-family: "${fontName}";
  src: url("${pathToFileURL(font).href}") format("truetype");
  font-display: block;
}
html, body {
  width: 1080px;
  height: 1920px;
  margin: 0;
  overflow: hidden;
  background: transparent;
}
.ayah-box {
  position: absolute;
  left: 50%;
  top: 43%;
  width: var(--box-width, 820px);
  min-height: var(--box-height, 240px);
  box-sizing: border-box;
  border: 2px solid rgba(215, 195, 130, 0.55);
  border-radius: 18px;
  background: rgba(8, 20, 18, 0.62);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--padding-y, 34px) var(--padding-x, 42px);
  transform: translate(-50%, -50%);
}
.ayah-text {
  color: #ffffff;
  font-family: "${fontName}", serif;
  font-size: var(--font-size, 66px);
  font-weight: 700;
  line-height: 1.75;
  text-align: center;
  direction: rtl;
  unicode-bidi: plaintext;
  white-space: normal;
  max-width: 100%;
  margin: 0;
  padding: 0;
  text-shadow:
    0 1px 1px rgba(255, 255, 255, 0.2),
    0 2px 5px rgba(0, 0, 0, 0.65);
}
</style>
</head>
<body>
  <div id="ayahBox" class="ayah-box"><p id="ayahText" class="ayah-text">${safeText}${safeAyahNumber}</p></div>
  <script>
    const box = document.getElementById("ayahBox");
    const text = document.getElementById("ayahText");
    const rawText = ${JSON.stringify(String(text || ""))};

    const limits = {
      minBoxWidth: 240,
      maxBoxWidth: 930,
      minBoxHeight: 132,
      maxBoxHeight: 560,
      minFont: 50,
      maxFont: 164,
      topPercent: 43,
    };

    const waqfPattern = /([\\u06D6-\\u06ED])/g;
    const cleanLength = cleanQuranText(rawText).length;
    const profile = initialProfile(cleanLength);
    const candidates = layoutCandidates(profile);

    let best = null;
    for (const candidate of candidates) {
      applyCandidate(candidate);
      const measured = measure();
      const fits = measured.textWidth <= measured.innerWidth && measured.textHeight <= measured.innerHeight;
      const readable = candidate.fontSize >= limits.minFont;
      const slackY = Math.max(0, measured.innerHeight - measured.textHeight);
      const score = (fits ? 0 : 10000)
        + (readable ? 0 : 5000)
        + Math.abs(slackY - candidate.paddingY * 0.45)
        + Math.abs(measured.innerWidth - measured.textWidth) * 0.12
        - candidate.fontSize * 5;
      if (!best || score < best.score) best = { candidate, score, fits, measured };
      if (fits && readable && slackY <= candidate.fontSize * 1.45) break;
    }

    applyCandidate(best.candidate);

    function initialProfile(length) {
      if (length < 12) return { fontStart: 164, fontEnd: 148, widthStart: 240, widthEnd: 340, lines: 1, paddingX: 26, paddingY: 18 };
      if (length < 45) return { fontStart: 96, fontEnd: 84, widthStart: 380, widthEnd: 650, lines: 1, paddingX: 34, paddingY: 22 };
      if (length < 90) return { fontStart: 78, fontEnd: 68, widthStart: 640, widthEnd: 820, lines: 2, paddingX: 38, paddingY: 26 };
      if (length < 150) return { fontStart: 68, fontEnd: 58, widthStart: 780, widthEnd: 930, lines: 3, paddingX: 42, paddingY: 30 };
      return { fontStart: 56, fontEnd: 50, widthStart: 900, widthEnd: 930, lines: 5, paddingX: 46, paddingY: 34 };
    }

    function layoutCandidates(profile) {
      const items = [];
      for (let fontSize = profile.fontStart; fontSize >= Math.max(profile.fontEnd, limits.minFont); fontSize -= 2) {
        for (let width = profile.widthStart; width <= profile.widthEnd; width += 30) {
          const paddingX = profile.paddingX;
          const paddingY = profile.paddingY;
          items.push({
            fontSize,
            width: clamp(width, limits.minBoxWidth, limits.maxBoxWidth),
            height: limits.minBoxHeight,
            paddingX,
            paddingY,
            lines: profile.lines,
          });
        }
      }
      return items;
    }

    function applyCandidate(candidate) {
      const lines = balancedLines(rawText, candidate.lines);
      text.innerHTML = lines.map(escapeHtml).join("<br>") + ${JSON.stringify(safeAyahNumber)};
      box.style.setProperty("--box-width", candidate.width + "px");
      box.style.setProperty("--font-size", candidate.fontSize + "px");
      box.style.setProperty("--padding-x", candidate.paddingX + "px");
      box.style.setProperty("--padding-y", candidate.paddingY + "px");
      box.style.setProperty("--box-height", limits.minBoxHeight + "px");
      const measured = measure();
      const height = clamp(Math.ceil(measured.textHeight + candidate.paddingY * 2), limits.minBoxHeight, limits.maxBoxHeight);
      const width = clamp(Math.ceil(measured.textWidth + candidate.paddingX * 2), limits.minBoxWidth, candidate.width);
      box.style.setProperty("--box-height", height + "px");
      box.style.setProperty("--box-width", width + "px");
    }

    function measure() {
      const boxRect = box.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      const style = getComputedStyle(box);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      return {
        boxWidth: boxRect.width,
        boxHeight: boxRect.height,
        innerWidth: boxRect.width - paddingX,
        innerHeight: boxRect.height - paddingY,
        textWidth: Math.max(text.scrollWidth, textRect.width),
        textHeight: Math.max(text.scrollHeight, textRect.height),
      };
    }

    function balancedLines(value, maxLines) {
      const normalized = String(value || "").replace(/\\s+/g, " ").trim();
      if (!normalized) return [""];
      const words = normalized.split(" ");
      const cleanTotal = Math.max(1, cleanQuranText(normalized).length);
      const targetLines = clamp(Math.ceil(cleanTotal / 34), 1, maxLines);
      const targetLength = Math.ceil(cleanTotal / targetLines);
      const lines = [];
      let line = "";
      for (const word of words) {
        const next = line ? line + " " + word : word;
        const forceBreak = line && cleanQuranText(next).length > targetLength && lines.length < targetLines - 1;
        const preferWaqf = line && waqfPattern.test(line) && cleanQuranText(line).length >= targetLength * 0.62 && lines.length < targetLines - 1;
        waqfPattern.lastIndex = 0;
        if (forceBreak || preferWaqf) {
          lines.push(line);
          line = word;
        } else {
          line = next;
        }
      }
      if (line) lines.push(line);
      return rebalanceLines(lines, targetLines);
    }

    function rebalanceLines(lines, targetLines) {
      while (lines.length > targetLines) {
        const last = lines.pop();
        lines[lines.length - 1] += " " + last;
      }
      return lines;
    }

    function cleanQuranText(value) {
      return String(value || "")
        .replace(/[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06ED\\u0640]/g, "")
        .replace(/\\s+/g, " ")
        .trim();
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }
  </script>
</body>
</html>`;
}

function textBoxFilter(item, explicitLayout = null) {
  const { x, y, width, height } = explicitLayout || ayahTextLayout(item.text || "");
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
  return `Dialogue: 0,${start},${end},AyahBox,,0,0,0,,{\\p1\\fs1\\an7\\pos(${layout.x},${layout.y})}${path}`;
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

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    windowsHide: true,
  });
  if ((result.status ?? 1) !== 0) fail(`Command failed: ${command} ${commandArgs.join(" ")}`);
}

function executableArg(explicitValue, envValue, localPath, commandName) {
  if (explicitValue) return resolve(explicitValue);
  if (envValue) return /[\\/]/.test(envValue) || /^[A-Za-z]:/.test(envValue) ? resolve(envValue) : envValue;
  if (localPath) {
    const resolvedLocal = resolve(localPath);
    if (existsSync(resolvedLocal)) return resolvedLocal;
  }
  return commandName;
}

function commandWorks(command, commandArgs = ["-version"]) {
  const result = spawnSync(command, commandArgs, {
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
  const width = ayahBoxWidth(lines, fontSize);
  const estimatedLines = Math.max(lines.length, estimatedRenderedLineCount(value, fontSize, width));
  const shortText = cleanQuranTextLength(value) <= 12 && lines.length <= 1;
  const height = clamp(Math.round(estimatedLines * fontSize * 1.12 + (shortText ? 64 : 168)), shortText ? 200 : 300, 1040);
  const x = Math.round((1080 - width) / 2);
  const y = clamp(Math.round(760 - height / 2), 250, 700);
  return {
    x,
    y,
    width,
    height,
    fontSize,
    textY: y + 72,
  };
}

function ayahBoxWidth(lines, fontSize) {
  const longest = Math.max(0, ...lines.map((line) => cleanQuranTextLength(line)));
  const minimum = longest <= 12 && lines.length <= 1 ? 240 : longest <= 28 && lines.length <= 1 ? 380 : 560;
  const padding = longest <= 12 && lines.length <= 1 ? 96 : longest <= 28 && lines.length <= 1 ? 150 : 220;
  return clamp(Math.round(longest * fontSize * 0.34 + padding), minimum, 988);
}

function estimatedRenderedLineCount(value, fontSize, boxWidth) {
  const textLength = cleanQuranTextLength(value);
  const usableWidth = Math.max(120, boxWidth - 132);
  const estimatedTextWidth = textLength * fontSize * 0.34;
  return Math.max(1, Math.ceil(estimatedTextWidth / usableWidth));
}

function fontSizeForText(value) {
  const lines = wrappedLines(value);
  const length = cleanQuranTextLength(value);
  if (length <= 12 && lines.length <= 1) return 164;
  if (length <= 28 && lines.length <= 1) return 104;
  if (lines.length <= 2) return 96;
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
    if (cleanQuranTextLength(next) > 34 && line) {
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

function escapeAssText(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("{", "\\{").replaceAll("}", "\\}");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

function cleanOverlayName(value) {
  return String(value || "قارئ القرآن").split(" - ")[0].trim();
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
