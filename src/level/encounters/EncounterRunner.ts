/**
 * Runs one encounter (§6A): Intro → Active → Resolving → Complete, wave by wave.
 * Owns its targets and word assignment; reports gameplay events to the caller.
 */
import { WORDS } from '../../content/wordLists';
import { DIFFICULTY, adjustLengthRange, type DifficultyProfile } from '../../game/difficulty';
import type { Difficulty } from '../../game/types';
import {
  NEXT_WORD_DELAY_SEC,
  PROJECTILE_SEC,
  createTarget,
  currentWord,
  interruptAttack,
  setPhase,
  updateTarget,
  type TargetRuntime,
} from '../../enemies/EnemyBrain';
import type { TypingCandidate } from '../../typing/TypingEngine';
import { WordAssigner, createRng, hashString } from '../../typing/WordAssigner';
import type { EncounterDef, HazardAttack, TargetSpawn, Wave, WordSpec } from '../levelTypes';

export const INTRO_SEC = 0.3;
export const SEQUENTIAL_GAP_SEC = 0.3;
export const RESOLVE_SEC = 0.5;

export type EncounterState = 'intro' | 'active' | 'wave-gap' | 'resolving' | 'complete';

export type EncounterEvent =
  | { readonly type: 'wave-start'; readonly wave: number }
  | { readonly type: 'wave-complete'; readonly wave: number }
  | { readonly type: 'complete' }
  | { readonly type: 'target-spawned'; readonly target: TargetRuntime }
  | { readonly type: 'target-active'; readonly target: TargetRuntime }
  | { readonly type: 'target-gone'; readonly target: TargetRuntime }
  | { readonly type: 'target-left'; readonly target: TargetRuntime }
  | { readonly type: 'windup'; readonly target: TargetRuntime }
  | { readonly type: 'hit'; readonly damage: number; readonly source: TargetRuntime | null }
  | { readonly type: 'hazard-windup'; readonly attack: HazardAttack; readonly windupSec: number }
  | { readonly type: 'hazard-hit'; readonly attack: HazardAttack; readonly damage: number }
  | { readonly type: 'assist-enabled' }
  | { readonly type: 'words-changed' };

export interface EncounterContext {
  readonly difficulty: Difficulty;
  assist: boolean;
  /** Seed salt so a replayed wave can differ from a failed attempt. */
  readonly attempt: number;
}

export interface WordResult {
  readonly defeated: boolean;
  /** Target defeated before any other target in this wave. */
  readonly firstDefeat: boolean;
}

export class EncounterRunner {
  readonly targets = new Map<string, TargetRuntime>();
  state: EncounterState = 'intro';
  waveIndex: number;
  private stateTime = 0;
  private waveTime = 0;
  private pendingSpawns: TargetSpawn[] = [];
  private sequentialQueue: TargetSpawn[] = [];
  private sequentialGap = 0;
  private defeatsThisWave = 0;
  private extraCount = 0;
  private qualifying = 0;
  private streak = 0;
  private streakBreaks = 0;
  private hazardTimer = 0;
  private hazardWindup: { attack: HazardAttack; remaining: number } | null = null;
  private hazardIndex = 0;
  private assigner: WordAssigner;
  private readonly profile: DifficultyProfile;
  /** Total defeats across the encounter (bark triggers). */
  totalDefeats = 0;

  constructor(
    readonly def: EncounterDef,
    readonly ctx: EncounterContext,
    startWave = 0,
  ) {
    this.waveIndex = Math.min(startWave, def.waves.length - 1);
    this.profile = DIFFICULTY[ctx.difficulty];
    this.assigner = this.newAssigner();
  }

  get wave(): Wave | undefined {
    return this.def.waves[this.waveIndex];
  }

  get hazardTelegraph(): { attack: HazardAttack; remaining: number } | null {
    return this.hazardWindup;
  }

