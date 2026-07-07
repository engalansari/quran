#!/usr/bin/env node

import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { createRenderJobStore } from "./render-job-store.mjs";

const args = parseArgs(process.argv.slice(2));
const root = resolve(args.root || process.cwd());
const host = args.host || "0.0.0.0";
const port = Number(args.port || process.env.PORT || 4173);
const uploadDir = resolve(args["upload-dir"] || join(tmpdir(), "ayah-studio-uploads"));
const quranPath = resolve(args.quran || "data/quran-uthmani.json");
const whisperPath = resolve(args.whisper || "tools/whisper.cpp/Release/whisper-cli.exe");
const modelPath = resolve(args.model || "tools/whisper.cpp/models/ggml-small.bin");
const ffmpegPath = executableArg(args.ffmpeg, process.env.FFMPEG, "tools/ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe", "ffmpeg");
const renderJobs = createRenderJobStore(args["jobs-file"] || join(root, "outputs/render-jobs-local.json"));
const privateAppToken = String(process.env.PRIVATE_APP_TOKEN || args["private-token"] || "").trim();

mkdirSync(uploadDir, { recursive: true });

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${host}:${port}`);
    if (url.pathname.startsWith("/api/") && !isAuthorizedPrivateRequest(request)) {
      writeJson(response, 401, {
        ready: false,
        error: "Private access code is required.",
        code: "private-access-required",
      });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/transcribe-match") {
      await handleTranscribeMatch(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/compose-selected-video") {
      await handleComposeSelectedVideo(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/render") {
      await handleCreateRenderJob(request, response);
      return;
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/render/")) {
      await handleGetRenderJob(url, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/compose-external-audio-video") {
      await handleComposeExternalAudioVideo(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/prepare-background") {
      await handlePrepareBackground(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/refresh-background-library") {
      await handleRefreshBackgroundLibrary(request, response);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/saadi-tafsir") {
      await handleSaadiTafsir(url, response);
      return;
    }
    serveStatic(request, url.pathname, response);
  } catch (error) {
    writeJson(response, 500, {
      ready: false,
      error: error.message,
    });
  }
});

server.listen(port, host, () => {
  console.log(`Ayah Studio mobile backend: http://${host}:${port}/`);
  console.log("Open this from the phone using the computer LAN IP on the same port.");
  console.log(`Serving: ${root}`);
});

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function isAuthorizedPrivateRequest(request) {
  if (!privateAppToken) return true;
  const headerToken = String(request.headers["x-ayah-private-token"] || "").trim();
  const authorization = String(request.headers.authorization || "").trim();
  const bearerToken = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
  return headerToken === privateAppToken || bearerToken === privateAppToken;
}

