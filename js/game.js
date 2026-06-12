// js/game.js
// Main Game Controller and Engine for Science Tower Defense

// Battle items — RP-purchased consumables usable during a level (Realm-Defense
// style). `targeted` items are aimed on the battlefield; others fire instantly.
// Costs/cooldowns are balanced defaults and easy to tune.
const BATTLE_ITEMS = [
    { key: "cryo",   name: "Cryo Field",  icon: "❄️", cost: 30, cooldownSec: 25, targeted: false, color: "#7fdfff", freezeSec: 3,
      desc: "Freezes every enemy on screen for 3s while your towers keep firing." },
    { key: "meteor", name: "Meteor",      icon: "☄️", cost: 25, cooldownSec: 16, targeted: true, color: "#ff7b3a", radius: 115, damage: 320,
      desc: "Calls down a meteor for massive true-damage in a large area." },
    { key: "bomb",   name: "Mini Bomb",   icon: "💣", cost: 12, cooldownSec: 7,  targeted: true, color: "#ffd166", radius: 72,  damage: 130,
      desc: "Cheap burst of explosive damage in a small area." },
    { key: "merc",   name: "Mercenaries", icon: "🗡️", cost: 35, cooldownSec: 30, targeted: true, color: "#c0a062", mercs: 2, mercHp: 160, mercDmg: 22, mercSec: 18,
      desc: "Drops 2 sellswords that block & fight enemies for 18s." },
];
const BATTLE_ITEMS_BY_KEY = BATTLE_ITEMS.reduce((m, it) => { m[it.key] = it; return m; }, {});
if (typeof window !== "undefined") { window.BATTLE_ITEMS = BATTLE_ITEMS; window.BATTLE_ITEMS_BY_KEY = BATTLE_ITEMS_BY_KEY; }

const ASSETS_MANIFEST = {
    // UI/Backgrounds
    "bg_menu": "assets/ui/fantasy_bg.png",
    
    // Heroes
    "hero_einstein": "assets/heroes/einstein.png",
    "hero_newton": "assets/heroes/newton.png",
    "hero_curie": "assets/heroes/curie.png",
    "hero_darwin": "assets/heroes/darwin.png",
    "hero_tortoise": "assets/heroes/tortoise.png",
    
    // Towers
    "tower_physics_1": "assets/towers/physics_1.png",
    "tower_physics_3": "assets/towers/physics_3.png",
    "tower_physics_4": "assets/towers/physics_4.png",
    
    "tower_chemistry_1": "assets/towers/chemistry_1.png",
    "tower_chemistry_3": "assets/towers/chemistry_3.png",
    "tower_chemistry_4": "assets/towers/chemistry_4.png",
    
    "tower_biology_1": "assets/towers/biology_1.png",
    "tower_biology_3": "assets/towers/biology_3.png",
    "tower_biology_4": "assets/towers/biology_4.png",
    
    "tower_astronomy_1": "assets/towers/astronomy_1.png",
    "tower_astronomy_3": "assets/towers/astronomy_3.png",
    "tower_astronomy_4": "assets/towers/astronomy_4.png",
    
    // Enemies
    "enemy_flatearth": "assets/enemies/flatearth.png",
    "enemy_phlogiston": "assets/enemies/phlogiston.png",
    "enemy_spontaneous": "assets/enemies/spontaneous.png",
    "enemy_maggot": "assets/enemies/maggot.png",
    "enemy_alchemy": "assets/enemies/alchemy.png",
    "enemy_perpetual": "assets/enemies/perpetual.png",
    "enemy_geocentric": "assets/enemies/geocentric.png",
    
    // Projectiles
    "proj_flask": "assets/projectiles/flask.png",
    "proj_spore": "assets/projectiles/spore.png"
};

// ---- Animated sprite sheets (single-row strips) -------------------------
// Heroes are RIGHT-facing; the renderer mirrors them when moving left.
// Towers are static (idle/attack only). Each entry describes one horizontal
// strip: frameW/frameH px cells, `cols` frames, `fps` playback, `loop` false
// for one-shot (attack) anims. Anything WITHOUT a SHEET_META entry is drawn as
// a single whole image; anything with no asset at all falls back to the
// procedural vector art — so partially-delivered art is always safe.
window.SHEET_META = {};
(function buildSheetMeta() {
    const HEROES = ["einstein", "newton", "curie", "darwin", "tortoise"];
    const HERO_STATES = {
        idle:   { cols: 4, fps: 6,  loop: true  },
        walk:   { cols: 8, fps: 12, loop: true  },
        attack: { cols: 6, fps: 14, loop: false },
    };
    HEROES.forEach(h => Object.entries(HERO_STATES).forEach(([state, cfg]) => {
        if (h === "tortoise" && state === "attack") return; // tortoise has no attack sheet
        const key = `hero_${h}_${state}`;
        ASSETS_MANIFEST[key] = `assets/heroes/${h}_${state}.png`;
        window.SHEET_META[key] = { frameW: 64, frameH: 64, ...cfg };
    }));

    const TOWERS = ["physics", "chemistry", "biology", "astronomy"];
    const TIERS = ["1", "3", "4"];
    const TOWER_STATES = {
        idle:   { cols: 6, fps: 8,  loop: true  },
        attack: { cols: 6, fps: 16, loop: false },
    };
    TOWERS.forEach(t => TIERS.forEach(tier => Object.entries(TOWER_STATES).forEach(([state, cfg]) => {
        const key = `tower_${t}_${tier}_${state}`;
        ASSETS_MANIFEST[key] = `assets/towers/${t}_${tier}_${state}.png`;
        window.SHEET_META[key] = { frameW: 64, frameH: 64, ...cfg };
    })));

    // Enemies — one looping WALK strip each (enemies are always moving, so a
    // single move cycle is all they need; defeat keeps the squash + particle
    // burst). Regular creeps use 64px cells, bosses 128px. Missing files fall
    // back to a static whole image, then to procedural vector art.
    const ENEMIES = ["flatearth", "phlogiston", "spontaneous", "maggot", "alchemy",
        "perpetual", "geocentric", "miasma", "caloric", "aether", "vitalism",
        "humours", "creationist", "homunculus", "homunculus_core", "golem", "golem_molten"];
    ENEMIES.forEach(e => {
        const key = `enemy_${e}_walk`;
        ASSETS_MANIFEST[key] = `assets/enemies/${e}_walk.png`;
        window.SHEET_META[key] = { frameW: 64, frameH: 64, cols: 6, fps: 10, loop: true };
    });
    const BOSSES = ["boss_geo", "boss_phlog", "boss_aether", "boss_miasma", "boss_entropy"];
    BOSSES.forEach(e => {
        const key = `enemy_${e}_walk`;
        ASSETS_MANIFEST[key] = `assets/enemies/${e}_walk.png`;
        window.SHEET_META[key] = { frameW: 128, frameH: 128, cols: 6, fps: 8, loop: true };
    });

    // Per-level painted terrain backgrounds, keyed by level id (theme order
    // matches LEVEL_DATA). The winding path and build pads are still drawn on
    // top in code, so the art is plain themed terrain and never has to line up
    // with exact waypoints. Missing files fall back to bgColor + procedural scenery.
    const LEVEL_THEMES = ["lab", "swamp", "volcanic", "tundra", "observatory", "alchemy",
        "aether", "marsh", "tectonic", "forge", "cavern", "storm", "toxic", "stellar",
        "twin_spires", "ocean", "magnetic", "radiation", "singularity", "heat_death"];
    LEVEL_THEMES.forEach((theme, id) => {
        ASSETS_MANIFEST[`bg_level_${id}`] = `assets/levels/${theme}.png`;
    });
})();

// Draw one frame of an animated strip into (dx,dy,dw,dh). Resolves the key
// `${baseKey}_${state}`, falling back to the `_idle` sheet, then to a static
// whole image named `baseKey`. Returns false if nothing could be drawn, so the
// caller can run its procedural vector fallback. `attackStart` (ms from
// performance.now()) drives one-shot (loop:false) anims.
window.drawSprite = function (ctx, baseKey, state, dx, dy, dw, dh, attackStart) {
    const assets = window.spriteAssets || {};
    const metas = window.SHEET_META || {};
    let key = `${baseKey}_${state}`;
    let img = assets[key], meta = metas[key];
    if (!img || !meta) { key = `${baseKey}_idle`; img = assets[key]; meta = metas[key]; } // fall back to idle
    if (!img) { img = assets[baseKey]; meta = null; }                                      // static whole image
    if (!img || !img.complete || img.naturalWidth === 0) return false;                     // → vector fallback
    if (!meta) { ctx.drawImage(img, dx, dy, dw, dh); return true; }

    let frame;
    if (meta.loop === false) {
        const elapsed = performance.now() - (attackStart || 0);
        frame = Math.floor(elapsed * meta.fps / 1000);
        if (frame < 0) frame = 0;
        if (frame > meta.cols - 1) frame = meta.cols - 1; // hold last frame
    } else {
        frame = Math.floor(performance.now() * meta.fps / 1000) % meta.cols;
    }
    ctx.drawImage(img, frame * meta.frameW, 0, meta.frameW, meta.frameH, dx, dy, dw, dh);
    return true;
};

// Permanent (meta) upgrades bought with Stars. Resettable, persisted in localStorage.
const META_DEFS = [
    { key: "towerDmg",   label: "Empirical Precision", desc: "+6% tower damage per rank",      max: 3, perRank: 0.06 },
    { key: "heroHp",     label: "Scientific Resilience", desc: "+10% hero max HP per rank",     max: 3, perRank: 0.10 },
    { key: "startGold",  label: "Research Grant",      desc: "+30 starting gold per rank",     max: 3, perRank: 30 },
    { key: "startLives", label: "Containment Field",   desc: "+1 starting life per rank",      max: 3, perRank: 1 },
    { key: "rpGain",     label: "Peer Review",         desc: "+12% Research Point gain/rank",  max: 3, perRank: 0.12 },
];
const META_KEY = "std_meta_v1";
const STARS_KEY = "std_stars_v1";
const BESTIARY_KEY = "std_bestiary_v1";
const META_COST_PER_RANK = 1; // each rank costs 1 star

class Game {
    constructor() {
        this.canvas = document.getElementById("game-canvas");
        this.ctx = this.canvas.getContext("2d");
        
        // Size setup
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;

        // Managers and Pools
        this.questionManager = new QuestionManager();
        this.particleSystem = new ParticleSystem();
        
        this.level = null; // Current level object
        this.isEndless = false;
        this.PATH_CLEARANCE = 34; // min px from path centerline for a build pad

        // --- Late-game difficulty ramp (engagement) -----------------------
        // Levels 1–3 are the onboarding curve and stay untouched. From Level 4
        // (id >= 3) the player unlocks extra tower types, full level-3 upgrades
        // AND specialisations, so the base +0.28/level enemy scaling fell behind
        // and later levels felt too easy. These add a CAPPED ramp on top — both
        // tankier enemies and bigger waves — so players must use their full
        // toolkit (all disciplines, specialisations, heroes, battle items).
        // Tunable: raise to make late levels harder, lower to ease them.
        this.LATE_RAMP_START_ID = 3;       // first level the ramp applies to (Level 4)
        this.LATE_HP_PER_LEVEL = 0.16;     // extra HP-scale per level past L3 (bosses get half)
        this.LATE_HP_CAP = 2.0;            // max extra HP-scale (≈ +74% HP at the cap)
        this.LATE_COUNT_PER_LEVEL = 0.07;  // extra enemies per level past L3
        this.LATE_COUNT_CAP = 0.6;         // max +60% enemy count

        // Game state variables
        this.gold = 350;
        this.lives = 20;
        this.maxLives = 20;
        this.researchPoints = 0;
        this.score = 0;
        this.waveNumber = 0;
        this.isWaveActive = false;
        this.gameState = "menu"; // 'menu', 'levelselect', 'playing', 'victory', 'defeat'
        this.isPaused = false;

        // Realm Defense-style pacing
        this.gameSpeed = 1;              // 1x or 2x fast-forward
        this.nextWaveCountdown = 0;      // frames until next wave auto-starts (0 = idle)
        this.WAVE_COUNTDOWN_FRAMES = 720; // ~12s between waves
        this.EARLY_CALL_GOLD_PER_SEC = 8; // bonus gold per second of countdown skipped
        this.MAX_PER_TYPE = 3;            // placement cap per tower type (anti-dominant-tower)

        // Entities lists
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.heroes = [];
        this.summonedMinions = [];

        // Spawner tracker
        this.spawnQueue = [];
        this.spawnTimer = 0;

        // Interactions / selection state
        this.selectedTowerType = null; // type to place: 'physics', etc.
        this.activeSelectedHero = null;
        this.selectedTowerForUpgrade = null;
        this.isTargetingSkill = false; // Hero active targeting state
        this.targetingHeroIndex = -1;  // which hero's ability is being aimed
        this._upgradeHideTimer = null; // auto-dismiss timer for the tower upgrade menu
        // Battle items (RP-purchased consumables, Realm-Defense style)
        this.itemCooldowns = {};       // item key -> frames of cooldown remaining
        this.isTargetingItem = false;  // aiming a targeted item (meteor/bomb/merc)
        this.activeItemKey = null;

        // Screen shake (big impacts: leaks, meteors, boss kills). Frame-based
        // so it scales with game speed like every other timer.
        this.shakeFrames = 0;
        this.shakeDuration = 1;
        this.shakeMag = 0;
        this._cryoUntil = 0;           // performance.now() ts until which the cryo freeze overlay shows
        this._itemBarBuilt = false;
        this.ideaBubbles = [];
        this.bubbleSpawnTimer = 300; // spawn bubble every few seconds

        // Question system state
        this.currentActiveQuestion = null;
        this.questionCallback = null;

        // Tower specialization (quiz-gated) state
        this.pendingBranch = null;
        this.currentBranchQuestion = null;

        // Mouse coordinates
        this.mouseX = 0;
        this.mouseY = 0;

        // Asset Loader Preloading System
        window.spriteAssets = {};
        this.loadedAssetsCount = 0;
        this.totalAssetsCount = Object.keys(ASSETS_MANIFEST).length;
        this.assetsLoaded = false;
        
        Object.entries(ASSETS_MANIFEST).forEach(([key, path]) => {
            const img = new Image();
            img.src = path;
            img.onload = () => {
                window.spriteAssets[key] = img;
                this.loadedAssetsCount++;
                if (this.loadedAssetsCount === this.totalAssetsCount) {
                    this.assetsLoaded = true;
                    console.log("All PNG assets successfully loaded!");
                }
            };
            img.onerror = () => {
                // Graceful fallback trigger
                console.warn(`PNG Sprite not found: ${path}. Falling back to 2D Cartoon Vector Procedural Drawing.`);
                this.loadedAssetsCount++;
                if (this.loadedAssetsCount === this.totalAssetsCount) {
                    this.assetsLoaded = true;
                }
            };
        });

        // Meta-progression (stars + permanent upgrades), persisted in localStorage.
        this.levelStars = this.loadStars();
        this.meta = this.loadMeta();
        this.applyMetaGlobals();
        this.rpMult = 1;

        // Bestiary: which enemy/boss types the player has encountered (persisted).
        this.seenEnemies = this.loadSeenEnemies();

        this.initEventListeners();
        this.startGameLoop();
    }

