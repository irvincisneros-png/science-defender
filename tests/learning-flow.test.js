const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function loadQuestionContext() {
    const storage = new Map();
    const context = vm.createContext({
        console,
        Date,
        Math,
        Map,
        JSON,
        localStorage: {
            getItem: key => storage.has(key) ? storage.get(key) : null,
            setItem: (key, value) => storage.set(key, value),
            removeItem: key => storage.delete(key)
        }
    });
    context.window = context;
    ["questions-y7.js", "questions-y8.js", "questions-y9.js", "questions-y10.js", "questions.js", "learning.js"].forEach(file => {
        vm.runInContext(fs.readFileSync(path.join(root, "js", file), "utf8"), context, { filename: file });
    });
    return { context, storage };
}

test("all curriculum questions receive deterministic, unique stable IDs", () => {
    const { context } = loadQuestionContext();
    const ids = [];
    for (const year of [7, 8, 9, 10]) {
        const manager = new context.QuestionManager();
        manager.setSelection(year, "yearly");
        ids.push(...manager.activePool.map(item => item.id));
        const rebuilt = new context.QuestionManager();
        rebuilt.setSelection(year, "yearly");
        assert.deepEqual(rebuilt.activePool.map(item => item.id).sort(), manager.activePool.map(item => item.id).sort());
    }
    assert.ok(ids.length >= 895, `expected at least 895 items, got ${ids.length}`);
    assert.equal(new Set(ids).size, ids.length);
    ids.forEach(id => assert.match(id, /^sd\.y(?:7|8|9|10)\.[a-z0-9]+\.[0-9a-f]{8}\.v1$/));
});

test("learning mastery persists separately from combat stars and never overclaims secure mastery", () => {
    const { context, storage } = loadQuestionContext();
    storage.set("std_stars_v1", JSON.stringify({ 0: 3 }));
    const store = new context.LearningMasteryStore(context.localStorage);
    const first = store.record("atlas-phlogiston-evidence-001", { correct: true, responseTimeMs: 4200 });
    assert.equal(first.masteryState, "developing");
    assert.equal(JSON.parse(storage.get("std_stars_v1"))[0], 3);
    assert.ok(storage.has("std_learning_mastery_v1"));
    assert.notEqual("std_learning_mastery_v1", "std_stars_v1");
});

test("Level 3 mission has prediction, two evidence breaks, retries, and CER IDs", () => {
    const { context } = loadQuestionContext();
    const mission = context.ATLAS_MISSIONS[2];
    assert.equal(mission.id, "atlas-phlogiston-01");
    assert.equal(mission.enemyType, "phlogiston");
    assert.ok(mission.prediction.id);
    assert.deepEqual(Array.from(mission.breaks, item => item.wave), [2, 4]);
    mission.breaks.forEach(item => {
        assert.ok(item.id && item.hint && item.advantage);
        assert.ok(item.feedback.length === item.options.length);
    });
    assert.ok(mission.debrief.id);
    assert.deepEqual(Array.from(mission.debrief.answers), [1, 1, 1]);
});

test("phlogiston claim shield changes damage only while evidence is unresolved", () => {
    const context = vm.createContext({ console, Math });
    context.window = context;
    vm.runInContext(fs.readFileSync(path.join(root, "js/enemies.js"), "utf8"), context);
    const enemy = new context.PhlogistonEnemy(0, 0, 1);
    enemy.claimShieldActive = true;
    enemy.claimShieldFactor = 0.65;
    const before = enemy.health;
    const shielded = enemy.takeDamage(20, "true");
    assert.equal(shielded, 13);
    enemy.claimShieldActive = false;
    const exposed = enemy.takeDamage(20, "true");
    assert.equal(exposed, 20);
    assert.equal(before - enemy.health, 33);
});

test("learning flow is wired before game and final victory is CER-gated", () => {
    const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
    const game = fs.readFileSync(path.join(root, "js/game.js"), "utf8");
    assert.ok(html.indexOf('src="js/learning.js"') < html.indexOf('src="js/game.js"'));
    assert.match(game, /beginAtlasMission\(levelIndex, endless\)/);
    assert.match(game, /maybeOpenEvidenceBreak\(this\.waveNumber\)/);
    assert.match(game, /if \(this\.learningSession && !this\.learningSession\.debriefComplete\)/);
});
