import { summonStorm } from "./storm.js";
import { startEruption } from "./eruption.js";
import { EVENTS } from "./common/constants.js";
import { pauhanaWLED } from "./wled.js";
import { resetScheduler } from "./randomEventScheduler.js";
import type { EventType } from "./types/events.js";

let eventHappening = false;
let isAutomaticEvent = false;

/**
 * Triggers an event
 * @param type "STORM" | "ERUPTION"
 * @param automatic Whether this was triggered automatically by the scheduler
 * @returns boolean indicating whether the event was triggered
 */
export async function triggerEvent(type: EventType, automatic = false): Promise<boolean> {
  isAutomaticEvent = automatic;
  if (eventHappening) {
    console.log("⚠ An event is already active");
    return false;
  }

  // Validate event type exists
  if (!EVENTS[type]) {
    console.log(`🚨 Unknown event type: ${type}`);
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

    // Reset random event scheduler to prevent back-to-back events
    // Only reset for manual triggers - automatic triggers already reschedule themselves
    if (!isAutomaticEvent) {
      resetScheduler();
    }
    isAutomaticEvent = false;
  }
  return true;
}

export function isEventHappening(): boolean {
  return eventHappening;
}
