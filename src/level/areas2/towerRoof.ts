/**
 * The Moon Tower roof and the Vellum Wyrm, then the dawn aftermath.
 * The Warden lifts the apprentice up the burning tower on its palm (fast rail, fireballs with
 * counter-words); the wyrm rears out of the smoke. V1 page scales, V2 sky chase (the camera orbits as
 * the wyrm circles), V3 a beam struggle against its fire with "every page has a place". Local layout
 * (origin ROOF_ORIGIN): roof disc r = 9 at y = 0; the wyrm coils around the tower, head at (0, 6, −14).
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, reveal, talk, target, travel, type AreaScript } from '../areas/builders';
import type { TargetSpawn } from '../levelTypes';
import { fireball } from './hush';

const A = 'l2-tower-roof';
const E = 'l2-aftermath';
export const ROOF_ORIGIN: Vec3 = [1600, 60, 0];
const T = origin(ROOF_ORIGIN);
// The page dragon stands at the far side of the roof, forelegs on the parapet, facing the camera
// (owner, 2026-10-08: a big dragon on all fours staring down, not coiled). Head and chest:
export const WYRM_HEAD: Vec3 = T(0, 6.2, -8.5);
const WYRM_HEART: Vec3 = T(0, 3.8, -9.5);
/** Where the dragon stands (the model's feet), facing +Z. */
export const DRAGON_STAND: Vec3 = T(0, 0, -13);

/**
 * In the sky chase the dragon hovers in front of the camera and attacks from there (owner, 2026-10-19:
 * it only circled while fireballs came out of the empty sky). `at` is where the dragon (its feet) hovers,
 * `yaw` turns it to face the camera; its jaws, chest and belly follow from vellum_dragon.glb's bind pose
 * (mouth 0, 4.25, 7.1; chest 0, 3.5, 5.3; belly 0, 1.7, 2).
 */
const hover = (x: number, y: number, z: number, yaw: number) => {
  const part = (h: number, f: number): Vec3 => T(x + Math.sin(yaw) * f, y + h, z + Math.cos(yaw) * f);
  return { at: T(x, y, z), yaw, mouth: part(4.25, 7.1), chest: part(3.5, 5.3), belly: part(1.7, 2) };
};
export const WYRM_HOVER_A = hover(-11, 6, -24, Math.atan2(5, 27));
export const WYRM_HOVER_B = hover(12, 6, -22, Math.atan2(-6, 25));
/** Its jaws on the roof (fireballs come from there). */
const WYRM_MOUTH: Vec3 = T(0, 4.25, -5.9);
/** The aftermath is staged on the same roof, at dawn. */
export const AFTERMATH_ORIGIN: Vec3 = ROOF_ORIGIN;
const O = origin(AFTERMATH_ORIGIN);

