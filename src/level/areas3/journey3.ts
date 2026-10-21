/**
 * LEVEL3_DESIGN L3-12 … L3-14.
 * - Paper Sea (origin SEA_ORIGIN): Mira's paper ship sails along −Z; three black-sailed galleons at
 *   z ≈ −100 (x = −14, 0, 14); a firestorm at z ≈ −160; the Citadel looms ahead.
 * - The Forge of Unwriting (origin FORGE_ORIGIN): three production lines (lanes) at x = −8, 0, 8,
 *   each with three levers at z = −14; moulds and hammers beyond.
 * - The Cinder Citadel (origin CITADEL_ORIGIN): four burned-away flights written in by path words,
 *   8 m up and 12 m along −Z each; a wall of fire races up behind; the great doors at the top.
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, reveal, target, travel, type AreaScript } from '../areas/builders';
import { blotling, hound, knight } from '../areas2/hush';
import type { EncounterDef } from '../levelTypes';
import { colour, correctionMoth, fireTide, fireball, foreman, pathWord, redactor } from './blank';
import { CITADEL_FAR } from './journey1';

const P = 'l3-paper-sea';
const K = 'l3-forge';
const T = 'l3-citadel';
export const SEA_ORIGIN: Vec3 = [2500, 0, 0];
export const FORGE_ORIGIN: Vec3 = [2600, 0, 0];
export const CITADEL_ORIGIN: Vec3 = [2700, 0, 0];
const S = origin(SEA_ORIGIN);
const F = origin(FORGE_ORIGIN);
const C = origin(CITADEL_ORIGIN);
export const SHIP_BEATS = ['l3-ps-enter', 'l3-ps-sail-1', 'l3-ps-to-fleet', 'l3-ps-galleons', 'l3-ps-to-storm', 'l3-ps-storm', 'l3-ps-to-end', 'l3-citadel-looms'] as const;
export const GALLEONS: readonly Vec3[] = [S(-16, 0, -112), S(0, 0, -124), S(16, 0, -112)];
export const FORGE_LINES = [-8, 0, 8] as const;
export const FLIGHTS = [0, 1, 2, 3].map((i) => C(0, i * 8, -i * 12));
/**
 * Where a flight's written chunk `i` (0–2) sits, relative to its flight base. Owner (2026-10-16): the
 * stairs ended under the landings; each flight now climbs right up to the front edge of its landing.
 */
export const flightChunk = (i: number): { dy: number; dz: number } => ({ dy: 1 + i * 2.4, dz: 0.6 - i * 3 });

/** A colour target streaming past the ship (paper islands, a lighthouse, a whale outline). */
const streaming = (id: string, side: number, word = len(3, 4)) => colour(id, S(0, 0, 0), word, `l3-${id}`, { follow: { ahead: 4.6, side, up: 0.1 }, leaveAfterSec: 5 });

/** A galleon's mast: two words bring it down in flames. */
const mast = (id: string, at: Vec3) => target(id, 'marker', at, [len(5, 6), len(5, 6)], { labelHeight: 0.5, defeatFlag: `l3-${id}-down`, defeatFx: { kind: 'debris', scale: 2.2, color: '#1a1414' } });

