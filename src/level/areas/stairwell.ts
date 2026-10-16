/**
 * LEVEL1_DESIGN LD-0 Lower Stairwell (replaces LD-14): the Banister Slide. The apprentice and Pip
 * ride a tea tray down the spiral banister. Each guardian steps out onto the stairs ahead; its command
 * word is a chase word on the slide (the tray slows while it is typed). If the word is not finished
 * in time the guardian simply leaps aside at the last moment: it never fails. The third guardian falls
 * apart and re-assembles in front of the player for a short three-word fight.
 * A broad spiral (radius 6 m) around a central column, brass banister at radius 8.9 m. The camera
 * always moves in partial arcs (never full rotations, §1A).
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, origin, reveal, target, travel, type AreaScript } from './builders';

const A = 'lower-stairwell';
export const STAIRWELL_ORIGIN: Vec3 = [560, 0, 0];
const S = origin(STAIRWELL_ORIGIN);
const RADIUS = 6;
/** The tray rides the banister just inside the outer wall. */
const RIDE_RADIUS = 8.5;
/** Guardians step out into the tray's path at this radius, and leap inward to let it pass. */
export const GUARD_BLOCK_RADIUS = 7.9;

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

/** Where the tea tray waits on the top landing (area-local, on the floor), and the seat above it. */
export const TRAY_REST_DEG = 31;
export const TRAY_REST_RADIUS = 7.7;
const TRAY_SEAT = spiral(TRAY_REST_DEG, 16.95, TRAY_REST_RADIUS);

/** The doorway out of the bottom of the stairwell, towards the practice gallery. */
export const STAIRWELL_EXIT_DEG = 99;

/** Beats during which the tray slides, and the guardian each one ends at. */
export const SLIDE_BEATS = ['stairwell-slide-1', 'stairwell-slide-2', 'stairwell-slide-3'] as const;

/** Camera on the tray at an angle: sitting on the banister, looking down the curve ahead. */
const ride = (deg: number, aheadDeg = 38) => ({
  position: spiral(deg, stairFloor(deg) + 1.85, RIDE_RADIUS),
  lookAt: spiral(deg - aheadDeg, stairFloor(deg - aheadDeg) + 1.3, GUARD_BLOCK_RADIUS),
});

/** Where each guard stands: 1 and 2 step into the tray's path; 3 waits on the landing (radius 6). */
const guardChest = (i: 0 | 1 | 2): Vec3 => {
  const g = STAIR_GUARDS[i];
  // Owner: the spell for the third guard flew past its right side (its word was at the blocking radius).
  return spiral(g.deg, g.floor + 1.45, i === 2 ? RADIUS : GUARD_BLOCK_RADIUS);
};

/** A command word on the slide: typed in time, the guardian steps aside; otherwise it leaps aside anyway. */
const command = (i: 0 | 1 | 2, word: string, flag: string): TargetSpawn =>
  target(`stair-${i + 1}-word`, 'marker', guardChest(i), [word], {
    labelHeight: 0.6,
    leaveAfterSec: 30,
    defeatFlag: flag,
    defeatFx: { kind: 'sparks', scale: 0.8, color: '#9fd8ff' },
  });

