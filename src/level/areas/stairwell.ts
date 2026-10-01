/**
 * LD-14: Lower Stairwell. A broad spiral (radius 6 m) around a central column; three landings
 * 4 m apart. The camera descends in partial arcs (never full rotations) and stops at each guardian.
 */
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, marker, origin, talk, target, travel, type AreaScript } from './builders';

const A = 'lower-stairwell';
export const STAIRWELL_ORIGIN: Vec3 = [560, 0, 0];
const S = origin(STAIRWELL_ORIGIN);
const RADIUS = 6;

/** Point on the spiral at `deg` degrees and height `y` (area-local). */
export function spiral(deg: number, y: number, r = RADIUS): Vec3 {
  const a = (deg * Math.PI) / 180;
  return S(r * Math.cos(a), y, r * Math.sin(a));
}

/** Stair floor height at an angle: one even ramp, 4 m per 80°, landing 1 at −20° / 12 m. */
export function stairFloor(deg: number): number {
  return Math.max(0, Math.min(16, 12 + ((deg + 20) / 80) * 4));
}

export const STAIR_GUARDS = [
  { id: 'stair-guard-1', deg: -60, floor: stairFloor(-60) },
  { id: 'stair-guard-2', deg: -140, floor: stairFloor(-140) },
  { id: 'stair-guard-3', deg: -220, floor: stairFloor(-220) },
] as const;

const guardChest = (i: 0 | 1 | 2): Vec3 => {
  const g = STAIR_GUARDS[i];
  return spiral(g.deg, g.floor + 1.45);
};
const guardLook = (i: 0 | 1 | 2): Vec3 => {
  const g = STAIR_GUARDS[i];
  return spiral(g.deg, g.floor + 1.3);
};

export const stairwell: AreaScript = {
  nodes: {
    ST_TOP: { position: spiral(30, stairFloor(30) + 1.6), lookAt: spiral(-20, 13.2) },
    ST_L1: { position: spiral(-20, 13.6), lookAt: guardLook(0) },
    ST_L1_PASS: { position: spiral(-60, stairFloor(-60) + 1.6), lookAt: spiral(-100, 9.4) },
    ST_L2: { position: spiral(-100, 9.6), lookAt: guardLook(1) },
    ST_L2_PASS: { position: spiral(-140, stairFloor(-140) + 1.6), lookAt: spiral(-180, 5.4) },
    ST_L3: { position: spiral(-180, 5.6), lookAt: guardLook(2) },
    ST_L3_PASS: { position: spiral(-220, stairFloor(-220) + 1.6), lookAt: spiral(-250, 1.4) },
    ST_BOTTOM: { position: spiral(-255, 1.6), lookAt: S(-1.5, 1.8, 12) },
  },
  lookPoints: {},
  beats: [
    fade('stairwell-enter', A, 'ST_TOP', { music: 'tower-ascent' }),
    travel('stairwell-to-l1', A, ['ST_TOP', 'ST_L1'], 4.5, { barks: ['st-1'] }),
    fight('stair-1', A),
    travel('stairwell-to-l2', A, ['ST_L1', 'ST_L1_PASS', 'ST_L2'], 6),
    fight('stair-2', A),
    travel('stairwell-to-l3', A, ['ST_L2', 'ST_L2_PASS', 'ST_L3'], 6),
    fight('stair-3', A),
    fight('stair-3-guard', A, { barks: ['st-3'] }),
    talk('stairwell-done', A, ['st-done']),
    checkpoint('stairwell-checkpoint', A, 'lower-stairwell-complete'),
    travel('stairwell-to-bottom', A, ['ST_L3', 'ST_L3_PASS', 'ST_BOTTOM'], 6),
  ],
  encounters: [
    {
      id: 'stair-1',
      areaId: A,
      kind: 'interaction',
      waves: [{ id: 'command', targets: [marker('stair-1-word', guardChest(0), 'stand', { labelHeight: 0.6 })] }],
      onComplete: { flags: ['stair-guard-1-calm'] },
    },
    {
      id: 'stair-2',
      areaId: A,
      kind: 'interaction',
      waves: [{ id: 'command', targets: [marker('stair-2-word', guardChest(1), 'honour', { labelHeight: 0.6 })] }],
      onComplete: { flags: ['stair-guard-2-calm'] },
    },
    {
      id: 'stair-3',
      areaId: A,
      kind: 'interaction',
      waves: [{ id: 'command', targets: [marker('stair-3-word', guardChest(2), 'yield', { labelHeight: 0.6 })] }],
      onComplete: { flags: ['stair-guard-3-wakes'] },
    },
    {
      id: 'stair-3-guard',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'malfunction',
          targets: [
            target('stair-guard-3-awake', 'guardian', spiral(STAIR_GUARDS[2].deg, STAIR_GUARDS[2].floor), [len(5, 6), len(5, 6), len(5, 7)], {
              attack: { ...ATTACKS.guardianSweep, intervalSec: 6 },
              labelHeight: 2.3,
              persist: true,
            }),
          ],
        },
      ],
      onComplete: { flags: ['stair-guard-3-calm'] },
    },
  ],
};
