/**
 * Attention report (CLAUDE.md §1B): a bot plays Level 1 at the Fast travel speed and records the
 * longest wait with nothing to type in each area.
 */
import { describe, expect, it } from 'vitest';
import { TRAVEL_SPEED_MULTIPLIER } from '../state/settings';
import { useRunStore } from '../state/runStore';
import { ATTENTION_GAP_LIMIT_SEC, AttentionTracker, BOSS_INTRO_LIMIT_SEC, SPECTACLE_LIMIT_SEC } from './attention';
import { GameRun } from './GameRun';
import type { KeyValueStorage } from './saveData';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

export function measureGaps(msPerKey = 200) {
  let clock = 0;
  const run = new GameRun({
    difficulty: 'standard',
    resume: null,
    storage: memoryStorage(),
    deferSavesUntilFirstCheckpoint: false,
    settings: () => ({ rail: { reducedMotion: false, travelSpeed: TRAVEL_SPEED_MULTIPLIER.fast } }),
    now: () => clock,
  });
  const tracker = new AttentionTracker();
  const introTracker = new AttentionTracker();
  const spectacleTracker = new AttentionTracker();
  const dt = 1 / 30;
  let sinceKey = 0;
  for (let frame = 0; frame < 40 * 60 * 30 && !run.isEnded; frame++) {
    clock += dt * 1000;
    run.update(dt);
    const ui = useRunStore.getState();
    const beat = run.director.currentBeat;
    const beatId = beat?.id ?? '';
    const area = run.currentAreaId;
    const prompt = ui.labels.length > 0 || ui.choice !== null;
    const attention = beat && 'attention' in beat ? beat.attention : undefined;
    // Spectacle beats count as action for the main rule but are measured on their own.
    tracker.step(dt, area, beatId, prompt || attention === 'spectacle', attention === 'boss-intro' || attention === 'ending');
    introTracker.step(dt, area, beatId, prompt, attention !== 'boss-intro');
    spectacleTracker.step(dt, area, beatId, prompt, attention !== 'spectacle');
    if (ui.choice) {
      run.handleIntent({ kind: 'enter' });
      continue;
    }
    sinceKey += dt * 1000;
    if (sinceKey < msPerKey || ui.labels.length === 0) continue;
    sinceKey = 0;
    const label = ui.labels.find((l) => l.locked) ?? ui.labels[0];
    if (!label) continue;
    const char = label.word[label.locked ? label.correctLength : label.pendingPrefix] ?? 'a';
    run.handleIntent({ kind: 'letter', char });
  }
  return { gaps: tracker.report(), intros: introTracker.report(), spectacles: spectacleTracker.report(), ended: run.isEnded, minutes: clock / 60000 };
}

describe('attention rule (Level 1 at Fast)', () => {
  // Paused by the owner (2026-10-07: "Ignore the 7s rule for now") while the script is rewritten to read
  // naturally; lines are not cut or bent to fit it until it is switched back on.
  it.skip('never leaves more than 7 s with nothing to type (boss intros 8 s)', () => {
    const { gaps, intros, spectacles, ended, minutes } = measureGaps();
    expect(ended).toBe(true);
    const lines = gaps.map((g) => `${g.areaId.padEnd(22)} ${g.longest.toFixed(1).padStart(5)} s  (ends at ${g.beatId})`);
    console.log(`Level 1 at Fast: ${minutes.toFixed(1)} min\n${lines.join('\n')}`);
    for (const g of gaps) expect(g.longest, `${g.areaId} gap ending at ${g.beatId}`).toBeLessThanOrEqual(ATTENTION_GAP_LIMIT_SEC);
    for (const g of intros) expect(g.longest, `boss intro in ${g.areaId}`).toBeLessThanOrEqual(BOSS_INTRO_LIMIT_SEC);
    for (const g of spectacles) expect(g.longest, `spectacle ending at ${g.beatId}`).toBeLessThanOrEqual(SPECTACLE_LIMIT_SEC);
  });
});
