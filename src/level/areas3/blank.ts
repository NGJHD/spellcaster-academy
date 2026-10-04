/**
 * Level 3 templates (LEVEL3_DESIGN M3 and L3-4): the Unwriter's constructs, path words that write the
 * route ahead, colour restoration, Memory Pages and fire tides.
 */
import type { TargetSpawn, WordSpec } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { len, marker, target } from '../areas/builders';
import { HUSH_ATTACKS, fireball } from '../areas2/hush';

export const correctionMoth = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'correction-moth', path[0] ?? [0, 3, 0], [len(4, 6)], {
    movement: { kind: 'patrol', path, speed: 1.6 },
    attack: HUSH_ATTACKS.mothDust,
    labelHeight: 0.9,
    erased: true,
    weak: true,
    entrance: { kind: 'sparks', scale: 0.8, color: '#ff8a3a' },
    // Bursts into embers and leaves a bright butterfly behind (M3-1).
    defeatFx: { kind: 'burst', scale: 1.3, color: '#ffd24a' },
    ...options,
  });

export const redactor = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'redactor', path[0] ?? [0, 0, 0], [len(5, 7)], {
    movement: { kind: 'approach', path, speed: 0.7 },
    attack: { kind: 'contact', windupSec: 2.2, recoverSec: 1.2, intervalSec: 5, damage: 10 },
    labelHeight: 2.6,
    priority: true,
    erased: true,
    entrance: { kind: 'geyser', scale: 0.8, color: '#140808' },
    defeatFx: { kind: 'pillar', scale: 0.8, color: '#ffe6a0' },
    ...options,
  });

export const foreman = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'foreman', path[0] ?? [0, 0, 0], [len(5, 7), len(5, 7), len(5, 7)], {
    movement: { kind: 'approach', path, speed: 0.45 },
    attack: HUSH_ATTACKS.knightSweep,
    labelHeight: 3.1,
    entrance: { kind: 'dust', scale: 1.6, color: '#2a2220' },
    defeatFx: { kind: 'shockwave', scale: 1.2, color: '#ff5a1a' },
    persist: true,
    ...options,
  });

/**
 * A path word (L3-4): the route ahead is blank paper until written. Completing it sets `flag`, which
 * draws that section of path in coloured ink (scene), and the camera moves on.
 */
export const pathWord = (id: string, position: Vec3, word: WordSpec, flag: string, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  marker(id, position, word, {
    labelHeight: 0.35,
    defeatFlag: flag,
    defeatFx: { kind: 'burst', scale: 1.1, color: '#7ad0ff' },
    ...options,
  });

/** A burnt, smouldering object: an optional word quenches it and repaints it (colour restored). */
export const colour = (id: string, position: Vec3, word: WordSpec, flag: string, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  marker(id, position, word, {
    optional: true,
    leaveAfterSec: 18,
    labelHeight: 0.45,
    defeatFlag: flag,
    reward: { score: 60 },
    defeatFx: { kind: 'burst', scale: 1.8, color: '#7ae0a0' },
    ...options,
  });

/** A Memory Page collectible (L3-17): one of eight. */
export const memoryPage = (id: string, position: Vec3, word: WordSpec, page: string, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'star-page', position, [word], {
    optional: true,
    leaveAfterSec: 14,
    labelHeight: 0.4,
    reward: { starPage: page },
    defeatFx: { kind: 'burst', scale: 1.2, color: '#ffe6a0' },
    ...options,
  });

/**
 * A fire tide (L3-4): a wall of inkfire rolling across the view, countered by a two-word phrase typed
 * in order on one tag. It takes the lock like any counter-word.
 */
export const fireTide = (id: string, from: Vec3, to: Vec3, words: readonly [string, string], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  fireball(id, from, to, {
    words,
    phrase: true,
    movement: { kind: 'approach', path: [from, to], speed: 1.1 },
    attack: { kind: 'contact', windupSec: 1.5, recoverSec: 0.3, intervalSec: 99, damage: 14 },
    labelHeight: 0.8,
    defeatFx: { kind: 'shockwave', scale: 2.2, color: '#9fd8ff' },
    ...options,
  });

export { fireball };
