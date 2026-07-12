# Terra enemy + boss candidate batch — generation evidence

Generated 2026-07-12 with the built-in Image Gen workflow. High-resolution and
chroma-key intermediates are retained only under the ignored directory
`tmp/imagegen/terra-boss-batch/`. The seven deliverables are versioned candidate
strips; no runtime or legacy asset was replaced.

## Shared production prompt

Every request used the `stylized-concept` use case and asked for one horizontal
sheet containing exactly six isolated, sequential poses of one consistent,
original science-expedition enemy, all facing screen-right. The shared art
direction was:

- premium hand-illustrated 2D mobile tower-defense sprite art;
- bold clean dark outline, simplified readable forms, soft cel shading, and
  top-left lighting;
- six equally spaced invisible cells, one baseline, no overlap, full subject,
  and pose order that returns naturally toward frame one;
- flat edge-to-edge chroma key with no gradient, texture, shadow, floor, text,
  dividers, watermark, scenery, or extra objects;
- no imitation of an existing game character.

Regular sources requested readability at 64 px. Boss sources requested readability
at 128 px. Magenta `#ff00ff` was used when the subject contained green or orange;
green `#00ff00` was used otherwise.

## Subject-specific prompts

### `golem`

Shielded alchemical stone golem: hulking blocky stone construct with
oxidized-brass shield plates and restrained luminous cyan alchemical runes;
broad readable silhouette and lumbering walk loop. Six poses: contact, down,
passing, high point, opposite contact, recovery. Palette: slate, granite,
oxidized brass, cyan. Magenta key.

Built-in output ID: `exec-9a6f339c-ad9c-4e51-820d-9cc9f360d5a8.png`.

### `golem_molten`

Fast lava-sludge core left after the stone shell shatters: compact glowing
orange-yellow magma creature, a few dark basalt plates, determined face, and
forward-pointing silhouette. Six poses: compressed contact, forward surge,
stretched passing, high crest, opposite surge, recovery. The viscous body must
squash, stretch, and flow. Palette: incandescent yellow, orange, coral, charcoal.
Magenta key.

Built-in output ID: `exec-885d1515-838d-4af7-b2d5-c46198ec5bc1.png`.

### `boss_geo`

GEO COLOSSUS: colossal armoured flat-earth leviathan built from layered slate
tectonic plates, enormous circular disc-world shield integrated into the
shoulders, tiny brass survey instruments crushed into its armour, and rusted
bindings. Six slow, heavy stomp poses with grinding plates. Palette: slate,
granite, ivory strata, oxidized brass, rust. Green key.

Built-in output ID: `exec-88d07833-ba5f-43be-89c7-4e7eb5a062a9.png`.

### `boss_phlog`

PHLOGISTON TYRANT: roaring infernal fire titan with charcoal-black furnace
armour, bright molten cracks, horn-like chimney vents, heavy clawed limbs, and
an ember-crowned head. Flames remain integrated into a mostly opaque readable
silhouette. Six slow, forceful stomp poses. Palette: charcoal, iron,
incandescent yellow, orange, coral-red. Magenta key.

Built-in output ID: `exec-7240cf0f-8cb3-4229-b12f-5e0455ddc1ba.png`.

### `boss_aether`

AETHER LEVIATHAN: vast serpentine sky entity woven from pale-violet aether,
with a long coiling dragon-like body, celestial glass-and-ivory armour fins,
luminous cyan eyes, and ribbon-like energy mane. Ethereal quality is painted
with opaque lavender, ivory, and cyan shapes rather than true transparency.
Six low-coil, wave, S-curve, high-crest, opposite-wave, recovery poses. Green key.

Built-in output ID: `exec-86810c59-609b-474c-bad0-f0e4cd1cacda.png`.

### `boss_miasma`

MIASMA EMPRESS: crowned toxic-cloud queen with an opaque storm body, tarnished
brass plague regalia, layered ragged vapour robes, a sour imperious face, and a
restrained healing-green aura inside the silhouette. Six stately floating and
billowing poses. Palette: sickly sage, olive, grey-green, brass, ivory, charcoal.
Magenta key.

Built-in output ID: `exec-fd403af3-4dc2-431a-a209-e134ec45230a.png`.

### `boss_entropy`

ENTROPY INCARNATE: anthropomorphic heat-death of reason, a towering decaying
cosmic figure whose orderly brass astronomical armour crumbles into dark void,
with a dim dying-star core, broken orrery arcs, asymmetric mantle fragments,
and a solemn skull-like mask. Six ominous heavy poses; no loose debris.
Palette: void black, charcoal, indigo, dim violet, aged brass, tiny amber-white
core. Green key.

Built-in output ID: `exec-aec723d8-0105-4d63-9217-e51eae8dfa82.png`.

## Mechanical processing and validation

Chroma removal used the installed Image Gen helper with border auto-key,
soft matte, thresholds 12/220, and despill. Regular strips were packed with
`scripts/pack-walk-sheet.py` to exactly 384×64 (six 64 px cells). Boss strips
were packed with `scripts/pack-boss-walk-sheet.py` to exactly 768×128 (six 128 px
cells). Art was not drawn or altered programmatically; scripts only removed the
flat key, cropped, downsampled, aligned, and packed generated poses.

QA results:

- every strip has RGBA alpha and transparent corners;
- every frame has 81.25% maximum-axis occupancy;
- regular baselines are pixel 57; boss baselines are pixel 116;
- all adjacent-frame deltas are greater than 1.0;
- all first/last loop deltas are nonzero;
- `node scripts/asset-audit.js --strict` reports 0 errors and 0 warnings.

Machine-readable QA reports are retained in the ignored batch directory as
`regular-qa.json` and `boss-qa.json`.
