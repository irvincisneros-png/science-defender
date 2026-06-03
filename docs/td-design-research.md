# Tower Defense Design Research
### Practical fixes for a browser TD with dominant strategies and flat progression

> **Scope**: This report targets three known problems — (1) one or two maxed towers clear everything, (2) upgrade choices are uninteresting (+Attack always wins), (3) no sense of unlock progression. Each section ends with concrete, game-ready guidance.

---

## 1. The "Interesting Decision" Principle

Sid Meier's classic definition — *"a game is a series of interesting decisions"* — requires that no single option be dominant [GDC 2012]. Game designer Lars Doucet (Defender's Quest) formalizes this as choices that are **Different, Balanced, Limited, and Clear** [Fortressofdoors].

**Why stat-stacking beats role-stacking (and what to do about it):**

When all towers share the same ballpark range and the only upgrade axes are Attack / Range / Speed, players run a simple DPS calculation: +Attack raises burst; +Range raises *both* burst and coverage simultaneously. Range wins almost every time because it solves two problems at once [Fortressofdoors]. The result is one dominant pick.

The fix is **role differentiation through *exclusive* mechanics**, not just stat magnitudes:

| Role | Unique mechanic (not just a stat) | Effective against |
|---|---|---|
| Sniper (long-range, slow) | Pierces armor; targets highest-HP enemy | Tanks, bosses |
| Rapid-fire (short-range, fast) | Triggers on-hit effects every shot | Swarms, fast runners |
| AoE / Splash | Damages all enemies in a radius | Clumped waves, swarms |
| Slow / Support | Applies 40–60% speed debuff; buffs adjacent towers | All enemies; synergy anchor |
| Melee / Blocker | Physically blocks path; very high HP | Creates choke points |

Melee towers must hit **3–5× harder than equivalent-cost ranged towers** to compete, or they need abilities no ranged tower can replicate (path-blocking, taunt, area stun) [Fortressofdoors]. Keep the total tower count low — with 10+ tower types, half will be mathematically dominated; aim for **5–7 distinct roles** with tight identities [Fortressofdoors, Bloons].

**Making Range / Speed / Damage situational:**
- Range upgrade: cap it at ~1.5× base; beyond that, apply a 20% diminishing-returns multiplier per tier [Universal TD wiki].
- Speed upgrade: make faster attack rate interact with on-hit effects (slow, stun, burn) so it only shines with status towers.
- Damage upgrade: make it the best single-target option but irrelevant vs. swarms; give enemies with split/spawn-on-death mechanics that punish overkill.

---

## 2. Enemy / Tower Counter Design

**The core rule:** Every enemy type should have one *optimal* counter and at least one *viable* alternative — never a hard immunity with a single counter tower [Fortressofdoors]. Hard lock-and-key ("only anti-air hits flyers") is a **resource tax**, not a thinking test.

**Five enemy archetypes that force tower diversity:**

1. **Armored/Tank** — high HP, slow. Countered *best* by armor-piercing sniper; also manageable via concentrated AoE or DoT (damage-over-time) stacking.
2. **Fast/Runner** — low HP, high speed. Countered *best* by rapid-fire short-range tower + slow support; also manageable by placing AoE near path exit.
3. **Swarm** — many low-HP units. Countered *best* by AoE splash; single-target towers waste shots.
4. **Flyer** — ignores ground path. Needs at least *two* tower types with anti-air capability so the player isn't forced to build one specific tower; alternatively, let all towers hit flyers but at -50% damage unless upgraded.
5. **Shielded/Regenerating** — has a shield that must be broken before HP damage. Countered *best* by burst/high-damage; slow regeneration punishes low-DPS setups.

Introduce these one per level cluster (waves 1–5: runners; 6–10: armored; 11–15: swarm + flyers mixed) so the player has time to internalize each counter before combos appear.

---

## 3. Difficulty Curve and Balancing Math

