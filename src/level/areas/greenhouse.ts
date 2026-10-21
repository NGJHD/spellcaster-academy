/**
 * Enchanted Greenhouse. The Snapvine Chase across the vine
 * bridge, thorn pods bursting out of the soil, a mossling stampede, and the Warden smashing down
 * through the glass roof. Local layout (origin GREENHOUSE_ORIGIN):
 * chamber 1 z ∈ [−20, 2], water channel z ∈ [−26, −20] crossed by the vine bridge, chamber 2 z ∈ [−52, −26].
 */
import type { EncounterDef, TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, hold, len, marker, origin, powerWave, reveal, target, travel, type AreaScript } from './builders';
import { anchorBlast } from './courtyard';

const A = 'enchanted-greenhouse';
export const GREENHOUSE_ORIGIN: Vec3 = [420, 0, 0];
const G = origin(GREENHOUSE_ORIGIN);

export const GREENHOUSE_ANCHOR_POSITION = G(-6, 0, -46);
export const ROOF_PANEL_POSITION = G(5, 7.2, -36);
export const VINE_KNOT_POSITIONS: readonly Vec3[] = [G(-1.2, 0.6, -21), G(0, 0.9, -23), G(1.2, 0.6, -25)];

/** Thorn pods burst up out of the soil in a shower of dirt. */
const pod = (id: string, position: Vec3, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'thorn-pod', position, [len(4, 6)], {
    attack: ATTACKS.thornSeed,
    labelHeight: 1.7,
    entrance: { kind: 'geyser', scale: 0.7, color: '#6b4a2b' },
    ...options,
  });