async function handleSaadiTafsir(url, response) {
  const verseKey = String(url.searchParams.get("verse_key") || "").trim();
  if (!/^\d{1,3}:\d{1,3}$/.test(verseKey)) {
    writeJson(response, 400, { ready: false, error: "Missing valid verse_key." });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const apiUrl = `https://api.quran.com/api/v4/tafsirs/91/by_ayah/${encodeURIComponent(verseKey)}`;
    const apiResponse = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Ayah-Studio/1.0",
      },
    });
    const payload = await apiResponse.json().catch(() => null);
    const html = payload?.tafsir?.text || "";
    const text = cleanTafsirHtml(html);

    if (!apiResponse.ok || !text) {
      writeJson(response, 502, {
        ready: false,
        error: "Could not fetch Tafsir Al-Saadi for this ayah.",
        source: apiUrl,
      });
      return;
    }

    writeJson(response, 200, {
      ready: true,
      source: apiUrl,
      tafsir: {
        name: "تفسير السعدي",
        resourceId: 91,
        verseKey,
        text,
      },
    });
  } catch (error) {
    writeJson(response, 502, {
      ready: false,
      error: error?.name === "AbortError" ? "Tafsir request timed out." : error.message,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function handleComposeSelectedVideo(request, response) {
  const body = await readBody(request);
  const payload = parseJson(body.toString("utf8")) || {};
  const surah = positiveInteger(payload.surah);
  const ayahStart = positiveInteger(payload.ayahStart);
  const ayahCount = positiveInteger(payload.ayahCount);
  const reciter = sanitizeReciter(payload.reciter || "ar.alafasy");
  const background = backgroundPath(payload.background || "nature");

  if (!surah || !ayahStart || !ayahCount) {
    writeJson(response, 400, { ready: false, error: "Missing valid surah, ayahStart, or ayahCount." });
    return;
  }
  if (!background) {
    writeJson(response, 400, {
      ready: false,
      error: "Selected background is not ready. Choose a background with a real preview image, or prepare/download it first.",
    });
    return;
  }

  const outputName = `ayah-${surah}-${ayahStart}-${ayahCount}-${reciter.replace(/\W+/g, "_")}-${Date.now()}.mp4`;
  const outputPath = join(root, "outputs", outputName);
  const result = spawnSync(process.execPath, [
    "scripts/compose-selected-ayah-video.mjs",
    "--surah", String(surah),
    "--ayah-start", String(ayahStart),
    "--ayah-count", String(ayahCount),
    "--reciter", reciter,
    "--background", background,
    "--download",
    "--out", outputPath,
  ], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024,
  });

  const parsed = parseLastJsonObject(result.stdout);
  if ((result.status ?? 1) !== 0 || !parsed?.ready) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    const failure = classifyComposeFailure(output, result.status ?? 1);
    writeJson(response, 500, {
      ready: false,
      error: failure.message,
      code: failure.code,
      hint: failure.hint,
      status: result.status ?? 1,
      output,
    });
    return;
  }

  writeJson(response, 200, {
    ...parsed,
    outUrl: `/${parsed.out}`,
    processStatus: result.status ?? 0,
  });
}

async function handleCreateRenderJob(request, response) {
  const body = await readBody(request);
  const payload = parseJson(body.toString("utf8")) || {};
  const job = renderJobs.create({
    userId: payload.userId || "local-user",
    request: payload,
  });

  const processing = renderJobs.update(job.jobId, { status: "processing" });
  const result = runSelectedAyahRenderJob(processing);
  const finalJob = result.ready
    ? renderJobs.update(job.jobId, { status: "completed", result })
    : renderJobs.update(job.jobId, { status: "failed", error: result.error || "Render failed.", result });

  writeJson(response, result.ready ? 200 : 500, {
    ready: result.ready,
    jobId: finalJob.jobId,
    status: finalJob.status,
    videoUrl: finalJob.result?.outUrl || "",
    error: finalJob.error || "",
    code: finalJob.result?.code || "",
    hint: finalJob.result?.hint || "",
  });
}

async function handleGetRenderJob(url, response) {
  const jobId = decodeURIComponent(url.pathname.replace(/^\/api\/render\//, "")).trim();
  const job = renderJobs.get(jobId);
  if (!job) {
    writeJson(response, 404, { ready: false, error: "Render job not found.", jobId });
    return;
  }
  writeJson(response, 200, renderJobResponse(job));
}

function runSelectedAyahRenderJob(job) {
  const request = job?.request || {};
  const surah = positiveInteger(request.surah);
  const ayahStart = positiveInteger(request.ayahStart);
  const ayahCount = positiveInteger(request.ayahCount);
  const reciter = sanitizeReciter(request.reciter || "ar.alafasy");
  const background = backgroundPath(request.background || "nature");

  if (!surah || !ayahStart || !ayahCount) {
    return { ready: false, error: "Missing valid surah, ayahStart, or ayahCount.", code: "invalid-render-request" };
  }
  if (!background) {
    return {
      ready: false,
      error: "Selected background is not ready.",
      code: "background-not-ready",
    };
  }

  const outputName = `render-${job.jobId}-${surah}-${ayahStart}-${ayahCount}.mp4`;
  const outputPath = join(root, "outputs", outputName);
  const result = spawnSync(process.execPath, [
    "scripts/compose-selected-ayah-video.mjs",
    "--surah", String(surah),
    "--ayah-start", String(ayahStart),
    "--ayah-count", String(ayahCount),
    "--reciter", reciter,
    "--background", background,
    "--download",
    "--out", outputPath,
  ], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024,
  });

  const parsed = parseLastJsonObject(result.stdout);
  if ((result.status ?? 1) !== 0 || !parsed?.ready) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    const failure = classifyComposeFailure(output, result.status ?? 1);
    return {
      ready: false,
      error: failure.message,
      code: failure.code,
      hint: failure.hint,
      output,
    };
  }

  return {
    ...parsed,
    ready: true,
    outUrl: `/${parsed.out}`,
    processStatus: result.status ?? 0,
  };
}

function renderJobResponse(job) {
  return {
    ready: true,
    jobId: job.jobId,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    userId: job.userId,
    request: job.request,
    videoUrl: job.result?.outUrl || "",
    error: job.error || "",
    code: job.result?.code || "",
    hint: job.result?.hint || "",
  };
}

async function handleComposeExternalAudioVideo(request, response) {
  const type = request.headers["content-type"] || "";
  const boundary = boundaryFrom(type);
  if (!boundary) {
    writeJson(response, 400, { ready: false, error: "ارفع ملف صوت أو فيديو أولا." });
    return;
  }

  const body = await readBody(request);
  const fields = parseMultipart(body, boundary);
  const audio = fields.find((field) => field.name === "audio" && field.filename);
  if (!audio) {
    writeJson(response, 400, { ready: false, error: "لم يصل ملف الصوت أو الفيديو إلى الخادم." });
    return;
  }

  const safeName = sanitizeFileName(audio.filename || "external-audio.bin");
  const uploadPath = join(uploadDir, `${Date.now()}-${safeName}`);
  writeFileSync(uploadPath, audio.data);

  const background = backgroundPath(fieldValue(fields, "background") || "nature");
  if (!background) {
    writeJson(response, 400, {
      ready: false,
      error: "الخلفية المختارة غير جاهزة للتوليد.",
      hint: "اختر خلفية ظاهرة بصورة حقيقية أو جهز الخلفية أولا.",
    });
    return;
  }

  const useAyahs = fieldValue(fields, "useAyahs") === "1";
  const surah = positiveInteger(fieldValue(fields, "surah"));
  const ayahStart = positiveInteger(fieldValue(fields, "ayahStart"));
  const ayahCount = positiveInteger(fieldValue(fields, "ayahCount"));
  const reciterName = sanitizeOverlayText(fieldValue(fields, "reciterName"));
  const outputName = `external-audio-${Date.now()}.mp4`;
  const outputPath = join(root, "outputs", outputName);
  const command = [
    "scripts/compose-external-audio-video.mjs",
    "--audio", uploadPath,
    "--background", background,
    "--out", outputPath,
  ];

  if (reciterName) command.push("--reciter-name", reciterName);
  if (useAyahs && surah && ayahStart && ayahCount) {
    command.push("--surah", String(surah), "--ayah-start", String(ayahStart), "--ayah-count", String(ayahCount));
  }

  const result = spawnSync(process.execPath, command, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024,
  });

  const parsed = parseLastJsonObject(result.stdout);
  if ((result.status ?? 1) !== 0 || !parsed?.ready) {
    const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
    const failure = classifyComposeFailure(output, result.status ?? 1);
    writeJson(response, 500, {
      ready: false,
      error: failure.message,
      code: failure.code,
      hint: failure.hint,
      status: result.status ?? 1,
      output,
    });
    return;
  }

  writeJson(response, 200, {
    ...parsed,
    outUrl: `/${parsed.out}`,
    processStatus: result.status ?? 0,
    uploadedFileName: safeName,
  });
}

