// Node harness that stubs the browser environment and loads the real game code
// to reproduce/verify specific bugs. Run: node /tmp/td_harness.js
const fs = require("fs");
const path = require("path");

const PROJ = process.argv[2] || ".";
const J = (f) => path.join(PROJ, f);

// ---- Browser global stubs -------------------------------------------------
globalThis.window = globalThis;

const ctx = new Proxy({}, {
  get: (t, p) => (p in t ? t[p] : () => {}),
  set: (t, p, v) => { t[p] = v; return true; },
});
function makeEl(id) {
  const classes = new Set();
  return {
    id,
    style: {},
    disabled: false,
    _html: "", _text: "",
    classList: {
      add: (c) => classes.add(c),
      remove: (c) => classes.delete(c),
      contains: (c) => classes.has(c),
      toggle: (c) => (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true)),
    },
    _classes: classes,
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html; },
    set textContent(v) { this._text = v; },
    get textContent() { return this._text; },
    addEventListener() {},
    appendChild() {},
    querySelectorAll() { return []; },
    getContext() { return ctx; },
    width: 0, height: 0,
  };
}

const elements = new Map();
const SCREEN_IDS = ["screen-menu", "screen-levelselect", "screen-playing",
  "screen-victory", "screen-defeat", "screen-creator"];
SCREEN_IDS.forEach((id) => { const e = makeEl(id); e._classes.add("screen"); elements.set(id, e); });

globalThis.document = {
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeEl(id));
    return elements.get(id);
  },
  querySelectorAll(sel) {
    if (sel === ".screen") return SCREEN_IDS.map((id) => elements.get(id));
    return [];
  },
  addEventListener() {}, // audio.js attaches first-gesture unlock listeners at load
  removeEventListener() {},
};
globalThis.Image = class { set src(_) {} };
// Minimal HTMLAudioElement stub so the audio manager's play/pause bookkeeping
// is testable headless (real <audio> has paused flip on play()/pause()).
globalThis.Audio = class {
  constructor(src) { this.src = src || ""; this.paused = true; this.loop = false; this.volume = 1; this.currentTime = 0; this.preload = ""; }
  play() { this.paused = false; return undefined; }
  pause() { this.paused = true; }
};
globalThis.requestAnimationFrame = () => 0;
globalThis.localStorage = (() => {
  const m = {};
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
    clear: () => { for (const k of Object.keys(m)) delete m[k]; },
  };
})();
globalThis.loadDefaultQuestionsIntoCreator = () => {}; // referenced by switchScreen

// ---- Load the real source files ------------------------------------------
const FILES = [
  "js/audio.js",
  "js/questions-y7.js", "js/questions-y8.js", "js/questions-y9.js", "js/questions-y10.js",
  "js/questions.js", "js/particles.js", "js/levels.js",
  "js/enemies.js", "js/towers.js", "js/heroes.js", "js/game.js"];

const results = [];
function check(name, fn) {
  try { fn(); results.push([true, name, ""]); }
  catch (e) { results.push([false, name, e.message]); }
}

// Load each file in its own try/catch so a throw in one (e.g. the last line of
// heroes.js) doesn't prevent later files from loading. Record the first error.
let loadError = null;
for (const f of FILES) {
  try { (0, eval)(fs.readFileSync(J(f), "utf8")); }
  catch (e) { if (!loadError) loadError = `${f}: ${e.message}`; }
}

// TEST 1 (bug #2): no source file should throw at load time.
check("load all source files without throwing (bug #2: drawPixelSprite)", () => {
  if (loadError) throw new Error(loadError);
});

