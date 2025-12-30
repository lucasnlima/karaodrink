# Unified Karaoke Project

## Overview
A unified Karaoke Drinking Game that combines a rich, user-friendly interface with advanced real-time pitch accuracy scoring. This project merges the game identity of "Karaoke Drinking Game" with the technical audio foundation of "Pitch Accuracy Experiment".

## Features
- **Real-time Pitch Analysis**: Uses a custom YIN algorithm to detect pitch accuracy.
- **Dynamic Scoring**: Score is calculated based on performance, not random chance.
- **Drinking Penalties**: Low scores result in specific drink penalties.
- **Video Integration**: Sing along to YouTube karaoke tracks.
- **Pitch Overlay**: Visual feedback of your pitch vs expected pitch (where available) or relative stability.

## Tech Stack
- **React 18**: UI Library
- **Vite**: Build tool and dev server
- **Material UI (v5)**: Component library
- **React Router v6**: Navigation
- **AudioContext API**: Real-time audio processing

## Setup
1. Clone or navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Allow microphone access when prompted.

## Architecture
See [STRUCTURE.md](./STRUCTURE.md) for detailed folder organization.
