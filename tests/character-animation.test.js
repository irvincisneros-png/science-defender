// Runtime contract regression tests for expanded hero animation states.
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const root = process.argv[2] || ".";
const source = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
const styleSource = fs.readFileSync(path.join(root, "style.css"), "utf8");
const schemaBlock = source.match(/window\.SHEET_META = \{\};[\s\S]*?if \(typeof window !== "undefined"\) window\.ASSETS_MANIFEST = ASSETS_MANIFEST;/);
if (!schemaBlock) throw new Error("could not isolate animation schema");
const context = { window: {}, ASSETS_MANIFEST: {} };
vm.runInNewContext(schemaBlock[0], context);

const expected = { idle: 8, walk: 8, attack: 8, skill: 8 };
for (const hero of ["einstein", "newton", "curie", "darwin"]) {
  for (const [state, cols] of Object.entries(expected)) {
    const key = `hero_${hero}_${state}`, meta = context.window.SHEET_META[key];
    if (!meta) throw new Error(`${key} is not registered`);
    if (meta.frameW !== 128 || meta.frameH !== 128 || meta.cols !== cols) throw new Error(`${key} metadata mismatch`);
    if (context.ASSETS_MANIFEST[key] !== `assets/heroes/${hero}_${state}.png`) throw new Error(`${key} manifest mismatch`);
  }
}
if (!/background-size:\s*800% 100%, 100% 100%/.test(styleSource)) {
  throw new Error("hero command portraits are not cropped to one frame of the eight-frame idle strip");
}

globalThis.window = globalThis;
globalThis.SCI_HERO_HP_MULT = 1;
globalThis.SHEET_META = context.window.SHEET_META;
let now = 1000;
globalThis.performance = { now: () => now };
(0, eval)(fs.readFileSync(path.join(root, "js/heroes.js"), "utf8"));
const hero = new globalThis.EinsteinHero(0, 0);
hero.activateSkillLogic = () => true;
hero.useActiveSkill(0, 0, [], {}, []);
if (hero.getAnimState() !== "skill" || hero.getAnimStart("skill") !== 1000) throw new Error("skill state did not begin");
now = 1900;
if (hero.getAnimState() === "skill") throw new Error("skill state did not finish");
hero._lastAttackTime = now;
if (hero.getAnimState() !== "attack" || hero.getAnimStart("attack") !== now) throw new Error("attack state/timestamp mismatch");

console.log("PASS  expanded hero animation schema and skill/attack state priority");
