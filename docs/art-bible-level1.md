# Level 1 Art Bible — Illustrated Science Expedition

## Approved concept reference

Use [`assets/concepts/level1-enemy-concepts.png`](../assets/concepts/level1-enemy-concepts.png) as the design reference for the first three misconception families:

- **Flat Earth:** squat armored charlatan; disc-world shield; broken survey equipment; slate, brass, and rust.
- **Phlogiston:** fast ember-and-soot gremlin; strong forward lean; amber/coral heat against charcoal smoke.
- **Spontaneous Generation:** unstable alchemical sludge host; visible offspring; olive, cream, brass, and muted violet.

The concept establishes silhouette, material, outline, lighting, and rendering quality. It is not a production sprite sheet and must not be loaded by the runtime.

## Production rules

- Original science-expedition designs; do not reproduce Realm Defense or Kingdom Rush characters, equipment, poses, or silhouettes.
- Three-quarter view facing screen-right; the engine mirrors for leftward travel.
- Occupy 70–85% of a 64px frame after downsampling.
- Use one consistent foot/baseline and top-left lighting across every frame.
- Keep the outline readable at 64px and avoid interior detail finer than two output pixels.
- Walk loops use six frames, 64×64 per frame, in a single 384×64 strip.
- No baked floor, cast shadow, text, watermark, or background. Runtime ground shadows remain separate.
- Preserve trait readability without relying only on color: shield/armor mass for Flat Earth, flame/smoke motion for Phlogiston, offspring silhouette for Spontaneous Generation.

## UI/material rules

- Primary materials: oxidized brass, dark enamel, walnut, slate, ivory paper, and glass.
- Parchment belongs to questions and field notes, not general combat controls.
- Discipline color is a signal, not a full-panel fill.
- Replace emoji controls with one outlined icon family as the relevant components are rebuilt.
