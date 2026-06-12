// js/particles.js
// 2D Cartoon Fantasy Particles and Effects (Kingdom Rush style) with circular blooms, spark bursts, and bubble vapor clouds

// Pre-rendered glow sprites, one per particle colour. Creating a radial
// gradient per particle per frame (40+ during big explosions) thrashes the
// rasteriser; instead each colour is rendered once to a small offscreen
// canvas and blitted scaled. Cache is capped in case of many dynamic colours.
const _GLOW_SIZE = 64;
const _glowCache = new Map();
function _glowSprite(color) {
    let c = _glowCache.get(color);
    if (c) return c;
    if (typeof document === "undefined" || !document.createElement) return null;
    if (_glowCache.size > 160) _glowCache.clear();
    c = document.createElement("canvas");
    c.width = c.height = _GLOW_SIZE;
    const g = c.getContext("2d");
    if (!g || !g.createRadialGradient) return null; // headless test stub
    const half = _GLOW_SIZE / 2;
    const grad = g.createRadialGradient(half, half, 1, half, half, half);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(half, half, half, 0, Math.PI * 2);
    g.fill();
    _glowCache.set(color, c);
    return c;
}

class Particle {
    constructor(x, y, vx, vy, color, size, life, fadeSpeed, gravity = 0, drag = 0.96) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.fadeSpeed = fadeSpeed;
        this.gravity = gravity;
        this.drag = drag;
    }

    update() {
        this.vx *= this.drag;
        this.vy *= this.drag;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.fadeSpeed;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);

        // Shiny 2D cartoon radial glow — blitted from the per-colour sprite
        // cache instead of building a gradient per particle per frame.
        const sprite = _glowSprite(this.color);
        if (sprite) {
            ctx.drawImage(sprite, this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
        } else {
            const bubbleGrad = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.size);
            bubbleGrad.addColorStop(0, "#ffffff");
            bubbleGrad.addColorStop(0.3, this.color);
            bubbleGrad.addColorStop(1, "transparent");
            ctx.fillStyle = bubbleGrad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color, size = 13, duration = 1.2) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 1.0;
        this.fadeSpeed = 1.0 / (duration * 60);
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = -1.5 - Math.random() * 0.8;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.fadeSpeed;
        return this.life > 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);

        // Pop-in: numbers land oversized then settle, so hits read instantly.
        const age = 1 - this.life;                    // 0 at spawn → 1 at fade
        const pop = 1 + Math.max(0, 1 - age * 8) * 0.6;

        // Beautiful bubbly Fredoka font for cartoon metrics
        ctx.font = `bold ${Math.round(this.size * pop)}px 'Fredoka', sans-serif`;
        ctx.textAlign = "center";
        
        // Thick dark storybook border
        ctx.strokeStyle = "#1b1424";
        ctx.lineWidth = 3.5;
        ctx.strokeText(this.text, this.x, this.y);
        
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.lines = [];
        this.shocks = [];
    }

    update() {
        this.particles = this.particles.filter(p => p.update());
        this.floatingTexts = this.floatingTexts.filter(t => t.update());
        this.lines = this.lines.filter(l => {
            l.life -= l.fadeSpeed;
            return l.life > 0;
        });
        this.shocks = this.shocks.filter(s => {
            s.radius += s.expansionSpeed;
            s.life -= s.fadeSpeed;
            return s.life > 0;
        });
    }

    draw(ctx) {
        // Draw lightning/beams with cartoon thickness & glow
        this.lines.forEach(l => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, l.life);
            ctx.strokeStyle = l.color;
            ctx.lineWidth = l.width;
            ctx.lineCap = "round";
            
            // Neon glow bloom
            ctx.shadowBlur = 8;
            ctx.shadowColor = l.color;
            
            ctx.beginPath();
            if (l.type === "lightning") {
                ctx.moveTo(l.x1, l.y1);
                const steps = 4;
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    const x = l.x1 + (l.x2 - l.x1) * t;
                    const y = l.y1 + (l.y2 - l.y1) * t;
                    if (i < steps) {
                        const offsetAmount = 14;
                        const ox = (Math.random() - 0.5) * offsetAmount;
                        const oy = (Math.random() - 0.5) * offsetAmount;
                        ctx.lineTo(x + ox, y + oy);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            } else {
                ctx.moveTo(l.x1, l.y1);
                ctx.lineTo(l.x2, l.y2);
            }
            ctx.stroke();
            ctx.restore();
        });

        // Draw expanding radial shockwaves
        this.shocks.forEach(s => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, s.life);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.shadowBlur = 10;
            ctx.shadowColor = s.color;
            
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        });

        // Draw standard cartoon glow particles
        this.particles.forEach(p => p.draw(ctx));

        // Draw floating texts
        this.floatingTexts.forEach(t => t.draw(ctx));
    }

    addFloatingText(x, y, text, color, size = 16, duration = 1.2) {
        this.floatingTexts.push(new FloatingText(x, y, text, color, size + 5, duration));
    }

    createExplosion(x, y, color, count = 12, baseSize = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.8 + Math.random() * 3.8;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const size = (0.5 + Math.random()) * baseSize;
            const life = 1.0;
            const fade = 0.02 + Math.random() * 0.025;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, fade, 0.02));
        }
    }

    createShockwave(x, y, maxRadius, color, speed = 4, width = 3.5) {
        const durationFrames = maxRadius / speed;
        this.shocks.push({
            x,
            y,
            radius: 4,
            expansionSpeed: speed,
            color,
            width,
            life: 1.0,
            fadeSpeed: 1.0 / durationFrames
        });
    }

    createLightning(x1, y1, x2, y2, color = "#00FFFF") {
        this.lines.push({
            type: "lightning",
            x1, y1, x2, y2,
            color,
            width: 3.5,
            life: 0.15,
            fadeSpeed: 0.1
        });
    }

    createLaserBeam(x1, y1, x2, y2, color = "#FF00FF", width = 5) {
        this.lines.push({
            type: "laser",
            x1, y1, x2, y2,
            color,
            width,
            life: 0.12,
            fadeSpeed: 0.12
        });
    }

    createToxicCloud(x, y, radius, count = 6) {
        for (let i = 0; i < count; i++) {
            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetDist = Math.random() * radius * 0.55;
            const px = x + Math.cos(offsetAngle) * offsetDist;
            const py = y + Math.sin(offsetAngle) * offsetDist;
            
            const vx = (Math.random() - 0.5) * 0.4;
            const vy = (Math.random() - 0.5) * 0.4 - 0.15;
            const size = 12 + Math.random() * 12;
            const life = 0.8 + Math.random() * 0.2;
            const fade = 0.012 + Math.random() * 0.01;
            // Hue quantized to 8° steps so the glow-sprite cache stays small.
            const color = `hsla(${100 + Math.round(Math.random() * 5) * 8}, 80%, 45%, 0.35)`;
            
            this.particles.push(new Particle(px, py, vx, vy, color, size, life, fade, 0, 0.99));
        }
    }

    createGravityVortex(x, y, radius, count = 2) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = radius * (0.35 + Math.random() * 0.5);
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            
            const speed = 1.4;
            const vx = -Math.cos(angle) * speed + Math.sin(angle) * 0.5;
            const vy = -Math.sin(angle) * speed - Math.cos(angle) * 0.5;
            
            const size = 5 + Math.random() * 5;
            const life = 0.5;
            const fade = 0.035;
            const color = `hsla(${270 + Math.round(Math.random() * 5) * 8}, 95%, 55%, 0.85)`;
            this.particles.push(new Particle(px, py, vx, vy, color, size, life, fade, 0, 0.97));
        }
    }
}

// Make globally available
window.ParticleSystem = ParticleSystem;
