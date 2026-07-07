#!/usr/bin/env node

import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createRenderJobStore } from "./render-job-store.mjs";

const path = join(tmpdir(), `ayah-studio-render-jobs-${Date.now()}.json`);
const store = createRenderJobStore(path);

const job = store.create({
  userId: "tester",
  request: {
    surah: 1,
    ayahStart: 1,
    ayahCount: 1,
    reciter: "ar.alafasy",
    background: "nature",
  },
});

assert(job.jobId, "job id should be created");
assert(job.status === "pending", "new job should be pending");
assert(job.userId === "tester", "user id should be stored");

const processing = store.update(job.jobId, { status: "processing" });
assert(processing.status === "processing", "job should move to processing");

const completed = store.update(job.jobId, {
  status: "completed",
  result: { ready: true, outUrl: "/outputs/example.mp4" },
});
assert(completed.status === "completed", "job should move to completed");
assert(store.get(job.jobId).result.outUrl === "/outputs/example.mp4", "job result should persist");

if (existsSync(path)) rmSync(path);
console.log("PASS render job store lifecycle works.");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}
