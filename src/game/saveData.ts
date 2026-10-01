/**
 * Versioned save data (LD-6). The autosave stores a stable resume beat — never live simulation state.
 * Writes go to a temporary key, are validated, then promoted; the previous valid save is kept as backup.
 */
import { cloneMetrics, emptyMetrics, type PersistedRunMetrics } from '../typing/TypingMetrics';
import type { AnchorId, AreaId, CheckpointId, CosmeticId, Difficulty, SpellId, StarPageId } from './types';
import { AREA_ORDER } from './types';

export const SAVE_SCHEMA_VERSION = 1;
export const AUTOSAVE_KEY = 'spellcaster-academy.autosave';
export const AUTOSAVE_TEMP_KEY = 'spellcaster-academy.autosave.tmp';
export const AUTOSAVE_BACKUP_KEY = 'spellcaster-academy.autosave.backup';
export const PROFILE_KEY = 'spellcaster-academy.profile';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface Level1Autosave {
  schemaVersion: number;
  runId: string;
  status: 'in-progress' | 'complete';
  resumeBeatId: string;
  /** Wave to restart from when the resume beat is an encounter. */
  resumeWaveIndex: number;
  checkpointId: CheckpointId | null;
  areaId: AreaId;
  difficulty: Difficulty;
  assist: boolean;
  restoredAnchors: AnchorId[];
  completedEncounterIds: string[];
  completedBossPhases: string[];
  collectedStarPageIds: StarPageId[];
  unlockedCosmeticIds: CosmeticId[];
  unlockedSpells: SpellId[];
  flags: string[];
  /** Score multiplier waiting for the next combat encounter (constellation bonus). */
  pendingScoreMultiplier: number;
  metrics: PersistedRunMetrics;
  settingsSnapshotVersion: number;
  savedAtIso: string;
}

export interface BestResults {
  bestAverageWpm: number;
  bestAccuracy: number;
  bestStreak: number;
  fastestLevelMs: number | null;
  mostStarPages: number;
  bestScore: number;
}

export interface Profile {
  schemaVersion: number;
  levelCompleted: boolean;
  bestResults: BestResults | null;
  /** Cosmetics are kept across runs once earned. */
  cosmetics: CosmeticId[];
  selectedTrail: CosmeticId | null;
  tutorialSeen: boolean;
}

export function defaultProfile(): Profile {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    levelCompleted: false,
    bestResults: null,
    cosmetics: [],
    selectedTrail: null,
    tutorialSeen: false,
  };
}

export function newAutosave(runId: string, difficulty: Difficulty, firstBeatId: string): Level1Autosave {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    runId,
    status: 'in-progress',
    resumeBeatId: firstBeatId,
    resumeWaveIndex: 0,
    checkpointId: null,
    areaId: 'arrival-gate',
    difficulty,
    assist: false,
    restoredAnchors: [],
    completedEncounterIds: [],
    completedBossPhases: [],
    collectedStarPageIds: [],
    unlockedCosmeticIds: [],
    unlockedSpells: [],
    flags: [],
    pendingScoreMultiplier: 1,
    metrics: emptyMetrics(),
    settingsSnapshotVersion: 1,
    savedAtIso: new Date(0).toISOString(),
  };
}

// ---------- Validation ----------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const DIFFICULTIES: readonly Difficulty[] = ['gentle', 'standard', 'challenge'];

function validateMetrics(raw: unknown): PersistedRunMetrics {
  const base = emptyMetrics();
  if (!isObj(raw)) return base;
  const out = cloneMetrics(base);
  for (const key of Object.keys(base) as (keyof PersistedRunMetrics)[]) {
    const value = raw[key];
    if (typeof base[key] === 'number') (out as unknown as Record<string, number>)[key] = num(value, base[key] as number);
  }
  if (Array.isArray(raw.words)) {
    out.words = raw.words.filter(
      (w): w is PersistedRunMetrics['words'][number] =>
        isObj(w) && typeof w.word === 'string' && typeof w.activeMs === 'number' && typeof w.areaId === 'string',
    );
  }
  if (isObj(raw.areas)) {
    for (const [k, v] of Object.entries(raw.areas)) {
      if (isObj(v) && (AREA_ORDER as readonly string[]).includes(k)) {
        out.areas[k as AreaId] = {
          correctEntries: num(v.correctEntries, 0),
          incorrectEntries: num(v.incorrectEntries, 0),
          wpmChars: num(v.wpmChars, 0),
          activeMs: num(v.activeMs, 0),
        };
      }
    }
  }
  return out;
}

/**
 * Returns a valid save or null. Older schema versions are migrated here;
 * anything unrecognisable is rejected rather than half-loaded.
 */