export const sea: AreaScript = {
  nodes: {
    PS_START: { position: S(0, 2.4, 40), lookAt: S(0, 0.6, 0) },
    PS_MID: { position: S(0, 2.4, -40), lookAt: S(0, 0.6, -90) },
    PS_FLEET: { position: S(0, 2.4, -84), lookAt: S(0, 6, -118) },
    // Through the gap between the middle and right-hand galleons, not through their hulls (owner: "how
    // did we sail through the ships?"). Hulls run along z, about 5 m wide, at x −16, 0 and 16.
    PS_GAP_IN: { position: S(8.5, 2.4, -102), lookAt: S(8.5, 2.4, -140) },
    PS_GAP_OUT: { position: S(8.5, 2.4, -138), lookAt: S(2, 3, -170) },
    PS_STORM: { position: S(0, 2.4, -150), lookAt: S(0, 4, -190) },
    PS_END: { position: S(0, 2.4, -210), lookAt: S(0, 8, -260) },
  },
  lookPoints: {
    PS_CITADEL: CITADEL_FAR,
    PS_FLEET_MID: S(0, 8, -124),
  },
  beats: [
    fade('l3-ps-enter', P, 'PS_START', { music: 'blank-wander', objective: 'l3-sea', barks: ['l3-mira-ship'] }),
    travel('l3-ps-sail-1', P, ['PS_START', 'PS_MID'], 10, {
      barks: ['l3-sea-1'],
      chase: [
        { at: 0.1, target: streaming('island', -1.3) },
        { at: 0.3, target: correctionMoth('sail-moth-1', [S(0, 0, 0)], { follow: { ahead: 4.6, side: 1.1, up: 1 }, movement: { kind: 'static' }, leaveAfterSec: 5 }) },
        { at: 0.5, target: streaming('lighthouse', 1.3) },
        { at: 0.72, target: streaming('whale', -1.2, 'whale') },
      ],
    }),
    travel('l3-ps-to-fleet', P, ['PS_MID', 'PS_FLEET'], 4, { music: 'citadel-battle', barks: ['l3-fleet'] }),
    fight('l3-ps-galleons', P),
    travel('l3-ps-to-storm', P, ['PS_FLEET', 'PS_GAP_IN', 'PS_GAP_OUT', 'PS_STORM'], 7, { fx: [{ kind: 'lightning', at: 'PS_FLEET_MID', atBeat: 0.6 }] }),
    fight('l3-ps-storm', P, { barks: ['l3-storm'] }),
    travel('l3-ps-to-end', P, ['PS_STORM', 'PS_END'], 5),
    // Holds on the Citadel until Pip has said it (it was said inside the forge).
    reveal('l3-citadel-looms', P, 'PS_END', ['PS_CITADEL'], 1, 1.5, { barks: ['l3-citadel-looms'] }),
    checkpoint('l3-ps-checkpoint', P, 'paper-sea-crossed', { objective: 'l3-forge' }),
  ],
  encounters: [
    {
      id: 'l3-ps-galleons',
      areaId: P,
      kind: 'combat',
      waves: GALLEONS.map((g, i) => ({
        id: `galleon-${i + 1}`,
        targets: [
          mast(`mast-${i + 1}`, [g[0], 9, g[2]]),
          // The galleons sit 1.6 m lower in the paper (owner, 2026-10-20): the cannon and the deck knight with them.
          fireball(`cannon-${i + 1}`, [g[0], 0.4, g[2]], S(i - 1, 2.6, -81.4), { delaySec: 1.6 }),
          knight(`deck-k${i + 1}`, [[g[0] + 2, -0.1, g[2] + 4], [g[0] + 1, -0.1, g[2] + 5]], [len(5, 6)], { movement: { kind: 'static' }, delaySec: 0.6 }),
        ],
      })),
      onComplete: { flags: ['l3-fleet-sunk'] },
    },
    {
      id: 'l3-ps-storm',
      areaId: P,
      kind: 'combat',
      waves: [
        {
          id: 'storm',
          targets: [
            correctionMoth('storm-moth-1', [S(-6, 6, -170), S(5, 5, -166)]),
            fireTide('tide-steady', S(0, 2, -176), S(0, 2.4, -152.6), ['steady', 'on'], { delaySec: 1.2 }),
            correctionMoth('storm-moth-2', [S(6, 6, -172), S(-4, 5, -168)], { delaySec: 2.4 }),
          ],
        },
      ],
    },
  ],
};

