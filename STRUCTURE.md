# Project Structure

## Folder Organization

```
src/
├── audio/          # Audio processing logic
│   ├── AudioCapture.js      # Manages AudioContext and Microphone stream
│   └── PitchCorrelation.js  # Logic to compare detected pitch with expected values
├── components/     # Reusable UI components
│   ├── ui/         # Generic UI elements (Buttons, Cards)
│   └── game/       # Game-specific components (PitchGraph, ScoreDisplay)
├── data/           # Static data
│   └── songs.json  # List of songs with ID, Artist, Genre
├── hooks/          # Custom React Hooks
│   ├── useAudio.js # Hook to access AudioContext
│   └── usePitch.js # Hook to get real-time pitch data
├── pages/          # Application Screens
│   ├── Home/       # Landing page
│   ├── Menu/       # Song selection
│   ├── Game/       # Main game screen
│   └── Result/     # Score and penalty screen
├── utils/          # Helper functions
│   ├── YIN.js      # Custom Pitch Detection Algorithm
│   └── scoring.js  # Score calculation logic
├── App.jsx         # Main Layout and Routes
└── main.jsx        # Entry point
```

## Key Files
- **src/utils/YIN.js**: The core algorithm for pitch detection, ported from the experimental project.
- **src/data/songs.json**: Contains the curated list of karaoke tracks.
- **src/audio/AudioCapture.js**: Handles the lifecycle of the microphone stream to ensure performance and cleanup.
