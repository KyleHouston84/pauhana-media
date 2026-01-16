import { summonStorm } from "./storm.js";
import { startEruption } from "./eruption.js";
import { EVENT_TYPES } from "./common/constants.js";

let eventHappening = false;

/**
 * Triggers an event
 * @class Sonos
 * @param {type} "STORM" | "ERUPTION"
 * @returns Void
 */
export async function triggerEvent(type) {
  if (eventHappening) {
    console.log("⚠ An event is already active");
    return false;
  }

  eventHappening = true;
  console.log(`${EVENT_TYPES[type].startLog}`);

  try {
    switch (type) {
      case "STORM":
        await summonStorm();
        break;
      case "ERUPTION":
        await startEruption();
        break;
      default:
        console.log(`🚨 Event ${type} type not found, unable to trigger event`);
        break;
    }
  } catch (err) {
    console.error(`${EVENT_TYPES[type].errorLog}:`, err);
  } finally {
    eventHappening = false;
    console.log(`${EVENT_TYPES[type].endLog}`);
  }
}

export function isEventHappening() {
  return eventHappening;
}
