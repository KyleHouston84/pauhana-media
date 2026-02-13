import { summonStorm } from "./storm.js";
import { startEruption } from "./eruption.js";
import { EVENTS } from "./common/constants.js";
import { pauhanaWLED } from "./wled.js";
import type { EventType } from "./types/events.js";

let eventHappening = false;

/**
 * Triggers an event
 * @param type "STORM" | "ERUPTION"
 * @returns boolean indicating whether the event was triggered
 */
export async function triggerEvent(type: EventType): Promise<boolean> {
  if (eventHappening) {
    console.log("⚠ An event is already active");
    return false;
  }
  await pauhanaWLED.discover();

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
  return true;
}

export function isEventHappening(): boolean {
  return eventHappening;
}
