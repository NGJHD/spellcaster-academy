/**
 * LD-17 / LD-18: Observatory boss (Ward Warden) and the Celebration Courtyard ending.
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
  },
  beats: [
    fade('observatory-enter', O, 'OBS_ENTRY', { music: 'warden-defence', objective: 'break-defence' }),
    reveal('observatory-dome-reveal', O, 'OBS_ENTRY', ['OBS_DOME', 'OBS_WARDEN'], 2.2, 1.2),
    travel('observatory-approach', O, ['OBS_ENTRY', 'OBS_COMBAT'], 4, { reducedMotion: 'glide' }),
    talk('observatory-intro', O, ['obs-1', 'obs-symbol'], { attention: 'boss-intro' }),
    fight('warden-w1', O, { barks: ['obs-w1', 'obs-2'] }),
    fight('warden-w2', O, { barks: ['obs-w2'] }),
    reveal('observatory-to-dome', O, 'OBS_COMBAT', [], 0, 0.1, { returnToNode: false }),
    travel('observatory-look-dome', O, ['OBS_COMBAT', 'OBS_DOME_VIEW'], 2.5, {
      reducedMotion: 'glide',
      music: 'ward-repair',
      objective: 'repair-ward',
    }),
    talk('observatory-repair-talk', O, ['obs-w3']),
    fight('warden-w3', O),
    travel('observatory-look-warden', O, ['OBS_DOME_VIEW', 'OBS_COMBAT'], 2.5, { reducedMotion: 'glide' }),
    talk('observatory-restored', O, ['obs-restored', 'obs-end']),
    checkpoint('observatory-checkpoint', O, 'level-1-complete'),
  ],
  encounters: [
    {
      id: 'warden-w1',
      areaId: O,
      kind: 'combat',
      bossPhase: 'warden-shell',
      assistAfterFailures: 2,
      hazard: { attacks: ['arc-left', 'arc-right', 'pulse'], firstDelaySec: 5, intervalSec: 8, windupSec: 1.8, damage: 12 },
      waves: [
        {
          id: 'plates',
          sequential: true,
          targets: PLATE_OFFSETS.map((o, i) =>
            target(`warden-plate-${i + 1}`, 'plate', W(o[0], o[1], o[2]), [len(4, 6)], { labelHeight: 0.4 }),
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
      hazard: { attacks: ['pulse', 'arc-right', 'arc-left'], firstDelaySec: 6, intervalSec: 9, windupSec: 1.8, damage: 12 },
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
      waves: [
        {
          id: 'values',
          sequential: true,
          targets: ['brave', 'focus', 'learn', 'kind', 'create', 'wonder'].map((word, i) =>
            marker(`value-${word}`, VALUE_POSITIONS[i] ?? W(0, 9, -6), word, { labelHeight: 0.2 }),
          ),
        },
      ],
      onComplete: { flags: ['ward-repaired'] },
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
  },
  beats: [
    fade('celebration-enter', C, 'CEL_START', { fadeOutSec: 1.2, holdSec: 0.8, fadeInSec: 1.6, music: 'celebration', objective: 'none' }),
    travel('celebration-walk', C, ['CEL_START', 'CEL_GATHER'], 7),
    reveal('celebration-mira-wave', C, 'CEL_GATHER', ['CEL_MIRA'], 1.2, 1.2),
    talk('celebration-orin-1', C, ['end-1', 'end-2']),
    reveal('celebration-warden', C, 'CEL_GATHER', ['CEL_WARDEN_BALCONY'], 1.8, 2.0),
    talk('celebration-banter', C, ['end-3', 'end-4', 'end-5', 'end-6']),
    travel('celebration-final', C, ['CEL_GATHER', 'CEL_FINAL'], 5, { reducedMotion: 'glide' }),
    fade('celebration-fade', C, 'CEL_FINAL', { fadeOutSec: 1.6, holdSec: 0.6, fadeInSec: 0.4, music: 'results' }),
    { kind: 'results', id: 'level-results', areaId: C },
  ],
  encounters: [],
};
