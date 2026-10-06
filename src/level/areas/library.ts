/**
 * LD-11 as revised by LEVEL1_DESIGN LD-0: Whispering Library and the Great Grimoire mini-boss.
 * Books dive-bomb from the galleries, a shelf topples, wisps erupt from an overturned inkwell, the
 * Grimoire snaps its chains, its gusts smash the furniture, and the final sentence is a beam struggle.
 * Local layout (origin LIBRARY_ORIGIN): reading hall x ∈ [-12, 12], z ∈ [-32, 2], upper galleries at y = 4.5.
 * Grimoire pedestal at (0, 0, -20); Library Anchor at (8, 0, -26); clue mosaic on the west wall.
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, marker, origin, powerWave, reveal, target, travel, type AreaScript } from './builders';
import { anchorBlast } from './courtyard';

const A = 'whispering-library';
export const LIBRARY_ORIGIN: Vec3 = [200, 0, 0];
const L = origin(LIBRARY_ORIGIN);

export const GRIMOIRE_CENTRE = L(0, 2.6, -20);
export const LIBRARY_ANCHOR_POSITION = L(8, 0, -26);
/** The overturned inkwell the wisps erupt from, and the free-standing shelf that topples. */
export const INKWELL_POSITION = L(-1.2, 0, -14.5);

/** Books swoop down from the gallery rails before patrolling their aisle (LD-0 dive-bombing). */
const gallery = (path: Vec3[]): Vec3 => {
  const first = path[0] ?? L(0, 2, -14);
  return [first[0] < LIBRARY_ORIGIN[0] ? LIBRARY_ORIGIN[0] - 10.5 : LIBRARY_ORIGIN[0] + 10.5, 5.6, first[2]];
};

const book = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'book', gallery(path), [len(4, 6)], {
    movement: { kind: 'patrol', path: [gallery(path), ...path], speed: 1.6 },
    entrance: { kind: 'dust', scale: 0.5 },
    attack: ATTACKS.bookGust,
    labelHeight: 0.45,
    weak: true,
    ...options,
  });

/** Wisps erupt from the inkwell, then glide out along their aisle (LD-0 ink geyser). */
const wisp = (id: string, path: Vec3[], shield: boolean, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'wisp', INKWELL_POSITION, shield ? [len(3, 5), len(4, 7)] : [len(4, 7)], {
    shield,
    movement: { kind: 'approach', path: [INKWELL_POSITION, ...path], speed: 0.95 },
    entrance: { kind: 'geyser', scale: 0.8, color: '#2c2f78' },
    attack: ATTACKS.inkPulse,
    labelHeight: 1.35,
    ...options,
  });

