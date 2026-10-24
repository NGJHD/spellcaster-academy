/**
 * Bosses get a dramatic name card when they arrive and a health bar across all their phases
 * (CLAUDE.md §1B "Big moments"). Health falls by one step for every word typed against the boss.
 */
import type { EncounterDef } from './levelTypes';

export interface BossDef {
  readonly id: string;
  /** Beat that introduces the boss: shows the name card (marked attention: 'boss-intro'). */
  readonly introBeat: string;
  /** Encounters (phases) whose words make up the boss's health bar, in order. */
  readonly phases: readonly string[];
}

export const LEVEL1_BOSSES: readonly BossDef[] = [
  { id: 'grimoire', introBeat: 'library-grimoire-wakes', phases: ['grimoire-g1', 'grimoire-g2', 'grimoire-g3'] },
  { id: 'warden', introBeat: 'observatory-intro', phases: ['warden-w1', 'warden-w2', 'warden-w3'] },
];

/** Total words in a boss fight (its full health). Extra practice targets are not counted. */
export function bossWordTotal(boss: BossDef, encounters: ReadonlyMap<string, EncounterDef>): number {
  let total = 0;
  for (const id of boss.phases) {
    const def = encounters.get(id);
    if (!def) continue;
    for (const wave of def.waves) for (const t of wave.targets) if (!t.optional && !t.challengeOnly) total += t.words.length;
  }
  return total;
}

/**
 * Words already off the boss's health bar: every finished phase, plus the rounds of the current phase
 * before `current.waveIndex` (a reset or a reload restarts the current round, so its words come back).
 */
export function bossWordsDone(
  boss: BossDef,
  encounters: ReadonlyMap<string, EncounterDef>,
  completed: readonly string[],
  current?: { readonly id: string; readonly waveIndex: number },
): number {
  let done = 0;
  for (const id of boss.phases) {
    if (completed.includes(id)) {
      done += bossWordTotal({ ...boss, phases: [id] }, encounters);
    } else if (current?.id === id) {
      const def = encounters.get(id);
      for (const wave of def?.waves.slice(0, current.waveIndex) ?? []) {
        for (const t of wave.targets) if (!t.optional && !t.challengeOnly) done += t.words.length;
      }
    }
  }
  return done;
}

export function bossForEncounter(encounterId: string, bosses: readonly BossDef[] = LEVEL1_BOSSES): BossDef | undefined {
  return bosses.find((b) => b.phases.includes(encounterId));
}

export function bossForIntroBeat(beatId: string, bosses: readonly BossDef[] = LEVEL1_BOSSES): BossDef | undefined {
  return bosses.find((b) => b.introBeat === beatId);
}
