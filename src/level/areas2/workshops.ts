/**
 * LEVEL2_DESIGN L2-11: the Alchemy Workshops and Beacon 2. Copper stills, glass alembics and the great
 * furnace (choked with grey ash, inkfire along the pipes). Smudgehounds dart between benches; an
 * optional valve speed round; four words roar the furnace back to life and unlock Starfall, then a
 * wave of easy Blotlings to feel its power. Local layout (origin WORKSHOP_ORIGIN): x ∈ [−11, 11],
 * z ∈ [−30, 6]; benches in two rows; the furnace at (0, 0, −27).
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, marker, origin, powerWave, reveal, travel, type AreaScript } from '../areas/builders';
import { fireball, hound } from './hush';

const A = 'l2-workshops';
export const WORKSHOP_ORIGIN: Vec3 = [1200, 0, 0];
const K = origin(WORKSHOP_ORIGIN);
export const FURNACE_POSITION: Vec3 = K(0, 0, -27);

export const workshops: AreaScript = {
  nodes: {
    WS_ENTRY: { position: K(0, 1.6, 4), lookAt: K(0, 2, -16) },
    WS_BENCHES: { position: K(0, 1.6, -6), lookAt: K(0, 1.4, -18) },
    WS_FURNACE: { position: K(0, 1.6, -15), lookAt: K(0, 2.6, -27) },
  },
  lookPoints: {
    WS_FURNACE_MOUTH: K(0, 2.2, -26),
    WS_FURNACE_TOP: K(0, 9, -27),
    WS_VALVES: K(-6, 2.4, -20),
  },
  beats: [
    fade('l2-ws-enter', A, 'WS_ENTRY', { music: 'siege-dread', objective: 'l2-furnace', barks: ['l2-ws-1'] }),
    travel('l2-ws-to-benches', A, ['WS_ENTRY', 'WS_BENCHES'], 3.5),
    fight('l2-ws-hounds', A, { music: 'siege-battle', barks: ['l2-ws-hounds'] }),
    travel('l2-ws-to-furnace', A, ['WS_BENCHES', 'WS_FURNACE'], 3),
    fight('l2-ws-valves', A, { barks: ['l2-ws-valves'] }),
    fight('l2-furnace-beacon', A, { barks: ['l2-furnace-intro'] }),
    reveal('l2-furnace-roar', A, 'WS_FURNACE', ['WS_FURNACE_TOP'], 0.8, 0.8, { attention: 'spectacle' }),
    fight('l2-starfall-wave', A, { barks: ['l2-starfall-try'] }),
    checkpoint('l2-ws-checkpoint', A, 'furnace-beacon-lit', { objective: 'l2-lake' }),
  ],
  encounters: [
    {
      id: 'l2-ws-hounds',
      areaId: A,
      kind: 'combat',
      waves: [
        { id: 'hound-1', targets: [hound('ws-hound-1', [K(-9, 0, -22), K(-4, 0, -14), K(-1, 0, -8.6)])] },
        {
          id: 'hound-2',
          targets: [
            hound('ws-hound-2', [K(9, 0, -24), K(4, 0, -15), K(1.2, 0, -8.6)]),
            fireball('ws-spark', K(6, 2.2, -20), K(0.6, 1.7, -4.6), { delaySec: 1.2 }),
            hound('ws-hound-3', [K(-8, 0, -26), K(-5, 0, -16), K(-1.4, 0, -8.8)], { delaySec: 2.2, priority: false }),
          ],
        },
      ],
    },
    {
      id: 'l2-ws-valves',
      areaId: A,
      kind: 'interaction',
      optionalPrompt: 'l2-valves',
      speedRound: { sec: 8 },
      waves: [
        {
          id: 'valves',
          sequential: true,
          targets: ['copper', 'steam', 'spark'].map((word, i) =>
            marker(`valve-${i + 1}`, K(-6 + i * 0.9, 2.4 - i * 0.2, -20), word, { labelHeight: 0.3, defeatFx: { kind: 'geyser', scale: 0.5, color: '#d8e4f0' } }),
          ),
        },
      ],
    },
    {
      id: 'l2-furnace-beacon',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'furnace',
          sequential: true,
          targets: ['ember', 'flame', 'forge', 'blaze'].map((word, i) =>
            marker(`furnace-word-${i + 1}`, K(0, 1.6 + i * 0.45, -25.6), word, { labelHeight: 0.35, defeatFx: { kind: 'burst', scale: 0.8 + i * 0.3, color: '#ffa040' } }),
          ),
        },
      ],
      onComplete: { flags: ['l2-beacon-furnace'], unlockSpell: 'starfall' },
      completeFx: [
        { kind: 'flash' },
        { kind: 'shockwave', at: 'WS_FURNACE_MOUTH', scale: 1.6, color: '#ffa040' },
        { kind: 'pillar', at: 'WS_FURNACE_MOUTH', scale: 1.5, color: '#ffd27a' },
        { kind: 'shake', scale: 1.4 },
      ],
    },
    // First use of Starfall: six easy Blotlings pour in.
    powerWave(
      'l2-starfall-wave',
      A,
      'blotling',
      [
        [
          { path: [K(-9, 0, -28), K(-6, 0, -24), K(-4.2, 0, -22)] },
          { path: [K(9, 0, -28), K(6, 0, -24), K(4.2, 0, -22)] },
          { path: [K(0, 0, -30), K(0, 0, -26), K(0, 0, -24.5)] },
        ],
        [
          { path: [K(-10, 0, -22), K(-7, 0, -22), K(-5, 0, -20.5)] },
          { path: [K(10, 0, -22), K(7, 0, -22), K(5, 0, -20.5)] },
          { path: [K(-3, 0, -30), K(-2, 0, -26), K(-1.8, 0, -25)] },
        ],
      ],
      { labelHeight: 1.0, entrance: { kind: 'geyser', scale: 0.4, color: '#1a1414' }, defeatFx: { kind: 'burst', scale: 0.9, color: '#ff7a2a' } },
    ),
  ],
};
