// Focused regression coverage for hero/tower visual scale and ground anchoring.
// Run: node tests/actor-presentation.test.js .
const fs = require("fs");
const path = require("path");

const root = process.argv[2] || ".";
const enemySource = fs.readFileSync(path.join(root, "js/enemies.js"), "utf8");
globalThis.window = globalThis;
globalThis.SCI_TOWER_DMG_MULT = 1;
globalThis.SCI_HERO_HP_MULT = 1;
globalThis.SHEET_META = {};
globalThis.performance = { now: () => 1000 };

for (const file of ["js/towers.js", "js/heroes.js"]) {
  (0, eval)(fs.readFileSync(path.join(root, file), "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function recordingContext() {
  const calls = [];
  const ctx = new Proxy({ calls }, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === "createLinearGradient" || prop === "createRadialGradient") {
        return () => ({ addColorStop() {} });
      }
      return (...args) => calls.push([prop, ...args]);
    },
    set(target, prop, value) { target[prop] = value; return true; }
  });
  return ctx;
}

function spriteDestinationFor(actor) {
  let destination = null;
  globalThis.drawSprite = (_ctx, key, state, x, y, width, height) => {
    destination = { key, state, x, y, width, height };
    return true;
  };
  actor.draw(recordingContext());
  return destination;
}

const hero = new globalThis.EinsteinHero(200, 180);
const heroSprite = spriteDestinationFor(hero);
assert(hero.size >= 84, `hero draw box regressed to ${hero.size}px`);
assert(heroSprite.width === hero.size && heroSprite.height === hero.size, "hero sprite does not use presentation size");
assert(Math.abs((heroSprite.y + heroSprite.height * hero.getSpriteFootRatio(heroSprite.state)) - (hero.y + hero.groundOffset)) < 0.001,
  "hero sprite feet are not pinned to the ground anchor");
assert(hero.range === 110, "hero visual scale changed logical attack range");
assert(enemySource.includes("this.size = size * 2.25"), "enemy presentation multiplier regressed below the enlarged silhouette scale");
assert(!enemySource.includes('traits.push([\">\", \"Fast\"])'), "fast enemies still render the ambiguous > face-like badge");
assert(enemySource.includes('traits.push([\"⚡\", \"Fast\"])'), "fast enemies lack a clear speed-trait indicator");

const tower = new globalThis.PhysicsTower(320, 250);
const originalRange = tower.range;
const towerCtx = recordingContext();
let towerSprite = null;
globalThis.drawSprite = (_ctx, key, state, x, y, width, height) => {
  towerSprite = { key, state, x, y, width, height };
  return true;
};
tower.draw(towerCtx);
assert(tower.size >= 92, `tower draw box regressed to ${tower.size}px`);
assert(towerSprite.width === tower.size && towerSprite.height === tower.size, "tower sprite does not use presentation size");
assert(Math.abs((towerSprite.y + towerSprite.height * tower.spriteFootRatio) - (tower.y + tower.groundOffset)) < 0.001,
  "tower sprite base is not pinned to the pad anchor");
assert(tower.range === originalRange, "tower visual scale changed logical targeting range");
assert(towerCtx.calls.some(call => call[0] === "fillText" && call[1] === "★  LV 1"),
  "tower level badge is missing or unreadable");

tower.level = 4;
const ultimateCtx = recordingContext();
tower.draw(ultimateCtx);
assert(ultimateCtx.calls.some(call => call[0] === "fillText" && call[1] === "Ω  ULT"),
  "ultimate tower badge is missing");

console.log("PASS  hero/tower presentation scale, grounding, badges, and logical ranges");