  /** Completed / total required targets in the current wave, for scene progress (anchors, plates). */
  get waveProgress(): { done: number; total: number } {
    const wave = this.wave;
    const total = wave ? wave.targets.filter((t) => !t.optional).length : 0;
    return { done: Math.min(this.defeatsThisWave, total), total };
  }

  private newAssigner(): WordAssigner {
    const seed = hashString(`${this.def.id}:${this.waveIndex}:${this.ctx.attempt}`);
    return new WordAssigner(WORDS, createRng(seed));
  }

  /** Words the typing engine may target right now. */
  candidates(): TypingCandidate[] {
    const list: TypingCandidate[] = [];
    for (const t of this.targets.values()) {
      const word = currentWord(t);
      if (word) list.push(t.spawn.counter ? { id: t.id, word, interrupt: true } : { id: t.id, word });
    }
    return list;
  }

  update(dt: number, timeScale: number, lockedId: string | null): EncounterEvent[] {
    const events: EncounterEvent[] = [];
    this.stateTime += dt;

    if (this.state === 'intro') {
      if (this.stateTime >= INTRO_SEC) this.beginWave(events);
    } else if (this.state === 'wave-gap') {
      if (this.stateTime >= this.profile.waveGapSec) {
        this.waveIndex++;
        this.assigner = this.newAssigner();
        this.beginWave(events);
      }
    } else if (this.state === 'resolving') {
      if (this.stateTime >= RESOLVE_SEC) {
        this.state = 'complete';
        events.push({ type: 'complete' });
      }
    }

    if (this.state === 'active') {
      this.waveTime += dt;
      this.spawnDue(dt, events);
      this.updateHazard(dt * timeScale, events);
    }

    const brainEvents = {
      windup: (t: TargetRuntime) => events.push({ type: 'windup', target: t }),
      hit: (t: TargetRuntime, damage: number) => {
        if (this.def.kind === 'combat') events.push({ type: 'hit', damage, source: t });
      },
    };
    for (const t of this.targets.values()) {
      const before = t.phase;
      updateTarget(t, dt, timeScale, t.id === lockedId, this.profile, brainEvents);
      if (before === 'appearing' && t.phase === 'active') {
        this.assignWord(t);
        events.push({ type: 'target-active', target: t });
        events.push({ type: 'words-changed' });
      }
      if (t.phase === 'active' && t.wordDelay === 0 && t.words[t.stage] === undefined) {
        this.assignWord(t);
        events.push({ type: 'words-changed' });
      }
      // Owner (2026-10-06): a word never disappears on a timer; the game waits for the child.
      if (t.phase === 'gone' && before !== 'gone') {
        events.push({ type: 'target-gone', target: t });
      }
    }
    for (const [id, t] of this.targets) if (t.phase === 'gone') this.targets.delete(id);

    if (this.state === 'active') this.checkWaveDone(events);
    return events;
  }

  /** A word on `targetId` was completed. Advances the stage or defeats the target. */
  completeWord(targetId: string, mistakes: number): WordResult {
    const t = this.targets.get(targetId);
    if (!t || t.defeated) return { defeated: false, firstDefeat: false };
    const word = t.words[t.stage] ?? '';
    interruptAttack(t);
    // Every completed word buys a breather: the target's attack clock and the arena hazard clock restart,
    // so a creature that has just been hit never lands a blow while the next word is still appearing.
    t.attackTimer = 0;
    this.hazardTimer = 0;
    t.sinceHit = -PROJECTILE_SEC;
    this.trackRules(word, mistakes);

    if (t.spawn.perfectOnly && mistakes > 0 && this.ctx.difficulty !== 'gentle') {
      t.halfCredit++;
      // The same word comes back; the second imperfect try still counts.
      if (t.halfCredit < 2) return { defeated: false, firstDefeat: false };
      t.halfCredit = 0;
    }

    if (t.stage + 1 < t.spawn.words.length) {
      t.stage++;
      t.wordDelay = PROJECTILE_SEC + NEXT_WORD_DELAY_SEC;
      if (t.spawn.shield && t.stage === 1) {
        setPhase(t, 'stunned');
        t.phaseTime = -PROJECTILE_SEC;
      }
      return { defeated: false, firstDefeat: false };
    }
    t.defeated = true;
    setPhase(t, 'dispelling');
    t.phaseTime = -PROJECTILE_SEC;
    this.hazardWindup = null;
    const firstDefeat = this.defeatsThisWave === 0;
    if (!t.spawn.optional) this.defeatsThisWave++;
    this.totalDefeats++;
    return { defeated: true, firstDefeat };
  }

