# 🍹 Pau Hana Media

A TypeScript-based event orchestration system for creating immersive tiki bar experiences. Synchronizes audio, lighting, video, and visual effects across multiple devices to transform your space into an interactive tropical paradise.

## ✨ Features

### Immersive Events
- **🌩️ Thunderstorm**: Dramatic storm effects with lightning, thunder sounds, and synchronized lighting
- **🌋 Volcano Eruption**: Explosive volcano sequence with rumbling audio and red glowing lights
- **🎬 Video Synchronization**: HDMI video output syncs with events (volcano erupts on screen during eruption)
- **🎵 Smart Audio**: Automatically fades music during events and seamlessly resumes playback

### Web Dashboard
- **Public Home Page** (`/`)
  - Real-time system status monitoring
  - Live Sonos playback info with album artwork
  - Manual event trigger buttons
  - Tiki-themed responsive design

- **Admin Control Panel** (`/admin`)
  - Video playback controls (play, pause, seek with timestamp input)
  - Random events toggle with live countdown timer
  - System logs viewer (50-500 lines, auto-refresh, terminal-style)
  - Settings management

### Automation
- **Random Event Scheduler**: Automatically triggers events at random intervals when music is playing
- **Smart Detection**: Only triggers events when the bar is active (Sonos is playing)
- **Configurable Intervals**: Set minimum and maximum time between events (default: 30-90 minutes)
- **Enable/Disable**: Toggle automatic events on/off via admin panel

### Hardware Integration
- **Sonos Speakers**: Multi-room audio control with volume fading and track restoration
- **WLED LED Strips**: Network-controlled RGB lighting with automatic device discovery
- **Philips Hue Lights**: Smart bulb control (lightning flash effects - currently disabled)
- **GPIO Button**: Physical button trigger for instant storm activation
- **HDMI Video Output**: Full-screen looping video with synchronized event scenes

## 🛠️ Hardware Requirements

### Required
- **Raspberry Pi** (tested on Pi 4, any model with GPIO should work)
- **Sonos Speakers** (at least one, supports multiple zones)
- **HDMI Display** (for video output)
- **Network Connection** (all devices must be on the same subnet)

### Optional
- **WLED Controllers** (for smart LED strip effects)
- **Philips Hue Bridge + Bulbs** (for additional lighting)
- **Physical Button** (connected to GPIO for manual triggers)

## 📦 Installation

### Prerequisites

```bash
# On your development machine
node -v  # Requires Node.js 18+ (20 or 22 recommended)
npm -v   # Requires npm 10+

# On Raspberry Pi
# Ensure SSH is enabled
# Ensure hostname is set (e.g., pauhana-pi.local)
```

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd pauhana-media
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd web && npm install && cd ..
   ```

3. **Configure environment variables**

   Create `.env` in project root:
   ```env
   API_KEY=your-secure-api-key-here
   SONOS_MAIN_IP=192.168.1.x
   SONOS_SECONDARY_IP=192.168.1.y  # Optional
   HUE_BRIDGE_IP=192.168.1.z       # Optional
   HUE_USERNAME=your-hue-username  # Optional
   ```

   Create `web/.env`:
   ```env
   VITE_API_KEY=your-secure-api-key-here
   ```

4. **Add audio files**

   Place your sound effect MP3 files in the `audio/` directory:
   - `thunderstorm.mp3` - Thunder and rain sounds
   - `eruption.mp3` - Volcano eruption sounds

5. **Add video file** (optional)

   Place your looping video in the `video/` directory:
   - `PauHanaVideoLoop.mp4` - Hour-long ambient video with event scenes
   - Should include: day/night cycle, storm scene, volcano eruption scene

## 🚀 Usage

### Development

```bash
# Start backend in development mode (with auto-reload)
npm run dev

# Start React dashboard in development mode
npm run dev:web

# Run tests
npm test              # Watch mode
npm run test:run      # Run once and exit
npm run test:ui       # Visual test runner
```

### Production

```bash
# Build TypeScript backend + React frontend
npm run build

# Start the application
npm start

# The server will run on port 9001
```

Access the dashboard at:
- http://localhost:9001 (home page)
- http://localhost:9001/admin (admin panel)

### Deployment to Raspberry Pi

#### First-Time Setup

1. **Deploy the main application**
   ```bash
   # Full deployment (installs dependencies, restarts services)
   npm run deploy

   # Or with custom hostname
   ./deploy.sh pauhana-pi.local
   ```

2. **Deploy video system** (one-time setup)
   ```bash
   ./deploy-video.sh pauhana-pi.local
   ```

   This installs mpv, configures systemd, and syncs the video file.

#### Updates

```bash
# Quick deployment (no dependency install)
npm run deploy:quick

