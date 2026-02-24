import path from "path";
import { fileURLToPath } from "url";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { triggerEvent, isEventHappening } from "./effectController.js";
import { getLogs } from "./logs.js";
import { snapshotSonos } from "./sonos.js";
import { config } from "./config.js";
import { seekVideo, pauseVideo, playVideo, getVideoPosition } from "./video.js";
import { isRandomEventsEnabled, enableRandomEvents, disableRandomEvents } from "./randomEventScheduler.js";

const app = express();
const API_KEY = config.apiKey;

// Enable CORS only in development (when accessed from Vite dev server)
// In production, nginx proxy makes all requests same-origin, so CORS not needed
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:9001'],
    credentials: true,
  }));
}

app.use(express.json());

// Custom middleware function to check headers
app.use((req: Request, res: Response, next: NextFunction): void => {
  // Only check API key for protected API routes
  const isProtectedRoute = req.path.startsWith("/storm") || req.path.startsWith("/erupt") || req.path.startsWith("/logs") || req.path.startsWith("/video") || req.path.startsWith("/settings");

  if (isProtectedRoute && req.headers["x-api-key"] !== API_KEY) {
    res.status(403).json({ ok: false });
    return;
  }

  // Allow all other routes (health, audio, dashboard)
  next();
});

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve audio files
const AUDIO_DIR = path.join(__dirname, "../audio");
console.log("Serving audio from:", AUDIO_DIR);
app.use("/audio", express.static(AUDIO_DIR));

// Serve React dashboard (production)
const WEB_DIR = path.join(__dirname, "../web-dist");
app.use(express.static(WEB_DIR));

// Health check
app.get("/health", async (_req: Request, res: Response) => {
  const stormActive = isEventHappening();
  const snap = await snapshotSonos();

  // Construct full album art URL from Sonos
  let albumArtURL = null;
  if (snap.track?.albumArtURI) {
    // If it's a relative URL, prepend the Sonos speaker IP
    if (snap.track.albumArtURI.startsWith('/')) {
      albumArtURL = `http://${config.sonos.mainIp}:1400${snap.track.albumArtURI}`;
    } else {
      albumArtURL = snap.track.albumArtURI;
    }
  }

  res.json({
    status: "ok",
    stormActive,
    sonos: {
      state: snap.state,
      volume: snap.volume,
      track: snap.track ? {
        artist: snap.track.artist,
        title: snap.track.title,
        album: snap.track.album,
        albumArtURI: albumArtURL,
      } : null,
    },
  });
});

// Trigger storm
app.post("/storm", async (_req: Request, res: Response): Promise<void> => {
  if (isEventHappening()) {
    res.status(409).json({
      ok: false,
      message: "An event is already active",
    });
    return;
  }

  // Fire-and-forget (don't block HTTP)
  triggerEvent("STORM");

  res.json({
    ok: true,
    message: "Storm summoned",
  });
});

// Trigger eruption
app.post("/erupt", async (_req: Request, res: Response): Promise<void> => {
  if (isEventHappening()) {
    res.status(409).json({
      ok: false,
      message: "An event is already active",
    });
    return;
  }

  // Fire-and-forget (don't block HTTP)
  triggerEvent("ERUPTION");

  res.json({
    ok: true,
    message: "Volcano eruption started",
  });
});

app.get("/logs", async (req: Request, res: Response) => {
  try {
    const lines = Math.min(Number(req.query.lines) || 100, 500);
    const logs = await getLogs(lines);

    res.type("text/plain").send(logs);
  } catch (err) {
    res.status(500).send("Failed to fetch logs:\n" + err);
  }
});

// Video control endpoints
app.post("/video/play", async (_req: Request, res: Response): Promise<void> => {
  try {
    await playVideo();
    res.json({ ok: true, message: "Video resumed" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to play video", error: String(err) });
  }
});

app.post("/video/pause", async (_req: Request, res: Response): Promise<void> => {
  try {
    await pauseVideo();
    res.json({ ok: true, message: "Video paused" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to pause video", error: String(err) });
  }
});

app.post("/video/seek", async (req: Request, res: Response): Promise<void> => {
  try {
    const { timestamp } = req.body;

    if (!timestamp) {
      res.status(400).json({ ok: false, message: "Missing 'timestamp' in request body" });
      return;
    }

    await seekVideo(timestamp);
    res.json({ ok: true, message: `Video seeked to ${timestamp}` });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to seek video", error: String(err) });
  }
});

app.get("/video/position", async (_req: Request, res: Response): Promise<void> => {
  try {
    const position = await getVideoPosition();
    res.json({ ok: true, position });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to get video position", error: String(err) });
  }
});

// Random events settings endpoints
app.get("/settings/random-events", async (_req: Request, res: Response): Promise<void> => {
  try {
    const enabled = isRandomEventsEnabled();
    res.json({ ok: true, enabled });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to get random events state", error: String(err) });
  }
});

app.post("/settings/random-events", async (req: Request, res: Response): Promise<void> => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      res.status(400).json({ ok: false, message: "Missing or invalid 'enabled' boolean in request body" });
      return;
    }

    if (enabled) {
      enableRandomEvents();
    } else {
      disableRandomEvents();
    }

    res.json({ ok: true, enabled, message: enabled ? "Random events enabled" : "Random events disabled" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Failed to update random events state", error: String(err) });
  }
});

// Catch-all route for React Router - must be last!
// Serves index.html for all non-API routes to support client-side routing
app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(WEB_DIR, "index.html"));
});

app.listen(9001, () => {
  console.log("🌐 Pau Hana API listening on port 9001");
});
