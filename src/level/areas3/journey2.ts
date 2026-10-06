/**
 * LEVEL3_DESIGN L3-9 … L3-11.
 * - Inkfall Cascades (origin FALLS_ORIGIN): a page-raft descends falls of red ink, from y = 40 at
 *   z = 0 down to the pool at y = 0, z = −130; walls of fire on both banks; a fire tide in the basin.
 * - Margin Library (origin MARGIN_ORIGIN): walkways between upside-down shelves hanging from the red
 *   sky; Corvane's journal burns into a tornado at z = −40; Bright Quill.
 * - Gallery of Unfinished Things (origin GALLERY3_ORIGIN): grey sculptures; the Perfect Warden smashes
 *   out of the far wall at z = −20.
 */
import type { Vec3 } from '../rail/railTypes';
import { checkpoint, fade, fight, hold, len, marker, origin, powerWave, reveal, target, travel, type AreaScript } from '../areas/builders';
import { blotling, knight } from '../areas2/hush';
import type { TargetSpawn } from '../levelTypes';
import { colour, fireTide, fireball, memoryPage, pathWord } from './blank';

const F = 'l3-inkfall';
const M = 'l3-margin-library';
const G = 'l3-unfinished-gallery';
export const FALLS_ORIGIN: Vec3 = [2200, 0, 0];
export const MARGIN_ORIGIN: Vec3 = [2300, 40, 0];
export const GALLERY3_ORIGIN: Vec3 = [2400, 0, 0];
const I = origin(FALLS_ORIGIN);
const L = origin(MARGIN_ORIGIN);
const Y = origin(GALLERY3_ORIGIN);
export const RAFT_BEATS = ['l3-shield-up', 'l3-raft-1', 'l3-if-s1', 'l3-raft-2', 'l3-tide-1', 'l3-raft-3', 'l3-if-slide', 'l3-raft-slide', 'l3-if-pool'] as const;
export const SLIDE_SECTIONS: readonly Vec3[] = [I(0, 14, -96), I(0, 9, -106), I(0, 4, -116)];
export const WALKWAYS: readonly Vec3[] = [L(0, 0, -4), L(0, 0, -12), L(0, 0, -20)];
export const JOURNAL: Vec3 = L(0, 2, -40);
export const PERFECT_WARDEN: Vec3 = Y(0, 0, -20);
const PW_CORE = Y(0, 3.6, -19);

const wisp = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'wisp', path[0] ?? L(0, 0, -20), [len(3, 5), len(4, 6)], {
    shield: true,
    erased: true,
    movement: { kind: 'approach', path, speed: 0.9 },
    attack: { kind: 'ranged', windupSec: 1.3, recoverSec: 0.7, intervalSec: 7, damage: 8 },
    labelHeight: 1.35,
    entrance: { kind: 'geyser', scale: 0.6, color: '#2a0c0c' },
    ...options,
  });

const greyPage = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'flying-page', path[0] ?? L(0, 3, -14), [len(3, 4)], {
    movement: { kind: 'patrol', path, speed: 1.8 },
    labelHeight: 0.35,
    weak: true,
    erased: true,
    defeatFx: { kind: 'burst', scale: 0.7, color: '#ffe6a0' },
    ...options,
  });