// Extract the REAL switchScreen() from index.html and define it globally.
check("define real switchScreen() from index.html", () => {
  const html = fs.readFileSync(J("index.html"), "utf8");
  const start = html.indexOf("function switchScreen");
  if (start < 0) throw new Error("switchScreen not found in index.html");
  let depth = 0, i = html.indexOf("{", start), end = -1;
  for (; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  (0, eval)(html.slice(start, end)); // defines global switchScreen
});

// TEST 2 (bug #3): a tower set to 'closest' targeting must not crash.
check("PhysicsTower findTargets('closest') does not crash (bug #3)", () => {
  const wp = [{ x: 0, y: 0 }, { x: 300, y: 0 }];
  const t = new globalThis.PhysicsTower(100, 100);
  t.targetMode = "closest";
  const enemies = [ // both within range 135 so Array.sort actually calls the comparator
    { x: 130, y: 100, health: 10, isDead: false, currentWaypointIndex: 1, waypoints: wp },
    { x: 180, y: 100, health: 10, isDead: false, currentWaypointIndex: 1, waypoints: wp },
  ];
  const out = t.findTargets(enemies);
  if (!Array.isArray(out) || out.length !== 1) throw new Error("expected one target");
  if (out[0] !== enemies[0]) throw new Error("expected the closer enemy (130) to be picked");
});

// TEST 3 (bug #1): victory/defeat must activate the end screen via the .active
// class system AND must not leave any screen with inline display:none (which
// would blank out the next playthrough).
function endScreenTest(method, screenId, label) {
  check(label, () => {
    const game = new globalThis.Game();
    game.gameState = "playing";
    game.level = { name: "Test", waves: [1, 2, 3, 4, 5] };
    game.waveNumber = 5;
    game[method]();
    const screen = document.getElementById(screenId);
    const playing = document.getElementById("screen-playing");
    if (!screen._classes.has("active"))
      throw new Error(`${screenId} should have 'active' class so it becomes visible`);
    if (screen.style.display === "none")
      throw new Error(`${screenId} should not be inline-hidden`);
    if (playing.style.display === "none")
      throw new Error("screen-playing left with inline display:none -> next play blank");
    if (playing._classes.has("active"))
      throw new Error("screen-playing should no longer be active");
  });
}
endScreenTest("triggerVictory", "screen-victory", "triggerVictory shows victory screen + safe replay (bug #1)");
endScreenTest("triggerDefeat", "screen-defeat", "triggerDefeat shows defeat screen + safe replay (bug #1)");

// TEST 4 (bug #4): tiny DoT/aura ticks must NOT trigger squash; real hits must.
check("squash only triggers on real hits, not <1 aura ticks (bug #4)", () => {
  const e = new globalThis.FlatEarthEnemy(0, 0, 1);
  e.squashX = 1.0; e.squashY = 1.0;
  e.takeDamage(0.35); // Curie radiation tick
  if (e.squashX !== 1.0) throw new Error("sub-1 damage should not squash the sprite");
  e.takeDamage(20); // a real tower hit
  if (e.squashX <= 1.0) throw new Error("a real hit should still trigger squash recoil");
});

// ===========================================================================
// PHASE 1 (Realm Defense mechanics): enemy traits, counter web, pacing.
// ===========================================================================

// Armored enemies resist physical/energy but take full acid damage.
check("armored enemy resists physical, full acid (counter web)", () => {
  const phys = new globalThis.FlatEarthEnemy(0, 0, 1);
  const startHp = phys.health;
  const physDealt = phys.takeDamage(20, "physical");
  if (Math.abs(physDealt - 10) > 0.01) throw new Error(`armored physical should be halved (got ${physDealt})`);

  const acidE = new globalThis.FlatEarthEnemy(0, 0, 1);
  const acidDealt = acidE.takeDamage(20, "acid");
  if (Math.abs(acidDealt - 20) > 0.01) throw new Error(`armored acid should be full (got ${acidDealt})`);
});

// Shielded enemies absorb chip damage; a big hit cracks the shield.
check("shielded enemy absorbs chip damage, cracks on big hit", () => {
  const e = new globalThis.PerpetualEnemy(0, 0, 1);
  if (!e.shielded || !e.shieldUp) throw new Error("Perpetual Motion should start shielded");
  const chip = e.takeDamage(6, "physical");       // below shieldBreak (25)
  if (chip > 1) throw new Error(`chip damage should be absorbed to ~0.6 (got ${chip})`);
  if (!e.shieldUp) throw new Error("small hit should not crack the shield");
  e.takeDamage(30, "energy");                       // at/above shieldBreak
  if (e.shieldUp) throw new Error("a big hit should crack the shield");
  const after = e.takeDamage(10, "physical");       // shield down -> full
  if (Math.abs(after - 10) > 0.01) throw new Error(`post-crack damage should be full (got ${after})`);
});

// Ground-only towers (Chemistry) cannot target flying enemies; others can.
check("Chemistry can't target flyers; Biology/Physics/Astronomy can", () => {
  const flyer = new globalThis.GeocentricEnemy(100, 100, 1);
  if (!flyer.flying) throw new Error("Geocentric should be flying");
  const chem = new globalThis.ChemistryTower(100, 100);
  const bio = new globalThis.BiologyTower(100, 100);
  if (chem.findTargets([flyer]).length !== 0) throw new Error("Chemistry must not target a flyer");
  if (bio.findTargets([flyer]).length !== 1) throw new Error("Biology must be able to target a flyer");
});

// Healer enemy restores HP to a wounded ally over time.
check("healer enemy heals a wounded ally", () => {
  const healer = new globalThis.AlchemyEnemy(0, 0, 1);
  const ally = new globalThis.PhlogistonEnemy(20, 0, 1);
  ally.health = 1;
  healer.healPulse = 69; // next update triggers a heal pulse
  healer.update(null, [healer, ally]);
  if (ally.health <= 1) throw new Error("healer should restore HP to a nearby wounded ally");
});

// Calling a wave early grants gold and clears the countdown.
check("calling a wave early grants gold bonus and starts the wave", () => {
  const game = new globalThis.Game();
  game.gameState = "playing";
  game.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0]));
  game.isEndless = false;
  game.isWaveActive = false;
  game.waveNumber = 1;
  game.nextWaveCountdown = 600; // 10s left
  const goldBefore = game.gold;
  game.callOrStartWave();
  if (game.gold <= goldBefore) throw new Error("early call should add bonus gold");
  if (!game.isWaveActive) throw new Error("early call should start the next wave");
  if (game.nextWaveCountdown !== 0) throw new Error("countdown should be cleared after starting");
});

// Fast-forward toggles between 1x and 2x.
check("game speed toggles 1x <-> 2x", () => {
  const game = new globalThis.Game();
  if (game.gameSpeed !== 1) throw new Error("default speed should be 1x");
  game.toggleGameSpeed();
  if (game.gameSpeed !== 2) throw new Error("toggle should set 2x");
  game.toggleGameSpeed();
  if (game.gameSpeed !== 1) throw new Error("toggle should return to 1x");
});

