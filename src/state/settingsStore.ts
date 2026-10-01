import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { SETTINGS_STORAGE_KEY, SETTINGS_VERSION, defaultSettings, sanitizeSettings, type Settings } from './settings';

interface SettingsActions {
  update(patch: Partial<Settings>): void;
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

const pick = (s: Settings): Settings => sanitizeSettings(s);

export const useSettingsStore = create<Settings & SettingsActions>()(
  persist<Settings & SettingsActions, [], [], Settings>(
    (set) => ({
      ...defaultSettings(prefersReducedMotion),
      update: (patch) => set(patch),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      version: SETTINGS_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: pick,
      // Older or corrupt data is sanitised field by field rather than discarded wholesale.
      migrate: (persisted) => sanitizeSettings(persisted, defaultSettings(prefersReducedMotion)),
      merge: (persisted, current) => ({ ...current, ...sanitizeSettings(persisted, current) }),
    },
  ),
);

export function getSettings(): Settings {
  return useSettingsStore.getState();
}
