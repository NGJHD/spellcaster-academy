/**
 * Speech timing rules (owner, 2026-10-06): typing never cuts a line, and the story never cuts a line
 * either — the scene waits for its lines, so each one plays in full, in its own scene.
 */
import { describe, expect, it } from 'vitest';
import { getLine } from '../content/dialogue';
import { TRAVEL_SPEED_MULTIPLIER } from '../state/settings';
import { useRunStore } from '../state/runStore';
import { GameRun, readSeconds } from './GameRun';
import type { KeyValueStorage } from './saveData';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

function runAt(beat: string, travelSpeed = 1.3) {
  let clock = 0;
  const run = new GameRun({
    difficulty: 'standard',
    resume: null,
    storage: memoryStorage(),
    deferSavesUntilFirstCheckpoint: false,
    settings: () => ({ rail: { reducedMotion: false, travelSpeed } }),
    now: () => clock,
    startBeatId: beat,
  });
  const step = (sec: number) => {
    for (let t = 0; t < sec; t += 1 / 30) {
      clock += 1000 / 30;
      run.update(1 / 30);
    }
  };
  /** Types like a child: the next letter of the locked (or first) word, every `everySec`. */
  const typeFor = (sec: number, everySec = 0.3) => {
    for (let t = 0; t < sec; t += everySec) {
      const s = useRunStore.getState();
      const label = s.labels.find((l) => l.locked) ?? s.labels[0];
      if (label) run.handleIntent({ kind: 'letter', char: label.word[label.correctLength] ?? 'a' });
      step(everySec);
    }
  };
  return { run, step, typeFor };
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

  it('the opening fly-in at Fast plays every line in full (owner bug: lines cut as the next was due)', () => {
    const { typeFor } = runAt('arrival-flyover', TRAVEL_SPEED_MULTIPLIER.fast);
    const shown = new Map<number, { text: string; sec: number }>();
    let lastKey = -1;
    for (let i = 0; i < 400 && useRunStore.getState().beatId !== 'arrival-crystals'; i++) {
      typeFor(0.1, 0.1);
      const sub = useRunStore.getState().subtitle;
      if (!sub) continue;
      const entry = shown.get(sub.key) ?? { text: sub.text, sec: 0 };
      entry.sec += 0.1;
      shown.set(sub.key, entry);
      lastKey = sub.key;
    }
    expect(shown.size).toBeGreaterThanOrEqual(2);
    for (const [key, { text, sec }] of shown) {
      if (key === lastKey) continue; // still playing when we stopped
      expect(sec, `"${text}" was cut after ${sec.toFixed(1)} s`).toBeGreaterThanOrEqual(readSeconds(text) - 0.2);
    }
  });

  it('a scene waits for its own lines before the story moves on', () => {
    const { step } = runAt('arrival-ward-fracture', TRAVEL_SPEED_MULTIPLIER.fast);
    const seen: string[] = [];
    for (let i = 0; i < 300; i++) {
      step(0.1);
      const t = useRunStore.getState().subtitle?.text;
      if (t && seen[seen.length - 1] !== t) seen.push(t);
    }
    expect(seen.slice(0, 2)).toEqual([getLine('fracture-3')?.text, getLine('fracture-4')?.text]);
  });
});
