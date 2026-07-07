import assert from "node:assert/strict";
import { relative, resolve } from "node:path";

function relativePath(cwd, path) {
  return relative(cwd, resolve(path)).replaceAll("\\", "/");
}

assert.equal(relativePath("/app", "/app/outputs/render-example.mp4"), "outputs/render-example.mp4");
assert.equal(relativePath("C:\\Users\\re273\\quran", "C:\\Users\\re273\\quran\\outputs\\render-example.mp4"), "outputs/render-example.mp4");

console.log("PASS compose relative paths are URL-safe on Windows and Linux.");
