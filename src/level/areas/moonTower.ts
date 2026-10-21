/**
 * The Moon Tower is a runaway lift ride. A brass lift rockets
 * up a shaft through three round floors (radius 9 m) at y = 0, 10, 20; creatures leap at it between
 * floors; it pauses at each floor for its fight; on floor 3 the guardian smashes up through the floor.
 * The lift shaft (radius 1.4 m) is centred under the camera at (0, 6.5). Colour script moves from warm
 * amber (floor 1) to cool moonlight (floor 3).
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, origin, talk, target, travel, type AreaScript } from './builders';

/** Centre of the lift shaft (area-local x, z). */
export const LIFT_SHAFT = { x: 0, z: 6.5, radius: 1.4 } as const;
/** Beats during which the camera rides the lift. */
export const LIFT_BEATS = ['tower-enter', 'tower-t1', 'tower-lift-1', 'tower-t2', 'tower-lift-2', 'tower-t3'] as const;

/** A creature leaping onto the rocketing lift: a quick chase word, never a hit. */
const leaper = (id: string, kind: 'wisp' | 'mossling', side: number): TargetSpawn =>
  target(id, kind, T(0, 0, 0), [len(3, 4)], {
    follow: kind === 'wisp' ? { ahead: 2.6, side, up: -0.2 } : { ahead: 2.3, side, up: -1.55 },
    labelHeight: kind === 'wisp' ? 1.35 : 1.45,
    defeatFx: { kind: 'burst', scale: 0.8, color: kind === 'wisp' ? '#6f7cff' : '#8fcf5a' },
  });

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
    TOW_LIFT_1: { position: T(0, 6.6, 6.5), lookAt: T(0, 7.8, -2) },
    TOW_LIFT_2: { position: T(0, 16.6, 6.5), lookAt: T(0, 17.8, -2) },
    TOW_F2: { position: T(0, 11.6, 6.5), lookAt: T(0, 11.3, -2) },
    TOW_F2_CLIMB: { position: T(-4.5, 13.6, 2), lookAt: T(-6, 16.5, -4) },
    TOW_F3: { position: T(0, 21.6, 6.5), lookAt: T(0, 22.4, -3) },
    TOW_DOOR: { position: T(0, 21.6, 1.5), lookAt: T(0, 22.6, -8.5) },
  },
  lookPoints: {
    TOW_GUARD_BREACH: T(0, 20.2, -4.5),
  },
  beats: [
    fade('tower-enter', A, 'TOW_F1', { music: 'tower-battle' }),
    fight('tower-t1', A, { barks: ['tw-1'] }),
    // Fast-rail set piece: the lift rockets up the shaft; creatures leap at it from passing floors.
    travel('tower-lift-1', A, ['TOW_F1', 'TOW_LIFT_1', 'TOW_F2'], 7, {
      easing: 'easeInOutCubic',
      barks: ['tw-lift'],
      fx: [{ kind: 'sparks', atBeat: 0.05, scale: 1.2 }],
      chase: [
        { at: 0.1, target: leaper('lift-wisp-1', 'wisp', 1.0) },
        { at: 0.45, target: leaper('lift-moss-1', 'mossling', -0.75) },
      ],
    }),
    fight('tower-t2', A, { barks: ['tw-2'] }),
    travel('tower-lift-2', A, ['TOW_F2', 'TOW_LIFT_2', 'TOW_F3'], 7, {
      easing: 'easeInOutCubic',
      fx: [{ kind: 'sparks', atBeat: 0.05, scale: 1.2 }],
      chase: [
        { at: 0.1, target: leaper('lift-moss-2', 'mossling', 0.75) },
        { at: 0.45, target: leaper('lift-wisp-2', 'wisp', -1.0) },
      ],
    }),
    fight('tower-t3', A, { barks: ['tw-3'] }),
    travel('tower-to-door', A, ['TOW_F3', 'TOW_DOOR'], 4),
    talk('tower-pre-boss', A, ['tw-pre']),
    checkpoint('tower-checkpoint', A, 'observatory-door'),
    // Owner (2026-10-17): no CONTINUE / REVIEW CONTROLS / CHANGE DIFFICULTY menu here; straight on.
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
          // The guardian smashes up through the floor of the lift landing.
          fx: [
            { kind: 'debris', at: 'TOW_GUARD_BREACH', scale: 2, color: '#a8a39a' },
            { kind: 'dust', at: 'TOW_GUARD_BREACH', scale: 2 },
            { kind: 'shockwave', at: 'TOW_GUARD_BREACH', scale: 0.9, color: '#c9d8ff' },
            { kind: 'shake', scale: 1.6 },
          ],
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
