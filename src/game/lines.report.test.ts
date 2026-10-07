/**
 * Every story line is heard (owner, 2026-10-07: "you need to be more careful"; "did you review the
 * conversations?"). A bot plays each level with spark gems and collectibles off, records every subtitle
 * shown, and checks that each line wired into a beat it passed through was actually said: beat lines,
 * conversations, lines on waves, defeats and finishing a fight, and lines on defeating a target.
 * Only typing tips may go unsaid (lines marked `tip`, and lines on the first letter, first mistake or
 * low HP, which a good typist may never trigger).
 */
import { describe, expect, it } from 'vitest';
import { getLine } from '../content/dialogue';
import { LEVELS } from '../level/levels';
import type { LevelBeat } from '../level/levelTypes';
import { TRAVEL_SPEED_MULTIPLIER } from '../state/settings';
import { initialRunUi, useRunStore } from '../state/runStore';
import { GameRun, LINE_NEEDS } from './GameRun';
import type { KeyValueStorage } from './saveData';
import type { LevelId } from './types';

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

const TIPS = new Set(['first-correct', 'first-mistake', 'focus-below']);

function play(levelId: LevelId) {
  useRunStore.setState(initialRunUi());
  let clock = 0;
  const run = new GameRun({
    difficulty: 'standard',
    resume: null,
    storage: memoryStorage(),
    deferSavesUntilFirstCheckpoint: false,
    settings: () => ({ rail: { reducedMotion: false, travelSpeed: TRAVEL_SPEED_MULTIPLIER.fast }, gems: false, collectibles: false }),
    now: () => clock,
    levelId,
  });
  const said = new Set<string>();
  const visited = new Set<string>();
  const dt = 1 / 30;
  let sinceKey = 0;
  for (let frame = 0; frame < 60 * 60 * 30 && !run.isEnded; frame++) {
    clock += dt * 1000;
    run.update(dt);
    const ui = useRunStore.getState();
    const id = run.director.currentBeat?.id;
    if (id) visited.add(id);
    if (ui.subtitle) said.add(ui.subtitle.text);
    if (ui.choice) {
      run.handleIntent({ kind: 'enter' });
      continue;
    }
    sinceKey += dt * 1000;
    if (sinceKey < 200 || ui.labels.length === 0) continue;
    sinceKey = 0;
    const label = ui.labels.find((l) => l.locked) ?? ui.labels[0];
    if (!label) continue;
    run.handleIntent({ kind: 'letter', char: label.word[label.locked ? label.correctLength : label.pendingPrefix] ?? 'a' });
  }
  return { said, visited, ended: run.isEnded };
}

/** Lines a beat should be heard saying (with gems and collectibles off, on Standard). */
function expectedLines(levelId: LevelId, beat: LevelBeat): string[] {
  const out: string[] = [];
  const level = LEVELS[levelId];
  for (const id of beat.barks ?? []) if (!LINE_NEEDS[id]) out.push(id);
  if (beat.kind === 'dialogue') out.push(...beat.lines);
  if (beat.kind === 'encounter') {
    const def = level.encounters.get(beat.encounterId);
    if (!def) return out;
    const required = def.waves.flatMap((w) => w.targets.filter((t) => !t.optional && !t.challengeOnly));
    for (const bark of def.barks ?? []) {
      const w = bark.when;
      if (TIPS.has(w.on)) continue;
      if (w.on === 'wave-start' && w.wave >= def.waves.length) continue;
      if (w.on === 'defeats' && w.count > required.length) continue;
      out.push(bark.line);
    }
    for (const t of required) if (t.defeatBark) out.push(t.defeatBark);
  }
  return out;
}

describe('every story line is heard (gems and collectibles off)', () => {
  for (const levelId of ['level-1', 'level-2', 'level-3'] as const) {
    it(`${levelId}`, () => {
      const { said, visited, ended } = play(levelId);
      expect(ended).toBe(true);
      const missing: string[] = [];
      for (const beat of LEVELS[levelId].route.beats) {
        if (!visited.has(beat.id)) continue;
        for (const id of expectedLines(levelId, beat)) {
          const line = getLine(id);
          if (!line || line.tip) continue;
          const text = line.text;
          if (!said.has(text)) missing.push(`${beat.id}: ${id} "${text}"`);
        }
      }
      expect(missing).toEqual([]);
    }, 120_000);
  }
});