export const inkfall: AreaScript = {
  nodes: {
    IF_TOP: { position: I(0, 41.6, 0), lookAt: I(0, 36, -24) },
    IF_S1: { position: I(0, 31.6, -30), lookAt: I(0, 28, -50) },
    IF_BASIN: { position: I(0, 21.6, -60), lookAt: I(0, 20, -80) },
    IF_DROP: { position: I(0, 16.6, -88), lookAt: I(0, 4, -112) },
    IF_POOL: { position: I(0, 1.6, -126), lookAt: I(0, 1.4, -142) },
  },
  lookPoints: {
    IF_FALLS: I(0, 10, -100),
  },
  beats: [
    fade('l3-if-enter', F, 'IF_TOP', { music: 'citadel-battle', objective: 'l3-inkfall', barks: ['l3-raft'] }),
    // Owner (2026-10-07): "won't we burn to death?" A frost bubble keeps the fire off the paper raft.
    hold('l3-shield-up', F, 'IF_TOP', 1, {
      barks: ['l3-shield'],
      chase: [{ at: 0.05, target: pathWord('raft-shield', I(0, 41.4, -4), 'shield', 'l3-shield-on', { defeatBark: 'l3-shield-on', defeatFx: { kind: 'shockwave', scale: 1.2, color: '#9fd8ff' } }) }],
    }),
    travel('l3-raft-1', F, ['IF_TOP', 'IF_S1'], 6, {
      chase: [{ at: 0.4, target: memoryPage('falls-page', I(0, 0, 0), 'drift', 'memory-3', { follow: { ahead: 4.4, side: 1.3, up: 0.6 } }) }],
    }),
    fight('l3-if-s1', F),
    travel('l3-raft-2', F, ['IF_S1', 'IF_BASIN'], 4),
    fight('l3-tide-1', F, { barks: ['l3-tide-tip'] }),
    travel('l3-raft-3', F, ['IF_BASIN', 'IF_DROP'], 4, { barks: ['l3-broken-drop'] }),
    fight('l3-if-slide', F),
    travel('l3-raft-slide', F, ['IF_DROP', 'IF_POOL'], 5, { easing: 'easeInOutCubic', fx: [{ kind: 'geyser', at: 'IF_FALLS', atBeat: 0.9, scale: 1.6, color: '#ff3a1a' }] }),
    fight('l3-if-pool', F),
    checkpoint('l3-if-checkpoint', F, 'inkfall-descended', { barks: ['l3-mira-raft'], objective: 'l3-margin' }),
  ],
  encounters: [
    {
      id: 'l3-if-s1',
      areaId: F,
      kind: 'combat',
      waves: [
        {
          id: 'banks',
          targets: [
            blotling('if-blot-1', [I(-6, 30, -44), I(-3, 30, -38), I(-1.2, 30, -35)]),
            blotling('if-blot-2', [I(6, 30, -44), I(3, 30, -38), I(1.2, 30, -35)], { delaySec: 0.8 }),
            fireball('if-ink', I(-4, 30.6, -42), I(-0.4, 31.6, -32.6), { delaySec: 1.8 }),
          ],
        },
      ],
    },
    {
      id: 'l3-tide-1',
      areaId: F,
      kind: 'combat',
      waves: [{ id: 'tide', targets: [fireTide('tide-hold', I(0, 21, -84), I(0, 21.6, -62.6), ['hold', 'fast'])] }],
    },
    {
      id: 'l3-if-slide',
      areaId: F,
      kind: 'interaction',
      waves: [
        {
          id: 'slide',
          sequential: true,
          targets: (['slide', 'swoop', 'splash'] as const).map((word, i) => pathWord(`slide-${i + 1}`, SLIDE_SECTIONS[i] ?? I(0, 10, -100), word, `l3-slide-${i + 1}`)),
        },
      ],
    },
    {
      id: 'l3-if-pool',
      areaId: F,
      kind: 'combat',
      waves: [
        { id: 'knight-1', targets: [knight('pool-k1', [I(-5, 0, -146), I(-3, 0, -140), I(-1.4, 0, -134)])] },
        { id: 'knight-2', targets: [knight('pool-k2', [I(5, 0, -148), I(3, 0, -141), I(1.4, 0, -134)]), fireball('pool-sweep', I(3, 1.6, -140), I(0.4, 1.7, -128.6), { delaySec: 2.2 })] },
      ],
    },
  ],
};