async function handlePrepareBackground(request, response) {
  const body = await readBody(request);
  const payload = parseJson(body.toString("utf8")) || {};
  const id = String(payload.background || "").trim();
  const catalogPath = resolve(root, "assets/background-library/catalog.json");

  if (!id || !existsSync(catalogPath)) {
    writeJson(response, 400, { ready: false, error: "Missing background id or catalog." });
    return;
  }

  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  const item = (catalog.items || []).find((entry) => String(entry.id) === id);
  if (!item) {
    writeJson(response, 404, { ready: false, error: "Background not found." });
    return;
  }

  const localFile = item.localFile ? resolve(root, item.localFile) : "";
  const localPoster = item.localPoster ? resolve(root, item.localPoster) : "";
  const alreadyReady = localFile && existsSync(localFile) && (!localPoster || existsSync(localPoster));

  if (!alreadyReady) {
    if (!item.downloadUrl || !item.localFile) {
      writeJson(response, 400, { ready: false, error: "Background has no downloadable video source." });
      return;
    }

    const result = spawnSync(process.execPath, [
      "scripts/download-background-library.mjs",
      "--id", item.id,
    ], {
      cwd: root,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 50 * 1024 * 1024,
    });

    if ((result.status ?? 1) !== 0 || !existsSync(localFile)) {
      writeJson(response, 500, {
        ready: false,
        error: "Could not prepare background.",
        status: result.status ?? 1,
        output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
      });
      return;
    }
  }

  item.remoteOnly = false;
  item.localFileReady = true;
  item.localPosterReady = Boolean(item.localPoster && existsSync(resolve(root, item.localPoster)));
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");

  writeJson(response, 200, {
    ready: true,
    item: {
      id: item.id,
      localFile: item.localFile,
      localPoster: item.localPoster || item.poster,
      remoteOnly: false,
      localFileReady: true,
      localPosterReady: item.localPosterReady,
    },
  });
}

