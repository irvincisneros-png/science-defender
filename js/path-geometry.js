// Canonical curved route geometry and refresh-rate-independent game clock.
// Both classes are dependency-free so the regression harness can exercise them.

class PathGeometry {
    constructor(controlPoints, options = {}) {
        this.controlPoints = (controlPoints || []).map(p => ({ ...p }));
        this.cornerRadius = options.cornerRadius || 34;
        this.sampleSpacing = options.sampleSpacing || 8;
        this.commands = [];
        this.samples = [];
        this.totalLength = 0;
        this.path2D = null;
        this._build();
    }

    _build() {
        const pts = this.controlPoints;
        if (!pts.length) return;
        this.commands.push({ type: "move", p: pts[0] });

        for (let i = 1; i < pts.length - 1; i++) {
            const prev = pts[i - 1], corner = pts[i], next = pts[i + 1];
            const inDx = corner.x - prev.x, inDy = corner.y - prev.y;
            const outDx = next.x - corner.x, outDy = next.y - corner.y;
            const inLen = Math.hypot(inDx, inDy), outLen = Math.hypot(outDx, outDy);
            if (inLen < 0.001 || outLen < 0.001) continue;

            const inUx = inDx / inLen, inUy = inDy / inLen;
            const outUx = outDx / outLen, outUy = outDy / outLen;
            const turn = Math.abs(inUx * outUy - inUy * outUx);
            const dot = inUx * outUx + inUy * outUy;
            if (turn < 0.01 && dot > 0) {
                this.commands.push({ type: "line", p: corner });
                continue;
            }

            const requested = Number.isFinite(corner.radius) ? corner.radius : this.cornerRadius;
            const d = Math.max(2, Math.min(requested, inLen * 0.45, outLen * 0.45));
            const entry = { x: corner.x - inUx * d, y: corner.y - inUy * d };
            const exit = { x: corner.x + outUx * d, y: corner.y + outUy * d };
            this.commands.push({ type: "line", p: entry });
            this.commands.push({ type: "quadratic", c: corner, p: exit });
        }
        if (pts.length > 1) this.commands.push({ type: "line", p: pts[pts.length - 1] });

        const dense = this._densePolyline();
        this._resample(dense);
        this._buildPath2D();
    }

