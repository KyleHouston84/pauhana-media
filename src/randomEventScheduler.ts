import {
  MAX_EVENT_INTERVAL_MINUTES,
  MIN_EVENT_INTERVAL_MINUTES,
  EVENTS,
} from "./common/constants.js";
import { snapshotSonos } from "./sonos.js";
import { triggerEvent } from "./effectController.js";
import { getEventSettings } from "./eventSettings.js";
import type { EventType } from "./types/events.js";

// Store timeout ID so we can cancel/reset the scheduler
let scheduledTimeout: NodeJS.Timeout | null = null;
let randomEventsEnabled = true;
let nextEventTime: number | null = null; // Timestamp in milliseconds

export function scheduleRandomEvent(): void {
  // Don't schedule if disabled
  if (!randomEventsEnabled) {
    nextEventTime = null;
    return;
  }
  const min = MIN_EVENT_INTERVAL_MINUTES * 60 * 1000;
  const max = MAX_EVENT_INTERVAL_MINUTES * 60 * 1000;

  const delay = Math.floor(Math.random() * (max - min) + min);
  nextEventTime = Date.now() + delay;

  console.log(`Next event check in ${Math.round(delay / 60000)} minutes ⏰`);

  scheduledTimeout = setTimeout(async () => {
    try {
      const snap = await snapshotSonos();
      if (snap.state === "playing") {
        const settings = getEventSettings();
        const enabledEvents = (Object.keys(EVENTS) as EventType[]).filter(
          (type) => settings[type]?.enabled !== false,
        );
        if (enabledEvents.length === 0) {
          console.log("All events are disabled — skipping");
        } else {
          const randomEventType =
            enabledEvents[Math.floor(Math.random() * enabledEvents.length)];
          console.log(`Bar is active — triggering ${randomEventType} 🌩️`);
          await triggerEvent(randomEventType, true); // Mark as automatic trigger
        }
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

/**
 * Resets the random event scheduler.
 * Call this after manual event triggers to prevent back-to-back events.
 */
export function resetScheduler(): void {
  if (scheduledTimeout) {
    clearTimeout(scheduledTimeout);
    scheduledTimeout = null;
  }
  console.log("🔄 Random event scheduler reset");
  scheduleRandomEvent();
}

/**
 * Enable random event scheduling
 */
export function enableRandomEvents(): void {
  if (!randomEventsEnabled) {
    randomEventsEnabled = true;
    console.log("✅ Random events enabled");
    scheduleRandomEvent();
  }
}

/**
 * Disable random event scheduling
 */
export function disableRandomEvents(): void {
  if (randomEventsEnabled) {
    randomEventsEnabled = false;
    if (scheduledTimeout) {
      clearTimeout(scheduledTimeout);
      scheduledTimeout = null;
    }
    nextEventTime = null;
    console.log("🚫 Random events disabled");
  }
}

/**
 * Get current random events enabled state
 */
export function isRandomEventsEnabled(): boolean {
  return randomEventsEnabled;
}

/**
 * Get timestamp (milliseconds) of next scheduled random event
 */
export function getNextEventTime(): number | null {
  return nextEventTime;
}
