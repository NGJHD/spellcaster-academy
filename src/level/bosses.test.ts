import { describe, expect, it } from 'vitest';
import { bossWordsDone, bossWordTotal, type BossDef } from './bosses';
import type { EncounterDef, TargetSpawn } from './levelTypes';

const t = (id: string, words: string[], extra: Partial<TargetSpawn> = {}): TargetSpawn => ({ id, kind: 'marker', position: [0, 0, -5], words, ...extra });
const phase = (id: string, waves: TargetSpawn[][]): EncounterDef => ({
  id,
  areaId: 'sunlit-courtyard',
  kind: 'combat',
  waves: waves.map((targets, i) => ({ id: `${id}-${i}`, targets })),
});
const encounters = new Map<string, EncounterDef>([
  ['p1', phase('p1', [[t('a', ['one', 'two'])], [t('b', ['three']), t('x', ['bonus'], { optional: true })]])],
  ['p2', phase('p2', [[t('c', ['four'])], [t('d', ['five', 'six'])]])],
]);
const boss: BossDef = { id: 'b', introBeat: 'intro', phases: ['p1', 'p2'] };

describe('boss health bar', () => {
  it('counts every required word once', () => {
    expect(bossWordTotal(boss, encounters)).toBe(6);
  });

  it('counts finished phases and the finished rounds of the current one, never the round being retried', () => {
    expect(bossWordsDone(boss, encounters, [])).toBe(0);
    expect(bossWordsDone(boss, encounters, [], { id: 'p1', waveIndex: 1 })).toBe(2);
    expect(bossWordsDone(boss, encounters, ['p1'], { id: 'p2', waveIndex: 0 })).toBe(3);
    expect(bossWordsDone(boss, encounters, ['p1'], { id: 'p2', waveIndex: 1 })).toBe(4);
    expect(bossWordsDone(boss, encounters, ['p1', 'p2'])).toBe(6);
  });
});
