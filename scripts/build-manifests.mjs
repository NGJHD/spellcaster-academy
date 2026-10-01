/**
 * Writes public/assets/manifests/{creatures,characters}.json in the §14.7 manifest format, measuring
 * each GLB (triangles, materials, bounds, animations). Run after rebuilding assets:
 *   node scripts/build-manifests.mjs
 */
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { analyseGlb } from './glb.mjs';

const ROOT = join(import.meta.dirname, '..');

/** Authored gameplay data per asset (collision, word anchor, required clips, budget class). */
export const ASSETS = {
  creatures: {
    mischief_sprite: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.18, height: 0.55 }, wordAnchor: [0, 0.95, 0], budget: 'enemy', height: [0.45, 0.75] },
    mischief_sprite_grey: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.18, height: 0.55 }, wordAnchor: [0, 0.95, 0], budget: 'enemy', height: [0.45, 0.75] },
    mischief_sprite_teal: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.18, height: 0.55 }, wordAnchor: [0, 0.95, 0], budget: 'enemy', height: [0.45, 0.75] },
    mossling: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.38, height: 0.92 }, wordAnchor: [0, 1.45, 0], budget: 'enemy', height: [0.85, 1.25] },
    ink_wisp: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.25, height: 1.0 }, wordAnchor: [0, 1.35, 0], budget: 'enemy', height: [0.85, 1.25] },
    armour_guardian: { animations: [], collision: { shape: 'capsule', radius: 0.45, height: 2.0 }, wordAnchor: [0, 2.35, 0], budget: 'hero', height: [1.8, 2.3] },
    ward_warden: { animations: [], collision: { shape: 'capsule', radius: 1.0, height: 3.6 }, wordAnchor: [0, 4.2, 0], budget: 'boss', height: [3.0, 4.0] },
  },
  characters: {
    mira: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.25, height: 1.45 }, wordAnchor: [0, 1.7, 0], budget: 'npc', height: [1.3, 1.6] },
    orin: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.3, height: 1.85 }, wordAnchor: [0, 2.1, 0], budget: 'npc', height: [1.7, 2.0] },
    student_a: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.25, height: 1.4 }, wordAnchor: [0, 1.65, 0], budget: 'npc', height: [1.25, 1.55] },
    student_b: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.25, height: 1.5 }, wordAnchor: [0, 1.75, 0], budget: 'npc', height: [1.35, 1.65] },
  },
};

/** §15 runtime budgets (LOD0 triangles). */
export const BUDGETS = { enemy: 35000, npc: 60000, hero: 40000, boss: 110000, prop: 30000 };

export function buildManifest(folder) {
  const out = {};
  for (const [id, meta] of Object.entries(ASSETS[folder])) {
    const file = join(ROOT, 'public', 'assets', folder, `${id}.glb`);
    if (!existsSync(file)) continue;
    const a = analyseGlb(file);
    out[id] = {
      id,
      file: `/assets/${folder}/${id}.glb`,
      unitScaleMeters: 1,
      animations: a.animations.map((x) => x.name),
      collision: meta.collision,
      wordAnchor: meta.wordAnchor,
      lodFiles: [`/assets/${folder}/${id}.glb`],
      textureSet: 'vertex-colour + shared PBR',
      license: 'original-project-asset',
      triangles: a.triangles,
      materials: a.materials,
      bounds: a.bounds,
      bytes: statSync(file).size,
      source: `assets-src/scripts/${folder === 'characters' ? 'characters/humanoid.py' : `creatures/${id.replace(/_(grey|teal)$/, '')}.py`}`,
    };
  }
  return out;
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('build-manifests.mjs')) {
  for (const folder of Object.keys(ASSETS)) {
    const manifest = buildManifest(folder);
    writeFileSync(join(ROOT, 'public', 'assets', 'manifests', `${folder}.json`), JSON.stringify(manifest, null, 2));
    console.log(`${folder}: ${Object.keys(manifest).length} assets`);
  }
}
