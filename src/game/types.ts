export type Difficulty = 'gentle' | 'standard' | 'challenge';

export type LevelId = 'level-1' | 'level-2' | 'level-3';
export const LEVEL_ORDER: readonly LevelId[] = ['level-1', 'level-2', 'level-3'];

export type Level1AreaId =
  | 'arrival-gate'
  | 'sunlit-courtyard'
  | 'east-hall'
  | 'whispering-library'
  | 'hall-of-portraits'
  | 'enchanted-greenhouse'
  | 'lower-stairwell'
  | 'practice-gallery'
  | 'moon-tower'
  | 'observatory'
  | 'celebration-courtyard';

/** Level 2: The Siege of Asterfall (LEVEL2_DESIGN.md). */
export type Level2AreaId =
  | 'l2-festival-lawn'
  | 'l2-dormitory'
  | 'l2-bell-bridge'
  | 'l2-great-hall'
  | 'l2-workshops'
  | 'l2-lantern-lake'
  | 'l2-burning-library'
  | 'l2-ramparts'
  | 'l2-tower-roof'
  | 'l2-aftermath';

/** Level 3: Into the Unwritten (LEVEL3_DESIGN.md). */
export type Level3AreaId =
  | 'l3-rift-shore'
  | 'l3-cinderwood'
  | 'l3-inkfall'
  | 'l3-margin-library'
  | 'l3-unfinished-gallery'
  | 'l3-paper-sea'
  | 'l3-forge'
  | 'l3-citadel'
  | 'l3-throne'
  | 'l3-homecoming';

export type AreaId = Level1AreaId | Level2AreaId | Level3AreaId;

export const LEVEL_AREAS: Readonly<Record<LevelId, readonly AreaId[]>> = {
  'level-1': [
    'arrival-gate',
    'sunlit-courtyard',
    'east-hall',
    'whispering-library',
    'hall-of-portraits',
    'enchanted-greenhouse',
    'lower-stairwell',
    'practice-gallery',
    'moon-tower',
    'observatory',
    'celebration-courtyard',
  ],
  'level-2': [
    'l2-festival-lawn',
    'l2-dormitory',
    'l2-bell-bridge',
    'l2-great-hall',
    'l2-workshops',
    'l2-lantern-lake',
    'l2-burning-library',
    'l2-ramparts',
    'l2-tower-roof',
    'l2-aftermath',
  ],
  'level-3': [
    'l3-rift-shore',
    'l3-cinderwood',
    'l3-inkfall',
    'l3-margin-library',
    'l3-unfinished-gallery',
    'l3-paper-sea',
    'l3-forge',
    'l3-citadel',
    'l3-throne',
    'l3-homecoming',
  ],
};

export const AREA_ORDER: readonly AreaId[] = LEVEL_ORDER.flatMap((l) => LEVEL_AREAS[l]);

export function levelOfArea(area: AreaId): LevelId {
  return LEVEL_ORDER.find((l) => LEVEL_AREAS[l].includes(area)) ?? 'level-1';
}

/** Checkpoint ids are defined per level (CLAUDE.md §12). */
export type CheckpointId = string;

export type SpellId = 'spark-bolt' | 'frost-thread' | 'chain-spark' | 'starfall';

export type AnchorId = 'courtyard' | 'library' | 'greenhouse';

export type CosmeticId = 'trail-starlight' | 'trail-verdant' | 'trail-inkwell';

/** Collectible ids (star pages in Level 1; each level lists its own in the level registry). */
export type StarPageId = string;

export const ALL_STAR_PAGES: readonly StarPageId[] = [
  'page-courtyard-fountain',
  'page-courtyard-sprite',
  'page-library-flying',
  'page-library-balcony',
  'page-library-grimoire',
  'page-greenhouse-leaf',
  'page-greenhouse-pod',
  'page-greenhouse-panel',
];

export const STAR_PAGE_AREA: Record<StarPageId, AreaId> = {
  'page-courtyard-fountain': 'sunlit-courtyard',
  'page-courtyard-sprite': 'sunlit-courtyard',
  'page-library-flying': 'whispering-library',
  'page-library-balcony': 'whispering-library',
  'page-library-grimoire': 'whispering-library',
  'page-greenhouse-leaf': 'enchanted-greenhouse',
  'page-greenhouse-pod': 'enchanted-greenhouse',
  'page-greenhouse-panel': 'enchanted-greenhouse',
};
