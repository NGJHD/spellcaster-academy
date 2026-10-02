/**
 * Authored Level 1 data model (CLAUDE.md §6A): a deterministic sequence of beats.
 * Camera beats run on time; gated beats wait for a system (dialogue, encounter, choice) to finish.
 */
import type { WordCategory } from '../content/wordLists';
import type { AnchorId, AreaId, CheckpointId, CosmeticId, SpellId, StarPageId } from '../game/types';
import type { CameraBeat, CameraNode, Vec3 } from './rail/railTypes';

export type MusicId =
  | 'title'
  | 'arrival-wonder'
  | 'ward-fracture'
  | 'courtyard-action'
  | 'east-hall-calm'
  | 'library-mystery'
  | 'grimoire-battle'
  | 'portrait-rest'
  | 'greenhouse-wonder'
  | 'greenhouse-action'
  | 'tower-ascent'
  | 'warden-defence'
  | 'tower-battle'
  | 'ward-repair'
  | 'celebration'
  | 'results';

export type LineId = string;

/** Shared optional fields for every beat. */
export interface BeatExtras {
  readonly music?: MusicId;
  /** Objective text key shown in the HUD from this beat onward. */
  readonly objective?: string;
  /** Non-blocking subtitle lines played when the beat starts. */
  readonly barks?: readonly LineId[];
  /** Optional collectible target available while this beat plays (GD-18). */
  readonly bonus?: TargetSpawn;
  /** Refill Focus when the beat starts (fountains, safe rooms). */
  readonly restoreFocus?: boolean;
}

export type LevelCameraBeat = CameraBeat & BeatExtras;

interface GatedBeatBase extends BeatExtras {
  readonly id: string;
  readonly areaId: AreaId;
}

/** Blocking dialogue: Enter (or auto-continue) advances each line. Camera holds. */
export interface DialogueBeat extends GatedBeatBase {
  readonly kind: 'dialogue';
  readonly lines: readonly LineId[];
}

/** Typing combat or a typing interaction. Each wave is a resume point. */
export interface EncounterBeat extends GatedBeatBase {
  readonly kind: 'encounter';
  readonly encounterId: string;
}

/** Instant: commits an autosave checkpoint. */
export interface CheckpointBeat extends GatedBeatBase {
  readonly kind: 'checkpoint';
  readonly checkpointId: CheckpointId;
  readonly restoreFocus?: boolean;
}

/** Player picks an option (pre-boss menu). */
export interface ChoiceBeat extends GatedBeatBase {
  readonly kind: 'choice';
  readonly choiceId: 'pre-boss';
}

export interface ResultsBeat extends GatedBeatBase {
  readonly kind: 'results';
}

export type GatedBeat = DialogueBeat | EncounterBeat | CheckpointBeat | ChoiceBeat | ResultsBeat;

export type LevelBeat = LevelCameraBeat | GatedBeat;

export interface LevelRoute {
  readonly id: string;
  readonly nodes: Readonly<Record<string, CameraNode>>;
  readonly lookPoints: Readonly<Record<string, Vec3>>;
  readonly beats: readonly LevelBeat[];
}

// ---------- Encounters ----------

export type TargetKind =
  | 'marker'
  | 'dummy'
  | 'sprite'
  | 'book'
  | 'wisp'
  | 'thorn-pod'
  | 'mossling'
  | 'pollen'
  | 'guardian'
  | 'star-page'
  | 'clasp'
  | 'flying-page'
  | 'plate'
  | 'rune';

/** A fixed word, or a request for a generated word. Lengths are Standard and shift with difficulty. */
export type WordSpec = string | { readonly min: number; readonly max: number; readonly category?: WordCategory };

export type Movement =
  | { readonly kind: 'static' }
  /** Walks/flies along the path; attacks from the final point. */
  | { readonly kind: 'approach'; readonly path: readonly Vec3[]; readonly speed: number }
  /** Moves back and forth along the path and attacks from range. */
  | { readonly kind: 'patrol'; readonly path: readonly Vec3[]; readonly speed: number }
  | {
      readonly kind: 'orbit';
      readonly centre: Vec3;
      readonly radius: number;
      /** Radians per second. */
      readonly speed: number;
      readonly phase: number;
    };

