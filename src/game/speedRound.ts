/**
 * Optional speed rounds (CLAUDE.md §1B "Rewards every minute"): a visible countdown for bonus score.
 * Running out of time is never a failure: the countdown simply ends and the words stay typeable.
 */
import type { Difficulty } from './types';

/** Gentle gets a generous countdown; Challenge a slightly tighter one. */
export const SPEED_ROUND_TIME_FACTOR: Readonly<Record<Difficulty, number>> = { gentle: 1.6, standard: 1, challenge: 0.85 };

export const SPEED_BONUS_PER_WORD = 60;
export const SPEED_BONUS_PER_SECOND_LEFT = 25;

export type SpeedRoundState = 'running' | 'won' | 'time-up';

export class SpeedRound {
  readonly totalSec: number;
  remainingSec: number;
  done = 0;
  state: SpeedRoundState = 'running';

  constructor(
    baseSec: number,
    difficulty: Difficulty,
    readonly words: number,
  ) {
    this.totalSec = baseSec * SPEED_ROUND_TIME_FACTOR[difficulty];
    this.remainingSec = this.totalSec;
  }

  /** Advance the clock. Returns true on the frame the time runs out. */
  tick(dt: number): boolean {
    if (this.state !== 'running') return false;
    this.remainingSec = Math.max(0, this.remainingSec - dt);
    if (this.remainingSec > 0) return false;
    this.state = 'time-up';
    return true;
  }

  /** A word was completed. Returns true when this wins the round. */
  word(): boolean {
    if (this.state !== 'running') return false;
    this.done++;
    if (this.done < this.words) return false;
    this.state = 'won';
    return true;
  }

  /** Bonus score for winning: per word plus whatever time is left. */
  get bonus(): number {
    return this.state === 'won' ? this.words * SPEED_BONUS_PER_WORD + Math.ceil(this.remainingSec) * SPEED_BONUS_PER_SECOND_LEFT : 0;
  }
}
