/** Per-area lighting and atmosphere (colour script: warm academy → green greenhouse → moonlit tower). */
import type { AreaId } from '../game/types';

export type SkyKind = 'afternoon' | 'dawn' | 'night' | 'interior';

export interface AreaLook {
  readonly sky: SkyKind;
  readonly background: string;
  readonly fog: readonly [string, number, number];
  readonly sun: { readonly position: readonly [number, number, number]; readonly color: string; readonly intensity: number } | null;
  readonly hemi: readonly [string, string, number];
  readonly exposure: number;
  /** Environment-map intensity for PBR reflections. */
  readonly envIntensity: number;
}

const EXTERIOR: AreaLook = {
  sky: 'afternoon',
  background: '#a9c4de',
  fog: ['#d9dfe2', 70, 380],
  sun: { position: [-60, 45, 80], color: '#ffe0b0', intensity: 2.8 },
  hemi: ['#d8e6ff', '#6b5a40', 0.75],
  exposure: 1.0,
  envIntensity: 0.9,
};

export const AREA_LOOKS: Record<AreaId, AreaLook> = {
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
  },
  'hall-of-portraits': {
    sky: 'interior',
    background: '#1c1612',
    fog: ['#2a2018', 14, 55],
    sun: null,
    hemi: ['#ffe2bd', '#3a2b20', 0.55],
    exposure: 1.05,
    envIntensity: 0.5,
  },
  'enchanted-greenhouse': {
    sky: 'afternoon',
    background: '#b9d7c3',
    fog: ['#cfe3d2', 20, 90],
    sun: { position: [20, 50, 20], color: '#fff2d0', intensity: 2.2 },
    hemi: ['#e5f7e2', '#3e5a33', 0.85],
    exposure: 1.0,
    envIntensity: 0.9,
  },
  'lower-stairwell': {
    sky: 'interior',
    background: '#15120f',
    fog: ['#211b16', 10, 45],
    sun: { position: [20, 40, 0], color: '#dfe8ff', intensity: 0.8 },
    hemi: ['#f4d9b5', '#2b221b', 0.45],
    exposure: 1.1,
    envIntensity: 0.4,
  },
  'practice-gallery': {
    sky: 'interior',
    background: '#1a1714',
    fog: ['#26211b', 18, 80],
    sun: { position: [-20, 40, -20], color: '#ffe9c8', intensity: 1.6 },
    hemi: ['#fff0da', '#3a3026', 0.6],
    exposure: 1.05,
    envIntensity: 0.6,
  },
  'moon-tower': {
    sky: 'night',
    background: '#0b1020',
    fog: ['#121a30', 12, 60],
    sun: { position: [-30, 60, 20], color: '#b9cdf5', intensity: 1.0 },
    hemi: ['#9db4e6', '#2a2420', 0.45],
    exposure: 1.15,
    envIntensity: 0.5,
  },
  observatory: {
    sky: 'night',
    background: '#070b18',
    fog: ['#0b1124', 60, 260],
    sun: { position: [-40, 70, 30], color: '#c4d6ff', intensity: 1.3 },
    hemi: ['#8ea8de', '#1d1f2a', 0.5],
    exposure: 1.2,
    envIntensity: 0.6,
  },
  'celebration-courtyard': {
    sky: 'dawn',
    background: '#f2c9a0',
    fog: ['#f3d8be', 60, 360],
    sun: { position: [80, 18, 60], color: '#ffc58a', intensity: 2.4 },
    hemi: ['#ffe0c2', '#5c4a3a', 0.8],
    exposure: 1.0,
    envIntensity: 0.9,
  },
};

/** Areas sharing the exterior campus geometry. */
export const EXTERIOR_AREAS: ReadonlySet<AreaId> = new Set<AreaId>([
  'arrival-gate',
  'sunlit-courtyard',
  'east-hall',
  'celebration-courtyard',
]);
