/**
 * Coarse HUD state for the current run. Updated on gameplay events (keystrokes, spawns, beats),
 * never per frame. Positions are projected imperatively by the label projector.
 */
import { create } from 'zustand';
import type { Speaker } from '../content/dialogue';
import type { HazardAttack, TargetKind } from '../level/levelTypes';
import type { ResultsData } from '../game/scoring';
import type { AreaId } from '../game/types';

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
}

export const initialRunUi = (): RunUiState => ({
  areaId: null,
  areaCardKey: 0,
  focus: 100,
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
});

export const useRunStore = create<RunUiState>()(() => initialRunUi());

export function patchRunUi(patch: Partial<RunUiState>): void {
  useRunStore.setState(patch);
}
