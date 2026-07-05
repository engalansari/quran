#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";

const catalog = JSON.parse(readFileSync("assets/background-library/catalog.json", "utf8"));
const failures = [];
const ids = new Set();
const categoryCounts = {};
const allowedFreeProviders = new Set(["Pexels", "Pixabay", "Mixkit", "Ayah Studio"]);
const blockedCommercialLabels = /\b(pro|premium|paid|shutterstock|istock|adobe stock|editorial only|restricted)\b/i;

if (!catalog.provider?.licenseUrl) failures.push("Missing provider license URL.");
if (!Array.isArray(catalog.items) || catalog.items.length < 3) failures.push("Background catalog is too small.");
if ((catalog.libraryPlan?.targetCount || 0) < 1000) failures.push("Background library target must be at least 1000.");
if (catalog.libraryPlan?.storageMode !== "lazy-download") failures.push("Background library must use lazy-download storage mode.");

for (const item of catalog.items || []) {
  if (ids.has(item.id)) failures.push(`Duplicate id: ${item.id}`);
  ids.add(item.id);
  categoryCounts[item.category || "missing"] = (categoryCounts[item.category || "missing"] || 0) + 1;
  if (item.licenseScope !== "free-commercial") failures.push(`${item.id} is not marked free-commercial.`);
  const provider = item.provider || inferProvider(item) || "Ayah Studio";
  if (!allowedFreeProviders.has(provider)) failures.push(`${item.id} uses unapproved provider: ${provider}.`);
  if (!item.licenseName && provider !== "Ayah Studio") failures.push(`${item.id} is missing licenseName.`);
  if (!item.licenseUrl && provider !== "Ayah Studio") failures.push(`${item.id} is missing licenseUrl.`);
  const labelText = `${item.title || ""} ${item.sourceUrl || ""} ${item.downloadUrl || ""} ${item.licenseName || ""}`;
  if (blockedCommercialLabels.test(labelText)) failures.push(`${item.id} may be paid, premium, restricted, or editorial-only.`);
  ["sourceUrl", "downloadUrl", "localFile", "poster"].forEach((field) => {
    if (!item[field]) failures.push(`${item.id} is missing ${field}.`);
  });
  if (String(item.poster || "").startsWith("assets/background-library/posters/") && !existsSync(item.poster)) {
    failures.push(`${item.id} poster file is missing: ${item.poster}`);
  }
  if (provider !== "Ayah Studio" && existsSync(item.localFile) && statSync(item.localFile).size <= 100000) {
    failures.push(`${item.id} processed file is unexpectedly small.`);
  }
}

const usefulCategoryCount = ["mosque", "nature", "sea", "sky"].filter((category) => categoryCounts[category] > 0).length;
if (usefulCategoryCount < 3) failures.push(`Background catalog category spread is too narrow: ${JSON.stringify(categoryCounts)}`);

const syntax = spawnSync(process.execPath, ["--check", "scripts/download-background-library.mjs"], {
  encoding: "utf8",
  windowsHide: true,
});
if ((syntax.status ?? 1) !== 0) failures.push(syntax.stderr || "download-background-library syntax failed.");
for (const importer of [
  "scripts/import-pixabay-backgrounds.mjs",
  "scripts/import-pexels-backgrounds.mjs",
  "scripts/import-mixkit-backgrounds.mjs",
  "scripts/download-mixkit-posters.mjs",
  "scripts/normalize-background-categories.mjs",
]) {
  const result = spawnSync(process.execPath, ["--check", importer], {
    encoding: "utf8",
    windowsHide: true,
  });
  if ((result.status ?? 1) !== 0) failures.push(result.stderr || `${importer} syntax failed.`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`PASS background catalog has ${catalog.items.length} licensed entries.`);

function inferProvider(item) {
  const source = `${item.sourceUrl || ""} ${item.downloadUrl || ""}`.toLowerCase();
  if (source.includes("pexels.com")) return "Pexels";
  if (source.includes("pixabay.com")) return "Pixabay";
  if (source.includes("mixkit.co")) return "Mixkit";
  return "";
}
