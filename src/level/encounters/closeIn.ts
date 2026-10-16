/**
 * Melee mobs close in (owner, 2026-10-16: "the mobs are not moving towards you … they are just
 * standing there"). Authored approach paths often stop five or six metres short of the camera, so a
 * contact attack landed from across the room. In a fight, each walking melee mob's path gains a last
 * leg that brings it to within arm's reach of the camera, on its own side, before it strikes.
 */
import type { EncounterDef, TargetSpawn } from '../levelTypes';
import type { Vec3 } from '../rail/railTypes';

/** How close (metres, along the ground) a melee mob comes before attacking. */
export const MELEE_REACH = 2.6;

export function closeInSpawn(t: TargetSpawn, camera: Vec3, reach = MELEE_REACH): TargetSpawn {
  const m = t.movement;
  if (!m || m.kind !== 'approach' || t.attack?.kind !== 'contact' || t.kind === 'fireball' || t.counter || t.follow) return t;
  const end = m.path[m.path.length - 1];
  if (!end) return t;
  const dx = end[0] - camera[0];
  const dz = end[2] - camera[2];
  const d = Math.hypot(dx, dz);
  if (d <= reach + 0.5) return t;
  const near: Vec3 = [camera[0] + (dx / d) * reach, end[1], camera[2] + (dz / d) * reach];
  return { ...t, movement: { ...m, path: [...m.path, near] } };
}

export function closeInEncounter(def: EncounterDef, camera: Vec3, reach = MELEE_REACH): EncounterDef {
  if (def.kind !== 'combat') return def;
  return { ...def, waves: def.waves.map((w) => ({ ...w, targets: w.targets.map((t) => closeInSpawn(t, camera, reach)) })) };
}
