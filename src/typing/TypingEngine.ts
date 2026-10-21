/**
 * Framework-independent typing engine: target selection by initials, letter matching,
 * Backspace correction and word completion. It never touches the DOM or rendering.
 */

export interface TypingCandidate {
  readonly id: string;
  readonly word: string;
  /**
   * Counter-words (Level 2 Ward Shield): typing the first letter takes the lock
   * even while another word is locked; finishing it hands the lock back with that word's progress intact.
   */
  readonly interrupt?: boolean;
}

export type TypingEvent =
  | { readonly type: 'lock'; readonly targetId: string }
  | { readonly type: 'unlock'; readonly targetId: string }
  | { readonly type: 'pending'; readonly targetIds: readonly string[]; readonly prefix: string }
  | { readonly type: 'correct'; readonly targetId: string | null; readonly char: string }
  | { readonly type: 'incorrect'; readonly targetId: string | null; readonly char: string }
  | { readonly type: 'corrected'; readonly targetId: string }
  | { readonly type: 'erased'; readonly targetId: string }
  | {
      readonly type: 'complete';
      readonly targetId: string;
      readonly word: string;
      /** Incorrect entries made while typing this word. Zero means a perfect word. */
      readonly mistakes: number;
    };

export interface TypingEngineOptions {
  /** When true, wrong letters flash but are not added to the buffer (Gentle). */
  readonly rejectMistakes: boolean;
  /** Lower is better: distance of the target from the screen centre. */
  readonly centralityOf: (targetId: string) => number;
}

/** Wrong letters a child can stack before further keys are ignored until Backspace. */
export const MAX_BUFFERED_MISTAKES = 3;

interface LockState {
  readonly id: string;
  word: string;
  /** Everything typed for this word, possibly ending in wrong letters. */
  typed: string;
  /** Count of wrong letters at the end of `typed`. */
  wrong: number;
  mistakes: number;
}

export interface TypingView {
  readonly lockedId: string | null;
  /** Correctly typed prefix length of the locked word. */
  readonly correctLength: number;
  /** Wrong letters currently buffered after the correct prefix. */
  readonly wrongText: string;
  /** Prefix typed while several targets still match (duplicate initials). */
  readonly pendingPrefix: string;
  readonly pendingIds: readonly string[];
}

export class TypingEngine {
  private candidates: TypingCandidate[] = [];
  private lock: LockState | null = null;
  /** The word set aside by a counter-word interrupt. */
  private suspended: LockState | null = null;
  private pending: { prefix: string; ids: string[] } | null = null;

  constructor(private options: TypingEngineOptions) {}

  setOptions(options: Partial<TypingEngineOptions>): void {
    this.options = { ...this.options, ...options };
  }

  get view(): TypingView {
    const lock = this.lock;
    return {
      lockedId: lock?.id ?? null,
      correctLength: lock ? lock.typed.length - lock.wrong : 0,
      wrongText: lock && lock.wrong > 0 ? lock.typed.slice(lock.typed.length - lock.wrong) : '',
      pendingPrefix: this.pending?.prefix ?? '',
      pendingIds: this.pending?.ids ?? [],
    };
  }

  get lockedId(): string | null {
    return this.lock?.id ?? null;
  }

  /** True while the player is part-way through a word (used to slow enemy time). */
  get isMidWord(): boolean {
    return (this.lock !== null && this.lock.typed.length > 0) || this.pending !== null;
  }

  /**
   * Replace the set of targetable words. Locks on removed targets are released;
   * a locked target whose word changed (shield → binding) starts again from empty.
   */
  setCandidates(candidates: readonly TypingCandidate[]): TypingEvent[] {
    this.candidates = candidates.slice();
    const events: TypingEvent[] = [];
    const lock = this.lock;
    if (lock) {
      const current = candidates.find((c) => c.id === lock.id);
      if (!current) {
        this.lock = null;
        events.push({ type: 'unlock', targetId: lock.id });
      } else if (current.word !== lock.word) {
        lock.word = current.word;
        lock.typed = '';
        lock.wrong = 0;
        lock.mistakes = 0;
      }
    }
    const suspended = this.suspended;
    if (suspended) {
      const current = candidates.find((c) => c.id === suspended.id);
      if (!current || current.word !== suspended.word) this.suspended = null;
    }
    if (this.pending) {
      const prefix = this.pending.prefix;
      const ids = this.matching(prefix).map((c) => c.id);
      this.pending = ids.length > 0 ? { prefix, ids } : null;
    }
    return events;
  }

  /** Release any lock without completing (target fled, encounter reset, pause). */
  reset(): TypingEvent[] {
    const events: TypingEvent[] = [];
    if (this.lock) events.push({ type: 'unlock', targetId: this.lock.id });
    this.lock = null;
    this.suspended = null;
    this.pending = null;
    return events;
  }

  typeLetter(char: string): TypingEvent[] {
    const c = char.toLowerCase();
    return this.lock ? this.typeLocked(this.lock, c) : this.typeUnlocked(c);
  }

