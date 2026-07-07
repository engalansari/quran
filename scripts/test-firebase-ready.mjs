#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const failures = [];

const firebase = readJson("firebase.json");
const dockerfile = readText("Dockerfile");
const deployScript = readText("scripts/deploy-cloud-run.ps1");
const firebaseRc = existsSync(".firebaserc") ? readJson(".firebaserc") : null;

if (!firebaseRc) {
  failures.push("Missing .firebaserc. Copy .firebaserc.example to .firebaserc and set your project id.");
} else {
  const projectId = firebaseRc.projects?.default;
  if (!projectId || projectId === "YOUR_FIREBASE_PROJECT_ID") {
    failures.push(".firebaserc default project id is not configured.");
  }
}

const hostingIgnore = firebase.hosting?.ignore || [];
for (const pattern of [
  "key/**",
  "outputs/**",
  "tools/**",
  "scripts/**",
  "assets/audio/**",
  "data/source/**",
  "**/*.md",
  "quran-phone-*.png",
  "assets/background-library/source/**",
]) {
  if (!hostingIgnore.includes(pattern)) {
    failures.push(`firebase.json hosting.ignore is missing ${pattern}`);
  }
}

const apiRewrite = (firebase.hosting?.rewrites || []).find((rewrite) => rewrite.source === "/api/**");
if (apiRewrite?.run?.serviceId !== "ayah-studio-render") {
  failures.push("firebase.json must rewrite /api/** to Cloud Run service ayah-studio-render.");
}

if (apiRewrite?.run?.region !== "us-central1") {
  failures.push("firebase.json Cloud Run rewrite region must stay us-central1 unless deploy docs are updated.");
}

const outputsRewrite = (firebase.hosting?.rewrites || []).find((rewrite) => rewrite.source === "/outputs/**");
if (outputsRewrite?.run?.serviceId !== "ayah-studio-render") {
  failures.push("firebase.json must rewrite /outputs/** to Cloud Run for generated MP4 files.");
}

if (outputsRewrite?.run?.region !== "us-central1") {
  failures.push("firebase.json /outputs/** Cloud Run rewrite region must stay us-central1 unless deploy docs are updated.");
}

for (const token of ["ffmpeg", "FFMPEG=ffmpeg", "FFPROBE=ffprobe", "EXPOSE 8080"]) {
  if (!dockerfile.includes(token)) failures.push(`Dockerfile is missing ${token}`);
}

for (const token of ["--min-instances 0", "--max-instances", "--concurrency", "MaxInstances = 1"]) {
  if (!deployScript.includes(token)) failures.push(`scripts/deploy-cloud-run.ps1 is missing cost guard ${token}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("PASS Firebase project and deployment files are ready.");

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    failures.push(`Could not read ${path}: ${error.message}`);
    return "";
  }
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    failures.push(`${path} is not valid JSON: ${error.message}`);
    return {};
  }
}
