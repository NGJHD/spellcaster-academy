/**
 * Opening and Arrival Gate: a fast swoop over the trees, a sprite snatching Pip in mid-air, crystal
 * words that blast the gate open, the Warden's greeting, then the ward fracture at full drama.
 * World layout: the arrival path runs along +Z to the gate wall at z = 20.
 */
import { checkpoint, fade, fight, hold, marker, reveal, target, travel, type AreaScript } from './builders';

const A = 'arrival-gate';

/** Where the Warden hovers to greet the apprentice just inside the gate (in view of ARRIVAL_WARD_FRACTURE). */
export const WARDEN_HELLO_POSITION = [0, 2.4, 6] as const;

/** One crystal either side of the gate (owner: the young-typist trim left the centre one without a word). */
export const CRYSTAL_POSITIONS = {
  left: [-3.6, 2.2, 21.3],
  right: [3.6, 2.2, 21.3],
} as const;

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
    ARRIVAL_CRYSTAL_RIGHT: CRYSTAL_POSITIONS.right,
    ACADEMY_TOWER_TOP: [0, 42, -60],
    ARRIVAL_GATE_CENTRE: [0, 3.2, 20.4],
    ARRIVAL_GATE_GROUND: [0, 0.1, 20.4],
    ARRIVAL_HILLS_EAST: [70, 4, -40],
    ARRIVAL_HILLS_WEST: [-80, 4, -20],
  },
  beats: [
    fade('arrival-opening-fade', A, 'ARRIVAL_SKY_01', { fadeOutSec: 0, holdSec: 0.2, fadeInSec: 0.8, music: 'arrival-wonder' }),
    // 1. The swoop over the trees to the academy.
    travel('arrival-flyover', A, ['ARRIVAL_SKY_01', 'ARRIVAL_SKY_02'], 7, {
      barks: ['open-1'],
      easing: 'easeInOutSine',
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
      ],
    }),
    travel('arrival-gate-approach', A, ['ARRIVAL_GATE_APPROACH', 'ARRIVAL_GATE_PIP'], 2.5, {
      easing: 'easeOutCubic',
      reducedMotion: 'glide',
    }),
    reveal('arrival-crystals-reveal', A, 'ARRIVAL_GATE_PIP', ['ARRIVAL_CRYSTAL_LEFT', 'ARRIVAL_CRYSTAL_RIGHT'], 1.0, 0.3),
    // 3. The crystal words blast the gate open.
    // Pip wonders why they are dark over the crystal words (§1B: dialogue plays over typing).
    fight('arrival-crystals', A, { barks: ['open-2'], objective: 'wake-crystals' }),
    travel('arrival-gate-passage', A, ['ARRIVAL_GATE_PIP', 'ARRIVAL_GATE_THRESHOLD', 'ARRIVAL_WARD_FRACTURE'], 5, {
      reducedMotion: 'glide',
    }),
    // Owner (2026-10-07): meet the Warden before the crack. It floats down, says hello, and the player
    // types "hi" back. The hold is long enough at Fast for the descent to be seen, not a pop-in.
    hold('arrival-warden-hello', A, 'ARRIVAL_WARD_FRACTURE', 10, {
      // Pip introduces the Warden and prompts "hi"; the Warden answers once it is typed.
      barks: ['pip-warden'],
      chase: [
        {
          at: 0.1,
          target: marker('warden-hi', WARDEN_HELLO_POSITION, 'hi', {
            labelHeight: 0.4,
            defeatFx: { kind: 'burst', scale: 0.8, color: '#ffe08a' },
            defeatBark: 'warden-hello',
          }),
        },
      ],
    }),
    // Owner (2026-10-08): the Warden "disappeared into thin air". Now a blast at the tower makes it
    // turn, it says where it is going, and only then flies off (next beat).
    hold('arrival-warden-boom', A, 'ARRIVAL_WARD_FRACTURE', 8, {
      barks: ['fracture-warden'],
      music: 'ward-fracture',
      fx: [
        { kind: 'lightning', at: 'ACADEMY_TOWER_TOP', atBeat: 0.05 },
        { kind: 'flash', atBeat: 0.05 },
        { kind: 'shockwave', at: 'ACADEMY_TOWER_TOP', atBeat: 0.08, scale: 1.6 },
        { kind: 'shake', atBeat: 0.08, scale: 1.4 },
      ],
    }),
    // The Warden flies to the tower top and holds the cracking ward; the camera follows it up.
    // Owner: it took too long to move on after "look at the sky"; one line here, the next over the walk in.
    reveal('arrival-ward-fracture', A, 'ARRIVAL_WARD_FRACTURE', ['ACADEMY_TOWER_TOP'], 1.6, 8, {
      barks: ['fracture-3'],
      objective: 'courtyard-anchor',
      fx: [
        { kind: 'lightning', at: 'ACADEMY_TOWER_TOP', atBeat: 0.62 },
        { kind: 'flash', atBeat: 0.62 },
        { kind: 'meteors', at: 'ACADEMY_TOWER_TOP', atBeat: 0.66, scale: 1.2 },
        { kind: 'shockwave', at: 'ARRIVAL_HILLS_EAST', atBeat: 0.72, scale: 2.5 },
        { kind: 'lightning', at: 'ACADEMY_TOWER_TOP', atBeat: 0.8 },
        { kind: 'shockwave', at: 'ARRIVAL_HILLS_WEST', atBeat: 0.88, scale: 2.5 },
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
            marker('crystal-right', CRYSTAL_POSITIONS.right, 'open', { labelHeight: 0.55, defeatFx: crystalBurst }),
          ],
        },
      ],
      barks: [
        { when: { on: 'first-correct' }, line: 'gate-first-correct' },
        { when: { on: 'first-mistake' }, line: 'gate-first-mistake' },
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
