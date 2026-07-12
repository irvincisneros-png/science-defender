# Delivery and Image-Generation Report — 2026-07-12

## Art production

Image Gen produced an original campaign roster against the Illustrated Science Expedition art bible: bold silhouettes, dark outlines, top-left lighting, three-value shading and restrained scientific-fantasy effects. Generated working sources remain ignored under `tmp/imagegen/`; project assets are deterministic packed sheets.

- 17 regular enemy sheets at 384×64: Flat Earth, Phlogiston, Spontaneous Generation, Maggot, Alchemy, Perpetual Motion, Geocentric, Miasma, Caloric, Aether, Vitalism, Humours, Creationist, Homunculus, Homunculus Core, Golem and Molten Golem.
- 5 boss sheets at 768×128: Geocentric, Phlogiston, Aether, Miasma and Entropy.
- Matching Volcano and Barracks progression sheets plus Field Team blockers.
- Original code-native outlined HUD icon family in `assets/ui/icons.svg`.

The runtime manifest now promotes every validated v2 enemy and boss candidate. QA reports and contact sheets are in `docs/evidence/`, including:

- `enemy-campaign-contact-sheet.png`
- `enemy-batch-a-report.md`
- `enemy-batch-b-2026-07-12.md`
- `terra-boss-batch-prompts-2026-07-12.md`
- `route-contact-sheet.png`

Packing and validation are reproducible with `scripts/pack-walk-sheet.py`, `scripts/pack-generated-enemy-source.py`, `scripts/pack-enemy-contact-sheet.py`, `scripts/pack-boss-walk-sheet.py`, `scripts/sprite-qa.py`, and `scripts/boss-sprite-qa.py`.

## Delivery optimization

- 20 WebP primary paintings: 3.33 MiB, approximately 93% smaller than the 51 MiB PNG fallback set.
- Selected-level loading stages only the active roster and shared essentials, then releases superseded large images.
- Oversized battle and boss audio was recompressed to 160 kbps.
- JPEG payloads use correct `.jpg` extensions; obsolete sprite-guide entries were removed.
- Strict asset audit: **0 errors, 0 warnings**.

## Acceptance

The final build passes 68/68 behavior checks, all regular/boss sprite QA, route/pad metrics for all 20 levels, desktop and iPhone-landscape browser flows, DPR/reduced-motion/focus checks, and a zero-error console pass.