export const stairwell: AreaScript = {
  nodes: {
    // At the top, looking down at the tea tray waiting on the landing.
    ST_TOP: { position: spiral(40, 17.85, RIDE_RADIUS), lookAt: spiral(TRAY_REST_DEG, 16.1, TRAY_REST_RADIUS) },
    // The hop onto the tray: up, over and down onto it.
    ST_HOP: { position: spiral(36, 18.5, 8.2), lookAt: spiral(20, 15.6, TRAY_REST_RADIUS) },
    ST_ON_TRAY: { position: TRAY_SEAT, lookAt: spiral(TRAY_REST_DEG - 38, stairFloor(TRAY_REST_DEG - 38) + 1.3, GUARD_BLOCK_RADIUS) },
    ST_SLIDE_A: ride(0),
    ST_SLIDE_1_END: ride(-44, 16),
    ST_SLIDE_B: ride(-90),
    ST_SLIDE_2_END: ride(-124, 16),
    ST_SLIDE_C: ride(-168),
    ST_SLIDE_3_END: { position: spiral(-200, stairFloor(-200) + 1.85, RIDE_RADIUS), lookAt: spiral(-220, stairFloor(-220) + 1.3) },
    ST_SLIDE_D: ride(-232, 25),
    // Facing the open doorway out of the stairwell (owner: the scene ended facing a bare wall).
    ST_BOTTOM: { position: spiral(-255, 1.6), lookAt: spiral(STAIRWELL_EXIT_DEG, 1.6, 9.4) },
    ST_EXIT: { position: spiral(STAIRWELL_EXIT_DEG - 4, 1.6, 7.8), lookAt: spiral(STAIRWELL_EXIT_DEG, 1.6, 12) },
  },
  lookPoints: {
    ST_GUARD_3: spiral(-220, stairFloor(-220) + 1.2),
  },
  beats: [
    // The tray line plays at the top of the stairs, before the slide (owner: the guards line came late).
    fade('stairwell-enter', A, 'ST_TOP', { music: 'tower-battle', barks: ['st-1'] }),
    // Owner (2026-10-08): the tray is on the floor first, then a hop onto it.
    travel('stairwell-hop', A, ['ST_TOP', 'ST_HOP', 'ST_ON_TRAY'], 2.4, { easing: 'easeInOutSine' }),
    // Fast-rail set piece: the tea-tray slide, one guardian per arc.
    travel('stairwell-slide-1', A, ['ST_ON_TRAY', 'ST_SLIDE_A', 'ST_SLIDE_1_END'], 8, {
      barks: ['st-2'],
      easing: 'easeInOutSine',
      chase: [{ at: 0.05, target: command(0, 'stand', 'stair-guard-1-calm') }],
    }),
    travel('stairwell-slide-2', A, ['ST_SLIDE_1_END', 'ST_SLIDE_B', 'ST_SLIDE_2_END'], 8, {
      easing: 'easeInOutSine',
      chase: [{ at: 0.1, target: command(1, 'honour', 'stair-guard-2-calm') }],
    }),
    travel('stairwell-slide-3', A, ['ST_SLIDE_2_END', 'ST_SLIDE_C', 'ST_SLIDE_3_END'], 8, {
      easing: 'easeInOutSine',
      chase: [{ at: 0.1, target: command(2, 'yield', 'stair-guard-3-wakes') }],
    }),
    // The third guardian falls apart and re-assembles right in front of the tray.
    reveal('stairwell-reassemble', A, 'ST_SLIDE_3_END', ['ST_GUARD_3'], 0.4, 3, {
      attention: 'spectacle',
      barks: ['st-3'],
      fx: [
        { kind: 'debris', at: 'ST_GUARD_3', scale: 1.5, color: '#8a8f98' },
        { kind: 'dust', at: 'ST_GUARD_3', scale: 1.2 },
        { kind: 'shake' },
        { kind: 'sparks', at: 'ST_GUARD_3', atBeat: 0.6, scale: 1.4, color: '#9fd8ff' },
      ],
    }),
    fight('stair-3-guard', A),
    checkpoint('stairwell-checkpoint', A, 'lower-stairwell-complete'),
    // The stairwell is narrow: the gem flies close, so it is never inside the wall (owner: "ivy" on a bare wall).
    travel('stairwell-to-bottom', A, ['ST_SLIDE_3_END', 'ST_SLIDE_D', 'ST_BOTTOM'], 6, {
      // Said on the stairs, not in the next room.
      barks: ['st-done'],
      chase: [{ at: 0.15, target: target('stair-exit-gem', 'gem', [0, 0, 0], [len(3, 3)], { follow: { ahead: 2.2, side: 0.35, up: 0.15 }, optional: true, labelHeight: 0.28 }) }],
    }),
    // Out through the doorway at the bottom, towards the practice gallery.
    travel('stairwell-exit', A, ['ST_BOTTOM', 'ST_EXIT'], 2.5, { easing: 'easeInOutSine' }),
  ],
  encounters: [
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
