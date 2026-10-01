import { describe, expect, it } from 'vitest';
import { PHRASES, WORDS } from '../content/wordLists';
import { adjustLengthRange } from '../game/difficulty';
import { interpretKey, shouldPreventDefault } from './keys';
import { MAX_BUFFERED_MISTAKES, TypingEngine, type TypingCandidate, type TypingEvent } from './TypingEngine';
import {
  IDLE_GAP_MS,
  TypingMetricsRecorder,
  averageWpm,
  characterAccuracy,
  emptyMetrics,
  fastestWord,
  firstAttemptWordAccuracy,
  peakRollingWpm,
  wpm,
} from './TypingMetrics';
import { WordAssigner, createRng } from './WordAssigner';

function engine(candidates: TypingCandidate[], rejectMistakes = false, centrality: Record<string, number> = {}) {
  const e = new TypingEngine({ rejectMistakes, centralityOf: (id) => centrality[id] ?? 0 });
  e.setCandidates(candidates);
  return e;
}

function typeAll(e: TypingEngine, text: string): TypingEvent[] {
  return [...text].flatMap((c) => e.typeLetter(c));
}

describe('key interpretation', () => {
  it('normalises uppercase letters to lowercase', () => {
    expect(interpretKey({ key: 'S', shiftKey: true })).toEqual({ kind: 'letter', char: 's' });
  });

  it('ignores modifier-only, function and navigation keys', () => {
    for (const key of ['Shift', 'Control', 'Alt', 'Meta', 'F5', 'Home', 'PageDown', 'CapsLock', '1', '!']) {
      expect(interpretKey({ key }).kind).toBe('ignored');
    }
  });

  it('ignores letters typed with Ctrl, Alt or Meta (browser shortcuts)', () => {
    expect(interpretKey({ key: 'f', ctrlKey: true }).kind).toBe('ignored');
    expect(interpretKey({ key: 'r', metaKey: true }).kind).toBe('ignored');
    expect(shouldPreventDefault({ key: 'f', ctrlKey: true })).toBe(false);
  });

  it('ignores letter auto-repeat but allows Backspace repeat', () => {
    expect(interpretKey({ key: 'a', repeat: true }).kind).toBe('ignored');
    expect(interpretKey({ key: 'Backspace', repeat: true }).kind).toBe('backspace');
  });

  it('prevents quick-find and focus keys during gameplay', () => {
    expect(shouldPreventDefault({ key: '/' })).toBe(true);
    expect(shouldPreventDefault({ key: "'" })).toBe(true);
    expect(shouldPreventDefault({ key: 'Tab' })).toBe(true);
  });
});

