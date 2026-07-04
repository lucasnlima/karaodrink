import React, { useEffect, useRef } from 'react';

// PartyOverlay — shows a "stage energy" waveform that reflects vocal quality
// without comparing to any reference pitch. The curve is deliberately smooth
// and encouraging: it rises quickly when the user sings and falls slowly.

const HISTORY  = 300;   // frames kept in display buffer
const RISE_EMA = 0.18;  // EMA alpha for rising edge (fast rise = encouraging)
const FALL_EMA = 0.04;  // EMA alpha for falling edge (slow fall = forgiving)

// Catmull-Rom spline through {x,y} points.
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

const PartyOverlay = ({ frameScore, isActive, categories }) => {
    const canvasRef    = useRef(null);
    const historyRef   = useRef([]);       // array of smoothed level values [0,1]
    const smoothRef    = useRef(0);        // current EMA value
    const rafRef       = useRef();
    const propsRef     = useRef({ frameScore, isActive, categories });

    useEffect(() => {
        propsRef.current = { frameScore, isActive, categories };
    }, [frameScore, isActive, categories]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;

        // --- Update EMA ---
        const { frameScore: fs, isActive: active } = propsRef.current;
        const target = active ? Math.max(0.38, fs ?? 0) : 0; // floor at 38% when singing
        const alpha  = target > smoothRef.current ? RISE_EMA : FALL_EMA;
        smoothRef.current += alpha * (target - smoothRef.current);

        historyRef.current.push(smoothRef.current);
        if (historyRef.current.length > HISTORY) historyRef.current.shift();

        // --- Background ---
        ctx.clearRect(0, 0, width, height);
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, 'rgba(10,5,30,0.7)');
        bgGrad.addColorStop(1, 'rgba(20,10,60,0.85)');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        const hist = historyRef.current;
        if (hist.length < 2) {
            rafRef.current = requestAnimationFrame(draw);
            return;
        }

        const getXY = (i, v) => ({
            x: (i / HISTORY) * width,
            y: height * (1 - v * 0.85),   // top 15% padding
        });

        const pts = hist.map((v, i) => getXY(i, v));
        const level = smoothRef.current; // current level for coloring

        // --- Filled area (gradient fill below the curve) ---
        const fillGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (level > 0.75) {
            fillGrad.addColorStop(0, 'rgba(0,255,160,0.55)');
            fillGrad.addColorStop(1, 'rgba(0,80,80,0.10)');
        } else if (level > 0.50) {
            fillGrad.addColorStop(0, 'rgba(255,210,0,0.55)');
            fillGrad.addColorStop(1, 'rgba(80,50,0,0.10)');
        } else {
            fillGrad.addColorStop(0, 'rgba(255,80,60,0.40)');
            fillGrad.addColorStop(1, 'rgba(60,10,10,0.10)');
        }

        ctx.beginPath();
        drawSpline(ctx, pts);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // --- Glow / shimmer line on top of fill ---
        const lineColor = level > 0.75
            ? `rgba(0,255,160,${(0.6 + level * 0.35).toFixed(2)})`
            : level > 0.50
                ? `rgba(255,210,0,${(0.5 + level * 0.4).toFixed(2)})`
                : `rgba(255,100,80,0.55)`;

        // Glow: draw thicker first, then sharp line on top
        ctx.beginPath(); drawSpline(ctx, pts);
        ctx.lineWidth   = 8;
        ctx.strokeStyle = lineColor.replace(/[\d.]+\)$/, '0.18)');
        ctx.stroke();

        ctx.beginPath(); drawSpline(ctx, pts);
        ctx.lineWidth   = 2.2;
        ctx.strokeStyle = lineColor;
        ctx.stroke();

        // --- Sparkle dots when doing well ---
        if (level > 0.72 && hist.length > 10) {
            const lastY = getXY(hist.length - 1, hist[hist.length - 1]).y;
            const lastX = getXY(hist.length - 1, hist[hist.length - 1]).x;
            const pulse = (Date.now() % 800) / 800;
            const r = 3 + pulse * 4;
            ctx.beginPath();
            ctx.arc(lastX, lastY, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,255,180,${0.7 - pulse * 0.5})`;
            ctx.fill();
        }

        // --- Category scores (right side) ---
        const cats = propsRef.current.categories;
        if (cats) {
            const labels = [
                { key: 'presence',  label: 'Presença' },
                { key: 'control',   label: 'Controle' },
                { key: 'endurance', label: 'Resistência' },
            ];
            const barW = 90, barH = 8, startX = width - barW - 12;
            labels.forEach(({ key, label }, idx) => {
                const val = cats[key] ?? 0;
                const y   = 18 + idx * 28;
                ctx.font      = 'bold 11px monospace';
                ctx.textAlign = 'right';
                ctx.fillStyle = 'rgba(255,255,255,0.55)';
                ctx.fillText(label, startX - 4, y + barH);

                ctx.fillStyle = 'rgba(255,255,255,0.12)';
                ctx.fillRect(startX, y, barW, barH);

                const barColor = val >= 80 ? '#00ffa0' : val >= 55 ? '#ffd200' : '#ff5040';
                ctx.fillStyle  = barColor;
                ctx.fillRect(startX, y, barW * (val / 100), barH);

                ctx.font       = 'bold 11px monospace';
                ctx.textAlign  = 'left';
                ctx.fillStyle  = 'rgba(255,255,255,0.75)';
                ctx.fillText(`${val}`, startX + barW + 4, y + barH);
            });
        }

        // --- "FESTA" label ---
        ctx.font      = 'bold 13px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,0.30)';
        ctx.fillText('MODO FESTA', 10, 16);

        rafRef.current = requestAnimationFrame(draw);
    };

    useEffect(() => {
        rafRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(rafRef.current);
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

export default PartyOverlay;
