import { summonStorm } from "./storm.js";
import { startEruption } from "./eruption.js";
import { EVENTS } from "./common/constants.js";

let eventHappening = false;

/**
 * Triggers an event
 * @param {type} "STORM" | "ERUPTION"
 * @returns Void
 */
export async function triggerEvent(type) {
  if (eventHappening) {
    console.log("⚠ An event is already active");
    return false;
  }

  eventHappening = true;
  console.log(`${EVENTS[type].startLog}`);

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
    console.error(`${EVENTS[type].errorLog}:`, err);
  } finally {
    eventHappening = false;
    console.log(`${EVENTS[type].endLog}`);
  }
}

export function isEventHappening() {
  return eventHappening;
}
