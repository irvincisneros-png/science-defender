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
```

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
