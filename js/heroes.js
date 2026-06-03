// js/heroes.js
// 2D Cartoon Fantasy Heroes (Realm Defense style) with preloader check and high-fidelity vector fallbacks

// Standard cartoon helper: draws rounded rectangles with outline
function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle, strokeWidth = 2.5) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
    }
}

class SummonedMinion {
    constructor(x, y, maxHealth, damage, size, durationSeconds, name, color) {
        this.x = x;
        this.y = y;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.damage = damage;
        this.size = size * 1.8;
        this.durationFrames = durationSeconds * 60;
        this.name = name;
        this.color = color;
        
        this.blockedEnemies = [];
        this.blockLimit = 3;
        this.attackCooldown = 0;
        this.isDead = false;
    }

    update(enemies, particleSystem) {
        if (this.isDead) return false;

        this.durationFrames--;
        if (this.durationFrames <= 0) {
            this.isDead = true;
            return false;
        }

        if (this.attackCooldown > 0) this.attackCooldown--;

        this.blockedEnemies = this.blockedEnemies.filter(e => !e.isDead && Math.hypot(e.x - this.x, e.y - this.y) < 30);
        
        if (this.blockedEnemies.length < this.blockLimit) {
            enemies.forEach(e => {
                if (e.isDead || this.blockedEnemies.includes(e)) return;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < 22 && this.blockedEnemies.length < this.blockLimit) {
                    this.blockedEnemies.push(e);
                }
            });
        }

        this.blockedEnemies.forEach(e => {
            e.applySlow(0, 0.05);
            if (Math.random() < 0.02) {
                this.health -= 8;
                if (particleSystem) {
                    // Wood debris chunks
                    particleSystem.createExplosion(this.x, this.y, "#5e3a17", 4, 2);
                }
                if (this.health <= 0) {
                    this.isDead = true;
                }
            }
        });

        if (this.attackCooldown <= 0 && this.blockedEnemies.length > 0) {
            const target = this.blockedEnemies[0];
            const dealt = target.takeDamage(this.damage);
            if (particleSystem) {
                particleSystem.addFloatingText(target.x, target.y - 12, `-${dealt}`, "#ffd700", 12);
                particleSystem.createExplosion(target.x, target.y, "#8e8d3a", 3, 1.5);
            }
            this.attackCooldown = 45;
        }

        return !this.isDead;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.arc(this.x, this.y + 8, this.size * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Animated idle sheet (falls back to the vector tortoise).
        if (!window.drawSprite(ctx, "hero_tortoise", "idle",
                this.x - this.size/2, this.y - this.size/2, this.size, this.size, 0)) {
            // 2D Cartoon Vector Galapagos Tortoise
            ctx.strokeStyle = "#2c1a0c";
            ctx.lineWidth = 2.5;

            // Head and limbs
            ctx.fillStyle = "#8dc540";
            ctx.beginPath();
            ctx.arc(this.x + 12, this.y, 7, 0, Math.PI * 2); // head
            ctx.fill();
            ctx.stroke();

            // Tiny eye
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(this.x + 14, this.y - 1, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.fillStyle = "#7cb337";
            ctx.beginPath();
            ctx.arc(this.x - 10, this.y + 8, 5, 0, Math.PI * 2);
            ctx.arc(this.x + 8, this.y + 8, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Domed shell
            const shellGrad = ctx.createRadialGradient(this.x - 3, this.y - 4, 3, this.x, this.y, 16);
            shellGrad.addColorStop(0, "#a0522d"); // light brown center
            shellGrad.addColorStop(1, "#5c2e0b"); // dark brown rim
            ctx.fillStyle = shellGrad;

            ctx.beginPath();
            ctx.arc(this.x, this.y, 14, 0, Math.PI, true); // half circle shell
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Shell rim plates details
            ctx.fillStyle = "#3e1e07";
            ctx.fillRect(this.x - 14, this.y - 1, 28, 3);
            ctx.strokeRect(this.x - 14, this.y - 1, 28, 3);
        }

        if (this.health < this.maxHealth) {
            const ratio = this.health / this.maxHealth;
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(this.x - 15, this.y - this.size * 0.5 - 8, 30, 4);
            ctx.fillStyle = "rgba(0, 255, 100, 0.95)";
            ctx.fillRect(this.x - 15, this.y - this.size * 0.5 - 8, 30 * ratio, 4);
        }
        ctx.restore();
    }
}

class Hero {
    constructor(x, y, name, color, maxHealth, damage, speed, range, desc, skillName, skillDesc, cooldownSeconds, spriteKey) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.name = name;
        this.color = color;
        this.spriteKey = spriteKey;

        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.damage = damage;
        this.speed = speed;
        this.range = range;

        this.desc = desc;
        this.skillName = skillName;
        this.skillDesc = skillDesc;
        this.skillCooldownMax = cooldownSeconds * 60;
        this.skillCooldownTimer = 0;
        // Effective area-of-effect of the active skill, used to draw the aim
        // reticle/AoE preview while targeting. Subclasses override to match the
        // shockwave radius in their activateSkillLogic().
        this.skillRadius = 110;

        this.isSelected = false;
        this.attackCooldown = 0;
        this.isEngaged = false;
        this.blockedEnemies = [];
        this.blockLimit = 1;

        this.level = 1;
        this.size = 54;
        this.isMoving = false;

        // Gap 2: in-level XP / leveling (1 → 5, scales damage + maxHealth).
        this.xp = 0;
        this.xpNeeded = 100;
        this.maxLevel = 5;

        // Gap 2: heroes can now die and respawn at the base after a timer.
        this.isDead = false;
        this.respawnTimer = 0;
        this.RESPAWN_FRAMES = 720; // ~12 seconds at 60fps
        this.respawnPoint = null;  // set by Game (the defended base) on spawn

        // Attack rotation index — cycles through attackNames automatically
        this.attackIndex = 0;
        // Metadata for UI (set by subclasses)
        this.passiveName = "Passive";
        this.passiveDesc = "A passive trait.";
        this.attackNames = ["Strike"];

        // Apply permanent hero-HP meta upgrade (Scientific Resilience).
        const hpMult = (typeof window !== "undefined" && window.SCI_HERO_HP_MULT) || 1;
        this.maxHealth = Math.round(this.maxHealth * hpMult);
        this.health = this.maxHealth;
    }

    moveTo(tx, ty) {
        if (this.isDead) return;
        this.targetX = tx;
        this.targetY = ty;
    }

    useActiveSkill(targetX, targetY, enemies, particleSystem, summonedMinions) {
        if (this.isDead) return false;
        if (this.skillCooldownTimer > 0) return false;
        
        const activated = this.activateSkillLogic(targetX, targetY, enemies, particleSystem, summonedMinions);
        if (activated) {
            this.skillCooldownTimer = this.skillCooldownMax;
            if (window.audioManager) window.audioManager.playSfx(`hero_${this.spriteKey}_skill`);
        }
        return activated;
    }

    activateSkillLogic(targetX, targetY, enemies, particleSystem, summonedMinions) {
        return true;
    }

    update(enemies, particleSystem) {
        // Dead: count down to respawn, do nothing else.
        if (this.isDead) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) this.respawn(particleSystem);
            return;
        }

