/**
 * LD-9 as revised by LEVEL1_DESIGN LD-0: Sunlit Courtyard. Charging dummies, sprites bursting out of
 * the planters, a rooftop chase for the star page, the Warden crash-landing, and an anchor that
 * blasts a pillar of light into the sky. Courtyard spans x ∈ [-14, 14], z ∈ [-14, 20]; fountain at the origin.
 * Enemies always enter from the front arc of the combat camera (never from behind).
 */
import type { FxCue, TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fight, len, marker, reveal, target, travel, type AreaScript } from './builders';

const A = 'sunlit-courtyard';

export const COURTYARD_ANCHOR_POSITION: Vec3 = [7, 0, -8];
export const COURTYARD_DUMMY_POSITIONS: readonly Vec3[] = [
  [-8, 0, -7],
  [-6, 0, -8.2],
  [-4, 0, -7],
];

/** LD-0: dummies leap off their stands and hop at the player (still harmless). */
const dummy = (id: string, position: Vec3, delaySec: number): TargetSpawn =>
  target(id, 'dummy', position, [len(3, 4)], {
    labelHeight: 2.0,
    delaySec,
    movement: { kind: 'approach', path: [position, [position[0] * 0.55 - 2.7, 0, -3.4], [position[0] * 0.35 - 3.9, 0, -2.6]], speed: 1.1 },
    entrance: { kind: 'dust', scale: 0.8 },
    defeatFx: { kind: 'sparks', scale: 0.8 },
  });

const sprite = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'sprite', path[0] ?? [0, 0, 0], [len(3, 5)], {
    movement: { kind: 'approach', path, speed: 1.1 },
    attack: ATTACKS.spritePounce,
    labelHeight: 0.95,
    weak: true,
    entrance: { kind: 'leaves', scale: 0.6 },
    ...options,
  });

/** Each anchor word fires a beam of light. */
const runeBeam = { kind: 'pillar', scale: 0.3, color: '#ffcf6a' } as const;

/** A restored anchor blasts a pillar of light into the sky (shared by all three anchors). */
export function anchorBlast(ground: string, color: string): FxCue[] {
  return [
    { kind: 'flash' },
    { kind: 'pillar', at: ground, scale: 1.8, color },
    { kind: 'shockwave', at: ground, scale: 1.2, color },
    { kind: 'burst', at: ground, scale: 2, color },
    { kind: 'shake', scale: 1.2 },
  ];
}

