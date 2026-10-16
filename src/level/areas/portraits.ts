/**
 * LEVEL1_DESIGN LD-0 Hall of Portraits (replaces LD-12): the Paint Ambush. Portraits come alive and
 * paint imps leap out of their frames throwing telegraphed splats; the portrait gags are shouted
 * mid-fight; the fountain is a short breather with healing-droplet gems; Mira calls through the
 * mirror; the constellations are a speed round for the greenhouse multiplier.
 * Local layout (origin PORTRAITS_ORIGIN): corridor along −Z from z = 2 to z = −40, x ∈ [−3, 3].
 */
import type { AttackSpec, TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, reveal, target, travel, type AreaScript } from './builders';

const A = 'hall-of-portraits';
export const PORTRAITS_ORIGIN: Vec3 = [320, 0, 0];
const P = origin(PORTRAITS_ORIGIN);

export const PLAQUE_POSITIONS: readonly Vec3[] = [P(2.9, 1.7, -27.5), P(2.9, 1.7, -30), P(2.9, 1.7, -32.5)];

/** A thrown paint splat: telegraphed, small, and it lands on the screen edge (never over a word). */
const PAINT_SPLAT: AttackSpec = { kind: 'ranged', windupSec: 1.3, recoverSec: 0.6, intervalSec: 5.5, damage: 5 };

/** Portrait frames the imps leap out of (left wall x = −2.95, right wall x = 2.95). */
const FRAME = {
  left8: P(-2.85, 2.5, -8.2),
  left13: P(-2.85, 2.5, -13.4),
  left18: P(-2.85, 2.5, -18.6),
  right5: P(2.85, 2.5, -5),
  right10: P(2.85, 2.5, -10.2),
  right20: P(2.85, 2.5, -20.6),
} as const;

const PAINT = { red: '#e8483c', blue: '#3f7fe8', yellow: '#f2c230', green: '#3fbf6a', purple: '#9b5de5' } as const;

/** A paint imp leaps out of a frame, lands, then bounds closer to throw splats. */
const imp = (id: string, frame: Vec3, landing: Vec3, colour: keyof typeof PAINT, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'imp', frame, [len(3, 4)], {
    variant: colour,
    movement: { kind: 'approach', path: [frame, landing, [landing[0] * 0.4 + PORTRAITS_ORIGIN[0] * 0.6, 0, landing[2] + 3.4]], speed: 1.8 },
    attack: PAINT_SPLAT,
    labelHeight: 1.25,
    weak: true,
    entrance: { kind: 'burst', scale: 0.9, color: PAINT[colour] },
    defeatFx: { kind: 'burst', scale: 0.8, color: PAINT[colour] },
    ...options,
  });

/** Healing droplets from the fountain: a calm breather that is still something to catch. */
const droplet = (id: string, word: string, side: number): TargetSpawn =>
  target(id, 'gem', [0, 0, 0], [word], {
    follow: { ahead: 3.8, side, up: 0.1 },
    optional: true,
    leaveAfterSec: 4,
    labelHeight: 0.28,
    variant: 'droplet',
    defeatFx: { kind: 'burst', scale: 0.5, color: '#bfe6ff' },
  });

