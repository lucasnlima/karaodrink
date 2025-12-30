import React, { useState, useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { useParams, useNavigate } from "react-router-dom";
import { usePitch } from "../../hooks/usePitch";
import PitchOverlay from "../../components/PitchOverlay";
import { getSettings } from "../../utils/settings";
import { Button, Box, IconButton, Typography } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import SettingsDialog from '../../components/SettingsDialog';
import './style.css';

const GamePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { voicePitch, musicPitch, startListening, stopListening, forceStopAll, startSystemAudioManually } = usePitch();
    const [isPlaying, setIsPlaying] = useState(false);
    const [settings, setSettings] = useState(getSettings());
    const [openSettings, setOpenSettings] = useState(false);

    const scoreRef = useRef({ total: 0, hit: 0 });
    const logCounter = useRef(0);

    useEffect(() => {
        setSettings(getSettings());
        return () => {
            // Stop listening (processing) but DON'T kill streams to keep 'Share Once' strategy
            console.log("GamePage: Stopping pitch analysis. Stream is kept alive.");
            stopListening();
        };
    }, []);

    useEffect(() => {
        if (isPlaying) {
            scoreRef.current.total++;
            const currentTol = getSettings().tolerance || 0.08;

            if (voicePitch) {
                if (musicPitch) {
                    const diff = Math.abs(Math.log2(voicePitch) - Math.log2(musicPitch));
                    if (diff < currentTol) {
                        scoreRef.current.hit += 1.2;
                        if (settings.debugMode && logCounter.current++ % 20 === 0)
                            console.log(`[SCORE] AFINADO! Diff: ${diff.toFixed(3)} | Ganho: 1.2 pts`);
                    } else {
                        scoreRef.current.hit += 0.5;
                        if (settings.debugMode && logCounter.current++ % 20 === 0)
                            console.log(`[SCORE] Cantando mas fora do tom. Diff: ${diff.toFixed(3)} | Ganho: 0.5 pts`);
                    }
                } else {
                    scoreRef.current.hit += 0.8; // Partial if no music info
                }
            }
        }
    }, [voicePitch, musicPitch, isPlaying, settings.debugMode]);

    const handleOnPlay = () => {
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

        const total = scoreRef.current.total;
        const hit = scoreRef.current.hit;
        const ratio = total > 0 ? (hit / total) : 0;
        let calculatedScore = Math.min(100, Math.round(ratio * 100));

        console.log(`PONTUAÇÃO FINAL EXPLICADA:
    - Total de Quadros: ${total}
    - Soma de "Impacto" (Hit): ${hit.toFixed(2)}
    - Média: ${(ratio * 100).toFixed(2)}% de efetividade.
    - Score Final: ${calculatedScore}`);

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

            {settings.showOverlay && (
                <div className="pitch-overlay">
                    <PitchOverlay voicePitch={voicePitch} musicPitch={musicPitch} />
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
