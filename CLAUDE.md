# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pau Hana Media is a TypeScript-based Node.js event orchestration system for a tiki bar environment that synchronizes audio, lighting, video, and visual effects. It runs on a Raspberry Pi and controls Sonos speakers, WLED LED strips, Philips Hue lights, and video playback to create immersive experiences like thunderstorms and volcano eruptions. Includes a React web dashboard for monitoring and control.

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
- Ensures broken code never enters git history

**Pre-deployment**:
- `deploy.sh` runs tests before deploying
- Deployment is blocked if tests fail
- Prevents deploying broken code to production

### Writing Tests

Follow the **Arrange-Act-Assert** pattern:

```typescript
it('should return false for invalid event types', async () => {
  // Arrange: Set up test data
  const invalidType = 'INVALID_EVENT';

  // Act: Execute the function
  const result = await triggerEvent(invalidType);

  // Assert: Verify the outcome
  expect(result).toBe(false);
});
```

**Best Practices:**
- Test behavior, not implementation
- Use descriptive test names
- Keep tests fast (< 10ms for unit tests)
- Mock hardware dependencies for unit tests
- Skip integration tests by default

## Deployment

The project includes automated deployment scripts:

- **deploy.sh**: Full deployment (build, sync, install deps, restart service)
- **quick-deploy.sh**: Quick deployment (build, sync, restart only)
- **deploy-video.sh**: Video system deployment (installs mpv, syncs video file, sets up autoplay)

Deploys to: `kyle@pauhana-pi.local:/home/kyle/pauhana-media`

The system runs as two systemd services:

- **pauhana.service**: Main orchestration service (Node.js app on port 9001)
  - **Note**: `PrivateTmp` is disabled to allow IPC socket communication with video service
- **pauhana-video.service**: Video playback service (mpv with DRM/KMS output to HDMI)

The app is accessible at:

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
│   ├── video.ts      # Video playback control (mpv IPC)
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
├── video/            # Video files (git-ignored)
│   └── PauHanaVideoLoop.mp4  # Hour-long looping video
├── deploy.sh         # Main deployment automation
└── deploy-video.sh   # Video system deployment
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

1. Seek video to event timestamp (e.g., eruption seeks to 30:41)
2. Assign WLED devices to zones (storm/volcano)
3. Snapshot current Sonos state (volume, track, position, queue)
4. Fade volume down to 1
5. Play sound effect at target volume
6. Trigger lighting effects
7. Wait for effect duration
8. Restore original track/position and fade volume back

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

**Video Playback** (`video.ts`):

- Controls mpv video player via JSON-RPC IPC socket (`/tmp/mpv-socket`)
- `seekVideo(timestamp)`: Jumps to specific time in video (supports "MM:SS" or "HH:MM:SS" format)
- `pauseVideo()` / `playVideo()`: Control playback state
- `getVideoPosition()`: Query current playback position
- Non-blocking: Video control errors are logged but don't interrupt events
- Runs as separate systemd service (`pauhana-video.service`) using mpv with DRM/KMS output

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
- `POST /video/play` - Resume video playback
- `POST /video/pause` - Pause video playback
- `POST /video/seek` - Seek video to timestamp (body: `{timestamp: "MM:SS"}`)
- `GET /video/position` - Get current video position in seconds
- `GET /settings/random-events` - Get random events state (enabled, nextEventTime)
- `POST /settings/random-events` - Enable/disable random events (body: `{enabled: boolean}`)

### React Dashboard

Located in `web/` directory, built with React + TypeScript + Vite. Uses React Router v7 for multi-page navigation.

**Routes:**

- `/` - Public home page (system status, Sonos info, event triggers)
- `/admin` - Admin page (video controls, settings, logs) - hidden from main navigation

**Public Home Page Features:**

- Real-time system status (polls `/health` every 5 seconds)
- Live Sonos playback info with album artwork
- Event trigger buttons (Storm, Eruption)
- Tiki bar themed styling

**Admin Page Features (`/admin`):**

- **Video Controls:**
  - Current playback position display
  - Play/Pause buttons
  - Manual seek input (MM:SS or HH:MM:SS format)
  - Quick seek buttons (Start 0:00, Eruption 30:41)
  - Video position updates every 5 seconds

- **System Settings:**
  - Random Events toggle (enable/disable automatic events)
  - Live countdown timer to next random event (updates every second)
  - Auto-refreshes next event time every 30 seconds
  - Shows "Disabled", "Calculating...", or live countdown (e.g., "45m 32s")