describe('TypingEngine', () => {
  it('locks by initial and completes a word with correct letters', () => {
    const e = engine([{ id: 'a', word: 'sun' }, { id: 'b', word: 'map' }]);
    const events = typeAll(e, 'sun');
    expect(events[0]).toEqual({ type: 'lock', targetId: 'a' });
    expect(events.filter((ev) => ev.type === 'correct')).toHaveLength(3);
    expect(events.at(-1)).toEqual({ type: 'complete', targetId: 'a', word: 'sun', mistakes: 0 });
    expect(e.lockedId).toBeNull();
  });

  it('once locked, input goes only to that target', () => {
    const e = engine([{ id: 'a', word: 'star' }, { id: 'b', word: 'moon' }]);
    e.typeLetter('s');
    const events = e.typeLetter('m');
    expect(events).toEqual([{ type: 'incorrect', targetId: 'a', char: 'm' }]);
    expect(e.lockedId).toBe('a');
  });

  it('buffers an incorrect letter until Backspace corrects it', () => {
    const e = engine([{ id: 'a', word: 'book' }]);
    typeAll(e, 'bx');
    expect(e.view.correctLength).toBe(1);
    expect(e.view.wrongText).toBe('x');
    // Typing the right letter while a mistake is buffered stacks another mistake.
    expect(e.typeLetter('o')[0]?.type).toBe('incorrect');
    expect(e.backspace()).toEqual([{ type: 'corrected', targetId: 'a' }]);
    expect(e.backspace()).toEqual([{ type: 'corrected', targetId: 'a' }]);
    const done = typeAll(e, 'ook');
    expect(done.at(-1)).toEqual({ type: 'complete', targetId: 'a', word: 'book', mistakes: 2 });
  });

  it('caps buffered mistakes', () => {
    const e = engine([{ id: 'a', word: 'book' }]);
    typeAll(e, 'b' + 'x'.repeat(MAX_BUFFERED_MISTAKES + 3));
    expect(e.view.wrongText).toHaveLength(MAX_BUFFERED_MISTAKES);
  });

  it('Gentle mode flashes mistakes without buffering them', () => {
    const e = engine([{ id: 'a', word: 'book' }], true);
    typeAll(e, 'bx');
    expect(e.view.wrongText).toBe('');
    const done = typeAll(e, 'ook');
    expect(done.at(-1)).toMatchObject({ type: 'complete', mistakes: 1 });
  });

  it('Backspace erases correct letters and releases an empty lock', () => {
    const e = engine([{ id: 'a', word: 'moon' }]);
    typeAll(e, 'mo');
    expect(e.backspace()).toEqual([{ type: 'erased', targetId: 'a' }]);
    expect(e.backspace()).toEqual([{ type: 'erased', targetId: 'a' }]);
    expect(e.backspace()).toEqual([{ type: 'unlock', targetId: 'a' }]);
    expect(e.lockedId).toBeNull();
  });

  it('a letter matching no target is an incorrect entry', () => {
    const e = engine([{ id: 'a', word: 'moon' }]);
    expect(e.typeLetter('z')).toEqual([{ type: 'incorrect', targetId: null, char: 'z' }]);
  });

  it('duplicate initials need a second letter before locking', () => {
    const e = engine([{ id: 'a', word: 'star' }, { id: 'b', word: 'sun' }]);
    const first = e.typeLetter('s');
    expect(first.map((ev) => ev.type)).toEqual(['correct', 'pending']);
    expect(e.lockedId).toBeNull();
    const second = e.typeLetter('u');
    expect(second[0]).toEqual({ type: 'lock', targetId: 'b' });
    expect(e.view.correctLength).toBe(2);
  });

  it('identical prefixes fall back to the most central target', () => {
    const e = engine([{ id: 'far', word: 'star' }, { id: 'near', word: 'stop' }], false, { far: 5, near: 1 });
    typeAll(e, 'st');
    expect(e.lockedId).toBe('near');
  });

  it('Tab cycles targets by screen order when not mid-word', () => {
    const e = engine([{ id: 'a', word: 'star' }, { id: 'b', word: 'moon' }], false, { a: 2, b: 1 });
    expect(e.cycle()).toEqual([{ type: 'lock', targetId: 'b' }]);
    expect(e.cycle()).toEqual([{ type: 'unlock', targetId: 'b' }, { type: 'lock', targetId: 'a' }]);
    e.typeLetter('s');
    expect(e.cycle()).toEqual([]);
  });

  it('releases the lock when the target disappears and restarts when its word changes', () => {
    const e = engine([{ id: 'a', word: 'ward' }]);
    typeAll(e, 'wa');
    e.setCandidates([{ id: 'a', word: 'bind' }]);
    expect(e.view.correctLength).toBe(0);
    expect(e.lockedId).toBe('a');
    expect(e.setCandidates([])).toEqual([{ type: 'unlock', targetId: 'a' }]);
  });
});

describe('TypingMetricsRecorder', () => {
  it('counts only time between the first and last accepted letters', () => {
    const r = new TypingMetricsRecorder(emptyMetrics(), 'sunlit-courtyard');
    // Ten seconds of reading before typing never counts.
    r.recordEntry(true, 't', 10_000);
    r.recordEntry(true, 't', 10_400);
    r.recordEntry(true, 't', 10_800);
    r.recordCompletion('t', 'sun', 0, 10_800);
    expect(r.metrics.activeTypingMs).toBe(800);
    expect(r.metrics.completedWords).toBe(1);
    expect(r.metrics.perfectWords).toBe(1);
  });

  it('a long idle gap closes the segment at the previous keystroke', () => {
    const r = new TypingMetricsRecorder(emptyMetrics(), 'sunlit-courtyard');
    r.recordEntry(true, 't', 0);
    r.recordEntry(true, 't', 500);
    r.recordEntry(true, 't', 500 + IDLE_GAP_MS + 1000);
    r.recordEntry(true, 't', 500 + IDLE_GAP_MS + 1300);
    r.recordCompletion('t', 'star', 0, 500 + IDLE_GAP_MS + 1300);
    expect(r.metrics.activeTypingMs).toBe(800);
  });

  it('suspending (pause or hidden tab) contributes no time', () => {
    const r = new TypingMetricsRecorder(emptyMetrics(), 'sunlit-courtyard');
    r.recordEntry(true, 't', 0);
    r.recordEntry(true, 't', 300);
    r.suspend();
    r.recordEntry(true, 't', 60_000);
    r.recordEntry(true, 't', 60_200);
    r.recordCompletion('t', 'moon', 0, 60_200);
    expect(r.metrics.activeTypingMs).toBe(500);
  });

  it('incorrect entries count against accuracy even after Backspace', () => {
    const r = new TypingMetricsRecorder(emptyMetrics(), 'sunlit-courtyard');
    r.recordEntry(true, 't', 0);
    r.recordEntry(false, 't', 100);
    r.recordCorrected();
    r.recordEntry(true, 't', 200);
    r.recordEntry(true, 't', 300);
    r.recordCompletion('t', 'sun', 1, 300);
    const m = r.metrics;
    expect(m.incorrectEntries).toBe(1);
    expect(m.correctedMistakes).toBe(1);
    expect(characterAccuracy(m)).toBeCloseTo(75);
    expect(firstAttemptWordAccuracy(m)).toBe(0);
    expect(m.currentStreak).toBe(0);
  });

  it('tracks perfect streaks', () => {
    const r = new TypingMetricsRecorder(emptyMetrics(), 'sunlit-courtyard');
    for (const [i, mistakes] of [0, 0, 1, 0, 0, 0].entries()) {
      r.recordEntry(true, `t${i}`, i * 1000);
      r.recordCompletion(`t${i}`, 'a', mistakes, i * 1000);
    }
    expect(r.metrics.bestStreak).toBe(3);
    expect(r.metrics.currentStreak).toBe(3);
  });
});

