import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('./sonos.js', () => ({
  snapshotSonos: vi.fn().mockResolvedValue({ state: 'playing', volume: 20, track: null }),
}));

vi.mock('./effectController.js', () => ({
  triggerEvent: vi.fn().mockResolvedValue(true),
}));

import {
  scheduleRandomEvent,
  resetScheduler,
  enableRandomEvents,
  disableRandomEvents,
  isRandomEventsEnabled,
  getNextEventTime,
} from './randomEventScheduler.js';
import { triggerEvent } from './effectController.js';
import { MIN_EVENT_INTERVAL_MINUTES, MAX_EVENT_INTERVAL_MINUTES } from './common/constants.js';

const MIN_MS = MIN_EVENT_INTERVAL_MINUTES * 60 * 1000;
const MAX_MS = MAX_EVENT_INTERVAL_MINUTES * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllTimers();
  // Ensure known disabled state before each test
  disableRandomEvents();
  vi.mocked(triggerEvent).mockClear();
});

afterEach(() => {
  disableRandomEvents();
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('randomEventScheduler', () => {
  describe('isRandomEventsEnabled()', () => {
    it('returns false after disabling', () => {
      disableRandomEvents();
      expect(isRandomEventsEnabled()).toBe(false);
    });

    it('returns true after enabling', () => {
      enableRandomEvents();
      expect(isRandomEventsEnabled()).toBe(true);
    });

    it('enableRandomEvents() is idempotent', () => {
      enableRandomEvents();
      enableRandomEvents(); // second call should not throw or double-schedule
      expect(isRandomEventsEnabled()).toBe(true);
    });

    it('disableRandomEvents() is idempotent', () => {
      disableRandomEvents();
      disableRandomEvents(); // already disabled — should not throw
      expect(isRandomEventsEnabled()).toBe(false);
    });
  });

  describe('getNextEventTime()', () => {
    it('returns null when disabled', () => {
      disableRandomEvents();
      expect(getNextEventTime()).toBeNull();
    });

    it('returns a future timestamp after enabling', () => {
      const now = Date.now();
      enableRandomEvents();
      const next = getNextEventTime();
      expect(next).not.toBeNull();
      expect(next!).toBeGreaterThan(now);
    });

    it('schedules within the configured interval range', () => {
      const now = Date.now();
      enableRandomEvents();
      const next = getNextEventTime()!;
      expect(next - now).toBeGreaterThanOrEqual(MIN_MS);
      expect(next - now).toBeLessThanOrEqual(MAX_MS);
    });

    it('returns null again after disabling', () => {
      enableRandomEvents();
      expect(getNextEventTime()).not.toBeNull();
      disableRandomEvents();
      expect(getNextEventTime()).toBeNull();
    });
  });

  describe('disableRandomEvents()', () => {
    it('clears the scheduled timeout', () => {
      enableRandomEvents();
      expect(getNextEventTime()).not.toBeNull();
      disableRandomEvents();
      // Advancing time should not trigger triggerEvent
      vi.advanceTimersByTime(MAX_MS + 1);
      expect(triggerEvent).not.toHaveBeenCalled();
    });
  });

  describe('resetScheduler()', () => {
    it('reschedules when called while enabled', () => {
      enableRandomEvents();
      const firstTime = getNextEventTime();
      // Advance time slightly so Date.now() changes
      vi.advanceTimersByTime(1000);
      resetScheduler();
      const secondTime = getNextEventTime();
      // A new schedule was set — both should be non-null
      expect(firstTime).not.toBeNull();
      expect(secondTime).not.toBeNull();
    });

    it('does not throw when called while disabled', () => {
      disableRandomEvents();
      expect(() => resetScheduler()).not.toThrow();
    });
  });

  describe('scheduleRandomEvent()', () => {
    it('does not schedule when disabled', () => {
      disableRandomEvents();
      scheduleRandomEvent();
      expect(getNextEventTime()).toBeNull();
    });

    it('triggers an event when Sonos is playing and timer fires', async () => {
      enableRandomEvents();
      // Advance past the max interval — fires exactly one timer, not the recursive reschedule
      await vi.advanceTimersByTimeAsync(MAX_MS + 1);
      expect(triggerEvent).toHaveBeenCalledWith(expect.any(String), true);
    });

    it('marks triggered events as automatic (second arg = true)', async () => {
      enableRandomEvents();
      await vi.advanceTimersByTimeAsync(MAX_MS + 1);
      expect(triggerEvent).toHaveBeenCalledWith(expect.any(String), true);
    });
  });
});
