/**
 * LEVEL2_DESIGN L2-13: the Whispering Library being stolen. The Level 1 library at night, half in
 * flames; pages stream out through the shattered north window towards the Moon Tower, where the Vellum
 * Wyrm is glimpsed. Paper sprites and wisps (with counter-word ink pulses), then Scribble Imps scratch
 * at the friendly Grimoire guarding the Star Atlas. Reuses the Level 1 library (origin LIBRARY_ORIGIN).
 */
import { LIBRARY_ORIGIN } from '../areas/library';
import { checkpoint, fade, fight, hold, len, origin, reveal, target, travel, type AreaScript } from '../areas/builders';
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { fireball, lantern, restore, scribbleImp } from './hush';

const A = 'l2-burning-library';
const L = origin(LIBRARY_ORIGIN);

const paperSprite = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'flying-page', path[0] ?? L(0, 3, -14), [len(3, 4)], {
    movement: { kind: 'patrol', path, speed: 1.8 },
    labelHeight: 0.35,
    weak: true,
    defeatFx: { kind: 'burst', scale: 0.6, color: '#ffe6a0' },
    ...options,
  });

const wisp = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'wisp', path[0] ?? L(0, 1, -16), [len(3, 5), len(4, 6)], {
    shield: true,
    movement: { kind: 'approach', path, speed: 0.9 },
    attack: { kind: 'ranged', windupSec: 1.3, recoverSec: 0.7, intervalSec: 7, damage: 8 },
    labelHeight: 1.35,
    entrance: { kind: 'geyser', scale: 0.6, color: '#2c2f78' },
    ...options,
  });

export const library2: AreaScript = {
  nodes: {
    L2LIB_ENTRY: { position: L(0, 1.6, 2), lookAt: L(0, 3, -12) },
    L2LIB_WINDOW: { position: L(0, 2.2, -8), lookAt: L(0, 8, -32) },
    L2LIB_COMBAT: { position: L(0, 1.6, -6), lookAt: L(0, 2.4, -16) },
    L2LIB_PEDESTAL: { position: L(0, 1.6, -12), lookAt: L(0, 2.2, -20) },
  },
  lookPoints: {
    // High in the hall by the far windows, where the page dragon swoops through (owner: "I don't see
    // any dragon"; the shot looked up at the ceiling).
    L2LIB_SKY: L(0, 6.5, -26),
    L2LIB_SHELF: L(11, 2.5, -16),
  },
  beats: [
    fade('l2-lib-enter', A, 'L2LIB_ENTRY', { music: 'siege-dread', objective: 'l2-library' }),
    // Story beat: pages fly out of the window; the Vellum Wyrm coils around the Moon Tower.
    travel('l2-lib-to-window', A, ['L2LIB_ENTRY', 'L2LIB_WINDOW'], 3.5),
    reveal('l2-wyrm-glimpse', A, 'L2LIB_WINDOW', ['L2LIB_SKY'], 0.8, 8, {
      barks: ['l2-our-books'],
      fx: [
        { kind: 'leaves', at: 'L2LIB_SKY', atBeat: 0.2, scale: 2.6, color: '#f3ead2' },
        { kind: 'leaves', at: 'L2LIB_SKY', atBeat: 0.45, scale: 2.2, color: '#f3ead2' },
        { kind: 'debris', at: 'L2LIB_SHELF', atBeat: 0.55, scale: 2, color: '#7a2f2a' },
        { kind: 'burst', at: 'L2LIB_SHELF', atBeat: 0.55, scale: 1.4, color: '#ff5a1a' },
        { kind: 'shake', atBeat: 0.55, scale: 1.2 },
      ],
    }),
    travel('l2-lib-to-combat', A, ['L2LIB_WINDOW', 'L2LIB_COMBAT'], 2.5),
    fight('l2-lib-sprites', A, { music: 'siege-battle', barks: ['l2-lib-sprites'] }),
    travel('l2-lib-to-pedestal', A, ['L2LIB_COMBAT', 'L2LIB_PEDESTAL'], 3),
    // Said as the imps rush the Grimoire (it was said before any were in view).
    fight('l2-lib-grimoire', A, { barks: ['l2-grimoire-help'] }),
    fight('l2-lib-shelves', A, { barks: ['l2-shelves'] }),
    checkpoint('l2-lib-checkpoint', A, 'star-atlas-recovered', { barks: ['l2-atlas'], objective: 'l2-ramparts' }),
    hold('l2-lib-exit', A, 'L2LIB_PEDESTAL', 2.5, { barks: ['l2-to-ramparts'], journey: 'l2-ramparts' }),
  ],
  encounters: [
    {
      id: 'l2-lib-sprites',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'sprites',
          targets: [
            paperSprite('page-sprite-1', [L(-5, 3, -14), L(4, 3.4, -15)]),
            paperSprite('page-sprite-2', [L(5, 4, -17), L(-3, 3.6, -16)], { delaySec: 0.5 }),
            paperSprite('page-sprite-3', [L(-2, 4.6, -19), L(5, 4.2, -18)], { delaySec: 1 }),
          ],
        },
        {
          id: 'wisps',
          targets: [
            wisp('l2-wisp-1', [L(-7, 1, -18), L(-3, 1, -12), L(-1, 1, -8.6)]),
            fireball('wisp-pulse-1', L(-6, 1.6, -17), L(-0.6, 1.7, -4.4), { delaySec: 2 }),
            wisp('l2-wisp-2', [L(7, 1, -18), L(3, 1, -12), L(1.2, 1, -8.6)], { delaySec: 1.2 }),
            lantern('lantern-library', L(9.5, 5.4, -12), 'shelf', 'lantern-library', { leaveAfterSec: 12 }),
          ],
        },
      ],
    },
    {
      id: 'l2-lib-grimoire',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'imps',
          targets: [
            scribbleImp('grim-imp-1', [L(-5, 0, -22), L(-2, 0, -19), L(-1.2, 0, -14)]),
            scribbleImp('grim-imp-2', [L(5, 0, -22), L(2, 0, -19), L(1.2, 0, -14)], { delaySec: 0.6 }),
            scribbleImp('grim-imp-3', [L(0, 0, -26), L(0, 0, -21), L(0.2, 0, -14.2)], { delaySec: 1.2 }),
          ],
        },
      ],
      onComplete: { flags: ['l2-atlas-safe'] },
    },
    {
      id: 'l2-lib-shelves',
      areaId: A,
      kind: 'interaction',
      optionalPrompt: 'l2-shelves',
      speedRound: { sec: 9 },
      waves: [
        {
          id: 'shelves',
          sequential: true,
          targets: [
            restore('shelf-1', L(-11, 2.4, -16), 'story', 'l2-shelf-1'),
            restore('shelf-2', L(11, 2.4, -16), 'verse', 'l2-shelf-2'),
            restore('shelf-3', L(-11, 2.4, -22), 'tale', 'l2-shelf-3'),
          ],
        },
      ],
      onComplete: { reward: { cosmetic: 'trail-inkwell' } },
    },
  ],
};
