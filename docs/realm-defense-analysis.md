# Realm Defense: Hero Legends TD — Mechanics Analysis

Reference document for cloning Realm Defense's gameplay into **Science Tower Defense**.
Compiled 2026-06-01 from multi-source research (Realm Defense Fandom wiki, SuperCheats
walkthroughs, the 2017 Blogspot wiki, App Store/Google Play, community guides). Claims
were cross-verified across sources; uncertain figures are flagged.

> **Lineage note:** Realm Defense (by **Babeltime Inc.** — *not* Foursaken Media or Babil
> Games, despite common attribution) is a high-quality clone of **Kingdom Rush**. If you
> want more source material, study Kingdom Rush too — the core loop is identical.

---

## 1. Core gameplay loop

A single level:

1. **Fixed path(s)** run from spawn point(s) to an exit gate. Enemies always follow them.
2. **Fixed build pads** sit alongside the path — towers can only go on marked spots.
3. **Coins (in-level gold)** are the tactical currency: start with a small pool, earn per
   kill, spend on building/upgrading. **Coins do NOT carry between levels.**
4. **Waves** spawn in sequence (boss levels ~8 waves). Between waves a countdown runs; a
   **"Call Wave" button** starts the next wave early for a **coin bonus**, and also **heals
   barracks troops and revives dead heroes**.
5. **Win** = survive all waves. **Lose** = enemies leak past the exit and drain your lives.
6. **Stars (1–3)** on completion: 1 = survived, 2 = minor losses, 3 = near-perfect lives.

**Confirmed:** Normal levels have **20 lives**; a well-played run loses only ~5–7 if towers
aren't upgraded. There **is** a 2× speed button.

---

## 2. Tower system

**No universal tower pool.** Each **world has exactly 4 towers**, thematically reskinned;
earlier-world towers don't appear in later campaigns. Across 7 worlds (~28 towers) they
collapse into **4 recurring archetypes**:

| Archetype | Role | Examples |
|---|---|---|
| **Ranged single-target / anti-air** | Bread-and-butter DPS, hits flyers | Archer, Axe Thrower, Spear, Crossbow |
| **AoE / splash** | Clears ground groups | Cannon, Dragon's Lair, Mushroom, Taiko |
| **Barracks / melee blocker** | Spawns troops that physically *block* the path | Barracks, Mead Hall, Samurai |
| **Support / control** | Slow, teleport, debuff, aura — low raw damage | Wizard, Thor, Mirror, Shrine |

**In-level upgrade structure (per tower):**
- 2 base stat upgrades (damage + range), bought with coins.
- A special ability upgradeable up to **3×** (e.g. Archer Multi-Shot, Cannon Barrage).
- Often 1 unique single-purchase upgrade (e.g. Scout aura).
- → roughly **5–7 purchase steps per tower per level**.

**Branching specializations:** Worlds 1–5 are mostly linear. **World 6 (Okakoku) forks** —
e.g. Crossbow → *Quick* (crit/speed) vs *Shuriken* (AoE); Taiko → *Speed* vs *Strength*;
Shrine → *Speed* / *Strength* / *Money*. Model the satisfying "fork at the top" on World 6.

**Selling:** 70% refund mid-wave, **100% during pre-wave setup** (wave 0).

**The barracks/blocker mechanic is the heart of the genre** — melee troops physically stop
ground enemies so ranged/AoE towers have time to kill them. Cannons are deliberately balanced
around needing a choke point (slow reload).

---

## 3. Hero system

What separates Realm Defense from vanilla TD:

- **Up to 3 heroes per level**, placed **anywhere** (not on build pads), tap-to-move,
  **auto-attack**.
- **Melee heroes physically block** enemies (a tank holds up to **5** at once) — a mobile barracks.
- **Heroes never die permanently** — knocked out, then **auto-revive** (instant on calling
  the next wave).
- **Ability layout: 1 active + 3 passives.** Active is tap-triggered with a cooldown.
  Passives unlock at hero level **3 / 6 / 9**; all four upgrade to Level 2 at **10 / 13 / 16 / 19**.

**Acquisition is NOT gacha.** Every hero is a named character bought directly with **gems**
once unlocked. Two are free starters.

**Two progression axes per hero:**
1. **Leveling** (spend **Elixir**) → max **level 40**. Raises stats, unlocks abilities.
2. **Awakening Ranks R0→R6 (R7 for some)** — the real power driver. Each rank costs
   **800 gems + Awakening Tokens** (10 shards = 1 token; 170 tokens for R0→R6) and unlocks
   **talents**, including cross-hero synergies (e.g. Leif buffs fire heroes).

