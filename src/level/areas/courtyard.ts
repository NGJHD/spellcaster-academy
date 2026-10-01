/**
 * LD-9: Sunlit Courtyard. Courtyard spans x ∈ [-14, 14], z ∈ [-14, 20]; fountain at the origin.
 * Enemies always enter from the front arc of the combat camera (never from behind).
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fight, len, marker, reveal, talk, target, travel, type AreaScript } from './builders';

const A = 'sunlit-courtyard';

export const COURTYARD_ANCHOR_POSITION: Vec3 = [7, 0, -8];
export const COURTYARD_DUMMY_POSITIONS: readonly Vec3[] = [
  [-8, 0, -7],
  [-6, 0, -8.2],
  [-4, 0, -7],
];

const dummy = (id: string, position: Vec3): TargetSpawn =>
  target(id, 'dummy', position, [len(3, 4)], { labelHeight: 2.0 });

const sprite = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'sprite', path[0] ?? [0, 0, 0], [len(3, 5)], {
    movement: { kind: 'approach', path, speed: 1.1 },
    attack: ATTACKS.spritePounce,
    labelHeight: 0.95,
    weak: true,
    ...options,
  });

export const courtyard: AreaScript = {
  nodes: {
    COURTYARD_ENTRY_01: { position: [-1.5, 1.6, 10], lookAt: [-2, 1.5, 0] },
    COURTYARD_REVEAL_FOUNTAIN: { position: [-4.5, 1.6, 6], lookAt: [0, 1.4, 0] },
    COURTYARD_COMBAT_C1: { position: [-6, 1.6, 0], lookAt: [-6, 1.2, -7] },
    COURTYARD_MID_01: { position: [0, 1.6, -5], lookAt: [4, 1.5, -8] },
    COURTYARD_ANCHOR: { position: [4, 1.6, -3.5], lookAt: [7, 1.4, -8] },
    COURTYARD_EXIT_EAST_HALL: { position: [10, 1.6, -0.5], lookAt: [14, 2, 0] },
  },
  lookPoints: {
    COURTYARD_TRAINING_CIRCLE_WEST: [-6, 1.2, -7],
    COURTYARD_ANCHOR_POINT: [7, 1.6, -8],
    COURTYARD_FOUNTAIN_RIM: [2.4, 0.9, -1.2],
    COURTYARD_PLANTER_NW: [-12, 1.2, -12],
    COURTYARD_ROOF_WARDEN: [6, 17.5, -16],
  },
  beats: [
    travel('courtyard-entry', A, ['ARRIVAL_WARD_FRACTURE', 'COURTYARD_ENTRY_01', 'COURTYARD_REVEAL_FOUNTAIN'], 7),
    reveal(
      'courtyard-fountain-reveal',
      A,
      'COURTYARD_REVEAL_FOUNTAIN',
      ['COURTYARD_FOUNTAIN_RIM', 'COURTYARD_TRAINING_CIRCLE_WEST', 'COURTYARD_ANCHOR_POINT'],
      1.6,
      1.6,
      {
        barks: ['page-hint'],
        bonus: target('bonus-page-fountain', 'star-page', [2.4, 0.75, -1.2], ['glint'], {
          optional: true,
          labelHeight: 0.45,
          reward: { starPage: 'page-courtyard-fountain' },
        }),
      },
    ),
    travel('courtyard-to-c1', A, ['COURTYARD_REVEAL_FOUNTAIN', 'COURTYARD_COMBAT_C1'], 4, {
      easing: 'easeInOutCubic',
      reducedMotion: 'glide',
    }),
    talk('courtyard-c1-talk', A, ['court-1']),
    fight('courtyard-c1', A, { music: 'courtyard-action' }),
    reveal('courtyard-planter-reveal', A, 'COURTYARD_COMBAT_C1', ['COURTYARD_PLANTER_NW'], 1.2, 0.6),
    talk('courtyard-c2-talk', A, ['court-sprites']),
    fight('courtyard-c2', A),
    reveal('courtyard-warden-sighting', A, 'COURTYARD_COMBAT_C1', ['COURTYARD_ROOF_WARDEN'], 1.8, 3.2, {
      barks: ['court-warden'],
    }),
    travel('courtyard-to-anchor', A, ['COURTYARD_COMBAT_C1', 'COURTYARD_MID_01', 'COURTYARD_ANCHOR'], 6, {
      barks: ['court-anchor-intro'],
      music: 'arrival-wonder',
    }),
    fight('courtyard-anchor', A),
    checkpoint('courtyard-checkpoint', A, 'courtyard-restored', { objective: 'library-anchor' }),
    travel('courtyard-exit', A, ['COURTYARD_ANCHOR', 'COURTYARD_EXIT_EAST_HALL'], 4, { reducedMotion: 'glide' }),
  ],
  encounters: [
    {
      id: 'courtyard-c1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'dummies',
          sequential: true,
          targets: COURTYARD_DUMMY_POSITIONS.map((p, i) => dummy(`dummy-${i + 1}`, p)),
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
            target('sprite-teal', 'sprite', [-11, 0, -9], [len(3, 4)], {
              variant: 'teal',
              optional: true,
              leaveAfterSec: 11,
              delaySec: 0.8,
              labelHeight: 0.95,
              movement: { kind: 'patrol', path: [[-11, 0, -9], [-2, 0, -10]], speed: 1.4 },
              reward: { starPage: 'page-courtyard-sprite' },
            }),
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
            marker('court-rune-1', [7, 1.0, -8], 'light', { labelHeight: 0.4 }),
            marker('court-rune-2', [7, 1.5, -8], 'steady', { labelHeight: 0.4 }),
            marker('court-rune-3', [7, 2.0, -8], 'shine', { labelHeight: 0.4 }),
          ],
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'court-anchor-done' }],
      onComplete: { restoreAnchor: 'courtyard', unlockSpell: 'spark-bolt', flags: ['courtyard-anchor-restored'] },
    },
  ],
};
