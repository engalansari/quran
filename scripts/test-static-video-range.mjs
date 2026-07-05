#!/usr/bin/env node

import { spawn } from "node:child_process";
import { request } from "node:http";

const port = 4187;
const server = spawn(process.execPath, ["scripts/serve-mobile-backend.mjs", "--host", "127.0.0.1", "--port", String(port)], {
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

try {
  await waitForServer(port);
  const response = await requestRange(port, "/assets/production/nature.mp4", "bytes=0-99");
  if (response.statusCode !== 206) {
    throw new Error(`Expected 206 for ranged MP4 request, got ${response.statusCode}`);
  }
  if (!/^bytes 0-99\//.test(response.headers["content-range"] || "")) {
    throw new Error(`Unexpected Content-Range: ${response.headers["content-range"] || ""}`);
  }
  if (response.body.length !== 100) {
    throw new Error(`Expected 100 bytes, got ${response.body.length}`);
  }
  console.log("PASS static video range support works.");
} finally {
  server.kill();
}

function waitForServer(targetPort) {
  const deadline = Date.now() + 7000;
  return new Promise((resolveWait, rejectWait) => {
    const attempt = () => {
      requestRange(targetPort, "/", "").then(resolveWait).catch((error) => {
        if (Date.now() > deadline) {
          rejectWait(error);
          return;
        }
        setTimeout(attempt, 150);
      });
    };
    attempt();
  });
}

function requestRange(targetPort, path, range) {
  return new Promise((resolveRequest, rejectRequest) => {
    const req = request({
      hostname: "127.0.0.1",
      port: targetPort,
      path,
      method: "GET",
      headers: range ? { Range: range } : {},
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        resolveRequest({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on("error", rejectRequest);
    req.end();
  });
}
