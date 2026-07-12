"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const test = require("node:test");

global.window = global;
const root = path.resolve(__dirname, "..");
vm.runInThisContext(fs.readFileSync(path.join(root, "js/path-geometry.js"), "utf8"));
vm.runInThisContext(fs.readFileSync(path.join(root, "js/levels.js"), "utf8"));

test("all campaign biomes declare complete, distinct road materials", () => {
  assert.equal(LEVEL_DATA.length, 20);
  assert.equal(new Set(LEVEL_DATA.map(level => level.theme)).size, 20);
  assert.equal(new Set(LEVEL_DATA.map(level => level.pathMaterial.body)).size, 20);
  for (const level of LEVEL_DATA) {
    assert.ok(level.pathMaterial, `L${level.id + 1} has no path material`);
    for (const key of ["body", "worn", "shoulder", "edge", "detail", "texture", "asset"])
      assert.ok(level.pathMaterial[key], `L${level.id + 1} path material lacks ${key}`);
  }
  assert.equal(new Set(LEVEL_DATA.map(level => level.pathMaterial.asset)).size, 6);
});

test("road renderer includes biome shoulders and cached material texture", () => {
  const source = fs.readFileSync(path.join(root, "js/levels.js"), "utf8");
  assert.match(source, /lineWidth = 52/);
  assert.equal(typeof LevelManager._drawPathTexture, "function");
  assert.match(source, /createPattern\(surface, "repeat"\)/);
  assert.ok(["plates", "moss", "cracks", "ice", "inlay", "pavers", "crystal", "stardust", "ripple"]
    .every(texture => LEVEL_DATA.some(level => level.pathMaterial.texture === texture)));
});
