import { describe, expect, it } from 'vitest';
import { beatIndexOf, resolveBeatId } from '../level/level1Route';
import { GameRun } from './GameRun';
import { AUTOSAVE_KEY, newAutosave, readAutosave, type KeyValueStorage } from './saveData';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

describe('resuming a save made before the excitement rewrite', () => {
  it('loads and resumes at the beat that replaced a removed one', () => {
    const storage = memoryStorage();
    const old = { ...newAutosave('run-old', 'standard', 'east-hall-mira'), areaId: 'east-hall' as const, resumeWaveIndex: 2 };
    storage.setItem(AUTOSAVE_KEY, JSON.stringify(old));
    const save = readAutosave(storage, (id) => resolveBeatId(id) !== null);
    expect(save?.resumeBeatId).toBe('east-hall-mira');

    let clock = 0;
    const run = new GameRun({
      difficulty: 'standard',
      resume: save,
      storage,
      deferSavesUntilFirstCheckpoint: false,
      settings: () => ({ rail: { reducedMotion: false, travelSpeed: 1.6 } }),
      now: () => clock,
    });
    for (let i = 0; i < 90; i++) {
      clock += 1000 / 30;
      run.update(1 / 30);
    }
    // Resumed at the replacement beat (and may already have moved on to the next one).
    expect(beatIndexOf(run.director.currentBeat?.id ?? '')).toBeGreaterThanOrEqual(beatIndexOf('east-hall-door'));
    expect(run.currentAreaId).toBe('east-hall');
    expect(run.progress.resumeBeatId).not.toBe('east-hall-mira');
  });
});
