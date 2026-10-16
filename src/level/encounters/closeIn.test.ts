import { describe, expect, it } from 'vitest';
import type { TargetSpawn } from '../levelTypes';
import { closeInSpawn, MELEE_REACH } from './closeIn';

const CONTACT = { kind: 'contact', windupSec: 1, recoverSec: 1, intervalSec: 1, damage: 5 } as const;

const melee: TargetSpawn = {
  id: 'blot',
  kind: 'blotling',
  position: [0, 0, -20],
  words: ['ink'],
  movement: { kind: 'approach', path: [[0, 0, -20], [2, 0, -8]], speed: 1 },
  attack: CONTACT,
};

describe('melee mobs close in', () => {
  it('extends a melee path to within reach of the camera, on its own side', () => {
    const out = closeInSpawn(melee, [0, 1.6, 0]);
    const path = out.movement?.kind === 'approach' ? out.movement.path : [];
    const last = path[path.length - 1] ?? [0, 0, 0];
    expect(path).toHaveLength(3);
    expect(Math.hypot(last[0], last[2])).toBeCloseTo(MELEE_REACH);
    expect(last[0]).toBeGreaterThan(0);
    expect(last[1]).toBe(0);
  });

  it('leaves ranged attackers, fireballs and already-close mobs alone', () => {
    const ranged = { ...melee, attack: { ...CONTACT, kind: 'ranged' as const } };
    expect(closeInSpawn(ranged, [0, 1.6, 0])).toBe(ranged);
    const fireball = { ...melee, kind: 'fireball' as const };
    expect(closeInSpawn(fireball, [0, 1.6, 0])).toBe(fireball);
    expect(closeInSpawn(melee, [2, 1.6, -6])).toBe(melee);
  });
});
