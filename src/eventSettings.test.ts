import { vi, describe, it, expect } from 'vitest';

// Prevent file I/O during module init
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(() => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }); }),
    writeFileSync: vi.fn(),
  },
}));

import { migrateWLED, getEventSettings } from './eventSettings.js';

describe('eventSettings', () => {
  describe('migrateWLED()', () => {
    it('converts old format { deviceNames, effect } to new { devices }', () => {
      const result = migrateWLED({ deviceNames: ['WLED-1', 'WLED-2'], effect: 'LIGHTING' });
      expect(result).toEqual({
        devices: [
          { name: 'WLED-1', effect: 'LIGHTING' },
          { name: 'WLED-2', effect: 'LIGHTING' },
        ],
      });
    });

    it('defaults effect to LIGHTING when missing from old format', () => {
      const result = migrateWLED({ deviceNames: ['WLED-1'] });
      expect(result.devices[0].effect).toBe('LIGHTING');
    });

    it('passes through new format { devices } unchanged', () => {
      const newFmt = { devices: [{ name: 'WLED-1', effect: 'RED' }] };
      expect(migrateWLED(newFmt)).toEqual(newFmt);
    });

    it('preserves multiple devices in new format', () => {
      const newFmt = {
        devices: [
          { name: 'WLED-A', effect: 'RED' },
          { name: 'WLED-B', effect: 'LIGHTING' },
        ],
      };
      expect(migrateWLED(newFmt)).toEqual(newFmt);
    });

    it('returns empty devices for null', () => {
      expect(migrateWLED(null)).toEqual({ devices: [] });
    });

    it('returns empty devices for undefined', () => {
      expect(migrateWLED(undefined)).toEqual({ devices: [] });
    });

    it('returns empty devices for non-object primitives', () => {
      expect(migrateWLED('invalid')).toEqual({ devices: [] });
      expect(migrateWLED(42)).toEqual({ devices: [] });
    });

    it('returns empty devices for object with neither known shape', () => {
      expect(migrateWLED({ foo: 'bar' })).toEqual({ devices: [] });
    });
  });

  describe('getEventSettings()', () => {
    it('returns STORM and ERUPTION events', () => {
      const settings = getEventSettings();
      expect(settings).toHaveProperty('STORM');
      expect(settings).toHaveProperty('ERUPTION');
    });

    it('STORM has expected default shape', () => {
      const { STORM } = getEventSettings();
      expect(typeof STORM.volume).toBe('number');
      expect(typeof STORM.durationSec).toBe('number');
      expect(typeof STORM.enabled).toBe('boolean');
      expect(Array.isArray(STORM.wled.devices)).toBe(true);
    });

    it('ERUPTION has a non-null default videoSeekTime', () => {
      const { ERUPTION } = getEventSettings();
      expect(ERUPTION.videoSeekTime).toBeTruthy();
    });

    it('each device assignment has name and effect strings', () => {
      const settings = getEventSettings();
      for (const cfg of Object.values(settings)) {
        for (const d of cfg.wled.devices) {
          expect(typeof d.name).toBe('string');
          expect(typeof d.effect).toBe('string');
        }
      }
    });
  });
});
