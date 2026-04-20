import { vi, describe, it, expect } from 'vitest';

// Mock fs before the module loads — vi.mock is hoisted automatically
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => { throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' }); }),
  writeFileSync: vi.fn(),
}));

import { getEffects, getEffect, saveEffect, updateEffect, deleteEffect } from './effectLibrary.js';

describe('effectLibrary', () => {
  describe('built-in seeding', () => {
    it('seeds LIGHTING on init', () => {
      expect(getEffect('LIGHTING')).toBeDefined();
    });

    it('seeds RED on init', () => {
      expect(getEffect('RED')).toBeDefined();
    });

    it('built-in effects have on: true', () => {
      expect((getEffect('LIGHTING')?.state as { on?: boolean })?.on).toBe(true);
      expect((getEffect('RED')?.state as { on?: boolean })?.on).toBe(true);
    });
  });

  describe('saveEffect()', () => {
    it('stores a new effect and returns it', () => {
      const state = { on: true, bri: 200 };
      const effect = saveEffect('TestNew', state, '192.168.1.10');
      expect(effect.name).toBe('TestNew');
      expect(effect.state).toEqual(state);
      expect(effect.capturedFromIp).toBe('192.168.1.10');
      expect(typeof effect.capturedAt).toBe('string');
    });

    it('is immediately retrievable via getEffect()', () => {
      saveEffect('TestRetrieve', { on: true });
      expect(getEffect('TestRetrieve')).toBeDefined();
    });

    it('overwrites an existing effect with the same name', () => {
      saveEffect('TestOverwrite', { on: true, bri: 100 });
      saveEffect('TestOverwrite', { on: false, bri: 50 });
      expect(getEffect('TestOverwrite')?.state).toEqual({ on: false, bri: 50 });
    });

    it('appears in getEffects()', () => {
      saveEffect('TestInAll', { on: true });
      expect(getEffects()).toHaveProperty('TestInAll');
    });
  });

  describe('getEffect()', () => {
    it('returns undefined for an unknown name', () => {
      expect(getEffect('DoesNotExist_xyz')).toBeUndefined();
    });

    it('returns the correct effect by name', () => {
      saveEffect('GetByName', { on: true, bri: 128 });
      expect(getEffect('GetByName')?.name).toBe('GetByName');
    });
  });

  describe('updateEffect()', () => {
    it('returns null for an unknown name', () => {
      expect(updateEffect('NoSuchEffect_xyz', { name: 'New' })).toBeNull();
    });

    it('renames an effect', () => {
      saveEffect('BeforeRename', { on: true });
      const updated = updateEffect('BeforeRename', { name: 'AfterRename' });
      expect(updated?.name).toBe('AfterRename');
      expect(getEffect('BeforeRename')).toBeUndefined();
      expect(getEffect('AfterRename')).toBeDefined();
    });

    it('updates state when new state provided', () => {
      saveEffect('UpdateState', { on: false });
      const updated = updateEffect('UpdateState', { state: { on: true, bri: 255 } });
      expect(updated?.state).toEqual({ on: true, bri: 255 });
    });

    it('refreshes capturedAt when state is updated', () => {
      const saved = saveEffect('UpdateTime', { on: false });
      // small delay to ensure timestamps differ
      const updated = updateEffect('UpdateTime', { state: { on: true } });
      expect(updated?.capturedAt).toBeDefined();
      // new capturedAt should be >= original
      expect(new Date(updated!.capturedAt) >= new Date(saved.capturedAt)).toBe(true);
    });

    it('preserves capturedAt when only renaming', () => {
      const saved = saveEffect('PreserveTs', { on: true });
      const updated = updateEffect('PreserveTs', { name: 'PreserveTsRenamed' });
      expect(updated?.capturedAt).toBe(saved.capturedAt);
    });

    it('updates capturedFromIp when provided', () => {
      saveEffect('UpdateIp', { on: true }, '1.2.3.4');
      const updated = updateEffect('UpdateIp', { capturedFromIp: '5.6.7.8' });
      expect(updated?.capturedFromIp).toBe('5.6.7.8');
    });
  });

  describe('deleteEffect()', () => {
    it('returns false for an unknown name', () => {
      expect(deleteEffect('NoSuchEffect_xyz')).toBe(false);
    });

    it('removes an existing effect and returns true', () => {
      saveEffect('ToDelete', { on: true });
      expect(deleteEffect('ToDelete')).toBe(true);
      expect(getEffect('ToDelete')).toBeUndefined();
    });

    it('does not affect other effects', () => {
      saveEffect('KeepMe', { on: true });
      saveEffect('DeleteMe', { on: false });
      deleteEffect('DeleteMe');
      expect(getEffect('KeepMe')).toBeDefined();
    });
  });
});
