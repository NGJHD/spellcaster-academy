/** Per-area lighting and atmosphere (colour script: warm academy → green greenhouse → moonlit tower). */
import type { AreaId } from '../game/types';

export type SkyKind = 'afternoon' | 'dawn' | 'night' | 'interior' | 'inferno' | 'blank';

export interface AreaLook {
  readonly sky: SkyKind;
  readonly background: string;
  readonly fog: readonly [string, number, number];
  readonly sun: { readonly position: readonly [number, number, number]; readonly color: string; readonly intensity: number } | null;
  readonly hemi: readonly [string, string, number];
  readonly exposure: number;
  /** Environment-map intensity for PBR reflections. */
  readonly envIntensity: number;
  /** CC0 HDRI used for image-based lighting (public/assets/hdri/<id>_1k.hdr). */
  readonly hdri: string;
}

const DAY = 'kloofendal_48d_partly_cloudy_puresky';
const INTERIOR = 'afrikaans_church_interior';
const NIGHT = 'kloppenheim_02_puresky';

const EXTERIOR: AreaLook = {
  sky: 'afternoon',
  background: '#a9c4de',
  fog: ['#d9dfe2', 70, 380],
  sun: { position: [-60, 45, 80], color: '#ffe0b0', intensity: 2.8 },
  hemi: ['#d8e6ff', '#6b5a40', 0.75],
  exposure: 1.0,
  envIntensity: 0.9,
  hdri: DAY,
};

const AREA_LOOKS_L1 = {
  'arrival-gate': EXTERIOR,
  'sunlit-courtyard': EXTERIOR,
  'east-hall': { ...EXTERIOR, fog: ['#3a2f25', 12, 60] },
  'whispering-library': {
    sky: 'interior',
    background: '#1b140e',
    fog: ['#2a1f16', 14, 60],
    sun: { position: [30, 30, 10], color: '#ffd8a0', intensity: 1.4 },
    hemi: ['#ffdcae', '#3b2a1c', 0.45],
    exposure: 1.05,
    envIntensity: 0.5,
    hdri: INTERIOR,
  },
  'hall-of-portraits': {
    sky: 'interior',
    background: '#1c1612',
    fog: ['#2a2018', 14, 55],
    sun: null,
    hemi: ['#ffe2bd', '#3a2b20', 0.55],
    exposure: 1.05,
    envIntensity: 0.5,
    hdri: INTERIOR,
  },
  'enchanted-greenhouse': {
    sky: 'afternoon',
    // Clear glass now shows the garden: real daylight and distance haze, a little green underfoot.
    background: '#a9c4de',
    fog: ['#d9e2df', 50, 260],
    sun: { position: [20, 50, 20], color: '#fff2d0', intensity: 2.4 },
    hemi: ['#e5f2ff', '#3e5a33', 0.8],
    exposure: 1.0,
    envIntensity: 0.9,
    hdri: DAY,
  },
  'lower-stairwell': {
    sky: 'interior',
    background: '#15120f',
    fog: ['#211b16', 10, 45],
    sun: { position: [20, 40, 0], color: '#dfe8ff', intensity: 0.8 },
    hemi: ['#f4d9b5', '#2b221b', 0.45],
    exposure: 1.1,
    envIntensity: 0.4,
    hdri: INTERIOR,
  },
  'practice-gallery': {
    sky: 'interior',
    background: '#1a1714',
    fog: ['#26211b', 18, 80],
    sun: { position: [-20, 40, -20], color: '#ffe9c8', intensity: 1.6 },
    hemi: ['#fff0da', '#3a3026', 0.6],
    exposure: 1.05,
    envIntensity: 0.6,
    hdri: INTERIOR,
  },
  'moon-tower': {
    sky: 'night',
    background: '#0b1020',
    fog: ['#121a30', 12, 60],
    sun: { position: [-30, 60, 20], color: '#b9cdf5', intensity: 1.0 },
    hemi: ['#9db4e6', '#2a2420', 0.45],
    exposure: 1.15,
    envIntensity: 0.5,
    hdri: NIGHT,
  },
  observatory: {
    sky: 'night',
    background: '#070b18',
    fog: ['#0b1124', 60, 260],
    sun: { position: [-40, 70, 30], color: '#c4d6ff', intensity: 1.3 },
    hemi: ['#8ea8de', '#1d1f2a', 0.5],
    exposure: 1.2,
    envIntensity: 0.6,
    hdri: NIGHT,
  },
  'celebration-courtyard': {
    sky: 'dawn',
    background: '#f2c9a0',
    fog: ['#f3d8be', 60, 360],
    sun: { position: [80, 18, 60], color: '#ffc58a', intensity: 2.4 },
    hemi: ['#ffe0c2', '#5c4a3a', 0.8],
    exposure: 1.0,
    envIntensity: 0.9,
    hdri: 'belfast_sunset_puresky',
  },
} satisfies Record<string, AreaLook>;

