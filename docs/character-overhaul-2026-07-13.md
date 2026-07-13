# Character Overhaul — 2026-07-13

## Root causes

The legacy idle, walk and attack strips were generated independently at 64px. Each state therefore
invented a different character model: outfits, hairstyles, proportions and apparent age changed,
and several attack frames collapsed to roughly half scale. Skills had no sprite state at all.

The enemy `>` was not facial art. It was the Fast trait badge placed over the actor at combat scale.

## Image Gen production

The four master atlases were created with the built-in Image Gen workflow. Each prompt specified one
fixed character model, an 8-column × 4-row action layout, right-facing three-quarter battlefield view,
consistent full-body scale and footline, bold hand-painted mobile strategy art, and a flat green or
magenta chroma background. The four action rows were idle, walk, ranged attack and ultimate skill.

Character-specific prompt content:

- Einstein: brown expedition coat, teal waistcoat, cyan physics orb and relativity shockwave.
- Newton: forest-green academy coat, violet gravity orb and brass-apple gravity field.
- Curie: navy/teal expedition dress, brass radium instrument and emerald-gold energy field.
- Darwin: sand expedition coat, field journal, amber evidence pulse and finch/tortoise aura.

The chroma sources were converted to alpha, then `scripts/pack-hero-atlas.py` recovered the true pose
centres, removed neighbouring-frame spill, normalised visual centres/footlines and produced:

- `assets/heroes/{einstein,newton,curie,darwin}_idle.png`
- `assets/heroes/{einstein,newton,curie,darwin}_walk.png`
- `assets/heroes/{einstein,newton,curie,darwin}_attack.png`
- `assets/heroes/{einstein,newton,curie,darwin}_skill.png`

Every final strip is 1024×128 RGBA: eight 128px frames. Idle/walk loop; attack/skill play once.

## Validation

`scripts/character-asset-audit.js` validates exact geometry, transparency, non-empty frames, footline,
visual-centre drift, cross-state scale and loose palette/identity continuity. All 16 strips pass.

The browser pass exercised all four heroes in idle and skill states, a real targeted Einstein ability,
the corrected command portraits, and enlarged Fast enemies with the lightning indicator.

## Educational direction

The companion [learning-design assessment](learning-design-assessment-2026-07-13.md) concludes that
Science Defender is already useful as low-stakes revision after teaching, but is not yet a standalone
teaching sequence or valid mastery measure. It recommends a lightweight `Atlas of Evidence` campaign
and mission-level claim–evidence–reasoning loops rather than detached cutscenes or more reward quizzes.
