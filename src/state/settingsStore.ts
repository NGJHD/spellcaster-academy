import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  SETTINGS_STORAGE_KEY,
  SETTINGS_VERSION,
  defaultSettings,
  sanitizeSettings,
  type Settings,
  type TravelSpeed,
} from './settings';

interface SettingsActions {
  setReducedMotion(value: boolean): void;
  setTravelSpeed(value: TravelSpeed): void;
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

export const useSettingsStore = create<Settings & SettingsActions>()(
  persist(
    (set) => ({
      ...defaultSettings(prefersReducedMotion),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setTravelSpeed: (travelSpeed) => set({ travelSpeed }),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: SETTINGS_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ reducedMotion, travelSpeed }): Settings => ({ reducedMotion, travelSpeed }),
      // Older or corrupt data is sanitised field by field rather than discarded wholesale.
      migrate: (persisted) => sanitizeSettings(persisted, defaultSettings(prefersReducedMotion)),
      merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted, current) }),
    },
  ),
);
