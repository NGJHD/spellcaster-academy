/**
 * Downloads the CC0 assets used by the game from Poly Haven (https://polyhaven.com, CC0 1.0).
 * Sources are recorded in assets-src/cc0/sources.json. Re-running skips files already present.
 *   node scripts/fetch-cc0.mjs
 * Models are then repacked to compact GLBs by Blender:
 *   blender --background --python assets-src/scripts/repack_cc0.py
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CC0 = join(ROOT, 'assets-src', 'cc0');

export const MANIFEST = {
  hdris: [
    'kloofendal_48d_partly_cloudy_puresky',
    'belfast_sunset_puresky',
    'kloppenheim_02_puresky',
    'afrikaans_church_interior',
    'abandoned_greenhouse',
  ],
  textures: [
    'large_sandstone_blocks_01',
    'sandstone_blocks_08',
    'patterned_paving',
    'monastery_stone_floor',
    'wood_floor_worn',
    'dark_wooden_planks',
    'fine_grained_wood',
    'plastered_wall_04',
    'roof_slates_02',
    'leafy_grass',
    'farm_soil',
    'marble_01',
    'brown_leather',
    'mossy_rock',
    // Realism pass 2 (2026-10-02): small props, upholstery, panelling and armour.
    'leather_red_02',
    'velour_velvet',
    'quatrefoil_jacquard_fabric',
    'dark_paneled_wood',
    'metal_plate',
    'herringbone_parquet',
    'rough_linen',
    'lacquered_cherry_wood',
    'castle_brick_07',
    'worn_planks',
    'leather_white',
  ],
  models: [
    'island_tree_01',
    'island_tree_02',
    'jacaranda_tree',
    'fir_tree_01',
    'shrub_01',
    'shrub_02',
    'shrub_03',
    'shrub_04',
    'fern_02',
    'flower_gazania',
    'flower_ursinia',
    'potted_plant_01',
    'potted_plant_02',
    'potted_plant_04',
    'planter_pot_clay',
    'nettle_plant',
    'periwinkle_plant',
    'wild_rooibos_bush',
    'rock_moss_set_01',
    'painted_wooden_bench',
    'street_lamp_01',
    'treasure_chest',
    'Lantern_01',
    'wooden_lantern_01',
    'lantern_chandelier_01',
    'vintage_oil_lamp',
    'brass_candleholders',
    'wooden_bookshelf_worn',
    'book_encyclopedia_set_01',
    'decorative_book_set_01',
    'WoodenTable_01',
    'WoodenChair_01',
    'GothicCabinet_01',
    'vintage_grandfather_clock_01',
    'mantel_clock_01',
    'fancy_picture_frame_01',
    'fancy_picture_frame_02',
    'hanging_picture_frame_02',
    'gothic_statue',
    'large_castle_door',
    'wooden_barrels_01',
    // Realism pass 2: dressing props.
    'Chandelier_01',
    'seadogs_compass',
    'vintage_microscope',
    'wooden_ladder',
    'watering_can_metal_01',
    'seeding_tray_01',
    'trowel_01',
    'wicker_basket_01',
    'planter_box_01',
    'ornate_mirror_01',
    'marble_bust_01',
    'wooden_candlestick',
    'brass_vase_01',
    'ceramic_vase_02',
    'magnifying_glass_01',
    'tea_set_01',
    'ArmChair_01',
    'gothic_coffee_table',
    'anthurium_botany_01',
    'calathea_orbifolia_01',
    'pachira_aquatica_01',
    'wooden_crate_01',
    'hanging_picture_frame_01',
    'Ottoman_01',
    'vintage_cabinet_01',
    'standing_picture_frame_01',
    'wooden_display_shelves_01',
    'horse_statue_01',
  ],
};

const API = 'https://api.polyhaven.com/files/';

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (res.ok) return await res.json();
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  throw new Error(`Failed: ${url}`);
}

async function download(url, path) {
  if (existsSync(path)) return 'cached';
  mkdirSync(dirname(path), { recursive: true });
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(120000) });
      if (res.ok) {
        writeFileSync(path, Buffer.from(await res.arrayBuffer()));
        return 'ok';
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  throw new Error(`Download failed: ${url}`);
}

async function pool(items, size, fn) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await fn(item);
    }),
  );
}

const sources = [];

async function fetchHdri(id) {
  const files = await getJson(API + id);
  const file = files.hdri['1k'].hdr;
  await download(file.url, join(ROOT, 'public', 'assets', 'hdri', `${id}_1k.hdr`));
  sources.push({ id, type: 'hdri', url: `https://polyhaven.com/a/${id}`, license: 'CC0-1.0' });
  console.log('hdri', id);
}

async function fetchTexture(id) {
  const files = await getJson(API + id);
  // Some sets ship colour variants (coll1/coll2) instead of a single Diffuse map.
  const maps = { diff: files.Diffuse ?? files.coll1, nor: files.nor_gl, arm: files.arm };
  for (const [key, entry] of Object.entries(maps)) {
    const file = entry['1k'].jpg;
    await download(file.url, join(ROOT, 'public', 'assets', 'textures', id, `${key}.jpg`));
  }
  sources.push({ id, type: 'texture', url: `https://polyhaven.com/a/${id}`, license: 'CC0-1.0' });
  console.log('texture', id);
}

async function fetchModel(id) {
  const files = await getJson(API + id);
  const gltf = files.gltf?.['1k']?.gltf;
  if (!gltf) {
    console.warn('skipped (no glTF download):', id);
    return;
  }
  const dir = join(CC0, 'models', id);
  await download(gltf.url, join(dir, `${id}.gltf`));
  for (const [rel, file] of Object.entries(gltf.include ?? {})) await download(file.url, join(dir, rel));
  sources.push({ id, type: 'model', url: `https://polyhaven.com/a/${id}`, license: 'CC0-1.0' });
  console.log('model', id);
}

await pool(MANIFEST.hdris, 3, fetchHdri);
await pool(MANIFEST.textures, 4, fetchTexture);
await pool(MANIFEST.models, 4, fetchModel);
mkdirSync(CC0, { recursive: true });
sources.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
writeFileSync(
  join(CC0, 'sources.json'),
  JSON.stringify({ provider: 'Poly Haven', license: 'CC0 1.0 Universal', assets: sources }, null, 2),
);
console.log(`Done: ${sources.length} assets`);
