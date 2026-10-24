# Science Defender — Audit & Suggestions (2026-10-24)

Sources: code read of `js/` + `index.html`, Node balance model of `levels.js`/`enemies.js`,
all six test files (all pass: bug-regression 72/72, learning-flow 5/5, others PASS), and a live
playtest of https://irvincisneros-png.github.io/science-defender/ at iPhone landscape (844×390)
and portrait (390×844) in a browser emulator. Items marked *(inferred)* were read in code, not reproduced.

## A. Phone playtest findings (live build)

1. **Start/Call Wave is hidden.** On phone the only wave button lives inside the collapsed
   "Field Kit" drawer, scrolled off to the right. New players see "start the wave" text and no button.
   Realm Defense puts a pulsing skull/flag at the path entrance — do that.
2. **Field Kit drawer covers ~half the map** and overflows sideways (Expedition Leaders and
   wave buttons are cut off; only 3 of 6 towers visible without horizontal scrolling).
3. **Tap-pad flow is indirect:** tap pad → nothing; must open drawer → pick tower → tap pad again.
   Realm Defense/Kingdom Rush: tap pad → radial ring of tower icons with cost → tap to build.
   Same for upgrades: replace the half-screen upgrade panel with a radial ring around the tower.
4. **Map is pillarboxed** in landscape (~25% of width is black bars) while HUD and drawer eat
   height. Portrait shows the map in ~30% of the screen with no "rotate your device" prompt.
5. **Level select:** one-and-a-half giant cards per screen, Deploy button hidden below the fold
   behind the sticky footer; first thumbnail loads blank. A scrolling world map with level nodes
   (and stars under each) would read better and feel more like Realm Defense.
6. **Readability:** enemies at phone scale are ~15 px and overlap heroes; health bars and trait
   badges are hard to read. Ability button "EINSTEIN E=MC² READY" sits on top of the play area.
7. **Quiz modal:** all-caps answer text; after a wrong answer the explanation and Resume button
   are below the fold; the chosen-wrong and correct options aren't colour-marked.

## B. Gameplay / balance (code audit)

1. **Infinite gold from quizzes.** "Research Question" + idea bubbles work any time outside a
   wave, including pre-wave-1 (which never auto-starts). Correct = +120 g/+15 RP, wrong still
   +20 g/+2 RP (`js/game.js:2656`, `:2668`). You can max towers before the first enemy.
2. **Quiz is guessable.** Options are never shuffled (`js/questions.js:133-139` shuffles the
   queue, not options). Correct answer is B 57% / C 36% / A+D 7%; longest option is correct 76%.
   Wrong answers on Solve-to-Rush/specialisation cost nothing and can be retried instantly.
3. **Gold glut.** 12–14 pads per level; fully upgrading all ≈3.5–4k g. Income per level:
   ~3.2k (L1) → 16k (L6) → 170k (L20). After ~wave 3 gold stops being a decision.
4. **Bosses are trivial and unblockable.** L5 boss 2.1k HP vs 62k HP of waves; only the final
   boss has a phase (`js/enemies.js:1849`). Blocking is implemented as a 100% slow and bosses
   are slow-immune, so heroes/troops can't hold them (`js/enemies.js:133`, `js/heroes.js:297`).
5. **Double damage scaling.** +Attack ×1.3 (`js/towers.js:369`) and each tower level ×1.3 again in
   the fire code (e.g. `js/towers.js:655`); +Attack also grants true damage, so Chemistry loses
   its anti-armour role.
6. **Tower balance.** DPS/gold at L1: Barracks 1.09, Biology 0.41, Physics 0.37, Volcano 0.25,
   Chemistry 0.21, **Astronomy 0.05 (useless)**. Dominant: Physics Chain Storm, Volcano, Barracks.
   Dead branches: Railgun, Tectonic. Broken: Berserker "attack faster" does nothing
   (`js/towers.js:1524`); Pyroclastic burn ×1.5 overwritten (`js/towers.js:1270` vs `:1286`).
