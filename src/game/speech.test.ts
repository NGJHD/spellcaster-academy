/**
 * Speech timing rules (owner, 2026-10-06): typing never cuts a line, and lines always match the scene
 * (a new scene's lines replace older ones; stale lines are dropped rather than said late).
 */
import { describe, expect, it } from 'vitest';
import { getLine } from '../content/dialogue';
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
    settings: () => ({ rail: { reducedMotion: false, travelSpeed: 1.3 } }),
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

describe('speech timing', () => {
  it('typing a letter does not stop the line being said', () => {
    const { run, step } = runAt('courtyard-c1');
    step(2.5);
    const sub = useRunStore.getState().subtitle;
    expect(sub?.text).toBe(getLine('court-1')?.text);
    const label = useRunStore.getState().labels[0];
    expect(label).toBeDefined();
    if (!label) return;
    run.handleIntent({ kind: 'letter', char: label.word[0] ?? 'a' });
    step(0.1);
    expect(useRunStore.getState().subtitle?.key).toBe(sub?.key);
  });

  it("a new scene's lines replace older ones: an earlier scene's line is never said again", () => {
    const { run, step } = runAt('courtyard-c1');
    step(2.5);
    const first = useRunStore.getState().subtitle?.text;
    expect(first).toBe(getLine('court-1')?.text);
    // Type through the fight like a child until the next scene with its own line (courtyard-c2) starts.
    for (let i = 0; i < 4000 && useRunStore.getState().beatId !== 'courtyard-c2'; i++) {
      const s = useRunStore.getState();
      const label = s.labels.find((l) => l.locked) ?? s.labels[0];
      if (label) run.handleIntent({ kind: 'letter', char: label.word[label.correctLength] ?? 'a' });
      step(0.1);
    }
    expect(useRunStore.getState().beatId).toBe('courtyard-c2');
    for (let i = 0; i < 60; i++) {
      step(0.1);
      expect(useRunStore.getState().subtitle?.text).not.toBe(first);
    }
  });
});
