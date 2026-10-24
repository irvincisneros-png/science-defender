# Science Defender — Style Bible (v3 "Bright Expedition", 2026-10-24)

Status: **piloting on Level 1** (`?art=pilot`). Pilot assets live in `assets/pilot/`, packed with
`scripts/pack-pilot-sheet.py`. Not yet restyled: spawn portal, defended core, HUD/UI, other levels.

One style for every battlefield pixel. Target feel: a premium mobile tower-defense game — bright,
chunky, outlined cartoon that reads instantly on a phone. Benchmarked against the qualities that make
Realm Defense read well (see `art-direction-vs-realm-defense-2026-10-24.md`); never copy its characters,
props or layouts. Our identity is **science expedition**: brass instruments, glassware, lab tiles,
Tesla coils, lab coats, misconception monsters.

## 1. Rendering rules

| Rule | Spec |
|---|---|
| Line | Bold dark outline on every actor and prop: deep plum/ink `#1E1630`, never pure black. Outer contour ≈ 3 px at 128 px sprite size, inner lines ≈ 1.5 px. |
| Shading | Flat base colour + **one** shadow step (≈20% darker, hue-shifted toward violet) + one small hard highlight. No soft airbrush, no noise, no painterly texture, no pixel art. |
| Light | Single key light from **top-left**. Shadows fall bottom-right. Contact shadow = soft ellipse under every actor/prop. |
| Proportions | Chunky: heroes ≈ 3 heads tall, big hands/boots, oversized signature prop. Enemies are round, squat, readable blobs/creatures with one strong silhouette idea. |
| Camera | 3/4 top-down (≈35° tilt) for **everything**: ground, props, towers and units. Units face **right** in source art; the engine mirrors for left. |
| Detail budget | Detail lives at the map edges and on hero props. The playable floor and road stay calm, big shapes. |
| Silhouette test | Every actor must be recognisable as a solid black silhouette at 48 px tall. |

## 2. Palette

Bright, high-value daylight. Ground mid-light; road lightest; actors most saturated.

| Role | Colours |
|---|---|
| Lab floor tiles | `#9FD3C7` mint, `#7FBFB3` grout, `#C8E8DF` highlight |
| Road (lab) | `#EDE6D3` cream pavers, `#D6CCB2` seams, edge outline `#4B3F5C` |
| Benches / walls | `#E9EEF2` white enamel, `#5E7A99` steel blue, `#F2B84B` brass |
| Glass & energy | `#4FE3FF` cyan, `#7CF29A` lab green, `#FF6FA8` magenta accent |
| Outline / ink | `#1E1630` |
| UI gold | `#FFC94A` with `#B9761C` rim |

Value order on screen (light → dark): road > floor > props > actor outlines. Actors always sit on
a lighter surface than themselves or carry a light rim.

## 3. Cast colour identity

| Character | Signature colour | Silhouette hook |
|---|---|---|
| Einstein | electric cyan + warm brown coat | huge white cloud hair, chalk-sized glowing E=mc² orb |
| Newton | violet | long curly wig, glowing apple |
| Curie | emerald | bun + glowing vial |
| Darwin | amber | bald dome + long white beard, field journal |
| Flat Earth (enemy) | steel blue + parchment | a stubby knight carrying a giant **flat disc map** as a shield |
| Phlogiston (enemy) | orange-red flame | a squat ember imp with a flame "tail", soot-black arms |

## 4. Towers

Chunky base on a round stone/brass plinth (same footprint for every tower, fits a 22 px pad), clear
tier progression by **adding** parts (tier 1 small, tier 3 taller, tier 4 crowned), discipline colour
on the glowing top part (Physics cyan, Chemistry green, Biology lime, Astronomy violet, Volcano orange).

## 5. Map furniture

- **Road**: wide (≈ 1.4× enemy width), cream pavers, ink outline, soft grass/tile shoulder.
- **Build pad**: light stone disc with ink outline, small cyan build glyph, slight 3/4 ellipse.
- **Map edges**: props (benches, glassware, machines) cluster on the outer 15%; centre stays open.

## 6. Production rules for generated art

- Background colour for sprites: flat **#FF00FF magenta**, no gradient, no ground shadow touching
  the edge; keyed to alpha locally.
- Sprite sheets: one row per state, poses evenly spaced, same character scale and footline in every
  pose, nothing crossing into a neighbour's column.
- Runtime sizes: heroes and pilot enemies 128 px cells; towers 128 px cells; backgrounds 1800×1100.
- Draw sprites with image smoothing on (this is vector-style art, not pixel art).
- Every new asset is checked against the silhouette test and placed next to the Level 1 pilot
  before it ships.
