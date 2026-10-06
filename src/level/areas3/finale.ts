/**
 * LEVEL3_DESIGN L3-15 / L3-16: the Throne of Ash and the Homecoming.
 * - Throne (origin THRONE_ORIGIN): a circular iron platform (r = 14) above a sea of fire; the
 *   Unwriter rises at (0, 0, −12); Pip is seized at (−3, 3.2, −6) in phase U3.
 *   U1 Erasure (seal pages, quill strokes), U2 Perfect Copies of past foes, U3 Correcting Pip
 *   (restore brave, curious, kind), U4 the First Lesson: a six-word beam struggle against the quill.
 * - Homecoming: the Level 1 Celebration Courtyard at dawn (the exterior campus coordinates).
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, len, marker, origin, reveal, talk, target, travel, type AreaScript } from '../areas/builders';
import { knight } from '../areas2/hush';
import { fireTide, fireball } from './blank';

const A = 'l3-throne';
const H = 'l3-homecoming';
export const THRONE_ORIGIN: Vec3 = [2800, 80, 0];
const O = origin(THRONE_ORIGIN);
export const UNWRITER: Vec3 = O(0, 0, -12);
export const PIP_SEIZED: Vec3 = O(-3, 3.2, -6);
const QUILL = O(1.6, 6.5, -11);
const CHEST = O(0, 3.6, -11.4);

/** One of the Unwriter's black-iron copies of a past foe: a short burst of erased-letter words. */
const copy = (id: string, kind: 'dummy' | 'book' | 'hollow-knight' | 'marker', at: Vec3, words: number) =>
  target(id, kind, at, Array.from({ length: words }, () => len(4, 6)), {
    variant: kind === 'dummy' ? 'perfect' : 'grey',
    labelHeight: kind === 'book' ? 0.9 : kind === 'marker' ? 0.5 : 2.2,
    erased: true,
    movement: { kind: 'static' },
    entrance: { kind: 'geyser', scale: 1, color: '#ff3a10' },
    defeatFx: { kind: 'burst', scale: 2, color: kind === 'dummy' ? '#ffd24a' : kind === 'book' ? '#c78aff' : kind === 'hollow-knight' ? '#ff8a3a' : '#7ae0a0' },
    persist: kind !== 'marker' && kind !== 'book' ? true : undefined,
  });