  /** Chain Spark / external dispel of a weak target. */
  dispel(targetId: string): boolean {
    const t = this.targets.get(targetId);
    if (!t || t.defeated || t.phase !== 'active') return false;
    t.defeated = true;
    setPhase(t, 'dispelling');
    if (!t.spawn.optional) this.defeatsThisWave++;
    this.totalDefeats++;
    return true;
  }

  /** Focus reached zero: put the current wave back to its start. */
  restartWave(): void {
    this.targets.clear();
    this.hazardWindup = null;
    this.hazardTimer = 0;
    this.hazardIndex = 0;
    this.assigner = this.newAssigner();
    this.state = 'intro';
    this.stateTime = 0;
  }

  private beginWave(events: EncounterEvent[]): void {
    const wave = this.wave;
    if (!wave) {
      this.state = 'resolving';
      this.stateTime = 0;
      return;
    }
    this.state = 'active';
    this.stateTime = 0;
    this.waveTime = 0;
    this.defeatsThisWave = 0;
    this.extraCount = 0;
    this.qualifying = 0;
    this.streak = 0;
    this.hazardTimer = 0;
    this.hazardWindup = null;
    const spawns = wave.targets.filter((s) => !s.challengeOnly || this.profile.extraTargets);
    for (const s of spawns) for (const w of s.words) if (typeof w === 'string') this.assigner.reserve(w);
    if (wave.sequential) {
      this.sequentialQueue = spawns.slice();
      this.pendingSpawns = [];
      this.sequentialGap = 0;
    } else {
      this.pendingSpawns = spawns.slice();
      this.sequentialQueue = [];
    }
    events.push({ type: 'wave-start', wave: this.waveIndex });
    this.spawnDue(0, events);
  }

