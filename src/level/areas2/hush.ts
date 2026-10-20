/**
 * Level 2 enemy templates (LEVEL2_DESIGN M2): the Hush, ink-and-ember constructs that burst into
 * sparks when beaten. Every spawn and path is authored per encounter (MD-1).
 */
import type { AttackSpec, FxCue, TargetSpawn, WordSpec } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';
import { len, marker, target } from '../areas/builders';

export const HUSH_ATTACKS = {
  blotInk: { kind: 'contact', windupSec: 1.0, recoverSec: 0.8, intervalSec: 1.4, damage: 7 },
  mothDust: { kind: 'ranged', windupSec: 1.2, recoverSec: 0.6, intervalSec: 4, damage: 6 },
  houndLunge: { kind: 'contact', windupSec: 0.9, recoverSec: 0.9, intervalSec: 1.2, damage: 10 },
  knightSweep: { kind: 'contact', windupSec: 1.6, recoverSec: 1.2, intervalSec: 4.5, damage: 14 },
  impScratch: { kind: 'contact', windupSec: 1.1, recoverSec: 0.8, intervalSec: 1.6, damage: 5 },
  /**
   * A fireball reaching the camera if its counter-word is not typed. It strikes as soon as it arrives,
   * then bounces back and comes again until the word is typed (owner, 2026-10-20: it waited 99 s, so
   * fireballs hung in front of the camera and never hit).
   */
  fireball: { kind: 'contact', windupSec: 0.8, recoverSec: 0.3, intervalSec: 0.3, damage: 8 },
} satisfies Record<string, AttackSpec>;

const SPARKS: FxCue = { kind: 'burst', scale: 0.9, color: '#ff7a2a' };
const ASH_POOF: FxCue = { kind: 'dust', scale: 0.8, color: '#3a3330' };

export const blotling = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'blotling', path[0] ?? [0, 0, 0], [len(3, 5)], {
    movement: { kind: 'approach', path, speed: 2.2 },
    attack: HUSH_ATTACKS.blotInk,
    labelHeight: 1.0,
    weak: true,
    entrance: { kind: 'geyser', scale: 0.5, color: '#1a1414' },
    defeatFx: SPARKS,
    ...options,
  });

export const moth = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'eraser-moth', path[0] ?? [0, 3, 0], [len(4, 5)], {
    movement: { kind: 'patrol', path, speed: 1.6 },
    attack: HUSH_ATTACKS.mothDust,
    labelHeight: 0.9,
    weak: true,
    entrance: { kind: 'sparks', scale: 0.8, color: '#ff8a3a' },
    defeatFx: { kind: 'burst', scale: 1.2, color: '#ffa040' },
    ...options,
  });

export const scribbleImp = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'scribble-imp', path[0] ?? [0, 0, 0], [len(3, 4)], {
    movement: { kind: 'approach', path, speed: 2.4 },
    attack: HUSH_ATTACKS.impScratch,
    labelHeight: 1.1,
    weak: true,
    entrance: { kind: 'sparks', scale: 0.6, color: '#ff6a2a' },
    defeatFx: SPARKS,
    ...options,
  });

export const hound = (id: string, path: Vec3[], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'smudgehound', path[0] ?? [0, 0, 0], [len(4, 6)], {
    movement: { kind: 'approach', path, speed: 2.7 },
    attack: HUSH_ATTACKS.houndLunge,
    labelHeight: 1.4,
    priority: true,
    entrance: { kind: 'dust', scale: 1, color: '#2a2220' },
    defeatFx: { kind: 'burst', scale: 1.3, color: '#ff5a1a' },
    ...options,
  });

export const knight = (id: string, path: Vec3[], words: readonly WordSpec[] = [len(5, 7), len(5, 7)], options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'hollow-knight', path[0] ?? [0, 0, 0], words, {
    movement: { kind: 'approach', path, speed: 0.95 },
    attack: HUSH_ATTACKS.knightSweep,
    labelHeight: 2.5,
    entrance: { kind: 'dust', scale: 1.2, color: '#2a2220' },
    // A beaten knight bursts apart; it used to stay standing and looked like a mob nobody could target
    // (owner, 2026-10-08: "it just... exists").
    defeatFx: { kind: 'shockwave', scale: 0.8, color: '#ff5a1a' },
    ...options,
  });

/**
 * A fireball (or ink blast) streaking at the camera with a counter-word: typing it raises the Ward
 * Shield and deflects it into sparks (L2-4). It takes the lock even mid-word.
 */
export const fireball = (id: string, from: Vec3, to: Vec3, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'fireball', from, [len(3, 3)], {
    movement: { kind: 'approach', path: [from, to], speed: 2.4 },
    attack: HUSH_ATTACKS.fireball,
    // The word sits just above the flames, never over them (owner: "where are the fireballs?"), and no
    // higher (owner, 2026-10-16: "bag", "pen" and "cup" floated far above their fireballs).
    labelHeight: 0.9,
    counter: true,
    weak: true,
    defeatFx: { kind: 'shockwave', scale: 0.4, color: '#9fd8ff' },
    ...options,
  });

/** A burning object's restore word: blasts out the inkfire and repaints it (L2-4). */
export const restore = (id: string, position: Vec3, word: string, flag: string, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  marker(id, position, word, {
    labelHeight: 0.5,
    defeatFlag: flag,
    defeatFx: { kind: 'burst', scale: 1.6, color: '#ffe6a0' },
    ...options,
  });

/** A floating Festival Lantern collectible (L2-17): a bonus word, never required. */
export const lantern = (id: string, position: Vec3, word: string, page: string, options: Partial<TargetSpawn> = {}): TargetSpawn =>
  target(id, 'gem', position, [word], {
    optional: true,
    leaveAfterSec: 14,
    labelHeight: 0.4,
    variant: 'lantern',
    reward: { starPage: page },
    defeatFx: { kind: 'burst', scale: 1, color: '#ffd27a' },
    ...options,
  });

export { ASH_POOF };
