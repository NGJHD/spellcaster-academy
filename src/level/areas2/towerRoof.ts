/**
 * LEVEL2_DESIGN L2-15 / L2-16: the Moon Tower roof and the Vellum Wyrm, then the dawn aftermath.
 * The Warden lifts the apprentice up the burning tower on its palm (fast rail, fireballs with
 * counter-words); the wyrm rears out of the smoke. V1 page scales, V2 sky chase (the camera orbits as
 * the wyrm circles), V3 a beam struggle against its fire with "every page has a place". Local layout
 * (origin ROOF_ORIGIN): roof disc r = 9 at y = 0; the wyrm coils around the tower, head at (0, 6, −14).
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, reveal, talk, target, travel, type AreaScript } from '../areas/builders';
import type { TargetSpawn } from '../levelTypes';
import { fireball, lantern } from './hush';

const A = 'l2-tower-roof';
const E = 'l2-aftermath';
export const ROOF_ORIGIN: Vec3 = [1600, 60, 0];
const T = origin(ROOF_ORIGIN);
export const WYRM_HEAD: Vec3 = T(0, 6, -14);
const WYRM_HEART: Vec3 = T(0, 3.2, -11);
export const AFTERMATH_ORIGIN: Vec3 = [1700, 0, 0];
const O = origin(AFTERMATH_ORIGIN);

/** A glowing page-scale or ink gland on the wyrm's body. */
const scale = (id: string, position: Vec3, word: TargetSpawn['words'][number], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  marker(id, position, word, {
    labelHeight: 0.4,
    defeatFx: { kind: 'leaves', scale: 1.4, color: '#f3ead2' },
    ...options,
  });

export const towerRoof: AreaScript = {
  nodes: {
    PALM_BASE: { position: T(4, -50, 12), lookAt: T(4, -30, 4) },
    PALM_MID: { position: T(5, -26, 11), lookAt: T(2, -6, 2) },
    PALM_TOP: { position: T(0, 1.7, 5), lookAt: T(0, 4.5, -12) },
    ROOF_FIGHT: { position: T(0, 1.7, 5), lookAt: T(0, 4.5, -12) },
    ROOF_ORBIT_A: { position: T(-6, 2.4, 3), lookAt: T(-10, 8, -16) },
    ROOF_ORBIT_B: { position: T(6, 2.4, 3), lookAt: T(12, 9, -14) },
    AFTER_OBS: { position: O(0, 1.7, 6), lookAt: O(0, 1.2, 0) },
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
    travel('l2-palm-ride', A, ['PALM_BASE', 'PALM_MID', 'PALM_TOP'], 10, {
      easing: 'easeInOutCubic',
      chase: [
        { at: 0.12, target: fireball('palm-fb-1', T(0, 0, 0), T(0, 0, 0), { follow: { ahead: 5, side: 1, up: 1.4 }, movement: { kind: 'static' }, leaveAfterSec: 4 }) },
        { at: 0.32, target: lantern('lantern-ramparts', T(0, 0, 0), 'updraft', 'lantern-ramparts', { follow: { ahead: 4.4, side: -1.3, up: 0.6 } }) },
        { at: 0.5, target: fireball('palm-fb-2', T(0, 0, 0), T(0, 0, 0), { follow: { ahead: 5, side: -0.9, up: 1.2 }, movement: { kind: 'static' }, leaveAfterSec: 4 }) },
        { at: 0.72, target: fireball('palm-fb-3', T(0, 0, 0), T(0, 0, 0), { follow: { ahead: 5, side: 0.6, up: 1.5 }, movement: { kind: 'static' }, leaveAfterSec: 4 }) },
      ],
    }),
    reveal('l2-wyrm-rises', A, 'ROOF_FIGHT', ['ROOF_WYRM_HEAD'], 0.8, 7, {
      attention: 'boss-intro',
      music: 'wyrm-battle',
      barks: ['l2-wyrm-fire'],
      fx: [
        { kind: 'flash', atBeat: 0.15, color: '#ff4a12' },
        { kind: 'shake', atBeat: 0.15, scale: 2 },
        { kind: 'burst', at: 'ROOF_WYRM_HEAD', atBeat: 0.2, scale: 3, color: '#ff5a1a' },
        { kind: 'leaves', at: 'ROOF_WYRM_HEAD', atBeat: 0.3, scale: 2.4, color: '#f3ead2' },
      ],
    }),
    fight('l2-wyrm-v1', A, { barks: ['l2-voice-wyrm'] }),
    travel('l2-wyrm-takeoff', A, ['ROOF_FIGHT', 'ROOF_ORBIT_A'], 2.5, { fx: [{ kind: 'shockwave', at: 'ROOF_FLOOR', atBeat: 0.1, scale: 2, color: '#ff5a1a' }] }),
    fight('l2-wyrm-v2a', A, { barks: ['l2-wyrm-glands'] }),
    travel('l2-wyrm-orbit', A, ['ROOF_ORBIT_A', 'ROOF_ORBIT_B'], 3.5),
    fight('l2-wyrm-v2b', A),
    travel('l2-wyrm-dives', A, ['ROOF_ORBIT_B', 'ROOF_FIGHT'], 2),
    reveal('l2-wyrm-crash', A, 'ROOF_FIGHT', ['ROOF_WYRM_HEART'], 0.6, 0.8, {
      fx: [
        { kind: 'shockwave', at: 'ROOF_FLOOR', atBeat: 0.05, scale: 3, color: '#ff5a1a' },
        { kind: 'debris', at: 'ROOF_FLOOR', atBeat: 0.05, scale: 2.4, color: '#5a5a62' },
        { kind: 'shake', atBeat: 0.05, scale: 2.2 },
      ],
    }),
    fight('l2-wyrm-v3', A, { barks: ['l2-wyrm-motto'] }),
    checkpoint('l2-wyrm-checkpoint', A, 'wyrm-defeated'),
    // Ending (L2-16): the quill shard, Pip glitches, someone has to go through.
    fade('l2-after-enter', E, 'AFTER_OBS', { music: 'ward-repair', fadeOutSec: 1, holdSec: 0.6, fadeInSec: 1 }),
    talk('l2-after-shard', E, ['l2-end-1', 'l2-end-2', 'l2-end-3'], { attention: 'ending' }),
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
            fireball('wyrm-fb-1', WYRM_HEAD, T(-0.6, 1.7, 4.2), { delaySec: 1.4 }),
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
            target('wyrm-gland-1', 'marker', T(-12, 9, -18), [len(6, 7)], { labelHeight: 0.5, movement: { kind: 'patrol', path: [T(-14, 9, -18), T(-6, 10, -20)], speed: 1.2 } }),
            fireball('storm-1', T(-10, 12, -18), T(-5.4, 2.2, 2.8), { delaySec: 1.6 }),
            fireball('storm-2', T(-8, 12, -20), T(-6.4, 2.6, 2.6), { delaySec: 2.6 }),
          ],
        },
      ],
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
            target('wyrm-gland-2', 'marker', T(12, 9, -16), [len(6, 7)], { labelHeight: 0.5, movement: { kind: 'patrol', path: [T(8, 10, -18), T(15, 9, -14)], speed: 1.2 } }),
            target('wyrm-gland-3', 'marker', T(10, 7, -12), [len(6, 7)], { labelHeight: 0.5, delaySec: 1 }),
            fireball('storm-3', T(12, 12, -16), T(5.6, 2.4, 2.8), { delaySec: 2 }),
          ],
        },
      ],
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
        { kind: 'shockwave', at: 'ROOF_WYRM_HEART', scale: 4, color: '#ffe6a0' },
        { kind: 'burst', at: 'ROOF_WYRM_HEAD', scale: 4, color: '#ff8a3a' },
        { kind: 'leaves', at: 'ROOF_WYRM_HEART', scale: 4, color: '#f3ead2' },
        { kind: 'dust', at: 'ROOF_FLOOR', scale: 3, color: '#3a3330' },
        { kind: 'shake', scale: 2.4 },
      ],
    },
  ],
};
