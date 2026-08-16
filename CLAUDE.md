# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pau Hana Media is a TypeScript-based Node.js event orchestration system for a tiki bar environment that synchronizes audio, lighting, video, and visual effects. It runs on a Raspberry Pi 3B+ and controls Sonos speakers, WLED LED strips, Philips Hue lights, and video playback to create immersive experiences like thunderstorms and volcano eruptions. Includes a React web dashboard for monitoring and control.

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

# Testing
npm test               # Run tests in watch mode
npm run test:run       # Run tests once and exit
npm run test:ui        # Run tests with browser UI
npm run test:coverage  # Generate coverage report

# Deploy to Raspberry Pi (automated)
npm run deploy              # Full deployment with deps install
npm run deploy:quick        # Quick sync (no npm install)
./deploy-video.sh           # Deploy video playback system (one-time setup)
./deploy-video-update.sh    # Update video file only (quick, no mpv reinstall)
```

## Testing

The project uses **Vitest** for fast, modern testing with TypeScript support.

### Running Tests

```bash
# Watch mode - tests re-run on file changes (development)
npm test

# Run once and exit (CI/CD)
npm run test:run

# Open web UI to visualize test results
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests live next to the source files they test:
- `src/effectController.ts` → `src/effectController.test.ts`
- `src/utils/helper.ts` → `src/utils/helper.test.ts`

### Test Categories

**Unit Tests** (fast, always run):
- Input validation and error handling
- Pure logic functions
- Constants and data structure validation
- Located: `src/**/*.test.ts`

**Integration Tests** (slow, skipped by default):
- Hardware-dependent tests (GPIO, Sonos, WLED)
- Marked with `describe.skip()`
- Run manually when needed on the Pi

### Automated Testing

**Pre-commit Hook** (via Husky):
- Tests run automatically before every `git commit`
- Commit is blocked if tests fail

**Pre-deployment**:
- `deploy.sh` runs tests before deploying
- Deployment is blocked if tests fail

### Writing Tests

Follow the **Arrange-Act-Assert** pattern. Mock hardware dependencies for unit tests. Skip integration tests by default.

## Deployment

The project includes automated deployment scripts:

- **deploy.sh**: Full deployment (build, sync, install deps, restart service)
- **quick-deploy.sh**: Quick deployment (build, sync, restart only)
- **deploy-video.sh**: Video system deployment (installs mpv, syncs video file, sets up autoplay)

Deploys to: `kyle@pauhana-pi.local:/home/kyle/pauhana-media`

**Important:** The rsync in `deploy.sh` excludes runtime data files so they are never wiped on deploy:
- `event-settings.json`
- `wled-devices.json`
- `effect-library.json`

The system runs as two systemd services:

- **pauhana.service**: Main orchestration service (Node.js app on port 9001)
  - `PrivateTmp` is disabled to allow IPC socket communication with video service
  - `NoNewPrivileges` is disabled to allow `sudo systemctl` for display control
- **pauhana-video.service**: Video playback service (mpv with DRM/KMS output to HDMI)
  - Controlled via `/video/display` API (start/stop the service)
  - Stopping the service releases the DRM device and blanks the display

The app is accessible at:

- **http://pauhana.io** (via nginx reverse proxy on port 80)
- http://pauhana-pi.local:9001 (direct access)

### Pi Setup Notes

- Pi is connected via **WiFi** (not Ethernet)
- Display control requires a sudoers rule on the Pi (one-time setup):
  ```bash
  echo "kyle ALL=(ALL) NOPASSWD: /usr/bin/systemctl * pauhana-video.service" | sudo tee /etc/sudoers.d/pauhana-display
  ```
- `vcgencmd display_power` does NOT work while mpv holds the DRM device open — use the service start/stop approach instead

## Architecture

### Project Structure

```
pauhana-media/
├── src/                    # TypeScript source files
│   ├── main.ts             # Entry point
│   ├── api.ts              # Express server + all routes
│   ├── config.ts           # Environment validation
│   ├── effectController.ts # Event coordinator (prevents overlaps, triggers events)
│   ├── storm.ts            # Storm event implementation
│   ├── eruption.ts         # Eruption event implementation
│   ├── eventSettings.ts    # Runtime event config (persisted to event-settings.json)
│   ├── effectLibrary.ts    # WLED effect library (persisted to effect-library.json)
│   ├── randomEventScheduler.ts # Scheduled random event triggering
│   ├── sonos.ts            # Sonos speaker control
│   ├── wled.ts             # WLED LED controller
│   ├── video.ts            # mpv IPC video control
│   ├── hue.ts              # Philips Hue (unused, effects commented out)
│   ├── button.ts           # GPIO button listener (Linux only)
│   ├── logs.ts             # Systemd journal log fetching
│   ├── types/              # TypeScript type definitions
│   ├── common/             # Constants and helpers
│   ├── utils/              # WLED discovery utilities
│   └── json/               # Built-in WLED state presets (LIGHTING, RED)
├── dist/                   # Compiled JavaScript (git-ignored)
├── web/                    # React dashboard (TypeScript + Vite)
│   ├── src/
│   │   ├── pages/          # Route-level page components
│   │   ├── components/     # Shared UI components
│   │   ├── api.ts          # Frontend API client
│   │   └── App.tsx         # Router and routes
│   └── public/             # Static assets
├── web-dist/               # Built React app (served by Express, git-ignored)
├── audio/                  # MP3 sound effects
├── video/                  # Video files (git-ignored)
│   └── PauHanaVideoLoop.mp4
├── pauhana.service         # systemd service file (deploy to /etc/systemd/system/)
├── pauhana-video.service   # systemd video service file
├── deploy.sh               # Main deployment automation
└── deploy-video.sh         # Video system deployment
```