export const throne: AreaScript = {
  nodes: {
    TH_DOOR: { position: O(0, 1.7, 14), lookAt: O(0, 3, -10) },
    TH_POS: { position: O(0, 1.7, 6), lookAt: O(0, 4.5, -12) },
    TH_PIP: { position: O(1, 1.7, 5), lookAt: O(-2, 3, -6) },
  },
  lookPoints: {
    TH_THRONE: O(0, 2, -12),
    TH_HEAD: O(0, 6, -12),
    TH_QUILL: QUILL,
    TH_FLOOR: O(0, 0.2, -4),
    TH_SKY: O(0, 30, -40),
  },
  beats: [
    fade('l3-throne-enter', A, 'TH_DOOR', { music: 'unwriter-battle', objective: 'l3-unwriter' }),
    travel('l3-throne-walk', A, ['TH_DOOR', 'TH_POS'], 3),
    reveal('l3-unwriter-rises', A, 'TH_POS', ['TH_THRONE', 'TH_HEAD'], 0.8, 7.5, {
      attention: 'boss-intro',
      barks: ['l3-u-intro'],
      fx: [
        { kind: 'pillar', at: 'TH_THRONE', atBeat: 0.05, scale: 2.2, color: '#ff3a10' },
        { kind: 'flash', atBeat: 0.05, color: '#ff3a10' },
        { kind: 'shake', atBeat: 0.05, scale: 2 },
        { kind: 'burst', at: 'TH_QUILL', atBeat: 0.4, scale: 2, color: '#ff5a1a' },
      ],
    }),
    fight('l3-u1', A, { barks: ['l3-pip-learning', 'l3-u-mistakes'] }),
    fight('l3-u2', A, { barks: ['l3-u-copies'] }),
    reveal('l3-pip-seized', A, 'TH_POS', ['TH_HEAD'], 0.6, 0.6, { barks: ['l3-u-correct-pip'], fx: [{ kind: 'burst', at: PIP_SEIZED, atBeat: 0.2, scale: 1.6, color: '#ff3a10' }] }),
    fight('l3-u3', A, { barks: ['l3-save-pip'] }),
    talk('l3-pip-free', A, ['l3-pip-staying']),
    fight('l3-u4', A, { barks: ['l3-final-spell'] }),
    talk('l3-sealed', A, ['l3-pip-done'], { attention: 'ending' }),
    reveal('l3-colour-returns', A, 'TH_POS', ['TH_SKY'], 1.2, 3, {
      attention: 'ending',
      music: 'homecoming',
      barks: ['l3-colour'],
      fx: [
        { kind: 'pillar', at: 'TH_FLOOR', atBeat: 0.05, scale: 3, color: '#ffe6a0' },
        { kind: 'fireworks', at: 'TH_SKY', atBeat: 0.3, scale: 1.6 },
        { kind: 'fireworks', at: 'TH_SKY', atBeat: 0.7, scale: 1.8 },
      ],
    }),
    checkpoint('l3-throne-checkpoint', A, 'unwriter-sealed', { attention: 'ending' }),
    // The way home (owner: the ending was abrupt): the Warden opens the Rift and carries everyone home.
    talk('l3-go-home', A, ['l3-warden-home', 'l3-pip-home'], { attention: 'ending' }),
  ],
  encounters: [
    {
      id: 'l3-u1',
      areaId: A,
      kind: 'combat',
      bossPhase: 'u-erasure',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'seals-1',
          targets: [
            marker('seal-1', O(-3, 5, -10), len(5, 7), { labelHeight: 0.3, erased: true, movement: { kind: 'patrol', path: [O(-3, 5, -10), O(-1, 6, -9)], speed: 0.6 } }),
            marker('seal-2', O(3, 4.2, -10), len(5, 7), { labelHeight: 0.3, delaySec: 0.6, movement: { kind: 'patrol', path: [O(3, 4.2, -10), O(1.5, 5.4, -9)], speed: 0.6 } }),
            fireball('stroke-1', QUILL, O(-0.6, 1.7, 5.4), { delaySec: 1.8 }),
          ],
        },
        {
          id: 'seals-2',
          targets: [
            marker('seal-3', O(-2, 6.6, -11), len(5, 7), { labelHeight: 0.3, erased: true }),
            marker('seal-4', O(2.4, 6, -11), len(5, 7), { labelHeight: 0.3, delaySec: 0.6 }),
            fireTide('stroke-tide', O(0, 1, -10), O(0, 1.7, 5.2), ['stand', 'firm'], { delaySec: 2.2 }),
          ],
        },
        { id: 'seals-3', targets: [marker('seal-5', O(0, 7.2, -11), len(6, 7), { labelHeight: 0.3, erased: true }), fireball('stroke-2', QUILL, O(0.6, 1.8, 5.4), { delaySec: 1.4 })] },
      ],
      hazard: { attacks: ['pulse'], firstDelaySec: 6, intervalSec: 9, windupSec: 1.8, damage: 12 },
    },
    {
      id: 'l3-u2',
      areaId: A,
      kind: 'combat',
      bossPhase: 'u-copies',
      assistAfterFailures: 2,
      waves: [
        { id: 'copy-dummy', targets: [copy('copy-dummy', 'dummy', O(-2, 0, -6), 2)] },
        { id: 'copy-grimoire', targets: [copy('copy-grimoire', 'book', O(2, 2.4, -7), 2), fireball('copy-gust', O(2, 2.4, -7), O(0.4, 1.7, 5.4), { delaySec: 1.6 })] },
        { id: 'copy-herald', targets: [copy('copy-herald', 'hollow-knight', O(-1, 0, -7), 3)] },
        { id: 'copy-wyrm', targets: [target('copy-wyrm', 'marker', O(0, 4, -8), ['every', 'page'], { labelHeight: 0.5, phrase: true, erased: true, entrance: { kind: 'geyser', scale: 1.4, color: '#ff3a10' }, defeatFx: { kind: 'leaves', scale: 3, color: '#f3ead2' } })] },
      ],
    },
    {
      id: 'l3-u3',
      areaId: A,
      kind: 'combat',
      bossPhase: 'u-correcting-pip',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'rings',
          targets: [
            marker('pip-brave', [PIP_SEIZED[0] - 0.6, PIP_SEIZED[1] + 0.6, PIP_SEIZED[2]], 'brave', { labelHeight: 0.2, defeatFlag: 'l3-pip-ring-1', defeatBark: 'l3-pip-ring-1', defeatFx: { kind: 'burst', scale: 1.2, color: '#ffd24a' } }),
            knight('allies-k1', [O(6, 0, -4), O(5, 0, -2)], [len(5, 6)], { movement: { kind: 'static' }, optional: true, leaveAfterSec: 20 }),
            fireball('pip-stroke-1', QUILL, O(-0.8, 1.7, 5.4), { delaySec: 1.6 }),
          ],
        },
        {
          id: 'rings-2',
          targets: [
            marker('pip-curious', [PIP_SEIZED[0] + 0.6, PIP_SEIZED[1] + 0.2, PIP_SEIZED[2]], 'curious', { labelHeight: 0.2, defeatFlag: 'l3-pip-ring-2', defeatBark: 'l3-pip-ring-2', defeatFx: { kind: 'burst', scale: 1.2, color: '#4ab8ff' } }),
            fireTide('pip-tide', O(0, 1, -10), O(0, 1.7, 5.2), ['hold', 'on'], { delaySec: 1.8 }),
          ],
        },
        {
          id: 'rings-3',
          targets: [marker('pip-kind', [PIP_SEIZED[0], PIP_SEIZED[1] - 0.5, PIP_SEIZED[2]], 'kind', { labelHeight: 0.2, defeatFlag: 'l3-pip-ring-3', defeatFx: { kind: 'pillar', scale: 1, color: '#9fd8ff' } })],
        },
      ],
      onComplete: { flags: ['l3-pip-free'] },
    },
    {
      id: 'l3-u4',
      areaId: A,
      kind: 'interaction',
      bossPhase: 'u-first-lesson',
      // The final clash: the apprentice's gold-blue beam against the quill's red fire.
      beam: { to: QUILL, color: '#ff2a0a' },
      waves: [
        {
          id: 'lesson',
          targets: [target('first-lesson', 'marker', O(0, 4.8, -10.6), ['every', 'mistake', 'teaches', 'us', 'something', 'new'], { labelHeight: 0.5, phrase: true })],
        },
      ],
      onComplete: { flags: ['l3-unwriter-sealed'], reward: { cosmetic: 'trail-bright-quill' } },
      completeFx: [
        { kind: 'flash', color: '#ffffff' },
        { kind: 'shockwave', at: QUILL, scale: 5, color: '#ffe6a0' },
        { kind: 'burst', at: CHEST, scale: 5, color: '#ff5a1a' },
        { kind: 'pillar', at: UNWRITER, scale: 3, color: '#ffd27a' },
        { kind: 'shake', scale: 2.6 },
      ],
    },
  ],
};

