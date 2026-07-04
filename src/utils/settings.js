const KEY = 'active_karaoke_settings';

export const defaultSettings = {
    voiceThreshold: 0.15,
    musicThreshold: 0.10,
    voiceAlgorithm: 'CustomYIN',
    musicAlgorithm: 'CustomYIN',
    tolerance: 0.08, // log2 scale (~1 semitone)
    showOverlay: true,
    debugMode: false,
    devMode: false,
    useMelodyFilter: false,
    partyMode: false
};

// Preset combinations — each overrides only the scoring/detection fields.
// tolerance:  log2 units, ~0.083 per semitone (1 semitone = 1/12 octave ≈ 0.0833)
// voiceThreshold / musicThreshold: YIN aperiodicity cutoff (lower = more sensitive)
export const PRESETS = {
    easy: {
        label: 'Fácil',
        description: 'Tolerante — boa para iniciantes e músicas difíceis',
        voiceAlgorithm: 'DW',
        musicAlgorithm: 'DW',
        voiceThreshold: 0.10,
        musicThreshold: 0.08,
        tolerance: 0.20,      // ~2.4 semitones
        useMelodyFilter: true,
    },
    medium: {
        label: 'Médio',
        description: 'Equilibrado — padrão para a maioria das músicas',
        voiceAlgorithm: 'CustomYIN',
        musicAlgorithm: 'CustomYIN',
        voiceThreshold: 0.15,
        musicThreshold: 0.10,
        tolerance: 0.10,      // ~1.2 semitones
        useMelodyFilter: true,
    },
    hard: {
        label: 'Difícil',
        description: 'Preciso — para os que cantam de verdade',
        voiceAlgorithm: 'CustomYIN',
        musicAlgorithm: 'CustomYIN',
        voiceThreshold: 0.20,
        musicThreshold: 0.12,
        tolerance: 0.05,      // ~0.6 semitone
        useMelodyFilter: false,
    },
};

export const getSettings = () => {
    const s = localStorage.getItem(KEY);
    return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings;
};

export const saveSettings = (s) => {
    localStorage.setItem(KEY, JSON.stringify(s));
};
