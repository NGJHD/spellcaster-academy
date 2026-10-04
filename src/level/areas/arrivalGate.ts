/**
 * LEVEL1_DESIGN LD-0 Opening and Arrival Gate (replaces LD-7 / LD-8): a fast swoop with spark gems
 * from the first second, a sprite snatching Pip in mid-air, crystal words that blast the gate open,
 * then the ward fracture at full drama.
 * World layout: the arrival path runs along +Z to the gate wall at z = 20.
 */
import type { TargetSpawn } from '../levelTypes';
import { checkpoint, fade, fight, marker, reveal, target, travel, type AreaScript } from './builders';

const A = 'arrival-gate';

export const CRYSTAL_POSITIONS = {
  left: [-3.6, 2.2, 21.3],
  centre: [0, 5.6, 21.3],
  right: [3.6, 2.2, 21.3],
} as const;

/** A sky gem in the opening swoop: a fixed word, flying beside the camera. */
const skyGem = (id: string, word: string, side: number): TargetSpawn =>
  target(id, 'gem', [0, 0, 0], [word], {
    follow: { ahead: 4.6, side, up: 0.2 },
    optional: true,
    leaveAfterSec: 3.6,
    labelHeight: 0.28,
    defeatFx: { kind: 'burst', scale: 0.6, color: '#ffe08a' },
  });

const crystalBurst = { kind: 'burst', scale: 0.9, color: '#a8dcff' } as const;

export const arrivalGate: AreaScript = {
  nodes: {
    ARRIVAL_SKY_01: { position: [0, 24, 95], lookAt: [0, 14, -30] },
    ARRIVAL_SKY_02: { position: [2, 12, 62], lookAt: [0, 6, -20] },
    ARRIVAL_SNATCH_DIVE: { position: [-1.5, 6.5, 47], lookAt: [0, 3, 20] },
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
    ARRIVAL_GATE_CENTRE: [0, 3.2, 20.4],
    ARRIVAL_GATE_GROUND: [0, 0.1, 20.4],
    ARRIVAL_HILLS_EAST: [70, 4, -40],
    ARRIVAL_HILLS_WEST: [-80, 4, -20],
  },
  beats: [
    fade('arrival-opening-fade', A, 'ARRIVAL_SKY_01', { fadeOutSec: 0, holdSec: 0.2, fadeInSec: 0.8, music: 'arrival-wonder' }),
    // 1. The swoop: spark gems from the first second (`go`, `fly`, `sky`).
    travel('arrival-flyover', A, ['ARRIVAL_SKY_01', 'ARRIVAL_SKY_02'], 7, {
      barks: ['open-1'],
      easing: 'easeInOutSine',
      chase: [
        { at: 0.0, target: skyGem('sky-gem-go', 'go', -1.3) },
        { at: 0.3, target: skyGem('sky-gem-fly', 'fly', 1.3) },
        { at: 0.62, target: skyGem('sky-gem-sky', 'sky', -1.3) },
      ],
    }),
    // 2. Cold open: a sprite snatches Pip; its word makes it let go. The camera dives after them.
    travel('arrival-snatch', A, ['ARRIVAL_SKY_02', 'ARRIVAL_SNATCH_DIVE', 'ARRIVAL_GATE_APPROACH'], 8, {
      barks: ['open-snatch'],
      easing: 'easeInOutCubic',
      chase: [
        {
          at: 0.0,
          target: target('pip-thief', 'sprite', [0, 0, 0], ['drop'], {
            follow: { ahead: 5.2, side: 0.7, up: 0.45 },
            carriesPip: true,
            leaveAfterSec: 9,
            labelHeight: 0.95,
            variant: 'grey',
            defeatFx: { kind: 'leaves', scale: 1.1 },
            defeatBark: 'open-rescued',
          }),
        },
        { at: 0.55, target: skyGem('sky-gem-zap', 'zap', -1.4) },
      ],
    }),
    travel('arrival-gate-approach', A, ['ARRIVAL_GATE_APPROACH', 'ARRIVAL_GATE_PIP'], 3.5, {
      barks: ['open-2'],
      easing: 'easeOutCubic',
      reducedMotion: 'glide',
    }),
    reveal('arrival-crystals-reveal', A, 'ARRIVAL_GATE_PIP', ['ARRIVAL_CRYSTAL_LEFT', 'ARRIVAL_CRYSTAL_CENTRE', 'ARRIVAL_CRYSTAL_RIGHT'], 1.0, 0.3),
    // 3. The crystal words blast the gate open.
    fight('arrival-crystals', A, { barks: ['open-3'], objective: 'wake-crystals' }),
    travel('arrival-gate-passage', A, ['ARRIVAL_GATE_PIP', 'ARRIVAL_GATE_THRESHOLD', 'ARRIVAL_WARD_FRACTURE'], 5, {
      reducedMotion: 'glide',
    }),
    // The ward fractures: thunder, falling dome pieces, the Warden silhouetted on the tower.
    reveal('arrival-ward-fracture', A, 'ARRIVAL_WARD_FRACTURE', ['ACADEMY_TOWER_TOP'], 1.6, 6, {
      music: 'ward-fracture',
      barks: ['fracture-2', 'fracture-3'],
      objective: 'courtyard-anchor',
      attention: 'spectacle',
      fx: [
        { kind: 'lightning', at: 'ACADEMY_TOWER_TOP', atBeat: 0.12 },
        { kind: 'flash', atBeat: 0.12 },
        { kind: 'meteors', at: 'ACADEMY_TOWER_TOP', atBeat: 0.2, scale: 1.2 },
        { kind: 'shockwave', at: 'ARRIVAL_HILLS_EAST', atBeat: 0.5, scale: 2.5 },
        { kind: 'lightning', at: 'ACADEMY_TOWER_TOP', atBeat: 0.6 },
        { kind: 'shockwave', at: 'ARRIVAL_HILLS_WEST', atBeat: 0.75, scale: 2.5 },
      ],
    }),
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
            marker('crystal-left', CRYSTAL_POSITIONS.left, 'star', { labelHeight: 0.55, defeatFx: crystalBurst }),
            marker('crystal-centre', CRYSTAL_POSITIONS.centre, 'moon', { labelHeight: 0.55, defeatFx: crystalBurst }),
            marker('crystal-right', CRYSTAL_POSITIONS.right, 'open', { labelHeight: 0.55, defeatFx: crystalBurst }),
          ],
        },
      ],
      barks: [
        { when: { on: 'first-correct' }, line: 'gate-first-correct' },
        { when: { on: 'first-mistake' }, line: 'gate-first-mistake' },
        { when: { on: 'complete' }, line: 'gate-done' },
      ],
      onComplete: { flags: ['gate-open'] },
      // The doors blow open in an explosion of light and leaves.
      completeFx: [
        { kind: 'flash' },
        { kind: 'burst', at: 'ARRIVAL_GATE_CENTRE', scale: 2.6, color: '#ffe6a0' },
        { kind: 'leaves', at: 'ARRIVAL_GATE_CENTRE', scale: 1.8 },
        { kind: 'shockwave', at: 'ARRIVAL_GATE_GROUND', scale: 1.1 },
        { kind: 'shake', scale: 1.4 },
      ],
    },
  ],
};
