import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSettings, sanitizeSettings } from './settings';
import { getRun, setGameStorage, useGameStore } from './gameStore';

function memoryStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}

describe('settings sanitising', () => {
  it('returns defaults for missing or corrupt data', () => {
    expect(sanitizeSettings(undefined)).toEqual(defaultSettings());
    expect(sanitizeSettings('garbage')).toEqual(defaultSettings());
    expect(sanitizeSettings(null)).toEqual(defaultSettings());
  });

  it('keeps valid fields and replaces invalid ones', () => {
    const s = sanitizeSettings({ showWpm: true, travelSpeed: 'warp', volumes: { music: 2, sfx: 0.3 } });
    expect(s.showWpm).toBe(true);
    expect(s.travelSpeed).toBe('normal');
    expect(s.volumes.music).toBe(1);
    expect(s.volumes.sfx).toBe(0.3);
    expect(s.quality).toBe('medium');
  });

});

describe('game store pause flow', () => {
  beforeEach(() => {
    setGameStorage(memoryStorage());
    useGameStore.setState({ mode: 'menu', modeBeforePause: 'exploration' });
  });

  it('cannot pause from the title menu', () => {
    useGameStore.getState().pause();
    expect(useGameStore.getState().mode).toBe('menu');
  });

  it('pausing and resuming returns to the previous mode and creates a run', () => {
    const store = useGameStore.getState();
    store.startNewRun('standard');
    expect(getRun()).not.toBeNull();
    useGameStore.setState({ mode: 'combat' });
    store.pause();
    expect(useGameStore.getState().mode).toBe('paused');
    store.pause();
    store.resume();
    expect(useGameStore.getState().mode).toBe('combat');
    store.quitToMenu();
    expect(getRun()).toBeNull();
  });
});
