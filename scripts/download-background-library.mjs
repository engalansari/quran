#!/usr/bin/env node

import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { pipeline } from "node:stream/promises";

const catalogPath = resolve("assets/background-library/catalog.json");
const ffmpeg = resolve("tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe");
const args = parseArgs(process.argv.slice(2));
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
let selected = catalog.items.filter((item) => !args.id || item.id === args.id);
if (args["missing-only"]) {
  selected = selected.filter((item) => !existsSync(resolve(item.localFile)));
}
if (args.limit) {
  selected = selected.slice(0, Number(args.limit));
}

if (!selected.length) fail("No background entries selected.");
if (!existsSync(ffmpeg)) fail(`Missing FFmpeg: ${ffmpeg}`);

for (const item of selected) {
  if (item.licenseScope !== "free-commercial") {
    fail(`Refusing to download non-commercial/restricted item: ${item.id}`);
  }
  await downloadItem(item);
  convertItem(item);
}

console.log(JSON.stringify({
  ready: true,
  downloaded: selected.map((item) => ({
    id: item.id,
    source: item.localSource,
    output: item.localFile,
    poster: item.poster,
  })),
}, null, 2));

async function downloadItem(item) {
  const out = resolve(item.localSource);
  mkdirSync(dirname(out), { recursive: true });
  if (existsSync(out) && statSync(out).size > 100000) return;
  const response = await fetch(item.downloadUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 Ayah Studio background downloader",
      "referer": item.sourceUrl || "https://mixkit.co/",
      "accept": "video/mp4,video/*,*/*",
    },
  });
  if (!response.ok || !response.body) {
    fail(`Could not download ${item.id}: HTTP ${response.status}`);
  }
  await pipeline(response.body, createWriteStream(out));
}

function convertItem(item) {
  const source = resolve(item.localSource);
  const out = resolve(item.localFile);
  const poster = resolve(item.localPoster || item.poster);
  mkdirSync(dirname(out), { recursive: true });
  mkdirSync(dirname(poster), { recursive: true });

  run(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-stream_loop", "-1",
    "-i", source,
    "-t", "12",
    "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30",
    "-an",
    "-c:v", "libx264",
    "-profile:v", "high",
    "-level", "4.1",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    "-crf", "26",
    "-preset", "veryfast",
    out,
  ]);

  run(ffmpeg, [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-ss", "1",
    "-i", out,
    "-frames:v", "1",
    "-q:v", "3",
    poster,
  ]);
}

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--id") {
      parsed.id = input[index + 1];
      index += 1;
    } else if (token === "--limit") {
      parsed.limit = input[index + 1];
      index += 1;
    } else if (token === "--missing-only") {
      parsed["missing-only"] = true;
    }
  }
  return parsed;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: "inherit",
    windowsHide: true,
  });
  if ((result.status ?? 1) !== 0) {
    fail(`Command failed: ${command} ${commandArgs.join(" ")}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
