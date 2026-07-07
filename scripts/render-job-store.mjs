import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const STATUSES = new Set(["pending", "processing", "completed", "failed", "expired", "deleted"]);

export function createRenderJobStore(path = "outputs/render-jobs-local.json") {
  const storePath = resolve(path);
  return {
    create(input = {}) {
      const now = new Date().toISOString();
      const job = {
        jobId: newJobId(),
        status: "pending",
        createdAt: now,
        updatedAt: now,
        userId: sanitizeText(input.userId || "local-user", 80),
        request: normalizeRequest(input.request || {}),
        result: null,
        error: "",
      };
      const data = readStore(storePath);
      data.jobs[job.jobId] = job;
      writeStore(storePath, data);
      return job;
    },

    get(jobId) {
      return readStore(storePath).jobs[String(jobId || "")] || null;
    },

    update(jobId, patch = {}) {
      const data = readStore(storePath);
      const job = data.jobs[String(jobId || "")];
      if (!job) return null;
      const next = {
        ...job,
        ...safePatch(patch),
        updatedAt: new Date().toISOString(),
      };
      data.jobs[job.jobId] = next;
      writeStore(storePath, data);
      return next;
    },

    path: storePath,
  };
}

export function normalizeRenderStatus(value) {
  const status = String(value || "").trim();
  return STATUSES.has(status) ? status : "";
}

function readStore(path) {
  if (!existsSync(path)) return { jobs: {} };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return parsed && typeof parsed === "object" && parsed.jobs && typeof parsed.jobs === "object"
      ? parsed
      : { jobs: {} };
  } catch {
    return { jobs: {} };
  }
}

function writeStore(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function safePatch(patch) {
  const next = {};
  if (normalizeRenderStatus(patch.status)) next.status = normalizeRenderStatus(patch.status);
  if (patch.result !== undefined) next.result = patch.result;
  if (patch.error !== undefined) next.error = sanitizeText(patch.error, 2000);
  return next;
}

function normalizeRequest(request) {
  return {
    type: request.type === "external-audio" ? "external-audio" : "selected-ayah",
    surah: positiveInteger(request.surah),
    ayahStart: positiveInteger(request.ayahStart),
    ayahCount: positiveInteger(request.ayahCount),
    reciter: sanitizeText(request.reciter || "ar.alafasy", 80),
    background: sanitizeText(request.background || "nature", 160),
    template: sanitizeText(request.template || "classic", 40),
    textPosition: sanitizeText(request.textPosition || "center", 40),
    fontSize: positiveInteger(request.fontSize) || 64,
    opacity: boundedNumber(request.opacity, 0, 1, 0.75),
  };
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function sanitizeText(value, limit) {
  return String(value || "")
    .replace(/[\x00-\x1F<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function newJobId() {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
