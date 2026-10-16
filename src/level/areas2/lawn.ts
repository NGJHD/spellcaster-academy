/**
 * LEVEL2_DESIGN L2-7: the lawn. Night by Lantern Lake after the Lantern Festival: the apprentice runs
 * out of the Dormitory Tower (see bedroom.ts) into the siege; fireballs teach counter-words, the Hush
 * climb out of the flames, and Keeper Orin sends the apprentice to light the four beacons. Local layout (origin LAWN_ORIGIN): lawn
 * x ∈ [-22, 22], z ∈ [-24, 22]; the lake beyond z < -24; the Rift high over the lake; the dormitory
 * tower east at (26, 0, -6).
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, origin, reveal, travel, type AreaScript } from '../areas/builders';
import { blotling, fireball, lantern, moth, restore } from './hush';

const A = 'l2-festival-lawn';
export const LAWN_ORIGIN: Vec3 = [900, 0, 0];
const W = origin(LAWN_ORIGIN);

export const STALL_POSITIONS: readonly Vec3[] = [W(-7, 0, -6), W(6, 0, -9), W(-2, 0, -14)];
export const DORM_DOOR: Vec3 = W(24.6, 0, -6);

export const lawn: AreaScript = {
  nodes: {
    LAWN_DORM_OUT: { position: W(21.5, 1.6, -5.5), lookAt: W(4, 3, -22) },
    LAWN_WEST: { position: W(-12, 1.6, 0), lookAt: W(-40, 4, -6) },
    LAWN_CENTRE: { position: W(0, 1.6, 4), lookAt: W(0, 3, -24) },
    LAWN_STALLS: { position: W(-1, 1.6, 2), lookAt: W(-3, 1.2, -9) },
  },
  lookPoints: {
    LAWN_RIFT: W(0, 46, -120),
    LAWN_LAKE: W(0, 2, -60),
    LAWN_STALL_LEFT: W(-7, 1.2, -6),
    LAWN_ROOFTOPS: W(-30, 12, -30),
    LAWN_BOATHOUSE: W(18, 2, -28),
    LAWN_SKY_DROP: W(-4, 8, -14),
  },
  beats: [
    // Out of the Dormitory Tower door onto the burning lawn (after the bedroom and the stair rescue).
    fade('l2-lawn-enter', A, 'LAWN_DORM_OUT', { fadeOutSec: 0.3, holdSec: 0.2, fadeInSec: 0.6, music: 'siege-battle', objective: 'l2-lawn' }),
    travel('l2-lawn-run', A, ['LAWN_DORM_OUT', 'LAWN_CENTRE'], 3, { barks: ['l2-orin-run'], easing: 'easeOutCubic' }),
    // Counter-word tutorial: fireballs streak straight at the camera.
    fight('l2-fireballs', A, { barks: ['l2-counter-tip'] }),
    reveal('l2-lawn-burning', A, 'LAWN_CENTRE', ['LAWN_BOATHOUSE', 'LAWN_STALL_LEFT'], 0.9, 1.2, {
      attention: 'spectacle',
      fx: [
        { kind: 'shockwave', at: 'LAWN_BOATHOUSE', atBeat: 0.1, scale: 1.5, color: '#ff5a1a' },
        { kind: 'debris', at: 'LAWN_BOATHOUSE', atBeat: 0.12, scale: 1.4, color: '#4a3424' },
        { kind: 'geyser', at: 'LAWN_SKY_DROP', atBeat: 0.6, scale: 1, color: '#141010' },
      ],
    }),
    fight('l2-lawn-f1', A, { music: 'siege-battle', barks: ['l2-block'] }),
    travel('l2-to-stalls', A, ['LAWN_CENTRE', 'LAWN_STALLS'], 2.5),
    fight('l2-lawn-stall', A, { barks: ['l2-inkfire'] }),
    fight('l2-lawn-f2', A, { barks: ['l2-evacuate'] }),
    checkpoint('l2-lawn-checkpoint', A, 'festival-lawn-complete', { objective: 'l2-beacons', barks: ['l2-orin-1', 'l2-orin-beacons'] }),
    // Off to the first beacon: the Bell Bridge, past the burning stalls.
    travel('l2-to-bridge', A, ['LAWN_STALLS', 'LAWN_WEST'], 4, { barks: ['l2-to-bell'], journey: 'l2-bell' }),
  ],
  encounters: [
    {
      id: 'l2-fireballs',
      areaId: A,
      kind: 'combat',
      waves: [
        { id: 'first', targets: [fireball('fb-1', W(0, 16, -32), W(0, 1.7, 2.6), { words: ['ink'], movement: { kind: 'approach', path: [W(0, 16, -32), W(0, 1.7, 2.6)], speed: 1.4 } })] },
        {
          id: 'second',
          targets: [
            fireball('fb-2', W(-10, 16, -32), W(-0.6, 1.8, 2.6), { words: ['run'] }),
            fireball('fb-3', W(11, 15, -32), W(0.6, 1.6, 2.6), { delaySec: 1.2 }),
          ],
        },
      ],
    },
    {
      id: 'l2-lawn-f1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'blots',
          sequential: true,
          targets: [
            blotling('blot-1', [W(-6, 0, -16), W(-3, 0, -6), W(-1, 0, 1)]),
            blotling('blot-2', [W(6, 0, -16), W(3, 0, -6), W(1, 0, 1)]),
            blotling('blot-3', [W(0, 0, -20), W(0, 0, -8), W(0, 0, 1)]),
          ],
        },
        {
          id: 'blots-ink',
          targets: [
            blotling('blot-4', [W(-8, 0, -14), W(-4, 0, -5), W(-1.2, 0, 1)]),
            fireball('ink-1', W(-8, 1.2, -14), W(-0.5, 1.6, 2.6), { delaySec: 1.6, labelHeight: 0.5 }),
            blotling('blot-5', [W(8, 0, -14), W(4, 0, -5), W(1.2, 0, 1)], { delaySec: 0.8 }),
          ],
        },
      ],
    },
    {
      id: 'l2-lawn-stall',
      areaId: A,
      kind: 'interaction',
      waves: [{ id: 'stall', targets: [restore('stall-1', W(-7, 1.6, -6), 'stall', 'l2-stall-1')] }],
      barks: [{ when: { on: 'complete' }, line: 'l2-stall-done' }],
    },
    {
      id: 'l2-lawn-f2',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'moths',
          targets: [
            moth('moth-1', [W(-10, 4, -12), W(4, 5, -10)]),
            blotling('blot-6', [W(5, 0, -18), W(2, 0, -7), W(0.8, 0, 1)], { delaySec: 0.6 }),
            lantern('lantern-lawn-1', W(-12, 3.5, -10), 'float', 'lantern-lawn-1', { movement: { kind: 'patrol', path: [W(-12, 3.5, -10), W(-4, 4, -16)], speed: 0.6 } }),
          ],
        },
        {
          id: 'moths-2',
          targets: [
            moth('moth-2', [W(10, 5, -12), W(-3, 4, -9)]),
            moth('moth-3', [W(-9, 6, -16), W(6, 4.5, -14)], { delaySec: 1 }),
            fireball('dust-1', W(4, 6, -18), W(0.6, 1.7, 2.6), { delaySec: 2.2 }),
            restore('stall-2', W(6, 1.6, -9), 'booth', 'l2-stall-2', { optional: true, leaveAfterSec: 20 }),
            lantern('lantern-lawn-2', W(12, 3, -14), 'glimmer', 'lantern-lawn-2', { delaySec: 1, movement: { kind: 'patrol', path: [W(12, 3, -14), W(4, 4.5, -18)], speed: 0.6 } }),
          ],
        },
      ],
    },
  ],
};
