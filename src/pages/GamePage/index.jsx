import React, { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { useParams, useNavigate } from "react-router-dom";
import { usePitch } from "../../hooks/usePitch";
import PitchOverlay from "../../components/PitchOverlay";
import PartyOverlay from "../../components/PartyOverlay";
import DevTunerPanel from "../../components/DevTunerPanel";
import { PitchProcessor } from "../../audio/PitchProcessor";
import { PartyScoreAccumulator } from "../../utils/partyScore";
import { getSettings } from "../../utils/settings";
import { Button, Box, IconButton, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import SettingsDialog from '../../components/SettingsDialog';
import './style.css';

const GamePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isPlaying, setIsPlaying] = useState(false);
    const [settings, setSettings] = useState(getSettings());
    const [openSettings, setOpenSettings] = useState(false);

    // --- Normal mode score state ---
    const scoreRef = useRef({ scoredFrames: 0, hit: 0, musicFrames: 0, silenceStreak: 0, maxStreak: 0 });
    const logCounter = useRef(0);

    // --- Party mode score state ---
    const partyAccRef = useRef(new PartyScoreAccumulator());
    const [partyDisplay, setPartyDisplay] = useState({ frameScore: 0, active: false, categories: null });

    const isPlayingRef = useRef(false);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

    // Called by usePitch exactly once per 50ms tick.
    const handleFrame = (voice, music, rms) => {
        if (!isPlayingRef.current) return;

        if (getSettings().partyMode) {
            // Party mode: score based solely on voice quality, no pitch comparison.
            const result = partyAccRef.current.addFrame(voice, rms);
            const interim = partyAccRef.current.compute();
            setPartyDisplay({
                frameScore: result.frameScore,
                active: result.active,
                categories: interim.categories,
            });
            return;
        }

        // Normal mode: pitch comparison scoring.
        if (!music) return;
        scoreRef.current.musicFrames++;

        if (!voice) {
            scoreRef.current.silenceStreak++;
            if (scoreRef.current.silenceStreak > scoreRef.current.maxStreak)
                scoreRef.current.maxStreak = scoreRef.current.silenceStreak;
            return;
        }

        scoreRef.current.silenceStreak = 0;
        scoreRef.current.scoredFrames++;

        const currentTol = getSettings().tolerance || 0.08;
        const dist = PitchProcessor.getHarmonicDistance(
            PitchProcessor.getPitchClass(PitchProcessor.toLogPitch(music)),
            PitchProcessor.getPitchClass(PitchProcessor.toLogPitch(voice))
        );
        const accuracy = Math.max(0, 1 - dist / (currentTol * 2));
        const gain = 0.4 + 0.8 * accuracy;
        scoreRef.current.hit += gain;

        if (getSettings().debugMode && logCounter.current++ % 20 === 0)
            console.log(`[SCORE] Dist: ${dist.toFixed(3)} | Acc: ${(accuracy * 100).toFixed(0)}% | Gain: ${gain.toFixed(2)}`);
    };

    const { voicePitch, musicPitch, startListening, stopListening, forceStopAll, startSystemAudioManually } = usePitch(handleFrame);

    // Reset accumulators when a new game starts
    const handleOnPlayInternal = () => {
        scoreRef.current = { scoredFrames: 0, hit: 0, musicFrames: 0, silenceStreak: 0, maxStreak: 0 };
        partyAccRef.current.reset();
    };

    useEffect(() => {
        setSettings(getSettings());
        return () => {
            // Stop listening (processing) but DON'T kill streams to keep 'Share Once' strategy
            console.log("GamePage: Stopping pitch analysis. Stream is kept alive.");
            stopListening();
        };
    }, []);

    const handleOnPlay = () => {
        handleOnPlayInternal();
        setIsPlaying(true);
        startListening();
        console.log("SISTEMA DE PONTUAÇÃO: Ativado. Cada quadro de áudio é avaliado a cada 50ms.");
    };

    const handleOnEnd = () => {
        finishGame();
    };

    const finishGame = () => {
        stopListening();
        setIsPlaying(false);

        const isParty = getSettings().partyMode;
        let calculatedScore;

        if (isParty) {
            const result = partyAccRef.current.compute();
            calculatedScore = result.total;
            console.log('PONTUAÇÃO FESTA:', JSON.stringify(result, null, 2));
        } else {
            const { scoredFrames, hit, musicFrames, maxStreak } = scoreRef.current;
            const ratio = scoredFrames > 0 ? hit / scoredFrames : 0;
            calculatedScore = Math.min(100, Math.round(ratio * 100));

            const silenceRatio = musicFrames > 0 ? maxStreak / musicFrames : 0;
            const penaltyApplied = silenceRatio >= 0.10;
            if (penaltyApplied) calculatedScore = Math.round(calculatedScore * 0.9);

            console.log(`PONTUAÇÃO FINAL:
  Quadros cantados: ${scoredFrames} / músicais: ${musicFrames}
  Razão: ${(ratio * 100).toFixed(1)}%
  Maior silêncio: ${(silenceRatio * 100).toFixed(1)}% — penalidade: ${penaltyApplied ? '-10%' : 'não'}
  Score Final: ${calculatedScore}`);
        }

        navigate("/score", { state: { score: calculatedScore } });
    };

    const handleFinalize = () => {
        const confirmEnd = window.confirm("Deseja parar de cantar e finalizar o compartilhamento de áudio?");
        if (confirmEnd) {
            forceStopAll();
            finishGame();
        }
    };

    return (
        <div className="game-root">
            <div className="video-background">
                <YouTube
                    videoId={id}
                    className="youtube-iframe"
                    opts={{
                        height: '100%',
                        width: '100%',
                        playerVars: { autoplay: 1, controls: 0, showinfo: 0, rel: 0, iv_load_policy: 3, modestbranding: 1 }
                    }}
                    onPlay={handleOnPlay}
                    onEnd={handleOnEnd}
                />
            </div>

            {/* Top Left: Finalize Button */}
            <Box position="absolute" top={20} left={20} sx={{ zIndex: 100, display: 'flex', gap: 1 }}>
                <Button
                    variant="contained"
                    color="error"
                    onClick={handleFinalize}
                    startIcon={<StopCircleIcon />}
                    sx={{ borderRadius: '20px', fontWeight: 'bold' }}
                >
                    Finalizar
                </Button>
            </Box>

            {/* Top Right: Settings Button */}
            <Box position="absolute" top={20} right={20} sx={{ zIndex: 100 }}>
                <IconButton
                    onClick={() => setOpenSettings(true)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}
                >
                    <SettingsIcon fontSize="large" />
                </IconButton>
            </Box>

            {isPlaying && !musicPitch && (
                <Box position="absolute" top={100} left="50%" sx={{ transform: 'translateX(-50%)', zIndex: 100 }}>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={startSystemAudioManually}
                    >
                        Capturar Som do Sistema
                    </Button>
                </Box>
            )}

            {settings.devMode && (
                <DevTunerPanel voicePitch={voicePitch} musicPitch={musicPitch} />
            )}

            {settings.showOverlay && (
                <div className="pitch-overlay">
                    {settings.partyMode
                        ? <PartyOverlay
                            frameScore={partyDisplay.frameScore}
                            isActive={partyDisplay.active}
                            categories={partyDisplay.categories}
                          />
                        : <PitchOverlay voicePitch={voicePitch} musicPitch={musicPitch} />
                    }
                </div>
            )}

            <SettingsDialog open={openSettings} onClose={() => {
                setOpenSettings(false);
                setSettings(getSettings());
            }} />
        </div>
    );
};

export default GamePage;
