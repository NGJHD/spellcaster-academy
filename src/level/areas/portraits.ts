/**
 * LD-12: Hall of Portraits — rest, story and the optional constellation challenge.
 * Local layout (origin PORTRAITS_ORIGIN): corridor along −Z from z = 2 to z = −40, x ∈ [−3, 3].
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, marker, origin, reveal, talk, travel, type AreaScript } from './builders';

const A = 'hall-of-portraits';
export const PORTRAITS_ORIGIN: Vec3 = [320, 0, 0];
const P = origin(PORTRAITS_ORIGIN);

export const PLAQUE_POSITIONS: readonly Vec3[] = [P(2.9, 1.7, -27.5), P(2.9, 1.7, -30), P(2.9, 1.7, -32.5)];

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
  },
  beats: [
    fade('portraits-enter', A, 'POR_ENTRY', { music: 'portrait-rest' }),
    reveal('portraits-whispers', A, 'POR_ENTRY', ['POR_PORTRAIT_LEFT', 'POR_PORTRAIT_RIGHT'], 1.4, 2.0, {
      barks: ['por-1', 'por-2', 'por-3'],
    }),
    travel('portraits-to-fountain', A, ['POR_ENTRY', 'POR_FOUNTAIN'], 5),
    talk('portraits-fountain', A, ['por-fountain'], { restoreFocus: true }),
    travel('portraits-to-mirror', A, ['POR_FOUNTAIN', 'POR_MIRROR'], 5),
    talk('portraits-mirror', A, ['por-4', 'por-5']),
    travel('portraits-to-plaques', A, ['POR_MIRROR', 'POR_PLAQUES'], 4, { barks: ['por-const'] }),
    fight('portraits-constellations', A),
    checkpoint('portraits-checkpoint', A, 'portrait-hall-complete'),
    travel('portraits-to-end', A, ['POR_PLAQUES', 'POR_END'], 5),
  ],
  encounters: [
    {
      id: 'portraits-constellations',
      areaId: A,
      kind: 'interaction',
      optionalPrompt: 'constellations',
      waves: [
        {
          id: 'plaques',
          targets: ['lark', 'crown', 'river'].map((word, i) =>
            marker(`plaque-${i + 1}`, PLAQUE_POSITIONS[i] ?? P(2.9, 1.7, -30), word, { labelHeight: 0.45 }),
          ),
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'por-const-done' }],
      onComplete: { nextScoreMultiplier: 1.5, flags: ['constellations-named'] },
    },
  ],
};
