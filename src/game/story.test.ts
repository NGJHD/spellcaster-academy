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
  it('the Warden says hello, the apprentice types "hi", and it waves', () => {
    const { run, step } = runAt('arrival-warden-hello');
    step(2);
    const hi = useRunStore.getState().labels.find((l) => l.word === 'hi');
    expect(hi).toBeDefined();
    run.handleIntent({ kind: 'letter', char: 'h' });
    run.handleIntent({ kind: 'letter', char: 'i' });
    const said: string[] = [];
    for (let i = 0; i < 200; i++) {
      step(0.1);
      const t = useRunStore.getState().subtitle?.text;
      if (t && said[said.length - 1] !== t) said.push(t);
    }
    expect(said).toContain(getLine('warden-wave')?.text);
  });

  it('a reveal holds on its waiting word instead of panning away (owner: "shelf" in the library)', () => {
    const { run, step } = runAt('library-balcony-pan');
    step(12);
    const page = run.level.route.lookPoints.LIB_BALCONY_PAGE;
    expect(page).toBeDefined();
    if (!page) return;
    const pose = run.director.pose;
    const look = pose.lookAt;
    const toLook = Math.hypot(look.x - page[0], look.y - page[1], look.z - page[2]);
    expect(run.director.currentBeat?.id).toBe('library-balcony-pan');
    expect(toLook, 'camera still looking at the balcony page').toBeLessThan(1.5);
  });

  /**
   * Every line that promises a number of words or things (owner: "name all three" when there were
   * two) names an encounter here, and that encounter must have exactly that many.
   */
  const COUNT_CLAIMS: readonly { line: string; encounter: string; count: number; of: 'targets' | 'words' }[] = [
    { line: 'lib-anchor-intro', encounter: 'library-anchor', count: 3, of: 'words' },
    { line: 'gh-anchor-intro', encounter: 'greenhouse-anchor', count: 3, of: 'targets' },
  ];
  it.each(COUNT_CLAIMS)('"$line" matches $encounter', ({ line, encounter, count, of }) => {
    const def = [...Object.values(LEVELS)].map((l) => l.encounters.get(encounter)).find((d) => d);
    expect(def, encounter).toBeDefined();
    if (!def) return;
    const required = def.waves.flatMap((w) => w.targets.filter((t) => !t.optional && !t.challengeOnly));
    const n = of === 'targets' ? required.length : required.reduce((m, t) => m + t.words.length, 0);
    expect(n, getLine(line)?.text).toBe(count);
  });
});
