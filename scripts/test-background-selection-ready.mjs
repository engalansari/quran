#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const catalog = JSON.parse(readFileSync("assets/background-library/catalog.json", "utf8"));
const featuredIds = new Set(["makkah", "madinah", "nature"]);
const failures = [];
let visibleUsable = 0;
let localReady = 0;

for (const item of catalog.items || []) {
  if (!item || item.hiddenDuplicate) continue;
  const poster = String(item.poster || "");
  const localPoster = String(item.localPoster || "");
  const fallbackPoster = poster.startsWith("assets/bg-") || poster === "assets/background-library/posters/mixkit-placeholder.jpg";
  const hasRealPoster = !fallbackPoster && Boolean(poster || localPoster);
  const generationReady =
    item.localFileReady === true ||
    (item.remoteOnly === false && item.localFile && existsSync(resolve(item.localFile))) ||
    featuredIds.has(String(item.id || ""));

  if (generationReady) localReady += 1;
  if (hasRealPoster) visibleUsable += 1;

  if (item.remoteOnly === false && item.localFileReady !== true && !existsSync(resolve(item.localFile || ""))) {
    failures.push(`${item.id}: marked local but missing ${item.localFile || "localFile"}`);
  }

  if (item.localFileReady === true && !existsSync(resolve(item.localFile || ""))) {
    failures.push(`${item.id}: marked ready but missing ${item.localFile || "localFile"}`);
  }

  if (item.remoteOnly === true && generationReady) failures.push(`${item.id}: remoteOnly should not be considered locally ready`);
}

if ((catalog.items || []).length < 1000) failures.push(`background catalog should keep 1000 entries, found ${(catalog.items || []).length}`);
if (visibleUsable < 900) failures.push(`background browser should expose 900+ usable poster entries, found ${visibleUsable}`);
if (localReady < 50) failures.push(`background generation should keep at least 50 local-ready entries, found ${localReady}`);

if (failures.length) {
  console.error("FAIL background selection readiness");
  failures.slice(0, 30).forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PASS background selection keeps large browsing library (${visibleUsable} visible, ${localReady} local-ready).`);
