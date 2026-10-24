# Art Direction Gap — Science Defender vs Realm Defense (2026-10-24)

Reference: Realm Defense played on Irvin's iPhone through iPhone Mirroring (level 234 "Zeta Wall",
battle view with towers, heroes and a wave in combat), plus its three App Store screenshots.
Science Defender: the live build on the same iPhone (Safari) and at 844×390 landscape.
Realm Defense images are not committed (third-party copyright); they were only viewed for reference.

## Verdict

The gap is an **art-direction gap, not a polish gap**. Realm Defense uses one coherent style; Science
Defender mixes four. Fixing individual sprites (see `art-audit-2026-10-24.md`) won't close it.

## Side-by-side, element by element

| | Realm Defense | Science Defender |
|---|---|---|
| Screen use | Map fills 100% of the phone; HUD is small icon chips in the corners | Map ~60% of screen; thick text HUD bars top and bottom; black side bars |
| Camera | Close: heroes/enemies ≈12–15% of screen height | Far: actors ≈6–8% of screen height, thin silhouettes |
| Style | One clean vector cartoon: bold dark outlines, flat colour + 1–2 cel shades, chunky proportions | Four styles: painted backgrounds, 64 px pixel-art actors (blurred by upscaling), illustrated towers, web-app UI |
| Value/contrast | Light ground, lighter road, saturated outlined actors → actors pop | Dark ground, dark road, dark muted actors → everything blends |
| Background detail | Simple shapes, big calm areas, detail only at the edges | Dense painted detail everywhere, competing with actors |
| Perspective | One consistent 3/4 top-down for map, towers and units | Room painted in front-ish 3/4; road is a flat top-down ribbon pasted on top |
| Road | Wide, part of the environment (pavers/sand), clean edges | Thin grey tube drawn over the painting |
| Build pads | Light discs with a build icon and green upgrade arrow; obvious | Small dark discs that blend into the floor |
| Hero identity | Each hero has a signature colour and silhouette (pink mage, blue bird, blue blob) | Four scientists in brown/olive coats; similar silhouettes |
| Units in combat | Attack poses, visible weapons, health bars, bright projectile trails and hit flashes | Walk cycle only; small effects |
| UI | Chunky rounded cartoon buttons, icons first, almost no text | Text labels ("SUPPLY", "INTEGRITY", "FIELD KIT"), dark green/gold panels, small type |

Also seen on the real iPhone (portrait Safari): the level-select footer buttons render as three large
stacked blocks covering the level cards, the Year Group dropdown and most of the Deploy button.
Deploy could not be triggered through iPhone Mirroring.

## What to do

**1. Cheap wins with existing art (code only)**
- Full-screen map with overlaid corner HUD chips (Sprint 2), and zoom the camera so actors are ~2× larger.
- Brighten and simplify backgrounds at render time: lift exposure, reduce saturation and detail away
  from the road (soft vignette/blur on the outer third).
- Widen and lighten the road so it reads as the brightest surface.
- Add a 2 px dark outline to every actor sprite (canvas drop-shadow in 4 directions or a cached
  outlined copy) and stop smoothing pixel art.
- Bigger, brighter VFX: projectile trails, hit flashes, coin pops.
- Light, icon-led build pads with an upgrade arrow; fix the portrait level-select overlap.

**2. Art reset (needed to reach Realm Defense quality)**
- Pick **one** style: outlined vector cartoon, bright daylight palette, chunky proportions,
  consistent 3/4 top-down camera. Write a one-page style bible (palette, outline weight, shading
  steps, proportions, camera angle) and generate everything against it.
- **PixelLab is the wrong tool for this target.** Realm Defense is not pixel art; PixelLab would push
  the game further from it. Better sources: an image model driven by the style bible (the `codex`
  image-generation skill is available here), or a licensed cohesive cartoon TD asset pack reskinned
  with science props, which is the fastest way to consistent quality.
- **Pilot on Level 1 only:** background, road, build pad, one tower (3 tiers), Einstein, Flat Earth
  and Phlogiston, all in the new style. Compare with Realm Defense on the phone, then roll out.
- Give each scientist a signature colour and silhouette (e.g. Curie emerald glow, Newton violet
  gravity, Einstein electric cyan, Darwin warm amber), and let enemies keep science-joke designs but in
  the same outline/shading rules.