async function handleRefreshBackgroundLibrary(request, response) {
  const body = await readBody(request);
  const payload = parseJson(body.toString("utf8")) || {};
  const category = sanitizeBackgroundCategory(payload.category || "makkah");
  const wanted = Math.max(10, Math.min(50, positiveInteger(payload.wanted) || 30));
  const queries = backgroundQueries(category);
  const before = countCategoryBackgrounds(category);
  const targetTotal = countAllBackgrounds() + (wanted * 8);
  const imports = [];

  const effectivePixabayKey = process.env.PIXABAY_API_KEY || "";
  const effectivePexelsKey = process.env.PEXELS_API_KEY || "";

  if (effectivePixabayKey) {
    imports.push(runImporter("scripts/import-pixabay-backgrounds.mjs", queries, targetTotal, {
      PIXABAY_API_KEY: effectivePixabayKey,
    }));
  }
  if (effectivePexelsKey) {
    imports.push(runImporter("scripts/import-pexels-backgrounds.mjs", queries, targetTotal, {
      PEXELS_API_KEY: effectivePexelsKey,
    }));
  }

  if (!imports.length) {
    writeJson(response, 200, {
      ready: true,
      configured: false,
      added: 0,
      message: "Background import is not configured on this server. The app will keep using the local catalog.",
      missingApiKeys: ["PIXABAY_API_KEY", "PEXELS_API_KEY"],
      category,
      before,
      after: before,
    });
    return;
  }

  const failures = imports.filter((item) => (item.status ?? 1) !== 0);
  const after = countCategoryBackgrounds(category);
  writeJson(response, failures.length ? 500 : 200, {
    ready: !failures.length,
    category,
    before,
    after,
    added: Math.max(0, after - before),
    message: after > before
      ? `Added ${after - before} filtered videos.`
      : "Refresh worked, but no new videos passed the suitability filter.",
    imports: imports.map((item) => ({
      status: item.status,
      stdout: item.stdout?.slice(-1200) || "",
      stderr: item.stderr?.slice(-1200) || "",
    })),
  });
}

async function handleTranscribeMatch(request, response) {
  const type = request.headers["content-type"] || "";
  const boundary = boundaryFrom(type);
  if (!boundary) {
    writeJson(response, 400, { ready: false, error: "Expected multipart/form-data with an audio field." });
    return;
  }

  const body = await readBody(request);
  const fields = parseMultipart(body, boundary);
  const audio = fields.find((field) => field.name === "audio" && field.filename);
  if (!audio) {
    writeJson(response, 400, { ready: false, error: "Missing uploaded audio field." });
    return;
  }

  const safeName = sanitizeFileName(audio.filename || "recitation-upload.bin");
  const uploadPath = join(uploadDir, `${Date.now()}-${safeName}`);
  writeFileSync(uploadPath, audio.data);

  const firstSeconds = Number(fieldValue(fields, "analyzedSeconds") || args["analyzed-seconds"] || 7);
  const requestedNextSeconds = Number(fieldValue(fields, "nextAnalysisSeconds") || args["next-analysis-seconds"] || 15);
  const windows = analysisWindows(firstSeconds, requestedNextSeconds);
  const attempts = [];
  let result = null;
  let parsed = null;

  for (const seconds of windows) {
    result = runTranscriptionAttempt(uploadPath, seconds, nextWindowAfter(windows, seconds));
    parsed = parseJson(result.stdout);
    if (!parsed) break;
    attempts.push(summarizeAttempt(parsed));
    if (parsed.code === "no-audio-stream") break;
    if (parsed.match?.status === "unique" || parsed.match?.status === "ambiguous") break;
  }

  if (parsed) {
    if (parsed.code === "no-audio-stream") {
      const visualMatch = runVisualOcrFallback(uploadPath);
      writeJson(response, 200, {
        ...parsed,
        attempts,
        visualMatch,
        processStatus: result.status ?? 1,
        uploadedFileName: safeName,
      });
      return;
    }

    writeJson(response, 200, {
      ...parsed,
      attempts,
      processStatus: result.status ?? 1,
      uploadedFileName: safeName,
    });
    return;
  }

  writeJson(response, 500, {
    ready: false,
    error: "Transcription backend did not return JSON.",
    status: result.status ?? 1,
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
  });
}

