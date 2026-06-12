// js/towers.js
// 2D Cartoon Fantasy Towers (Kingdom Rush style) with preloader checks and high-fidelity vector fallbacks

class Projectile {
    constructor(x, y, target, speed, damage, type, extraData = {}) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = speed;
        this.damage = damage;
        this.type = type; // 'flask', 'spore', 'bullet', 'gravity'
        this.extraData = extraData;
        this.isDead = false;

        this.startX = x;
        this.startY = y;
        this.totalDist = 0;
        this.calcDistToTarget();
        this.spinAngle = 0;
        this.trail = []; // recent positions, drawn as a fading streak
    }

    static TRAIL_COLORS = { spore: "#00ff66", flask: "#ff9900", bullet: "#00ffff", gravity: "#bf55ec" };

    calcDistToTarget() {
        if (!this.target) return;
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        this.totalDist = Math.sqrt(dx * dx + dy * dy);
    }

    update(enemies, particleSystem) {
        if (this.isDead) return false;

        if (this.target && this.target.isDead) {
            let closest = null;
            let minDist = 150;
            enemies.forEach(e => {
                // Dead/leaked enemies linger in the array until end-of-frame
                // cleanup — retargeting one would waste the shot on a corpse.
                if (e.isDead || e.reachedEnd) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    closest = e;
                }
            });
            if (closest) this.target = closest;
        }

        const tx = this.target ? this.target.x : this.x;
        const ty = this.target ? this.target.y : this.y;

        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.speed) {
            this.hit(particleSystem, enemies);
            this.isDead = true;
            return false;
        }

        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
        this.x += (dx / dist) * this.speed;
        this.y += (dy / dist) * this.speed;
        this.spinAngle += 0.18;
        return true;
    }

    hit(particleSystem, enemies) {
        const tx = this.target ? this.target.x : this.x;
        const ty = this.target ? this.target.y : this.y;
        if (window.audioManager) window.audioManager.playSfx(`projectile_${this.type}_hit`);

        if (this.type === "spore") {
            if (this.target && !this.target.isDead) {
                const dmgType = this.extraData.armorPierce ? "true" : "physical";
                const dealt = this.target.takeDamage(this.damage, dmgType);
                if (this.extraData.slowOnHit) {
                    this.target.applySlow(this.extraData.slowRatio || 0.5, this.extraData.slowDur || 1.5);
                } else {
                    this.target.applySlow(0.6, 2.5);
                }
                this.target.applyPoison(
                    this.damage * 0.15 * (this.extraData.poisonMult || 1),
                    this.extraData.poisonDur || 3.0
                );

                particleSystem.addFloatingText(this.target.x, this.target.y - 12, `-${Math.round(dealt)}`, "#00ff66", 12);
                particleSystem.createExplosion(this.target.x, this.target.y, "#00ff66", 6, 2.5);
            }
        }
        else if (this.type === "flask") {
            const splashRadius = this.extraData.splashRadius || 60;
            const meltFactor = this.extraData.meltFactor || 1.25;
            const duration = this.extraData.duration || 3.5;
            const dmgType = this.extraData.armorPierce ? "true" : "acid";

            // Bubbly chemical splash explosion
            particleSystem.createExplosion(tx, ty, "#ff6600", 16, 4.0);
            particleSystem.createToxicCloud(tx, ty, splashRadius, 6);

            enemies.forEach(e => {
                if (e.flying) return; // ground-only acid splash
                const dist = Math.hypot(e.x - tx, e.y - ty);
                if (dist <= splashRadius) {
                    const dealt = e.takeDamage(this.damage, dmgType);
                    e.applyArmorMelt(meltFactor, duration);
                    e.applyPoison(this.damage * 0.08, duration);
                    if (this.extraData.slowOnHit) {
                        e.applySlow(this.extraData.slowRatio || 0.5, this.extraData.slowDur || 1.5);
                    }
                    particleSystem.addFloatingText(e.x, e.y - 12, `-${Math.round(dealt)}`, "#ff6600", 12);
                }
            });
        }
        else if (this.type === "bullet") {
            // Physics sniper bullet — single target, armor pierce capable
            if (this.target && !this.target.isDead) {
                const dmgType = this.extraData.armorPierce ? "true" : "energy";
                const dealt = this.target.takeDamage(this.damage, dmgType);
                if (this.extraData.slowOnHit) {
                    this.target.applySlow(this.extraData.slowRatio || 0.4, this.extraData.slowDur || 1.5);
                }
                particleSystem.addFloatingText(this.target.x, this.target.y - 12, `-${Math.round(dealt)}`, "#00ffff", 14);
                particleSystem.createExplosion(this.target.x, this.target.y, "#00ffff", 5, 2.0);
                particleSystem.createLightning(tx, ty, this.target.x, this.target.y, "#00ffff");
            }
        }
        else if (this.type === "gravity") {
            // Astronomy slow pulse — hits in area around target point
            const slowRadius = this.extraData.slowRadius || 50;
            const slowRatio = this.extraData.slowRatio || 0.45;
            const slowDur   = this.extraData.slowDur || 2.5;
            const dmgType   = this.extraData.armorPierce ? "true" : "magic";

            particleSystem.createShockwave(tx, ty, slowRadius, "#bf55ec", 3.0, 2);
            particleSystem.createExplosion(tx, ty, "#bf55ec", 8, 2.5);

            enemies.forEach(e => {
                if (e.isDead) return;
                const dist = Math.hypot(e.x - tx, e.y - ty);
                if (dist <= slowRadius) {
                    const dealt = e.takeDamage(this.damage, dmgType);
                    e.applySlow(slowRatio, slowDur);
                    if (this.extraData.slowOnHit) {
                        // Extra strong slow on speed-upgraded tower
                        e.applySlow(slowRatio * 0.7, slowDur * 1.5);
                    }
                    particleSystem.addFloatingText(e.x, e.y - 12, `-${Math.round(dealt)}`, "#bf55ec", 12);
                    particleSystem.createGravityVortex(e.x, e.y, 20, 1.5);
                }
            });
        }
    }

    draw(ctx) {
        // Fading motion streak behind the projectile.
        if (this.trail.length > 1) {
            ctx.save();
            ctx.strokeStyle = Projectile.TRAIL_COLORS[this.type] || "#ffffff";
            ctx.lineCap = "round";
            for (let i = 1; i < this.trail.length; i++) {
                const k = i / this.trail.length;
                ctx.globalAlpha = k * 0.35;
                ctx.lineWidth = 1 + k * 3.5;
                ctx.beginPath();
                ctx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
                ctx.lineTo(this.trail[i].x, this.trail[i].y);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.spinAngle);

        const img = window.spriteAssets ? window.spriteAssets[`proj_${this.type}`] : null;
        if (img) {
            ctx.drawImage(img, -12, -12, 24, 24);
        } else {
            // High fidelity vector projectile drawing fallbacks
            ctx.strokeStyle = "#1b1424";
            ctx.lineWidth = 2.0;

            if (this.type === "spore") {
                // Shiny green cartoon spore needle
                const sporeGrad = ctx.createLinearGradient(-2, -6, 2, 6);
                sporeGrad.addColorStop(0, "#a0f5a0");
                sporeGrad.addColorStop(1, "#00ff66");
                ctx.fillStyle = sporeGrad;

                ctx.beginPath();
                ctx.moveTo(0, -7);
                ctx.lineTo(3.5, 0);
                ctx.lineTo(1.5, 6);
                ctx.lineTo(-1.5, 6);
                ctx.lineTo(-3.5, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            else if (this.type === "flask") {
                // Round cute cartoon flask
                const flaskGrad = ctx.createRadialGradient(-2, 2, 1, 0, 0, 6);
                flaskGrad.addColorStop(0, "#ffffff");
                flaskGrad.addColorStop(0.3, "#ff9900");
                flaskGrad.addColorStop(1, "#d35400");
                ctx.fillStyle = flaskGrad;

                ctx.beginPath();
                ctx.arc(0, 2, 6.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Neck
                ctx.fillStyle = "#bdc3c7";
                ctx.fillRect(-2, -4, 4, 3);
                ctx.strokeRect(-2, -4, 4, 3);
            }
            else if (this.type === "bullet") {
                // Cyan sniper bullet — elongated needle
                const bulletGrad = ctx.createLinearGradient(-3, -8, 3, 8);
                bulletGrad.addColorStop(0, "#ffffff");
                bulletGrad.addColorStop(0.4, "#00ffff");
                bulletGrad.addColorStop(1, "#007fa8");
                ctx.fillStyle = bulletGrad;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#00ffff";
                ctx.beginPath();
                ctx.moveTo(0, -9);
                ctx.lineTo(2.5, -2);
                ctx.lineTo(2.5, 5);
                ctx.lineTo(-2.5, 5);
                ctx.lineTo(-2.5, -2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
            else if (this.type === "gravity") {
                // Purple swirling orb
                const gravGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
                gravGrad.addColorStop(0, "#ffffff");
                gravGrad.addColorStop(0.4, "#d7bde2");
                gravGrad.addColorStop(1, "#bf55ec");
                ctx.fillStyle = gravGrad;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "#bf55ec";
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.shadowBlur = 0;
            }
        }
        ctx.restore();
    }
}

class Tower {
    constructor(x, y, cost, range, cooldown, name, color, type) {
        this.x = x;
        this.y = y;
        this.cost = cost;
        this.range = range;
        this.cooldown = cooldown;
        this.cooldownTimer = 0;
        this.name = name;
        this.color = color;
        this.type = type;

        this.level = 1;
        this.targetMode = "first";
        this.isHovered = false;
        this.size = 64; // Cartoon tower bounding box width/height (matches 64px sprite cell)

        this.canHitAir = true;       // subclasses set false for ground-only towers
        this.damageType = "physical"; // 'physical' | 'energy' | 'acid' | 'magic'
        this.branch = null;           // 'a' | 'b' once specialized at level 4

        // Permanent tower-damage meta upgrade (Empirical Precision).
        this.dmgMult = (typeof window !== "undefined" && window.SCI_TOWER_DMG_MULT) || 1;

        // === per-stat upgrade ranks ===
        // Each goes 0→1→2→3; when total = 3 the tower reaches level 3 and specialization unlocks.
        this.dmgRank   = 0;
        this.rangeRank = 0;
        this.spdRank   = 0;

        // === B: Upgrade mechanic flags ===
        this.armorPierce     = false;  // set by "damage" upgrade
        this.prioritizeFar   = false;  // set by "range" upgrade — target furthest-along/highest-HP
        this.slowOnHit       = false;  // set by "speed" upgrade

        // === D: Anti-stack penalty (set externally by game.js) ===
        // Default 1 = no penalty.  game.js sets this.stackPenalty when stacking detected.
        // Do NOT assign a value here; we just read (this.stackPenalty || 1) in fire().
    }

    upgradeCost() {
        if (this.level === 1) return Math.floor(this.cost * 0.7);
        if (this.level === 2) return Math.floor(this.cost * 1.0);
        return 0;
    }

    ultimateRpCost() {
        return 40;
    }

    // ─── TASK B: stat-upgrade options ───────────────────────────────────────────

    /**
     * Returns an array of up to 3 upgrade option objects that the UI can render.
     * Each option: { kind, label, desc, cost, maxed }
     * kind is one of: "damage" | "range" | "speed"
     * Once level === 3 all options are marked maxed (specialization gate).
     */
    getUpgradeOptions() {
        const totalRanks = this.dmgRank + this.rangeRank + this.spdRank;
        // Cost scales with how many upgrades have already been bought
        const baseCost = this.cost;
        const scaledCost = Math.floor(baseCost * (0.7 + totalRanks * 0.3));
        const atCap = this.level >= 3;

        return [
            {
                kind:  "damage",
                label: "+Attack",
                desc:  "+Damage & armor-pierce: hits ignore enemy armor.",
                cost:  scaledCost,
                maxed: atCap || this.dmgRank >= 3
            },
            {
                kind:  "range",
                label: "+Range",
                desc:  "+Range & target furthest: prioritizes furthest-along / highest-HP enemy (diminishing returns past 1.5× base).",
                cost:  scaledCost,
                maxed: atCap || this.rangeRank >= 3
            },
            {
                kind:  "speed",
                label: "+Attack Speed",
                desc:  "+Atk speed & slow-on-hit: every shot slows the target.",
                cost:  scaledCost,
                maxed: atCap || this.spdRank >= 3
            }
        ];
    }

    /**
     * Applies one stat upgrade by kind.
     * Increments this.level by 1 (so reaching 3 still gates specialization).
     * Returns true on success, false if invalid or already at level 3.
     */
    applyUpgradeOption(kind) {
        if (this.level >= 3) return false;

        if (kind === "damage") {
            if (this.dmgRank >= 3) return false;
            this.damage = (this.damage || 1) * 1.30;
            this.dmgRank++;
            // TASK B: armor-pierce flag — every damage upgrade grants/confirms armor-pierce
            this.armorPierce = true;
        } else if (kind === "range") {
            if (this.rangeRank >= 3) return false;
            // TASK B: diminishing returns beyond 1.5× base range
            const baseRange = (this._baseRange !== undefined) ? this._baseRange : this.range;
            if (this._baseRange === undefined) this._baseRange = this.range;
            const currentMult = this.range / baseRange;
            const increment = baseRange * 0.18;
            // Beyond 1.5× base, each tier only gives 70% of the stated increment
            const drFactor = (currentMult >= 1.5) ? 0.70 : 1.0;
            this.range += increment * drFactor;
            this.rangeRank++;
            // TASK B: prioritize furthest-along/highest-HP enemy
            this.prioritizeFar = true;
        } else if (kind === "speed") {
            if (this.spdRank >= 3) return false;
            this.cooldown = Math.max(6, Math.floor(this.cooldown * 0.82));
            this.spdRank++;
            // TASK B: slow-on-hit flag
            this.slowOnHit = true;
        } else {
            return false;
        }

        this.level++;
        return true;
    }

    upgrade() {
        // Legacy path — defaults to a damage boost, keeps existing callers working.
        return this.applyUpgradeOption("damage");
    }

    // Realm Defense-style specialization fork. At level 3 the player picks one of
    // two branches; each tower overrides branchInfo() and reads this.branch in fire().
    branchInfo() {
        return {
            a: { name: "Specialization A", desc: "" },
            b: { name: "Specialization B", desc: "" }
        };
    }

    chooseBranch(branchKey) {
        if (this.level !== 3 || (branchKey !== "a" && branchKey !== "b")) return false;
        this.level = 4;
        this.branch = branchKey;
        this.range *= 1.25;
        this.cooldown = Math.max(6, Math.floor(this.cooldown * 0.8));
        const info = this.branchInfo();
        this.name = (info[branchKey] && info[branchKey].name) || this.name;
        return true;
    }

    update(enemies, projectiles, particleSystem) {
        if (this.cooldownTimer > 0) this.cooldownTimer--;

        if (this.cooldownTimer <= 0 && enemies.length > 0) {
            const targets = this.findTargets(enemies);
            if (targets.length > 0) {
                this.fire(targets, projectiles, particleSystem, enemies);
                if (window.audioManager) window.audioManager.playSfx(`tower_${this.type}_fire`);
                this.cooldownTimer = this.cooldown;
                this._lastFireTime = performance.now(); // trigger attack animation + recoil pop
                // Muzzle flash: a small burst in the tower's colour at the emitter.
                if (particleSystem) particleSystem.createExplosion(this.x, this.y - 14, this.color, 4, 1.8);
            }
        }
    }

    // Player-controlled targeting (Gap 1). Cycles the modes findTargets already
    // understands. Returns the new mode for UI display.
    static TARGET_MODES = ["first", "strongest", "weakest", "closest"];
    cycleTargetMode() {
        const modes = Tower.TARGET_MODES;
        const i = modes.indexOf(this.targetMode);
        this.targetMode = modes[(i + 1) % modes.length];
        return this.targetMode;
    }

    findTargets(enemies) {
        const inRange = enemies.filter(e => {
            if (e.isDead) return false;
            if (e.flying && !this.canHitAir) return false; // ground-only towers ignore flyers
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            return dist <= this.range;
        });

        if (inRange.length === 0) return [];

        // TASK B: if prioritizeFar is set, target furthest-along / highest-HP enemy
        if (this.prioritizeFar) {
            inRange.sort((a, b) => {
                // Primary: furthest along path (highest waypointIndex)
                if (a.currentWaypointIndex !== b.currentWaypointIndex) {
                    return b.currentWaypointIndex - a.currentWaypointIndex;
                }
                // Secondary: highest HP (tanks/bosses)
                return b.health - a.health;
            });
            return [inRange[0]];
        }

        if (this.targetMode === "first") {
            inRange.sort((a, b) => {
                if (a.currentWaypointIndex !== b.currentWaypointIndex) {
                    return b.currentWaypointIndex - a.currentWaypointIndex;
                }
                const targetA = a.waypoints[a.currentWaypointIndex];
                const targetB = b.waypoints[b.currentWaypointIndex];
                if (!targetA || !targetB) return 0;
                const distA = Math.hypot(a.x - targetA.x, a.y - targetA.y);
                const distB = Math.hypot(b.x - targetB.x, b.y - targetB.y);
                return distA - distB;
            });
        }
        else if (this.targetMode === "strongest") {
            inRange.sort((a, b) => b.health - a.health);
        }
        else if (this.targetMode === "weakest") {
            inRange.sort((a, b) => a.health - b.health);
        }
        else if (this.targetMode === "closest") {
            inRange.sort((a, b) => {
                const distA = Math.hypot(a.x - this.x, a.y - this.y);
                const distB = Math.hypot(b.x - this.x, b.y - this.y);
                return distA - distB;
            });
        }

        return [inRange[0]];
    }

    fire(targets, projectiles, particleSystem, enemies) {
        // Virtual
    }

    draw(ctx) {
        ctx.save();

        if (this.isHovered) {
            // Shiny visual cartoon range aura
            ctx.fillStyle = "rgba(191, 85, 236, 0.04)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "rgba(191, 85, 236, 0.25)";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Soft drop shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.beginPath();
        ctx.arc(this.x, this.y + 16, 18, 0, Math.PI * 2);
        ctx.fill();

        // Idle breathing + a quick recoil pop on fire, applied around the
        // sprite/vector body only (shadow and range ring stay put).
        const _now = performance.now();
        const recoil = this._lastFireTime ? Math.max(0, 1 - (_now - this._lastFireTime) / 160) : 0;
        const liveScale = 1 + Math.sin(_now / 700 + this.x * 0.13) * 0.012 + recoil * 0.07;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(liveScale, liveScale);
        ctx.translate(-this.x, -this.y);

        // Animated sprite sheet (idle/attack); falls back to vector cartoon.
        const sprLvlKey = this.level === 4 ? "4" : this.level === 3 ? "3" : "1";
        const baseKey = `tower_${this.type}_${sprLvlKey}`;
        const atkMeta = window.SHEET_META && window.SHEET_META[`${baseKey}_attack`];
        let towerState = "idle";
        if (atkMeta && this._lastFireTime) {
            const durMs = (atkMeta.cols / atkMeta.fps) * 1000;
            if (performance.now() - this._lastFireTime < durMs) towerState = "attack";
        }
        if (!window.drawSprite(ctx, baseKey, towerState,
                this.x - this.size/2, this.y - this.size/2, this.size, this.size, this._lastFireTime)) {
            // High fidelity vector cartoon drawing fallbacks
            ctx.strokeStyle = "#1b1424";
            ctx.lineWidth = 2.5;
            this.drawCartoonVector(ctx);
        }
        ctx.restore();

        // Star indicator tags
        ctx.save();
        ctx.fillStyle = "#ffcc00";
        ctx.strokeStyle = "#2c1a0c";
        ctx.lineWidth = 1.5;
        ctx.font = "bold 13px 'Fredoka', sans-serif";
        ctx.textAlign = "center";

        let label = "★".repeat(this.level);
        if (this.level === 4) label = "Ω Ultimate";

        ctx.strokeText(label, this.x, this.y - 26);
        ctx.fillText(label, this.x, this.y - 26);
        ctx.restore();

        ctx.restore();
    }

    drawCartoonVector(ctx) {
        // Fallback default circular watchtower base
        const stoneGrad = ctx.createLinearGradient(this.x - 15, this.y, this.x + 15, this.y);
        stoneGrad.addColorStop(0, "#95a5a6");
        stoneGrad.addColorStop(1, "#566573");
        ctx.fillStyle = stoneGrad;

        ctx.beginPath();
        ctx.arc(this.x, this.y + 4, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    // Placeholder required by game.js
    padRef() { return null; }
}

// ─── HELPER: draw a level badge (small coloured ring) ───────────────────────
function _drawLevelRings(ctx, x, y, level, color) {
    // Draw 1–3 small accent rings below the tower to show progression
    const count = Math.min(level, 3);
    for (let i = 0; i < count; i++) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.75;
        ctx.shadowBlur = 5;
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.arc(x + (i - (count - 1) / 2) * 8, y + 20, 3.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// ─── HELPER: draw a specialization glow halo ─────────────────────────────────
function _drawBranchHalo(ctx, x, y, color) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PHYSICS TOWER — SNIPER ROLE
// Long range (~210), slow cooldown, high single-target damage, anti-air
// Targets highest-HP enemy by default (armor-buster role)
// ─────────────────────────────────────────────────────────────────────────────
class PhysicsTower extends Tower {
    constructor(x, y) {
        super(
            x, y,
            100,   // cost
            210,   // range — very long sniper reach
            90,    // cooldown — slow fire (higher = slower)
            "Tesla Coil",
            "#00ffff",
            "physics"
        );
        this.damageType = "energy";
        this.damage = 55;           // high single-target damage
        this.canHitAir = true;      // anti-air sniper
        this.targetMode = "strongest"; // default: target highest-HP enemy
    }

    branchInfo() {
        return {
            a: { name: "Chain Storm Tesla", desc: "Lightning arcs to up to 8 enemies with a wider chain — crowd control." },
            b: { name: "Railgun Tesla", desc: "One devastating armor-piercing bolt, no chaining — single-target burst." }
        };
    }

    fire(targets, projectiles, particleSystem, enemies) {
        const firstTarget = targets[0];
        const stackMult = (this.stackPenalty || 1);
        let baseDamage = this.damage * Math.pow(1.3, this.level - 1) * this.dmgMult * stackMult;
        let maxJumps = 1;
        let chainRange = 90;

        if (this.level === 2) maxJumps = 2;
        if (this.level === 3) maxJumps = 3;
        if (this.level === 4) {
            if (this.branch === "b") {
                // Railgun: single armor-piercing burst.
                maxJumps = 1;
                baseDamage *= 3.8;
            } else {
                // Chain Storm (default 'a'): wide, many jumps.
                maxJumps = 8;
                chainRange = 175;
            }
        }

        // Armor-pierce if upgrade flag set, or Railgun branch
        const isRailgun = (this.level === 4 && this.branch === "b");
        const dmgType = (this.armorPierce || isRailgun) ? "true" : this.damageType;

        if (maxJumps === 1 && !isRailgun) {
            // Standard sniper bullet projectile for levels 1–3
            projectiles.push(new Projectile(
                this.x, this.y,
                firstTarget,
                14,                  // fast bullet
                baseDamage,
                "bullet",
                {
                    armorPierce: this.armorPierce || isRailgun,
                    slowOnHit: this.slowOnHit,
                    slowRatio: 0.45,
                    slowDur: 1.2
                }
            ));
            return;
        }

        // Chain/Railgun: instant hit
        let currentSource = this;
        let currentTarget = firstTarget;
        const hitList = new Set();
        let chainCount = 0;

        while (currentTarget && chainCount < maxJumps) {
            hitList.add(currentTarget);
            const reductionFactor = Math.pow(0.85, chainCount);
            const actualDamage = baseDamage * reductionFactor;
            const dealt = currentTarget.takeDamage(actualDamage, dmgType);

            if (this.slowOnHit) {
                currentTarget.applySlow(0.45, 1.2);
            } else if (Math.random() < (this.level === 4 ? 0.35 : 0.15)) {
                currentTarget.applySlow(0.4, 1.2);
            }

            particleSystem.createLightning(currentSource.x, currentSource.y, currentTarget.x, currentTarget.y, this.color);
            particleSystem.addFloatingText(currentTarget.x, currentTarget.y - 12, `-${Math.round(dealt)}`, this.color, 12);
            particleSystem.createExplosion(currentTarget.x, currentTarget.y, this.color, 4, 2.0);

            let nextTarget = null;
            let minDist = chainRange;

            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (e.isDead || hitList.has(e)) continue;
                const d = Math.hypot(e.x - currentTarget.x, e.y - currentTarget.y);
                if (d < minDist) {
                    minDist = d;
                    nextTarget = e;
                }
            }

            currentSource = currentTarget;
            currentTarget = nextTarget;
            chainCount++;
        }
    }

    drawCartoonVector(ctx) {
        const lv = this.level;
        const specialized = lv === 4;

        if (specialized) {
            const haloColor = this.branch === "b" ? "#ffffff" : this.color;
            _drawBranchHalo(ctx, this.x, this.y, haloColor);
        }

        const bodyH = 24 + (lv - 1) * 5;
        const bodyW = 12 + (lv - 1) * 2;

        const stoneGrad = ctx.createLinearGradient(this.x - bodyW, 0, this.x + bodyW, 0);
        stoneGrad.addColorStop(0, "#bdc3c7");
        stoneGrad.addColorStop(1, "#7f8c8d");
        ctx.fillStyle = stoneGrad;

        ctx.beginPath();
        ctx.moveTo(this.x - bodyW,     this.y + 18);
        ctx.lineTo(this.x - bodyW + 3, this.y - bodyH + 18);
        ctx.lineTo(this.x + bodyW - 3, this.y - bodyH + 18);
        ctx.lineTo(this.x + bodyW,     this.y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#8e6239";
        ctx.fillRect(this.x - bodyW - 1, this.y - bodyH + 12, (bodyW + 1) * 2, 4);
        ctx.strokeRect(this.x - bodyW - 1, this.y - bodyH + 12, (bodyW + 1) * 2, 4);

        if (lv >= 3) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.color;
            ctx.strokeRect(this.x - bodyW + 1, this.y - bodyH + 16, (bodyW - 1) * 2, 14);
            ctx.shadowBlur = 0;
        }

        const rodH = 12 + (lv - 1) * 4;
        ctx.fillStyle = "#d35400";
        ctx.fillRect(this.x - 2.5, this.y - bodyH + 12 - rodH, 5, rodH);
        ctx.strokeRect(this.x - 2.5, this.y - bodyH + 12 - rodH, 5, rodH);

        const orbR = 5.5 + (lv - 1) * 1.5;
        const orbY  = this.y - bodyH + 12 - rodH;
        const energyGrad = ctx.createRadialGradient(this.x - 2, orbY, 1, this.x, orbY, orbR);
        energyGrad.addColorStop(0, "#ffffff");
        energyGrad.addColorStop(1, specialized && this.branch === "b" ? "#ffffff" : this.color);

        ctx.fillStyle = energyGrad;
        ctx.shadowBlur = 6 + lv * 3;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, orbY, orbR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (lv >= 2) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(this.x - bodyW + 3, this.y - bodyH + 15, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        if (lv >= 3) {
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(this.x + bodyW - 3, this.y - bodyH + 15, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        _drawLevelRings(ctx, this.x, this.y, lv, this.color);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHEMISTRY TOWER — AoE/SPLASH ROLE
// Medium range (~150), medium fire, ground-only acid splash
// ─────────────────────────────────────────────────────────────────────────────
class ChemistryTower extends Tower {
    constructor(x, y) {
        super(
            x, y,
            120,   // cost
            150,   // range — medium AoE reach
            80,    // cooldown — medium fire rate
            "Acid Launcher",
            "#ff6600",
            "chemistry"
        );
        this.canHitAir = false;     // ground-only lobbed flasks
        this.damageType = "acid";   // melts armor
        this.damage = 22;
    }

    branchInfo() {
        return {
            a: { name: "Corrosion Flask", desc: "Armor melt is far stronger and lasts much longer — shreds tanks." },
            b: { name: "Detonation Flask", desc: "Huge splash radius and burst damage — clears crowds." }
        };
    }

    fire(targets, projectiles, particleSystem, enemies) {
        const target = targets[0];
        const stackMult = (this.stackPenalty || 1);
        let damage = this.damage * Math.pow(1.35, this.level - 1) * this.dmgMult * stackMult;
        const projectileSpeed = 5.0;

        let splashRad = 70;
        let meltFac = 1.3;
        let dur = 3.5;

        if (this.level === 2) { splashRad = 85; meltFac = 1.4; }
        if (this.level === 3) { splashRad = 100; meltFac = 1.5; }
        if (this.level === 4) {
            if (this.branch === "b") {
                splashRad = 170; meltFac = 1.5; dur = 4.0; damage *= 1.8;
            } else {
                splashRad = 110; meltFac = 2.2; dur = 7.0;
            }
        }

        projectiles.push(new Projectile(
            this.x, this.y - 15,
            target,
            projectileSpeed,
            damage,
            "flask",
            {
                splashRadius: splashRad,
                meltFactor: meltFac,
                duration: dur,
                armorPierce: this.armorPierce,
                slowOnHit: this.slowOnHit,
                slowRatio: 0.40,
                slowDur: 1.5
            }
        ));
    }

    drawCartoonVector(ctx) {
        const lv = this.level;
        const specialized = lv === 4;

        if (specialized) _drawBranchHalo(ctx, this.x, this.y, this.color);

        const baseW = 12 + (lv - 1) * 3;
        ctx.fillStyle = "#566573";
        ctx.fillRect(this.x - baseW, this.y + 12, baseW * 2, 4);
        ctx.strokeRect(this.x - baseW, this.y + 12, baseW * 2, 4);

        const rodH = 24 + (lv - 1) * 3;
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(this.x - 2, this.y - rodH + 12, 4, rodH);
        ctx.strokeRect(this.x - 2, this.y - rodH + 12, 4, rodH);

        if (lv >= 2) {
            ctx.strokeStyle = "#2c3e50";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x - baseW + 2, this.y + 2);
            ctx.lineTo(this.x, this.y - 4);
            ctx.lineTo(this.x + baseW - 2, this.y + 2);
            ctx.stroke();
        }

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        const flaskColor = specialized
            ? (this.branch === "b" ? "rgba(255,0,100,0.55)" : "rgba(255,80,0,0.6)")
            : (lv >= 3 ? "rgba(255,60,0,0.5)" : "rgba(255, 102, 0, 0.4)");
        ctx.fillStyle = flaskColor;

        const flaskTopY = this.y - rodH + 12;
        ctx.beginPath();
        ctx.moveTo(this.x - 4, flaskTopY);
        ctx.lineTo(this.x - 4, flaskTopY + 6);
        ctx.lineTo(this.x - 10 - (lv - 1) * 2, flaskTopY + 16);
        ctx.lineTo(this.x + 10 + (lv - 1) * 2, flaskTopY + 16);
        ctx.lineTo(this.x + 4, flaskTopY + 6);
        ctx.lineTo(this.x + 4, flaskTopY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const liqColor = specialized
            ? (this.branch === "b" ? "#ff0066" : "#ff3300")
            : (lv >= 3 ? "#ff4400" : "#ff6600");
        ctx.fillStyle = liqColor;
        ctx.shadowBlur = lv >= 3 ? 8 : 3;
        ctx.shadowColor = liqColor;
        ctx.beginPath();
        ctx.ellipse(this.x, flaskTopY + 12, 6 + (lv - 1) * 1.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (lv >= 3) {
            ctx.fillStyle = liqColor;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(this.x - 7, flaskTopY + 14, 2.5, 0, Math.PI * 2);
            ctx.arc(this.x + 7, flaskTopY + 13, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        _drawLevelRings(ctx, this.x, this.y, lv, this.color);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BIOLOGY TOWER — RAPID-FIRE ROLE
// Short range (~100), very fast fire, low per-hit damage, anti-air
// Excels vs swarms and fast runners; on-hit effects proc very often
// ─────────────────────────────────────────────────────────────────────────────
class BiologyTower extends Tower {
    constructor(x, y) {
        super(
            x, y,
            80,    // cost
            100,   // range — short rapid-fire reach
            18,    // cooldown — very fast fire
            "Bio-Spore",
            "#00ff66",
            "biology"
        );
        this.damage = 8;           // low per-hit damage
        this.canHitAir = true;     // anti-air capable
    }

    branchInfo() {
        return {
            a: { name: "Swarm Bloom", desc: "Fires spores at up to 3 enemies at once — rapid multi-target." },
            b: { name: "Toxin Spore", desc: "Single target, but injects potent long-lasting poison." }
        };
    }

    fire(targets, projectiles, particleSystem, enemies) {
        const stackMult = (this.stackPenalty || 1);
        const damage = this.damage * Math.pow(1.3, this.level - 1) * this.dmgMult * stackMult;
        const projectileSpeed = 8.5;
        const isSwarm = this.level === 4 && this.branch === "a";
        const isToxin = this.level === 4 && this.branch === "b";

        let shots = [targets[0]];
        if (isSwarm) {
            shots = enemies
                .filter(e => !e.isDead && (this.canHitAir || !e.flying) &&
                    Math.hypot(e.x - this.x, e.y - this.y) <= this.range)
                .slice(0, 3);
            if (shots.length === 0) shots = [targets[0]];
        }

        shots.forEach(t => {
            projectiles.push(new Projectile(
                this.x, this.y - 12,
                t,
                projectileSpeed,
                damage,
                "spore",
                {
                    armorPierce: this.armorPierce,
                    slowOnHit: this.slowOnHit,
                    slowRatio: 0.50,
                    slowDur: 1.0,
                    ...(isToxin ? { poisonMult: 3.0, poisonDur: 5.5 } : {})
                }
            ));
        });
    }

    drawCartoonVector(ctx) {
        const lv = this.level;
        const specialized = lv === 4;

        if (specialized) _drawBranchHalo(ctx, this.x, this.y, this.color);

        ctx.strokeStyle = "#1e4f2f";
        ctx.lineWidth = 2.5 + (lv - 1) * 0.8;

        const stemTopY = this.y - 4 - (lv - 1) * 5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + 18);
        ctx.quadraticCurveTo(this.x - 8, this.y + 4, this.x, stemTopY);
        ctx.stroke();

        ctx.fillStyle = "#27ae60";
        ctx.lineWidth = 2.0;

        ctx.beginPath();
        ctx.ellipse(this.x - 8, this.y + 8, 6.5, 3.5, Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(this.x + 8, this.y + 4, 6.5, 3.5, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (lv >= 2) {
            ctx.fillStyle = "#2ecc71";
            ctx.beginPath();
            ctx.ellipse(this.x - 9, this.y - 4, 5.5, 3, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        if (lv >= 3) {
            ctx.fillStyle = "#1abc9c";
            ctx.beginPath();
            ctx.ellipse(this.x + 9, this.y - 8, 5, 3, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        const podR = 6 + (lv - 1) * 1.5;
        const podColor = specialized && this.branch === "b" ? "#00ffaa" : this.color;
        const seedGrad = ctx.createRadialGradient(this.x - 2, stemTopY - 2, 1, this.x, stemTopY, podR);
        seedGrad.addColorStop(0, "#ffffff");
        seedGrad.addColorStop(1, podColor);

        ctx.fillStyle = seedGrad;
        ctx.shadowBlur = 6 + lv * 3;
        ctx.shadowColor = podColor;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(this.x, stemTopY, podR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (lv >= 3) {
            ctx.fillStyle = podColor;
            ctx.globalAlpha = 0.65;
            ctx.shadowBlur = 5;
            ctx.shadowColor = podColor;
            const angles = specialized ? [0, Math.PI * 2 / 3, Math.PI * 4 / 3] : [Math.PI * 0.3, Math.PI * 0.7];
            angles.forEach(a => {
                ctx.beginPath();
                ctx.arc(this.x + Math.cos(a) * (podR + 5), stemTopY + Math.sin(a) * (podR + 5), 3, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        _drawLevelRings(ctx, this.x, this.y, lv, this.color);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ASTRONOMY TOWER — SLOW/SUPPORT ROLE
// Medium-long range (~175), low damage, strong slow (40–60%), control anchor
// ─────────────────────────────────────────────────────────────────────────────
class AstronomyTower extends Tower {
    constructor(x, y) {
        super(
            x, y,
            160,   // cost
            175,   // range — medium-long support reach
            75,    // cooldown — moderate fire for a slow/support tower
            "Gravity Well",
            "#bf55ec",
            "astronomy"
        );
        this.damageType = "magic"; // hits air, neutral vs armor
        this.damage = 10;          // low damage — role is control, not DPS
        this.canHitAir = true;
    }

    branchInfo() {
        return {
            a: { name: "Singularity Well", desc: "Overwhelming pull and slow — locks enemies in the kill zone." },
            b: { name: "Supernova Well", desc: "Trades control for massive AoE burst damage." }
        };
    }

    fire(targets, projectiles, particleSystem, enemies) {
        const stackMult = (this.stackPenalty || 1);
        let baseDamage = this.damage * Math.pow(1.3, this.level - 1) * this.dmgMult * stackMult;

        let slowRatio = 0.45, duration = 2.5, slowRadius = 55;
        if (this.level === 4) {
            if (this.branch === "b") {
                baseDamage *= 2.0; slowRatio = 0.40; duration = 2.5; slowRadius = 65;
            } else {
                slowRatio = 0.20; duration = 4.5; slowRadius = 70;
            }
        }
        if (this.level >= 2) slowRadius += 8;
        if (this.level >= 3) slowRadius += 8;

        // Fire a gravity orb projectile toward the target
        const target = targets[0];
        projectiles.push(new Projectile(
            this.x, this.y,
            target,
            7,
            baseDamage,
            "gravity",
            {
                slowRadius,
                slowRatio: this.slowOnHit ? slowRatio * 0.6 : slowRatio, // speed upgrade = extra slow
                slowDur: this.slowOnHit ? duration * 1.5 : duration,
                armorPierce: this.armorPierce,
                slowOnHit: this.slowOnHit
            }
        ));
    }

    drawCartoonVector(ctx) {
        const lv = this.level;
        const specialized = lv === 4;
        const t = Date.now() * 0.0035;

        if (specialized) {
            const superColor = this.branch === "b" ? "#ffcc00" : this.color;
            _drawBranchHalo(ctx, this.x, this.y, superColor);
        }

        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1.5 + (lv - 1) * 0.5;
        ctx.shadowBlur = 8 + lv * 3;
        ctx.shadowColor = this.color;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(t);

        const ringCount = lv >= 3 ? 3 : lv === 2 ? 2 : 1;
        const ringA = 13 + (lv - 1) * 2;
        const ringB = 4 + (lv - 1);

        ctx.fillStyle = "rgba(10,5,30,0.8)";
        for (let i = 0; i < ringCount; i++) {
            const angle = (Math.PI / ringCount) * i;
            ctx.save();
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.ellipse(0, 0, ringA, ringB, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
        ctx.shadowBlur = 0;

        const coreR = 3 + (lv - 1);
        const coreColor = specialized && this.branch === "b" ? "#ffcc00" : "#ffffff";
        ctx.fillStyle = coreColor;
        ctx.shadowBlur = 10 + lv * 4;
        ctx.shadowColor = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, coreR, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (lv >= 2) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(-t * 1.5);
            ctx.strokeStyle = specialized && this.branch === "b" ? "#ffcc00" : "#d7bde2";
            ctx.lineWidth = 1.0;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.ellipse(0, 0, ringA + 6, ringB + 2, Math.PI / 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();
        }

        _drawLevelRings(ctx, this.x, this.y, lv, this.color);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VOLCANO TOWER — AoE MAGMA ROLE
// Medium range (~140), slow cooldown, big ground AoE + burn
// ─────────────────────────────────────────────────────────────────────────────
class VolcanoTower extends Tower {
    constructor(x, y) {
        super(
            x, y,
            140,         // cost
            140,         // range — medium AoE
            140,         // cooldown — slow, high AoE damage
            "Volcano",
            "#ff3b1d",
            "volcano"
        );
        this.canHitAir  = false;      // ground-only; lava doesn't fly
        this.damageType = "energy";
        this.damage     = 38;         // base AoE burst damage per wave

        // Magma wave state — expanding ring
        this._waveActive  = false;
        this._waveRadius  = 0;
        this._waveMaxR    = this.range;
        this._waveSpeed   = 3.5;      // px per frame
        this._waveDamage  = 0;
        this._waveHitSet  = null;     // enemies already hit by current wave

        // Burning DoT applied on hit
        this._burnDps  = 0;
        this._burnDur  = 3.0;        // seconds
    }

    branchInfo() {
        return {
            a: {
                name: "Pyroclastic",
                desc: "Larger, faster magma waves that deal more burst damage — melts crowds."
            },
            b: {
                name: "Tectonic",
                desc: "Waves also trigger a ground tremor that slows and briefly stuns enemies."
            }
        };
    }

    chooseBranch(branchKey) {
        const result = super.chooseBranch(branchKey);
        if (!result) return false;

        if (branchKey === "a") {
            this._waveSpeed   *= 1.7;
            this._waveMaxR     = this.range;
            this.damage        *= 1.6;
            this._burnDps      *= 1.5;
        } else {
            this._burnDur      += 2.0;
        }
        return true;
    }

    fire(targets, projectiles, particleSystem, enemies) {
        if (this._waveActive) return;

        const lv = this.level;
        const stackMult = (this.stackPenalty || 1);
        this._waveDamage  = this.damage * Math.pow(1.3, lv - 1) * this.dmgMult * stackMult;
        this._burnDps     = this._waveDamage * 0.12;
        this._waveRadius  = 12;
        this._waveMaxR    = this.range;
        this._waveActive  = true;
        this._waveHitSet  = new Set();

        if (particleSystem) {
            particleSystem.createExplosion(this.x, this.y, "#ff3b1d", 18, 5.0);
            particleSystem.createExplosion(this.x, this.y, "#ff8800", 10, 3.5);
        }
    }

    update(enemies, projectiles, particleSystem) {
        if (this.cooldownTimer > 0) this.cooldownTimer--;

        if (this.cooldownTimer <= 0 && enemies.length > 0 && !this._waveActive) {
            const targets = this.findTargets(enemies);
            if (targets.length > 0) {
                this.fire(targets, projectiles, particleSystem, enemies);
                if (window.audioManager) window.audioManager.playSfx(`tower_${this.type}_fire`);
                this.cooldownTimer = this.cooldown;
                this._lastFireTime = performance.now(); // trigger attack animation + recoil pop
                // Muzzle flash: a small burst in the tower's colour at the emitter.
                if (particleSystem) particleSystem.createExplosion(this.x, this.y - 14, this.color, 4, 1.8);
            }
        }

        if (this._waveActive) {
            this._waveRadius += this._waveSpeed;

            const bandWidth = this._waveSpeed + 8;
            enemies.forEach(e => {
                if (e.isDead || e.flying || this._waveHitSet.has(e)) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist >= this._waveRadius - bandWidth && dist <= this._waveRadius) {
                    this._waveHitSet.add(e);
                    // TASK D: stackPenalty already baked into _waveDamage via fire()
                    const dmgType = this.armorPierce ? "true" : this.damageType;
                    const dealt = e.takeDamage(this._waveDamage, dmgType);

                    if (typeof e.applyPoison === "function") {
                        e.applyPoison(this._burnDps, this._burnDur);
                    }

                    if (this.slowOnHit && typeof e.applySlow === "function") {
                        e.applySlow(0.50, 1.5);
                    }

                    if (this.level === 4 && this.branch === "b") {
                        if (typeof e.applySlow === "function") {
                            e.applySlow(0.35, 2.5);
                        }
                    }

                    if (particleSystem) {
                        particleSystem.addFloatingText(e.x, e.y - 12, `-${Math.round(dealt)}`, "#ff8800", 12);
                        particleSystem.createExplosion(e.x, e.y, "#ff3b1d", 4, 2.0);
                    }
                }
            });

            if (this._waveRadius >= this._waveMaxR) {
                this._waveActive = false;
                this._waveRadius = 0;
                this._waveHitSet = null;
            }
        }
    }

    drawCartoonVector(ctx) {
        const lv = this.level;
        const specialized = lv === 4;

        if (this._waveActive && this._waveRadius > 0) {
            const alpha = Math.max(0, 1 - this._waveRadius / this._waveMaxR);
            ctx.save();
            ctx.globalAlpha = alpha * 0.65;
            ctx.strokeStyle = "#ff8800";
            ctx.lineWidth = 6 + (lv - 1) * 2;
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#ff3b1d";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this._waveRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.3;
            ctx.strokeStyle = "#ffcc00";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this._waveRadius - 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        if (specialized) _drawBranchHalo(ctx, this.x, this.y, "#ff8800");

        const baseW = 22 + (lv - 1) * 4;
        const bodyH  = 28 + (lv - 1) * 6;
        const craterW = 8 + (lv - 1) * 2;

        const rockGrad = ctx.createLinearGradient(this.x - baseW, 0, this.x + baseW, 0);
        rockGrad.addColorStop(0, "#4a2800");
        rockGrad.addColorStop(0.5, "#7a4010");
        rockGrad.addColorStop(1, "#3a1800");
        ctx.fillStyle = rockGrad;
        ctx.strokeStyle = "#1b0a00";
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(this.x - baseW, this.y + 18);
        ctx.lineTo(this.x - craterW, this.y - bodyH + 18);
        ctx.lineTo(this.x + craterW, this.y - bodyH + 18);
        ctx.lineTo(this.x + baseW, this.y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (lv >= 2) {
            ctx.fillStyle = lv >= 3 ? "#d0d0d0" : "#e8e8e8";
            ctx.beginPath();
            ctx.moveTo(this.x - craterW - 3, this.y - bodyH + 22);
            ctx.lineTo(this.x - craterW,     this.y - bodyH + 18);
            ctx.lineTo(this.x + craterW,     this.y - bodyH + 18);
            ctx.lineTo(this.x + craterW + 3, this.y - bodyH + 22);
            ctx.closePath();
            ctx.fill();
        }

        const seamCount = lv;
        for (let i = 0; i < seamCount; i++) {
            const sx = this.x - craterW + (i / seamCount) * craterW * 2 + 4;
            ctx.strokeStyle = lv >= 3 ? "#ff6600" : "#cc3300";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = lv >= 3 ? 6 : 2;
            ctx.shadowColor = "#ff4400";
            ctx.beginPath();
            ctx.moveTo(sx, this.y - bodyH + 22);
            ctx.quadraticCurveTo(sx - 4 + i * 3, this.y - bodyH + 30, sx + 2, this.y - bodyH + 40);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = "#2a1200";
        ctx.strokeStyle = "#1b0a00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - bodyH + 18, craterW + 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const glowR = craterW - 1;
        const lavaGrad = ctx.createRadialGradient(this.x, this.y - bodyH + 18, 1, this.x, this.y - bodyH + 18, glowR);
        lavaGrad.addColorStop(0, "#ffee00");
        lavaGrad.addColorStop(0.5, "#ff6600");
        lavaGrad.addColorStop(1, "#cc2200");
        ctx.fillStyle = lavaGrad;
        ctx.shadowBlur = 10 + lv * 4;
        ctx.shadowColor = "#ff4400";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - bodyH + 18, glowR, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (lv >= 3) {
            const smokeY = this.y - bodyH + 8;
            ctx.fillStyle = specialized ? "rgba(255,100,0,0.35)" : "rgba(100,100,100,0.3)";
            ctx.beginPath();
            ctx.arc(this.x - 3, smokeY, 4, 0, Math.PI * 2);
            ctx.arc(this.x + 4, smokeY - 4, 3.5, 0, Math.PI * 2);
            ctx.arc(this.x,     smokeY - 8, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawLevelRings(ctx, this.x, this.y, lv, this.color);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BARRACKS TOWER — MELEE BLOCKER ROLE (NEW)
// Cost 110, no projectile. Maintains up to 3 melee troops that physically
// block the path. Troops are ~3–5× harder-hitting than ranged per hit.
// ─────────────────────────────────────────────────────────────────────────────
class BarracksTower extends Tower {
    constructor(x, y) {
        super(
            x, y,
            110,   // cost
            95,    // range — only used for hover display; troops block on path
            999,   // cooldown — barracks never fires projectiles
            "Barracks",
            "#c0a062",
            "barracks"
        );
        this.canHitAir = false;  // melee ground only
        this.damage    = 0;      // no direct fire damage

        this.minions   = [];     // up to 3 SummonedMinion instances
        this._maxTroops = 3;
        this._respawnTimers = [0, 0, 0]; // countdown frames per slot; 0 = spawn now
        this._rallyPoint  = null;         // computed once: nearest path point
        this._rallyReady  = false;

        // Tunable troop stats (modified by chooseBranch upgrades)
        this._troopHP      = 120;
        this._troopDmg     = 30;   // ~4× a range-tower hit — research says 3–5×
        this._troopSize    = 18;
        this._respawnDelay = 300;  // ~5 seconds at 60fps
    }

    branchInfo() {
        return {
            a: {
                name: "Phalanx",
                desc: "Troops gain +80% HP and block up to 5 enemies — become an immovable wall."
            },
            b: {
                name: "Berserkers",
                desc: "Troops deal +100% damage and attack much faster — high-aggression melee."
            }
        };
    }

    chooseBranch(branchKey) {
        if (this.level !== 3 || (branchKey !== "a" && branchKey !== "b")) return false;
        this.level = 4;
        this.branch = branchKey;
        const info = this.branchInfo();
        this.name = (info[branchKey] && info[branchKey].name) || this.name;

        if (branchKey === "a") {
            // Phalanx: tankier troops, more blocking slots
            this._troopHP  *= 1.8;
            // Update existing minion health caps
            this.minions.forEach(m => {
                m.maxHealth *= 1.8;
                m.blockLimit = 5;
            });
        } else {
            // Berserkers: more damage, faster attacks
            this._troopDmg *= 2.0;
            this.minions.forEach(m => {
                m.damage *= 2.0;
                m.attackCooldown = Math.max(m.attackCooldown, 0);
            });
        }
        return true;
    }

    getUpgradeOptions() {
        const totalRanks = this.dmgRank + this.rangeRank + this.spdRank;
        const baseCost   = this.cost;
        const scaledCost = Math.floor(baseCost * (0.7 + totalRanks * 0.3));
        const atCap      = this.level >= 3;

        return [
            {
                kind:  "damage",
                label: "+Troop Damage",
                desc:  "+Troop damage & armor-pierce: troops hit harder and ignore armor.",
                cost:  scaledCost,
                maxed: atCap || this.dmgRank >= 3
            },
            {
                kind:  "range",
                label: "+Troop Count",
                desc:  "+Spawn an extra troop slot (max +1 extra) and prioritize furthest-along enemies.",
                cost:  scaledCost,
                maxed: atCap || this.rangeRank >= 3
            },
            {
                kind:  "speed",
                label: "+Respawn Rate",
                desc:  "+Atk speed & slow-on-hit: troops respawn faster and their strikes slow enemies.",
                cost:  scaledCost,
                maxed: atCap || this.spdRank >= 3
            }
        ];
    }

    applyUpgradeOption(kind) {
        if (this.level >= 3) return false;

        if (kind === "damage") {
            if (this.dmgRank >= 3) return false;
            this._troopDmg *= 1.35;
            this.minions.forEach(m => { m.damage *= 1.35; });
            this.armorPierce = true;
            this.dmgRank++;
        } else if (kind === "range") {
            if (this.rangeRank >= 3) return false;
            // Troop count upgrade: one extra troop slot up to max 4
            if (this._maxTroops < 4) {
                this._maxTroops++;
                this._respawnTimers.push(0);
            }
            this.prioritizeFar = true;
            this.rangeRank++;
        } else if (kind === "speed") {
            if (this.spdRank >= 3) return false;
            this._respawnDelay = Math.max(60, Math.floor(this._respawnDelay * 0.75));
            this.slowOnHit = true;
            this.spdRank++;
        } else {
            return false;
        }

        this.level++;
        return true;
    }

    // ─── Compute the rally point: point on path nearest this tower ──────────
    _computeRallyPoint() {
        const inst = (typeof window !== "undefined") && window.gameInstance;
        const waypoints = inst && inst.level && inst.level.waypoints;
        if (!waypoints || waypoints.length < 2) {
            // Fallback: rally directly at tower position
            this._rallyPoint = { x: this.x, y: this.y };
            this._rallyReady = true;
            return;
        }

        let bestDist  = Infinity;
        let bestPoint = { x: waypoints[0].x, y: waypoints[0].y };

        for (let i = 0; i < waypoints.length - 1; i++) {
            const ax = waypoints[i].x,   ay = waypoints[i].y;
            const bx = waypoints[i+1].x, by = waypoints[i+1].y;
            const dx = bx - ax, dy = by - ay;
            const lenSq = dx * dx + dy * dy;
            let t = 0;
            if (lenSq > 0) {
                t = ((this.x - ax) * dx + (this.y - ay) * dy) / lenSq;
                t = Math.max(0, Math.min(1, t));
            }
            const px = ax + t * dx;
            const py = ay + t * dy;
            const d = Math.hypot(this.x - px, this.y - py);
            if (d < bestDist) {
                bestDist  = d;
                bestPoint = { x: px, y: py };
            }
        }

        this._rallyPoint = bestPoint;
        this._rallyReady = true;
    }

    // ─── Spawn a troop at the rally point ───────────────────────────────────
    _spawnTroop(slotIndex) {
        const rp = this._rallyPoint;
        // Spread troops slightly so they don't all overlap exactly
        const spread = 14;
        const offsetX = (slotIndex === 0 ? -spread : slotIndex === 1 ? 0 : spread);
        const offsetY = (slotIndex % 2 === 0 ? -6 : 6);

        const color = this.branch === "b" ? "#e05030" : "#c0a062";
        // Use 99999s duration so the tower fully controls the lifecycle
        const minion = new SummonedMinion(
            rp.x + offsetX,
            rp.y + offsetY,
            this._troopHP,
            this._troopDmg,
            this._troopSize,
            99999,
            this.branch === "b" ? "Berserker" : (this.branch === "a" ? "Phalanx" : "Soldier"),
            color
        );
        if (this.branch === "a") {
            minion.blockLimit = 5;
        }
        return minion;
    }

    update(enemies, projectiles, particleSystem) {
        // Compute rally point once
        if (!this._rallyReady) {
            this._computeRallyPoint();
        }

        // Manage troop slots
        for (let i = 0; i < this._maxTroops; i++) {
            const m = this.minions[i];
            if (m && !m.isDead) {
                // Troop is alive — update it
                m.update(enemies, particleSystem);
                // If slow-on-hit, we need minion attacks to apply slow;
                // SummonedMinion handles its own attack, so we patch post-hoc:
                if (this.slowOnHit && m.blockedEnemies) {
                    m.blockedEnemies.forEach(e => {
                        if (!e.isDead) e.applySlow(0.45, 0.8);
                    });
                }
            } else {
                // Slot is empty or troop just died
                if (m && m.isDead) {
                    this.minions[i] = null;
                    // Start respawn timer if not already counting
                    if (this._respawnTimers[i] <= 0) {
                        this._respawnTimers[i] = this._respawnDelay;
                    }
                }
                // Count down respawn timer
                if (this._respawnTimers[i] > 0) {
                    this._respawnTimers[i]--;
                } else if (!this.minions[i] && this._rallyReady) {
                    // Timer expired — spawn fresh troop
                    this.minions[i] = this._spawnTroop(i);
                }
            }
        }
    }

    fire(targets, projectiles, particleSystem, enemies) {
        // No ranged fire — barracks is melee-only
    }

    draw(ctx) {
        // Draw minions first (behind the building)
        this.minions.forEach(m => {
            if (m && !m.isDead) m.draw(ctx);
        });

        // Draw range circle when hovered
        if (this.isHovered) {
            ctx.save();
            ctx.fillStyle = "rgba(192, 160, 98, 0.05)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "rgba(192, 160, 98, 0.30)";
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            // Also show rally point
            if (this._rallyPoint) {
                ctx.save();
                ctx.strokeStyle = "rgba(255, 220, 100, 0.6)";
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this._rallyPoint.x, this._rallyPoint.y);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = "rgba(255, 220, 100, 0.7)";
                ctx.beginPath();
                ctx.arc(this._rallyPoint.x, this._rallyPoint.y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Drop shadow
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.arc(this.x, this.y + 16, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Vector art
        ctx.save();
        ctx.strokeStyle = "#1b1424";
        ctx.lineWidth = 2.5;
        this.drawCartoonVector(ctx);

        // Star label
        ctx.save();
        ctx.fillStyle = "#ffcc00";
        ctx.strokeStyle = "#2c1a0c";
        ctx.lineWidth = 1.5;
        ctx.font = "bold 13px 'Fredoka', sans-serif";
        ctx.textAlign = "center";
        let label = "★".repeat(Math.min(this.level, 3));
        if (this.level === 4) label = "Ω Ultimate";
        ctx.strokeText(label, this.x, this.y - 30);
        ctx.fillText(label, this.x, this.y - 30);
        ctx.restore();

        ctx.restore();
    }

    drawCartoonVector(ctx) {
        const lv = this.level;
        const specialized = lv === 4;

        if (specialized) _drawBranchHalo(ctx, this.x, this.y, this.color);

        // ── Barracks building: stone base + wooden roof + flag ──────────────

        // Stone base
        const baseW = 18 + (lv - 1) * 2;
        const baseH = 20 + (lv - 1) * 3;
        const bx = this.x - baseW;
        const by = this.y - baseH + 18;

        const wallGrad = ctx.createLinearGradient(bx, 0, bx + baseW * 2, 0);
        wallGrad.addColorStop(0, "#8a7050");
        wallGrad.addColorStop(0.5, "#c0a062");
        wallGrad.addColorStop(1, "#7a6040");
        ctx.fillStyle = wallGrad;
        ctx.beginPath();
        ctx.rect(bx, by, baseW * 2, baseH);
        ctx.fill();
        ctx.stroke();

        // Wooden door arch
        ctx.fillStyle = "#5c3a1c";
        ctx.beginPath();
        ctx.rect(this.x - 5, by + baseH - 10, 10, 10);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x, by + baseH - 10, 5, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        // Stone battlements (crenellations)
        ctx.fillStyle = "#a08050";
        const crW = 5, crH = 5, crGap = 4;
        const nCren = Math.floor((baseW * 2) / (crW + crGap));
        for (let i = 0; i < nCren; i++) {
            const cx2 = bx + i * (crW + crGap);
            ctx.beginPath();
            ctx.rect(cx2, by - crH, crW, crH);
            ctx.fill();
            ctx.stroke();
        }

        // Flagpole
        const poleX = this.x;
        const poleTop = by - crH - 18 - (lv - 1) * 4;
        ctx.strokeStyle = "#5c3a1c";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(poleX, by - crH);
        ctx.lineTo(poleX, poleTop);
        ctx.stroke();

        // Flag — color depends on branch
        const flagColor = specialized
            ? (this.branch === "b" ? "#cc3030" : "#3060cc")
            : "#cc6622";
        ctx.fillStyle = flagColor;
        ctx.beginPath();
        ctx.moveTo(poleX, poleTop);
        ctx.lineTo(poleX + 14, poleTop + 5);
        ctx.lineTo(poleX, poleTop + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#1b0a00";
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Window slits at level 2+
        if (lv >= 2) {
            ctx.fillStyle = "#2c1a0c";
            ctx.beginPath();
            ctx.rect(this.x - 12, by + 4, 4, 6);
            ctx.rect(this.x + 8,  by + 4, 4, 6);
            ctx.fill();
        }

        // Shield emblem at level 3+
        if (lv >= 3) {
            ctx.fillStyle = specialized
                ? (this.branch === "b" ? "#e05030" : "#3070dd")
                : "#d4a030";
            ctx.strokeStyle = "#1b1424";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(this.x, by + 8);
            ctx.lineTo(this.x + 6, by + 12);
            ctx.lineTo(this.x + 6, by + 18);
            ctx.lineTo(this.x, by + 22);
            ctx.lineTo(this.x - 6, by + 18);
            ctx.lineTo(this.x - 6, by + 12);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Troop-count pips below building
        const alive = this.minions.filter(m => m && !m.isDead).length;
        for (let i = 0; i < this._maxTroops; i++) {
            const px = this.x + (i - (this._maxTroops - 1) / 2) * 10;
            ctx.save();
            ctx.fillStyle = i < alive ? "#66ff88" : "#553322";
            ctx.strokeStyle = "#1b1424";
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(px, this.y + 22, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    // padRef stub
    padRef() { return null; }
}

// Make globally available
window.Projectile = Projectile;
window.Tower = Tower;
window.PhysicsTower = PhysicsTower;
window.ChemistryTower = ChemistryTower;
window.BiologyTower = BiologyTower;
window.AstronomyTower = AstronomyTower;
window.VolcanoTower = VolcanoTower;
window.BarracksTower = BarracksTower;

// ─── Registry ────────────────────────────────────────────────────────────────
window.TOWER_REGISTRY = {
    physics:    PhysicsTower,
    chemistry:  ChemistryTower,
    biology:    BiologyTower,
    astronomy:  AstronomyTower,
    volcano:    VolcanoTower,
    barracks:   BarracksTower
};

window.TOWER_COSTS = {
    physics:   100,
    chemistry: 120,
    biology:    80,
    astronomy: 160,
    volcano:   140,
    barracks:  110
};

window.TOWER_BASE_RANGE = {
    physics:   210,   // sniper — very long
    chemistry: 150,   // AoE/splash — medium
    biology:   100,   // rapid-fire — short
    astronomy: 175,   // slow/support — medium-long
    volcano:   140,   // AoE magma — medium
    barracks:   95    // melee blocker — point-defence only
};

window.TOWER_COLORS = {
    physics:   "#00ffff",
    chemistry: "#ff6600",
    biology:   "#00ff66",
    astronomy: "#bf55ec",
    volcano:   "#ff3b1d",
    barracks:  "#c0a062"
};