  private spawnDue(dt: number, events: EncounterEvent[]): void {
    for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
      const s = this.pendingSpawns[i];
      if (s && this.waveTime >= (s.delaySec ?? 0)) {
        this.pendingSpawns.splice(i, 1);
        this.spawn(s, events);
      }
    }
    if (this.sequentialQueue.length > 0) {
      const busy = [...this.targets.values()].some((t) => !t.defeated && !t.spawn.optional);
      if (busy) {
        this.sequentialGap = 0;
      } else {
        this.sequentialGap += dt;
        const next = this.sequentialQueue[0];
        const firstOfWave = this.defeatsThisWave === 0 && this.extraCount === 0;
        const gapNeeded = firstOfWave ? 0 : SEQUENTIAL_GAP_SEC;
        if (next && this.waveTime >= (next.delaySec ?? 0) && this.sequentialGap >= gapNeeded) {
          this.sequentialQueue.shift();
          this.spawn(next, events);
        }
      }
    }
  }

  private spawn(s: TargetSpawn, events: EncounterEvent[]): void {
    const t = createTarget(s);
    setPhase(t, 'appearing');
    this.targets.set(t.id, t);
    events.push({ type: 'target-spawned', target: t });
  }

  private assignWord(t: TargetRuntime): void {
    if (t.words[t.stage] !== undefined) return;
    const spec: WordSpec | undefined = t.spawn.words[t.stage];
    if (spec === undefined) return;
    if (typeof spec === 'string') {
      t.words[t.stage] = spec;
      return;
    }
    const active: string[] = [];
    for (const other of this.targets.values()) {
      if (other === t || other.defeated) continue;
      const w = other.words[other.stage];
      if (w) active.push(w);
    }
    const [min, max] = adjustLengthRange([spec.min, spec.max], this.ctx.difficulty, this.ctx.assist);
    t.words[t.stage] = this.assigner.pick({ minLength: min, maxLength: max, category: spec.category }, active);
  }

  private trackRules(word: string, mistakes: number): void {
    const rule = this.wave?.rule;
    if (!rule) return;
    if (rule.kind === 'qualify') {
      const accuracy = word.length / (word.length + mistakes);
      if (accuracy >= rule.minAccuracy) this.qualifying++;
    } else if (rule.kind === 'streak') {
      if (mistakes === 0) this.streak++;
      else {
        this.streak = 0;
        this.streakBreaks++;
      }
    }
  }

  private checkWaveDone(events: EncounterEvent[]): void {
    const wave = this.wave;
    if (!wave) return;
    if (this.pendingSpawns.length > 0 || this.sequentialQueue.length > 0) return;
    // Every word that was shown, optional or not, is waited for (owner: "don't skip anything").
    if ([...this.targets.values()].some((t) => !t.defeated && t.phase !== 'leaving' && t.phase !== 'gone')) return;

    const rule = wave.rule;
    if (rule?.kind === 'qualify' && this.qualifying < rule.needed) {
      this.queueExtra(rule.extra);
      return;
    }
    if (rule?.kind === 'streak' && this.streak < rule.needed) {
      if (!this.ctx.assist && this.streakBreaks >= rule.assistAfterBreaks) {
        this.ctx.assist = true;
        events.push({ type: 'assist-enabled' });
      }
      this.queueExtra(rule.extra);
      return;
    }

    for (const t of this.targets.values()) {
      if (!t.defeated && t.phase !== 'leaving') {
        setPhase(t, 'leaving');
        events.push({ type: 'target-left', target: t });
      }
    }
    events.push({ type: 'words-changed' });
    events.push({ type: 'wave-complete', wave: this.waveIndex });
    this.hazardWindup = null;
    if (this.waveIndex + 1 < this.def.waves.length) {
      this.state = 'wave-gap';
    } else {
      this.state = 'resolving';
    }
    this.stateTime = 0;
  }

  private queueExtra(template: TargetSpawn): void {
    this.extraCount++;
    this.sequentialQueue.push({ ...template, id: `${template.id}-extra-${this.extraCount}`, delaySec: 0 });
  }

  private updateHazard(simDt: number, events: EncounterEvent[]): void {
    const h = this.def.hazard;
    if (!h || this.def.kind !== 'combat') return;
    // Hazards only run while there is something to type; no damage between targets or words.
    const typeable = [...this.targets.values()].some((t) => !t.spawn.optional && currentWord(t) !== null);
    if (!typeable) {
      this.hazardWindup = null;
      return;
    }
    if (this.hazardWindup) {
      this.hazardWindup.remaining -= simDt;
      if (this.hazardWindup.remaining <= 0) {
        events.push({ type: 'hazard-hit', attack: this.hazardWindup.attack, damage: h.damage * this.profile.damage });
        this.hazardWindup = null;
        this.hazardTimer = 0;
      }
      return;
    }
    this.hazardTimer += simDt;
    const threshold = this.hazardIndex === 0 ? h.firstDelaySec : h.intervalSec;
    if (this.hazardTimer >= threshold) {
      const attack = h.attacks[this.hazardIndex % h.attacks.length] ?? 'pulse';
      this.hazardIndex++;
      const windupSec = Math.max(this.profile.minWindupSec, h.windupSec * this.profile.windup);
      this.hazardWindup = { attack, remaining: windupSec };
      events.push({ type: 'hazard-windup', attack, windupSec });
    }
  }
}
