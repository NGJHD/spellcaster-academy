/**
 * Level 1 — First Day, First Spell. The complete authored on-rails sequence, assembled
 * from per-area scripts. Order here is the story order; nothing else can advance the level.
 */
import type { AreaId } from '../game/types';
import { arrivalGate } from './areas/arrivalGate';
import type { AreaScript } from './areas/builders';
import { courtyard } from './areas/courtyard';
import { eastHall } from './areas/eastHall';
import { gallery } from './areas/gallery';
import { greenhouse } from './areas/greenhouse';
import { library } from './areas/library';
import { moonTower } from './areas/moonTower';
import { celebration, observatory } from './areas/observatory';
import { portraits } from './areas/portraits';
import { stairwell } from './areas/stairwell';
import type { EncounterDef, LevelRoute } from './levelTypes';

const AREAS: readonly AreaScript[] = [
  arrivalGate,
  courtyard,
  eastHall,
  library,
  portraits,
  greenhouse,
  stairwell,
  gallery,
  moonTower,
  observatory,
  celebration,
];

export const LEVEL1_ROUTE: LevelRoute = {
  id: 'level-1',
  nodes: Object.assign({}, ...AREAS.map((a) => a.nodes)),
  lookPoints: Object.assign({}, ...AREAS.map((a) => a.lookPoints)),
  beats: AREAS.flatMap((a) => a.beats),
};

export const LEVEL1_ENCOUNTERS: ReadonlyMap<string, EncounterDef> = new Map(
  AREAS.flatMap((a) => a.encounters).map((e) => [e.id, e]),
);

const BEAT_INDEX = new Map(LEVEL1_ROUTE.beats.map((b, i) => [b.id, i]));

export function beatIndexOf(beatId: string): number {
  return BEAT_INDEX.get(beatId) ?? -1;
}

/** Beats that no longer exist, mapped to the beat that now plays that moment, so an older save still resumes sensibly. */
export const BEAT_ALIASES: Readonly<Record<string, string>> = {
  'courtyard-fountain-reveal': 'courtyard-c1',
  'library-balcony-pan': 'library-to-grimoire',
  'greenhouse-leaf-pan': 'greenhouse-to-vine',
  'greenhouse-verdant-pan': 'greenhouse-to-anchor',
  'arrival-gate-intro': 'arrival-crystals',
  'arrival-fracture-talk': 'arrival-checkpoint',
  'courtyard-c1-talk': 'courtyard-c1',
  'courtyard-to-c1': 'courtyard-c1',
  'celebration-warden': 'celebration-banter',
  'courtyard-c2-talk': 'courtyard-c2',
  'east-hall-walk': 'east-hall-door',
  'east-hall-mira': 'east-hall-door',
  'east-hall-chest-reveal': 'east-hall-chest',
  'east-hall-chest-return': 'east-hall-stampede-2',
  'east-hall-mira-2': 'east-hall-slam',
  'east-hall-to-library': 'library-doors',
  'library-wisps-talk': 'library-l2',
  'library-clue': 'library-to-grimoire',
  'library-grimoire-done': 'library-to-anchor',
  'portraits-whispers': 'portraits-ambush',
  'greenhouse-vine-talk': 'greenhouse-vine',
  'greenhouse-pods-talk': 'greenhouse-h1',
  'stairwell-to-l1': 'stairwell-slide-1',
  'stair-1': 'stairwell-slide-1',
  'stairwell-to-l2': 'stairwell-slide-2',
  'stair-2': 'stairwell-slide-2',
  'stairwell-to-l3': 'stairwell-slide-3',
  'stair-3': 'stairwell-slide-3',
  'stairwell-done': 'stairwell-checkpoint',
  'gallery-mira': 'gallery-to-zone1',
  'tower-pre-boss-choice': 'observatory-enter',
  'gallery-done-hold': 'gallery-checkpoint',
  'gallery-done': 'gallery-checkpoint',
  'tower-climb-1': 'tower-lift-1',
  'tower-floor-2': 'tower-t2',
  'tower-climb-2': 'tower-lift-2',
  'tower-floor-3': 'tower-t3',
  'observatory-repair-talk': 'warden-w3',
};

/** The current beat for a saved beat id (following aliases for removed beats), or null if unknown. */
export function resolveBeatId(beatId: string): string | null {
  if (BEAT_INDEX.has(beatId)) return beatId;
  const alias = BEAT_ALIASES[beatId];
  return alias !== undefined && BEAT_INDEX.has(alias) ? alias : null;
}

/** First beat of each area (autosave on area entry; resume summaries). */
export const AREA_FIRST_BEAT: ReadonlyMap<AreaId, string> = (() => {
  const map = new Map<AreaId, string>();
  for (const beat of LEVEL1_ROUTE.beats) if (!map.has(beat.areaId)) map.set(beat.areaId, beat.id);
  return map;
})();
