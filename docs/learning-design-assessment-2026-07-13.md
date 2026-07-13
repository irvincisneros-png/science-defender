# Science Defender learning-design assessment

**Date:** 13 July 2026  
**Scope:** Current question system, campaign progression, battle loop, level framing, interface, Field Notes/Bestiary, and project documentation  
**Audience:** Product/design team and NSW Years 7–10 science teachers

## Executive verdict

Science Defender is already a promising **low-stakes revision game and lesson hook**. It is not yet a complete educational tool, a reliable formative assessment, or a substitute for instruction and practical investigation.

Its strongest educational assets are unusually substantial for a small browser game:

- 895 multiple-choice questions across Years 7–10 and 16 named topics;
- topic and exam-pool selection before play;
- immediate answer explanations;
- quizzes moved into setup/between-wave time rather than active combat;
- 20 levels themed around historical scientific misconceptions;
- a discoverable Field Notes system; and
- a non-destructive response to wrong answers in the specialisation and wave-rush flows.

The principal weakness is structural. At present, the science is mostly an **extrinsic currency layer attached to a tower-defence game**. Students answer a randomly selected question to earn Research Points, gold, a heal, an early wave, or a tower specialisation. The scientific reasoning rarely changes what the player observes, predicts, builds, targets, or concludes. A player can also receive Research Points from clearing waves, ignore many questions, and win through tower-defence skill. Conversely, a student can farm unrelated questions without engaging with the level's misconception.

