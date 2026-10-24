/**
 * The Dormitory Tower rescue. Reuses the Lower Stairwell spiral (dressed as the
 * dormitory, on fire). On each of three landings Scribble Imps are setting a door alight with a
 * first-year behind it: blast them, restore the door, and the student runs down to safety. A
 * Smudgehound bursts through a burning door on landing 3.
 */
import { spiral, stairFloor } from '../areas/stairwell';
import { checkpoint, fade, fight, len, travel, type AreaScript } from '../areas/builders';
import type { EncounterDef } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { fireball, hound, restore, scribbleImp } from './hush';

const A = 'l2-dormitory';
const RIDE = 7.6;

/** Doors on the outer wall at each landing (angle in degrees). */
export const DORM_DOORS = [
  { id: 1, deg: -60, word: 'open' },
  { id: 2, deg: -140, word: 'free' },
  { id: 3, deg: -220, word: 'safe' },
] as const;

const at = (deg: number, dy: number, r = RIDE) => spiral(deg, stairFloor(deg) + dy, r);
const look = (deg: number) => spiral(deg, stairFloor(deg) + 1.5, 9.1);

/**
 * How far a tread's top can stand above the even ramp `stairFloor` (half a riser: treads are 6° apart,
 * 0.3 m each), so a mob's feet set this far above the ramp are never inside a step.
 */
export const DORM_STEP_LIFT = 0.15;

/** Where the camera stands for each landing's fight (degrees), uphill of its door. */
const FIGHT_DEG = [-30, -110, -190] as const;

/**
 * A walk along the stairs from one angle and radius to another, a point every few degrees on the treads
 * (owner, 2026-10-23: mobs on the stairs must be above them, not under). It ends within arm's reach of
 * the camera, so the close-in leg (which keeps the last point's height) is never added on the slope.
 */
function stairWalk(fromDeg: number, toDeg: number, fromR: number, toR: number): Vec3[] {
  const n = Math.max(1, Math.ceil(Math.abs(toDeg - fromDeg) / 4));
  return Array.from({ length: n + 1 }, (_, i) => {
    const k = i / n;
    return at(fromDeg + (toDeg - fromDeg) * k, DORM_STEP_LIFT, fromR + (toR - fromR) * k);
  });
}

/** One landing: imps scratch the burning door; restore it to free the student. */
function landing(index: 1 | 2 | 3, extra: boolean): EncounterDef {
  const door = DORM_DOORS[index - 1] ?? DORM_DOORS[0];
  const d = door.deg;
  // Each mob climbs to about 2.5 m below the camera on the stairs.
  const near = (FIGHT_DEG[index - 1] ?? FIGHT_DEG[0]) - 19;
  return {
    id: `l2-dorm-${index}`,
    areaId: A,
    kind: 'combat',
    waves: [
      {
        id: 'imps',
        targets: [
          // They scratch at the door, then climb towards the camera.
          scribbleImp(`dorm-imp-${index}a`, [...stairWalk(d - 12, d - 4, 8.6, 7.4), ...stairWalk(d - 4, near, 7.4, 6.9).slice(1)]),
          scribbleImp(`dorm-imp-${index}b`, [...stairWalk(d + 12, d + 4, 8.6, 7.2), ...stairWalk(d + 4, near + 2, 7.2, 8.2).slice(1)], { delaySec: 0.7 }),
          ...(extra
            ? [
                // It climbs the stairs to the camera (owner, 2026-10-19: "why is the dog under the stairs?" Its
                // path ended below the landing, and the close-in leg kept that height, under the steps). Points
                // every few degrees follow the stair's rise; it passes inside the trapped student's flames.
                hound(`dorm-hound`, [...stairWalk(d - 30, d, 8.4, 6.5), ...stairWalk(d, near + 1, 6.5, 7.4).slice(1)], { delaySec: 1.6, words: [len(4, 6)] }),
                fireball(`dorm-ember`, at(d + 20, 2.4, 8.4), at(d - 26, 1.6, RIDE), { delaySec: 3 }),
              ]
            : []),
        ],
      },
      { id: 'door', targets: [restore(`dorm-door-${index}`, look(d), door.word, `l2-dorm-door-${index}`)] },
    ],
    barks: [{ when: { on: 'complete' }, line: `l2-dorm-thanks-${index}` }],
  };
}

export const dormitory: AreaScript = {
  nodes: {
    DORM_TOP: { position: at(30, 1.7), lookAt: at(-10, 1.4, 8) },
    DORM_L1: { position: at(FIGHT_DEG[0], 1.7), lookAt: look(-60) },
    DORM_L2: { position: at(FIGHT_DEG[1], 1.7), lookAt: look(-140) },
    DORM_L3: { position: at(FIGHT_DEG[2], 1.7), lookAt: look(-220) },
    DORM_BOTTOM: { position: at(-245, 1.7), lookAt: at(-280, 1.2, 6) },
  },
  lookPoints: {
    DORM_DOOR_1: look(-60),
    DORM_DOOR_3: look(-220),
  },
  beats: [
    // Through the bedroom door straight onto the burning stairs.
    fade('l2-dorm-enter', A, 'DORM_TOP', { fadeOutSec: 0.3, holdSec: 0.1, fadeInSec: 0.5, objective: 'l2-dormitory' }),
    travel('l2-dorm-to-1', A, ['DORM_TOP', 'DORM_L1'], 4, { barks: ['l2-dorm-1'] }),
    fight('l2-dorm-1', A, { music: 'siege-battle' }),
    travel('l2-dorm-to-2', A, ['DORM_L1', 'DORM_L2'], 4),
    fight('l2-dorm-2', A),
    travel('l2-dorm-to-3', A, ['DORM_L2', 'DORM_L3'], 4, {
      barks: ['l2-dorm-hound'],
      fx: [
        { kind: 'debris', at: 'DORM_DOOR_3', atBeat: 0.8, scale: 1.4, color: '#4a3424', pieces: 'wood' },
        { kind: 'burst', at: 'DORM_DOOR_3', atBeat: 0.8, scale: 1.4, color: '#ff5a1a' },
        { kind: 'shake', atBeat: 0.8 },
      ],
    }),
    fight('l2-dorm-3', A),
    checkpoint('l2-dorm-checkpoint', A, 'dormitory-rescued', { barks: ['l2-mira-dorm'], objective: 'l2-bell' }),
    travel('l2-dorm-exit', A, ['DORM_L3', 'DORM_BOTTOM'], 4, { barks: ['l2-dorm-out'] }),
  ],
  encounters: [landing(1, false), landing(2, false), landing(3, true)],
};
