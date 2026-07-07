#!/usr/bin/env node

import { readFileSync } from "node:fs";

const failures = [];
const firebase = readJson("firebase.json");
const dockerfile = readFileSync("Dockerfile", "utf8");
const dockerignore = readFileSync(".dockerignore", "utf8");

if (firebase.hosting?.public !== ".") {
  failures.push("firebase.json hosting.public must stay explicit for the current static app.");
}

const rewrites = firebase.hosting?.rewrites || [];
const apiRewrite = rewrites.find((item) => item.source === "/api/**" && item.run?.serviceId);
if (!apiRewrite) {
  failures.push("firebase.json must route /api/** to Cloud Run.");
}
const outputsRewrite = rewrites.find((item) => item.source === "/outputs/**" && item.run?.serviceId);
if (!outputsRewrite) {
  failures.push("firebase.json must route /outputs/** to Cloud Run so generated MP4 links open online.");
}

const hostingIgnore = firebase.hosting?.ignore || [];
for (const pattern of ["key/**", "outputs/**", "tools/**", "scripts/**", "node_modules/**", "assets/audio/**", "data/source/**", "**/*.md"]) {
  if (!hostingIgnore.includes(pattern)) failures.push(`firebase hosting ignore is missing ${pattern}`);
}

for (const pattern of ["key/", "outputs/", "tools/", "node_modules/", "assets/background-library/source/"]) {
  if (!dockerignore.includes(pattern)) failures.push(`.dockerignore is missing ${pattern}`);
}

for (const token of ["apt-get install", "ffmpeg", "EXPOSE 8080", "scripts/serve-mobile-backend.mjs"]) {
  if (!dockerfile.includes(token)) failures.push(`Dockerfile is missing ${token}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("PASS online config is scaffolded for Firebase Hosting and Cloud Run.");

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${path} is not valid JSON: ${error.message}`);
    return {};
  }
}
