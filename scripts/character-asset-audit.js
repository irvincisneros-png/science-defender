#!/usr/bin/env node
"use strict";

// Production gate for animated character strips. It checks the animation
// contract and objective continuity signals that are easy to lose when each
// state is generated separately: transparency, frame occupancy, foot line,
// visual centre, and palette drift.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, "..");
const HEROES = ["einstein", "newton", "curie", "darwin"];
const STATES = {
  idle: { cols: 8, maxCentreSpread: 20 }, walk: { cols: 8, maxCentreSpread: 20 },
  attack: { cols: 8, maxCentreSpread: 20 },
  // Ultimate effects intentionally expand away from the casting hand. The
  // body remains anchored; allow a little more whole-frame centroid travel.
  skill: { cols: 8, maxCentreSpread: 28 },
};
const CELL = 128;
const errors = [];
const metrics = {};

function paeth(a, b, c) {
  const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodeRgba(file) {
  const png = fs.readFileSync(file);
  if (png.subarray(1, 4).toString() !== "PNG") throw new Error("not a PNG");
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  const bitDepth = png[24], colorType = png[25], interlace = png[28];
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) throw new Error("expected non-interlaced 8-bit RGBA PNG");
  const idat = [];
  for (let offset = 8; offset + 12 <= png.length;) {
    const length = png.readUInt32BE(offset), type = png.subarray(offset + 4, offset + 8).toString();
    if (type === "IDAT") idat.push(png.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === "IEND") break;
  }
  const packed = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 4, pixels = Buffer.alloc(stride * height);
  let source = 0;
  for (let y = 0; y < height; y++) {
    const filter = packed[source++];
    for (let x = 0; x < stride; x++) {
      const raw = packed[source++], left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? up
        : filter === 3 ? Math.floor((left + up) / 2) : filter === 4 ? paeth(left, up, upperLeft) : NaN;
      if (!Number.isFinite(predictor)) throw new Error(`unsupported PNG filter ${filter}`);
      pixels[y * stride + x] = (raw + predictor) & 255;
    }
  }
  return { width, height, pixels };
}

function frameMetric(image, frame) {
  let count = 0, sx = 0, sy = 0, sr = 0, sg = 0, sb = 0;
  let minX = CELL, maxX = -1, minY = CELL, maxY = -1;
  for (let y = 0; y < CELL; y++) for (let x = 0; x < CELL; x++) {
    const i = (y * image.width + frame * CELL + x) * 4;
    if (image.pixels[i + 3] < 24) continue;
    count++; sx += x; sy += y; sr += image.pixels[i]; sg += image.pixels[i + 1]; sb += image.pixels[i + 2];
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  if (!count) return null;
  return { count, cx: sx / count, cy: sy / count, foot: maxY, width: maxX - minX + 1,
    height: maxY - minY + 1, rgb: [sr / count, sg / count, sb / count] };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

for (const hero of HEROES) {
  const allFrames = [];
  metrics[hero] = {};
  for (const [state, spec] of Object.entries(STATES)) {
    const relative = `assets/heroes/${hero}_${state}.png`, file = path.join(ROOT, relative);
    if (!fs.existsSync(file)) { errors.push(`${relative}: missing production state`); continue; }
    let image;
    try { image = decodeRgba(file); } catch (error) { errors.push(`${relative}: ${error.message}`); continue; }
    if (image.width !== CELL * spec.cols || image.height !== CELL) {
      errors.push(`${relative}: expected ${spec.cols} × ${CELL}px frames (${CELL * spec.cols}x${CELL}), got ${image.width}x${image.height}`);
      continue;
    }
    const frames = Array.from({ length: spec.cols }, (_, frame) => frameMetric(image, frame));
    frames.forEach((metric, frame) => { if (!metric) errors.push(`${relative}: frame ${frame + 1} is transparent`); });
    const valid = frames.filter(Boolean);
    if (!valid.length) continue;
    const footSpread = Math.max(...valid.map(m => m.foot)) - Math.min(...valid.map(m => m.foot));
    const centreSpread = Math.max(...valid.map(m => m.cx)) - Math.min(...valid.map(m => m.cx));
    if (footSpread > 5) errors.push(`${relative}: foot line drifts ${footSpread}px across frames (maximum 5px)`);
    if (centreSpread > spec.maxCentreSpread) errors.push(`${relative}: visual centre drifts ${centreSpread.toFixed(1)}px across frames (maximum ${spec.maxCentreSpread}px)`);
    if (valid.some(m => m.count < CELL * CELL * 0.035)) errors.push(`${relative}: one or more frames contain too little visible character art`);
    metrics[hero][state] = { frames: valid.length, footSpread, centreSpread: +centreSpread.toFixed(1),
      medianArea: median(valid.map(m => m.count)), medianFoot: median(valid.map(m => m.foot)),
      palette: [0, 1, 2].map(i => median(valid.map(m => m.rgb[i]))) };
    allFrames.push(...valid);
  }
  const states = Object.values(metrics[hero]);
  if (states.length === Object.keys(STATES).length) {
    const stateAreas = states.map(s => s.medianArea), ratio = Math.max(...stateAreas) / Math.max(1, Math.min(...stateAreas));
    const feet = states.map(s => s.medianFoot), footDrift = Math.max(...feet) - Math.min(...feet);
    if (ratio > 2.2) errors.push(`${hero}: median visible character area changes ${ratio.toFixed(2)}× between states`);
    if (footDrift > 7) errors.push(`${hero}: median foot line changes ${footDrift}px between states`);
    // Mean RGB is intentionally a loose guard: effects may tint attack/skill,
    // but a wholesale costume/model replacement produces a much larger jump.
    const palettes = states.map(s => s.palette);
    const paletteDrift = Math.max(...palettes.flatMap((a, i) => palettes.slice(i + 1).map(b => Math.hypot(...a.map((v, c) => v - b[c])))));
    if (paletteDrift > 125) errors.push(`${hero}: palette drifts ${paletteDrift.toFixed(1)} between states; inspect identity/costume continuity`);
  }
}

if (process.argv.includes("--json")) process.stdout.write(`${JSON.stringify({ metrics, errors }, null, 2)}\n`);
else {
  console.log(`Character audit: ${HEROES.length} heroes, ${Object.keys(STATES).length} production states each`);
  errors.forEach(error => console.error(`ERROR: ${error}`));
  console.log(`Result: ${errors.length} error(s)`);
}
process.exitCode = errors.length ? 1 : 0;
