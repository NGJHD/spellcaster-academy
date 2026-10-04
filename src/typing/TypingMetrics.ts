/**
 * Typing metrics built from accepted-input segments (LD-19, LD-20).
 * Idle reading time, travel, dialogue, pauses and hidden-tab time never count as typing.
 */
import type { AreaId } from '../game/types';

/** A gap longer than this closes the active segment at the previous keystroke. */
export const IDLE_GAP_MS = 5000;
/** Peak WPM needs windows of at least this many correct characters. */
export const PEAK_WINDOW_MIN_CHARS = 25;

export interface CompletedWordRecord {
  readonly word: string;
  readonly activeMs: number;
  readonly perfect: boolean;
  readonly areaId: AreaId;
}

export interface AreaTypingStats {
  correctEntries: number;
  incorrectEntries: number;
  wpmChars: number;
  activeMs: number;
}

/** Plain-data snapshot; safe to persist and restore. */
export interface PersistedRunMetrics {
  correctEntries: number;
  incorrectEntries: number;
  correctedMistakes: number;
  completedWords: number;
  perfectWords: number;
  currentStreak: number;
  bestStreak: number;
  activeTypingMs: number;
  /** Correct characters of completed attempts only (WPM numerator). */
  wpmChars: number;
  words: CompletedWordRecord[];
  areas: Partial<Record<AreaId, AreaTypingStats>>;
  levelTimeMs: number;
  focusLost: number;
  checkpointRestarts: number;
  optionalTargetsCompleted: number;
  score: number;
  /** Encounter medals (CLAUDE.md §1B): fights rated, stars earned, and three-star fights. */
  medalsEarned: number;
  medalStars: number;
  threeStarMedals: number;
}

export function emptyMetrics(): PersistedRunMetrics {
  return {
    correctEntries: 0,
    incorrectEntries: 0,
    correctedMistakes: 0,
    completedWords: 0,
    perfectWords: 0,
    currentStreak: 0,
    bestStreak: 0,
    activeTypingMs: 0,
    wpmChars: 0,
    words: [],
    areas: {},
    levelTimeMs: 0,
    focusLost: 0,
    checkpointRestarts: 0,
    optionalTargetsCompleted: 0,
    score: 0,
    medalsEarned: 0,
    medalStars: 0,
    threeStarMedals: 0,
  };
}

export function cloneMetrics(m: PersistedRunMetrics): PersistedRunMetrics {
  return {
    ...m,
    words: m.words.slice(),
    areas: Object.fromEntries(Object.entries(m.areas).map(([k, v]) => [k, { ...v }])),
  };
}

interface Segment {
  startedAtMs: number;
  lastAtMs: number;
}

interface Attempt {
  targetId: string;
  activeMs: number;
  segment: Segment | null;
}

/** Records keystrokes into a metrics snapshot. Time values are supplied by the caller. */
export class TypingMetricsRecorder {
  private attempt: Attempt | null = null;

  constructor(
    public metrics: PersistedRunMetrics,
    private areaId: AreaId,
  ) {}

  setArea(areaId: AreaId): void {
    this.areaId = areaId;
  }

  private area(): AreaTypingStats {
    const stats = (this.metrics.areas[this.areaId] ??= {
      correctEntries: 0,
      incorrectEntries: 0,
      wpmChars: 0,
      activeMs: 0,
    });
    return stats;
  }

  /** Call for every accepted printable letter. `targetId` is null when no target is involved. */
  recordEntry(correct: boolean, targetId: string | null, nowMs: number): void {
    if (correct) {
      this.metrics.correctEntries++;
      this.area().correctEntries++;
    } else {
      this.metrics.incorrectEntries++;
      this.area().incorrectEntries++;
    }
    if (targetId === null) return;

    if (this.attempt && this.attempt.targetId !== targetId) this.closeAttempt();
    const attempt = (this.attempt ??= { targetId, activeMs: 0, segment: null });
    const seg = attempt.segment;
    if (seg && nowMs - seg.lastAtMs > IDLE_GAP_MS) {
      this.closeSegment(attempt);
    }
    if (attempt.segment) attempt.segment.lastAtMs = nowMs;
    else attempt.segment = { startedAtMs: nowMs, lastAtMs: nowMs };
  }