export const library: AreaScript = {
  nodes: {
    LIB_ENTRY: { position: L(0, 1.6, 2), lookAt: L(0, 3, -10) },
    LIB_REVEAL: { position: L(0, 2.0, -3), lookAt: L(0, 4.5, -14) },
    LIB_COMBAT: { position: L(0, 1.6, -5), lookAt: L(0, 2.4, -14) },
    LIB_CLUE_VIEW: { position: L(-4, 1.6, -9), lookAt: L(-11.8, 2.6, -13) },
    LIB_GRIMOIRE_ARENA: { position: L(0, 1.6, -11), lookAt: GRIMOIRE_CENTRE },
    LIB_ANCHOR: { position: L(4.5, 1.6, -20.5), lookAt: L(8, 1.4, -26) },
  },
  lookPoints: {
    LIB_GRIMOIRE: L(0, 1.6, -20),
    LIB_BALCONY_PAGE: L(9.5, 5.4, -12),
    LIB_MOSAIC: L(-11.8, 2.6, -13),
    LIB_FLYING_BOOKS: L(0, 5.5, -10),
    LIB_INKWELL: INKWELL_POSITION,
    LIB_TOPPLE_SHELF: L(5.2, 1.2, -16),
    LIB_CHAIN_LEFT: L(0, 1.25, -20.35),
    LIB_CHAIN_RIGHT: L(0, 1.25, -19.65),
    LIB_GRIMOIRE_HIGH: L(0, 2.9, -20),
    LIB_TABLE_LEFT: L(-3.2, 0.9, -7),
    LIB_TABLE_RIGHT: L(3.2, 0.9, -7),
    LIB_SHELF_AISLE: L(-6.5, 1.6, -10),
    LIB_ANCHOR_GROUND: L(8, 0.1, -26),
    LIB_ANCHOR_SKY: L(8, 24, -26),
  },
  beats: [
    fade('library-doors', A, 'LIB_ENTRY', { music: 'library-mystery', objective: 'library-anchor' }),
    travel('library-follow-book', A, ['LIB_ENTRY', 'LIB_REVEAL'], 5, {
      barks: ['lib-1'],
      // A spark gem along the entrance glide keeps the long walk-in lively (§1B travel rule).
      chase: [{ at: 0.35, target: target('lib-entry-gem', 'gem', L(0, 0, 0), [len(3, 3)], { follow: { ahead: 4.4, side: 1.2, up: 0.3 }, optional: true, labelHeight: 0.28 }) }],
    }),
    reveal('library-grimoire-reveal', A, 'LIB_REVEAL', ['LIB_FLYING_BOOKS', 'LIB_GRIMOIRE'], 1.6, 1.0),
    travel('library-to-combat', A, ['LIB_REVEAL', 'LIB_COMBAT'], 3, { reducedMotion: 'glide' }),
    fight('library-l1', A),
    fight('library-l2', A, { barks: ['lib-wisps'] }),
    travel('library-to-clue', A, ['LIB_COMBAT', 'LIB_CLUE_VIEW'], 4),
    reveal('library-balcony-pan', A, 'LIB_CLUE_VIEW', ['LIB_BALCONY_PAGE'], 1.8, 3.4, {
      barks: ['lib-mosaic', 'lib-mosaic-2'],
      bonus: target('bonus-page-balcony', 'star-page', L(9.5, 5.1, -12), ['shelf'], {
        optional: true,
        labelHeight: 0.45,
        reward: { starPage: 'page-library-balcony' },
      }),
    }),
    travel('library-to-grimoire', A, ['LIB_CLUE_VIEW', 'LIB_GRIMOIRE_ARENA'], 4, { reducedMotion: 'glide' }),
    // Boss intro: the chains snap one by one, the Grimoire rises and roars a gust of pages that blows
    // out the lamps, and the name card appears.
    reveal('library-grimoire-wakes', A, 'LIB_GRIMOIRE_ARENA', ['LIB_GRIMOIRE_HIGH'], 0.8, 10, {
      music: 'grimoire-battle',
      objective: 'calm-grimoire',
      attention: 'boss-intro',
      barks: ['lib-grim-1'],
      fx: [
        { kind: 'sparks', at: 'LIB_CHAIN_LEFT', atBeat: 0.12, scale: 1.2 },
        { kind: 'sparks', at: 'LIB_CHAIN_RIGHT', atBeat: 0.26, scale: 1.2 },
        { kind: 'shake', atBeat: 0.26, scale: 0.8 },
        { kind: 'leaves', at: 'LIB_GRIMOIRE_HIGH', atBeat: 0.55, scale: 2.4, color: '#f3ead2' },
        { kind: 'shockwave', at: 'LIB_GRIMOIRE', atBeat: 0.55, scale: 1.4, color: '#d9c7ff' },
        { kind: 'shake', atBeat: 0.55, scale: 1.6 },
      ],
    }),
    fight('grimoire-g1', A, { barks: ['lib-grim-clasps'] }),
    fight('grimoire-g2', A, { barks: ['lib-grim-pages'] }),
    fight('grimoire-g3', A, { barks: ['lib-grim-sentence'] }),
    travel('library-to-anchor', A, ['LIB_GRIMOIRE_ARENA', 'LIB_ANCHOR'], 4, {
      barks: ['lib-grim-done', 'lib-anchor-intro'],
      music: 'library-mystery',
      objective: 'library-anchor',
    }),
    fight('library-anchor', A),
    reveal('library-anchor-pillar', A, 'LIB_ANCHOR', ['LIB_ANCHOR_SKY'], 0.8, 0.7, { attention: 'spectacle' }),
    fight('library-power', A, { barks: ['power-frost'] }),
    checkpoint('library-checkpoint', A, 'library-restored', { objective: 'portraits' }),
  ],
  encounters: [
    // First use of Frost Thread: perfect words freeze the rest of this flock of books.
    powerWave(
      'library-power',
      A,
      'book',
      [
        [
          { path: [L(10, 4.5, -27), L(7.5, 2.4, -24.5)], variant: 'red' },
          { path: [L(3, 4.8, -28), L(5, 2.6, -25.5)], variant: 'blue' },
          { path: [L(11, 3.2, -22), L(8.5, 2.2, -23)], variant: 'green' },
          { path: [L(6, 5.2, -30), L(6.5, 3, -26.5)], variant: 'red' },
        ],
      ],
      { labelHeight: 0.45 },
    ),
    {
      id: 'library-l1',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'books-1',
          targets: [
            book('book-1', [L(-5, 2.4, -14), L(4, 2.6, -14.5)]),
            book('book-2', [L(4.5, 3.4, -17), L(-3.5, 3.1, -16)], { delaySec: 0.8, variant: 'green' }),
          ],
        },
        {
          id: 'books-2',
          targets: [
            book('book-3', [L(-6, 2.2, -13), L(2, 2.4, -12.5)]),
            book('book-4', [L(6, 3.0, -15), L(0, 3.5, -17)], { variant: 'blue' }),
            book('book-5', [L(-2, 4.0, -18), L(5, 3.8, -18.5)], { delaySec: 1, variant: 'green' }),
            target('flying-star-page', 'star-page', L(-6, 4.6, -15), ['page'], {
              optional: true,
              leaveAfterSec: 12,
              delaySec: 0.3,
              labelHeight: 0.4,
              movement: { kind: 'patrol', path: [L(-6, 4.6, -15), L(6, 4.2, -15)], speed: 1.2 },
              reward: { starPage: 'page-library-flying' },
            }),
          ],
        },
        {
          id: 'books-3',
          // A whole shelf topples in slow motion and spills a swarm of books.
          fx: [
            { kind: 'debris', at: 'LIB_TOPPLE_SHELF', delaySec: 0.9, scale: 1.8, color: '#7a2f2a' },
            { kind: 'debris', at: 'LIB_TOPPLE_SHELF', delaySec: 1.1, scale: 1.4, color: '#2f4a7a' },
            { kind: 'dust', at: 'LIB_TOPPLE_SHELF', delaySec: 1.0, scale: 2 },
            { kind: 'shake', delaySec: 1.0, scale: 1.4 },
          ],
          targets: [
            book('book-6', [L(-5.5, 2.4, -12.5), L(-1, 2.8, -13)]),
            book('book-7', [L(5.5, 2.6, -13), L(1.5, 3.2, -14)], { variant: 'blue' }),
            book('book-8', [L(-3, 3.8, -17), L(3.5, 4.2, -17.5)], { delaySec: 1.2 }),
            book('book-9', [L(0, 2.2, -16), L(-4, 3.2, -18)], { challengeOnly: true, delaySec: 2.5, variant: 'green' }),
          ],
        },
      ],
      barks: [{ when: { on: 'wave-start', wave: 0 }, line: 'lib-books' }],
    },
    {
      id: 'library-l2',
      areaId: A,
      kind: 'combat',
      waves: [
        { id: 'wisps-1', fx: [{ kind: 'geyser', at: 'LIB_INKWELL', scale: 1.4, color: '#2c2f78' }], targets: [wisp('wisp-1', [L(-7, 1, -18), L(-3, 1, -12), L(-0.8, 1, -8.6)], true)] },
        {
          id: 'wisps-2',
          targets: [
            wisp('wisp-2', [L(7, 1, -18), L(3, 1, -12), L(1.2, 1, -8.5)], true),
            wisp('wisp-3', [L(-7, 1, -19), L(-3.5, 1, -12.5), L(-1.4, 1, -8.8)], false, { delaySec: 1 }),
          ],
        },
        {
          id: 'wisps-3',
          targets: [
            wisp('wisp-4', [L(-8, 1, -16), L(-4, 1, -11), L(-1.6, 1, -8.5)], false),
            wisp('wisp-5', [L(0, 1, -22), L(0.2, 1, -14), L(0, 1, -9)], true, { delaySec: 1.5 }),
            wisp('wisp-6', [L(8, 1, -16), L(4, 1, -11), L(1.7, 1, -8.6)], false, { delaySec: 3 }),
          ],
        },
      ],
    },
    {
      id: 'grimoire-g1',
      areaId: A,
      kind: 'combat',
      bossPhase: 'grimoire-clasps',
      hazard: { attacks: ['gust'], firstDelaySec: 7, intervalSec: 10, windupSec: 1.8, damage: 6 },
      waves: [
        {
          id: 'clasps',
          targets: (
            [
              ['clasp-left', L(-1.15, 2.6, -19.2)],
              ['clasp-right', L(1.15, 2.6, -19.2)],
              ['clasp-top', L(0, 3.55, -19.2)],
            ] as const
          ).map(([id, p]) =>
            target(id, 'clasp', p, [len(4, 5)], {
              labelHeight: 0.35,
              defeatFx: { kind: 'sparks', scale: 1.2 },
              reward: { starPage: 'page-library-grimoire' },
              rewardIf: 'perfect',
            }),
          ),
        },
      ],
    },
    {
      id: 'grimoire-g2',
      areaId: A,
      kind: 'combat',
      bossPhase: 'grimoire-pages',
      // Each paper gust smashes furniture across the room (cosmetic), always clearly telegraphed.
      hazard: {
        attacks: ['gust'],
        firstDelaySec: 4,
        intervalSec: 7,
        windupSec: 1.6,
        damage: 7,
        fx: [
          { kind: 'debris', at: 'LIB_TABLE_LEFT', scale: 1.5, color: '#6e4a2c' },
          { kind: 'debris', at: 'LIB_TABLE_RIGHT', scale: 1.5, color: '#6e4a2c' },
          { kind: 'debris', at: 'LIB_SHELF_AISLE', scale: 1.4, color: '#7a2f2a' },
        ],
      },
      waves: [
        {
          id: 'pages',
          targets: [0, 1, 2, 3].map((i) =>
            target(`grimoire-page-${i + 1}`, 'flying-page', GRIMOIRE_CENTRE, [len(5, 6)], {
              movement: { kind: 'orbit', centre: L(0, 2.9 + (i % 2) * 0.6, -19.5), radius: 2.4, speed: 0.35, phase: (i * Math.PI) / 2 },
              labelHeight: 0.35,
              delaySec: i * 0.5,
            }),
          ),
        },
      ],
    },
    {
      id: 'grimoire-g3',
      areaId: A,
      kind: 'interaction',
      bossPhase: 'grimoire-sentence',
      // Beam struggle: each word pushes the player's beam against the storm of pages.
      beam: { to: L(0, 2.9, -19.6), color: '#d9c7ff' },
      completeFx: [
        { kind: 'flash' },
        { kind: 'shockwave', at: 'LIB_GRIMOIRE', scale: 1.6, color: '#ffe6a0' },
        { kind: 'burst', at: 'LIB_GRIMOIRE_HIGH', scale: 2.6 },
        { kind: 'leaves', at: 'LIB_GRIMOIRE_HIGH', scale: 2, color: '#f3ead2' },
        { kind: 'shake', scale: 1.6 },
      ],
      waves: [
        {
          id: 'sentence',
          targets: [
            target('grimoire-sentence', 'marker', L(0, 3.2, -19.3), ['bright', 'minds', 'make', 'strong', 'magic'], {
              labelHeight: 0.6,
              phrase: true,
            }),
          ],
        },
      ],
      onComplete: { flags: ['grimoire-settled'] },
    },
    {
      id: 'library-anchor',
      areaId: A,
      kind: 'interaction',
      waves: [
        {
          id: 'anchor-words',
          sequential: true,
          targets: ['read', 'listen', 'learn', 'remember'].map((word, i) =>
            marker(`library-rune-${i + 1}`, L(8, 1.0 + i * 0.4, -26), word, {
              labelHeight: 0.4,
              defeatFx: { kind: 'pillar', scale: 0.3, color: '#9fc8ff' },
            }),
          ),
        },
      ],
      barks: [
        { when: { on: 'complete' }, line: 'lib-anchor-done' },
      ],
      onComplete: { restoreAnchor: 'library', unlockSpell: 'frost-thread', flags: ['library-anchor-restored'] },
      completeFx: anchorBlast('LIB_ANCHOR_GROUND', '#9fc8ff'),
    },
  ],
};
