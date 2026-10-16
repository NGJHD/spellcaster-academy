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

describe('lines about switchable things', () => {
  /**
   * Lines that mention sparks, gems, star pages or lanterns but are about the story, not a pickup the
   * settings can remove (each checked by hand).
   */
  const STORY: ReadonlySet<string> = new Set([
    'court-chase', // the thief stole a page: an action chase, kept with collectibles off
    'court-chase-caught', // the stolen page, half erased (a clue)
    'por-5', // blank pages among the clues
    'power-chain', // Chain Spark's sparks jumping off the wand
    'gh-anchor-done', // the same sparks, as the last anchor lights
    'east-run-3', // the books' own pages going blank
    'lib-grim-pages', // the Grimoire's flying pages (boss attack)
    'l2-our-books', // the Wyrm made of library pages
    'l2-orin-ward', // the Lantern Ward (the shield), not a lantern pickup
    'l2-orin-beacons', // the beacons raise the Lantern Ward
    'l2-wyrm-motto', // "every page has a place"
    'l3-raft', // a raft made of a page
    'l3-journal', // the burning journal pages are required story targets
    'l3-quill-page',
    'l2-to-library',
    'l3-orin-thanks-1',
    'spell-chain', // Chain Spark's sparks
    'l2-lantern-lake', // the lake's name
    'l2-burning-library',
    'por-fountain', // catching healing droplets
  ]);
  it('every line about a pickup is skipped when that pickup is switched off', async () => {
    const { LINES } = await import('../content/dialogue');
    const { LINE_NEEDS } = await import('./GameRun');
    const pickup = /spark|gem|star page|page|lantern|collect|catch/i;
    const unexplained = Object.entries(LINES)
      .filter(([, l]) => pickup.test(l.text) && !/chain spark|spark bolt/i.test(l.text))
      .map(([id]) => id)
      .filter((id) => !(id in LINE_NEEDS) && !STORY.has(id));
    expect(unexplained, 'lines that mention a pickup the settings can remove').toEqual([]);
  });
});

describe('empty reveals', () => {
  it('a pan that only showed a star page is skipped with collectibles off', () => {
    useRunStore.setState(initialRunUi());
    let clock = 0;
    const run = new GameRun({
      difficulty: 'standard',
      resume: null,
      storage: memoryStorage(),
      deferSavesUntilFirstCheckpoint: false,
      settings: () => ({ rail: { reducedMotion: false, travelSpeed: 1.6 }, gems: false, collectibles: false }),
      now: () => clock,
      startBeatId: 'greenhouse-leaf-pan',
    });
    for (let t = 0; t < 0.5; t += 1 / 30) {
      clock += 1000 / 30;
      run.update(1 / 30);
    }
    expect(run.director.currentBeat?.id).not.toBe('greenhouse-leaf-pan');
  });
});
