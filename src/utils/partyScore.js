// Party mode scoring — evaluates vocal performance without comparing to the
// original melody. Works for any song; no pitch reference needed.

export class PartyScoreAccumulator {
    constructor() { this.reset(); }

    reset() {
        this.totalFrames    = 0;
        this.voiceFrames    = 0;
        this.rmsAll         = [];   // RMS of every voiced frame
        this.pitchWindow    = [];   // last 5 log-pitch values (stability window)
        this.stableFrames   = 0;
        this.sustainStreak  = 0;
        this.totalSustain   = 0;    // frames inside a sustained note (≥6 frames = 300ms)
        this.silenceStreak  = 0;
        this.maxSilence     = 0;
        // Energy: we sample mean RMS every 20 frames to measure variation over time
        this._rmsBucket     = [];
        this.energySamples  = [];
    }

    // Call once per 50ms tick. voicePitch is median-filtered, voiceRMS is raw.
    addFrame(voicePitch, voiceRMS) {
        this.totalFrames++;

        if (!voicePitch || voicePitch <= 0) {
            this.silenceStreak++;
            if (this.silenceStreak > this.maxSilence) this.maxSilence = this.silenceStreak;
            this.sustainStreak = 0;
            this.pitchWindow   = [];
            return { frameScore: 0, active: false };
        }

        this.silenceStreak = 0;
        this.voiceFrames++;

        // --- RMS tracking ---
        this.rmsAll.push(voiceRMS);
        this._rmsBucket.push(voiceRMS);
        if (this._rmsBucket.length >= 20) {
            const mean = this._rmsBucket.reduce((a, b) => a + b, 0) / this._rmsBucket.length;
            this.energySamples.push(mean);
            this._rmsBucket = [];
        }

        // --- Pitch stability ---
        this.pitchWindow.push(Math.log2(voicePitch));
        if (this.pitchWindow.length > 5) this.pitchWindow.shift();

        let stable = false;
        if (this.pitchWindow.length >= 3) {
            const mean = this.pitchWindow.reduce((a, b) => a + b, 0) / this.pitchWindow.length;
            const variance = this.pitchWindow.reduce((s, v) => s + (v - mean) ** 2, 0) / this.pitchWindow.length;
            stable = Math.sqrt(variance) < 0.03; // ~0.4 semitone std dev threshold
        }

        if (stable) {
            this.stableFrames++;
            this.sustainStreak++;
            if (this.sustainStreak >= 6) this.totalSustain++; // ≥300ms
        } else {
            this.sustainStreak = 0;
        }

        // --- Instantaneous frame score (0–1) used by PartyOverlay ---
        let score = 0.60; // base: singing at all
        if (stable) score += 0.22;
        if (voiceRMS > 0.03 && voiceRMS < 0.35) score += 0.18; // good volume range
        return { frameScore: score, active: true };
    }

    compute() {
        const { totalFrames, voiceFrames, rmsAll, stableFrames,
                totalSustain, maxSilence, energySamples } = this;

        if (totalFrames === 0) return { total: 0, breakdown: {}, categories: {} };

        // M1 — Participação (40%)
        const pRatio = voiceFrames / totalFrames;
        let m1;
        if      (pRatio >= 0.90) m1 = 100;
        else if (pRatio >= 0.80) m1 = 90;
        else if (pRatio >= 0.70) m1 = 80;
        else if (pRatio >= 0.60) m1 = 65;
        else if (pRatio >= 0.50) m1 = 50;
        else m1 = Math.round(pRatio * 100);

        // M2 — Estabilidade vocal (20%)
        const m2 = voiceFrames > 0 ? Math.min(100, Math.round((stableFrames / voiceFrames) * 130)) : 0;

        // M3 — Controle de volume (10%)
        let m3 = 0;
        if (rmsAll.length > 0) {
            const mean = rmsAll.reduce((a, b) => a + b, 0) / rmsAll.length;
            const std  = Math.sqrt(rmsAll.reduce((s, v) => s + (v - mean) ** 2, 0) / rmsAll.length);
            const meanScore = mean >= 0.04 && mean <= 0.3
                ? 100
                : mean < 0.04 ? (mean / 0.04) * 100
                : Math.max(0, 100 - (mean - 0.3) * 200);
            const stdScore = Math.max(0, 100 - std * 400);
            m3 = Math.round(meanScore * 0.6 + stdScore * 0.4);
        }

        // M4 — Continuidade (10%) — penaliza o maior silêncio seguido
        const silenceRatio = maxSilence / totalFrames;
        const m4 = Math.round(Math.max(0, 100 - silenceRatio * 350));

        // M5 — Energia da performance (10%) — variação moderada de RMS = melhor
        let m5 = 55;
        if (energySamples.length > 2) {
            const eMean = energySamples.reduce((a, b) => a + b, 0) / energySamples.length;
            const eStd  = Math.sqrt(energySamples.reduce((s, v) => s + (v - eMean) ** 2, 0) / energySamples.length);
            if      (eStd < 0.005) m5 = 35;  // completamente monótono
            else if (eStd < 0.02)  m5 = 70;
            else if (eStd <= 0.09) m5 = 100;
            else m5 = Math.max(35, 100 - (eStd - 0.09) * 400);
            m5 = Math.round(m5);
        }

        // M6 — Sustentação de notas (10%)
        const m6 = voiceFrames > 0
            ? Math.min(100, Math.round((totalSustain / voiceFrames) * 180))
            : 0;

        const total = Math.min(100, Math.round(
            m1 * 0.40 + m2 * 0.20 + m3 * 0.10 + m4 * 0.10 + m5 * 0.10 + m6 * 0.10
        ));

        return {
            total,
            breakdown: { participation: m1, stability: m2, volume: m3, continuity: m4, energy: m5, sustain: m6 },
            categories: {
                presence:  Math.min(100, Math.round(m1 * 0.50 + m5 * 0.30 + m3 * 0.20)),
                control:   Math.min(100, Math.round(m2 * 0.60 + m6 * 0.40)),
                endurance: Math.min(100, Math.round(m4 * 0.60 + m1 * 0.40)),
            },
        };
    }
}
