# Animated Sprite Sheets — Science Tower Defense

Scope: **walk + idle + attack** for heroes (RIGHT-facing strips, engine mirrors for
LEFT); **idle + attack** for towers (static, single row). All sheets are single-row
horizontal strips — simplest to generate and to slice.

Two parts: (1) engine changes for the build session, (2) the Antigravity prompt.

---

## PART 1 — ENGINE CHANGES REQUIRED

Today every sprite is blitted whole every frame (`ctx.drawImage(img, x, y, size, size)`
at e.g. `heroes.js:340`, `towers.js:492`) — the engine has no concept of frames.
Add the following (≈110 lines + call-site swaps).

> **Update 2026-06-02:** enemies and level backgrounds are now wired too.
> `Enemy.draw()` routes through `drawSprite(..., "walk", ...)` (one looping walk strip
> per enemy), and the `"playing"` render branch draws a painted per-level terrain
> image (`bg_level_<id>`) when present, else the old procedural `bgColor` + scenery.
> Both fall back cleanly, so the prompts in **Batch 3 & 4** below can be generated
> independently. See `CHANGELOG.md` (2026-06-02) for the wiring details.

### 1. Sheet metadata (`SHEET_META`) — all single-row strips
```js
window.SHEET_META = {
  // HEROES — RIGHT-facing strips (engine mirrors horizontally when moving left)
  "hero_einstein_idle":   { frameW:64, frameH:64, cols:4, fps:6,  loop:true  },
  "hero_einstein_walk":   { frameW:64, frameH:64, cols:8, fps:12, loop:true  },
  "hero_einstein_attack": { frameW:64, frameH:64, cols:6, fps:14, loop:false },
  // ...same triple for newton, curie, darwin; tortoise gets idle+walk only...

  // TOWERS — single-row strips, no mirroring
  "tower_physics_1_idle":   { frameW:64, frameH:64, cols:6, fps:8,  loop:true  },
  "tower_physics_1_attack": { frameW:64, frameH:64, cols:6, fps:16, loop:false },
  // ...same pair for tiers 1/3/4 of physics, chemistry, biology, astronomy...
};
```

### 2. Add the new sheet paths to `ASSETS_MANIFEST` (game.js:4)
Loader is generic — `new Image()` loads a strip like any sprite. Just add keys, e.g.
`"hero_einstein_walk": "assets/heroes/einstein_walk.png"`.

### 3. Global animation clock — in the existing loop:
`window.ANIM_TIME = (window.ANIM_TIME || 0) + dtMs;`

### 4. Entity animation state
- **Heroes:** `animState` (`'idle'|'walk'|'attack'`), `faceLeft` (bool, set from velocity:
  `if (vx < -0.1) faceLeft=true; else if (vx > 0.1) faceLeft=false;`), `attackStart` (ms).
  In `update()`: moving → `walk`, still → `idle`; on cast/attack set `animState='attack'`,
  stamp `attackStart`, revert when the attack strip length elapses.
- **Towers:** `animState='idle'` normally; on fire → `'attack'` + `attackStart`, revert
  after the attack strip finishes. No mirroring.

### 5. The frame helper — `drawSprite()` (single-row, with one-shot support)
```js
function drawSprite(ctx, baseKey, state, dx, dy, dw, dh, attackStart) {
  let key = `${baseKey}_${state}`;
  let meta = window.SHEET_META && window.SHEET_META[key];
  let img  = window.spriteAssets && window.spriteAssets[key];
  if (!img || !meta) { key = `${baseKey}_idle`; meta = window.SHEET_META?.[key]; img = window.spriteAssets?.[key]; }
  if (!img) { img = window.spriteAssets?.[baseKey]; meta = null; }   // static fallback
  if (!img || !img.complete || img.naturalWidth === 0) return false; // → procedural fallback
  if (!meta) { ctx.drawImage(img, dx, dy, dw, dh); return true; }    // whole image (static)

  const t = window.ANIM_TIME || 0;
  let frame;
  if (meta.loop === false) {                                         // one-shot (attack)
    const elapsed = t - (attackStart || 0);
    frame = Math.min(meta.cols - 1, Math.max(0, Math.floor(elapsed * meta.fps / 1000)));
  } else {                                                           // looping (idle/walk)
    frame = Math.floor(t * meta.fps / 1000) % meta.cols;
  }
  ctx.drawImage(img, frame * meta.frameW, 0, meta.frameW, meta.frameH, dx, dy, dw, dh);
  return true;
}
```

