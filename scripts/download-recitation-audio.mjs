#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { get } from "node:https";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const reciter = String(args.reciter || "ar.alafasy");
const surah = numberArg(args.surah, "surah");
const ayahStart = numberArg(args["ayah-start"] || args.ayah, "ayah-start");
const ayahCount = numberArg(args["ayah-count"] || 1, "ayah-count");
const outDir = resolve(args["out-dir"] || "assets/audio");
const catalogPath = resolve(args.catalog || "assets/recitation-catalog.json");
const manifestPath = resolve(args.manifest || join(outDir, reciter, "manifest.json"));

if (!surah || !ayahStart || !ayahCount) {
  printHelp();
  process.exit(1);
}

const catalog = readJson(catalogPath);
const catalogReciter = catalog.reciters?.find((item) => item.id === reciter);
if (!catalogReciter) {
  fail(`Reciter ${reciter} is not listed in ${catalogPath}.`);
}

const result = await downloadRange();
console.log(JSON.stringify(result, null, 2));

async function downloadRange() {
  const targetDir = join(outDir, reciter, pad3(surah));
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(dirname(manifestPath), { recursive: true });

  const ayahs = [];
  for (let offset = 0; offset < ayahCount; offset += 1) {
    const ayah = ayahStart + offset;
    const metadata = await resolveAyahAudio(ayah);

    const file = join(targetDir, `${pad3(ayah)}.mp3`);
    let sha256 = "";
    if (!existsSync(file) || args.force) {
      const audio = await fetchBuffer(metadata.data.audio);
      writeFileSync(file, audio);
      sha256 = hash(audio);
    } else {
      sha256 = hash(readFileSync(file));
    }

    ayahs.push({
      surah,
      ayah,
      globalAyahNumber: metadata.data.number,
      reciter,
      reciterName: metadata.data.edition?.name || catalogReciter.name,
      sourceUrl: metadata.data.audio,
      sourceProvider: catalogReciter.source?.provider || catalog.provider?.name || "Al Quran Cloud",
      file: relativePath(file),
      sha256,
    });
  }

  const existing = existsSync(manifestPath) ? readJson(manifestPath) : { version: 1, provider: catalog.provider, reciter, ayahs: [] };
  const merged = mergeAyahs(existing.ayahs || [], ayahs);
  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    provider: catalog.provider,
    reciter,
    reciterName: catalogReciter.name,
    ayahs: merged,
  };
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    ready: true,
    reciter,
    reciterName: catalogReciter.name,
    downloaded: ayahs.length,
    files: ayahs.map((item) => item.file),
    manifest: relativePath(manifestPath),
  };
}

async function resolveAyahAudio(ayah) {
  const source = catalogReciter.source || {};
  if (source.type === "template" && source.urlTemplate) {
    return {
      code: 200,
      data: {
        number: null,
        audio: buildSourceUrl(source.urlTemplate, surah, ayah),
        edition: {
          name: catalogReciter.name,
        },
      },
    };
  }

  const metadata = await fetchJson(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/${reciter}`);
  if (metadata.code !== 200 || !metadata.data?.audio) {
    fail(`Audio API did not return an audio URL for ${reciter} ${surah}:${ayah}.`);
  }
  return metadata;
}

function buildSourceUrl(template, surahNumber, ayahNumber) {
  return String(template)
    .replaceAll("{surah3}", pad3(surahNumber))
    .replaceAll("{ayah3}", pad3(ayahNumber))
    .replaceAll("{surah}", String(surahNumber))
    .replaceAll("{ayah}", String(ayahNumber));
}

function mergeAyahs(existing, incoming) {
  const byKey = new Map();
  for (const item of existing) byKey.set(`${item.reciter}:${item.surah}:${item.ayah}`, item);
  for (const item of incoming) byKey.set(`${item.reciter}:${item.surah}:${item.ayah}`, item);
  return [...byKey.values()].sort((a, b) => a.surah - b.surah || a.ayah - b.ayah);
}

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--force") {
      parsed.force = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function numberArg(value, label) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    if (value !== undefined) fail(`--${label} must be a positive integer.`);
    return 0;
  }
  return number;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Could not read JSON ${path}: ${error.message}`);
  }
}

function fetchJson(url) {
  return fetchBuffer(url).then((buffer) => JSON.parse(buffer.toString("utf8")));
}

function fetchBuffer(url) {
  return new Promise((resolveFetch, reject) => {
    get(url, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        fetchBuffer(new URL(response.headers.location, url).toString()).then(resolveFetch, reject);
        return;
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        response.resume();
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolveFetch(Buffer.concat(chunks)));
    }).on("error", reject);
  });
}

function hash(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function pad3(value) {
  return String(value).padStart(3, "0");
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
Download Quran recitation audio by explicit surah and ayah range.

Usage:
  node scripts/download-recitation-audio.mjs --reciter ar.alafasy --surah 1 --ayah-start 1 --ayah-count 7

Options:
  --reciter ID       Reciter identifier from assets/recitation-catalog.json.
  --surah NUMBER     Surah number.
  --ayah-start N     First ayah number.
  --ayah-count N     Number of ayahs to download.
  --out-dir DIR      Audio library directory. Defaults to assets/audio.
  --manifest FILE    Manifest path. Defaults under the reciter audio folder.
  --force            Redownload existing files.
`.trim());
}
