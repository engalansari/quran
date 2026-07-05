#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-background-entry-"));
const mediaPath = join(tempDir, "makkah.mp4");
const catalogPath = join(tempDir, "backgrounds.json");

try {
  writeFileSync(mediaPath, "licensed background bytes", "utf8");

  const add = spawnSync(process.execPath, [
    "scripts/add-background-catalog-entry.mjs",
    "--catalog", catalogPath,
    "--file", mediaPath,
    "--id", "makkah-production",
    "--name", "Makkah Production",
    "--category", "landmark",
    "--source-name", "Licensed Provider",
    "--source-url", "https://example.com/license",
    "--license", "Licensed for social publishing",
    "--reviewed",
    "--export-ready",
    "--no-attribution-required",
    "--review-note", "Visual and license review completed.",
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  assert(add.status === 0, `${add.stdout || ""}${add.stderr || ""}`.trim());
  assert(existsSync(catalogPath), "catalog was not written");

  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  assert(catalog.backgrounds?.length === 1, "catalog should contain one background");
  assert(catalog.backgrounds[0].sha256?.length === 64, "background sha256 missing");

  const valid = runValidator(catalogPath);
  assert(valid.status === 0, valid.output || "valid catalog should pass");

  writeFileSync(mediaPath, "changed background bytes", "utf8");
  const invalid = runValidator(catalogPath);
  assert(invalid.status !== 0, "changed media file should fail sha256 validation");
  assert(invalid.output.includes("sha256 does not match"), "sha256 mismatch message missing");

  console.log("PASS Background catalog entry test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function runValidator(path) {
  const result = spawnSync(process.execPath, [
    "scripts/validate-background-catalog.mjs",
    "--file", path,
    "--require-files",
  ], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  return {
    status: result.status ?? 1,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
