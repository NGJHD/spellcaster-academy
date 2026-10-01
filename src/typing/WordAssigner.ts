import type { WordCategory, WordEntry } from '../content/wordLists';

export interface WordRequest {
  readonly minLength: number;
  readonly maxLength: number;
  readonly category?: WordCategory;
}

/** Deterministic PRNG so an encounter replays with the same words for the same seed. */
export function createRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    // xorshift32
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Picks words for simultaneously active targets.
 * Constraints in priority order: unique initials among active words, no repeats in the
 * encounter, requested length, requested category. Constraints relax from the bottom up.
 */
export class WordAssigner {
  private readonly used = new Set<string>();

  constructor(
    private readonly pool: readonly WordEntry[],
    private readonly rng: () => number,
  ) {}

  pick(request: WordRequest, activeWords: Iterable<string>): string {
    const initials = new Set<string>();
    const active = new Set<string>();
    for (const w of activeWords) {
      initials.add(w[0] ?? '');
      active.add(w);
    }

    const passes: ((e: WordEntry) => boolean)[] = [
      (e) => inRange(e, request) && (!request.category || e.category === request.category) && !this.used.has(e.word),
      (e) => inRange(e, request) && !this.used.has(e.word),
      (e) => inRange(e, request, 1) && !this.used.has(e.word),
      (e) => inRange(e, request, 1),
      () => true,
    ];

    for (const requireUniqueInitial of [true, false]) {
      for (const pass of passes) {
        const options = this.pool.filter(
          (e) => pass(e) && !active.has(e.word) && (!requireUniqueInitial || !initials.has(e.word[0] ?? '')),
        );
        if (options.length > 0) {
          const choice = options[Math.floor(this.rng() * options.length)] ?? options[0];
          if (choice) {
            this.used.add(choice.word);
            return choice.word;
          }
        }
      }
    }
    throw new Error('Word pool is empty');
  }

  /** Mark authored words as used so generated words do not repeat them. */
  reserve(word: string): void {
    this.used.add(word);
  }
}

function inRange(e: WordEntry, r: WordRequest, slack = 0): boolean {
  return e.letters >= r.minLength - slack && e.letters <= r.maxLength + slack;
}
