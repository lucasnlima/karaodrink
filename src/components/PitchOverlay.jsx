import React, { useEffect, useRef, useState } from 'react';
import { PitchProcessor } from '../audio/PitchProcessor';
import { getSettings } from '../utils/settings';

// Hold last detected pitch for this many rAF frames before fading out.
const HOLD_FRAMES_MUSIC = 90;  // ~1.5s
const HOLD_FRAMES_VOICE = 30;  // ~0.5s

// Chromatic scale in ascending semitone order (C = 0 … B = 11).
// These are rendered as horizontal grid lines bottom→top.
const SEMITONE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Convert a frequency to its pitch class [0, 1) where 0 = C.
function toPitchClass(freq) {
    if (!freq || freq <= 0) return null;
    const log = Math.log2(freq);
    return ((log % 1) + 1) % 1;
}

// Catmull-Rom spline through an array of {x, y} points.
function drawSpline(ctx, pts, tension = 0.4) {
    if (pts.length < 2) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        ctx.bezierCurveTo(
            p1.x + (p2.x - p0.x) * tension / 2,
            p1.y + (p2.y - p0.y) * tension / 2,
            p2.x - (p3.x - p1.x) * tension / 2,
            p2.y - (p3.y - p1.y) * tension / 2,
            p2.x, p2.y,
        );
    }
}

// Split an array of points into continuous runs wherever there is a
// pitch-class wrap-around (|Δpc| > 0.5 = crossing the C boundary).
function splitAtWraps(ptArray) {
    if (ptArray.length === 0) return [];
    const runs = [];
    let current = [ptArray[0]];
    for (let i = 1; i < ptArray.length; i++) {
        const dy = Math.abs(ptArray[i].pc - ptArray[i - 1].pc);
        if (dy > 0.45) {               // wrap detected
            if (current.length >= 2) runs.push(current);
            current = [ptArray[i]];
        } else {
            current.push(ptArray[i]);
        }
    }
    if (current.length >= 2) runs.push(current);
    return runs;
}

// Resolve hold state: returns { pc, confidence }.
// confidence = 1 while signal is live, fades to 0 over holdFrames.
function resolveHeld(rawPc, holdRef, holdFrames) {
    if (rawPc !== null) {
        holdRef.current = { pc: rawPc, silent: 0 };
    } else if (holdRef.current.pc !== null) {
        holdRef.current = { ...holdRef.current, silent: holdRef.current.silent + 1 };
    }
    const { pc, silent } = holdRef.current;
    if (pc === null) return { pc: null, confidence: 0 };
    const confidence = Math.max(0, 1 - silent / holdFrames);
    return { pc: confidence > 0 ? pc : null, confidence };
}

