/**
 * LEVEL2_DESIGN L2-14: the East Ramparts and Beacon 4. Burning battlements over the lake and the red
 * Rift; the Hush climb the cliffs on flaming ladders in three lanes (left tower, centre gate, right
 * tower). The Warden holds the wall beside the player; inkfire scorches it and restore words bring it
 * back. A Hollow Knight Captain, then four words close the Lantern Ward. Local layout (origin
 * RAMPART_ORIGIN): wall walk along x at z = 0; the cliff drops to −Z; the Warden at (5, 0, −1.5).
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, travel, type AreaScript } from '../areas/builders';
import { blotling, fireball, hound, knight, restore } from './hush';

const A = 'l2-ramparts';
export const RAMPART_ORIGIN: Vec3 = [1500, 30, 0];
const R = origin(RAMPART_ORIGIN);
/** The last beacon: an iron brazier on the wall walk, in front of the post. */
export const RAMPART_BEACON: Vec3 = R(-1.2, 0, -1.6);
export const RAMPART_WARDEN: Vec3 = R(10, 0, -1.5);
export const LADDERS: readonly Vec3[] = [R(-8, -6, -6), R(0, -6, -7), R(8, -6, -6)];

/** Up a flaming ladder and over the wall into the lane. */
const climb = (n: 0 | 1 | 2, x = 0): Vec3[] => {
  const l = LADDERS[n] ?? R(0, -6, -7);
  return [l, [l[0], RAMPART_ORIGIN[1], l[2] + 3], R((n - 1) * 3 + x, 0, -1.6)];
};

export const ramparts: AreaScript = {
  nodes: {
    RP_ENTRY: { position: R(-14, 1.6, 4), lookAt: R(0, 1, -6) },
    RP_POST: { position: R(0, 1.6, 3.4), lookAt: R(0, 0.4, -6) },
  },
  lookPoints: {
    RP_WARDEN: R(10, 3, -1.5),
    RP_BEACON: R(-1.2, 2.6, -1.6),
    RP_LAKE: R(0, -20, -80),
    RP_DOME: R(0, 70, -60),
  },
  beats: [
    fade('l2-rp-enter', A, 'RP_ENTRY', { music: 'siege-dread', objective: 'l2-ramparts' }),
    // Said once the wall and the Warden are in view, not during the fade.
    travel('l2-rp-to-post', A, ['RP_ENTRY', 'RP_POST'], 4, { barks: ['l2-rp-1'] }),
    fight('l2-rp-lanes', A, { music: 'siege-battle', barks: ['l2-rp-lanes'] }),
    fight('l2-rp-warden', A, { barks: ['l2-rp-warden'] }),
    fight('l2-rp-captain', A, { barks: ['l2-rp-captain'] }),
    fight('l2-rampart-beacon', A, { barks: ['l2-rp-beacon'] }),
    checkpoint('l2-rp-checkpoint', A, 'rampart-beacon-lit', { barks: ['l2-orin-ward', 'l2-orin-dragon'], objective: 'l2-wyrm', journey: 'l2-tower' }),
  ],
  encounters: [
    {
      id: 'l2-rp-lanes',
      areaId: A,
      kind: 'combat',
      waves: [
        { id: 'climb-1', targets: [blotling('rp-b1', climb(0)), blotling('rp-b2', climb(2), { delaySec: 0.8 })] },
        {
          id: 'climb-2',
          targets: [
            hound('rp-h1', climb(1)),
            blotling('rp-b3', climb(0, 1), { delaySec: 0.6 }),
            fireball('rp-ink', R(8, -2, -9), R(0.8, 1.7, 2.4), { delaySec: 1.6 }),
            blotling('rp-b4', climb(2, -1), { delaySec: 2.2 }),
          ],
        },
      ],
    },
    {
      id: 'l2-rp-warden',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'restore',
          sequential: true,
          targets: [
            restore('rp-warden-1', R(10, 3.2, -1.2), 'stone', 'l2-warden-1'),
            restore('rp-warden-2', R(10.6, 2.2, -1.2), 'steady', 'l2-warden-2'),
          ],
        },
      ],
      onComplete: { flags: ['l2-warden-restored'] },
    },
    {
      id: 'l2-rp-captain',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'captain',
          targets: [
            // Leaps over the parapet in a burst of fire rather than climbing the ladder out of sight
            // (owner, 2026-10-16: the captain took far too long to appear).
            knight('rp-captain', [R(0, 1, -2.9), R(0, 0, -1.4)], [len(5, 7), len(5, 7), len(5, 7)], {
              variant: 'captain',
              labelHeight: 2.9,
              entrance: { kind: 'geyser', scale: 1.4, color: '#ff5a1a' },
            }),
            fireball('rp-halt', R(0, 2.4, -4), R(-0.4, 1.7, 2.6), { delaySec: 4, words: ['halt'] }),
            restore('rp-warden-3', R(10, 3.6, -1.2), 'guard', 'l2-warden-3', { optional: true, leaveAfterSec: 16, delaySec: 2 }),
          ],
        },
      ],
    },
    {
      id: 'l2-rampart-beacon',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'beacon',
          sequential: true,
          targets: ['rampart', 'stand', 'together', 'dawn'].map((word, i) =>
            // The words float just over the beacon's bowl, so the brazier stays in view while they are
            // typed (owner: "what are these words targeting? I only see the sky").
            marker(`rampart-word-${i + 1}`, [RAMPART_BEACON[0] - 1.2 + i * 0.8, RAMPART_BEACON[1] + 2.1 + (i % 2) * 0.3, RAMPART_BEACON[2]], word, { labelHeight: 0.3, defeatFx: { kind: 'burst', scale: 0.9, color: '#ffd27a' } }),
          ),
        },
      ],
      onComplete: { flags: ['l2-beacon-rampart', 'l2-ward-closed'] },
      completeFx: [
        { kind: 'flash' },
        { kind: 'pillar', at: 'RP_BEACON', scale: 1.6, color: '#ffd27a' },
        { kind: 'pillar', at: 'RP_WARDEN', scale: 2, color: '#ffd27a' },
        { kind: 'shockwave', at: 'RP_DOME', scale: 6, color: '#ffd27a' },
        { kind: 'shake', scale: 1.4 },
      ],
    },
  ],
};
