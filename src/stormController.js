import { summonStorm as runStorm } from "./storm.js";

let stormActive = false;

export async function summonStorm() {
  if (stormActive) {
    console.log("⚠️ Storm already active");
    return false;
  }

  stormActive = true;
  console.log("🌩️ Storm summoned");

  try {
    await runStorm();
  } catch (err) {
    console.error("Storm error:", err);
  } finally {
    stormActive = false;
    console.log("🌴 Storm ended");
  }

  return true;
}

export function isStormActive() {
  return stormActive;
}
