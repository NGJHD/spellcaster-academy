/**
 * LEVEL3_DESIGN L3-6 … L3-8: Through the Rift, Rift Shore and Cinderwood.
 * - Opening (origin SHORE_ORIGIN, high above the shore): the Warden surges out of the Rift with the
 *   party on its palm; debris with counter-words, then the first view of the Blank and the dive.
 * - Rift Shore: a beach of grey ash by a river of red ink (z ∈ [−30, 20]); path words draw stepping
 *   stones across the ink at z ≈ −6 … −14; burnt shell, boat and lantern to repaint.
 * - Cinderwood (origin WOOD_ORIGIN): a burnt forest along −Z; the half-drawn deer, Redactors, a flock
 *   and the great outline tortoise.
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, reveal, target, travel, type AreaScript } from '../areas/builders';
import { blotling, scribbleImp } from '../areas2/hush';
import { colour, correctionMoth, fireball, memoryPage, pathWord, redactor } from './blank';

const S = 'l3-rift-shore';
const W = 'l3-cinderwood';
export const SHORE_ORIGIN: Vec3 = [2000, 0, 0];
export const WOOD_ORIGIN: Vec3 = [2100, 0, 0];
const R = origin(SHORE_ORIGIN);
const C = origin(WOOD_ORIGIN);
/** The Cinder Citadel on the horizon, seen from the whole Blank. */
export const CITADEL_FAR: Vec3 = [2400, 120, -900];
export const STONES: readonly Vec3[] = [R(0.5, 0, -6), R(-0.6, 0, -10), R(0.4, 0, -14)];
export const DEER: Vec3 = C(-3, 0, -14);
export const TORTOISE: Vec3 = C(3, 0, -40);

/** Burning debris tumbling out of the Rift with a counter-word, beside the camera. */
const debris = (id: string, side: number, up: number) =>
  fireball(id, R(0, 0, 0), R(0, 0, 0), { follow: { ahead: 5, side, up }, movement: { kind: 'static' }, leaveAfterSec: 4.5 });

