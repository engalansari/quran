#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.file) {
  printHelp();
  process.exit(args.help ? 0 : 1);
}

const filePath = resolve(args.file);
const data = readJson(filePath);
const report = validateAuthority(data, {
  sourceUrl: args["source-url"] || "",
  requireReviewed: Boolean(args["require-reviewed"]),
});

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  printReport(report);
}

process.exit(report.ready ? 0 : 1);

function parseArgs(input) {
  const parsed = {};
  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    if (token === "--help" || token === "-h") {
      parsed.help = true;
    } else if (token === "--json" || token === "--require-reviewed") {
      parsed[token.slice(2)] = true;
    } else if (token.startsWith("--")) {
      parsed[token.slice(2)] = input[index + 1];
      index += 1;
    }
  }
  return parsed;
}

function readJson(path) {
  if (!existsSync(path)) {
    console.error(`Quran source authority file does not exist: ${path}`);
    process.exit(1);
  }
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read Quran source authority file: ${path}`);
    console.error(error.message);
    process.exit(1);
  }
}

function validateAuthority(data, options) {
  const authority = data?.authority || data || {};
  const issues = [];
  const acceptedDomains = normalizeList(authority.acceptedSourceDomains);
  const acceptedFormats = normalizeList(authority.acceptedFormats).map((format) => format.toLowerCase());

  if (!String(authority.name || "").trim()) issues.push("missing authority.name");
  if (!validHttpUrl(authority.officialSiteUrl)) issues.push("missing or invalid authority.officialSiteUrl");
  if (!validHttpUrl(authority.developerPlatformUrl)) issues.push("missing or invalid authority.developerPlatformUrl");
  if (!acceptedDomains.length) issues.push("authority.acceptedSourceDomains must list at least one domain");
  if (!acceptedFormats.length) issues.push("authority.acceptedFormats must list at least one source format");
  if (options.requireReviewed && authority.reviewed !== true) issues.push("authority.reviewed must be true");

  let sourceUrlReport = null;
  if (options.sourceUrl) {
    sourceUrlReport = validateSourceUrl(options.sourceUrl, acceptedDomains, acceptedFormats);
    issues.push(...sourceUrlReport.issues);
  }

  return {
    report: "Ayah Studio Quran source authority validation",
    ready: issues.length === 0,
    authority: {
      name: String(authority.name || "").trim(),
      officialSiteUrl: String(authority.officialSiteUrl || "").trim(),
      developerPlatformUrl: String(authority.developerPlatformUrl || "").trim(),
      acceptedSourceDomains: acceptedDomains,
      acceptedFormats,
      reviewed: authority.reviewed === true,
    },
    sourceUrl: sourceUrlReport,
    issues,
  };
}

function validateSourceUrl(value, acceptedDomains, acceptedFormats) {
  const issues = [];
  let url = null;
  try {
    url = new URL(value);
  } catch {
    issues.push("source URL is invalid");
  }

  if (url) {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      issues.push("source URL must use http or https");
    }
    const host = url.hostname.toLowerCase();
    const domainAllowed = acceptedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (!domainAllowed) {
      issues.push(`source URL host is not in accepted domains: ${host}`);
    }
    const fileName = url.pathname.split("/").pop() || "";
    const extension = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() || "" : "";
    if (extension && acceptedFormats.length && !acceptedFormats.includes(extension)) {
      issues.push(`source URL extension is not in accepted formats: ${extension}`);
    }
  }

  return {
    url: String(value || "").trim(),
    host: url?.hostname.toLowerCase() || "",
    ready: issues.length === 0,
    issues,
  };
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
    : [];
}

function validHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function printReport(report) {
  console.log(`Quran source authority validation: ${report.ready ? "ready" : "not ready"}`);
  console.log(`Authority: ${report.authority.name || "missing"}`);
  console.log(`Accepted domains: ${report.authority.acceptedSourceDomains.join(", ") || "missing"}`);
  if (report.sourceUrl) {
    console.log(`Source URL: ${report.sourceUrl.url}`);
  }
  if (report.ready) {
    console.log("PASS Quran source authority is structurally ready.");
    return;
  }
  console.log("FAIL Quran source authority needs fixes before source import.");
  report.issues.forEach((issue) => console.log(`- ${issue}`));
}

function printHelp() {
  console.log(`
Ayah Studio Quran source authority validator

Usage:
  node scripts/validate-quran-source-authority.mjs --file data/quran-source-authority.king-fahd.example.json

Options:
  --file FILE              Quran source authority JSON.
  --source-url URL         Optional source URL to check against accepted domains and formats.
  --require-reviewed       Require authority.reviewed:true.
  --json                   Print a machine-readable report.

This validates the trusted-source manifest used before importing a full Uthmani Quran dataset.
`.trim());
}
