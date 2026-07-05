#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("assets/background-library/catalog.json", "utf8"));
const items = catalog.items || [];
const desiredMinimums = {
  makkah: 25,
  madinah: 25,
  mosque: 40,
  nature: 40,
  sky: 25,
  sea: 25,
};

const fallbackPosters = new Set([
  "assets/bg-makkah.svg",
  "assets/bg-madinah.svg",
  "assets/bg-masjid.svg",
  "assets/bg-nature.svg",
  "assets/bg-calm.svg",
  "assets/bg-history.svg",
]);

function isFallbackPoster(path) {
  const value = String(path || "");
  return value.startsWith("assets/bg-") || fallbackPosters.has(value);
}

function hasRealPoster(item) {
  const poster = String(item.poster || "");
  const localPoster = String(item.localPoster || "");
  if (isFallbackPoster(poster)) return false;
  return (
    poster.startsWith("http") ||
    (localPoster && !isFallbackPoster(localPoster) && existsSync(localPoster)) ||
    (poster && !isFallbackPoster(poster) && existsSync(poster))
  );
}

function isQuranAppropriateBackground(item) {
  const category = String(item.category || "");
  const text = `${item.title || ""} ${item.tags || ""}`.toLowerCase();
  const blockedWords = [
    "people",
    "person",
    "woman",
    "man",
    "girl",
    "boy",
    "couple",
    "party",
    "concert",
    "dance",
    "drink",
    "toasting",
    "beer",
    "wine",
    "campfire",
    "car",
    "cars",
    "traffic",
    "highway",
    "road",
    "bridge",
    "yacht",
    "city",
    "building",
    "office",
    "street",
  ];
  if (blockedWords.some((word) => text.includes(word))) return false;
  if (category !== "nature") return true;

  const calmNatureWords = [
    "meadow",
    "creek",
    "forest",
    "flower",
    "flowers",
    "sunflower",
    "tree",
    "trees",
    "mountain",
    "mountains",
    "hill",
    "hills",
    "waterfall",
    "rain",
    "cloud",
    "clouds",
    "leaf",
    "leaves",
    "green",
    "valley",
    "river",
    "lake",
    "landscape",
    "field",
    "garden",
    "bush",
  ];
  return calmNatureWords.some((word) => text.includes(word));
}

const summary = {};
let hiddenFallbackOnlyRemote = 0;
let localReady = 0;
let remoteWithRealPoster = 0;
let visibleUsable = 0;
let inappropriate = 0;

for (const item of items) {
  const category = item.category || "unknown";
  summary[category] ??= {
    total: 0,
    localReady: 0,
    remoteWithRealPoster: 0,
    hiddenFallbackOnlyRemote: 0,
    inappropriate: 0,
    target: desiredMinimums[category] || 0,
    missingToTarget: 0,
  };

  const poster = String(item.poster || "");
  const realPoster = hasRealPoster(item);
  const appropriate = isQuranAppropriateBackground(item);
  const isHiddenFallbackOnlyRemote = Boolean(item.remoteOnly && isFallbackPoster(poster) && !existsSync(item.localPoster || ""));
  const isLocalReady = Boolean(item.localFile && existsSync(item.localFile));
  const isRemoteWithRealPoster = Boolean(item.remoteOnly && realPoster);
  const isVisibleUsable = realPoster && appropriate;

  summary[category].total += 1;
  if (isLocalReady) {
    summary[category].localReady += 1;
    localReady += 1;
  }
  if (isRemoteWithRealPoster) {
    summary[category].remoteWithRealPoster += 1;
    remoteWithRealPoster += 1;
  }
  if (isVisibleUsable) {
    summary[category].visibleUsable = (summary[category].visibleUsable || 0) + 1;
    visibleUsable += 1;
  }
  if (isHiddenFallbackOnlyRemote) {
    summary[category].hiddenFallbackOnlyRemote += 1;
    hiddenFallbackOnlyRemote += 1;
  }
  if (!appropriate) {
    summary[category].inappropriate += 1;
    inappropriate += 1;
  }
}

for (const [category, data] of Object.entries(summary)) {
  data.visibleUsable = data.visibleUsable || 0;
  data.missingToTarget = Math.max(0, data.target - data.visibleUsable);
}

console.log(JSON.stringify({
  ready: true,
  total: items.length,
  visibleUsable,
  localReady,
  remoteWithRealPoster,
  hiddenFallbackOnlyRemote,
  inappropriate,
  needsApiKeys: true,
  apiKeyNames: ["PIXABAY_API_KEY", "PEXELS_API_KEY"],
  summary,
}, null, 2));