function cleanTafsirHtml(value) {
  return decodeHtmlEntities(String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|span)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim());
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function runTranscriptionAttempt(uploadPath, analyzedSeconds, nextAnalysisSeconds) {
  return spawnSync(process.execPath, [
    "scripts/transcribe-and-match-whispercpp.mjs",
    "--audio",
    uploadPath,
    "--quran",
    quranPath,
    "--whisper",
    whisperPath,
    "--model",
    modelPath,
    "--ffmpeg",
    ffmpegPath,
    "--analyzed-seconds",
    String(analyzedSeconds),
    "--next-analysis-seconds",
    String(nextAnalysisSeconds),
    "--json",
  ], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024,
  });
}

function analysisWindows(firstSeconds, requestedNextSeconds) {
  return [firstSeconds, requestedNextSeconds, 30, 60]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .filter((value, index, list) => list.indexOf(value) === index)
    .sort((a, b) => a - b);
}

function nextWindowAfter(windows, seconds) {
  return windows.find((value) => value > seconds) || seconds;
}

function summarizeAttempt(report) {
  return {
    analyzedSeconds: report.analyzedSeconds,
    ready: Boolean(report.ready),
    code: report.code || "",
    transcript: String(report.transcript || "").slice(0, 500),
    matchStatus: report.match?.status || "",
    candidateCount: report.match?.candidates?.length || 0,
  };
}

function runVisualOcrFallback(videoPath) {
  const result = spawnSync(process.execPath, [
    "scripts/ocr-video-quran.mjs",
    "--video",
    videoPath,
    "--quran",
    quranPath,
    "--ffmpeg",
    ffmpegPath,
    "--json",
  ], {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024,
  });
  const parsed = parseJson(result.stdout);
  if (parsed) {
    return {
      ...parsed,
      processStatus: result.status ?? 1,
    };
  }
  return {
    ready: false,
    status: "not-found",
    code: "visual-ocr-failed",
    output: `${result.stdout || ""}${result.stderr || ""}`.trim(),
    candidates: [],
  };
}

function serveStatic(request, pathname, response) {
  const filePath = resolvePath(pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  const target = existsSync(filePath) && statSync(filePath).isDirectory()
    ? join(filePath, "index.html")
    : filePath;

  if (!existsSync(target)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  const type = contentType(target);
  const size = statSync(target).size;
  const range = request.headers.range;

  if (range && type.startsWith("video/")) {
    const match = /^bytes=(\d*)-(\d*)$/i.exec(range);
    if (!match) {
      response.writeHead(416, {
        "Content-Range": `bytes */${size}`,
        "Accept-Ranges": "bytes",
      });
      response.end();
      return;
    }

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= size) {
      response.writeHead(416, {
        "Content-Range": `bytes */${size}`,
        "Accept-Ranges": "bytes",
      });
      response.end();
      return;
    }

    response.writeHead(206, {
      "Content-Type": type,
      "Cache-Control": "no-cache",
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": String(end - start + 1),
    });
    createReadStream(target, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-cache",
    "Accept-Ranges": type.startsWith("video/") ? "bytes" : "none",
    "Content-Length": String(size),
  });
  createReadStream(target).pipe(response);
}

function resolvePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = normalize(decoded).replace(/^([/\\])+/, "");
  const candidate = resolve(root, relative || "index.html");
  return candidate === root || candidate.startsWith(`${root}${sep}`) ? candidate : "";
}

function contentType(path) {
  return {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  }[extname(path).toLowerCase()] || "application/octet-stream";
}

function boundaryFrom(contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  return match ? `--${match[1] || match[2]}` : "";
}