export const courtyard: AreaScript = {
  nodes: {
    COURTYARD_ENTRY_01: { position: [-1.5, 1.6, 10], lookAt: [-2, 1.5, 0] },
    COURTYARD_REVEAL_FOUNTAIN: { position: [-4.5, 1.6, 6], lookAt: [0, 1.4, 0] },
    COURTYARD_COMBAT_C1: { position: [-6, 1.6, 0], lookAt: [-6, 1.2, -7] },
    // Rooftop chase along the arcade roof (roof top at y = 4.8).
    COURTYARD_ROOF_LEAP: { position: [-11, 5.2, 10], lookAt: [-4, 6, 17.4] },
    COURTYARD_ROOF_RUN_A: { position: [-8.5, 6.4, 17.4], lookAt: [6, 6.2, 17.4] },
    COURTYARD_ROOF_RUN_B: { position: [8, 6.4, 17.4], lookAt: [16, 6.2, 16] },
    COURTYARD_ROOF_END: { position: [11, 6.4, 13.5], lookAt: [3, 1.6, -10] },
    COURTYARD_MID_01: { position: [0, 1.6, -5], lookAt: [4, 1.5, -8] },
    COURTYARD_ANCHOR: { position: [4, 1.6, -3.5], lookAt: [7, 1.4, -8] },
    COURTYARD_EXIT_EAST_HALL: { position: [10, 1.6, -0.5], lookAt: [14, 2, 0] },
  },
  lookPoints: {
    COURTYARD_TRAINING_CIRCLE_WEST: [-6, 1.2, -7],
    COURTYARD_ANCHOR_POINT: [7, 1.6, -8],
    COURTYARD_ANCHOR_GROUND: [7, 0.1, -8],
    COURTYARD_ANCHOR_SKY: [7, 26, -8],
    COURTYARD_FOUNTAIN_RIM: [2.4, 0.9, -1.2],
    COURTYARD_PLANTER_NW: [-12, 1.2, -12],
    COURTYARD_ROOF_WARDEN: [6, 17.5, -16],
    COURTYARD_WARDEN_LAND: [3, 1.6, -10],
    COURTYARD_WARDEN_GROUND: [3, 0.1, -10],
  },
  beats: [
    travel('courtyard-entry', A, ['ARRIVAL_WARD_FRACTURE', 'COURTYARD_ENTRY_01', 'COURTYARD_REVEAL_FOUNTAIN'], 6),
    reveal(
      'courtyard-fountain-reveal',
      A,
      'COURTYARD_REVEAL_FOUNTAIN',
      ['COURTYARD_FOUNTAIN_RIM', 'COURTYARD_TRAINING_CIRCLE_WEST'],
      1.2,
      1.4,
      {
        barks: ['page-hint'],
        bonus: target('bonus-page-fountain', 'star-page', [2.4, 0.75, -1.2], ['glint'], {
          optional: true,
          labelHeight: 0.45,
          reward: { starPage: 'page-courtyard-fountain' },
        }),
      },
    ),
    travel('courtyard-to-c1', A, ['COURTYARD_REVEAL_FOUNTAIN', 'COURTYARD_COMBAT_C1'], 3, {
      easing: 'easeInOutCubic',
      reducedMotion: 'glide',
    }),
    fight('courtyard-c1', A, { music: 'courtyard-action', barks: ['court-1'] }),
    reveal('courtyard-planter-reveal', A, 'COURTYARD_COMBAT_C1', ['COURTYARD_PLANTER_NW'], 0.9, 0.4, {
      fx: [{ kind: 'leaves', at: 'COURTYARD_PLANTER_NW', scale: 1.2, atBeat: 0.5 }],
    }),
    fight('courtyard-c2', A, { barks: ['court-sprites'] }),
    // Fast-rail set piece: chase the star-page thief along the arcade roof.
    travel(
      'courtyard-rooftop-chase',
      A,
      ['COURTYARD_COMBAT_C1', 'COURTYARD_ROOF_LEAP', 'COURTYARD_ROOF_RUN_A', 'COURTYARD_ROOF_RUN_B', 'COURTYARD_ROOF_END'],
      11,
      {
        barks: ['court-chase'],
        easing: 'easeInOutSine',
        chase: [
          {
            at: 0.12,
            target: target('roof-thief', 'sprite', [0, 0, 0], [len(3, 4), len(3, 4)], {
              variant: 'teal',
              optional: true,
              follow: { ahead: 5.5, side: 0.3, up: -1.5 },
              leaveAfterSec: 9,
              labelHeight: 0.95,
              reward: { starPage: 'page-courtyard-sprite' },
              defeatFx: { kind: 'leaves', scale: 0.9 },
              defeatBark: 'court-chase-caught',
            }),
          },
        ],
      },
    ),
    // The Warden crash-lands in the courtyard, raises an arm at the anchor, and leaps away.
    reveal('courtyard-warden-sighting', A, 'COURTYARD_ROOF_END', ['COURTYARD_WARDEN_LAND'], 0.6, 8, {
      barks: ['court-warden'],
      returnToNode: false,
      attention: 'spectacle',
      fx: [
        { kind: 'shockwave', at: 'COURTYARD_WARDEN_GROUND', atBeat: 0.22, scale: 1.4 },
        { kind: 'dust', at: 'COURTYARD_WARDEN_GROUND', atBeat: 0.22, scale: 2.2 },
        { kind: 'debris', at: 'COURTYARD_WARDEN_GROUND', atBeat: 0.22, scale: 1.2, color: '#b9a58a' },
        { kind: 'shake', atBeat: 0.22, scale: 1.6 },
        { kind: 'dust', at: 'COURTYARD_WARDEN_GROUND', atBeat: 0.8, scale: 1.4 },
      ],
    }),
    travel('courtyard-to-anchor', A, ['COURTYARD_ROOF_END', 'COURTYARD_MID_01', 'COURTYARD_ANCHOR'], 6, {
      barks: ['court-anchor-intro'],
      music: 'arrival-wonder',
    }),
    fight('courtyard-anchor', A),
    // The anchor blasts a pillar of light into the sky; the camera looks up.
    reveal('courtyard-anchor-pillar', A, 'COURTYARD_ANCHOR', ['COURTYARD_ANCHOR_SKY'], 0.8, 0.7, { attention: 'spectacle' }),
    checkpoint('courtyard-checkpoint', A, 'courtyard-restored', { objective: 'library-anchor' }),
    travel('courtyard-exit', A, ['COURTYARD_ANCHOR', 'COURTYARD_EXIT_EAST_HALL'], 3.5, { reducedMotion: 'glide' }),
  ],
  encounters: [
    {
      id: 'courtyard-c1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'dummies',
          targets: COURTYARD_DUMMY_POSITIONS.map((p, i) => dummy(`dummy-${i + 1}`, p, i * 1.3)),
        },
      ],
      barks: [{ when: { on: 'defeats', count: 1 }, line: 'court-first' }],
    },
    {
      id: 'courtyard-c2',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'sprites-1',
          fx: [{ kind: 'leaves', at: 'COURTYARD_PLANTER_NW', scale: 1 }],
          targets: [sprite('sprite-1', [[-12, 0, -11], [-9, 0, -6], [-6, 0, -2.4]], { words: [len(4, 4)] })],
        },
        {
          id: 'sprites-2',
          targets: [
            sprite('sprite-2', [[-12.5, 0, -4], [-9, 0, -3], [-7.2, 0, -2.2]]),
            sprite('sprite-3', [[-0.5, 0, -12], [-3, 0, -6], [-4.8, 0, -2.4]], { delaySec: 0.6 }),
          ],
        },
        {
          id: 'sprites-3',
          targets: [
            sprite('sprite-4', [[-12, 0, -11], [-9, 0, -5], [-7, 0, -2.3]]),
            sprite('sprite-5', [[-1, 0, -12], [-4, 0, -6], [-5, 0, -2.6]], {
              priority: true,
              variant: 'grey',
              movement: { kind: 'approach', path: [[-1, 0, -12], [-4, 0, -6], [-5, 0, -2.6]], speed: 1.6 },
            }),
            sprite('sprite-6', [[-12.5, 0, 2], [-10, 0, -1], [-7.8, 0, -2.6]], { delaySec: 1.2 }),
            sprite('sprite-7', [[-10, 0, -12], [-7, 0, -9]], { challengeOnly: true, delaySec: 2.5 }),
          ],
        },
      ],
      barks: [
        { when: { on: 'wave-start', wave: 1 }, line: 'court-tab-tip' },
        { when: { on: 'focus-below', value: 50 }, line: 'court-breathe' },
      ],
    },
    {
      id: 'courtyard-anchor',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'runes',
          sequential: true,
          targets: [
            marker('court-rune-1', [7, 1.0, -8], 'light', { labelHeight: 0.4, defeatFx: runeBeam }),
            marker('court-rune-2', [7, 1.5, -8], 'steady', { labelHeight: 0.4, defeatFx: runeBeam }),
            marker('court-rune-3', [7, 2.0, -8], 'shine', { labelHeight: 0.4, defeatFx: runeBeam }),
          ],
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'court-anchor-done' }],
      onComplete: { restoreAnchor: 'courtyard', unlockSpell: 'spark-bolt', flags: ['courtyard-anchor-restored'] },
      completeFx: anchorBlast('COURTYARD_ANCHOR_GROUND', '#ffcf6a'),
    },
  ],
};