**The single-tower problem** happens when path coverage is too small. Two levers fix it:

**A. Path length and map coverage**
- Total enemy HP per wave should exceed **(max theoretical DPS of one tower) × (time enemy is in range)**. If a tower covers 30% of the path and enemies take 10 s to traverse, even a perfect placement provides at most 3 s of fire — not enough to solo the wave.
- Enforce this by making maps at least **4–6 tower-widths long** and adding bends that reduce any single tower's coverage to ≤ 35% of the path.

**B. HP and count scaling formula**
A simple, proven baseline [YYZ Productions]:
```
enemy_HP(wave) = base_HP × 1.2^(wave - 1)
enemy_count(wave) = base_count + floor((wave - 1) / 10)
gold_reward = ceil(enemy_HP ^ 0.9) + 1
```
- The 1.2× multiplier per wave doubles HP roughly every 3.8 waves — aggressive enough to outpace a static defence but predictable.
- The powerHPG exponent (0.9 for long maps, 0.8 for short maps) keeps gold rewards slightly sub-linear vs HP, so players can't buy their way out of difficulty by farming one enemy type.

**C. Preventing one-tower-solo**
- Give each tower a **placement limit** (e.g., max 3 of the same tower type on a map). Forces diversification.
- Apply **diminishing-returns**: each additional copy of the same tower in a 3-tile radius deals 15% less damage. Stack two snipers? The second deals 85% damage. Stack three? 72%. [Design principle confirmed by Universal TD wiki soft-cap data]
- Use **leak pressure**: enemies that reach the exit deal damage scaled to their remaining HP (not a flat 1 life). A boss at 80% HP causes crisis; 20 runners at full HP are manageable but costly.

---

## 4. Economy Loop

**The good loop:** Kill enemies → earn gold mid-wave → spend before next wave → towers are stronger → enemies are slightly tougher → repeat.

**Four pressure mechanisms that keep choices alive:**

1. **Kill-proportional rewards**: `gold = ceil(HP^0.9 + 1)` — harder enemies pay more, but never enough to make defence trivial. Players feel the tension between spending on towers and saving for upgrades.
2. **Call-wave-early bonus** (Bloons TD mechanic): sending the next wave before the countdown expires grants +10–15% of the wave's total kill reward as a lump sum. Risk: you have less setup time. Reward: compounding income advantage. This is the single most effective way to make the economy feel strategic [Bloons wiki].
3. **Upgrade lock-in**: upgrades are permanent; selling refunds only 60–75% of cost. This punishes reactive building and rewards scouting enemy waves in advance.
4. **Soft gold cap per round**: total spend is limited by kills-so-far, not by a bank account. Players can't stockpile five waves of gold and buy a maxed tower instantly — wealth scales with performance.

---

## 5. Progression and Unlocks

**The core principle:** Every level should introduce at most one new mechanic or tower. Giving players everything at level 1 removes the sense of discovery and makes the difficulty curve impossible to calibrate.

**Gating structure (example 20-level arc):**

| Level range | Unlocks | New enemy |
|---|---|---|
| 1–3 | Rapid-fire tower + basic upgrades | Runner |
| 4–6 | Slow/support tower | Armored |
| 7–9 | AoE tower; Tier-2 upgrades unlocked | Swarm |
| 10 | Boss wave; hero unlocked | Boss |
| 11–13 | Sniper tower; Tier-3 upgrades | Flyer |
| 14–16 | Melee/blocker tower | Shielded |
| 17–19 | Tier-4 upgrades; second hero slot | Combo waves |
| 20 | Final boss; meta-upgrade points awarded | All types |

**Star ratings + meta progression** (Kingdom Rush model [Kingdom Rush wiki]):
- Each level awards 1–3 stars based on performance (lives lost, speed, economy efficiency).
- Stars are a cross-level currency to unlock passive upgrades: "all towers gain +5% base damage," "heroes respawn 20% faster," "slow towers slow 10% more."
- This gives completionists a reason to replay and creates asymptotic power growth without breaking balance — meta upgrades are small enough that skill still matters.