const PitchOverlay = ({ voicePitch, musicPitch }) => {
    const canvasRef = useRef(null);
    const historyRef = useRef([]);
    const requestRef = useRef();
    const propsRef = useRef({ voicePitch, musicPitch });
    const holdMRef = useRef({ pc: null, silent: 0 });
    const holdVRef = useRef({ pc: null, silent: 0 });
    const [settings, setSettings] = useState(getSettings());

    useEffect(() => {
        propsRef.current = { voicePitch, musicPitch };
    }, [voicePitch, musicPitch]);

    useEffect(() => {
        const id = setInterval(() => setSettings(getSettings()), 1000);
        return () => clearInterval(id);
    }, []);

    const HISTORY_SIZE = 400;

    const draw = (inTuneNow, hasVoice) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, width, height);

        // --- Chromatic grid lines (12 semitones, C at bottom, B at top) ---
        const LABEL_W = 28;
        const drawW = width - LABEL_W;
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        for (let s = 0; s < 12; s++) {
            const y = height * (1 - s / 12);
            const isNatural = [0, 2, 4, 5, 7, 9, 11].includes(s);
            ctx.strokeStyle = isNatural ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)';
            ctx.lineWidth = isNatural ? 1 : 0.5;
            ctx.beginPath();
            ctx.moveTo(LABEL_W, y);
            ctx.lineTo(width, y);
            ctx.stroke();
            ctx.fillStyle = isNatural ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)';
            ctx.fillText(SEMITONE_LABELS[s], LABEL_W - 2, y + 4);
        }

        const history = historyRef.current;
        if (history.length < 2) return;

        // pc → canvas Y (C = bottom, B = just below top, wraps at 1→0)
        const pcToY = (pc) => height * (1 - pc);
        // index in history → canvas X (offset by label width)
        const idxToX = (i) => LABEL_W + (i / HISTORY_SIZE) * drawW;

        // --- In-tune background highlight ---
        let tuneStart = -1;
        ctx.fillStyle = 'rgba(0,255,0,0.08)';
        history.forEach((pt, i) => {
            const x = idxToX(i);
            if (pt.inTune) {
                if (tuneStart === -1) tuneStart = x;
            } else if (tuneStart !== -1) {
                ctx.fillRect(tuneStart, 0, x - tuneStart, height);
                tuneStart = -1;
            }
        });
        if (tuneStart !== -1) ctx.fillRect(tuneStart, 0, width - tuneStart, height);

        // --- Build point arrays ---
        const mRaw = history
            .map((pt, i) => pt.mPc !== null ? { i, pc: pt.mPc, conf: pt.mConf, tol: pt.tol } : null)
            .filter(Boolean);

        const vRaw = history
            .map((pt, i) => pt.vPc !== null ? { i, pc: pt.vPc, conf: pt.vConf } : null)
            .filter(Boolean);

        // --- Music tolerance band ---
        if (mRaw.length >= 2) {
            const runs = splitAtWraps(mRaw);
            runs.forEach(run => {
                // Filled band
                ctx.beginPath();
                const topPts = run.map(p => ({ x: idxToX(p.i), y: pcToY(Math.min(p.pc + p.tol, 1)) }));
                const botPts = run.map(p => ({ x: idxToX(p.i), y: pcToY(Math.max(p.pc - p.tol, 0)) }));
                drawSpline(ctx, topPts);
                for (let k = botPts.length - 1; k >= 0; k--) ctx.lineTo(botPts[k].x, botPts[k].y);
                ctx.closePath();
                ctx.fillStyle = 'rgba(72,198,239,0.14)';
                ctx.fill();

                // Solid spline (live signal)
                const livePts = run.filter(p => p.conf > 0.85).map(p => ({ x: idxToX(p.i), y: pcToY(p.pc) }));
                if (livePts.length >= 2) {
                    ctx.beginPath(); drawSpline(ctx, livePts);
                    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,150,255,0.9)'; ctx.stroke();
                }

                // Dashed ghost for held segments
                ctx.setLineDash([4, 6]);
                ctx.lineWidth = 1;
                run.filter(p => p.conf <= 0.85).forEach((p, ki, arr) => {
                    if (ki === 0) return;
                    const prev = arr[ki - 1];
                    const alpha = (p.conf + prev.conf) / 2 * 0.5;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(0,150,255,${alpha.toFixed(2)})`;
                    ctx.moveTo(idxToX(prev.i), pcToY(prev.pc));
                    ctx.lineTo(idxToX(p.i), pcToY(p.pc));
                    ctx.stroke();
                });
                ctx.setLineDash([]);
            });
        }

        // --- Voice line ---
        if (vRaw.length >= 2) {
            const runs = splitAtWraps(vRaw);
            runs.forEach(run => {
                // Solid spline (live)
                const livePts = run.filter(p => p.conf > 0.85).map(p => ({ x: idxToX(p.i), y: pcToY(p.pc) }));
                if (livePts.length >= 2) {
                    ctx.beginPath(); drawSpline(ctx, livePts);
                    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,80,0,0.95)'; ctx.stroke();
                }

                // Dashed ghost for held segments
                ctx.setLineDash([3, 5]);
                ctx.lineWidth = 1.5;
                run.filter(p => p.conf <= 0.85).forEach((p, ki, arr) => {
                    if (ki === 0) return;
                    const prev = arr[ki - 1];
                    const alpha = (p.conf + prev.conf) / 2 * 0.55;
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(255,80,0,${alpha.toFixed(2)})`;
                    ctx.moveTo(idxToX(prev.i), pcToY(prev.pc));
                    ctx.lineTo(idxToX(p.i), pcToY(p.pc));
                    ctx.stroke();
                });
                ctx.setLineDash([]);
            });
        }

        // --- Status label ---
        if (hasVoice) {
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = inTuneNow ? '#00e676' : '#ff1744';
            ctx.fillText(inTuneNow ? 'Mandando bem!' : 'Nu!! Tá osso', LABEL_W + 8, 28);
        }
    };

    const loop = () => {
        const { voicePitch, musicPitch } = propsRef.current;
        const currentTolerance = getSettings().tolerance || 0.08;

        const rawVPc = toPitchClass(voicePitch);
        const rawMPc = toPitchClass(musicPitch);

        const { pc: vPc, confidence: vConf } = resolveHeld(rawVPc, holdVRef, HOLD_FRAMES_VOICE);
        const { pc: mPc, confidence: mConf } = resolveHeld(rawMPc, holdMRef, HOLD_FRAMES_MUSIC);

        // Octave-invariant in-tune check (reuse PitchProcessor with original freqs
        // but PitchProcessor already does pitch-class comparison internally)
        const inTune = PitchProcessor.isInTuneWithTolerance(
            mPc !== null ? Math.pow(2, mPc) : null,
            vPc !== null ? Math.pow(2, vPc) : null,
            currentTolerance,
        );

        historyRef.current.push({ vPc, mPc, inTune, tol: currentTolerance, vConf, mConf });
        if (historyRef.current.length > HISTORY_SIZE) historyRef.current.shift();

        draw(inTune, vConf > 0.5);
        requestRef.current = requestAnimationFrame(loop);
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <canvas
                ref={canvasRef}
                width={1000}
                height={220}
                style={{ width: '100%', height: '100%', borderRadius: '10px' }}
            />
        </div>
    );
};

export default PitchOverlay;
