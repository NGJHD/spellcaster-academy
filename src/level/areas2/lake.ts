/**
 * Lantern Lake and Beacon 3. Oarsby's boat glides across a lake reflecting the
 * red Rift; burning lanterns drift on the water; the boathouse burns on the shore. Hollow Knights hold
 * the jetty. At the lighthouse island a brass lift rockets up the tower while moths smash through the
 * windows; four words light the lamp. Local layout (origin LAKE_ORIGIN): water at y = 0, the boat
 * route along −Z from z = 20 to the island at z = −118; the boathouse jetty east at x = 14, z = −46;
 * the lighthouse at (0, 0, −128), 28 m tall.
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, hold, marker, origin, reveal, target, travel, type AreaScript } from '../areas/builders';
import { fireball, knight, moth } from './hush';

const A = 'l2-lantern-lake';
export const LAKE_ORIGIN: Vec3 = [1400, 0, 0];
const L = origin(LAKE_ORIGIN);
export const LIGHTHOUSE: Vec3 = L(0, 0, -128);
export const LIGHTHOUSE_HEIGHT = 28;
/** Beats with the boat moored at the jetty (before the camera steps in). */
export const MOORED_BEATS = ['l2-lake-enter', 'l2-lake-jetty-walk', 'l2-lake-board'] as const;
export const BOAT_BEATS = ['l2-lake-step-in', 'l2-lake-push-off', 'l2-lake-seg-1', 'l2-lake-jetty-move', 'l2-lake-jetty', 'l2-lake-seg-2'] as const;
export const LIFT_BEATS_L2 = ['l2-lighthouse-lift'] as const;

/** A moth smashing through a lighthouse window as the lift rockets past. */
const windowMoth = (id: string, side: number) =>
  target(id, 'eraser-moth', L(0, 0, 0), [{ min: 3, max: 4 }], {
    follow: { ahead: 3, side, up: 0.2 },
    leaveAfterSec: 4.5,
    labelHeight: 0.9,
    entrance: { kind: 'glass', scale: 0.8 },
    defeatFx: { kind: 'burst', scale: 1, color: '#ffa040' },
  });

