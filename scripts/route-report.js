#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
global.window = global;
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "js/path-geometry.js"), "utf8"));
vm.runInThisContext(fs.readFileSync(path.join(ROOT, "js/levels.js"), "utf8"));

const range = Number(process.argv.find(arg => arg.startsWith("--range="))?.split("=")[1] || 140);
const clearance = 34;
const rows = LEVEL_DATA.map(level => {
  const route = new PathGeometry(level.controlPoints || level.waypoints, level.routeOptions || {});
  const pads = (level.buildSpots || []).map(pad => ({ ...pad, nearest: route.nearestPoint(pad.x, pad.y).separation }));
  const valid = pads.filter(pad => pad.nearest >= clearance);
  const covered = route.samples.filter(sample => valid.some(pad => {
    const dx = pad.x - sample.x, dy = pad.y - sample.y;
    return dx * dx + dy * dy <= range * range;
  })).length;
  const maxSingle = valid.reduce((best, pad) => Math.max(best, route.samples.filter(sample => {
    const dx = pad.x - sample.x, dy = pad.y - sample.y;
    return dx * dx + dy * dy <= range * range;
  }).length), 0);
  return {
    level: level.id + 1,
    theme: level.theme,
    routeLength: Math.round(route.totalLength),
    authoredPads: pads.length,
    validPads: valid.length,
    minSeparation: Number(Math.min(...pads.map(pad => pad.nearest)).toFixed(1)),
    unionCoverage: Number((covered / route.samples.length).toFixed(3)),
    maxSinglePadCoverage: Number((maxSingle / route.samples.length).toFixed(3)),
    foregroundMasks: (level.foreground || []).length,
    pathMaterial: level.pathMaterial || null,
    ...(process.argv.includes("--include-samples") ? {
      samples: route.samples.map(sample => [Number(sample.x.toFixed(1)), Number(sample.y.toFixed(1))]),
      pads: valid.map(pad => [pad.x, pad.y]),
    } : {}),
  };
});

if (process.argv.includes("--json")) process.stdout.write(`${JSON.stringify({ range, clearance, levels: rows }, null, 2)}\n`);
else {
  console.log("Level | Theme | Route | Pads | Clearance | Coverage | Max pad | FG");
  rows.forEach(row => console.log(`${String(row.level).padStart(2)} | ${row.theme.padEnd(12)} | ${String(row.routeLength).padStart(4)} | ${row.authoredPads}->${row.validPads} | ${String(row.minSeparation).padStart(5)} | ${String(Math.round(row.unionCoverage * 100)).padStart(3)}% | ${String(Math.round(row.maxSinglePadCoverage * 100)).padStart(3)}% | ${row.foregroundMasks}`));
}

const failures = rows.filter(row => row.validPads < 8 || row.unionCoverage < 0.60 || row.maxSinglePadCoverage > 0.40 || row.foregroundMasks < 1 ||
  !row.pathMaterial || !row.pathMaterial.body || !row.pathMaterial.shoulder || !row.pathMaterial.texture);
if (failures.length) {
  console.error(`Geometry policy failed: ${failures.map(row => `L${row.level}`).join(", ")}`);
  process.exitCode = 1;
}
