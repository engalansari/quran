#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const tempRoot = mkdtempSync(join(tmpdir(), "ayah-backend-background-"));
const port = 43000 + Math.floor(Math.random() * 1000);
let server = null;

try {
  mkdirSync(join(tempRoot, "assets", "background-library"), { recursive: true });
  writeFileSync(join(tempRoot, "index.html"), "<!doctype html><title>test</title>", "utf8");
  writeFileSync(join(tempRoot, "assets", "background-library", "catalog.json"), JSON.stringify({
    items: [
      {
        id: "remote-fallback-only",
        title: "Fallback-only remote background",
        category: "nature",
        poster: "assets/bg-nature.svg",
        localFile: "assets/background-library/processed/remote-fallback-only.mp4",
        downloadUrl: "",
        remoteOnly: true,
        licenseScope: "free-commercial",
      },
    ],
  }, null, 2), "utf8");

  server = spawn(process.execPath, [
    "scripts/serve-mobile-backend.mjs",
    "--root", tempRoot,
    "--host", "127.0.0.1",
    "--port", String(port),
  ], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  await waitForServer(port);

  const response = await fetch(`http://127.0.0.1:${port}/api/compose-selected-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      surah: 1,
      ayahStart: 1,
      ayahCount: 1,
      reciter: "ar.alafasy",
      background: "remote-fallback-only",
    }),
  });
  const result = await response.json();

  if (response.status !== 400 || result.ready !== false || !String(result.error || "").includes("background")) {
    throw new Error(`Expected clear background readiness failure, got HTTP ${response.status}: ${JSON.stringify(result)}`);
  }

  console.log("PASS backend rejects unprepared fallback-only background before generation.");
} finally {
  if (server) {
    server.kill();
  }
  rmSync(tempRoot, { recursive: true, force: true });
}

async function waitForServer(portNumber) {
  const deadline = Date.now() + 8000;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${portNumber}/`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Backend did not start in time: ${lastError?.message || "timeout"}`);
}
