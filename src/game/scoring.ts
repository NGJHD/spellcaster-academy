/** Score, rank title and positive results messages. Deterministic; no runtime generation. */
import {
  averageCompletionMs,
  averageWpm,
  characterAccuracy,
  fastestWord,
  firstAttemptWordAccuracy,
  peakRollingWpm,
  wpm,
  type PersistedRunMetrics,
} from '../typing/TypingMetrics';
import type { CosmeticId, Difficulty, LevelId } from './types';

export function wordScore(letters: number, perfect: boolean, multiplier: number): number {
  return Math.round(letters * 10 * (perfect ? 1.5 : 1) * multiplier);
}

export const RANK_TITLES = [
  'Getting Started',
  'Careful Caster',
  'Bright Apprentice',
  'Swift Spellcaster',
  'Master of the First Ward',
] as const;

export type RankTitle = (typeof RANK_TITLES)[number];

/** Accuracy and speed each give up to two points; four points is the top title. */
export function rankTitle(accuracy: number, averageWpmValue: number): RankTitle {
  let points = 0;
  if (accuracy >= 97) points += 2;
  else if (accuracy >= 90) points += 1;
  if (averageWpmValue >= 25) points += 2;
  else if (averageWpmValue >= 15) points += 1;
  const index = Math.min(4, points);
  return RANK_TITLES[index] ?? RANK_TITLES[0];
}

export interface ResultsData {
  readonly averageWpm: number;
  readonly peakWpm: number | null;
  readonly accuracy: number;
  readonly firstAttemptAccuracy: number;
  readonly correctEntries: number;
  readonly incorrectEntries: number;
  readonly correctedMistakes: number;
  readonly completedWords: number;
  readonly perfectWords: number;
  readonly bestStreak: number;
  readonly averageWordMs: number;
  readonly fastestWord: { word: string; ms: number } | null;
  readonly activeTypingMs: number;
  readonly levelTimeMs: number;
  readonly focusLost: number;
  readonly checkpointRestarts: number;
  readonly optionalTargets: number;
  readonly difficulty: Difficulty;
  readonly newCosmetics: readonly CosmeticId[];
  readonly score: number;
  readonly levelId: LevelId;
  /** Medal summary: stars earned out of the stars available in the fights rated. */
  readonly medals: { readonly fights: number; readonly stars: number; readonly perfect: number };
  readonly rank: RankTitle;
  readonly messages: readonly string[];
}

export function buildResults(
  m: PersistedRunMetrics,
  difficulty: Difficulty,
  newCosmetics: readonly CosmeticId[],
  levelId: LevelId = 'level-1',
): ResultsData {
  const avg = averageWpm(m);
  const acc = characterAccuracy(m);
  const fastest = fastestWord(m);
  return {
    averageWpm: avg,
    peakWpm: peakRollingWpm(m.words),
    accuracy: acc,
    firstAttemptAccuracy: firstAttemptWordAccuracy(m),
    correctEntries: m.correctEntries,
    incorrectEntries: m.incorrectEntries,
    correctedMistakes: m.correctedMistakes,
    completedWords: m.completedWords,
    perfectWords: m.perfectWords,
    bestStreak: m.bestStreak,
    averageWordMs: averageCompletionMs(m),
    fastestWord: fastest ? { word: fastest.word, ms: fastest.activeMs } : null,
    activeTypingMs: m.activeTypingMs,
    levelTimeMs: m.levelTimeMs,
    focusLost: Math.round(m.focusLost),
    checkpointRestarts: m.checkpointRestarts,
    levelId,
    optionalTargets: m.optionalTargetsCompleted,
    difficulty,
    newCosmetics,
    score: m.score,
    medals: { fights: m.medalsEarned, stars: m.medalStars, perfect: m.threeStarMedals },
    rank: rankTitle(acc, avg),
    messages: positiveMessages(m),
  };
}

/** Two specific, true, encouraging observations drawn from the actual metrics. */
export function positiveMessages(m: PersistedRunMetrics): string[] {
  const out: string[] = [];
  const acc = characterAccuracy(m);
  const overall = averageWpm(m);
  const obs = m.areas.observatory;
  const earlyAreas = (['sunlit-courtyard', 'whispering-library'] as const).map((a) => m.areas[a]).filter(Boolean);
  const early = earlyAreas.reduce(
    (s, a) => ({ c: s.c + (a?.correctEntries ?? 0), i: s.i + (a?.incorrectEntries ?? 0) }),
    { c: 0, i: 0 },
  );

  if (obs && early.c + early.i > 0) {
    const obsAcc = characterAccuracy(obs);
    const earlyAcc = characterAccuracy({ correctEntries: early.c, incorrectEntries: early.i });
    if (obsAcc > earlyAcc + 1) out.push('Your accuracy improved during the final battle!');
  }
  if (acc >= 90) out.push(`Your strongest skill was accuracy: ${Math.round(acc)}%.`);
  if (m.bestStreak >= 3) out.push(`Your longest perfect streak was ${m.bestStreak} words.`);
  if (obs && overall > 0 && wpm(obs.wpmChars, obs.activeMs) > overall * 1.05) {
    out.push('You grew faster during the Observatory battle.');
  }
  if (m.checkpointRestarts > 0) out.push('You kept going after a difficult wave.');
  if (m.completedWords > 0) out.push(`You cast ${m.completedWords} spells on your first day.`);
  out.push('You completed your first day at Asterfall Academy!');
  return out.slice(0, 2);
}
