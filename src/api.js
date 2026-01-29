import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { triggerEvent, isEventHappening } from "./effectController.js";
import { getLogs } from "./logs.js";
import { snapshotSonos } from "./sonos.js";

const app = express();
const API_KEY = process.env.API_KEY;
app.use(express.json());

// Custom middleware function to check headers
app.use((req, res, next) => {
  // Check is we should protect the requested endpoint
  const isSafe = req.path.includes("/audio") || req.path.includes("/health");
  if (!isSafe && req.headers["x-api-key"] !== API_KEY) {
    return res.status(403).json({ ok: false });
  }

  // If headers are valid, and not a protected endpoint proceed to the next middleware or route handler
  next();
});

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve audio file
const AUDIO_DIR = path.join(__dirname, "../audio");
console.log("Serving audio from:", AUDIO_DIR);

app.use("/audio", express.static(AUDIO_DIR));

// Health check
app.get("/health", async (req, res) => {
  const stormActive = isEventHappening();
  const snap = await snapshotSonos();

  res.json({
    status: "ok",
    stormActive,
    sonos: {
      state: snap.state,
      volume: snap.volume,
      track: {
        artist: snap.track.artist,
        title: snap.track.title,
        album: snap.track.album,
      },
    },
  });
});

// Trigger storm
app.post("/storm", async (req, res) => {
  if (isEventHappening()) {
    return res.status(409).json({
      ok: false,
      message: "An event is already active",
    });
  }

  // Fire-and-forget (don’t block HTTP)
  triggerEvent("STORM");

  res.json({
    ok: true,
    message: "Storm summoned",
  });
});

// Trigger eruption
app.post("/erupt", async (req, res) => {
  if (isEventHappening()) {
    return res.status(409).json({
      ok: false,
      message: "An event is already active",
    });
  }

  // Fire-and-forget (don’t block HTTP)
  triggerEvent("ERUPTION");

  res.json({
    ok: true,
    message: "Volcano eruption started",
  });
});

app.get("/logs", async (req, res) => {
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