export const portraits: AreaScript = {
  nodes: {
    POR_ENTRY: { position: P(0, 1.6, 1), lookAt: P(0, 1.9, -10) },
    POR_FOUNTAIN: { position: P(-0.6, 1.6, -9.5), lookAt: P(2.2, 1.0, -14) },
    POR_MIRROR: { position: P(0.6, 1.6, -18.5), lookAt: P(-2.9, 1.8, -22) },
    POR_PLAQUES: { position: P(-1.0, 1.6, -26), lookAt: P(2.9, 1.7, -30) },
    POR_END: { position: P(0, 1.6, -36), lookAt: P(0, 2.2, -41) },
  },
  lookPoints: {
    POR_PORTRAIT_LEFT: P(-2.9, 2.6, -5),
    POR_PORTRAIT_RIGHT: P(2.9, 2.6, -7),
    POR_FOUNTAIN_POINT: P(2.2, 1.4, -14),
  },
  beats: [
    fade('portraits-enter', A, 'POR_ENTRY', { music: 'portrait-rest' }),
    // The ambush: imps leap out of the paintings the moment the apprentice walks in.
    fight('portraits-ambush', A, { barks: ['por-ambush'], objective: 'portraits' }),
    travel('portraits-to-fountain', A, ['POR_ENTRY', 'POR_FOUNTAIN'], 4.5),
    // A short breather: the fountain heals, and healing droplets float up to catch.
    reveal('portraits-fountain', A, 'POR_FOUNTAIN', ['POR_FOUNTAIN_POINT'], 0.6, 5, {
      restoreFocus: true,
      barks: ['por-fountain'],
      fx: [{ kind: 'burst', at: 'POR_FOUNTAIN_POINT', scale: 1.2, color: '#bfe6ff' }],
      chase: [
        { at: 0.0, target: droplet('droplet-1', 'drip', -1.1) },
        { at: 0.35, target: droplet('droplet-2', 'heal', 1.1) },
      ],
    }),
    travel('portraits-to-mirror', A, ['POR_FOUNTAIN', 'POR_MIRROR'], 4.5),
    reveal('portraits-mirror', A, 'POR_MIRROR', [], 0, 3, {
      barks: ['por-4', 'por-5'],
      // Something to type while the clue is discussed (§1B: talk plays over typing).
      chase: [{ at: 0.8, target: target('mirror-gem', 'gem', P(0, 0, 0), [len(3, 3)], { follow: { ahead: 4.2, side: 1.3, up: 0.3 }, optional: true, labelHeight: 0.28 }) }],
    }),
    travel('portraits-to-plaques', A, ['POR_MIRROR', 'POR_PLAQUES'], 4),
    // Optional speed round for the greenhouse score multiplier; its instructions play over its words.
    fight('portraits-constellations', A, { barks: ['por-const'] }),
    checkpoint('portraits-checkpoint', A, 'portrait-hall-complete'),
    travel('portraits-to-end', A, ['POR_PLAQUES', 'POR_END'], 4.5, {
      barks: ['por-exit'],
      chase: [{ at: 0.2, target: target('portraits-exit-gem', 'gem', P(0, 0, 0), [len(3, 3)], { follow: { ahead: 4.4, side: -1.2, up: 0.3 }, optional: true, labelHeight: 0.28 }) }],
    }),
  ],
  encounters: [
    {
      id: 'portraits-ambush',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'imps-1',
          targets: [
            imp('imp-1', FRAME.left8, P(-1.4, 0, -6.5), 'red'),
            imp('imp-2', FRAME.right10, P(1.5, 0, -8), 'blue', { delaySec: 0.7 }),
          ],
        },
        {
          id: 'imps-2',
          targets: [
            imp('imp-3', FRAME.left13, P(-1.2, 0, -10.5), 'yellow'),
            imp('imp-4', FRAME.right5, P(1.6, 0, -4.2), 'green', { delaySec: 0.5, priority: true }),
            imp('imp-5', FRAME.left18, P(-0.8, 0, -14), 'purple', { delaySec: 1.2 }),
          ],
        },
        {
          id: 'imps-3',
          targets: [
            imp('imp-6', FRAME.right20, P(1.2, 0, -15), 'red'),
            imp('imp-7', FRAME.left8, P(-1.5, 0, -6.2), 'blue', { delaySec: 0.6 }),
            imp('imp-8', FRAME.right10, P(1.4, 0, -8.5), 'yellow', { delaySec: 1.2 }),
            imp('imp-9', FRAME.left13, P(-1, 0, -11), 'green', { delaySec: 2.4, challengeOnly: true }),
          ],
        },
      ],
      barks: [
        // The portraits speak as soon as the imps attack: the fight is trimmed to one wave for young
        // typists, so lines on later waves were never heard.
        { when: { on: 'wave-start', wave: 0 }, line: 'por-1' },
        { when: { on: 'wave-start', wave: 0 }, line: 'por-2' },
        { when: { on: 'complete' }, line: 'por-3' },
      ],
    },
    {
      id: 'portraits-constellations',
      areaId: A,
      kind: 'interaction',
      optionalPrompt: 'constellations',
      speedRound: { sec: 7 },
      waves: [
        {
          id: 'plaques',
          sequential: true,
          targets: ['lark', 'crown', 'river'].map((word, i) =>
            marker(`plaque-${i + 1}`, PLAQUE_POSITIONS[i] ?? P(2.9, 1.7, -30), word, {
              labelHeight: 0.45,
              defeatFx: { kind: 'sparks', scale: 0.6, color: '#9fc8ff' },
            }),
          ),
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'por-const-done' }],
      onComplete: { nextScoreMultiplier: 1.5, flags: ['constellations-named'] },
    },
  ],
};
