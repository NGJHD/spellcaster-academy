/**
 * Level registry (CLAUDE.md §5 campaign): each level is a route of beats, its encounters, bosses and
 * collectibles. GameRun plays one LevelDef; saves record which level they belong to.
 */
import type { LevelId, SpellId, StarPageId } from '../game/types';
import { ALL_STAR_PAGES, LEVEL_ORDER } from '../game/types';
import type { AreaScript } from './areas/builders';
import { LEVEL1_BOSSES, type BossDef } from './bosses';
import { BEAT_ALIASES, LEVEL1_ENCOUNTERS, LEVEL1_ROUTE } from './level1Route';
import { LEVEL2_AREAS, LEVEL2_BOSSES, LEVEL2_COLLECTIBLES } from './level2Route';
import { LEVEL3_AREAS, LEVEL3_BOSSES, LEVEL3_COLLECTIBLES } from './level3Route';
import type { EncounterDef, LevelRoute } from './levelTypes';

export interface LevelDef {
  readonly id: LevelId;
  readonly route: LevelRoute;
  readonly encounters: ReadonlyMap<string, EncounterDef>;
  readonly bosses: readonly BossDef[];
  /** Collectibles counted on the HUD and results ("star pages" in Level 1, "memory pages" in Level 3). */
  readonly collectibles: readonly StarPageId[];
  /** Spells already known when the level starts (spells carry over between levels, §5). */
  readonly startingSpells: readonly SpellId[];
  /** Removed beat ids mapped to their replacements (old saves). */
  readonly aliases: Readonly<Record<string, string>>;
  readonly beatIndexOf: (beatId: string) => number;
  readonly resolveBeatId: (beatId: string) => string | null;
}

function define(
  id: LevelId,
  route: LevelRoute,
  encounters: ReadonlyMap<string, EncounterDef>,
  bosses: readonly BossDef[],
  collectibles: readonly StarPageId[],
  startingSpells: readonly SpellId[],
  aliases: Readonly<Record<string, string>> = {},
): LevelDef {
  const index = new Map(route.beats.map((b, i) => [b.id, i]));
  const beatIndexOf = (beatId: string) => index.get(beatId) ?? -1;
  const resolveBeatId = (beatId: string) => {
    if (index.has(beatId)) return beatId;
    const alias = aliases[beatId];
    return alias !== undefined && index.has(alias) ? alias : null;
  };
  return { id, route, encounters, bosses, collectibles, startingSpells, aliases, beatIndexOf, resolveBeatId };
}

/** Assembles a level from its area scripts, in story order. */
export function assemble(id: string, areas: readonly AreaScript[]): { route: LevelRoute; encounters: ReadonlyMap<string, EncounterDef> } {
  return {
    route: {
      id,
      nodes: Object.assign({}, ...areas.map((a) => a.nodes)),
      lookPoints: Object.assign({}, ...areas.map((a) => a.lookPoints)),
      beats: areas.flatMap((a) => a.beats),
    },
    encounters: new Map(areas.flatMap((a) => a.encounters).map((e) => [e.id, e])),
  };
}

const ALL_SPELLS: readonly SpellId[] = ['spark-bolt', 'frost-thread', 'chain-spark'];
const level2 = assemble('level-2', LEVEL2_AREAS);
const level3 = assemble('level-3', LEVEL3_AREAS);

export const LEVELS: Readonly<Record<LevelId, LevelDef>> = {
  'level-1': define('level-1', LEVEL1_ROUTE, LEVEL1_ENCOUNTERS, LEVEL1_BOSSES, ALL_STAR_PAGES, [], BEAT_ALIASES),
  'level-2': define('level-2', level2.route, level2.encounters, LEVEL2_BOSSES, LEVEL2_COLLECTIBLES, ALL_SPELLS),
  'level-3': define('level-3', level3.route, level3.encounters, LEVEL3_BOSSES, LEVEL3_COLLECTIBLES, ALL_SPELLS),
};

/** The level a saved beat id belongs to (beat ids are unique across levels). */
export function levelOfBeat(beatId: string): LevelId | null {
  for (const id of LEVEL_ORDER) if (LEVELS[id].resolveBeatId(beatId) !== null) return id;
  return null;
}

export function nextLevel(id: LevelId): LevelId | null {
  return LEVEL_ORDER[LEVEL_ORDER.indexOf(id) + 1] ?? null;
}
