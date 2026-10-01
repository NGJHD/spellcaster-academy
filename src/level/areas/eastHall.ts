/** LD-10: East Hall corridor from the courtyard door (x = 14) to the library doors (x = 44). */
import { checkpoint, fade, fight, marker, reveal, talk, travel, type AreaScript } from './builders';

const A = 'east-hall';

export const MIRA_EAST_HALL_POSITION = [32.5, 0, 1.6] as const;
export const CHEST_POSITION = [31, 0, -2] as const;

export const eastHall: AreaScript = {
  nodes: {
    EAST_HALL_ENTRY: { position: [15.5, 1.6, 0], lookAt: [25, 1.8, 0] },
    EAST_HALL_MID: { position: [24, 1.6, 0.3], lookAt: [32, 1.7, 0.4] },
    EAST_HALL_MIRA_STOP: { position: [29.2, 1.6, -0.4], lookAt: [32.5, 1.45, 1.6] },
    EAST_HALL_CHEST_VIEW: { position: [29.2, 1.6, -0.4], lookAt: [31, 0.6, -2] },
    EAST_HALL_END: { position: [40, 1.6, 0], lookAt: [44, 2.2, 0] },
  },
  lookPoints: {
    EAST_HALL_CHEST_POINT: [31, 0.6, -2],
    EAST_HALL_MIRA_POINT: [32.5, 1.45, 1.6],
  },
  beats: [
    fade('east-hall-door', A, 'EAST_HALL_ENTRY', { music: 'east-hall-calm' }),
    travel('east-hall-walk', A, ['EAST_HALL_ENTRY', 'EAST_HALL_MID', 'EAST_HALL_MIRA_STOP'], 9),
    talk('east-hall-mira', A, ['east-1', 'east-2', 'east-3', 'east-4', 'east-5']),
    reveal('east-hall-chest-reveal', A, 'EAST_HALL_MIRA_STOP', ['EAST_HALL_CHEST_POINT'], 1.4, 0.4, {
      returnToNode: false,
      barks: ['east-chest'],
    }),
    fight('east-hall-chest', A),
    reveal('east-hall-chest-return', A, 'EAST_HALL_CHEST_VIEW', ['EAST_HALL_MIRA_POINT'], 1.2, 0.2, { returnToNode: false }),
    talk('east-hall-mira-2', A, ['east-6', 'east-7', 'east-8']),
    checkpoint('east-hall-checkpoint', A, 'east-hall-complete'),
    travel('east-hall-to-library', A, ['EAST_HALL_MIRA_STOP', 'EAST_HALL_END'], 6),
  ],
  encounters: [
    {
      id: 'east-hall-chest',
      areaId: A,
      kind: 'interaction',
      optionalPrompt: 'chest',
      waves: [{ id: 'lock', targets: [marker('chest-lock', [31, 0.7, -2], 'open', { labelHeight: 0.35 })] }],
      barks: [{ when: { on: 'complete' }, line: 'east-chest-done' }],
      onComplete: { reward: { cosmetic: 'trail-starlight' }, flags: ['chest-open'] },
    },
  ],
};
