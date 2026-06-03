// js/audio.js
// Lightweight music/stinger manager. Files live in assets/audio/.
// Respects browser autoplay rules: nothing plays until the first user gesture
// (unlock), after which the "desired" track starts. Mute persists to localStorage.
// Everything is guarded so the game runs fine even if files are missing.
(function () {
    const MUSIC = {
        menu:     "assets/audio/menu.mp3",
        battle_1: "assets/audio/battle_1.mp3",
        battle_2: "assets/audio/battle_2.mp3",
        battle_3: "assets/audio/battle_3.mp3",
        boss:     "assets/audio/boss.mp3",
    };
    const STINGERS = {
        victory: "assets/audio/victory.mp3",
        defeat:  "assets/audio/defeat.mp3",
    };
    const MUTE_KEY = "std_muted_v1";
    const MUSIC_VOL = 0.4;   // background — sits under SFX/gameplay
    const STINGER_VOL = 0.6;
    const SFX_VOL = 0.55;    // master multiplier for all procedural SFX (one knob for balancing)

    // ----------------------------------------------------------------------
    // Procedural SFX recipes (Web Audio — no asset files).
    // A recipe = { voices:[...], minGap?, pitchVar? }. Each voice is a tiny
    // synth: { wave, f (start Hz), to (glide-to Hz), t (dur s), a (attack s),
    //          g (peak gain 0-1), noise (white-noise src instead of osc),
    //          filt ('lowpass'|'highpass'|'bandpass'), fc (cutoff), q, delay }.
    // playSfx() resolves dynamic keys ("tower_physics_fire", "hero_curie_attack",
    // "enemy_spider_death") by falling back to the family base ("tower_fire",
    // "hero_attack", "enemy_death") when no exact match exists — so unique
    // sounds are opt-in per type and everything else still makes a sound.
    // ----------------------------------------------------------------------
    const SFX = {
        // --- tower fire: a distinct timbre per discipline ---
        tower_physics_fire:   { minGap: 0.04, voices: [{ wave: "sawtooth", f: 920, to: 210, t: 0.12, g: 0.22, filt: "highpass", fc: 300 }] },
        tower_chemistry_fire: { minGap: 0.05, voices: [{ wave: "sine", f: 300, to: 720, t: 0.10, g: 0.20 }, { noise: true, t: 0.06, g: 0.08, filt: "bandpass", fc: 1200, q: 1.2 }] },
        tower_biology_fire:   { minGap: 0.05, voices: [{ wave: "triangle", f: 620, to: 470, t: 0.07, g: 0.15 }] },
        tower_astronomy_fire: { minGap: 0.05, voices: [{ wave: "sine", f: 160, to: 90, t: 0.30, g: 0.22, filt: "lowpass", fc: 600 }, { wave: "sine", f: 242, to: 120, t: 0.30, g: 0.11 }] },
        tower_volcano_fire:   { minGap: 0.06, voices: [{ noise: true, t: 0.34, g: 0.24, filt: "lowpass", fc: 420 }, { wave: "sine", f: 92, to: 50, t: 0.30, g: 0.18 }] },
        tower_fire:           { minGap: 0.04, voices: [{ wave: "square", f: 500, to: 300, t: 0.10, g: 0.17, filt: "highpass", fc: 200 }] },

        // --- projectile impacts: per projectile type ---
        projectile_flask_hit:   { minGap: 0.02, pitchVar: 0.08, voices: [{ noise: true, t: 0.12, g: 0.13, filt: "highpass", fc: 3000 }, { wave: "sine", f: 2200, to: 1400, t: 0.08, g: 0.09 }] },
        projectile_bullet_hit:  { minGap: 0.02, pitchVar: 0.1, voices: [{ wave: "square", f: 1200, to: 600, t: 0.04, g: 0.09 }, { noise: true, t: 0.03, g: 0.07, filt: "highpass", fc: 3000 }] },
        projectile_spore_hit:   { minGap: 0.03, pitchVar: 0.12, voices: [{ wave: "sine", f: 420, to: 200, t: 0.08, g: 0.11 }] },
        projectile_gravity_hit: { minGap: 0.03, voices: [{ wave: "sine", f: 140, to: 70, t: 0.15, g: 0.18, filt: "lowpass", fc: 500 }] },
        projectile_hit:         { minGap: 0.02, pitchVar: 0.1, voices: [{ noise: true, t: 0.05, g: 0.10, filt: "highpass", fc: 2000 }] },

        // --- hero basic attacks: a signature per scientist ---
        hero_einstein_attack: { minGap: 0.05, voices: [{ wave: "sawtooth", f: 700, to: 500, t: 0.08, g: 0.13, filt: "highpass", fc: 400 }, { noise: true, t: 0.05, g: 0.06, filt: "bandpass", fc: 2500, q: 2 }] },
        hero_newton_attack:   { minGap: 0.05, voices: [{ wave: "sine", f: 180, to: 80, t: 0.16, g: 0.22, filt: "lowpass", fc: 400 }] },
        hero_curie_attack:    { minGap: 0.05, voices: [{ wave: "sine", f: 1200, to: 1600, t: 0.12, g: 0.10 }, { wave: "sine", f: 1800, to: 2400, t: 0.10, g: 0.06, delay: 0.03 }] },
        hero_darwin_attack:   { minGap: 0.05, voices: [{ wave: "triangle", f: 300, to: 900, t: 0.10, g: 0.16, filt: "bandpass", fc: 800, q: 1.5 }] },
        hero_attack:          { minGap: 0.05, pitchVar: 0.05, voices: [{ wave: "triangle", f: 520, to: 380, t: 0.09, g: 0.15 }] },

        // --- hero events ---
        hero_skill:    { voices: [{ wave: "sawtooth", f: 200, to: 620, t: 0.30, g: 0.18, filt: "lowpass", fc: 1600 }, { wave: "sine", f: 400, to: 1200, t: 0.30, g: 0.11 }] },
        hero_levelup:  { voices: [{ wave: "triangle", f: 523, t: 0.12, g: 0.15 }, { wave: "triangle", f: 659, t: 0.12, g: 0.15, delay: 0.08 }, { wave: "triangle", f: 784, t: 0.12, g: 0.15, delay: 0.16 }, { wave: "triangle", f: 1047, t: 0.18, g: 0.17, delay: 0.24 }] },
        hero_death:    { voices: [{ wave: "sawtooth", f: 420, to: 80, t: 0.5, g: 0.18, filt: "lowpass", fc: 800 }] },
        hero_respawn:  { voices: [{ wave: "sine", f: 300, to: 900, t: 0.4, g: 0.16 }, { wave: "sine", f: 600, to: 1400, t: 0.4, g: 0.08, delay: 0.05 }] },

        // --- enemies (frequent → quieter + throttled + pitch-varied) ---
        enemy_hit:   { minGap: 0.05, pitchVar: 0.18, voices: [{ noise: true, t: 0.04, g: 0.07, filt: "bandpass", fc: 1800, q: 1.5 }] },
        enemy_death: { minGap: 0.03, pitchVar: 0.16, voices: [{ wave: "sine", f: 300, to: 120, t: 0.14, g: 0.15, filt: "lowpass", fc: 900 }, { noise: true, t: 0.08, g: 0.08, filt: "lowpass", fc: 1200 }] },

        // --- towers / waves / quiz / base ---
        tower_place:   { voices: [{ wave: "square", f: 160, to: 120, t: 0.08, g: 0.18, filt: "lowpass", fc: 600 }, { wave: "sine", f: 700, to: 900, t: 0.10, g: 0.12, delay: 0.06 }] },
        tower_upgrade: { voices: [{ wave: "triangle", f: 500, t: 0.10, g: 0.14 }, { wave: "triangle", f: 700, t: 0.10, g: 0.14, delay: 0.07 }, { wave: "triangle", f: 1000, t: 0.14, g: 0.16, delay: 0.14 }] },
        wave_start:    { voices: [{ wave: "sawtooth", f: 330, t: 0.18, g: 0.18, filt: "lowpass", fc: 1200 }, { wave: "sawtooth", f: 440, t: 0.22, g: 0.16, delay: 0.12, filt: "lowpass", fc: 1200 }] },
        quiz_correct:  { voices: [{ wave: "sine", f: 880, t: 0.12, g: 0.16 }, { wave: "sine", f: 1320, t: 0.18, g: 0.14, delay: 0.09 }] },
        quiz_wrong:    { voices: [{ wave: "square", f: 200, t: 0.25, g: 0.15, filt: "lowpass", fc: 800 }, { wave: "square", f: 188, t: 0.25, g: 0.11 }] },
        base_hit:      { minGap: 0.06, voices: [{ wave: "sawtooth", f: 140, to: 90, t: 0.30, g: 0.22, filt: "lowpass", fc: 500 }, { noise: true, t: 0.12, g: 0.12, filt: "lowpass", fc: 800 }] },
    };

    class AudioManager {
        constructor() {
            this.unlocked = false;
            this.muted = (typeof localStorage !== "undefined" && localStorage.getItem(MUTE_KEY) === "1");
            this.desiredKey = null; // music we WANT playing
            this.currentKey = null; // music actually playing
            this.music = null;
            this._stinger = null;   // one-shot victory/defeat sting, tracked so it
                                    // can't bleed over into the next track's music
            this._cache = {};
            // --- SFX (Web Audio) ---
            this.sfxVol = SFX_VOL;
            this.ctx = null;          // lazily created on unlock (needs a user gesture)
            this.sfxGain = null;      // master SFX bus
            this._noise = null;       // shared white-noise buffer
            this._sfxLast = {};       // per-key last-play time (throttle)
            this._voices = 0;         // live voice count (hard cap against clipping)
        }

        _initSfx() {
            if (this.ctx) return;
            const AC = (typeof window !== "undefined") && (window.AudioContext || window.webkitAudioContext);
            if (!AC) return;
            try {
                this.ctx = new AC();
                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.value = 1;
                this.sfxGain.connect(this.ctx.destination);
            } catch (e) { this.ctx = null; }
        }

        _noiseBuf() {
            if (this._noise || !this.ctx) return this._noise;
            const len = Math.floor(this.ctx.sampleRate * 0.5);
            const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
            const d = buf.getChannelData(0);
            for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
            this._noise = buf;
            return buf;
        }

        // Resolve "tower_physics_fire" -> exact, else family base "tower_fire".
        _resolveSfx(key) {
            if (SFX[key]) return SFX[key];
            const p = key.split("_");
            if (p.length >= 3) {
                const base = p[0] + "_" + p[p.length - 1];
                if (SFX[base]) return SFX[base];
            }
            return null;
        }

        _voice(v, t0, pitch) {
            const ctx = this.ctx;
            const dur = v.t || 0.15;
            const peak = Math.max(0.0001, (v.g != null ? v.g : 0.3) * this.sfxVol);
            const atk = v.a != null ? v.a : 0.004;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.exponentialRampToValueAtTime(peak, t0 + atk);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

            let src;
            if (v.noise) {
                const buf = this._noiseBuf();
                if (!buf) return;
                src = ctx.createBufferSource();
                src.buffer = buf;
            } else {
                src = ctx.createOscillator();
                src.type = v.wave || "sine";
                const f = Math.max(20, v.f * pitch);
                src.frequency.setValueAtTime(f, t0);
                if (v.to) src.frequency.exponentialRampToValueAtTime(Math.max(20, v.to * pitch), t0 + dur);
            }

            let tail = g;
            if (v.filt) {
                const filt = ctx.createBiquadFilter();
                filt.type = v.filt;
                filt.frequency.value = v.fc || 800;
                if (v.q) filt.Q.value = v.q;
                src.connect(filt);
                filt.connect(g);
            } else {
                src.connect(g);
            }
            tail.connect(this.sfxGain);

            this._voices++;
            const self = this;
            src.onended = function () { self._voices = Math.max(0, self._voices - 1); };
            src.start(t0);
            src.stop(t0 + dur + 0.03);
        }

        // Fire a one-shot procedural sound effect. Safe to call from gameplay
        // every frame — throttled per key and hard-capped on live voices.
        playSfx(key) {
            if (this.muted || !this.unlocked || !this.ctx || this._voices > 18) return;
            const rec = this._resolveSfx(key);
            if (!rec) return;
            const now = this.ctx.currentTime;
            const gap = rec.minGap != null ? rec.minGap : 0.03;
            if (now - (this._sfxLast[key] || 0) < gap) return;
            this._sfxLast[key] = now;
            const pitch = rec.pitchVar ? (1 + (Math.random() * 2 - 1) * rec.pitchVar) : 1;
            const t0 = now + 0.001;
            for (const v of rec.voices) this._voice(v, t0 + (v.delay || 0), pitch);
        }

        _get(src, loop) {
            if (!this._cache[src]) {
                const a = new Audio(src);
                a.loop = loop;
                a.preload = "auto";
                this._cache[src] = a;
            }
            return this._cache[src];
        }

        // Called on the first user gesture — browsers block audio until then.
        unlock() {
            if (this.unlocked) return;
            this.unlocked = true;
            this._initSfx();
            if (this.ctx && this.ctx.state === "suspended") { try { this.ctx.resume(); } catch (e) {} }
            if (this.desiredKey) this._startMusic(this.desiredKey);
        }

        // Switch the looping background track. Idempotent: safe to call every
        // frame — a no-op if that track is already playing.
        playMusic(key) {
            if (!MUSIC[key]) return;
            this.desiredKey = key;
            if (!this.unlocked || this.muted) return;
            if (this.currentKey === key && this.music && !this.music.paused) return;
            this._startMusic(key);
        }

        // Stop a lingering one-shot sting (victory/defeat) so it never plays
        // on top of the next looping track.
        _stopStinger() {
            if (this._stinger) {
                try { this._stinger.pause(); this._stinger.currentTime = 0; } catch (e) {}
                this._stinger = null;
            }
        }

        _startMusic(key) {
            this._stopStinger();
            if (this.music) { try { this.music.pause(); } catch (e) {} }
            const a = this._get(MUSIC[key], true);
            a.volume = MUSIC_VOL;
            try { a.currentTime = 0; } catch (e) {}
            this.music = a;
            this.currentKey = key;
            if (!this.muted) { const p = a.play(); if (p) p.catch(() => {}); }
        }

        // One-shot victory/defeat sting — ducks the background music.
        playStinger(key) {
            if (!STINGERS[key]) return;
            this._stopStinger();
            if (this.music) { try { this.music.pause(); } catch (e) {} }
            this.currentKey = null;
            this.desiredKey = null;
            if (!this.unlocked || this.muted) return;
            const a = this._get(STINGERS[key], false);
            a.volume = STINGER_VOL;
            try { a.currentTime = 0; } catch (e) {}
            this._stinger = a; // tracked so the next _startMusic can stop it
            const p = a.play(); if (p) p.catch(() => {});
        }

        stopMusic() {
            this._stopStinger();
            if (this.music) { try { this.music.pause(); } catch (e) {} }
            this.currentKey = null;
            this.desiredKey = null;
        }

        setMuted(m) {
            this.muted = m;
            try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); } catch (e) {}
            if (m) {
                this._stopStinger();
                if (this.music) { try { this.music.pause(); } catch (e) {} }
            } else if (this.desiredKey) {
                this._startMusic(this.desiredKey);
            }
            return this.muted;
        }

        toggleMute() { return this.setMuted(!this.muted); }
    }

    window.audioManager = new AudioManager();

    // Unlock on the first user gesture (one time).
    if (typeof document !== "undefined") {
        const unlockOnce = () => {
            window.audioManager.unlock();
            document.removeEventListener("pointerdown", unlockOnce);
            document.removeEventListener("keydown", unlockOnce);
        };
        document.addEventListener("pointerdown", unlockOnce);
        document.addEventListener("keydown", unlockOnce);
    }
})();
