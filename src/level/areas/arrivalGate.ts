/**
 * LD-7 / LD-8: opening cinematic, gate crystal tutorial and ward fracture.
 * World layout: the arrival path runs along +Z to the gate wall at z = 20.
 */
import { checkpoint, fade, fight, marker, reveal, talk, travel, type AreaScript } from './builders';

const A = 'arrival-gate';

export const CRYSTAL_POSITIONS = {
  left: [-3.6, 2.2, 21.3],
  centre: [0, 5.6, 21.3],
  right: [3.6, 2.2, 21.3],
} as const;

export const arrivalGate: AreaScript = {
  nodes: {
    ARRIVAL_SKY_01: { position: [0, 24, 95], lookAt: [0, 14, -30] },
    ARRIVAL_SKY_02: { position: [2, 12, 62], lookAt: [0, 6, -20] },
    ARRIVAL_GATE_APPROACH: { position: [0, 2.2, 36], lookAt: [0, 3, 20] },
    ARRIVAL_GATE_PIP: { position: [0, 1.6, 27], lookAt: [0, 2.6, 20] },
    ARRIVAL_GATE_THRESHOLD: { position: [0, 1.6, 20], lookAt: [0, 2.5, 5] },
    ARRIVAL_WARD_FRACTURE: { position: [0, 1.6, 15], lookAt: [0, 2, 0] },
  },
  lookPoints: {
    ARRIVAL_CRYSTAL_LEFT: CRYSTAL_POSITIONS.left,
    ARRIVAL_CRYSTAL_CENTRE: CRYSTAL_POSITIONS.centre,
    ARRIVAL_CRYSTAL_RIGHT: CRYSTAL_POSITIONS.right,
    ACADEMY_TOWER_TOP: [0, 42, -60],
  },
  beats: [
    fade('arrival-opening-fade', A, 'ARRIVAL_SKY_01', { fadeOutSec: 0, holdSec: 0.3, fadeInSec: 1.5, music: 'arrival-wonder' }),
    travel('arrival-flyover', A, ['ARRIVAL_SKY_01', 'ARRIVAL_SKY_02', 'ARRIVAL_GATE_APPROACH'], 11, {
      barks: ['open-1'],
      easing: 'easeInOutSine',
    }),
    travel('arrival-gate-approach', A, ['ARRIVAL_GATE_APPROACH', 'ARRIVAL_GATE_PIP'], 4.5, {
      barks: ['open-2'],
      easing: 'easeOutCubic',
      reducedMotion: 'glide',
    }),
    reveal('arrival-crystals-reveal', A, 'ARRIVAL_GATE_PIP', ['ARRIVAL_CRYSTAL_LEFT', 'ARRIVAL_CRYSTAL_CENTRE', 'ARRIVAL_CRYSTAL_RIGHT'], 1.4, 0.8),
    talk('arrival-gate-intro', A, ['open-3'], { objective: 'wake-crystals' }),
    fight('arrival-crystals', A),
    travel('arrival-gate-passage', A, ['ARRIVAL_GATE_PIP', 'ARRIVAL_GATE_THRESHOLD', 'ARRIVAL_WARD_FRACTURE'], 6, {
      reducedMotion: 'glide',
    }),
    reveal('arrival-ward-fracture', A, 'ARRIVAL_WARD_FRACTURE', ['ACADEMY_TOWER_TOP'], 2.2, 2.2, {
      music: 'ward-fracture',
      barks: ['fracture-1'],
    }),
    talk('arrival-fracture-talk', A, ['fracture-2', 'fracture-3'], { objective: 'courtyard-anchor' }),
    checkpoint('arrival-checkpoint', A, 'arrival-gate-complete'),
  ],
  encounters: [
    {
      id: 'arrival-crystals',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'crystals',
          sequential: true,
          targets: [
            marker('crystal-left', CRYSTAL_POSITIONS.left, 'star', { labelHeight: 0.55 }),
            marker('crystal-centre', CRYSTAL_POSITIONS.centre, 'moon', { labelHeight: 0.55 }),
            marker('crystal-right', CRYSTAL_POSITIONS.right, 'open', { labelHeight: 0.55 }),
          ],
        },
      ],
      barks: [
        { when: { on: 'first-correct' }, line: 'gate-first-correct' },
        { when: { on: 'first-mistake' }, line: 'gate-first-mistake' },
        { when: { on: 'defeats', count: 1 }, line: 'gate-first-word' },
        { when: { on: 'defeats', count: 2 }, line: 'gate-pause-tip' },
        { when: { on: 'complete' }, line: 'gate-done' },
      ],
      onComplete: { flags: ['gate-open'] },
    },
  ],
};
