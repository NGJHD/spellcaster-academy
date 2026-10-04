/**
 * Encounter medals (CLAUDE.md §1B "Rewards every minute"): every encounter ends with 1–3 stars.
 * Even one star is celebrated; there is never a "fail" medal and never a letter grade.
 */
export interface EncounterTally {
  /** Words completed during the encounter. */
  readonly words: number;
  readonly correct: number;
  readonly incorrect: number;
  /** HP lost during the encounter. */
  readonly damage: number;
}

/** Fewer words than this and the encounter is too small to rate (a single prompt, a gem). */
export const MIN_WORDS_FOR_MEDAL = 2;

export type Stars = 1 | 2 | 3;

/** Stars for an encounter, or null when it is too short to rate. */
export function encounterStars(t: EncounterTally): Stars | null {
  if (t.words < MIN_WORDS_FOR_MEDAL) return null;
  const keys = t.correct + t.incorrect;
  const accuracy = keys > 0 ? t.correct / keys : 1;
  if (accuracy >= 0.97 && t.damage === 0) return 3;
  if (accuracy >= 0.88) return 2;
  return 1;
}

/** Bonus score for a medal. */
export const MEDAL_SCORE: Readonly<Record<Stars, number>> = { 1: 50, 2: 150, 3: 300 };