  backspace(): TypingEvent[] {
    const lock = this.lock;
    if (lock) {
      if (lock.typed.length === 0) {
        // Backspace on an empty word releases the target so another can be chosen.
        this.lock = null;
        return [{ type: 'unlock', targetId: lock.id }];
      }
      lock.typed = lock.typed.slice(0, -1);
      if (lock.wrong > 0) {
        lock.wrong--;
        return [{ type: 'corrected', targetId: lock.id }];
      }
      return [{ type: 'erased', targetId: lock.id }];
    }
    if (this.pending) {
      const prefix = this.pending.prefix.slice(0, -1);
      this.pending = prefix ? { prefix, ids: this.matching(prefix).map((c) => c.id) } : null;
    }
    return [];
  }

  /** Tab: lock the next target by screen order. Never needed when initials are unique. */
  /** Tab: move the lock to the next target. Owner feedback: this also works mid-word (the partial word is dropped). */
  cycle(reverse = false): TypingEvent[] {
    if (this.candidates.length === 0) return [];
    const ordered = this.candidates
      .slice()
      .sort((a, b) => this.options.centralityOf(a.id) - this.options.centralityOf(b.id));
    const currentIndex = this.lock ? ordered.findIndex((c) => c.id === this.lock?.id) : -1;
    const step = reverse ? -1 : 1;
    const next = ordered[(currentIndex + step + ordered.length) % ordered.length];
    if (!next || next.id === this.lock?.id) return [];
    const events: TypingEvent[] = [];
    if (this.lock) events.push({ type: 'unlock', targetId: this.lock.id });
    this.pending = null;
    this.lock = { id: next.id, word: next.word, typed: '', wrong: 0, mistakes: 0 };
    events.push({ type: 'lock', targetId: next.id });
    return events;
  }

  private matching(prefix: string): TypingCandidate[] {
    return this.candidates.filter((c) => c.word.startsWith(prefix));
  }

  private typeUnlocked(c: string): TypingEvent[] {
    const prefix = (this.pending?.prefix ?? '') + c;
    const matches = this.matching(prefix);
    if (matches.length === 0) {
      return [{ type: 'incorrect', targetId: null, char: c }];
    }
    // Duplicate initials: wait for a second letter, then fall back to the most central target.
    if (matches.length > 1 && prefix.length < 2) {
      this.pending = { prefix, ids: matches.map((m) => m.id) };
      return [
        { type: 'correct', targetId: null, char: c },
        { type: 'pending', targetIds: this.pending.ids, prefix },
      ];
    }
    const chosen = matches.reduce((best, m) =>
      this.options.centralityOf(m.id) < this.options.centralityOf(best.id) ? m : best,
    );
    this.pending = null;
    this.lock = { id: chosen.id, word: chosen.word, typed: prefix, wrong: 0, mistakes: 0 };
    const events: TypingEvent[] = [
      { type: 'lock', targetId: chosen.id },
      { type: 'correct', targetId: chosen.id, char: c },
    ];
    if (this.lock.typed === chosen.word) events.push(...this.finish(this.lock));
    return events;
  }

  private typeLocked(lock: LockState, c: string): TypingEvent[] {
    if (lock.wrong > 0) {
      if (lock.wrong >= MAX_BUFFERED_MISTAKES) return [];
      lock.typed += c;
      lock.wrong++;
      lock.mistakes++;
      return [{ type: 'incorrect', targetId: lock.id, char: c }];
    }
    const expected = lock.word[lock.typed.length];
    if (c !== expected && !this.suspended) {
      // A counter-word whose initial is unique takes over; the current word waits.
      const counters = this.candidates.filter((x) => x.interrupt && x.id !== lock.id && x.word.startsWith(c));
      const counter = counters.length === 1 ? counters[0] : undefined;
      if (counter) {
        this.suspended = lock;
        this.lock = { id: counter.id, word: counter.word, typed: c, wrong: 0, mistakes: 0 };
        const events: TypingEvent[] = [
          { type: 'lock', targetId: counter.id },
          { type: 'correct', targetId: counter.id, char: c },
        ];
        if (this.lock.typed === counter.word) events.push(...this.finish(this.lock));
        return events;
      }
    }
    if (c === expected) {
      lock.typed += c;
      const events: TypingEvent[] = [{ type: 'correct', targetId: lock.id, char: c }];
      if (lock.typed === lock.word) events.push(...this.finish(lock));
      return events;
    }
    lock.mistakes++;
    if (!this.options.rejectMistakes) {
      lock.typed += c;
      lock.wrong++;
    }
    return [{ type: 'incorrect', targetId: lock.id, char: c }];
  }

  private finish(lock: LockState): TypingEvent[] {
    this.lock = null;
    const events: TypingEvent[] = [{ type: 'complete', targetId: lock.id, word: lock.word, mistakes: lock.mistakes }];
    const resumed = this.suspended;
    this.suspended = null;
    if (resumed && resumed.id !== lock.id && this.candidates.some((c) => c.id === resumed.id)) {
      this.lock = resumed;
      events.push({ type: 'lock', targetId: resumed.id });
    }
    return events;
  }
}
