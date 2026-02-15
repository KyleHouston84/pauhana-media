/**
 * Tests for effectController.ts
 *
 * This file tests the event triggering logic and state management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isEventHappening, triggerEvent } from './effectController.js';
import { EVENTS } from './common/constants.js';

// Group related tests together
describe('effectController', () => {

  // This runs before each test - ensures clean state
  beforeEach(() => {
    // Note: We can't easily reset the eventHappening state
    // since it's a private variable. This is a design limitation
    // we'll discuss!
  });

  describe('isEventHappening()', () => {

    it('should return a boolean', () => {
      // Arrange: (no setup needed)

      // Act: Call the function
      const result = isEventHappening();

      // Assert: Check the result
      expect(typeof result).toBe('boolean');
    });

    it('should initially return false when no events are running', () => {
      // This test assumes clean state on first run
      const result = isEventHappening();

      // We expect no events to be running initially
      expect(result).toBe(false);
    });
  });

  // More advanced test - testing async behavior
  describe('triggerEvent()', () => {

    it('should return false when an invalid event type is provided', async () => {
      // @ts-expect-error - Intentionally passing invalid type to test error handling
      const result = await triggerEvent('INVALID_EVENT');

      // The function now validates input and returns false gracefully
      expect(result).toBe(false);
    });

    it('should not trigger WLED discovery for invalid event types', async () => {
      // This tests the early return optimization
      // @ts-expect-error - Intentionally passing invalid type
      const result = await triggerEvent('INVALID_EVENT');

      // Should return immediately without calling pauhanaWLED.discover()
      // (We'd need mocks to truly verify this, but we can at least check it returns false)
      expect(result).toBe(false);
    });
  });

  // TEST 1: Verify constants structure
  describe('EVENTS constants', () => {

    it('should have STORM and ERUPTION event types', () => {
      // Arrange & Act: Check the EVENTS object

      // Assert: Both event types should exist
      expect(EVENTS.STORM).toBeDefined();
      expect(EVENTS.ERUPTION).toBeDefined();
    });

    it('should have required properties for each event', () => {
      // Each event should have: startLog, errorLog, endLog, uri

      const requiredProps = ['startLog', 'errorLog', 'endLog', 'uri'];

      // Check STORM
      requiredProps.forEach(prop => {
        expect(EVENTS.STORM).toHaveProperty(prop);
        expect(typeof EVENTS.STORM[prop as keyof typeof EVENTS.STORM]).toBe('string');
      });

      // Check ERUPTION
      requiredProps.forEach(prop => {
        expect(EVENTS.ERUPTION).toHaveProperty(prop);
        expect(typeof EVENTS.ERUPTION[prop as keyof typeof EVENTS.ERUPTION]).toBe('string');
      });
    });

    it('should have non-empty log messages', () => {
      // Verify log messages aren't empty strings

      expect(EVENTS.STORM.startLog.length).toBeGreaterThan(0);
      expect(EVENTS.STORM.errorLog.length).toBeGreaterThan(0);
      expect(EVENTS.STORM.endLog.length).toBeGreaterThan(0);

      expect(EVENTS.ERUPTION.startLog.length).toBeGreaterThan(0);
      expect(EVENTS.ERUPTION.errorLog.length).toBeGreaterThan(0);
      expect(EVENTS.ERUPTION.endLog.length).toBeGreaterThan(0);
    });

    it('should have valid audio URIs', () => {
      // URIs should be http URLs pointing to audio files

      expect(EVENTS.STORM.uri).toMatch(/^http/);
      expect(EVENTS.STORM.uri).toMatch(/\.mp3$/);

      expect(EVENTS.ERUPTION.uri).toMatch(/^http/);
      expect(EVENTS.ERUPTION.uri).toMatch(/\.mp3$/);
    });
  });

  // TEST 2: Test with real event types (STORM)
  // Note: These tests require hardware and take a long time
  // They're skipped by default and can be run manually with: npm test -- --run integration
  describe.skip('triggerEvent() with valid event types (INTEGRATION - SKIPPED)', () => {

    it('should accept STORM as a valid event type', async () => {
      // This will actually try to trigger a storm!
      // In a real test, we'd mock pauhanaWLED.discover() and summonStorm()

      // For now, we'll just verify it doesn't immediately return false
      // (It might fail later due to hardware not being available, but that's OK for this test)
      const result = await triggerEvent('STORM');

      // Should not return false immediately (false = invalid type or already running)
      // Note: This test has limitations - see comment above
      expect(typeof result).toBe('boolean');
    }, 120000); // 2 minute timeout for hardware tests

    it('should accept ERUPTION as a valid event type', async () => {
      // Same limitation as above - would need mocks for proper testing
      const result = await triggerEvent('ERUPTION');

      expect(typeof result).toBe('boolean');
    }, 120000);
  });

  // TEST 3: Test state changes
  // Note: This test triggers real hardware - skipped for fast test runs
  describe.skip('Event state management (INTEGRATION - SKIPPED)', () => {

    it('should block concurrent events', async () => {
      // Start first event (don't await - let it run in background)
      const promise1 = triggerEvent('STORM');

      // Immediately try to start second event
      const result2 = await triggerEvent('ERUPTION');

      // Second event should be blocked
      expect(result2).toBe(false);

      // Wait for first event to complete
      await promise1;
    }, 120000);
  });
});
