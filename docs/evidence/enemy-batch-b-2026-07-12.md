# Enemy Sprite Production Evidence — Batch B

Date: 2026-07-12
Agent role: Luna art-production workstream
Assigned keys: `aether`, `vitalism`, `humours`, `creationist`, `homunculus`, `homunculus_core`

## Workflow

1. Read the Image Gen skill, `docs/art-bible-level1.md`, and enemy descriptions in
   `docs/SPRITE_GENERATION_PROMPT.md`.
2. Used the built-in Image Gen tool (`gpt-image-2` service path) once per enemy.
3. Used `assets/concepts/level1-enemy-concepts.png` as a style-only reference. No
   existing character design was copied.
4. Requested six original right-facing poses in a 3×2 contact sheet on a flat
   `#ff00ff` chroma background.
5. Kept high-resolution sources and alpha intermediates under ignored
   `tmp/imagegen/enemy-batch-b/`.
6. Removed the chroma key with the installed Image Gen skill helper:

   ```sh
   python3 "$HOME/.codex/skills/.system/imagegen/scripts/remove_chroma_key.py" \
     --input <source> --out <alpha> --auto-key border --soft-matte \
     --transparent-threshold 28 --opaque-threshold 110 --despill --force
   ```

7. Mechanically cropped, uniformly scaled, aligned, and packed the six generated
   poses with `scripts/pack-enemy-contact-sheet.py`. The packer does not draw art.
8. Visually reviewed all six strips together at 4× nearest-neighbour scale.
9. Validated the final candidates with `scripts/sprite-qa.py`.

## Shared prompt

```text
Use case: stylized-concept
Asset type: six-pose animation source sheet for a 64px HTML5 tower-defense enemy
Input image: style reference only; match its polished hand-painted mobile game
rendering, bold dark outlines, top-left light, brass/science-expedition material
language, and readable silhouette. Do not copy any character design.
Primary request: [subject prompt below]
Scene/backdrop: perfectly flat solid #ff00ff chroma-key across the entire image.
Composition: exactly six isolated full-body poses arranged as a precise 3-column
by 2-row contact sheet, ordered left-to-right on the top row then left-to-right on
the bottom row. Same character design, scale, proportions and baseline in every
panel. Every pose faces screen-right in three-quarter view. Equal generous padding
inside invisible equal cells, no overlap, no dividers, no labels. Align feet/body
bottoms to the same virtual baseline. Subject occupies about 75% of each cell height.
Style: original 2D hand-painted illustrated science-expedition mobile tower-defense
art; slightly menacing but appealing; chunky silhouette, 2–3px-equivalent dark
outline after downsampling, soft cel shading, limited interior detail.
Constraints: exactly six instances of the same character; right-facing only; no
floor, cast shadow, contact shadow, reflection, text, watermark, frame, grid,
scenery, or particles crossing cell boundaries. Do not use #ff00ff in the subject.
Background must be one uniform chroma color with no gradients, texture, lighting
variation or shadow.
```

## Subject prompts

- **aether:** A shimmering pale-violet aether wisp/jelly flyer with an opaque
  painterly lavender body, ivory rim light, tiny brass instrument collar, luminous
  eyes, and trailing vapor fins. Ghostly drift cycle: squash, rise, trail curl,
  fall, stretch, recovery.
- **vitalism:** A pulsing green life-spark regenerator with seed-shaped spectral
  body, leafy energy crest, ivory-green heart core, oxidized-brass revival ring,
  wispy lower body, and warm determined eyes. Float cycle: compress, brighten,
  rise, unfurl side wisps, fall, recover.
- **humours:** A heavy armored brass-and-glass vessel containing four visibly
  separated fluids: blood-red, clear pearl, yellow ochre, and near-black violet.
  Chunky plated legs, stopper crown, and restrained healing emblem. Heavy steps
  alternate while the four fluids slosh.
- **creationist:** A lumbering ancient grey stone behemoth with massive sedimentary
  plates, obsolete fossil plaques, chipped brass classification tags, stern carved
  face, oversized fists, and pillar legs. Six-phase ponderous stomp cycle.
- **homunculus:** An alchemist's homunculus sealed in a cracked brass-rimmed
  cyan-grey protective shell/jar, small distorted silhouette and anxious eyes
  visible within, rivets and mechanical feet outside. Stiff shamble cycle.
- **homunculus_core:** A tiny frail wild-eyed humanoid core with parchment-pale
  skin, oversized head, wiry limbs, brass straps, and torn alchemical wrapping.
  Non-gory six-phase frantic sprint: lean, contact, recoil, passing, flight,
  recovery.

## Generated source IDs

- `aether`: `exec-65117407-e406-4225-b5bb-cb39e3d1b310.png`
- `vitalism`: `exec-797eb396-65fa-4cb8-ad51-2175a8d530c9.png`
- `humours`: `exec-e404da95-be24-469c-82ad-76694ca58f55.png`
- `creationist`: `exec-bbc2d004-6cea-42bc-83bd-22e8cba7ad1a.png`
- `homunculus`: `exec-bf1ffc7b-248e-40ba-887e-1a0173eacb3d.png`
- `homunculus_core`: `exec-a39c27b3-5690-4fae-8315-7ad159ab2fc0.png`

## QA result

Command:

```sh
python3 scripts/sprite-qa.py \
  assets/enemies/candidates/{aether,vitalism,humours,creationist,homunculus,homunculus_core}_walk_v2.png \
  --json
```

Result: **PASS**, zero failures. Every file is exactly 384×64 RGBA; all 36 frames
have transparent corners, 78.12% maximum-dimension occupancy, and baseline 58.

Candidate outputs:

- `assets/enemies/candidates/aether_walk_v2.png`
- `assets/enemies/candidates/vitalism_walk_v2.png`
- `assets/enemies/candidates/humours_walk_v2.png`
- `assets/enemies/candidates/creationist_walk_v2.png`
- `assets/enemies/candidates/homunculus_walk_v2.png`
- `assets/enemies/candidates/homunculus_core_walk_v2.png`
