const KEY = 'active_karaoke_settings';

export const defaultSettings = {
    voiceThreshold: 0.15,
    musicThreshold: 0.10,
    voiceAlgorithm: 'CustomYIN',
    musicAlgorithm: 'CustomYIN',
    tolerance: 0.08, // log2 scale (~1 semitone)
    showOverlay: true,
    debugMode: false,
    useMelodyFilter: false
};

export const getSettings = () => {
    const s = localStorage.getItem(KEY);
    return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings;
};

export const saveSettings = (s) => {
    localStorage.setItem(KEY, JSON.stringify(s));
};
