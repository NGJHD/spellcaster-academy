/**
 * LD-16: Moon Tower ascent — three round floors (radius 9 m) at y = 0, 10, 20, joined by short climbs.
 * Colour script moves from warm amber (floor 1) to cool moonlight (floor 3).
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, origin, talk, target, travel, type AreaScript } from './builders';

const A = 'moon-tower';
export const TOWER_ORIGIN: Vec3 = [820, 0, 0];
const T = origin(TOWER_ORIGIN);
export const TOWER_FLOOR_HEIGHT = 10;

const mossling = (id: string, path: Vec3[], delaySec: number): TargetSpawn =>
  target(id, 'mossling', path[0] ?? T(0, 0, -6), [len(4, 5)], {
    movement: { kind: 'approach', path, speed: 0.75 },
    attack: ATTACKS.mosslingSwipe,
    labelHeight: 1.45,
    delaySec,
    persist: true,
  });

const wisp = (id: string, path: Vec3[], delaySec: number): TargetSpawn =>
  target(id, 'wisp', path[0] ?? T(0, 11, -6), [len(3, 5), len(4, 7)], {
    shield: true,
    movement: { kind: 'approach', path, speed: 0.75 },
    attack: ATTACKS.inkPulse,
    labelHeight: 1.35,
    delaySec,
  });

export const moonTower: AreaScript = {
  nodes: {
    TOW_F1: { position: T(0, 1.6, 6.5), lookAt: T(0, 1.3, -2) },
    TOW_F1_CLIMB: { position: T(4.5, 3.6, 2), lookAt: T(6, 6.5, -4) },
    TOW_F2: { position: T(0, 11.6, 6.5), lookAt: T(0, 11.3, -2) },
    TOW_F2_CLIMB: { position: T(-4.5, 13.6, 2), lookAt: T(-6, 16.5, -4) },
    TOW_F3: { position: T(0, 21.6, 6.5), lookAt: T(0, 22.4, -3) },
    TOW_DOOR: { position: T(0, 21.6, 1.5), lookAt: T(0, 22.6, -8.5) },
  },
  lookPoints: {},
  beats: [
    fade('tower-enter', A, 'TOW_F1', { music: 'tower-ascent', barks: ['tw-1'] }),
    fight('tower-t1', A),
    travel('tower-climb-1', A, ['TOW_F1', 'TOW_F1_CLIMB'], 3.5),
    fade('tower-floor-2', A, 'TOW_F2', { barks: ['tw-2'] }),
    fight('tower-t2', A),
    travel('tower-climb-2', A, ['TOW_F2', 'TOW_F2_CLIMB'], 3.5),
    fade('tower-floor-3', A, 'TOW_F3', { barks: ['tw-3'] }),
    fight('tower-t3', A),
    travel('tower-to-door', A, ['TOW_F3', 'TOW_DOOR'], 4),
    talk('tower-pre-boss', A, ['tw-pre']),
    checkpoint('tower-checkpoint', A, 'observatory-door'),
    { kind: 'choice', id: 'tower-pre-boss-choice', areaId: A, choiceId: 'pre-boss' },
  ],
  encounters: [
    {
      id: 'tower-t1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'mosslings',
          targets: [
            mossling('tower-moss-1', [T(-5, 0, -6), T(-3, 0, -1), T(-1.3, 0, 3.4)], 0),
            mossling('tower-moss-2', [T(0, 0, -7.5), T(0.4, 0, -2), T(0, 0, 3.0)], 1.2),
            mossling('tower-moss-3', [T(5, 0, -6), T(3, 0, -1), T(1.4, 0, 3.4)], 2.4),
          ],
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'tw-moss-done' }],
    },
    {
      id: 'tower-t2',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'wisps',
          targets: [
            wisp('tower-wisp-1', [T(-5, 10.8, -6), T(-2.5, 10.8, -1), T(-1.1, 10.8, 3.2)], 0),
            wisp('tower-wisp-2', [T(5, 10.8, -6), T(2.5, 10.8, -1), T(1.2, 10.8, 3.4)], 1.5),
          ],
        },
      ],
    },
    {
      id: 'tower-t3',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'guardian',
          targets: [
            target('tower-guardian', 'guardian', T(0, 20, -4.5), [len(6, 7), len(6, 7), len(6, 7)], {
              attack: { ...ATTACKS.guardianSweep, kind: 'ranged', intervalSec: 6.5 },
              labelHeight: 2.4,
              persist: true,
              variant: 'tower',
            }),
          ],
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'tw-guard-done' }],
      onComplete: { flags: ['tower-door-open'] },
    },
  ],
};