        if (this.skillCooldownTimer > 0) this.skillCooldownTimer--;
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Cache current enemies list so performAttack overrides can access it for AoE splash
        this._enemies = enemies;

        this.applyPassiveAura(enemies, particleSystem);

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 2.5) {
            this.isMoving = true;
            if (Math.abs(dx) > 0.5) this.faceLeft = dx < 0; // for sprite mirroring
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            this.blockedEnemies.forEach(e => e.slowFactor = 1.0);
            this.blockedEnemies = [];
        } else {
            this.isMoving = false;
            this.blockedEnemies = this.blockedEnemies.filter(e => !e.isDead && Math.hypot(e.x - this.x, e.y - this.y) < 30);
            
            if (this.blockedEnemies.length < this.blockLimit) {
                enemies.forEach(e => {
                    if (e.isDead || this.blockedEnemies.includes(e)) return;
                    const d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < 20 && this.blockedEnemies.length < this.blockLimit) {
                        this.blockedEnemies.push(e);
                    }
                });
            }

            this.blockedEnemies.forEach(e => {
                e.applySlow(0, 0.05);
                if (Math.random() < 0.015) {
                    this.health -= 5;
                    particleSystem.createExplosion(this.x, this.y, "#ff3333", 3, 2.0);
                    if (this.health < 0) this.health = 0;
                }
            });
        }

        if (this.attackCooldown <= 0) {
            let target = null;
            if (this.blockedEnemies.length > 0) {
                target = this.blockedEnemies[0];
            } else {
                let minDist = this.range;
                enemies.forEach(e => {
                    if (e.isDead) return;
                    const d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minDist) {
                        minDist = d;
                        target = e;
                    }
                });
            }

            if (target) {
                this.performAttack(target, particleSystem, this.attackIndex);
                this.attackIndex = (this.attackIndex + 1) % Math.max(1, this.attackNames.length);
                this.attackCooldown = 50;
                this._lastAttackTime = performance.now(); // trigger attack animation
                if (Math.abs(target.x - this.x) > 0.5) this.faceLeft = target.x < this.x;
            }
        }

        // Death: heroes can now fall. They respawn at the base after a timer
        // (heroes are still fully healed at the start of each wave).
        if (this.health <= 0 && !this.isDead) {
            this.die(particleSystem);
        }
    }

    // ---- Gap 2: leveling --------------------------------------------------
    addXp(amount, particleSystem) {
        if (this.isDead || this.level >= this.maxLevel) return;
        this.xp += amount;
        while (this.xp >= this.xpNeeded && this.level < this.maxLevel) {
            this.xp -= this.xpNeeded;
            this.levelUp(particleSystem);
        }
        if (this.level >= this.maxLevel) this.xp = 0;
    }

    levelUp(particleSystem) {
        if (window.audioManager) window.audioManager.playSfx("hero_levelup");
        this.level++;
        this.xpNeeded = Math.round(this.xpNeeded * 1.6);
        // Scale power: +15% damage, +12% max HP, and heal by the HP gained.
        this.damage = Math.round(this.damage * 1.15);
        const prevMax = this.maxHealth;
        this.maxHealth = Math.round(this.maxHealth * 1.12);
        this.health = Math.min(this.maxHealth, this.health + (this.maxHealth - prevMax));
        if (particleSystem) {
            particleSystem.createExplosion(this.x, this.y, "#ffd700", 24, 3.5);
            particleSystem.addFloatingText(this.x, this.y - 18, `LEVEL ${this.level}!`, "#ffd700", 16);
        }
    }

    // ---- Gap 2: death / respawn ------------------------------------------
    die(particleSystem) {
        if (window.audioManager) window.audioManager.playSfx(`hero_${this.spriteKey}_death`);
        this.isDead = true;
        this.health = 0;
        this.respawnTimer = this.RESPAWN_FRAMES;
        this.isSelected = false;
        this.isMoving = false;
        this.blockedEnemies.forEach(e => { e.slowFactor = 1.0; });
        this.blockedEnemies = [];
        if (particleSystem) {
            particleSystem.createExplosion(this.x, this.y, "#888888", 20, 3);
            particleSystem.addFloatingText(this.x, this.y - 18, `${this.name} fell!`, "#ff5555", 14);
        }
    }

    respawn(particleSystem) {
        this.isDead = false;
        this.respawnTimer = 0;
        this.health = this.maxHealth;
        if (window.audioManager) window.audioManager.playSfx(`hero_${this.spriteKey}_respawn`);
        if (this.respawnPoint) {
            this.x = this.respawnPoint.x;
            this.y = this.respawnPoint.y;
            this.targetX = this.x;
            this.targetY = this.y;
        }
        if (particleSystem) {
            particleSystem.createShockwave(this.x, this.y, 45, this.color, 3, 2);
            particleSystem.addFloatingText(this.x, this.y - 18, `${this.name} returns!`, "#00ff88", 14);
        }
    }

    applyPassiveAura(enemies, particleSystem) {}

    performAttack(target, particleSystem, attackIndex) {
        if (window.audioManager) window.audioManager.playSfx(`hero_${this.spriteKey}_attack`);
        const dealt = target.takeDamage(this.damage);
        particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)}`, this.color, 12);
        particleSystem.createExplosion(target.x, target.y, this.color, 6, 2.0);
    }

    // Pick the sprite-sheet state: 'attack' for the duration of the attack anim
    // after a hit, otherwise 'walk' while moving, else 'idle'.
    getAnimState() {
        const meta = window.SHEET_META && window.SHEET_META[`hero_${this.spriteKey}_attack`];
        if (meta && this._lastAttackTime) {
            const durMs = (meta.cols / meta.fps) * 1000;
            if (performance.now() - this._lastAttackTime < durMs) return "attack";
        }
        return this.isMoving ? "walk" : "idle";
    }

    draw(ctx) {
        ctx.save();

        // Dead: draw a faded tombstone + respawn countdown, then bail out.
        if (this.isDead) {
            const secs = Math.ceil(this.respawnTimer / 60);
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = "#3a3f4a";
            ctx.beginPath();
            ctx.moveTo(this.x - 10, this.y + 10);
            ctx.lineTo(this.x - 10, this.y - 6);
            ctx.arc(this.x, this.y - 6, 10, Math.PI, 0);
            ctx.lineTo(this.x + 10, this.y + 10);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = "#cfd8e3";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("✝", this.x, this.y + 2);
            ctx.fillStyle = "#ff8888";
            ctx.font = "bold 12px sans-serif";
            ctx.fillText(`${secs}s`, this.x, this.y - 22);
            ctx.restore();
            return;
        }

        if (this.isSelected) {
            // Shiny magic selection rings
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 10, 18, 7, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Soft drop shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 11, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2D Cartoon walk bob cycle (vector fallback only — animated sheets
        // carry their own bob).
        let bobY = 0;
        if (this.isMoving) {
            bobY = Math.abs(Math.sin(Date.now() * 0.015)) * -4.5;
        }

        // Animated sprite sheet (idle/walk/attack), mirrored when facing left.
        const baseKey = `hero_${this.spriteKey}`;
        const state = this.getAnimState();
        const dw = this.size, dh = this.size;
        const dx = this.x - dw / 2, dy = this.y - dh / 2;
        let drawn;
        if (this.faceLeft) {
            ctx.save();
            ctx.translate(this.x, 0);
            ctx.scale(-1, 1);
            ctx.translate(-this.x, 0);
            drawn = window.drawSprite(ctx, baseKey, state, dx, dy, dw, dh, this._lastAttackTime);
            ctx.restore();
        } else {
            drawn = window.drawSprite(ctx, baseKey, state, dx, dy, dw, dh, this._lastAttackTime);
        }

        if (!drawn) {
            // High-fidelity Cartoon Vector Fallback drawing
            ctx.strokeStyle = "#1b1424";
            ctx.lineWidth = 2.5;

            ctx.save();
            ctx.translate(0, bobY);
            this.drawCartoonVector(ctx);
            ctx.restore();
        }

        // Draw HP bar
        if (this.health < this.maxHealth) {
            const ratio = this.health / this.maxHealth;
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            ctx.fillRect(this.x - 15, this.y - 28, 30, 4);
            ctx.fillStyle = "rgba(0, 255, 100, 0.95)";
            ctx.fillRect(this.x - 15, this.y - 28, 30 * ratio, 4);
        }

        // Gap 2: slim purple XP bar beneath the HP bar + level badge.
        if (this.level < this.maxLevel) {
            const xpRatio = Math.max(0, Math.min(1, this.xp / this.xpNeeded));
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(this.x - 15, this.y - 23, 30, 3);
            ctx.fillStyle = "rgba(170, 90, 255, 0.95)";
            ctx.fillRect(this.x - 15, this.y - 23, 30 * xpRatio, 3);
        }
        // Level badge + a glow ring at higher levels.
        ctx.fillStyle = this.level >= this.maxLevel ? "#ffd700" : "#c9b6ff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(`L${this.level}`, this.x + 16, this.y - 22);
        if (this.level >= 3) {
            ctx.strokeStyle = this.level >= this.maxLevel ? "rgba(255,215,0,0.55)" : "rgba(170,90,255,0.45)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 8, 16, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    drawCartoonVector(ctx) {
        // generic cartoon block
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// 1. ALBERT EINSTEIN
class EinsteinHero extends Hero {
    constructor(x, y) {
        super(
            x, y,
            "Einstein",
            "#00ffff",
            180,
            18,
            2.2,
            110,
            "Theoretical physicist. Slows time naturally and releases immense nuclear fission energy.",
            "E = mc²",
            "Creates a massive atomic blast at targeted location, vaporizing standard enemies.",
            18,
            "einstein"
        );

        // Passive metadata
        this.passiveName = "Relativistic Aura";
        this.passiveDesc = "Continuously slows all enemies within range by 30%, with occasional quantum sparks dealing minor chip damage.";
        this.skillRadius = 140; // E = mc² blast radius

        // Attack rotation metadata
        this.attackNames = ["Quantum Strike", "Wave Burst", "Photon Lance"];
    }

    applyPassiveAura(enemies, particleSystem) {
        // Relativistic Aura: slows nearby enemies and occasionally deals chip damage
        enemies.forEach(e => {
            if (e.isDead) return;
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist <= 110) {
                e.applySlow(0.70, 0.2);
                if (Math.random() < 0.015) {
                    particleSystem.createExplosion(e.x, e.y, "rgba(0, 255, 255, 0.5)", 1, 2.0);
                    e.takeDamage(2);
                }
            }
        });
    }

    performAttack(target, particleSystem, attackIndex) {
        const idx = (attackIndex || 0) % this.attackNames.length;

        if (idx === 0) {
            // Quantum Strike — focused single hit, slightly boosted + phase particles
            const dealt = target.takeDamage(this.damage * 1.1);
            particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)}`, "#00ffff", 12);
            particleSystem.createExplosion(target.x, target.y, "#00ffff", 5, 2.0);
            particleSystem.createExplosion(target.x, target.y, "#ffffff", 3, 1.5);

        } else if (idx === 1) {
            // Wave Burst — small AoE ripple around target, lighter damage to nearby foes
            const dealt = target.takeDamage(this.damage);
            particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)}`, "#00ffff", 12);
            particleSystem.createShockwave(target.x, target.y, 55, "#00ffff", 3, 2);
            // Secondary splash to nearby enemies
            if (this._enemies) {
                this._enemies.forEach(e => {
                    if (e.isDead || e === target) return;
                    const d = Math.hypot(e.x - target.x, e.y - target.y);
                    if (d < 55) {
                        const splash = e.takeDamage(this.damage * 0.4);
                        particleSystem.addFloatingText(e.x, e.y - 10, `-${Math.round(splash)}`, "rgba(0,255,255,0.8)", 10);
                    }
                });
            }

        } else {
            // Photon Lance — long-range narrow beam, high single-target damage + slow
            const dealt = target.takeDamage(this.damage * 1.4);
            target.applySlow(0.6, 1.2);
            particleSystem.addFloatingText(target.x, target.y - 14, `-${Math.round(dealt)} LANCE!`, "#ffffff", 13);
            particleSystem.createExplosion(target.x, target.y, "#00ffff", 8, 2.5);
            particleSystem.createExplosion(target.x, target.y, "#aaffff", 4, 1.5);
        }
    }

    activateSkillLogic(targetX, targetY, enemies, particleSystem, summonedMinions) {
        particleSystem.createShockwave(targetX, targetY, 140, "#ffffff", 8, 4);
        particleSystem.createExplosion(targetX, targetY, "#00ffff", 30, 5);
        particleSystem.addFloatingText(targetX, targetY - 20, "E = mc² !", "#00ffff", 16, 1.5);

        enemies.forEach(e => {
            const dist = Math.hypot(e.x - targetX, e.y - targetY);
            if (dist <= 140 && !e.isDead) {
                const dealt = e.takeDamage(120);
                e.applySlow(0.4, 3.5);
                particleSystem.addFloatingText(e.x, e.y - 12, `-${Math.round(dealt)}`, "#ffffff", 14);
            }
        });
        return true;
    }

    drawCartoonVector(ctx) {
        // Draw Einstein wizard vector
        // 1. Wild fluffy cloud hair (multiple white circles)
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(this.x - 10, this.y - 5, 8, 0, Math.PI * 2);
        ctx.arc(this.x - 10, this.y + 3, 7, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y - 5, 8, 0, Math.PI * 2);
        ctx.arc(this.x + 10, this.y + 3, 7, 0, Math.PI * 2);
        ctx.arc(this.x, this.y - 12, 9, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.stroke(); // thick lines

        // 2. Face
        ctx.fillStyle = "#ffd3b6";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes & moustache
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x - 4, this.y - 2, 1.5, 2.5);
        ctx.fillRect(this.x + 2, this.y - 2, 1.5, 2.5);

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x, this.y + 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. Robe body (Cyan with gold belt)
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.moveTo(this.x - 7, this.y + 7);
        ctx.lineTo(this.x + 7, this.y + 7);
        ctx.lineTo(this.x + 10, this.y + 18);
        ctx.lineTo(this.x - 10, this.y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffd700"; // gold belt
        ctx.fillRect(this.x - 6, this.y + 11, 12, 3.5);
    }
}

// 2. ISAAC NEWTON
class NewtonHero extends Hero {
    constructor(x, y) {
        super(
            x, y,
            "Newton",
            "#bf55ec",
            220,
            14,
            1.8,
            120,
            "Natural philosopher. Distorts gravity fields to amplify damage and drops stun apples.",
            "Apple Cataclysm",
            "Drops a massive golden apple from orbit, dealing damage and crushing enemies in a stasis stun.",
            15,
            "newton"
        );

        // Passive metadata
        this.passiveName = "Gravitational Pull";
        this.passiveDesc = "All enemies within range have their armor reduced (gravity-warped), and Newton slowly regenerates health over time.";
        this.skillRadius = 95; // Apple Cataclysm impact radius

        // Attack rotation metadata
        this.attackNames = ["Apple Toss", "Gravity Slam", "Orbital Crush"];

        // Internal HP regen accumulator
        this._regenAccum = 0;
    }

    applyPassiveAura(enemies, particleSystem) {
        // Gravitational Pull: armor-melt aura + passive HP regen
        enemies.forEach(e => {
            if (e.isDead) return;
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist <= 125) {
                e.applyArmorMelt(1.25, 0.2);
                if (Math.random() < 0.01) {
                    particleSystem.createExplosion(e.x, e.y, "rgba(191,85,236,0.35)", 1, 1.5);
                }
            }
        });
        // Slow regen (~0.25 HP/sec at 60fps = 0.004/frame)
        this._regenAccum = (this._regenAccum || 0) + 0.004;
        if (this._regenAccum >= 1) {
            const regen = Math.floor(this._regenAccum);
            this._regenAccum -= regen;
            if (this.health < this.maxHealth) {
                this.health = Math.min(this.maxHealth, this.health + regen);
            }
        }
    }

    performAttack(target, particleSystem, attackIndex) {
        const idx = (attackIndex || 0) % this.attackNames.length;

        if (idx === 0) {
            // Apple Toss — quick accurate single throw, minor knockback effect (slow)
            const dealt = target.takeDamage(this.damage);
            target.applySlow(0.75, 0.8);
            particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)}`, "#ffd700", 12);
            particleSystem.createExplosion(target.x, target.y, "#ffd700", 4, 1.8);

        } else if (idx === 1) {
            // Gravity Slam — medium AoE stomp that pins enemies (heavy slow)
            const dealt = target.takeDamage(this.damage * 1.2);
            target.applySlow(0.45, 1.5);
            particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)} SLAM!`, "#bf55ec", 13);
            particleSystem.createShockwave(target.x, target.y, 50, "#bf55ec", 4, 2.5);
            particleSystem.createExplosion(target.x, target.y, "#bf55ec", 6, 2.0);

        } else {
            // Orbital Crush — high-damage gravity implosion, also armor-melts target
            const dealt = target.takeDamage(this.damage * 1.6);
            target.applyArmorMelt(1.5, 2.0);
            particleSystem.addFloatingText(target.x, target.y - 15, `-${Math.round(dealt)} CRUSH!`, "#ffffff", 14);
            particleSystem.createExplosion(target.x, target.y, "#bf55ec", 10, 3.0);
            particleSystem.createExplosion(target.x, target.y, "#ffd700", 5, 2.0);
        }
    }

    activateSkillLogic(targetX, targetY, enemies, particleSystem, summonedMinions) {
        particleSystem.createShockwave(targetX, targetY, 95, "#bf55ec", 5, 3);
        particleSystem.createExplosion(targetX, targetY, "#ffd700", 25, 4);
        particleSystem.addFloatingText(targetX, targetY - 20, "GRAVITY BURST!", "#ffd700", 14, 1.5);

        enemies.forEach(e => {
            const dist = Math.hypot(e.x - targetX, e.y - targetY);
            if (dist <= 95 && !e.isDead) {
                const dealt = e.takeDamage(75);
                e.applySlow(0.1, 4.0);
                particleSystem.addFloatingText(e.x, e.y - 12, `-${Math.round(dealt)}`, "#bf55ec", 13);
            }
        });
        return true;
    }

    drawCartoonVector(ctx) {
        // Newton 2D cartoon model
        // 1. Silver long wig curves
        ctx.fillStyle = "#d2d7d9";
        ctx.beginPath();
        ctx.arc(this.x - 9, this.y - 5, 7, 0, Math.PI * 2);
        ctx.arc(this.x - 9, this.y + 2, 7, 0, Math.PI * 2);
        ctx.arc(this.x - 9, this.y + 8, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 9, this.y - 5, 7, 0, Math.PI * 2);
        ctx.arc(this.x + 9, this.y + 2, 7, 0, Math.PI * 2);
        ctx.arc(this.x + 9, this.y + 8, 5, 0, Math.PI * 2);
        ctx.arc(this.x, this.y - 10, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Face
        ctx.fillStyle = "#ffd3b6";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eyes
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x - 3, this.y - 2, 1.5, 2.5);
        ctx.fillRect(this.x + 1, this.y - 2, 1.5, 2.5);

        // 3. Purple royal vestment body
        ctx.fillStyle = "#8e44ad";
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y + 6);
        ctx.lineTo(this.x + 6, this.y + 6);
        ctx.lineTo(this.x + 9, this.y + 18);
        ctx.lineTo(this.x - 9, this.y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Apple floating in hand
        ctx.fillStyle = "#ff2222";
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 9, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// 3. MARIE CURIE
class CurieHero extends Hero {
    constructor(x, y) {
        super(
            x, y,
            "Curie",
            "#00ff66",
            160,
            12,
            2.0,
            100,
            "Pioneer in radioactivity. Leaks constant atomic damage and creates polonium hazards.",
            "Polonium Meltdown",
            "Floods the target area with a glowing pool of radiation dealing damage over time and slowing foes.",
            20,
            "curie"
        );

        // Passive metadata
        this.passiveName = "Radioactive Decay";
        this.passiveDesc = "Continuously irradiates all nearby enemies, applying poison and dealing constant chip damage in her presence.";
        this.skillRadius = 110; // Polonium Meltdown pool radius

        // Attack rotation metadata
        this.attackNames = ["Radium Bolt", "Uranium Cleave", "Alpha Burst"];
    }

    applyPassiveAura(enemies, particleSystem) {
        // Radioactive Decay: constant AoE chip damage + poison application
        enemies.forEach(e => {
            if (e.isDead) return;
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist <= 100) {
                e.takeDamage(0.35);
                e.applyPoison(0.5, 1.5);
                if (Math.random() < 0.05) {
                    particleSystem.createExplosion(e.x, e.y, "rgba(0, 255, 100, 0.4)", 1, 1.5);
                }
            }
        });
    }

    performAttack(target, particleSystem, attackIndex) {
        const idx = (attackIndex || 0) % this.attackNames.length;

        if (idx === 0) {
            // Radium Bolt — focused radioactive projectile, applies a stronger poison
            const dealt = target.takeDamage(this.damage * 1.05);
            target.applyPoison(1.5, 3.0);
            particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)}`, "#00ff66", 12);
            particleSystem.createExplosion(target.x, target.y, "#00ff66", 5, 2.0);
            particleSystem.createExplosion(target.x, target.y, "#88ffcc", 2, 1.5);

        } else if (idx === 1) {
            // Uranium Cleave — wide arc swing, hits target + splashes to nearby enemies
            const dealt = target.takeDamage(this.damage * 0.9);
            target.applyPoison(1.0, 2.0);
            particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)} CLEAVE!`, "#00ff66", 12);
            particleSystem.createShockwave(target.x, target.y, 45, "#00ff66", 2, 1.5);
            if (this._enemies) {
                this._enemies.forEach(e => {
                    if (e.isDead || e === target) return;
                    const d = Math.hypot(e.x - target.x, e.y - target.y);
                    if (d < 45) {
                        const splash = e.takeDamage(this.damage * 0.5);
                        e.applyPoison(0.8, 2.0);
                        particleSystem.addFloatingText(e.x, e.y - 10, `-${Math.round(splash)}`, "rgba(0,255,100,0.8)", 10);
                    }
                });
            }

        } else {
            // Alpha Burst — explosive radioactive burst, high damage + strong poison + slow
            const dealt = target.takeDamage(this.damage * 1.5);
            target.applyPoison(2.5, 4.0);
            target.applySlow(0.65, 1.5);
            particleSystem.addFloatingText(target.x, target.y - 15, `-${Math.round(dealt)} ☢`, "#ffffff", 14);
            particleSystem.createExplosion(target.x, target.y, "#00ff66", 10, 3.0);
            particleSystem.createExplosion(target.x, target.y, "#ffff00", 4, 2.0);
        }
    }

    activateSkillLogic(targetX, targetY, enemies, particleSystem, summonedMinions) {
        particleSystem.addFloatingText(targetX, targetY - 20, "POLONIUM MELTDOWN!", "#00ff66", 14, 1.5);
        particleSystem.createShockwave(targetX, targetY, 110, "#00ff66", 3, 2);

        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                particleSystem.createToxicCloud(targetX, targetY, 90, 8);
                enemies.forEach(e => {
                    const dist = Math.hypot(e.x - targetX, e.y - targetY);
                    if (dist <= 100 && !e.isDead) {
                        const dealt = e.takeDamage(25);
                        e.applyPoison(3.0, 5.0);
                        e.applySlow(0.5, 4.0);
                        particleSystem.addFloatingText(e.x, e.y - 12, `-${Math.round(dealt)}`, "#00ff66", 11);
                    }
                });
            }, i * 500);
        }
        return true;
    }

    drawCartoonVector(ctx) {
        // Marie Curie Vector model
        // 1. Dark bun hair
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        ctx.arc(this.x, this.y - 10, 6, 0, Math.PI * 2); // bun
        ctx.arc(this.x, this.y - 5, 8, 0, Math.PI * 2);  // main hair
        ctx.fill();
        ctx.stroke();

        // 2. Face
        ctx.fillStyle = "#ffd3b6";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 3. Radioactive green glowing laboratory coat
        const glowGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + 18);
        glowGrad.addColorStop(0, "#00ff66");
        glowGrad.addColorStop(1, "#074218");
        ctx.fillStyle = glowGrad;

        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 6);
        ctx.lineTo(this.x + 5, this.y + 6);
        ctx.lineTo(this.x + 8, this.y + 17);
        ctx.lineTo(this.x - 8, this.y + 17);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Holding a glowing testing tube
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.fillStyle = "#00ff66";
        ctx.fillRect(this.x + 7, this.y + 5, 3.5, 9);
        ctx.strokeRect(this.x + 7, this.y + 5, 3.5, 9);
    }
}

// 4. CHARLES DARWIN
class DarwinHero extends Hero {
    constructor(x, y) {
        super(
            x, y,
            "Darwin",
            "#ff9900",
            250,
            15,
            1.7,
            120,
            "Evolutionary biologist. Gains power from nearby kills and summons a massive Galapagos tortoise block.",
            "Evolutionary Call",
            "Summons a giant Galapagos Tortoise on the path that blocks up to 3 enemies and fights them.",
            22,
            "darwin"
        );
        this.adaptiveKills = 0;

        // Passive metadata
        this.passiveName = "Natural Selection";
        this.passiveDesc = "Each nearby enemy death grants Darwin an Adaptation Stack (up to 10), permanently increasing his damage and move speed.";
        this.skillRadius = 55; // tortoise summon footprint (placement marker)

        // Attack rotation metadata
        this.attackNames = ["Primal Strike", "Pack Instinct", "Evolutionary Leap"];

        // Track enemy health to detect deaths near Darwin
        this._prevEnemyCount = 0;
    }

    applyPassiveAura(enemies, particleSystem) {
        // Natural Selection: detect deaths near Darwin to award adaptation stacks
        const nearbyAlive = enemies.filter(e => !e.isDead && Math.hypot(e.x - this.x, e.y - this.y) < 160).length;
        const prevCount = this._prevEnemyCount || 0;
        if (prevCount > nearbyAlive && nearbyAlive < prevCount) {
            // An enemy died nearby — award an adaptation stack for each death
            const died = prevCount - nearbyAlive;
            for (let i = 0; i < died; i++) {
                this.gainAdaptationStack(particleSystem);
            }
        }
        this._prevEnemyCount = nearbyAlive;

        // Visual aura particles at high adaptation stacks
        if (this.adaptiveKills >= 5 && Math.random() < 0.04) {
            particleSystem.createExplosion(this.x, this.y, "rgba(255,153,0,0.5)", 2, 1.5);
        }
    }

    gainAdaptationStack(particleSystem) {
        if (this.adaptiveKills < 10) {
            this.adaptiveKills++;
            this.damage = 15 + this.adaptiveKills * 1.5;
            this.speed = 1.7 + this.adaptiveKills * 0.05;
            particleSystem.addFloatingText(this.x, this.y - 18, `Adapt Stk: ${this.adaptiveKills}`, "#ff9900", 11, 1.0);
        }
    }

    performAttack(target, particleSystem, attackIndex) {
        const idx = (attackIndex || 0) % this.attackNames.length;
        // Adaptation stacks scale damage (already baked into this.damage, but we honour them per-attack)
        const adaptBonus = 1 + this.adaptiveKills * 0.05;

        if (idx === 0) {
            // Primal Strike — heavy single blow with a bone-crunching impact
            const dealt = target.takeDamage(this.damage * 1.1 * adaptBonus);
            particleSystem.addFloatingText(target.x, target.y - 12, `-${Math.round(dealt)}`, "#ff9900", 12);
            particleSystem.createExplosion(target.x, target.y, "#ff9900", 6, 2.0);
            particleSystem.createExplosion(target.x, target.y, "#ffcc66", 3, 1.5);

        } else if (idx === 1) {
            // Pack Instinct — 3-hit rapid combo (three quick sub-hits)
            let totalDealt = 0;
            for (let h = 0; h < 3; h++) {
                const dealt = target.takeDamage(this.damage * 0.45 * adaptBonus);
                totalDealt += dealt;
            }
            target.applySlow(0.75, 0.6);
            particleSystem.addFloatingText(target.x, target.y - 14, `-${Math.round(totalDealt)} x3!`, "#ffcc00", 13);
            particleSystem.createExplosion(target.x, target.y, "#ffcc00", 8, 2.2);

        } else {
            // Evolutionary Leap — lunging AoE slam, damages target + nearby enemies
            const dealt = target.takeDamage(this.damage * 1.35 * adaptBonus);
            target.applySlow(0.60, 1.2);
            particleSystem.addFloatingText(target.x, target.y - 15, `-${Math.round(dealt)} LEAP!`, "#ffffff", 14);
            particleSystem.createShockwave(target.x, target.y, 60, "#ff9900", 4, 2.5);
            particleSystem.createExplosion(target.x, target.y, "#ff9900", 9, 2.5);
            if (this._enemies) {
                this._enemies.forEach(e => {
                    if (e.isDead || e === target) return;
                    const d = Math.hypot(e.x - target.x, e.y - target.y);
                    if (d < 60) {
                        const splash = e.takeDamage(this.damage * 0.5 * adaptBonus);
                        particleSystem.addFloatingText(e.x, e.y - 10, `-${Math.round(splash)}`, "rgba(255,153,0,0.8)", 10);
                    }
                });
            }
        }
    }

    activateSkillLogic(targetX, targetY, enemies, particleSystem, summonedMinions) {
        particleSystem.createShockwave(targetX, targetY, 40, "#964b00", 3, 2);
        particleSystem.addFloatingText(targetX, targetY - 20, "SUMMON TORTOISE!", "#ff9900", 14, 1.5);

        summonedMinions.push(new SummonedMinion(
            targetX, targetY,
            400,
            12,
            18,
            15.0,
            "Galapagos Tortoise",
            "#5e3a17"
        ));
        return true;
    }

    drawCartoonVector(ctx) {
        // Darwin 2D cartoon model
        // 1. Puffy white beard
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y + 5, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y + 5, 5, 0, Math.PI * 2);
        ctx.arc(this.x, this.y + 9, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Face
        ctx.fillStyle = "#ffd3b6";
        ctx.beginPath();
        ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Explorer Hat
        ctx.fillStyle = "#d7ccc8";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 7, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y - 8, 6, 0, Math.PI, true);
        ctx.fill();
        ctx.stroke();

        // 3. Khaki Safari explorer jacket
        ctx.fillStyle = "#859b52";
        ctx.beginPath();
        ctx.moveTo(this.x - 6, this.y + 7);
        ctx.lineTo(this.x + 6, this.y + 7);
        ctx.lineTo(this.x + 9, this.y + 18);
        ctx.lineTo(this.x - 9, this.y + 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

// Make globally available
window.Hero = Hero;
window.EinsteinHero = EinsteinHero;
window.NewtonHero = NewtonHero;
window.CurieHero = CurieHero;
window.DarwinHero = DarwinHero;
window.SummonedMinion = SummonedMinion;
window.drawRoundedRect = drawRoundedRect;
