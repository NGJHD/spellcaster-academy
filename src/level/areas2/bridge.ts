/**
 * LEVEL2_DESIGN L2-9: the Bell Bridge and Beacon 1. A long covered bridge over a gorge, on fire. The
 * camera races along it while sections collapse into the gorge just behind (scripted, never a catch);
 * burning planks ahead need restore words. Moths swarm the belfry; three words swing the great bell,
 * and its boom blasts every moth away and sends a gold beam into the sky.
 * Local layout (origin BRIDGE_ORIGIN): deck along −Z from z = 10 to z = −64, x ∈ [−2.6, 2.6], y = 0;
 * the gorge floor far below; the belfry at z = −50.
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, marker, origin, travel, type AreaScript } from '../areas/builders';
import type { EncounterDef, FxCue } from '../levelTypes';
import { fireball, moth, restore } from './hush';

const A = 'l2-bell-bridge';
// Far from the lawn (x 900): the lawn stays mounted for a moment after we leave it, and its lake showed
// as water round the bridge (owner, 2026-10-16).
export const BRIDGE_ORIGIN: Vec3 = [1000, 0, -700];
const B = origin(BRIDGE_ORIGIN);
export const BELL_POSITION: Vec3 = B(0, 7.2, -50);
export const PLANK_GAPS: readonly number[] = [-12, -24, -36];

/** The bridge collapses into the gorge right behind the camera. */
const collapse = (z: number): FxCue[] => [
  { kind: 'debris', at: B(0, 0, z), atBeat: 0.5, scale: 2.2, color: '#5a3a24' },
  { kind: 'dust', at: B(0, 0, z), atBeat: 0.5, scale: 2 },
  { kind: 'burst', at: B(0, 0.5, z), atBeat: 0.5, scale: 1.2, color: '#ff5a1a' },
  { kind: 'shake', atBeat: 0.5, scale: 0.9 },
];

const plank = (n: number, word: string): EncounterDef => ({
  id: `l2-plank-${n}`,
  areaId: A,
  kind: 'interaction',
  waves: [{ id: 'plank', targets: [restore(`plank-${n}`, B(0, 0.4, (PLANK_GAPS[n - 1] ?? -12) - 1.2), word, `l2-plank-${n}`)] }],
});

export const bridge: AreaScript = {
  nodes: {
    BR_START: { position: B(0, 1.6, 9), lookAt: B(0, 1.8, -10) },
    BR_P1: { position: B(0, 1.6, (PLANK_GAPS[0] ?? -12) + 3), lookAt: B(0, 0.6, -16) },
    BR_P2: { position: B(0, 1.6, (PLANK_GAPS[1] ?? -24) + 3), lookAt: B(0, 0.6, -28) },
    BR_P3: { position: B(0, 1.6, (PLANK_GAPS[2] ?? -36) + 3), lookAt: B(0, 0.6, -40) },
    BR_BELFRY: { position: B(0, 1.6, -42), lookAt: B(0, 5.5, -50) },
    BR_END: { position: B(0, 1.6, -60), lookAt: B(0, 2, -70) },
  },
  lookPoints: {
    BR_BELL: BELL_POSITION,
    BR_SKY: B(0, 60, -50),
  },
  beats: [
    fade('l2-bridge-enter', A, 'BR_START', { music: 'siege-battle', objective: 'l2-bell', barks: ['l2-bridge-1'] }),
    travel('l2-bridge-run-1', A, ['BR_START', 'BR_P1'], 4, { easing: 'easeInOutCubic', fx: collapse(6) }),
    fight('l2-plank-1', A),
    travel('l2-bridge-run-2', A, ['BR_P1', 'BR_P2'], 3.5, { easing: 'easeInOutCubic', fx: collapse((PLANK_GAPS[0] ?? -12) + 1) }),
    fight('l2-plank-2', A),
    travel('l2-bridge-run-3', A, ['BR_P2', 'BR_P3'], 3.5, { easing: 'easeInOutCubic', fx: collapse((PLANK_GAPS[1] ?? -24) + 1), barks: ['l2-bridge-2'] }),
    fight('l2-plank-3', A),
    travel('l2-bridge-to-belfry', A, ['BR_P3', 'BR_BELFRY'], 3, { fx: collapse((PLANK_GAPS[2] ?? -36) + 1) }),
    fight('l2-belfry', A, { barks: ['l2-belfry'] }),
    fight('l2-bell-beacon', A, { barks: ['l2-bell-intro'] }),
    checkpoint('l2-bridge-checkpoint', A, 'bell-beacon-lit', { barks: ['l2-bell-lit'], objective: 'l2-hall' }),
    travel('l2-bridge-exit', A, ['BR_BELFRY', 'BR_END'], 4, { barks: ['l2-to-hall'], journey: 'l2-hall' }),
  ],
  encounters: [
    plank(1, 'plank'),
    plank(2, 'beam'),
    plank(3, 'rail'),
    {
      id: 'l2-belfry',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'swarm-1',
          targets: [
            moth('belfry-moth-1', [B(-4, 5, -50), B(4, 6, -48)]),
            moth('belfry-moth-2', [B(4, 4, -52), B(-3, 5.5, -47)], { delaySec: 0.8 }),
          ],
        },
        {
          id: 'swarm-2',
          targets: [
            moth('belfry-moth-3', [B(-5, 6, -49), B(3, 4.5, -46)]),
            moth('belfry-moth-4', [B(5, 5, -51), B(-4, 6.5, -48)], { delaySec: 0.6 }),
            fireball('belfry-dust', B(0, 6, -49), B(0, 1.7, -43.4), { delaySec: 1.8 }),
          ],
        },
      ],
    },
    {
      id: 'l2-bell-beacon',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'bell',
          sequential: true,
          targets: ['ring', 'bright', 'signal'].map((word, i) =>
            marker(`bell-word-${i + 1}`, B(0, 5.2 + i * 0.5, -50), word, { labelHeight: 0.4, defeatFx: { kind: 'shockwave', at: 'BR_BELL', scale: 0.4 + i * 0.3, color: '#ffd27a' } }),
          ),
        },
      ],
      onComplete: { flags: ['l2-beacon-bell'] },
      // The bell booms: a huge shock wave and a gold beam into the sky.
      completeFx: [
        { kind: 'flash' },
        { kind: 'shockwave', at: 'BR_BELL', scale: 4, color: '#ffd27a' },
        { kind: 'pillar', at: 'BR_BELL', scale: 2, color: '#ffd27a' },
        { kind: 'shake', scale: 2 },
      ],
    },
  ],
};
