/**
 * LEVEL1_DESIGN LD-0 East Hall (replaces LD-10): the Book Stampede. Mira bursts out of an alcove
 * chased by runaway books; the camera wheels round and runs backwards down the corridor while books
 * swoop in; the chest is an optional speed round; Pip's ward stops the stampede with a crash.
 * Corridor from the courtyard door (x = 14) to the library doors (x = 44), z ∈ [-2.5, 2.5].
 */
import type { TargetSpawn } from '../levelTypes';
import { checkpoint, fade, fight, len, marker, reveal, target, travel, type AreaScript } from './builders';

const A = 'east-hall';

/** Where Mira bursts out of the alcove, and where she holds the line at the end. */
export const MIRA_EAST_HALL_POSITION = [20.6, 0, 1.4] as const;
export const MIRA_EAST_HALL_END = [41, 0, 1.3] as const;
export const CHEST_POSITION = [31, 0, -2] as const;

const COVERS = ['red', 'blue', 'green'] as const;

/** A runaway book swooping at the camera during the stampede (never damages; flies off if ignored). */
const runaway = (id: string, side: number, up: number, i: number): TargetSpawn =>
  target(id, 'book', [0, 0, 0], [len(3, 4)], {
    follow: { ahead: 4.2, side, up },
    leaveAfterSec: 4.5,
    labelHeight: 0.45,
    variant: COVERS[i % COVERS.length],
    defeatFx: { kind: 'debris', scale: 0.4, color: '#e8dcc0' },
  });

const stompBooks = { kind: 'debris', scale: 1.6, color: '#7a2f2a' } as const;

export const eastHall: AreaScript = {
  nodes: {
    EAST_HALL_ENTRY: { position: [15.5, 1.6, 0], lookAt: [25, 1.8, 0] },
    EAST_HALL_RUN_A: { position: [19, 1.6, -0.7], lookAt: [27, 1.7, 0] },
    // The turn swings the view across the side wall, never through the camera.
    EAST_HALL_RUN_TURN: { position: [23, 1.6, -0.7], lookAt: [24, 1.7, 7] },
    EAST_HALL_RUN_B: { position: [27, 1.6, -0.5], lookAt: [17, 1.5, 0] },
    EAST_HALL_CHEST_STOP: { position: [33, 1.6, 0.4], lookAt: [24, 1.2, -0.8] },
    EAST_HALL_RUN_D: { position: [39.5, 1.6, 0.2], lookAt: [30, 1.5, 0] },
    // Unused by the stampede, kept for the rail gizmos and older saves.
    EAST_HALL_MID: { position: [24, 1.6, 0.3], lookAt: [32, 1.7, 0.4] },
    EAST_HALL_END: { position: [40, 1.6, 0], lookAt: [44, 2.2, 0] },
  },
  lookPoints: {
    EAST_HALL_MIRA_POINT: [20.6, 1.4, 1.4],
    EAST_HALL_ALCOVE: [21, 1.4, 2.3],
    EAST_HALL_CHEST_POINT: [31, 0.6, -2],
    EAST_HALL_WARD_LINE: [36.5, 1.5, 0],
  },
  beats: [
    fade('east-hall-door', A, 'EAST_HALL_ENTRY', { music: 'courtyard-action' }),
    // Mira crashes out of an alcove in a spray of books.
    reveal('east-hall-mira-burst', A, 'EAST_HALL_ENTRY', ['EAST_HALL_MIRA_POINT'], 0.6, 5, {
      barks: ['east-1'],
      attention: 'spectacle',
      fx: [
        { kind: 'debris', at: 'EAST_HALL_ALCOVE', atBeat: 0.05, scale: 1.2, color: '#6e4a2c' },
        { kind: 'debris', at: 'EAST_HALL_ALCOVE', atBeat: 0.1, scale: 1.4, color: '#7a2f2a' },
        { kind: 'dust', at: 'EAST_HALL_ALCOVE', atBeat: 0.05, scale: 1.4 },
        { kind: 'shake', atBeat: 0.05 },
      ],
    }),
    // Fast-rail set piece: wheel round and run backwards while the books swoop in.
    // Mira's question and Pip's joke; her answer opens the chest fight, so the three stay together.
    travel('east-hall-stampede', A, ['EAST_HALL_ENTRY', 'EAST_HALL_RUN_A', 'EAST_HALL_RUN_TURN', 'EAST_HALL_RUN_B', 'EAST_HALL_CHEST_STOP'], 12, {
      barks: ['east-run-1', 'east-run-2'],
      easing: 'easeInOutSine',
      chase: [
        { at: 0.34, target: runaway('stampede-1', -0.9, 0.15, 0) },
        { at: 0.5, target: runaway('stampede-2', 0.95, -0.1, 1) },
        { at: 0.66, target: runaway('stampede-3', -0.6, -0.25, 2) },
        { at: 0.8, target: runaway('stampede-4', 0.7, 0.3, 3) },
      ],
    }),
    // Speed round: the chest's words in eight seconds burst it open.
    fight('east-hall-chest', A, { barks: ['east-run-3', 'east-chest'] }),
    travel('east-hall-stampede-2', A, ['EAST_HALL_CHEST_STOP', 'EAST_HALL_RUN_D'], 7, {
      chase: [
        { at: 0.1, target: runaway('stampede-5', 0.9, 0.1, 4) },
        { at: 0.45, target: runaway('stampede-6', -0.9, -0.15, 5) },
      ],
    }),
    // Pip throws up a ward: the stampede smashes into it.
    reveal('east-hall-slam', A, 'EAST_HALL_RUN_D', ['EAST_HALL_WARD_LINE'], 0.3, 4.5, {
      barks: ['east-6'],
      attention: 'spectacle',
      fx: [
        { kind: 'shockwave', at: 'EAST_HALL_WARD_LINE', scale: 0.35, color: '#9fd8ff' },
        { kind: 'burst', at: 'EAST_HALL_WARD_LINE', scale: 1.6, color: '#bfe6ff' },
        { ...stompBooks, at: 'EAST_HALL_WARD_LINE' },
        { kind: 'shake', scale: 1.3 },
        { ...stompBooks, at: 'EAST_HALL_WARD_LINE', atBeat: 0.25, scale: 1 },
        { kind: 'dust', at: 'EAST_HALL_WARD_LINE', atBeat: 0.3, scale: 1.2 },
      ],
    }),
    checkpoint('east-hall-checkpoint', A, 'east-hall-complete'),
  ],
  encounters: [
    {
      id: 'east-hall-chest',
      areaId: A,
      kind: 'interaction',
      optionalPrompt: 'chest',
      speedRound: { sec: 8 },
      waves: [
        {
          id: 'lock',
          sequential: true,
          targets: [
            marker('chest-lock-1', [31, 0.75, -2], 'lock', { labelHeight: 0.35 }),
            marker('chest-lock-2', [31, 0.75, -2], 'key', { labelHeight: 0.35 }),
            marker('chest-lock-3', [31, 0.75, -2], 'open', { labelHeight: 0.35 }),
          ],
        },
      ],
      barks: [{ when: { on: 'complete' }, line: 'east-chest-done' }],
      onComplete: { reward: { cosmetic: 'trail-starlight' }, flags: ['chest-open'] },
      completeFx: [
        { kind: 'burst', at: 'EAST_HALL_CHEST_POINT', scale: 1.6, color: '#ffd88a' },
        { kind: 'sparks', at: 'EAST_HALL_CHEST_POINT', scale: 1.2 },
      ],
    },
  ],
};