### Runtime Data Files

These files are written at runtime and are git-ignored. They live at the project root on the Pi and persist across restarts. The deploy script explicitly excludes them from rsync so they are never overwritten on deploy.

| File | Written by | Contents |
|------|-----------|----------|
| `event-settings.json` | `eventSettings.ts` | STORM/ERUPTION config: volume, duration, seek time, enabled, WLED device assignments |
| `effect-library.json` | `effectLibrary.ts` | Named WLED state snapshots with capturedFromIp and capturedAt |
| `wled-devices.json` | `wled.ts` | Last known WLED devices `[{ip, name}]` — fallback for offline devices |

### Entry Point Flow

`src/main.ts` initializes all systems in order:
1. Validates environment variables (via `config.ts`)
2. Starts Express API server (via `api.ts`)
3. Sets up GPIO button listener (Linux only)
4. Discovers WLED devices on the network
5. Starts random event scheduler

### Event System

Events are coordinated through `effectController.ts` which:
- Prevents overlapping events (uses `eventHappening` flag)
- Checks if the event type is enabled in `eventSettings`
- Runs `pauhanaWLED.discover()` before each event to refresh device list
- Triggers event-specific functions (`summonStorm()`, `startEruption()`)

Event implementations (`storm.ts`, `eruption.ts`) follow this pattern:
1. Seek video to event timestamp (configurable via event settings)
2. Assign WLED devices to zones using names from event settings
3. Snapshot current Sonos state (volume, track, position, queue)
4. Fade volume down → play sound effect → trigger WLED effects
5. Wait for duration (from event settings)
6. Restore Sonos track/position and fade volume back
7. `pauhanaWLED.reset()` runs in a `finally` block to guarantee state restoration

### Event Configuration (`eventSettings.ts`)

Runtime config stored in `event-settings.json`. Each event has:
- `volume` — target audio volume (0–100)
- `durationSec` — how long the event runs
- `videoSeekTime` — timestamp to seek to (`"MM:SS"` or `null`)
- `enabled` — whether the event can be triggered
- `wled.devices` — array of `{name, effect}` device assignments

Old format (pre-wled-assignments) is auto-migrated via `migrateWLED()` on load.

### Effect Library (`effectLibrary.ts`)

WLED state snapshots stored in `effect-library.json`:
- Effects are captured from a live WLED device at a specific IP
- `capturedFromIp` tracks which device an effect came from — the Events config page filters the effect dropdown to only show compatible effects (matching IP or built-in)
- Built-in effects (`LIGHTING`, `RED`) are seeded from `src/json/wledStates.ts` on first run
- Effects with segment data (start/stop/len) are hardware-specific to the device they were captured from

### WLED Controller (`wled.ts`)

- `PauHanaWLED` class manages multiple WLED devices
- `discover()`: Network scan, merges fresh results with stored fallback **by IP** (not name) to prevent stale-named duplicates
- `persistDevices()`: Saves current device list to `wled-devices.json`
- `assignZones()`: Maps device names to zones (volcano, storm, ambient)
- `saveSnapshot()` / `reset()`: Capture and restore device state around events
- Device rename cascades to event settings via `updateEventSetting()`

### Hardware Controllers

**Sonos** (`sonos.ts`): Two speakers (main + secondary). `snapshotSonos()` captures volume/state/track, `fadeVolume()` does smooth transitions, `playEffect()` handles fade-down → play → fade-up.

**Video** (`video.ts`): Controls mpv via JSON-RPC IPC socket at `/tmp/mpv-socket`. `seekVideo()` supports MM:SS and HH:MM:SS formats. Non-blocking — errors don't interrupt events.

**GPIO Button** (`button.ts`): Monitors GPIO 516 via `onoff` library. Debounced. Linux-only — skips gracefully on macOS.

**Philips Hue** (`hue.ts`): Implemented but commented out in storm/eruption.

### Random Event Scheduler

`randomEventScheduler.ts`:
- Waits 30–90 minutes (configurable in `constants.ts`)
- Checks if Sonos is playing
- Filters to only **enabled** event types before picking randomly — disabled events are never selected
- Schedules the next check regardless of outcome
- Resets on manual event triggers to prevent back-to-back events

### API Endpoints

Protected endpoints require `X-API-Key` header.

**Public:**
- `GET /` — React dashboard
- `GET /health` — System status, Sonos state, current track with album art
- `GET /audio/*` — Static audio files