7. **Difficulty curve.** HP ×1.32^scale (`js/game.js:1260`), tower power capped by pads:
   HP per gold 3.6 (L1) → 30.9 (L20). Total HP dips at L4 and L7, spikes +67% at L6 and +73% at L11;
   single waves jump 3.5–4× (L1, 3, 4, 7, 12). L20 = 2,924 enemies. *(inferred: L1–4 too easy,
   L18–20 near-impossible.)*
8. **Barracks** — the genre's core mechanic — unlocks only at Level 7 and its rally point can't be moved.
9. **Heroes:** block 1 enemy (RD tanks hold 5); no hero choice (assigned per level); no persistent
   hero progression; early call heals dead hero's HP but doesn't revive (`js/game.js:1194`).
10. **Meta-progression is shallow:** 15 stars of upgrades vs 60 stars available; done by ~L5.
    No Legendary/Hard mode.
11. **Selling:** 60% of base cost only — upgrade gold is lost (`js/game.js:2313`).
12. **Atlas break 2 reward** ("enemies slowed") fires when the map is empty, so does nothing (`js/game.js:2876`).

## C. Code / tech

- State not reset in `startLevel` (`js/game.js:592-678`): selected hero/tower, pending branch,
  bubble timer *(inferred: previous level's selection leaks)*.
- Hero cards rebuilt on every kill (`js/game.js:1460` → `:1929`) — taps can be lost mid-rebuild.
- `console.log` on every tap (`js/game.js:760-762`); `triggerDefeat` can fire multiple times per frame (`js/game.js:1435`).
- Canvas up to 3× DPR (2700×1650) + 38 `shadowBlur` calls in enemies.js — biggest iPhone frame-rate risk.
- Specialisation descriptions only in `title` tooltips (invisible on touch, `js/game.js:2334`);
  range circles only on mouse hover (`js/game.js:712`); upgrade menu auto-hides after 5 s unless hovered.
- No PWA manifest / apple-touch-icon / service worker; fonts from Google (fails offline). No pause on
  `visibilitychange`.

## D. Recommended roadmap

**Sprint 1 — make the quiz honest (small, high value)** — ✅ done 2026-10-24, except normalising option lengths (correct answer is still usually the longest; needs a question-bank content pass)
1. Shuffle answer options at draw time; normalise option lengths in the question banks.
2. Quiz rewards only during the between-wave countdown; one question per break; wrong = no reward,
   show explanation with the correct option highlighted.
3. Auto-start wave 1 after a countdown; fix Atlas break-2 reward.

**Sprint 2 — Realm-Defense feel on phone**
4. Radial build/upgrade ring on pad/tower tap; range circle shown on select.
5. Wave-start flag at path entrance (tap = call early, shows bonus); remove drawer from the core loop.
6. Fill the screen (cover-scale the map, compact HUD overlay), rotate-device prompt in portrait.
7. World-map level select.

**Sprint 3 — balance & depth**
8. Remove the double ×1.3; move true damage to a Chemistry/Physics specialisation.
9. Cut gold income ~5× or add per-tower gold sinks (tier 4 / ability ranks like RD's 3× special).
10. Flatten HP curve (e.g. 1.15^scale + more enemy-trait variety), smooth L4/L6/L7/L11 spikes, add breather waves.
11. Barracks from Level 1–2 with movable rally point; heroes block 3–5; bosses blockable with
    2–3 HP-threshold phases (teleport, summon, armour shift) at 15–25% of their wave's HP.
12. Buff Astronomy (e.g. global-range sniper / anti-air specialist); fix Berserker + Pyroclastic.
13. Hero picker (choose 1–2 of 4 before a level) + persistent hero levels bought with stars;
    100% sell refund before wave 1.

**Sprint 4 — retention**
14. Bigger star-upgrade tree (resettable, like RD), Legendary mode per level, daily challenge
    tied to a syllabus topic, teacher-visible mastery report from the learning records.
15. PWA manifest + offline cache so students can "install" it on iPhone.