No separate skill-tree UI — talents are baked into awakening ranks.

---

## 4. Enemies & bosses

**Enemy trait system** (mix-and-match flags):

| Trait | Counter it forces |
|---|---|
| **Armored** | needs magic/true damage, not physical |
| **Flying** | only air-targeting towers hit |
| **Fast / Hasted** | slows, chokepoints |
| **Cloaked** | melee/AoE reveal |
| **Healer** | burst it down fast |
| **Spawner** | kill before it multiplies |
| **Shielded** | melee to strip shield |
| **Buffer** (shaman) | priority kill |

Plus status effects: burn, poison, freeze, slow, stun, curse, decrepify (armor-break).

**Bosses** appear on the **final wave**, are usually **stun-immune**, and have **HP-threshold
phases** rather than walking to the exit. Standout copy targets:
- **Yan (W4):** teleports between 3 fixed points; 4 phases layering Haste → Teleport →
  Armor-break → portal-spawning as HP drops.
- **Narlax (W4):** teleports and **pulls all your units toward him** every jump.
- **Sethos (W3):** at 40% HP **burrows and resets to the start** of the path.

The "boss = unlockable hero" loop (beat boss Yan → buy hero Yan) is a clean hook.

---

## 5. Economy & meta-progression

Load-bearing currencies (12 total, but these matter):

| Currency | Type | Earned | Spent on |
|---|---|---|---|
| **Coins/Gold** | in-level only | kills | build/upgrade towers |
| **Gems** | premium (F2P-earnable, ~6k/mo) | daily trial, wheel, missions, IAP | heroes, awakening, keys |
| **Elixir** | soft XP | Elixir Mine (passive), modes | leveling heroes |
| **Awakening Tokens** | hero power | Realm Siege (main daily source) | awakening ranks |
| **Stars** | meta | 1–3 per level | **permanent tower upgrades** + Elixir cap |

**Permanent tower upgrades are bought with Stars** (3 tiers at 4 / 5 / 6 stars) and are
**freely resettable/reallocatable** at no cost — the meta "talent tree" equivalent.

**Difficulty modes:** Normal + **Legendary** (same maps, 2–4× harder, faster to farm). No
"Heroic/Iron" mode (those are Bloons/Kingdom Rush terms).

**Endgame modes:** Realm Siege (daily, escalating, "blessed" scaling tower spots), Tournament
(async leaderboard, weekly "Blessed" buffed hero), Endless, Shattered Realms (timed survival),
Arcade, daily Wheel of Prizes + Daily Trial.

**Monetization:** direct gem IAP ($0.99–$49.99), 14-day consumable booster packs, event/hero
packs. **No gacha, no battle pass, no loot boxes.** Mild P2W for campaign; real for tournaments.

---

## 6. UI / UX & controls

| Action | Control |
|---|---|
| Place a tower | Tap an empty build pad → pick tower from panel |
| Upgrade a tower | Tap placed tower → radial/popup upgrade menu |
| Sell a tower | Tap tower → sell button |
| Move a hero | Tap map location |
| Use hero active | Tap the hero's ability button (cooldown indicator) |
| Call next wave early | Tap "Call Wave" (coin bonus + heals troops + revives heroes) |
| Speed | 1× / 2× toggle |
| Pause | Pause button |

HUD: lives/hearts + gold + wave indicator on top; build/upgrade contextual on the map;
hero ability buttons + call-wave + speed at the bottom.

**Art:** colourful stylized 2.5D cartoon fantasy, per-world themes (medieval forest, Nordic
ice, Egyptian desert, sky, dwarf mines, feudal Japan, divine paradise).

---

## 7. What this means for Science Tower Defense

The genre's "secret sauce" is three interlocking timing systems:
**blocker troops buy time → AoE/ranged towers deal damage in that window → call-wave-early
trades safety for economy.** Heroes are a mobile fourth layer on top. Nail those before the
content sprawl — you only need the **4 archetypes** for a complete, fun game.

See the companion design spec (`docs/superpowers/specs/`) for how we map each system onto the
existing science game.

### Open data gaps (wiki paywalled)
- Exact tower gold costs / damage / range tables.
- Exact between-wave timer length and call-early bonus formula.
- Full per-rank awakening token breakdown.
