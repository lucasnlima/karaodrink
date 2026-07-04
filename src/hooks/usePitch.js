import { useState, useEffect, useRef } from 'react';
import { audioEngine } from '../audio/AudioEngine';
import { MedianFilter } from '../utils/MedianFilter';

// onFrame(voicePitch, musicPitch) is called exactly once per 50ms tick with
// the median-smoothed pitches — use it for scoring instead of reacting to
// state changes (which skip ticks when the pitch value repeats).
export const usePitch = (onFrame) => {
    const [pitches, setPitches] = useState({ voice: null, music: null, rms: 0 });
    const [isListening, setIsListening] = useState(false);
    const intervalRef = useRef(null);

    const voiceFilter = useRef(new MedianFilter(5));
    const musicFilter = useRef(new MedianFilter(5));

    const onFrameRef = useRef(onFrame);
    useEffect(() => {
        onFrameRef.current = onFrame;
    }, [onFrame]);

    const startListening = async () => {
        if (isListening) return;

        try {
            // Need to ensure both are started or handled
            await audioEngine.startMicrophone();
            // System audio usually needs a separate trigger if not started by user gesture elsewhere
            // But we'll call it here; if fails, music pitch remains null.
            await audioEngine.startSystemAudio();

            setIsListening(true);
            voiceFilter.current.reset();
            musicFilter.current.reset();

            intervalRef.current = setInterval(() => {
                const voice = voiceFilter.current.push(audioEngine.getVoicePitch());
                const rms   = audioEngine.getVoiceRMS(); // cached from getVoicePitch()
                const music = musicFilter.current.push(audioEngine.getMusicPitch());
                setPitches({ voice, music, rms });
                if (onFrameRef.current) onFrameRef.current(voice, music, rms);
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
        voiceRMS:   pitches.rms,
        isListening,
        startListening,
        stopListening,
        startSystemAudioManually,
        forceStopAll
    };
};