describe('metric formulas', () => {
  it('WPM uses five-character words over active minutes', () => {
    expect(wpm(50, 60_000)).toBe(10);
    expect(wpm(0, 1000)).toBe(0);
    expect(wpm(10, 0)).toBe(0);
    const m = { ...emptyMetrics(), wpmChars: 100, activeTypingMs: 30_000 };
    expect(averageWpm(m)).toBe(40);
  });

  it('peak rolling WPM ignores windows shorter than 25 characters', () => {
    const word = (w: string, ms: number) => ({ word: w, activeMs: ms, perfect: true, areaId: 'observatory' as const });
    expect(peakRollingWpm([word('star', 100)])).toBeNull();
    const words = [word('aaaaaaaaaa', 6000), word('bbbbbbbbbb', 6000), word('ccccc', 3000), word('ddddddddddddddddddddddddd', 3000)];
    // Window 1: 25 chars in 15 s = 20 WPM; window 4: 25 chars in 3 s = 100 WPM.
    expect(peakRollingWpm(words)).toBeCloseTo(100);
  });

  it('fastest word only considers words of at least four letters', () => {
    const m = emptyMetrics();
    m.words.push({ word: 'sun', activeMs: 100, perfect: true, areaId: 'sunlit-courtyard' });
    m.words.push({ word: 'moon', activeMs: 400, perfect: true, areaId: 'sunlit-courtyard' });
    expect(fastestWord(m)?.word).toBe('moon');
  });
});

describe('word content and assignment', () => {
  it('meets the minimum content counts', () => {
    const count = (d: string) => WORDS.filter((w) => w.difficulty === d).length;
    expect(count('easy')).toBeGreaterThanOrEqual(60);
    expect(count('standard')).toBeGreaterThanOrEqual(80);
    expect(count('challenge')).toBeGreaterThanOrEqual(50);
    expect(PHRASES.length).toBeGreaterThanOrEqual(12);
  });

  it('words are lowercase letters only, unique and correctly tagged', () => {
    const seen = new Set<string>();
    for (const w of WORDS) {
      expect(w.word).toMatch(/^[a-z]+$/);
      expect(w.letters).toBe(w.word.length);
      expect(seen.has(w.word)).toBe(false);
      seen.add(w.word);
    }
  });

  it('assigns unique initials among active words and avoids repeats', () => {
    const a = new WordAssigner(WORDS, createRng(42));
    const active: string[] = [];
    for (let i = 0; i < 4; i++) active.push(a.pick({ minLength: 3, maxLength: 5 }, active));
    expect(new Set(active.map((w) => w[0])).size).toBe(4);
    const more = Array.from({ length: 30 }, () => a.pick({ minLength: 3, maxLength: 5 }, []));
    expect(new Set([...active, ...more]).size).toBe(34);
  });

  it('respects requested length and category', () => {
    const a = new WordAssigner(WORDS, createRng(1));
    for (let i = 0; i < 10; i++) {
      const w = a.pick({ minLength: 4, maxLength: 6, category: 'animals' }, []);
      expect(w.length).toBeGreaterThanOrEqual(4);
      expect(w.length).toBeLessThanOrEqual(6);
    }
  });

  it('is deterministic for a seed', () => {
    const pick = () => new WordAssigner(WORDS, createRng(7)).pick({ minLength: 4, maxLength: 7 }, []);
    expect(pick()).toBe(pick());
  });
});

describe('difficulty filtering', () => {
  it('shifts and clamps generated word lengths', () => {
    expect(adjustLengthRange([4, 6], 'gentle', false)).toEqual([3, 5]);
    expect(adjustLengthRange([4, 6], 'standard', false)).toEqual([4, 6]);
    expect(adjustLengthRange([4, 6], 'challenge', false)).toEqual([6, 8]);
    expect(adjustLengthRange([5, 7], 'standard', true)).toEqual([3, 4]);
  });
});
