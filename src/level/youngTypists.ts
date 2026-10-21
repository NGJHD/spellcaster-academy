/**
 * Word budget for young typists (owner, 2026-10-06): "too many words… my son types at 12 words per
 * minute. Just 1 wave will do, and maybe 2 mobs in the wave."
 *
 * Applied to every level's authored encounters when the level is assembled, so the area scripts stay
 * readable while the game asks for about half as many words:
 * - Ordinary fights: one wave of monsters, at most 2 (different kinds where possible); story steps
 *   after the monsters (restore a door, pull a lever) are kept as their own short waves.
 * - Boss phases: at most 2 rounds of at most 2 targets each; finishing sentences are kept whole.
 * - Word sequences (path words, levers, flights, masts): at most 2 words; anchors and beacons 3.
 * - Armoured enemies: at most 2 words. Power-up waves: 3 easy monsters (enough to feel the spell).
 * Encounters with special rules (streak/qualify tutorials) and listed tutorials are left as authored.
 */
import type { EncounterDef, LevelBeat, TargetSpawn, Wave } from './levelTypes';

const MOBS_PER_FIGHT = 2;
const POWER_WAVE_MOBS = 3;
/** Word sequences (path words, levers, flights, masts). */
const SEQUENCE_WORDS = 2;
/** Anchors and beacons: the story counts these words out ("three words to ring the bell"). */
const ANCHOR_WORDS = 3;
const ARMOUR_WORDS = 2;
const BOSS_ROUNDS = 2;
const BOSS_TARGETS_PER_ROUND = 2;
const CHASE_PER_BEAT = 2;

/** Teaching moments that must keep their authored shape. */
// Kept whole: the fireball tutorial, and Pip's three rings ("Brave, curious, kind: say them!").
const KEEP_AS_AUTHORED = new Set(['l2-fireballs', 'l3-u3']);

const NON_MOB = new Set(['marker', 'gem', 'journal-page']);

const isMob = (t: TargetSpawn) => !NON_MOB.has(t.kind);
/** Targets that unlock a cosmetic (the Inkwell trail's shelves): never trimmed away. */
const givesCosmetic = (t: TargetSpawn) => t.reward?.cosmetic !== undefined;
const isPowerWave = (id: string) => /-power$|power-wave|starfall-wave|quill-wave/.test(id);

const isAnchor = (id: string) => /anchor|beacon/.test(id);

/**
 * Keeps the first `n` targets; the flags of the dropped ones move onto the last kept target, so every
 * piece of scenery they would have revealed (stones, stairs, planks) still appears.
 */
function keepFirst(targets: readonly TargetSpawn[], n: number): TargetSpawn[] {
  if (targets.length <= n) return [...targets];
  // Cosmetic rewards are never trimmed.
  const kept = targets.filter((t, i) => i < n || givesCosmetic(t));
  const dropped = targets.filter((t) => !kept.includes(t)).flatMap((t) => [t.defeatFlag, ...(t.alsoFlags ?? [])]).filter((f): f is string => !!f);
  const last = kept[kept.length - 1];
  if (last && dropped.length > 0) kept[kept.length - 1] = { ...last, alsoFlags: [...(last.alsoFlags ?? []), ...dropped] };
  return kept;
}

/** At most `n` words, unless the target is a sentence (phrase) or a shielded creature (shield + binding). */
function capWords(t: TargetSpawn, n: number): TargetSpawn {
  if (t.phrase || t.shield || t.words.length <= n) return t;
  return { ...t, words: t.words.slice(0, n) };
}

/** Picks up to `n` monsters, preferring a mix of kinds, in authored order. */
function pickMobs(mobs: readonly TargetSpawn[], n: number): TargetSpawn[] {
  const chosen: TargetSpawn[] = [];
  for (const t of mobs) {
    if (chosen.length >= n) break;
    if (!chosen.some((c) => c.kind === t.kind)) chosen.push(t);
  }
  for (const t of mobs) {
    if (chosen.length >= n) break;
    if (!chosen.includes(t)) chosen.push(t);
  }
  // A short, readable stagger: the second arrives just after the first.
  return chosen.map((t, i) => ({ ...t, delaySec: Math.min(t.delaySec ?? 0, i * 0.8) }));
}