export const shore: AreaScript = {
  nodes: {
    SURGE_A: { position: R(0, 70, 140), lookAt: R(0, 90, 60) },
    SURGE_B: { position: R(0, 60, 70), lookAt: R(0, 40, -60) },
    SHORE_LAND: { position: R(0, 1.6, 6), lookAt: R(0, 0.8, -12) },
    SHORE_FAR: { position: R(0, 1.6, -18), lookAt: R(0, 1.4, -34) },
  },
  lookPoints: {
    BLANK_CITADEL: CITADEL_FAR,
    SHORE_ASH: R(0, 0.5, -24),
    SURGE_SKY: R(0, 70, 40),
  },
  beats: [
    fade('l3-open', S, 'SURGE_A', { music: 'citadel-battle', objective: 'l3-rift', fadeOutSec: 0, holdSec: 0.2, fadeInSec: 0.8 }),
    // Beat 1: up through the Rift on the Warden's palm; counter-words from about 2 s.
    travel('l3-rift-surge', S, ['SURGE_A', 'SURGE_B'], 9, {
      easing: 'easeInOutCubic',
      barks: ['l3-orin-open', 'l3-not-scared'],
      chase: [
        { at: 0.2, target: debris('rift-debris-1', 1.1, 0.8) },
        { at: 0.45, target: debris('rift-debris-2', -1.0, 1.0) },
        { at: 0.7, target: debris('rift-debris-3', 0.6, 1.2) },
      ],
    }),
    // Beat 2: the first view of the Blank.
    reveal('l3-blank-view', S, 'SURGE_B', ['BLANK_CITADEL'], 1.4, 4.5, {
      attention: 'spectacle',
      music: 'blank-wander',
      barks: ['l3-fortress'],
      fx: [{ kind: 'flash', atBeat: 0.02, color: '#ffffff' }],
    }),
    travel('l3-warden-dive', S, ['SURGE_B', 'SHORE_LAND'], 8, {
      easing: 'easeInOutCubic',
      chase: [
        { at: 0.25, target: correctionMoth('dive-moth-1', [R(0, 0, 0)], { follow: { ahead: 4.6, side: 1.2, up: 0.5 }, movement: { kind: 'static' }, leaveAfterSec: 5 }) },
        { at: 0.6, target: correctionMoth('dive-moth-2', [R(0, 0, 0)], { follow: { ahead: 4.6, side: -1.2, up: 0.4 }, movement: { kind: 'static' }, leaveAfterSec: 5 }) },
      ],
    }),
    checkpoint('l3-rift-crossed', S, 'rift-crossed', { objective: 'l3-shore' }),
    fight('l3-path-shore', S, { barks: ['l3-write-path'] }),
    travel('l3-cross-stones', S, ['SHORE_LAND', 'SHORE_FAR'], 4, { barks: ['l3-colour-tip'] }),
    fight('l3-shore-s1', S, { music: 'citadel-battle' }),
    checkpoint('l3-shore-checkpoint', S, 'rift-shore-written', { objective: 'l3-cinderwood' }),
  ],
  encounters: [
    {
      id: 'l3-path-shore',
      areaId: S,
      kind: 'interaction',
      waves: [
        {
          id: 'stones',
          sequential: true,
          targets: (['step', 'stone', 'shore'] as const).map((word, i) => pathWord(`stone-${i + 1}`, STONES[i] ?? R(0, 0, -8), word, `l3-stone-${i + 1}`)),
        },
      ],
    },
    {
      id: 'l3-shore-s1',
      areaId: S,
      kind: 'combat',
      waves: [
        {
          id: 'erupt',
          targets: [
            blotling('shore-blot-1', [R(-6, 0, -30), R(-3, 0, -24), R(-1, 0, -21)]),
            scribbleImp('shore-imp-1', [R(6, 0, -30), R(3, 0, -25), R(1.2, 0, -21)], { delaySec: 0.7 }),
            colour('shore-shell', R(-5, 0.6, -26), 'shell', 'l3-shell', { reward: { starPage: 'memory-1', score: 60 } }),
          ],
        },
        {
          id: 'erupt-2',
          targets: [
            blotling('shore-blot-2', [R(4, 0, -32), R(2, 0, -26), R(0.6, 0, -21)]),
            scribbleImp('shore-imp-2', [R(-5, 0, -32), R(-2, 0, -26), R(-0.8, 0, -21)], { delaySec: 0.6 }),
            fireball('shore-ink', R(3, 0.8, -28), R(0.5, 1.6, -15.6), { delaySec: 1.6 }),
            colour('shore-boat', R(7, 0.8, -28), 'boat', 'l3-boat'),
            colour('shore-lantern', R(-8, 1.2, -22), 'lamp', 'l3-lantern', { delaySec: 1 }),
          ],
        },
      ],
    },
  ],
};

