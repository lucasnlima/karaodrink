import React, { useEffect, useRef, useState } from 'react';
import { PitchProcessor } from '../audio/PitchProcessor';
import { frequencyToNote } from '../utils/noteUtils';
import { getSettings } from '../utils/settings';

const PitchOverlay = ({ voicePitch, musicPitch }) => {
    const canvasRef = useRef(null);
    const historyRef = useRef([]);
    const requestRef = useRef();

    // Local state for settings and display status
    const [settings, setSettings] = useState(getSettings());
    const [statusLabel, setStatusLabel] = useState("");
    const propsRef = useRef({ voicePitch, musicPitch });

    useEffect(() => {
        propsRef.current = { voicePitch, musicPitch };
    }, [voicePitch, musicPitch]);

    useEffect(() => {
        const interval = setInterval(() => {
            setSettings(getSettings());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const HISTORY_SIZE = 400;
    const MIN_LOG_PITCH = 6.0;
    const MAX_LOG_PITCH = 10.0;
    const VIEW_RANGE = MAX_LOG_PITCH - MIN_LOG_PITCH;

    const mapPitchToY = (logPitch) => {
        if (!logPitch) return null;
        const normalized = (logPitch - MIN_LOG_PITCH) / VIEW_RANGE;
        return 1 - normalized;
    };

    const draw = (inTuneNow, hasVoice) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const tolerance = settings.tolerance || 0.08;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, width, height);

        // --- Grid ---
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let p = Math.ceil(MIN_LOG_PITCH); p <= Math.floor(MAX_LOG_PITCH); p++) {
            const y = mapPitchToY(p) * height;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        const history = historyRef.current;
        if (history.length < 2) return;

        const getXY = (index, val) => ({
            x: (index / HISTORY_SIZE) * width,
            y: (mapPitchToY(val) * height)
        });

        // --- In-Tune Highlighting (BG) ---
        let inTuneStart = -1;
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        history.forEach((point, i) => {
            const x = (i / HISTORY_SIZE) * width;
            if (point.inTune && point.vLog >= MIN_LOG_PITCH && point.mLog >= MIN_LOG_PITCH) {
                if (inTuneStart === -1) inTuneStart = x;
            } else {
                if (inTuneStart !== -1) {
                    ctx.fillRect(inTuneStart, 0, x - inTuneStart, height);
                    inTuneStart = -1;
                }
            }
        });

        // --- Music Path ---
        ctx.fillStyle = 'rgba(72, 198, 239, 0.15)';
        ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
        ctx.beginPath();
        let firstM = true;
        history.forEach((point, i) => {
            if (!point.mLog || point.mLog < MIN_LOG_PITCH) return;
            const pos = getXY(i, point.mLog + point.currentTolerance);
            if (firstM) { ctx.moveTo(pos.x, pos.y); firstM = false; } else ctx.lineTo(pos.x, pos.y);
        });
        for (let i = history.length - 1; i >= 0; i--) {
            const point = history[i];
            if (!point.mLog || point.mLog < MIN_LOG_PITCH) continue;
            const pos = getXY(i, point.mLog - point.currentTolerance);
            ctx.lineTo(pos.x, pos.y);
        }
        ctx.closePath(); ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.beginPath();
        let drawingM = false;
        history.forEach((point, i) => {
            if (point.mLog && point.mLog >= MIN_LOG_PITCH) {
                const pos = getXY(i, point.mLog);
                if (!drawingM) { ctx.moveTo(pos.x, pos.y); drawingM = true; } else ctx.lineTo(pos.x, pos.y);
            } else drawingM = false;
        });
        ctx.stroke();

        // --- Voice Path ---
        ctx.strokeStyle = '#ff3d00';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        let drawingV = false;
        history.forEach((point, i) => {
            if (point.vLog && point.vLog >= MIN_LOG_PITCH && point.vLog <= MAX_LOG_PITCH) {
                const pos = getXY(i, point.vLog);
                if (!drawingV) { ctx.moveTo(pos.x, pos.y); drawingV = true; } else ctx.lineTo(pos.x, pos.y);
            } else drawingV = false;
        });
        ctx.stroke();

        // status text integrated on top left of graph
        if (hasVoice) {
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'left';
            if (inTuneNow) {
                ctx.fillStyle = '#00e676';
                ctx.fillText("Mandando bem!", 10, 30);
            } else {
                ctx.fillStyle = '#ff1744';
                ctx.fillText("Nu!! Tá osso", 10, 30);
            }
        }
    };

    const loop = () => {
        const { voicePitch, musicPitch } = propsRef.current;
        const currentTolerance = getSettings().tolerance || 0.08;

        const vLog = PitchProcessor.toLogPitch(voicePitch);
        const mLog = PitchProcessor.toLogPitch(musicPitch);
        const vNote = frequencyToNote(voicePitch);
        const inTune = PitchProcessor.isInTuneWithTolerance(musicPitch, voicePitch, currentTolerance);

        historyRef.current.push({ vLog, mLog, vNote, inTune, currentTolerance });
        if (historyRef.current.length > HISTORY_SIZE) historyRef.current.shift();

        draw(inTune, !!voicePitch);
        requestRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} width={1000} height={200} style={{ width: '100%', height: '100%', borderRadius: '10px' }} />
        </div>
    );
};

export default PitchOverlay;