// ===========================================================================
// PHASE 2 (Realm Defense mechanics): tower specialization branches + quiz gate.
// ===========================================================================

// Each tower exposes two named specialization branches.
check("every tower exposes two named branches", () => {
  for (const C of ["PhysicsTower", "ChemistryTower", "BiologyTower", "AstronomyTower"]) {
    const t = new globalThis[C](0, 0);
    const info = t.branchInfo();
    if (!info.a || !info.b || !info.a.name || !info.b.name)
      throw new Error(`${C} must expose branch a/b with names`);
  }
});

// chooseBranch only works at level 3 and locks in the branch + new name.
check("chooseBranch upgrades level 3 -> 4 and records branch", () => {
  const t = new globalThis.PhysicsTower(0, 0);
  if (t.chooseBranch("a")) throw new Error("should not branch before level 3");
  t.level = 3;
  const ok = t.chooseBranch("b");
  if (!ok || t.level !== 4 || t.branch !== "b") throw new Error("branch should set level 4 + branch b");
  if (t.name !== "Railgun Tesla") throw new Error(`expected renamed tower (got ${t.name})`);
});

// Railgun (Physics branch b) pierces armor via 'true' damage.
check("Railgun branch pierces armor", () => {
  const armored = new globalThis.FlatEarthEnemy(0, 0, 1);
  const full = armored.takeDamage(40, "true");
  if (Math.abs(full - 40) > 0.01) throw new Error(`'true' damage should ignore armor (got ${full})`);
});

// Quiz gate: branch unlock is blocked without enough RP and applied on a correct answer.
check("specialization is RP+quiz gated", () => {
  const game = new globalThis.Game();
  game.gameState = "playing";
  game.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0]));
  const t = new globalThis.ChemistryTower(150, 300);
  t.level = 3;
  game.towers = [t];

  // No RP -> blocked (no pending branch).
  game.researchPoints = 0;
  game.attemptBranchUnlock(t, "a");
  if (game.pendingBranch) throw new Error("should not start unlock without enough RP");

  // Enough RP -> question presented, pending branch recorded.
  game.researchPoints = t.ultimateRpCost() + 5;
  game.attemptBranchUnlock(t, "a");
  if (!game.pendingBranch) throw new Error("should record pending branch when RP suffices");

  // Correct answer applies the branch and spends RP.
  const rpBefore = game.researchPoints;
  game.solveBranchAnswer(game.currentBranchQuestion.a);
  if (t.level !== 4 || t.branch !== "a") throw new Error("correct answer should apply the branch");
  if (game.researchPoints !== rpBefore - t.ultimateRpCost()) throw new Error("RP should be spent on unlock");
});

// Wrong answer does not unlock or spend RP.
check("wrong specialization answer costs nothing and does not unlock", () => {
  const game = new globalThis.Game();
  game.gameState = "playing";
  game.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0]));
  const t = new globalThis.BiologyTower(150, 300);
  t.level = 3;
  game.towers = [t];
  game.researchPoints = 100;
  game.attemptBranchUnlock(t, "b");
  const wrong = (game.currentBranchQuestion.a + 1) % game.currentBranchQuestion.o.length;
  game.solveBranchAnswer(wrong);
  if (t.level === 4) throw new Error("wrong answer must not specialize the tower");
  if (game.researchPoints !== 100) throw new Error("wrong answer must not spend RP");
});

// ===========================================================================
// PHASE 3 (Realm Defense mechanics): fixed build pads.
// ===========================================================================

check("each campaign level defines build pads", () => {
  for (const lvl of globalThis.LEVEL_DATA) {
    if (!Array.isArray(lvl.buildSpots) || lvl.buildSpots.length < 6)
      throw new Error(`level ${lvl.id} should define build pads`);
  }
});

check("towers snap to a free pad and occupy it; reused pad is rejected", () => {
  const game = new globalThis.Game();
  game.gameState = "playing";
  game.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0]));
  game.gold = 9999;
  game.towers = [];

  const pad = game.level.buildSpots[0]; // { x:150, y:95 }
  game.selectedTowerType = "physics";
  game.placeTower(pad.x + 5, pad.y + 5); // near the pad -> snaps
  if (game.towers.length !== 1) throw new Error("tower should be placed on the nearest pad");
  if (game.towers[0].x !== pad.x || game.towers[0].y !== pad.y) throw new Error("tower should snap to the pad");
  if (!pad.occupied) throw new Error("pad should be marked occupied");

  // Second attempt on the same spot: pad occupied, none other within 45px -> rejected.
  game.selectedTowerType = "biology";
  game.placeTower(pad.x, pad.y);
  if (game.towers.length !== 1) throw new Error("should not place a second tower on an occupied pad");

  // Clicking empty space (no pad nearby) is rejected too.
  game.selectedTowerType = "biology";
  game.placeTower(15, 15);
  if (game.towers.length !== 1) throw new Error("should not place a tower away from any pad");
});

