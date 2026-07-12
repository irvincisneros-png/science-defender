# 🔬 Science Defender

A browser-based **tower-defense game** that doubles as an **NSW high-school science revision tool**.
Defend your lab against "Scientific Misconceptions" (flat-earthers, phlogiston, spontaneous
generation, geocentrism…), place discipline-themed towers, command scientist heroes, and earn
Research Points by answering syllabus questions to specialise your towers.

> **▶ Play it live:** https://irvincisneros-png.github.io/science-defender/

Built with vanilla **HTML5 / CSS / JavaScript** — no build step, no dependencies.

---

## Features

- **6 tower disciplines** — Physics, Chemistry, Biology, Astronomy, Volcano, Barracks — each with a
  3-level upgrade tree and a quiz-gated specialisation fork.
- **4 scientist heroes** — Einstein, Newton, Curie, Darwin — with passive auras, levelling (XP from
  kills), death/respawn, and aimed active abilities (press **1–4** or the on-screen bar, then click
  to cast).
- **20 themed campaign levels** with painted backgrounds, bosses at 5 / 10 / 15 / 20, plus an
  Endless mode.
- **Curriculum-driven** — 225+ questions across Years 7–10, selectable by year group and topic/exam.
- **Quality-of-life:** 2× speed, call-wave-early, enemy traits (flying / armored / shielded / healer),
  star-based meta-progression (Lab Bench), a monster bestiary, full audio (music + procedural SFX),
  and a mute toggle.
- **Modern renderer:** fixed 60 Hz simulation with interpolated DPR canvas rendering, staged
  selected-level art, foreground occlusion, reduced-motion support, and keyboard build-pad placement.
- **Illustrated expedition art:** a complete production roster of 17 regular enemies and 5 bosses,
  plus Volcano, Field Team station, blocker troops, and an original outlined HUD icon family.

## Run locally

No build needed — it's static files. Serve the folder with any static server:

```bash
# Option A: the bundled Node helper
node _preview_server.js

# Option B: any static server
npx serve .
```

Then open the printed `localhost` URL. (Opening `index.html` directly works too, but a local
server avoids browser file:// audio/asset restrictions.)

## Tests

A dependency-free regression suite runs under Node:

```bash
node tests/bug-regression.test.js
node tests/tooling-validation.test.js
```

The current regression baseline is **68/68**. Tooling validation also runs regular and boss sprite QA and a
20-level route/pad coverage report.

Asset integrity, sprite-sheet dimensions, payload size, duplicate content, and literal runtime
references can also be inspected directly:

```bash
node scripts/asset-audit.js          # human-readable report
node scripts/asset-audit.js --json   # machine-readable report
node scripts/asset-audit.js --strict # also fail on optimization/legacy warnings
```

For a real-browser layout smoke test at desktop `1280x720` and iPhone-landscape `844x390`, run:

```bash
bash scripts/browser-smoke.sh
```

The browser check uses the bundled Playwright CLI wrapper through `npx`, starts the local preview
server, launches Level 1, rejects horizontal overflow, a clipped battlefield, or browser errors,
and writes menu/gameplay screenshots and reports under `output/playwright/` (ignored by Git).

## Credits

- **Code & design:** Irvin Cisneros (with AI pair-programming).
- **Music:** Kevin MacLeod ([incompetech.com](https://incompetech.com)) — licensed under
  [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Per-track
  attribution is in [`assets/audio/CREDITS.md`](assets/audio/CREDITS.md). Tracks used: *Goblin
  Tinker Soldier Spy, Honey Bee, Go Cart, Funk Game Loop, Decisions, Light Sting, Greta Sting.*
- **Sound effects:** synthesized procedurally in-game via the Web Audio API (no samples).

## License

Game code is released under the **MIT License** (see `LICENSE`). Music is **CC-BY 4.0** as
attributed above — keep the credit if you redistribute.
