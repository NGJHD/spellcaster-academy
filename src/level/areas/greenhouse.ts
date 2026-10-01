/**
 * LD-13: Enchanted Greenhouse. Local layout (origin GREENHOUSE_ORIGIN):
 * chamber 1 z ∈ [−20, 2], water channel z ∈ [−26, −20] crossed by the vine bridge, chamber 2 z ∈ [−52, −26].
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, marker, origin, reveal, talk, target, travel, type AreaScript } from './builders';

const A = 'enchanted-greenhouse';
export const GREENHOUSE_ORIGIN: Vec3 = [420, 0, 0];
const G = origin(GREENHOUSE_ORIGIN);

export const GREENHOUSE_ANCHOR_POSITION = G(-6, 0, -46);
export const ROOF_PANEL_POSITION = G(5, 7.2, -36);
export const VINE_KNOT_POSITIONS: readonly Vec3[] = [G(-1.2, 0.6, -21), G(0, 0.9, -23), G(1.2, 0.6, -25)];

const pod = (id: string, position: Vec3, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'thorn-pod', position, [len(4, 6)], { attack: ATTACKS.thornSeed, labelHeight: 1.7, ...options });

const mossling = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'mossling', path[0] ?? G(0, 0, -45), [len(4, 6)], {
    movement: { kind: 'approach', path, speed: 0.75 },
    attack: ATTACKS.mosslingSwipe,
    labelHeight: 1.45,
    ...options,
  });

const pollen = (id: string, path: Vec3[], delaySec: number): TargetSpawn =>
  target(id, 'pollen', path[0] ?? G(0, 3, -38), [len(3, 4)], {
    optional: true,
    leaveAfterSec: 14,
    delaySec,
    labelHeight: 0.5,
    movement: { kind: 'patrol', path, speed: 0.5 },
    reward: { score: 50 },
  });

export const greenhouse: AreaScript = {
  nodes: {
    GH_ENTRY: { position: G(0, 1.6, 2), lookAt: G(0, 2.2, -10) },
    GH_REVEAL: { position: G(0, 1.6, -6), lookAt: G(0, 1.4, -18) },
    GH_VINE: { position: G(0, 1.6, -15.5), lookAt: G(0, 0.6, -23) },
    GH_BRIDGE_MID: { position: G(0, 1.7, -23), lookAt: G(0, 1.8, -32) },
    GH_COMBAT: { position: G(0, 1.6, -28), lookAt: G(0, 1.6, -38) },
    GH_ANCHOR: { position: G(-2.5, 1.6, -39), lookAt: G(-6, 1.4, -46) },
  },
  lookPoints: {
    GH_LEAF_PAGE: G(-6, 1.4, -11),
    GH_ROOF_PANEL: ROOF_PANEL_POSITION,
    GH_PANEL_PAGE: G(6.5, 0.6, -38),
    GH_VERDANT: G(4.5, 1.2, -33),
  },
  beats: [
    fade('greenhouse-enter', A, 'GH_ENTRY', { music: 'greenhouse-wonder', objective: 'greenhouse-anchor' }),
    travel('greenhouse-entry', A, ['GH_ENTRY', 'GH_REVEAL'], 5),
    reveal('greenhouse-leaf-pan', A, 'GH_REVEAL', ['GH_LEAF_PAGE'], 1.6, 3.6, {
      bonus: target('bonus-page-leaf', 'star-page', G(-6, 1.2, -11), ['frond'], {
        optional: true,
        labelHeight: 0.45,
        reward: { starPage: 'page-greenhouse-leaf' },
      }),
    }),
    travel('greenhouse-to-vine', A, ['GH_REVEAL', 'GH_VINE'], 4, { reducedMotion: 'glide' }),
    talk('greenhouse-vine-talk', A, ['gh-1']),
    fight('greenhouse-vine', A),
    travel('greenhouse-cross-bridge', A, ['GH_VINE', 'GH_BRIDGE_MID', 'GH_COMBAT'], 7),
    talk('greenhouse-pods-talk', A, ['gh-pods'], { music: 'greenhouse-action' }),
    fight('greenhouse-h1', A),
    fight('greenhouse-h2', A),
    reveal('greenhouse-warden-scene', A, 'GH_COMBAT', ['GH_ROOF_PANEL', 'GH_PANEL_PAGE'], 2.0, 2.6, {
      barks: ['gh-warden'],
      music: 'greenhouse-wonder',
      bonus: target('bonus-page-panel', 'star-page', G(6.5, 0.45, -38), ['glass'], {
        optional: true,
        labelHeight: 0.45,
        reward: { starPage: 'page-greenhouse-panel' },
      }),
    }),
    reveal('greenhouse-verdant-pan', A, 'GH_COMBAT', ['GH_VERDANT'], 1.4, 2.6, {
      bonus: target('bonus-trail-verdant', 'star-page', G(4.5, 1.0, -33), ['sprout'], {
        optional: true,
        labelHeight: 0.45,
        variant: 'cosmetic',
        reward: { cosmetic: 'trail-verdant' },
      }),
    }),
    travel('greenhouse-to-anchor', A, ['GH_COMBAT', 'GH_ANCHOR'], 5, { barks: ['gh-anchor-intro'] }),
    fight('greenhouse-anchor', A),
    checkpoint('greenhouse-checkpoint', A, 'greenhouse-restored', { objective: 'reach-observatory' }),
  ],
  encounters: [
    {
      id: 'greenhouse-vine',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'vine',
          sequential: true,
          targets: ['leaf', 'root', 'bloom'].map((word, i) =>
            marker(`vine-${i + 1}`, VINE_KNOT_POSITIONS[i] ?? G(0, 0.6, -22), word, { labelHeight: 0.5 }),
          ),
        },
      ],
      onComplete: { flags: ['vine-bridge-grown'] },
    },
    {
      id: 'greenhouse-h1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'pods',
          targets: [
            pod('pod-1', G(-5, 0, -38), { priority: true, reward: { starPage: 'page-greenhouse-pod' }, rewardIf: 'first-defeat' }),
            pod('pod-2', G(5, 0, -40), { attack: { ...ATTACKS.thornSeed, intervalSec: 8.5 } }),
            mossling('moss-1', [G(0, 0, -46), G(0.5, 0, -38), G(0, 0, -31.2)], { delaySec: 1.5 }),
          ],
        },
      ],
    },
    {
      id: 'greenhouse-h2',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'mosslings',
          targets: [
            mossling('moss-2', [G(-6, 0, -46), G(-3, 0, -38), G(-1, 0, -31.4)]),
            mossling('moss-3', [G(6, 0, -45), G(3, 0, -38), G(1.1, 0, -31.6)], { delaySec: 2 }),
            mossling('moss-4', [G(0, 0, -50), G(0, 0, -40), G(0, 0, -32)], { delaySec: 4, challengeOnly: true }),
            pollen('pollen-1', [G(-4, 3.4, -36), G(3, 3.0, -37)], 0.5),
            pollen('pollen-2', [G(4, 2.6, -40), G(-2, 3.6, -40)], 3),
          ],
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'gh-moss' }],
    },
    {
      id: 'greenhouse-anchor',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'knots',
          sequential: true,
          targets: ['rain', 'fern', 'amber'].map((word, i) =>
            marker(`gh-knot-${i + 1}`, G(-6, 0.9 + i * 0.5, -46), word, { labelHeight: 0.4 }),
          ),
        },
      ],
      barks: [
        { when: { on: 'complete' }, line: 'gh-anchor-done' },
      ],
      onComplete: { restoreAnchor: 'greenhouse', unlockSpell: 'chain-spark', flags: ['greenhouse-anchor-restored'] },
    },
  ],
};