check("build pads on the path are filtered out; placement rejects the road", () => {
  const game = new globalThis.Game();
  const clr = game.PATH_CLEARANCE;
  const lvl = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0]));
  game.level = lvl;

  // A point sitting on the first path segment (-20,100)->(200,100) is "near path".
  if (!game.isNearPath(100, 100, clr)) throw new Error("a point on the road should register as near the path");

  // The startLevel filter must leave pads, none of which sit on the road.
  const survivors = lvl.buildSpots.filter(s => !game.isNearPath(s.x, s.y, clr));
  if (survivors.length === 0) throw new Error("level 0 should retain buildable pads after filtering");
  for (const s of survivors)
    if (game.isNearPath(s.x, s.y, clr)) throw new Error("a surviving pad is still on the path");

  // placeTower's defensive guard rejects a pad that lies on the road.
  game.gameState = "playing";
  game.gold = 9999;
  game.towers = [];
  game.level.buildSpots = [{ x: 100, y: 100 }]; // on the first segment
  game.selectedTowerType = "physics";
  game.placeTower(100, 100);
  if (game.towers.length !== 0) throw new Error("placeTower must reject a pad on the path");
});

// ===========================================================================
// PHASE 4 (Realm Defense mechanics): stars + permanent (meta) upgrades.
// ===========================================================================

check("victory awards 3/2/1 stars by lives remaining and persists best", () => {
  const game = new globalThis.Game();
  game.levelStars = {};
  game.meta = game.loadMeta();
  game.gameState = "playing";
  game.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0])); // id 0
  game.isEndless = false;

  game.lives = 20; game.triggerVictory();
  if (game.levelStars[0] !== 3) throw new Error("20 lives should be 3 stars");

  // A worse later run must not lower the recorded best.
  game.gameState = "playing"; game.lives = 12; game.triggerVictory();
  if (game.levelStars[0] !== 3) throw new Error("best stars should not decrease");
});

check("meta upgrades spend stars and apply global multipliers", () => {
  const game = new globalThis.Game();
  game.levelStars = { 0: 3, 1: 2 }; // 5 stars earned
  game.meta = game.loadMeta();
  game.resetMetaUpgrades();
  if (game.availableStars() !== 5) throw new Error("should have 5 available stars");

  const ok = game.buyMetaUpgrade("towerDmg");
  if (!ok || game.meta.towerDmg !== 1) throw new Error("should buy a tower-damage rank");
  if (game.availableStars() !== 4) throw new Error("buying a rank should spend 1 star");
  if (Math.abs(globalThis.window.SCI_TOWER_DMG_MULT - 1.06) > 1e-9)
    throw new Error("tower damage multiplier should reflect the purchased rank");

  // New towers pick up the multiplier.
  const t = new globalThis.PhysicsTower(0, 0);
  if (Math.abs(t.dmgMult - 1.06) > 1e-9) throw new Error("new tower should read the damage multiplier");

  game.resetMetaUpgrades();
  if (game.meta.towerDmg !== 0 || game.availableStars() !== 5) throw new Error("reset should refund all stars");
  if (globalThis.window.SCI_TOWER_DMG_MULT !== 1) throw new Error("reset should restore 1x damage");
});

check("hero HP meta upgrade increases hero health", () => {
  const game = new globalThis.Game();
  game.levelStars = { 0: 3 };
  game.meta = game.loadMeta();
  game.resetMetaUpgrades();
  const before = (new globalThis.EinsteinHero(0, 0)).maxHealth;
  game.buyMetaUpgrade("heroHp");
  const after = (new globalThis.EinsteinHero(0, 0)).maxHealth;
  if (after <= before) throw new Error("hero HP upgrade should raise max health");
  game.resetMetaUpgrades();
});

// ===========================================================================
// PHASE 5 (Gameplay feedback overhaul): registry, multistage, upgrades, levels.
// ===========================================================================

// Enemy registry + bestiary are populated and every registered class constructs.
check("enemy registry + bestiary populated; all classes construct", () => {
  const reg = globalThis.window.ENEMY_REGISTRY;
  if (!reg || Object.keys(reg).length < 15) throw new Error("ENEMY_REGISTRY should hold all enemy/boss keys");
  for (const k of Object.keys(reg)) {
    const e = new reg[k](0, 0, 1);
    if (typeof e.takeDamage !== "function" || typeof e.setPath !== "function")
      throw new Error(`registry enemy ${k} missing core methods`);
  }
  const bst = globalThis.window.BESTIARY;
  if (!Array.isArray(bst) || bst.length < 15) throw new Error("BESTIARY should describe each enemy");
  for (const b of bst) if (!b.key || !b.name || !b.counter) throw new Error(`bestiary entry incomplete: ${b.key}`);
});

// Multistage enemy sheds its shell: first 0-HP transforms (not dead) and speeds up.
check("multistage enemy transforms on shell break instead of dying", () => {
  const h = new globalThis.HomunculusEnemy(0, 0, 1);
  const spd1 = h.speed;
  h.takeDamage(1e9, "physical");
  if (h.isDead) throw new Error("stage-1 shell break should NOT be a real death");
  if (!(h.speed > spd1)) throw new Error("transformed core should be faster than the shell");
  h.takeDamage(1e9, "physical"); // second death is real
  if (!h.isDead) throw new Error("stage-2 death should be a real death");
});

// Towers offer damage/range/speed upgrade choices, capped at level 3 (then specialize).
check("tower upgrade options offer damage/range/speed and cap at level 3", () => {
  const t = new globalThis.PhysicsTower(0, 0);
  const opts = t.getUpgradeOptions();
  const kinds = opts.map(o => o.kind).sort();
  if (kinds.join(",") !== "damage,range,speed") throw new Error(`expected 3 stat options (got ${kinds})`);
  const r0 = t.range;
  if (!t.applyUpgradeOption("range")) throw new Error("range upgrade should apply");
  if (!(t.range > r0)) throw new Error("range should increase");
  t.applyUpgradeOption("speed"); // now level 3
  if (t.level !== 3) throw new Error("two upgrades from level 1 should reach level 3");
  if (t.applyUpgradeOption("damage")) throw new Error("no standard upgrade past level 3 (specialize instead)");
});