export function validateAutosave(raw: unknown, knownBeat: (id: string) => boolean): Level1Autosave | null {
  if (!isObj(raw)) return null;
  const version = num(raw.schemaVersion, 0);
  if (version < 1 || version > SAVE_SCHEMA_VERSION) return null;
  if (typeof raw.runId !== 'string' || typeof raw.resumeBeatId !== 'string') return null;
  if (!knownBeat(raw.resumeBeatId)) return null;
  const status = raw.status === 'complete' ? 'complete' : raw.status === 'in-progress' ? 'in-progress' : null;
  if (!status) return null;
  const areaId = (AREA_ORDER as readonly string[]).includes(raw.areaId as string) ? (raw.areaId as AreaId) : null;
  if (!areaId) return null;
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    runId: raw.runId,
    status,
    resumeBeatId: raw.resumeBeatId,
    resumeWaveIndex: Math.max(0, Math.floor(num(raw.resumeWaveIndex, 0))),
    checkpointId: typeof raw.checkpointId === 'string' ? (raw.checkpointId as CheckpointId) : null,
    areaId,
    difficulty: DIFFICULTIES.includes(raw.difficulty as Difficulty) ? (raw.difficulty as Difficulty) : 'standard',
    assist: raw.assist === true,
    restoredAnchors: strArray(raw.restoredAnchors) as AnchorId[],
    completedEncounterIds: strArray(raw.completedEncounterIds),
    completedBossPhases: strArray(raw.completedBossPhases),
    collectedStarPageIds: strArray(raw.collectedStarPageIds) as StarPageId[],
    unlockedCosmeticIds: strArray(raw.unlockedCosmeticIds) as CosmeticId[],
    unlockedSpells: strArray(raw.unlockedSpells) as SpellId[],
    flags: strArray(raw.flags),
    pendingScoreMultiplier: num(raw.pendingScoreMultiplier, 1),
    metrics: validateMetrics(raw.metrics),
    settingsSnapshotVersion: num(raw.settingsSnapshotVersion, 1),
    savedAtIso: typeof raw.savedAtIso === 'string' ? raw.savedAtIso : new Date(0).toISOString(),
  };
}

function parse(storage: KeyValueStorage, key: string): unknown {
  try {
    const text = storage.getItem(key);
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

/** Temp write → validate → promote; the previous active save becomes the backup. */
export function writeAutosave(storage: KeyValueStorage, save: Level1Autosave, knownBeat: (id: string) => boolean): boolean {
  try {
    const text = JSON.stringify(save);
    storage.setItem(AUTOSAVE_TEMP_KEY, text);
    const check = validateAutosave(parse(storage, AUTOSAVE_TEMP_KEY), knownBeat);
    if (!check) return false;
    const previous = storage.getItem(AUTOSAVE_KEY);
    if (previous && validateAutosave(parse(storage, AUTOSAVE_KEY), knownBeat)) {
      storage.setItem(AUTOSAVE_BACKUP_KEY, previous);
    }
    storage.setItem(AUTOSAVE_KEY, text);
    storage.removeItem(AUTOSAVE_TEMP_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Active save if valid, otherwise the backup, otherwise null. */
export function readAutosave(storage: KeyValueStorage, knownBeat: (id: string) => boolean): Level1Autosave | null {
  return (
    validateAutosave(parse(storage, AUTOSAVE_KEY), knownBeat) ??
    validateAutosave(parse(storage, AUTOSAVE_BACKUP_KEY), knownBeat)
  );
}

export function clearAutosave(storage: KeyValueStorage): void {
  storage.removeItem(AUTOSAVE_KEY);
  storage.removeItem(AUTOSAVE_TEMP_KEY);
  storage.removeItem(AUTOSAVE_BACKUP_KEY);
}

export function readProfile(storage: KeyValueStorage): Profile {
  const raw = parse(storage, PROFILE_KEY);
  const base = defaultProfile();
  if (!isObj(raw)) return base;
  const best = isObj(raw.bestResults) ? raw.bestResults : null;
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    levelCompleted: raw.levelCompleted === true,
    bestResults: best
      ? {
          bestAverageWpm: num(best.bestAverageWpm, 0),
          bestAccuracy: num(best.bestAccuracy, 0),
          bestStreak: num(best.bestStreak, 0),
          fastestLevelMs: typeof best.fastestLevelMs === 'number' ? best.fastestLevelMs : null,
          mostStarPages: num(best.mostStarPages, 0),
          bestScore: num(best.bestScore, 0),
        }
      : null,
    cosmetics: strArray(raw.cosmetics) as CosmeticId[],
    selectedTrail: typeof raw.selectedTrail === 'string' ? (raw.selectedTrail as CosmeticId) : null,
    tutorialSeen: raw.tutorialSeen === true,
  };
}

export function writeProfile(storage: KeyValueStorage, profile: Profile): void {
  try {
    storage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Storage full or blocked: progress continues in memory.
  }
}

export function mergeBestResults(previous: BestResults | null, next: BestResults): BestResults {
  if (!previous) return next;
  return {
    bestAverageWpm: Math.max(previous.bestAverageWpm, next.bestAverageWpm),
    bestAccuracy: Math.max(previous.bestAccuracy, next.bestAccuracy),
    bestStreak: Math.max(previous.bestStreak, next.bestStreak),
    fastestLevelMs:
      previous.fastestLevelMs === null
        ? next.fastestLevelMs
        : next.fastestLevelMs === null
          ? previous.fastestLevelMs
          : Math.min(previous.fastestLevelMs, next.fastestLevelMs),
    mostStarPages: Math.max(previous.mostStarPages, next.mostStarPages),
    bestScore: Math.max(previous.bestScore, next.bestScore),
  };
}

/** Browser localStorage, or an in-memory fallback when storage is blocked. */
export function browserStorage(): KeyValueStorage {
  try {
    const probe = '__spellcaster_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    const memory = new Map<string, string>();
    return {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    };
  }
}