# Update video file only
./deploy-video-update.sh pauhana-pi.local
```

#### Service Management

On the Raspberry Pi:

```bash
# Check service status
sudo systemctl status pauhana
sudo systemctl status pauhana-video

# View logs
sudo journalctl -u pauhana -f
sudo journalctl -u pauhana-video -f

# Restart services
sudo systemctl restart pauhana
sudo systemctl restart pauhana-video
```

## 🎮 Using the Dashboard

### Home Page (`/`)

**System Status Card**
- Shows if events are currently active
- Displays system health

**Sonos Playback Card**
- Live track info (artist, title, album)
- Album artwork
- Playback state (playing/paused/stopped)
- Current volume level

**Event Controls Card**
- Manual trigger buttons for Storm and Eruption
- Prevents triggering when another event is active

### Admin Panel (`/admin`)

**Video Controls**
- See current video position
- Play/Pause video playback
- Seek to specific timestamp (e.g., "30:41" or "1:30:41")
- Quick seek buttons for key scenes

**System Settings**
- Toggle automatic random events on/off
- Live countdown to next scheduled event
- Shows "Disabled" when random events are off
- Shows time remaining (e.g., "45m 32s")

**System Logs**
- View last 50-500 lines of system logs
- Manual refresh or auto-refresh (every 5 seconds)
- Terminal-style display with green text
- Scrollable with custom themed scrollbar

## ⚙️ Configuration

### Event Timing

Edit `src/common/constants.ts`:

```typescript
export const MIN_EVENT_INTERVAL_MINUTES = 30;  // Minimum wait time
export const MAX_EVENT_INTERVAL_MINUTES = 90;  // Maximum wait time
export const STORM_VOLUME = 50;                // Storm sound volume
export const ERUPTION_VOLUME = 40;             // Eruption sound volume
export const SONOS_STEPS = 20;                 // Volume fade smoothness
```

### WLED Device Zones

WLED devices are automatically discovered and assigned to zones by name:

```typescript
// In src/wled.ts assignZones() method
zones: {
  volcano: ['WLED-Volcano'],       // Devices for volcano effects
  storm: ['WLED-Storm', 'WLED-Ambient'],  // Devices for storm effects
  // Customize based on your device names
}
```

### Video Timestamps

Synchronize video with events in `src/eruption.ts` and `src/storm.ts`:

```typescript
// Eruption seeks to volcano scene at 30:41
await seekVideo("30:41");

