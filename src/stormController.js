import { summonStorm as runStorm } from "./storm.js";
import { startEruption as runEruption } from "./eruption.js";

let eventHappening = false;

export async function summonStorm() {
  if (eventHappening) {
    console.log("⚠️ An event is already active");
    return false;
  }

  eventHappening = true;
  console.log("🌩️ Storm summoned");

  try {
    await runStorm();
  } catch (err) {
    console.error("Storm error:", err);
  } finally {
    eventHappening = false;
    console.log("🌴 Storm ended");
  }

  return true;
}

export async function startEruption() {
  if (eventHappening) {
    console.log("⚠️ An event is already active");
    return false;
  }

  eventHappening = true;
  console.log("🌋 The volcano is erupting!");

  try {
    await runEruption();
  } catch (err) {
    console.error("Eruption error:", err);
  } finally {
    eventHappening = false;
    console.log("🌴 Eruption ended");
  }

  return true;
}

export function isEventHappening() {
  return eventHappening;
}
