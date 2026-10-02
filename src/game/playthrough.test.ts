/**
 * Headless playthroughs of the complete level: a bot reads the HUD labels and types like a child would.
 * Proves the level can always be finished (no blocking beats) and that metrics/saves stay coherent.
 */
import { describe, expect, it } from 'vitest';
import { LEVEL1_ENCOUNTERS, LEVEL1_ROUTE } from '../level/level1Route';
import { useRunStore } from '../state/runStore';
import { GameRun } from './GameRun';
import { AUTOSAVE_KEY, readAutosave, readProfile, type KeyValueStorage } from './saveData';
import { ALL_STAR_PAGES, type Difficulty } from './types';

function memoryStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: (k) => map.get(k) ?? null, setItem: (k, v) => void map.set(k, v), removeItem: (k) => void map.delete(k) };
}

interface BotOptions {
  difficulty: Difficulty;
  msPerKey: number;
  mistakeEvery?: number;
  maxMinutes?: number;
  storage?: KeyValueStorage;
  stopAtBeat?: string;
  resume?: ReturnType<typeof readAutosave>;
}

function play(o: BotOptions) {
  const storage = o.storage ?? memoryStorage();
  let clock = 0;
  const run = new GameRun({
    difficulty: o.difficulty,
    resume: o.resume ?? null,
    storage,
    deferSavesUntilFirstCheckpoint: false,
    settings: () => ({ rail: { reducedMotion: false, travelSpeed: 1.3 }, reducedShake: true }),
    now: () => clock,
  });
  const dt = 1 / 30;
  let sinceKey = 0;
  let keys = 0;
  let pendingFix = false;
  const limit = (o.maxMinutes ?? 60) * 60 * 30;
  for (let frame = 0; frame < limit && !run.isEnded; frame++) {
    clock += dt * 1000;
    run.update(dt);
    if (o.stopAtBeat && run.director.currentBeat?.id === o.stopAtBeat) break;
    const ui = useRunStore.getState();
    if (ui.choice) {
      run.handleIntent({ kind: 'enter' });
      continue;
    }
    sinceKey += dt * 1000;
    if (sinceKey < o.msPerKey || ui.labels.length === 0) continue;
    sinceKey = 0;
    if (pendingFix) {
      run.handleIntent({ kind: 'backspace' });
      pendingFix = false;
      continue;
    }
    const locked = ui.labels.find((l) => l.locked);
    const label = locked ?? ui.labels.find((l) => l.optional) ?? ui.labels.find((l) => l.priority) ?? ui.labels[0];
    if (!label) continue;
    keys++;
    if (o.mistakeEvery && keys % o.mistakeEvery === 0 && locked) {
      run.handleIntent({ kind: 'letter', char: 'q' === label.word[label.correctLength] ? 'z' : 'q' });
      pendingFix = o.difficulty !== 'gentle';
      continue;
    }
    const char = label.word[locked ? label.correctLength : label.pendingPrefix] ?? label.word[0] ?? 'a';
    run.handleIntent({ kind: 'letter', char });
  }
  return { run, storage, clock };
}

describe('full Level 1 playthrough', () => {
  it('a steady Standard typist reaches the results screen', () => {
    const { run, storage, clock } = play({ difficulty: 'standard', msPerKey: 160 });
    expect(run.isEnded).toBe(true);
    const results = useRunStore.getState().results;
    expect(results).not.toBeNull();
    expect(run.progress.restoredAnchors.sort()).toEqual(['courtyard', 'greenhouse', 'library']);
    expect(run.progress.completedBossPhases).toEqual(
      expect.arrayContaining(['grimoire-clasps', 'grimoire-pages', 'grimoire-sentence', 'warden-shell', 'warden-runes', 'warden-repair']),
    );
    expect(run.progress.unlockedSpells).toEqual(expect.arrayContaining(['spark-bolt', 'frost-thread', 'chain-spark']));
    // The bot types every visible word, so it collects every star page and both cosmetics.
    expect([...run.progress.collectedStarPageIds].sort()).toEqual([...ALL_STAR_PAGES].sort());
    expect(run.progress.unlockedCosmeticIds).toHaveLength(2);
    expect(results?.accuracy).toBe(100);
    expect(results?.averageWpm ?? 0).toBeGreaterThan(40);
    const save = readAutosave(storage, (id) => LEVEL1_ROUTE.beats.some((b) => b.id === id));
    expect(save?.status).toBe('complete');
    expect(readProfile(storage).levelCompleted).toBe(true);
    // The owner asked for a much brisker pace than LD-1's 20–30 minutes; a quick adult typist now
    // finishes in about 7 minutes. Guard against the level collapsing into something trivially short.
    expect(clock / 60000).toBeGreaterThan(5);
  });

  it('a slow Gentle typist with mistakes still finishes', () => {
    const { run } = play({ difficulty: 'gentle', msPerKey: 450, mistakeEvery: 9 });
    expect(run.isEnded).toBe(true);
    const r = useRunStore.getState().results;
    expect(r?.accuracy ?? 100).toBeLessThan(100);
    expect(r?.firstAttemptAccuracy ?? 100).toBeLessThan(100);
  });

  it('Challenge with mistakes still finishes', () => {
    const { run } = play({ difficulty: 'challenge', msPerKey: 130, mistakeEvery: 13 });
    expect(run.isEnded).toBe(true);
  });

  it('resumes from a mid-level save without losing collected progress', () => {
    const storage = memoryStorage();
    const first = play({ difficulty: 'standard', msPerKey: 160, storage, stopAtBeat: 'library-l2' });
    const pagesBefore = first.run.progress.collectedStarPageIds.length;
    first.run.saveNow();
    expect(storage.map.has(AUTOSAVE_KEY)).toBe(true);
    const save = readAutosave(storage, (id) => LEVEL1_ROUTE.beats.some((b) => b.id === id));
    expect(save?.resumeBeatId).toBe('library-l2');
    expect(save?.restoredAnchors).toEqual(['courtyard']);
    const second = play({ difficulty: 'standard', msPerKey: 160, storage, resume: save });
    expect(second.run.isEnded).toBe(true);
    expect(second.run.progress.collectedStarPageIds.length).toBeGreaterThanOrEqual(pagesBefore);
    // Words committed before the save are not double counted after resuming.
    const words = second.run.progress.metrics.completedWords;
    const fresh = play({ difficulty: 'standard', msPerKey: 160 }).run.progress.metrics.completedWords;
    expect(Math.abs(words - fresh)).toBeLessThan(fresh * 0.1);
  });

  it('every encounter is reached in one run', () => {
    const { run } = play({ difficulty: 'standard', msPerKey: 160 });
    const optional = new Set([...LEVEL1_ENCOUNTERS.values()].filter((e) => e.optionalPrompt).map((e) => e.id));
    for (const id of LEVEL1_ENCOUNTERS.keys()) {
      if (!optional.has(id)) expect(run.progress.completedEncounterIds, id).toContain(id);
    }
  });
}, 120_000);