/** One production line: its constructs in the lane, then three levers to shut it down. */
function line(n: 1 | 2 | 3, words: readonly [string, string, string], guard: 'blots' | 'hounds' | 'foreman'): EncounterDef {
  const x = FORGE_LINES[n - 1] ?? 0;
  const lane = (dx: number) => [F(x + dx, 0, -24), F(x * 0.6 + dx, 0, -16), F(x * 0.3 + dx * 0.4, 0, -6)];
  const enemies =
    guard === 'blots'
      ? [blotling(`line${n}-b1`, lane(-1)), blotling(`line${n}-b2`, lane(1), { delaySec: 0.7 }), fireball(`line${n}-spark`, F(x, 2, -20), F(0.4, 1.7, 3.4), { delaySec: 1.6 })]
      : guard === 'hounds'
        ? [hound(`line${n}-h1`, lane(-1)), hound(`line${n}-h2`, lane(1), { delaySec: 1.2 })]
        : [foreman(`line${n}-foreman`, lane(0)), fireball(`foreman-sweep`, F(x, 2.4, -14), F(-0.4, 1.7, 3.4), { delaySec: 3.4, words: ['duck'] })];
  return {
    id: `l3-forge-line-${n}`,
    areaId: K,
    kind: 'combat',
    waves: [
      { id: 'lane', targets: enemies },
      {
        id: 'levers',
        sequential: true,
        targets: words.map((word, i) => marker(`line${n}-lever-${i + 1}`, F(x + (i - 1) * 0.8, 1.6, -14), word, { labelHeight: 0.3, defeatFx: { kind: 'burst', scale: 0.8, color: '#ffa040' } })),
      },
    ],
    onComplete: { flags: [`l3-line-${n}`] },
    // The line's furnace blows out in a cascade of sparks; the stolen things drift home in colour.
    completeFx: [
      { kind: 'shockwave', at: F(x, 3, -26), scale: 2, color: '#ff7a2a' },
      { kind: 'burst', at: F(x, 4, -26), scale: 2.4, color: '#ffd24a' },
      { kind: 'pillar', at: F(x, 2, -26), scale: 1, color: '#7ae0a0' },
      { kind: 'shake', scale: 1.4 },
    ],
  };
}

export const forge: AreaScript = {
  nodes: {
    FG_START: { position: F(0, 1.6, 16), lookAt: F(0, 4, -10) },
    FG_POST: { position: F(0, 1.6, 4), lookAt: F(0, 2.6, -16) },
  },
  lookPoints: {
    FG_HAMMERS: F(0, 14, -34),
    FG_DOOR: F(19.6, 2, -2),
  },
  beats: [
    fade('l3-forge-enter', K, 'FG_START', { music: 'citadel-battle', objective: 'l3-forge', barks: ['l3-forge-1'] }),
    reveal('l3-forge-reveal', K, 'FG_START', ['FG_HAMMERS'], 0.8, 0.8, { attention: 'spectacle', fx: [{ kind: 'shockwave', at: 'FG_HAMMERS', atBeat: 0.5, scale: 2, color: '#ff5a1a' }, { kind: 'shake', atBeat: 0.5 }] }),
    travel('l3-forge-to-post', K, ['FG_START', 'FG_POST'], 3, { barks: ['l3-forge-levers'] }),
    fight('l3-forge-line-1', K),
    fight('l3-forge-line-2', K, { barks: ['l3-forge-2'] }),
    fight('l3-forge-line-3', K, { barks: ['l3-forge-foreman'] }),
    checkpoint('l3-forge-checkpoint', K, 'forge-stopped', { barks: ['l3-forge-done'], objective: 'l3-citadel' }),
    // Owner: "lead with the fire is coming, let's climb the stairs" — never just appear at the stairs.
    // Owner (2026-10-16): "To the stairs!" named stairs nobody had seen; the camera turns to the door
    // out of the forge that leads up to them.
    reveal('l3-forge-escape', K, 'FG_POST', ['FG_DOOR'], 0.7, 1.5, {
      returnToNode: false,
      barks: ['l3-forge-run'],
      fx: [
        { kind: 'shake', scale: 1.2 },
        { kind: 'geyser', at: 'FG_HAMMERS', atBeat: 0.3, scale: 1.6, color: '#ff3a1a' },
      ],
    }),
  ],
  encounters: [line(1, ['stop', 'halt', 'cease'], 'blots'), line(2, ['brake', 'still', 'quiet'], 'hounds'), line(3, ['freeze', 'close', 'done'], 'foreman')],
};

/** The four flights: path words drawn in, a landing fight between each, the fire racing below. */
const flight = (n: number, words: readonly [string, string, string]): EncounterDef => {
  const base = FLIGHTS[n - 1] ?? C(0, 0, 0);
  return {
    id: `l3-flight-${n}`,
    areaId: T,
    kind: 'interaction',
    waves: [
      {
        id: 'steps',
        sequential: true,
        targets: words.map((word, i) => pathWord(`flight${n}-${i + 1}`, [base[0], base[1] + flightChunk(i).dy + 0.6, base[2] + flightChunk(i).dz], word, `l3-flight-${n}-${i + 1}`)),
      },
    ],
  };
};

