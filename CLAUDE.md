# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pau Hana Media is a TypeScript-based Node.js event orchestration system for a tiki bar environment that synchronizes audio, lighting, and visual effects. It runs on a Raspberry Pi and controls Sonos speakers, WLED LED strips, and Philips Hue lights to create immersive experiences like thunderstorms and volcano eruptions. Includes a React web dashboard for monitoring and control.

## Development Workflow

```bash
# Install dependencies
npm install
cd web && npm install

# Build TypeScript backend + React frontend
npm run build

# Start the application (production)
npm start

# Development mode (watch TypeScript changes)
npm run dev

# Develop React dashboard
npm run dev:web

# Type check without building
npm run typecheck

# Deploy to Raspberry Pi (automated)
npm run deploy         # Full deployment with deps install
npm run deploy:quick   # Quick sync (no npm install)
```

## Deployment

The project includes automated deployment scripts:

- **deploy.sh**: Full deployment (build, sync, install deps, restart service)
- **quick-deploy.sh**: Quick deployment (build, sync, restart only)

Deploys to: `kyle@pauhana-pi.local:/home/kyle/pauhana-media`

The app runs as a systemd service (`pauhana.service`) and is accessible at:

- **http://pauhana.io** (via nginx reverse proxy on port 80)
- http://pauhana-pi.local:9001 (direct access)

nginx is configured to proxy requests from port 80 to the Node.js app on port 9001.

## Architecture

### Project Structure

```
pauhana-media/
├── src/              # TypeScript source files
│   ├── main.ts       # Entry point
│   ├── api.ts        # Express server + routes
│   ├── config.ts     # Environment validation
│   ├── types/        # TypeScript type definitions
│   ├── common/       # Constants and helpers
│   ├── utils/        # WLED discovery utilities
│   └── json/         # WLED state presets
├── dist/             # Compiled JavaScript (git-ignored)
├── web/              # React dashboard (TypeScript + Vite)
│   ├── src/          # React components
│   └── public/       # Static assets
├── web-dist/         # Built React app (served by Express)
├── audio/            # MP3 sound effects
└── deploy.sh         # Deployment automation
```

### Entry Point Flow

- `src/main.ts` initializes all systems:
  1. Validates environment variables (via `config.ts`)
  2. Starts Express API server (via `api.ts`)
  3. Sets up GPIO button listener (Linux only)
  4. Discovers WLED devices on the network
  5. Starts random event scheduler

### Event System

Events are coordinated through `effectController.ts` which:

- Prevents overlapping events (uses `eventHappening` flag)
- Triggers event-specific functions (`summonStorm()`, `startEruption()`)
- Discovers WLED devices before each event
- Handles errors and cleanup via try/finally

Event implementations (`storm.ts`, `eruption.ts`) follow this pattern:

1. Assign WLED devices to zones (storm/volcano)
2. Snapshot current Sonos state (volume, track, position, queue)
3. Fade volume down to 1
4. Play sound effect at target volume
5. Trigger lighting effects
6. Wait for effect duration
7. Restore original track/position and fade volume back

### Hardware Controllers

**Sonos** (`sonos.ts`):

- Controls two Sonos speakers (main + secondary)
- `snapshotSonos()`: Captures volume, playback state, current track position/queue (including album art)
- `fadeVolume()`: Smooth volume transitions in steps (defined by `SONOS_STEPS`)
- `playEffect()`: Handles the fade-down → play → fade-up sequence
- Returns typed `SonosSnapshot` interface with nullable track info

**WLED** (`wled.ts`):

- `PauHanaWLED` class manages multiple WLED devices with generic typing
- `discover()`: Network scan via HTTP to find all WLED controllers on subnet
- `assignZones()`: Maps devices to zones (volcano, storm, ambient) by name
- `saveSnapshot()`: Captures current state of all devices before effects
- `reset()`: Restores saved snapshot after event completes
- Zone-based control allows different devices for different effects

**Philips Hue** (`hue.ts`):

- Direct HTTP control of bridge
- Used for lightning flash effects (currently commented out in storm/eruption)

**GPIO Button** (`button.ts`):

