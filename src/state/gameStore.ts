import { create } from 'zustand';
import { GameRun, type RunSettings } from '../game/GameRun';
import { browserStorage, readAutosave, type KeyValueStorage, type Level1Autosave } from '../game/saveData';
import type { Difficulty } from '../game/types';
import { LEVEL1_ROUTE, beatIndexOf } from '../level/level1Route';
import { initialRunUi, useRunStore } from './runStore';
import { TRAVEL_SPEED_MULTIPLIER } from './settings';
import { getSettings } from './settingsStore';

export type GameMode = 'menu' | 'exploration' | 'combat' | 'dialogue' | 'paused' | 'results';

type PlayMode = Exclude<GameMode, 'menu' | 'paused'>;

let storage: KeyValueStorage | null = null;
export function gameStorage(): KeyValueStorage {
  storage ??= browserStorage();
  return storage;
}

/** Test seam: swap storage (e.g. in-memory) before starting a run. */
export function setGameStorage(next: KeyValueStorage): void {
  storage = next;
}

let currentRun: GameRun | null = null;

/** The live run, or null on the title screen. Read imperatively by the scene each frame. */
export function getRun(): GameRun | null {
  return currentRun;
}

export function knownBeat(id: string): boolean {
  return beatIndexOf(id) >= 0;
}

export function readResumableSave(): Level1Autosave | null {
  const save = readAutosave(gameStorage(), knownBeat);
  return save && save.status === 'in-progress' ? save : null;
}

/** Development/testing URL options: `?beat=<id>` starts a new run at a beat; `?speed=<n>` scales time. */
const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const DEV_TOOLS = import.meta.env.DEV || params.has('test');
export const DEV_START_BEAT = DEV_TOOLS ? (params.get('beat') ?? undefined) : undefined;
export const TIME_SCALE = DEV_TOOLS ? Math.min(20, Math.max(0.1, Number(params.get('speed') ?? '1') || 1)) : 1;

function runSettings(): RunSettings {
  const s = getSettings();
  return {
    rail: { reducedMotion: s.reducedMotion, travelSpeed: TRAVEL_SPEED_MULTIPLIER[s.travelSpeed] },
    autoContinue: s.autoContinue,
    reducedShake: s.reducedShake,
  };
}

interface GameState {
  readonly mode: GameMode;
  readonly modeBeforePause: PlayMode;
  /** Incremented whenever a run starts, so the scene can rebuild. */
  readonly runId: number;

  startNewRun(difficulty: Difficulty): void;
  resumeSavedRun(): boolean;
  pause(): void;
  resume(): void;
  quitToMenu(): void;
}

export const useGameStore = create<GameState>()((set, get) => {
  const begin = (run: GameRun) => {
    currentRun = run;
    set((s) => ({ mode: 'exploration', modeBeforePause: 'exploration', runId: s.runId + 1 }));
  };

  return {
    mode: 'menu',
    modeBeforePause: 'exploration',
    runId: 0,

    startNewRun: (difficulty) => {
      useRunStore.setState(initialRunUi());
      const existing = readResumableSave();
      begin(
        new GameRun({
          difficulty,
          resume: null,
          storage: gameStorage(),
          deferSavesUntilFirstCheckpoint: existing !== null,
          settings: runSettings,
          onResults: () => set({ mode: 'results' }),
          startBeatId: DEV_START_BEAT && knownBeat(DEV_START_BEAT) ? DEV_START_BEAT : undefined,
        }),
      );
    },

    resumeSavedRun: () => {
      const save = readResumableSave();
      if (!save) return false;
      useRunStore.setState(initialRunUi());
      begin(
        new GameRun({
          difficulty: save.difficulty,
          resume: save,
          storage: gameStorage(),
          deferSavesUntilFirstCheckpoint: false,
          settings: runSettings,
          onResults: () => set({ mode: 'results' }),
        }),
      );
      return true;
    },

    pause: () => {
      const { mode } = get();
      if (mode === 'menu' || mode === 'paused' || mode === 'results') return;
      currentRun?.setPaused(true);
      set({ mode: 'paused', modeBeforePause: mode });
    },

    resume: () => {
      if (get().mode !== 'paused') return;
      currentRun?.setPaused(false);
      set((s) => ({ mode: s.modeBeforePause }));
    },

    quitToMenu: () => {
      currentRun?.saveNow();
      currentRun = null;
      useRunStore.setState(initialRunUi());
      set({ mode: 'menu' });
    },
  };
});

export const isGameplayActive = (mode: GameMode): boolean => mode !== 'menu' && mode !== 'paused' && mode !== 'results';

export const FIRST_BEAT_ID = LEVEL1_ROUTE.beats[0]?.id ?? '';