export const cinderwood: AreaScript = {
  nodes: {
    CW_START: { position: C(0, 1.6, 6), lookAt: C(-2, 1.4, -14) },
    CW_MID: { position: C(0, 1.6, -18), lookAt: C(0, 2, -34) },
    CW_END: { position: C(1, 2.6, -36), lookAt: C(3, 1.5, -40) },
    CW_RIDE: { position: C(3, 3.2, -70), lookAt: C(3, 2, -100) },
  },
  lookPoints: {
    CW_DEER: C(-3, 1, -14),
  },
  beats: [
    fade('l3-cw-enter', W, 'CW_START', { music: 'blank-wander', objective: 'l3-cinderwood', barks: ['l3-cw-1'] }),
    fight('l3-deer', W, { barks: ['l3-deer'] }),
    travel('l3-cw-follow-deer', W, ['CW_START', 'CW_MID'], 5, { barks: ['l3-deer-path'] }),
    fight('l3-cw-moths', W, { music: 'citadel-battle', barks: ['l3-erased-tip'] }),
    fight('l3-cw-redactors', W, { barks: ['l3-redactors'] }),
    fight('l3-flock', W),
    travel('l3-cw-to-tortoise', W, ['CW_MID', 'CW_END'], 4),
    fight('l3-tortoise', W, { barks: ['l3-tortoise'] }),
    travel('l3-tortoise-ride', W, ['CW_END', 'CW_RIDE'], 8, {
      barks: ['l3-tortoise-ride'],
      chase: [
        { at: 0.3, target: colour('ride-colour-1', C(0, 0, 0), len(3, 4), 'l3-ride-1', { follow: { ahead: 4.4, side: -1.3, up: 0.2 } }) },
        { at: 0.65, target: colour('ride-colour-2', C(0, 0, 0), len(3, 4), 'l3-ride-2', { follow: { ahead: 4.4, side: 1.3, up: 0.2 } }) },
      ],
    }),
    checkpoint('l3-cw-checkpoint', W, 'cinderwood-coloured', { objective: 'l3-inkfall' }),
  ],
  encounters: [
    {
      id: 'l3-deer',
      areaId: W,
      kind: 'interaction',
      waves: [
        {
          id: 'deer',
          targets: [target('deer-restore', 'marker', [DEER[0], 1.4, DEER[2]], ['gentle', 'graceful'], { labelHeight: 0.4, defeatFx: { kind: 'burst', scale: 2, color: '#ffb86a' } })],
        },
      ],
      onComplete: { flags: ['l3-deer-free'] },
    },
    {
      id: 'l3-cw-moths',
      areaId: W,
      kind: 'combat',
      waves: [
        { id: 'moths-1', targets: [correctionMoth('cw-moth-1', [C(-6, 4, -30), C(5, 5, -27)]), correctionMoth('cw-moth-2', [C(6, 5, -32), C(-4, 4, -28)], { delaySec: 0.8 })] },
        { id: 'moths-2', targets: [correctionMoth('cw-moth-3', [C(-5, 6, -33), C(4, 4.5, -29)]), fireball('cw-dust', C(3, 5, -30), C(0.5, 1.7, -19.4), { delaySec: 1.4 }), correctionMoth('cw-moth-4', [C(6, 4, -34), C(-3, 6, -30)], { delaySec: 1.2 })] },
      ],
    },
    {
      id: 'l3-cw-redactors',
      areaId: W,
      kind: 'combat',
      waves: [
        {
          id: 'redactors',
          targets: [
            redactor('cw-red-1', [C(-9, 0, -36), C(-5, 0, -30), C(-1.5, 0, -24)]),
            redactor('cw-red-2', [C(9, 0, -38), C(5, 0, -31), C(1.5, 0, -24.5)], { delaySec: 1.4 }),
          ],
        },
      ],
    },
    {
      id: 'l3-flock',
      areaId: W,
      kind: 'interaction',
      optionalPrompt: 'l3-flock',
      speedRound: { sec: 9 },
      waves: [
        {
          id: 'birds',
          sequential: true,
          targets: (['wing', 'song', 'feather'] as const).map((word, i) => marker(`bird-${i + 1}`, C(-3 + i * 3, 6 + (i % 2), -30), word, { labelHeight: 0.3, defeatFx: { kind: 'burst', scale: 1, color: ['#ff6a5a', '#ffd24a', '#4ab8ff'][i] } })),
        },
      ],
      onComplete: { reward: { starPage: 'memory-2' } },
    },
    {
      id: 'l3-tortoise',
      areaId: W,
      kind: 'interaction',
      waves: [{ id: 'tortoise', targets: [marker('tortoise-restore', [TORTOISE[0], 2.6, TORTOISE[2]], 'ancient', { labelHeight: 0.4, defeatFlag: 'l3-tortoise-free', defeatFx: { kind: 'pillar', scale: 1.2, color: '#7ae0a0' } })] }],
    },
  ],
};

export { memoryPage };
