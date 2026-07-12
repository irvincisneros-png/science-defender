# Enemy candidate batch A — Terra art-production report

Generated: 2026-07-12 (Australia/Sydney)

## Scope and status

Six original right-facing enemy walk candidates were created with the built-in
Image Gen workflow, not procedural drawing:

| Enemy | Candidate | Motion | QA loop delta |
|---|---|---|---:|
| Maggot | `assets/enemies/candidates/maggot_walk_v2.png` | Inchworm crawl | 14.44 |
| Alchemy | `assets/enemies/candidates/alchemy_walk_v2.png` | Sloshing trudge | 26.84 |
| Perpetual | `assets/enemies/candidates/perpetual_walk_v2.png` | Hovering ring rotation | 21.65 |
| Geocentric | `assets/enemies/candidates/geocentric_walk_v2.png` | Airborne orrery drift | 12.75 |
| Miasma | `assets/enemies/candidates/miasma_walk_v2.png` | Heavy roiling hover | 18.10 |
| Caloric | `assets/enemies/candidates/caloric_walk_v2.png` | Fast sprint | 12.83 |

The runtime manifest and existing production files were deliberately not changed.
The visual review sheet is `docs/evidence/enemy-batch-a-contact-sheet.png`.

## Shared generation prompt

Every request used this common production specification, with the subject and
motion block below substituted per enemy:

> Use case: stylized-concept. Asset type: production source sheet for a 64px
> mobile tower-defense enemy walk animation. Create exactly six sequential
> animation poses of the SAME original enemy, suitable for a seamless walk or
> hover cycle facing screen-right. Use a perfectly flat uniform chroma-key
> background with no shadows, gradients, texture, floor, or reflections. Render
> polished original hand-painted 2D mobile tower-defense character art in the
> illustrated science-expedition aesthetic: clean dark outline, soft cel
> shading, oxidized-brass/enamel accents, readable silhouette, top-left light,
> and no copying of an existing game's character. Arrange exactly six isolated
> full-body poses in one precise horizontal row, evenly spaced at equal scale,
> with a consistent baseline and generous gaps. Same character in all poses;
> no extras, cast/contact shadow, ground, text, labels, numbers, borders, or
> watermark. Keep the silhouette readable after reduction to 64px and never
> use the chroma color in the subject.

Exact subject/motion additions:

- **Maggot:** small segmented ivory/pale-ochre carrion grub, blunt dark face and
  tiny mandibles on the right, slate spots, brass specimen-tag collar. Poses:
  stretched forward; front planted/rear lifted; compressed arch; rear pulled
  forward; stretched recovery; near-return. Chroma `#00ff00`.
- **Alchemy:** squat anthropomorphic brass-and-ceramic crucible golem, cauldron
  torso filled with softly glowing molten gold, short chunky legs, two small
  brass arms, stern enamel face plate, compact healing-glyph glow. Alternate
  weight, heel lift, gold slosh, and arm counter-swing. Chroma `#00ff00`.
- **Perpetual:** two interlocked oxidized-brass gyroscope rings around a dark
  enamel clockwork core with one right-facing eye, wrapped in a compact pale-cyan
  shield bubble. Rotate rings, hover-bob, and subtly pulse shield. Chroma
  `#00ff00`.
- **Geocentric:** levitating compact oxidized-brass orrery with blue-enamel Earth
  visibly fixed at center, tiny gold Sun orbiting on a brass arm, right-pointing
  pointer and one sly eye. Show six orbit phases with airborne bob. Chroma
  `#00ff00`.
- **Miasma:** dense sickly green-grey gas cloud with sour right-facing face,
  slate vapor core, mustard-olive fumes, two brass quarantine tags, and opaque
  bubble lobes. Chunky opaque silhouette rather than wispy transparency; show
  compression, roil, and heavy bob. Chroma `#ff00ff`.
- **Caloric:** compact glowing orange-red mythical heat-fluid bead with
  right-facing determined face, enamel brow, brass calorimeter fins, two
  exaggerated running legs, and close opaque flame tail. Poses: contact, down,
  passing, up, flight, and return. Chroma `#00ff00`.

## Mechanical workflow

1. Built-in Image Gen produced one high-resolution six-pose illustrated source
   per enemy. Raw copies are under the ignored
   `tmp/imagegen/enemy-batch-a/generated-sources/` work directory.
2. The installed imagegen skill helper removed the uniform key with border-key
   sampling, soft matte, threshold 12/220, and despill. Alpha intermediates are
   under `tmp/imagegen/enemy-batch-a/`.
3. `scripts/pack-generated-enemy-source.py` split each source into six equal
   source cells, cropped only to alpha, scaled its maximum extent to 80% of a
   64px frame, centered it, aligned the visible baseline to y=58, and packed the
   poses left-to-right. The script draws no artwork.
4. Candidates were reviewed at 2x in the contact sheet, then checked with the
   project QA and strict asset audit.

## Verification evidence

Commands:

```sh
python3 scripts/sprite-qa.py assets/enemies/candidates/{maggot,alchemy,perpetual,geocentric,miasma,caloric}_walk_v2.png
node scripts/asset-audit.js --strict
```

Results:

- all six files are exact 384x64 RGBA PNG strips;
- every strip has six non-empty 64x64 frames;
- every frame has 79.69% maximum-dimension occupancy;
- every frame has visible baseline y=58 and transparent corners;
- all adjacent frames have meaningful pixel delta and every loop has a
  measurable final-to-first delta;
- strict asset audit: 138 files, 0 errors, 0 warnings.

These are candidate assets pending integration approval, not claims that the
entire campaign art rollout is complete.
