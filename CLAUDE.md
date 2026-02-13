# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pau Hana Media is a Node.js event orchestration system for a tiki bar environment that synchronizes audio, lighting, and visual effects. It runs on a Raspberry Pi and controls Sonos speakers, WLED LED strips, and Philips Hue lights to create immersive experiences like thunderstorms and volcano eruptions.

## Running the Application

```bash
# Start the application
npm start

# This runs: node src/main.js
# The server will listen on port 9001
```

## Architecture

### Entry Point Flow
- `src/main.js` initializes all systems:
  1. Starts Express API server (via `api.js`)
  2. Sets up GPIO button listener
  3. Discovers WLED devices on the network
  4. Starts random event scheduler

### Event System
Events are coordinated through `effectController.js` which:
- Prevents overlapping events (uses `eventHappening` flag)
- Triggers event-specific functions (`summonStorm()`, `startEruption()`)
- Discovers WLED devices before each event
- Handles errors and cleanup via try/finally

Event implementations (`storm.js`, `eruption.js`) follow this pattern:
1. Assign WLED devices to zones (storm/volcano)
2. Snapshot current Sonos state (volume, track, position, queue)
3. Fade volume down to 1
4. Play sound effect at target volume
5. Trigger lighting effects
6. Wait for effect duration
7. Restore original track/position and fade volume back

### Hardware Controllers

**Sonos** (`sonos.js`):
- Controls two Sonos speakers (main + secondary)
- `snapshotSonos()`: Captures volume, playback state, current track position/queue
- `fadeVolume()`: Smooth volume transitions in steps (defined by `SONOS_STEPS`)
- `playEffect()`: Handles the fade-down → play → fade-up sequence

**WLED** (`wled.js`):
- `PauHanaWLED` class manages multiple WLED devices
- `discover()`: Network scan via HTTP to find all WLED controllers on subnet
- `assignZones()`: Maps devices to zones (volcano, storm, ambient) by name
- `saveSnapshot()`: Captures current state of all devices before effects
- `reset()`: Restores saved snapshot after event completes
- Zone-based control allows different devices for different effects

**Philips Hue** (`hue.js`):
- Direct HTTP control of bridge
- Used for lightning flash effects (currently commented out in storm/eruption)

**GPIO Button** (`button.js`):
- Uses `onoff` library to monitor GPIO 516
- Debounced button press triggers storm event

### API Endpoints

All endpoints except `/audio/*` and `/health` require `X-API-Key` header (checked by middleware).

- `GET /health` - Returns system status, storm state, and current Sonos info
- `POST /storm` - Triggers storm event (409 if event already active)
- `POST /erupt` - Triggers volcano eruption (409 if event already active)
- `GET /logs?lines=N` - Returns last N lines of logs (max 500)
- `GET /audio/*` - Serves static audio files (no auth required)

### Random Event Scheduler

`randomEventScheduler.js` creates a recursive random delay loop:
- Waits 30-90 minutes (configurable in `constants.js`)
- Checks if Sonos is playing music
- If playing, randomly picks STORM or ERUPTION
- Schedules next check regardless of outcome

### Network Discovery

`utils/discoverWLED.js` performs subnet scanning:
- Gets local subnet from network interfaces (`getLocalSubnet.js`)
- Scans all 254 IPs concurrently (50 at a time via `p-map`)
- Identifies WLED devices by checking for `/json` endpoint with version field
- Returns array of `{ip, name}` objects

## Configuration

Create a `.env` file with:
```
API_KEY=your-api-key-here
SONOS_MAIN_IP=192.168.1.x
SONOS_SECONDARY_IP=192.168.1.y
HUE_BRIDGE_IP=192.168.1.z
HUE_USERNAME=your-hue-api-username
```

Constants in `src/common/constants.js`:
- `STORM_VOLUME`, `ERUPTION_VOLUME`: Target volumes for events
- `MIN_EVENT_INTERVAL_MINUTES`, `MAX_EVENT_INTERVAL_MINUTES`: Random event timing
- `SONOS_STEPS`: Number of steps for volume fade smoothness
- `EVENTS`: Event definitions with URIs, logging messages

Audio files: Place MP3 files in `audio/` directory. Currently expects:
- `thunderstorm.mp3`
- `eruption.mp3`

WLED presets: `src/json/wledStates.js` contains JSON state objects for effects (LIGHTING, RED).

## Development Notes

- Uses ESM modules (import/export), not CommonJS
- No test suite currently configured
- Designed for Raspberry Pi deployment (GPIO dependencies)
- WLED discovery requires devices to be on same subnet
- Events are fire-and-forget from API (don't block HTTP responses)
- Volume fades and track restoration ensure smooth user experience
- Hue lightning effects are implemented but currently disabled (commented out in storm.js:30-32 and eruption.js:30-32)
