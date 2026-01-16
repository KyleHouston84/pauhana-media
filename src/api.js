import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { triggerEvent, isEventHappening } from "./effectController.js";

const app = express();
const API_KEY = process.env.PAUHANA_API_KEY;
app.use(express.json());

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve thunderstorm audio
const AUDIO_DIR = path.join(__dirname, "../audio");
console.log("Serving audio from:", AUDIO_DIR);

app.use("/audio", express.static(AUDIO_DIR));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    stormActive: isEventHappening(),
  });
});

// Trigger storm
app.post("/storm", async (req, res) => {
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(403).json({ ok: false });
  }

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
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(403).json({ ok: false });
  }

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

app.listen(9001, () => {
  console.log("🌐 Pau Hana API listening on port 9001");
});