// Add storm video sync (currently not implemented)
await seekVideo("15:20");  // Storm scene timestamp
```

### GPIO Button Pin

Default GPIO pin is 516 (GPIO4). Change in `src/button.ts`:

```typescript
const GPIO_PIN = 516;  // Change to your wired pin number
```

## 🔌 API Reference

### Public Endpoints

- `GET /` - Serves React dashboard
- `GET /health` - System status and Sonos info
- `GET /audio/*` - Static audio file serving

### Protected Endpoints (require `X-API-Key` header)

**Events**
- `POST /storm` - Trigger storm event
- `POST /erupt` - Trigger volcano eruption

**Video Control**
- `POST /video/play` - Resume video
- `POST /video/pause` - Pause video
- `POST /video/seek` - Seek to timestamp
  ```json
  {"timestamp": "30:41"}  // or "1:30:41"
  ```
- `GET /video/position` - Get current position (seconds)

**Settings**
- `GET /settings/random-events` - Get random events state
  ```json
  {"ok": true, "enabled": true, "nextEventTime": 1234567890}
  ```
- `POST /settings/random-events` - Enable/disable random events
  ```json
  {"enabled": true}
  ```

**System**
- `GET /logs?lines=100` - Get system logs (max 500 lines)

## 🧪 Testing

```bash
# Run all tests in watch mode
npm test

# Run tests once (for CI/CD)
npm run test:run

# Open visual test UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

Tests run automatically before:
- Every git commit (via Husky pre-commit hook)
- Every deployment (via deploy.sh)

Integration tests (hardware-dependent) are skipped by default. Run manually on the Pi when needed.

## 📁 Project Structure

```
pauhana-media/
├── src/                      # TypeScript source
│   ├── main.ts               # Application entry point
│   ├── api.ts                # Express server + API routes
│   ├── effectController.ts   # Event orchestration
│   ├── storm.ts              # Storm event implementation
│   ├── eruption.ts           # Eruption event implementation
│   ├── sonos.ts              # Sonos speaker control
│   ├── wled.ts               # WLED lighting control
│   ├── hue.ts                # Philips Hue control
│   ├── video.ts              # Video playback control (mpv IPC)
│   ├── button.ts             # GPIO button handler
│   ├── randomEventScheduler.ts  # Automated event scheduling
│   ├── config.ts             # Environment validation
│   ├── logs.ts               # System logs handler
│   ├── types/                # TypeScript type definitions
│   ├── common/               # Constants and helpers
│   └── utils/                # WLED discovery utilities
├── web/                      # React dashboard
│   ├── src/
│   │   ├── App.tsx           # Router setup
│   │   ├── pages/
│   │   │   ├── Home.tsx      # Public home page
│   │   │   └── Admin.tsx     # Admin control panel
│   │   ├── api.ts            # API client functions
│   │   └── App.css           # Tiki-themed styles
│   ├── public/               # Static assets
│   └── package.json
├── dist/                     # Compiled JavaScript (git-ignored)
├── web-dist/                 # Built React app (served by Express)
├── audio/                    # Sound effect MP3 files
├── video/                    # Video files (git-ignored, 1.7GB)
├── deploy.sh                 # Main deployment script
├── deploy-video.sh           # Video system setup script
├── deploy-video-update.sh    # Quick video file update
├── .env                      # Backend environment variables
└── web/.env                  # Frontend environment variables
```

## 🐛 Troubleshooting

### Video Won't Play After Reboot

```bash
# Check video service status
sudo systemctl status pauhana-video

# Restart video service
sudo systemctl restart pauhana-video

# View logs for errors
sudo journalctl -u pauhana-video -n 50
```

### WLED Devices Not Discovered

- Ensure all WLED devices are on the same subnet as the Pi
- Check WLED timeout setting in `src/utils/discoverWLED.ts` (default: 2000ms)
- Verify devices are powered on and connected to WiFi
- Test manually: `curl http://192.168.x.x/json`

### Sonos Not Responding

- Verify Sonos IP addresses in `.env` are correct
- Check network connectivity: `ping 192.168.x.x`
- Ensure Sonos speakers are powered on
- Try accessing Sonos HTTP endpoint: `http://192.168.x.x:1400/`

### Random Events Not Triggering

- Check if random events are enabled in admin panel (`/admin`)
- Verify Sonos is actively playing music
- Check event interval settings in `src/common/constants.ts`
- View scheduler logs: `sudo journalctl -u pauhana -f | grep "event"`

### 502 Bad Gateway

- Check if Node.js service is running: `sudo systemctl status pauhana`
- View error logs: `sudo journalctl -u pauhana -n 50`
- Restart service: `sudo systemctl restart pauhana`
- Verify port 9001 is accessible: `curl http://localhost:9001/health`

### Permission Denied on /tmp/mpv-socket

- Ensure `PrivateTmp=false` in `/etc/systemd/system/pauhana.service`
- Check socket exists: `ls -la /tmp/mpv-socket`
- Verify both services run as same user (kyle)
- Reload systemd: `sudo systemctl daemon-reload`

## 📝 Development Notes

- **TypeScript with strict mode** for full type safety
- **ES modules** (import/export, .js extensions in TypeScript imports)
- **Target: ES2022** for modern JavaScript features
- **Vitest** for fast, modern testing
- **React Router v7** for client-side routing
- **Express catch-all route** supports React Router SPA routing
- **Platform-aware**: GPIO gracefully skips on non-Linux systems
- **Non-blocking video control**: Errors logged but don't interrupt events
- **IPC socket communication** for mpv video control
- **Automatic network discovery** for WLED devices

## 🤝 Contributing

This is a personal project, but contributions are welcome! Key areas:

- Add more event types (lightning storm, sunrise, sunset)
- Implement Hue lightning effects (currently commented out)
- Add authentication to admin panel
- Create event scheduling UI (set specific times for events)
- Add more video synchronization points
- Support for additional lighting systems

## 📄 License

MIT License - feel free to use this project for your own tiki bar!

## 🙏 Acknowledgments

- Built with TypeScript, Node.js, React, and Express
- Uses mpv for video playback
- Integrates with Sonos, WLED, and Philips Hue ecosystems
- Inspired by the need for immersive tiki bar experiences

---

**Made with 🍹 for Pau Hana Lounge**

*Pau Hana (Hawaiian): Happy hour, the time after work to relax and enjoy life*