/** Level 2: night siege lit by fire (CLAUDE.md §5 visual tone: red and orange inkfire against the dark). */
const SIEGE: AreaLook = {
  sky: 'inferno',
  background: '#1a0806',
  fog: ['#2a0d08', 30, 220],
  sun: { position: [40, 30, -60], color: '#ff6a3a', intensity: 1.6 },
  hemi: ['#ff8a5a', '#1a0a08', 0.55],
  exposure: 1.15,
  envIntensity: 0.45,
  hdri: NIGHT,
};
const SIEGE_INDOOR: AreaLook = { ...SIEGE, sky: 'interior', background: '#160806', fog: ['#2a100a', 12, 70], hemi: ['#ff9a6a', '#2a120c', 0.5] };

/** Level 3: the Blank, a red sky that never darkens over scorched grey ash. */
const BLANK: AreaLook = {
  sky: 'blank',
  background: '#5a1410',
  fog: ['#6a2a20', 40, 320],
  sun: { position: [-30, 40, -80], color: '#ff7a4a', intensity: 2.0 },
  hemi: ['#ff9a7a', '#2a2422', 0.6],
  exposure: 1.05,
  envIntensity: 0.5,
  hdri: 'belfast_sunset_puresky',
};
const CITADEL: AreaLook = { ...BLANK, background: '#2a0806', fog: ['#3a0e08', 20, 160], hemi: ['#ff7a4a', '#1a0a08', 0.5] };

export const LEVEL_LOOKS: Record<Exclude<AreaId, keyof typeof AREA_LOOKS_L1>, AreaLook> = {
  'l2-festival-lawn': SIEGE,
  'l2-dormitory': SIEGE_INDOOR,
  'l2-bell-bridge': SIEGE,
  'l2-great-hall': SIEGE_INDOOR,
  'l2-workshops': SIEGE_INDOOR,
  'l2-lantern-lake': SIEGE,
  'l2-burning-library': SIEGE_INDOOR,
  'l2-ramparts': SIEGE,
  'l2-tower-roof': { ...SIEGE, fog: ['#2a0d08', 60, 300] },
  // Dawn after the siege: the beacons have pushed the red back.
  'l2-aftermath': {
    sky: 'dawn',
    background: '#e8b090',
    fog: ['#d8a890', 60, 320],
    sun: { position: [80, 14, 60], color: '#ffb880', intensity: 2.2 },
    hemi: ['#ffd8b8', '#4a3a30', 0.75],
    exposure: 1.0,
    envIntensity: 0.8,
    hdri: 'belfast_sunset_puresky',
  },
  'l3-rift-shore': BLANK,
  'l3-cinderwood': BLANK,
  'l3-inkfall': BLANK,
  'l3-margin-library': { ...BLANK, sky: 'interior', fog: ['#4a2420', 14, 80] },
  'l3-unfinished-gallery': { ...BLANK, sky: 'interior', fog: ['#4a2420', 14, 90] },
  'l3-paper-sea': BLANK,
  'l3-forge': CITADEL,
  'l3-citadel': CITADEL,
  'l3-throne': CITADEL,
  'l3-homecoming': {
    sky: 'dawn',
    background: '#f2c9a0',
    fog: ['#f3d8be', 60, 360],
    sun: { position: [80, 18, 60], color: '#ffc58a', intensity: 2.4 },
    hemi: ['#ffe0c2', '#5c4a3a', 0.8],
    exposure: 1.0,
    envIntensity: 0.9,
    hdri: 'belfast_sunset_puresky',
  },
};

/** Areas sharing the exterior campus geometry. */
export const EXTERIOR_AREAS: ReadonlySet<AreaId> = new Set<AreaId>([
  'arrival-gate',
  'sunlit-courtyard',
  'east-hall',
  'celebration-courtyard',
]);

export const AREA_LOOKS: Record<AreaId, AreaLook> = { ...AREA_LOOKS_L1, ...LEVEL_LOOKS };