export interface AttackSpec {
  readonly kind: 'contact' | 'ranged';
  /** Telegraph before the hit lands (scaled by difficulty, never below its minimum). */
  readonly windupSec: number;
  readonly recoverSec: number;
  /** Pause between attacks. */
  readonly intervalSec: number;
  readonly damage: number;
}

export interface Reward {
  readonly starPage?: StarPageId;
  readonly cosmetic?: CosmeticId;
  readonly score?: number;
}

export interface TargetSpawn {
  readonly id: string;
  readonly kind: TargetKind;
  readonly position: Vec3;
  readonly movement?: Movement;
  readonly attack?: AttackSpec;
  /** One word per stage. With `shield`, the first word breaks the shield. */
  readonly words: readonly WordSpec[];
  readonly shield?: boolean;
  /** Seconds after the wave starts before this target appears. */
  readonly delaySec?: number;
  /** Optional bonus target: never required, leaves after `leaveAfterSec`. */
  readonly optional?: boolean;
  readonly leaveAfterSec?: number;
  /** Chain Spark can dispel weak targets. */
  readonly weak?: boolean;
  /** HUD marks this as the priority threat. */
  readonly priority?: boolean;
  readonly challengeOnly?: boolean;
  readonly reward?: Reward;
  /** Reward granted only if this condition holds. */
  readonly rewardIf?: 'first-defeat' | 'perfect';
  /** Height of the word label above `position`. */
  readonly labelHeight?: number;
  /** The words form one sentence: the label shows the whole sentence and highlights the current word. */
  readonly phrase?: boolean;
  /** Visual scale/variant hint for the renderer. */
  readonly variant?: string;
  /** Stays in the scene in its calm/inactive pose after defeat (dummy, guardian, moss mound, dormant pod). */
  readonly persist?: boolean;
}

export type WaveRule =
  | { readonly kind: 'clear' }
  /** Practice Gallery P1: needs N words at or above an accuracy; extra targets until met. */
  | { readonly kind: 'qualify'; readonly needed: number; readonly minAccuracy: number; readonly extra: TargetSpawn }
  /** Practice Gallery P3: needs a streak of N perfect words; assist after repeated breaks. */
  | { readonly kind: 'streak'; readonly needed: number; readonly assistAfterBreaks: number; readonly extra: TargetSpawn };

export type BarkTrigger =
  | { readonly on: 'wave-start'; readonly wave: number }
  | { readonly on: 'defeats'; readonly count: number }
  | { readonly on: 'focus-below'; readonly value: number }
  | { readonly on: 'first-mistake' }
  | { readonly on: 'first-correct' }
  | { readonly on: 'complete' };

export interface Bark {
  readonly when: BarkTrigger;
  readonly line: LineId;
}

export interface Wave {
  readonly id: string;
  readonly targets: readonly TargetSpawn[];
  /** Activate one target at a time, in order. */
  readonly sequential?: boolean;
  readonly rule?: WaveRule;
}

export type HazardAttack = 'arc-left' | 'arc-right' | 'pulse' | 'gust';

/** Boss attacks that are not tied to a typed target. Always telegraphed; slowed while typing. */
export interface HazardSpec {
  readonly attacks: readonly HazardAttack[];
  readonly firstDelaySec: number;
  readonly intervalSec: number;
  readonly windupSec: number;
  readonly damage: number;
}

export interface CompletionEffects {
  readonly flags?: readonly string[];
  readonly unlockSpell?: SpellId;
  readonly restoreAnchor?: AnchorId;
  readonly restoreFocus?: boolean;
  /** Score multiplier for the next combat encounter. */
  readonly nextScoreMultiplier?: number;
  readonly reward?: Reward;
}

export interface EncounterDef {
  readonly id: string;
  readonly areaId: AreaId;
  /** 'interaction' never damages Focus and has no failure state. */
  readonly kind: 'combat' | 'interaction';
  readonly waves: readonly Wave[];
  /** Optional interactions show a prompt; Enter skips them. */
  readonly optionalPrompt?: string;
  readonly hazard?: HazardSpec;
  readonly barks?: readonly Bark[];
  readonly onComplete?: CompletionEffects;
  /** Boss phase identifier recorded in the save (before/after autosaves). */
  readonly bossPhase?: string;
  /** After this many Focus resets in this encounter, assist mode is offered. */
  readonly assistAfterFailures?: number;
}
