#!/usr/bin/env node

import { createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";

const args = parseArgs(process.argv.slice(2));
const catalogPath = resolve(args.catalog || "assets/background-library/catalog.json");
const limit = Number(args.limit || 0);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const items = catalog.items.filter((item) => item.provider === "Mixkit");
const selected = limit > 0 ? items.slice(0, limit) : items;

let downloaded = 0;
let existing = 0;
let failed = 0;

for (const item of selected) {
  const localPoster = item.localPoster || `assets/background-library/posters/${item.id}.jpg`;
  const localPath = resolve(localPoster);
  mkdirSync(dirname(localPath), { recursive: true });

  if (existsSync(localPath) && statSync(localPath).size > 1000) {
    item.poster = localPoster;
    item.localPoster = localPoster;
    existing += 1;
    continue;
  }

  const urls = posterCandidates(item);
  let ok = false;
  for (const url of urls) {
    try {
      await download(url, localPath);
      if (existsSync(localPath) && statSync(localPath).size > 1000) {
        item.poster = localPoster;
        item.localPoster = localPoster;
        downloaded += 1;
        ok = true;
        break;
      }
    } catch {
      // Try next candidate.
    }
  }
  if (!ok) {
    item.poster = fallbackPoster(item);
    item.localPoster = localPoster;
    failed += 1;
  }
}

catalog.libraryPlan = {
  ...(catalog.libraryPlan || {}),
  posterDownloadedAt: new Date().toISOString(),
  posterDownloadStats: { downloaded, existing, failed },
};
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  ready: true,
  total: selected.length,
  downloaded,
  existing,
  failed,
}, null, 2));

function posterCandidates(item) {
  const numeric = String(item.id || "").replace(/^mixkit-/, "");
  const urls = [];
  if (item.poster && /^https?:\/\//i.test(item.poster)) urls.push(item.poster);
  if (/^[0-9]+$/.test(numeric)) {
    urls.push(`https://assets.mixkit.co/videos/${numeric}/${numeric}-thumb-360-0.jpg`);
    urls.push(`https://assets.mixkit.co/videos/${numeric}/${numeric}-thumb-360-1.jpg`);
    urls.push(`https://assets.mixkit.co/videos/${numeric}/${numeric}-thumb-720-0.jpg`);
    urls.push(`https://mixkit-resized.envatousercontent.com/mixkit/videos/${numeric}/${numeric}-thumb-360-0.jpg`);
  }
  return [...new Set(urls)];
}

function fallbackPoster(item) {
  if (item.category === "mosque") return "assets/bg-makkah.svg";
  if (item.category === "sea") return "assets/bg-nature.svg";
  if (item.category === "sky") return "assets/bg-calm.svg";
  return "assets/bg-nature.svg";
}

async function download(url, localPath) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`HTTP ${response.status}`);
  }
  await pipeline(response.body, createWriteStream(localPath));
}

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}
