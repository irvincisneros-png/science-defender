// js/enemies.js
// 2D Cartoon Fantasy Scientific Misconception Creeps (Realm Defense style) with squash & stretch and preloader check

class Enemy {
    constructor(x, y, speed, maxHealth, goldReward, rpReward, size, color, name) {
        this.x = x;
        this.y = y;
        this.baseSpeed = speed;
        this.speed = speed;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.goldReward = goldReward;
        this.rpReward = rpReward;
        this.size = size * 1.5; // boost visual cartoon sizes slightly
        this.color = color;
        this.name = name;

        // Path navigation
        this.waypoints = [];
        this.currentWaypointIndex = 0;

        // Effects
        this.slowTimer = 0;
        this.slowFactor = 1.0;
        this.poisonTimer = 0;
        this.poisonDamage = 0;
        this.armorMeltTimer = 0;
        this.armorMeltFactor = 1.0;

        this.isDead = false;
        this.reachedEnd = false;
        this.spriteKey = "flatearth"; // Default

        // Juice: Squash and Stretch modifiers
        this.squashX = 1.0;
        this.squashY = 1.0;

        // Wobble walking factor
        this.walkWobble = 0;

        // Realm Defense-style combat traits (subclasses opt in).
        this.flying = false;    // only anti-air towers can target it
        this.armored = false;   // resists physical/energy; acid melts it
        this.shielded = false;  // chip damage absorbed until one big hit cracks it
        this.shieldUp = false;
        this.shieldBreak = 25;  // single-hit damage needed to crack the shield
        this.healer = false;    // periodically heals nearby wounded allies
        this.fast = false;      // flavour flag for fast swarm creeps
        this.healPulse = 0;

        // Boss / special flags
        this.isBoss = false;
        this.isFinalBoss = false;
        this.stunImmune = false;
    }

    setPath(waypoints) {
        this.waypoints = waypoints;
        if (this.waypoints.length > 0) {
            this.x = this.waypoints[0].x;
            this.y = this.waypoints[0].y;
            this.currentWaypointIndex = 1;
        }
    }

    takeDamage(amount, type = "physical") {
        // Shielded trait: chip damage is absorbed; only a single hit at or above
        // shieldBreak cracks the shield (and still lands at half). Cheap rapid
        // towers (Biology) can't break it; big hits (Physics/heroes) can.
        if (this.shielded && this.shieldUp) {
            if (amount >= this.shieldBreak) {
                this.shieldUp = false;
                amount *= 0.5;
            } else {
                amount *= 0.1;
            }
        }

        // Armored trait: resists physical/energy, neutral to magic, fully
        // vulnerable to acid (Chemistry is the intended counter).
        let resist = 1.0;
        if (this.armored) {
            if (type === "acid" || type === "true") resist = 1.0; // acid melts; 'true' pierces
            else if (type === "magic") resist = 0.75;
            else resist = 0.5;
        }

        const activeMelt = this.armorMeltTimer > 0 ? this.armorMeltFactor : 1.0;
        const finalDamage = amount * resist * activeMelt;

        this.health -= finalDamage;

        // Trigger Squash & Stretch elastic recoil only on real hits. Damage-over-
        // time / aura ticks (e.g. Curie's <1 dmg radiation every frame) would
        // otherwise re-squash the sprite every frame, making it flicker/stay flat.
        if (finalDamage >= 1) {
            this.squashX = 1.35; // compress flat
            this.squashY = 0.65;
            if (window.audioManager) window.audioManager.playSfx("enemy_hit");
        }

        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
        return finalDamage;
    }

    applySlow(factor, duration) {
        if (this.name === "Perpetual Motion") return;
        if (this.stunImmune) return; // bosses resist slow/stun
        if (factor < this.slowFactor || this.slowTimer <= 0) {
            this.slowFactor = factor;
        }
        this.slowTimer = Math.max(this.slowTimer, duration * 60);
    }

    applyPoison(damagePerTick, duration) {
        this.poisonDamage = Math.max(this.poisonDamage, damagePerTick);
        this.poisonTimer = Math.max(this.poisonTimer, duration * 60);
    }

    applyArmorMelt(factor, duration) {
        this.armorMeltFactor = Math.max(this.armorMeltFactor, factor);
        this.armorMeltTimer = Math.max(this.armorMeltTimer, duration * 60);
    }

    update(particleSystem, allEnemies) {
        // Elastic rebound squash and stretch lerp
        this.squashX += (1.0 - this.squashX) * 0.15;
        this.squashY += (1.0 - this.squashY) * 0.15;

        // Healer trait: periodically restore HP to nearby wounded allies.
        if (this.healer && allEnemies && !this.isDead) {
            this.healPulse++;
            if (this.healPulse >= 70) {
                this.healPulse = 0;
                let healedAny = false;
                allEnemies.forEach(o => {
                    if (o === this || o.isDead) return;
                    const d = Math.hypot(o.x - this.x, o.y - this.y);
                    if (d < 90 && o.health < o.maxHealth) {
                        o.health = Math.min(o.maxHealth, o.health + o.maxHealth * 0.06);
                        healedAny = true;
                        if (particleSystem) particleSystem.addFloatingText(o.x, o.y - 14, "+", "#f1c40f", 11);
                    }
                });
                if (healedAny && particleSystem) {
                    particleSystem.createShockwave(this.x, this.y, 90, "rgba(241,196,15,0.5)", 2, 1);
                }
            }
        }

        if (this.slowTimer > 0) {
            this.slowTimer--;
            if (this.slowTimer <= 0) {
                this.slowFactor = 1.0;
            }
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer--;
            if (this.poisonTimer % 12 === 0) {
                this.takeDamage(this.poisonDamage);
                if (particleSystem) {
                    particleSystem.createExplosion(this.x, this.y, "rgba(0, 255, 100, 0.4)", 2, 1.5);
                }
            }
        }

        if (this.armorMeltTimer > 0) {
            this.armorMeltTimer--;
            if (this.armorMeltTimer <= 0) {
                this.armorMeltFactor = 1.0;
            }
        }

        if (this.isDead) return false;

        const activeSpeed = this.baseSpeed * this.slowFactor;

        // Walk wobble cycle
        this.walkWobble += (activeSpeed * 0.18);

        if (this.currentWaypointIndex < this.waypoints.length) {
            const target = this.waypoints[this.currentWaypointIndex];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < activeSpeed) {
                this.x = target.x;
                this.y = target.y;
                this.currentWaypointIndex++;
            } else {
                this.x += (dx / dist) * activeSpeed;
                this.y += (dy / dist) * activeSpeed;
            }
        } else {
            this.reachedEnd = true;
            return false;
        }

