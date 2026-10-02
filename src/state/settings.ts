/** Player settings: pure data and validation, independent of the store. */

export const SETTINGS_STORAGE_KEY = 'spellcaster-academy.settings';
export const SETTINGS_VERSION = 3;

export type TravelSpeed = 'slow' | 'normal' | 'fast';
export type FontSize = 'normal' | 'large' | 'extra-large';
export type Quality = 'low' | 'medium' | 'high';

export interface Volumes {
  readonly master: number;
  readonly music: number;
  readonly sfx: number;
  readonly ui: number;
  readonly voice: number;
}

export interface Settings {
  readonly reducedMotion: boolean;
  readonly reducedShake: boolean;
  readonly reducedEffects: boolean;
  readonly travelSpeed: TravelSpeed;
  readonly fontSize: FontSize;
  readonly highContrast: boolean;
  readonly dyslexiaFont: boolean;
  /** Read subtitles aloud with the browser's speech synthesis. */
  readonly spokenDialogue: boolean;
  readonly showWpm: boolean;
  readonly quality: Quality;
  readonly volumes: Volumes;
}

export const TRAVEL_SPEED_MULTIPLIER: Record<TravelSpeed, number> = {
  // Owner feedback (2026-10-02): the old "fast" is the new baseline; "fast" is quicker still.
  slow: 1,
  normal: 1.6,
  fast: 2.4,
};

export const FONT_SCALE: Record<FontSize, number> = {
  normal: 1,
  large: 1.2,
  'extra-large': 1.45,
};

export function defaultSettings(prefersReducedMotion = false): Settings {
  return {
    reducedMotion: prefersReducedMotion,
    reducedShake: prefersReducedMotion,
    reducedEffects: false,
    travelSpeed: 'normal',
    fontSize: 'normal',
    highContrast: false,
    dyslexiaFont: false,
    spokenDialogue: true,
    showWpm: false,
    // §15: start on Medium; the player can override.
    quality: 'medium',
    volumes: { master: 0.8, music: 0.6, sfx: 0.8, ui: 0.7, voice: 0.9 },
  };
}

const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const unit = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback;

/** Accepts anything read from storage and returns a complete, valid settings object. */
export function sanitizeSettings(raw: unknown, defaults: Settings = defaultSettings()): Settings {
  if (typeof raw !== 'object' || raw === null) return defaults;
  const r = raw as Record<string, unknown>;
  const v = (typeof r.volumes === 'object' && r.volumes !== null ? r.volumes : {}) as Record<string, unknown>;
  return {
    reducedMotion: bool(r.reducedMotion, defaults.reducedMotion),
    reducedShake: bool(r.reducedShake, defaults.reducedShake),
    reducedEffects: bool(r.reducedEffects, defaults.reducedEffects),
    travelSpeed: oneOf(r.travelSpeed, ['slow', 'normal', 'fast'], defaults.travelSpeed),
    fontSize: oneOf(r.fontSize, ['normal', 'large', 'extra-large'], defaults.fontSize),
    highContrast: bool(r.highContrast, defaults.highContrast),
    dyslexiaFont: bool(r.dyslexiaFont, defaults.dyslexiaFont),
    spokenDialogue: bool(r.spokenDialogue, defaults.spokenDialogue),
    showWpm: bool(r.showWpm, defaults.showWpm),
    quality: oneOf(r.quality, ['low', 'medium', 'high'], defaults.quality),
    volumes: {
      master: unit(v.master, defaults.volumes.master),
      music: unit(v.music, defaults.volumes.music),
      sfx: unit(v.sfx, defaults.volumes.sfx),
      ui: unit(v.ui, defaults.volumes.ui),
      voice: unit(v.voice, defaults.volumes.voice),
    },
  };
}
