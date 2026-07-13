# Science Defender overhaul delivery audit — 2026-07-13

## Scope and evidence

This audit treats the public build at `fdb9c4348db03ab8198313219db7281d45d18d2f` as the visual baseline and the current branch as the delivery candidate. It does not infer completion from green unit tests alone.

Evidence reviewed:

- live splash, campaign atlas and Level 1 interaction;
- all 20 campaign paintings/routes in `docs/evidence/route-contact-sheet.png`;
- every regular, multistage and boss family in `docs/evidence/enemy-campaign-contact-sheet.png`;
- live/local desktop and responsive Playwright captures under `output/playwright/`;
- hero, tower, enemy, projectile, VFX and UI rendering code;
- the full learning assessment and the implemented question/combat systems.

## Requirement-by-requirement audit

### Visual presentation

| Area | Delivery state | Evidence and remaining boundary |
|---|---|---|
| Heroes | Implemented | Four production heroes have idle/walk/attack/skill strips with consistent 128 px frame geometry. Heroes remain foot-anchored and state changes use the same silhouette. |
| Enemies and bosses | Implemented | Seventeen regular/multistage strips and five boss strips form a coherent hand-painted roster. The delivery raises actor presentation to 2.65× after live sampling showed 2.25× still undersold regular silhouettes. Trait badges preserve tactical readability independent of colour. The Level 3 phlogiston claim gains a clearly labelled `E` shield until evidence disrupts it. |
| Towers | Implemented | Six tower families have progression/attack art, readable range roles and consistent foundations. Runtime pad sanitation prevents road/endpoint overlap on all 20 levels. |
| Environments and paths | Implemented | Twenty distinct paintings, six road materials, foreground masks and route-aware placement are present. Contact-sheet coverage ranges from 82–100%; every live map retains at least eight safe pads. |
| VFX and instruments | Implemented for the slice | Existing projectile/impact effects remain procedural for performance and state clarity. A new ImageGen oxygen-balance illustration gives the learning instrument the same brass/enamel storybook language as the shell UI. |
| UI and responsive layout | Implemented | Splash, atlas, battle HUD, collapsible Field Kit, evidence dialogs and split victory results share the paper/brass/enamel hierarchy. Desktop 1280×720, phone portrait 390×844 and phone landscape 844×390 have no document overflow; all short-landscape evidence choices remain visible at 44 px height. |
| Animation consistency | Implemented within the current 2D scope | Actor strips use fixed geometry and foot anchoring; reduced-motion removes shake/extra motion. The game does not have the directional animation count, bespoke skeletal transitions or device-scale art budget of a large commercial title. |

### Realm Defence quality target

The delivery approaches the target in the areas that can be evidenced: clear hero/enemy/tower scale hierarchy, distinctive tactical silhouettes, integrated painted roads, readable combat traits, strong hit/ability feedback and a cohesive mobile-fantasy shell. It should not be described as equivalent to Realm Defence. That game’s commercial production depth includes more directional animation, bespoke encounter staging, denser authored VFX, larger content QA and extensive device/user testing. Science Defender now has a coherent independent science-fantasy identity rather than copied characters or protected assets.

### Educational assessment: recommendation versus implementation

Before this branch, the assessment’s central recommendations were not mechanics. The game had 895 retrieval-practice items, paused question timing, generic explanations, quiz rewards, combat stars and encounter-gated Field Notes. It did **not** have mission claims, predictions, mission-linked evidence, distractor-specific retry, a learning-driven enemy counter, CER, stable item IDs, mastery memory or Atlas progression.

This branch implements the first recommended vertical slice on Level 3:

1. mission claim and pre-evidence prediction;
2. two measurements using a sealed-vessel oxygen balance;
3. option-specific feedback, hinting and a second attempt;
4. a phlogiston-specific claim shield that evidence removes;
5. a second oxygen/mass investigation and non-punitive battlefield advantage;
6. a claim–evidence–reasoning debrief before victory;
7. a completed phlogiston refutation dossier in Field Notes;
8. deterministic IDs for every curriculum question and explicit IDs for slice tasks;
9. local learning records under `std_learning_mastery_v1`, separate from `std_stars_v1`;
10. a split victory summary that never interprets lives, score or stars as science mastery.

The state is deliberately called `developing`, not `secure`: secure mastery still requires a later unseen transfer item, as recommended by the assessment. The remaining assessment phases—teacher reporting, due-item scheduling UI, more response formats, classroom validation and evidence missions across the other 19 levels—remain recommendations, not claims made by this delivery.

## Verification matrix

- `node --test tests/*.test.js`
- `node scripts/asset-audit.js --strict`
- `node scripts/character-asset-audit.js`
- `bash scripts/browser-smoke.sh`
- Playwright: prediction, first-wrong retry, hint, shield removal, second evidence break, CER and separate victory summaries
- Playwright responsive checks at 1280×720, 390×844 and 844×390
- public deployment hash comparison and live replay after merge

## ImageGen provenance

`assets/ui/oxygen_balance.png` was generated with the built-in ImageGen workflow from a purpose-written scientific-educational game-asset prompt. The source used a flat chroma-key field and the installed removal helper produced an RGBA PNG with transparent corners, 38.4% non-empty coverage and no visible key fringe. The final asset is stored in the project and does not depend on a file under the generator cache.
