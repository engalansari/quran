#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { inferStrictCategory, isSuitableBackgroundEntry } from "./background-source-filter.mjs";

const args = parseArgs(process.argv.slice(2));
const apiKey = args.key || process.env.PEXELS_API_KEY;
const max = Number(args.max || 1000);
const catalogPath = resolve(args.catalog || "assets/background-library/catalog.json");
const queries = (args.queries || "makkah,madinah,mecca,medina,kaaba,masjid nabawi,masjid al haram,mosque,islamic,nature,sea,sky,clouds,waterfall,river,mountains,forest,desert,landscape")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

if (!apiKey) {
  fail("Missing Pexels API key. Set PEXELS_API_KEY or pass --key.");
}

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const byId = new Map((catalog.items || []).map((item) => [item.id, item]));

for (const query of queries) {
  for (let page = 1; page <= 8 && byId.size < max; page += 1) {
    const url = new URL("https://api.pexels.com/v1/videos/search");
    url.searchParams.set("query", query);
    url.searchParams.set("orientation", "portrait");
    url.searchParams.set("per_page", "80");
    url.searchParams.set("page", String(page));
    const response = await fetch(url, { headers: { Authorization: apiKey } });
    if (!response.ok) fail(`Pexels API failed for ${query} page ${page}: HTTP ${response.status}`);
    const data = await response.json();
    for (const video of data.videos || []) {
      const entry = toCatalogEntry(video, query);
      if (entry && !byId.has(entry.id)) byId.set(entry.id, entry);
      if (byId.size >= max) break;
    }
    if (!data.videos?.length) break;
  }
}

catalog.items = [...byId.values()];
catalog.libraryPlan = {
  ...(catalog.libraryPlan || {}),
  targetCount: Math.max(catalog.libraryPlan?.targetCount || 1000, max),
  storageMode: "lazy-download",
  lastImportedProvider: "Pexels",
  lastImportedAt: new Date().toISOString(),
};
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  ready: true,
  provider: "Pexels",
  totalCatalogItems: catalog.items.length,
  targetCount: catalog.libraryPlan.targetCount,
}, null, 2));

function toCatalogEntry(video, query) {
  const files = [...(video.video_files || [])].filter((file) => file.link && file.file_type === "video/mp4");
  files.sort((a, b) => Math.abs((a.width || 0) - 1080) - Math.abs((b.width || 0) - 1080));
  const file = files[0];
  const poster = video.image;
  if (!file?.link || !poster) return null;
  const title = titleFromPexelsUrl(video.url) || `Pexels video ${video.id}`;
  const category = inferStrictCategory(`${query} ${title}`);
  const id = `pexels-${video.id}`;
  const entry = {
    id,
    title,
    category,
    provider: "Pexels",
    sourceUrl: video.url,
    downloadUrl: file.link,
    licenseScope: "free-commercial",
    licenseName: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
    localSource: `assets/background-library/source/${id}.mp4`,
    localFile: `assets/background-library/processed/${id}.mp4`,
    poster,
    localPoster: `assets/background-library/posters/${id}.jpg`,
    remoteOnly: true,
    author: video.user?.name || "",
    authorUrl: video.user?.url || "",
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

function titleFromPexelsUrl(value) {
  if (!value) return "";
  try {
    const url = new URL(value);
    const slug = url.pathname.split("/").filter(Boolean).at(-1) || "";
    return slug
      .replace(/-\d+$/, "")
      .replaceAll("-", " ")
      .trim();
  } catch {
    return "";
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
