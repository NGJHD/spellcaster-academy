/**
 * Coarse HUD state for the current run. Updated on gameplay events (keystrokes, spawns, beats),
 * never per frame. Positions are projected imperatively by the label projector.
 */
import { create } from 'zustand';
import type { Speaker } from '../content/dialogue';
import type { HazardAttack, TargetKind } from '../level/levelTypes';
import type { ResultsData } from '../game/scoring';
import type { AreaId, SpellId } from '../game/types';

export interface LabelInfo {
  readonly id: string;
  readonly word: string;
  readonly correctLength: number;
  readonly wrongText: string;
  readonly locked: boolean;
  /** Matches the typed prefix while duplicate initials are being resolved. */
  readonly pendingPrefix: number;
  readonly shielded: boolean;
  readonly optional: boolean;
  readonly priority: boolean;
  readonly kind: TargetKind;
  readonly stage: number;
  readonly stages: number;
  /** Whole sentence for phrase targets (words already typed, then the rest); null otherwise. */
  readonly phrase: readonly string[] | null;
  /** The target is winding up an attack. */
  readonly danger: boolean;
  /** Another target is locked, so this one can be reached with Tab. */
  readonly tabHint: boolean;
  /** Counter-word (Ward Shield): drawn on a pale-blue tag. */
  readonly counter?: boolean;
}

export interface SubtitleInfo {
  readonly key: number;
  readonly speaker: Speaker;
  readonly text: string;
  readonly blocking: boolean;
}

export interface ToastInfo {
  readonly key: number;
  readonly title: string;
  readonly detail?: string;
}

/** A cheer that pops near a target ("PERFECT!", "SUPER!"). Position is in world space. */
export interface PopupInfo {
  readonly key: number;
  readonly text: string;
  readonly tier: 'perfect' | 'cheer';
  readonly position: readonly [number, number, number];
}

export interface MedalInfo {
  readonly key: number;
  readonly stars: 1 | 2 | 3;
  readonly bonus: number;
}

export interface BossBarInfo {
  readonly id: string;
  /** 1 = full health, 0 = beaten. */
  readonly health: number;
}

export interface SpeedRoundInfo {
  readonly key: number;
  readonly totalSec: number;
  /** Rounded to tenths so the store updates at most ten times a second. */
  readonly remainingSec: number;
  readonly done: number;
  readonly words: number;
  readonly state: 'running' | 'won' | 'time-up';
  readonly bonus: number;
  /** Best bonus on this device for this round (0 if never won). */
  readonly best: number;
  readonly newBest: boolean;
}

export interface ChoiceInfo {
  readonly options: readonly { id: string; label: string }[];
  readonly index: number;
  /** Sub-panel opened from the choice (controls review or difficulty change). */
  readonly panel: 'none' | 'controls' | 'difficulty';
}

export interface RunUiState {
  areaId: AreaId | null;
  /** Bumps when an area card should show. */
  areaCardKey: number;
  focus: number;
  /** Gentle difficulty: HP is unlimited and the HP bar is hidden. */
  unlimitedHp: boolean;
  objective: string | null;
  streak: number;
  starPages: number;
  labels: readonly LabelInfo[];
  /** Target id → mistake flash key. */
  mistakeKey: number;
  mistakeTargetId: string | null;
  subtitle: SubtitleInfo | null;
  prompt: string | null;
  toast: ToastInfo | null;
  saveKey: number;
  choice: ChoiceInfo | null;
  focusReset: boolean;
  resumeIntro: boolean;
  hazard: { key: number; attack: HazardAttack; windupSec: number } | null;
  damageKey: number;
  results: ResultsData | null;
  /** Target ids currently rendered in the scene (spawn/despawn only). */
  targetIds: readonly string[];
  retiredKey: number;
  liveWpm: number;
  beatId: string | null;
  /** 0–1 through the level route, for the progress bar. */
  progress: number;
  score: number;
  combo: number;
  comboMultiplier: number;
  popups: readonly PopupInfo[];
  medal: MedalInfo | null;
  /** Bumps when a boss name card should play. */
  bossCard: { key: number; id: string } | null;
  /** The journey map card: the next stop on the way (Level 2 beacons, Level 3 road to the Citadel). */
  journey: { key: number; to: string } | null;
  boss: BossBarInfo | null;
  speedRound: SpeedRoundInfo | null;
  /** New-spell power-up card (§1B "Unlock moments"). */
  powerUp: { key: number; spell: SpellId } | null;
  /** Bumps for a full-screen flash (explosions, the ward re-sealing). */
  flashKey: number;
  /** Bumps when a paint splat lands on the screen edge (Hall of Portraits imps). */
  splatKey: number;
}

export const initialRunUi = (): RunUiState => ({
  areaId: null,
  areaCardKey: 0,
  focus: 100,
  unlimitedHp: false,
  objective: null,
  streak: 0,
  starPages: 0,
  labels: [],
  mistakeKey: 0,
  mistakeTargetId: null,
  subtitle: null,
  prompt: null,
  toast: null,
  saveKey: 0,
  choice: null,
  focusReset: false,
  resumeIntro: false,
  hazard: null,
  damageKey: 0,
  results: null,
  targetIds: [],
  retiredKey: 0,
  liveWpm: 0,
  beatId: null,
  progress: 0,
  score: 0,
  combo: 0,
  comboMultiplier: 1,
  popups: [],
  medal: null,
  bossCard: null,
  journey: null,
  boss: null,
  speedRound: null,
  powerUp: null,
  flashKey: 0,
  splatKey: 0,
});

export const useRunStore = create<RunUiState>()(() => initialRunUi());

export function patchRunUi(patch: Partial<RunUiState>): void {
  useRunStore.setState(patch);
}
