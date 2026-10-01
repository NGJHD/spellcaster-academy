/**
 * LD-11: Whispering Library and the Great Grimoire mini-boss.
 * Local layout (origin LIBRARY_ORIGIN): reading hall x ∈ [-12, 12], z ∈ [-32, 2], upper galleries at y = 4.5.
 * Grimoire pedestal at (0, 0, -20); Library Anchor at (8, 0, -26); clue mosaic on the west wall.
 */
import type { TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { ATTACKS, checkpoint, fade, fight, len, marker, origin, reveal, talk, target, travel, type AreaScript } from './builders';

const A = 'whispering-library';
export const LIBRARY_ORIGIN: Vec3 = [200, 0, 0];
const L = origin(LIBRARY_ORIGIN);

export const GRIMOIRE_CENTRE = L(0, 2.6, -20);
export const LIBRARY_ANCHOR_POSITION = L(8, 0, -26);

const book = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'book', path[0] ?? L(0, 2, -14), [len(4, 6)], {
    movement: { kind: 'patrol', path, speed: 1.1 },
    attack: ATTACKS.bookGust,
    labelHeight: 0.45,
    weak: true,
    ...options,
  });

const wisp = (id: string, path: Vec3[], shield: boolean, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'wisp', path[0] ?? L(0, 1, -16), shield ? [len(3, 5), len(4, 7)] : [len(4, 7)], {
    shield,
    movement: { kind: 'approach', path, speed: 0.8 },
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
  },
  beats: [
    fade('library-doors', A, 'LIB_ENTRY', { music: 'library-mystery', objective: 'library-anchor' }),
    travel('library-follow-book', A, ['LIB_ENTRY', 'LIB_REVEAL'], 5, { barks: ['lib-1'] }),
    reveal('library-grimoire-reveal', A, 'LIB_REVEAL', ['LIB_FLYING_BOOKS', 'LIB_GRIMOIRE'], 1.6, 1.0),
    travel('library-to-combat', A, ['LIB_REVEAL', 'LIB_COMBAT'], 3, { reducedMotion: 'glide' }),
    fight('library-l1', A),
    talk('library-wisps-talk', A, ['lib-wisps']),
    fight('library-l2', A),
    travel('library-to-clue', A, ['LIB_COMBAT', 'LIB_CLUE_VIEW'], 4),
    reveal('library-balcony-pan', A, 'LIB_CLUE_VIEW', ['LIB_BALCONY_PAGE'], 1.8, 3.4, {
      bonus: target('bonus-page-balcony', 'star-page', L(9.5, 5.1, -12), ['shelf'], {
        optional: true,
        labelHeight: 0.45,
        reward: { starPage: 'page-library-balcony' },
      }),
    }),
    talk('library-clue', A, ['lib-mosaic-1', 'lib-mosaic-2']),
    travel('library-to-grimoire', A, ['LIB_CLUE_VIEW', 'LIB_GRIMOIRE_ARENA'], 4, { reducedMotion: 'glide' }),
    talk('library-grimoire-wakes', A, ['lib-grim-1'], { music: 'grimoire-battle', objective: 'calm-grimoire' }),
    fight('grimoire-g1', A, { barks: ['lib-grim-clasps'] }),
    fight('grimoire-g2', A, { barks: ['lib-grim-pages'] }),
    fight('grimoire-g3', A, { barks: ['lib-grim-sentence'] }),
    talk('library-grimoire-done', A, ['lib-grim-done'], { music: 'library-mystery', objective: 'library-anchor' }),
    travel('library-to-anchor', A, ['LIB_GRIMOIRE_ARENA', 'LIB_ANCHOR'], 4, { barks: ['lib-anchor-intro'] }),
    fight('library-anchor', A),
    checkpoint('library-checkpoint', A, 'library-restored', { objective: 'greenhouse-anchor' }),
  ],
  encounters: [
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
        { id: 'wisps-1', targets: [wisp('wisp-1', [L(-7, 1, -18), L(-3, 1, -12), L(-0.8, 1, -8.6)], true)] },
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
      hazard: { attacks: ['gust'], firstDelaySec: 4, intervalSec: 7, windupSec: 1.6, damage: 7 },
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
      waves: [
        {
          id: 'sentence',
          targets: [
            target('grimoire-sentence', 'marker', L(0, 3.2, -19.3), ['bright', 'minds', 'make', 'strong', 'magic'], {
              labelHeight: 0.6,
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
            marker(`library-rune-${i + 1}`, L(8, 1.0 + i * 0.4, -26), word, { labelHeight: 0.4 }),
          ),
        },
      ],
      barks: [
        { when: { on: 'complete' }, line: 'lib-anchor-done' },
      ],
      onComplete: { restoreAnchor: 'library', unlockSpell: 'frost-thread', flags: ['library-anchor-restored'] },
    },
  ],
};
