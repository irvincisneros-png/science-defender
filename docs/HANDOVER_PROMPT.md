# Handover Prompt — Science Defender

Copy the prompt below into a new Codex task or give it to the release owner.

---

You are taking over the completed **Science Defender visual overhaul**.

## Repository

```text
/Users/irvincisneros/Library/Mobile Documents/com~apple~CloudDocs/Claude/Games/Tower Defense Game
```

Remote: `https://github.com/irvincisneros-png/science-defender`

The worktree contains intentional, uncommitted implementation work. Do not reset, discard, or replace it with the old `main` branch. Inspect the current files as authoritative and preserve user changes.

## Product intent

Science Defender is an original illustrated-science tower-defense game. Realm Defense was used only as a benchmark for route readability, depth layering, touch hierarchy, and polish. Do not copy its assets, characters, maps, HUD, or iconography.

## Start here

Read these before changing anything:

1. `docs/completion-audit-2026-07-12.md`
2. `docs/delivery-report-2026-07-12.md`
3. `docs/visual-overhaul-plan-2026-07-11.md`
4. `docs/art-bible-level1.md`
5. `README.md` and `CHANGELOG.md`

## Completed state

- Canonical curved-route geometry drives roads, distance-based movement, First/Last targeting, build clearance, splits and rallying.
- All 20 levels use broad diagonals and organic curves with verified pad coverage.
- Fixed 60 Hz simulation, render interpolation, DPR×2 backing, foot-point depth sorting and foreground masks are active.
- The complete production roster is wired: 17 regular enemy sheets and five boss sheets, plus Volcano, Barracks and Field Team art.
- Campaign cards show paintings, biome, roster, difficulty, stars and boss state.
- The responsive brass/enamel interface works at desktop and 844×390 iPhone landscape, with a collapsible Field Kit.
- Modal focus trapping/restoration, keyboard placement, non-color trait badges, reduced motion and setup/between-wave question flow are implemented.
- WebP paintings, selected-roster staging/release, compressed audio, throttled HUD updates and one-pass squared-distance targeting are in place.
- Production HUD controls use `assets/ui/icons.svg`; no emoji remains in runtime UI text.

## Validation baseline

Run these before and after any future edit:

```text
node tests/bug-regression.test.js       # 68/68 passing
node tests/tooling-validation.test.js   # passing; all sprite and route QA
node scripts/asset-audit.js --strict    # 0 errors, 0 warnings
git diff --check                        # clean
```

The final real-browser pass verified campaign/deploy/gameplay flows, five visible SVG HUD icons, an 1800×1100 backing canvas for the 900×550 logical scene, no emoji in body text, and no console warnings/errors. Desktop and iPhone-landscape evidence is under `output/playwright/`; art and route contact sheets are under `docs/evidence/`.

## Release-owner instructions

1. Run `git status --short` and review the entire diff; many new assets are intentionally untracked.
2. Re-run the validation baseline and a local browser smoke test.
3. Do not regenerate accepted art unless a reported visual defect requires it.
4. If publishing is requested, intentionally stage the complete implementation, commit, push, and verify the GitHub Pages deployment. Publishing has not been performed by this handover.
5. Record any subsequent change in `CHANGELOG.md` and keep `docs/completion-audit-2026-07-12.md` accurate.

## Current remaining scope

No required overhaul item remains open. The only next operation is release/publishing if the user explicitly authorizes it. Do not invent new redesign scope or treat optional polish as a blocker.

---