/** A glowing page-scale or ink gland on the wyrm's body. */
const scale = (id: string, position: Vec3, word: TargetSpawn['words'][number], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  marker(id, position, word, {
    labelHeight: 0.4,
    defeatFx: { kind: 'leaves', scale: 1.4, color: '#f3ead2', pieces: 'page' },
    ...options,
  });

export const towerRoof: AreaScript = {
  nodes: {
    // Held out in the Warden's palm, well clear of the tower, looking up past its edge to the roof and
    // the burning sky (the wall filled the whole view before).
    PALM_BASE: { position: T(7, -46, 21), lookAt: T(-2, 2, -4) },
    PALM_MID: { position: T(6, -22, 17), lookAt: T(-1, 8, -6) },
    // Above the parapet and still outside the tower wall (r = 9.6): the hand rises all the way up,
    // then sets us down on the roof (owner: it went through the tower).
    PALM_HIGH: { position: T(2, 7, 14), lookAt: T(0, 3, -6) },
    PALM_TOP: { position: T(0, 1.7, 5), lookAt: T(0, 4.5, -12) },
    ROOF_FIGHT: { position: T(0, 1.7, 5), lookAt: T(0, 4.5, -12) },
    // Facing the dragon where it hovers (WYRM_HOVER_A/B), its chest in the middle of the view.
    ROOF_ORBIT_A: { position: T(-6, 2.4, 3), lookAt: T(-10, 9, -19) },
    ROOF_ORBIT_B: { position: T(6, 2.4, 3), lookAt: T(11, 9, -17) },
    AFTER_OBS: { position: O(0.3, 1.6, 3.4), lookAt: O(0, 1.25, 0) },
    AFTER_RIFT: { position: O(0, 2.2, 4), lookAt: O(-10, 40, -120) },
  },
  lookPoints: {
    ROOF_WYRM_HEAD: WYRM_HEAD,
    ROOF_WYRM_HEART: WYRM_HEART,
    ROOF_FLOOR: T(0, 0.2, -6),
    ROOF_SKY_LEFT: T(-26, 14, -20),
    ROOF_SKY_RIGHT: T(26, 16, -18),
    AFTER_SHARD: O(0, 1.1, 0),
  },
  beats: [
    fade('l2-roof-enter', A, 'PALM_BASE', { music: 'siege-battle', objective: 'l2-wyrm', barks: ['l2-palm'] }),
    // Fast-rail set piece: up the burning tower on the Warden's palm.
    travel('l2-palm-ride', A, ['PALM_BASE', 'PALM_MID', 'PALM_HIGH', 'PALM_TOP'], 11, {
      easing: 'easeInOutCubic',
      chase: [
        { at: 0.12, target: fireball('palm-fb-1', T(0, 0, 0), T(0, 0, 0), { follow: { ahead: 5, side: 1, up: 0.4 }, movement: { kind: 'static' }}) },
      ],
    }),
    reveal('l2-wyrm-rises', A, 'ROOF_FIGHT', ['ROOF_WYRM_HEAD'], 0.8, 3, {
      attention: 'boss-intro',
      music: 'wyrm-battle',
      barks: ['l2-wyrm-fire'],
      fx: [
        { kind: 'flash', atBeat: 0.15, color: '#ff4a12' },
        { kind: 'shake', atBeat: 0.15, scale: 2 },
        { kind: 'burst', at: 'ROOF_WYRM_HEAD', atBeat: 0.2, scale: 3, color: '#ff5a1a' },
        { kind: 'leaves', at: 'ROOF_WYRM_HEAD', atBeat: 0.3, scale: 2.4, color: '#f3ead2', pieces: 'page' },
      ],
    }),
    fight('l2-wyrm-v1', A, { barks: ['l2-voice-wyrm'] }),
    travel('l2-wyrm-takeoff', A, ['ROOF_FIGHT', 'ROOF_ORBIT_A'], 2.5, { fx: [{ kind: 'dustwave', at: 'ROOF_FLOOR', atBeat: 0.1, scale: 2, color: '#8a7a6a' }] }),
    fight('l2-wyrm-v2a', A, { barks: ['l2-wyrm-glands'] }),
    travel('l2-wyrm-orbit', A, ['ROOF_ORBIT_A', 'ROOF_ORBIT_B'], 3.5),
    fight('l2-wyrm-v2b', A),
    travel('l2-wyrm-dives', A, ['ROOF_ORBIT_B', 'ROOF_FIGHT'], 2),
    reveal('l2-wyrm-crash', A, 'ROOF_FIGHT', ['ROOF_WYRM_HEART'], 0.6, 0.8, {
      fx: [
        { kind: 'dustwave', at: 'ROOF_FLOOR', atBeat: 0.05, scale: 3, color: '#8a7a6a', pieces: 'slate' },
        { kind: 'debris', at: 'ROOF_FLOOR', atBeat: 0.05, scale: 2.4, color: '#5a5a62', pieces: 'slate' },
        { kind: 'shake', atBeat: 0.05, scale: 2.2 },
      ],
    }),
    fight('l2-wyrm-v3', A, { barks: ['l2-wyrm-motto'] }),
    checkpoint('l2-wyrm-checkpoint', A, 'wyrm-defeated'),
    // Ending: the quill shard, Pip glitches, someone has to go through.
    fade('l2-after-enter', E, 'AFTER_OBS', { music: 'ward-repair', fadeOutSec: 1, holdSec: 0.6, fadeInSec: 1 }),
    talk('l2-after-shard', E, ['l2-end-0', 'l2-end-1', 'l2-end-2', 'l2-end-3'], { attention: 'ending' }),
    reveal('l2-after-rift', E, 'AFTER_OBS', ['AFTER_SHARD'], 0.6, 0.2, { attention: 'ending' }),
    talk('l2-after-through', E, ['l2-end-4', 'l2-end-5', 'l2-end-6'], { attention: 'ending' }),
    checkpoint('l2-complete', E, 'level-2-complete', { attention: 'ending' }),
    { kind: 'results', id: 'l2-results', areaId: E, attention: 'ending' },
  ],
  encounters: [
    {
      id: 'l2-wyrm-v1',
      areaId: A,
      kind: 'combat',
      bossPhase: 'wyrm-scales',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'scales-1',
          sequential: true,
          targets: [
            scale('wyrm-scale-1', T(-3, 4.2, -12), len(5, 6)),
            scale('wyrm-scale-2', T(3, 5, -13), len(5, 6)),
          ],
        },
        {
          id: 'scales-2',
          targets: [
            scale('wyrm-scale-3', T(-1.5, 6.6, -14), len(5, 6)),
            fireball('wyrm-fb-1', WYRM_MOUTH, T(-0.6, 1.7, 4.2), { delaySec: 1.4 }),
          ],
        },
        {
          id: 'scales-3',
          sequential: true,
          targets: [scale('wyrm-scale-4', T(4, 3.6, -11), len(5, 6)), scale('wyrm-scale-5', T(-4, 5.8, -13), len(5, 6))],
        },
      ],
      hazard: { attacks: ['pulse'], firstDelaySec: 5, intervalSec: 8, windupSec: 1.6, damage: 12 },
    },
    {
      id: 'l2-wyrm-v2a',
      areaId: A,
      kind: 'combat',
      bossPhase: 'wyrm-chase-1',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'gland-1',
          targets: [
            // Its fireballs fly at the camera and burst just in front of it (2 m ahead, in view) if not answered.
            target('wyrm-gland-1', 'marker', WYRM_HOVER_A.chest, [len(6, 7)], { labelHeight: 0.5 }),
            fireball('storm-1', WYRM_HOVER_A.mouth, T(-6.3, 2.6, 1.1), { delaySec: 1.6, movement: { kind: 'approach', path: [WYRM_HOVER_A.mouth, T(-6.3, 2.6, 1.1)], speed: 3.4 } }),
            fireball('storm-2', WYRM_HOVER_A.mouth, T(-5.9, 2.8, 1.2), { delaySec: 2.6, movement: { kind: 'approach', path: [WYRM_HOVER_A.mouth, T(-5.9, 2.8, 1.2)], speed: 3.4 } }),
          ],
        },
      ],
      // It keeps breathing fire at the apprentice until its glands are hit (owner, 2026-10-20: it
      // stopped attacking once its fireballs were answered).
      hazard: { attacks: ['pulse'], firstDelaySec: 4, intervalSec: 6, windupSec: 1.6, damage: 10 },
    },
    {
      id: 'l2-wyrm-v2b',
      areaId: A,
      kind: 'combat',
      bossPhase: 'wyrm-chase-2',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'glands-2',
          targets: [
            target('wyrm-gland-2', 'marker', WYRM_HOVER_B.chest, [len(6, 7)], { labelHeight: 0.5 }),
            target('wyrm-gland-3', 'marker', WYRM_HOVER_B.belly, [len(6, 7)], { labelHeight: 0.5, delaySec: 1 }),
            fireball('storm-3', WYRM_HOVER_B.mouth, T(6.4, 2.6, 1.2), { delaySec: 2, movement: { kind: 'approach', path: [WYRM_HOVER_B.mouth, T(6.4, 2.6, 1.2)], speed: 3.4 } }),
          ],
        },
      ],
      hazard: { attacks: ['pulse'], firstDelaySec: 4, intervalSec: 6, windupSec: 1.6, damage: 10 },
    },
    {
      id: 'l2-wyrm-v3',
      areaId: A,
      kind: 'interaction',
      bossPhase: 'wyrm-pages-home',
      // Beam struggle: the wyrm's last stream of fire against the apprentice's gold-blue beam.
      beam: { to: WYRM_HEART, color: '#ff4a12' },
      waves: [
        {
          id: 'motto',
          targets: [target('wyrm-motto', 'marker', T(0, 3.6, -10.6), ['every', 'page', 'has', 'a', 'place'], { labelHeight: 0.5, phrase: true })],
        },
      ],
      onComplete: { flags: ['l2-wyrm-defeated'] },
      completeFx: [
        { kind: 'flash' },
        { kind: 'pulse', at: 'ROOF_WYRM_HEART', scale: 4, color: '#ffe6a0' },
        { kind: 'burst', at: 'ROOF_WYRM_HEAD', scale: 4, color: '#ff8a3a' },
        { kind: 'leaves', at: 'ROOF_WYRM_HEART', scale: 4, color: '#f3ead2', pieces: 'page' },
        { kind: 'dust', at: 'ROOF_FLOOR', scale: 3, color: '#3a3330' },
        { kind: 'shake', scale: 2.4 },
      ],
    },
  ],
};
