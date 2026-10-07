/** Owner (2026-10-07): spark gems can be switched off to judge the pacing without them. */
import { describe, expect, it } from 'vitest';
import { initialRunUi, useRunStore } from '../state/runStore';
import { GameRun } from './GameRun';
import type { KeyValueStorage } from './saveData';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

function seen(settings: { gems: boolean; collectibles: boolean }, beat: string, seconds: number, kinds: readonly string[]): number {
  useRunStore.setState(initialRunUi());
  let clock = 0;
  const run = new GameRun({
    difficulty: 'standard',
    resume: null,
    storage: memoryStorage(),
    deferSavesUntilFirstCheckpoint: false,
    settings: () => ({ rail: { reducedMotion: false, travelSpeed: 1.6 }, ...settings }),
    now: () => clock,
    startBeatId: beat,
  });
  let most = 0;
  for (let t = 0; t < seconds; t += 1 / 30) {
    clock += 1000 / 30;
    run.update(1 / 30);
    most = Math.max(most, useRunStore.getState().labels.filter((l) => kinds.includes(l.kind)).length);
  }
  return most;
}

const ON = { gems: true, collectibles: true };
const OFF = { gems: false, collectibles: false };

describe('spark gems and collectibles settings', () => {
  it('the opening fly-in shows its sky gems when gems are on', () => {
    expect(seen(ON, 'arrival-flyover', 6, ['gem'])).toBeGreaterThan(0);
  });
  it('shows no gems when gems are off', () => {
    expect(seen(OFF, 'arrival-flyover', 6, ['gem'])).toBe(0);
    expect(seen(OFF, 'library-follow-book', 8, ['gem'])).toBe(0);
  });
  it('shows star pages and lanterns only when collectibles are on', () => {
    expect(seen(ON, 'courtyard-fountain-reveal', 4, ['star-page'])).toBeGreaterThan(0);
    expect(seen(OFF, 'courtyard-fountain-reveal', 4, ['star-page'])).toBe(0);
    expect(seen(ON, 'l2-lake-push-off', 6, ['gem'])).toBeGreaterThan(0);
    expect(seen(OFF, 'l2-lake-push-off', 6, ['gem'])).toBe(0);
  });
});