// Volcano (Earth Science) tower is registered and constructs with the upgrade API.
check("volcano tower is registered with magma branches", () => {
  const reg = globalThis.window.TOWER_REGISTRY;
  if (!reg || !reg.volcano) throw new Error("TOWER_REGISTRY.volcano missing");
  const v = new reg.volcano(100, 100);
  if (v.type !== "volcano") throw new Error("volcano tower type");
  const info = v.branchInfo();
  if (!info.a || !info.b) throw new Error("volcano should expose two branches");
  if (typeof v.getUpgradeOptions !== "function") throw new Error("volcano should support upgrade options");
});

// Call Wave during an active wave RUSHES the next wave (overlap) for a gold bonus.
check("call wave during an active wave rushes the next wave (overlap)", () => {
  const game = new globalThis.Game();
  game.gameState = "playing";
  game.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0]));
  game.isEndless = false;
  game.isWaveActive = true;
  game.waveNumber = 1; // more waves remain
  const goldBefore = game.gold;
  game.callOrStartWave();
  if (game.waveNumber !== 2) throw new Error("rush should start the next wave on top of the current one");
  if (game.gold <= goldBefore) throw new Error("rush should grant a gold bonus");
});

// Campaign has 20 levels with bosses at 5, 10, 15 (two), 20.
check("20 campaign levels with bosses at 5/10/15(x2)/20", () => {
  const L = globalThis.LEVEL_DATA;
  if (L.length !== 20) throw new Error(`expected 20 levels (got ${L.length})`);
  const typesIn = (idx) => L[idx].waves.flat().map(s => s.type);
  if (!typesIn(4).includes("boss_geo")) throw new Error("level 5 should field boss_geo");
  if (!typesIn(9).includes("boss_phlog")) throw new Error("level 10 should field boss_phlog");
  const l15 = typesIn(14);
  if (!l15.includes("boss_aether") || !l15.includes("boss_miasma")) throw new Error("level 15 should field two mini-bosses");
  if (!typesIn(19).includes("boss_entropy")) throw new Error("level 20 should field the final boss");
});

// Question system: Year/topic selection (incl. half-yearly/yearly) works.
check("question manager selects by year + topic / exam scope", () => {
  if (!globalThis.window.TOPIC_META[8] || globalThis.window.TOPIC_META[8].length !== 4)
    throw new Error("TOPIC_META should define 4 topics for year 8");
  const qm = new globalThis.QuestionManager();
  qm.setSelection(10, "yearly");
  if (qm.currentYear !== 10 || qm.currentSelection !== "yearly") throw new Error("setSelection should record year+scope");
  const q = qm.getRandomQuestion();
  if (!q || typeof q.a !== "number" || !Array.isArray(q.o)) throw new Error("should return a valid MCQ");
});

// ===========================================================================
// PHASE 6 (Feedback pass 2): syllabus order, placement limits, progression, roles.
// ===========================================================================

// Topic order matches the syllabus; half-yearly = correct topics 1 & 2.
check("syllabus topic order: Y8 half-yearly is Living Systems + Periodic Table", () => {
  const y8 = globalThis.window.TOPIC_META[8].map(t => t.key);
  if (y8[0] !== "living" || y8[1] !== "periodic")
    throw new Error(`Y8 order wrong (got ${y8.join(",")})`);
  const qm = new globalThis.QuestionManager();
  qm.setSelection(8, "halfyearly");
  const topics = [...new Set(qm.activePool.map(q => q.topic))].sort();
  if (topics.join(",") !== "living,periodic")
    throw new Error(`half-yearly should be living+periodic (got ${topics})`);
});

// Placement limit caps each tower type at MAX_PER_TYPE per map.
check("placement limit caps a tower type at 3 per map", () => {
  const game = new globalThis.Game();
  game.gameState = "playing";
  game.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[7]));
  game.isEndless = false;
  game.unlocks = game.getLevelUnlocks(7);
  game.gold = 999999;
  game.towers = [];
  game.level.buildSpots.forEach(s => { s.occupied = false; });
  for (let i = 0; i < 5 && i < game.level.buildSpots.length; i++) {
    const s = game.level.buildSpots[i];
    game.selectedTowerType = "physics";
    game.placeTower(s.x, s.y);
  }
  const n = game.towers.filter(t => t.type === "physics").length;
  if (n !== game.MAX_PER_TYPE) throw new Error(`expected ${game.MAX_PER_TYPE} physics towers (got ${n})`);
});

// Progressive unlocks: levels 1-3 are restricted; later levels open up.
check("progression: levels 1-3 restricted, later levels unlock all", () => {
  const game = new globalThis.Game();
  game.isEndless = false;
  const early = game.getLevelUnlocks(0);
  if (early.towers.length !== 2 || early.maxLevel !== 2 || early.spec)
    throw new Error("levels 1-3 should give 2 towers, max upgrade 2, no specialization");
  const late = game.getLevelUnlocks(10);
  if (late.towers.length !== 6 || late.maxLevel !== 3 || !late.spec)
    throw new Error("later levels should unlock all 6 towers + specialization");
});

