# Science Defender — Visual Overhaul Plan

**Date:** 2026-07-11
**Status:** Completed and verified 2026-07-12; see `completion-audit-2026-07-12.md`
**Primary reference:** Realm Defense, observed on the connected iPhone, used as a quality/readability benchmark only

## Outcome

Turn the current desktop-oriented prototype into an original, polished science-fantasy tower-defense game with:

- smooth diagonal and curved routes shared by road rendering and enemy movement;
- readable 2.5D battlefield depth, strong entrances/exits, and integrated build pads;
- one coherent illustrated-science visual language;
- a responsive iPhone-landscape interface with safe-area-aware touch controls;
- consistent production-quality enemies, towers, heroes, icons, and effects;
- predictable 60 Hz simulation and mobile-friendly loading.

The overhaul should learn from Realm Defense's clarity, layering, route rhythm, tactile controls, and visual hierarchy without copying its assets, characters, map compositions, icons, HUD, or exact styling.

## Audit baseline

- All 20 routes contain only horizontal and vertical segments: 225 orthogonal segments, zero diagonals.
- The road is drawn from the same hard-corner waypoint list with `lineTo`; enemies chase those waypoints directly.
- The deployed app is fixed at 1200×700 with a 900×550 canvas and 280px sidebar. At an 844×390 iPhone-landscape viewport the app remains 700px tall, is vertically offset by -155px, and the canvas begins at x=-168px.
- Gameplay advances once per `requestAnimationFrame`; on a 120 Hz display the simulation can run approximately twice as fast as intended.
- The asset folder is about 69MB. All registered imagery is eagerly loaded; the 20 large painted backgrounds dominate download and decoded memory.
- Painted backgrounds and the main hero/tower sheets are strong. Most enemy sheets are visibly below that quality, while Volcano and Barracks lack matching raster tower sets.
- The interface mixes neon sci-fi, fantasy wood/parchment, orange arcade controls, emoji, and one-off inline styles.
- The existing regression suite passes 57/57, providing a useful logic safety net but no real layout, pointer, timing, or rendering coverage.

## Visual north star: Illustrated Science Expedition

Use a distinctive world built from Victorian scientific expeditions, museum dioramas, field notebooks, observatories, and arcane instrument workshops.

- **Materials:** oxidized brass, dark walnut, enamel, slate, ivory paper, glass, luminous reagents.
- **Discipline signals:** Physics cyan, Biology chlorophyll green, Chemistry amber/coral, Astronomy violet, Earth Science volcanic red, Engineering/Barracks brass-blue.
- **Maps:** painterly three-quarter dioramas with muted terrain, warm readable roads, saturated interactive pads, landmark entrances and exits, and foreground occluders.
- **UI:** brass instrument bezels and enamel plates. Reserve parchment for questions and learning content.
- **Entities:** bold silhouettes, consistent dark outline, top-left lighting, three-value shading, grounded shadows, and restrained glow.
- **Icons:** one original outlined icon family; no emoji in production HUD controls.

## Technical design: canonical curved routes

Create a `PathGeometry`/`Route` module used by every system. Do not curve only the painted road while leaving movement on the old waypoint polyline.

### Authored data

Keep a small list of `controlPoints` per route. Allow optional per-corner radius/tension and named route metadata. For the first migration, convert the existing hard corners into rounded fillets; then re-author each map with meaningful diagonals, broad S-curves, and distinct route silhouettes.

### Generated geometry

At level load:

1. Build straight entries/exits and quadratic Bézier fillets around corners. Clamp each radius to at most 45% of its adjacent segment lengths so curves never overshoot build pads.
2. Sample the route at approximately 6–10px spacing.
3. Store sample position, tangent/heading, cumulative distance, total length, and normalized progress.
4. Cache a `Path2D` plus road-edge data for rendering and placement checks.

### Distance-based enemy motion

Enemies own `pathDistance`, not waypoint-dependent progress. Each fixed simulation tick advances distance by speed × elapsed time, samples the route pose, and updates position and heading. This produces constant velocity through curves and reliable target ordering.

Update all dependent systems together:

- road layers and edge decoration;
- enemy movement and sprite facing;
- First/Last target priority;
- build-pad and rally-point clearance;
- spawned-child continuity (maggots inherit path distance);
- entrance/exit markers and leak detection;
- blockers and hero rally placement.

### Path acceptance tests

- exact start/end positions and no NaNs;
- monotonic path progress;
- near-constant distance travelled per second through curves;
- movement stays centered on the rendered route;
- correct First/Last targeting on curves;
- correct child-spawn position and progress;
- pads and blockers respect the visible road width;
- every campaign route includes at least one real diagonal and one curved transition.

## Implementation program for 5.6 Terra subagents

Work in small, reviewable branches. The integration owner should land the foundation before art-heavy branches begin.

### Phase 0 — Guardrails and measurement

**Lane A: test harness**

- Add deterministic game-clock tests and browser smoke tests.
- Capture desktop 1280×720 and iPhone landscape 844×390 baselines.
- Add route-data auditing, asset-manifest validation, and performance counters.

**Lane B: art bible**

- Produce palette/material, silhouette, scale, lighting, ground-shadow, animation, UI-component, and originality rules.
- Approve a single Level 1 style frame before generating production batches.

