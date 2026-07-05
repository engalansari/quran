#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));
const max = Number(args.max || 1000);
const pagesPerQuery = Number(args.pages || 45);
const catalogPath = resolve(args.catalog || "assets/background-library/catalog.json");
const queries = (args.queries || "nature,sea,forest,clouds,waterfall,mountain,river,beach,desert,sky,sunset,landscape,flowers,ocean,trees,lake,night")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const byId = new Map((catalog.items || []).map((item) => [item.id, item]));

for (const query of queries) {
  for (let page = 1; page <= pagesPerQuery && byId.size < max; page += 1) {
    const url = `https://mixkit.co/free-stock-video/${encodeURIComponent(query)}/${page > 1 ? `?page=${page}` : ""}`;
    const html = await fetchText(url);
    const paths = [...html.matchAll(/\/free-stock-video\/[^"'#?]+-[0-9]+\//g)]
      .map((match) => match[0])
      .filter((value, index, list) => list.indexOf(value) === index);
    if (!paths.length) break;
    for (const path of paths) {
      const entry = toCatalogEntry(path, query);
      if (!byId.has(entry.id)) byId.set(entry.id, entry);
      if (byId.size >= max) break;
    }
  }
}

catalog.items = [...byId.values()];
catalog.libraryPlan = {
  ...(catalog.libraryPlan || {}),
  targetCount: Math.max(catalog.libraryPlan?.targetCount || 1000, max),
  storageMode: "lazy-download",
  lastImportedProvider: "Mixkit",
  lastImportedAt: new Date().toISOString(),
};

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  ready: true,
  provider: "Mixkit",
  totalCatalogItems: catalog.items.length,
  targetCount: catalog.libraryPlan.targetCount,
}, null, 2));

function toCatalogEntry(path, query) {
  const match = /\/free-stock-video\/(.+)-([0-9]+)\//.exec(path);
  const slug = match?.[1] || path.split("/").filter(Boolean).pop() || "mixkit-video";
  const numericId = match?.[2] || slug;
  const id = `mixkit-${numericId}`;
  const category = inferCategory(`${query} ${slug}`);
  const title = titleFromSlug(slug);
  return {
    id,
    title,
    category,
    provider: "Mixkit",
    sourceUrl: `https://mixkit.co${path}`,
    downloadUrl: `https://assets.mixkit.co/videos/${numericId}/${numericId}-720.mp4`,
    licenseScope: "free-commercial",
    licenseName: "Mixkit Stock Video Free License",
    licenseUrl: "https://mixkit.co/license/",
    localSource: `assets/background-library/source/${id}.mp4`,
    localFile: `assets/background-library/processed/${id}.mp4`,
    poster: `assets/background-library/posters/${id}.jpg`,
    localPoster: `assets/background-library/posters/${id}.jpg`,
    remoteOnly: true,
    tags: query,
  };
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) return "";
  return response.text();
}

function titleFromSlug(slug) {
  return String(slug)
    .replace(/-[0-9]+$/, "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferCategory(value) {
  const text = value.toLowerCase();
  if (/(mosque|islam|religion|masjid)/.test(text)) return "mosque";
  if (/(sea|ocean|wave|beach|water)/.test(text)) return "sea";
  if (/(sky|cloud|sun|moon|star|night|sunset)/.test(text)) return "sky";
  return "nature";
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
