/**
 * LD-15 as revised by LEVEL1_DESIGN LD-0: the Practice Gallery is a target-range arcade. Targets pop
 * up spinning, Pip commentates like a sports announcer, every zone ends with a medal fanfare, and an
 * optional bonus speed round keeps a local best score to beat on replay.
 * Practice Gallery. Local layout (origin GALLERY_ORIGIN): long hall along −Z,
 * x ∈ [−6, 6], z ∈ [−62, 2]; encounter zones at z = −14, −32, −50.
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, origin, target, travel, type AreaScript } from './builders';

const A = 'practice-gallery';
export const GALLERY_ORIGIN: Vec3 = [680, 0, 0];
const P = origin(GALLERY_ORIGIN);

export const GALLERY_ZONES = [-14, -32, -50] as const;
export const MIRA_GALLERY_POSITION = P(-4.2, 0, -6.5);

/** Arcade targets pop up spinning in a burst of sparks. */
const POP = { kind: 'sparks', scale: 0.9, color: '#ffd27a' } as const;

const practiceDummy = (id: string, x: number, z: number, words = [len(4, 6)]): TargetSpawn =>
  target(id, 'dummy', P(x, 0, z), words, { labelHeight: 2.0, variant: 'practice', entrance: POP, defeatFx: { kind: 'burst', scale: 0.7 } });

export const gallery: AreaScript = {
  nodes: {
    GAL_ENTRY: { position: P(0, 1.6, 1), lookAt: P(0, 2, -10) },
    GAL_MIRA: { position: P(-0.5, 1.6, -3), lookAt: P(-4.2, 1.45, -6.5) },
    GAL_ZONE1: { position: P(0, 1.6, -5), lookAt: P(0, 1.5, -14) },
    GAL_ZONE2: { position: P(0, 1.6, -23), lookAt: P(0, 1.5, -32) },
    GAL_ZONE3: { position: P(0, 1.6, -41), lookAt: P(0, 1.5, -50) },
    GAL_EXIT: { position: P(0, 1.6, -56), lookAt: P(0, 2.6, -63) },
  },
  lookPoints: {},
  beats: [
    fade('gallery-enter', A, 'GAL_ENTRY', { music: 'courtyard-action', objective: 'practice' }),
    travel('gallery-to-mira', A, ['GAL_ENTRY', 'GAL_MIRA'], 4, { barks: ['gal-1', 'gal-2'] }),
    travel('gallery-to-zone1', A, ['GAL_MIRA', 'GAL_ZONE1'], 3, { reducedMotion: 'glide' }),
    fight('gallery-p1', A, { barks: ['gal-p1'] }),
    travel('gallery-to-zone2', A, ['GAL_ZONE1', 'GAL_ZONE2'], 6),
    fight('gallery-p2', A, { barks: ['gal-p2'] }),
    travel('gallery-to-zone3', A, ['GAL_ZONE2', 'GAL_ZONE3'], 6),
    fight('gallery-p3', A, { barks: ['gal-p3'] }),
    // Optional bonus round: six pop-up targets against the clock, with a best score to beat.
    fight('gallery-bonus', A, { barks: ['gal-bonus'] }),
    checkpoint('gallery-checkpoint', A, 'practice-gallery-complete', { objective: 'reach-observatory', restoreFocus: true }),
    travel('gallery-to-tower-doors', A, ['GAL_ZONE3', 'GAL_EXIT'], 5, { barks: ['gal-5', 'gal-6', 'gal-7'] }),
  ],
  encounters: [
    {
      id: 'gallery-p1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'accuracy',
          sequential: true,
          rule: { kind: 'qualify', needed: 4, minAccuracy: 0.9, extra: practiceDummy('p1-extra', 0, -14.5) },
          targets: [-4, -2, 0, 2, 4].map((x, i) => practiceDummy(`p1-dummy-${i + 1}`, x, i % 2 === 0 ? -14 : -15)),
        },
      ],
    },
    {
      id: 'gallery-p2',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'priority',
          targets: [
            target('p2-armour', 'guardian', P(0, 0, -38), [len(5, 7), len(5, 7), len(5, 7)], {
              movement: { kind: 'approach', path: [P(0, 0, -38), P(0, 0, -26.8)], speed: 0.45 },
              attack: ATTACKS.guardianSweep,
              labelHeight: 2.35,
            }),
            target('p2-dummy-left', 'dummy', P(-5, 0, -36), [len(3, 5)], {
              movement: { kind: 'approach', path: [P(-5, 0, -36), P(-3, 0, -30), P(-1.4, 0, -25.6)], speed: 1.25 },
              attack: ATTACKS.dummyArm,
              labelHeight: 2.0,
              weak: true,
              priority: true,
              variant: 'practice',
            }),
            target('p2-dummy-right', 'dummy', P(5, 0, -36), [len(3, 5)], {
              movement: { kind: 'approach', path: [P(5, 0, -36), P(3, 0, -30), P(1.5, 0, -25.8)], speed: 1.15 },
              attack: ATTACKS.dummyArm,
              labelHeight: 2.0,
              weak: true,
              delaySec: 0.8,
              variant: 'practice',
            }),
          ],
        },
      ],
    },
    {
      id: 'gallery-bonus',
      areaId: A,
      kind: 'interaction',
      optionalPrompt: 'gallery-bonus',
      speedRound: { sec: 12 },
      waves: [
        {
          id: 'bonus-1',
          targets: [
            { ...practiceDummy('bonus-target-1', -4, -49, [len(3, 5)]) },
            { ...practiceDummy('bonus-target-2', 3.5, -51, [len(3, 5)]), delaySec: 0.3 },
            { ...practiceDummy('bonus-target-3', -1.5, -52, [len(3, 5)]), delaySec: 0.9 },
          ],
        },
        {
          id: 'bonus-2',
          targets: [
            { ...practiceDummy('bonus-target-4', 1.5, -48.5, [len(3, 5)]) },
            { ...practiceDummy('bonus-target-5', -3, -51.5, [len(3, 5)]), delaySec: 0.3 },
            { ...practiceDummy('bonus-target-6', 4, -50, [len(3, 5)]), delaySec: 0.9 },
          ],
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'gal-bonus-done' }],
    },
    {
      id: 'gallery-p3',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'streak',
          sequential: true,
          rule: { kind: 'streak', needed: 5, assistAfterBreaks: 3, extra: practiceDummy('p3-extra', 0, -50.5) },
          targets: [-3, -1.5, 0, 1.5, 3].map((x, i) => practiceDummy(`p3-dummy-${i + 1}`, x, -50 - (i % 2))),
        },
      ],
    },
  ],
};