**Exit gate:** repeatable screenshots, route metrics, timing test, and approved art bible.

### Phase 1 — Engine foundation and Level 1 vertical slice

**Lane A: clock and rendering**

- Replace refresh-rate-dependent updates with a timestamped accumulator and fixed 60 Hz simulation.
- Add render interpolation and device-pixel-ratio canvas backing.
- Introduce y/foot-point depth sorting for actors and support foreground occlusion masks.

**Lane B: curved route system**

- Implement `PathGeometry` and migrate movement, rendering, targeting, placement, split enemies, and rallying.
- Re-author Level 1 as a broad diagonal/S-curve route with an unmistakable spawn portal and defended objective.

**Lane C: responsive interaction**

- Build a fluid game shell and iPhone-landscape breakpoint.
- Replace the fixed sidebar with a collapsible bottom/right tray depending on available aspect ratio.
- Add safe-area insets, 44px minimum targets, pointer events, tap-select/tap-confirm placement, and visible cancel actions.

**Exit gate:** Level 1 is fully playable at desktop and iPhone landscape, at identical simulation speed, with smooth path traversal and no clipped controls.

### Phase 2 — Level 1 production art and unified UI

**Lane A: battlefield composition**

- Paint/adjust Level 1 for the new route and reserve low-detail combat space.
- Add route edge wear, small landmarks, biome-integrated pads, portal/base, ambient props, and foreground overlays.

**Lane B: interface system**

- Replace emoji and mixed control treatments with the original icon family and reusable components.
- Unify HUD, tower shop, upgrade radial/panel, hero cards, wave call, speed, pause, dialogs, victory/defeat, and quiz presentation.

**Lane C: entity art**

- Redesign the Level 1 enemy roster at 70–85% cell occupancy with readable walk cycles.
- Create matching portraits/icons and any missing Level 1 Volcano/Barracks assets.
- Preserve scientist recognizability while avoiding photorealism.

**Exit gate:** one shippable vertical slice whose assets and UI establish the standard for the remaining game.

### Phase 3 — Campaign rollout

Split levels into four biome batches (1–5, 6–10, 11–15, 16–20). For each batch:

- give every map a distinct route silhouette (diagonals, S-curves, loops, bridges, converging/split lanes where supported);
- keep any single build pad from covering an excessive share of the route;
- integrate pads, entrances, exits, and foreground masks into the painting;
- replace the relevant enemy and boss sheets;
- add missing tower tiers and blocker troops;
- expose the existing level paintings as campaign thumbnails with biome, enemy preview, difficulty, boss state, and stars.

**Exit gate per batch:** geometry tests pass, no path/pad intersections, mobile readability holds under the busiest authored wave, and visual review matches the art bible.

### Phase 4 — Loading, polish, accessibility, and balance

- Lazy-load menu/shared UI, then the selected level background and roster; release superseded large images.
- Encode opaque paintings as WebP/AVIF with a compatibility fallback and measurable quality budget.
- Cache HUD elements and update them only on state change or a throttled cadence.
- Add focus management, dialog semantics, keyboard alternatives, live announcements, reduced-motion option, and non-color-only trait signals.
- Profile targeting/aura scans; use squared distance and single-pass selection before considering a spatial grid.
- Tune quiz timing so reading is concentrated in setup/between-wave moments rather than overwhelming active combat.

**Final exit gate:** stable 60 Hz logic across 60/120 Hz displays, responsive iPhone landscape, no critical accessibility failures, bounded selected-level loading, and all regression/browser/visual checks passing.

## Image generation pipeline

Use Image Gen after the art bible and Level 1 style frame are approved.

1. Generate concept sheets first, not full production batches.
2. Lock silhouette, palette, scale, outline, lighting, and camera before animation.
3. Generate source frames at high resolution with transparency and consistent reference images.
4. Downsample and pack mechanically into the engine's exact sprite-sheet dimensions.
5. Validate alpha, baseline, frame occupancy, flicker, loop continuity, and manifest keys automatically.
6. Review assets in motion in the actual game before approving the next batch.

Priority: Level 1 enemies → complete enemy roster → Volcano/Barracks and blocker troops → icon atlas/hero portraits → biome pads/portals/bases → foreground overlays.

## Delegation and integration rules

- One integration owner controls shared contracts: `GameClock`, `PathGeometry`, `AssetManager`, `InputController`, renderer ordering, and HUD state.
- Subagents may work in parallel only after those interfaces are committed.
- Assign file ownership per branch to avoid overlapping edits to `game.js`, `levels.js`, and `style.css`.
- Every branch includes tests, before/after screenshots, affected viewport sizes, asset-size delta, and manual verification notes.
- Prefer incremental module extraction over a framework rewrite.
- Do not mass-generate or replace all art until the Level 1 vertical slice is approved.

## Definition of done

- Routes feel authored and organic; enemies turn and travel smoothly on genuine diagonals.
- The battlefield reads clearly at a glance, including spawn, objective, lanes, pads, heroes, towers, and enemy traits.
- Desktop and iPhone landscape expose the complete core loop without clipping or tiny controls.
- The visual language is recognizably Science Defender and does not reproduce Realm Defense assets or layouts.
- Asset loading is staged and mobile memory use is controlled.
- Combat speed is independent of display refresh rate.
- All logic, geometry, browser, accessibility, and visual regression checks pass.
