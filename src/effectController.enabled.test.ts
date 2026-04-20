import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockGetEventSettings } = vi.hoisted(() => ({
  mockGetEventSettings: vi.fn(),
}));

// Mock all hardware + side-effect dependencies
vi.mock('./wled.js', () => ({
  pauhanaWLED: { discover: vi.fn().mockResolvedValue([]) },
}));
vi.mock('./randomEventScheduler.js', () => ({
  resetScheduler: vi.fn(),
}));
vi.mock('./storm.js', () => ({
  summonStorm: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./eruption.js', () => ({
  startEruption: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./eventSettings.js', () => ({
  getEventSettings: mockGetEventSettings,
}));

import { triggerEvent } from './effectController.js';

const enabledSettings = {
  STORM: { enabled: true, volume: 10, durationSec: 60, videoSeekTime: null, wled: { devices: [] } },
  ERUPTION: { enabled: true, volume: 15, durationSec: 86, videoSeekTime: '30:41', wled: { devices: [] } },
};

const disabledSettings = {
  STORM: { enabled: false, volume: 10, durationSec: 60, videoSeekTime: null, wled: { devices: [] } },
  ERUPTION: { enabled: false, volume: 15, durationSec: 86, videoSeekTime: '30:41', wled: { devices: [] } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetEventSettings.mockReturnValue(enabledSettings);
});

describe('effectController — enabled flag', () => {
  it('returns false for STORM when it is disabled', async () => {
    mockGetEventSettings.mockReturnValue(disabledSettings);
    const result = await triggerEvent('STORM');
    expect(result).toBe(false);
  });

  it('returns false for ERUPTION when it is disabled', async () => {
    mockGetEventSettings.mockReturnValue(disabledSettings);
    const result = await triggerEvent('ERUPTION');
    expect(result).toBe(false);
  });

  it('does not call discover() when event is disabled', async () => {
    const { pauhanaWLED } = await import('./wled.js');
    mockGetEventSettings.mockReturnValue(disabledSettings);
    await triggerEvent('STORM');
    expect(pauhanaWLED.discover).not.toHaveBeenCalled();
  });

  it('returns true and proceeds when STORM is enabled', async () => {
    mockGetEventSettings.mockReturnValue(enabledSettings);
    const result = await triggerEvent('STORM');
    expect(result).toBe(true);
  });

  it('returns true and proceeds when ERUPTION is enabled', async () => {
    mockGetEventSettings.mockReturnValue(enabledSettings);
    const result = await triggerEvent('ERUPTION');
    expect(result).toBe(true);
  });

  it('returns false for unknown event types regardless of settings', async () => {
    mockGetEventSettings.mockReturnValue(enabledSettings);
    // @ts-expect-error intentionally invalid type
    const result = await triggerEvent('UNKNOWN');
    expect(result).toBe(false);
  });

  it('only skips the disabled event, not others', async () => {
    mockGetEventSettings.mockReturnValue({
      ...enabledSettings,
      STORM: { ...enabledSettings.STORM, enabled: false },
    });
    expect(await triggerEvent('STORM')).toBe(false);
    expect(await triggerEvent('ERUPTION')).toBe(true);
  });
});
