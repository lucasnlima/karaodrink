import React from 'react';
import { Box, Typography } from '@mui/material';
import { frequencyToNote } from '../utils/noteUtils';
import { PitchProcessor } from '../audio/PitchProcessor';
import { getSettings } from '../utils/settings';

// Cents deviation from the nearest semitone (-50 to +50), tuner-style.
function centsFromNearestNote(frequency) {
    if (!frequency || frequency <= 0) return null;
    const halfSteps = 12 * Math.log2(frequency / 440);
    return Math.round((halfSteps - Math.round(halfSteps)) * 100);
}

const Gauge = ({ value, max, color }) => {
    // value in [-max, +max] mapped to 0%..100%
    const pct = value === null ? 50 : Math.max(0, Math.min(100, 50 + (value / max) * 50));
    return (
        <Box sx={{ position: 'relative', height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            {/* center marker */}
            <Box sx={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: 'rgba(255,255,255,0.6)' }} />
            {/* needle */}
            <Box sx={{
                position: 'absolute', top: 0, bottom: 0, width: '6px', borderRadius: 3,
                left: `calc(${pct}% - 3px)`, background: color, transition: 'left 80ms linear'
            }} />
        </Box>
    );
};

const DevTunerPanel = ({ voicePitch, musicPitch }) => {
    const tolerance = getSettings().tolerance || 0.08;

    const voiceNote = frequencyToNote(voicePitch);
    const musicNote = frequencyToNote(musicPitch);
    const cents = centsFromNearestNote(voicePitch);

    const vLog = PitchProcessor.toLogPitch(voicePitch);
    const mLog = PitchProcessor.toLogPitch(musicPitch);
    const harmonicDist = (vLog !== null && mLog !== null)
        ? PitchProcessor.getHarmonicDistance(PitchProcessor.getPitchClass(mLog), PitchProcessor.getPitchClass(vLog))
        : null;
    const inTune = harmonicDist !== null && harmonicDist < tolerance;

    const centsColor = cents === null ? '#888' : Math.abs(cents) < 15 ? '#00e676' : Math.abs(cents) < 30 ? '#ffea00' : '#ff1744';
    const distColor = harmonicDist === null ? '#888' : inTune ? '#00e676' : '#ff1744';

    return (
        <Box sx={{
            position: 'absolute', top: 80, right: 20, zIndex: 100,
            width: 280, p: 2, borderRadius: 2,
            background: 'rgba(0,0,0,0.75)', color: 'white',
            fontFamily: 'monospace', backdropFilter: 'blur(4px)'
        }}>
            <Typography sx={{ fontSize: 13, fontWeight: 'bold', opacity: 0.7, mb: 1 }}>
                MODO DESENVOLVEDOR
            </Typography>

            <Box display="flex" justifyContent="space-between" alignItems="baseline">
                <Typography sx={{ fontSize: 40, fontWeight: 'bold', color: voicePitch ? '#ff7043' : '#555', lineHeight: 1 }}>
                    {voiceNote}
                </Typography>
                <Typography sx={{ fontSize: 14, opacity: 0.8 }}>
                    {voicePitch ? `${voicePitch.toFixed(1)} Hz` : 'sem voz'}
                </Typography>
            </Box>

            <Typography sx={{ fontSize: 12, mt: 1.5, mb: 0.5, opacity: 0.8 }}>
                Afinação (cents vs. nota mais próxima): <b style={{ color: centsColor }}>{cents === null ? '—' : `${cents > 0 ? '+' : ''}${cents}`}</b>
            </Typography>
            <Gauge value={cents} max={50} color={centsColor} />

            <Box display="flex" justifyContent="space-between" mt={2}>
                <Typography sx={{ fontSize: 13 }}>
                    Música: <b style={{ color: '#42a5f5' }}>{musicNote}</b>
                </Typography>
                <Typography sx={{ fontSize: 13, opacity: 0.8 }}>
                    {musicPitch ? `${musicPitch.toFixed(1)} Hz` : 'sem ref.'}
                </Typography>
            </Box>

            <Typography sx={{ fontSize: 12, mt: 1.5, mb: 0.5, opacity: 0.8 }}>
                Distância harmônica (mód. oitava): <b style={{ color: distColor }}>{harmonicDist === null ? '—' : harmonicDist.toFixed(3)}</b>
                {harmonicDist !== null && (inTune ? ' ✔' : ' ✘')}
            </Typography>
            <Gauge value={harmonicDist === null ? null : Math.min(harmonicDist, 0.5)} max={0.5} color={distColor} />
            <Typography sx={{ fontSize: 11, opacity: 0.5, mt: 0.5 }}>
                tolerância atual: {tolerance.toFixed(2)}
            </Typography>
        </Box>
    );
};

export default DevTunerPanel;
