/**
 * One playthrough of Level 1. Plain TypeScript: the R3F driver calls `update` each frame and
 * forwards key intents; the HUD reads coarse state from the run store.
 */
import { Vector3 } from 'three';
import { audio } from '../audio/AudioManager';
import { voice } from '../audio/voice';
import { RESUME_SUMMARY, getLine, type DialogueLine } from '../content/dialogue';
import { strings } from '../content/strings';
import { FROST_SEC, isShielded, type TargetRuntime } from '../enemies/EnemyBrain';
import { EncounterRunner, type EncounterEvent } from '../level/encounters/EncounterRunner';
import { closeInEncounter } from '../level/encounters/closeIn';
import { LevelDirector } from '../level/LevelDirector';
import { LEVELS, levelOfBeat, type LevelDef } from '../level/levels';
import type { BarkTrigger, EncounterDef, FxCue, FxKind, LevelBeat, MusicId, Reward, TargetSpawn } from '../level/levelTypes';
import { isCameraBeat, type RailSettings } from '../level/rail/railTypes';
import { patchRunUi, useRunStore, type LabelInfo } from '../state/runStore';
import type { KeyIntent } from '../typing/keys';
import { TypingEngine, type TypingEvent } from '../typing/TypingEngine';
import { TypingMetricsRecorder, averageWpm, cloneMetrics, type PersistedRunMetrics } from '../typing/TypingMetrics';
import { DIFFICULTY } from './difficulty';
import {
  mergeBestResults,
  newAutosave,
  readProfile,
  writeAutosave,
  writeProfile,
  type KeyValueStorage,
  type Level1Autosave,
} from './saveData';
import { buildResults, wordScore, type ResultsData } from './scoring';
import { Combo } from './combo';
import { SpeedRound } from './speedRound';
import { MEDAL_SCORE, encounterStars } from './medals';
import { bossForEncounter, bossForIntroBeat, bossWordTotal, type BossDef } from '../level/bosses';
import type { AreaId, CosmeticId, Difficulty, SpellId } from './types';
import type { LevelId } from './types';

export const MAX_FOCUS = 100;
export const FOCUS_RESET_SEC = 1.8;
export const RESUME_INTRO_SEC = 1.5;
export const SAVE_DEBOUNCE_SEC = 0.4;
/** Chain Spark fires on every Nth consecutive perfect word. */
export const CHAIN_STREAK = 5;
export const CHAIN_TARGETS = 2;
/** Starfall: an eight-word perfect streak. */
export const STARFALL_STREAK = 8;

const SHAKE_SEC = 0.35;

/** The Pip thief flies through Pip this long after it appears (its swoop in from the corner). */
const SNATCH_GRAB_SEC = 0.75;
/** Then it carries Pip on and round to its chase position over this long. */
const SNATCH_CARRY_SEC = 1.2;
/** Height of the sprite's chest above its origin (mischief_sprite.glb, 0.75 m tall): Pip rides there. */
const SNATCH_CHEST = 0.42;
/**
 * Camera-relative [ahead, side, up]: off screen at a top corner, and the point that puts the sprite's
 * chest on Pip (PipCompanion OFFSET_CALM: 1.7 ahead, 0.85 aside, 0.05 below the eye).
 */
const SNATCH_FROM = [2.4, -3.6, 1.8] as const;
const SNATCH_GRAB = [1.7, 0.85, -0.05 - SNATCH_CHEST] as const;

/**
 * The thief's camera-relative point at `age` (owner, 2026-10-19: "let the sprite go through Pip, then
 * Pip is held in the chest"): it dives along a straight line, accelerating, right through the spot
 * where Pip floats without stopping, and its momentum carries it on before it curves round to `follow`.
 */
function snatchPath(age: number, follow: { ahead: number; side: number; up: number }): readonly [number, number, number] {
  const dir = [SNATCH_GRAB[0] - SNATCH_FROM[0], SNATCH_GRAB[1] - SNATCH_FROM[1], SNATCH_GRAB[2] - SNATCH_FROM[2]] as const;
  if (age < SNATCH_GRAB_SEC) {
    const k = age / SNATCH_GRAB_SEC;
    const e = k * k * (2 - k); // speeds up and arrives still moving (slope 1 at the grab)
    return [SNATCH_FROM[0] + dir[0] * e, SNATCH_FROM[1] + dir[1] * e, SNATCH_FROM[2] + dir[2] * e];
  }
  // A quadratic curve from the grab: its control point carries on along the dive (the follow-through).
  const k = Math.min(1, (age - SNATCH_GRAB_SEC) / SNATCH_CARRY_SEC);
  const u = 1 - (1 - k) * (1 - k);
  const end = [follow.ahead, follow.side, follow.up] as const;
  const out = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const a = SNATCH_GRAB[i] ?? 0;
    const c = a + (dir[i] ?? 0) * 0.35;
    const b = end[i] ?? 0;
    out[i] = (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;
  }
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0];
}

export interface RunSettings {
  readonly rail: RailSettings;
}

export interface RunOptions {
  readonly difficulty: Difficulty;
  readonly resume: Level1Autosave | null;
  readonly storage: KeyValueStorage;
  /** An older run's save is kept until this run reaches its first checkpoint. */
  readonly deferSavesUntilFirstCheckpoint: boolean;
  readonly settings: () => RunSettings;
  readonly onResults?: (results: ResultsData) => void;
  readonly now?: () => number;
  /** Development/testing only: begin a new run at this beat. */
  readonly startBeatId?: string;
  /** Level to play (default Level 1). A resumed save plays its own level. */
  readonly levelId?: LevelId;
}

export interface SpellEvent {
  readonly key: number;
  readonly kind: 'bolt' | 'frost' | 'chain';
  readonly to: Vector3;
  /** Chain Spark: where the bolt jumps from (the foe that was hit); otherwise the wand. */
  readonly from?: Vector3;
  readonly targetId: string;
  readonly shieldBreak: boolean;
  /** 0 (a thin bolt) to 1 (a blazing comet): grows with the combo (CLAUDE.md §1B). */
  readonly power?: number;
}

/** A spectacle for the FX layer to play (consumed like spell events). */
export interface FxEvent {
  readonly key: number;
  readonly kind: FxKind;
  readonly position: Vector3;
  readonly scale: number;
  readonly color: string | undefined;
}

/** Sound for each spectacle (none for the quiet ones). */
const FX_SOUND: Partial<Record<FxKind, { id: 'boom' | 'crash' | 'firework' | 'shield-break' | 'gate-open'; volume: number }>> = {
  burst: { id: 'boom', volume: 0.55 },
  debris: { id: 'crash', volume: 0.8 },
  glass: { id: 'shield-break', volume: 0.9 },
  shockwave: { id: 'boom', volume: 0.9 },
  pillar: { id: 'gate-open', volume: 0.8 },
  fireworks: { id: 'firework', volume: 0.8 },
  meteors: { id: 'boom', volume: 0.5 },
  geyser: { id: 'crash', volume: 0.5 },
  lightning: { id: 'boom', volume: 1 },
  dust: { id: 'crash', volume: 0.45 },
};

export interface RetiredTarget {
  readonly id: string;
  readonly spawn: TargetSpawn;
  readonly position: Vector3;
}

interface DialogueState {
  readonly beatId: string;
  readonly lines: readonly DialogueLine[];
  index: number;
  elapsed: number;
  /** False while a remark from the previous moment finishes. */
  started: boolean;
  /**
   * Line index at which the camera is released to carry on while the rest of the lines play as
   * subtitles (owner feedback: no standing still). -1 keeps the beat until the last line ends.
   */
  readonly releaseAt: number;
}

/** A released conversation lets the camera go once its line has been up this long. */
const RELEASE_AFTER_SEC = 1.2;

interface ChoiceState {
  readonly beatId: string;
  index: number;
  panel: 'none' | 'controls' | 'difficulty';
  difficultyIndex: number;
}

const DIFFICULTY_ORDER: readonly Difficulty[] = ['gentle', 'standard', 'challenge'];

/** How long a line stays up when it is not being spoken (brisk, but readable for a child). */
export function readSeconds(text: string): number {
  return 1.1 + text.length * 0.045;
}

let keyCounter = 1;
const nextKey = () => keyCounter++;

const BEST_SPEED_KEY = 'spellcaster.bestSpeedRounds';