function simplifyFight(def: EncounterDef): EncounterDef {
  const all = def.waves.flatMap((w) => w.targets);
  const mobs = all.filter((t) => isMob(t) && !t.optional && !t.challengeOnly);
  const keepOptional = all.filter((t) => t.optional && givesCosmetic(t));
  const limit = isPowerWave(def.id) ? POWER_WAVE_MOBS : MOBS_PER_FIGHT;
  const fight: Wave = {
    id: def.waves[0]?.id ?? 'fight',
    // A one-at-a-time teaching wave stays one-at-a-time.
    ...(def.waves[0]?.sequential ? { sequential: true } : {}),
    targets: [...pickMobs(mobs, limit).map((t) => capWords(t, ARMOUR_WORDS)), ...keepOptional],
  };
  // Story steps that are not monsters (restore a door, ring the bell…) keep their own waves, trimmed.
  const steps: Wave[] = def.waves
    .map((w) => ({ ...w, targets: w.targets.filter((t) => !isMob(t) && !t.optional && !t.challengeOnly) }))
    .filter((w) => w.targets.length > 0)
    .map((w) => ({ ...w, targets: keepFirst(w.targets, isAnchor(def.id) ? ANCHOR_WORDS : SEQUENCE_WORDS).map((t) => capWords(t, 1)) }));
  const waves = (fight.targets.length > 0 ? [fight] : []).concat(steps);
  // Remarks tied to later waves now play as the single fight starts.
  const barks = def.barks?.map((b) => (b.when.on === 'wave-start' ? { ...b, when: { on: 'wave-start' as const, wave: 0 } } : b));
  return { ...def, waves, ...(barks ? { barks } : {}) };
}

function simplifyBoss(def: EncounterDef): EncounterDef {
  const rounds = def.waves.length <= BOSS_ROUNDS ? def.waves : [def.waves[0], def.waves[def.waves.length - 1]].filter((w): w is Wave => !!w);
  const waves = rounds.map((w) => {
    const required = w.targets.filter((t) => !t.optional && !t.challengeOnly);
    const kept = w.sequential ? required.slice(0, BOSS_TARGETS_PER_ROUND) : pickMobs(required, BOSS_TARGETS_PER_ROUND);
    return { ...w, targets: kept.map((t) => capWords(t, ARMOUR_WORDS)) };
  });
  return { ...def, waves };
}

function simplifySequence(def: EncounterDef): EncounterDef {
  return {
    ...def,
    waves: def.waves.map((w) => ({
      ...w,
      targets: keepFirst(
        w.targets.filter((t) => !t.optional || givesCosmetic(t)),
        isAnchor(def.id) ? ANCHOR_WORDS : SEQUENCE_WORDS,
      ).map((t) => capWords(t, isAnchor(def.id) ? ARMOUR_WORDS : 1)),
    })),
  };
}

export function forYoungTypists(def: EncounterDef): EncounterDef {
  if (KEEP_AS_AUTHORED.has(def.id) || def.waves.some((w) => w.rule)) return def;
  if (def.bossPhase) return simplifyBoss(def);
  const hasMobs = def.waves.some((w) => w.targets.some((t) => isMob(t) && !t.optional));
  if (hasMobs) return simplifyFight(def);
  return simplifySequence(def);
}

/** Chase words along the rails: at most two per stretch. */
export function trimChase(beat: LevelBeat): LevelBeat {
  if (!('chase' in beat) || !beat.chase || beat.chase.length <= CHASE_PER_BEAT) return beat;
  const chase = beat.chase.slice(0, CHASE_PER_BEAT);
  return { ...beat, chase };
}
