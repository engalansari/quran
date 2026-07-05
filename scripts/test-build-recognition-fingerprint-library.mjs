#!/usr/bin/env node

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const root = join(tmpdir(), `ayah-studio-fingerprints-${Date.now()}`);
const sourceDir = join(root, "audio");
const outFile = join(root, "recognition-fingerprints.json");

mkdirSync(sourceDir, { recursive: true });
writeFileSync(join(sourceDir, "001001.mp3"), Buffer.from("test audio one"));
writeFileSync(join(sourceDir, "001002.mp3"), Buffer.from("test audio two"));

try {
  const build = spawnSync(process.execPath, [
    "scripts/build-recognition-fingerprint-library.mjs",
    "--source-dir",
    sourceDir,
    "--provider",
    "Local test provider",
    "--version",
    "fixture-v1",
    "--source-url",
    "https://example.test/quran-audio",
    "--out",
    outFile,
    "--limit",
    "2",
  ], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (build.status !== 0) {
    console.error(build.stdout);
    console.error(build.stderr);
    throw new Error("Fingerprint library builder failed.");
  }

  const data = JSON.parse(readFileSync(outFile, "utf8"));
  const entries = data.library.entries;
  assert(entries.length === 2, "builder should write two entries");
  assert(entries[0].surah === 1 && entries[0].ayah === 1, "first entry should be 1:1");
  assert(entries[1].surah === 1 && entries[1].ayah === 2, "second entry should be 1:2");
  assert(entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.audioSha256)), "entries should include audio hashes");
  assert(entries.every((entry) => String(entry.fingerprint).startsWith("sha256:") || String(entry.fingerprint).startsWith("chromaprint:")), "entries should include exact fingerprints");
  assert(data.library.matchPolicy === "exact-fingerprint-only", "library should keep exact-only policy");
  assert(data.library.exportReady === false, "partial generated library must not be export-ready");

  const validation = spawnSync(process.execPath, [
    "scripts/validate-recognition-fingerprint-library.mjs",
    "--file",
    outFile,
    "--require-complete",
    "--require-audio-hashes",
  ], {
    encoding: "utf8",
    windowsHide: true,
  });
  assert(validation.status === 1, "partial generated library should fail complete validation");

  console.log("PASS Recognition fingerprint library builder test completed.");
} finally {
  rmSync(root, { recursive: true, force: true });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
