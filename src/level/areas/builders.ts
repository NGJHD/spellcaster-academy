/** Small authoring helpers so area scripts read like a shot list. */
import type { WordCategory } from '../../content/wordLists';
import type { AreaId, CheckpointId } from '../../game/types';
import type {
  AttackSpec,
  BeatExtras,
  CheckpointBeat,
  DialogueBeat,
  EncounterBeat,
  LevelBeat,
  LevelCameraBeat,
  TargetSpawn,
  WordSpec,
} from '../levelTypes';
import type { EasingName, Vec3 } from '../rail/railTypes';

/** Offset helper: area-local coordinates → world coordinates. */
export const origin =
  (o: Vec3) =>
  (x: number, y: number, z: number): Vec3 => [o[0] + x, o[1] + y, o[2] + z];

export interface TravelOptions extends BeatExtras {
  readonly easing?: EasingName;
  readonly reducedMotion?: 'glide' | 'fade-cut';
}

export function travel(
  id: string,
  areaId: AreaId,
  nodes: readonly string[],
  durationSec: number,
  options: TravelOptions = {},
): LevelCameraBeat {
  const { easing = 'easeInOutSine', reducedMotion = 'fade-cut', ...extras } = options;
  return { kind: 'rail-travel', id, areaId, nodes, durationSec, easing, reducedMotion, ...extras };
}

export function reveal(
  id: string,
  areaId: AreaId,
  atNode: string,
  lookTargets: readonly string[],
  panSec: number,
  holdSec: number,
  extras: BeatExtras & { returnToNode?: boolean } = {},
): LevelCameraBeat {
  const { returnToNode = true, ...rest } = extras;
  return { kind: 'camera-reveal', id, areaId, atNode, lookTargets, panSec, holdSec, returnToNode, ...rest };
}

export function hold(id: string, areaId: AreaId, atNode: string, holdSec: number, extras: BeatExtras = {}): LevelCameraBeat {
  return { kind: 'camera-reveal', id, areaId, atNode, lookTargets: [], panSec: 0, holdSec, returnToNode: false, ...extras };
}

export function fade(
  id: string,
  areaId: AreaId,
  toNode: string,
  extras: BeatExtras & { fadeOutSec?: number; holdSec?: number; fadeInSec?: number } = {},
): LevelCameraBeat {
  const { fadeOutSec = 0.6, holdSec = 0.4, fadeInSec = 0.8, ...rest } = extras;
  return { kind: 'loading-transition', id, areaId, toNode, fadeOutSec, holdSec, fadeInSec, ...rest };
}

export function talk(id: string, areaId: AreaId, lines: readonly string[], extras: BeatExtras = {}): DialogueBeat {
  return { kind: 'dialogue', id, areaId, lines, ...extras };
}

export function fight(id: string, areaId: AreaId, extras: BeatExtras = {}): EncounterBeat {
  return { kind: 'encounter', id, areaId, encounterId: id, ...extras };
}

export function checkpoint(
  id: string,
  areaId: AreaId,
  checkpointId: CheckpointId,
  extras: BeatExtras = {},
): CheckpointBeat {
  return { kind: 'checkpoint', id, areaId, checkpointId, ...extras };
}

export type Beats = LevelBeat[];

// ---------- Target templates ----------

type TargetOptions = Partial<Omit<TargetSpawn, 'id' | 'kind' | 'position' | 'words'>>;

export function target(
  id: string,
  kind: TargetSpawn['kind'],
  position: Vec3,
  words: readonly WordSpec[],
  options: TargetOptions = {},
): TargetSpawn {
  return { id, kind, position, words, ...options };
}

/** A label-only target attached to a scene prop (crystal, rune, chest, vine knot). */
export function marker(id: string, position: Vec3, word: WordSpec, options: TargetOptions = {}): TargetSpawn {
  return target(id, 'marker', position, [word], { labelHeight: 0, ...options });
}

/** A generated word of Standard length `min`–`max` (shifted by difficulty). */
export const len = (min: number, max: number, category?: WordCategory): WordSpec =>
  category ? { min, max, category } : { min, max };

export const ATTACKS = {
  spritePounce: { kind: 'contact', windupSec: 1.0, recoverSec: 0.8, intervalSec: 1.2, damage: 8 },
  bookGust: { kind: 'ranged', windupSec: 1.2, recoverSec: 0.6, intervalSec: 6.5, damage: 6 },
  inkPulse: { kind: 'ranged', windupSec: 1.3, recoverSec: 0.7, intervalSec: 7, damage: 9 },
  thornSeed: { kind: 'ranged', windupSec: 1.6, recoverSec: 0.8, intervalSec: 6, damage: 10 },
  mosslingSwipe: { kind: 'contact', windupSec: 1.2, recoverSec: 1.0, intervalSec: 1.4, damage: 12 },
  guardianSweep: { kind: 'contact', windupSec: 1.8, recoverSec: 1.2, intervalSec: 5, damage: 14 },
  dummyArm: { kind: 'contact', windupSec: 1.1, recoverSec: 0.9, intervalSec: 1.6, damage: 5 },
} satisfies Record<string, AttackSpec>;

/**
 * Power-up wave (CLAUDE.md §1B "Unlock moments"): right after a new spell, a burst of easy, harmless
 * enemies with short words so the player feels the new power at once. Never damages.
 */
export function powerWave(
  id: string,
  areaId: AreaId,
  kind: TargetSpawn['kind'],
  waves: readonly (readonly { path: readonly Vec3[]; delaySec?: number; variant?: string }[])[],
  options: Partial<TargetSpawn> = {},
): import('../levelTypes').EncounterDef {
  return {
    id,
    areaId,
    kind: 'combat',
    waves: waves.map((wave, w) => ({
      id: `${id}-${w + 1}`,
      targets: wave.map((t, i) =>
        target(`${id}-${w + 1}-${i + 1}`, kind, t.path[0] ?? [0, 0, 0], [len(3, 3)], {
          movement: { kind: 'approach', path: t.path, speed: 1.4 },
          weak: true,
          delaySec: t.delaySec ?? i * 0.35,
          variant: t.variant,
          ...options,
        }),
      ),
    })),
  };
}

/** Everything one area contributes to the level. */
export interface AreaScript {
  readonly nodes: Readonly<Record<string, import('../rail/railTypes').CameraNode>>;
  readonly lookPoints: Readonly<Record<string, Vec3>>;
  readonly beats: readonly LevelBeat[];
  readonly encounters: readonly import('../levelTypes').EncounterDef[];
}
