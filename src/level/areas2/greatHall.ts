/**
 * LEVEL2_DESIGN L2-10: the Great Hall. Students shelter behind Prefect Idris's barrier at the far end;
 * the Hush push through three side doors (lanes). Then the Grey Herald blasts the main doors open and
 * reads the Unwriter's decree. Local layout (origin HALL_ORIGIN): hall along −Z from z = 6 to z = −46,
 * x ∈ [−9, 9]; lane doors on the west wall (x = −9) at z = −4, −12, −20, each midway between two
 * columns (owner, 2026-10-16: a door stood in front of a pillar); the barrier at z = −26; the Herald
 * comes in from the east doors at x = 9, z = −20.
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, hold, len, marker, origin, reveal, target, travel, type AreaScript } from '../areas/builders';
import { blotling, fireball, knight, scribbleImp } from './hush';

const A = 'l2-great-hall';
export const HALL_ORIGIN: Vec3 = [1100, 0, 0];
const H = origin(HALL_ORIGIN);
export const LANE_DOORS: readonly Vec3[] = [H(-9, 0, -4), H(-9, 0, -12), H(-9, 0, -20)];
export const HERALD_POSITION: Vec3 = H(2, 0, -24);
const HERALD_CHEST = H(2, 2.4, -24);
/**
 * Where its wisps gather before they rush the player (at the hand it points with; the scene's
 * HeraldWisps), and the open book in its other hand (grey_herald.glb at 1.5×, turned −0.4 rad).
 */
const HERALD_WISPS = H(2.2, 3.4, -22.9);
const HERALD_BOOK = H(0.7, 3.4, -24);

/** From a lane door to the barricade line in front of the camera. */
const lane = (n: 0 | 1 | 2, x = 0): Vec3[] => {
  const door = LANE_DOORS[n] ?? H(-9, 0, -16);
  return [door, H(-5, 0, door[2] - HALL_ORIGIN[2] + 1), H(-1.5 + x, 0, -8 + n * -0.6)];
};

