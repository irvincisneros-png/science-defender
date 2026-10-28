// Atlas of Evidence — local-first learning progression kept separate from combat stars.
const LEARNING_STORAGE_KEY = "std_learning_mastery_v1";

const ATLAS_MISSIONS = {
    2: {
        id: "atlas-phlogiston-01",
        chapter: "Atlas I — First Observations",
        title: "The Fire That Supposedly Escapes",
        claim: "Burning materials release a substance called phlogiston into the air.",
        concept: "combustion-conservation-mass",
        enemyType: "phlogiston",
        prediction: {
            id: "atlas-phlogiston-predict-001",
            prompt: "If phlogiston escapes during burning, what should happen to the total mass of a sealed vessel?",
            options: ["It should decrease", "It should increase", "It should stay exactly the same"],
            answer: 0,
            feedback: [
                "That is the prediction made by the phlogiston claim. Now test it against battlefield evidence.",
                "An increase would conflict with a substance escaping, so keep that alternative in mind.",
                "A sealed system conserves total mass; the phlogiston claim specifically predicts an escaping substance."
            ]
        },
        breaks: [
            {
                id: "atlas-phlogiston-evidence-001", wave: 2,
                title: "Evidence Break I — The Sealed Vessel", instrument: "oxygen-balance",
                observation: "Sealed vessel before heating: 100.0 g. After reaction and cooling: 100.0 g.",
                prompt: "Which interpretation is best supported?",
                options: [
                    "Phlogiston escaped, but the balance failed to detect it.",
                    "The unchanged total mass supports conservation of mass in the sealed system.",
                    "Burning created new matter from nothing."
                ],
                answer: 1,
                hint: "Compare the mass of the whole sealed system before and after, not just one material inside it.",
                feedback: [
                    "That adds an untested excuse. A scientific model should explain the measured result without inventing an invisible loss.",
                    "Yes. No mass left the sealed vessel, so its total mass stayed constant.",
                    "The reading shows rearrangement of matter, not creation of matter."
                ],
                advantage: "Evidence disrupts the claim shield; phlogiston embers now take full damage."
            },
            {
                id: "atlas-phlogiston-evidence-002", wave: 4,
                title: "Evidence Break II — The Metal Sample", instrument: "oxygen-balance",
                observation: "Metal before heating: 12.0 g. Metal oxide after heating in air: 15.2 g.",
                prompt: "Why did the solid gain mass?",
                options: [
                    "Oxygen from the air combined with the metal.",
                    "The metal absorbed phlogiston from the flame.",
                    "The balance becomes heavier near heat."
                ],
                answer: 0,
                hint: "Identify matter that could enter the sample from its surroundings during the reaction.",
                feedback: [
                    "Correct. The added oxygen accounts for the increase and supports the modern combustion model.",
                    "Phlogiston theory predicted a substance leaving during burning, not oxygen joining the metal.",
                    "A measurement fault needs independent evidence; repeated cooled samples show the same gain."
                ],
                advantage: "The oxygen model is confirmed; phlogiston embers now arrive slowed for analysis."
            }
        ],
        debrief: {
            id: "atlas-phlogiston-cer-001", title: "Claim–Evidence–Reasoning Debrief",
            claim: ["Combustion releases phlogiston.", "Combustion rearranges matter as substances react with oxygen.", "Combustion creates matter from nothing."],
            evidence: ["The flame looked bright.", "A sealed system kept the same total mass, while heated metal gained the mass of oxygen.", "The enemies moved quickly."],
            reasoning: ["Appearances are enough to prove a model.", "Conservation of mass and the oxygen gain explain both results without an escaping substance.", "Older explanations are automatically wrong."],
            answers: [1, 1, 1]
        }
    }
};

class LearningMasteryStore {
    constructor(storage = (typeof localStorage !== "undefined" ? localStorage : null)) {
        this.storage = storage;
        this.data = this.load();
    }
    load() {
        if (!this.storage) return { version: 1, items: {}, missions: {} };
        try {
            const parsed = JSON.parse(this.storage.getItem(LEARNING_STORAGE_KEY));
            return parsed && parsed.version === 1 ? parsed : { version: 1, items: {}, missions: {} };
        } catch (error) { return { version: 1, items: {}, missions: {} }; }
    }
    save() {
        if (!this.storage) return;
        try { this.storage.setItem(LEARNING_STORAGE_KEY, JSON.stringify(this.data)); } catch (error) {}
    }
    record(itemId, result = {}) {
        if (!itemId) return null;
        const now = Date.now();
        const previous = this.data.items[itemId] || { attempts: 0, correct: 0, firstAttemptCorrect: null, hintCount: 0 };
        const attempts = previous.attempts + 1;
        const entry = {
            ...previous,
            attempts,
            correct: previous.correct + (result.correct ? 1 : 0),
            firstAttemptCorrect: previous.firstAttemptCorrect == null ? !!result.correct : previous.firstAttemptCorrect,
            hintCount: previous.hintCount + (result.hintUsed ? 1 : 0),
            lastSeen: now,
            responseTimeMs: Math.max(0, Number(result.responseTimeMs) || 0),
            confidence: result.confidence || previous.confidence || "unreported",
            // In-level success is developing, not secure. Secure mastery requires
            // a later unseen transfer item, which this first vertical slice does
            // not pretend to provide.
            masteryState: result.correct ? "developing" : "needs-review",
            nextDue: now + (result.correct ? 3 : 1) * 86400000
        };
        this.data.items[itemId] = entry;
        this.save();
        return entry;
    }
    completeMission(missionId, summary = {}) {
        this.data.missions[missionId] = { ...summary, completedAt: Date.now() };
        this.save();
    }
    mission(missionId) { return this.data.missions[missionId] || null; }
    evidenceCount() { return Object.keys(this.data.items).length; }
}

window.ATLAS_MISSIONS = ATLAS_MISSIONS;
window.LearningMasteryStore = LearningMasteryStore;
window.LEARNING_STORAGE_KEY = LEARNING_STORAGE_KEY;
