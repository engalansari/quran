#!/usr/bin/env node

import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const tempDir = mkdtempSync(join(tmpdir(), "ayah-studio-quran-authority-"));
const authorityPath = join(tempDir, "authority.json");

try {
  writeFileSync(authorityPath, JSON.stringify({
    authority: {
      name: "Trusted Quran Source",
      officialSiteUrl: "https://trusted.example/",
      developerPlatformUrl: "https://trusted.example/developer/",
      acceptedSourceDomains: ["trusted.example"],
      acceptedFormats: ["json", "csv"],
      reviewed: false,
    },
  }, null, 2), "utf8");

  const valid = run([
    "scripts/validate-quran-source-authority.mjs",
    "--file", authorityPath,
    "--source-url", "https://downloads.trusted.example/quran.csv",
  ]);
  assert(valid.status === 0, valid.output || "trusted source URL should pass");

  const invalid = run([
    "scripts/validate-quran-source-authority.mjs",
    "--file", authorityPath,
    "--source-url", "https://untrusted.example/quran.csv",
  ]);
  assert(invalid.status !== 0, "untrusted source URL should fail");
  assert(invalid.output.includes("source URL host is not in accepted domains"), "untrusted failure reason missing");

  console.log("PASS Quran source authority validation test completed.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

function run(args) {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
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