// Towers have distinct roles/ranges (sniper >> rapid-fire).
check("tower base ranges are distinct (sniper far, rapid short)", () => {
  const R = globalThis.window.TOWER_BASE_RANGE;
  if (!(R.physics > R.chemistry && R.chemistry > R.biology))
    throw new Error(`expected physics > chemistry > biology ranges (got ${JSON.stringify(R)})`);
  if (R.physics - R.biology < 80) throw new Error("sniper/rapid range gap should be large");
});

// Barracks tower registered, constructs, and exposes the upgrade API.
check("barracks tower registered with troop-blocking", () => {
  const reg = globalThis.window.TOWER_REGISTRY;
  if (!reg || !reg.barracks) throw new Error("TOWER_REGISTRY.barracks missing");
  const b = new reg.barracks(100, 100);
  if (b.type !== "barracks") throw new Error("barracks type");
  if (!Array.isArray(b.minions)) throw new Error("barracks should maintain a minions array");
});

// ===========================================================================
// Gap 1 (targeting), Gap 2 (hero XP + death/respawn), Gap 4 (solve-to-rush).
// ===========================================================================

check("Gap 1: tower targeting cycles first->strongest->weakest->closest and wraps", () => {
  const t = new globalThis.PhysicsTower(100, 100);
  t.targetMode = "first";
  const seq = [t.cycleTargetMode(), t.cycleTargetMode(), t.cycleTargetMode(), t.cycleTargetMode()];
  if (seq.join(",") !== "strongest,weakest,closest,first")
    throw new Error("unexpected cycle: " + seq.join(","));
});

check("Gap 2: hero gains XP, levels up scaling damage/HP, capped at maxLevel", () => {
  const ps = new Proxy({}, { get: () => () => {} });
  const h = new globalThis.EinsteinHero(100, 100);
  const d0 = h.damage, hp0 = h.maxHealth, need0 = h.xpNeeded;
  h.addXp(need0, ps); // exactly one level's worth
  if (h.level !== 2) throw new Error("should reach level 2");
  if (!(h.damage > d0)) throw new Error("level up must scale damage");
  if (!(h.maxHealth > hp0)) throw new Error("level up must scale max HP");
  if (!(h.xpNeeded > need0)) throw new Error("xpNeeded should grow");
  h.addXp(1000000, ps); // overflow -> cap
  if (h.level !== h.maxLevel) throw new Error("should cap at maxLevel");
  if (h.xp !== 0) throw new Error("xp should reset to 0 at max level");
});

check("Gap 2: hero dies at 0 HP and respawns at base after the timer", () => {
  const ps = new Proxy({}, { get: () => () => {} });
  const h = new globalThis.EinsteinHero(100, 100);
  h.respawnPoint = { x: 800, y: 200 };
  h.health = 0;
  h.update([], ps);
  if (!h.isDead) throw new Error("hero should be dead at 0 HP");
  if (h.respawnTimer !== h.RESPAWN_FRAMES) throw new Error("respawn timer should be set on death");
  h.respawnTimer = 1;          // fast-forward to the last frame
  h.update([], ps);
  if (h.isDead) throw new Error("hero should have respawned");
  if (h.health !== h.maxHealth) throw new Error("respawn should restore full HP");
  if (h.x !== 800 || h.y !== 200) throw new Error("respawn should relocate hero to the base");
});

check("Gap 4: Solve-to-Rush correct calls wave + double gold; wrong = no penalty", () => {
  const mk = () => {
    const g = new globalThis.Game();
    g.gameState = "playing";
    g.level = JSON.parse(JSON.stringify(globalThis.LEVEL_DATA[0]));
    g.isWaveActive = false; g.nextWaveCountdown = 600; g.waveNumber = 1; g.gold = 0;
    g.heroes = []; g.summonedMinions = []; g.spawnQueue = [];
    g.currentRushQuestion = { q: "?", o: ["a", "b"], a: 0, exp: "x" };
    g.rushCountdownSnapshot = 600;
    return g;
  };
  const correct = mk();
  correct.solveRushAnswer(0);
  if (!correct.isWaveActive) throw new Error("correct answer should start the next wave");
  const expected = Math.ceil(600 / 60) * correct.EARLY_CALL_GOLD_PER_SEC * 2; // 10*8*2 = 160
  if (correct.gold !== expected) throw new Error(`expected ${expected}G, got ${correct.gold}`);

  const wrong = mk();
  wrong.solveRushAnswer(1);
  if (wrong.isWaveActive) throw new Error("wrong answer must not start a wave");
  if (wrong.gold !== 0) throw new Error("wrong answer must not grant gold");
});

// ===========================================================================
// Procedural SFX system (js/audio.js): the dynamic-key resolver is the part
// that can silently break. Verify exact hits, family fallback, and that an
// unknown key resolves to null (silent, never throws).
// ===========================================================================

check("SFX: audioManager exposes playSfx and the recipe resolver", () => {
  const am = globalThis.window.audioManager;
  if (!am) throw new Error("window.audioManager not created");
  if (typeof am.playSfx !== "function") throw new Error("playSfx missing");
  if (typeof am._resolveSfx !== "function") throw new Error("_resolveSfx missing");
});