### 6. Swap the call sites
- **Towers** (`towers.js:492`): `if (!drawSprite(ctx, `tower_${this.type}_${sprLvlKey}`, this.animState, dx, dy, dw, dh, this.attackStart)) { /* procedural fallback */ }`
- **Heroes** (`heroes.js` ~107 tortoise, ~178 base, ~340 subclass): mirror when facing left —
```js
const baseKey = `hero_${this.spriteKey}`;
let drawn;
if (this.faceLeft) {
  ctx.save();
  ctx.translate(dx + dw/2, 0); ctx.scale(-1, 1); ctx.translate(-(dx + dw/2), 0);
  drawn = drawSprite(ctx, baseKey, this.animState, dx, dy, dw, dh, this.attackStart);
  ctx.restore();
} else {
  drawn = drawSprite(ctx, baseKey, this.animState, dx, dy, dw, dh, this.attackStart);
}
if (!drawn) { /* existing procedural vector fallback */ }
```
Projectiles (`towers.js:157`) can stay static.

That's the whole change.

---

## PART 2 — ANTIGRAVITY PROMPT (copy everything in the block)

```
You are a game-art generation agent. Generate ANIMATED 2D SPRITE SHEETS for an
HTML5-canvas tower-defense game and save each as a transparent PNG at the EXACT
path, layout, and pixel size specified. Do not change any code — only create
image files.

PROJECT ROOT:
/Users/irvincisneros/Library/Mobile Documents/com~apple~CloudDocs/Claude/Games/Tower Defense Game/

═══════════════════════════════════════════════════════════════════
GLOBAL ART DIRECTION (every frame, every sheet — keep it consistent)
═══════════════════════════════════════════════════════════════════
• Style: "2D cartoon fantasy", like mobile tower-defense games Realm Defense /
  Kingdom Rush. Bright saturated colours, bold clean dark outlines (~2–3px),
  soft cel shading, friendly readable silhouettes.
• Background: FULLY TRANSPARENT (alpha). No baked shadow, no ground, no frame.
• Lighting: top-left light source, identical across the whole set.
• Cohesion: the entire set must look like one matched game — same outline weight,
  same proportions, same palette.

SUBJECT COLOUR CODING (dominant accent/glow per category):
  Physics=CYAN #00ffff  Chemistry=ORANGE #ff6600  Biology=GREEN #00ff66
  Astronomy=PURPLE #bf55ec

THEME: science-revision game. HEROES are famous real scientists in heroic cartoon
form. TOWERS are science-lab equipment turrets.

═══════════════════════════════════════════════════════════════════
IMAGE GENERATION METHOD — MANDATORY
═══════════════════════════════════════════════════════════════════
• Produce ALL artwork as real AI-illustrated images using the Nano Banana 2 /
  Gemini native image-generation model. This is hand-illustrated-quality 2D game
  art, NOT diagrams.
• DO NOT draw the sprites programmatically. No Python/Pillow/PIL, no matplotlib,
  no HTML5 canvas, no SVG, no CSS, no procedural shape/primitive drawing of the
  artwork itself. Code may ONLY be used for the mechanical compositing step below.
• Recommended workflow per sheet: (1) generate each animation FRAME as an
  individual transparent AI image, keeping the SAME character design, colours,
  outline weight, scale and baseline across every frame (use the previous frame
  as reference for consistency); (2) then composite those finished frames
  left→right into one single-row strip PNG at the exact dimensions below. The
  compositing/packing step may be done with code — it only arranges existing art,
  it must not draw any art.

═══════════════════════════════════════════════════════════════════
SPRITE-SHEET FORMAT — READ CAREFULLY, MUST BE EXACT
═══════════════════════════════════════════════════════════════════
EVERY sheet is a SINGLE HORIZONTAL ROW (1 row only). Each frame/cell is 64×64 px,
packed left→right with NO gaps and NO padding, starting at the top-left (0,0).
Transparent background throughout. Columns are the animation frames in play order.

HEROES face RIGHT only (the game mirrors them automatically when walking left — so
do NOT draw left/up/down versions; draw every hero facing screen-RIGHT).
  • idle  sheet: 4 frames  → 256×64 px  (gentle breathing / idle bob loop)
  • walk  sheet: 8 frames  → 512×64 px  (smooth looping walk cycle, moving right)
  • attack sheet: 6 frames → 384×64 px  (ONE-SHOT cast/strike: frame 1 = wind-up …
    last frame = recovery; must read well when played once)

TOWERS are static structures (no movement).
  • idle  sheet: 6 frames → 384×64 px (subtle looping idle: hum, flicker, bubbling,
    rotating part — alive but calm)
  • attack sheet: 6 frames → 384×64 px (ONE-SHOT firing: charge → discharge → settle)
Keep the tower BASE perfectly still across all frames so it doesn't jitter when
placed on the map — only the active/energy parts animate.

CRITICAL: keep the character/structure at a consistent position and scale across
all frames of a sheet (no drifting baseline, no size jumps between frames).

═══════════════════════════════════════════════════════════════════
BATCH 1 — HERO SHEETS  (save to assets/heroes/, all facing RIGHT)
For each hero generate THREE sheets: _idle.png, _walk.png, _attack.png
═══════════════════════════════════════════════════════════════════
EINSTEIN — Albert Einstein, lightning/fission hero: wild white hair, moustache,
  CYAN electric energy crackling in his hands. Attack = hurls a bolt of lightning.
  → assets/heroes/einstein_idle.png  (256×64)
  → assets/heroes/einstein_walk.png  (512×64)
  → assets/heroes/einstein_attack.png(384×64)
NEWTON — Isaac Newton, gravity hero: 17th-c. coat, long curls, glowing apple /
  orbiting gravity orb, purple-blue energy. Attack = slams a gravity orb down.
  → assets/heroes/newton_idle.png / newton_walk.png / newton_attack.png
CURIE — Marie Curie, radioactive hero: period dress, glowing GREEN radium vial,
  faint radiation aura. Attack = flings a glowing radioactive flask.
  → assets/heroes/curie_idle.png / curie_walk.png / curie_attack.png
DARWIN — Charles Darwin, evolution/blocker hero: big grey beard, explorer coat,
  sturdy. Attack = a heavy melee strike / staff swing.
  → assets/heroes/darwin_idle.png / darwin_walk.png / darwin_attack.png
TORTOISE — summoned Giant Galápagos Tortoise path-blocker, chunky armoured shell,
  determined cartoon face. (idle + walk ONLY — no attack sheet.)
  → assets/heroes/tortoise_idle.png  (256×64)
  → assets/heroes/tortoise_walk.png  (512×64)

═══════════════════════════════════════════════════════════════════
BATCH 2 — TOWER SHEETS  (save to assets/towers/)
Three tiers each (_1 basic, _3 upgraded, _4 ultimate). Higher tiers = bigger,
more ornate, more energy. For EACH tier generate _idle.png and _attack.png.
All tower sheets are 384×64 px (6 frames × 1 row).
═══════════════════════════════════════════════════════════════════
PHYSICS — Tesla electric coil tower (CYAN). idle = arcing sparks; attack = fires
  a lightning bolt.
  → physics_1_idle.png, physics_1_attack.png
  → physics_3_idle.png, physics_3_attack.png
  → physics_4_idle.png, physics_4_attack.png
CHEMISTRY — Acid beaker tower (ORANGE). idle = bubbling flask, rising fumes;
  attack = lobs an acid flask.
  → chemistry_1_idle.png … chemistry_4_attack.png  (all 6)
BIOLOGY — Spore/carnivorous-plant tower (GREEN). idle = swaying bloom, drifting
  spores; attack = spits a spore needle.
  → biology_1_idle.png … biology_4_attack.png  (all 6)
ASTRONOMY — Black-hole / singularity tower (PURPLE). idle = swirling vortex,
  orbiting debris; attack = pulses a gravity blast.
  → astronomy_1_idle.png … astronomy_4_attack.png  (all 6)

═══════════════════════════════════════════════════════════════════
BATCH 3 — ENEMY SHEETS  (save to assets/enemies/)
Enemies are ANIMATED with a single LOOPING WALK strip each (no idle, no attack —
they're always advancing; defeat is handled by an in-engine squash + particle pop).
Each enemy faces screen-RIGHT (they march left→right along the path).
• Regular enemies: 6 frames × 64×64 → 384×64 px  (smooth looping walk/float cycle)
• BOSS enemies:    6 frames × 128×128 → 768×128 px (bigger cells — imposing scale)
These are the "debunked bad-science" misconception monsters. Keep them readable,
characterful, slightly menacing-but-cartoony. Consistent position/scale per frame.
═══════════════════════════════════════════════════════════════════
REGULAR ENEMIES (→ assets/enemies/<key>_walk.png, 384×64 each):
flatearth   — truculent armoured flat-earth DISC with a grumpy face + little legs,
              ringed by a tiny ice wall. Tank. (walk = waddling roll)
phlogiston  — fast little flame-ember elemental, discredited fire-substance. Swarm.
              (walk = darting flicker, trailing sparks)
spontaneous — mould-fly blob sprung from rotten matter, buzzing flies around it.
              Splitter. (walk = bobbing hover)
maggot      — small decaying maggot/grub segment (the split-spawn of spontaneous).
              (walk = inchworm crawl)
alchemy     — golden crucible golem bubbling molten gold, faint healing aura. Healer.
              (walk = sloshing trudge)
perpetual   — twin orbiting rings spinning forever, faint magic shield bubble.
              Shielded. (walk = hovering, rings rotating)
geocentric  — levitating brass orrery, Earth at centre with a tiny sun orbiting.
              FLYER. (walk = airborne drift, orbit spinning)
miasma      — sickly green-grey toxic gas cloud with a sour face. Tanky. (walk = roil)
caloric     — sprinting bead of glowing orange heat-fluid. Swarm, very fast.
              (walk = stretched fast run)
aether      — shimmering translucent pale-violet wisp/jelly. FLYER. (walk = ghostly drift)
vitalism    — pulsing green life-spark spirit, regenerating glow. Regenerator.
              (walk = throbbing float)
humours     — armoured swirling vessel of four coloured fluids (red/clear/yellow/black),
              healing aura. Healer. (walk = heavy sway)
creationist — lumbering grey stone behemoth, ancient + heavily armoured, very slow.
              Tank. (walk = ponderous stomp)
homunculus  — alchemist's homunculus sealed in a cracked protective SHELL/jar.
              (walk = stiff shamble)
homunculus_core — the tiny frail humanoid core that bursts free from the shell,
              wild-eyed, extremely fast. (walk = frantic sprint)
golem       — shielded alchemical STONE golem, runes glowing. (walk = lumbering)
golem_molten — the molten lava sludge core left after the stone shatters, fast + glowing.
              (walk = oozing fast flow)
═══════════════════════════════════════════════════════════════════
BOSS ENEMIES (→ assets/enemies/<key>_walk.png, 768×128 each — 128px cells):
boss_geo    — GEO COLOSSUS: colossal armoured flat-earth leviathan, first boss; slow,
              enormous, grinding plates, radiating geological certainty.
boss_phlog  — PHLOGISTON TYRANT: roaring infernal fire titan leaving scorched earth,
              molten cracks, ember storm.
boss_aether — AETHER LEVIATHAN: vast translucent serpentine sky-entity woven from
              shimmering aether; airborne, flowing, ethereal.
boss_miasma — MIASMA EMPRESS: regal sovereign of disease-air, crowned toxic-cloud queen
              with a healing-green aura.
boss_entropy— ENTROPY INCARNATE: final boss, anthropomorphic heat-death of reason —
              a decaying cosmic figure of crumbling order, dim dying stars, void.

═══════════════════════════════════════════════════════════════════
BATCH 4 — LEVEL BACKGROUNDS  (save to assets/levels/<theme>.png)
⚠️ READ FIRST — THE PREVIOUS ATTEMPT WAS REJECTED. The last run produced flat
PROCEDURALLY-DRAWN images (gradient fills + a few geometric bars / a blueprint grid),
NOT painted scenes. That is exactly what is forbidden. You MUST generate these with the
Nano Banana 2 / Gemini native IMAGE-GENERATION model as hand-illustrated paintings.
DO NOT write a script, and DO NOT use Pillow/PIL, matplotlib, numpy, HTML5 canvas, SVG,
CSS gradients, or any code that draws shapes/gradients to make the artwork. If you cannot
invoke the image model, STOP and say so — do not fall back to drawing them in code.
ACCEPTANCE TEST for each file: it must look like a detailed illustrated game environment
(rendered foliage/rock/water/architecture with light and texture), not a flat gradient or
grid. A human glancing at it should see a "place", not a background swatch.

Full painted THEMED TERRAIN scenes — the game's playfield. NOT transparent: these
are full-bleed opaque background art. Style = lush polished mobile-TD terrain like
Realm Defense / Kingdom Rush level maps, top-down-with-slight-tilt (~3/4) view.
EXACT size: 1800×1100 px each (drawn into the 900×550 playfield at 2× for crispness;
aspect ≈ 16:9.8). 
DO NOT paint any path, road, build pads, towers, enemies, UI, text, or borders — the
game draws the winding path and build spots ON TOP in code. Paint only the terrain /
biome / scenery (ground, foliage, rocks, water, sky/ambient as fits the theme), with
the focal detail kept toward the EDGES so the centre stays readable under the path.
Give each its own palette + mood; keep them a matched set (same illustration style).
═══════════════════════════════════════════════════════════════════
(→ assets/levels/<theme>.png, 1800×1100 each)
lab         — sleek science LABORATORY interior floor: tiled floor, benches with
              beakers/coils at the edges, cyan ambient glow.
swamp       — murky PRIMORDIAL SWAMP: green bog water, lily pads, gnarled roots, mist.
volcanic    — VOLCANIC RIFT: cracked basalt, glowing lava rivers, ember haze, orange light.
tundra      — FROZEN TUNDRA: snow + blue ice sheets, frost, pale aurora, cold blue light.
observatory — GEOCENTRIC OBSERVATORY: marble dome floor, brass orrery rings, starfield,
              gold accents.
alchemy     — ALCHEMIST'S WORKSHOP floor: stone + wood, gold crucibles, bubbling vials,
              warm amber glow.
aether      — AETHER HEIGHTS: floating sky platforms in pale violet clouds, ethereal,
              luminous.
marsh       — PLAGUE MARSH: sickly green wetland, reeds, drifting miasma fog, murky pools.
tectonic    — TECTONIC FAULT: cracked rocky plates, fault lines, dust, earthy browns,
              shifting strata.
forge       — PHLOGISTON FORGE: dark industrial foundry, molten metal, embers, iron +
              fierce red-orange glow.
cavern      — CRYSTAL CAVERNS: dark cave with glowing blue/teal crystals, reflective
              pools, bioluminescence.
storm       — STORMFRONT: dark windswept cliff under a thunderstorm, lightning flashes,
              electric blue-yellow.
toxic       — TOXIC WASTES: polluted dump, sludge barrels, acid-green pools, hazard haze.
stellar     — STELLAR NURSERY: deep-space nebula, newborn stars, cosmic dust, purple/pink
              cosmic clouds.
twin_spires — TWIN SPIRES OF DELUSION: two ominous dark towers on a blighted ridge,
              pink-magenta ominous sky.
ocean       — DEEP OCEAN TRENCH: dark abyssal seabed, bioluminescent life, bubbles,
              deep blue with light shafts.
magnetic    — MAGNETIC ANOMALY: warped field-line landscape, floating metal debris,
              pink-magenta energy distortion.
radiation   — RADIATION ZONE: irradiated wasteland, glowing acid-green pools, dead trees,
              eerie luminescence.
singularity — SINGULARITY'S EDGE: reality fraying at a black-hole horizon, warped space,
              magenta/violet event-horizon glow.
heat_death  — HEAT DEATH OF THE UNIVERSE: final cold dark void, dying embers, fading
              stars, near-black with faint orange entropy glow.

═══════════════════════════════════════════════════════════════════
OUTPUT RULES
═══════════════════════════════════════════════════════════════════
• Create folders assets/heroes, assets/towers, assets/enemies and assets/levels under PROJECT ROOT if missing.
• Heroes, towers and ENEMIES: save with an ALPHA channel (transparent bg) at the
  EXACT pixel dimensions stated. LEVEL BACKGROUNDS (Batch 4) are the exception —
  they are full-bleed OPAQUE scenes at 1800×1100, no transparency, no path/UI baked in.
• Single row; frames packed left→right with no gaps; consistent position/scale
  across frames so the animation doesn't jump. Heroes ALL face screen-right.
• Use the exact filenames/paths above so they match the game's asset manifest.
• Generate in batches (Heroes → Towers); show me a preview of each hero's three
  sheets and each tower tier before continuing, and keep the whole set consistent.
```

---

### Asset count
- Heroes: 4 × 3 + tortoise × 2 = **14 sheets**.
- Towers: 4 × 3 × 2 = **24 sheets**.
- Enemies (Batch 3): 17 regular + 5 boss = **22 walk strips**.
- Level backgrounds (Batch 4): **20 painted terrains**.

Total **38 character/tower strips + 22 enemy strips + 20 backgrounds = 80 assets**.
The engine falls back to procedural vectors / `bgColor` until each PNG exists, so
generate in any order — nothing breaks while Antigravity works.
