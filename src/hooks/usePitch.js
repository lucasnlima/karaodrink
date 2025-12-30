import { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';

export const usePitch = () => {
    const [pitches, setPitches] = useState({ voice: null, music: null });
    const [isListening, setIsListening] = useState(false);
    const intervalRef = useRef(null);

    const startListening = async () => {
        if (isListening) return;

        try {
            // Need to ensure both are started or handled
            await audioEngine.startMicrophone();
            // System audio usually needs a separate trigger if not started by user gesture elsewhere
            // But we'll call it here; if fails, music pitch remains null.
            await audioEngine.startSystemAudio();

            setIsListening(true);

            intervalRef.current = setInterval(() => {
                const voice = audioEngine.getVoicePitch();
                const music = audioEngine.getMusicPitch();
                setPitches({ voice, music });
            }, 50);
        } catch (e) {
            console.error("Failed to start listening", e);
        }
    };

    const stopListening = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsListening(false);
        setPitches({ voice: null, music: null });
    };

    const startSystemAudioManually = async () => {
        await audioEngine.startSystemAudio();
    };

    const forceStopAll = () => {
        stopListening();
        audioEngine.stopAllStreams();
    };

    useEffect(() => {
        return () => stopListening();
    }, []);

    return {
        voicePitch: pitches.voice,
        musicPitch: pitches.music,
        isListening,
        startListening,
        stopListening,
        startSystemAudioManually,
        forceStopAll
    };
};
