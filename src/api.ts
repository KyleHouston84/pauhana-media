import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import express, { Request, Response, NextFunction } from "express";

const execAsync = promisify(exec);
import cors from "cors";
import { triggerEvent, isEventHappening } from "./effectController.js";
import { getLogs } from "./logs.js";
import { snapshotSonos } from "./sonos.js";
import { config } from "./config.js";
import { seekVideo, pauseVideo, playVideo, getVideoPosition } from "./video.js";
import { isRandomEventsEnabled, enableRandomEvents, disableRandomEvents, getNextEventTime } from "./randomEventScheduler.js";
import { pauhanaWLED } from "./wled.js";
import { getEventSettings, updateEventSetting } from "./eventSettings.js";
import type { RuntimeEventConfig } from "./eventSettings.js";
import { getEffects, saveEffect, updateEffect, deleteEffect } from "./effectLibrary.js";

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
  const isProtectedRoute = req.path.startsWith("/storm") || req.path.startsWith("/erupt") || req.path.startsWith("/logs") || req.path.startsWith("/video") || req.path.startsWith("/settings") || req.path.startsWith("/wled") || req.path.startsWith("/events") || req.path.startsWith("/effects");

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

app.get("/video/display", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { stdout } = await execAsync("systemctl is-active pauhana-video.service");
    const on = stdout.trim() === "active";
    res.json({ ok: true, on });
  } catch {
    // is-active exits non-zero when inactive — that's still a valid answer
    res.json({ ok: true, on: false });
  }
});

app.post("/video/display", async (req: Request, res: Response): Promise<void> => {
  const { on } = req.body as { on?: unknown };
  if (typeof on !== "boolean") {
    res.status(400).json({ ok: false, message: "'on' must be a boolean" });
    return;
  }
  try {
    if (on) {
      await execAsync("sudo systemctl start pauhana-video.service");
    } else {
      await execAsync("sudo systemctl stop pauhana-video.service");
    }
    res.json({ ok: true, on, message: on ? "Display on" : "Display off" });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Failed to control display", error: String(err) });
  }
});

