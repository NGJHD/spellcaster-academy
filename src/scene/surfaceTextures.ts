/**
 * Procedural surface textures for the Level 2/3 environments (no extra downloads): deterministic
 * value noise painted into a canvas, used as colour and roughness maps. Each kind is made once and
 * shared. Detail is broad and soft so it never shimmers at gameplay distance (§14.4).
 */
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, type Texture } from 'three';

const SIZE = 256;

function hash(x: number, y: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

/** Tileable value noise: octaves of smoothly interpolated lattice noise. */
function noise(x: number, y: number, period: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const v = (i: number, j: number) => hash(((xi + i) % period + period) % period, ((yi + j) % period + period) % period, seed);
  return (v(0, 0) * (1 - sx) + v(1, 0) * sx) * (1 - sy) + (v(0, 1) * (1 - sx) + v(1, 1) * sx) * sy;
}

function fbm(u: number, v: number, seed: number): number {
  let total = 0;
  let amp = 0.5;
  let period = 4;
  for (let o = 0; o < 5; o++) {
    total += amp * noise(u * period, v * period, period, seed + o);
    amp *= 0.5;
    period *= 2;
  }
  return total;
}

export type SurfaceKind = 'ash' | 'scorched' | 'grass' | 'paper' | 'iron' | 'stone';

const PALETTE: Record<SurfaceKind, { a: readonly number[]; b: readonly number[]; veins?: readonly number[]; rough: [number, number] }> = {
  // Grey ash with darker drifts and faint ember-glow cracks (the Blank).
  ash: { a: [56, 52, 50], b: [30, 28, 27], veins: [150, 40, 18], rough: [0.85, 1] },
  // Burnt ground: charcoal and brown earth.
  scorched: { a: [52, 44, 38], b: [24, 20, 18], veins: [90, 30, 14], rough: [0.8, 1] },
  // Night lawn: dark green grass with trampled patches.
  grass: { a: [46, 66, 34], b: [26, 38, 20], rough: [0.85, 1] },
  // Paper sea: creased off-white sheets.
  paper: { a: [150, 144, 134], b: [104, 99, 92], rough: [0.75, 0.95] },
  // Blackened iron: dark with soft rust and wear.
  iron: { a: [40, 36, 40], b: [20, 18, 22], veins: [70, 34, 22], rough: [0.4, 0.75] },
  // Old stone flags.
  stone: { a: [150, 132, 108], b: [104, 90, 74], rough: [0.75, 0.95] },
};

const cache = new Map<SurfaceKind, { map: Texture; rough: Texture }>();

function paint(kind: SurfaceKind): { map: Texture; rough: Texture } {
  const cached = cache.get(kind);
  if (cached) return cached;
  const p = PALETTE[kind];
  const colour = document.createElement('canvas');
  const rough = document.createElement('canvas');
  colour.width = colour.height = rough.width = rough.height = SIZE;
  const c = colour.getContext('2d');
  const r = rough.getContext('2d');
  if (c && r) {
    const ci = c.createImageData(SIZE, SIZE);
    const ri = r.createImageData(SIZE, SIZE);
    const seed = kind.length * 13;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const u = x / SIZE;
        const v = y / SIZE;
        const n = fbm(u, v, seed);
        // Thin cracks where ridged noise is near zero.
        const ridge = Math.abs(fbm(u + 0.37, v + 0.71, seed + 9) - 0.5);
        const crack = p.veins && ridge < 0.018 ? 1 - ridge / 0.018 : 0;
        const i = (y * SIZE + x) * 4;
        for (let k = 0; k < 3; k++) {
          const base = (p.a[k] ?? 0) * n + (p.b[k] ?? 0) * (1 - n);
          ci.data[i + k] = Math.round(base * (1 - crack) + (p.veins?.[k] ?? 0) * crack);
        }
        ci.data[i + 3] = 255;
        const g = Math.round(255 * (p.rough[0] + (p.rough[1] - p.rough[0]) * (1 - n)));
        ri.data[i] = ri.data[i + 1] = ri.data[i + 2] = g;
        ri.data[i + 3] = 255;
      }
    }
    c.putImageData(ci, 0, 0);
    r.putImageData(ri, 0, 0);
  }
  const map = new CanvasTexture(colour);
  map.colorSpace = SRGBColorSpace;
  const roughMap = new CanvasTexture(rough);
  for (const t of [map, roughMap]) {
    t.wrapS = t.wrapT = RepeatWrapping;
    t.anisotropy = 4;
  }
  const result = { map, rough: roughMap };
  cache.set(kind, result);
  return result;
}

/**
 * A material using a procedural surface, tiled every `tile` metres over a surface `size` metres
 * across. Each call returns its own material (own repeat) sharing the painted textures.
 */
export function surface(kind: SurfaceKind, size: readonly [number, number], tile = 6, extra: { metalness?: number; emissive?: string; emissiveIntensity?: number } = {}): MeshStandardMaterial {
  const { map, rough } = paint(kind);
  const m = map.clone();
  const r = rough.clone();
  m.repeat.set(size[0] / tile, size[1] / tile);
  r.repeat.set(size[0] / tile, size[1] / tile);
  m.needsUpdate = true;
  r.needsUpdate = true;
  return new MeshStandardMaterial({
    map: m,
    roughnessMap: r,
    roughness: 1,
    metalness: extra.metalness ?? 0,
    ...(extra.emissive ? { emissive: extra.emissive, emissiveIntensity: extra.emissiveIntensity ?? 0.2 } : {}),
  });
}

const metreCache = new Map<string, MeshStandardMaterial>();

/** Shared material for geometry with UVs in metres (kit Box/Slab): one tile every `tile` metres. */
export function metreSurface(kind: SurfaceKind, tile = 4, extra: { metalness?: number } = {}): MeshStandardMaterial {
  const key = `${kind}:${tile}:${extra.metalness ?? 0}`;
  const hit = metreCache.get(key);
  if (hit) return hit;
  const m = surface(kind, [1, 1], tile, extra);
  metreCache.set(key, m);
  return m;
}