const climbFire = (y: number) => [
  { kind: 'burst' as const, at: C(0, y, 6), atBeat: 0.3, scale: 2, color: '#ff4a12' },
  { kind: 'geyser' as const, at: C(0, y - 4, 4), atBeat: 0.5, scale: 1.4, color: '#ff3a10' },
];

export const citadel: AreaScript = {
  nodes: {
    CT_0: { position: C(0, 1.6, 4), lookAt: C(0, 6, -10) },
    CT_1: { position: C(0, 9.6, -8), lookAt: C(0, 14, -22) },
    CT_2: { position: C(0, 17.6, -20), lookAt: C(0, 22, -34) },
    CT_3: { position: C(0, 25.6, -32), lookAt: C(0, 30, -46) },
    CT_4: { position: C(0, 33.6, -44), lookAt: C(0, 36, -56) },
  },
  lookPoints: {
    CT_DOORS: C(0, 36, -54),
  },
  beats: [
    fade('l3-ct-enter', T, 'CT_0', { music: 'citadel-battle', objective: 'l3-citadel', barks: ['l3-ct-1'] }),
    fight('l3-flight-1', T, { barks: ['l3-fire-race'] }),
    travel('l3-climb-1', T, ['CT_0', 'CT_1'], 3, { easing: 'easeInOutCubic', fx: climbFire(-2) }),
    fight('l3-landing-1', T),
    fight('l3-flight-2', T),
    travel('l3-climb-2', T, ['CT_1', 'CT_2'], 3, { easing: 'easeInOutCubic', fx: climbFire(6) }),
    fight('l3-landing-2', T),
    fight('l3-flight-3', T, { barks: ['l3-glitch'] }),
    travel('l3-climb-3', T, ['CT_2', 'CT_3'], 3, { easing: 'easeInOutCubic', fx: climbFire(14) }),
    fight('l3-flight-4', T, { barks: ['l3-mira-say-wrong', 'l3-pip-soup'] }),
    travel('l3-climb-4', T, ['CT_3', 'CT_4'], 3, { easing: 'easeInOutCubic', fx: climbFire(22) }),
    reveal('l3-doors-smash', T, 'CT_4', ['CT_DOORS'], 0.6, 0.8, {
      attention: 'spectacle',
      fx: [
        { kind: 'shockwave', at: 'CT_DOORS', atBeat: 0.3, scale: 2.4, color: '#ff5a1a' },
        { kind: 'debris', at: 'CT_DOORS', atBeat: 0.3, scale: 3, color: '#1a1414' },
        { kind: 'shake', atBeat: 0.3, scale: 2 },
      ],
    }),
    checkpoint('l3-ct-checkpoint', T, 'citadel-summit', { objective: 'l3-unwriter' }),
  ],
  encounters: [
    flight(1, ['stair', 'climb', 'upward']),
    flight(2, ['higher', 'rising', 'onward']),
    flight(3, ['ladder', 'summit', 'courage']),
    flight(4, ['almost', 'there', 'together']),
    {
      id: 'l3-landing-1',
      areaId: T,
      kind: 'combat',
      waves: [{ id: 'moths', targets: [correctionMoth('ct-moth-1', [C(-5, 13, -20), C(4, 12, -17)]), correctionMoth('ct-moth-2', [C(5, 13, -22), C(-3, 12, -18)], { delaySec: 0.8 }), fireball('ct-ember-1', C(2, 12, -20), C(0.5, 9.6, -6.6), { delaySec: 1.6 })] }],
    },
    {
      id: 'l3-landing-2',
      areaId: T,
      kind: 'combat',
      waves: [{ id: 'redactors', targets: [redactor('ct-red-1', [C(-5, 16, -32), C(-2, 16, -27), C(-1, 16, -24)]), redactor('ct-red-2', [C(5, 16, -33), C(2, 16, -28), C(1, 16, -24.4)], { delaySec: 1.4 })] }],
    },
  ],
};
