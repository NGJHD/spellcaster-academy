import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore';
import { defaultSettings, sanitizeSettings } from './settings';

describe('settings sanitising', () => {
  it('returns defaults for missing or corrupt data', () => {
    expect(sanitizeSettings(undefined)).toEqual(defaultSettings());
    expect(sanitizeSettings('garbage')).toEqual(defaultSettings());
    expect(sanitizeSettings(null)).toEqual(defaultSettings());
  });

  it('keeps valid fields and replaces invalid ones', () => {
    expect(sanitizeSettings({ reducedMotion: true, travelSpeed: 'warp' })).toEqual({
      reducedMotion: true,
      travelSpeed: 'normal',
    });
    expect(sanitizeSettings({ travelSpeed: 'slow', unknownField: 1 })).toEqual({
      reducedMotion: false,
      travelSpeed: 'slow',
    });
  });

  it('respects the OS reduced-motion preference as the default', () => {
    expect(defaultSettings(true).reducedMotion).toBe(true);
  });
});

describe('game store pause flow', () => {
  beforeEach(() => useGameStore.setState({ mode: 'menu', modeBeforePause: 'exploration' }));

  it('cannot pause from the title menu', () => {
    useGameStore.getState().pause();
    expect(useGameStore.getState().mode).toBe('menu');
  });

  it('returns to the mode that was active before pausing', () => {
    const store = useGameStore.getState();
    store.startLevel();
    useGameStore.setState({ mode: 'combat' });
    store.pause();
    expect(useGameStore.getState().mode).toBe('paused');
    store.pause(); // double pause is harmless
    store.resume();
    expect(useGameStore.getState().mode).toBe('combat');
  });

  it('starting a level bumps the run id', () => {
    const before = useGameStore.getState().runId;
    useGameStore.getState().startLevel();
    expect(useGameStore.getState().runId).toBe(before + 1);
  });
});
