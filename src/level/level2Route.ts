/**
 * Level 2 route: The Siege of Asterfall (LEVEL2_DESIGN.md), assembled from its area scripts in story order.
 */
import { bedroom } from './areas2/bedroom';
import type { AreaScript } from './areas/builders';
import { bridge } from './areas2/bridge';
import { dormitory } from './areas2/dormitory';
import { greatHall } from './areas2/greatHall';
import { lake } from './areas2/lake';
import { lawn } from './areas2/lawn';
import { library2 } from './areas2/library';
import { ramparts } from './areas2/ramparts';
import { towerRoof } from './areas2/towerRoof';
import { workshops } from './areas2/workshops';
import type { BossDef } from './bosses';

// The night begins in the apprentice's bedroom, then down the burning Dormitory Tower and out onto the lawn.
export const LEVEL2_AREAS: readonly AreaScript[] = [bedroom, dormitory, lawn, bridge, greatHall, workshops, lake, library2, ramparts, towerRoof];

export const LEVEL2_BOSSES: readonly BossDef[] = [
  { id: 'grey-herald', introBeat: 'l2-herald-enters', phases: ['l2-herald-1', 'l2-herald-2', 'l2-herald-3'] },
  { id: 'vellum-wyrm', introBeat: 'l2-wyrm-rises', phases: ['l2-wyrm-v1', 'l2-wyrm-v2a', 'l2-wyrm-v2b', 'l2-wyrm-v3'] },
];