    _densePolyline() {
        const out = [];
        let current = null;
        for (const command of this.commands) {
            if (command.type === "move") {
                current = command.p;
                out.push({ x: current.x, y: current.y });
            } else if (command.type === "line") {
                const len = Math.hypot(command.p.x - current.x, command.p.y - current.y);
                const steps = Math.max(1, Math.ceil(len / 4));
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    out.push({ x: current.x + (command.p.x - current.x) * t, y: current.y + (command.p.y - current.y) * t });
                }
                current = command.p;
            } else {
                const start = current;
                const approx = Math.hypot(command.c.x - start.x, command.c.y - start.y) + Math.hypot(command.p.x - command.c.x, command.p.y - command.c.y);
                const steps = Math.max(4, Math.ceil(approx / 3));
                for (let i = 1; i <= steps; i++) {
                    const t = i / steps, u = 1 - t;
                    out.push({
                        x: u * u * start.x + 2 * u * t * command.c.x + t * t * command.p.x,
                        y: u * u * start.y + 2 * u * t * command.c.y + t * t * command.p.y,
                    });
                }
                current = command.p;
            }
        }
        return out;
    }

    _resample(dense) {
        if (!dense.length) return;
        const cumulative = [0];
        for (let i = 1; i < dense.length; i++) {
            cumulative[i] = cumulative[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y);
        }
        this.totalLength = cumulative[cumulative.length - 1] || 0;
        const count = Math.max(1, Math.ceil(this.totalLength / this.sampleSpacing));
        let segment = 1;
        for (let i = 0; i <= count; i++) {
            const distance = i === count ? this.totalLength : Math.min(this.totalLength, i * this.sampleSpacing);
            while (segment < cumulative.length - 1 && cumulative[segment] < distance) segment++;
            const a = dense[Math.max(0, segment - 1)], b = dense[segment] || a;
            const startD = cumulative[Math.max(0, segment - 1)] || 0;
            const span = (cumulative[segment] || startD) - startD;
            const t = span > 0 ? (distance - startD) / span : 0;
            this.samples.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, distance });
        }
        for (let i = 0; i < this.samples.length; i++) {
            const a = this.samples[Math.max(0, i - 1)], b = this.samples[Math.min(this.samples.length - 1, i + 1)];
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            this.samples[i].angle = angle;
            this.samples[i].tangentX = Math.cos(angle);
            this.samples[i].tangentY = Math.sin(angle);
            this.samples[i].progress = this.totalLength ? this.samples[i].distance / this.totalLength : 0;
        }
    }

    _buildPath2D() {
        if (typeof Path2D === "undefined") return;
        const p = new Path2D();
        this._traceTarget(p);
        this.path2D = p;
    }

    _traceTarget(target) {
        for (const cmd of this.commands) {
            if (cmd.type === "move") target.moveTo(cmd.p.x, cmd.p.y);
            else if (cmd.type === "line") target.lineTo(cmd.p.x, cmd.p.y);
            else target.quadraticCurveTo(cmd.c.x, cmd.c.y, cmd.p.x, cmd.p.y);
        }
    }

    trace(ctx) {
        ctx.beginPath();
        this._traceTarget(ctx);
    }

    sampleAtDistance(distance) {
        if (!this.samples.length) return null;
        const d = Math.max(0, Math.min(this.totalLength, Number.isFinite(distance) ? distance : 0));
        let lo = 0, hi = this.samples.length - 1;
        while (lo < hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (this.samples[mid].distance < d) lo = mid + 1;
            else hi = mid;
        }
        const b = this.samples[lo], a = this.samples[Math.max(0, lo - 1)];
        const span = b.distance - a.distance;
        const t = span > 0 ? (d - a.distance) / span : 0;
        let da = b.angle - a.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        const angle = a.angle + da * t;
        return {
            x: a.x + (b.x - a.x) * t,
            y: a.y + (b.y - a.y) * t,
            angle,
            tangentX: Math.cos(angle), tangentY: Math.sin(angle),
            distance: d,
            progress: this.totalLength ? d / this.totalLength : 0,
        };
    }

    nearestPoint(x, y) {
        if (!this.samples.length) return null;
        let best = null;
        for (let i = 0; i < this.samples.length - 1; i++) {
            const a = this.samples[i], b = this.samples[i + 1];
            const dx = b.x - a.x, dy = b.y - a.y;
            const lenSq = dx * dx + dy * dy;
            const t = lenSq ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lenSq)) : 0;
            const px = a.x + dx * t, py = a.y + dy * t;
            const separation = Math.hypot(x - px, y - py);
            if (!best || separation < best.separation) {
                const distance = a.distance + (b.distance - a.distance) * t;
                best = { x: px, y: py, separation, distance, progress: this.totalLength ? distance / this.totalLength : 0 };
            }
        }
        return best || { ...this.samples[0], separation: Math.hypot(x - this.samples[0].x, y - this.samples[0].y) };
    }
}

class GameClock {
    constructor(hz = 60, maxFrameMs = 250) {
        this.stepMs = 1000 / hz;
        this.maxFrameMs = maxFrameMs;
        this.accumulator = 0;
        this.lastTimestamp = null;
    }
    reset(timestamp = null) {
        this.accumulator = 0;
        this.lastTimestamp = timestamp;
    }
    advance(timestamp, update, speed = 1, active = true) {
        if (!Number.isFinite(timestamp)) return 0;
        if (this.lastTimestamp === null) { this.lastTimestamp = timestamp; return 0; }
        const elapsed = Math.max(0, Math.min(this.maxFrameMs, timestamp - this.lastTimestamp));
        this.lastTimestamp = timestamp;
        if (!active) { this.accumulator = 0; return 0; }
        this.accumulator += elapsed * Math.max(0, speed || 0);
        let steps = 0;
        while (this.accumulator + 1e-7 >= this.stepMs) {
            update(this.stepMs / 1000);
            this.accumulator -= this.stepMs;
            steps++;
        }
        return steps;
    }
    get alpha() { return this.stepMs ? this.accumulator / this.stepMs : 0; }
}

if (typeof window !== "undefined") {
    window.PathGeometry = PathGeometry;
    window.GameClock = GameClock;
}
