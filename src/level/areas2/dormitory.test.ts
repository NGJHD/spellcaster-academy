import { describe, expect, it } from 'vitest';
import { STAIRWELL_ORIGIN, stairFloor } from '../areas/stairwell';
import { closeInEncounter } from '../encounters/closeIn';
import { LEVELS } from '../levels';
import type { Vec3 } from '../rail/railTypes';

/** Top of the tread under an area angle: treads are every 6°, each at the ramp height of its middle. */
function treadTop(deg: number): number {
  return stairFloor(Math.round(deg / 6) * 6);
}

/** Area angle of a world point on the spiral, in the stairs' range (60° down to −290°). */
function angleOf(p: Vec3): number {
  const a = (Math.atan2(p[2] - STAIRWELL_ORIGIN[2], p[0] - STAIRWELL_ORIGIN[0]) * 180) / Math.PI;
  return a > 60 ? a - 360 : a;
}

describe('Dormitory Tower mobs (owner, 2026-10-23: "all above the stairs and not under it")', () => {
  const level = LEVELS['level-2'];
  for (const [index, node] of [[1, 'DORM_L1'], [2, 'DORM_L2'], [3, 'DORM_L3']] as const) {
    it(`landing ${index}: every path stays on or above the treads, close-in leg included`, () => {
      const def = level.encounters.get(`l2-dorm-${index}`);
      const cam = level.route.nodes[node]?.position;
      expect(def).toBeDefined();
      expect(cam).toBeDefined();
      if (!def || !cam) return;
      const fight = closeInEncounter(def, cam);
      let checked = 0;
      for (const wave of fight.waves) {
        for (const t of wave.targets) {
          const m = t.movement;
          if (!m || m.kind !== 'approach') continue;
          for (let i = 1; i < m.path.length; i++) {
            const a = m.path[i - 1];
            const b = m.path[i];
            if (!a || !b) continue;
            for (let k = 0; k <= 10; k++) {
              const u = k / 10;
              const p: Vec3 = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
              expect(p[1], `${t.id} segment ${i} at ${u}`).toBeGreaterThanOrEqual(treadTop(angleOf(p)) - 0.02);
              checked++;
            }
          }
        }
      }
      expect(checked).toBeGreaterThan(0);
    });
  }
});
