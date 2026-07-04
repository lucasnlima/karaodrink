import React, { useState, useEffect } from 'react';
import {
    Dialog, Button, Slider, Typography, Switch, FormControlLabel, Box,
    Select, MenuItem, FormControl, InputLabel, Divider, Grid, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getSettings, saveSettings, PRESETS } from '../utils/settings';
import { audioEngine } from '../audio/AudioEngine';

const SettingsDialog = ({ open, onClose }) => {
    const [settings, setSettings] = useState(getSettings());

    useEffect(() => {
        if (open) {
            setSettings(getSettings());
        }
    }, [open]);

    const handleChange = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        saveSettings(newSettings);
        audioEngine.updateSettings(newSettings);
        if (key === 'debugMode') audioEngine.setDebug(value);
    };

    const handlePreset = (presetKey) => {
        const preset = PRESETS[presetKey];
        const newSettings = { ...settings, ...preset, activePreset: presetKey };
        setSettings(newSettings);
        saveSettings(newSettings);
        audioEngine.updateSettings(newSettings);
    };

    const handleStartSystemAudio = async () => {
        try {
            await audioEngine.startSystemAudio();
            alert("Captura de Áudio da Aba autorizada!");
        } catch (e) {
            console.error(e);
            alert("Falha ao capturar áudio da aba.");
        }
    };

    // Windows 95 UI Component Styles
    const win95Styles = {
        dialog: {
            backgroundColor: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            borderRadius: 0,
            padding: '2px',
        },
        header: {
            background: 'linear-gradient(90deg, #000080, #1084d0)',
            color: 'white',
            padding: '6px 10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
            fontSize: '18px',
        },
        closeBtn: {
            backgroundColor: '#c0c0c0',
            border: '1px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            borderRadius: 0,
            padding: '2px',
            minWidth: '24px',
            height: '24px',
            color: 'black',
            fontWeight: 'bold',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
        },
        content: {
            backgroundColor: '#c0c0c0',
            padding: '25px',
            fontFamily: 'sans-serif',
            fontSize: '16px',
            color: 'black',
        },
        group: {
            border: '2px solid',
            borderColor: '#ffffff #808080 #808080 #ffffff',
            padding: '20px',
            marginTop: '20px',
            position: 'relative'
        },
        groupLabel: {
            position: 'absolute',
            top: '-12px',
            left: '10px',
            backgroundColor: '#c0c0c0',
            padding: '0 8px',
            fontWeight: 'bold',
            fontSize: '16px'
        },
        button: {
            backgroundColor: '#c0c0c0',
            border: '1px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            borderRadius: 0,
            padding: '8px 25px',
            color: 'black',
            textTransform: 'none',
            fontFamily: 'sans-serif',
            fontSize: '16px',
            fontWeight: 'bold',
            '&:active': {
                borderColor: '#404040 #ffffff #ffffff #404040',
            }
        },
        select: {
            backgroundColor: 'white',
            borderRadius: 0,
            height: '32px',
            fontSize: '16px',
            border: '1px solid',
            borderColor: '#808080 #ffffff #ffffff #808080',
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{ sx: win95Styles.dialog }}
        >
            <Box sx={win95Styles.header}>
                <span>Configurações do Sistema</span>
                <Box onClick={onClose} sx={win95Styles.closeBtn}>X</Box>
            </Box>

            <Box sx={win95Styles.content}>

                {/* ── Party Mode ── */}
                <Box sx={{
                    ...win95Styles.group,
                    borderColor: settings.partyMode ? '#ff00cc #800066 #800066 #ff00cc' : undefined,
                    background: settings.partyMode ? 'linear-gradient(135deg,rgba(80,0,80,0.18),rgba(0,0,0,0))' : undefined,
                }}>
                    <Typography sx={{ ...win95Styles.groupLabel, color: settings.partyMode ? '#ff00cc' : undefined }}>
                        Modo Festa 🎉
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                        <Button
                            fullWidth
                            onClick={() => handleChange('partyMode', !settings.partyMode)}
                            sx={{
                                ...win95Styles.button,
                                background: settings.partyMode
                                    ? 'linear-gradient(90deg,#cc00aa,#6600cc)'
                                    : undefined,
                                color: settings.partyMode ? 'white' : 'black',
                                fontWeight: 'bold',
                                fontSize: 16,
                            }}
                        >
                            {settings.partyMode ? '✅ Modo Festa Ativo' : 'Ativar Modo Festa'}
                        </Button>
                    </Box>
                    <Typography sx={{ fontSize: 11, mt: 1, opacity: 0.7 }}>
                        Avalia Presença de Palco, Controle Vocal e Resistência — sem comparar com a música original.
                    </Typography>
                </Box>

                {/* ── Difficulty Presets ── */}
                <Box sx={win95Styles.group}>
                    <Typography sx={win95Styles.groupLabel}>Dificuldade</Typography>
                    <Box display="flex" gap={1} mt={0.5}>
                        {Object.entries(PRESETS).map(([key, preset]) => {
                            const active = settings.activePreset === key;
                            const colors = { easy: '#2e7d32', medium: '#e65100', hard: '#b71c1c' };
                            return (
                                <Button
                                    key={key}
                                    fullWidth
                                    onClick={() => handlePreset(key)}
                                    sx={{
                                        ...win95Styles.button,
                                        borderWidth: active ? '3px' : '1px',
                                        borderStyle: 'solid',
                                        borderColor: active
                                            ? `${colors[key]} !important`
                                            : '#ffffff #404040 #404040 #ffffff',
                                        fontWeight: active ? 'bold' : 'normal',
                                        color: active ? colors[key] : 'black',
                                        flexDirection: 'column',
                                        py: 1,
                                    }}
                                >
                                    <span style={{ fontSize: 16 }}>{preset.label}</span>
                                    <span style={{ fontSize: 10, opacity: 0.7, textTransform: 'none', lineHeight: 1.2, marginTop: 2 }}>
                                        {preset.description}
                                    </span>
                                </Button>
                            );
                        })}
                    </Box>
                </Box>

                <Box sx={win95Styles.group}>
                    <Typography sx={win95Styles.groupLabel}>Captação de Voz</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>Sensibilidade:</Typography>
                            <Slider
                                value={settings.voiceThreshold}
                                min={0.01}
                                max={0.5}
                                step={0.01}
                                onChange={(_, val) => handleChange('voiceThreshold', val)}
                                sx={{ color: '#000080', height: 6 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={settings.voiceAlgorithm}
                                    onChange={(e) => handleChange('voiceAlgorithm', e.target.value)}
                                    sx={win95Styles.select}
                                >
                                    <MenuItem value="CustomYIN">Custom YIN</MenuItem>
                                    <MenuItem value="DW">Dynamic Wavelet</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={win95Styles.group}>
                    <Typography sx={win95Styles.groupLabel}>Música e Algoritmo</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>Sensibilidade:</Typography>
                            <Slider
                                value={settings.musicThreshold}
                                min={0.01}
                                max={0.3}
                                step={0.01}
                                onChange={(_, val) => handleChange('musicThreshold', val)}
                                sx={{ color: '#000080', height: 6 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={settings.musicAlgorithm}
                                    onChange={(e) => handleChange('musicAlgorithm', e.target.value)}
                                    sx={win95Styles.select}
                                >
                                    <MenuItem value="CustomYIN">Custom YIN</MenuItem>
                                    <MenuItem value="DW">Dynamic Wavelet</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        size="medium"
                                        checked={settings.useMelodyFilter}
                                        onChange={(e) => handleChange('useMelodyFilter', e.target.checked)}
                                    />
                                }
                                label={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>Filtro de Melodia</span>}
                            />
                        </Grid>
                    </Grid>
                </Box>

                <Box sx={win95Styles.group}>
                    <Typography sx={win95Styles.groupLabel}>Aparência & Debug</Typography>
                    <Box display="flex" flexDirection="column">
                        <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>Tolerância:</Typography>
                        <Slider
                            value={settings.tolerance}
                            min={0.01}
                            max={0.15}
                            step={0.01}
                            onChange={(_, val) => handleChange('tolerance', val)}
                            sx={{ color: '#000080', height: 6 }}
                        />
                        <FormControlLabel
                            control={<Switch size="medium" checked={settings.showOverlay} onChange={(e) => handleChange('showOverlay', e.target.checked)} />}
                            label={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>Gráfico Overlay</span>}
                        />
                        <FormControlLabel
                            control={<Switch size="medium" checked={settings.debugMode} onChange={(e) => handleChange('debugMode', e.target.checked)} />}
                            label={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>Log de Debug</span>}
                        />
                        <FormControlLabel
                            control={<Switch size="medium" checked={settings.devMode || false} onChange={(e) => handleChange('devMode', e.target.checked)} />}
                            label={<span style={{ fontSize: '14px', fontWeight: 'bold' }}>Modo Desenvolvedor (afinador visual)</span>}
                        />
                    </Box>
                </Box>

                <Box mt={2} display="flex" gap={1}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleStartSystemAudio}
                        sx={win95Styles.button}
                    >
                        Gravar Áudio da Guia
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={onClose}
                        sx={win95Styles.button}
                    >
                        OK
                    </Button>
                </Box>
            </Box>
        </Dialog>
    );
};

export default SettingsDialog;
