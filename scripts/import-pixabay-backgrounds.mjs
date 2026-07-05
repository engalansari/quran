#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { inferStrictCategory, isSuitableBackgroundEntry } from "./background-source-filter.mjs";

const args = parseArgs(process.argv.slice(2));
const apiKey = args.key || process.env.PIXABAY_API_KEY;
const max = Number(args.max || 1000);
const catalogPath = resolve(args.catalog || "assets/background-library/catalog.json");
const queries = (args.queries || "makkah,madinah,mecca,medina,kaaba,masjid nabawi,masjid al haram,mosque,islamic,nature,sea,sky,clouds,waterfall,river,mountains,forest,desert,travel,landscape")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!apiKey) {
  fail("Missing Pixabay API key. Set PIXABAY_API_KEY or pass --key.");
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const byId = new Map((catalog.items || []).map((item) => [item.id, item]));

for (const query of queries) {
  for (let page = 1; page <= 10 && byId.size < max; page += 1) {
    const url = new URL("https://pixabay.com/api/videos/");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("q", query);
    url.searchParams.set("safesearch", "true");
    url.searchParams.set("per_page", "200");
    url.searchParams.set("page", String(page));
    const response = await fetch(url);
    if (!response.ok) fail(`Pixabay API failed for ${query} page ${page}: HTTP ${response.status}`);
    const data = await response.json();
    for (const hit of data.hits || []) {
      const entry = toCatalogEntry(hit, query);
      if (entry && !byId.has(entry.id)) byId.set(entry.id, entry);
      if (byId.size >= max) break;
    }
    if (!data.hits?.length) break;
  }
}

catalog.items = [...byId.values()];
catalog.libraryPlan = {
  ...(catalog.libraryPlan || {}),
  targetCount: Math.max(catalog.libraryPlan?.targetCount || 1000, max),
  storageMode: "lazy-download",
  lastImportedProvider: "Pixabay",
  lastImportedAt: new Date().toISOString(),
};
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  ready: true,
  provider: "Pixabay",
  totalCatalogItems: catalog.items.length,
  targetCount: catalog.libraryPlan.targetCount,
}, null, 2));

function toCatalogEntry(hit, query) {
  const video = hit.videos?.medium || hit.videos?.small || hit.videos?.tiny;
  if (!video?.url || !video.thumbnail) return null;
  const category = inferStrictCategory(`${query} ${hit.tags || ""}`);
  const id = `pixabay-${hit.id}`;
  const entry = {
    id,
    title: hit.tags || `Pixabay video ${hit.id}`,
    category,
    provider: "Pixabay",
    sourceUrl: hit.pageURL,
    downloadUrl: video.url,
    licenseScope: "free-commercial",
    licenseName: "Pixabay Content License",
    licenseUrl: "https://pixabay.com/service/license-summary/",
    localSource: `assets/background-library/source/${id}.mp4`,
    localFile: `assets/background-library/processed/${id}.mp4`,
    poster: video.thumbnail,
    localPoster: `assets/background-library/posters/${id}.jpg`,
    remoteOnly: true,
    tags: hit.tags || "",
    author: hit.user || "",
  };
  return isSuitableBackgroundEntry(entry, category) ? entry : null;
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

function fail(message) {
  console.error(message);
  process.exit(1);
}
