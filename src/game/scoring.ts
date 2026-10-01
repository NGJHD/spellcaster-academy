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
import type { CosmeticId, Difficulty, StarPageId } from './types';
import { ALL_STAR_PAGES, STAR_PAGE_AREA } from './types';

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

export function rankTitle(accuracy: number, averageWpmValue: number, starPages: number): RankTitle {
  let points = 0;
  if (accuracy >= 97) points += 2;
  else if (accuracy >= 90) points += 1;
  if (averageWpmValue >= 25) points += 2;
  else if (averageWpmValue >= 15) points += 1;
  if (starPages >= 6) points += 1;
  const index = points >= 5 ? 4 : points >= 3 ? 3 : points;
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
  readonly starPages: number;
  readonly starPagesTotal: number;
  readonly optionalTargets: number;
  readonly difficulty: Difficulty;
  readonly newCosmetics: readonly CosmeticId[];
  readonly score: number;
  readonly rank: RankTitle;
  readonly messages: readonly string[];
}

export function buildResults(
  m: PersistedRunMetrics,
  difficulty: Difficulty,
  starPages: readonly StarPageId[],
  newCosmetics: readonly CosmeticId[],
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
    starPages: starPages.length,
    starPagesTotal: ALL_STAR_PAGES.length,
    optionalTargets: m.optionalTargetsCompleted,
    difficulty,
    newCosmetics,
    score: m.score,
    rank: rankTitle(acc, avg, starPages.length),
    messages: positiveMessages(m, starPages),
  };
}

/** Two specific, true, encouraging observations drawn from the actual metrics. */
export function positiveMessages(m: PersistedRunMetrics, starPages: readonly StarPageId[]): string[] {
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
  for (const [area, label] of [
    ['whispering-library', 'the Library'],
    ['enchanted-greenhouse', 'the Greenhouse'],
    ['sunlit-courtyard', 'the Courtyard'],
  ] as const) {
    const all = ALL_STAR_PAGES.filter((p) => STAR_PAGE_AREA[p] === area);
    if (all.every((p) => starPages.includes(p))) {
      out.push(`You found every star page in ${label}.`);
      break;
    }
  }
  if (m.checkpointRestarts > 0) out.push('You kept going after a difficult wave.');
  if (m.completedWords > 0) out.push(`You cast ${m.completedWords} spells on your first day.`);
  out.push('You completed your first day at Asterfall Academy!');
  return out.slice(0, 2);
}