function readBody(request) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolveBody(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function parseMultipart(body, boundary) {
  const text = body.toString("latin1");
  const rawParts = text.split(boundary).slice(1, -1);
  return rawParts.map((part) => {
    const trimmed = part.replace(/^\r\n/, "").replace(/\r\n$/, "");
    const splitAt = trimmed.indexOf("\r\n\r\n");
    if (splitAt === -1) return null;
    const headerText = trimmed.slice(0, splitAt);
    const dataText = trimmed.slice(splitAt + 4);
    const disposition = /content-disposition:\s*form-data;\s*([^\r\n]+)/i.exec(headerText)?.[1] || "";
    const name = /name="([^"]+)"/i.exec(disposition)?.[1] || "";
    const filename = /filename="([^"]*)"/i.exec(disposition)?.[1] || "";
    return {
      name,
      filename,
      headers: headerText,
      data: Buffer.from(dataText, "latin1"),
    };
  }).filter(Boolean);
}

function fieldValue(fields, name) {
  const field = fields.find((item) => item.name === name && !item.filename);
  return field ? field.data.toString("utf8").trim() : "";
}

function sanitizeFileName(value) {
  return String(value || "upload.bin").replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 120);
}

function sanitizeOverlayText(value) {
  return String(value || "")
    .replace(/[\x00-\x1F<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function executableArg(explicitValue, envValue, localPath, commandName) {
  if (explicitValue) return resolve(explicitValue);
  if (envValue) return /[\\/]/.test(envValue) || /^[A-Za-z]:/.test(envValue) ? resolve(envValue) : envValue;
  const resolvedLocal = resolve(localPath);
  return existsSync(resolvedLocal) ? resolvedLocal : commandName;
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function classifyComposeFailure(output, status) {
  const text = String(output || "");
  const lower = text.toLowerCase();

  if (lower.includes("missing recitation audio") || lower.includes("audio api did not return") || lower.includes("could not download audio")) {
    return {
      code: "recitation-audio-failed",
      message: "تعذر تجهيز صوت القارئ المختار.",
      hint: "اختر قارئا آخر أو أعد المحاولة بعد التأكد من اتصال الإنترنت، لأن البرنامج يحتاج تنزيل صوت الآيات عند أول توليد.",
    };
  }

  if (lower.includes("reciter ") && lower.includes(" is not listed")) {
    return {
      code: "reciter-not-supported",
      message: "القارئ المختار غير موجود في مكتبة القراء.",
      hint: "اختر قارئا من القائمة الحالية ثم أعد التوليد.",
    };
  }

  if (lower.includes("missing ffmpeg") || lower.includes("missing ffprobe") || (lower.includes("ffmpeg") && lower.includes("enoent"))) {
    return {
      code: "ffmpeg-missing",
      message: "أداة FFmpeg غير جاهزة على الجهاز.",
      hint: "ثبت FFmpeg المحمول داخل tools/ffmpeg أو شغل اختبار FFmpeg قبل التوليد.",
    };
  }

  if (lower.includes("missing chromium") || lower.includes("chromium") || lower.includes("crashpad")) {
    return {
      code: "quran-renderer-failed",
      message: "فشل محرك رسم نص القرآن في التصدير.",
      hint: "المشكلة في Chromium داخل الخادم، وليست في الآية أو الخلفية. راجع سجل التوليد لتعديل إعدادات محرك الرسم.",
    };
  }

  if (lower.includes("command failed") && lower.includes("ffmpeg")) {
    return {
      code: "ffmpeg-failed",
      message: "فشل تركيب الفيديو عبر FFmpeg.",
      hint: "جرّب خلفية أخرى أو آيات أقل، وإذا تكرر الخطأ افتح تفاصيل السجل لمعرفة سبب FFmpeg.",
    };
  }

  if (lower.includes("missing background") || lower.includes("background")) {
    return {
      code: "background-missing",
      message: "الخلفية المختارة غير جاهزة للتوليد.",
      hint: "اختر خلفية ظاهرة بصورة حقيقية أو اضغط تجهيز الخلفية ثم أعد التوليد.",
    };
  }

  if (lower.includes("missing font")) {
    return {
      code: "font-missing",
      message: "خط القرآن المستخدم في التصدير غير موجود.",
      hint: "تأكد من وجود ملف الخط داخل assets/fonts ثم أعد التوليد.",
    };
  }

  return {
    code: "compose-failed",
    message: "فشل توليد الفيديو.",
    hint: status ? `انتهت عملية التوليد برمز خطأ ${status}.` : "راجع تفاصيل الخطأ ثم أعد المحاولة.",
  };
}

function parseLastJsonObject(text) {
  const source = String(text || "");
  const objects = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      if (depth === 0) start = index;
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        objects.push(source.slice(start, index + 1));
        start = -1;
      }
    }
  }

  for (const objectText of objects.reverse()) {
    const parsed = parseJson(objectText);
    if (parsed?.out || parsed?.ready !== undefined) return parsed;
  }
  return null;
}

function positiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function sanitizeReciter(value) {
  const reciter = String(value || "ar.alafasy").trim();
  return /^[a-z0-9_.-]+$/i.test(reciter) ? reciter : "ar.alafasy";
}

function backgroundPath(value) {
  const id = String(value || "nature").toLowerCase();
  const catalogPath = resolve(root, "assets/background-library/catalog.json");
  if (existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
      const item = (catalog.items || []).find((entry) => String(entry.id).toLowerCase() === id);
      if (item && isFallbackPoster(item.poster)) {
        return "";
      }
      if (item?.localFile && existsSync(resolve(root, item.localFile))) {
        return item.localFile;
      }
      if (item?.downloadUrl && item?.localFile) {
        const download = spawnSync(process.execPath, [
          "scripts/download-background-library.mjs",
          "--id", item.id,
        ], {
          cwd: root,
          encoding: "utf8",
          windowsHide: true,
          maxBuffer: 50 * 1024 * 1024,
        });
        if ((download.status ?? 1) === 0 && existsSync(resolve(root, item.localFile))) {
          return item.localFile;
        }
      }
      if (item) return "";
    } catch {
      // Fall back to the prototype backgrounds below.
    }
  }
  const fallback = fallbackBackgroundPathForCategory(id);
  return existsSync(resolve(root, fallback)) ? fallback : "";
}

