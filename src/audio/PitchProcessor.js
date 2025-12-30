export class PitchProcessor {
    constructor() {
        this.frameSize = 2048; // Buffer size
    }

    static toLogPitch(frequency) {
        if (!frequency || frequency <= 0) return null;
        return Math.log2(frequency);
    }

    static getPitchClass(logPitch) {
        if (logPitch === null) return null;
        // JS % operator matches sign of dividend, but we want positive [0,1)
        return ((logPitch % 1) + 1) % 1;
    }

    static getHarmonicDistance(pcMusic, pcVoice) {
        if (pcMusic === null || pcVoice === null) return 1.0; // Max distance

        const diff = Math.abs(pcMusic - pcVoice);
        return Math.min(diff, 1 - diff);
    }

    static isInTuneWithTolerance(musicFreq, voiceFreq, tolerance) {
        if (!musicFreq || !voiceFreq) return false;

        // Sanity check
        if (musicFreq > 20000 || voiceFreq > 20000) return false;
        if (musicFreq < 20 || voiceFreq < 20) return false;

        const logMus = this.toLogPitch(musicFreq);
        const logVoc = this.toLogPitch(voiceFreq);

        const pcMus = this.getPitchClass(logMus);
        const pcVoc = this.getPitchClass(logVoc);

        const dist = this.getHarmonicDistance(pcMus, pcVoc);

        return dist < tolerance;
    }
}