**Upgrade tier gating**: Only unlock Tier 3 upgrades after reaching level 10; Tier 4 after level 15. Players on level 2 facing Tier-3 towers get confused and overwhelmed; players on level 15 with only Tier-1 upgrades feel artificially constrained.

---

## 6. Heroes: Staying Relevant

Heroes become useless when they out-DPS the towers and make everything else irrelevant, OR when they're too weak to bother with. The sweet spot is **hero as problem-solver, not main DPS**.

**Design principles for heroes that stay relevant:**

- **Cap hero DPS at ~20–30% of a fully-upgraded tower** of equivalent level. Heroes should never solo a wave.
- **Give heroes abilities towers can't have**: path-blocking (physically stands in the path to create a new choke), area stun (3-second freeze in radius), debuff aura (enemies in range take +25% damage from all towers), rally (temporary +20% attack speed to nearby towers), or instant-kill threshold (execute enemies below 10% HP).
- **Mobility is the hero's unique resource**. A hero can rush to a breach that bypasses a dead tower; towers cannot. Make this explicitly necessary by having occasional "leak" enemies or breaches the static layout can't handle. [Unreal Possibilities blog, Kingdom Rush design]
- **Heroes level up within a run** (not just meta-progression). Starting at level 1 each mission means the player must manage positioning to safely farm XP — another tactical layer that doesn't depend on damage.
- **Two-hero synergy** (Kingdom Rush 5 model): Hero A is melee blocker + taunt; Hero B is ranged + execute. Neither is useful solo against a mixed wave; together they're excellent.

---

## 7. Juice, Pacing, and Retention

