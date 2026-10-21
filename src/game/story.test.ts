/**
 * Story checks from the 2026-10-07 playtest: the Warden is met before the ward cracks, and lines that
 * count things match what is on screen.
 */
import { describe, expect, it } from 'vitest';
import { getLine } from '../content/dialogue';
import { LEVELS } from '../level/levels';
import { useRunStore } from '../state/runStore';
import { GameRun } from './GameRun';
import type { KeyValueStorage } from './saveData';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

function runAt(beat: string) {
  let clock = 0;
  const run = new GameRun({
    difficulty: 'standard',
    resume: null,
    storage: memoryStorage(),
    deferSavesUntilFirstCheckpoint: false,
    settings: () => ({ rail: { reducedMotion: false, travelSpeed: 1.6 } }),
    now: () => clock,
    startBeatId: beat,
  });
  const step = (sec: number) => {
    for (let t = 0; t < sec; t += 1 / 30) {
      clock += 1000 / 30;
      run.update(1 / 30);
    }
  };
  return { run, step };
}

describe('story', () => {
  it('the Warden says hello and waits for the apprentice to type "hi"', () => {
    const { run, step } = runAt('arrival-warden-hello');
    step(2);
    expect(useRunStore.getState().labels.find((l) => l.word === 'hi')).toBeDefined();
    step(6);
    expect(run.director.currentBeat?.id, 'the camera waits for "hi"').toBe('arrival-warden-hello');
    run.handleIntent({ kind: 'letter', char: 'h' });
    run.handleIntent({ kind: 'letter', char: 'i' });
    step(8);
    expect(run.director.currentBeat?.id).not.toBe('arrival-warden-hello');
  });

  /**
   * Every line that promises a number of words or things (owner: "name all three" when there were
   * two) names an encounter here, and that encounter must have exactly that many.
   */
  const COUNT_CLAIMS: readonly { line: string; encounter: string; count: number; of: 'targets' | 'words' | 'markers' }[] = [
    { line: 'l3-save-pip', encounter: 'l3-u3', count: 3, of: 'markers' }, // "Brave, curious, kind"
    { line: 'lib-anchor-intro', encounter: 'library-anchor', count: 3, of: 'words' },
    { line: 'gh-anchor-intro', encounter: 'greenhouse-anchor', count: 3, of: 'targets' },
  ];
  it.each(COUNT_CLAIMS)('"$line" matches $encounter', ({ line, encounter, count, of }) => {
    const def = [...Object.values(LEVELS)].map((l) => l.encounters.get(encounter)).find((d) => d);
    expect(def, encounter).toBeDefined();
    if (!def) return;
    const required = def.waves.flatMap((w) => w.targets.filter((t) => !t.optional && !t.challengeOnly));
    const n = of === 'targets' ? required.length : of === 'markers' ? required.filter((t) => t.kind === 'marker').length : required.reduce((m, t) => m + t.words.length, 0);
    expect(n, getLine(line)?.text).toBe(count);
  });
});