        return true;
    }

    draw(ctx) {
        ctx.save();

        // Soft drop shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.size * 0.45, this.size * 0.45, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Apply Squash & Stretch and Walk Wobble
        ctx.translate(this.x, this.y);
        ctx.scale(this.squashX, this.squashY);

        // Slight rocking rotation during movement
        const rockAngle = Math.sin(this.walkWobble) * 0.08;
        ctx.rotate(rockAngle);

        // Animated walk strip → static whole image → procedural vector fallback.
        // drawSprite resolves `enemy_<key>_walk`, then a static `enemy_<key>`,
        // and returns false if no art is loaded so the vector cartoon draws instead.
        const drawn = window.drawSprite
            ? window.drawSprite(ctx, `enemy_${this.spriteKey}`, "walk",
                  -this.size / 2, -this.size / 2, this.size, this.size)
            : false;
        if (!drawn) {
            // High fidelity vector cartoon drawing fallbacks
            ctx.strokeStyle = "#1b1424";
            ctx.lineWidth = 2.5;
            this.drawCartoonVector(ctx);
        }

        ctx.restore();

        // Draw Health Bar (positioned above the squash boundaries so it remains steady!)
        if (this.health < this.maxHealth) {
            ctx.save();
            const barW = this.size * 0.8;
            const barH = 5;
            const bx = this.x - barW / 2;
            const by = this.y - this.size * 0.55 - 8;

            // parchment/wood dark frame
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

            const ratio = this.health / this.maxHealth;
            // High-saturated red-to-green classic health bar
            ctx.fillStyle = "rgba(255, 0, 50, 0.9)";
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = "rgba(0, 255, 100, 0.95)";
            ctx.fillRect(bx, by, barW * ratio, barH);
            ctx.restore();
        }

        // Draw active effect status indicators
        ctx.save();
        let offsetStatusX = -this.size * 0.35;
        const statusSize = 6;

        if (this.slowTimer > 0) {
            ctx.fillStyle = "#00ffff";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#00ffff";
            ctx.beginPath();
            ctx.arc(this.x + offsetStatusX, this.y - this.size * 0.6 - 1, statusSize / 2, 0, Math.PI * 2);
            ctx.fill();
            offsetStatusX += 8;
        }
        if (this.poisonTimer > 0) {
            ctx.fillStyle = "#00ff33";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#00ff33";
            ctx.beginPath();
            ctx.arc(this.x + offsetStatusX, this.y - this.size * 0.6 - 1, statusSize / 2, 0, Math.PI * 2);
            ctx.fill();
            offsetStatusX += 8;
        }
        if (this.armorMeltTimer > 0) {
            ctx.fillStyle = "#ff6600";
            ctx.shadowBlur = 4;
            ctx.shadowColor = "#ff6600";
            ctx.beginPath();
            ctx.arc(this.x + offsetStatusX, this.y - this.size * 0.6 - 1, statusSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawCartoonVector(ctx) {
        // Fallback default shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// ============================================================
// EXISTING ENEMY CLASSES — HP multiplied ~2.2x, scaling steepened
// ============================================================

// 1. FLAT EARTH (Cute spinning flat globe)
// Was: 55 * 1.25^lvl   -> Now: 121 * 1.32^lvl
class FlatEarthEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            0.8,
            121 * Math.pow(1.32, levelScale),
            20 + Math.floor(levelScale * 2),
            4,
            16,
            "#22a7f0",
            "Flat Earth"
        );
        this.spriteKey = "flatearth";
        this.armored = true; // slow tank — resists Physics/Biology, weak to Chemistry acid
    }

    drawCartoonVector(ctx) {
        // Renders a flat cartoon disk with green continents and a glass dome
        ctx.fillStyle = "#3e2723"; // woody underside crust
        ctx.beginPath();
        ctx.ellipse(0, 5, this.size * 0.45, this.size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Blue flat water surface
        ctx.fillStyle = "#22a7f0";
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.45, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Green grass blobs (continents)
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.ellipse(-10, -1, 8, 3, 0, 0, Math.PI * 2);
        ctx.ellipse(8, 2, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.ellipse(0, -3, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shiny glass dome overlay
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.arc(0, -1, this.size * 0.32, Math.PI, 0, false);
        ctx.fill();
    }
}

// 2. PHLOGISTON (Bubbly fluid fire drop with gradients)
// Was: 22 * 1.25^lvl  -> Now: 48 * 1.30^lvl  (fast swarm stays squishier)
class PhlogistonEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            2.2,
            48 * Math.pow(1.30, levelScale),
            15 + Math.floor(levelScale * 1),
            3,
            12,
            "#e67e22",
            "Phlogiston"
        );
        this.spriteKey = "phlogiston";
        this.pulseTime = 0;
        this.fast = true; // fast swarm — punish gaps; Physics chain & Astronomy AoE counter
    }

    drawCartoonVector(ctx) {
        this.pulseTime += 0.25;
        const pulse = Math.sin(this.pulseTime) * 1.5;

        // Bubbly fire flame droplet using custom radial gradient
        const fireGrad = ctx.createRadialGradient(-2, 3, 1, 0, 0, this.size * 0.5);
        fireGrad.addColorStop(0, "#ffffff"); // glowing white center
        fireGrad.addColorStop(0.2, "#f1c40f"); // hot yellow
        fireGrad.addColorStop(0.6, "#e67e22"); // orange
        fireGrad.addColorStop(1, "#c0392b"); // deep red rim

        ctx.fillStyle = fireGrad;

        // Flame path
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.65 - pulse);
        ctx.quadraticCurveTo(-this.size * 0.4, 0, -this.size * 0.35, this.size * 0.35);
        ctx.quadraticCurveTo(0, this.size * 0.55, this.size * 0.35, this.size * 0.35);
        ctx.quadraticCurveTo(this.size * 0.4, 0, 0, -this.size * 0.65 - pulse);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.beginPath();
        ctx.ellipse(-5, 0, 3.5, 9, Math.PI / 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 3. SPONTANEOUS GENERATION (Cute green bug with transparent wings)
// Was: (sub:15, main:40) * 1.25^lvl  -> Now: (sub:33, main:88) * 1.30^lvl
class SpontaneousEnemy extends Enemy {
    constructor(x, y, levelScale = 1, isSubSpawn = false) {
        super(
            x, y,
            isSubSpawn ? 1.8 : 1.3,
            (isSubSpawn ? 33 : 88) * Math.pow(1.30, levelScale),
            isSubSpawn ? 5 : 25,
            isSubSpawn ? 1 : 5,
            isSubSpawn ? 8 : 15,
            "#87d37c",
            isSubSpawn ? "Decaying Maggot" : "Spontaneous Generation"
        );
        this.isSubSpawn = isSubSpawn;
        this.levelScale = levelScale;
        this.spriteKey = isSubSpawn ? "maggot" : "spontaneous";
        this.wingTimer = 0;
    }

    drawCartoonVector(ctx) {
        if (this.isSubSpawn) {
            // Decaying Maggot: A cute squishy layered worm segment
            const maggotGrad = ctx.createLinearGradient(0, -10, 0, 10);
            maggotGrad.addColorStop(0, "#eceff1");
            maggotGrad.addColorStop(1, "#cfd8dc");
            ctx.fillStyle = maggotGrad;

            // Segment 1
            ctx.beginPath();
            ctx.arc(0, -4, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Segment 2
            ctx.beginPath();
            ctx.arc(0, 2, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Tiny cartoon eyes
            ctx.fillStyle = "#ff2222";
            ctx.beginPath();
            ctx.arc(-2, -6, 1.5, 0, Math.PI * 2);
            ctx.arc(2, -6, 1.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Mold Fly: Round toxic green cell with wings flap
            this.wingTimer += 0.4;
            const wingFlap = Math.sin(this.wingTimer) * 0.4;

            // Draw wings behind body
            ctx.save();
            ctx.fillStyle = "rgba(200, 230, 255, 0.65)";
            ctx.strokeStyle = "#2980b9";
            ctx.lineWidth = 2.0;

            // Left wing
            ctx.beginPath();
            ctx.ellipse(-12, -8, 6, 14, -Math.PI / 4 + wingFlap, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Right wing
            ctx.beginPath();
            ctx.ellipse(12, -8, 6, 14, Math.PI / 4 - wingFlap, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Body
            const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.size * 0.4);
            bodyGrad.addColorStop(0, "#a3e4d7");
            bodyGrad.addColorStop(1, "#27ae60");
            ctx.fillStyle = bodyGrad;

            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.38, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Big round cartoon red eyes
            ctx.fillStyle = "#e74c3c";
            ctx.beginPath();
            ctx.arc(-6, -6, 5, 0, Math.PI * 2);
            ctx.arc(6, -6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // White eye glares
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(-7, -7, 1.5, 0, Math.PI * 2);
            ctx.arc(5, -7, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 4. ALCHEMY (Vibrant metallic crucible)
// Was: 75 * 1.25^lvl  -> Now: 165 * 1.32^lvl
class AlchemyEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            1.0,
            165 * Math.pow(1.32, levelScale),
            50 + Math.floor(levelScale * 5),
            8,
            18,
            "#f39c12",
            "Alchemy Transmutation"
        );
        this.spriteKey = "alchemy";
        this.healer = true; // heals nearby misconceptions — priority kill
    }

    drawCartoonVector(ctx) {
        // High fidelity gold metallic crucible
        const goldGrad = ctx.createLinearGradient(0, -this.size * 0.45, 0, this.size * 0.45);
        goldGrad.addColorStop(0, "#ffe066");
        goldGrad.addColorStop(0.5, "#f1c40f");
        goldGrad.addColorStop(1, "#996500");
        ctx.fillStyle = goldGrad;

        // Crucible bulb body
        ctx.beginPath();
        ctx.moveTo(-this.size * 0.25, -this.size * 0.45);
        ctx.lineTo(this.size * 0.25, -this.size * 0.45);
        ctx.lineTo(this.size * 0.22, -this.size * 0.25);
        ctx.quadraticCurveTo(this.size * 0.45, this.size * 0.2, 0, this.size * 0.48);
        ctx.quadraticCurveTo(-this.size * 0.45, this.size * 0.2, -this.size * 0.22, -this.size * 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rim
        drawRoundedRect(ctx, -this.size * 0.28, -this.size * 0.48, this.size * 0.56, 6, 2, "#ffd700", "#1b1424", 2);

        // Core shining crystal inside
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 5. PERPETUAL MOTION (Spinning infinity circles with cyan glow)
// Was: 35 * 1.25^lvl  -> Now: 77 * 1.32^lvl
class PerpetualEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            2.5,
            77 * Math.pow(1.32, levelScale),
            30,
            6,
            14,
            "#9b59b6",
            "Perpetual Motion"
        );
        this.spriteKey = "perpetual";
        this.spinVal = 0;
        this.shielded = true;  // chip damage absorbed until one big hit cracks it
        this.shieldUp = true;
    }

    drawCartoonVector(ctx) {
        // Neon spinning orbital infinity rings
        this.spinVal += 0.12;
        ctx.rotate(this.spinVal);

        ctx.strokeStyle = "#9b59b6";
        ctx.lineWidth = 4.5;
        ctx.fillStyle = "rgba(0,0,0,0.1)";

        // Double rings
        ctx.beginPath();
        ctx.arc(-8, 0, 9, 0, Math.PI * 2);
        ctx.arc(8, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shiny cyan center nodes
        ctx.fillStyle = "#00ffff";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00ffff";
        ctx.beginPath();
        ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
        ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 6. GEOCENTRIC MYTH (Flying earth-at-the-centre model — only anti-air towers can hit it)
// Was: 45 * 1.25^lvl  -> Now: 99 * 1.32^lvl
class GeocentricEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            1.6,
            99 * Math.pow(1.32, levelScale),
            22 + Math.floor(levelScale * 2),
            5,
            14,
            "#5dade2",
            "Geocentric Myth"
        );
        this.spriteKey = "geocentric";
        this.flying = true; // bypasses ground-only towers; needs anti-air
        this.orbit = 0;
    }

    drawCartoonVector(ctx) {
        this.orbit += 0.08;
        const hover = Math.sin(this.walkWobble * 0.5) * 3;
        ctx.translate(0, hover - 6); // float above the path

        // Orbit ring (drawn first, behind)
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.7, this.size * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Central earth
        const earthGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, this.size * 0.4);
        earthGrad.addColorStop(0, "#5dade2");
        earthGrad.addColorStop(1, "#1f618d");
        ctx.fillStyle = earthGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Continents
        ctx.fillStyle = "#27ae60";
        ctx.beginPath();
        ctx.ellipse(-2, 1, 4, 2.5, 0.4, 0, Math.PI * 2);
        ctx.ellipse(4, -2, 2.5, 1.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting sun
        const sx = Math.cos(this.orbit) * (this.size * 0.7);
        const sy = Math.sin(this.orbit) * (this.size * 0.35);
        ctx.fillStyle = "#f1c40f";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#f39c12";
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();
    }
}

// ============================================================
// NEW REGULAR ENEMIES (Task B)
// ============================================================

// 7. MIASMA — medium HP, normal speed, sickly green, resistant to poison
class MiasmaEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            1.1,
            110 * Math.pow(1.30, levelScale),
            18 + Math.floor(levelScale * 2),
            4,
            15,
            "#5d8a27",
            "Miasma Cloud"
        );
        this.spriteKey = "miasma";
        this.poisonResist = true; // halve incoming poison ticks
        this.bubbleTimer = 0;
    }

    applyPoison(damagePerTick, duration) {
        // Miasma is resistant to poison — only half effect
        super.applyPoison(damagePerTick * 0.5, duration * 0.5);
    }

    drawCartoonVector(ctx) {
        this.bubbleTimer += 0.07;
        const bob = Math.sin(this.bubbleTimer) * 2.5;

        // Outer sickly green toxic cloud
        ctx.fillStyle = "rgba(100, 170, 40, 0.55)";
        ctx.beginPath();
        ctx.arc(-8, bob + 2, this.size * 0.3, 0, Math.PI * 2);
        ctx.arc(8, bob - 1, this.size * 0.28, 0, Math.PI * 2);
        ctx.arc(0, bob - 4, this.size * 0.32, 0, Math.PI * 2);
        ctx.fill();

        // Core body — darker swampy green blob
        const miaGrad = ctx.createRadialGradient(-3, bob - 2, 2, 0, bob, this.size * 0.35);
        miaGrad.addColorStop(0, "#a8d550");
        miaGrad.addColorStop(0.6, "#5d8a27");
        miaGrad.addColorStop(1, "#2d4a0d");
        ctx.fillStyle = miaGrad;
        ctx.beginPath();
        ctx.arc(0, bob, this.size * 0.33, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Glowing toxic pupils
        ctx.fillStyle = "#c8ff00";
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#c8ff00";
        ctx.beginPath();
        ctx.arc(-5, bob - 4, 3, 0, Math.PI * 2);
        ctx.arc(5, bob - 4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Dripping tendrils
        ctx.strokeStyle = "rgba(80, 140, 20, 0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, bob + this.size * 0.3);
        ctx.quadraticCurveTo(-6, bob + this.size * 0.45, -5, bob + this.size * 0.55);
        ctx.moveTo(4, bob + this.size * 0.3);
        ctx.quadraticCurveTo(6, bob + this.size * 0.45, 5, bob + this.size * 0.55);
        ctx.stroke();
    }
}

// 8. CALORIC — VERY FAST swarm, low HP, glowing heat shimmer
class CaloricEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            3.4,
            38 * Math.pow(1.28, levelScale),
            10 + Math.floor(levelScale * 1),
            2,
            10,
            "#ff6f00",
            "Caloric Fluid"
        );
        this.spriteKey = "caloric";
        this.fast = true;
        this.heatTimer = 0;
    }

    drawCartoonVector(ctx) {
        this.heatTimer += 0.3;
        const shimmer = Math.sin(this.heatTimer) * 1.2;

        // Heat shimmer outer glow
        ctx.fillStyle = "rgba(255, 160, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.52 + shimmer, 0, Math.PI * 2);
        ctx.fill();

        // Main teardrop body — hot orange to white core
        const heatGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, this.size * 0.38);
        heatGrad.addColorStop(0, "#ffffff");
        heatGrad.addColorStop(0.25, "#fff176");
        heatGrad.addColorStop(0.6, "#ff9800");
        heatGrad.addColorStop(1, "#bf360c");
        ctx.fillStyle = heatGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Wavering heat lines above
        ctx.strokeStyle = "rgba(255, 200, 50, 0.7)";
        ctx.lineWidth = 1.5;
        for (let i = -1; i <= 1; i++) {
            const ox = i * 5;
            const wy = Math.sin(this.heatTimer + i) * 2;
            ctx.beginPath();
            ctx.moveTo(ox, -this.size * 0.38);
            ctx.quadraticCurveTo(ox + wy, -this.size * 0.55, ox - wy, -this.size * 0.72);
            ctx.stroke();
        }
    }
}

// 9. AETHER — FLYING, fast, translucent shimmering look
class AetherEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            2.0,
            75 * Math.pow(1.30, levelScale),
            20 + Math.floor(levelScale * 2),
            4,
            13,
            "#b0c4de",
            "Luminiferous Aether"
        );
        this.spriteKey = "aether";
        this.flying = true;
        this.shimmerTimer = 0;
    }

    drawCartoonVector(ctx) {
        this.shimmerTimer += 0.09;
        const hover = Math.sin(this.shimmerTimer) * 4;
        const alpha = 0.55 + Math.sin(this.shimmerTimer * 1.7) * 0.2;

        ctx.translate(0, hover - 5);

        // Outer ethereal shimmer ring
        ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size * 0.55, this.size * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Translucent inner body
        const aetherGrad = ctx.createRadialGradient(0, -3, 1, 0, 0, this.size * 0.38);
        aetherGrad.addColorStop(0, `rgba(230, 245, 255, ${alpha})`);
        aetherGrad.addColorStop(0.5, `rgba(140, 185, 230, ${alpha * 0.8})`);
        aetherGrad.addColorStop(1, `rgba(60, 120, 180, ${alpha * 0.5})`);
        ctx.fillStyle = aetherGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(150, 200, 255, 0.6)`;
        ctx.stroke();

        // Sparkling interior motes
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#b0c4de";
        for (let i = 0; i < 3; i++) {
            const angle = this.shimmerTimer * 1.2 + (i * Math.PI * 2 / 3);
            const r = this.size * 0.18;
            ctx.beginPath();
            ctx.arc(Math.cos(angle) * r, Math.sin(angle) * r, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}

// 10. VITALISM — regenerates HP over time, green life-glow
class VitalismEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            1.2,
            120 * Math.pow(1.30, levelScale),
            22 + Math.floor(levelScale * 2),
            5,
            15,
            "#27ae60",
            "Vital Force"
        );
        this.spriteKey = "vitalism";
        this.lifeTimer = 0;
    }

    update(particleSystem, allEnemies) {
        // Regenerate 0.4% max HP per frame, up to maximum
        if (!this.isDead && this.health > 0 && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.004);
        }
        return super.update(particleSystem, allEnemies);
    }

    drawCartoonVector(ctx) {
        this.lifeTimer += 0.08;
        const pulse = Math.sin(this.lifeTimer) * 1.5;

        // Outer life-aura halo
        ctx.fillStyle = `rgba(39, 174, 96, ${0.18 + Math.sin(this.lifeTimer * 1.3) * 0.08})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.52 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Main body — verdant green orb
        const lifeGrad = ctx.createRadialGradient(-4, -4, 1, 0, 0, this.size * 0.4);
        lifeGrad.addColorStop(0, "#a9dfbf");
        lifeGrad.addColorStop(0.5, "#27ae60");
        lifeGrad.addColorStop(1, "#1a6b3c");
        ctx.fillStyle = lifeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Leaf veins / life sigils
        ctx.strokeStyle = "rgba(100, 230, 120, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.3);
        ctx.lineTo(0, this.size * 0.3);
        ctx.moveTo(-this.size * 0.2, -this.size * 0.1);
        ctx.lineTo(this.size * 0.2, -this.size * 0.1);
        ctx.moveTo(-this.size * 0.15, this.size * 0.1);
        ctx.lineTo(this.size * 0.15, this.size * 0.1);
        ctx.stroke();

        // Glowing eyes
        ctx.fillStyle = "#00ff80";
        ctx.shadowBlur = 7;
        ctx.shadowColor = "#00ff80";
        ctx.beginPath();
        ctx.arc(-5, -3, 3, 0, Math.PI * 2);
        ctx.arc(5, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// 11. HUMOURS — armored AND healer, medium-high HP, four-coloured fluid look
class HumoursEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            0.95,
            145 * Math.pow(1.32, levelScale),
            35 + Math.floor(levelScale * 3),
            7,
            17,
            "#8e44ad",
            "Four Humours"
        );
        this.spriteKey = "humours";
        this.armored = true;
        this.healer = true;
        this.humourAngle = 0;
    }

    drawCartoonVector(ctx) {
        this.humourAngle += 0.04;
        const s = this.size;

        // Four-quadrant humour body
        const humourColors = ["#e74c3c", "#f1c40f", "#2980b9", "#27ae60"];
        for (let i = 0; i < 4; i++) {
            const startAngle = (i * Math.PI / 2) + this.humourAngle;
            const endAngle = startAngle + Math.PI / 2;
            ctx.fillStyle = humourColors[i];
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, s * 0.42, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();
        }

        // Outer border
        ctx.strokeStyle = "#1b1424";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
        ctx.stroke();

        // Armored plate ring
        ctx.strokeStyle = "rgba(180, 150, 80, 0.75)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
        ctx.stroke();

        // Dividing cross lines
        ctx.strokeStyle = "rgba(0,0,0,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-s * 0.42, 0);
        ctx.lineTo(s * 0.42, 0);
        ctx.moveTo(0, -s * 0.42);
        ctx.lineTo(0, s * 0.42);
        ctx.stroke();

        // Healing cross symbol in center
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(-2, -7, 4, 14);
        ctx.fillRect(-7, -2, 14, 4);
    }
}

// 12. CREATIONIST — VERY high HP, very slow, stony/ancient look
class CreationistEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            0.45,
            280 * Math.pow(1.35, levelScale),
            60 + Math.floor(levelScale * 5),
            10,
            22,
            "#7f8c8d",
            "Creationist Titan"
        );
        this.spriteKey = "creationist";
        this.armored = true;
        this.rockAngle = 0;
    }

    drawCartoonVector(ctx) {
        this.rockAngle += 0.015;
        const s = this.size;

        // Stone body — heavy angular silhouette
        const stoneGrad = ctx.createLinearGradient(-s * 0.4, -s * 0.45, s * 0.4, s * 0.45);
        stoneGrad.addColorStop(0, "#bdc3c7");
        stoneGrad.addColorStop(0.4, "#95a5a6");
        stoneGrad.addColorStop(1, "#5d6d7e");
        ctx.fillStyle = stoneGrad;

        // Blocky body shape
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.45);
        ctx.lineTo(s * 0.3, -s * 0.45);
        ctx.lineTo(s * 0.42, -s * 0.15);
        ctx.lineTo(s * 0.38, s * 0.35);
        ctx.lineTo(-s * 0.38, s * 0.35);
        ctx.lineTo(-s * 0.42, -s * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Crack lines on stone
        ctx.strokeStyle = "rgba(50, 50, 50, 0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-s * 0.1, -s * 0.3);
        ctx.lineTo(-s * 0.2, s * 0.1);
        ctx.lineTo(-s * 0.05, s * 0.25);
        ctx.moveTo(s * 0.12, -s * 0.25);
        ctx.lineTo(s * 0.08, s * 0.2);
        ctx.stroke();

        // Ancient eye glyphs
        ctx.fillStyle = "#e8d44d";
        ctx.shadowBlur = 5;
        ctx.shadowColor = "#e8d44d";
        ctx.beginPath();
        ctx.ellipse(-s * 0.13, -s * 0.08, 4, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(s * 0.13, -s * 0.08, 4, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-s * 0.13, -s * 0.08, 2, 0, Math.PI * 2);
        ctx.arc(s * 0.13, -s * 0.08, 2, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting stone fragments
        for (let i = 0; i < 3; i++) {
            const ang = this.rockAngle + (i * Math.PI * 2 / 3);
            const rx = Math.cos(ang) * (s * 0.58);
            const ry = Math.sin(ang) * (s * 0.28);
            ctx.fillStyle = "#95a5a6";
            ctx.strokeStyle = "#5d6d7e";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }
}

// ============================================================
// MULTISTAGE / TRANSFORMING ENEMIES (Task C)
// ============================================================

// 13. HOMUNCULUS — Stage 1: slow armored shell tank → Stage 2: fast fragile humanoid
class HomunculusEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            0.7,
            200 * Math.pow(1.32, levelScale),
            40 + Math.floor(levelScale * 4),
            8,
            19,
            "#7d3c98",
            "Homunculus Shell"
        );
        this.spriteKey = "homunculus";
        this.armored = true;
        this.stage = 1;
        this.levelScale = levelScale;
        this.transformTimer = 0; // for visual pop after transform
    }

    takeDamage(amount, type = "physical") {
        if (this.stage === 1) {
            const dmg = super.takeDamage(amount, type);
            // On stage-1 death: transform instead of dying
            if (this.isDead) {
                this._transformToStage2();
            }
            return dmg;
        }
        return super.takeDamage(amount, type);
    }

    _transformToStage2() {
        const stage2HP = 80 * Math.pow(1.30, this.levelScale);
        this.health = stage2HP;
        this.maxHealth = stage2HP;
        this.isDead = false;
        // Become fast and fragile
        this.baseSpeed = 3.2;
        this.speed = 3.2;
        this.armored = false;
        this.shielded = false;
        this.size = this.size * 0.72; // smaller, shed the shell
        this.name = "Homunculus Core";
        this.spriteKey = "homunculus_core";
        this.stage = 2;
        this.transformTimer = 30; // flash effect
        // Squash pop
        this.squashX = 1.5;
        this.squashY = 0.5;
    }

    update(particleSystem, allEnemies) {
        if (this.transformTimer > 0) {
            this.transformTimer--;
            // Spawn shell-shatter particles on first frame of transform
            if (this.transformTimer === 29 && particleSystem) {
                particleSystem.createExplosion(this.x, this.y, "rgba(125, 60, 152, 0.9)", 10, 4);
                particleSystem.addFloatingText(this.x, this.y - 20, "SHED!", "#e056fd", 14);
            }
        }
        return super.update(particleSystem, allEnemies);
    }

    drawCartoonVector(ctx) {
        const s = this.size;
        if (this.stage === 1) {
            // Stage 1: bulky shelled form
            const shellGrad = ctx.createLinearGradient(-s * 0.4, -s * 0.45, s * 0.4, s * 0.45);
            shellGrad.addColorStop(0, "#d7bde2");
            shellGrad.addColorStop(0.5, "#7d3c98");
            shellGrad.addColorStop(1, "#4a235a");
            ctx.fillStyle = shellGrad;
            ctx.beginPath();
            ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Shell ribbing
            ctx.strokeStyle = "rgba(200, 160, 220, 0.5)";
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const a = (i / 4) * Math.PI * 2;
                ctx.beginPath();
                ctx.arc(0, 0, s * (0.25 + i * 0.05), 0, Math.PI * 2);
                ctx.stroke();
            }

            // Small peeking eyes
            ctx.fillStyle = "#ff69b4";
            ctx.beginPath();
            ctx.arc(-6, -4, 3.5, 0, Math.PI * 2);
            ctx.arc(6, -4, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(-7, -5, 1.2, 0, Math.PI * 2);
            ctx.arc(5, -5, 1.2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Stage 2: small, fast, exposed humanoid core
            const coreGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, s * 0.38);
            coreGrad.addColorStop(0, "#f8c8ff");
            coreGrad.addColorStop(0.5, "#e056fd");
            coreGrad.addColorStop(1, "#7d3c98");
            ctx.fillStyle = coreGrad;
            // Small humanoid blob body
            ctx.beginPath();
            ctx.arc(0, 2, s * 0.32, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Head
            ctx.fillStyle = "#f8c8ff";
            ctx.beginPath();
            ctx.arc(0, -s * 0.28, s * 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Frantic eyes
            ctx.fillStyle = "#ff0066";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#ff0066";
            ctx.beginPath();
            ctx.arc(-4, -s * 0.3, 2.5, 0, Math.PI * 2);
            ctx.arc(4, -s * 0.3, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// 14. GOLEM — Stage 1: shielded stone-alchemy tank → Stage 2: fast molten sludge
class GolemEnemy extends Enemy {
    constructor(x, y, levelScale = 1) {
        super(
            x, y,
            0.6,
            240 * Math.pow(1.33, levelScale),
            50 + Math.floor(levelScale * 4),
            9,
            21,
            "#626567",
            "Stone Golem"
        );
        this.spriteKey = "golem";
        this.shielded = true;
        this.shieldUp = true;
        this.shieldBreak = 35;
        this.stage = 1;
        this.levelScale = levelScale;
        this.transformTimer = 0;
        this.spinAngle = 0;
    }

    takeDamage(amount, type = "physical") {
        if (this.stage === 1) {
            const dmg = super.takeDamage(amount, type);
            if (this.isDead) {
                this._transformToStage2();
            }
            return dmg;
        }
        return super.takeDamage(amount, type);
    }

    _transformToStage2() {
        const stage2HP = 95 * Math.pow(1.30, this.levelScale);
        this.health = stage2HP;
        this.maxHealth = stage2HP;
        this.isDead = false;
        this.baseSpeed = 2.9;
        this.speed = 2.9;
        this.shielded = false;
        this.shieldUp = false;
        this.armored = false;
        this.size = this.size * 0.80;
        this.name = "Molten Sludge";
        this.spriteKey = "golem_molten";
        this.stage = 2;
        this.transformTimer = 30;
        this.squashX = 0.5;
        this.squashY = 1.6;
    }

    update(particleSystem, allEnemies) {
        if (this.transformTimer > 0) {
            this.transformTimer--;
            if (this.transformTimer === 29 && particleSystem) {
                particleSystem.createExplosion(this.x, this.y, "rgba(255, 120, 0, 0.9)", 12, 5);
                particleSystem.addFloatingText(this.x, this.y - 20, "MELTING!", "#ff6600", 14);
            }
        }
        this.spinAngle += 0.05;
        return super.update(particleSystem, allEnemies);
    }

    drawCartoonVector(ctx) {
        const s = this.size;
        if (this.stage === 1) {
            // Stage 1: stone golem body
            const stoneGrad = ctx.createLinearGradient(-s * 0.4, -s * 0.45, s * 0.4, s * 0.5);
            stoneGrad.addColorStop(0, "#d5d8dc");
            stoneGrad.addColorStop(0.5, "#808b96");
            stoneGrad.addColorStop(1, "#424949");
            ctx.fillStyle = stoneGrad;

            // Torso block
            ctx.beginPath();
            ctx.moveTo(-s * 0.35, -s * 0.2);
            ctx.lineTo(s * 0.35, -s * 0.2);
            ctx.lineTo(s * 0.38, s * 0.35);
            ctx.lineTo(-s * 0.38, s * 0.35);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Head block
            ctx.fillStyle = "#95a5a6";
            ctx.beginPath();
            ctx.rect(-s * 0.25, -s * 0.48, s * 0.5, s * 0.3);
            ctx.fill();
            ctx.stroke();

            // Shield glow outline
            if (this.shieldUp) {
                ctx.strokeStyle = "rgba(52, 152, 219, 0.8)";
                ctx.lineWidth = 4;
                ctx.shadowBlur = 10;
                ctx.shadowColor = "#3498db";
                ctx.beginPath();
                ctx.arc(0, 0, s * 0.52, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Glowing alchemical rune eyes
            ctx.fillStyle = "#f39c12";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#f39c12";
            ctx.beginPath();
            ctx.arc(-s * 0.1, -s * 0.3, 3.5, 0, Math.PI * 2);
            ctx.arc(s * 0.1, -s * 0.3, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Stage 2: molten sludge — flowing hot lava form
            const lavaGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, s * 0.42);
            lavaGrad.addColorStop(0, "#fff176");
            lavaGrad.addColorStop(0.35, "#ff9800");
            lavaGrad.addColorStop(0.7, "#e64a19");
            lavaGrad.addColorStop(1, "#4e342e");
            ctx.fillStyle = lavaGrad;

            // Amorphous blob
            ctx.beginPath();
            const points = 8;
            for (let i = 0; i < points; i++) {
                const a = (i / points) * Math.PI * 2 + this.spinAngle * 0.5;
                const r = s * (0.35 + Math.sin(this.spinAngle * 2 + i * 1.2) * 0.08);
                if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = "#bf360c";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Lava bubble eyes
            ctx.fillStyle = "#fff176";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#ffeb3b";
            ctx.beginPath();
            ctx.arc(-s * 0.12, -s * 0.08, 4, 0, Math.PI * 2);
            ctx.arc(s * 0.12, -s * 0.08, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// ============================================================
// BOSS ENEMIES (Task D)
// ============================================================

// 15. BOSS_GEO — GeoColossusBoss (Lvl 5 mini-boss)
class GeoColossusBoss extends Enemy {
    constructor(x, y, levelScale = 1) {
        const baseHP = 55 * 18; // ~18x a normal FlatEarth base
        super(
            x, y,
            0.55,
            baseHP * Math.pow(1.32, levelScale),
            180 + Math.floor(levelScale * 15),
            30,
            36,
            "#1a5276",
            "Geo Colossus"
        );
        this.spriteKey = "boss_geo";
        this.isBoss = true;
        this.stunImmune = true;
        this.armored = true;
        this.orbit = 0;
        this.rumbleTimer = 0;
    }

    drawCartoonVector(ctx) {
        this.orbit += 0.04;
        this.rumbleTimer += 0.1;
        const rumble = Math.sin(this.rumbleTimer * 3) * 1.5;
        const s = this.size;

        // Massive flat disc body
        ctx.fillStyle = "#3e2723";
        ctx.beginPath();
        ctx.ellipse(0, 8 + rumble, s * 0.48, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Surface — deep ocean blue
        const geoGrad = ctx.createRadialGradient(-6, -4, 3, 0, 0, s * 0.48);
        geoGrad.addColorStop(0, "#5dade2");
        geoGrad.addColorStop(0.6, "#1a5276");
        geoGrad.addColorStop(1, "#0a2a3e");
        ctx.fillStyle = geoGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0 + rumble, s * 0.48, s * 0.16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Continent blobs
        ctx.fillStyle = "#1e8449";
        ctx.beginPath();
        ctx.ellipse(-14, -2 + rumble, 10, 5, 0.3, 0, Math.PI * 2);
        ctx.ellipse(12, 1 + rumble, 9, 4, -0.2, 0, Math.PI * 2);
        ctx.ellipse(0, -4 + rumble, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Orbiting pillars/moons
        for (let i = 0; i < 3; i++) {
            const a = this.orbit + (i * Math.PI * 2 / 3);
            const px = Math.cos(a) * (s * 0.72);
            const py = Math.sin(a) * (s * 0.36) + rumble;
            ctx.fillStyle = "#85c1e9";
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#5dade2";
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.stroke();
        }

        // Giant boss eyes
        ctx.fillStyle = "#f1c40f";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#f1c40f";
        ctx.beginPath();
        ctx.arc(-8, -3 + rumble, 5, 0, Math.PI * 2);
        ctx.arc(8, -3 + rumble, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-8, -3 + rumble, 2.5, 0, Math.PI * 2);
        ctx.arc(8, -3 + rumble, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 16. BOSS_PHLOG — PhlogistonTyrantBoss (Lvl 10 mini-boss)
class PhlogistonTyrantBoss extends Enemy {
    constructor(x, y, levelScale = 1) {
        const baseHP = 22 * 22; // big multiplier
        super(
            x, y,
            1.1,
            baseHP * Math.pow(1.32, levelScale),
            250 + Math.floor(levelScale * 20),
            40,
            34,
            "#e74c3c",
            "Phlogiston Tyrant"
        );
        this.spriteKey = "boss_phlog";
        this.isBoss = true;
        this.stunImmune = true;
        this.pulseTime = 0;
    }

    drawCartoonVector(ctx) {
        this.pulseTime += 0.18;
        const pulse = Math.sin(this.pulseTime) * 2.5;
        const s = this.size;

        // Infernal fire aura
        ctx.fillStyle = "rgba(255, 80, 0, 0.2)";
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.65 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Multi-layer flame body
        const tyrantGrad = ctx.createRadialGradient(-4, 4, 2, 0, 0, s * 0.5);
        tyrantGrad.addColorStop(0, "#ffffff");
        tyrantGrad.addColorStop(0.15, "#fff176");
        tyrantGrad.addColorStop(0.4, "#ff9800");
        tyrantGrad.addColorStop(0.75, "#e53935");
        tyrantGrad.addColorStop(1, "#4a0000");
        ctx.fillStyle = tyrantGrad;

        // Main flame shape
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.72 - pulse);
        ctx.quadraticCurveTo(-s * 0.5, -s * 0.2, -s * 0.45, s * 0.35);
        ctx.quadraticCurveTo(0, s * 0.62, s * 0.45, s * 0.35);
        ctx.quadraticCurveTo(s * 0.5, -s * 0.2, 0, -s * 0.72 - pulse);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Side flare jets
        for (let side = -1; side <= 1; side += 2) {
            ctx.fillStyle = `rgba(255, 150, 0, 0.7)`;
            ctx.beginPath();
            ctx.moveTo(side * s * 0.3, -s * 0.1);
            ctx.quadraticCurveTo(side * s * 0.65, -s * 0.35, side * s * 0.6, s * 0.1);
            ctx.quadraticCurveTo(side * s * 0.4, s * 0.2, side * s * 0.2, s * 0.1);
            ctx.closePath();
            ctx.fill();
        }

        // Blazing eyes
        ctx.fillStyle = "#fff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#fff";
        ctx.beginPath();
        ctx.arc(-s * 0.14, -s * 0.08, 5.5, 0, Math.PI * 2);
        ctx.arc(s * 0.14, -s * 0.08, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#e53935";
        ctx.beginPath();
        ctx.arc(-s * 0.14, -s * 0.08, 3, 0, Math.PI * 2);
        ctx.arc(s * 0.14, -s * 0.08, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 17. BOSS_AETHER — AetherLeviathanBoss (Lvl 15 mini-boss A, FLYING)
class AetherLeviathanBoss extends Enemy {
    constructor(x, y, levelScale = 1) {
        const baseHP = 45 * 22;
        super(
            x, y,
            1.7,
            baseHP * Math.pow(1.33, levelScale),
            280 + Math.floor(levelScale * 22),
            45,
            38,
            "#7fb3d3",
            "Aether Leviathan"
        );
        this.spriteKey = "boss_aether";
        this.isBoss = true;
        this.stunImmune = true;
        this.flying = true;
        this.shimmerTimer = 0;
        this.serpentAngle = 0;
    }

    drawCartoonVector(ctx) {
        this.shimmerTimer += 0.07;
        this.serpentAngle += 0.06;
        const hover = Math.sin(this.shimmerTimer) * 6;
        const alpha = 0.7 + Math.sin(this.shimmerTimer * 2) * 0.15;
        const s = this.size;

        ctx.translate(0, hover - 8);

        // Ethereal outer corona
        ctx.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.5})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) {
            const r = s * (0.5 + i * 0.12);
            ctx.globalAlpha = alpha * (0.4 - i * 0.12);
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Serpentine leviathan body — segmented
        for (let i = 3; i >= 0; i--) {
            const a = this.serpentAngle + i * 0.4;
            const segX = Math.cos(a) * (s * 0.28 * i * 0.4);
            const segY = Math.sin(a * 1.3) * (s * 0.15 * i * 0.35);
            const segR = s * (0.35 - i * 0.06);
            const segAlpha = alpha * (1 - i * 0.15);
            ctx.fillStyle = `rgba(100, 175, 230, ${segAlpha})`;
            ctx.beginPath();
            ctx.arc(segX, segY, segR, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main head
        const headGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, s * 0.4);
        headGrad.addColorStop(0, `rgba(220, 240, 255, ${alpha})`);
        headGrad.addColorStop(0.5, `rgba(100, 175, 230, ${alpha * 0.9})`);
        headGrad.addColorStop(1, `rgba(30, 90, 160, ${alpha * 0.7})`);
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(180, 220, 255, 0.8)`;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Luminous boss eyes
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#b0d4ff";
        ctx.beginPath();
        ctx.arc(-s * 0.13, -s * 0.08, 6, 0, Math.PI * 2);
        ctx.arc(s * 0.13, -s * 0.08, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#1a5276";
        ctx.beginPath();
        ctx.arc(-s * 0.13, -s * 0.08, 3, 0, Math.PI * 2);
        ctx.arc(s * 0.13, -s * 0.08, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 18. BOSS_MIASMA — MiasmaEmpressBoss (Lvl 15 mini-boss B, healer boss)
class MiasmaEmpressBoss extends Enemy {
    constructor(x, y, levelScale = 1) {
        const baseHP = 55 * 20;
        super(
            x, y,
            0.8,
            baseHP * Math.pow(1.32, levelScale),
            260 + Math.floor(levelScale * 20),
            42,
            36,
            "#45b39d",
            "Miasma Empress"
        );
        this.spriteKey = "boss_miasma";
        this.isBoss = true;
        this.stunImmune = true;
        this.healer = true;
        this.poisonResist = true;
        this.bubbleTimer = 0;
    }

    applyPoison(damagePerTick, duration) {
        super.applyPoison(damagePerTick * 0.25, duration * 0.5);
    }

    drawCartoonVector(ctx) {
        this.bubbleTimer += 0.06;
        const bob = Math.sin(this.bubbleTimer) * 3;
        const s = this.size;

        // Regal toxic cloud mantle
        const cloudColors = ["rgba(70, 180, 100, 0.4)", "rgba(100, 200, 80, 0.35)", "rgba(50, 160, 80, 0.3)"];
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = cloudColors[i];
            ctx.beginPath();
            ctx.arc(-s * 0.3 + i * s * 0.2, bob - s * 0.15, s * (0.3 + i * 0.05), 0, Math.PI * 2);
            ctx.arc(s * 0.3 - i * s * 0.1, bob + s * 0.05, s * (0.28 + i * 0.04), 0, Math.PI * 2);
            ctx.fill();
        }

        // Main empress body
        const empressGrad = ctx.createRadialGradient(-5, bob - 5, 3, 0, bob, s * 0.42);
        empressGrad.addColorStop(0, "#a9dfbf");
        empressGrad.addColorStop(0.45, "#45b39d");
        empressGrad.addColorStop(1, "#1a6b50");
        ctx.fillStyle = empressGrad;
        ctx.beginPath();
        ctx.arc(0, bob, s * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Crown of spores
        ctx.fillStyle = "#f9e79f";
        ctx.strokeStyle = "#d4ac0d";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2 + this.bubbleTimer * 0.3;
            const cx = Math.cos(a) * (s * 0.42);
            const cy = Math.sin(a) * (s * 0.42) + bob;
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Imperious eyes with vertical slits
        ctx.fillStyle = "#d4efdf";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#2ecc71";
        ctx.beginPath();
        ctx.arc(-s * 0.13, bob - s * 0.08, 6, 0, Math.PI * 2);
        ctx.arc(s * 0.13, bob - s * 0.08, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#1a6b3c";
        ctx.beginPath();
        ctx.ellipse(-s * 0.13, bob - s * 0.08, 2, 4.5, 0, 0, Math.PI * 2);
        ctx.ellipse(s * 0.13, bob - s * 0.08, 2, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 19. BOSS_ENTROPY — EntropyBoss (Lvl 20 FINAL BOSS, multi-phase)
class EntropyBoss extends Enemy {
    constructor(x, y, levelScale = 1) {
        const baseHP = 55 * 35; // ~35x
        super(
            x, y,
            0.75,
            baseHP * Math.pow(1.35, levelScale),
            500 + Math.floor(levelScale * 40),
            80,
            46,
            "#1c2833",
            "Entropy Incarnate"
        );
        this.spriteKey = "boss_entropy";
        this.isBoss = true;
        this.isFinalBoss = true;
        this.stunImmune = true;
        this.entropyTimer = 0;
        this.phase = 1; // phase 2 triggers below 50% HP
        this.voidAngle = 0;
        this.crackLines = [];
        // Pre-generate crack lines for visual flair
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Math.random() * 0.5;
            this.crackLines.push({ angle: a, len: 0.3 + Math.random() * 0.25 });
        }
    }

    update(particleSystem, allEnemies) {
        // Phase 2: speed up below 50% HP
        if (this.phase === 1 && this.health <= this.maxHealth * 0.5) {
            this.phase = 2;
            this.baseSpeed *= 1.8;
            if (particleSystem) {
                particleSystem.createExplosion(this.x, this.y, "rgba(150, 0, 255, 0.95)", 18, 6);
                particleSystem.addFloatingText(this.x, this.y - 28, "PHASE 2!", "#cc00ff", 18);
            }
        }
        this.entropyTimer += 0.06;
        this.voidAngle += 0.04;
        return super.update(particleSystem, allEnemies);
    }

    drawCartoonVector(ctx) {
        const s = this.size;
        const t = this.entropyTimer;
        const isPhase2 = this.phase === 2;

        // Void aura — pulsing darkness
        const auraColor = isPhase2 ? "rgba(150, 0, 255, 0.3)" : "rgba(80, 0, 120, 0.25)";
        ctx.fillStyle = auraColor;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.75 + Math.sin(t * 1.5) * 3, 0, Math.PI * 2);
        ctx.fill();

        // Chaotic void rings
        for (let i = 0; i < 3; i++) {
            const ringR = s * (0.5 + i * 0.08);
            const ringAlpha = 0.4 - i * 0.1;
            ctx.strokeStyle = isPhase2
                ? `rgba(200, 0, 255, ${ringAlpha})`
                : `rgba(120, 50, 200, ${ringAlpha})`;
            ctx.lineWidth = 2.5 - i * 0.5;
            ctx.beginPath();
            ctx.arc(0, 0, ringR + Math.sin(t * 2 + i) * 2, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Core entropy body — inky black with fractures
        const coreGrad = ctx.createRadialGradient(-5, -5, 3, 0, 0, s * 0.44);
        coreGrad.addColorStop(0, isPhase2 ? "#6600cc" : "#4a235a");
        coreGrad.addColorStop(0.4, isPhase2 ? "#220044" : "#1c1228");
        coreGrad.addColorStop(1, "#000000");
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isPhase2 ? "#9b00ff" : "#6c3483";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Crack lines radiating from center
        ctx.strokeStyle = isPhase2 ? "rgba(200, 100, 255, 0.8)" : "rgba(140, 70, 200, 0.6)";
        ctx.lineWidth = 1.5;
        this.crackLines.forEach(crack => {
            const cx = Math.cos(crack.angle + this.voidAngle * 0.3) * s * 0.44;
            const cy = Math.sin(crack.angle + this.voidAngle * 0.3) * s * 0.44;
            const midX = Math.cos(crack.angle + this.voidAngle * 0.3) * s * crack.len * 0.5;
            const midY = Math.sin(crack.angle + this.voidAngle * 0.3) * s * crack.len * 0.5;
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(cx, cy);
            ctx.stroke();
        });

        // Orbiting void shards
        for (let i = 0; i < 5; i++) {
            const a = this.voidAngle + (i * Math.PI * 2 / 5);
            const orbitR = s * (0.55 + Math.sin(t + i) * 0.05);
            const sx = Math.cos(a) * orbitR;
            const sy = Math.sin(a) * orbitR * 0.6;
            ctx.fillStyle = isPhase2 ? "#cc00ff" : "#8e44ad";
            ctx.shadowBlur = 8;
            ctx.shadowColor = isPhase2 ? "#ff00ff" : "#9b59b6";
            ctx.beginPath();
            ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Final boss glowing void eyes
        const eyeColor = isPhase2 ? "#ff00ff" : "#cc00ff";
        ctx.fillStyle = eyeColor;
        ctx.shadowBlur = 20;
        ctx.shadowColor = eyeColor;
        ctx.beginPath();
        ctx.arc(-s * 0.14, -s * 0.07, 7, 0, Math.PI * 2);
        ctx.arc(s * 0.14, -s * 0.07, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(-s * 0.14, -s * 0.07, 3.5, 0, Math.PI * 2);
        ctx.arc(s * 0.14, -s * 0.07, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Phase 2: extra menacing vertical slit pupils
        if (isPhase2) {
            ctx.fillStyle = "#ff00ff";
            ctx.shadowBlur = 6;
            ctx.shadowColor = "#ff00ff";
            ctx.beginPath();
            ctx.ellipse(-s * 0.14, -s * 0.07, 1.5, 4, 0, 0, Math.PI * 2);
            ctx.ellipse(s * 0.14, -s * 0.07, 1.5, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// ============================================================
// GLOBAL EXPORTS (keep all existing names + new classes)
// ============================================================
window.Enemy = Enemy;
window.FlatEarthEnemy = FlatEarthEnemy;
window.PhlogistonEnemy = PhlogistonEnemy;
window.SpontaneousEnemy = SpontaneousEnemy;
window.AlchemyEnemy = AlchemyEnemy;
window.PerpetualEnemy = PerpetualEnemy;
window.GeocentricEnemy = GeocentricEnemy;
window.MiasmaEnemy = MiasmaEnemy;
window.CaloricEnemy = CaloricEnemy;
window.AetherEnemy = AetherEnemy;
window.VitalismEnemy = VitalismEnemy;
window.HumoursEnemy = HumoursEnemy;
window.CreationistEnemy = CreationistEnemy;
window.HomunculusEnemy = HomunculusEnemy;
window.GolemEnemy = GolemEnemy;
window.GeoColossusBoss = GeoColossusBoss;
window.PhlogistonTyrantBoss = PhlogistonTyrantBoss;
window.AetherLeviathanBoss = AetherLeviathanBoss;
window.MiasmaEmpressBoss = MiasmaEmpressBoss;
window.EntropyBoss = EntropyBoss;

// ============================================================
// TASK E — ENEMY REGISTRY
// ============================================================
window.ENEMY_REGISTRY = {
    flatearth:   FlatEarthEnemy,
    phlogiston:  PhlogistonEnemy,
    spontaneous: SpontaneousEnemy,
    alchemy:     AlchemyEnemy,
    perpetual:   PerpetualEnemy,
    geocentric:  GeocentricEnemy,
    miasma:      MiasmaEnemy,
    caloric:     CaloricEnemy,
    aether:      AetherEnemy,
    vitalism:    VitalismEnemy,
    humours:     HumoursEnemy,
    creationist: CreationistEnemy,
    homunculus:  HomunculusEnemy,
    golem:       GolemEnemy,
    boss_geo:    GeoColossusBoss,
    boss_phlog:  PhlogistonTyrantBoss,
    boss_aether: AetherLeviathanBoss,
    boss_miasma: MiasmaEmpressBoss,
    boss_entropy: EntropyBoss,
};

// ============================================================
// TASK E — BESTIARY
// ============================================================
window.BESTIARY = [
    {
        key: "flatearth",
        name: "Flat Earth",
        role: "Tank",
        threat: "Medium",
        desc: "A truculent armored disk that insists the world is flat and surrounded by an ice wall. Its geological delusion manifests as thick plating that shrugs off most conventional damage.",
        counter: "Chemistry towers melt its armor with acid — target it early before it tanks deep into your base."
    },
    {
        key: "phlogiston",
        name: "Phlogiston",
        role: "Swarm",
        threat: "Low",
        desc: "A fast-moving ember of the discredited fire-substance theory — released during any combustion and always eager to escape. Individually fragile but devastating in numbers.",
        counter: "Physics chain-lightning and Astronomy AoE clear swarms; Biology splash handles stray stragglers."
    },
    {
        key: "spontaneous",
        name: "Spontaneous Generation",
        role: "Splitter",
        threat: "Medium",
        desc: "This mold-fly springs fully formed from rotten matter, as 17th-century naturalists believed. Upon death it splits into decaying maggots that continue the advance.",
        counter: "Kill it before it reaches a chokepoint — then use Biology towers to mop up the maggot swarm."
    },
    {
        key: "alchemy",
        name: "Alchemy Transmutation",
        role: "Healer",
        threat: "High",
        desc: "A golden crucible bubbling with the promise of transmuting base metals into gold. Its alchemical aura passively mends nearby wounded misconceptions.",
        counter: "Priority target — silence its healing by focusing it down immediately; Astronomy control towers help isolate it."
    },
    {
        key: "perpetual",
        name: "Perpetual Motion",
        role: "Shielded",
        threat: "Medium",
        desc: "Twin orbiting rings spinning in eternal contradiction of thermodynamics. A magical shield absorbs chip damage; only a single heavy blow can shatter it.",
        counter: "Use high-damage single-hit Physics or Astronomy towers to crack the shield in one strike, then finish with rapid fire."
    },
    {
        key: "geocentric",
        name: "Geocentric Myth",
        role: "Flyer",
        threat: "Medium",
        desc: "A levitating orrery proudly placing the Earth at the center of the cosmos, orbited by a tiny sun. Only towers with anti-air capability can reach it.",
        counter: "Anti-air Physics (railgun/cannon) and Biology (spore gun) towers are the only way to hit this flying unit."
    },
    {
        key: "miasma",
        name: "Miasma Cloud",
        role: "Tanky",
        threat: "Medium",
        desc: "Embodies the pre-germ-theory belief that disease spreads through foul air. Its toxic constitution makes it highly resistant to poison-based attacks.",
        counter: "Avoid Biology poison towers — use Chemistry acid or Astronomy magic damage instead to cut through it efficiently."
    },
    {
        key: "caloric",
        name: "Caloric Fluid",
        role: "Swarm",
        threat: "Low",
        desc: "A sprinting bead of caloric — the imaginary heat-fluid once thought to flow between hot and cold bodies. Extremely fast but burns out quickly under sustained fire.",
        counter: "Slow towers (Astronomy freeze/cryo) shut it down immediately; Physics splash damage clears groups."
    },
    {
        key: "aether",
        name: "Luminiferous Aether",
        role: "Flyer",
        threat: "Medium",
        desc: "A shimmering fragment of the luminiferous aether — the medium once believed to fill all space and carry light waves. Translucent and elusive, it drifts above all ground defences.",
        counter: "Anti-air Biology and Physics towers are mandatory; Astronomy magic projectiles also reach flying targets."
    },
    {
        key: "vitalism",
        name: "Vital Force",
        role: "Regenerator",
        threat: "High",
        desc: "Channels the vital spark that 19th-century vitalists believed distinguished living from non-living matter. It regenerates health with every passing moment, making sustained DPS critical.",
        counter: "Stack high continuous DPS — Physics chain and Biology swarm towers out-damage its regen; avoid slow single-hit builds."
    },
    {
        key: "humours",
        name: "Four Humours",
        role: "Healer",
        threat: "High",
        desc: "A swirling vessel of the four bodily humours (blood, phlegm, yellow bile, black bile) with armoured plating. Its healing aura mends nearby allies almost as fast as you damage them.",
        counter: "Use Chemistry acid to melt its armor and reduce its threat; eliminate it before it heals tanky neighbours."
    },
    {
        key: "creationist",
        name: "Creationist Titan",
        role: "Tank",
        threat: "High",
        desc: "A lumbering stone behemoth that denies geological deep time, waddling forth as if the world were only thousands of years old. Heavily armored and almost impossibly slow.",
        counter: "Chemistry acid towers are essential to strip its armor; place multiple layers of defences to compensate for its enormous HP."
    },
    {
        key: "homunculus",
        name: "Homunculus Shell / Core",
        role: "Multistage",
        threat: "High",
        desc: "An alchemist's homunculus sealed in a protective shell. Destroy the shell and the tiny humanoid core bursts free — frail but devastatingly fast.",
        counter: "Break the shell quickly with Chemistry acid; immediately switch fire to the speedy core before it outpaces your towers."
    },
    {
        key: "golem",
        name: "Stone Golem / Molten Sludge",
        role: "Multistage",
        threat: "High",
        desc: "A shielded stone golem infused with alchemy. Shatter its stone form and it collapses into molten sludge — losing its shield but moving with dangerous speed.",
        counter: "High single-hit damage (Physics/Astronomy) cracks the shield first; then slow the sludge core with cryo/freeze before it escapes."
    },
    {
        key: "boss_geo",
        name: "Geo Colossus",
        role: "Boss",
        threat: "Boss",
        desc: "A colossal armored flat-earth leviathan serving as the first boss encounter. Slow, enormous, and armored, it radiates a crushing geological certainty as it grinds toward your base.",
        counter: "Chemistry acid towers are vital against its armor; commit your strongest defences at the final chokepoint."
    },
    {
        key: "boss_phlog",
        name: "Phlogiston Tyrant",
        role: "Boss",
        threat: "Boss",
        desc: "The embodiment of the phlogiston theory given terrifying form — a roaring infernal titan that leaves scorched earth in its wake and burns through conventional defences.",
        counter: "Avoid fire-based towers; Physics shockwave and Astronomy frost damage are most effective against this heat-immune juggernaut."
    },
    {
        key: "boss_aether",
        name: "Aether Leviathan",
        role: "Boss",
        threat: "Boss",
        desc: "A vast serpentine entity woven from luminiferous aether — the discredited medium of light. Translucent and airborne, it soars above all ground-level defences.",
        counter: "Anti-air towers only — upgrade Physics and Biology anti-air to maximum; Astronomy magic projectiles are your highest DPS option against flyers."
    },
    {
        key: "boss_miasma",
        name: "Miasma Empress",
        role: "Boss",
        threat: "Boss",
        desc: "The regal sovereign of disease-bearing air. She ceaselessly heals her wounded subjects and is nigh-immune to poison, making attrition strategies useless.",
        counter: "Silence her healing by dealing burst damage faster than she can restore; Chemistry acid towers bypass her poison resistance."
    },
    {
        key: "boss_entropy",
        name: "Entropy Incarnate",
        role: "Boss",
        threat: "Boss",
        desc: "The final boss — the anthropomorphic personification of thermodynamic entropy and the heat death of reason. Below 50% HP it enters Phase 2, dramatically increasing speed. The ultimate test of scientific literacy.",
        counter: "Maximum firepower across all tower types; prioritise slow/cryo to blunt its Phase 2 speed burst and spread damage evenly to avoid healing or shield exploitation."
    }
];
