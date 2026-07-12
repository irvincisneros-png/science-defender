#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const output = execFileSync(process.execPath, [path.join(root, "scripts/asset-audit.js"), "--json"], {
  cwd: root,
  encoding: "utf8",
});
const report = JSON.parse(output);

assert(report.totalFiles >= 90, "asset inventory unexpectedly small");
assert(report.totalBytes > 50 * 1024 * 1024, "asset byte total unexpectedly small");
assert(report.byExtension.png.files >= 80, "PNG inventory unexpectedly small");
assert.strictEqual(report.errors.length, 0, report.errors.join("\n"));
assert.strictEqual(report.warnings.length, 0, report.warnings.join("\n"));
const levelWebps = fs.readdirSync(path.join(root, "assets/levels")).filter(file => file.endsWith(".webp"));
const pathWebps = fs.readdirSync(path.join(root, "assets/paths")).filter(file => file.endsWith(".webp"));
assert.strictEqual(levelWebps.length, 20, "expected one WebP delivery painting per campaign level");
assert.strictEqual(pathWebps.length, 6, "expected six generated path material families");
assert(report.runtimeReferences > 5, "runtime reference scan did not find expected assets");
assert(report.largest.every((entry) => entry.bytes > 0), "largest-file report contains empty assets");

const regularEnemies = ["flatearth", "phlogiston", "spontaneous", "maggot", "alchemy", "perpetual", "geocentric", "miasma", "caloric", "aether", "vitalism", "humours", "creationist", "homunculus", "homunculus_core", "golem", "golem_molten"];
execFileSync("python3", [path.join(root, "scripts/sprite-qa.py"),
  ...regularEnemies.map(key => path.join(root, `assets/enemies/candidates/${key}_walk_v2.png`)),
  path.join(root, "assets/heroes/fieldteam_walk.png")], { cwd: root, stdio: "inherit" });
const bosses = ["boss_geo", "boss_phlog", "boss_aether", "boss_miasma", "boss_entropy"];
execFileSync("python3", [path.join(root, "scripts/boss-sprite-qa.py"),
  ...bosses.map(key => path.join(root, `assets/enemies/candidates/${key}_walk_v2.png`))], { cwd: root, stdio: "inherit" });
execFileSync(process.execPath, [path.join(root, "scripts/route-report.js")], { cwd: root, stdio: "inherit" });

console.log(`PASS asset tooling (${report.totalFiles} files, ${(report.totalBytes / 1048576).toFixed(1)} MiB)`);
