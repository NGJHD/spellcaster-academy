/** Player settings: pure data and validation, independent of the store. */

export const SETTINGS_STORAGE_KEY = 'spellcaster-academy.settings';
export const SETTINGS_VERSION = 1;

export type TravelSpeed = 'slow' | 'normal' | 'fast';

export interface Settings {
  readonly reducedMotion: boolean;
  readonly travelSpeed: TravelSpeed;
}

export const TRAVEL_SPEED_MULTIPLIER: Record<TravelSpeed, number> = {
  slow: 0.75,
  normal: 1,
  fast: 1.3,
};

export function defaultSettings(prefersReducedMotion = false): Settings {
  return { reducedMotion: prefersReducedMotion, travelSpeed: 'normal' };
}

const isTravelSpeed = (v: unknown): v is TravelSpeed => v === 'slow' || v === 'normal' || v === 'fast';

/** Accepts anything read from storage and returns a complete, valid settings object. */
export function sanitizeSettings(raw: unknown, defaults: Settings = defaultSettings()): Settings {
  if (typeof raw !== 'object' || raw === null) return defaults;
  const r = raw as Record<string, unknown>;
  return {
    reducedMotion: typeof r.reducedMotion === 'boolean' ? r.reducedMotion : defaults.reducedMotion,
    travelSpeed: isTravelSpeed(r.travelSpeed) ? r.travelSpeed : defaults.travelSpeed,
  };
}
