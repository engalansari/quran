#!/usr/bin/env node

import { readFileSync } from "node:fs";

const composer = readFileSync("scripts/compose-selected-ayah-video.mjs", "utf8");
const downloader = readFileSync("scripts/download-recitation-audio.mjs", "utf8");
const catalog = JSON.parse(readFileSync("assets/recitation-catalog.json", "utf8"));

const failures = [];

requireIncludes(composer, "resolve(audioDir, reciter, pad3(surah), `${pad3(item.ayah)}.mp3`)", "composer must map audio by reciter/surah/ayah path");
requireIncludes(composer, "\"--reciter\", reciter", "composer must pass selected reciter to downloader");
requireIncludes(composer, "\"--surah\", String(surah)", "composer must pass selected surah to downloader");
requireIncludes(composer, "\"--ayah-start\", String(ayahStart)", "composer must pass selected ayah start to downloader");
requireIncludes(composer, "\"--ayah-count\", String(ayahCount)", "composer must pass selected ayah count to downloader");
requireIncludes(composer, "buildSchedule(selected, audioFiles)", "composer must build schedule from selected ayahs and exact files");
requireIncludes(composer, "const finalAudio = combinedAudio", "composer must preserve complete recitation audio without final silence trimming");
requireIncludes(composer, "VIDEO_END_HOLD_SECONDS", "composer must keep a short visual hold after recitation audio completes");
requireIncludes(downloader, "https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciter}", "downloader must request explicit ayah/reciter URL");
requireIncludes(downloader, "buildSourceUrl(source.urlTemplate, surah, ayah)", "downloader must support explicit verse URL templates");
requireIncludes(downloader, "sourceUrl: metadata.data.audio", "downloader must store audio source URL in manifest");
requireIncludes(downloader, "sha256", "downloader must hash downloaded audio files");
requireIncludes(readFileSync("app.js", "utf8"), "groupedRecitersByRiwayah", "reciter picker must group reciters by riwayah");
requireIncludes(readFileSync("app.js", "utf8"), "document.createElement(\"optgroup\")", "reciter picker must render riwayah groups");
requireIncludes(composer, "MetaReciter", "composer must render reciter name in the export metadata stack");
requireIncludes(composer, "MetaReference", "composer must render surah and ayah range in the export metadata stack");
requireIncludes(composer, "MetaRiwayah", "composer must render riwayah in the exported video");
requireIncludes(composer, "riwayah: catalogReciter?.riwayah", "composer must read riwayah from the recitation catalog");

[
  "atempo",
  "asetrate",
  "rubberband",
  "rubberband=pitch",
  "aresample=async",
  "silenceremove",
].forEach((token) => {
  if (composer.includes(token)) failures.push(`composer must not alter recitation speed or pitch with ${token}`);
});

const reciters = Array.isArray(catalog.reciters) ? catalog.reciters : [];
if (!reciters.length) failures.push("recitation catalog must include reciters");
if (reciters.length < 40) failures.push("recitation catalog should keep an expanded verse-by-verse reciter library");
const everyAyahWarsh = reciters.find((reciter) => reciter.id === "everyayah.warsh.abdulbasit");
if (!everyAyahWarsh) failures.push("recitation catalog must include an EveryAyah Warsh pilot reciter");
if (everyAyahWarsh?.riwayah !== "ورش عن نافع") failures.push("EveryAyah pilot reciter must be marked Warsh");
if (everyAyahWarsh?.source?.type !== "template") failures.push("EveryAyah pilot reciter must use template source");
if (!String(everyAyahWarsh?.source?.urlTemplate || "").includes("{surah3}{ayah3}.mp3")) failures.push("EveryAyah source template must address ayahs explicitly");
const everyAyahWarshReciters = reciters.filter((reciter) => reciter.source?.provider === "EveryAyah" && reciter.riwayah === "ورش عن نافع");
if (everyAyahWarshReciters.length < 3) failures.push("recitation catalog must include the three EveryAyah Warsh reciters");
const everyAyahHafsReciters = reciters.filter((reciter) => reciter.id?.startsWith("everyayah.hafs."));
if (everyAyahHafsReciters.length < 35) failures.push("recitation catalog must include an expanded EveryAyah Hafs reciter set");
reciters.forEach((reciter) => {
  if (!reciter.id || !reciter.name) failures.push("each reciter needs id and name");
  if (reciter.verseByVerse !== true) failures.push(`${reciter.id || "unknown reciter"} must be marked verseByVerse:true`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("PASS recitation audio policy uses explicit ayah audio without speed or pitch changes.");

function requireIncludes(content, token, message) {
  if (!content.includes(token)) failures.push(message);
}
