#!/usr/bin/env node
"use strict";

// Dependency-free asset inventory and validation for Science Defender.
// Usage: node scripts/asset-audit.js [--json] [--strict]

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const ASSET_ROOT = path.join(ROOT, "assets");
const jsonMode = process.argv.includes("--json");
const strict = process.argv.includes("--strict");
const errors = [];
const warnings = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function relative(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset++; continue; }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) { offset += 2; continue; }
    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2 || offset + 2 + length > buffer.length) break;
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
    }
    offset += 2 + length;
  }
  return null;
}

function expectedCell(assetPath) {
  const name = path.basename(assetPath, ".png");
  if (assetPath.includes("/levels/")) return { width: 1800, height: 1100, exact: true, kind: "level" };
  if (assetPath.includes("/heroes/")) return { width: 64, height: 64, exact: false, kind: "hero strip" };
  if (assetPath.includes("/towers/")) return { width: 64, height: 64, exact: false, kind: "tower strip" };
  if (assetPath.includes("/enemies/")) {
    const cell = name.startsWith("boss_") ? 128 : 64;
    return { width: cell, height: cell, exact: false, kind: "enemy strip" };
  }
  return null;
}

function validateShape(item) {
  const expected = expectedCell(item.path);
  if (!expected || !item.dimensions) return;
  const { width, height } = item.dimensions;
  if (expected.exact) {
    if (width !== expected.width || height !== expected.height) {
      errors.push(`${item.path}: expected ${expected.width}x${expected.height} ${expected.kind}, got ${width}x${height}`);
    }
    return;
  }
  if (height !== expected.height || width % expected.width !== 0) {
    errors.push(`${item.path}: expected ${expected.width}px cells at ${expected.height}px high, got ${width}x${height}`);
  } else if (width / expected.width < 1) {
    errors.push(`${item.path}: sprite strip has no complete frames`);
  } else if (expected.kind === "enemy strip" && width / expected.width !== 6) {
    errors.push(`${item.path}: enemy walk strip must contain exactly 6 frames, got ${width / expected.width}`);
  }
}

const files = walk(ASSET_ROOT).sort();
const inventory = files.map((file) => {
  const buffer = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  const png = pngDimensions(buffer);
  const jpeg = jpegDimensions(buffer);
  const item = {
    path: relative(file),
    bytes: buffer.length,
    dimensions: png || jpeg,
    mediaType: png ? "image/png" : jpeg ? "image/jpeg" : null,
    sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
  };
  if (ext === ".png" && !png) {
    if (jpeg) warnings.push(`${item.path}: JPEG-encoded image uses a .png extension`);
    else errors.push(`${item.path}: invalid image header`);
  }
  validateShape(item);
  if (buffer.length > 3 * 1024 * 1024) warnings.push(`${item.path}: ${(buffer.length / 1048576).toFixed(1)} MiB (consider delivery compression)`);
  return item;
});

// Validate literal runtime references. Template-generated sprite paths are covered
// by the inventory shape/name checks above; the non-runtime sprites.json guide is
// audited separately so it cannot silently become mistaken for a load manifest.
const sourceFiles = ["index.html", "style.css", ...walk(path.join(ROOT, "js")).map(relative)];
const referenced = new Set();
const assetPattern = /["'`](assets\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|webp|avif|svg|mp3|wav|ogg))["'`]/gi;
for (const source of sourceFiles) {
  const body = fs.readFileSync(path.join(ROOT, source), "utf8");
  for (const match of body.matchAll(assetPattern)) referenced.add(match[1]);
}
for (const asset of referenced) {
  if (!fs.existsSync(path.join(ROOT, asset))) errors.push(`runtime reference is missing: ${asset}`);
}

let legacyManifest = { entries: 0, missing: [] };
const guidePath = path.join(ASSET_ROOT, "sprites.json");
if (fs.existsSync(guidePath)) {
  try {
    const guide = JSON.parse(fs.readFileSync(guidePath, "utf8"));
    const visit = (value) => {
      if (!value || typeof value !== "object") return;
      if (typeof value.path === "string") {
        legacyManifest.entries++;
        if (!fs.existsSync(path.join(ROOT, value.path))) legacyManifest.missing.push(value.path);
      }
      Object.values(value).forEach(visit);
    };
    visit(guide.sprites);
    if (legacyManifest.missing.length) {
      warnings.push(`assets/sprites.json is a legacy replacement guide: ${legacyManifest.missing.length}/${legacyManifest.entries} listed base sprites are not shipped`);
    }
  } catch (error) {
    errors.push(`assets/sprites.json: invalid JSON (${error.message})`);
  }
}

const duplicates = [];
const hashes = new Map();
for (const item of inventory) {
  if (!hashes.has(item.sha256)) hashes.set(item.sha256, []);
  hashes.get(item.sha256).push(item.path);
}
for (const group of hashes.values()) if (group.length > 1) duplicates.push(group);

const byExtension = {};
for (const item of inventory) {
  const ext = path.extname(item.path).slice(1).toLowerCase() || "none";
  byExtension[ext] ||= { files: 0, bytes: 0 };
  byExtension[ext].files++;
  byExtension[ext].bytes += item.bytes;
}

const report = {
  generatedAt: new Date().toISOString(),
  totalFiles: inventory.length,
  totalBytes: inventory.reduce((sum, item) => sum + item.bytes, 0),
  byExtension,
  runtimeReferences: referenced.size,
  legacyManifest,
  duplicates,
  largest: [...inventory].sort((a, b) => b.bytes - a.bytes).slice(0, 10).map(({ sha256, ...item }) => item),
  errors,
  warnings,
};

if (jsonMode) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const mib = (bytes) => `${(bytes / 1048576).toFixed(2)} MiB`;
  console.log(`Asset audit: ${report.totalFiles} files, ${mib(report.totalBytes)}`);
  Object.entries(byExtension).sort().forEach(([ext, data]) => console.log(`  ${ext.padEnd(5)} ${String(data.files).padStart(3)} files  ${mib(data.bytes)}`));
  console.log(`Runtime literal references: ${report.runtimeReferences}`);
  console.log("Largest files:");
  report.largest.forEach((item) => console.log(`  ${mib(item.bytes).padStart(9)}  ${item.dimensions ? `${item.dimensions.width}x${item.dimensions.height}`.padEnd(11) : "".padEnd(11)} ${item.path}`));
  if (duplicates.length) console.log(`Duplicate-content groups: ${duplicates.length}`);
  errors.forEach((message) => console.error(`ERROR: ${message}`));
  warnings.forEach((message) => console.warn(`WARN:  ${message}`));
  console.log(`Result: ${errors.length} error(s), ${warnings.length} warning(s)${strict ? " (strict)" : ""}`);
}

process.exitCode = errors.length || (strict && warnings.length) ? 1 : 0;
