import {
  MAX_EVENT_INTERVAL_MINUTES,
  MIN_EVENT_INTERVAL_MINUTES,
  EVENTS,
} from "./common/constants.js";
import { snapshotSonos } from "./sonos.js";
import { triggerEvent } from "./effectController.js";
import type { EventType } from "./types/events.js";

export function scheduleRandomEvent(): void {
  const min = MIN_EVENT_INTERVAL_MINUTES * 60 * 1000;
  const max = MAX_EVENT_INTERVAL_MINUTES * 60 * 1000;

  const delay = Math.floor(Math.random() * (max - min) + min);

  console.log(`Next event check in ${Math.round(delay / 60000)} minutes ⏰`);

  setTimeout(async () => {
    try {
      const snap = await snapshotSonos();
      if (snap.state === "playing") {
        const eventTypeArr = Object.keys(EVENTS) as EventType[];
        const randomEventType =
          eventTypeArr[Math.floor(Math.random() * eventTypeArr.length)];
        console.log(`Bar is active — triggering ${randomEventType} 🌩️`);
        await triggerEvent(randomEventType);
      } else {
        console.log("Bar inactive or storm already running — skipping");
      }
    } catch (err) {
      console.error("Failed to trigger a random event:", err);
    } finally {
      // 🔁 Schedule the next one no matter what
      scheduleRandomEvent();
    }
  }, delay);
}
