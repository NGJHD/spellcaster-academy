import { create } from 'zustand';
import type { AreaId } from '../level/rail/railTypes';

export type GameMode = 'menu' | 'exploration' | 'combat' | 'dialogue' | 'paused' | 'results';

type PlayMode = Exclude<GameMode, 'menu' | 'paused'>;

interface GameState {
  readonly mode: GameMode;
  /** Mode to return to when the pause menu closes. */
  readonly modeBeforePause: PlayMode;
  readonly currentBeatId: string | null;
  readonly currentAreaId: AreaId | null;
  readonly routeComplete: boolean;
  /** Incremented whenever a fresh run starts, so the scene can rebuild its director. */
  readonly runId: number;

  startLevel(): void;
  pause(): void;
  resume(): void;
  quitToMenu(): void;
  enterBeat(beatId: string, areaId: AreaId): void;
  completeRoute(): void;
}

/** Coarse shared state only. Per-frame camera and combat values live in refs, not here. */
export const useGameStore = create<GameState>()((set, get) => ({
  mode: 'menu',
  modeBeforePause: 'exploration',
  currentBeatId: null,
  currentAreaId: null,
  routeComplete: false,
  runId: 0,

  startLevel: () =>
    set((s) => ({
      mode: 'exploration',
      currentBeatId: null,
      currentAreaId: null,
      routeComplete: false,
      runId: s.runId + 1,
    })),

  pause: () => {
    const { mode } = get();
    if (mode === 'menu' || mode === 'paused') return;
    set({ mode: 'paused', modeBeforePause: mode });
  },

  resume: () => {
    if (get().mode !== 'paused') return;
    set((s) => ({ mode: s.modeBeforePause }));
  },

  quitToMenu: () => set({ mode: 'menu', currentBeatId: null, currentAreaId: null }),

  enterBeat: (currentBeatId, currentAreaId) => set({ currentBeatId, currentAreaId }),

  completeRoute: () => set({ routeComplete: true }),
}));

export const isGameplayActive = (mode: GameMode): boolean => mode !== 'menu' && mode !== 'paused';
