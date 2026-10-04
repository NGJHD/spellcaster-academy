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
    mischief_sprite: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.22, height: 0.7 }, wordAnchor: [0, 0.95, 0], budget: 'enemy', height: [0.6, 0.85] },
    mossling: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.38, height: 0.92 }, wordAnchor: [0, 1.45, 0], budget: 'enemy', height: [0.85, 1.25] },
    paint_imp: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.25, height: 0.75 }, wordAnchor: [0, 1.25, 0], budget: 'enemy', height: [0.65, 0.95] },
    thorn_pod: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.45, height: 1.3 }, wordAnchor: [0, 1.7, 0], budget: 'enemy', height: [1.2, 1.6] },
    hollow_knight: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.45, height: 2.1 }, wordAnchor: [0, 2.6, 0], budget: 'enemy', height: [1.9, 2.4] },
    eraser_moth: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'sphere', radius: 0.5, height: 1 }, wordAnchor: [0, 1.4, 0], budget: 'enemy', height: [0.9, 1.3] },
    grey_herald: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.7, height: 3 }, wordAnchor: [0, 3.4, 0], budget: 'boss', height: [2.7, 3.3] },
    ink_wisp: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.25, height: 1.0 }, wordAnchor: [0, 1.35, 0], budget: 'enemy', height: [0.85, 1.25] },
    armour_guardian: { animations: ['Idle', 'Move', 'Attack', 'Hit', 'Dispel'], collision: { shape: 'capsule', radius: 0.45, height: 2.0 }, wordAnchor: [0, 2.35, 0], budget: 'hero', height: [1.8, 2.3] },
    ward_warden: { animations: [], collision: { shape: 'capsule', radius: 1.0, height: 3.6 }, wordAnchor: [0, 4.2, 0], budget: 'boss', height: [3.0, 4.0] },
  },
  characters: {
    mira: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.25, height: 1.45 }, wordAnchor: [0, 1.7, 0], budget: 'npc', height: [1.3, 1.6] },
    orin: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.3, height: 1.85 }, wordAnchor: [0, 2.1, 0], budget: 'npc', height: [1.7, 2.0] },
    student_a: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.25, height: 1.4 }, wordAnchor: [0, 1.65, 0], budget: 'npc', height: [1.25, 1.55] },
    student_b: { animations: ['Idle', 'Wave', 'TalkShort', 'Celebrate'], collision: { shape: 'capsule', radius: 0.25, height: 1.5 }, wordAnchor: [0, 1.75, 0], budget: 'npc', height: [1.35, 1.65] },
  },
  props_original: {
    fp_arm: { animations: [], nodes: ['Tip', 'Wand', 'Hand', 'Sleeve'], collision: { shape: 'none', radius: 0, height: 0 }, wordAnchor: [0, 0.6, 0], budget: 'fp', height: [0.1, 0.6] },
    pip: { animations: [], nodes: ['Core', 'Ring_0', 'Ring_1', 'Ring_2', 'Fin_L', 'Fin_R'], collision: { shape: 'sphere', radius: 0.12, height: 0.24 }, wordAnchor: [0, 0.35, 0], budget: 'prop', height: [0.2, 0.4] },
    training_dummy: { animations: [], nodes: ['Torso', 'Arm_L', 'Arm_R'], collision: { shape: 'capsule', radius: 0.3, height: 1.65 }, wordAnchor: [0, 2.0, 0], budget: 'prop', height: [1.5, 1.9] },
    runaway_book: { animations: [], nodes: ['Cover_L', 'Cover_R', 'Spine'], collision: { shape: 'box', radius: 0.25, height: 0.1 }, wordAnchor: [0, 0.45, 0], budget: 'prop', height: [0.05, 0.2] },
    thorn_pod: { animations: [], nodes: ['Head', 'Petal_0', 'Petal_6'], collision: { shape: 'capsule', radius: 0.3, height: 1.4 }, wordAnchor: [0, 1.7, 0], budget: 'prop', height: [1.2, 1.7] },
    ward_anchor: { animations: [], nodes: ['Ring_0', 'Ring_1', 'Ring_2', 'Node_0', 'Node_1', 'Node_2', 'Shard'], collision: { shape: 'cylinder', radius: 0.9, height: 1.8 }, wordAnchor: [0, 2.0, 0], budget: 'prop', height: [1.5, 1.95] },
    grimoire: { animations: [], nodes: ['Cover_L', 'Cover_R', 'Spine', 'Clasp_0', 'Clasp_1'], collision: { shape: 'box', radius: 0.7, height: 0.3 }, wordAnchor: [0, 0.6, 0], budget: 'prop', height: [0.15, 0.5] },
  },
};

/** §15 runtime budgets (LOD0 triangles). */
export const BUDGETS = { enemy: 35000, npc: 60000, hero: 40000, boss: 110000, prop: 30000, fp: 70000 };

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
      source: `assets-src/scripts/${folder === 'characters' ? 'characters/humanoid.py' : folder === 'props_original' ? 'props/hero_props.py' : `creatures/${id.replace(/_(grey|teal)$/, '')}.py`}`,
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
