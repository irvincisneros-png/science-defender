# Changelog

All notable changes made by Claude to the Science Tower Defense game are documented here.
Format: each entry lists **what** changed, **where** (file:line), **why** (the bug/root cause), and **how** it was verified.

---

## 2026-06-04 — Late-game difficulty ramp (levels felt too easy after Level 3)

After Level 3 the player unlocks extra tower disciplines (Chemistry L4, Astronomy L5, Volcano L6,
all by L7) **plus** full level-3 upgrades and specialisations — a big power spike. Enemy difficulty,
however, only grew `+0.28 scale/level` (≈ +8% HP/level), so player power outpaced it and later
levels felt boring/trivial.

- **`game.js`:** added a **capped late-game ramp** that only applies from Level 4 (`id >= 3`) — levels
  1–3 are completely unchanged. Two levers, both tunable via named constructor constants
  (`LATE_HP_PER_LEVEL`, `LATE_HP_CAP`, `LATE_COUNT_PER_LEVEL`, `LATE_COUNT_CAP`):
  - **Tankier enemies** — extra HP-scale per level past L3 in `spawnEnemy()`, capped (≈ +74% HP by
    L16+). Bosses ramp at **half rate** (they're already crisis-tuned) so they stay beatable.
  - **Bigger waves** — a per-level enemy-count multiplier in `startNextWave()`, capped at +60%. Boss
    spawners are **never** multiplied (so we can't accidentally spawn extra bosses).
- **Resulting curve** (normal enemy HP / wave size vs. the old values): L4 +5% / ×1.07 → L7 +19% /
  ×1.28 → L10 +36% / ×1.49 → L15+ +70-74% / ×1.60 (capped). The point: later levels now demand the
  full toolkit — multiple disciplines, specialisations, heroes, and battle items — instead of one
  spammed tower.
- **Verified live + tests:** L1–3 HP/wave-size identical to before; L4+ strictly tankier with bigger
  waves; bosses gentler and boss counts never multiplied; no console errors. Suite **53/53**
  (+2 ramp tests).

## 2026-06-04 — Battle items (RP consumables) + fix topic/exam selection resetting

**Bug: Topic/Exam kept resetting to "Yearly."** `populateTopicDropdown()` (index.html) rebuilds the
`#select-topic` options every time the level-select screen is shown and hard-set `yearly.selected =
true`, so a student's "Half-Yearly" choice was wiped each time they finished a level and returned.
Fixed by capturing the current selection before the rebuild and restoring it afterwards (falling back
to Yearly only when the prior value isn't valid for the chosen year). Verified live: selection now
survives repeated returns to level select.

**Feature: Realm-Defense-style battle items.** A new "Battle Items (spend RP)" section in the sidebar
lets players spend Research Points on consumables for the current level:
- **❄️ Cryo Field (30 RP):** freezes every enemy on screen for 3 s while towers keep firing
  (frosty screen vignette).
- **☄️ Meteor (25 RP):** aimed; massive true-damage in a large radius.
- **💣 Mini Bomb (12 RP):** aimed; cheap burst damage in a small radius.
- **🗡️ Mercenaries (35 RP):** aimed; drops 2 `SummonedMinion` blockers that fight for 18 s.
- **Implementation (`game.js`):** `BATTLE_ITEMS` table + `selectBattleItem`/`castBattleItem`/
  `renderBattleItems`. Instant items fire on click; targeted items reuse the hero-skill aim overlay
  (dimmed field, pulsing AoE ring, icon, "click to deploy · Esc to cancel" banner; right-click/Esc
  cancel). Each item has an RP cost + a cooldown (ticked in `update()`, shown as a sweep on the
  button). All costs/cooldowns are easy to tune.
  - `style.css`: `.item-bar` / `.item-btn` (2×2 grid, cooldown sweep, armed/unaffordable states).
- **Verified live:** item bar renders; Cryo freezes all enemies (+25 s CD); Meteor aim overlay shows,
  click deploys and hits only enemies in radius with true damage (+16 s CD); Mercenaries spawn; RP is
  spent and gated (insufficient RP / on-cooldown are no-ops). No console errors. Suite **51/51**
  (+3 item tests: cost/cooldown gating, radius damage + cryo freeze, mercenary spawn + aim mode).

## 2026-06-03 — Fix hero ability bar getting stuck hidden ("ability blocked")

Follow-up to the overlap fix below. Hiding the ability bar imperatively in
`showTowerUpgradeMenu`/`hideTowerUpgradeMenu` was fragile: **clicking a hero while a tower menu was
open** selected the hero and nulled `selectedTowerForUpgrade` but never called `hideTowerUpgradeMenu`,
so the bar stayed `display:none` (and a stale menu lingered) — the hero's ability was unreachable.

- **`game.js`:** the bar's visibility is now reconciled **every frame** in `renderHeroAbilityBar()`
  from the single source of truth: `bar.style.display = this.selectedTowerForUpgrade ? "none" : "flex"`.
  It can no longer get stuck — the instant no tower is selected (hero click, empty-ground click, sell,
  auto-hide) the bar reappears. Removed the brittle imperative toggles; `showTowerUpgradeMenu(tower)`
  now also sets `selectedTowerForUpgrade = tower`, and the hero-click path calls `hideTowerUpgradeMenu()`
  so the stale menu closes too.
- **Verified live:** open tower menu (bar hidden) → click hero → bar restored + menu closed + hero
  selected → press `1` → aim mode. No console errors. Suite **48/48** (+1 test asserting the bar is
  never stuck hidden when the tower is deselected by any path).

## 2026-06-03 — Fix tower upgrade menu overlapping the hero ability bar

At Level 3 the upgrade panel grows a specialization row (two branch buttons), and its right edge
collided with the bottom-centre hero ability bar — the second branch button (e.g. "Supernova Well")
was rendered *behind* a hero button (`#hero-ability-bar` had `z-index:5`, the menu had none), so it
couldn't be seen or clicked.

- **`style.css`:** `#tower-upgrade-menu` → `z-index: 20` (defensively above the ability bar).
- **`game.js`:** `showTowerUpgradeMenu()` hides `#hero-ability-bar`; `hideTowerUpgradeMenu()` restores
  it. The two contexts are mutually exclusive (managing a tower vs. casting an ability), so the bar
  simply steps aside while the menu is open — and `activateHeroAbility()`/clicking away both close the
  menu and bring the bar back.
- **Verified live:** the "Gravity Well (Level 3)" menu now shows both branch buttons fully (screenshot),
  bar hidden while open and restored on close; pressing a hero key closes the menu, restores the bar,
  and enters aim mode. No console errors. Suite **47/47** (+1 test for the bar hide/restore coupling).

## 2026-06-03 — Fix overlapping music (victory/defeat stinger bled into the next track)

Reported as "overlapping music in Level 7." Root cause was not level-specific: `playStinger()`
played the victory/defeat sting through a **local** Audio element and never stored it in
`this.music`. So when the player won a level and quickly hit Continue → next level, `_startMusic()`
paused the *old battle track* (already paused) but the **fanfare kept playing**, layered under the
new level's battle music until it finished on its own.

- **`js/audio.js`:** added `this._stinger` tracking + `_stopStinger()`. The sting is now stopped
  whenever new music starts (`_startMusic`), on `stopMusic()`, on mute, and before a new sting —
  guaranteeing music and stingers are mutually exclusive (only ever one track audible).
- **Verified live (reproduced then fixed):** before, `stinger → menu → battle_1` left
  `[battle_1, victory]` both playing; after, every step plays exactly one track; boss⇄battle
  switching stays single-track; `stopMusic()` leaves nothing playing. No console errors.
- **Test:** added an `Audio` stub to the headless harness + a regression test asserting the
  single-track invariant across stinger → menu → battle → boss → battle → stop. Suite **46/46**.

## 2026-06-03 — Hero ability aiming made obvious + tower upgrade panel auto-dismiss / confirm-sell

Two UX fixes from playtest feedback: abilities were hard to trigger (only a subtle cursor change
signalled aim mode) and the upgrade panel lingered until you clicked away, causing accidental sells.

**Hero abilities — one clear action: press → aim → click to cast.**
- `activateHeroAbility(index)` / `cancelSkillTargeting()` (`game.js`) centralize the flow; the
  ability-bar buttons call the former. Activating selects the hero AND enters aim mode in one step.
- **Keyboard shortcuts:** `1`–`4` trigger each hero's ability; `Esc` (or **right-click** on the
  board) cancels aim. Keys are ignored while a quiz input is focused.
- **On-canvas aim overlay** (render loop): dims the field, draws a pulsing dashed AoE circle at the
  cursor sized to the skill's real radius, a crosshair reticle, a dashed line from the casting hero,
  and a banner "🎯 [Hero]: [Skill] — click to cast · Esc to cancel". Each hero now carries a
  `skillRadius` (Einstein 140 / Newton 95 / Curie 110 / Darwin 55) matching its shockwave (`heroes.js`).

**Tower upgrade panel — auto-dismiss + sell guard.**
- `scheduleUpgradeMenuAutoHide()` / `cancelUpgradeMenuAutoHide()` (`game.js`): the panel auto-closes
  5 s after opening (2 s after the pointer leaves it), and stays open while hovered. `hideTowerUpgradeMenu()`
  now also clears `selectedTowerForUpgrade` so the range ring doesn't desync.
- **Confirm-sell:** the Sell button now arms on first click ("Confirm sell? (+NG)", red pulsing
  `.sell-armed` style in `style.css`) and only sells on a second click within ~2.6 s — so a stray
  click can't sell a tower.
- **Verified live:** `1` key → aim overlay (screenshot); click casts (cooldown set) and clears aim;
  Esc/right-click cancel; placing→clicking a tower opens the panel (auto-hide scheduled); hover cancels
  the timer, leaving reschedules it; the timer hides the panel + clears selection; first sell click
  arms without selling, second sells (+60G, panel hidden). No console errors. Suite **45/45** (+3 tests).

## 2026-06-02 — Procedural sound effects (heroes / towers / attacks)

Added unique per-event SFX, synthesized in-code with the Web Audio API — **no asset files**, so
there's nothing to download, license, or attribute, and every level is tunable from one knob.

- **`js/audio.js`** — the existing `audioManager` now also owns a Web Audio SFX engine:
  - A lazily-created `AudioContext` (built on the same first-gesture `unlock()` as the music) feeds
    a master SFX bus. White-noise buffer is generated once and shared.
  - **Data-driven recipes** (`SFX` table): each sound is one or more tiny synth "voices"
    (`wave`, pitch glide `f→to`, envelope, optional white-noise + biquad filter, layer delay).
  - **`playSfx(key)`** resolves dynamic keys with a family fallback: `tower_physics_fire` →
    exact, but `tower_barracks_fire` / `hero_curie_skill` / `enemy_spider_death` fall back to the
    base family (`tower_fire` / `hero_skill` / `enemy_death`). Unknown keys resolve to `null` and
    are silent. Per-key `minGap` throttling + a global 18-voice hard cap keep rapid fire (and 2×
    speed) from clipping; `pitchVar` randomizes pitch on frequent sounds for variety.
  - Distinct timbres per tower discipline (physics zap / chemistry blorp / biology pluck /
    astronomy woom / volcano rumble), per hero (Einstein crackle / Newton thud / Curie shimmer /
    Darwin whip), per projectile impact, plus place/upgrade/wave/quiz/levelup/death/respawn/base-hit.
- **Hooks (guarded with `if (window.audioManager)`):** tower fire + projectile hit (`towers.js`),
  hero attack/skill/levelup/death/respawn (`heroes.js`), enemy hit (`enemies.js`), enemy death /
  tower place / tower upgrade / wave start / quiz correct+wrong / base hit (`game.js`).
- **Levels (#3 balancing):** music `0.4`, stingers `0.6`, SFX master `SFX_VOL = 0.55` with
  per-recipe gains `0.06–0.25`. One master knob (`SFX_VOL`) for quick rebalancing on feedback.
- **Verified live:** AudioContext runs after a gesture; placing a tower → `tower_physics_place`,
  starting a wave → `wave_start`; 4 s of combat fired `tower_physics_fire`, `projectile_bullet_hit`,
  throttled `enemy_hit` (37 calls, throttled), and `enemy_flatearth_death` (→ `enemy_death` fallback);
  voices decayed back to 0; no console errors. Suite **42/42** (+3 SFX resolver tests; `audio.js`
  now loads in the headless harness too).

## 2026-06-02 — Fix sidebar/header clipping (right shop column + ABANDON button cut off)

The right edge of the HUD was being clipped: the second shop column (Astronomy/etc.) and the
hero-card HP text ran off the visible area.

- **Root cause:** the `.hud-sidebar` (`width:280px`) had the flex default `flex-shrink:1`, and
  `.game-viewport` (`flex:1`) had the flex default `min-width:auto`. The viewport's header
  content (4 stat boxes + 4 control buttons) has a min-content width wider than the 900px canvas,
  so the viewport refused to shrink and grew to ~989px, squeezing the sidebar down to ~177px and
  pushing its right edge past the fixed 1200px `#app-container` (clipped by `overflow:hidden`).
- **Fix (`style.css`):**
  - `.hud-sidebar` → `flex: 0 0 280px` so it always keeps its full width.
  - `.game-viewport` → `min-width: 0; overflow: hidden` so it can shrink to its flex allocation
    (≈908px) instead of overflowing and shoving the sidebar off-screen.
  - `.hud-header` trimmed (`padding 25px→12px`, `font-size 17px→15px`, tighter stat gaps,
    `white-space:nowrap` on stats) to recover the 62px the header was overflowing by, so the
    control row — including the red **ABANDON** button — fits the 900px width.
- **Verified live:** sidebar measures a full 280px and sits inside the 1240px container right edge;
  canvas (900px) fits the 908px viewport; header `scrollWidth == clientWidth` (overflow 0); the
  full control row and both shop columns render. Screenshot confirmed.

## 2026-06-02 — Music system (Kevin MacLeod / CC-BY tracks)

Added background music + win/lose stingers. Audio files (7 MP3s, CC-BY 4.0, attributed in
`assets/audio/CREDITS.md`) were downloaded via Antigravity from incompetech.com.

- **New `js/audio.js`** — `window.audioManager`: a small manager that loops menu/battle/boss
  tracks and plays one-shot victory/defeat stingers. Respects browser autoplay (nothing plays
  until the first pointer/key gesture → `unlock()`), `playMusic()` is idempotent (safe to call
  every frame), and mute persists to `localStorage` (`std_muted_v1`). Music vol 0.4, stingers 0.6.
- **`index.html`** — loads `audio.js` before `game.js`; `switchScreen` plays the menu theme on
  menu-type screens only (menu / level-select / meta / bestiary — NOT victory/defeat, so their
  stinger isn't stepped on); added a 🔊/🔇 **mute button** to the HUD (`toggleAudioMute`).
- **`game.js`** — `startLevel` picks a battle loop (`battle_${id%3+1}`); the update loop swaps to
  `boss.mp3` whenever a boss is on the field and back; `triggerVictory`/`triggerDefeat` fire the
  stingers. All calls guarded by `if (window.audioManager)` so headless tests are unaffected.

Verified live: menu→battle→boss→battle transitions, victory stinger ducks the loop, menu music
resumes on return, mute toggles + persists; no console errors; suite 39/39.

## 2026-06-02 — Hero active-skill buttons moved to a bottom-centre ability bar

The sidebar hero cards had grown too tall (level + HP + new XP bar + skill button),
cramping the active-skill button and clipping the second hero.
- **New `#hero-ability-bar`** (`index.html` + `style.css`): a bottom-centre overlay on the play
  area with one button per hero (name + skill + a cooldown/revive sweep), glowing when READY,
  disabled + "Reviving Ns" when the hero is down. Clicking enters skill-targeting (same flow as
  the old card button). Container is `pointer-events:none` so gaps pass clicks to the canvas.
- **`game.js`**: `renderHeroAbilityBar()` builds once per roster size and refreshes dynamic
  state; called from `updateSidebarUI()` and every frame in the render loop for a smooth sweep.
  The sidebar hero cards are now slim info-only (name/level/HP/XP), and clicking a card just
  selects the hero. Verified live (2-hero level): both ability buttons render/READY, clicking
  arms skill-targeting, dead hero's button disables with revive countdown. Suite 39/39.

## 2026-06-02 — Bigger towers/heroes + higher-contrast build pads (readability)

With painted backgrounds now in, sprites read too small and pads were hard to spot.
- **Towers**: base `Tower.size` 48 → 64 (`towers.js`), matching the 64px sprite cell.
- **Heroes**: `Hero.size` 38 → 54; summoned blocker (tortoise) multiplier 1.3 → 1.8 (`heroes.js`).
- **Selection/hover tolerances** scaled up to match (`game.js`: tower hover 18→26, hero click
  20→28, tower click 20→30).
- **Build pads**: redrawn with a dark backing disc + brighter dashed ring (idle white 0.5,
  active green) + a centre "+" marker, radius 16 → 20, so empty pads stay readable over the
  painted terrain (`game.js` render). Verified live in-browser; regression suite 39/39.

## 2026-06-02 — TD-comparison gaps: targeting toggle, between-wave quiz, hero XP + death/respawn

Implemented three improvements from `docs/td-comparison-report.md` (Gaps 4, 1, 2), plus a
requested change making heroes mortal. Verified: `node --check` clean; regression suite
**39/39** (4 new tests); and a **live browser run** confirming all three in-game (targeting
button cycles, Solve-to-Rush prompt during countdown, hero leveling glow + death "REVIVING"
state). The painted level backgrounds are also back — Antigravity's hardened re-prompt
delivered real art (e.g. a detailed lab scene), which the existing wiring picked up.

### Added

**Gap 4 — Between-wave "Solve to Rush" + rarer in-wave bubbles.**
- `game.js`: `triggerRushQuestion()` / `solveRushAnswer()` + `window.submitRushAnswer`/`solveRush`.
  During the between-wave countdown a "Solve to Rush" button (`index.html`) launches a syllabus
  question; correct → calls the wave early with **double** early-call gold + heals heroes/summons;
  wrong → no penalty, countdown resumes. In-wave bubble spawn interval roughly doubled
  (`isWaveActive ? 900 : 420` frames) to cut mid-combat cognitive load.

**Gap 1 — Player-controlled targeting toggle.**
- `towers.js`: `Tower.cycleTargetMode()` over `first/strongest/weakest/closest` (modes already
  honored by `findTargets`). `game.js`: a 🎯 Target button in the upgrade menu (hidden for the
  Barracks; disabled when the Range upgrade's "prioritize far" overrides targeting). `style.css`:
  `.target-mode-btn`.

**Gap 2 — In-level hero XP + leveling, and mortal heroes.**
- `heroes.js`: heroes gain XP from nearby kills, level 1→5 (`addXp`/`levelUp`), scaling damage
  (×1.15/level) and max HP (×1.12/level); on-canvas purple XP bar + `Lv` badge + glow ring at
  L3+. Replaced the old never-die/self-heal with real death: at 0 HP a hero dies (tombstone +
  countdown), and **respawns at the base after 12s** at full HP, **keeping level + XP**.
  `moveTo`/`useActiveSkill`/selection all guard the dead state.
- `game.js`: awards XP to in-range living heroes on each kill; sets `respawnPoint` to the base;
  HUD shows level, an XP bar, and a "Reviving (Ns)" state.

## 2026-06-02 — Build pads off-path, spawn portal + defended base, bad backgrounds rejected

Playtest feedback pass: towers could be built on the road, levels had no sense of
direction or anything to defend, and the AI-"painted" backgrounds were actually
procedurally-drawn gradients. Verified: `node --check` clean on `game.js` / `levels.js`;
`node tests/bug-regression.test.js` **35/35** (added a pad-on-path test); and **live
browser run** — confirmed the spawn portal, the base + its integrity bar/shield reacting
to lives (full→red as lives dropped), the procedural background fallback, and pads clear
of the road.

Also fixed the **preview server**: `python -m http.server` fails here (iCloud-path
sandbox blocks `getcwd()`), so `.claude/launch.json` now runs `_preview_server.js`, a tiny
Node static server that serves from `__dirname` (no `getcwd`). `node _preview_server.js`
on port 5180 — safe to delete, ships nothing to the game.

### Fixed

**1. Towers could be placed on the path.** Placement was already pad-snapped, but 10 of
the 20 levels had authored `buildSpots` overlapping the road.
- **Where:** `js/game.js` → `startLevel()` (pad filter), `placeTower()` (guard), new
  `PATH_CLEARANCE = 34`.
- **Fix:** `startLevel` drops any pad within `PATH_CLEARANCE` of the path (reusing the
  existing `isNearPath()` point-to-segment helper); `placeTower` also rejects an on-road
  pad defensively. Every level retains ≥8 pads (verified across all 20).

### Added

**2. Spawn portal + defended base (level direction & stakes).**
- **Where:** `js/game.js` → `startLevel()` (computes `_spawnPoint` / `_basePoint` by
  clamping the off-screen first/last waypoints inside the canvas; tracks `maxLives`,
  `baseHitAt`), render branch (draw calls), `reachedEnd` handler (impact feedback);
  `js/levels.js` → `LevelManager.drawSpawnPortal()` and `LevelManager.drawBase()`.
- **What:** A pulsing rift portal marks where enemies emerge; a base/lab structure sits
  at the path end with an integrity bar + shield bubble that fade with `lives/maxLives`,
  showing cracks <60%, flames <30%, and rubble + smoke at 0. A leak flashes the base red
  and spawns an impact burst. All procedural canvas art (no PNG dependency).

### Removed

**3. Procedurally-drawn level backgrounds (rejected).** The 20 `assets/levels/*.png`
Antigravity produced were flat Pillow/gradient images (e.g. `lab.png` = blueprint grid,
`volcanic.png` = brown gradient + 2 bars), not the painted scenes requested — Nano Banana 2
image-gen was bypassed. Moved them to `_rejected_level_art/` (recoverable) so the game
falls back to the procedural `bgColor` + scenery until real painted art is generated. See
`docs/SPRITE_GENERATION_PROMPT.md` Batch 4 for the hardened re-prompt.

## 2026-06-02 — Animated enemies + per-level painted backgrounds (art wiring)

Extended the sprite-sheet system (added earlier today for heroes & towers) to cover
**enemies** and **level backgrounds** — the two categories the original spec left
untouched. Both are **purely additive fallbacks**: with no art files present the game
renders exactly as before (enemies → procedural vector cartoons, levels → `bgColor`
wash + scenery), so art drops in piecemeal without breaking anything. Generation
prompts for both batches are in `docs/SPRITE_GENERATION_PROMPT.md` (Batch 3 & 4).

### Added

**1. Animated enemy walk strips.**
- **Where:** `js/game.js` → `buildSheetMeta()` IIFE (manifest + `SHEET_META`);
  `js/enemies.js` → `Enemy.draw()`.
- **What:** Each enemy gets one looping `walk` strip at `assets/enemies/<key>_walk.png`.
  Regular creeps use 64×64 cells (6f, 10fps); the 5 bosses use 128×128 cells (6f, 8fps).
  `Enemy.draw()` now routes through `window.drawSprite(...,"walk",...)`
  (strip → static `enemy_<key>` → procedural vector fallback). Defeat keeps the existing
  squash + particle burst — no death anim, by design (enemies are always moving, so a
  single walk cycle is all they need).
- **22 keys:** flatearth, phlogiston, spontaneous, maggot, alchemy, perpetual, geocentric,
  miasma, caloric, aether, vitalism, humours, creationist, homunculus, homunculus_core,
  golem, golem_molten + bosses boss_geo, boss_phlog, boss_aether, boss_miasma, boss_entropy.

**2. Per-level painted terrain backgrounds.**
- **Where:** `js/game.js` → `buildSheetMeta()` (manifest) + the `"playing"` render branch.
- **What:** Each level id registers `bg_level_<id>` → `assets/levels/<theme>.png`
  (20 themes, in `LEVEL_DATA` order). The render loop draws the painted image scaled to
  900×550 when present, else falls back to the procedural `bgColor` fill + `drawScenery`.
  The winding path and build pads are still drawn on top in code, so the art is plain
  themed terrain that never has to match exact waypoints.

### Verified
- `node --check` clean on `game.js` / `enemies.js`; `node tests/bug-regression.test.js` **34/34**.
- Browser preview could NOT be launched here — `python -m http.server` fails with a
  `PermissionError` because the project sits in an iCloud-synced folder
  (`com~apple~CloudDocs`). Change is a visual no-op until art lands, so no rendering
  regression is observable yet regardless.

## 2026-06-02 — Animated sprite-sheet rendering for heroes & towers

Replaced the static whole-image blit (which couldn't show animation) with a frame-based
sprite-sheet system, so AI-generated art (Nano Banana 2, produced in Antigravity) plays
idle / walk / attack animations. Art = single-row horizontal strips, 64×64 cells.
Full art spec + the generation prompt live in `docs/SPRITE_GENERATION_PROMPT.md`.

### What changed
- **Frame-slicer + metadata** (`game.js`): added `window.SHEET_META` (built by an IIFE that
  also injects all 38 sheet paths into `ASSETS_MANIFEST`) and `window.drawSprite(ctx, baseKey,
  state, dx, dy, dw, dh, attackStart)`. It draws ONE frame via the 9-arg `drawImage` (looping
  for idle/walk, one-shot holding the last frame for attack). **Why:** the old code did
  `drawImage(img, x, y, size, size)` on the whole PNG every frame — a sprite sheet would just
  render squashed. **Fallback chain:** `state sheet → idle sheet → static image → procedural
  vector`, so partially-delivered art never breaks the game.
- **Heroes** (`heroes.js`): track `faceLeft` (from movement/target x) and `_lastAttackTime`;
  new `getAnimState()` returns `attack` (for the attack-anim duration) / `walk` / `idle`;
  `Hero.draw()` and `SummonedMinion.draw()` (tortoise) now call `drawSprite`, mirroring
  horizontally (`scale(-1,1)` about sprite centre) when facing left since art is RIGHT-facing.
  Heroes are 64-cell strips: idle 4f, walk 8f, attack 6f (tortoise has idle+walk only).
- **Towers** (`towers.js`): stamp `_lastFireTime` on firing (base `Tower.update` + `VolcanoTower.update`);
  `Tower.draw()` plays the per-tier (`1/3/4`) attack strip briefly after firing, else idle.

### Art status (2026-06-02)
- Heroes: **14/14 sheets done** (Einstein, Newton, Curie, Darwin animate; tortoise idle+walk).
- Towers: **9/24** — Physics complete (all tiers idle+attack); Chemistry partial (t1 done, t3 idle
  only, t4 pending); Biology & Astronomy pending → still procedural. Enemies stay procedural.
- Remaining 15 tower sheets auto-activate on drop into `assets/towers/` (no code change needed).
- Volcano & Barracks towers not yet in the art set → procedural.

### Verified
- `node --check` clean on game.js / heroes.js / towers.js; `node tests/bug-regression.test.js` **34/34**.
- In-browser: rendered every loaded sheet through the real `drawSprite()` and screenshotted —
  confirmed correct single-frame slicing, distinct idle/walk/attack poses, working left-mirror,
  and Physics idle-vs-attack frames.

---

## 2026-06-01 — Feedback pass 2: syllabus accuracy, balance depth, progression

Driven by a second round of playtest feedback + a TD design-research pass
(`docs/td-design-research.md`, generated by web research on Kingdom Rush / Bloons / Realm
Defense balancing).

### Curriculum accuracy
- **Corrected topic ORDER to match the NSW Junior Science Syllabus** (`questions.js` `TOPIC_META`).
  The half-yearly (topics 1–2) was wrong (it included Year 8 "Change"). Correct order now:
  Y7 Universe→Forces→Cells→Solutions · Y8 Living Systems→Periodic Table→Change→Data Science 1 ·
  Y9 Energy→Diseases→Materials→Environmental Sustainability · Y10 Genetics→Reactions→Waves→Data Science 2.
- **Regenerated all ~891 questions from the actual topic booklets** (`Teaching - Subjects/Junior
  Science/Topic Booklets`) + syllabus dot points, calibrated to each year's real difficulty
  (fixes "some questions too hard for Year 8").

### Balance — fixes "one tower clears everything" (research-driven)
- **Placement limit**: max 3 of any one tower type per map (`game.js` `placeTower` + `MAX_PER_TYPE`).
- **Anti-stack diminishing returns**: clustering same-type towers cuts their damage up to 50%
  (`recomputeStackPenalties`; towers multiply output by `this.stackPenalty`).
- **HP now scales with wave number within a level** (not just level id), so late waves bite.
- **Leak pressure**: a mini-boss leaking costs 10 lives, the final boss 20 (`game.js`).
- **Distinct tower roles & ranges** (`towers.js`): Physics sniper (long/slow), Biology rapid
  (short/fast), Chemistry splash, Astronomy slow-support, Volcano magma — so range/speed/damage
  aren't interchangeable.

### Interesting upgrade choices (fixes "everyone picks +Attack")
- **Each upgrade now carries a unique mechanic**, not just a stat: +Damage → armor-pierce;
  +Range → diminishing range + "target furthest"; +Attack Speed → slow-on-hit. (`towers.js`)

### New content & progression
- **Barracks tower** (`towers.js`): deploys 3 melee troops that physically block the path
  (re-using the `SummonedMinion` blocker), with two specializations.
- **Progressive unlocks** (`game.js`): levels 1–3 restrict you to 2 tower types + the first
  upgrade only; towers and upgrade tiers (incl. specialization) open up as you advance.
- **Level locking + scrollable 20-level select** (`game.js` `renderLevelCards`, `style.css`):
  a level unlocks only after the previous is beaten; the grid now scrolls.

### UI fixes
- **Challenge-question text overlap** fixed (`style.css` `.opt-btn` auto-height/flex/wrap;
  `.question-container` max-height + scroll).

---

## 2026-06-01 — Gameplay feedback overhaul (12 items)

A large pass responding to playtest feedback, built with parallel Sonnet subagents for the
content-heavy pieces (891 NSW questions, 20 levels, expanded enemies/heroes/towers) and
hand-integrated through `game.js`/`index.html`/`style.css`.

### Curriculum & menu (feedback #9, #10)
- **Removed the Custom Question Manager** (`screen-creator`) entirely (#9). Questions are now a
  static, offline NSW Science 7–10 bank.
- **New question system** (`js/questions.js` + `js/questions-y7..y10.js`): `window.QUESTION_BANK`
  keyed by year group → topic, with `window.TOPIC_META` defining the 4 syllabus topics per year.
  **891 multiple-choice questions** generated (Y7 220, Y8 221, Y9 225, Y10 225 — 55+ per topic).
- **Main menu** (#10): "Discipline Focus / Grade Level" replaced with a **Year Group** dropdown
  (7–10) and a **Topic / Exam** dropdown that rebuilds per year and includes the 4 topics plus
  **Half-Yearly Exam** (topics 1–2) and **Yearly Exam** (all topics). `QuestionManager.setSelection`.

### Difficulty & pacing (feedback #1, #2)
- **Call Wave button now works during an active wave** (#2): it "rushes" the next wave on top of
  the current one (Realm-Defense overlap) for a gold bonus instead of being disabled.
  (`game.js` `callOrStartWave`/`startNextWave(append)`/`refreshWaveButton`.)
- **Higher difficulty** (#1): enemy base HP raised ~2.2× with steeper scaling, denser waves across
  the new 20-level campaign, plus the wave-overlap pressure above.

### Enemies, bosses & wiki (feedback #3, #6)
- **More enemy variety + multistage transformers** (#3): new misconception enemies and two
  shed-the-shell transformers (tanky → fast core on reaching 0 HP). Five bosses (mini-boss every
  5 levels; level 15 has two; level 20 is the final boss).
- **Encounter-gated Bestiary** (#6): `screen-bestiary`, `game.js` `renderBestiary` +
  `recordBestiaryEncounter`, entries unlock on first encounter (persisted in `localStorage`).

### Towers (feedback #7, #8)
- **New Volcano (Earth Science) tower** (#7): spews expanding magma waves (ground AoE + burn).
- **Meaningful upgrade choices** (#8): each tower offers **+Attack / +Range / +Attack Speed**
  instead of a single damage bump (`getUpgradeOptions`/`applyUpgradeOption`), and **per-tier
  visuals** so towers visibly grow/glow at levels 2, 3, and when specialized — all procedural, no
  art assets required.

### Levels & heroes (feedback #5, #11, #12)
- **20 themed levels with longer, winding paths** (#5, #11) replacing the old 3; dynamic
  level-select cards with boss markers + a boss health bar.
- **Richer heroes** (#12): every hero now has a named **passive** plus a rotation of **3 normal
  attacks** in addition to their existing active ability.

### Verified
- Regression harness extended to **29/29** (registry, multistage transform, damage/range/speed
  upgrade cap, Volcano tower, wave-overlap rush, 20-level/boss layout, year/topic selection).
- Live browser run (no console errors): all screens render; placed/upgraded towers incl. Volcano;
  ran a 1200-frame stress wave with all 15 enemy types + a boss + 2 heroes with no errors; boss
  health bar, Rush-Next-Wave button, Research Lab button, Bestiary unlocks, and the 20-level
  select with boss markers all confirmed.
- Implementation note: gameplay logic and procedural visuals only — **no image assets required**;
  PNGs remain optional fallbacks.

---

## 2026-06-01 — Realm Defense mechanics, Phases 3 & 4: build pads + meta-progression

Implemented fixed build pads and the star/permanent-upgrade meta layer. Verified with the
regression harness (22/22) and a live browser run (pad snapping/rejection, star award +
persistence, meta buy/apply/persist/reset, all UI screens render correctly).

### Added — Phase 3: fixed build pads
- `buildSpots` arrays (~10 per level) in `levels.js`; towers now snap to the nearest free
  pad (`findFreePadNear`), mark it occupied, and free it on sell. Off-pad clicks are rejected.
- Pads render as dashed markers (brighter green while placing); the ghost preview snaps to and
  highlights the target pad. (`game.js` `placeTower` + draw loop.)

### Added — Phase 4: stars + permanent upgrades
- **Star ratings** on victory (3★ ≥18 lives, 2★ ≥10, 1★ survived), best-per-level persisted in
  `localStorage` (`std_stars_v1`) and shown on the victory screen and level-select cards.
- **Lab Bench** meta screen (`index.html` `#screen-meta`, `style.css`, `game.js`
  `renderMetaScreen`): spend Stars on 5 permanent upgrades (tower damage, hero HP, starting
  gold, starting lives, RP gain), 3 ranks each, 1★ per rank, with a full reset/refund.
  Persisted in `localStorage` (`std_meta_v1`).
- Multipliers applied globally: `window.SCI_TOWER_DMG_MULT` (read by every tower's `fire`),
  `window.SCI_HERO_HP_MULT` (read by the `Hero` constructor), plus starting gold/lives and an
  RP-gain multiplier applied in `startLevel` and at every RP source.

### Fixed (pre-existing)
- **Overlay screens after `#screen-playing` in the DOM (victory, defeat, creator) rendered
  below the fold.** `#screen-playing` is permanently `position:relative` (in flow), and
  `.screen.active` also forced `position:relative`, so any later screen stacked beneath the
  605px-tall playing screen. Changed `.screen.active` to `position:absolute` so overlay screens
  layer at the top-left; `#screen-playing` keeps `relative` via higher ID specificity, so
  gameplay layout is unchanged. (`style.css`)

### Tests
- Five new regression checks (build pads defined, pad snap/occupy/reject, star thresholds +
  persistence, meta spend/apply/reset, hero-HP upgrade), plus a `localStorage` stub in the
  harness. Total: 22/22.

## 2026-06-01 — Realm Defense mechanics, Phase 2: tower specialization + quiz gate

Replaced the single RP "Ultimate" with a Realm Defense World-6-style **two-branch
specialization fork**, gated by the revision quiz (the educational core loop). Verified with
the regression harness (17/17) and a live browser run (branch unlock blocked without RP,
question presented, correct answer specializes + spends RP, wrong answer costs nothing).

### Added
- **Tower branches** (`towers.js`): each tower exposes `branchInfo()` (two named specializations)
  and `chooseBranch(key)` replacing `upgradeUltimate()`. `fire()` reads `this.branch`:
  - Physics → Chain Storm (8 jumps, wide) vs Railgun (single armor-piercing burst, `true` damage).
  - Chemistry → Corrosion (potent long armor-melt) vs Detonation (huge splash + burst).
  - Biology → Swarm Bloom (3 simultaneous targets) vs Toxin (heavy long poison).
  - Astronomy → Singularity (strong pull/slow) vs Supernova (2× AoE burst).
- **`'true'` piercing damage type** (`enemies.js`) that ignores armor (used by Railgun).
- **Quiz-gated unlock** (`game.js`): choosing a branch costs RP **and** requires correctly
  answering a question of that tower's discipline (`QuestionManager.getQuestionByTopic`).
  New `attemptBranchUnlock` / `triggerBranchQuestion` / `solveBranchAnswer` flow with its own
  `submitBranchAnswer` / `closeBranchModal` global handlers; wrong answers spend nothing.
- **Branch-choice UI** (`game.js`, `style.css`): the upgrade drawer shows two `.branch-btn`
  options at Level 3 with the RP+quiz requirement, and the locked-in specialization at Level 4.
- Five new regression tests (branch metadata, chooseBranch gating, Railgun armor-pierce,
  RP+quiz gate, wrong-answer no-op).

## 2026-06-01 — Realm Defense mechanics, Phase 1: in-battle feel

Implemented the first phase of the Realm Defense overhaul (see
`docs/superpowers/specs/2026-06-01-realm-defense-mechanics-design.md` and
`docs/realm-defense-analysis.md`). Verified with the regression harness (12/12) and a live
browser run (no console errors; lives dropped to 15 with minimal towers, matching the
intended difficulty curve).

### Added
- **Enemy trait system** (`enemies.js`): `flying`, `armored`, `shielded`, `healer`, `fast`.
  - `takeDamage(amount, type)` now resolves a counter web — armored halves physical/energy,
    takes 75% magic, full acid; shielded absorbs chip damage until one hit ≥25 cracks it.
  - Healer enemies periodically restore HP to nearby wounded allies.
  - Trait assignments: Flat Earth → armored, Phlogiston → fast, Alchemy → healer,
    Perpetual Motion → shielded.
  - **New flying enemy** "Geocentric Myth" — only anti-air towers can hit it.
- **Tower counter web** (`towers.js`): each tower has `canHitAir` + `damageType`.
  Physics=energy (anti-swarm/air), Chemistry=acid + ground-only (armor counter),
  Biology=physical (anti-air darts), Astronomy=magic (control). `findTargets` and AoE/splash
  now skip flyers for ground-only towers.
- **2× fast-forward** (`game.js`, `index.html`): a speed toggle that runs the fixed-step
  simulation twice per frame (exact, since all timers are frame-based).
- **Between-wave countdown + Call Wave Early** (`game.js`, `index.html`): waves auto-advance
  on a ~12s timer; the wave button calls the next wave early for a gold bonus (8g/sec skipped)
  and heals heroes + summoned blockers at each wave start.
- Flying enemies added to all 3 levels' later waves and the endless generator so anti-air
  matters.
- Six new regression tests covering the counter web, shield mechanic, air-targeting, healer,
  early-call bonus, and speed toggle.

---

## 2026-06-01 — Bug-fix audit (full code review)

A complete audit of all source files was performed (`game.js`, `towers.js`,
`enemies.js`, `heroes.js`, `levels.js`, `particles.js`, `questions.js`, `index.html`,
`style.css`). Each bug below was first **reproduced** with a Node test harness that
stubs the browser environment (`tests/bug-regression.test.js`), then fixed, then the
harness was re-run to confirm the fix. All 6 checks pass; every JS file passes
`node --check`.

Re-run the regression tests any time with:

```
node tests/bug-regression.test.js
```

### Fixed

**1. [CRITICAL] Victory & Defeat screens were blank, and replaying a level showed a blank screen.**
- **Where:** `js/game.js` → `triggerVictory()` / `triggerDefeat()`; `index.html` → `switchScreen()`.
- **Root cause:** Screens are shown/hidden in CSS via the `.screen` / `.screen.active`
  classes (opacity + position), *not* via `display`. But `triggerVictory`/`triggerDefeat`
  set `screen-victory`/`screen-defeat` to `style.display="flex"` without adding `.active`,
  so they stayed at `opacity:0` (invisible), and set `screen-playing` to
  `style.display="none"`. That inline `display:none` then survived into the next
  `launchLevel`, overriding `.active` and leaving the playing screen blank on every
  subsequent run.
- **Fix:** `triggerVictory`/`triggerDefeat` now populate their details and call
  `switchScreen(...)` (the real screen-switcher). `switchScreen` now also clears any
  stale inline `display` on every screen so `.active` always wins.

**2. [load error] Uncaught `ReferenceError: drawPixelSprite is not defined` on every page load.**
- **Where:** `js/heroes.js:738`.
- **Root cause:** Leftover line `window.drawPixelSprite = drawPixelSprite;` from the old
  pixel-art version — that function no longer exists. It threw on every load (last line
  of the file, so classes above it still registered, but the console error fired every time).
- **Fix:** Replaced with `window.drawRoundedRect = drawRoundedRect;` — the helper that
  *is* defined in this file and is actually used cross-file by `enemies.js`.

**3. [latent crash] "Closest" tower targeting would freeze the game.**
- **Where:** `js/towers.js:250`.
- **Root cause:** The `closest` sort comparator computed `Math.hypot(a.x - this.x, e.y - this.y)`
  — `e` doesn't exist in that scope (typo for `a.y`). When two-or-more enemies are in
  range it throws inside `Array.sort`, which propagates out of the game loop and stops
  `requestAnimationFrame` (full freeze). Currently latent because no UI sets a tower's
  target mode to `closest`, but it was a landmine for when targeting controls get added.
- **Fix:** `e.y` → `a.y`.

**4. [visual] Enemies near Curie flickered / stayed squashed flat.**
- **Where:** `js/enemies.js` → `Enemy.takeDamage()`.
- **Root cause:** Every hit sets the squash-and-stretch recoil (`squashX=1.35, squashY=0.65`).
  Curie's passive aura calls `takeDamage(0.35)` *every frame* on nearby enemies, so the
  recoil re-triggered each frame faster than it could ease back — the sprite looked
  permanently squished. (Poison ticks had a milder version of the same.)
- **Fix:** Only trigger the squash recoil when `finalDamage >= 1`, so real tower/hero hits
  still feel juicy but sub-1 damage-over-time / aura ticks don't.

### Observations (NOT changed — flagging for your decision later)

- **Missing art assets are expected.** `ASSETS_MANIFEST` (game.js) and the CSS menu/level
  backgrounds point at `assets/ui/fantasy_bg.png` and per-entity PNGs that don't exist yet,
  so everything falls back to the procedural "cartoon vector" drawing (by design). The menu
  and level-select screens currently show only their gradient (no background image). The one
  art file present is `assets/retro_menu_bg.png`. This is part of the art work you're planning.
- **Heroes can reach 0 HP but never die** (they slowly self-heal when not blocking). Looks
  intentional, so left as-is — flag if you want heroes to be defeatable.
- **Tower target-mode has no UI.** Only `"first"` is ever used; `strongest`/`weakest`/`closest`
  exist in code but aren't selectable. A feature to add, not a bug.
- **Curie's ultimate uses `setTimeout`**, so its delayed damage ticks keep firing even while
  the game is paused. Minor; left as-is.