export const margin: AreaScript = {
  nodes: {
    ML_START: { position: L(0, 1.6, 8), lookAt: L(0, 2, -10) },
    ML_WALK: { position: L(0, 1.6, -18), lookAt: L(0, 2.4, -32) },
    ML_HEART: { position: L(0, 1.6, -30), lookAt: L(0, 4, -40) },
  },
  lookPoints: {
    ML_JOURNAL: JOURNAL,
    ML_TORNADO_TOP: L(0, 12, -40),
  },
  beats: [
    fade('l3-ml-enter', M, 'ML_START', { music: 'blank-wander', objective: 'l3-margin', barks: ['l3-ml-1'] }),
    fight('l3-ml-walkway', M, { barks: ['l3-falling-books'] }),
    travel('l3-ml-cross', M, ['ML_START', 'ML_WALK'], 5),
    fight('l3-ml-m1', M, { music: 'citadel-battle' }),
    travel('l3-ml-to-heart', M, ['ML_WALK', 'ML_HEART'], 3),
    reveal('l3-journal-burns', M, 'ML_HEART', ['ML_JOURNAL', 'ML_TORNADO_TOP'], 0.8, 1.6, {
      attention: 'spectacle',
      barks: ['l3-journal'],
      fx: [
        { kind: 'pillar', at: 'ML_JOURNAL', atBeat: 0.1, scale: 1.4, color: '#ff5a1a' },
        { kind: 'leaves', at: 'ML_TORNADO_TOP', atBeat: 0.3, scale: 2.4, color: '#f3ead2' },
      ],
    }),
    fight('l3-journal', M),
    fight('l3-ml-wisps', M, { barks: ['l3-pip-unmade', 'l3-mira-wrong'] }),
    fight('l3-ml-quill', M, { barks: ['l3-quill-page'] }),
    fight('l3-quill-wave', M, { barks: ['l3-quill-try'] }),
    checkpoint('l3-ml-checkpoint', M, 'margin-library-remembered', { objective: 'l3-gallery' }),
  ],
  encounters: [
    {
      id: 'l3-ml-walkway',
      areaId: M,
      kind: 'combat',
      waves: [
        {
          id: 'walkway',
          sequential: true,
          targets: (['ledge', 'bridge', 'walkway'] as const).map((word, i) => pathWord(`walk-${i + 1}`, WALKWAYS[i] ?? L(0, 0, -8), word, `l3-walk-${i + 1}`)),
        },
        {
          id: 'books',
          targets: [
            fireball('falling-book-1', L(-3, 14, -10), L(-0.4, 1.8, 6.4)),
            fireball('falling-book-2', L(3, 14, -12), L(0.5, 1.6, 6.4), { delaySec: 1.6 }),
          ],
        },
      ],
    },
    {
      id: 'l3-ml-m1',
      areaId: M,
      kind: 'combat',
      waves: [
        { id: 'pages', targets: [greyPage('ml-page-1', [L(-4, 3, -28), L(4, 3.4, -30)]), greyPage('ml-page-2', [L(4, 4, -31), L(-3, 3.6, -29)], { delaySec: 0.5 }), greyPage('ml-page-3', [L(-1, 4.6, -33), L(4, 4.2, -32)], { delaySec: 1 })] },
        { id: 'wisps', targets: [wisp('ml-wisp-1', [L(-6, 0, -32), L(-3, 0, -26), L(-1, 0, -21.6)]), wisp('ml-wisp-2', [L(6, 0, -32), L(3, 0, -26), L(1, 0, -21.6)], { delaySec: 1.2 })] },
      ],
    },
    {
      id: 'l3-journal',
      areaId: M,
      kind: 'interaction',
      waves: [
        {
          id: 'memories',
          sequential: true,
          targets: ([['orb', 'memory-4', 'l3-mem-4'], ['quill', 'memory-5', 'l3-mem-5'], ['flee', 'memory-6', 'l3-mem-6']] as const).map(([word, page, bark], i) =>
            target(`journal-page-${i + 1}`, 'star-page', L(-2 + i * 2, 5 + i, -38), [word], {
              labelHeight: 0.4,
              movement: { kind: 'patrol', path: [L(-3 + i * 2, 4 + i, -39), L(-1 + i * 2, 6 + i, -38)], speed: 0.8 },
              reward: { starPage: page },
              defeatBark: bark,
              defeatFx: { kind: 'flash', scale: 1, color: '#ffe6a0' },
            }),
          ),
        },
      ],
    },
    {
      id: 'l3-ml-wisps',
      areaId: M,
      kind: 'combat',
      waves: [{ id: 'wisps', targets: [wisp('jw-1', [L(-5, 2, -40), L(-2, 0.5, -34), L(-1, 0, -32.6)]), wisp('jw-2', [L(5, 2, -40), L(2, 0.5, -34), L(1, 0, -32.6)], { delaySec: 1 })] }],
    },
    {
      id: 'l3-ml-quill',
      areaId: M,
      kind: 'interaction',
      waves: [{ id: 'page', targets: [marker('last-page', L(0, 3.2, -38), 'bright', { labelHeight: 0.4, defeatFx: { kind: 'pillar', scale: 1.4, color: '#ffd27a' } })] }],
      onComplete: { unlockSpell: 'bright-quill' },
    },
    powerWave(
      'l3-quill-wave',
      M,
      'sprite',
      [
        [
          { path: [L(-7, 0, -42), L(-4, 0, -37), L(-2.4, 0, -35)], variant: 'grey' },
          { path: [L(7, 0, -42), L(4, 0, -37), L(2.4, 0, -35)], variant: 'grey' },
          { path: [L(0, 0, -46), L(0, 0, -40), L(0, 0, -37)], variant: 'grey' },
        ],
        [
          { path: [L(-8, 0, -36), L(-5, 0, -35), L(-3.4, 0, -34)], variant: 'grey' },
          { path: [L(8, 0, -36), L(5, 0, -35), L(3.4, 0, -34)], variant: 'grey' },
        ],
      ],
      { labelHeight: 0.9, defeatFx: { kind: 'burst', scale: 1.2, color: '#ff6ad5' } },
    ),
  ],
};