export const homecoming: AreaScript = {
  nodes: {
    HOME_START: { position: [0, 1.6, 15], lookAt: [0, 2, 0] },
    HOME_GATHER: { position: [-1, 1.6, 8.5], lookAt: [3.5, 1.7, 3.2] },
    HOME_FINAL: { position: [0.5, 2.2, 9.5], lookAt: [0, 26, -56] },
  },
  lookPoints: {
    HOME_SKY: [0, 0, -14],
    HOME_SKY_LEFT: [-10, 0, -12],
    HOME_SKY_RIGHT: [10, 0, -12],
    HOME_TOWER: [0, 31, -54],
  },
  beats: [
    fade('l3-home-enter', H, 'HOME_START', { fadeOutSec: 1.4, holdSec: 0.8, fadeInSec: 1.6, music: 'victory', objective: 'none', attention: 'ending' }),
    travel('l3-home-walk', H, ['HOME_START', 'HOME_GATHER'], 7, {
      attention: 'ending',
      barks: ['l3-home-1'],
      fx: [
        { kind: 'fireworks', at: 'HOME_SKY', atBeat: 0.05 },
        { kind: 'fireworks', at: 'HOME_SKY_LEFT', atBeat: 0.4 },
        { kind: 'fireworks', at: 'HOME_SKY_RIGHT', atBeat: 0.75 },
      ],
    }),
    // Keeper Orin thanks the apprentice in front of the whole school (owner: "it makes the kid playing
    // the game feel nice"), then names them Wardkeeper, and everyone cheers under the fireworks.
    talk('l3-home-vault', H, ['l3-orin-thanks-1', 'l3-orin-thanks-2', 'l3-orin-vault'], { attention: 'ending' }),
    talk('l3-home-ceremony', H, ['l3-orin-wardkeeper', 'l3-mira-cheer', 'l3-pip-three'], {
      attention: 'ending',
      fx: [
        { kind: 'fireworks', at: 'HOME_SKY_LEFT', scale: 1.6 },
        { kind: 'fireworks', at: 'HOME_SKY_RIGHT', scale: 1.6 },
        { kind: 'fireworks', at: 'HOME_SKY', scale: 2 },
      ],
    }),
    travel('l3-home-final', H, ['HOME_GATHER', 'HOME_FINAL'], 5, {
      attention: 'ending',
      fx: [
        { kind: 'fireworks', at: 'HOME_SKY_LEFT', atBeat: 0.2, scale: 1.4 },
        { kind: 'fireworks', at: 'HOME_SKY_RIGHT', atBeat: 0.45, scale: 1.4 },
        { kind: 'fireworks', at: 'HOME_TOWER', atBeat: 0.7, scale: 2 },
      ],
    }),
    fade('l3-home-fade', H, 'HOME_FINAL', { fadeOutSec: 1.6, holdSec: 0.6, fadeInSec: 0.4, music: 'results', attention: 'ending' }),
    checkpoint('l3-complete', H, 'level-3-complete', { attention: 'ending' }),
    { kind: 'results', id: 'l3-results', areaId: H, attention: 'ending' },
  ],
  encounters: [],
};