**"One more wave" hooks** [GameAnalytics, YYZ Productions]:
- End each wave with a **clear, satisfying sound + visual**: gold numbers float, towers animate, a wave-complete banner shows the gold earned. Without this, play feels flat — a Roblox devforum case study showed 2% D7 retention when these were absent.
- **Boss waves at predictable intervals** (every 5 waves). Bosses should require a different strategy than the waves before them (e.g., they're immune to slows, forcing the player to switch to raw DPS). The surprise mechanic makes them memorable.
- **Breather waves**: every 3rd wave should be slightly easier than the previous two, giving the player a moment to breathe, upgrade, and feel powerful before the next spike.
- **Visual tower feedback**: towers need distinct attack animations per upgrade tier. A Tier-1 archer shoots a stick; a Tier-3 archer fires glowing arrows in a spread. The visual change communicates power without a tooltip.
- **Wave speed controls**: let players accelerate to 2× or 4× speed when they're winning. This is respect for the player's time and one of the most retention-positive features in the genre [Defender's Quest, BTD6].
- **Loss visibility**: when a life is lost, show *exactly* which enemy leaked and from where. Players who understand their failure are more likely to retry; players who feel confused are likely to quit.

---

## Apply to THIS Game — Top 10 Checklist

Prioritized by impact on the stated problems (dominant towers, flat upgrade choices, no progression):

**[P1 — Fixes dominant tower problem]**
- [ ] **1. Add placement limits**: max 2–3 of any one tower type per map. This alone breaks the "stack snipers" strategy immediately.
- [ ] **2. Enforce path coverage math**: redesign maps so no single tower placement covers more than 35% of the enemy path. Add bends, split paths, or length.
- [ ] **3. Introduce armored + swarm enemies in the same wave by level 8**. A single tower type cannot handle both simultaneously — forces a second tower role.

**[P2 — Fixes uninteresting upgrade choices]**
- [ ] **4. Give each upgrade a UNIQUE MECHANIC, not just a stat**. +Attack Speed should activate a slow-on-hit; +Range should grant a "prioritize furthest enemy" targeting mode; +Damage should unlock armor-pierce. Now the choice depends on *what enemy is coming*, not just which number is bigger.
- [ ] **5. Add diminishing returns on range**: beyond 1.5× base range, each additional tier gives only 70% of the stated range gain. This prevents range from being universally dominant.
- [ ] **6. Differentiate tower base ranges significantly**: sniper should have 3–4× the range of the rapid-fire tower. Same-y range is why all towers feel the same.

**[P3 — Adds progression]**
- [ ] **7. Gate Tier-2 upgrades at level 5, Tier-3 at level 10, Tier-4 at level 15**. Currently all upgrades are available immediately, eliminating the discovery arc.
- [ ] **8. Introduce one new tower type every 3–4 levels** (see gating table in Section 5). Don't give the player all towers on level 1.

**[Heroes]**
- [ ] **9. Cap hero damage at 25% of a fully-upgraded equivalent tower, but give heroes an ability that's map-saving in a crisis**: an area stun, a path-block, or a debuff aura. Heroes become essential because of *what they uniquely do*, not their DPS.

**[Economy]**
- [ ] **10. Add a call-wave-early button** with a +12% bonus reward. This single mechanic turns the economy from passive (wait for kills) to active (risk management), and dramatically increases strategic depth with zero additional content.

---

## Sources

- [Optimizing Tower Defense for FOCUS and THINKING — Defender's Quest (Lars Doucet, Fortress of Doors)](https://www.fortressofdoors.com/optimizing-tower-defense-for-focus-and-thinking-defenders-quest/)
- [Optimizing Tower Defense for FOCUS and THINKING — Gamedeveloper.com mirror](https://www.gamedeveloper.com/design/optimizing-tower-defense-for-focus-and-thinking---defender-s-quest)
- [Making a Tower Defense Game Part 3 — YYZ Productions (HP scaling math, powerHPG)](https://yyz-productions.com/2015/12/01/making-a-tower-defense-game-part-3/)
- [Tower Defense — General Gameplay Flow — Sean Duggan, Medium](https://medium.com/@sean.duggan/tower-defense-general-gameplay-flow-529b317a8ef9)
- [The Metrics Behind Successful Tower Defense Games — GameAnalytics](https://www.gameanalytics.com/blog/metrics-behind-successful-tower-defense-games)
- [GDC 2012: Sid Meier on Interesting Decisions — Gamedeveloper.com](https://www.gamedeveloper.com/design/gdc-2012-sid-meier-on-how-to-see-games-as-sets-of-interesting-decisions)
- [What are Interesting Choices in a Game? — Galactic Era](https://galacticera.net/designers-notes/what-are-interesting-choices-in-a-game/)
- [Orcs Must Die: Blocking Strategies — Ludus Novus](https://ludusnovus.net/2015/05/06/orcs-must-die-blocking-strategies/)
- [Introducing Hero Units to Tower Defense Starter Kit — Unreal Possibilities](https://unrealpossibilities.blogspot.com/2022/08/a-basic-overview-of-hero-units-in-tower.html)
- [Collection of Tower Defense Features — Ayumilove](https://ayumilove.wordpress.com/2009/02/07/collection-of-tower-defense-features/)
- [Bloons TD 6 — Bonus Income Wiki (Bloons Fandom)](https://bloons.fandom.com/wiki/Bonus_Income)
- [Universal Tower Defense — Diminishing Returns / Stat Caps](https://universal-tower-defense.com/)
- [Dynamic Difficulty Adjustment in Tower Defence — ScienceDirect (Elsevier, 2015)](https://www.sciencedirect.com/article/pii/S187705091502092X)
- [Kingdom Rush — Upgrades Guide (The Gamer)](https://www.thegamer.com/kingdom-rush-best-upgrades/)
- [Tower Defense Design Guide — DesignTheGame.com](https://www.designthegame.com/learning/tutorial/tower-defense-design-guide)
