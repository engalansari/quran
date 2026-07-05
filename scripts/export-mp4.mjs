#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.project) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const projectPath = resolve(args.project);
const project = readJson(projectPath);
const sourceVideo = requireFile(args.video || project.sourceVideo, "source recitation video");
const background = requireFile(args.background || project.customBackgroundName, "background video or image");
const font = requireFile(args.font || "assets/fonts/hafs.18.ttf", "reviewed Uthmani font");
const logo = args.logo && existsSync(args.logo) ? resolve(args.logo) : "";
const output = resolve(args.out || "output.mp4");
const ffmpeg = args.ffmpeg || "ffmpeg";
const subtitlePath = resolve(args.subtitles || defaultSubtitlePath(output));
const fontName = args["font-name"] || project.quranFontName || "KFGQPC HAFS Uthmanic Script";
const accountName = args.account || project.accountName || "@tilawat_alquran30";

const schedule = Array.isArray(project.ayahSchedule) ? project.ayahSchedule : [];
if (!schedule.length) {
  fail("Project JSON has no ayahSchedule. Export the project again from Ayah Studio.");
}

if (!project.ayahSelectionConfirmed) {
  fail("Project JSON says ayah selection is not confirmed.");
}

if (!project.quranSourceReviewed) {
  fail("Project JSON says Quran source is not reviewed.");
}

const command = buildFfmpegArgs({
  sourceVideo,
  background,
  font,
  fontName,
  logo,
  output,
  subtitlePath,
  project,
  schedule,
});

writeSubtitleFile(subtitlePath, { project, schedule, fontName, accountName });
printCommand(ffmpeg, command);
console.log(`Subtitle overlay: ${subtitlePath}`);

if (!args.execute) {
  console.log("\nDry run only. Add --execute to render the MP4.");
  process.exit(0);
}

const result = spawnSync(ffmpeg, command, {
  stdio: "inherit",
  windowsHide: true,
});

process.exit(result.status ?? 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--execute") {
      parsed.execute = true;
    } else if (token === "--help" || token === "-h") {
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
    fail(`Could not read project JSON: ${path}\n${error.message}`);
  }
}

function requireFile(path, label) {
  if (!path) fail(`Missing ${label}. Pass it explicitly with the matching CLI flag.`);
  const resolved = resolve(path);
  if (!existsSync(resolved)) fail(`Missing ${label}: ${resolved}`);
  return resolved;
}

function buildFfmpegArgs({ sourceVideo, background, font, logo, output, subtitlePath, schedule }) {
  const filter = buildFilter({ font, logo, subtitlePath, schedule });
  const finalDuration = Math.max(...schedule.map((item) => Number(item.end) || 0), 0);
  const command = [
    "-y",
    "-stream_loop", "-1",
    "-i", background,
    "-i", sourceVideo,
  ];

  if (logo) command.push("-i", logo);

  command.push(
    "-filter_complex", filter,
    "-map", "[vout]",
    "-map", "1:a:0",
    "-c:v", "libx264",
    "-profile:v", "high",
    "-level", "4.1",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    ...(finalDuration > 0 ? ["-t", formatSeconds(finalDuration)] : []),
    "-shortest",
    "-movflags", "+faststart",
    output,
  );

  return command;
}

