#!/usr/bin/env node

import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync("assets/free-reels-catalog.json", "utf8"));
const failures = [];
const blocked = /\b(premium|paid|shutterstock|istock|adobe|canva\.com|editorial|restricted)\b/i;
const allowedProviders = new Set(["Pixabay", "Pexels"]);

for (const item of catalog.items || []) {
  if (!item.id) failures.push("Missing item id.");
  if (!item.verifiedFree) failures.push(`${item.id} is not marked verifiedFree.`);
  if (!allowedProviders.has(item.provider)) failures.push(`${item.id} provider is not approved: ${item.provider}`);
  for (const field of ["sourceUrl", "poster", "licenseUrl"]) {
    if (!item[field]) failures.push(`${item.id} is missing ${field}.`);
  }
  const text = `${item.title || ""} ${item.sourceUrl || ""} ${item.poster || ""} ${item.licenseUrl || ""}`;
  if (blocked.test(text)) failures.push(`${item.id} has a blocked paid or editor link.`);
}

for (const page of catalog.searchPages || []) {
  if (!allowedProviders.has(page.provider)) failures.push(`${page.id} provider is not approved: ${page.provider}`);
  const text = `${page.title || ""} ${page.sourceUrl || ""} ${page.licenseUrl || ""}`;
  if (blocked.test(text)) failures.push(`${page.id} has a blocked paid or editor link.`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`PASS free reels catalog has ${catalog.items.length} verified free video links.`);
