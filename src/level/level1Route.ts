/**
 * Level 1 — First Day, First Spell. The complete authored on-rails sequence (LD-4), assembled
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

/** First beat of each area (autosave on area entry; resume summaries). */
export const AREA_FIRST_BEAT: ReadonlyMap<AreaId, string> = (() => {
  const map = new Map<AreaId, string>();
  for (const beat of LEVEL1_ROUTE.beats) if (!map.has(beat.areaId)) map.set(beat.areaId, beat.id);
  return map;
})();
