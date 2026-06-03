// js/questions.js
// QuestionManager for Science Tower Defense.
//
// Questions are NSW Science 7-10 multiple-choice items, organised by YEAR GROUP
// (7, 8, 9, 10) and TOPIC. The actual question data lives in the auto-generated
// js/questions-y7.js ... questions-y10.js files, which populate window.QUESTION_BANK
// (loaded before this file in index.html).
//
// A teacher selects a Year (7-10) and a focus:
//   - one of the 4 topics for that year,
//   - "halfyearly"  -> topics 1 & 2 (half-yearly exam prep),
//   - "yearly"      -> all 4 topics (yearly exam prep).
//
// FUTURE: the per-topic arrays could be sourced from editable .md files; for now
// they are JS data so the game can run fully offline with no build step.

// Ordered topic metadata per year group. The KEYS here must match the keys used
// in the questions-yN.js data files. Order matters: topic[0] & topic[1] make up
// the half-yearly exam.
// Order MATCHES the NSW Junior Science Syllabus (topic 1 & 2 define the half-yearly).
window.TOPIC_META = {
    7: [
        { key: "universe",       name: "Observing the Universe" },
        { key: "forces",         name: "Forces" },
        { key: "cells",          name: "Cells & Classification" },
        { key: "solutions",      name: "Solutions & Mixtures" },
    ],
    8: [
        { key: "living",         name: "Living Systems" },
        { key: "periodic",       name: "Periodic Table & Atomic Structure" },
        { key: "change",         name: "Change" },
        { key: "data1",          name: "Data Science 1" },
    ],
    9: [
        { key: "energy",         name: "Energy" },
        { key: "diseases",       name: "Diseases" },
        { key: "materials",      name: "Materials" },
        { key: "sustainability", name: "Environmental Sustainability" },
    ],
    10: [
        { key: "genetics",       name: "Genetics & Evolutionary Change" },
        { key: "reactions",      name: "Chemical Reactions" },
        { key: "waves",          name: "Waves & Motion" },
        { key: "data2",          name: "Data Science 2" },
    ],
};

// Minimal fallback so the game never crashes if a data file failed to load.
const FALLBACK_QUESTIONS = [
    { q: "Which is the SI unit of force?", o: ["Joule", "Newton", "Watt", "Pascal"], a: 1, exp: "The newton (N) is the SI unit of force.", topic: "forces", topicName: "Science" },
    { q: "What is the chemical formula for water?", o: ["CO2", "H2O", "O2", "NaCl"], a: 1, exp: "Water is two hydrogen atoms bonded to one oxygen atom.", topic: "reactions", topicName: "Science" },
    { q: "Which organelle is the powerhouse of the cell?", o: ["Nucleus", "Ribosome", "Mitochondrion", "Chloroplast"], a: 2, exp: "Mitochondria produce most of the cell's ATP energy.", topic: "cells", topicName: "Science" },
];

class QuestionManager {
    constructor() {
        this.currentYear = 8;            // default to a year the teacher uses
        this.currentSelection = "yearly"; // topic key | "halfyearly" | "yearly"
        this.activePool = [];            // full chosen set (not mutated)
        this.queue = [];                 // shuffled working queue (popped per draw)
        this.initializePool();
    }

    // Returns the display name for the current selection (for UI headers).
    selectionLabel() {
        if (this.currentSelection === "yearly") return `Year ${this.currentYear} — Yearly Exam`;
        if (this.currentSelection === "halfyearly") return `Year ${this.currentYear} — Half-Yearly Exam`;
        const meta = (window.TOPIC_META[this.currentYear] || []).find(t => t.key === this.currentSelection);
        return meta ? `Year ${this.currentYear} — ${meta.name}` : `Year ${this.currentYear}`;
    }

    // year: 7-10, selection: topic key | "halfyearly" | "yearly"
    setSelection(year, selection) {
        const y = parseInt(year, 10);
        if ([7, 8, 9, 10].includes(y)) this.currentYear = y;
        if (selection) this.currentSelection = selection;
        this.initializePool();
    }

    // Backwards-compatible shim for any older callers.
    setCategory(topic, difficulty) {
        if (topic) this.setSelection(this.currentYear, topic);
    }

    initializePool() {
        this.activePool = [];
        const bank = (window.QUESTION_BANK && window.QUESTION_BANK[this.currentYear]) || {};
        const meta = window.TOPIC_META[this.currentYear] || [];
        const allKeys = meta.map(t => t.key);

        let chosenKeys;
        if (this.currentSelection === "yearly") chosenKeys = allKeys;
        else if (this.currentSelection === "halfyearly") chosenKeys = allKeys.slice(0, 2);
        else if (allKeys.includes(this.currentSelection)) chosenKeys = [this.currentSelection];
        else chosenKeys = allKeys; // unknown selection -> everything

        chosenKeys.forEach(key => {
            const name = (meta.find(t => t.key === key) || {}).name || "Science";
            (bank[key] || []).forEach(q => {
                this.activePool.push({ ...q, topic: key, topicName: name });
            });
        });

        if (this.activePool.length === 0) {
            this.activePool = FALLBACK_QUESTIONS.map(q => ({ ...q }));
        }

        this.queue = this.shuffledCopy(this.activePool);
    }

    shuffledCopy(array) {
        const a = array.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // Draws a question, cycling through the whole pool before any repeats.
    getRandomQuestion() {
        if (!this.queue || this.queue.length === 0) {
            this.queue = this.shuffledCopy(this.activePool);
        }
        if (this.queue.length === 0) return { ...FALLBACK_QUESTIONS[0] };
        return this.queue.pop();
    }

    // Used to gate tower specialization. We just draw from the active revision
    // pool (the year/topic the teacher selected) regardless of the tower's
    // science discipline, so the quiz always matches what students are revising.
    getQuestionByTopic(topic) {
        return this.getRandomQuestion();
    }

    // How many questions are loaded for the current selection (for UI display).
    poolSize() {
        return this.activePool.length;
    }
}

// Make globally available
window.QuestionManager = QuestionManager;
