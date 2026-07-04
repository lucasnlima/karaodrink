# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server
npm run build     # production build
npm run lint      # ESLint
npm run preview   # preview production build locally
```

No test suite is configured.

## Architecture

**Routing (React Router v6):** `/ → StartPage → /menu → MenuPage → /video/:id → GamePage → /score → ScorePage`

**Audio pipeline:**
- `src/audio/AudioEngine.js` — singleton (`audioEngine`) wrapping the Web Audio API. Manages two separate analysis paths: microphone (voice) and system audio capture (music). Each path runs through BiquadFilter nodes into an `AnalyserNode` (fftSize 4096). Pitch detection runs on demand via `getVoicePitch()` / `getMusicPitch()`.
- `src/utils/YIN.js` — custom YIN pitch detection algorithm. The `pitchfinder` package's `DynamicWavelet` is also available as an alternative.
- `src/audio/PitchProcessor.js` — AudioWorklet processor (registered separately).
- `src/hooks/usePitch.js` — React hook that polls `audioEngine` every 50ms via `setInterval`, exposing `voicePitch` and `musicPitch` state.

**Game flow in `GamePage`:** embeds a YouTube video via `react-youtube`, captures system audio with `getDisplayMedia`, and uses `usePitch` to compare voice vs. music pitch in real time. The pitch overlay (`PitchOverlay.jsx`) renders visual feedback.

**Scoring:** `src/utils/scoring.js` maps a final score (0–100) to a "prenda" (drinking penalty/reward) drawn from `src/data/prendas.json`. Thresholds: <30 = punishment, 30–59 = challenge, 60–84 = neutral, ≥85 = reward.

**Settings:** persisted to `localStorage` under the key `active_karaoke_settings`. Defaults and schema live in `src/utils/settings.js`. The `SettingsDialog` component writes via `saveSettings()` and applies changes to the running `audioEngine` instance via `audioEngine.updateSettings()`.

**Song catalogue:** `src/data/songs.json` — array of song objects referenced by `MenuPage`.

**Note utilities:** `src/utils/noteUtils.js` — helpers for frequency-to-note conversion used by the pitch overlay.