/** Mosslings charge in a stampede: faster, with a dust trail as they set off. */
const mossling = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'mossling', path[0] ?? G(0, 0, -45), [len(4, 6)], {
    movement: { kind: 'approach', path, speed: 1.15 },
    entrance: { kind: 'dust', scale: 0.9 },
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

/** The Snapvine Chase: the plant's jaws snap shut just where the camera was a moment ago. */
const snap = (at: string) =>
  [
    { kind: 'leaves', at, atBeat: 0.55, scale: 1.3 },
    { kind: 'shake', atBeat: 0.55, scale: 0.9 },
  ] as const;

/** One bridge word: grows one bridge segment (the camera then hops forward). */
function vineWord(id: string, index: number, word: string): EncounterDef {
  return {
    id,
    areaId: A,
    kind: 'interaction',
    waves: [
      {
        id: 'vine',
        targets: [
          marker(`vine-${index + 1}`, VINE_KNOT_POSITIONS[index] ?? G(0, 0.6, -22), word, {
            labelHeight: 0.5,
            defeatFx: { kind: 'leaves', scale: 0.8 },
          }),
        ],
      },
    ],
  };
}

export const greenhouse: AreaScript = {
  nodes: {
    GH_ENTRY: { position: G(0, 1.6, 2), lookAt: G(0, 2.2, -10) },
    GH_REVEAL: { position: G(0, 1.6, -6), lookAt: G(0, 1.4, -18) },
    GH_VINE: { position: G(0, 1.6, -15.5), lookAt: G(0, 0.6, -23) },
    // Snapvine Chase: each bridge word carries the camera one hop forward, just out of reach.
    GH_VINE_STEP_1: { position: G(0, 1.75, -20.6), lookAt: G(0, 0.9, -26) },
    GH_VINE_STEP_2: { position: G(0, 1.75, -22.6), lookAt: G(0.6, 0.7, -28) },
    GH_BRIDGE_MID: { position: G(0, 1.7, -23), lookAt: G(0, 1.8, -32) },
    GH_COMBAT: { position: G(0, 1.6, -28), lookAt: G(0, 1.6, -38) },
    GH_ANCHOR: { position: G(-2.5, 1.6, -39), lookAt: G(-6, 1.4, -46) },
  },
  lookPoints: {
    GH_ROOF_PANEL: ROOF_PANEL_POSITION,
    GH_PANEL_DOWN: G(6.5, 0.6, -38),
    GH_SNAP_1: G(1.4, 1.5, -16.5),
    GH_SNAP_2: G(1.3, 1.5, -20.2),
    GH_SNAP_3: G(1.2, 1.5, -22.4),
    GH_POD_LEFT: G(-5, 0.2, -38),
    GH_POD_RIGHT: G(5, 0.2, -40),
    GH_STAMPEDE: G(0, 0.2, -45),
    GH_ANCHOR_GROUND: G(-6, 0.1, -46),
    GH_ANCHOR_SKY: G(-6, 24, -46),
  },
  beats: [
    fade('greenhouse-enter', A, 'GH_ENTRY', { music: 'greenhouse-wonder', objective: 'greenhouse-anchor' }),
    travel('greenhouse-entry', A, ['GH_ENTRY', 'GH_REVEAL'], 5),
    travel('greenhouse-to-vine', A, ['GH_REVEAL', 'GH_VINE'], 4, { reducedMotion: 'glide' }),
    // The Snapvine Chase: a giant snapping plant lunges; each word hops the camera forward in time.
    fight('greenhouse-vine', A, { barks: ['gh-1'], music: 'greenhouse-action' }),
    travel('greenhouse-vine-hop-1', A, ['GH_VINE', 'GH_VINE_STEP_1'], 2.2, {
      easing: 'easeOutCubic',
      fx: snap('GH_SNAP_1'),
    }),
    fight('greenhouse-vine-2', A),
    travel('greenhouse-vine-hop-2', A, ['GH_VINE_STEP_1', 'GH_VINE_STEP_2'], 1.8, {
      easing: 'easeOutCubic',
      barks: ['gh-snap'],
      fx: snap('GH_SNAP_2'),
    }),
    fight('greenhouse-vine-3', A),
    travel('greenhouse-cross-bridge', A, ['GH_VINE_STEP_2', 'GH_BRIDGE_MID', 'GH_COMBAT'], 5, {
      easing: 'easeOutCubic',
      fx: snap('GH_SNAP_3'),
    }),
    fight('greenhouse-h1', A, { barks: ['gh-pods'] }),
    // Both lines play over the mossling fight, so the Warden scene that follows keeps its own line.
    fight('greenhouse-h2', A, { barks: ['gh-stampede', 'gh-moss'] }),
    // The Warden smashes down through the glass roof, catches the falling panel, and leaps away.
    reveal('greenhouse-warden-scene', A, 'GH_COMBAT', ['GH_ROOF_PANEL', 'GH_PANEL_DOWN'], 2.0, 2.6, {
      barks: ['gh-warden'],
      music: 'greenhouse-wonder',
      fx: [
        { kind: 'glass', at: 'GH_ROOF_PANEL', atBeat: 0.08, scale: 2 },
        { kind: 'flash', atBeat: 0.08 },
        { kind: 'shake', atBeat: 0.08, scale: 1.3 },
        { kind: 'dust', at: 'GH_PANEL_DOWN', atBeat: 0.4, scale: 1.2 },
        { kind: 'glass', at: 'GH_ROOF_PANEL', atBeat: 0.86, scale: 0.8 },
      ],
    }),
    travel('greenhouse-to-anchor', A, ['GH_COMBAT', 'GH_ANCHOR'], 5, { barks: ['gh-anchor-intro'] }),
    fight('greenhouse-anchor', A),
    reveal('greenhouse-anchor-pillar', A, 'GH_ANCHOR', ['GH_ANCHOR_SKY'], 0.8, 0.7, { attention: 'spectacle' }),
    fight('greenhouse-power', A, { barks: ['power-chain'] }),
    // Where next and why: the crack is over the Moon Tower.
    hold('greenhouse-exit', A, 'GH_ANCHOR', 1, { barks: ['gh-exit-1', 'gh-exit'] }),
    checkpoint('greenhouse-checkpoint', A, 'greenhouse-restored', { objective: 'reach-observatory' }),
  ],
  encounters: [
    // First use of Chain Spark: two packs of weak mosslings for the sparks to leap between.
    powerWave(
      'greenhouse-power',
      A,
      'mossling',
      [
        [
          { path: [G(-9, 0, -48), G(-6.5, 0, -44), G(-4.2, 0, -41.6)] },
          { path: [G(-3, 0, -50), G(-3.2, 0, -45), G(-2.8, 0, -42.2)] },
          { path: [G(-10, 0, -42), G(-7, 0, -42), G(-5, 0, -40.6)] },
        ],
        [
          { path: [G(-8, 0, -50), G(-5.5, 0, -45), G(-3.6, 0, -42)] },
          { path: [G(-1, 0, -49), G(-2, 0, -45), G(-2.2, 0, -42.4)] },
          { path: [G(-10, 0, -45), G(-7.5, 0, -43), G(-4.8, 0, -41.2)] },
        ],
      ],
      { labelHeight: 1.45, entrance: { kind: 'dust', scale: 0.7 } },
    ),
    vineWord('greenhouse-vine', 0, 'leaf'),
    vineWord('greenhouse-vine-2', 1, 'root'),
    { ...vineWord('greenhouse-vine-3', 2, 'bloom'), onComplete: { flags: ['vine-bridge-grown'] } },
    {
      id: 'greenhouse-h1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'pods',
          fx: [{ kind: 'shake', scale: 0.8 }],
          targets: [
            pod('pod-1', G(-5, 0, -38), { priority: true }),
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
          fx: [
            { kind: 'dust', at: 'GH_STAMPEDE', scale: 2.2 },
            { kind: 'shake', scale: 1 },
          ],
          targets: [
            mossling('moss-2', [G(-6, 0, -46), G(-3, 0, -38), G(-1, 0, -31.4)]),
            mossling('moss-3', [G(6, 0, -45), G(3, 0, -38), G(1.1, 0, -31.6)], { delaySec: 2 }),
            mossling('moss-4', [G(0, 0, -50), G(0, 0, -40), G(0, 0, -32)], { delaySec: 4, challengeOnly: true }),
            pollen('pollen-1', [G(-4, 3.4, -36), G(3, 3.0, -37)], 0.5),
            pollen('pollen-2', [G(4, 2.6, -40), G(-2, 3.6, -40)], 3),
          ],
        },
      ],
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
            marker(`gh-knot-${i + 1}`, G(-6, 0.9 + i * 0.5, -46), word, {
              labelHeight: 0.4,
              defeatFx: { kind: 'pillar', scale: 0.3, color: '#8ff0a8' },
            }),
          ),
        },
      ],
      barks: [
        { when: { on: 'complete' }, line: 'gh-anchor-done' },
      ],
      onComplete: { restoreAnchor: 'greenhouse', unlockSpell: 'chain-spark', flags: ['greenhouse-anchor-restored'] },
      completeFx: anchorBlast('GH_ANCHOR_GROUND', '#8ff0a8'),
    },
  ],
};
