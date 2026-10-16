import type { Difficulty } from './types';

export interface DifficultyProfile {
  /** Shift applied to authored word-length ranges for generated words. */
  readonly lengthShift: number;
  readonly minLength: number;
  readonly maxLength: number;
  /** Enemy movement speed multiplier. */
  readonly speed: number;
  /** Attack wind-up multiplier (bigger = more warning). */
  readonly windup: number;
  /** Minimum attack anticipation in seconds (MD-1). */
  readonly minWindupSec: number;
  /** Simulation time scale for enemies while the player is mid-word. */
  readonly typingTimeScale: number;
  /** Focus damage multiplier. */
  readonly damage: number;
  /** Extra recovery time between waves. */
  readonly waveGapSec: number;
  /** Mistakes are flashed but never buffered, so Backspace is never required. */
  readonly rejectMistakes: boolean;
  /** Spawns marked `challengeOnly` appear only when this is set. */
  readonly extraTargets: boolean;
  /** Owner decision: Gentle has unlimited HP; hits are shown but never cost anything. */
  readonly unlimitedHp: boolean;
}

export const DIFFICULTY: Record<Difficulty, DifficultyProfile> = {
  gentle: {
    lengthShift: -1,
    minLength: 3,
    maxLength: 5,
    // Owner (2026-10-16): mobs "just standing there … no threat feeling at all". Enemies keep coming
    // while a slow typer is mid-word (it was 0.2: a young typist is nearly always mid-word).
    speed: 0.85,
    windup: 1.4,
    minWindupSec: 0.7,
    typingTimeScale: 0.55,
    damage: 0.6,
    waveGapSec: 0.8,
    rejectMistakes: true,
    extraTargets: false,
    unlimitedHp: true,
  },
  standard: {
    lengthShift: 0,
    minLength: 3,
    maxLength: 7,
    speed: 1,
    windup: 1,
    minWindupSec: 0.5,
    typingTimeScale: 0.7,
    damage: 1,
    waveGapSec: 0.5,
    rejectMistakes: false,
    extraTargets: false,
    unlimitedHp: false,
  },
  challenge: {
    lengthShift: 2,
    minLength: 4,
    maxLength: 9,
    speed: 1.25,
    windup: 0.85,
    minWindupSec: 0.5,
    typingTimeScale: 0.85,
    damage: 1.15,
    waveGapSec: 0.4,
    rejectMistakes: false,
    extraTargets: true,
    unlimitedHp: false,
  },
};

/** Assist mode shortens generated words without changing the chosen difficulty. */
export const ASSIST_MAX_LENGTH = 4;

export function adjustLengthRange(
  [min, max]: readonly [number, number],
  difficulty: Difficulty,
  assist: boolean,
): [number, number] {
  const p = DIFFICULTY[difficulty];
  let lo = Math.max(p.minLength, min + p.lengthShift);
  let hi = Math.min(p.maxLength, max + p.lengthShift);
  if (assist) {
    hi = Math.min(hi, ASSIST_MAX_LENGTH);
    lo = Math.min(lo, 3);
  }
  if (lo > hi) lo = hi;
  return [Math.max(3, lo), Math.max(3, hi)];
}