check("SFX: dynamic keys resolve exact-first, then fall back to the family base", () => {
  const am = globalThis.window.audioManager;
  const has = (k) => { const r = am._resolveSfx(k); if (!r || !Array.isArray(r.voices) || !r.voices.length) throw new Error(`'${k}' did not resolve to a voiced recipe`); return r; };
  // exact recipes
  has("tower_physics_fire"); has("hero_einstein_attack"); has("enemy_death");
  // dynamic keys with no exact match must fall back to the base family
  if (has("tower_barracks_fire") !== am._resolveSfx("tower_fire")) throw new Error("tower_barracks_fire should fall back to tower_fire");
  if (has("hero_curie_skill")    !== am._resolveSfx("hero_skill")) throw new Error("hero_curie_skill should fall back to hero_skill");
  if (has("enemy_spider_death")  !== am._resolveSfx("enemy_death")) throw new Error("enemy_spider_death should fall back to enemy_death");
  if (has("projectile_flask_hit")=== am._resolveSfx("projectile_hit")) {} // flask has an exact recipe (distinct from base) — fine either way
});

check("Music: only one track ever plays — victory/defeat stinger can't bleed into the next track", () => {
  const am = globalThis.window.audioManager;
  am.unlocked = true; am.muted = false; // enable real play/pause bookkeeping
  const playingCount = () => Object.values(am._cache).filter(el => !el.paused).length;

  // Win a level (stinger), then navigate: menu -> next level's battle track.
  am.playStinger("victory");
  if (playingCount() !== 1) throw new Error("stinger should be the only thing playing");
  am.playMusic("menu");
  if (playingCount() !== 1) throw new Error("menu music must stop the lingering victory stinger (overlap bug)");
  am.playMusic("battle_1");
  if (playingCount() !== 1) throw new Error("battle music must not overlap a prior stinger");

  // Boss switch should also stay single-track.
  am.playMusic("boss");
  am.playMusic("battle_1");
  if (playingCount() !== 1) throw new Error("boss<->battle switch must stay single-track");

  am.stopMusic();
  if (playingCount() !== 0) throw new Error("stopMusic should leave nothing playing");
});

check("SFX: unknown key resolves to null and playSfx is a safe no-op (no audio ctx in headless)", () => {
  const am = globalThis.window.audioManager;
  if (am._resolveSfx("totally_unknown_event") !== null) throw new Error("unknown key should resolve to null");
  if (am._resolveSfx("nounderscorehere") !== null) throw new Error("key without family should resolve to null");
  // No AudioContext exists in node, so playSfx must early-return rather than throw.
  am.playSfx("tower_physics_fire");
  am.playSfx("totally_unknown_event");
});

// ===========================================================================
// Hero ability aiming UX + tower upgrade menu auto-dismiss / confirm-sell.
// ===========================================================================

check("Hero abilities expose an aim radius for the targeting reticle", () => {
  const r = (Cls) => new globalThis[Cls](0, 0).skillRadius;
  if (!(r("EinsteinHero") > 0)) throw new Error("Einstein missing skillRadius");
  if (!(r("NewtonHero") > 0)) throw new Error("Newton missing skillRadius");
  if (!(r("CurieHero") > 0)) throw new Error("Curie missing skillRadius");
  if (!(r("DarwinHero") > 0)) throw new Error("Darwin missing skillRadius");
});

check("activateHeroAbility: ready skill enters aim mode; cooldown/dead does not", () => {
  const g = new globalThis.Game();
  g.gameState = "playing";
  g.updateSidebarUI = () => {}; // isolate targeting state from DOM-heavy render
  g.heroes = [new globalThis.EinsteinHero(100, 100)];

  // ready -> aim mode on, hero selected, index recorded
  g.heroes[0].skillCooldownTimer = 0;
  g.activateHeroAbility(0);
  if (!g.isTargetingSkill) throw new Error("ready ability should enter aim mode");
  if (g.targetingHeroIndex !== 0) throw new Error("should record which hero is aiming");
  if (g.activeSelectedHero !== g.heroes[0]) throw new Error("hero should be selected");

  // Esc-style cancel clears aim mode
  g.cancelSkillTargeting();
  if (g.isTargetingSkill || g.targetingHeroIndex !== -1) throw new Error("cancel should clear aim state");

  // on cooldown -> selects but does NOT enter aim mode
  g.heroes[0].skillCooldownTimer = 120;
  g.activateHeroAbility(0);
  if (g.isTargetingSkill) throw new Error("cooldown ability must not enter aim mode");

  // dead -> no-op (no selection, no aim)
  g.activeSelectedHero = null;
  g.heroes[0].isDead = true;
  g.activateHeroAbility(0);
  if (g.activeSelectedHero) throw new Error("dead hero ability should be a no-op");
});

check("Tower upgrade menu: auto-hide timer schedules + cancels, hide clears selection", () => {
  const g = new globalThis.Game();
  g.scheduleUpgradeMenuAutoHide(5000);
  if (!g._upgradeHideTimer) throw new Error("scheduling should set a pending hide timer");
  g.cancelUpgradeMenuAutoHide();
  if (g._upgradeHideTimer) throw new Error("cancel should clear the hide timer");
  // hide must also drop the selected tower so the range ring/menu don't desync
  g.selectedTowerForUpgrade = { fake: true };
  g.scheduleUpgradeMenuAutoHide(5000);
  g.hideTowerUpgradeMenu();
  if (g.selectedTowerForUpgrade !== null) throw new Error("hide should clear selectedTowerForUpgrade");
  if (g._upgradeHideTimer) throw new Error("hide should clear the pending timer");
});