function fallbackBackgroundPathForCategory(value) {
  const map = {
    makkah: "assets/production/makkah.mp4",
    madinah: "assets/production/madinah.mp4",
    mosque: "assets/production/makkah.mp4",
    sea: "assets/production/nature.mp4",
    sky: "assets/production/nature.mp4",
    nature: "assets/production/nature.mp4",
    "makkah-production": "assets/production/makkah.mp4",
    "madinah-production": "assets/production/madinah.mp4",
    "nature-production": "assets/production/nature.mp4",
  };
  return map[String(value || "").toLowerCase()] || map.nature;
}

function isFallbackPoster(path) {
  const value = String(path || "");
  return value.startsWith("assets/bg-") || value === "assets/background-library/posters/mixkit-placeholder.jpg";
}

function sanitizeBackgroundCategory(value) {
  const category = String(value || "makkah").toLowerCase();
  return ["makkah", "madinah", "mosque", "nature", "sea", "sky"].includes(category) ? category : "makkah";
}

function backgroundQueries(category) {
  return {
    makkah: "makkah,mecca,kaaba,masjid al haram,haram",
    madinah: "madinah,medina,masjid nabawi,prophet mosque",
    mosque: "mosque,masjid,islamic mosque,ramadan mosque",
    nature: "nature,landscape,mountains,forest,desert",
    sea: "sea,ocean,waves,beach,water",
    sky: "sky,clouds,sunset,sunrise",
  }[category] || "makkah,mecca,kaaba";
}

function countCategoryBackgrounds(category) {
  const catalogPath = resolve(root, "assets/background-library/catalog.json");
  if (!existsSync(catalogPath)) return 0;
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    return (catalog.items || []).filter((item) => item.category === category).length;
  } catch {
    return 0;
  }
}

function countAllBackgrounds() {
  const catalogPath = resolve(root, "assets/background-library/catalog.json");
  if (!existsSync(catalogPath)) return 0;
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    return (catalog.items || []).length;
  } catch {
    return 0;
  }
}

function runImporter(script, queries, max, extraEnv = {}) {
  return spawnSync(process.execPath, [
    script,
    "--queries", queries,
    "--max", String(max),
  ], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024,
  });
}

function writeJson(response, status, data) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  response.end(JSON.stringify(data, null, 2));
}