export const greatHall: AreaScript = {
  nodes: {
    HALL_ENTRY: { position: H(0, 1.6, 4), lookAt: H(0, 2, -20) },
    HALL_POST: { position: H(1.5, 1.6, -2), lookAt: H(-4, 1.4, -16) },
    HALL_HERALD: { position: H(-1, 1.6, -6), lookAt: H(2, 2.6, -24) },
  },
  lookPoints: {
    HALL_EAST_DOORS: H(9, 2.4, -20),
    HALL_HERALD_HEAD: H(2, 3.1, -24),
    HALL_HERALD_FLOOR: H(2, 0.1, -24),
    HALL_BARRIER: H(0, 2, -26),
  },
  beats: [
    fade('l2-hall-enter', A, 'HALL_ENTRY', { music: 'evacuation-hope', objective: 'l2-hall' }),
    travel('l2-hall-to-post', A, ['HALL_ENTRY', 'HALL_POST'], 3.5, { barks: ['l2-idris-1'] }),
    fight('l2-hall-lanes', A, { music: 'siege-battle', barks: ['l2-lanes'] }),
    fight('l2-hall-knights', A, { barks: ['l2-knights'] }),
    travel('l2-hall-to-herald', A, ['HALL_POST', 'HALL_HERALD'], 2, { barks: ['l2-hall-rumble'] }),
    // Boss intro: the Herald blasts the east doors open and stalks in; the Voice speaks through it.
    // Owner (2026-10-16): a long silence followed the Voice's line; the reveal now ends as it finishes.
    reveal('l2-herald-enters', A, 'HALL_HERALD', ['HALL_EAST_DOORS', 'HALL_HERALD_HEAD'], 0.8, 1.6, {
      attention: 'boss-intro',
      music: 'siege-battle',
      barks: ['l2-voice-herald'],
      objective: 'l2-herald',
      fx: [
        { kind: 'shockwave', at: 'HALL_EAST_DOORS', atBeat: 0.08, scale: 1.4, color: '#ff5a1a' },
        { kind: 'debris', at: 'HALL_EAST_DOORS', atBeat: 0.08, scale: 2.4, color: '#4a3020' },
        { kind: 'flash', atBeat: 0.08 },
        { kind: 'shake', atBeat: 0.08, scale: 1.8 },
        { kind: 'dust', at: 'HALL_HERALD_FLOOR', atBeat: 0.5, scale: 2 },
      ],
    }),
    fight('l2-herald-1', A, { barks: ['l2-herald-rude'] }),
    fight('l2-herald-2', A, { barks: ['l2-herald-trumpet'] }),
    fight('l2-herald-3', A, { barks: ['l2-herald-last'] }),
    checkpoint('l2-hall-checkpoint', A, 'great-hall-held', { barks: ['l2-idris-2'], objective: 'l2-furnace' }),
    hold('l2-hall-exit', A, 'HALL_HERALD', 2.5, { barks: ['l2-to-workshops'], journey: 'l2-workshops' }),
  ],
  encounters: [
    {
      id: 'l2-hall-lanes',
      areaId: A,
      kind: 'combat',
      waves: [
        { id: 'lane-1', targets: [blotling('hall-b1', lane(0)), scribbleImp('hall-i1', lane(1, 1), { delaySec: 0.8 })] },
        { id: 'lane-2', targets: [blotling('hall-b2', lane(2, -1)), blotling('hall-b3', lane(0, 1), { delaySec: 0.6 }), scribbleImp('hall-i2', lane(1), { delaySec: 1.4 })] },
        {
          id: 'lane-3',
          targets: [
            blotling('hall-b4', lane(1, -1)),
            scribbleImp('hall-i3', lane(2, 1), { delaySec: 0.5, priority: true }),
            fireball('hall-ink', H(-8, 1.4, -12), H(1.2, 1.7, -3.4), { delaySec: 1.4 }),
            blotling('hall-b5', lane(0, -1), { delaySec: 2 }),
          ],
        },
      ],
    },
    {
      id: 'l2-hall-knights',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'knights',
          targets: [
            knight('hall-k1', [H(-9, 0, -12), H(-4, 0, -12), H(-1.6, 0, -8)]),
            knight('hall-k2', [H(-9, 0, -20), H(-3, 0, -18), H(1.2, 0, -9)], undefined, { delaySec: 1.2 }),
          ],
        },
      ],
    },
    {
      id: 'l2-herald-1',
      areaId: A,
      kind: 'combat',
      bossPhase: 'herald-decree',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'decree',
          sequential: true,
          targets: [0, 1, 2, 3].map((i) =>
            marker(`decree-${i + 1}`, H(2 + (i - 1.5) * 0.5, 3.2 - i * 0.35, -23.4), len(4, 6), {
              labelHeight: 0.3,
              defeatFx: { kind: 'burst', scale: 1, color: '#ff8a3a' },
            }),
          ),
        },
      ],
      hazard: { attacks: ['pulse'], firstDelaySec: 6, intervalSec: 9, windupSec: 1.8, damage: 10 },
    },
    {
      id: 'l2-herald-2',
      areaId: A,
      kind: 'combat',
      bossPhase: 'herald-trumpet',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'blasts-1',
          targets: [
            fireball('blast-1', HERALD_WISPS, H(-0.6, 1.7, -4.4)),
            scribbleImp('herald-imp-1', [H(4, 0, -22), H(1, 0, -12), H(0, 0, -7.6)], { delaySec: 0.6 }),
            scribbleImp('herald-imp-2', [H(0, 0, -22), H(-2, 0, -12), H(-1.6, 0, -7.6)], { delaySec: 1.2 }),
          ],
        },
        {
          id: 'blasts-2',
          targets: [
            fireball('blast-2', HERALD_WISPS, H(-1.4, 1.6, -4.6)),
            fireball('blast-3', HERALD_WISPS, H(-0.4, 1.8, -4.4), { delaySec: 1.6 }),
            target('herald-horn', 'marker', HERALD_BOOK, [len(5, 6)], { labelHeight: 0.3, defeatFx: { kind: 'shockwave', scale: 0.8, color: '#ffd27a' } }),
          ],
        },
      ],
    },
    {
      id: 'l2-herald-3',
      areaId: A,
      kind: 'interaction',
      bossPhase: 'herald-last-word',
      beam: { to: HERALD_CHEST, color: '#ff4a1a' },
      waves: [
        {
          id: 'last-word',
          targets: [target('herald-phrase', 'marker', H(2, 3.4, -23.6), ['not', 'on', 'my', 'watch'], { labelHeight: 0.5, phrase: true })],
        },
      ],
      onComplete: { flags: ['l2-herald-gone'] },
      // It bursts into a pillar of sparks and ash; its book falls shut on the floor.
      completeFx: [
        { kind: 'flash' },
        { kind: 'pillar', at: 'HALL_HERALD_FLOOR', scale: 1.6, color: '#ff7a2a' },
        { kind: 'burst', at: 'HALL_HERALD_HEAD', scale: 3, color: '#ff8a3a' },
        { kind: 'dust', at: 'HALL_HERALD_FLOOR', scale: 2.4, color: '#3a3330' },
        { kind: 'shake', scale: 1.6 },
      ],
    },
  ],
};
