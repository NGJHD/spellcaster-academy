/**
 * The dome splits open with a boom, the Warden rises
 * with a roar of light (name card, health bar), plates blast off, light arcs scorch the floor, and the
 * repair is a beam struggle against the fracture that ends in a huge flash and shock wave. The ending
 * starts with fireworks and keeps to four lines before the results.
 * Observatory boss (Ward Warden) and the Celebration Courtyard ending.
 * Observatory local layout (origin OBSERVATORY_ORIGIN): circular arena radius 14, Warden floats at the centre.
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, reveal, talk, target, travel, type AreaScript } from './builders';

const O = 'observatory';
export const OBSERVATORY_ORIGIN: Vec3 = [820, 40, -60];
const W = origin(OBSERVATORY_ORIGIN);
export const WARDEN_CENTRE = W(0, 3.8, 0);

const PLATE_OFFSETS: readonly Vec3[] = [
  [-1.15, 4.7, 0.9],
  [1.15, 4.7, 0.9],
  [-1.35, 3.4, 1.0],
  [1.35, 3.4, 1.0],
  [0, 2.4, 1.15],
];

export const VALUE_POSITIONS: readonly Vec3[] = [
  W(-6, 8, -4),
  W(-3.5, 10, -6),
  W(0, 11, -7),
  W(3.5, 10, -6),
  W(6, 8, -4),
  W(0, 7.5, -2),
];

const runeRound = (round: number, min: number, max: number) =>
  [0, 1, 2].map((i) =>
    target(`rune-${round}-${i + 1}`, 'rune', WARDEN_CENTRE, [len(min, max)], {
      movement: { kind: 'orbit', centre: W(0, 3.6 + (i - 1) * 0.5, 0), radius: 3.3, speed: 0.28, phase: (i * Math.PI * 2) / 3 },
      labelHeight: 0.45,
      delaySec: i * 0.4,
    }),
  );

export const observatory: AreaScript = {
  nodes: {
    OBS_ENTRY: { position: W(0, 1.6, 16), lookAt: W(0, 3.8, 0) },
    OBS_COMBAT: { position: W(0, 1.6, 10), lookAt: W(0, 3.8, 0) },
    OBS_DOME_VIEW: { position: W(0, 1.6, 10), lookAt: W(0, 9, -6) },
  },
  lookPoints: {
    OBS_DOME: W(0, 22, -4),
    OBS_WARDEN: WARDEN_CENTRE,
    OBS_WARDEN_HIGH: W(0, 4.6, 0),
    OBS_FLOOR: W(0, 0.15, 0),
    OBS_ARC_LEFT: W(-4.5, 0.2, 5),
    OBS_ARC_RIGHT: W(4.5, 0.2, 5),
    OBS_RING: W(0, 0.2, 4),
    OBS_FRACTURE: W(0, 10, -6),
  },
  beats: [
    fade('observatory-enter', O, 'OBS_ENTRY', { music: 'warden-defence', objective: 'break-defence' }),
    // The dome splits open with a boom and the ward energy storms overhead.
    reveal('observatory-dome-reveal', O, 'OBS_ENTRY', ['OBS_DOME', 'OBS_WARDEN'], 2.2, 2.4, {
      attention: 'spectacle',
      fx: [
        { kind: 'pulse', at: 'OBS_DOME', atBeat: 0.2, scale: 3, color: '#9fd8ff' },
        { kind: 'flash', atBeat: 0.2 },
        { kind: 'lightning', at: 'OBS_DOME', atBeat: 0.25 },
        { kind: 'meteors', at: 'OBS_DOME', atBeat: 0.3, scale: 0.6, color: '#9fd8ff' },
        { kind: 'lightning', at: 'OBS_DOME', atBeat: 0.6 },
      ],
    }),
    travel('observatory-approach', O, ['OBS_ENTRY', 'OBS_COMBAT'], 4, { reducedMotion: 'glide' }),
    // Boss intro: the Warden rises with a roar of light; name card and health bar.
    reveal('observatory-intro', O, 'OBS_COMBAT', ['OBS_WARDEN_HIGH'], 0.6, 10, {
      attention: 'boss-intro',
      barks: ['obs-1', 'obs-symbol'],
      fx: [
        { kind: 'pillar', at: 'OBS_FLOOR', atBeat: 0.15, scale: 1.6, color: '#ffe6a0' },
        { kind: 'pulse', at: 'OBS_FLOOR', atBeat: 0.3, scale: 1.6, color: '#ffe6a0' },
        { kind: 'shake', atBeat: 0.3, scale: 1.6 },
        { kind: 'burst', at: 'OBS_WARDEN_HIGH', atBeat: 0.55, scale: 2.4, color: '#ffe6a0' },
      ],
    }),
    fight('warden-w1', O, { barks: ['obs-w1', 'obs-2'] }),
    fight('warden-w2', O, { barks: ['obs-w2'] }),
    reveal('observatory-to-dome', O, 'OBS_COMBAT', [], 0, 0.1, { returnToNode: false }),
    travel('observatory-look-dome', O, ['OBS_COMBAT', 'OBS_DOME_VIEW'], 2.5, {
      reducedMotion: 'glide',
      music: 'ward-repair',
      objective: 'repair-ward',
    }),
    fight('warden-w3', O, { barks: ['obs-w3'] }),
    travel('observatory-look-warden', O, ['OBS_DOME_VIEW', 'OBS_COMBAT'], 2.5, { reducedMotion: 'glide', attention: 'ending' }),
    talk('observatory-restored', O, ['obs-restored', 'obs-end'], { attention: 'ending' }),
    // The reveal: a burning seam is left in the healed ward, and a voice speaks through it.
    reveal('observatory-seam', O, 'OBS_COMBAT', ['OBS_DOME'], 1.2, 9, {
      attention: 'ending',
      music: 'warden-defence',
      barks: ['seam-1', 'seam-2'],
      fx: [
        { kind: 'flash', atBeat: 0.12, color: '#ff3a20' },
        { kind: 'meteors', at: 'OBS_DOME', atBeat: 0.15, scale: 0.5, color: '#ff4a2a' },
        { kind: 'lightning', at: 'OBS_DOME', atBeat: 0.2 },
        { kind: 'shake', atBeat: 0.2, scale: 1.2 },
      ],
    }),
    checkpoint('observatory-checkpoint', O, 'level-1-complete'),
  ],
  encounters: [
    {
      id: 'warden-w1',
      areaId: O,
      kind: 'combat',
      bossPhase: 'warden-shell',
      assistAfterFailures: 2,
      // Light arcs scorch the clear floor telegraphs (sparks and a ring where they land).
      hazard: {
        attacks: ['arc-left', 'arc-right', 'pulse'],
        firstDelaySec: 5,
        intervalSec: 8,
        windupSec: 1.8,
        damage: 12,
        fx: [
          { kind: 'sparks', at: 'OBS_ARC_LEFT', scale: 1.6, color: '#ffe6a0' },
          { kind: 'sparks', at: 'OBS_ARC_RIGHT', scale: 1.6, color: '#ffe6a0' },
          { kind: 'pulse', at: 'OBS_RING', scale: 0.8, color: '#ffe6a0' },
        ],
      },
      waves: [
        {
          id: 'plates',
          sequential: true,
          targets: PLATE_OFFSETS.map((o, i) =>
            target(`warden-plate-${i + 1}`, 'plate', W(o[0], o[1], o[2]), [len(4, 6)], {
              labelHeight: 0.4,
              // Plates blast off the Warden (then orbit safely).
              defeatFx: { kind: 'debris', scale: 0.7, color: '#d8d0c0', pieces: 'stone' },
            }),
          ),
        },
      ],
      barks: [{ when: { on: 'defeats', count: 3 }, line: 'obs-plate3' }],
      onComplete: { flags: ['warden-shell-open'] },
    },
    {
      id: 'warden-w2',
      areaId: O,
      kind: 'combat',
      bossPhase: 'warden-runes',
      assistAfterFailures: 2,
      hazard: {
        attacks: ['pulse', 'arc-right', 'arc-left'],
        firstDelaySec: 6,
        intervalSec: 9,
        windupSec: 1.8,
        damage: 12,
        fx: [
          { kind: 'pulse', at: 'OBS_RING', scale: 0.8, color: '#ffe6a0' },
          { kind: 'sparks', at: 'OBS_ARC_RIGHT', scale: 1.6, color: '#ffe6a0' },
          { kind: 'sparks', at: 'OBS_ARC_LEFT', scale: 1.6, color: '#ffe6a0' },
        ],
      },
      waves: [
        { id: 'runes-1', targets: runeRound(1, 5, 6) },
        { id: 'runes-2', targets: runeRound(2, 6, 7) },
      ],
      barks: [{ when: { on: 'wave-start', wave: 1 }, line: 'obs-anchors' }],
      onComplete: { flags: ['warden-core-exposed'] },
    },
    {
      id: 'warden-w3',
      areaId: O,
      kind: 'interaction',
      bossPhase: 'warden-repair',
      // Beam struggle against the fracture: each value word pushes the cracks back.
      beam: { to: W(0, 10, -6), color: '#ff9f7a' },
      completeFx: [
        { kind: 'flash' },
        { kind: 'pulse', at: 'OBS_FLOOR', scale: 3.4, color: '#ffe6a0' },
        { kind: 'burst', at: 'OBS_FRACTURE', scale: 3.4, color: '#ffe6a0' },
        { kind: 'pillar', at: 'OBS_FLOOR', scale: 2.2, color: '#ffe6a0' },
        { kind: 'shake', scale: 2 },
      ],
      waves: [
        {
          id: 'values',
          sequential: true,
          targets: ['brave', 'focus', 'learn', 'kind', 'create', 'wonder'].map((word, i) =>
            marker(`value-${word}`, VALUE_POSITIONS[i] ?? W(0, 9, -6), word, {
              labelHeight: 0.2,
              defeatFx: { kind: 'burst', scale: 1.1, color: '#ffe6a0' },
            }),
          ),
        },
      ],
      // Finishing Level 1 wins the Starlight wand trail.
      onComplete: { flags: ['ward-repaired'], reward: { cosmetic: 'trail-starlight' } },
    },
  ],
};

// ---------- Celebration Courtyard (reuses the courtyard at sunrise) ----------

const C = 'celebration-courtyard';

export const celebration: AreaScript = {
  nodes: {
    CEL_START: { position: [0, 1.6, 15], lookAt: [0, 2, 0] },
    CEL_GATHER: { position: [-1, 1.6, 8.5], lookAt: [3.5, 1.7, 3.2] },
    CEL_FINAL: { position: [0.5, 2.2, 9.5], lookAt: [0, 26, -56] },
  },
  lookPoints: {
    CEL_MIRA: [-4, 1.45, 3],
    CEL_WARDEN_BALCONY: [0, 31, -54],
    CEL_SKY: [0, 0, -14],
    CEL_SKY_LEFT: [-10, 0, -12],
    CEL_SKY_RIGHT: [10, 0, -12],
  },
  beats: [
    fade('celebration-enter', C, 'CEL_START', { fadeOutSec: 1.2, holdSec: 0.8, fadeInSec: 1.6, music: 'celebration', objective: 'none', attention: 'ending' }),
    // Fireworks over the courtyard; the dialogue is four lines at most, then the results.
    travel('celebration-walk', C, ['CEL_START', 'CEL_GATHER'], 7, {
      attention: 'ending',
      fx: [
        { kind: 'fireworks', at: 'CEL_SKY', atBeat: 0.05 },
        { kind: 'fireworks', at: 'CEL_SKY_LEFT', atBeat: 0.35 },
        { kind: 'fireworks', at: 'CEL_SKY_RIGHT', atBeat: 0.65 },
      ],
    }),
    reveal('celebration-mira-wave', C, 'CEL_GATHER', ['CEL_MIRA'], 1.2, 1.2, {
      attention: 'ending',
      fx: [{ kind: 'fireworks', at: 'CEL_SKY', atBeat: 0.3, scale: 1.3 }],
    }),
    talk('celebration-orin-1', C, ['end-1', 'end-2'], { attention: 'ending' }),
    // (No turn to the balcony fireworks here: owner, 2026-10-08, it was distracting mid-conversation.)
    talk('celebration-banter', C, ['end-4', 'end-6'], { attention: 'ending' }),
    travel('celebration-final', C, ['CEL_GATHER', 'CEL_FINAL'], 5, {
      reducedMotion: 'glide',
      attention: 'ending',
      fx: [
        { kind: 'fireworks', at: 'CEL_SKY_LEFT', atBeat: 0.2, scale: 1.4 },
        { kind: 'fireworks', at: 'CEL_SKY_RIGHT', atBeat: 0.45, scale: 1.4 },
        { kind: 'fireworks', at: 'CEL_WARDEN_BALCONY', atBeat: 0.7, scale: 1.8 },
      ],
    }),
    fade('celebration-fade', C, 'CEL_FINAL', { fadeOutSec: 1.6, holdSec: 0.6, fadeInSec: 0.4, music: 'results', attention: 'ending' }),
    { kind: 'results', id: 'level-results', areaId: C, attention: 'ending' },
  ],
  encounters: [],
};