  recordCorrected(): void {
    this.metrics.correctedMistakes++;
  }

  recordCompletion(targetId: string, word: string, mistakes: number, nowMs: number): CompletedWordRecord {
    const attempt = this.attempt && this.attempt.targetId === targetId ? this.attempt : null;
    let activeMs = 0;
    if (attempt) {
      if (attempt.segment) attempt.segment.lastAtMs = Math.max(attempt.segment.lastAtMs, nowMs);
      this.closeSegment(attempt);
      activeMs = attempt.activeMs;
      this.attempt = null;
    }
    const perfect = mistakes === 0;
    const m = this.metrics;
    m.completedWords++;
    m.wpmChars += word.length;
    this.area().wpmChars += word.length;
    if (perfect) {
      m.perfectWords++;
      m.currentStreak++;
      m.bestStreak = Math.max(m.bestStreak, m.currentStreak);
    } else {
      m.currentStreak = 0;
    }
    const record: CompletedWordRecord = { word, activeMs, perfect, areaId: this.areaId };
    m.words.push(record);
    return record;
  }

  /** Close timing without completing (target lost, cancelled, paused, tab hidden). */
  suspend(): void {
    if (this.attempt) this.closeSegment(this.attempt);
  }

  /** Abandon the current attempt entirely (target defeated by other means). */
  closeAttempt(): void {
    if (!this.attempt) return;
    this.closeSegment(this.attempt);
    this.attempt = null;
  }

  private closeSegment(attempt: Attempt): void {
    const seg = attempt.segment;
    if (!seg) return;
    const ms = Math.max(0, seg.lastAtMs - seg.startedAtMs);
    attempt.activeMs += ms;
    this.metrics.activeTypingMs += ms;
    this.area().activeMs += ms;
    attempt.segment = null;
  }
}

// ---------- Derived figures (documented formulas) ----------

/** averageWpm = (correctCharacters / 5) / (activeTypingMilliseconds / 60000) */
export function wpm(chars: number, activeMs: number): number {
  if (activeMs <= 0 || chars <= 0) return 0;
  return chars / 5 / (activeMs / 60000);
}

export function averageWpm(m: PersistedRunMetrics): number {
  return wpm(m.wpmChars, m.activeTypingMs);
}

/** correct / (correct + incorrect) × 100 */
export function characterAccuracy(m: Pick<PersistedRunMetrics, 'correctEntries' | 'incorrectEntries'>): number {
  const total = m.correctEntries + m.incorrectEntries;
  return total === 0 ? 100 : (m.correctEntries / total) * 100;
}

/** wordsCompletedWithoutAnyIncorrectEntry / completedWords × 100 */
export function firstAttemptWordAccuracy(m: PersistedRunMetrics): number {
  return m.completedWords === 0 ? 100 : (m.perfectWords / m.completedWords) * 100;
}

/** Highest WPM over consecutive completed words totalling at least 25 correct characters. */
export function peakRollingWpm(words: readonly CompletedWordRecord[], minChars = PEAK_WINDOW_MIN_CHARS): number | null {
  let best: number | null = null;
  for (let start = 0; start < words.length; start++) {
    let chars = 0;
    let ms = 0;
    for (let end = start; end < words.length; end++) {
      const w = words[end];
      if (!w) break;
      chars += w.word.length;
      ms += w.activeMs;
      if (chars >= minChars) {
        if (ms > 0) best = Math.max(best ?? 0, wpm(chars, ms));
        break;
      }
    }
  }
  return best;
}

export function averageCompletionMs(m: PersistedRunMetrics): number {
  const timed = m.words.filter((w) => w.activeMs > 0);
  if (timed.length === 0) return 0;
  return timed.reduce((sum, w) => sum + w.activeMs, 0) / timed.length;
}

export function fastestWord(m: PersistedRunMetrics, minLetters = 4): CompletedWordRecord | null {
  let best: CompletedWordRecord | null = null;
  for (const w of m.words) {
    if (w.word.length < minLetters || w.activeMs <= 0) continue;
    if (!best || w.activeMs < best.activeMs) best = w;
  }
  return best;
}