export const lake: AreaScript = {
  nodes: {
    // Owner (2026-10-07): start on the shore, not in the middle of the lake. A jetty runs out from the
    // shore (z > 32) to Oarsby's boat moored at z = 20.
    LAKE_SHORE: { position: L(-2.2, 1.95, 31), lookAt: L(0, 0.7, 19) },
    LAKE_JETTY_END: { position: L(-2.0, 1.95, 23), lookAt: L(0, 0.6, 18) },
    LAKE_DOCK: { position: L(0, 1.4, 20), lookAt: L(0, 1.2, -20) },
    LAKE_OPEN: { position: L(-2, 1.4, -6), lookAt: L(0, 1.4, -40) },
    LAKE_MID: { position: L(2, 1.4, -34), lookAt: L(12, 2, -46) },
    LAKE_JETTY: { position: L(6, 1.4, -44), lookAt: L(14, 1.6, -47) },
    LAKE_BEYOND: { position: L(1, 1.4, -78), lookAt: L(0, 4, -128) },
    LAKE_ISLAND: { position: L(6, 1.6, -110), lookAt: L(0, 6, -128) },
    // The brass lift climbs the outside of the tower, looking out over the burning lake.
    LH_BASE: { position: L(11, 1.6, -121), lookAt: L(28, 3, -150) },
    LH_TOP: { position: L(11, LIGHTHOUSE_HEIGHT + 1.6, -121), lookAt: L(0, LIGHTHOUSE_HEIGHT + 1.4, -129) },
  },
  lookPoints: {
    LAKE_BOATHOUSE: L(16, 3, -50),
    LAKE_LAMP: L(0, LIGHTHOUSE_HEIGHT + 2.6, -128),
    LAKE_RIFT: L(-40, 60, -200),
  },
  beats: [
    fade('l2-lake-enter', A, 'LAKE_SHORE', { music: 'evacuation-hope', objective: 'l2-lake' }),
    travel('l2-lake-jetty-walk', A, ['LAKE_SHORE', 'LAKE_JETTY_END'], 2.5, { barks: ['l2-oarsby-1'] }),
    // Type "row" and Oarsby pushes off; the camera steps down into the boat.
    hold('l2-lake-board', A, 'LAKE_JETTY_END', 1, {
      barks: ['l2-oarsby-row'],
      chase: [{ at: 0.05, target: marker('boat-row', L(0, 1.3, 18.6), 'row', { labelHeight: 0.2, defeatFx: { kind: 'sparks', scale: 0.8, color: '#ffd27a' } }) }],
    }),
    travel('l2-lake-step-in', A, ['LAKE_JETTY_END', 'LAKE_DOCK'], 1.5, { easing: 'easeInOutCubic' }),
    travel('l2-lake-push-off', A, ['LAKE_DOCK', 'LAKE_OPEN'], 6),
    fight('l2-lake-seg-1', A, { music: 'siege-battle', barks: ['l2-lake-moths'] }),
    travel('l2-lake-jetty-move', A, ['LAKE_OPEN', 'LAKE_MID', 'LAKE_JETTY'], 6, { barks: ['l2-lake-boathouse'] }),
    fight('l2-lake-jetty', A),
    travel('l2-lake-seg-2', A, ['LAKE_JETTY', 'LAKE_BEYOND', 'LAKE_ISLAND'], 9),
    travel('l2-lake-dock-island', A, ['LAKE_ISLAND', 'LH_BASE'], 3, { music: 'siege-dread', barks: ['l2-oarsby-lift'] }),
    // Fast-rail set piece: the lighthouse lift rockets up while moths smash through the windows.
    travel('l2-lighthouse-lift', A, ['LH_BASE', 'LH_TOP'], 9, {
      easing: 'easeInOutCubic',
      barks: ['l2-lighthouse-lift'],
      chase: [
        { at: 0.15, target: windowMoth('lh-moth-1', 1) },
        { at: 0.45, target: windowMoth('lh-moth-2', -1) },
        { at: 0.72, target: windowMoth('lh-moth-3', 0.9) },
      ],
    }),
    fight('l2-lighthouse-beacon', A, { barks: ['l2-lighthouse-intro'] }),
    reveal('l2-lighthouse-sweep', A, 'LH_TOP', ['LAKE_RIFT'], 1, 0.8, { attention: 'spectacle', barks: ['l2-lighthouse-lit'] }),
    checkpoint('l2-lake-checkpoint', A, 'lighthouse-beacon-lit', { objective: 'l2-library' }),
    hold('l2-lake-exit', A, 'LH_TOP', 2.5, { barks: ['l2-to-library'], journey: 'l2-library' }),
  ],
  encounters: [
    {
      id: 'l2-lake-seg-1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'water-1',
          targets: [
            moth('lake-moth-1', [L(-8, 4, -18), L(6, 5, -14)]),
            moth('lake-moth-2', [L(8, 5, -20), L(-5, 4, -16)], { delaySec: 0.8 }),
            fireball('lake-blot-1', L(-6, 0.3, -16), L(-2.6, 1.5, -9.6), { delaySec: 1.6 }),
          ],
        },
      ],
    },
    {
      id: 'l2-lake-jetty',
      areaId: A,
      kind: 'combat',
      waves: [
        { id: 'knight-1', targets: [knight('jetty-k1', [L(14, 0.6, -48), L(11, 0.6, -46)], undefined, { movement: { kind: 'static' } })] },
        { id: 'knight-2', targets: [knight('jetty-k2', [L(16, 0.6, -45), L(12, 0.6, -45)], undefined, { movement: { kind: 'static' } }), moth('jetty-moth', [L(10, 5, -50), L(16, 4, -44)], { delaySec: 1 })] },
      ],
    },
    {
      id: 'l2-lighthouse-beacon',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'lamp',
          sequential: true,
          targets: ['harbour', 'guide', 'shine', 'homeward'].map((word, i) =>
            marker(`lamp-word-${i + 1}`, L(0, LIGHTHOUSE_HEIGHT + 1.8 + i * 0.35, -131), word, { labelHeight: 0.3, defeatFx: { kind: 'burst', scale: 0.8, color: '#ffe6a0' } }),
          ),
        },
      ],
      onComplete: { flags: ['l2-beacon-lighthouse'] },
      completeFx: [
        { kind: 'flash' },
        { kind: 'pillar', at: 'LAKE_LAMP', scale: 1.8, color: '#ffd27a' },
        { kind: 'shockwave', at: 'LAKE_LAMP', scale: 2.5, color: '#ffd27a' },
      ],
    },
  ],
};