function readBestSpeed(storage: KeyValueStorage, id: string): number {
  try {
    const raw = storage.getItem(BEST_SPEED_KEY);
    const all: unknown = raw ? JSON.parse(raw) : {};
    const value = typeof all === 'object' && all !== null ? (all as Record<string, unknown>)[id] : undefined;
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeBestSpeed(storage: KeyValueStorage, id: string, bonus: number): void {
  try {
    const raw = storage.getItem(BEST_SPEED_KEY);
    const all: unknown = raw ? JSON.parse(raw) : {};
    const next = typeof all === 'object' && all !== null ? { ...(all as Record<string, unknown>) } : {};
    next[id] = bonus;
    storage.setItem(BEST_SPEED_KEY, JSON.stringify(next));
  } catch {
    // Best scores are a convenience; never let storage problems interrupt play.
  }
}

/** Spell unlocks play a short slow-motion beat. */
const SLOW_MO_SEC = 1.2;
const SLOW_MO_SCALE = 0.3;

/** Rail speed while typing a chase word during a fast-rail set piece. */
const CHASE_TYPING_RAIL = 0.4;
/** How long a finished speed round's result stays on screen. */
const SPEED_RESULT_SEC = 2.2;

/** Targets freeze this long when a word lands (hit-stop). */
const HIT_STOP_SEC = 0.05;
/** Length of the small camera kick on a hit. */
export const KICK_SEC = 0.12;

/** A queued line must start within this many seconds, or it is dropped rather than said late. */
const LINE_FRESH_SEC = 4;
/** Longest a fight waits for earlier story lines before it starts anyway. */
const MAX_FIGHT_WAIT_SEC = 12;

interface QueuedLine {
  readonly line: DialogueLine;
  readonly beat: number;
  readonly at: number;
  /** A fight's instruction or tip: the only kind of line that may be dropped once its fight is over. */
  readonly instruction?: boolean;
}

/** Screen distance from centre (1 = edge) beyond which the camera turns to bring words into view. */
const FRAME_EDGE = 0.62;
/** Strongest lean towards off-centre words (fraction of the way from the rail's look point). */
const FRAME_MAX = 0.75;
const LOCKED_FRAMING = 0.14;

/** Off-screen mobs move this much faster until they are in view. */
const RUSH_SPEED = 3.5;
/** Off-screen mobs move at least this fast (metres per second) until they are in view. */
const RUSH_MIN_MPS = 7;

/** Seconds after a battle before the story music returns. */
const MUSIC_REVERT_SEC = 3;

const BATTLE_MUSIC: Partial<Record<AreaId, MusicId>> = {
  'sunlit-courtyard': 'courtyard-action',
  'whispering-library': 'grimoire-battle',
  'hall-of-portraits': 'courtyard-action',
  'enchanted-greenhouse': 'greenhouse-action',
  'lower-stairwell': 'tower-battle',
  'practice-gallery': 'courtyard-action',
  'moon-tower': 'tower-battle',
  observatory: 'warden-defence',
  'l2-festival-lawn': 'siege-battle',
  'l2-dormitory': 'siege-battle',
  'l2-bell-bridge': 'siege-battle',
  'l2-great-hall': 'siege-battle',
  'l2-workshops': 'siege-battle',
  'l2-lantern-lake': 'siege-battle',
  'l2-burning-library': 'siege-battle',
  'l2-ramparts': 'siege-battle',
  'l2-tower-roof': 'wyrm-battle',
  'l3-rift-shore': 'citadel-battle',
  'l3-cinderwood': 'citadel-battle',
  'l3-inkfall': 'citadel-battle',
  'l3-margin-library': 'citadel-battle',
  'l3-unfinished-gallery': 'citadel-battle',
  'l3-paper-sea': 'citadel-battle',
  'l3-forge': 'citadel-battle',
  'l3-citadel': 'citadel-battle',
  'l3-throne': 'unwriter-battle',
};

/** Story music when resuming mid-area before any beat has named a mood. */
const AREA_MUSIC: Record<AreaId, MusicId> = {
  'arrival-gate': 'arrival-wonder',
  'sunlit-courtyard': 'arrival-wonder',
  'east-hall': 'east-hall-calm',
  'whispering-library': 'library-mystery',
  'hall-of-portraits': 'portrait-rest',
  'enchanted-greenhouse': 'greenhouse-wonder',
  'lower-stairwell': 'tower-ascent',
  'practice-gallery': 'east-hall-calm',
  'moon-tower': 'tower-ascent',
  observatory: 'tower-ascent',
  'celebration-courtyard': 'celebration',
  'l2-festival-lawn': 'siege-dread',
  'l2-dormitory': 'siege-dread',
  'l2-bell-bridge': 'siege-dread',
  'l2-great-hall': 'evacuation-hope',
  'l2-workshops': 'siege-dread',
  'l2-lantern-lake': 'evacuation-hope',
  'l2-burning-library': 'siege-dread',
  'l2-ramparts': 'siege-dread',
  'l2-tower-roof': 'siege-dread',
  'l2-aftermath': 'ward-repair',
  'l3-rift-shore': 'blank-wander',
  'l3-cinderwood': 'blank-wander',
  'l3-inkfall': 'blank-wander',
  'l3-margin-library': 'blank-wander',
  'l3-unfinished-gallery': 'blank-wander',
  'l3-paper-sea': 'blank-wander',
  'l3-forge': 'blank-wander',
  'l3-citadel': 'blank-wander',
  'l3-throne': 'blank-wander',
  'l3-homecoming': 'homecoming',
};

const CALM_FOR_ACTION: Partial<Record<MusicId, MusicId>> = {
  'courtyard-action': 'arrival-wonder',
  'grimoire-battle': 'library-mystery',
  'greenhouse-action': 'greenhouse-wonder',
  'warden-defence': 'tower-ascent',
  'tower-battle': 'tower-ascent',
};

/** Time-critical encounters: something in them can lower HP. */
function isDangerous(def: EncounterDef): boolean {
  return def.kind === 'combat' && (def.hazard !== undefined || def.waves.some((w) => w.targets.some((t) => t.attack !== undefined)));
}

export class GameRun {
  readonly director: LevelDirector;
  readonly typing: TypingEngine;
  readonly metrics: TypingMetricsRecorder;
  readonly progress: Level1Autosave;
  readonly flags: Set<string>;
  readonly retired: RetiredTarget[] = [];
  readonly spellEvents: SpellEvent[] = [];
  encounter: EncounterRunner | null = null;
  private encounterBeatId: string | null = null;
  focus = MAX_FOCUS;
  shakeTime = 0;
  /** Screen-centre distance of a target; supplied by the renderer each frame. */
  centralityOf: (targetId: string) => number = () => 0;

  private committed: PersistedRunMetrics;
  private areaId: AreaId;
  private dialogue: DialogueState | null = null;
  private choice: ChoiceState | null = null;
  /** Lines waiting to be said, tagged with the beat they belong to and when they were queued. */
  private barkQueue: QueuedLine[] = [];
  private currentBark: DialogueLine | null = null;
  /** Beat index the line being said belongs to. */
  private currentBarkBeat = -1;
  /** Seconds of play, for line freshness. */
  private speechClock = 0;
  /** A camera beat to skip straight through (see onBeatStart), or −1. */
  private resumeIntro = 0;
  private pendingStartBeat: string | undefined;
  private pendingStartWave = 0;
  private focusResetTimer = 0;
  private paused = false;
  private ended = false;
  private savesEnabled: boolean;
  private saveIn = -1;
  private attempt = 0;
  private failures = new Map<string, number>();
  private firedBarks = new Set<string>();
  private encounterFirstCorrect = false;
  private encounterFirstMistake = false;
  private pendingMultiplier = 1;
  private activeMultiplier = 1;
  private newCosmetics: CosmeticId[] = [];
  private readonly now: () => number;

  readonly level: LevelDef;

  constructor(private readonly options: RunOptions) {
    this.now = options.now ?? (() => performance.now());
    const resume = options.resume;
    const levelId = resume?.levelId ?? (options.startBeatId ? levelOfBeat(options.startBeatId) : null) ?? options.levelId ?? 'level-1';
    this.level = LEVELS[levelId];
    const firstBeat = this.level.route.beats[0]?.id ?? '';
    this.progress = resume
      ? { ...resume, metrics: cloneMetrics(resume.metrics) }
      : newAutosave(`run-${Date.now().toString(36)}`, options.difficulty, firstBeat, levelId, this.level.route.beats[0]?.areaId);
    // Spells carry over between levels (CLAUDE.md §5).
    for (const spell of this.level.startingSpells) if (!this.progress.unlockedSpells.includes(spell)) this.progress.unlockedSpells.push(spell);
    this.committed = cloneMetrics(this.progress.metrics);
    this.flags = new Set(this.progress.flags);
    this.pendingMultiplier = this.progress.pendingScoreMultiplier;
    this.areaId = this.progress.areaId;
    this.savesEnabled = !options.deferSavesUntilFirstCheckpoint;
    this.metrics = new TypingMetricsRecorder(this.progress.metrics, this.areaId);
    this.typing = new TypingEngine({
      rejectMistakes: DIFFICULTY[this.progress.difficulty].rejectMistakes,
      centralityOf: (id) => this.centralityOf(id),
    });
    this.director = new LevelDirector(this.level.route, {
      onBeatStart: (beat) => this.onBeatStart(beat),
      onBeatEnd: (beat) => this.onBeatEnd(beat),
    });

    patchRunUi({
      focus: this.focus,
      unlimitedHp: DIFFICULTY[this.difficulty].unlimitedHp,
      streak: this.progress.metrics.currentStreak,
      results: null,
    });

    if (resume) {
      // Resume at the last committed beat after a short, safe establishing moment. A beat removed
      // by a later version resumes at the beat that replaced it, from its first wave.
      const beatId = this.level.resolveBeatId(resume.resumeBeatId) ?? firstBeat;
      this.pendingStartBeat = beatId;
      this.pendingStartWave = beatId === resume.resumeBeatId ? resume.resumeWaveIndex : 0;
      this.progress.resumeBeatId = beatId;
      this.resumeIntro = RESUME_INTRO_SEC;
      this.director.previewPose(beatId, this.director.pose);
      patchRunUi({ resumeIntro: true, areaId: this.areaId, areaCardKey: nextKey() });
    } else {
      this.director.start(this.settings().rail, options.startBeatId);
    }
  }

  get difficulty(): Difficulty {
    return this.progress.difficulty;
  }

  get assist(): boolean {
    return this.progress.assist;
  }

  get isEncounterActive(): boolean {
    return this.encounter !== null && this.encounter.state !== 'complete';
  }

  get currentAreaId(): AreaId {
    return this.areaId;
  }

  get hasSpell(): (id: SpellId) => boolean {
    return (id) => this.progress.unlockedSpells.includes(id);
  }

  get trail(): CosmeticId | null {
    return readProfile(this.options.storage).selectedTrail;
  }

  private settings(): RunSettings {
    return this.options.settings();
  }

  /** Target the camera should gently frame (the locked target), if any. */
  /**
   * Where the camera should lean, and how strongly (0 = not at all). Owner (2026-10-07): every word
   * must be on screen, never stuck in a corner. A locked word is framed gently; when any word sits near
   * the edge or off screen, the camera turns towards the middle of all the words in view, harder the
   * further out it is.
   */
  framingTarget(out: Vector3): number {
    const goal = this.liveFraming(out);
    const enc = this.encounter;
    if (goal > 0) {
      if (enc) this.heldFraming = { encounter: enc, goal, point: this.heldFraming?.point.copy(out) ?? out.clone() };
      return goal;
    }
    // Owner (2026-10-16): between two words of the same encounter (the next one not shown yet) the camera
    // stays where it was looking; it only eases back once the encounter is over.
    const held = this.heldFraming;
    if (held && enc && held.encounter === enc && (enc.state === 'active' || enc.state === 'wave-gap' || enc.state === 'intro')) {
      out.copy(held.point);
      return held.goal;
    }
    this.heldFraming = null;
    return 0;
  }

  private heldFraming: { encounter: EncounterRunner; goal: number; point: Vector3 } | null = null;

  private liveFraming(out: Vector3): number {
    const words = [...this.allTargets()].filter((t) => t.phase === 'active' && !t.defeated && !t.spawn.follow);
    let worst = 0;
    for (const t of words) worst = Math.max(worst, Math.min(this.centralityOf(t.id), 2));
    if (worst > FRAME_EDGE && words.length > 0) {
      out.set(0, 0, 0);
      for (const t of words) {
        out.x += t.position.x;
        out.y += t.position.y + (t.spawn.labelHeight ?? 1) * 0.5;
        out.z += t.position.z;
      }
      out.multiplyScalar(1 / words.length);
      return Math.min(FRAME_MAX, 0.25 + (worst - FRAME_EDGE) * 0.8);
    }
    const id = this.typing.lockedId;
    const t = id ? this.findTarget(id) : undefined;
    if (!t) return 0;
    out.copy(t.position);
    out.y += (t.spawn.labelHeight ?? 1) * 0.5;
    return LOCKED_FRAMING;
  }

  /** Every live target runner: the encounter, a chase and Mira's song word. */
  private runners(): EncounterRunner[] {
    const list: EncounterRunner[] = [];
    if (this.encounter) list.push(this.encounter);
    if (this.chase) list.push(this.chase);
    if (this.song) list.push(this.song);
    return list;
  }

  allTargets(): IterableIterator<TargetRuntime> {
    const runners = this.runners();
    function* all() {
      for (const r of runners) yield* r.targets.values();
    }
    return all();
  }

  /** Progress of an encounter for scene props: live while running, full once completed. */
  encounterProgress(encounterId: string): { done: number; total: number; complete: boolean } {
    const def = this.level.encounters.get(encounterId);
    const total = def ? def.waves.reduce((n, w) => n + w.targets.filter((t) => !t.optional).length, 0) : 0;
    if (this.progress.completedEncounterIds.includes(encounterId)) return { done: total, total, complete: true };
    if (this.encounter?.def.id === encounterId) {
      const before = this.encounter.def.waves
        .slice(0, this.encounter.waveIndex)
        .reduce((n, w) => n + w.targets.filter((t) => !t.optional).length, 0);
      return { done: before + this.encounter.waveProgress.done, total, complete: false };
    }
    return { done: 0, total, complete: false };
  }

  /** Current wave of an encounter for scene props: -1 before it starts, the wave count once done. */
  encounterWave(encounterId: string): number {
    const def = this.level.encounters.get(encounterId);
    if (this.progress.completedEncounterIds.includes(encounterId)) return def?.waves.length ?? 0;
    if (this.encounter?.def.id === encounterId) return this.encounter.waveIndex;
    return -1;
  }

  isRetired(targetId: string): boolean {
    return this.retired.some((r) => r.id === targetId);
  }

  findTarget(id: string): TargetRuntime | undefined {
    for (const r of this.runners()) {
      const t = r.targets.get(id);
      if (t) return t;
    }
    return undefined;
  }

  // ---------- Frame update ----------

  update(dtSec: number): void {
    if (this.ended || this.paused) return;
    const dt = Math.min(dtSec, 0.1);
    const settings = this.settings();
    this.progress.metrics.levelTimeMs += dt * 1000;
    if (this.shakeTime > 0) this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.updateSaveTimer(dt);
    this.updateBarks(dt);
    this.updateMusic(dt);

    if (this.resumeIntro > 0) {
      this.resumeIntro -= dt;
      if (this.resumeIntro <= 0) {
        patchRunUi({ resumeIntro: false });
        const summary = RESUME_SUMMARY[this.areaId];
        this.queueBark(summary);
        const beatId = this.pendingStartBeat;
        this.pendingStartBeat = undefined;
        this.director.start(settings.rail, beatId);
      }
      return;
    }

    if (this.focusResetTimer > 0) {
      this.focusResetTimer -= dt;
      if (this.focusResetTimer <= 0) this.finishFocusReset();
      return;
    }

    if (this.dialogue) this.updateDialogue(dt);
    this.updatePendingFx(dt);
    this.updateDeferredFight(dt);

    // Never carry the camera away from a chase word still waiting: the camera finishes its move, then
    // waits at the end pose.
    let railDt = dt;
    // Fast-rail set pieces ease off while a chase word is being typed (§1A comfort, §1B speed).
    if (this.chaseTyping()) railDt *= CHASE_TYPING_RAIL;
    // A waiting word holds the camera; on a reveal it holds while still looking at the word, before
    // the pan back (owner: "it was looking at the target then the camera shifted away").
    if (this.wordsPending()) railDt = Math.min(railDt, Math.max(0, this.director.remainingBeforeReturnSec(settings.rail) - 1e-4));
    if (this.holdForSpeech()) railDt = Math.min(railDt, Math.max(0, this.director.remainingSec(settings.rail) - 1e-4));
    this.director.update(railDt, settings.rail);

    const timeScale = this.typing.isMidWord ? DIFFICULTY[this.difficulty].typingTimeScale : 1;
    const locked = this.typing.lockedId;
    if (this.kickTime > 0) this.kickTime = Math.max(0, this.kickTime - dt);
    // Hit-stop: targets freeze for a beat when a word lands, so every hit feels solid (§1B).
    if (this.slowMoSec > 0) this.slowMoSec = Math.max(0, this.slowMoSec - dt);
    const simDt = this.hitStopSec > 0 ? 0 : this.slowMoSec > 0 ? dt * SLOW_MO_SCALE : dt;
    if (this.hitStopSec > 0) this.hitStopSec = Math.max(0, this.hitStopSec - dt);
    let changed = false;
    if (this.encounter) {
      const events = this.encounter.update(simDt, timeScale, locked);
      if (events.length > 0) changed = true;
      this.handleEncounterEvents(events);
    }
    if (this.chase) {
      const chase = this.chase;
      const events = chase.update(simDt, timeScale, locked);
      if (events.length > 0) changed = true;
      this.fxFromRunnerEvents(events);
      if (events.some((e) => e.type === 'complete') && this.chase === chase) this.chase = null;
    }
    if (this.updateSong(simDt, timeScale, locked)) changed = true;
    this.applyFollow(dt);
    this.updateRush(simDt);
    this.updateSpeedRound(dt);
    if (changed) this.refreshTargets();
  }

  // ---------- Set pieces: chases, camera-relative targets, spectacle (CLAUDE.md §1B) ----------

  chase: EncounterRunner | null = null;
  /** Spectacle waiting for the FX layer. */
  readonly fxEvents: FxEvent[] = [];
  private pendingFx: { cue: FxCue; inSec: number; origin: Vector3 | null }[] = [];
  private beatFx: { cue: FxCue; atBeat: number; beatId: string }[] = [];
  private readonly followOffsets = new WeakMap<TargetRuntime, Vector3>();
  /** Seconds since a Pip thief appeared (its swoop, grab and carry). */
  private readonly carryAge = new WeakMap<TargetRuntime, number>();
  private readonly camForward = new Vector3();
  private readonly camRight = new Vector3();
  private readonly camUp = new Vector3();
  private speed: SpeedRound | null = null;
  private speedClearIn = 0;
  private speedId = '';
  private speedBest = 0;
  private speedNewBest = false;

  /** 0–1 through the current camera beat (scripted scene cameos). 1 for gated beats. */
  beatProgress(): number {
    const beat = this.director.currentBeat;
    if (!beat || !isCameraBeat(beat)) return 1;
    const remaining = this.director.remainingSec(this.settings().rail);
    const total = this.director.beatDurationSec(this.settings().rail);
    return total > 0 ? Math.min(1, Math.max(0, 1 - remaining / total)) : 1;
  }

  /** True while the player is mid-word on a chase target. */
  private chaseTyping(): boolean {
    const id = this.typing.lockedId;
    return id !== null && this.typing.isMidWord && (this.chase?.targets.has(id) ?? false);
  }

  /** Camera basis for camera-relative placement. */
  private cameraBasis(): { fwd: Vector3; right: Vector3 } {
    const pose = this.director.pose;
    const fwd = this.camForward.copy(pose.lookAt).sub(pose.position);
    if (fwd.lengthSq() < 1e-6) fwd.set(0, 0, -1);
    fwd.normalize();
    const right = this.camRight.set(-fwd.z, 0, fwd.x);
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    return { fwd, right };
  }

  /**
   * Targets with `follow` move rigidly with the camera (no lag, however fast the rail) plus an offset
   * that starts well ahead (the swoop-in) and eases to zero.
   */
  private applyFollow(dt: number): void {
    const { fwd, right } = this.cameraBasis();
    const pose = this.director.pose;
    const up = this.camUp.crossVectors(right, fwd).normalize();
    const decay = Math.exp(-4 * dt);
    for (const t of this.allTargets()) {
      const around = t.spawn.aroundPip;
      if (around && t.phase !== 'waiting' && t.phase !== 'gone') {
        t.position.copy(this.pipAt).addScaledVector(right, around.side).addScaledVector(up, around.up);
        continue;
      }
      const f = t.spawn.follow;
      if (!f || t.phase === 'waiting' || t.phase === 'gone') continue;
      const side = Math.sign(f.side || 1);
      let offset = this.followOffsets.get(t);
      if (!offset) {
        offset = new Vector3().addScaledVector(fwd, 10).addScaledVector(right, side * 3).addScaledVector(up, 2);
        this.followOffsets.set(t, offset);
      }
      offset.multiplyScalar(decay);
      if (t.phase === 'leaving') offset.addScaledVector(right, side * 7 * dt).addScaledVector(fwd, 4 * dt);
      let { ahead, side: across, up: lift } = f;
      if (t.spawn.carriesPip) {
        // Owner (2026-10-17, 2026-10-19): the thief swoops in from a top corner of the screen, flies
        // through Pip and carries Pip off in its chest, instead of appearing ahead with Pip zooming to it.
        const age = (this.carryAge.get(t) ?? 0) + dt;
        this.carryAge.set(t, age);
        if (t.phase !== 'leaving') offset.set(0, 0, 0);
        [ahead, across, lift] = snatchPath(age, f);
      }
      // Camera-relative placement, so a pitched camera still sees the target where it was authored.
      t.position
        .copy(pose.position)
        .addScaledVector(fwd, ahead)
        .addScaledVector(right, across)
        .addScaledVector(up, lift + Math.sin(t.clock * 2.2) * 0.08)
        .add(offset);
    }
  }

  private startChase(beat: LevelBeat): void {
    if (!isCameraBeat(beat) || !beat.chase || beat.chase.length === 0) return;
    const duration = this.director.remainingSec(this.settings().rail);
    const targets = beat.chase.map((c) => ({ ...c.target, delaySec: (c.target.delaySec ?? 0) + c.at * duration }));
    const def: EncounterDef = { id: `chase:${beat.id}`, areaId: beat.areaId, kind: 'interaction', waves: [{ id: 'chase', targets }] };
    this.chase = new EncounterRunner(def, { difficulty: this.difficulty, assist: this.assist, attempt: 0 });
  }

  /** Play (or schedule) a spectacle. `origin` is used when the cue has no position of its own. */
  emitFx(cue: FxCue, origin: Vector3 | null = null): void {
    if ((cue.delaySec ?? 0) > 0) {
      this.pendingFx.push({ cue, inSec: cue.delaySec ?? 0, origin: origin?.clone() ?? null });
      return;
    }
    const scale = cue.scale ?? 1;
    if (cue.kind === 'flash') {
      patchRunUi({ flashKey: nextKey() });
      audio.playSfx('boom', { volume: 0.7 });
      return;
    }
    if (cue.kind === 'shake') {
      this.shakeTime = Math.max(this.shakeTime, SHAKE_SEC * scale);
      return;
    }
    const position = new Vector3();
    if (typeof cue.at === 'string') {
      const p = this.level.route.lookPoints[cue.at];
      if (p) position.set(...p);
    } else if (cue.at) {
      position.set(...cue.at);
    } else if (origin) {
      position.copy(origin);
    } else {
      const { fwd } = this.cameraBasis();
      position.copy(this.director.pose.position).addScaledVector(fwd, 6);
    }
    this.fxEvents.push({ key: nextKey(), kind: cue.kind, position, scale, color: cue.color });
    if (this.fxEvents.length > 64) this.fxEvents.splice(0, this.fxEvents.length - 64);
    const sound = FX_SOUND[cue.kind];
    if (cue.sound) audio.playSfx(cue.sound, { volume: 1 });
    else if (sound) audio.playSfx(sound.id, { volume: sound.volume, rate: 0.9 + Math.random() * 0.2 });
    if (cue.kind === 'lightning' || cue.kind === 'shockwave') this.shakeTime = Math.max(this.shakeTime, SHAKE_SEC * Math.min(1.5, scale));
  }

  private updatePendingFx(dt: number): void {
    if (this.beatFx.length > 0) {
      const beatId = this.director.currentBeat?.id;
      const progress = this.beatProgress();
      const due = this.beatFx.filter((b) => b.beatId === beatId && progress >= b.atBeat);
      this.beatFx = this.beatFx.filter((b) => b.beatId === beatId && progress < b.atBeat);
      for (const b of due) this.emitFx({ ...b.cue, atBeat: undefined });
    }
    if (this.pendingFx.length === 0) return;
    const due: { cue: FxCue; origin: Vector3 | null }[] = [];
    this.pendingFx = this.pendingFx.filter((p) => {
      p.inSec -= dt;
      if (p.inSec > 0) return true;
      due.push(p);
      return false;
    });
    for (const p of due) this.emitFx({ ...p.cue, delaySec: 0 }, p.origin);
  }

  /** Entrance spectacle for targets that just appeared, from any runner. */
  private fxFromRunnerEvents(events: readonly EncounterEvent[]): void {
    for (const e of events) {
      if (e.type === 'target-spawned' && e.target.spawn.entrance) this.emitFx(e.target.spawn.entrance, e.target.position);
    }
  }

  /** Where Pip is in the world (PipCompanion writes it each frame), for words that float beside Pip. */
  readonly pipAt = new Vector3();
  private bossStrikeAt = -Infinity;
  private bossWindupSec = 1;

  /**
   * What the current boss is doing, for its animation and charge effects (owner, 2026-10-17: bosses
   * stood still "like target practice"). `windup` 0–1 while an arena attack is charging; `strikeAge`
   * is seconds since it last struck (a hazard landing or a fireball hurled), Infinity if never.
   */
  bossThreat(): { windup: number; strikeAge: number; build: number | null } {
    const runner = this.encounter;
    const boss = !!runner?.def.bossPhase && runner.state !== 'complete';
    const t = boss ? runner.hazardTelegraph : null;
    const total = this.bossWindupSec;
    const windup = t && total > 0 ? Math.min(1, Math.max(0, 1 - t.remaining / total)) : 0;
    // `build`: how far the boss is towards its next arena attack (null when it has none), so a charge
    // can grow from nothing to the blast.
    return { windup, strikeAge: (performance.now() - this.bossStrikeAt) / 1000, build: boss ? runner.hazardBuild : null };
  }

  /** Point Pip is being carried to, if a target is holding Pip (the opening cold open). */
  pipCarrier(out: Vector3): boolean {
    for (const t of this.allTargets()) {
      if (!t.spawn.carriesPip || t.defeated || t.phase === 'waiting' || t.phase === 'gone' || t.phase === 'leaving') continue;
      // Pip stays put until the thief flies into it, then rides in its chest (owner, 2026-10-19).
      if ((this.carryAge.get(t) ?? 0) < SNATCH_GRAB_SEC) continue;
      // In its chest, a touch towards the camera so Pip shows in front of its body.
      out.copy(t.position);
      out.y += SNATCH_CHEST;
      out.addScaledVector(this.camForward.copy(this.director.pose.position).sub(out).normalize(), 0.12);
      return true;
    }
    return false;
  }

  /** Beam struggle (§1B): where the player's beam aims and how far it has pushed (0–1). */
  beamStruggle(out: Vector3): { progress: number; color: string } | null {
    const def = this.encounter?.def;
    if (!def?.beam || this.encounter?.state === 'complete') return null;
    out.set(...def.beam.to);
    const p = this.encounterProgress(def.id);
    return { progress: p.total > 0 ? p.done / p.total : 0, color: def.beam.color };
  }

  private startSpeedRound(def: EncounterDef): void {
    if (!def.speedRound) {
      if (this.speed) this.clearSpeedRound();
      return;
    }
    const words = def.waves.reduce((n, w) => n + w.targets.filter((t) => !t.optional && !t.challengeOnly).reduce((m, t) => m + t.words.length, 0), 0);
    this.speed = new SpeedRound(def.speedRound.sec, this.difficulty, words);
    this.speedClearIn = 0;
    this.speedId = def.id;
    this.speedNewBest = false;
    this.speedBest = readBestSpeed(this.options.storage, def.id);
    this.publishSpeedRound(nextKey());
  }

  private publishSpeedRound(key?: number): void {
    const r = this.speed;
    if (!r) return;
    const current = useRunStore.getState().speedRound;
    patchRunUi({
      speedRound: {
        key: key ?? current?.key ?? nextKey(),
        totalSec: r.totalSec,
        remainingSec: Math.ceil(r.remainingSec * 10) / 10,
        done: r.done,
        words: r.words,
        state: r.state,
        bonus: r.bonus,
        best: this.speedBest,
        newBest: this.speedNewBest,
      },
    });
  }

  private updateSpeedRound(dt: number): void {
    if (this.speedClearIn > 0) {
      this.speedClearIn -= dt;
      if (this.speedClearIn <= 0) this.clearSpeedRound();
      return;
    }
    const r = this.speed;
    if (!r || r.state !== 'running' || !this.encounter || this.encounter.state === 'intro') return;
    // The clock only runs while one of its words is on screen and typeable (never while they fly in).
    const showing = [...this.encounter.targets.values()].some((t) => t.phase === 'active' && t.wordDelay === 0 && !t.defeated);
    if (!showing) return;
    const before = Math.ceil(r.remainingSec * 10);
    if (r.tick(dt)) {
      audio.playSfx('enemy-telegraph', { volume: 0.5 });
      this.speedClearIn = SPEED_RESULT_SEC;
      // Time is up: the "Speed round!" prompt goes, so nothing on screen talks about a finished round.
      patchRunUi({ prompt: null });
    }
    if (Math.ceil(r.remainingSec * 10) !== before || r.state !== 'running') this.publishSpeedRound();
  }

  private speedRoundWord(at: Vector3, height: number): void {
    const r = this.speed;
    if (!r || !r.word()) {
      if (r) this.publishSpeedRound();
      return;
    }
    const m = this.progress.metrics;
    m.score += r.bonus;
    audio.playSfx('checkpoint');
    // A local best to beat on replay (Practice Gallery arcade).
    if (r.bonus > this.speedBest) {
      this.speedNewBest = this.speedBest > 0;
      this.speedBest = r.bonus;
      writeBestSpeed(this.options.storage, this.speedId, r.bonus);
    }
    this.popup(this.speedNewBest ? 'NEW BEST!' : `SPEED BONUS +${r.bonus}`, 'cheer', at, height);
    this.speedClearIn = SPEED_RESULT_SEC;
    patchRunUi({ prompt: null });
    this.publishSpeedRound();
    patchRunUi({ score: m.score });
  }

  private clearSpeedRound(): void {
    this.speed = null;
    this.speedClearIn = 0;
    patchRunUi({ speedRound: null });
  }

  readonly combo = new Combo();
  /** Small camera kick when a word lands (seconds remaining; read by the camera driver). */
  kickTime = 0;
  private hitStopSec = 0;
  private tally = { words: 0, correct: 0, incorrect: 0, damage: 0 };
  private boss: { def: BossDef; total: number; done: number } | null = null;
  private hazardFxIndex = 0;
  private slowMoSec = 0;

  setPaused(paused: boolean): void {
    if (paused === this.paused) return;
    this.paused = paused;
    if (paused) {
      this.metrics.suspend();
      this.saveNow();
    }
  }

  /** Browser hidden / page closing. */
  suspend(): void {
    this.metrics.suspend();
    this.saveNow();
  }

  // ---------- Input ----------

  handleIntent(intent: KeyIntent): void {
    if (this.ended || this.paused || this.resumeIntro > 0 || this.focusResetTimer > 0) return;

    if (this.choice) {
      this.handleChoiceIntent(intent);
      return;
    }
    if (this.dialogue) {
      // Owner (2026-10-06): speech keeps playing while the child types; only Enter/Space skip a line.
      const skip = intent.kind === 'enter' || intent.kind === 'space';
      if (skip && !this.dialogue.started) {
        // Skip the remark still finishing and go straight to the conversation.
        voice.cancel();
        this.currentBark = null;
        this.startDialogue();
      } else if (skip) {
        this.advanceDialogue(true);
      }
      // Letters, Backspace and Tab also reach typing: words can be live during a conversation, and a
      // typo on one must be fixable mid-line.
      const typingKey = intent.kind === 'letter' || intent.kind === 'backspace' || intent.kind === 'tab';
      if (!typingKey || (this.typing.lockedId === null && this.candidateCount() === 0)) return;
    }
    // Enter or Space while a line is still being said skips to the next line (owner feedback).
    if ((intent.kind === 'enter' || intent.kind === 'space') && this.currentBark) {
      this.skipBark();
      return;
    }

    const hasTargets = this.typing.lockedId !== null || this.candidateCount() > 0;
    if (!hasTargets) return;
    const nowMs = this.now();
    let events: TypingEvent[];
    switch (intent.kind) {
      case 'letter':
        events = this.typing.typeLetter(intent.char);
        break;
      case 'backspace':
        events = this.typing.backspace();
        break;
      case 'tab':
        events = this.typing.cycle(intent.reverse);
        break;
      default:
        return;
    }
    this.handleTypingEvents(events, nowMs);
    this.refreshLabels();
  }

  private candidateCount(): number {
    return this.runners().reduce((n, r) => n + r.candidates().length, 0);
  }

  private handleTypingEvents(events: readonly TypingEvent[], nowMs: number): void {
    for (const e of events) {
      switch (e.type) {
        case 'correct':
          this.metrics.recordEntry(true, e.targetId, nowMs);
          audio.playSfx('key-correct', { rate: 0.94 + Math.random() * 0.12 });
          if (!this.encounterFirstCorrect && this.encounter && e.targetId && this.encounter.targets.has(e.targetId)) {
            this.encounterFirstCorrect = true;
            this.fireBarks({ on: 'first-correct' });
          }
          break;
        case 'incorrect':
          this.metrics.recordEntry(false, e.targetId, nowMs);
          audio.playSfx('key-incorrect');
          this.combo.mistake();
          patchRunUi({ combo: this.combo.count, comboMultiplier: this.combo.multiplier });
          patchRunUi({ mistakeKey: nextKey(), mistakeTargetId: e.targetId });
          if (!this.encounterFirstMistake && this.encounter) {
            this.encounterFirstMistake = true;
            this.fireBarks({ on: 'first-mistake' });
          }
          break;
        case 'corrected':
          this.metrics.recordCorrected();
          break;
        case 'unlock':
          this.metrics.closeAttempt();
          break;
        case 'complete':
          this.onWordComplete(e.targetId, e.word, e.mistakes, nowMs);
          break;
        default:
          break;
      }
    }
  }

  private onWordComplete(targetId: string, word: string, mistakes: number, nowMs: number): void {
    const runner = this.runners().find((r) => r.targets.has(targetId));
    const target = runner?.targets.get(targetId);
    if (!runner || !target) return;
    this.metrics.recordCompletion(targetId, word, mistakes, nowMs);
    const perfect = mistakes === 0;
    const m = this.progress.metrics;
    const cheer = this.combo.word();
    m.score += wordScore(word.length, perfect, this.activeMultiplier) * this.combo.multiplier;
    this.hitStopSec = HIT_STOP_SEC;
    this.kickTime = KICK_SEC;
    this.popup(cheer ?? (perfect ? 'PERFECT!' : null), cheer ? 'cheer' : 'perfect', target.position, target.spawn.labelHeight ?? 1);
    if (cheer) audio.playSfx('unlock', { volume: 0.6, rate: 1 + Math.min(0.5, this.combo.count / 40) });
    if (runner === this.encounter) {
      this.tally.words++;
      if (this.speed) this.speedRoundWord(target.position, target.spawn.labelHeight ?? 1);
    }
    if (runner === this.encounter && this.boss?.def.phases.includes(runner.def.id)) {
      this.boss.done = Math.min(this.boss.total, this.boss.done + 1);
      patchRunUi({ boss: { id: this.boss.def.id, health: 1 - this.boss.done / Math.max(1, this.boss.total) } });
    }

    const shieldBreak = isShielded(target);
    const frost = perfect && this.progress.unlockedSpells.includes('frost-thread');
    this.spellEvents.push({
      key: nextKey(),
      kind: frost ? 'frost' : 'bolt',
      to: target.position.clone(),
      targetId,
      shieldBreak,
      power: Math.min(1, this.combo.count / 10),
    });
    audio.playSfx('spell-cast');
    if (perfect) audio.playSfx('perfect-word');
    if (shieldBreak) audio.playSfx('shield-break');

    const result = runner.completeWord(targetId, mistakes);

    if (perfect && this.progress.unlockedSpells.includes('bright-quill')) {
      // Bright Quill: a splash of colour where the perfect word lands, and a little extra score.
      const colours = ['#ff6a5a', '#ffd24a', '#5ae08a', '#4ab8ff', '#c78aff'];
      this.emitFx({ kind: 'burst', scale: 1.4, color: colours[m.completedWords % colours.length] }, target.position);
      m.score += 15;
    }

    if (frost) {
      audio.playSfx('frost');
      for (const other of this.allTargets()) if (other.id !== targetId && !other.defeated) other.frostTimer = FROST_SEC;
    }

    if (
      perfect &&
      this.progress.unlockedSpells.includes('chain-spark') &&
      m.currentStreak > 0 &&
      m.currentStreak % CHAIN_STREAK === 0 &&
      runner === this.encounter
    ) {
      this.castChainSpark(targetId);
    }

    if (
      perfect &&
      this.progress.unlockedSpells.includes('starfall') &&
      m.currentStreak > 0 &&
      m.currentStreak % STARFALL_STREAK === 0 &&
      runner === this.encounter
    ) {
      this.castStarfall(targetId);
    }

    if (result.defeated) {
      audio.playSfx('dispel');
      const spawn = target.spawn;
      if (spawn.defeatFx) this.emitFx(spawn.defeatFx, target.position);
      if (spawn.defeatBark) this.queueBark(getLine(spawn.defeatBark));
      if (spawn.defeatFlag) this.flags.add(spawn.defeatFlag);
      for (const f of spawn.alsoFlags ?? []) this.flags.add(f);
      if (spawn.optional) m.optionalTargetsCompleted++;
      const qualifies =
        spawn.rewardIf === undefined ||
        (spawn.rewardIf === 'first-defeat' && result.firstDefeat) ||
        (spawn.rewardIf === 'perfect' && perfect);
      if (spawn.reward && qualifies) this.grantReward(spawn.reward);
      if (runner === this.encounter) this.fireBarks({ on: 'defeats', count: runner.totalDefeats });
    }
    patchRunUi({ streak: m.currentStreak, liveWpm: averageWpm(m), score: m.score, combo: this.combo.count, comboMultiplier: this.combo.multiplier });
    this.refreshTargets();
  }

  /** A short cheer that pops above a target. Keeps only the newest few. */
  private popup(text: string | null, tier: 'perfect' | 'cheer', at: Vector3, height: number): void {
    if (!text) return;
    const popups = [...useRunStore.getState().popups.slice(-3), { key: nextKey(), text, tier, position: [at.x, at.y + height * 0.6, at.z] as const }];
    patchRunUi({ popups });
  }

  private castChainSpark(sourceId: string): void {
    const runner = this.encounter;
    if (!runner) return;
    const victims = [...runner.targets.values()]
      .filter((t) => t.id !== sourceId && !t.defeated && t.phase === 'active' && t.spawn.weak)
      .slice(0, CHAIN_TARGETS);
    audio.playSfx('chain-spark');
    const source = runner.targets.get(sourceId)?.position.clone();
    for (const v of victims) {
      if (runner.dispel(v.id)) {
        this.spellEvents.push({ key: nextKey(), kind: 'chain', to: v.position.clone(), from: source, targetId: v.id, shieldBreak: false });
        this.progress.metrics.score += 25;
        // Make it obvious the spell took this word (owner: "the 3rd disappeared on its own").
        this.popup('CHAIN SPARK!', 'cheer', v.position, v.spawn.labelHeight ?? 1);
      }
    }
    // Pip remarks on it only in the level where Chain Spark is learned, not out of nowhere later on.
    if (!this.flags.has('seen-chain') && !this.level.startingSpells.includes('chain-spark')) {
      this.flags.add('seen-chain');
      this.queueBark(getLine('spell-chain'), this.director.currentIndex, true);
    }
  }

  /** Starfall: falling stars calm every weak foe on screen and deflect every incoming counter-word attack. */
  private castStarfall(sourceId: string): void {
    const runner = this.encounter;
    if (!runner) return;
    audio.playSfx('chain-spark', { rate: 0.8 });
    const { fwd } = this.cameraBasis();
    this.emitFx({ kind: 'meteors', scale: 0.8, color: '#ffe6a0' }, this.director.pose.position.clone().addScaledVector(fwd, 8));
    for (const v of [...runner.targets.values()]) {
      if (v.id === sourceId || v.defeated || v.phase !== 'active' || !(v.spawn.weak || v.spawn.counter)) continue;
      if (runner.dispel(v.id)) {
        // Each star falls from the sky onto its foe.
        this.spellEvents.push({ key: nextKey(), kind: 'chain', to: v.position.clone(), from: v.position.clone().add(new Vector3(0, 7, 0)), targetId: v.id, shieldBreak: false });
        this.progress.metrics.score += 40;
        this.popup('STARFALL!', 'cheer', v.position, v.spawn.labelHeight ?? 1);
      }
    }
    if (!this.flags.has('seen-starfall') && !this.level.startingSpells.includes('starfall')) {
      this.flags.add('seen-starfall');
      this.queueBark(getLine('spell-starfall'), this.director.currentIndex, true);
    }
  }

  // ---------- Music ----------

  /** Story music for the current beat; action moods authored on story beats play as their calm counterpart. */
  private storyMusic: MusicId | null = null;
  private battleMusic: MusicId | null = null;
  private musicRevertIn = -1;

  private setStoryMusic(id: MusicId): void {
    this.storyMusic = CALM_FOR_ACTION[id] ?? id;
    if (!this.battleMusic) audio.setMusic(this.storyMusic);
  }

  /** Owner feedback: the music changes whenever creatures can hurt the player. */
  private setBattleMusic(id: MusicId): void {
    this.musicRevertIn = -1;
    if (this.battleMusic === id) return;
    this.battleMusic = id;
    audio.setMusic(id);
  }

  private updateMusic(dt: number): void {
    if (this.musicRevertIn < 0) return;
    this.musicRevertIn -= dt;
    // A short grace period keeps battle music going across quick boss-phase dialogue.
    if (this.musicRevertIn < 0) {
      this.battleMusic = null;
      audio.setMusic(this.storyMusic ?? AREA_MUSIC[this.areaId]);
    }
  }

  // ---------- Beats ----------

  private onBeatStart(beat: LevelBeat): void {
    if (beat.areaId !== this.areaId) this.enterArea(beat.areaId);
    const beatIndex = this.level.route.beats.indexOf(beat);
    patchRunUi({ beatId: beat.id, progress: Math.max(0, beatIndex) / Math.max(1, this.level.route.beats.length - 1) });
    if (beat.music) this.setStoryMusic(beat.music);
    if (beat.objective !== undefined) patchRunUi({ objective: beat.objective === 'none' ? null : beat.objective });
    if (beat.journey) patchRunUi({ journey: { key: nextKey(), to: beat.journey } });
    // A scene with lines of its own drops leftover lines from a fight that has ended and not started
    // yet (instructions for a fight already won would be said over the wrong scene). Story lines and
    // conversations are never dropped; a line being said always finishes.
    if ((beat.barks ?? []).length > 0) {
      this.barkQueue = this.barkQueue.filter((q) => q.beat >= beatIndex || !q.instruction);
    }
    for (const id of beat.barks ?? []) this.queueBark(getLine(id), beatIndex);
    if (beat.restoreFocus) this.setFocus(MAX_FOCUS);
    if (isCameraBeat(beat) && beat.chase) this.startChase(beat);
    this.beatFx = [];
    for (const cue of beat.fx ?? []) {
      if (cue.atBeat !== undefined && isCameraBeat(beat)) this.beatFx.push({ cue, atBeat: cue.atBeat, beatId: beat.id });
      else this.emitFx(cue);
    }
    const boss = bossForIntroBeat(beat.id, this.level.bosses);
    if (boss) {
      patchRunUi({ bossCard: { key: nextKey(), id: boss.id } });
      audio.playSfx('boss-phase');
      this.startBoss(boss);
    }

    // Every beat start is a stable resume point.
    this.progress.resumeBeatId = beat.id;
    this.progress.resumeWaveIndex = 0;
    this.progress.areaId = beat.areaId;

    switch (beat.kind) {
      case 'dialogue': {
        // Lines still waiting from the scene before (the rest of a conversation, an intro line) are
        // said first, so nothing in the story is lost (owner playtest: Orin's answer about the Unwriter
        // vanished); leftover instructions from a finished fight are dropped.
        const carried = this.barkQueue.filter((q) => !q.instruction).map((q) => q.line);
        const lines = [...carried, ...beat.lines.map((id) => getLine(id)).filter((l): l is DialogueLine => !!l)];
        this.barkQueue = [];
        this.dialogue = { beatId: beat.id, lines, index: 0, elapsed: 0, started: false, releaseAt: this.releaseIndex(lines.length) };
        if (!this.currentBark) this.startDialogue();
        break;
      }
      case 'encounter':
        // Owner (2026-10-08): back-to-back fights stacked their lines ("A spell! Type it!" was said
        // after the fight, over the next area). A fight that brings lines of its own waits while
        // earlier story lines finish, so its instructions are heard as it starts.
        if (this.bringsLines(beat) && this.earlierStoryPending(beatIndex)) {
          this.deferredFight = { beatId: beat.id, encounterId: beat.encounterId, index: beatIndex, waited: 0 };
        } else {
          this.startEncounter(beat.id, beat.encounterId);
        }
        break;
      case 'checkpoint':
        this.commitCheckpoint(beat);
        this.director.completeGatedBeat(beat.id);
        break;
      case 'choice':
        this.choice = { beatId: beat.id, index: 0, panel: 'none', difficultyIndex: DIFFICULTY_ORDER.indexOf(this.difficulty) };
        this.publishChoice();
        break;
      case 'results':
        this.finishLevel();
        break;
      default:
        break;
    }
    this.requestSave();
  }

  private onBeatEnd(beat: LevelBeat): void {
    if (this.chase && isCameraBeat(beat) && beat.chase) {
      // Chase targets leave with their camera beat; nothing is ever required.
      for (const t of this.chase.targets.values()) if (!t.defeated) t.phase = 'gone';
      this.chase = null;
      this.refreshTargets();
    }
  }

  private enterArea(areaId: AreaId): void {
    this.areaId = areaId;
    this.metrics.setArea(areaId);
    this.retired.length = 0;
    patchRunUi({ areaId, areaCardKey: nextKey(), retiredKey: nextKey() });
  }

  /** Mobs waiting off screen hurry in (owner: they should appear within 1–2 seconds). */
  private updateRush(dt: number): void {
    const runner = this.encounter;
    if (!runner) return;
    for (const t of runner.targets.values()) {
      const m = t.spawn.movement;
      const moving = m !== undefined && m.kind !== 'static' && !t.atPathEnd && !t.defeated && (t.phase === 'active' || t.phase === 'appearing');
      const off = moving && this.centralityOf(t.id) > 1.02;
      t.offscreenSec = off ? t.offscreenSec + dt : 0;
      // Fast enough that even slow armour climbing a long path is in view within about 2 seconds.
      const speed = m && m.kind !== 'static' ? m.speed : 1;
      t.rush = t.offscreenSec > 0.4 ? Math.max(RUSH_SPEED, RUSH_MIN_MPS / Math.max(0.1, speed)) : 1;
    }
  }

  /**
   * True while a chase word on this stretch of rail is still waiting (spawned or still to come). The
   * camera finishes its move, then holds there (owner: "hold the animation and wait for the child to
   * finish typing").
   */
  private wordsPending(): boolean {
    return this.chase !== null && this.chase.state !== 'complete';
  }

  private startEncounter(beatId: string, encounterId: string): void {
    const def = this.level.encounters.get(encounterId);
    if (!def) {
      this.director.completeGatedBeat(beatId);
      return;
    }
    const startWave = this.pendingStartWave;
    this.pendingStartWave = 0;
    this.attempt++;
    const cam = this.director.pose.position;
    const closing = closeInEncounter(def, [cam.x, cam.y, cam.z]);
    this.encounter = new EncounterRunner(closing, { difficulty: this.difficulty, assist: this.assist, attempt: this.attempt }, startWave);
    this.encounterBeatId = beatId;
    this.firedBarks.clear();
    this.encounterFirstCorrect = false;
    this.encounterFirstMistake = false;
    this.progress.resumeWaveIndex = startWave;
    if (def.kind === 'combat') {
      this.activeMultiplier = this.pendingMultiplier;
      this.pendingMultiplier = 1;
      this.progress.pendingScoreMultiplier = 1;
    } else {
      this.activeMultiplier = 1;
    }
    if (def.bossPhase) audio.playSfx('boss-phase');
    if (isDangerous(def)) this.setBattleMusic(BATTLE_MUSIC[this.areaId] ?? 'courtyard-action');
    const m = this.progress.metrics;
    this.tally = { words: 0, correct: m.correctEntries, incorrect: m.incorrectEntries, damage: m.focusLost };
    const boss = bossForEncounter(def.id, this.level.bosses);
    if (boss && this.boss?.def.id !== boss.id) this.startBoss(boss);
    this.startSpeedRound(def);
    // A chase word left over from travel stays until typed (owner: a word never disappears).
    patchRunUi({ prompt: def.optionalPrompt ?? null });
    this.resetEncounterTyping();
  }

  private handleEncounterEvents(events: readonly EncounterEvent[]): void {
    const runner = this.encounter;
    if (!runner) return;
    for (const e of events) {
      switch (e.type) {
        case 'wave-start':
          for (const cue of runner.def.waves[e.wave]?.fx ?? []) this.emitFx(cue);
          this.progress.resumeWaveIndex = e.wave;
          this.fireBarks({ on: 'wave-start', wave: e.wave });
          this.requestSave();
          break;
        case 'wave-complete':
          // Commit metrics atomically with the wave.
          this.commitMetrics();
          this.progress.resumeWaveIndex = e.wave + 1;
          this.requestSave();
          break;
        case 'complete':
          this.completeEncounter(runner);
          return;
        case 'hit':
          this.applyDamage(e.damage);
          if (e.source?.spawn.kind === 'imp') patchRunUi({ splatKey: nextKey() });
          // A fireball bursts on the apprentice before it bounces back for another go.
          if (e.source?.spawn.kind === 'fireball') this.emitFx({ kind: 'burst', scale: 1.4, color: '#ff5a1a' }, e.source.position);
          break;
        case 'hazard-hit': {
          this.bossStrikeAt = performance.now();
          this.applyDamage(e.damage);
          patchRunUi({ hazard: null });
          const cues = runner.def.hazard?.fx;
          if (cues && cues.length > 0) {
            const cue = cues[this.hazardFxIndex++ % cues.length];
            if (cue) this.emitFx(cue);
          }
          break;
        }
        case 'target-spawned':
          if (e.target.spawn.entrance) this.emitFx(e.target.spawn.entrance, e.target.position);
          // A boss hurling a fireball: its attack animation plays (bossThreat).
          if (runner.def.bossPhase && e.target.spawn.kind === 'fireball') this.bossStrikeAt = performance.now();
          break;
        case 'hazard-windup':
          this.bossWindupSec = e.windupSec;
          audio.playSfx('enemy-telegraph');
          patchRunUi({ hazard: { key: nextKey(), attack: e.attack, windupSec: e.windupSec } });
          break;
        case 'windup':
          audio.playSfx('enemy-telegraph', { volume: 0.6 });
          break;
        case 'target-gone':
          if (e.target.spawn.persist && e.target.defeated) {
            this.retired.push({ id: e.target.id, spawn: e.target.spawn, position: e.target.position.clone() });
            patchRunUi({ retiredKey: nextKey() });
          }
          break;
        case 'assist-enabled':
          this.progress.assist = true;
          this.queueBark(getLine('gal-assist'), this.director.currentIndex, true);
          break;
        default:
          break;
      }
    }
  }


  private completeEncounter(runner: EncounterRunner): void {
    const def = runner.def;
    const effects = def.onComplete;
    this.fireBarks({ on: 'complete' });
    if (effects) {
      for (const f of effects.flags ?? []) this.flags.add(f);
      if (effects.restoreAnchor && !this.progress.restoredAnchors.includes(effects.restoreAnchor)) {
        this.progress.restoredAnchors.push(effects.restoreAnchor);
        audio.playSfx('checkpoint');
      }
      if (effects.unlockSpell) this.unlockSpell(effects.unlockSpell);
      if (effects.restoreFocus) this.setFocus(MAX_FOCUS);
      if (effects.nextScoreMultiplier) {
        this.pendingMultiplier = effects.nextScoreMultiplier;
        this.progress.pendingScoreMultiplier = effects.nextScoreMultiplier;
      }
      if (effects.reward) this.grantReward(effects.reward);
    }
    for (const f of this.flags) if (!this.progress.flags.includes(f)) this.progress.flags.push(f);
    if (!this.progress.completedEncounterIds.includes(def.id)) this.progress.completedEncounterIds.push(def.id);
    if (def.bossPhase && !this.progress.completedBossPhases.includes(def.bossPhase)) {
      this.progress.completedBossPhases.push(def.bossPhase);
    }
    this.awardMedal();
    for (const cue of def.completeFx ?? []) this.emitFx(cue);
    if (this.speed?.state === 'running') this.clearSpeedRound();
    if (this.boss && this.boss.def.phases[this.boss.def.phases.length - 1] === def.id) {
      this.boss = null;
      patchRunUi({ boss: null });
    }
    this.activeMultiplier = 1;
    this.commitMetrics();
    if (this.battleMusic) this.musicRevertIn = MUSIC_REVERT_SEC;
    const beatId = this.encounterBeatId;
    this.encounter = null;
    this.encounterBeatId = null;
    this.resetEncounterTyping();
    patchRunUi({ prompt: null, hazard: null });
    this.refreshTargets();
    // Resume after a completed encounter from the beat that follows it.
    const next = this.level.route.beats[this.director.currentIndex + 1];
    if (next) {
      this.progress.resumeBeatId = next.id;
      this.progress.resumeWaveIndex = 0;
    }
    this.saveNow();
    if (beatId) this.director.completeGatedBeat(beatId);
  }

  private unlockSpell(spell: SpellId): void {
    if (this.progress.unlockedSpells.includes(spell)) return;
    this.progress.unlockedSpells.push(spell);
    audio.playSfx('unlock');
    // Announced like a power-up: a slow-motion beat and a big title card (§1B "Unlock moments").
    this.slowMoSec = SLOW_MO_SEC;
    patchRunUi({ powerUp: { key: nextKey(), spell } });
  }

  private grantReward(reward: Reward): void {
    const m = this.progress.metrics;
    if (reward.score) m.score += reward.score;
    if (reward.cosmetic) this.unlockCosmetic(reward.cosmetic);
    if (reward.heal) {
      this.setFocus(this.focus + reward.heal);
      this.songShield = true;
      audio.playSfx('heal', { rate: 0.8 });
    }
  }

  private unlockCosmetic(id: CosmeticId): void {
    if (!this.progress.unlockedCosmeticIds.includes(id)) this.progress.unlockedCosmeticIds.push(id);
    const profile = readProfile(this.options.storage);
    if (!profile.cosmetics.includes(id)) {
      profile.cosmetics.push(id);
      this.newCosmetics.push(id);
    }
    profile.selectedTrail = id;
    writeProfile(this.options.storage, profile);
    audio.playSfx('unlock');
    patchRunUi({ toast: { key: nextKey(), title: strings.toasts.cosmetic, detail: strings.cosmetics[id] } });
    this.saveNow();
  }

  private commitCheckpoint(beat: Extract<LevelBeat, { kind: 'checkpoint' }>): void {
    this.progress.checkpointId = beat.checkpointId;
    if (beat.restoreFocus) this.setFocus(MAX_FOCUS);
    if (!this.savesEnabled) this.savesEnabled = true;
    this.commitMetrics();
    const next = this.level.route.beats[this.director.currentIndex + 1];
    if (next) this.progress.resumeBeatId = next.id;
    if (beat.checkpointId === 'level-1-complete') this.progress.status = 'complete';
    audio.playSfx('checkpoint');
    this.saveNow();
  }

  // ---------- Focus ----------

  /** Mira's Shield Song (Level 3): one hit blocked after the song word. */
  private songShield = false;
  private songCooldown = 0;
  private song: EncounterRunner | null = null;

  /** Offers the Shield Song when HP runs low in Level 3: optional, at most every 20 s. */
  private updateSong(dt: number, timeScale: number, locked: string | null): boolean {
    this.songCooldown = Math.max(0, this.songCooldown - dt);
    let changed = false;
    const boss = this.encounter?.def.bossPhase !== undefined;
    const threshold = boss ? 50 : 40;
    if (
      !this.song &&
      this.level.id === 'level-3' &&
      this.songCooldown <= 0 &&
      this.focus < threshold &&
      !DIFFICULTY[this.difficulty].unlimitedHp &&
      this.encounter?.state === 'active' &&
      this.encounter.def.kind === 'combat'
    ) {
      const spawn: TargetSpawn = {
        id: `song-${Math.round(this.now())}`,
        kind: 'gem',
        position: [0, 0, 0],
        follow: { ahead: 3.6, side: -1.4, up: -0.35 },
        words: [{ min: 4, max: 5 }],
        optional: true,
        labelHeight: 0.28,
        variant: 'song',
        reward: { heal: 25 },
      };
      this.song = new EncounterRunner({ id: 'song', areaId: this.areaId, kind: 'interaction', waves: [{ id: 'song', targets: [spawn] }] }, { difficulty: this.difficulty, assist: this.assist, attempt: 0 });
      this.songCooldown = 20;
      this.queueBark(getLine('l3-shield-song'), this.director.currentIndex, true);
      changed = true;
    }
    const song = this.song;
    if (!song) return changed;
    const events = song.update(dt, timeScale, locked);
    if (events.some((e) => e.type === 'complete')) {
      this.song = null;
      return true;
    }
    return changed || events.length > 0;
  }

  private setFocus(value: number): void {
    this.focus = Math.max(0, Math.min(MAX_FOCUS, value));
    patchRunUi({ focus: this.focus });
  }

  private applyDamage(damage: number): void {
    if (!this.encounter || this.encounter.def.kind !== 'combat') return;
    if (DIFFICULTY[this.difficulty].unlimitedHp) {
      // Gentle: the hit still reads (a soft glow), but nothing is lost.
      patchRunUi({ damageKey: nextKey() });
      return;
    }
    if (this.songShield) {
      // Mira's Shield Song blocks one hit.
      this.songShield = false;
      audio.playSfx('shield-break');
      return;
    }
    const before = this.focus;
    this.setFocus(this.focus - damage);
    this.progress.metrics.focusLost += before - this.focus;
    audio.playSfx('focus-hit');
    this.shakeTime = SHAKE_SEC;
    patchRunUi({ damageKey: nextKey() });
    this.fireBarks({ on: 'focus-below', value: this.focus });
    if (this.focus <= 0) this.beginFocusReset();
  }

  /**
   * Clears typing between encounters, but keeps a word the player is part-way through on a chase or
   * song word (they outlive encounters; dropping them turned correct letters into mistakes).
   */
  private resetEncounterTyping(): void {
    const locked = this.typing.lockedId;
    if (locked !== null && this.runners().some((r) => r !== this.encounter && r.targets.has(locked))) return;
    this.typing.reset();
  }

  private beginFocusReset(): void {
    this.focusResetTimer = FOCUS_RESET_SEC;
    this.combo.reset();
    patchRunUi({ combo: 0, comboMultiplier: 1 });
    this.typing.reset();
    this.metrics.closeAttempt();
    patchRunUi({ focusReset: true, labels: [], hazard: null });
  }

  /** 1–3 stars for the encounter just finished (§1B). Tiny encounters are not rated. */
  private awardMedal(): void {
    const m = this.progress.metrics;
    const stars = encounterStars({
      words: this.tally.words,
      correct: m.correctEntries - this.tally.correct,
      incorrect: m.incorrectEntries - this.tally.incorrect,
      damage: m.focusLost - this.tally.damage,
    });
    if (!stars) return;
    const bonus = MEDAL_SCORE[stars];
    m.score += bonus;
    m.medalsEarned++;
    m.medalStars += stars;
    if (stars === 3) m.threeStarMedals++;
    audio.playSfx(stars === 3 ? 'checkpoint' : 'unlock', { volume: 0.8 });
    patchRunUi({ medal: { key: nextKey(), stars, bonus }, score: m.score });
  }

  /** Boss name card and health bar (§1B). Health counts words already typed in finished phases. */
  private startBoss(def: BossDef): void {
    const total = bossWordTotal(def, this.level.encounters);
    let done = 0;
    for (const id of def.phases) {
      if (!this.progress.completedEncounterIds.includes(id)) continue;
      done += bossWordTotal({ ...def, phases: [id] }, this.level.encounters);
    }
    this.boss = { def, total, done };
    patchRunUi({ boss: { id: def.id, health: 1 - done / Math.max(1, total) } });
  }

  private finishFocusReset(): void {
    const runner = this.encounter;
    this.setFocus(MAX_FOCUS);
    this.progress.metrics.checkpointRestarts++;
    patchRunUi({ focusReset: false });
    if (!runner) return;
    const id = runner.def.id;
    const failures = (this.failures.get(id) ?? 0) + 1;
    this.failures.set(id, failures);
    if (runner.def.assistAfterFailures && failures >= runner.def.assistAfterFailures && !this.progress.assist) {
      this.progress.assist = true;
      runner.ctx.assist = true;
      this.queueBark(getLine('assist-offer'), this.director.currentIndex, true);
    } else {
      this.queueBark(getLine('focus-reset'));
    }
    runner.restartWave();
    this.refreshTargets();
  }

  // ---------- Dialogue and barks ----------
  // Every line plays by itself (spoken when voice is on) and advances when it finishes; typing never
  // cuts it (Enter/Space skip). Lines are tagged with their beat and dropped if stale or superseded. Story dialogue holds its beat only until its lines have played — never waits for Enter.

  private lineElapsed = 0;
  private lineSpeaking = false;

  private present(line: DialogueLine, blocking: boolean): void {
    patchRunUi({ subtitle: { key: nextKey(), speaker: line.speaker, text: line.text, blocking } });
    this.lineElapsed = 0;
    this.lineSpeaking = voice.speak(line.text, line.speaker, () => {
      this.lineSpeaking = false;
    });
  }

  private lineFinished(line: DialogueLine): boolean {
    if (this.lineSpeaking) return this.lineElapsed >= 2.5 + line.text.length * 0.1;
    return this.lineElapsed >= readSeconds(line.text);
  }

  /** Where a conversation lets the camera go: early before travel, at the last line before a fight. */
  private releaseIndex(lineCount: number): number {
    const i = this.director.currentIndex;
    // An ending conversation is said in full before the story moves on (Mira's cheer and Pip's last
    // joke were cut off by the results screen).
    const here = this.level.route.beats[i];
    if (here && 'attention' in here && here.attention === 'ending') return -1;
    const following = this.level.route.beats.slice(i + 1, i + 4);
    if (lineCount === 0 || following.some((b) => b.kind === 'results' || b.kind === 'choice')) return -1;
    const next = following[0];
    if (!next) return -1;
    if (isCameraBeat(next)) return 0;
    if (next.kind === 'encounter') return lineCount - 1;
    return -1;
  }

  private startDialogue(): void {
    const d = this.dialogue;
    if (!d) return;
    d.started = true;
    this.showDialogueLine();
  }

  /** Let the director carry on; the current and remaining lines continue as subtitles. */
  private releaseDialogue(d: DialogueState): void {
    this.dialogue = null;
    const beat = this.level.beatIndexOf(d.beatId);
    this.currentBark = d.lines[d.index] ?? null;
    this.currentBarkBeat = beat;
    this.barkQueue = d.lines.slice(d.index + 1).map((line) => ({ line, beat, at: this.speechClock }));
    const sub = useRunStore.getState().subtitle;
    if (sub) patchRunUi({ subtitle: { ...sub, blocking: false } });
    this.director.completeGatedBeat(d.beatId);
  }

  private showDialogueLine(): void {
    const d = this.dialogue;
    const line = d?.lines[d.index];
    if (!d || !line) return;
    this.present(line, true);
  }

  private updateDialogue(dt: number): void {
    const d = this.dialogue;
    if (!d || !d.started) return;
    d.elapsed += dt;
    this.lineElapsed += dt;
    const line = d.lines[d.index];
    if (!line) {
      this.endDialogue();
      return;
    }
    if (d.releaseAt >= 0 && d.index >= d.releaseAt && this.lineElapsed >= Math.min(RELEASE_AFTER_SEC, readSeconds(line.text))) {
      this.releaseDialogue(d);
      return;
    }
    if (this.lineFinished(line)) this.advanceDialogue(false);
  }

  private advanceDialogue(skipped: boolean, guarded = false): void {
    const d = this.dialogue;
    if (!d || !d.started) return;
    // A short guard so a letter held over from the previous moment never skips a line unseen.
    if (guarded && d.elapsed < 0.25) return;
    if (skipped) voice.cancel();
    d.index++;
    d.elapsed = 0;
    if (d.index >= d.lines.length) this.endDialogue();
    else this.showDialogueLine();
  }

  private endDialogue(): void {
    const d = this.dialogue;
    this.dialogue = null;
    patchRunUi({ subtitle: null });
    if (d) this.director.completeGatedBeat(d.beatId);
  }

  private queueBark(line: DialogueLine | undefined, beat = this.director.currentIndex, tip = false): void {
    if (!line) return;
    // Keep remarks timely: a long backlog of reactions (not story lines) is trimmed from the front.
    if (this.barkQueue.length >= 6) this.barkQueue.shift();
    this.barkQueue.push({ line, beat, at: this.speechClock, instruction: tip || line.tip === true });
  }

  /**
   * True while lines belonging to `beatIndex` are still waiting or being said. Owner (2026-10-06): a
   * spoken line is never cut short by the story moving on — the story waits for the speech instead.
   */
  private speechPending(beatIndex: number): boolean {
    if (this.currentBark && this.currentBarkBeat === beatIndex) return true;
    return this.barkQueue.some((q) => q.beat === beatIndex);
  }

  /**
   * Camera beats wait at their end pose for their own lines. Spectacles and boss intros stay short
   * instead: their lines simply carry on (never cut) into the next moment.
   */
  private holdForSpeech(): boolean {
    const beat = this.director.currentBeat;
    if (!beat || ('attention' in beat && (beat.attention === 'spectacle' || beat.attention === 'boss-intro'))) return false;
    const index = this.director.currentIndex;
    // Chrome playtest (2026-10-07): with real voices, lines that were allowed to carry on into the next
    // scene were said over the wrong thing ("a healing fountain!" while passing the paintings). A camera
    // move now waits at its end until its own lines have been said in full.
    if (this.speechPending(index)) return true;
    // Owner (2026-10-08): the fountain's line came after its droplets had floated away, queued behind
    // the portraits' lines. Earlier story lines still being said hold the camera before a scene that
    // brings lines of its own, so each scene's lines are heard in that scene.
    const next = this.level.route.beats[index + 1];
    return next !== undefined && this.bringsLines(next) && this.earlierStoryPending(index);
  }

  /** A fight waiting for earlier story lines to finish (see onBeatStart). */
  private deferredFight: { beatId: string; encounterId: string; index: number; waited: number } | null = null;

  private updateDeferredFight(dt: number): void {
    const d = this.deferredFight;
    if (!d) return;
    if (this.director.currentIndex !== d.index) {
      this.deferredFight = null;
      return;
    }
    d.waited += dt;
    // Never wait forever: a stuck voice must not stall the level.
    if (this.earlierStoryPending(d.index) && d.waited < MAX_FIGHT_WAIT_SEC) return;
    this.deferredFight = null;
    this.startEncounter(d.beatId, d.encounterId);
  }

  /** True if a beat says something as it starts (its own lines, a conversation, or a fight's lines). */
  private bringsLines(beat: LevelBeat): boolean {
    if (beat.kind === 'dialogue') return beat.lines.length > 0;
    return (beat.barks ?? []).length > 0;
  }

  /** A story line (not a fight's tip) from an earlier beat is being said or waiting to be said. */
  private earlierStoryPending(beatIndex: number): boolean {
    if (this.currentBark && this.currentBarkBeat < beatIndex) return true;
    return this.barkQueue.some((q) => q.beat < beatIndex && !q.instruction);
  }

  /**
   * The next queued line that still belongs on screen: lines of the current scene always play; a line
   * left over from an earlier scene plays only if it is fresh (never said late, out of place).
   */
  private nextFreshLine(): QueuedLine | undefined {
    while (this.barkQueue.length > 0) {
      const q = this.barkQueue.shift();
      if (!q) continue;
      // Story lines are always said (camera moves wait for theirs; only intros and spectacles move on
      // early). A late remark or instruction from a fight that is over is dropped.
      if (q.beat >= this.director.currentIndex || !q.instruction || this.speechClock - q.at <= LINE_FRESH_SEC) return q;
    }
    return undefined;
  }

  /** Stop the line being said and move straight on to the next queued one. */
  private skipBark(): void {
    voice.cancel();
    this.currentBark = null;
    if (this.dialogue) {
      this.startDialogue();
      return;
    }
    const next = this.nextFreshLine();
    if (!next) {
      patchRunUi({ subtitle: null });
      return;
    }
    this.currentBark = next.line;
    this.currentBarkBeat = next.beat;
    this.present(next.line, false);
  }

  private updateBarks(dt: number): void {
    this.speechClock += dt;
    if (this.dialogue?.started) return;
    if (this.currentBark) {
      this.lineElapsed += dt;
      if (!this.lineFinished(this.currentBark)) return;
      this.currentBark = null;
      if (this.dialogue) {
        this.startDialogue();
        return;
      }
      if (this.barkQueue.length === 0) patchRunUi({ subtitle: null });
    }
    const next = this.nextFreshLine();
    if (!next) return;
    this.currentBark = next.line;
    this.currentBarkBeat = next.beat;
    this.present(next.line, false);
  }

  private fireBarks(trigger: BarkTrigger): void {
    const def = this.encounter?.def;
    if (!def?.barks) return;
    def.barks.forEach((bark, i) => {
      const key = `${def.id}:${i}`;
      if (this.firedBarks.has(key)) return;
      const w = bark.when;
      let match: boolean;
      switch (w.on) {
        case 'wave-start':
          match = trigger.on === 'wave-start' && trigger.wave === w.wave;
          break;
        case 'defeats':
          match = trigger.on === 'defeats' && trigger.count >= w.count;
          break;
        case 'focus-below':
          match = trigger.on === 'focus-below' && trigger.value < w.value;
          break;
        default:
          match = trigger.on === w.on;
      }
      if (match) {
        this.firedBarks.add(key);
        // Lines on the first letter, first mistake or low HP are typing tips; lines on a wave, a defeat
        // or the end of a fight carry the story unless the line itself is a tip.
        const tip = w.on === 'first-correct' || w.on === 'first-mistake' || w.on === 'focus-below';
        this.queueBark(getLine(bark.line), this.director.currentIndex, tip);
      }
    });
  }

  // ---------- Choice (pre-boss) ----------

  private choiceOptions(): { id: string; label: string }[] {
    return [
      { id: 'continue', label: strings.choice.continue },
      { id: 'controls', label: strings.choice.controls },
      { id: 'difficulty', label: strings.choice.difficulty },
    ];
  }

  private publishChoice(): void {
    const c = this.choice;
    patchRunUi({ choice: c ? { options: this.choiceOptions(), index: c.panel === 'difficulty' ? c.difficultyIndex : c.index, panel: c.panel } : null });
  }

  /** Mouse/touch selection from the choice panel. */
  selectChoice(index: number): void {
    const c = this.choice;
    if (!c) return;
    if (c.panel === 'difficulty') c.difficultyIndex = index;
    else c.index = index;
    this.handleChoiceIntent({ kind: 'enter' });
  }

  private handleChoiceIntent(intent: KeyIntent): void {
    const c = this.choice;
    if (!c) return;
    const options = this.choiceOptions();
    if (c.panel === 'controls') {
      if (intent.kind === 'enter' || intent.kind === 'escape' || intent.kind === 'space') c.panel = 'none';
    } else if (c.panel === 'difficulty') {
      if (intent.kind === 'left') c.difficultyIndex = Math.max(0, c.difficultyIndex - 1);
      else if (intent.kind === 'right') c.difficultyIndex = Math.min(2, c.difficultyIndex + 1);
      else if (intent.kind === 'enter' || intent.kind === 'space') {
        this.setDifficulty(DIFFICULTY_ORDER[c.difficultyIndex] ?? 'standard');
        c.panel = 'none';
      } else if (intent.kind === 'escape') c.panel = 'none';
    } else if (intent.kind === 'left') {
      c.index = (c.index + options.length - 1) % options.length;
      audio.playSfx('ui-move');
    } else if (intent.kind === 'right' || intent.kind === 'tab') {
      c.index = (c.index + 1) % options.length;
      audio.playSfx('ui-move');
    } else if (intent.kind === 'enter' || intent.kind === 'space') {
      audio.playSfx('ui-select');
      const chosen = options[c.index]?.id;
      if (chosen === 'continue') {
        const beatId = c.beatId;
        this.choice = null;
        patchRunUi({ choice: null });
        this.director.completeGatedBeat(beatId);
        return;
      }
      c.panel = chosen === 'controls' ? 'controls' : 'difficulty';
    }
    this.publishChoice();
  }

  /** Difficulty can change at checkpoints and between encounters without restarting (§9). */
  setAssist(assist: boolean): void {
    this.progress.assist = assist;
    if (this.encounter) this.encounter.ctx.assist = assist;
    this.saveNow();
  }

  setDifficulty(difficulty: Difficulty): void {
    this.progress.difficulty = difficulty;
    if (DIFFICULTY[difficulty].unlimitedHp) this.setFocus(MAX_FOCUS);
    patchRunUi({ unlimitedHp: DIFFICULTY[difficulty].unlimitedHp });
    this.typing.setOptions({ rejectMistakes: DIFFICULTY[difficulty].rejectMistakes });
    this.saveNow();
  }

  get canChangeDifficulty(): boolean {
    return !this.isEncounterActive;
  }

  // ---------- Targets / labels ----------

  private refreshTargets(): void {
    const candidates = this.runners().flatMap((r) => r.candidates());
    const unlocks = this.typing.setCandidates(candidates);
    if (unlocks.length > 0) this.metrics.closeAttempt();
    const ids = [...this.allTargets()].map((t) => t.id);
    const current = useRunStore.getState().targetIds;
    if (ids.length !== current.length || ids.some((id, i) => id !== current[i])) patchRunUi({ targetIds: ids });
    this.refreshLabels();
  }

  refreshLabels(): void {
    if (this.focusResetTimer > 0) return;
    const view = this.typing.view;
    const labels: LabelInfo[] = [];
    for (const t of this.allTargets()) {
      if (t.phase !== 'active' || t.defeated || t.wordDelay > 0) continue;
      const word = t.words[t.stage];
      if (!word) continue;
      const locked = view.lockedId === t.id;
      labels.push({
        id: t.id,
        word,
        correctLength: locked ? view.correctLength : 0,
        wrongText: locked ? view.wrongText : '',
        locked,
        pendingPrefix: view.pendingIds.includes(t.id) ? view.pendingPrefix.length : 0,
        shielded: isShielded(t),
        optional: t.spawn.optional === true,
        priority: t.spawn.priority === true,
        kind: t.spawn.kind,
        stage: t.stage,
        stages: t.spawn.words.length,
        phrase: t.spawn.phrase ? t.spawn.words.map((w, i) => (typeof w === 'string' ? w : (t.words[i] ?? '…'))) : null,
        danger: t.attackPhase === 'windup',
        tabHint: view.lockedId !== null && !locked,
        counter: t.spawn.counter === true,
      });
    }
    patchRunUi({ labels });
  }

  // ---------- Saving ----------

  private commitMetrics(): void {
    this.metrics.suspend();
    this.committed = cloneMetrics(this.progress.metrics);
  }

  private requestSave(): void {
    if (this.saveIn < 0) this.saveIn = SAVE_DEBOUNCE_SEC;
  }

  private updateSaveTimer(dt: number): void {
    if (this.saveIn < 0) return;
    this.saveIn -= dt;
    if (this.saveIn <= 0) this.saveNow();
  }

  /** Writes the autosave immediately (debounce bypass). */
  saveNow(): void {
    this.saveIn = -1;
    if (!this.savesEnabled || this.ended) return;
    const snapshot: Level1Autosave = {
      ...this.progress,
      flags: [...this.flags],
      // Only committed typing metrics are saved; level time is always current.
      metrics: { ...cloneMetrics(this.committed), levelTimeMs: this.progress.metrics.levelTimeMs },
      savedAtIso: new Date().toISOString(),
    };
    if (writeAutosave(this.options.storage, snapshot, (id) => this.director.indexOf(id) >= 0)) {
      patchRunUi({ saveKey: nextKey() });
    }
  }

  // ---------- End ----------

  private finishLevel(): void {
    this.metrics.suspend();
    this.progress.status = 'complete';
    const metrics = this.progress.metrics;
    const results = buildResults(metrics, this.difficulty, this.newCosmetics, this.level.id);
    const storage = this.options.storage;
    const profile = readProfile(storage);
    if (!profile.completedLevels.includes(this.level.id)) profile.completedLevels.push(this.level.id);
    profile.levelCompleted = profile.completedLevels.includes('level-1');
    const best = mergeBestResults(profile.bestByLevel[this.level.id] ?? null, {
      bestAverageWpm: results.averageWpm,
      bestAccuracy: results.accuracy,
      bestStreak: results.bestStreak,
      fastestLevelMs: metrics.levelTimeMs,
      bestScore: results.score,
    });
    profile.bestByLevel[this.level.id] = best;
    if (this.level.id === 'level-1') profile.bestResults = best;
    writeProfile(storage, profile);
    this.committed = cloneMetrics(metrics);
    this.saveNow();
    this.ended = true;
    patchRunUi({ results, subtitle: null, labels: [] });
    this.options.onResults?.(results);
  }

  get isEnded(): boolean {
    return this.ended;
  }
}