    // ---- Meta-progression -------------------------------------------------
    loadStars() {
        try { return JSON.parse(localStorage.getItem(STARS_KEY)) || {}; }
        catch (e) { return {}; }
    }
    saveStars() {
        try { localStorage.setItem(STARS_KEY, JSON.stringify(this.levelStars)); } catch (e) {}
    }
    loadMeta() {
        const base = {};
        META_DEFS.forEach(d => { base[d.key] = 0; });
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(META_KEY)) || {}; } catch (e) {}
        META_DEFS.forEach(d => {
            if (typeof saved[d.key] === "number") base[d.key] = Math.max(0, Math.min(d.max, saved[d.key]));
        });
        return base;
    }
    saveMeta() {
        try { localStorage.setItem(META_KEY, JSON.stringify(this.meta)); } catch (e) {}
    }
    applyMetaGlobals() {
        const dmg = META_DEFS.find(d => d.key === "towerDmg");
        const hp = META_DEFS.find(d => d.key === "heroHp");
        window.SCI_TOWER_DMG_MULT = 1 + dmg.perRank * this.meta.towerDmg;
        window.SCI_HERO_HP_MULT = 1 + hp.perRank * this.meta.heroHp;
    }
    totalEarnedStars() {
        return Object.values(this.levelStars).reduce((a, b) => a + b, 0);
    }
    spentStars() {
        return META_DEFS.reduce((sum, d) => sum + this.meta[d.key] * META_COST_PER_RANK, 0);
    }
    availableStars() {
        return this.totalEarnedStars() - this.spentStars();
    }
    buyMetaUpgrade(key) {
        const def = META_DEFS.find(d => d.key === key);
        if (!def) return false;
        if (this.meta[key] >= def.max) return false;
        if (this.availableStars() < META_COST_PER_RANK) return false;
        this.meta[key]++;
        this.saveMeta();
        this.applyMetaGlobals();
        return true;
    }
    resetMetaUpgrades() {
        META_DEFS.forEach(d => { this.meta[d.key] = 0; });
        this.saveMeta();
        this.applyMetaGlobals();
    }

    // ---- Bestiary (encounter-gated monster wiki) --------------------------
    loadSeenEnemies() {
        try { return JSON.parse(localStorage.getItem(BESTIARY_KEY)) || {}; }
        catch (e) { return {}; }
    }
    saveSeenEnemies() {
        try { localStorage.setItem(BESTIARY_KEY, JSON.stringify(this.seenEnemies)); } catch (e) {}
    }
    recordBestiaryEncounter(type) {
        if (!type || this.seenEnemies[type]) return;
        this.seenEnemies[type] = true;
        this.saveSeenEnemies();
        // Flag a "new entry" toast (only if we have data for it).
        const entry = (window.BESTIARY || []).find(b => b.key === type);
        if (entry) this.showInGameNotification(`📖 New Bestiary entry: ${entry.name}!`);
    }

    // Render the Bestiary screen. Entries unlock on first encounter.
    renderBestiary() {
        const list = document.getElementById("bestiary-list");
        if (!list) return;
        const entries = window.BESTIARY || [];
        if (entries.length === 0) {
            list.innerHTML = `<p style="color:#8c8c9a;">Bestiary data is still loading…</p>`;
            return;
        }
        const seenCount = entries.filter(e => this.seenEnemies[e.key]).length;
        const threatColor = { Low: "#7fdb6a", Medium: "#ffd166", High: "#ff8c42", Boss: "#ff3b5c" };
        list.innerHTML = `<div style="color:#bdc3c7; font-size:13px; margin-bottom:12px;">Discovered ${seenCount} / ${entries.length}</div>`;
        entries.forEach(e => {
            const seen = !!this.seenEnemies[e.key];
            const card = document.createElement("div");
            card.className = "bestiary-card" + (seen ? "" : " locked");
            if (seen) {
                card.innerHTML = `
                    <div class="bestiary-head">
                        <span class="bestiary-name">${e.name}</span>
                        <span class="bestiary-threat" style="color:${threatColor[e.threat] || "#fff"};">${e.threat}</span>
                    </div>
                    <div class="bestiary-role">${e.role}</div>
                    <div class="bestiary-desc">${e.desc}</div>
                    <div class="bestiary-counter"><strong>Counter:</strong> ${e.counter}</div>
                `;
            } else {
                card.innerHTML = `
                    <div class="bestiary-head"><span class="bestiary-name">??? </span></div>
                    <div class="bestiary-role">Not yet encountered</div>
                    <div class="bestiary-desc">Defeat this in battle to unlock its field notes.</div>
                `;
            }
            list.appendChild(card);
        });
    }

    // Progressive unlocks: which towers are buildable, how high they can be
    // upgraded, and whether specialization is allowed — a function of the level
    // reached. Levels 1–3 are deliberately restricted (2 towers, 1 upgrade) so
    // the player can't trivially over-build; the roster + tiers open up after.
    getLevelUnlocks(idx) {
        const all = ["physics", "biology", "chemistry", "astronomy", "volcano", "barracks"];
        if (this.isEndless) return { towers: all, maxLevel: 3, spec: true };
        if (idx <= 2)  return { towers: ["physics", "biology"], maxLevel: 2, spec: false };
        if (idx === 3) return { towers: ["physics", "biology", "chemistry"], maxLevel: 3, spec: true };
        if (idx === 4) return { towers: ["physics", "biology", "chemistry", "astronomy"], maxLevel: 3, spec: true };
        if (idx === 5) return { towers: ["physics", "biology", "chemistry", "astronomy", "volcano"], maxLevel: 3, spec: true };
        return { towers: all, maxLevel: 3, spec: true };
    }

    // Show/hide shop buttons to match the current level's unlocked towers.
    applyLevelUnlocks() {
        document.querySelectorAll(".shop-btn[data-tower]").forEach(btn => {
            const t = btn.getAttribute("data-tower");
            btn.style.display = this.unlocks.towers.includes(t) ? "" : "none";
        });
    }

    startLevel(levelIndex, endless = false) {
        this.level = JSON.parse(JSON.stringify(LEVEL_DATA[levelIndex]));
        this.isEndless = endless;
        this.unlocks = this.getLevelUnlocks(levelIndex);

        // Drop any authored build pad that overlaps the road, so a tower can
        // never be placed on the path. Clearance = path half-width (18) + pad
        // footprint (16). Placement also re-checks (see placeTower).
        if (this.level.buildSpots) {
            const before = this.level.buildSpots.length;
            this.level.buildSpots = this.level.buildSpots.filter(s => !this.isNearPath(s.x, s.y, this.PATH_CLEARANCE));
            const dropped = before - this.level.buildSpots.length;
            if (dropped > 0) console.warn(`Level ${levelIndex}: removed ${dropped} build pad(s) overlapping the path.`);
        }

        // Spawn portal (where enemies emerge) and the defended base (path end),
        // clamped just inside the canvas from the off-screen first/last waypoints.
        const wps = this.level.waypoints || [];
        const m = 30; // inset so the structure sits fully on-screen
        const clampIn = p => ({
            x: Math.min(Math.max(p.x, m), GAME_WIDTH - m),
            y: Math.min(Math.max(p.y, m), GAME_HEIGHT - m),
        });
        this.level._spawnPoint = wps.length ? clampIn(wps[0]) : null;
        this.level._basePoint = wps.length ? clampIn(wps[wps.length - 1]) : null;
        this.baseHitAt = 0; // timestamp of last base impact (for the hit flash)

        // Apply permanent (meta) upgrades for this run.
        this.applyMetaGlobals();
        const goldDef = META_DEFS.find(d => d.key === "startGold");
        const livesDef = META_DEFS.find(d => d.key === "startLives");
        const rpDef = META_DEFS.find(d => d.key === "rpGain");

        // Reset game stats
        this.gold = (endless ? 450 : 350) + goldDef.perRank * this.meta.startGold;
        this.lives = 20 + livesDef.perRank * this.meta.startLives;
        this.maxLives = this.lives;
        this.rpMult = 1 + rpDef.perRank * this.meta.rpGain;
        this.researchPoints = 0;
        this.score = 0;
        this.waveNumber = 0;
        this.isWaveActive = false;
        this.isPaused = false;
        this.nextWaveCountdown = 0;
        this.gameSpeed = 1;

        // Battle items + aim modes are per-run state: cooldowns must not carry
        // over from the previous level/attempt, and abandoning mid-aim must not
        // start the next level stuck in targeting mode with a crosshair cursor.
        this.itemCooldowns = {};
        this.isTargetingItem = false;
        this.activeItemKey = null;
        this.isTargetingSkill = false;
        this.targetingHeroIndex = -1;
        this._cryoUntil = 0;
        if (this.canvas) this.canvas.style.cursor = "default";
        const qModal = document.getElementById("question-modal");
        if (qModal) qModal.style.display = "none";

        // Clear pools
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.heroes = [];
        this.summonedMinions = [];
        this.ideaBubbles = [];
        this.spawnQueue = [];
        this.particleSystem = new ParticleSystem();

        // Spawn default Hero based on Level, let users move them
        this.spawnDefaultHero(levelIndex);

        this.gameState = "playing";
        this.applyLevelUnlocks();
        this.updateSidebarUI();
        this.showInGameNotification(`Objective: Defend against Scientific Misconceptions!`);

        // Music: pick one of the 3 battle loops for this level; the update loop
        // swaps to the boss theme whenever a boss is on the field.
        this.battleTrack = `battle_${(levelIndex % 3) + 1}`;
        if (window.audioManager) window.audioManager.playMusic(this.battleTrack);
    }

    spawnDefaultHero(levelIndex) {
        // Cycle the hero roster across the 20 levels; later levels field two heroes.
        const roster = [EinsteinHero, CurieHero, NewtonHero, DarwinHero];
        const primary = roster[levelIndex % roster.length];
        this.heroes.push(new primary(150, 250));
        // From level 4 onward (and endless), give a second hero for the tougher waves.
        if (levelIndex >= 3) {
            const secondary = roster[(levelIndex + 2) % roster.length];
            this.heroes.push(new secondary(250, 300));
        }
        // Gap 2: heroes respawn at the defended base after dying.
        const rp = (this.level && this.level._basePoint) || { x: 150, y: 250 };
        this.heroes.forEach(h => { h.respawnPoint = rp; });
    }

    initEventListeners() {
        // Track Mouse
        this.canvas.addEventListener("mousemove", (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Scale mouse coordinates to match internal canvas width/height under any layout scaling
            this.mouseX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            this.mouseY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

            // Update hover flags for towers
            this.towers.forEach(t => {
                t.isHovered = Math.hypot(t.x - this.mouseX, t.y - this.mouseY) < 26;
            });
        });

        // Right-click cancels skill aiming (and never pops the browser menu on the board).
        this.canvas.addEventListener("contextmenu", (e) => {
            if (this.isTargetingSkill || this.isTargetingItem) { e.preventDefault(); this.cancelSkillTargeting(); }
        });

        // Keyboard shortcuts: 1–4 trigger each hero's ability (press → aim),
        // Esc cancels aiming. Ignored while typing in a quiz input.
        document.addEventListener("keydown", (e) => {
            if (this.gameState !== "playing" || this.isPaused) return;
            const tag = (e.target && e.target.tagName) || "";
            if (tag === "INPUT" || tag === "TEXTAREA") return;
            if (e.key === "Escape") { this.cancelSkillTargeting(); return; }
            const n = parseInt(e.key, 10);
            if (n >= 1 && n <= this.heroes.length) { e.preventDefault(); this.activateHeroAbility(n - 1); }
        });

        // Click actions
        this.canvas.addEventListener("click", (e) => {
            if (this.gameState !== "playing" || this.isPaused) return;

            const rect = this.canvas.getBoundingClientRect();
            // Scale click coordinates to match internal canvas coordinates
            const clickX = (e.clientX - rect.left) * (this.canvas.width / rect.width);
            const clickY = (e.clientY - rect.top) * (this.canvas.height / rect.height);

            console.log(`Canvas clicked at: ${Math.round(clickX)}, ${Math.round(clickY)}`);
            console.log(`Selected Tower Type: ${this.selectedTowerType}`);
            console.log(`Active Selected Hero: ${this.activeSelectedHero ? this.activeSelectedHero.name : 'None'}`);

            // 1. Check if clicking an Idea Bubble (floating questions)
            for (let i = 0; i < this.ideaBubbles.length; i++) {
                const b = this.ideaBubbles[i];
                if (Math.hypot(b.x - clickX, b.y - clickY) < b.radius) {
                    console.log("Clicked idea bubble!");
                    this.ideaBubbles.splice(i, 1);
                    this.triggerQuestionPopup();
                    return;
                }
            }

            // 1b. Deploying a targeted battle item (meteor / bomb / mercenaries)
            if (this.isTargetingItem && this.activeItemKey) {
                const key = this.activeItemKey;
                const cast = this.castBattleItem(key, clickX, clickY);
                this.isTargetingItem = false;
                this.activeItemKey = null;
                this.canvas.style.cursor = "default";
                if (cast) this.showInGameNotification(`${BATTLE_ITEMS_BY_KEY[key].name} deployed!`);
                return;
            }

            // 2. Check if in active skill targeting mode
            if (this.isTargetingSkill && this.activeSelectedHero) {
                console.log("Casting active skill!");
                const skillActivated = this.activeSelectedHero.useActiveSkill(
                    clickX, clickY, 
                    this.enemies, 
                    this.particleSystem, 
                    this.summonedMinions
                );
                
                if (skillActivated) {
                    this.isTargetingSkill = false;
                    this.targetingHeroIndex = -1;
                    this.canvas.style.cursor = "default";
                    this.showInGameNotification(`${this.activeSelectedHero.name} triggered active ability!`);
                    this.updateSidebarUI();
                } else {
                    this.particleSystem.addFloatingText(clickX, clickY, "On Cooldown!", "#ff2222", 12);
                }
                return;
            }

            // 3. Check if clicking a Hero to select (dead heroes can't be selected)
            let heroClicked = null;
            this.heroes.forEach(h => {
                if (!h.isDead && Math.hypot(h.x - clickX, h.y - clickY) < 28) { // selection tolerance
                    heroClicked = h;
                }
            });

            if (heroClicked) {
                console.log(`Selected Hero: ${heroClicked.name}`);
                if (this.activeSelectedHero) this.activeSelectedHero.isSelected = false;
                this.activeSelectedHero = heroClicked;
                heroClicked.isSelected = true;
                this.hideTowerUpgradeMenu(); // close any open tower menu + restore the ability bar
                this.updateSidebarUI();
                return;
            }

            // 4. Check if clicking an existing Tower
            let towerClicked = null;
            this.towers.forEach(t => {
                if (Math.hypot(t.x - clickX, t.y - clickY) < 30) { // selection tolerance
                    towerClicked = t;
                }
            });

            if (towerClicked) {
                console.log(`Clicked tower: ${towerClicked.name}`);
                this.selectedTowerForUpgrade = towerClicked;
                if (this.activeSelectedHero) {
                    this.activeSelectedHero.isSelected = false;
                    this.activeSelectedHero = null;
                }
                this.updateSidebarUI();
                this.showTowerUpgradeMenu(towerClicked);
                return;
            }

            // 5. Check if placing a Tower (Priority: place tower even if a hero is selected!)
            if (this.selectedTowerType) {
                console.log(`Placing tower: ${this.selectedTowerType}`);
                this.placeTower(clickX, clickY);
                return;
            }

            // 6. If hero selected, order them to move
            if (this.activeSelectedHero) {
                console.log(`Moving hero ${this.activeSelectedHero.name} to: ${Math.round(clickX)}, ${Math.round(clickY)}`);
                this.activeSelectedHero.moveTo(clickX, clickY);
                this.particleSystem.createShockwave(clickX, clickY, 15, "rgba(255,255,255,0.4)", 2, 1);
                return;
            }

            // Clicked empty ground: deselect all
            console.log("Clicked empty ground, deselecting all.");
            if (this.activeSelectedHero) this.activeSelectedHero.isSelected = false;
            this.activeSelectedHero = null;
            this.selectedTowerForUpgrade = null;
            this.updateSidebarUI();
            this.hideTowerUpgradeMenu();
        });
    }

    placeTower(clickX, clickY) {
        // Respect progressive unlocks.
        if (this.unlocks && !this.unlocks.towers.includes(this.selectedTowerType)) {
            this.particleSystem.addFloatingText(clickX, clickY, "Unlocks in a later level!", "#ff2222", 13);
            return;
        }
        // Cost map (data-driven with legacy fallback)
        const costs = window.TOWER_COSTS || { physics: 100, chemistry: 120, biology: 80, astronomy: 160 };
        const cost = costs[this.selectedTowerType];

        if (this.gold < cost) {
            this.particleSystem.addFloatingText(clickX, clickY, "Insufficient Gold!", "#ff2222", 13);
            return;
        }

        // Placement limit: at most MAX_PER_TYPE of any one tower type per map,
        // so a single dominant tower can't be spammed to cover everything.
        const sameType = this.towers.filter(t => t.type === this.selectedTowerType).length;
        if (sameType >= this.MAX_PER_TYPE) {
            this.particleSystem.addFloatingText(clickX, clickY, `Max ${this.MAX_PER_TYPE} ${this.selectedTowerType} towers!`, "#ff2222", 13);
            return;
        }

        // Realm Defense-style fixed pads: snap to the nearest free build spot.
        const pad = this.findFreePadNear(clickX, clickY, 45);
        if (!pad) {
            this.particleSystem.addFloatingText(clickX, clickY, "Build on a glowing pad!", "#ff2222", 13);
            return;
        }
        // Defensive: never allow a tower on the road (pads are pre-filtered too).
        if (this.isNearPath(pad.x, pad.y, this.PATH_CLEARANCE)) {
            this.particleSystem.addFloatingText(pad.x, pad.y, "Can't build on the path!", "#ff2222", 13);
            return;
        }

        const x = pad.x, y = pad.y;

        // Spawn Tower on the pad (registry-driven, legacy fallback)
        let tower;
        const TReg = window.TOWER_REGISTRY;
        if (TReg && TReg[this.selectedTowerType]) tower = new TReg[this.selectedTowerType](x, y);
        else if (this.selectedTowerType === "physics") tower = new PhysicsTower(x, y);
        else if (this.selectedTowerType === "chemistry") tower = new ChemistryTower(x, y);
        else if (this.selectedTowerType === "biology") tower = new BiologyTower(x, y);
        else if (this.selectedTowerType === "astronomy") tower = new AstronomyTower(x, y);

        if (!tower) return;
        tower.padRef = pad;
        pad.occupied = true;

        this.towers.push(tower);
        this.gold -= cost;
        this.recomputeStackPenalties();
        if (window.audioManager) window.audioManager.playSfx(`tower_${tower.type}_place`);

        this.particleSystem.createExplosion(x, y, tower.color, 12, 3);
        this.particleSystem.addFloatingText(x, y, `-${cost} Gold`, "#ffd700", 12);

        // Reset slot selection
        this.selectedTowerType = null;
        document.querySelectorAll(".shop-btn").forEach(b => b.classList.remove("active"));
        this.updateSidebarUI();
    }

    // Anti-stack: clustering copies of the same tower type gives diminishing
    // damage. Each same-type tower within 130px reduces this tower's output by
    // 18% (floored at 0.5×). Recomputed on every place/sell.
    recomputeStackPenalties() {
        this.towers.forEach(t => {
            let neighbors = 0;
            this.towers.forEach(o => {
                if (o !== t && o.type === t.type && Math.hypot(o.x - t.x, o.y - t.y) < 130) neighbors++;
            });
            t.stackPenalty = Math.max(0.5, 1 - 0.18 * neighbors);
        });
    }

    // Returns the nearest unoccupied build spot within maxDist, or null.
    findFreePadNear(x, y, maxDist) {
        if (!this.level || !this.level.buildSpots) return null;
        let best = null, bestD = maxDist;
        this.level.buildSpots.forEach(s => {
            if (s.occupied) return;
            const d = Math.hypot(s.x - x, s.y - y);
            if (d < bestD) { bestD = d; best = s; }
        });
        return best;
    }

    isNearPath(x, y, minDistance) {
        if (!this.level || !this.level.waypoints) return false;
        const wps = this.level.waypoints;

        for (let i = 0; i < wps.length - 1; i++) {
            const p1 = wps[i];
            const p2 = wps[i + 1];

            // Distance from point to line segment formula
            const A = x - p1.x;
            const B = y - p1.y;
            const C = p2.x - p1.x;
            const D = p2.y - p1.y;

            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;

            let xx, yy;

            if (param < 0) {
                xx = p1.x;
                yy = p1.y;
            } else if (param > 1) {
                xx = p2.x;
                yy = p2.y;
            } else {
                xx = p1.x + param * C;
                yy = p1.y + param * D;
            }

            const dist = Math.hypot(x - xx, y - yy);
            if (dist < minDistance) return true;
        }

        return false;
    }

    // Are there still un-started waves left (campaign)? Endless is always true.
    hasMoreWaves() {
        if (this.isEndless) return true;
        return this.waveNumber < this.level.waves.length;
    }

    // Button handler. Three cases:
    //   - Idle/between waves: start the next wave (countdown skip -> gold bonus).
    //   - Active wave with waves remaining: RUSH the next wave on top of the
    //     current one (Realm Defense-style overlap) for a flat gold bonus.
    //   - Active final wave: nothing to call.
    callOrStartWave() {
        if (this.gameState !== "playing") return;

        if (!this.isWaveActive) {
            if (this.nextWaveCountdown > 0) {
                const secLeft = Math.ceil(this.nextWaveCountdown / 60);
                const bonus = secLeft * this.EARLY_CALL_GOLD_PER_SEC;
                this.gold += bonus;
                this.particleSystem.addFloatingText(GAME_WIDTH / 2, 90, `Early Call! +${bonus}G`, "#ffd700", 18, 1.5);
            }
            this.startNextWave(false);
        } else if (this.hasMoreWaves()) {
            // Overlap rush: stack the next wave onto the current battle.
            const bonus = 50 + this.waveNumber * 6;
            this.gold += bonus;
            this.particleSystem.addFloatingText(GAME_WIDTH / 2, 90, `Wave Rushed! +${bonus}G`, "#ff8c00", 18, 1.5);
            this.startNextWave(true);
        }
    }

    // append=true stacks the new wave's spawns onto the current queue so two
    // waves can be on the field at once (used by the "rush" overlap call).
    startNextWave(append = false) {
        if (this.isWaveActive && !append) return;

        this.nextWaveCountdown = 0;

        // Heal heroes and summoned blockers at the start of each wave.
        this.heroes.forEach(h => { h.health = h.maxHealth; });
        this.summonedMinions.forEach(m => { m.health = m.maxHealth; });

        this.waveNumber++;
        this.isWaveActive = true;
        if (window.audioManager) window.audioManager.playSfx("wave_start");
        this.showInGameNotification(`Spawning Wave ${this.waveNumber}!`);

        // Create wave spawner queue
        let waveConfig;
        if (this.isEndless) {
            waveConfig = LevelManager.generateEndlessWave(this.waveNumber);
        } else {
            // Check if level has predefined waves
            if (this.waveNumber <= this.level.waves.length) {
                waveConfig = this.level.waves[this.waveNumber - 1];
            } else {
                // Predefined victory!
                this.triggerVictory();
                return;
            }
        }

        // Late-game wave-size ramp: more enemies per level past L3 (capped),
        // so later levels apply real pressure. Boss spawners are never
        // multiplied (so we never accidentally spawn extra bosses).
        const countMult = (!this.isEndless && this.level && this.level.id >= this.LATE_RAMP_START_ID)
            ? 1 + Math.min(this.LATE_COUNT_CAP, (this.level.id - (this.LATE_RAMP_START_ID - 1)) * this.LATE_COUNT_PER_LEVEL)
            : 1;

        // Fill spawnQueue (append when rushing so the current wave finishes spawning first)
        if (!append) this.spawnQueue = [];
        waveConfig.forEach(spawner => {
            const isBoss = typeof spawner.type === "string" && spawner.type.indexOf("boss_") === 0;
            const count = isBoss ? spawner.count : Math.round(spawner.count * countMult);
            for (let i = 0; i < count; i++) {
                this.spawnQueue.push({
                    type: spawner.type,
                    delay: spawner.delay
                });
            }
        });

        if (!append) this.spawnTimer = 0;
        this.updateSidebarUI();
    }

    spawnEnemy(type) {
        const wp = this.level.waypoints;
        if (wp.length === 0) return;

        let enemy;
        // Difficulty scales with BOTH the level reached AND the wave number, so
        // later waves within a level get tankier (fixes "tower solos everything").
        // Plus a capped late-game ramp from Level 4 onward (see constructor) to
        // keep pace with the player's expanding toolkit. Bosses ramp at half
        // rate since they're already crisis-tuned.
        const id = this.level ? this.level.id : 0;
        const isBossType = typeof type === "string" && type.indexOf("boss_") === 0;
        const lateHp = (!this.isEndless && id >= this.LATE_RAMP_START_ID)
            ? Math.min(this.LATE_HP_CAP, (id - (this.LATE_RAMP_START_ID - 1)) * this.LATE_HP_PER_LEVEL * (isBossType ? 0.5 : 1))
            : 0;
        const scale = this.isEndless
            ? 1.0 + (this.waveNumber * 0.14)
            : 1.0 + (this.level.id * 0.28) + ((this.waveNumber - 1) * 0.07) + lateHp;

        // Prefer the data-driven registry (all new enemies + bosses live here);
        // fall back to the original hardcoded set if the registry isn't loaded.
        const Reg = window.ENEMY_REGISTRY;
        if (Reg && Reg[type]) {
            enemy = new Reg[type](wp[0].x, wp[0].y, scale);
        } else if (type === "flatearth") enemy = new FlatEarthEnemy(wp[0].x, wp[0].y, scale);
        else if (type === "phlogiston") enemy = new PhlogistonEnemy(wp[0].x, wp[0].y, scale);
        else if (type === "spontaneous") enemy = new SpontaneousEnemy(wp[0].x, wp[0].y, scale);
        else if (type === "alchemy") enemy = new AlchemyEnemy(wp[0].x, wp[0].y, scale);
        else if (type === "perpetual") enemy = new PerpetualEnemy(wp[0].x, wp[0].y, scale);
        else if (type === "geocentric") enemy = new GeocentricEnemy(wp[0].x, wp[0].y, scale);
        else enemy = new FlatEarthEnemy(wp[0].x, wp[0].y, scale);

        enemy.bestiaryKey = type;
        enemy.setPath(wp);
        this.enemies.push(enemy);
        this.recordBestiaryEncounter(type);
    }

    // Request a screen shake; concurrent requests keep the strongest.
    addShake(mag, frames) {
        if (mag >= this.shakeMag || this.shakeFrames <= 0) {
            this.shakeMag = mag;
            this.shakeFrames = frames;
            this.shakeDuration = frames;
        }
    }

    update() {
        if (this.gameState !== "playing" || this.isPaused) return;

        if (this.shakeFrames > 0) this.shakeFrames--;

        // Battle-item cooldowns tick down (frame-based, so 2× speed scales it).
        for (const k in this.itemCooldowns) {
            if (this.itemCooldowns[k] > 0) this.itemCooldowns[k]--;
        }

        // Music: boss theme while a boss is on the field, else the level's
        // battle loop. playMusic is idempotent so calling each tick is cheap.
        if (window.audioManager) {
            const bossPresent = this.enemies.some(e => e.isBoss);
            window.audioManager.playMusic(bossPresent ? "boss" : (this.battleTrack || "battle_1"));
        }

        // 1. Spawner logic
        if (this.isWaveActive && this.spawnQueue.length > 0) {
            this.spawnTimer -= 1000 / 60; // assumptions 60 FPS
            if (this.spawnTimer <= 0) {
                const nextSpawn = this.spawnQueue.shift();
                this.spawnEnemy(nextSpawn.type);
                this.spawnTimer = nextSpawn.delay;
            }
        } else if (this.isWaveActive && this.enemies.length === 0) {
            // Wave Cleared!
            this.isWaveActive = false;
            this.gold += 100 + this.waveNumber * 10;
            this.researchPoints += Math.round(5 * this.rpMult); // Reward RP for finishing wave
            this.particleSystem.addFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, "WAVE CLEARED!", "#00ff66", 24, 2.0);

            // Check victory condition
            if (!this.isEndless && this.waveNumber >= this.level.waves.length) {
                this.triggerVictory();
            } else {
                // Start the between-wave countdown (Call Wave skips it for a bonus).
                this.nextWaveCountdown = this.WAVE_COUNTDOWN_FRAMES;
            }

            this.updateSidebarUI();
        }

        // Between-wave countdown: auto-starts the next wave when it elapses.
        if (!this.isWaveActive && this.nextWaveCountdown > 0) {
            this.nextWaveCountdown--;
            this.refreshWaveButton();
            if (this.nextWaveCountdown <= 0) {
                this.startNextWave();
            }
        }

        // 2. Flying question bubble spawning
        this.bubbleSpawnTimer--;
        if (this.bubbleSpawnTimer <= 0) {
            this.ideaBubbles.push({
                x: 100 + Math.random() * (GAME_WIDTH - 200),
                y: GAME_HEIGHT + 30,
                speedY: 0.6 + Math.random() * 0.8,
                radius: 18,
                glow: 0,
                color: `hsl(${180 + Math.random() * 80}, 90%, 65%)` // glowing science colors
            });
            // Rarer during active combat (reduces mid-wave cognitive load — the
            // between-wave "Solve to Rush" prompt is the primary quiz moment now);
            // more frequent during the calmer build / between-wave phases.
            this.bubbleSpawnTimer = (this.isWaveActive ? 900 : 420) + Math.random() * 300;
        }

        // Update floating bubbles
        this.ideaBubbles = this.ideaBubbles.filter(b => {
            b.y -= b.speedY;
            b.glow += 0.05;
            return b.y > -40; // remove when offscreen
        });

        // 3. Update Heroes
        this.heroes.forEach(h => {
            h.update(this.enemies, this.particleSystem);
        });

        // 4. Update Blocker Minions
        this.summonedMinions = this.summonedMinions.filter(m => {
            return m.update(this.enemies, this.particleSystem);
        });

        // 5. Update Towers
        this.towers.forEach(t => {
            t.update(this.enemies, this.projectiles, this.particleSystem);
        });

        // 6. Update Projectiles
        this.projectiles = this.projectiles.filter(p => {
            return p.update(this.enemies, this.particleSystem);
        });

        // 7. Update Enemies
        // Enemies spawned by deaths (e.g. Spontaneous Generation maggots) must
        // NOT be pushed into the array while filter() iterates it — appended
        // elements are never visited, so they'd be silently dropped when the
        // filtered array is assigned back. Collect them and append afterwards.
        const bornThisFrame = [];
        this.enemies = this.enemies.filter(e => {
            const alive = e.update(this.particleSystem, this.enemies);
            
            if (e.reachedEnd) {
                // Leak pressure: a boss breaking through is a crisis, not a -1.
                const loss = e.isFinalBoss ? 20 : (e.isBoss ? 10 : 1);
                this.lives -= loss;
                this.particleSystem.addFloatingText(e.x, e.y, `-${loss} Lives`, "#ff2222", loss > 1 ? 20 : 16);
                this.particleSystem.createExplosion(e.x, e.y, "#ff2222", 10, 2);
                // The base takes the hit: flash + impact burst + screen shake.
                this.baseHitAt = performance.now();
                this.addShake(loss > 1 ? 9 : 4, loss > 1 ? 26 : 14);
                if (window.audioManager) window.audioManager.playSfx("base_hit");
                const bp = this.level && this.level._basePoint;
                if (bp) this.particleSystem.createExplosion(bp.x, bp.y, "#ff5522", 14, 3);
                this.updateSidebarUI();

                if (this.lives <= 0) {
                    this.triggerDefeat();
                }
            } 
            else if (e.isDead) {
                if (window.audioManager) window.audioManager.playSfx(`enemy_${e.spriteKey}_death`);
                if (e.isBoss) this.addShake(8, 24); // boss kills land with weight
                // Earn gold and RP
                this.gold += e.goldReward;
                this.researchPoints += Math.round(e.rpReward * this.rpMult);
                this.score += e.goldReward * 2;
                
                this.particleSystem.addFloatingText(e.x, e.y, `+${e.goldReward}G`, "#ffd700", 12);
                this.particleSystem.addFloatingText(e.x, e.y - 12, `+${e.rpReward}RP`, "#00ffff", 11);
                this.particleSystem.createExplosion(e.x, e.y, e.color, 8, 2.5);

                // Gap 2: nearby living heroes earn XP from the kill (scaled by
                // the enemy's value), driving in-level leveling.
                const xpGain = 8 + Math.round((e.goldReward || 0) * 0.5);
                this.heroes.forEach(h => {
                    if (!h.isDead && Math.hypot(h.x - e.x, h.y - e.y) < (h.range + 40)) {
                        h.addXp(xpGain, this.particleSystem);
                    }
                });

                // Natural Selection adaptation trigger for Charles Darwin
                this.heroes.forEach(h => {
                    if (h instanceof DarwinHero && Math.hypot(h.x - e.x, h.y - e.y) < 125) {
                        h.gainAdaptationStack(this.particleSystem);
                    }
                });

                // Spontaneous Generation splitting mechanic
                if (e instanceof SpontaneousEnemy && !e.isSubSpawn) {
                    // Spawn 2 maggots nearby heading to same next waypoint
                    for (let i = 0; i < 2; i++) {
                        const maggot = new SpontaneousEnemy(e.x + (i*10 - 5), e.y + (i*10 - 5), e.levelScale, true);
                        maggot.waypoints = e.waypoints;
                        maggot.currentWaypointIndex = e.currentWaypointIndex;
                        bornThisFrame.push(maggot);
                    }
                }

                this.updateSidebarUI();
            }

            return alive;
        });
        if (bornThisFrame.length) this.enemies.push(...bornThisFrame);

        // 8. Update Particles
        this.particleSystem.update();
    }

    draw() {
        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Enable smoothing for polished anti-aliased 2D cartoon vectors
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.mozImageSmoothingEnabled = true;
        this.ctx.webkitImageSmoothingEnabled = true;
        this.ctx.msImageSmoothingEnabled = true;

        if (this.gameState === "playing") {
            // Screen shake: jitter the whole scene; decays linearly. The
            // background is drawn slightly oversized while shaking so canvas
            // edges never show through.
            const shaking = this.shakeFrames > 0 && this.shakeMag > 0;
            let shakePad = 0;
            if (shaking) {
                const k = this.shakeFrames / this.shakeDuration;
                const mag = this.shakeMag * k;
                shakePad = Math.ceil(this.shakeMag) + 2;
                this.ctx.save();
                this.ctx.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
            }

            // Draw background biome texture. Prefer the painted per-level terrain
            // image (assets/levels/<theme>.png); if it isn't present yet, fall back
            // to the procedural bgColor wash + vector scenery so partial art is safe.
            const bgImg = window.spriteAssets ? window.spriteAssets[`bg_level_${this.level.id}`] : null;
            if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
                this.ctx.drawImage(bgImg, -shakePad, -shakePad, GAME_WIDTH + shakePad * 2, GAME_HEIGHT + shakePad * 2);
            } else {
                this.ctx.fillStyle = this.level.bgColor;
                this.ctx.fillRect(-shakePad, -shakePad, GAME_WIDTH + shakePad * 2, GAME_HEIGHT + shakePad * 2);
                // Draw level scenery background layers
                LevelManager.drawScenery(this.ctx, this.level);
            }

            // Draw Road paths
            LevelManager.drawPath(this.ctx, this.level.waypoints, this.level.pathColor, this.level.accentColor);

            // Spawn portal (enemies emerge) + defended base (path end). Drawn on
            // top of the road so it reads as the source/destination; enemies draw
            // over them so they appear to pour out / batter the base.
            if (this.level._spawnPoint) {
                LevelManager.drawSpawnPortal(this.ctx, this.level._spawnPoint);
            }
            if (this.level._basePoint) {
                const ratio = Math.max(0, this.lives / (this.maxLives || 1));
                const flash = Math.max(0, 1 - (performance.now() - (this.baseHitAt || 0)) / 320);
                LevelManager.drawBase(this.ctx, this.level._basePoint, ratio, this.level.accentColor, flash);
            }

            // Draw build pads. A dark backing disc keeps them readable over the
            // painted level backgrounds; brighter green ring while placing.
            if (this.level.buildSpots) {
                const active = !!this.selectedTowerType;
                const r = 20;
                this.level.buildSpots.forEach(s => {
                    if (s.occupied) return;
                    this.ctx.save();
                    // dark contrast backing
                    this.ctx.fillStyle = active ? "rgba(0,40,20,0.45)" : "rgba(0,0,0,0.38)";
                    this.ctx.beginPath();
                    this.ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
                    this.ctx.fill();
                    // dashed ring
                    this.ctx.strokeStyle = active ? "rgba(60,255,150,0.95)" : "rgba(255,255,255,0.5)";
                    this.ctx.lineWidth = active ? 3 : 2;
                    this.ctx.setLineDash([5, 4]);
                    this.ctx.beginPath();
                    this.ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
                    this.ctx.stroke();
                    // centre marker (small plus) so empty pads read as buildable
                    this.ctx.setLineDash([]);
                    this.ctx.strokeStyle = active ? "rgba(120,255,190,0.9)" : "rgba(255,255,255,0.6)";
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(s.x - 5, s.y); this.ctx.lineTo(s.x + 5, s.y);
                    this.ctx.moveTo(s.x, s.y - 5); this.ctx.lineTo(s.x, s.y + 5);
                    this.ctx.stroke();
                    this.ctx.restore();
                });
            }

            // Draw Blocker Minions
            this.summonedMinions.forEach(m => m.draw(this.ctx));

            // Draw Towers
            this.towers.forEach(t => t.draw(this.ctx));

            // Draw Heroes
            this.heroes.forEach(h => h.draw(this.ctx));

            // Draw Enemies
            this.enemies.forEach(e => e.draw(this.ctx));

            // Draw Projectiles
            this.projectiles.forEach(p => p.draw(this.ctx));

            // Draw Particles & Lines
            this.particleSystem.draw(this.ctx);

            // Keep the hero ability bar's cooldown/revive sweep smooth.
            this.renderHeroAbilityBar();
            this.renderBattleItems();

            // Cryo Field freeze overlay — frosty vignette while active.
            // (Gradient is screen-static, so build it once and reuse.)
            if (performance.now() < this._cryoUntil) {
                if (!this._cryoGrad) {
                    const g = this.ctx.createRadialGradient(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_HEIGHT*0.25, GAME_WIDTH/2, GAME_HEIGHT/2, GAME_HEIGHT*0.75);
                    g.addColorStop(0, "rgba(150,225,255,0.04)");
                    g.addColorStop(1, "rgba(120,210,255,0.28)");
                    this._cryoGrad = g;
                }
                this.ctx.save();
                this.ctx.fillStyle = this._cryoGrad;
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                this.ctx.restore();
            }

            // Boss health bar (top-center) when a boss is on the field.
            const boss = this.enemies.find(e => e.isBoss);
            if (boss) {
                const bw = 320, bh = 16, bx = (GAME_WIDTH - bw) / 2, by = 14;
                const ratio = Math.max(0, boss.health / boss.maxHealth);
                this.ctx.save();
                this.ctx.fillStyle = "rgba(0,0,0,0.6)";
                this.ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
                this.ctx.fillStyle = "#3a0d14";
                this.ctx.fillRect(bx, by, bw, bh);
                if (!this._bossBarGrad) { // bar geometry is fixed — build once
                    const grad = this.ctx.createLinearGradient(bx, 0, bx + bw, 0);
                    grad.addColorStop(0, "#ff3b5c");
                    grad.addColorStop(1, "#ff8c42");
                    this._bossBarGrad = grad;
                }
                this.ctx.fillStyle = this._bossBarGrad;
                this.ctx.fillRect(bx, by, bw * ratio, bh);
                this.ctx.fillStyle = "#fff";
                this.ctx.font = "bold 12px 'Nunito', sans-serif";
                this.ctx.textAlign = "center";
                this.ctx.fillText(`${boss.name}  ${Math.ceil(boss.health)}/${Math.ceil(boss.maxHealth)}`, GAME_WIDTH / 2, by + 12);
                this.ctx.restore();
            }

            // Draw Floating Idea Bubbles
            this.ideaBubbles.forEach(b => {
                this.ctx.save();
                this.ctx.shadowBlur = 12 + Math.sin(b.glow) * 4;
                this.ctx.shadowColor = b.color;
                this.ctx.fillStyle = "rgba(0,0,0,0.65)";
                this.ctx.strokeStyle = b.color;
                this.ctx.lineWidth = 2.5;

                // circle
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();

                // drawing little lightbulb or atom symbol in center
                this.ctx.fillStyle = b.color;
                this.ctx.font = "bold 20px 'VT323', monospace";
                this.ctx.textAlign = "center";
                this.ctx.fillText("💡", b.x, b.y + 6);

                this.ctx.restore();
            });

            // Draw ghost tower placing feedback (snaps to the nearest free pad)
            if (this.selectedTowerType) {
                const ranges = window.TOWER_BASE_RANGE || { physics: 135, chemistry: 160, biology: 120, astronomy: 150 };
                const range = ranges[this.selectedTowerType] || 140;
                const colors = window.TOWER_COLORS || { physics: "#00ffff", chemistry: "#ff6600", biology: "#00ff66", astronomy: "#bf55ec" };

                const pad = this.findFreePadNear(this.mouseX, this.mouseY, 45);
                const tx = pad ? pad.x : this.mouseX;
                const ty = pad ? pad.y : this.mouseY;
                const ok = !!pad;

                // Range indicator
                this.ctx.fillStyle = ok ? "rgba(0, 255, 150, 0.06)" : "rgba(255, 0, 0, 0.05)";
                this.ctx.beginPath();
                this.ctx.arc(tx, ty, range, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.strokeStyle = ok ? "rgba(0, 255, 150, 0.5)" : "rgba(255, 0, 0, 0.4)";
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.arc(tx, ty, range, 0, Math.PI * 2);
                this.ctx.stroke();

                // Tower template box
                this.ctx.fillStyle = colors[this.selectedTowerType] + (ok ? "cc" : "55");
                this.ctx.fillRect(tx - 12, ty - 12, 24, 24);
            }

            // Skill-aim overlay — unmistakable feedback that the game is waiting
            // for a target click (hero abilities previously only changed the cursor).
            if (this.isTargetingSkill && this.activeSelectedHero) {
                const hero = this.activeSelectedHero;
                const ax = this.mouseX, ay = this.mouseY;
                const r = hero.skillRadius || 110;
                const t = performance.now() / 1000;
                const pulse = 0.5 + 0.5 * Math.sin(t * 6);
                this.ctx.save();

                // dim the field so the reticle reads clearly
                this.ctx.fillStyle = "rgba(4,2,12,0.22)";
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

                // dashed line from the casting hero to the aim point
                this.ctx.globalAlpha = 0.4;
                this.ctx.strokeStyle = hero.color;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([4, 6]);
                this.ctx.beginPath();
                this.ctx.moveTo(hero.x, hero.y); this.ctx.lineTo(ax, ay);
                this.ctx.stroke();
                this.ctx.setLineDash([]);

                // AoE area-of-effect preview at the cursor
                this.ctx.globalAlpha = 0.13 + 0.07 * pulse;
                this.ctx.fillStyle = hero.color;
                this.ctx.beginPath();
                this.ctx.arc(ax, ay, r, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 0.85;
                this.ctx.lineWidth = 2.5;
                this.ctx.setLineDash([10, 7]);
                this.ctx.lineDashOffset = -((t * 40) % 17);
                this.ctx.beginPath();
                this.ctx.arc(ax, ay, r, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);

                // crosshair reticle
                this.ctx.globalAlpha = 1;
                this.ctx.lineWidth = 2;
                const c = 14 + 3 * pulse;
                this.ctx.beginPath();
                this.ctx.moveTo(ax - c, ay); this.ctx.lineTo(ax + c, ay);
                this.ctx.moveTo(ax, ay - c); this.ctx.lineTo(ax, ay + c);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(ax, ay, 5, 0, Math.PI * 2);
                this.ctx.stroke();

                // instruction banner (top-centre, below any boss bar)
                const label = `🎯 ${hero.name}: ${hero.skillName} — click to cast · Esc to cancel`;
                this.ctx.font = "bold 14px 'Nunito', sans-serif";
                this.ctx.textAlign = "center";
                const tw = this.ctx.measureText(label).width;
                const bx = GAME_WIDTH / 2, by = 44;
                this.ctx.fillStyle = "rgba(0,0,0,0.72)";
                this.ctx.fillRect(bx - tw / 2 - 14, by - 16, tw + 28, 26);
                this.ctx.strokeStyle = hero.color;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(bx - tw / 2 - 14, by - 16, tw + 28, 26);
                this.ctx.fillStyle = "#fff";
                this.ctx.fillText(label, bx, by + 2);
                this.ctx.restore();
            }

            // Battle-item aim overlay (meteor / bomb / mercenaries).
            if (this.isTargetingItem && this.activeItemKey) {
                const def = BATTLE_ITEMS_BY_KEY[this.activeItemKey];
                const ax = this.mouseX, ay = this.mouseY;
                const r = def.radius || 48;
                const t = performance.now() / 1000;
                const pulse = 0.5 + 0.5 * Math.sin(t * 6);
                this.ctx.save();
                this.ctx.fillStyle = "rgba(4,2,12,0.22)";
                this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

                // AoE / placement ring at the cursor
                this.ctx.globalAlpha = 0.13 + 0.07 * pulse;
                this.ctx.fillStyle = def.color;
                this.ctx.beginPath();
                this.ctx.arc(ax, ay, r, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.globalAlpha = 0.9;
                this.ctx.strokeStyle = def.color;
                this.ctx.lineWidth = 2.5;
                this.ctx.setLineDash([10, 7]);
                this.ctx.lineDashOffset = -((t * 40) % 17);
                this.ctx.beginPath();
                this.ctx.arc(ax, ay, r, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);

                // icon at the cursor
                this.ctx.globalAlpha = 1;
                this.ctx.font = "22px 'Nunito', sans-serif";
                this.ctx.textAlign = "center";
                this.ctx.fillText(def.icon, ax, ay + 8);

                // banner
                const label = `${def.icon} ${def.name} — click to deploy · Esc to cancel`;
                this.ctx.font = "bold 14px 'Nunito', sans-serif";
                const tw = this.ctx.measureText(label).width;
                const bx = GAME_WIDTH / 2, by = 44;
                this.ctx.fillStyle = "rgba(0,0,0,0.72)";
                this.ctx.fillRect(bx - tw / 2 - 14, by - 16, tw + 28, 26);
                this.ctx.strokeStyle = def.color;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(bx - tw / 2 - 14, by - 16, tw + 28, 26);
                this.ctx.fillStyle = "#fff";
                this.ctx.fillText(label, bx, by + 2);
                this.ctx.restore();
            }

            if (shaking) this.ctx.restore();
        }
    }

    startGameLoop() {
        const loop = () => {
            // Fast-forward runs the fixed-step simulation N times per frame.
            // All in-game timers are frame-based, so this scales time exactly.
            const steps = (this.gameState === "playing" && !this.isPaused) ? this.gameSpeed : 1;
            for (let i = 0; i < steps; i++) this.update();
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    // HTML DOM UI updates
    updateSidebarUI() {
        document.getElementById("ui-gold").textContent = this.gold;
        document.getElementById("ui-lives").textContent = this.lives;
        document.getElementById("ui-rp").textContent = this.researchPoints;
        document.getElementById("ui-wave").textContent = this.isEndless ? `${this.waveNumber} (Endless)` : `${this.waveNumber}/${this.level ? this.level.waves.length : 5}`;

        // Update wave start / call-wave button text
        this.refreshWaveButton();

        // Render Scientist Hero skill triggers on HUD
        const container = document.getElementById("hud-hero-skills");
        container.innerHTML = "";
        
        this.heroes.forEach((h, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = `hero-card ${h.isSelected ? "selected" : ""}`;
            
            // HP ratio
            const hpRatio = h.health / h.maxHealth;
            const cdRatio = h.skillCooldownTimer / h.skillCooldownMax;
            const xpRatio = h.level >= h.maxLevel ? 1 : Math.max(0, Math.min(1, h.xp / h.xpNeeded));
            const lvlBadge = `<span style="color:#c9b6ff; font-size:10px;">Lv${h.level}</span>`;

            // Slim info-only card (the active-skill button now lives in the
            // bottom-centre ability bar). Clicking the card selects the hero.
            wrapper.innerHTML = `
                <div class="hero-name">${h.name} ${lvlBadge} <span class="hp-txt">${h.isDead ? "DOWN" : Math.round(h.health) + "HP"}</span></div>
                <div class="hp-bar"><div class="hp-fill" style="width:${(h.isDead ? 0 : hpRatio*100)}%"></div></div>
                <div class="hp-bar" style="height:3px; margin-top:2px;"><div class="hp-fill" style="width:${xpRatio*100}%; background:linear-gradient(90deg,#8e44ad,#aa5aff);"></div></div>
            `;

            wrapper.addEventListener("click", () => {
                if (h.isDead) return;
                if (this.activeSelectedHero) this.activeSelectedHero.isSelected = false;
                this.activeSelectedHero = h;
                h.isSelected = true;
                this.selectedTowerForUpgrade = null;
                this.updateSidebarUI();
            });

            container.appendChild(wrapper);
        });

        // Keep the bottom-centre ability bar in sync.
        this.renderHeroAbilityBar();
    }

    // Bottom-centre hero ability bar: one button per hero for their active
    // skill, with a cooldown / revive sweep. Built once per roster size; dynamic
    // bits refresh every call (and every frame from the render loop).
    // Select a hero and immediately enter aim mode for their active skill.
    // Shared by the ability-bar buttons and the 1–4 keyboard shortcuts so the
    // flow is one action: press → aim → click to cast.
    activateHeroAbility(index) {
        const hero = this.heroes[index];
        if (!hero || hero.isDead) return;
        if (this.activeSelectedHero) this.activeSelectedHero.isSelected = false;
        this.activeSelectedHero = hero;
        hero.isSelected = true;
        this.selectedTowerForUpgrade = null;
        this.hideTowerUpgradeMenu();
        if (hero.skillCooldownTimer <= 0) {
            this.isTargetingSkill = true;
            this.targetingHeroIndex = index;
            this.canvas.style.cursor = "crosshair";
            this.showInGameNotification(`🎯 Aiming ${hero.skillName} — click the battlefield to cast (Esc to cancel)`);
        } else {
            this.showInGameNotification(`${hero.name}'s ${hero.skillName} is recharging (${Math.ceil(hero.skillCooldownTimer / 60)}s)`);
        }
        this.updateSidebarUI();
    }

    // Leave skill-aim mode without casting (Esc / right-click / clicking the bar again).
    cancelSkillTargeting() {
        if (this.isTargetingItem) {
            this.isTargetingItem = false;
            this.activeItemKey = null;
            this.canvas.style.cursor = "default";
            this.showInGameNotification("Item aim cancelled.");
            return;
        }
        if (!this.isTargetingSkill) return;
        this.isTargetingSkill = false;
        this.targetingHeroIndex = -1;
        this.canvas.style.cursor = "default";
        this.showInGameNotification("Ability aim cancelled.");
    }

    // ---- Battle items (RP consumables) -----------------------------------
    // Clicking an item button: instant items fire now; targeted items enter
    // aim mode (reusing the same overlay/click-to-cast flow as hero skills).
    selectBattleItem(key) {
        if (this.gameState !== "playing") return;
        const def = BATTLE_ITEMS_BY_KEY[key];
        if (!def) return;
        if ((this.itemCooldowns[key] || 0) > 0) {
            this.showInGameNotification(`${def.name} is recharging (${Math.ceil(this.itemCooldowns[key] / 60)}s)`);
            return;
        }
        if (this.researchPoints < def.cost) {
            this.showInGameNotification(`Need ${def.cost} RP for ${def.name} — answer revision questions to earn RP!`);
            return;
        }
        if (def.targeted) {
            // enter aim mode (cancel any hero aim / tower menu first)
            this.isTargetingSkill = false;
            this.targetingHeroIndex = -1;
            this.hideTowerUpgradeMenu();
            this.isTargetingItem = true;
            this.activeItemKey = key;
            this.canvas.style.cursor = "crosshair";
            this.showInGameNotification(`🎯 ${def.icon} ${def.name} — click the battlefield to deploy (Esc to cancel)`);
        } else {
            this.castBattleItem(key, 0, 0);
        }
    }

    castBattleItem(key, x, y) {
        const def = BATTLE_ITEMS_BY_KEY[key];
        if (!def) return false;
        if ((this.itemCooldowns[key] || 0) > 0 || this.researchPoints < def.cost) return false;

        this.researchPoints -= def.cost;
        this.itemCooldowns[key] = def.cooldownSec * 60;
        const ps = this.particleSystem;

        if (key === "cryo") {
            // Freeze every enemy on screen; towers keep firing.
            this._cryoUntil = performance.now() + def.freezeSec * 1000;
            this.enemies.forEach(e => { if (!e.isDead && e.applySlow) e.applySlow(0.04, def.freezeSec); });
            if (ps) {
                this.enemies.forEach(e => ps.createExplosion(e.x, e.y, "#bff4ff", 6, 2));
                ps.addFloatingText(GAME_WIDTH / 2, 80, "❄️ CRYO FIELD!", def.color, 20, 1.6);
            }
            if (window.audioManager) window.audioManager.playSfx("hero_curie_skill");
        } else if (key === "meteor" || key === "bomb") {
            this.addShake(key === "meteor" ? 8 : 4, key === "meteor" ? 22 : 12);
            if (ps) {
                ps.createExplosion(x, y, def.color, key === "meteor" ? 40 : 22, key === "meteor" ? 6 : 4);
                ps.createShockwave(x, y, def.radius, def.color, 6, 3);
                ps.addFloatingText(x, y - 20, def.icon + " " + def.name + "!", def.color, 16, 1.4);
            }
            this.enemies.forEach(e => {
                if (e.isDead) return;
                if (Math.hypot(e.x - x, e.y - y) <= def.radius) e.takeDamage(def.damage, "true");
            });
            if (window.audioManager) window.audioManager.playSfx("base_hit");
        } else if (key === "merc") {
            const spread = 26;
            for (let i = 0; i < (def.mercs || 2); i++) {
                const mx = x + (i === 0 ? -spread : spread);
                const m = new SummonedMinion(mx, y, def.mercHp, def.mercDmg, 22, def.mercSec, "Mercenary", def.color);
                this.summonedMinions.push(m);
            }
            if (ps) {
                ps.createShockwave(x, y, 50, def.color, 3, 2);
                ps.addFloatingText(x, y - 20, "🗡️ MERCENARIES!", def.color, 15, 1.4);
            }
            if (window.audioManager) window.audioManager.playSfx("tower_barracks_place");
        }

        this.updateSidebarUI();
        return true;
    }

    // Build the item buttons once; refresh affordability/cooldown every frame.
    renderBattleItems() {
        const bar = document.getElementById("battle-items");
        if (!bar) return;
        if (!this._itemBarBuilt || bar.childElementCount !== BATTLE_ITEMS.length) {
            bar.innerHTML = "";
            BATTLE_ITEMS.forEach(def => {
                const btn = document.createElement("button");
                btn.className = "item-btn";
                btn.id = `item-btn-${def.key}`;
                btn.title = def.desc;
                btn.innerHTML = `<span class="item-cd"></span><span class="item-icon">${def.icon}</span><span class="item-name">${def.name}</span><span class="item-cost">${def.cost} RP</span>`;
                btn.addEventListener("click", (e) => { e.stopPropagation(); this.selectBattleItem(def.key); });
                bar.appendChild(btn);
            });
            this._itemBarBuilt = true;
        }
        BATTLE_ITEMS.forEach(def => {
            const btn = document.getElementById(`item-btn-${def.key}`);
            if (!btn) return;
            const cd = this.itemCooldowns[def.key] || 0;
            const affordable = this.researchPoints >= def.cost;
            const ready = cd <= 0 && affordable;
            btn.disabled = !ready;
            btn.classList.toggle("armed", this.isTargetingItem && this.activeItemKey === def.key);
            btn.classList.toggle("unaffordable", cd <= 0 && !affordable);
            const cdEl = btn.querySelector(".item-cd");
            if (cdEl) cdEl.style.height = cd > 0 ? `${(cd / (def.cooldownSec * 60)) * 100}%` : "0%";
        });
    }

    renderHeroAbilityBar() {
        const bar = document.getElementById("hero-ability-bar");
        if (!bar) return;

        // Single source of truth (runs every frame): the ability bar steps aside
        // ONLY while a tower upgrade menu is open. Reconciling here means the bar
        // can never get stuck hidden — the moment the tower is deselected (hero
        // click, empty-ground click, sell, auto-hide) it reappears.
        bar.style.display = this.selectedTowerForUpgrade ? "none" : "flex";

        if (bar.childElementCount !== this.heroes.length) {
            bar.innerHTML = "";
            this.heroes.forEach((h, index) => {
                const btn = document.createElement("button");
                btn.className = "ability-btn";
                btn.id = `ability-btn-${index}`;
                btn.innerHTML = `<span class="ability-cd"></span><span class="ability-name"></span><span class="ability-skill"></span><span class="ability-status"></span>`;
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.activateHeroAbility(index);
                });
                bar.appendChild(btn);
            });
        }

        this.heroes.forEach((h, index) => {
            const btn = document.getElementById(`ability-btn-${index}`);
            if (!btn) return;
            const ready = !h.isDead && h.skillCooldownTimer <= 0;
            btn.disabled = !ready;
            btn.classList.toggle("selected", !!h.isSelected);
            btn.classList.toggle("dead", !!h.isDead);
            btn.classList.toggle("ready", ready);
            btn.querySelector(".ability-name").textContent = h.name;
            btn.querySelector(".ability-skill").textContent = h.skillName;
            const cd = btn.querySelector(".ability-cd");
            const status = btn.querySelector(".ability-status");
            if (h.isDead) {
                cd.style.height = "100%";
                status.textContent = `Reviving ${Math.ceil(h.respawnTimer / 60)}s`;
            } else if (h.skillCooldownTimer > 0) {
                cd.style.height = `${(h.skillCooldownTimer / h.skillCooldownMax) * 100}%`;
                status.textContent = `${Math.ceil(h.skillCooldownTimer / 60)}s`;
            } else {
                cd.style.height = "0%";
                status.textContent = "READY";
            }
        });
    }

    // Render the permanent-upgrade (Lab Bench) screen.
    renderMetaScreen() {
        const avail = this.availableStars();
        const availEl = document.getElementById("meta-stars-avail");
        const totalEl = document.getElementById("meta-stars-total");
        if (availEl) availEl.textContent = avail;
        if (totalEl) totalEl.textContent = this.totalEarnedStars();

        const list = document.getElementById("meta-list");
        if (!list) return;
        list.innerHTML = "";
        META_DEFS.forEach(d => {
            const rank = this.meta[d.key];
            const maxed = rank >= d.max;
            const canBuy = !maxed && avail >= META_COST_PER_RANK;
            const pips = "●".repeat(rank) + "○".repeat(d.max - rank);
            const row = document.createElement("div");
            row.className = "meta-row";
            row.innerHTML = `
                <div class="meta-info">
                    <div class="meta-label">${d.label} <span class="meta-pips">${pips}</span></div>
                    <div class="meta-desc">${d.desc}</div>
                </div>
                <button class="meta-buy" data-key="${d.key}" ${canBuy ? "" : "disabled"}>
                    ${maxed ? "MAX" : `Buy (${META_COST_PER_RANK}★)`}
                </button>
            `;
            list.appendChild(row);
        });
        list.querySelectorAll(".meta-buy").forEach(btn => {
            btn.addEventListener("click", () => {
                if (this.buyMetaUpgrade(btn.dataset.key)) this.renderMetaScreen();
            });
        });
    }

    // Build the level-select cards dynamically from LEVEL_DATA (20 levels).
    renderLevelCards() {
        const container = document.getElementById("level-select-container");
        if (!container || !window.LEVEL_DATA) return;
        container.innerHTML = "";
        const bossTag = { 4: "👑 Mini-Boss", 9: "👑 Mini-Boss", 14: "👑👑 Twin Mini-Bosses", 19: "💀 FINAL BOSS" };
        const starsFor = (idx) => this.levelStars[(window.LEVEL_DATA[idx].id != null ? window.LEVEL_DATA[idx].id : idx)] || 0;
        window.LEVEL_DATA.forEach((lv, idx) => {
            const stars = starsFor(idx);
            const starStr = "★".repeat(stars) + "☆".repeat(3 - stars);
            const boss = bossTag[idx];
            const diff = idx < 5 ? "Easy" : idx < 10 ? "Moderate" : idx < 15 ? "Hard" : "Extreme";
            const title = String(lv.name || `Level ${idx + 1}`).replace(/^level\s*\d+\s*[:\-]?\s*/i, "");
            // A level unlocks once the previous one has been beaten (≥1 star).
            const unlocked = idx === 0 || starsFor(idx - 1) >= 1;
            const card = document.createElement("div");
            card.className = "level-card" + (boss ? " boss-level" : "") + (unlocked ? "" : " locked-level");
            if (unlocked) {
                card.addEventListener("click", () => launchLevel(idx, false));
                card.innerHTML = `
                    <h3>Level ${idx + 1}: ${title}</h3>
                    ${boss ? `<div class="boss-tag">${boss}</div>` : `<p style="font-size:12px; color:#9aa4b2; margin:4px 0 0;">Defend against scientific misconceptions.</p>`}
                    <div class="card-footer">
                        <span style="font-size:12px; color:#bdc3c7;">${diff} <span class="card-stars" style="color:#ffd700; letter-spacing:2px;">${starStr}</span></span>
                        <button class="btn-start">DEPLOY</button>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <h3>🔒 Level ${idx + 1}</h3>
                    <p style="font-size:12px; color:#9aa4b2; margin:4px 0 0;">Beat Level ${idx} to unlock.</p>
                    <div class="card-footer">
                        <span style="font-size:12px; color:#bdc3c7;">${diff}</span>
                        <button class="btn-start" disabled>LOCKED</button>
                    </div>
                `;
            }
            container.appendChild(card);
        });
    }

    // Legacy: refresh just the star badges (kept for safety).
    renderLevelStars() {
        this.renderLevelCards();
    }

    // Lightweight per-frame refresh of the wave button label (countdown ticks).
    refreshWaveButton() {
        const wBtn = document.getElementById("start-wave-btn");
        if (!wBtn) return;
        if (this.isWaveActive) {
            if (this.hasMoreWaves()) {
                const bonus = 50 + this.waveNumber * 6;
                wBtn.disabled = false;
                wBtn.textContent = `⚡ Rush Next Wave (+${bonus}G)`;
            } else {
                wBtn.disabled = true;
                wBtn.textContent = "Final Wave — Defend!";
            }
        } else if (this.nextWaveCountdown > 0) {
            const secLeft = Math.ceil(this.nextWaveCountdown / 60);
            const bonus = secLeft * this.EARLY_CALL_GOLD_PER_SEC;
            wBtn.disabled = false;
            wBtn.textContent = `Call Wave (${secLeft}s · +${bonus}G)`;
        } else {
            wBtn.disabled = false;
            wBtn.textContent = this.waveNumber === 0 ? "Start First Wave" : "Start Next Wave";
        }

        // Speed button reflects current fast-forward state.
        const sBtn = document.getElementById("speed-btn");
        if (sBtn) sBtn.textContent = this.gameSpeed === 2 ? "▶▶ 2×" : "▶ 1×";

        // "Solve to Rush" only makes sense during the between-wave countdown.
        const rBtn = document.getElementById("solve-rush-btn");
        if (rBtn) rBtn.style.display = (!this.isWaveActive && this.nextWaveCountdown > 0) ? "block" : "none";
    }

    toggleGameSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        this.refreshWaveButton();
        this.showInGameNotification(`Speed: ${this.gameSpeed}×`);
    }

    showTowerUpgradeMenu(tower) {
        const p = document.getElementById("tower-upgrade-menu");
        p.style.display = "flex";
        // Mark this tower as selected — renderHeroAbilityBar() reads this every
        // frame to hide the ability bar while the menu is open (prevents overlap).
        this.selectedTowerForUpgrade = tower;

        // Keep the panel open while the pointer is over it; otherwise auto-close
        // after a short interval so it can't linger and cause accidental clicks.
        if (!this._upgradeHoverWired && p.addEventListener) {
            this._upgradeHoverWired = true;
            p.addEventListener("mouseenter", () => this.cancelUpgradeMenuAutoHide());
            p.addEventListener("mouseleave", () => this.scheduleUpgradeMenuAutoHide(2000));
        }
        this.scheduleUpgradeMenuAutoHide(5000);

        const upCost = tower.upgradeCost();
        const ultimateRp = tower.ultimateRpCost();
        const sellValue = Math.floor(tower.cost * 0.6);

        const maxLevel = (this.unlocks && this.unlocks.maxLevel) || 3;
        const canSpec = !this.unlocks || this.unlocks.spec;

        let lvlText = `Level ${tower.level}`;
        if (tower.level >= 4) lvlText = "★ Specialized";

        // Build the specialization section based on tower tier + level unlocks.
        let specHtml = "";
        if (tower.level >= 4) {
            specHtml = `<div style="font-size:12px; color:#00ff66; margin-top:8px;">Specialized: <strong>${tower.name}</strong></div>`;
        } else if (!canSpec) {
            specHtml = `<div style="font-size:11px; color:#8c8c9a; margin-top:8px;">🔒 Higher upgrades & specialization unlock in later levels.</div>`;
        } else if (tower.level < 3) {
            specHtml = `<div style="font-size:11px; color:#8c8c9a; margin-top:8px;">Reach Level 3 to choose a specialization.</div>`;
        } else if (tower.level === 3) {
            const info = tower.branchInfo();
            const afford = this.researchPoints >= ultimateRp;
            const gate = `<div style="font-size:11px; color:#ffd166; margin:8px 0 4px;">Specialize (${ultimateRp} RP + answer a revision question):</div>`;
            specHtml = gate + `<div style="display:flex; gap:8px; justify-content:center;">
                <button class="branch-btn" id="branch-a-btn" ${afford ? "" : "disabled"} title="${info.a.desc}">
                    ${info.a.name}
                </button>
                <button class="branch-btn" id="branch-b-btn" ${afford ? "" : "disabled"} title="${info.b.desc}">
                    ${info.b.name}
                </button>
            </div>`;
        }

        // Upgrade choices: prefer the new damage/range/speed options API, capped
        // by the level's unlock tier.
        const useOptions = typeof tower.getUpgradeOptions === "function" && tower.level < maxLevel;
        const options = useOptions ? tower.getUpgradeOptions() : null;
        let upgradeHtml = "";
        if (options) {
            upgradeHtml = `<div class="upg-options">` + options.map((o, i) => {
                const disabled = o.maxed || this.gold < o.cost;
                return `<button class="upg-opt-btn" id="upg-opt-${i}" ${disabled ? "disabled" : ""} title="${o.desc || ""}">
                    <span class="upg-opt-label">${o.label}</span>
                    <span class="upg-opt-cost">${o.maxed ? "MAX" : o.cost + "G"}</span>
                </button>`;
            }).join("") + `</div>`;
        } else if (tower.level < maxLevel) {
            upgradeHtml = `<button id="upgrade-gold-btn" ${this.gold < upCost ? "disabled" : ""}>Upgrade (${upCost} Gold)</button>`;
        } else {
            upgradeHtml = `<div style="font-size:11px; color:#8c8c9a;">Standard upgrades maxed.</div>`;
        }

        // Targeting selector (Gap 1) — for towers that actually shoot (not the
        // Barracks blocker). The range upgrade's "prioritize far" overrides this.
        const TARGET_LABELS = { first: "First", strongest: "Strongest", weakest: "Weakest", closest: "Closest" };
        const showTargeting = tower.type !== "barracks" && typeof tower.cycleTargetMode === "function";
        let targetHtml = "";
        if (showTargeting) {
            const overridden = tower.prioritizeFar ? " 🔒(Range upg → far)" : "";
            targetHtml = `<button id="target-mode-btn" class="target-mode-btn" ${tower.prioritizeFar ? "disabled" : ""} title="Cycle which enemy this tower shoots first">🎯 Target: ${TARGET_LABELS[tower.targetMode] || tower.targetMode}${overridden}</button>`;
        }

        p.innerHTML = `
            <h3>${tower.name} (${lvlText})</h3>
            <div style="font-size:12px; margin-bottom:6px; color:#bdc3c7;">DMG ${Math.round(tower.damage || 0)} | Range ${Math.round(tower.range)} | Speed ${tower.cooldown}f</div>
            ${upgradeHtml}
            ${targetHtml}
            <div style="display:flex; gap:10px; justify-content:center; margin-top:8px;">
                <button id="sell-btn">Sell (+${sellValue}G)</button>
            </div>
            ${specHtml}
        `;

        // Stat-choice upgrade events (damage / range / speed)
        if (options) {
            options.forEach((o, i) => {
                const btn = document.getElementById(`upg-opt-${i}`);
                if (!btn) return;
                btn.addEventListener("click", () => {
                    if (o.maxed || this.gold < o.cost) return;
                    if (tower.applyUpgradeOption(o.kind)) {
                        this.gold -= o.cost;
                        if (window.audioManager) window.audioManager.playSfx(`tower_${tower.type}_upgrade`);
                        this.particleSystem.createExplosion(tower.x, tower.y, "#00ff66", 15, 3);
                        this.particleSystem.addFloatingText(tower.x, tower.y, `${o.label}!`, "#00ff66", 14);
                        this.updateSidebarUI();
                        this.showTowerUpgradeMenu(tower);
                    }
                });
            });
        } else {
            const legacyBtn = document.getElementById("upgrade-gold-btn");
            if (legacyBtn) legacyBtn.addEventListener("click", () => {
                if (this.gold >= upCost && tower.upgrade()) {
                    this.gold -= upCost;
                    if (window.audioManager) window.audioManager.playSfx(`tower_${tower.type}_upgrade`);
                    this.particleSystem.createExplosion(tower.x, tower.y, "#00ff66", 15, 3);
                    this.particleSystem.addFloatingText(tower.x, tower.y, "Upgraded!", "#00ff66", 14);
                    this.updateSidebarUI();
                    this.showTowerUpgradeMenu(tower);
                }
            });
        }

        // Targeting toggle event (Gap 1)
        const targetBtn = document.getElementById("target-mode-btn");
        if (targetBtn) targetBtn.addEventListener("click", () => {
            tower.cycleTargetMode();
            this.showTowerUpgradeMenu(tower); // re-render to show the new mode
        });

        // Specialization branch events (quiz-gated)
        const branchA = document.getElementById("branch-a-btn");
        const branchB = document.getElementById("branch-b-btn");
        if (branchA) branchA.addEventListener("click", () => this.attemptBranchUnlock(tower, "a"));
        if (branchB) branchB.addEventListener("click", () => this.attemptBranchUnlock(tower, "b"));

        // Sell Event — require a confirming second click so a stray click can't
        // accidentally sell a tower.
        const sellBtn = document.getElementById("sell-btn");
        let sellArmed = false;
        sellBtn.addEventListener("click", () => {
            if (!sellArmed) {
                sellArmed = true;
                sellBtn.textContent = `Confirm sell? (+${sellValue}G)`;
                sellBtn.classList.add("sell-armed");
                this.cancelUpgradeMenuAutoHide(); // don't let it vanish mid-decision
                if (typeof setTimeout !== "undefined") setTimeout(() => {
                    if (document.getElementById("sell-btn") === sellBtn) {
                        sellArmed = false;
                        sellBtn.textContent = `Sell (+${sellValue}G)`;
                        sellBtn.classList.remove("sell-armed");
                        this.scheduleUpgradeMenuAutoHide(2500);
                    }
                }, 2600);
                return;
            }
            this.gold += sellValue;
            if (tower.padRef) tower.padRef.occupied = false; // free the build pad
            this.towers = this.towers.filter(t => t !== tower);
            this.recomputeStackPenalties();
            this.particleSystem.createExplosion(tower.x, tower.y, "#ff3333", 8, 2);
            this.particleSystem.addFloatingText(tower.x, tower.y, `+${sellValue}G`, "#ffd700", 12);
            this.selectedTowerForUpgrade = null;
            this.updateSidebarUI();
            this.hideTowerUpgradeMenu();
        });
    }

    // Specialization is the quiz-driven core loop: choosing a branch costs RP
    // (earned mainly by answering questions) AND requires correctly answering a
    // question of that tower's discipline.
    attemptBranchUnlock(tower, branchKey) {
        const cost = tower.ultimateRpCost();
        if (this.researchPoints < cost) {
            this.showInGameNotification(`Need ${cost} RP to specialize — answer questions to earn Research Points!`);
            return;
        }
        this.pendingBranch = { tower, branchKey, cost };
        this.triggerBranchQuestion(tower.type);
    }

    triggerBranchQuestion(topic) {
        this.isPaused = true;
        const modal = document.getElementById("question-modal");
        const qObj = this.questionManager.getQuestionByTopic(topic);
        this.currentBranchQuestion = qObj;
        modal.style.display = "flex";

        let optionsHtml = "";
        qObj.o.forEach((opt, idx) => {
            optionsHtml += `<button class="opt-btn" onclick="submitBranchAnswer(${idx})">${opt}</button>`;
        });

        const headerTopic = qObj.topicName || "Science";
        const info = this.pendingBranch.tower.branchInfo()[this.pendingBranch.branchKey];

        modal.innerHTML = `
            <div class="question-container">
                <div class="q-header">⚗️ SPECIALIZATION CHALLENGE: ${headerTopic}</div>
                <div style="font-size:12px; color:#ffd166; margin-bottom:8px;">Answer correctly to unlock <strong>${info.name}</strong></div>
                <div class="q-body">${qObj.q}</div>
                <div class="q-options">${optionsHtml}</div>
                <div id="q-feedback" style="display:none; font-size:13px; margin-top:15px; text-align:left; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;"></div>
                <button id="q-close" style="display:none; margin-top:15px; width:100%; border:none; border-radius:4px; height:34px; background:#00ff66; color:#000; font-weight:bold; cursor:pointer;" onclick="closeBranchModal()">Resume Game</button>
            </div>
        `;
    }

    solveBranchAnswer(index) {
        if (!this.currentBranchQuestion) return; // modal already closed/cleared
        const feedback = document.getElementById("q-feedback");
        const closeBtn = document.getElementById("q-close");
        document.querySelectorAll(".opt-btn").forEach(b => b.disabled = true);

        const correct = index === this.currentBranchQuestion.a;
        feedback.style.display = "block";
        closeBtn.style.display = "block";

        // The tower must still be on the field (it can't normally be sold while
        // the modal is up, but never specialize a ghost reference).
        if (correct && this.pendingBranch && this.towers.includes(this.pendingBranch.tower)) {
            const { tower, branchKey, cost } = this.pendingBranch;
            this.researchPoints -= cost;
            tower.chooseBranch(branchKey);
            feedback.innerHTML = `<span style="color:#00ff66; font-weight:bold;">✓ CORRECT!</span><br><p>Unlocked <strong>${tower.name}</strong>.</p><p>${this.currentBranchQuestion.exp}</p>`;
            this.particleSystem.createExplosion(tower.x, tower.y, "#ffd700", 30, 4);
            this.particleSystem.createShockwave(tower.x, tower.y, 80, "#ffd700", 3, 2);
            this.particleSystem.addFloatingText(tower.x, tower.y, "SPECIALIZED!", "#ffd700", 16);
        } else {
            feedback.innerHTML = `<span style="color:#ff3333; font-weight:bold;">✗ INCORRECT.</span><br><p>Correct answer: <strong>${this.currentBranchQuestion.o[this.currentBranchQuestion.a]}</strong></p><p>${this.currentBranchQuestion.exp}</p><p style="color:#bdc3c7;">No RP spent — study up and try again.</p>`;
        }
        this.updateSidebarUI();
    }

    hideTowerUpgradeMenu() {
        document.getElementById("tower-upgrade-menu").style.display = "none";
        this.cancelUpgradeMenuAutoHide();
        this.selectedTowerForUpgrade = null; // renderHeroAbilityBar() restores the bar next frame
    }

    // Auto-dismiss the upgrade panel so it doesn't linger and invite mis-clicks
    // (it used to stay open until you clicked empty ground). The countdown resets
    // every time the menu re-renders or the pointer is over it.
    scheduleUpgradeMenuAutoHide(ms) {
        this.cancelUpgradeMenuAutoHide();
        if (typeof setTimeout === "undefined") return;
        this._upgradeHideTimer = setTimeout(() => {
            this._upgradeHideTimer = null;
            this.hideTowerUpgradeMenu();
        }, ms);
    }

    cancelUpgradeMenuAutoHide() {
        if (this._upgradeHideTimer) { clearTimeout(this._upgradeHideTimer); this._upgradeHideTimer = null; }
    }

    showInGameNotification(text) {
        const log = document.getElementById("hud-log");
        if (log) {
            log.textContent = text;
            log.style.opacity = 1;
            setTimeout(() => {
                log.style.opacity = 0.85;
            }, 3000);
        }
    }

    // Floating bubble question modal
    triggerQuestionPopup() {
        this.isPaused = true;
        const modal = document.getElementById("question-modal");
        const qObj = this.questionManager.getRandomQuestion();
        this.currentActiveQuestion = qObj;

        modal.style.display = "flex";
        
        // Assemble choices HTML
        let optionsHtml = "";
        qObj.o.forEach((opt, idx) => {
            optionsHtml += `<button class="opt-btn" onclick="submitAnswer(${idx})">${opt}</button>`;
        });

        const headerTopic = qObj.topicName || "Science";

        modal.innerHTML = `
            <div class="question-container">
                <div class="q-header">🔬 SCIENCE BREAKTHROUGH: ${headerTopic}</div>
                <div class="q-body">${qObj.q}</div>
                <div class="q-options">${optionsHtml}</div>
                <div id="q-feedback" style="display:none; font-size:13px; margin-top:15px; text-align:left; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;"></div>
                <button id="q-close" style="display:none; margin-top:15px; width:100%; border:none; border-radius:4px; height:34px; background:#00ff66; color:#000; font-weight:bold; cursor:pointer;" onclick="closeQuestionModal()">Resume Game</button>
            </div>
        `;
    }

    solveAnswer(index) {
        const feedback = document.getElementById("q-feedback");
        const closeBtn = document.getElementById("q-close");
        const optButtons = document.querySelectorAll(".opt-btn");
        
        // Disable choices
        optButtons.forEach(b => b.disabled = true);

        const correct = index === this.currentActiveQuestion.a;
        feedback.style.display = "block";
        closeBtn.style.display = "block";

        if (window.audioManager) window.audioManager.playSfx(correct ? "quiz_correct" : "quiz_wrong");

        if (correct) {
            feedback.innerHTML = `<span style="color:#00ff66; font-weight:bold;">✓ CORRECT!</span><br><p>${this.currentActiveQuestion.exp}</p>`;

            // Add rewards (Research Points are the quiz-driven core currency)
            const rpGain = Math.round(15 * this.rpMult);
            this.gold += 120;
            this.researchPoints += rpGain;
            this.particleSystem.addFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, "+120 Gold!", "#ffd700", 18);
            this.particleSystem.addFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, `+${rpGain} Research Points!`, "#00ffff", 18);
        } else {
            feedback.innerHTML = `
                <span style="color:#ff3333; font-weight:bold;">✗ INCORRECT.</span><br>
                <p>Correct answer: <strong>${this.currentActiveQuestion.o[this.currentActiveQuestion.a]}</strong></p>
                <p>${this.currentActiveQuestion.exp}</p>
            `;
            
            // small penalty / no rewards
            this.gold += 20; // consolidation prize
            this.researchPoints += Math.round(2 * this.rpMult);
            this.particleSystem.addFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30, "+20 Gold", "#ffd700", 13);
        }
        
        this.updateSidebarUI();
    }

    // ---- Gap 4: between-wave "Solve to Rush" -------------------------------
    // Only valid during the between-wave countdown. Answering correctly calls
    // the next wave early with DOUBLE the early-call gold bonus and heals the
    // heroes/summons. Answering wrong costs nothing — the countdown resumes.
    triggerRushQuestion() {
        if (this.gameState !== "playing" || this.isWaveActive || this.nextWaveCountdown <= 0) return;
        this.isPaused = true;
        const modal = document.getElementById("question-modal");
        const qObj = this.questionManager.getRandomQuestion();
        this.currentRushQuestion = qObj;
        // Snapshot the countdown so the bonus reflects the moment of solving.
        this.rushCountdownSnapshot = this.nextWaveCountdown;
        modal.style.display = "flex";

        let optionsHtml = "";
        qObj.o.forEach((opt, idx) => {
            optionsHtml += `<button class="opt-btn" onclick="submitRushAnswer(${idx})">${opt}</button>`;
        });
        const headerTopic = qObj.topicName || "Science";
        modal.innerHTML = `
            <div class="question-container">
                <div class="q-header">⚡ SOLVE TO RUSH: ${headerTopic}</div>
                <div style="font-size:12px; color:#ffd166; margin-bottom:8px;">Answer correctly to call the next wave early for <strong>DOUBLE</strong> gold + a full heal.</div>
                <div class="q-body">${qObj.q}</div>
                <div class="q-options">${optionsHtml}</div>
                <div id="q-feedback" style="display:none; font-size:13px; margin-top:15px; text-align:left; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;"></div>
                <button id="q-close" style="display:none; margin-top:15px; width:100%; border:none; border-radius:4px; height:34px; background:#00ff66; color:#000; font-weight:bold; cursor:pointer;" onclick="closeQuestionModal()">Resume Game</button>
            </div>
        `;
    }

    solveRushAnswer(index) {
        const feedback = document.getElementById("q-feedback");
        const closeBtn = document.getElementById("q-close");
        document.querySelectorAll(".opt-btn").forEach(b => b.disabled = true);

        const correct = index === this.currentRushQuestion.a;
        feedback.style.display = "block";
        closeBtn.style.display = "block";
        if (window.audioManager) window.audioManager.playSfx(correct ? "quiz_correct" : "quiz_wrong");

        if (correct) {
            const secLeft = Math.ceil((this.rushCountdownSnapshot || 0) / 60);
            const bonus = secLeft * this.EARLY_CALL_GOLD_PER_SEC * 2; // double early-call bonus
            this.gold += bonus;
            this.researchPoints += Math.round(10 * this.rpMult);
            feedback.innerHTML = `<span style="color:#00ff66; font-weight:bold;">✓ CORRECT — WAVE RUSHED!</span><br><p>+${bonus} Gold (2× early call) · heroes healed.</p><p>${this.currentRushQuestion.exp}</p>`;
            this.particleSystem.addFloatingText(GAME_WIDTH / 2, 90, `Solved! +${bonus}G (2×)`, "#ffd700", 18, 1.5);
            // Heal + call the wave (startNextWave already heals heroes/summons).
            this.startNextWave(false);
        } else {
            feedback.innerHTML = `<span style="color:#ff3333; font-weight:bold;">✗ INCORRECT.</span><br><p>Correct answer: <strong>${this.currentRushQuestion.o[this.currentRushQuestion.a]}</strong></p><p>${this.currentRushQuestion.exp}</p><p style="color:#bdc3c7;">No penalty — the countdown resumes.</p>`;
        }
        this.updateSidebarUI();
    }

    // End-of-level housekeeping shared by victory and defeat: any open modal or
    // aim mode must not survive into the end screen / next playthrough.
    _closeBattleOverlays() {
        const qModal = document.getElementById("question-modal");
        if (qModal) qModal.style.display = "none";
        const pModal = document.getElementById("pause-modal");
        if (pModal) pModal.style.display = "none";
        this.isTargetingItem = false;
        this.activeItemKey = null;
        this.isTargetingSkill = false;
        this.targetingHeroIndex = -1;
        if (this.canvas) this.canvas.style.cursor = "default";
    }

    triggerVictory() {
        this.gameState = "victory";
        this._closeBattleOverlays();
        if (window.audioManager) window.audioManager.playStinger("victory");

        // Star rating from lives remaining (only persisted for campaign levels).
        let stars = 1;
        if (this.lives >= 18) stars = 3;
        else if (this.lives >= 10) stars = 2;

        if (!this.isEndless && this.level && typeof this.level.id === "number") {
            const prev = this.levelStars[this.level.id] || 0;
            if (stars > prev) {
                this.levelStars[this.level.id] = stars;
                this.saveStars();
            }
        }

        const starStr = "★".repeat(stars) + "☆".repeat(3 - stars);

        document.getElementById("victory-details").innerHTML = `
            <p>You have successfully cataloged and debunked all false theories in <strong>${this.level.name}</strong>!</p>
            <div style="font-size:34px; color:#ffd700; letter-spacing:6px; margin:16px 0;">${starStr}</div>
            <p style="color:#bdc3c7;">Lives remaining: ${this.lives} / ${20 + META_DEFS.find(d=>d.key==="startLives").perRank * this.meta.startLives}</p>
            <p style="font-size:22px; color:#ffd700; font-weight:bold; margin-top:10px;">Score: ${this.score}</p>
        `;

        // Switch via the .active class system (screens are toggled by opacity/
        // position in CSS, not inline display) so the screen actually shows and
        // the playing screen isn't left inline-hidden for the next playthrough.
        switchScreen("screen-victory");
    }

    triggerDefeat() {
        this.gameState = "defeat";
        this._closeBattleOverlays();
        if (window.audioManager) window.audioManager.playStinger("defeat");

        document.getElementById("defeat-details").innerHTML = `
            <p>Scientific misinformation has overrun the defense perimeter. Critical thinking has collapsed!</p>
            <p style="font-size:18px; color:#ff3333; margin-top:10px;">Waves Cleared: ${this.waveNumber - 1}</p>
        `;

        switchScreen("screen-defeat");
    }
}

