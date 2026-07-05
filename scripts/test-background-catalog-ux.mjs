#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("assets/background-library/catalog.json", "utf8"));
const items = catalog.items || [];
const fallbackPosters = new Set([
  "assets/bg-makkah.svg",
  "assets/bg-madinah.svg",
  "assets/bg-masjid.svg",
  "assets/bg-nature.svg",
  "assets/bg-calm.svg",
  "assets/bg-history.svg",
]);

const missingVideoSource = [];
const missingPosterFallback = [];
const hiddenFallbackOnlyRemote = [];
const duplicateVisibleSources = [];
const seenVisibleSources = new Map();

for (const item of items) {
  const poster = String(item.poster || "");
  const localPoster = String(item.localPoster || "");
  const hasPoster =
    poster.startsWith("http") ||
    fallbackPosters.has(poster) ||
    Boolean(localPoster) ||
    existsSync(poster);
  const hasVideoSource =
    Boolean(item.downloadUrl) ||
    Boolean(item.localFile) ||
    Boolean(item.localSource);

  if (!hasPoster) missingPosterFallback.push(item.id);
  if (!hasVideoSource) missingVideoSource.push(item.id);
  if (item.remoteOnly && fallbackPosters.has(poster) && !localPoster) {
    hiddenFallbackOnlyRemote.push(item.id);
  }
  const visibleSourceKey = String(item.localFile || item.localSource || item.sourceUrl || item.downloadUrl || "").toLowerCase();
  if (!item.hiddenDuplicate && visibleSourceKey && hasPoster && hasVideoSource) {
    const previous = seenVisibleSources.get(visibleSourceKey);
    if (previous) {
      duplicateVisibleSources.push(`${previous} / ${item.id}`);
    } else {
      seenVisibleSources.set(visibleSourceKey, item.id);
    }
  }
}

if (missingPosterFallback.length || missingVideoSource.length || duplicateVisibleSources.length) {
  console.error("FAIL background catalog UX readiness");
  if (missingPosterFallback.length) {
    console.error(`Missing poster/fallback: ${missingPosterFallback.slice(0, 20).join(", ")}`);
  }
  if (missingVideoSource.length) {
    console.error(`Missing video source: ${missingVideoSource.slice(0, 20).join(", ")}`);
  }
  if (duplicateVisibleSources.length) {
    console.error(`Duplicate visible sources: ${duplicateVisibleSources.slice(0, 20).join(", ")}`);
  }
  process.exit(1);
}

console.log(`PASS background catalog UX readiness: ${items.length} entries have poster fallback and video source.`);
if (hiddenFallbackOnlyRemote.length) {
  console.log(`INFO hidden fallback-only remote entries: ${hiddenFallbackOnlyRemote.length}`);
}