// Random events settings endpoints
app.get("/settings/random-events", async (_req: Request, res: Response): Promise<void> => {
  try {
    const enabled = isRandomEventsEnabled();
    const nextEventTime = getNextEventTime();
    res.json({ ok: true, enabled, nextEventTime });
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

// WLED endpoints
app.get("/wled/devices", (_req: Request, res: Response): void => {
  const devices = pauhanaWLED.devices;
  res.json({ ok: true, devices, count: devices.length });
});

app.post("/wled/discover", async (_req: Request, res: Response): Promise<void> => {
  try {
    await pauhanaWLED.discover();
    const devices = pauhanaWLED.devices;
    res.json({ ok: true, devices, count: devices.length, message: `Found ${devices.length} device(s)` });
  } catch (err) {
    res.status(500).json({ ok: false, message: "Discovery failed", error: String(err) });
  }
});

app.post("/wled/devices/:ip/power", async (req: Request, res: Response): Promise<void> => {
  const { ip } = req.params;
  const knownDevice = pauhanaWLED.devices.find((d) => d.ip === ip);
  if (!knownDevice) {
    res.status(404).json({ ok: false, message: "Device not found" });
    return;
  }
  const { on } = req.body;
  if (typeof on !== "boolean") {
    res.status(400).json({ ok: false, message: "'on' must be a boolean" });
    return;
  }
  try {
    const response = await fetch(`http://${ip}/json/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ on }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      res.status(500).json({ ok: false, message: "Device rejected command" });
      return;
    }
    res.json({ ok: true, on, message: on ? "Turned on" : "Turned off" });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Device unreachable", error: String(err) });
  }
});

app.get("/wled/devices/:ip/info", async (req: Request, res: Response): Promise<void> => {
  const { ip } = req.params;
  const knownDevice = pauhanaWLED.devices.find((d) => d.ip === ip);
  if (!knownDevice) {
    res.status(404).json({ ok: false, message: "Device not found" });
    return;
  }
  try {
    const response = await fetch(`http://${ip}/json`, { signal: AbortSignal.timeout(3000) });
    const data = await response.json() as { info?: Record<string, unknown>; state?: Record<string, unknown> };
    res.json({
      ok: true,
      info: {
        ip,
        name: (data.info as { name?: string })?.name,
        version: (data.info as { ver?: string })?.ver,
        ledCount: (data.info as { leds?: { count?: number } })?.leds?.count,
        rssi: (data.info as { wifi?: { rssi?: number } })?.wifi?.rssi,
        on: (data.state as { on?: boolean })?.on,
        brightness: (data.state as { bri?: number })?.bri,
      },
    });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Device unreachable", error: String(err) });
  }
});

app.post("/wled/devices/:ip/brightness", async (req: Request, res: Response): Promise<void> => {
  const { ip } = req.params;
  const knownDevice = pauhanaWLED.devices.find((d) => d.ip === ip);
  if (!knownDevice) {
    res.status(404).json({ ok: false, message: "Device not found" });
    return;
  }
  const { brightness } = req.body;
  if (typeof brightness !== "number" || brightness < 0 || brightness > 255) {
    res.status(400).json({ ok: false, message: "'brightness' must be a number 0–255" });
    return;
  }
  try {
    const response = await fetch(`http://${ip}/json/state`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bri: brightness }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      res.status(500).json({ ok: false, message: "Device rejected command" });
      return;
    }
    res.json({ ok: true, brightness, message: `Brightness set to ${brightness}` });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Device unreachable", error: String(err) });
  }
});

app.post("/wled/devices/:ip/rename", async (req: Request, res: Response): Promise<void> => {
  const { ip } = req.params;
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    res.status(400).json({ ok: false, message: "Missing or invalid 'name'" });
    return;
  }
  const device = pauhanaWLED.devices.find((d) => d.ip === ip);
  if (!device) {
    res.status(404).json({ ok: false, message: "Device not found" });
    return;
  }
  try {
    const response = await fetch(`http://${ip}/json/cfg`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: { name } }),
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      res.status(500).json({ ok: false, message: "Device rejected rename" });
      return;
    }
    const oldName = device.name;
    device.name = name;
    pauhanaWLED.persistDevices();

    // Cascade rename into any event WLED device assignments
    const events = getEventSettings();
    for (const [type, cfg] of Object.entries(events)) {
      if (cfg.wled.devices.some((d) => d.name === oldName)) {
        updateEventSetting(type, {
          wled: {
            devices: cfg.wled.devices.map((d) => (d.name === oldName ? { ...d, name } : d)),
          },
        });
      }
    }

    res.json({ ok: true, message: `Renamed to "${name}"` });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Device unreachable", error: String(err) });
  }
});

// Event configuration endpoints
app.get("/events", (_req: Request, res: Response): void => {
  res.json({ ok: true, events: getEventSettings() });
});

app.patch("/events/:type", (req: Request, res: Response): void => {
  const type = req.params.type as string;
  const validTypes = ["STORM", "ERUPTION"];
  if (!validTypes.includes(type)) {
    res.status(400).json({ ok: false, message: `Unknown event type: ${type}` });
    return;
  }

  const { volume, durationSec, videoSeekTime, enabled, wled } = req.body as Partial<RuntimeEventConfig>;
  const patch: Partial<RuntimeEventConfig> = {};

  if (volume !== undefined) {
    if (typeof volume !== "number" || volume < 0 || volume > 100) {
      res.status(400).json({ ok: false, message: "volume must be a number 0–100" });
      return;
    }
    patch.volume = volume;
  }
  if (durationSec !== undefined) {
    if (typeof durationSec !== "number" || durationSec < 1) {
      res.status(400).json({ ok: false, message: "durationSec must be a positive number" });
      return;
    }
    patch.durationSec = durationSec;
  }
  if (videoSeekTime !== undefined) {
    if (videoSeekTime !== null && typeof videoSeekTime !== "string") {
      res.status(400).json({ ok: false, message: "videoSeekTime must be a string or null" });
      return;
    }
    patch.videoSeekTime = videoSeekTime;
  }
  if (enabled !== undefined) {
    if (typeof enabled !== "boolean") {
      res.status(400).json({ ok: false, message: "enabled must be a boolean" });
      return;
    }
    patch.enabled = enabled;
  }
  if (wled !== undefined) {
    if (wled.devices !== undefined) {
      if (
        !Array.isArray(wled.devices) ||
        !wled.devices.every(
          (d) => d && typeof d === "object" && typeof d.name === "string" && typeof d.effect === "string",
        )
      ) {
        res.status(400).json({ ok: false, message: "wled.devices must be an array of {name, effect}" });
        return;
      }
    }
    patch.wled = wled;
  }

  const updated = updateEventSetting(type as string, patch);
  res.json({ ok: true, config: updated });
});

