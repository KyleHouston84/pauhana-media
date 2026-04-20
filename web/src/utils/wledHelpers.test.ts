import { describe, it, expect } from 'vitest';
import { rssiLabel, brightnessPercent } from './wledHelpers';

describe('rssiLabel()', () => {
  it('returns dash for undefined', () => {
    expect(rssiLabel(undefined)).toBe('—');
  });

  it('returns Excellent for -50 dBm', () => {
    expect(rssiLabel(-50)).toContain('Excellent');
  });

  it('returns Excellent for values above -50', () => {
    expect(rssiLabel(-30)).toContain('Excellent');
    expect(rssiLabel(-1)).toContain('Excellent');
  });

  it('returns Good for -51 to -65 dBm', () => {
    expect(rssiLabel(-51)).toContain('Good');
    expect(rssiLabel(-65)).toContain('Good');
  });

  it('returns Fair for -66 to -75 dBm', () => {
    expect(rssiLabel(-66)).toContain('Fair');
    expect(rssiLabel(-75)).toContain('Fair');
  });

  it('returns Poor for below -75 dBm', () => {
    expect(rssiLabel(-76)).toContain('Poor');
    expect(rssiLabel(-100)).toContain('Poor');
  });

  it('includes the dBm value in every label', () => {
    expect(rssiLabel(-55)).toContain('-55 dBm');
    expect(rssiLabel(-80)).toContain('-80 dBm');
  });
});

describe('brightnessPercent()', () => {
  it('returns dash for undefined', () => {
    expect(brightnessPercent(undefined)).toBe('—');
  });

  it('returns 0% for brightness 0', () => {
    expect(brightnessPercent(0)).toBe('0%');
  });

  it('returns 100% for brightness 255', () => {
    expect(brightnessPercent(255)).toBe('100%');
  });

  it('returns approximately 50% for brightness 128', () => {
    expect(brightnessPercent(128)).toBe('50%');
  });

  it('rounds fractional percentages', () => {
    // 127/255 ≈ 49.8% → rounds to 50%
    expect(brightnessPercent(127)).toBe('50%');
    // 64/255 ≈ 25.1% → rounds to 25%
    expect(brightnessPercent(64)).toBe('25%');
  });
});
