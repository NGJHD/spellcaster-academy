/**
 * Level 3 route: Into the Unwritten (LEVEL3_DESIGN.md), assembled from its area scripts in story order.
 */
import type { AreaScript } from './areas/builders';
import { homecoming, throne } from './areas3/finale';
import { cinderwood, shore } from './areas3/journey1';
import { gallery3, inkfall, margin } from './areas3/journey2';
import { citadel, forge, sea } from './areas3/journey3';
import type { BossDef } from './bosses';

export const LEVEL3_AREAS: readonly AreaScript[] = [shore, cinderwood, inkfall, margin, gallery3, sea, forge, citadel, throne, homecoming];

export const LEVEL3_BOSSES: readonly BossDef[] = [
  { id: 'perfect-warden', introBeat: 'l3-perfect-warden', phases: ['l3-pw-1', 'l3-pw-2', 'l3-pw-3'] },
  { id: 'unwriter', introBeat: 'l3-unwriter-rises', phases: ['l3-u1', 'l3-u2', 'l3-u3', 'l3-u4'] },
];

/** Eight Memory Pages (L3-17): the story of Corvane and Pip. */
export const LEVEL3_COLLECTIBLES: readonly string[] = ['memory-1', 'memory-2', 'memory-3', 'memory-4', 'memory-5', 'memory-6', 'memory-7', 'memory-8'];
