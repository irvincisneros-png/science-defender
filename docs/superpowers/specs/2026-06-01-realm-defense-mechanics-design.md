# Spec: Realm Defense mechanics for Science Tower Defense

**Date:** 2026-06-01
**Status:** Complete — all 4 phases implemented & verified (22/22 tests, live browser run)
**Companion:** `docs/realm-defense-analysis.md` (research reference)

## Goal

Make Science Tower Defense's gameplay match Realm Defense, scoped to:
- **In-battle feel** (call-wave-early, 2× speed, enemy trait counters, tower branch forks)
- **Light meta-progression** (1–3 star ratings + permanent star-spent upgrades, no grind)
- **Fixed build pads** (authored build spots, not free placement)
- **Quiz as the core loop** (Research Points from questions are the knowledge currency that
  unlocks tower specializations and hero upgrades; Stars are the separate performance currency)

Keep the existing 3 levels and the cartoon-vector art (no new PNG assets required).

## Currency model (the core coupling)

- **Gold** — in-battle only, per kill, builds/upgrades towers. Unchanged.
- **Research Points (RP)** — *knowledge currency*. **Primary source = correct quiz answers.**
  Spent in-battle on tower specialization branches and hero ability upgrades. A small amount
  still drips from wave clears so non-quiz players aren't fully blocked.
- **Stars** — *performance currency*, 1–3 per level, persisted. Spent on permanent global
  upgrades. Resettable at no cost (RD-style).

## Tower archetypes & counter web

Re-cast the 4 existing towers to map onto RD archetypes; identities unchanged.

| Tower | Archetype | Hits air | Counters | Weak vs |
|---|---|---|---|---|
| Physics (Tesla chain) | Ranged / anti-swarm | yes | swarm, flying | armored |
| Chemistry (acid splash) | AoE splash + armor-melt | no (ground) | armored, groups | flying |
| Biology (spore darts) | Cheap rapid / anti-air | yes | flying, fast | shielded |
| Astronomy (gravity well) | Support / control | yes | healers, all (slow) | low DPS |

Blocking stays with heroes + Darwin's tortoise summon (mobile barracks). A dedicated barracks
tower is explicitly out of scope (future option).

## Enemy traits (new)

Add boolean/strategy flags to `Enemy`: `flying`, `armored`, `shielded`, `healer`, `fast`.
Damage resolution in `takeDamage` accounts for `armored` (physical resist) and `shielded`
(damage gated until a single big hit cracks the shield). Towers check `flying` before
targeting (Chemistry cannot hit flyers).

Mapping:
- **Flat Earth** → armored (weak to Chemistry acid melt)
- **Phlogiston** → fast swarm
- **Spontaneous** → spawner (existing split behaviour)
- **Perpetual Motion** → shielded (already slow-immune)
- **Alchemy** → healer (heals nearby enemies; priority kill)
- **NEW flying type** (e.g. "Geocentric Myth") → flying, so anti-air matters

## Tower branching (World-6 fork)

Replace the single RP-gated "Ultimate" (level 4) with a **2-way specialization choice** at
max standard tier. Each discipline gets two named branches, e.g.:
- Physics → **Chain Storm** (more jumps, wider chain) vs **Railgun** (single-target burst, armor-pierce)
- Chemistry → **Corrosion** (stronger/longer melt) vs **Detonation** (bigger splash + burst)
- Biology → **Swarm Bloom** (faster fire, multi-dart) vs **Toxin** (heavy poison DoT)
- Astronomy → **Singularity** (stronger pull + slow) vs **Supernova** (AoE burst damage)

**Educational gate:** unlocking a branch requires (a) enough RP **and** (b) answering a
question of that discipline correctly. Tower gains a `branch` field; `fire()` reads it.

## In-battle feel

- **Between-wave countdown + Call Wave Early.** Wave 1 starts manually (build phase). After a
  wave clears, a countdown (e.g. ~12s) auto-starts the next wave. A "Call Wave" button starts
  it early and grants a gold bonus proportional to remaining countdown; calling also heals
  heroes and summons. Replaces the current manual-only "Start Next Wave".
- **2× speed toggle.** `gameSpeed ∈ {1,2}`. At 2×, run the fixed-step `update()` twice per
  rAF (all timers are frame-based, so this is exact). Button in the HUD.

## Fixed build pads

Add `buildSpots: [{x,y}]` (~8–12 per level) to each `LEVEL_DATA` entry. Placement:
- Render pads as faint markers when a tower type is selected.
- Click snaps to the nearest free pad within a radius; reject if occupied or none near.
- Ghost preview highlights the target pad.
Replaces the current "anywhere off-path" check in `placeTower`/`isNearPath`.

## Light meta-progression

- **Star rating on victory:** 3★ = ≥18 lives remaining, 2★ = ≥10, 1★ = survived (>0).
  Persist best stars per level id in `localStorage` (`std_stars_v1`).
- **Permanent upgrade screen:** new screen reached from level select. Spend *total earned
  stars* on global boosts, each with a few ranks:
  - Tower damage +5%/rank
  - Hero max HP +8%/rank
  - Starting gold +25/rank
  - +1 starting life/rank
  - RP gain +10%/rank
  Persist allocation in `localStorage` (`std_meta_v1`). **Reset button** refunds all stars.
  Boosts are applied at `startLevel` and on tower/hero construction.

## Files touched

- `js/game.js` — wave timer/call-early, 2× speed, pad placement, star award, meta-boost
  application, RP-from-quiz wiring, branch-unlock flow.
- `js/towers.js` — `branch` field, two `fire()` variants per tower, branch metadata.
- `js/enemies.js` — trait flags, armored/shielded damage math, new flying enemy class.
- `js/heroes.js` — apply meta HP boost; RP-gated active-skill upgrade hook.
- `js/levels.js` — `buildSpots` per level; new enemy in spawn switch; pad rendering helper.
- `index.html` / `style.css` — speed button, call-wave button, branch-choice UI, meta screen.
- `tests/bug-regression.test.js` — extend with trait math, star thresholds, speed-step,
  pad-snap, branch gating.

## Phasing (each independently testable in-browser)

1. **In-battle feel** — 2× speed, wave countdown + call-early, enemy traits + counter web,
   new flying enemy.
2. **Tower branch fork** — two specializations per tower + discipline-question unlock gate.
3. **Fixed build pads** — level `buildSpots` + placement rewrite + pad rendering.
4. **Meta-progression** — star award + persistence + permanent upgrade screen + reset;
   finalize RP-as-core-currency wiring.

## Test / acceptance per phase

1. Speed toggle visibly doubles pace; calling a wave early adds gold and heals heroes;
   Chemistry cannot damage the flying enemy while Biology/Physics/Astronomy can; armored enemy
   takes reduced Physics damage but full Chemistry damage.
2. A maxed tower presents two branch buttons; selecting one requires a correct discipline
   question + RP and changes firing behaviour.
3. Towers can only be placed on pads; occupied/empty-space clicks are rejected with feedback.
4. Victory shows 1–3 stars by lives left; stars persist across reload; spending stars on a
   boost measurably changes the next run; reset refunds.

## Out of scope

Hero awakening/leveling economy, multiple currencies/gacha, new worlds, new PNG art,
dedicated barracks tower, bosses with HP-phase behaviour (possible later).
