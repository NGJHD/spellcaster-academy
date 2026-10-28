import { describe, expect, it } from 'vitest';
import { beatIndexOf, resolveBeatId } from '../level/level1Route';
import { GameRun } from './GameRun';
import { AUTOSAVE_KEY, newAutosave, PROFILE_KEY, readAutosave, readProfile, type KeyValueStorage } from './saveData';

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

describe('medal totals in saves', () => {
  it('survive a save round-trip and default to zero for older saves', () => {
    const storage = memoryStorage();
    const save = newAutosave('run-medals', 'standard', 'courtyard-c1');
    save.metrics.medalsEarned = 4;
    save.metrics.medalStars = 10;
    save.metrics.threeStarMedals = 2;
    storage.setItem(AUTOSAVE_KEY, JSON.stringify(save));
    const loaded = readAutosave(storage, (id) => resolveBeatId(id) !== null);
    expect(loaded?.metrics.medalStars).toBe(10);
    expect(loaded?.metrics.threeStarMedals).toBe(2);

    const older = JSON.parse(JSON.stringify(save)) as { metrics: Record<string, unknown> };
    delete older.metrics.medalsEarned;
    delete older.metrics.medalStars;
    delete older.metrics.threeStarMedals;
    storage.setItem(AUTOSAVE_KEY, JSON.stringify(older));
    expect(readAutosave(storage, (id) => resolveBeatId(id) !== null)?.metrics.medalStars).toBe(0);
  });
});

describe('the Starlight trail in older profiles', () => {
  it('is given to a profile that finished Level 1 before the chest was removed', () => {
    const storage = memoryStorage();
    storage.setItem(PROFILE_KEY, JSON.stringify({ completedLevels: ['level-1'], cosmetics: [] }));
    expect(readProfile(storage).cosmetics).toEqual(['trail-starlight']);
  });

  it('is not given before Level 1 is finished', () => {
    const storage = memoryStorage();
    storage.setItem(PROFILE_KEY, JSON.stringify({ completedLevels: [], cosmetics: [] }));
    expect(readProfile(storage).cosmetics).toEqual([]);
  });
});