// Global functions for inline HTML calls (simplifies overlay click integration)
window.submitAnswer = function(index) {
    if (window.gameInstance) {
        window.gameInstance.solveAnswer(index);
    }
};

window.closeQuestionModal = function() {
    document.getElementById("question-modal").style.display = "none";
    if (window.gameInstance) {
        window.gameInstance.isPaused = false;
    }
};

window.submitRushAnswer = function(index) {
    if (window.gameInstance) {
        window.gameInstance.solveRushAnswer(index);
    }
};

window.solveRush = function() {
    if (window.gameInstance) {
        window.gameInstance.triggerRushQuestion();
    }
};

window.submitBranchAnswer = function(index) {
    if (window.gameInstance) {
        window.gameInstance.solveBranchAnswer(index);
    }
};

window.closeBranchModal = function() {
    document.getElementById("question-modal").style.display = "none";
    const g = window.gameInstance;
    if (!g) return;
    g.isPaused = false;
    const tower = g.pendingBranch ? g.pendingBranch.tower : null;
    g.pendingBranch = null;
    g.currentBranchQuestion = null;
    // Refresh the upgrade drawer so it reflects the new specialization (if any).
    if (tower && g.towers.includes(tower)) {
        g.showTowerUpgradeMenu(tower);
    } else {
        g.hideTowerUpgradeMenu();
    }
    g.updateSidebarUI();
};

window.resetMeta = function() {
    if (window.gameInstance) {
        window.gameInstance.resetMetaUpgrades();
        window.gameInstance.renderMetaScreen();
    }
};

window.gameInstance = null;
window.Game = Game;