**Event Triggers:**
- `POST /storm` — Trigger storm (409 if active)
- `POST /erupt` — Trigger eruption (409 if active)

**Video:**
- `POST /video/play` / `POST /video/pause`
- `POST /video/seek` — body: `{timestamp: "MM:SS"}`
- `GET /video/position` — current position in seconds
- `GET /video/display` — display power state (reflects `pauhana-video.service` active status)
- `POST /video/display` — body: `{on: boolean}` — starts/stops `pauhana-video.service` via sudo

**WLED:**
- `GET /wled/devices` — list known devices
- `POST /wled/discover` — scan network
- `GET /wled/devices/:ip/info` — device info (LED count, brightness, firmware, WiFi signal)
- `POST /wled/devices/:ip/power` — body: `{on: boolean}`
- `POST /wled/devices/:ip/rename` — body: `{name: string}` — cascades to event settings

**Events Config:**
- `GET /events` — all event settings
- `PATCH /events/:type` — update STORM or ERUPTION settings

**Effect Library:**
- `GET /effects` — all effects
- `POST /effects` — capture from device: body `{name, ip}`
- `PATCH /effects/:name` — rename or re-capture: body `{name?, ip?}` — cascades effect name to event settings
- `DELETE /effects/:name`

**Settings:**
- `GET /settings/random-events` — enabled state + next event timestamp
- `POST /settings/random-events` — body: `{enabled: boolean}`

**Logs:**
- `GET /logs?lines=N` — last N lines (max 500)

### React Dashboard

**Routes:**
- `/` — Home: system status, Sonos playback, event trigger buttons
- `/admin` — Admin: video controls, settings, WLED summary, event config summary, logs
- `/wled` — WLED Config: device cards, effect library
- `/admin/events` — Events Config: per-event settings, WLED device assignments

**Admin Page Components:**
- `VideoControls` — play/pause/seek, position display, display on/off toggle
- `SystemSettings` — random events toggle, countdown to next event
- `WLEDDevices` — device list, all-lights toggle, link to `/wled`
- `EventConfig` — event status, quick trigger buttons, link to `/admin/events`
- `SystemLogs` — terminal-style log viewer with auto-scroll

**WLED Config Page Components:**
- `DeviceCard` — per-device power toggle, inline rename, LED count, firmware, WiFi signal
- `EffectLibrarySection` — capture effects from live devices, rename/re-capture/delete, shows `capturedFromIp`

**Events Config Page:**
- Per-event card with: enabled toggle, volume, duration, video seek time
- WLED device assignment: pick device + compatible effect (filtered by `capturedFromIp`)
- Effect dropdown only shows effects captured from the same device IP (or built-ins)

**Dev Environment:**
```bash
cd web && npm run dev   # Vite dev server on port 5173
```
Create `web/.env.development.local` with `BACKEND_URL=http://pauhana-pi.local:9001` to proxy to the Pi.

## Configuration

### Environment Variables (`.env` in project root)

```
API_KEY=your-api-key-here
SONOS_MAIN_IP=192.168.1.x
SONOS_SECONDARY_IP=192.168.1.y
HUE_BRIDGE_IP=192.168.1.z
HUE_USERNAME=your-hue-api-username
```

### React Dashboard (`web/.env`)

```
VITE_API_KEY=your-api-key-here
```

### Constants (`src/common/constants.ts`)

- `MIN_EVENT_INTERVAL_MINUTES`, `MAX_EVENT_INTERVAL_MINUTES` — random event timing
- `SONOS_STEPS` — volume fade smoothness
- `EVENTS` — event URIs and log messages

Event volumes and durations are **runtime-configurable** via the Events Config page (stored in `event-settings.json`), not hardcoded constants.

## Video Playback System

- **File:** `video/PauHanaVideoLoop.mp4` (git-ignored, ~1.7GB)
- **Output:** DRM/KMS direct to HDMI (no desktop environment needed)
- **IPC:** `/tmp/mpv-socket` for JSON-RPC control
- **Display control:** Start/stop `pauhana-video.service` — `vcgencmd` does not work while mpv holds the DRM device

```bash
# One-time setup
./deploy-video.sh pauhana-pi.local

# Update video file only
./deploy-video-update.sh pauhana-pi.local

# Service management
sudo systemctl status pauhana-video
sudo systemctl restart pauhana-video
```

## Development Notes

- **TypeScript strict mode** with ES modules (`.js` extensions in imports required for Node.js ESM)
- **ES2022 target**
- **No inline styles** in React components — all styles go in `App.css` as semantic class names
- **Promise.allSettled()** for any operation targeting multiple WLED devices simultaneously
- **Events are fire-and-forget** from the API (HTTP response does not wait for event to complete)
- **WLED reset runs in `finally`** in storm/eruption to guarantee state restoration even if Sonos throws
- **Effect compatibility:** Effects capture full WLED segment state including LED counts — applying an effect to a device with different segment layout will produce incorrect results
- **Hue lightning effects** are implemented but disabled (commented out in storm.ts and eruption.ts)
- **nginx** proxies port 80 → Node.js port 9001
