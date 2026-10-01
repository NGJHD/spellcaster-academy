export type Difficulty = 'gentle' | 'standard' | 'challenge';

export type AreaId =
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

export const AREA_ORDER: readonly AreaId[] = [
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
];

export type CheckpointId =
  | 'arrival-gate-complete'
  | 'courtyard-restored'
  | 'east-hall-complete'
  | 'library-restored'
  | 'portrait-hall-complete'
  | 'greenhouse-restored'
  | 'lower-stairwell-complete'
  | 'practice-gallery-complete'
  | 'observatory-door'
  | 'level-1-complete';

export type SpellId = 'spark-bolt' | 'frost-thread' | 'chain-spark';

export type AnchorId = 'courtyard' | 'library' | 'greenhouse';

export type CosmeticId = 'trail-starlight' | 'trail-verdant';

export type StarPageId =
  | 'page-courtyard-fountain'
  | 'page-courtyard-sprite'
  | 'page-library-flying'
  | 'page-library-balcony'
  | 'page-library-grimoire'
  | 'page-greenhouse-leaf'
  | 'page-greenhouse-pod'
  | 'page-greenhouse-panel';

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
