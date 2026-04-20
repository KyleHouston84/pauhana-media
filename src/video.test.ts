import { describe, it, expect } from 'vitest';
import { parseTimestamp } from './video.js';

describe('parseTimestamp()', () => {
  describe('number passthrough', () => {
    it('returns the number unchanged', () => {
      expect(parseTimestamp(0)).toBe(0);
      expect(parseTimestamp(100)).toBe(100);
      expect(parseTimestamp(3661)).toBe(3661);
    });
  });

  describe('MM:SS format', () => {
    it('parses 0:00 as 0 seconds', () => {
      expect(parseTimestamp('0:00')).toBe(0);
    });

    it('parses 1:00 as 60 seconds', () => {
      expect(parseTimestamp('1:00')).toBe(60);
    });

    it('parses 30:41 as 1841 seconds', () => {
      expect(parseTimestamp('30:41')).toBe(1841);
    });

    it('parses 59:59 as 3599 seconds', () => {
      expect(parseTimestamp('59:59')).toBe(3599);
    });
  });

  describe('HH:MM:SS format', () => {
    it('parses 0:00:00 as 0 seconds', () => {
      expect(parseTimestamp('0:00:00')).toBe(0);
    });

    it('parses 1:00:00 as 3600 seconds', () => {
      expect(parseTimestamp('1:00:00')).toBe(3600);
    });

    it('parses 1:30:41 as 5441 seconds', () => {
      expect(parseTimestamp('1:30:41')).toBe(5441);
    });

    it('parses 2:00:00 as 7200 seconds', () => {
      expect(parseTimestamp('2:00:00')).toBe(7200);
    });
  });

  describe('invalid formats', () => {
    it('throws for a bare string with no colons', () => {
      expect(() => parseTimestamp('invalid')).toThrow();
    });

    it('throws for too many segments', () => {
      expect(() => parseTimestamp('1:2:3:4')).toThrow();
    });

    it('throws when a segment is not a number', () => {
      expect(() => parseTimestamp('1:xx')).toThrow();
      expect(() => parseTimestamp('ab:cd:ef')).toThrow();
    });
  });
});