The next overhaul should therefore prioritise **intrinsic integration**: evidence and scientific reasoning should help the player understand and counter the claim represented by the current enemies. Research on educational games has found stronger learning and voluntary play when learning content is integrated into the central mechanic rather than used as reward-gating around it ([Habgood & Ainsworth, 2011](https://eric.ed.gov/?id=EJ922627)).

### Bottom line

- **Does it fit as an educational tool now?** Yes, as engaging retrieval practice after teaching, especially in a supervised revision lesson. No, not yet as a stand-alone teaching sequence or defensible measure of syllabus mastery.
- **Should it have a storyline?** Yes, a light campaign narrative would give the 20 levels coherence and purpose. It should make evidence, models and scientific inquiry drive the story; it should not be a separate layer of long cutscenes.
- **Highest-impact change:** make every mission a short claim–evidence–reasoning cycle, then remember what each learner needs to revisit.

## Current-state audit

### What is working

| Area | Current implementation | Educational value |
| --- | --- | --- |
| Curriculum breadth | Four year pools, four named topics per year, 895 questions total | Broad coverage and easy teacher selection |
| Retrieval | Questions are drawn without repetition until the selected pool is exhausted | Better than immediate random repeats; supports broad review |
| Feedback | Every item has a correct answer and explanation | Immediate correction is important in multiple-choice practice |
| Timing | Research and specialisation questions are restricted to setup/between waves; combat pauses | Avoids the severe split-attention problem of reading during combat |
| Error climate | Wrong specialisation/rush answers spend no RP and do not damage the base | Supports low-stakes practice |
| Motivation | Correct answers create visible tactical and economic rewards | Gives students a reason to attempt retrieval |
| Conceptual theme | Enemies personify Flat Earth, phlogiston, miasma, caloric theory, geocentrism and other superseded ideas | Memorable entry point for how evidence changes scientific models |
| Field Notes | Encountered enemies unlock tactical descriptions | Good foundation for a misconception and evidence library |
| Progression | Towers, specialisations, heroes, stars and 20 missions provide long-term goals | Strong replay and classroom-session potential |

The topic names closely reflect the knowledge outcomes in the current NSW Science 7–10 Syllabus (2023), which began implementation in 2026. However, that syllabus also makes eight **Working scientifically** processes integral to Stage 4 and Stage 5: observing, questioning/predicting, planning, conducting, processing data, analysing data, problem-solving and communicating ([NESA outcomes](https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes); [NESA course overview](https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/overview/course)). The game currently exercises recognition and recall far more than those processes.

### Main learning-design gaps

#### 1. The quiz and battle systems are only loosely connected

The selected Year/topic pool controls quiz content, but the chosen level controls enemies and scenery. There is no contract that connects them. A Year 8 data-science question can appear while fighting phlogiston, and the answer does not alter the scientific interpretation of that enemy.

More seriously, `QuestionManager.getQuestionByTopic(topic)` currently ignores its `topic` argument and simply draws from the active pool. The interface says a specialisation requires a question "of that tower's discipline", but the implementation does not guarantee that. This is a design inconsistency even if the code is functioning as written.

#### 2. The game does not remember learning

Questions do not have stable IDs or outcome tags. The game does not store:

- first-attempt correctness;
- chosen distractor;
- confidence;
- response time;
- number of hints or retries;
- concept mastery;
- due-for-review state; or
- delayed retention across sessions.

The queue guarantees coverage within one pool cycle, but there is no spaced retrieval, adaptive selection, or targeted reappearance of an error. Practice testing and distributed practice have high utility across ages and materials ([Dunlosky et al., 2013](https://pubmed.ncbi.nlm.nih.gov/26173288/)); the current random queue captures the first idea but not the second.

#### 3. Multiple choice is doing every educational job

Fast multiple-choice items are appropriate for a 10–20 second between-wave interaction. They are not enough to demonstrate the NSW outcomes that ask students to make predictions, plan valid investigations, process and analyse data, solve problems, and communicate evidence-based arguments.

Some items test application and evidence evaluation, particularly in the Data Science pools, but the interaction format remains answer recognition. There are no graphs to interpret, variables to manipulate, methods to sequence, competing models to compare, observations to classify, or claims to justify.

#### 4. Feedback explains the answer but does not diagnose the misconception

All wrong options lead to the same generic explanation. Distractors are not tagged with a misconception and have no option-specific rationale. This misses the most educationally valuable part of the game's theme: showing why an intuitive idea can seem plausible and which evidence replaces it.

Immediate feedback is a genuine strength. Multiple-choice tests can familiarise learners with incorrect options, while feedback improves later correct recall and reduces those lure intrusions ([Butler & Roediger, 2008](https://pubmed.ncbi.nlm.nih.gov/18491500/)). The next step is to make feedback diagnostic rather than merely mark-and-reveal.

#### 5. Field Notes teach tactics more than science

Current entries explain an enemy's fantasy behaviour and tower counter. They generally do not provide the full conceptual-change sequence:

1. the historical/common claim;
2. why it was plausible;
3. the observation or experiment that contradicted it;
4. the accepted replacement model; and
5. a related syllabus outcome or question.

That sequence matters. Refutation texts that state a misconception, explicitly refute it, and describe supporting evidence are more effective for knowledge revision than ordinary expository text across age groups and science domains ([Weingartner & Masnick, 2019](https://www.sciencedirect.com/science/article/abs/pii/S0361476X18303035)).

#### 6. Campaign success is not learning success

Stars are based on remaining integrity and the final score reflects battle performance. The victory screen reports no learning objective, questions attempted, misconceptions revised, or next review. A strong tower-defence player may earn three stars with weak science performance; therefore stars must not be presented to teachers or students as evidence of curriculum mastery.

#### 7. Question quality is not auditable yet

The bank is large and explanations are usually clear, but items lack source citations, author/reviewer status, outcome codes, cognitive demand, difficulty data and version history. "Syllabus-aligned" is currently a project assertion, not an auditable mapping. Because NSW outcomes are stage-based and schools can sequence content differently, the Year 7–10 labels should remain teacher-selectable rather than being treated as universal pacing.

Content concerning Aboriginal and Torres Strait Islander knowledges should have explicit source provenance and appropriate community/educator review. Likewise, enemy labels should distinguish **historical or testable scientific claims** from people or cultural/religious identities. For example, a claim such as a young Earth can be challenged with geological evidence without depicting a group of people as monsters.

#### 8. The current reward balance can still feel punitive

The interface says some wrong answers have "no penalty", but the open Research Question gives approximately 120 gold plus 15 RP for correct and only 20 gold plus 2 RP for incorrect. The student does not lose existing resources, yet the opportunity cost is large enough to affect survival. Difficulty is also not calibrated, so two students can receive materially different combat advantages for questions of unknown relative challenge.

The correct design principle is: **wrong answers change the support offered, not the learner's right to continue playing**.

## Recommended learning loop

Each mission should use a compact five-part loop. It preserves tower-defence pacing while turning the level's misconception into a scientific investigation.

### 1. Mission brief: encounter a claim

Before deployment, show a 20–30 second dossier:

- the enemy's claim in neutral language;
- one mission learning intention;
- one relevant NSW outcome; and
- a prediction prompt.

Example: "The Miasma Echo claims foul air alone causes infection. If that model is correct, which pattern should appear in the ward data?"

The player records a prediction and optional confidence rating. Prediction should award participation, not correctness.

### 2. Deploy: choose an evidence strategy

Give the player two or three investigation tools that are also tactical choices. Examples include a sampling beacon, controlled trial station, telescope array, force sensor, temperature probe or data modeller. Tower selection can remain primarily strategic, but one mission instrument should embody the target science process.

The player should know what each tool measures, not which one is the hidden "correct tower".

### 3. Observe during combat

Combat generates small, readable observations rather than quiz interruptions:

- counts from two conditions;
- a live mini-graph;
- before/after mass;
- temperature over time;
- pathogen spread under different controls;
- force arrows or motion traces; or
- model predictions compared with actual enemy paths.

The evidence should arise from what the player placed or chose. This is where science becomes part of play.

### 4. Evidence review between waves

At a safe pause, ask one short reasoning task:

- identify a trend;
- choose the fairest comparison;
- classify a variable;
- select which model the evidence supports;
- sequence a method; or
- complete a Claim–Evidence–Reasoning statement.

Use a scaffolded retry:

1. first attempt from memory;
2. if incorrect, highlight the relevant evidence and explain the selected distractor;
3. offer a second attempt;
4. show the worked reasoning regardless of outcome.

All players receive enough resources to continue. Independent correctness can grant an **evidence advantage**—for example, reveal a resistance, briefly mark the priority target, or increase the next observation's clarity—rather than determine whether the run remains viable.

### 5. Debrief and schedule review

After the level, replace a generic victory paragraph with:

- "Claim investigated";
- "Evidence collected";
- "Current scientific model";
- one concise self-explanation prompt;
- first-attempt accuracy separated from scaffolded success; and
- one or two concepts scheduled for later review.

Combat stars and learning progress should be displayed separately. A player can have **3 combat stars** and **Developing: interpreting evidence**, which is honest and useful.

## Concrete mechanics worth building

### A. Evidence Breaks, not pop quizzes

Retain the between-wave modal, but rename and redesign it around evidence from the current level. The player is solving the mission, not taking an unrelated test for currency.

Suggested question mix per 10–15 minute level:

- one prediction at the start;
- two fast retrieval/application checks between waves;
- one data or method task;
- one end-of-level explanation or CER choice; and
- at most one spaced-review item from an earlier mission.

### B. Misconception-specific debuffs revealed by evidence

The enemy's fantasy trait should mirror what must be understood, but scientific knowledge should reveal or counter it without hard-locking progress.

| Enemy/mission | Evidence task | Optional tactical payoff |
| --- | --- | --- |
| Phlogiston | Compare mass before and after combustion in open and closed systems | Reveal heat resistance and expose it briefly after correct mass reasoning |
| Spontaneous generation | Compare covered, uncovered and sterilised samples | Mark which spawned organisms came from contamination; reduce splitter surprise |
| Geocentric model | Compare predicted and observed planetary/moon motion | Reveal the flyer's route and anti-air vulnerability before it enters |
| Miasma | Interpret infection data with contact and sanitation variables | Temporarily expose or reduce the healer aura |
| Caloric fluid | Predict heat transfer using particle/energy models | Reveal fast units early and show where slowing is most effective |
| Perpetual motion | Identify energy input/output and friction losses | Display the shield threshold and optimal high-damage counter |

These are bonuses for interpreting evidence, not punishment for ignorance. On an incorrect first attempt the instrument can collect one more data point and the hero can offer a hint.

### C. Upgrade Field Notes into refutation dossiers

Every unlocked entry should contain:

- **The claim** — stated accurately and respectfully;
- **Why it seemed plausible** — historical observations or intuitive reasoning;
- **What changed** — named evidence, experiment or improved instrument;
- **Current model** — the concise accepted explanation;
- **Test it** — a replayable 30–60 second mini-task;
- **Battle counter** — existing tactical advice; and
- **Curriculum tags** — stage, outcome and concept.

Unlock the basic dossier on encounter and complete its evidence section by doing the relevant mission task. This makes collection progress educational rather than merely encyclopaedic.

### D. Add a small mastery and spacing engine

Give every item a stable schema such as:

```text
id, stage, outcomeCodes, topic, concept, misconceptionId,
cognitiveDemand, format, difficulty, source, version,
prompt, options[{text, rationale, misconceptionTag}], answer, explanation
```

Store locally, per anonymous learner profile:

```text
attemptCount, firstAttemptCorrect, lastDistractor,
confidence, responseTime, hintCount, lastSeen, nextDue, masteryState
```

Selection policy:

- 60% current mission concept;
- 25% due/previously missed concepts;
- 15% interleaved prior content;
- do not repeat an identical item in the same short session;
- use a parallel item to confirm mastery after a correction; and
- move a concept from developing to secure only after successful spaced retrieval, not one answer.

### E. Broaden response formats gradually

Keep MCQ as the quickest format, then add formats in this order:

1. confidence rating after an answer;
2. select evidence for a claim;
3. order a method;
4. label variables/controls;
5. read a table or graph;
6. predict then reveal a simulated result;
7. construct a CER response from sentence tiles; and
8. optional one-sentence self-explanation for classroom mode.

This creates evidence for Working scientifically outcomes without turning every wave break into an essay.

### F. Teacher mode and honest reporting

Add a teacher setup panel separate from the student campaign:

- select Stage 4/5, outcomes, concepts and session length;
- choose Revision, Learn, or Diagnostic mode;
- disable combat bonuses if a fair diagnostic is required;
- generate a local session code/profile rather than collecting names by default;
- export CSV/JSON locally; and
- show first-attempt accuracy, misconception patterns, hints, delayed-review status and item coverage.

Do not report combat score, speed or stars as science achievement. NESA describes formative assessment as ongoing use of evidence about knowledge, understanding and skills to provide feedback and choose next teaching steps ([NESA formative assessment](https://curriculum.nsw.edu.au/assessment-and-reporting/formative-assessment)). A useful dashboard should answer "what should I teach next?", not simply rank players.

## Storyline recommendation

### Recommendation: yes, but use a lightweight evidence-led campaign

The current premise—an academy expedition defending the frontier from historical misconceptions—is a good frame, but it is not yet a story. Levels have isolated descriptions, heroes rotate automatically, and victories do not change a shared problem or relationship.

Narrative can improve engagement, but evidence is mixed when story is unrelated to the learning mechanic. One empirical educational-game study found richer narrative improved engagement and reduced errors when story, mechanics and learning goals were deliberately integrated; the same paper reviews cases where bolt-on narrative had no or negative learning effect ([Jemmali et al., 2018](https://doi.org/10.1145/3235765.3235783)). Therefore, narrative is recommended **after and alongside** the evidence mechanics, not as an art-only overlay.

### Campaign concept: The Atlas of Evidence

The Royal Academy's **Empirical Atlas**—a living map of models supported by evidence—has fractured. Its old, superseded explanations have returned as **Echoes**. They are not evil people and are not defeated because they are unpopular; each Echo persists until the expedition gathers observations, tests its predictions and establishes a model that better explains the evidence.

The player is a newly appointed **Field Research Lead**. Einstein, Curie, Newton and Darwin are specialist mentors with distinct scientific habits rather than infallible answer machines:

- **Newton:** measurement, prediction and mathematical models;
- **Curie:** careful methods, controls, uncertainty and safety;
- **Darwin:** patterns, variation, systems and evidence accumulated over time;
- **Einstein:** model revision, thought experiments and explanatory power.

They can disagree about methods, ask the player what evidence would decide, and revise their position when observations demand it. This models science as a collaborative, self-correcting process rather than a parade of lone geniuses.

### Four compact chapters

| Levels | Chapter | Scientific practice arc | Narrative turn |
| --- | --- | --- | --- |
| 1–5 | **First Observations** | Observe, question, predict | The team learns the Echoes strengthen when claims go untested; the first boss is resolved with a complete evidence dossier |
| 6–10 | **Trials of Matter and Life** | Plan fair tests, control variables, conduct investigations | Conflicting results expose poor controls and force the Academy to revise its method |
| 11–15 | **Systems and Signals** | Process and analyse patterns, compare models | Two plausible models compete; the player must decide which better predicts new data |
| 16–20 | **Evidence at the Edge** | Evaluate claims, solve problems, communicate with evidence | The final threat is not "entropy is false" but misuse of a valid idea to claim inquiry is pointless; the player restores the Atlas by communicating a justified, appropriately qualified conclusion |

Each mission needs only:

- a skippable 2–4 line brief;
- one hero exchange before the investigation;
- one evidence discovery between waves; and
- a 3-line debrief.

Avoid long dialogue trees, expensive cinematics and lore disconnected from the scientific task. The selected Year/topic can swap the mission evidence while the broad story remains stable.

### Sample mission: Level 8, Plague Marsh

**Brief:** The Miasma Echo predicts illness follows foul-smelling air. Curie asks which observations would distinguish airborne odour from microorganism transmission.

**Prediction:** Choose the outcome expected after handwashing/sterilisation under two otherwise similar conditions. Record confidence.

**Play:** Sampling stations placed near two routes collect infection counts. The Miasma healer remains fully playable even without the task.

**Evidence break:** Select the fair comparison and identify the trend. On error, the game highlights the changed and controlled variables and allows a retry.

**Payoff:** Correct independent reasoning exposes the healer radius for the next wave. A scaffolded answer reveals the same information after a short delay, so no student is locked out.

**Debrief:** Complete a short CER statement linking the data to germ theory. The Field Notes entry records the claim, Pasteur-style evidence, current model and remaining uncertainty.

This can align with Stage 5 disease content and Working scientifically analysis/communication without presenting a disconnected exam question.

## Phased improvement plan

### Phase 0 — Make the learning claim auditable

**Goal:** know exactly what the game teaches and measures before adding more content.

- Assign stable IDs to all 895 questions.
- Map each item to Stage 4/5 outcome code(s), concept, cognitive demand and misconception.
- Add source/version/reviewer metadata.
- Review distractors and write option-specific rationales for the first priority unit.
- Separate combat telemetry from learning telemetry.
- Add anonymous local learner profiles and a clear data-reset control.
- Conduct teacher review for syllabus fit, accessibility, cultural safety and factual accuracy.

**Exit criterion:** a teacher can inspect an item and see its source, outcome, intended misconception, difficulty intent and revision history.

### Phase 1 — Build one intrinsically integrated vertical slice

**Goal:** prove the learning loop on one level before rewriting twenty.

- Choose Level 8 (disease/miasma) or Level 3 (chemical change/phlogiston).
- Add mission brief, prediction, one investigation instrument, live evidence, two Evidence Breaks and a CER debrief.
- Implement hints, second attempts and non-punitive evidence advantages.
- Upgrade that enemy's Field Notes to the refutation dossier format.
- Add first-attempt, hint and delayed-review tracking.
- Playtest with students and teachers before scaling.

**Exit criterion:** the scientific task changes how the player interprets and responds to the battle, and an unseen parallel item shows whether learning transferred.

### Phase 2 — Add mastery, spacing and classroom reporting

**Goal:** turn sessions into useful formative practice.

- Implement due-item scheduling and concept mastery states.
- Mix current, missed and interleaved review items.
- Add graph, variable, evidence-selection and method-ordering formats.
- Build teacher session setup and local CSV/JSON export.
- Show separate combat and learning summaries.
- Add accessible alternatives for timed, visual and motor interactions.

**Exit criterion:** the game can tell a student what to review and a teacher what needs reteaching, without using battle skill as a proxy.

### Phase 3 — Scale the evidence-led story across the campaign

**Goal:** give all 20 levels a coherent practice and narrative progression.

- Organise levels into the four Atlas chapters.
- Give every mission a claim, investigation, evidence task and debrief.
- Complete all Field Notes dossiers.
- Add short mentor dialogue tied to player evidence, including uncertainty and model revision.
- Ensure mission content swaps sensibly for the teacher-selected topic or explicitly label curated campaign/topic combinations.
- Reframe labels that personify groups rather than claims.

**Exit criterion:** every level can answer, "What did the learner observe, reason about and explain that they could not do by merely winning the battle?"

### Phase 4 — Validate educational impact

**Goal:** support claims with classroom evidence.

- Use a short pre-test, immediate post-test and delayed test with unseen parallel items.
- Compare the current reward-quiz version with the integrated evidence version where practical.
- Measure learning by outcome and misconception, not repeated-item accuracy alone.
- Track engagement, completion, hint use, accessibility barriers and teacher usability.
- Interview students about whether the evidence felt meaningful or like an interruption.
- Revise content using item statistics and teacher judgement; do not automatically discard challenging but valuable items.

**Exit criterion:** the project can state a bounded, evidenced claim such as "supports retention and application of these concepts after prior instruction" rather than the broad claim "teaches NSW science".

## Highest-impact backlog

In priority order:

1. **Fix content-to-context alignment.** A mission's claim, enemies, question selection and feedback must point to the same concept.
2. **Add IDs, outcome tags and learner memory.** Without this, there is no spacing, trustworthy progress or teacher insight.
3. **Build one claim–evidence–reasoning vertical slice.** Validate intrinsic integration before scaling.
4. **Turn Field Notes into refutation dossiers.** This reuses the strongest existing theme with modest UI scope.
5. **Make errors scaffold learning.** Add distractor-specific feedback, hints and second attempts; reduce survival-impacting reward gaps.
6. **Add Working scientifically task formats.** Start with graph reading, variables, fair tests and evidence selection.
7. **Separate combat and learning achievement.** Keep stars for play; add mastery states for science.
8. **Introduce the Atlas storyline.** Use brief, evidence-driven scenes; avoid a large cinematic project.
9. **Add teacher setup and export.** Build it only after the underlying learning records are meaningful.
10. **Evaluate with unseen and delayed items.** Do this before marketing the game as an effective teaching intervention.

## Practical classroom positioning during the transition

Until the integrated loop and validation work are complete, describe Science Defender as:

> A curriculum-informed tower-defence revision game for practising and discussing Years 7–10 science concepts after instruction.

Recommended teacher use now:

- 10–20 minute retrieval warm-up or end-of-unit revision;
- pairs who must explain their choice before clicking;
- pause after a misconception enemy appears and ask what evidence replaced that model;
- use the Field Notes as a prompt for a teacher-led correction, not as the complete explanation;
- avoid treating stars, score or level completion as assessment grades; and
- follow play with one unseen written/application task.

That is an honest and still valuable role. The proposed overhaul can move the game from a polished revision wrapper toward a genuinely integrated science-learning experience.

## Evidence consulted

- NSW Education Standards Authority, [Science 7–10 Syllabus (2023): Outcomes](https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/outcomes) and [course overview](https://curriculum.nsw.edu.au/learning-areas/science/science-7-10-2023/overview/course). Implementation began in 2026.
- NSW Education Standards Authority, [Formative assessment](https://curriculum.nsw.edu.au/assessment-and-reporting/formative-assessment).
- Habgood, M. P. J., & Ainsworth, S. E. (2011), [Motivating Children to Learn Effectively: Exploring the Value of Intrinsic Integration in Educational Games](https://eric.ed.gov/?id=EJ922627).
- Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013), [Improving Students' Learning With Effective Learning Techniques](https://pubmed.ncbi.nlm.nih.gov/26173288/).
- Butler, A. C., & Roediger, H. L. (2008), [Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing](https://pubmed.ncbi.nlm.nih.gov/18491500/).
- Weingartner, K. M., & Masnick, A. M. (2019), [Refutation texts: Implying the refutation of a scientific misconception can facilitate knowledge revision](https://doi.org/10.1016/j.cedpsych.2019.03.004).
- Jemmali, C., Bunian, S., Mambretti, A., & El-Nasr, M. S. (2018), [Educational Game Design: An Empirical Study of the Effects of Narrative](https://doi.org/10.1145/3235765.3235783).