- **System Logs Viewer:**
  - Line count selector (50/100/200/500 lines)
  - Manual refresh button
  - Auto-refresh toggle (updates every 5 seconds)
  - Terminal-style display (black background, green text, monospace font)
  - Scrollable container with custom themed scrollbar
  - Error handling with retry capability

**Development:**

```bash
cd web
npm run dev    # Starts Vite dev server on port 5173 with proxy
```

**Production Build:**

```bash
npm run build:web   # Builds to ../web-dist/
```

The Express server serves the built React app from `web-dist/` at the root path with a catch-all route to support React Router client-side routing. Album art URLs are constructed on the backend to point directly to the Sonos speaker's HTTP endpoint.

### Random Event Scheduler

`randomEventScheduler.ts` creates a recursive random delay loop:

- Waits 30-90 minutes (configurable in `constants.ts`)
- Checks if Sonos is playing music
- If playing, randomly picks STORM or ERUPTION
- Schedules next check regardless of outcome
- Can be enabled/disabled via API (`/settings/random-events`)
- Tracks exact timestamp of next scheduled event
- Provides `getNextEventTime()` for countdown display in admin UI

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

## Video Playback System

The system includes synchronized video playback on HDMI display using mpv player.

### Video Setup

**Video File:**
- Location: `video/PauHanaVideoLoop.mp4` (1.7GB, hour-long loop, git-ignored)
- Content: Day/night cycle with storm and volcano eruption scenes
- Plays continuously in fullscreen on HDMI output

**Initial Deployment:**
```bash
./deploy-video.sh pauhana-pi.local
```

This script (one-time setup):
1. Installs mpv media player
2. Syncs large video file via rsync
3. Sets up systemd service for autoplay on boot
4. Configures mpv with IPC socket for remote control

**Updating Video File:**
```bash
# 1. Replace video locally: video/PauHanaVideoLoop.mp4
# 2. Deploy the update
./deploy-video-update.sh pauhana-pi.local
```

This script (for video updates):
1. Syncs new video file via rsync (with progress)
2. Restarts video service to load new file
3. Shows service status

Much faster than initial deployment - only syncs the video file!

### Video Control

**mpv Configuration:**
- Output: DRM/KMS (direct framebuffer, no X11/desktop needed)
- IPC Socket: `/tmp/mpv-socket` (JSON-RPC interface)
- Auto-start: Enabled via systemd on boot
- Looping: Infinite loop

**Video Synchronization:**
- Eruption effect: Video seeks to 30:41 (volcano scene)
- Storm effect: Currently not synchronized (could be added)

**Control Commands:**
```bash
# Service management
sudo systemctl status pauhana-video
sudo systemctl restart pauhana-video
sudo systemctl stop pauhana-video

# View logs
sudo journalctl -u pauhana-video -f
```

**Manual Video Control (via socket):**
```javascript
// Seek to timestamp
await seekVideo("30:41");  // MM:SS format
await seekVideo("1:30:41");  // HH:MM:SS format
await seekVideo(1841);  // Seconds

// Playback control
await pauseVideo();
await playVideo();

// Query position
const position = await getVideoPosition();  // Returns seconds
```

### Important Notes

- Video file is excluded from git due to size (1.7GB)
- `PrivateTmp=true` is disabled in `pauhana.service` to allow socket communication
- Video control is non-blocking and errors don't interrupt events
- mpv runs as user `kyle` for socket permission compatibility

## Development Notes

- **TypeScript with strict mode** - Full type safety throughout codebase
- **ES modules** (import/export with .js extensions in imports - required for Node.js ESM)
- **Target: ES2022** - Compiled JavaScript uses modern features
- **Custom type definitions** - `src/types/sonos.d.ts` provides types for the Sonos library (no official types available)
- **Vitest testing framework** - Fast unit tests with hardware integration tests (skipped by default)
- **Platform-aware GPIO** - Button initialization gracefully skips on non-Linux systems
- **Designed for Raspberry Pi** deployment with systemd service
- **WLED discovery** requires devices to be on same subnet
- **Events are fire-and-forget** from API (don't block HTTP responses)
- **Volume fades and track restoration** ensure smooth user experience
- **Hue lightning effects** are implemented but currently disabled (commented out in storm.ts:30-32 and eruption.ts:30-32)
- **Video files** in `video/` directory are git-ignored due to size
- **mpv video player** uses DRM/KMS for direct HDMI output without desktop environment
- **IPC socket communication** requires `PrivateTmp=false` in pauhana.service for shared `/tmp` access
- **nginx reverse proxy** runs on port 80 and forwards to Node.js on port 9001
- **Custom local DNS** via Pi-hole resolves `pauhana.tiki` to the Raspberry Pi
