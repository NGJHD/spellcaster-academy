/**
 * Target simulation (MD-1): a small finite-state machine driven entirely by authored data.
 *   Appearing → Active (approach / patrol / orbit / static) ⇄ attack (wind-up → hit → recover)
 *   → Stunned (shield break) → Dispelling → Gone
 * Plain TypeScript; renderers read the state each frame.
 */
import { Vector3 } from 'three';
import type { DifficultyProfile } from '../game/difficulty';
import type { TargetSpawn } from '../level/levelTypes';

export const APPEAR_SEC = 0.45;
/** Shield break: the shield shatters when the projectile lands, then the binding word appears. */
export const SHIELD_BREAK_SEC = 0.25;
export const NEXT_WORD_DELAY_SEC = 0.45;
export const DISPEL_SEC = 1.0;
export const PROJECTILE_SEC = 0.25;
/** Targeted enemies move at this fraction of their speed so the word stays readable. */
export const TARGETED_SPEED = 0.35;
export const FROST_SLOW = 0.35;
export const FROST_SEC = 2.5;
/** Contact attackers fall back this fraction of their path after a hit (pounce and retreat). */
export const RETREAT_FRACTION = 0.3;

export type TargetPhase = 'waiting' | 'appearing' | 'active' | 'stunned' | 'dispelling' | 'leaving' | 'gone';
export type AttackPhase = 'idle' | 'windup' | 'recover';

export interface TargetRuntime {
  readonly id: string;
  readonly spawn: TargetSpawn;
  readonly position: Vector3;
  phase: TargetPhase;
  phaseTime: number;
  /** Words resolved so far (generated lazily per stage). */
  readonly words: string[];
  stage: number;
  /** Seconds before the current stage's word can be typed. */
  wordDelay: number;
  attackPhase: AttackPhase;
  attackTimer: number;
  /** Total wind-up for the current attack, for telegraph rendering. */
  windupTotal: number;
  pathDistance: number;
  pathDirection: 1 | -1;
  atPathEnd: boolean;
  frostTimer: number;
  /** Seconds since the last spell hit (for hit reactions); large when idle. */
  sinceHit: number;
  /** Imperfect completions on a perfect-only target (two count as one). */
  halfCredit: number;
  /** Time spent active (optional targets leave after a while). */
  activeTime: number;
  defeated: boolean;
  /** Animation clock for idle motion. */
  clock: number;
}

export interface BrainEvents {
  windup(target: TargetRuntime): void;
  hit(target: TargetRuntime, damage: number): void;
}

export function createTarget(spawn: TargetSpawn): TargetRuntime {
  return {
    id: spawn.id,
    spawn,
    position: new Vector3(...spawn.position),
    phase: 'waiting',
    phaseTime: 0,
    words: [],
    stage: 0,
    wordDelay: 0,
    attackPhase: 'idle',
    attackTimer: 0,
    windupTotal: 0,
    pathDistance: 0,
    pathDirection: 1,
    atPathEnd: !spawn.movement || spawn.movement.kind !== 'approach',
    frostTimer: 0,
    sinceHit: 99,
    halfCredit: 0,
    activeTime: 0,
    defeated: false,
    clock: 0,
  };
}

export function isShielded(t: TargetRuntime): boolean {
  return t.spawn.shield === true && t.stage === 0 && !t.defeated;
}

/** The word the player should type now, or null if the target is not typeable yet. */
export function currentWord(t: TargetRuntime): string | null {
  if (t.phase !== 'active' || t.defeated || t.wordDelay > 0) return null;
  return t.words[t.stage] ?? null;
}

export function setPhase(t: TargetRuntime, phase: TargetPhase): void {
  t.phase = phase;
  t.phaseTime = 0;
}

const scratch = new Vector3();

function pathLength(path: readonly (readonly [number, number, number])[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (a && b) total += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  }
  return total;
}

function pointAlong(path: readonly (readonly [number, number, number])[], distance: number, out: Vector3): Vector3 {
  let remaining = distance;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    if (!a || !b) continue;
    const seg = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (remaining <= seg || i === path.length - 1) {
      const u = seg > 0 ? Math.min(1, remaining / seg) : 1;
      return out.set(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u);
    }
    remaining -= seg;
  }
  const first = path[0];
  return first ? out.set(...first) : out;
}

/**
 * Advance one target. `timeScale` already includes the typing slowdown;
 * `targeted` is true while the player is locked onto this target.
 */