function buildFilter({ font, logo, subtitlePath, schedule }) {
  const fontsDir = dirname(font);
  const subtitles = `subtitles='${escapeFilter(subtitlePath)}':fontsdir='${escapeFilter(fontsDir)}'`;
  const brand = logo
    ? ";[texted][2:v]overlay=54:54:format=auto[vout]"
    : ";[texted]copy[vout]";

  return [
    [
      "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1",
      ...schedule.map(textBoxFilter),
      "format=yuv420p[base]",
    ].join(","),
    `[base]${subtitles}[texted]`,
  ].join(";") + brand;
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

function escapeFilter(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'");
}

function writeSubtitleFile(path, { project, schedule, fontName, accountName }) {
  const fontSize = Number(project.ayahFontSize) || 84;
  const marginV = {
    upper: 1220,
    center: 690,
    lower: 410,
  }[project.ayahPosition] || 690;
  const alignment = {
    upper: 8,
    center: 8,
    lower: 2,
  }[project.ayahPosition] || 8;
  const boxOpacity = Math.max(0, Math.min(0.85, (Number(project.ayahBoxOpacity) || 62) / 100));
  const alpha = Math.round(255 * (1 - boxOpacity)).toString(16).padStart(2, "0").toUpperCase();
  const start = "0:00:00.00";
  const end = formatAssTime(Math.max(...schedule.map((item) => Number(item.end) || 0), 1));
  const reference = project.reference || referenceLabel(project, schedule);
  const reciterName = project.reciterName || project.reciter || "";
  const fixedEvents = [
    `Dialogue: 1,${start},${end},Account,,0,0,0,,${escapeAssText(accountName)}`,
    reference ? `Dialogue: 1,${start},${end},MetaLeft,,0,0,0,,${escapeAssText(reference)}` : "",
    reciterName ? `Dialogue: 1,${start},${end},MetaRight,,0,0,0,,${escapeAssText(reciterName)}` : "",
  ].filter(Boolean);
  const events = schedule.map((item) => {
    const { fontSize, textY } = ayahTextLayout(item.text || "");
    const text = wrapAssText(item.text || "");
    return `Dialogue: 0,${formatAssTime(item.start)},${formatAssTime(item.end)},Ayah,,0,0,${textY},,{\\q2\\fs${fontSize}\\bord1\\shad0}${text}`;
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
    `Style: Ayah,${escapeAssField(fontName)},${fontSize},&H00FFF8E8,&H00FFF8E8,&H66000000,&H00000000,0,0,0,0,100,100,0,0,1,1,0,${alignment},92,92,${marginV},1`,
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
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("{", "\\{")
    .replaceAll("}", "\\}");
}

function escapeAssField(value) {
  return String(value).replaceAll(",", " ");
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

function printCommand(ffmpeg, command) {
  console.log("FFmpeg command:");
  console.log([ffmpeg, ...command.map(quoteArg)].join(" "));
}

function quoteArg(value) {
  const text = String(value);
  return /\s/.test(text) ? `"${text.replaceAll('"', '\\"')}"` : text;
}

function defaultSubtitlePath(path) {
  return /\.mp4$/i.test(path) ? path.replace(/\.mp4$/i, ".ayahs.ass") : `${path}.ayahs.ass`;
}

function referenceLabel(project, schedule) {
  const surah = project.surahName || project.surahTitle || "";
  const first = Number(project.ayahStart || schedule[0]?.ayah || schedule[0]?.ayahNumber || 0);
  const last = Number(
    project.ayahEnd ||
    schedule[schedule.length - 1]?.ayah ||
    schedule[schedule.length - 1]?.ayahNumber ||
    first
  );
  const range = first && last ? formatAyahRange(first, last) : "";
  return [surah, range].filter(Boolean).join(" ");
}

function formatAyahRange(first, last) {
  return first === last ? String(first) : `\u200e${last}-${first}\u200e`;
}

function formatSeconds(value) {
  return Math.max(0, Number(value) || 0).toFixed(3);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`
Ayah Studio MP4 exporter

Usage:
  node scripts/export-mp4.mjs --project ayah-studio-project.json --video SOURCE.mp4 --background BACKGROUND.mp4 --font assets/fonts/hafs.18.ttf --out output.mp4 --execute

Options:
  --project     Required. Ayah Studio project JSON.
  --video       Required unless project sourceVideo is a valid path.
  --background  Required unless project customBackgroundName is a valid path.
  --font        Optional reviewed Quran font. Defaults to assets/fonts/hafs.18.ttf.
  --font-name   Optional installed font family name for ASS subtitle rendering.
  --logo        Optional account logo PNG.
  --subtitles   Optional ASS subtitle output path. Defaults beside the MP4.
  --out         Output MP4 path. Defaults to output.mp4.
  --ffmpeg      FFmpeg executable. Defaults to ffmpeg.
  --execute     Render the MP4. Without this flag, only prints the command.
`);
}