check("Tower upgrade menu hides the hero ability bar while open (no overlap) and restores it", () => {
  const g = new globalThis.Game();
  g.gold = 500;
  g.heroes = []; // skip DOM-heavy button rendering; the visibility reconcile still runs
  const bar = document.getElementById("hero-ability-bar");
  const tower = new globalThis.PhysicsTower(100, 100);

  g.showTowerUpgradeMenu(tower);   // selects the tower
  g.renderHeroAbilityBar();        // reconciles bar visibility (runs every frame in-game)
  if (bar.style.display !== "none") throw new Error("ability bar must be hidden while the upgrade menu is open");

  g.hideTowerUpgradeMenu();        // deselects the tower
  g.renderHeroAbilityBar();
  if (bar.style.display !== "flex") throw new Error("ability bar must be restored when the menu closes");
});

check("Ability bar is never stuck hidden: deselecting the tower by ANY path restores it", () => {
  const g = new globalThis.Game();
  g.heroes = [];
  const bar = document.getElementById("hero-ability-bar");
  // open menu, then clear selection the way a hero-click does (without calling hide)
  g.showTowerUpgradeMenu(new globalThis.PhysicsTower(100, 100));
  g.renderHeroAbilityBar();
  if (bar.style.display !== "none") throw new Error("precondition: bar hidden with menu open");
  g.selectedTowerForUpgrade = null; // e.g. clicked a hero
  g.renderHeroAbilityBar();
  if (bar.style.display !== "flex") throw new Error("bar must reappear the moment no tower is selected (the 'blocked ability' bug)");
});

// ===========================================================================
// Battle items (RP-purchased consumables): cost/cooldown gating + effects.
// ===========================================================================

const mkEnemy = (x, y) => ({ x, y, isDead: false, hits: 0,
  takeDamage(d, t) { this.hits++; this.lastDmg = d; this.lastType = t; },
  applySlow(f, s) { this.slow = f; } });

check("Battle items: cast spends RP + starts cooldown; broke/on-cooldown is a no-op", () => {
  const g = new globalThis.Game();
  g.gameState = "playing"; g.updateSidebarUI = () => {}; g.enemies = [];
  const cost = globalThis.window.BATTLE_ITEMS_BY_KEY.meteor.cost;
  g.researchPoints = cost + 5;
  if (g.castBattleItem("meteor", 100, 100) !== true) throw new Error("should cast with enough RP");
  if (g.researchPoints !== 5) throw new Error("RP not deducted correctly");
  if (!(g.itemCooldowns.meteor > 0)) throw new Error("cooldown should be set after casting");
  // immediately again -> blocked by cooldown, no RP change
  g.researchPoints = 999;
  if (g.castBattleItem("meteor", 100, 100) !== false) throw new Error("must be blocked while on cooldown");
  if (g.researchPoints !== 999) throw new Error("no RP spent when blocked");
  // insufficient RP
  g.itemCooldowns = {}; g.researchPoints = 1;
  if (g.castBattleItem("bomb", 0, 0) !== false) throw new Error("must be blocked with insufficient RP");
});

check("Battle items: meteor hits only enemies in radius (true dmg); cryo freezes all", () => {
  const g = new globalThis.Game();
  g.gameState = "playing"; g.updateSidebarUI = () => {}; g.researchPoints = 9999;
  const near = mkEnemy(100, 100), far = mkEnemy(700, 600);
  g.enemies = [near, far];
  g.castBattleItem("meteor", 100, 100);
  if (near.hits !== 1) throw new Error("enemy inside radius should take meteor damage");
  if (far.hits !== 0) throw new Error("enemy outside radius must not be hit");
  if (near.lastType !== "true") throw new Error("meteor should deal armor-piercing true damage");
  g.itemCooldowns = {};
  g.castBattleItem("cryo", 0, 0);
  if (near.slow === undefined || far.slow === undefined) throw new Error("cryo must slow/freeze every enemy on screen");
});

check("Battle items: mercenaries spawn blockers; selecting a targeted item enters aim mode", () => {
  const g = new globalThis.Game();
  g.gameState = "playing"; g.updateSidebarUI = () => {}; g.researchPoints = 9999;
  g.enemies = []; g.summonedMinions = [];
  g.castBattleItem("merc", 200, 200);
  const merc = globalThis.window.BATTLE_ITEMS_BY_KEY.merc;
  if (g.summonedMinions.length !== merc.mercs) throw new Error("should spawn the configured number of mercenaries");
  if (g.summonedMinions[0].constructor.name !== "SummonedMinion") throw new Error("mercenaries should be SummonedMinion blockers");
  // selecting a targeted item arms aim mode rather than firing instantly
  g.itemCooldowns = {};
  g.selectBattleItem("bomb");
  if (!g.isTargetingItem || g.activeItemKey !== "bomb") throw new Error("targeted item should enter aim mode on select");
  g.cancelSkillTargeting();
  if (g.isTargetingItem) throw new Error("cancel must clear item aim mode");
});

// ---- Report ---------------------------------------------------------------
let pass = 0;
for (const [ok, name, msg] of results) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "\n        -> " + msg}`);
  if (ok) pass++;
}
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);