export function updateTarget(
  t: TargetRuntime,
  dt: number,
  timeScale: number,
  targeted: boolean,
  profile: DifficultyProfile,
  events: BrainEvents,
): void {
  t.phaseTime += dt;
  t.sinceHit += dt;
  t.clock += dt;
  if (t.frostTimer > 0) t.frostTimer = Math.max(0, t.frostTimer - dt);

  switch (t.phase) {
    case 'waiting':
    case 'gone':
      return;
    case 'appearing':
      if (t.phaseTime >= APPEAR_SEC) setPhase(t, 'active');
      return;
    case 'dispelling':
      if (t.phaseTime >= DISPEL_SEC) setPhase(t, 'gone');
      return;
    case 'leaving':
      t.position.y += dt * 1.5;
      if (t.phaseTime >= 0.8) setPhase(t, 'gone');
      return;
    case 'stunned':
      if (t.phaseTime >= SHIELD_BREAK_SEC) setPhase(t, 'active');
      return;
    case 'active':
      break;
  }

  if (t.wordDelay > 0) t.wordDelay = Math.max(0, t.wordDelay - dt);
  t.activeTime += dt;

  const slow = (t.frostTimer > 0 ? FROST_SLOW : 1) * (targeted ? TARGETED_SPEED : 1);
  const simDt = dt * timeScale * slow;
  move(t, simDt, profile);
  attack(t, simDt, profile, events);
}

function move(t: TargetRuntime, simDt: number, profile: DifficultyProfile): void {
  const m = t.spawn.movement;
  if (!m || m.kind === 'static') return;
  if (m.kind === 'orbit') {
    const angle = m.phase + t.clock * m.speed * profile.speed;
    t.position.set(m.centre[0] + Math.cos(angle) * m.radius, m.centre[1], m.centre[2] + Math.sin(angle) * m.radius);
    return;
  }
  const length = pathLength(m.path);
  if (length <= 0) return;
  // Hold position during wind-up and recovery so attacks read clearly.
  if (t.attackPhase !== 'idle') return;
  const step = m.speed * profile.speed * simDt;
  if (m.kind === 'approach') {
    if (t.atPathEnd) return;
    t.pathDistance = Math.min(length, t.pathDistance + step);
    if (t.pathDistance >= length) t.atPathEnd = true;
  } else {
    t.pathDistance += step * t.pathDirection;
    if (t.pathDistance >= length) {
      t.pathDistance = length;
      t.pathDirection = -1;
    } else if (t.pathDistance <= 0) {
      t.pathDistance = 0;
      t.pathDirection = 1;
    }
  }
  t.position.copy(pointAlong(m.path, t.pathDistance, scratch));
}

function attack(t: TargetRuntime, simDt: number, profile: DifficultyProfile, events: BrainEvents): void {
  const a = t.spawn.attack;
  if (!a) return;
  const canAttack = a.kind === 'ranged' || t.atPathEnd;
  if (!canAttack) return;
  // No attacks while the next word is still arriving: the player must always have a word to answer with.
  if (t.wordDelay > 0) {
    if (t.attackPhase === 'windup') t.attackPhase = 'idle';
    t.attackTimer = 0;
    return;
  }

  t.attackTimer += simDt;
  switch (t.attackPhase) {
    case 'idle':
      if (t.attackTimer >= a.intervalSec) {
        t.attackPhase = 'windup';
        t.attackTimer = 0;
        t.windupTotal = Math.max(profile.minWindupSec, a.windupSec * profile.windup);
        events.windup(t);
      }
      return;
    case 'windup':
      if (t.attackTimer >= t.windupTotal) {
        t.attackPhase = 'recover';
        t.attackTimer = 0;
        events.hit(t, a.damage * profile.damage);
      }
      return;
    case 'recover':
      if (t.attackTimer >= a.recoverSec) {
        t.attackPhase = 'idle';
        t.attackTimer = 0;
        const m = t.spawn.movement;
        if (a.kind === 'contact' && m?.kind === 'approach') {
          t.pathDistance = Math.max(0, t.pathDistance - pathLength(m.path) * RETREAT_FRACTION);
          t.atPathEnd = false;
        }
      }
      return;
  }
}

/** Interrupts any attack in progress (spell hit, frost, shield break). */
export function interruptAttack(t: TargetRuntime): void {
  if (t.attackPhase === 'windup') {
    t.attackPhase = 'idle';
    t.attackTimer = 0;
  }
}
