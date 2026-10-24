/**
 * Photo-scanned PBR surfaces (CC0, Poly Haven) applied to the shared materials, plus geometry
 * helpers whose UVs are in metres so a texture keeps its real-world scale on any size of surface.
 * The `arm` map packs AO (R), roughness (G) and metalness (B) — exactly three.js's channel layout.
 */
import {
  BoxGeometry,
  BufferAttribute,
  CircleGeometry,
  CylinderGeometry,
  LinearSRGBColorSpace,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  TextureLoader,
  Vector2,
  type BufferGeometry,
  type MeshStandardMaterial,
  type Texture,
} from 'three';
import { MAT } from './materials';

interface SurfaceSpec {
  readonly texture: string;
  /** Real-world size covered by one texture tile, in metres. */
  readonly tileMetres: number;
  readonly normalScale?: number;
  /** Multiplies the albedo map (keeps the academy's warm palette consistent). */
  readonly tint?: string;
  /** Brightness multiplier on top of the tint (for neutral maps coloured by vertex colour). */
  readonly gain?: number;
  /** Texture filtering sharpness at grazing angles (8 by default); lower blurs fine detail that shimmers. */
  readonly anisotropy?: number;
}

/** Which CC0 set dresses which shared material (material library). */
export const SURFACES: Partial<Record<keyof typeof MAT, SurfaceSpec>> = {
  academyStone: { texture: 'large_sandstone_blocks_01', tileMetres: 4.5, tint: '#f5e6cc', normalScale: 0.6 },
  academyStoneDark: { texture: 'sandstone_blocks_08', tileMetres: 3, tint: '#dccaa8', normalScale: 0.7 },
  paving: { texture: 'monastery_stone_floor', tileMetres: 3.5, tint: '#f0e4d0' },
  wardStone: { texture: 'marble_01', tileMetres: 2, tint: '#f4f0e6' },
  marble: { texture: 'marble_01', tileMetres: 3 },
  lightOak: { texture: 'wood_floor_worn', tileMetres: 2 },
  darkOak: { texture: 'dark_wooden_planks', tileMetres: 2, tint: '#b49a88' },
  plaster: { texture: 'plastered_wall_04', tileMetres: 3, tint: '#fff1dc' },
  slate: { texture: 'roof_slates_02', tileMetres: 2.5, tint: '#6f7886' },
  // Meadows painted by Flux (ground_textures.py; owner, 2026-10-24: the old grass looked like Minecraft):
  // lush grass for lawns and fields, and a drier, wilder one for Level 2's far bank.
  grass: { texture: 'green_meadow', tileMetres: 7, tint: '#e8f2dc', normalScale: 1.1 },
  dryMeadow: { texture: 'wild_meadow', tileMetres: 6, normalScale: 1.2 },
  soil: { texture: 'farm_soil', tileMetres: 2 },
  burgundyLeather: { texture: 'brown_leather', tileMetres: 0.6, tint: '#c25a5a' },
  greenLeather: { texture: 'brown_leather', tileMetres: 0.6, tint: '#5f9a78' },
  blueLeather: { texture: 'brown_leather', tileMetres: 0.6, tint: '#6f8ac8' },
  bark: { texture: 'fine_grained_wood', tileMetres: 1 },
  moss: { texture: 'mossy_rock', tileMetres: 1.2, tint: '#cfe0a0' },
  bookLeather: { texture: 'leather_white', tileMetres: 0.35, normalScale: 0.8, gain: 1.7 },
  velvet: { texture: 'velour_velvet', tileMetres: 0.5, tint: '#80909c' },
  carpet: { texture: 'quatrefoil_jacquard_fabric', tileMetres: 1.4, tint: '#9a8078' },
  jacquard: { texture: 'quatrefoil_jacquard_fabric', tileMetres: 0.6 },
  panelWood: { texture: 'dark_paneled_wood', tileMetres: 2, tint: '#d8c0a8' },
  linen: { texture: 'rough_linen', tileMetres: 0.6, tint: '#f2e8d8' },
  navyCloth: { texture: 'rough_linen', tileMetres: 0.6, tint: '#4a5f90' },
  // Softened (ground_textures.py burned_ground_soft): the photo's fine needles shimmered as the camera moved.
  burntGround: { texture: 'burned_ground_soft', tileMetres: 4, tint: '#c8b0a4', anisotropy: 2 },
  crackedRedGround: { texture: 'cracked_red_ground', tileMetres: 3, tint: '#e0b0a0' },
  rockGround: { texture: 'rock_ground_02', tileMetres: 3, tint: '#b8aca8' },
  earth: { texture: 'farm_soil', tileMetres: 3, tint: '#e8c8a0' },
  volcanicStone: { texture: 'volcanic_rock_tiles', tileMetres: 2.5, tint: '#8a8088', normalScale: 1.2 },
  ironPlate: { texture: 'metal_plate', tileMetres: 2, tint: '#5a5a62' },
  weatheredBrass: { texture: 'rusty_metal_03', tileMetres: 0.8, tint: '#ffe2a8', normalScale: 1.4 },
  scorchedIron: { texture: 'rust_coarse_01', tileMetres: 1, tint: '#7a6458', normalScale: 1.6 },
};