export const gallery3: AreaScript = {
  nodes: {
    G3_START: { position: Y(0, 1.6, 16), lookAt: Y(0, 2.4, -4) },
    G3_ARENA: { position: Y(0, 1.7, 4), lookAt: Y(0, 4, -18) },
  },
  lookPoints: {
    G3_WALL: Y(0, 4, -22),
    G3_PW_HEAD: Y(0, 7, -20),
  },
  beats: [
    fade('l3-g3-enter', G, 'G3_START', { music: 'blank-wander', objective: 'l3-gallery', barks: ['l3-g3-1'] }),
    fight('l3-sculptures', G),
    travel('l3-g3-to-arena', G, ['G3_START', 'G3_ARENA'], 4),
    reveal('l3-perfect-warden', G, 'G3_ARENA', ['G3_WALL', 'G3_PW_HEAD'], 0.8, 6.5, {
      attention: 'boss-intro',
      music: 'citadel-battle',
      barks: ['l3-voice-pw'],
      objective: 'l3-perfect-warden',
      fx: [
        { kind: 'debris', at: 'G3_WALL', atBeat: 0.1, scale: 3, color: '#7a7a80' },
        { kind: 'shockwave', at: 'G3_WALL', atBeat: 0.1, scale: 2, color: '#ff3a1a' },
        { kind: 'shake', atBeat: 0.1, scale: 2 },
        { kind: 'flash', atBeat: 0.1 },
      ],
    }),
    fight('l3-pw-1', G, { barks: ['l3-pw-mirror'] }),
    fight('l3-pw-2', G, { barks: ['l3-pw-perfect'] }),
    fight('l3-pw-3', G, { barks: ['l3-pw-together'] }),
    checkpoint('l3-g3-checkpoint', G, 'perfect-warden-defeated', { barks: ['l3-pw-done', 'l3-pw-after'], objective: 'l3-sea' }),
  ],
  encounters: [
    {
      id: 'l3-sculptures',
      areaId: G,
      kind: 'interaction',
      optionalPrompt: 'l3-sculptures',
      speedRound: { sec: 10 },
      waves: [
        {
          id: 'sculptures',
          sequential: true,
          targets: [colour('sculpt-fountain', Y(-6, 2, -2), 'fountain', 'l3-sculpt-1'), colour('sculpt-carousel', Y(6, 2.4, -4), 'carousel', 'l3-sculpt-2'), colour('sculpt-tower', Y(-9, 4, -12), 'tower', 'l3-sculpt-3')],
        },
      ],
      onComplete: { reward: { starPage: 'memory-7' } },
    },
    {
      id: 'l3-pw-1',
      areaId: G,
      kind: 'combat',
      bossPhase: 'pw-mirror',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'plates-1',
          sequential: true,
          targets: [0, 1, 2].map((i) => marker(`pw-plate-${i + 1}`, Y(-1.5 + i * 1.5, 3 + (i % 2) * 1.6, -19), len(5, 6), { labelHeight: 0.3, erased: true, defeatFx: { kind: 'debris', scale: 1, color: '#2a2a30' } })),
        },
        {
          id: 'arcs',
          targets: [
            fireball('pw-arc-1', PW_CORE, Y(-0.6, 1.7, 2.6)),
            marker('pw-plate-4', Y(-1, 5.6, -19), len(5, 6), { labelHeight: 0.3, erased: true }),
            marker('pw-plate-5', Y(1.2, 2.2, -19), len(5, 6), { labelHeight: 0.3, erased: true, delaySec: 1 }),
            fireball('pw-arc-2', PW_CORE, Y(0.6, 1.8, 2.6), { delaySec: 2 }),
          ],
        },
      ],
      hazard: { attacks: ['pulse'], firstDelaySec: 6, intervalSec: 9, windupSec: 1.8, damage: 12 },
    },
    {
      id: 'l3-pw-2',
      areaId: G,
      kind: 'combat',
      bossPhase: 'pw-shell',
      assistAfterFailures: 2,
      waves: [
        {
          id: 'shell',
          sequential: true,
          targets: [0, 1, 2].map((i) => marker(`pw-shell-${i + 1}`, Y(-1 + i, 3.4 + i * 0.4, -18.6), len(5, 7), { labelHeight: 0.3, perfectOnly: true, defeatFx: { kind: 'shockwave', scale: 0.8, color: '#ff3a1a' } })),
        },
      ],
    },
    {
      id: 'l3-pw-3',
      areaId: G,
      kind: 'interaction',
      bossPhase: 'pw-crack',
      beam: { to: PW_CORE, color: '#ff3a1a' },
      waves: [{ id: 'crack', targets: [target('pw-phrase', 'marker', Y(0, 4.4, -18.4), ['cracks', 'are', 'not', 'flaws'], { labelHeight: 0.5, phrase: true })] }],
      onComplete: { flags: ['l3-perfect-warden-gone'] },
      completeFx: [
        { kind: 'flash' },
        { kind: 'debris', at: 'G3_PW_HEAD', scale: 4, color: '#2a2a30' },
        { kind: 'burst', at: 'G3_PW_HEAD', scale: 3, color: '#ff5a1a' },
        { kind: 'shake', scale: 2 },
      ],
    },
  ],
};