- Uses `onoff` library to monitor GPIO 516
- Platform-aware: only initializes on Linux (gracefully skips on macOS)
- Debounced button press triggers storm event

### API Endpoints

Protected endpoints require `X-API-Key` header (checked by middleware). Public endpoints include dashboard, health check, and audio files.

**Public Endpoints:**

- `GET /` - Serves React dashboard (static files from web-dist/)
- `GET /health` - Returns system status, storm state, and current Sonos info with album art
- `GET /audio/*` - Serves static audio files

**Protected Endpoints (require X-API-Key header):**

- `POST /storm` - Triggers storm event (409 if event already active)
- `POST /erupt` - Triggers volcano eruption (409 if event already active)
- `GET /logs?lines=N` - Returns last N lines of logs (max 500)

### React Dashboard

Located in `web/` directory, built with React + TypeScript + Vite.

**Features:**

- Real-time system status (polls `/health` every 5 seconds)
- Live Sonos playback info with album artwork
- Event trigger buttons (Storm, Eruption)
- Tiki bar themed styling

**Development:**

```bash
cd web
npm run dev    # Starts Vite dev server on port 5173 with proxy
```

**Production Build:**

```bash
npm run build:web   # Builds to ../web-dist/
```

The Express server serves the built React app from `web-dist/` at the root path. Album art URLs are constructed on the backend to point directly to the Sonos speaker's HTTP endpoint.

### Random Event Scheduler

`randomEventScheduler.ts` creates a recursive random delay loop:

- Waits 30-90 minutes (configurable in `constants.ts`)
- Checks if Sonos is playing music
- If playing, randomly picks STORM or ERUPTION
- Schedules next check regardless of outcome

### Network Discovery

`utils/discoverWLED.ts` performs subnet scanning:

- Gets local subnet from network interfaces (`getLocalSubnet.ts`)
- Scans all 254 IPs concurrently (50 at a time via `p-map`)
- Identifies WLED devices by checking for `/json` endpoint with version field
- Returns typed array of `WLEDDevice` objects with `{ip, name}`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```
API_KEY=your-api-key-here
SONOS_MAIN_IP=192.168.1.x
SONOS_SECONDARY_IP=192.168.1.y
HUE_BRIDGE_IP=192.168.1.z
HUE_USERNAME=your-hue-api-username
```

Environment variables are validated at startup by `src/config.ts`. Missing required variables will cause the app to exit with an error.

### React Dashboard Environment

Create `web/.env` for the dashboard:

```
VITE_API_KEY=your-api-key-here
```

This is only needed for triggering events from the dashboard (storm/eruption buttons).

### Constants

Constants in `src/common/constants.ts`:

- `STORM_VOLUME`, `ERUPTION_VOLUME`: Target volumes for events
- `MIN_EVENT_INTERVAL_MINUTES`, `MAX_EVENT_INTERVAL_MINUTES`: Random event timing
- `SONOS_STEPS`: Number of steps for volume fade smoothness
- `EVENTS`: Event definitions with URIs, logging messages

Audio files: Place MP3 files in `audio/` directory. Currently expects:

- `thunderstorm.mp3`
- `eruption.mp3`

WLED presets: `src/json/wledStates.ts` contains JSON state objects for effects (LIGHTING, RED).

## Development Notes

- **TypeScript with strict mode** - Full type safety throughout codebase
- **ES modules** (import/export with .js extensions in imports - required for Node.js ESM)
- **Target: ES2022** - Compiled JavaScript uses modern features
- **Custom type definitions** - `src/types/sonos.d.ts` provides types for the Sonos library (no official types available)
- **No test suite** currently configured
- **Platform-aware GPIO** - Button initialization gracefully skips on non-Linux systems
- **Designed for Raspberry Pi** deployment with systemd service
- **WLED discovery** requires devices to be on same subnet
- **Events are fire-and-forget** from API (don't block HTTP responses)
- **Volume fades and track restoration** ensure smooth user experience
- **Hue lightning effects** are implemented but currently disabled (commented out in storm.ts:30-32 and eruption.ts:30-32)
- **nginx reverse proxy** runs on port 80 and forwards to Node.js on port 9001
- **Custom local DNS** via Pi-hole resolves `pauhana.tiki` to the Raspberry Pi
