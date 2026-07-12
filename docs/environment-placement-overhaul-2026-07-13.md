# Environment and Placement Overhaul — 2026-07-13

## Environment integration

Each campaign level now declares a complete `pathMaterial` with its own body, worn centre, terrain
shoulder, edge, accent detail and micro-texture treatment. The renderer uses a broad semi-transparent
shoulder and soft edge before painting the route body, which lets the existing level art show through
without sacrificing enemy readability.

Six generated surface families provide restrained painted grain beneath those 20 unique palettes:

- `assets/paths/lab_plating.webp`
- `assets/paths/organic_earth.webp`
- `assets/paths/volcanic_basalt.webp`
- `assets/paths/frost_flagstone.webp`
- `assets/paths/cosmic_inlay.webp`
- `assets/paths/academy_pavers.webp`

The assets were produced with the built-in Image Gen workflow as seamless, top-down, hand-painted
mobile tower-defense path textures. The prompt set specified the corresponding surface material,
an original science-expedition aesthetic, moderate contrast, no focal objects or text, orthographic
framing and clean four-edge tiling. Final sources were resized to 512×512 WebP at a combined 260 KiB.

## Placement system

- 58px pointer/touch snapping and spatial arrow-key foundation selection.
- Full-size tower sprite ghost, attack range, build cost and valid/invalid status before placement.
- 48px route/shoulder clearance plus endpoint, safe-frame and tower-footprint validation.
- Deterministic replacement foundations guarantee at least eight safe sites on every map.
- Occupied foundations remain visible beneath towers and report their state if selected.
- Field Kit buttons expose affordability, per-type limits and current selection to assistive technology.

## Verification

- Gameplay regression suite: 72/72 passed.
- Environment presentation tests: passed.
- Tooling and route policy: passed for all 20 campaign maps.
- Strict asset audit: 160 assets, 0 errors, 0 warnings.
- Desktop placement: pointer selection, ghost/range preview, Arrow Right + Enter placement, no warnings.
- Mobile landscape at 844×390: splash → campaign → Level 1 → Field Kit → placement preview, no overflow,
  console errors or warnings.
- Representative visual checks: laboratory, volcanic, tundra, ocean, marsh and singularity.