const loader = new TextureLoader();
const cache = new Map<string, Texture>();

function load(path: string, srgb: boolean, repeat: number, anisotropy = 8): Texture {
  const key = `${path}|${repeat}|${anisotropy}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const tex = loader.load(path);
  tex.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = anisotropy;
  cache.set(key, tex);
  return tex;
}

let applied = false;

/** Attach PBR texture sets to the shared materials once. Safe to call repeatedly. */
export function applySurfaceTextures(): void {
  if (applied) return;
  applied = true;
  const base = `${import.meta.env.BASE_URL}assets/textures/`;
  for (const [key, spec] of Object.entries(SURFACES) as [keyof typeof MAT, SurfaceSpec][]) {
    const material = MAT[key] as MeshStandardMaterial;
    const repeat = 1 / spec.tileMetres;
    const dir = `${base}${spec.texture}/`;
    const aniso = spec.anisotropy ?? 8;
    material.map = load(`${dir}diff.jpg`, true, repeat, aniso);
    material.normalMap = load(`${dir}nor.jpg`, false, repeat, aniso);
    material.normalScale = new Vector2(spec.normalScale ?? 1, spec.normalScale ?? 1);
    const arm = load(`${dir}arm.jpg`, false, repeat, aniso);
    material.aoMap = arm;
    material.roughnessMap = arm;
    material.roughness = 1;
    if (material.metalness > 0) material.metalnessMap = arm;
    material.color.set(spec.tint ?? '#ffffff');
    if (spec.gain) material.color.multiplyScalar(spec.gain);
    material.needsUpdate = true;
  }
}

// ---------- Geometry with metre-based UVs ----------

const geoCache = new Map<string, BufferGeometry>();

function cached<T extends BufferGeometry>(key: string, make: () => T): T {
  const hit = geoCache.get(key);
  if (hit) return hit as T;
  const g = make();
  geoCache.set(key, g);
  return g;
}

/** Box whose UVs measure metres on every face. */
export function worldBox(w: number, h: number, d: number): BoxGeometry {
  return cached(`box:${w}:${h}:${d}`, () => {
    const g = new BoxGeometry(w, h, d);
    const uv = g.getAttribute('uv') as BufferAttribute;
    // Face order: +x, −x, +y, −y, +z, −z; 4 vertices each.
    const spans: [number, number][] = [
      [d, h],
      [d, h],
      [w, d],
      [w, d],
      [w, h],
      [w, h],
    ];
    spans.forEach(([su, sv], face) => {
      for (let i = 0; i < 4; i++) {
        const k = face * 4 + i;
        uv.setXY(k, uv.getX(k) * su, uv.getY(k) * sv);
      }
    });
    uv.needsUpdate = true;
    return g;
  });
}

export function worldPlane(w: number, h: number): PlaneGeometry {
  return cached(`plane:${w}:${h}`, () => {
    const g = new PlaneGeometry(w, h);
    scaleUv(g, w, h);
    return g;
  });
}

export function worldCircle(radius: number, segments = 64): CircleGeometry {
  return cached(`circle:${radius}:${segments}`, () => {
    const g = new CircleGeometry(radius, segments);
    scaleUv(g, radius * 2, radius * 2);
    return g;
  });
}

export function worldCylinder(rTop: number, rBottom: number, h: number, segments = 24, open = false): CylinderGeometry {
  return cached(`cyl:${rTop}:${rBottom}:${h}:${segments}:${open}`, () => {
    const g = new CylinderGeometry(rTop, rBottom, h, segments, 1, open);
    scaleUv(g, Math.PI * (rTop + rBottom), h);
    return g;
  });
}

/** Open cylinder seen from inside (round towers, stairwells): reversed winding, inward normals, metre UVs. */
export function insideCylinder(radius: number, h: number, segments = 48, thetaStart = 0, thetaLength = Math.PI * 2): BufferGeometry {
  return cached(`incyl:${radius}:${h}:${segments}:${thetaStart}:${thetaLength}`, () => {
    // thetaStart/thetaLength leave a gap for a doorway (CylinderGeometry angles: x = r sin θ, z = r cos θ).
    const g = new CylinderGeometry(radius, radius, h, segments, 1, true, thetaStart, thetaLength);
    scaleUv(g, thetaLength * radius, h);
    const index = g.getIndex();
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i);
        index.setX(i, index.getX(i + 2));
        index.setX(i + 2, a);
      }
      index.needsUpdate = true;
    }
    const n = g.getAttribute('normal') as BufferAttribute;
    for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
    n.needsUpdate = true;
    return g;
  });
}

/** Scales a geometry's UVs so its texture repeats every metre (su × sv metres across the 0–1 range). */
export function scaleUv(g: BufferGeometry, su: number, sv: number): void {
  const uv = g.getAttribute('uv') as BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
}
