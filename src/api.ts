import path from "path";
import { fileURLToPath } from "url";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { triggerEvent, isEventHappening } from "./effectController.js";
import { getLogs } from "./logs.js";
import { snapshotSonos } from "./sonos.js";
import { config } from "./config.js";

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
  const isProtectedRoute = req.path.startsWith("/storm") || req.path.startsWith("/erupt") || req.path.startsWith("/logs");

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

app.listen(9001, () => {
  console.log("🌐 Pau Hana API listening on port 9001");
});
