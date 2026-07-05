#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { isSuitableBackgroundEntry } from "./background-source-filter.mjs";

const args = parseArgs(process.argv.slice(2));
const catalogPath = resolve(args.catalog || "assets/background-library/catalog.json");
const dryRun = Boolean(args["dry-run"]);
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const before = catalog.items || [];
const removed = [];
const kept = [];

for (const item of before) {
  if (isSuitableBackgroundEntry(item, item.category)) {
    kept.push(item);
  } else {
    removed.push({
      id: item.id,
      category: item.category,
      title: item.title,
      provider: item.provider,
    });
  }
}

if (!dryRun) {
  catalog.items = kept;
  catalog.libraryPlan = {
    ...(catalog.libraryPlan || {}),
    strictFilteredAt: new Date().toISOString(),
    strictFilterRemoved: removed.length,
  };
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify({
  ready: true,
  dryRun,
  before: before.length,
  after: kept.length,
  removed: removed.length,
  removedPreview: removed.slice(0, 40),
}, null, 2));

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = input[index + 1];
      if (!next || next.startsWith("--")) {
        parsed[key] = true;
      } else {
        parsed[key] = next;
        index += 1;
      }
    }
  }
  return parsed;
}
