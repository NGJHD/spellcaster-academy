/**
 * Young-typist pacing (owner, 2026-10-06): "At 12 words per minute, I still want to complete the game
 * under an hour." A bot plays each level the way a 12 WPM child does — about 1.5 s to read each new
 * word, then one letter per second — at the default (Normal) travel speed on Gentle, typing every word
 * the game shows (the game waits for all of them). The whole campaign must take under 60 minutes.
 */
import { describe, expect, it } from 'vitest';
import { TRAVEL_SPEED_MULTIPLIER } from '../state/settings';
import { useRunStore } from '../state/runStore';
import { GameRun } from './GameRun';
import type { KeyValueStorage } from './saveData';
import type { LevelId } from './types';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

/** 12 WPM = 60 characters a minute = one letter a second; a new word takes a moment to read first. */
const MS_PER_LETTER = 1000;
const READ_NEW_WORD_MS = 1500;
/** A perfect 12 WPM bot must finish in this time, leaving about a third for a real child's slips. */
const SIMULATED_LIMIT_MIN = 45;

export function playAtChildPace(levelId: LevelId) {
  let clock = 0;
  const run = new GameRun({
    difficulty: 'gentle',
    resume: null,
    storage: memoryStorage(),
    deferSavesUntilFirstCheckpoint: false,
    settings: () => ({ rail: { reducedMotion: false, travelSpeed: TRAVEL_SPEED_MULTIPLIER.normal } }),
    now: () => clock,
    levelId,
  });
  const dt = 1 / 30;
  let wait = READ_NEW_WORD_MS;
  let lastWord = '';
  let words = 0;
  const areaMinutes = new Map<string, number>();
  for (let frame = 0; frame < 120 * 60 * 30 && !run.isEnded; frame++) {
    clock += dt * 1000;
    run.update(dt);
    const area = run.currentAreaId;
    areaMinutes.set(area, (areaMinutes.get(area) ?? 0) + dt / 60);
    const ui = useRunStore.getState();
    if (ui.choice) {
      run.handleIntent({ kind: 'enter' });
      continue;
    }
    const label = ui.labels.find((l) => l.locked) ?? ui.labels[0];
    if (!label) continue;
    const key = `${label.id}:${label.word}`;
    if (key !== lastWord && label.correctLength === 0 && !label.locked) {
      lastWord = key;
      wait = READ_NEW_WORD_MS;
      words++;
    }
    wait -= dt * 1000;
    if (wait > 0) continue;
    wait = MS_PER_LETTER;
    const char = label.word[label.locked ? label.correctLength : label.pendingPrefix] ?? 'a';
    run.handleIntent({ kind: 'letter', char });
  }
  return { ended: run.isEnded, minutes: clock / 60000, words, areaMinutes };
}

describe('young-typist pacing (12 WPM, Normal travel, Gentle)', () => {
  it('the whole campaign takes under an hour', () => {
    const report: string[] = [];
    let total = 0;
    for (const id of ['level-1', 'level-2', 'level-3'] as const) {
      const r = playAtChildPace(id);
      expect(r.ended, `${id} finishes`).toBe(true);
      total += r.minutes;
      report.push(`${id}: ${r.minutes.toFixed(1)} min, ${r.words} words`);
      for (const [area, m] of r.areaMinutes) report.push(`    ${area.padEnd(24)} ${m.toFixed(1)} min`);
    }
    report.push(`TOTAL: ${total.toFixed(1)} min`);
    // The bot never errs or hesitates; real children take longer (mistakes, distraction), so the bot
    // must finish well inside the hour to leave that margin.
    expect(total, report.join('\n')).toBeLessThan(SIMULATED_LIMIT_MIN);
  }, 600_000);
});