// Effect library endpoints
app.get("/effects", (_req: Request, res: Response): void => {
  res.json({ ok: true, effects: getEffects() });
});

app.post("/effects", async (req: Request, res: Response): Promise<void> => {
  const { name, ip } = req.body as { name?: string; ip?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    res.status(400).json({ ok: false, message: "Missing or invalid 'name'" });
    return;
  }
  if (!ip || typeof ip !== "string") {
    res.status(400).json({ ok: false, message: "Missing or invalid 'ip'" });
    return;
  }
  try {
    const response = await fetch(`http://${ip}/json/state`, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) {
      res.status(502).json({ ok: false, message: "Device returned an error" });
      return;
    }
    const state = await response.json() as Record<string, unknown>;
    const effect = saveEffect(name.trim(), state, ip);
    res.json({ ok: true, effect });
  } catch (err) {
    res.status(503).json({ ok: false, message: "Device unreachable", error: String(err) });
  }
});

app.patch("/effects/:name", async (req: Request, res: Response): Promise<void> => {
  const oldName = req.params.name as string;
  const { name, ip } = req.body as { name?: string; ip?: string };
  if (!name && !ip) {
    res.status(400).json({ ok: false, message: "Provide 'name' to rename or 'ip' to re-capture (or both)" });
    return;
  }
  let newState: Record<string, unknown> | undefined;
  if (ip) {
    try {
      const response = await fetch(`http://${ip}/json/state`, { signal: AbortSignal.timeout(3000) });
      if (!response.ok) {
        res.status(502).json({ ok: false, message: "Device returned an error" });
        return;
      }
      newState = await response.json() as Record<string, unknown>;
    } catch (err) {
      res.status(503).json({ ok: false, message: "Device unreachable", error: String(err) });
      return;
    }
  }
  const updated = updateEffect(oldName, { name, state: newState, capturedFromIp: ip });
  if (!updated) {
    res.status(404).json({ ok: false, message: `Effect "${oldName}" not found` });
    return;
  }
  // Cascade rename into event device assignments
  if (name && name.trim() !== oldName) {
    const newName = name.trim();
    const events = getEventSettings();
    for (const [type, cfg] of Object.entries(events)) {
      if (cfg.wled.devices.some((d) => d.effect === oldName)) {
        updateEventSetting(type, {
          wled: {
            devices: cfg.wled.devices.map((d) => (d.effect === oldName ? { ...d, effect: newName } : d)),
          },
        });
      }
    }
  }
  res.json({ ok: true, effect: updated });
});

app.delete("/effects/:name", (req: Request, res: Response): void => {
  const name = req.params.name as string;
  const deleted = deleteEffect(name);
  if (!deleted) {
    res.status(404).json({ ok: false, message: `Effect "${name}" not found` });
    return;
  }
  res.json({ ok: true, message: `Deleted effect "${name}"` });
});

// Catch-all route for React Router - must be last!
// Serves index.html for all non-API routes to support client-side routing
app.use((_req: Request, res: Response) => {
  res.sendFile(path.join(WEB_DIR, "index.html"));
});

app.listen(9001, () => {
  console.log("🌐 Pau Hana API listening on port 9001");
});
