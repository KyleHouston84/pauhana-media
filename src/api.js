import 'dotenv/config'; 
import express from "express";
import { summonStorm, isStormActive } from "./stormController.js";

const app = express();
const API_KEY = process.env.PAUHANA_API_KEY;
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    stormActive: isStormActive(),
  });
});

// Trigger storm
app.post("/storm", async (req, res) => {
  if (req.headers["x-api-key"] !== API_KEY) {
    return res.status(403).json({ ok: false });
  }
  
  if (isStormActive()) {
    return res.status(409).json({
      ok: false,
      message: "Storm already active",
    });
  }

  // Fire-and-forget (don’t block HTTP)
  summonStorm();

  res.json({
    ok: true,
    message: "Storm summoned",
  });
});

app.listen(9001, () => {
  console.log("🌐 Pau Hana API listening on port 9001");
});
