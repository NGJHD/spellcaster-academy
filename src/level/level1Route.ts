import type { RailRoute } from './rail/railTypes';

/**
 * Milestone 1 preview route: Arrival Gate → Sunlit Courtyard → East Hall.
 * Combat stops are plain holds until the encounter director exists (Milestone 2+).
 *
 * World layout (metres, +Y up):
 * - Arrival path runs along +Z towards the gate wall at z = 20.
 * - Courtyard spans x ∈ [-14, 14], z ∈ [-14, 20]; fountain at the origin.
 * - East Hall corridor runs from the courtyard's east door (x = 14) to the library doors (x = 44).
 * - Moon Tower stands at (0, 0, -60).
 */
export const LEVEL1_ROUTE: RailRoute = {
  id: 'level1-preview',
  nodes: {
    ARRIVAL_SKY_01: { position: [0, 24, 95], lookAt: [0, 14, -30] },
    ARRIVAL_SKY_02: { position: [2, 12, 62], lookAt: [0, 6, -20] },
    ARRIVAL_GATE_APPROACH: { position: [0, 2.2, 36], lookAt: [0, 3, 20] },
    ARRIVAL_GATE_PIP: { position: [0, 1.6, 27], lookAt: [0, 2.6, 20] },
    ARRIVAL_GATE_THRESHOLD: { position: [0, 1.6, 20], lookAt: [0, 2.5, 5] },
    ARRIVAL_WARD_FRACTURE: { position: [0, 1.6, 15], lookAt: [0, 2, 0] },

    COURTYARD_ENTRY_01: { position: [-1.5, 1.6, 10], lookAt: [-2, 1.5, 0] },
    COURTYARD_REVEAL_FOUNTAIN: { position: [-4.5, 1.6, 6], lookAt: [0, 1.4, 0] },
    COURTYARD_COMBAT_C1: { position: [-6, 1.6, 0], lookAt: [-6, 1.2, -7] },
    COURTYARD_MID_01: { position: [0, 1.6, -5], lookAt: [4, 1.5, -8] },
    COURTYARD_ANCHOR: { position: [4, 1.6, -3.5], lookAt: [7, 1.4, -8] },
    COURTYARD_EXIT_EAST_HALL: { position: [10, 1.6, -0.5], lookAt: [14, 2, 0] },

    EAST_HALL_ENTRY: { position: [15.5, 1.6, 0], lookAt: [25, 1.8, 0] },
    EAST_HALL_MID: { position: [24, 1.6, 0.3], lookAt: [32, 1.7, 0.4] },
    EAST_HALL_MIRA_STOP: { position: [29.5, 1.6, -0.4], lookAt: [32.5, 1.3, 1.6] },
    EAST_HALL_END: { position: [40, 1.6, 0], lookAt: [44, 2.2, 0] },
  },
  lookPoints: {
    ARRIVAL_CRYSTAL_LEFT: [-3.6, 2.2, 21.3],
    ARRIVAL_CRYSTAL_CENTRE: [0, 5.6, 21.3],
    ARRIVAL_CRYSTAL_RIGHT: [3.6, 2.2, 21.3],
    ACADEMY_TOWER_TOP: [0, 42, -60],
    COURTYARD_TRAINING_CIRCLE_WEST: [-6, 1.2, -7],
    COURTYARD_ANCHOR_POINT: [7, 1.6, -8],
    EAST_HALL_CHEST_POINT: [31, 0.6, -2],
  },
  beats: [
    // Arrival Gate
    { kind: 'loading-transition', id: 'arrival-opening-fade', areaId: 'arrival-gate', toNode: 'ARRIVAL_SKY_01', fadeOutSec: 0, holdSec: 0.3, fadeInSec: 1.5 },
    {
      kind: 'rail-travel', id: 'arrival-flyover', areaId: 'arrival-gate',
      nodes: ['ARRIVAL_SKY_01', 'ARRIVAL_SKY_02', 'ARRIVAL_GATE_APPROACH', 'ARRIVAL_GATE_PIP'],
      durationSec: 15, easing: 'easeInOutSine', reducedMotion: 'fade-cut',
    },
    {
      kind: 'camera-reveal', id: 'arrival-crystals-reveal', areaId: 'arrival-gate', atNode: 'ARRIVAL_GATE_PIP',
      lookTargets: ['ARRIVAL_CRYSTAL_LEFT', 'ARRIVAL_CRYSTAL_CENTRE', 'ARRIVAL_CRYSTAL_RIGHT'],
      panSec: 1.4, holdSec: 1, returnToNode: true,
    },
    {
      kind: 'rail-travel', id: 'arrival-gate-passage', areaId: 'arrival-gate',
      nodes: ['ARRIVAL_GATE_PIP', 'ARRIVAL_GATE_THRESHOLD', 'ARRIVAL_WARD_FRACTURE'],
      durationSec: 6, easing: 'easeInOutSine', reducedMotion: 'glide',
    },
    {
      kind: 'camera-reveal', id: 'arrival-ward-fracture', areaId: 'arrival-gate', atNode: 'ARRIVAL_WARD_FRACTURE',
      lookTargets: ['ACADEMY_TOWER_TOP'], panSec: 2.2, holdSec: 2, returnToNode: true,
    },

    // Sunlit Courtyard
    {
      kind: 'rail-travel', id: 'courtyard-entry', areaId: 'sunlit-courtyard',
      nodes: ['ARRIVAL_WARD_FRACTURE', 'COURTYARD_ENTRY_01', 'COURTYARD_REVEAL_FOUNTAIN'],
      durationSec: 7, easing: 'easeInOutSine', reducedMotion: 'fade-cut',
    },
    {
      kind: 'camera-reveal', id: 'courtyard-fountain-reveal', areaId: 'sunlit-courtyard', atNode: 'COURTYARD_REVEAL_FOUNTAIN',
      lookTargets: ['COURTYARD_TRAINING_CIRCLE_WEST', 'COURTYARD_ANCHOR_POINT'], panSec: 1.6, holdSec: 0.8, returnToNode: true,
    },
    {
      kind: 'rail-travel', id: 'courtyard-to-c1', areaId: 'sunlit-courtyard',
      nodes: ['COURTYARD_REVEAL_FOUNTAIN', 'COURTYARD_COMBAT_C1'],
      durationSec: 4, easing: 'easeInOutCubic', reducedMotion: 'glide',
    },
    { kind: 'camera-reveal', id: 'courtyard-c1-stop', areaId: 'sunlit-courtyard', atNode: 'COURTYARD_COMBAT_C1', lookTargets: [], panSec: 0, holdSec: 3, returnToNode: false },
    {
      kind: 'rail-travel', id: 'courtyard-to-anchor', areaId: 'sunlit-courtyard',
      nodes: ['COURTYARD_COMBAT_C1', 'COURTYARD_MID_01', 'COURTYARD_ANCHOR'],
      durationSec: 6, easing: 'easeInOutSine', reducedMotion: 'fade-cut',
    },
    { kind: 'camera-reveal', id: 'courtyard-anchor-stop', areaId: 'sunlit-courtyard', atNode: 'COURTYARD_ANCHOR', lookTargets: [], panSec: 0, holdSec: 3, returnToNode: false },
    {
      kind: 'rail-travel', id: 'courtyard-exit', areaId: 'sunlit-courtyard',
      nodes: ['COURTYARD_ANCHOR', 'COURTYARD_EXIT_EAST_HALL'],
      durationSec: 4, easing: 'easeInOutSine', reducedMotion: 'glide',
    },

    // East Hall (door fade doubles as the area-loading point)
    { kind: 'loading-transition', id: 'east-hall-door', areaId: 'east-hall', toNode: 'EAST_HALL_ENTRY', fadeOutSec: 0.6, holdSec: 0.4, fadeInSec: 0.8 },
    {
      kind: 'rail-travel', id: 'east-hall-walk', areaId: 'east-hall',
      nodes: ['EAST_HALL_ENTRY', 'EAST_HALL_MID', 'EAST_HALL_MIRA_STOP'],
      durationSec: 9, easing: 'easeInOutSine', reducedMotion: 'fade-cut',
    },
    {
      kind: 'camera-reveal', id: 'east-hall-mira-stop', areaId: 'east-hall', atNode: 'EAST_HALL_MIRA_STOP',
      lookTargets: ['EAST_HALL_CHEST_POINT'], panSec: 1.5, holdSec: 1.5, returnToNode: true,
    },
    {
      kind: 'rail-travel', id: 'east-hall-to-library', areaId: 'east-hall',
      nodes: ['EAST_HALL_MIRA_STOP', 'EAST_HALL_END'],
      durationSec: 6, easing: 'easeInOutSine', reducedMotion: 'fade-cut',
    },
    { kind: 'camera-reveal', id: 'east-hall-library-doors', areaId: 'east-hall', atNode: 'EAST_HALL_END', lookTargets: [], panSec: 0, holdSec: 2.5, returnToNode: false },
  ],
};

export function beatIndexOf(beatId: string): number {
  return LEVEL1_ROUTE.beats.findIndex((b) => b.id === beatId);
}
