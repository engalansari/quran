#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { inferStrictCategory } from "./background-source-filter.mjs";

const catalogPath = "assets/background-library/catalog.json";
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const FIXED_CATEGORIES = new Map([
  ["makkah", "makkah"],
  ["pixabay-198048-makkah-haram", "makkah"],
  ["pixabay-198047-makkah-kaaba", "makkah"],
  ["madinah", "madinah"],
  ["pixabay-112360-madinah-nabawi", "madinah"],
]);

const rules = [
  {
    category: "makkah",
    words: ["makkah", "mecca", "kaaba", "kaba", "masjid al haram", "haram", "hajj", "umrah"],
  },
  {
    category: "madinah",
    words: ["madinah", "madina", "medina", "nabawi", "nabvi", "prophet mosque", "masjide nabvi"],
  },
  {
    category: "mosque",
    words: ["mosque", "masjid", "islam", "islamic", "prayer", "minaret"],
  },
  {
    category: "sea",
    words: ["sea", "ocean", "wave", "waves", "beach", "coast", "coastal", "shore", "reef", "lagoon", "sailboat", "yacht", "waterfall"],
  },
  {
    category: "sky",
    words: ["sky", "cloud", "clouds", "sunset", "sunrise", "sun", "moon", "star", "stars", "night", "dusk", "dawn"],
  },
  {
    category: "nature",
    words: [
      "forest",
      "tree",
      "trees",
      "flower",
      "flowers",
      "mountain",
      "mountains",
      "meadow",
      "field",
      "landscape",
      "creek",
      "river",
      "lake",
      "desert",
      "valley",
      "snow",
      "hill",
      "hills",
      "green",
      "leaves",
      "leaf",
      "rocks",
      "rocky",
    ],
  },
];

function inferCategory(item) {
  if (FIXED_CATEGORIES.has(item.id)) return FIXED_CATEGORIES.get(item.id);
  const text = `${item.title || ""} ${item.tags || ""} ${item.sourceUrl || ""} ${item.id || ""}`.toLowerCase();
  const strictCategory = inferStrictCategory(text);
  if (strictCategory === "makkah" || strictCategory === "madinah") return strictCategory;

  const score = new Map(rules.map((rule) => [rule.category, 0]));

  for (const rule of rules) {
    for (const word of rule.words) {
      if (text.includes(word)) score.set(rule.category, score.get(rule.category) + 1);
    }
  }

  const ranked = [...score.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked[0][1] > 0) return ranked[0][0];
  return item.category || "nature";
}

const counts = {};
let changed = 0;

catalog.items = (catalog.items || []).map((item) => {
  const category = inferCategory(item);
  counts[category] = (counts[category] || 0) + 1;
  if (category === item.category) return item;
  changed += 1;
  return { ...item, category };
});

catalog.libraryPlan = {
  ...(catalog.libraryPlan || {}),
  categoryNormalizedAt: new Date().toISOString(),
  categoryNormalizeStats: { changed, counts },
};

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ changed, counts }, null, 2));
