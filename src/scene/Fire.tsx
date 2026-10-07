/**
 * Fire for Levels 2 and 3 (LEVEL2_DESIGN A2-1b): camera-facing flame sprites animated from a
 * procedurally rendered flipbook (turbulent noise coloured by heat), with a flickering light for big fires and rising smoke.
 * - 'ink': the enemy's inkfire, red-orange with dark smoky cores.
 * - 'warm': ordinary flame (furnace, beacons, braziers).
 * Restorable objects burn to grey ash until their restore word is typed (flag set), then blaze back
 * to colour. Purely cosmetic; never covers a word (labels sit above their own dark backing).
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AdditiveBlending, CanvasTexture, Color, Mesh, MeshStandardMaterial, NormalBlending, SRGBColorSpace, type Group, type PointLight, type Sprite } from 'three';
import type { Vec3 } from '../level/rail/railTypes';
import { getRun } from '../state/gameStore';

const FRAMES = 16;
const FRAME_PX = 128;

let flameSheets: Record<'ink' | 'warm', CanvasTexture> | null = null;
let smokeTexture: CanvasTexture | null = null;

/** Deterministic noise so the flipbook is the same every run. */
const hash = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth value noise that tiles every `period` cells vertically (so the flipbook loops). */
function noise(x: number, y: number, period: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const wrap = (v: number) => ((v % period) + period) % period;
  const h = (i: number, j: number) => hash(i, wrap(j));
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * sx;
  const b = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * sx;
  return a + (b - a) * sy;
}

/** Turbulence: four octaves of noise (each tiles vertically). */
function fbm(x: number, y: number): number {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    sum += amp * noise(x * f, y * f, 4 * f);
    amp *= 0.5;
    f *= 2;
  }
  return sum;
}

/** Heat to colour (r, g, b in 0–255, a in 0–1). */
const RAMPS: Record<'ink' | 'warm', readonly (readonly [number, number, number, number, number])[]> = {
  // [heat, r, g, b, alpha]
  warm: [
    [0.0, 90, 10, 0, 0],
    [0.18, 150, 25, 5, 0.35],
    [0.4, 235, 85, 15, 0.85],
    [0.65, 255, 170, 45, 1],
    [0.85, 255, 230, 140, 1],
    [1.0, 255, 255, 235, 1],
  ],
  // Inkfire: redder, with a deep crimson body.
  ink: [
    [0.0, 60, 0, 0, 0],
    [0.18, 120, 10, 5, 0.4],
    [0.4, 215, 45, 15, 0.85],
    [0.65, 255, 120, 35, 1],
    [0.85, 255, 200, 110, 1],
    [1.0, 255, 245, 215, 1],
  ],
};

function ramp(kind: 'ink' | 'warm', heat: number): [number, number, number, number] {
  const stops = RAMPS[kind];
  for (let i = 1; i < stops.length; i++) {
    const b = stops[i];
    const a = stops[i - 1];
    if (!a || !b) continue;
    if (heat <= b[0]) {
      const t = (heat - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t];
    }
  }
  return [255, 255, 235, 1];
}

/**
 * A rendered flame flipbook (owner, 2026-10-07: the old bezier teardrops "look polygon"): every pixel
 * is computed from turbulent noise rising through a flame-shaped falloff and coloured by heat, so the
 * flames have soft edges, licking tongues and a white-hot core. Frames scroll the noise upwards and
 * loop seamlessly.
 */
function paintFlames(kind: 'ink' | 'warm'): CanvasTexture {
  const W = FRAME_PX;
  const H = FRAME_PX * 2;
  const canvas = document.createElement('canvas');
  canvas.width = W * FRAMES;
  canvas.height = H;
  const g = canvas.getContext('2d');
  if (!g) return new CanvasTexture(canvas);
  const img = g.createImageData(W * FRAMES, H);
  for (let f = 0; f < FRAMES; f++) {
    const scroll = (f / FRAMES) * 4; // one full noise period per loop
    for (let py = 0; py < H; py++) {
      const v = 1 - py / (H - 1); // 0 at the base, 1 at the top
      for (let px = 0; px < W; px++) {
        const u = (px / (W - 1)) * 2 - 1;
        // Turbulence sways the flame sideways more the higher it rises.
        const n = fbm(u * 2.2 + 7, v * 3.2 - scroll);
        const uu = u + (n - 0.5) * 0.9 * v;
        // A teardrop body: wide at the base, licking to a point at the top.
        const halfWidth = 0.62 * Math.pow(1 - v, 0.55) + 0.02;
        const body = Math.max(0, 1 - Math.abs(uu) / halfWidth);
        const tongue = fbm(u * 4 + 3, v * 6 - scroll * 2);
        let heat = body * 1.35 - v * 0.85 + (tongue - 0.5) * 0.8;
        heat *= Math.min(1, v * 14 + 0.3); // soft at the very bottom edge
        heat = Math.max(0, Math.min(1, heat));
        const [r, gg, b, a] = ramp(kind, heat);
        const i = (py * W * FRAMES + f * W + px) * 4;
        img.data[i] = r;
        img.data[i + 1] = gg;
        img.data[i + 2] = b;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.repeat.set(1 / FRAMES, 1);
  return tex;
}

/** A soft, billowing smoke puff (noise-shaped, not a plain disc). */
function paintSmoke(): CanvasTexture {
  const S = 96;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const g = canvas.getContext('2d');
  if (g) {
    const img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = x / (S - 1) * 2 - 1;
        const dy = y / (S - 1) * 2 - 1;
        const d = Math.sqrt(dx * dx + dy * dy);
        const n = fbm(dx * 2 + 11, dy * 2 + 5);
        const a = Math.max(0, 1 - d * (1.1 - (n - 0.5) * 0.9)) ** 1.6 * 0.75;
        const i = (y * S + x) * 4;
        img.data[i] = 42;
        img.data[i + 1] = 38;
        img.data[i + 2] = 36;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
  }
  return new CanvasTexture(canvas);
}

function sheets() {
  if (!flameSheets) flameSheets = { ink: paintFlames('ink'), warm: paintFlames('warm') };
  if (!smokeTexture) smokeTexture = paintSmoke();
  return { flames: flameSheets, smoke: smokeTexture };
}

export interface FireProps {
  readonly position: Vec3;
  /** Height of the flames in metres. */
  readonly size?: number;
  readonly kind?: 'ink' | 'warm';
  /** Number of flame sprites (spread across `spread` metres). */
  readonly count?: number;
  readonly spread?: number;
  /** A flickering point light (big fires only; keep the light budget, §15). */
  readonly light?: boolean;
  readonly smoke?: boolean;
  /** Burns until this story flag is set (a restore word), then goes out. */
  readonly untilFlag?: string;
  /** Only burns once this flag is set (fires that start mid-scene). */
  readonly fromFlag?: string;
}

export function Fire({ position, size = 1.6, kind = 'ink', count = 4, spread = 0.8, light = false, smoke = true, untilFlag, fromFlag }: FireProps) {
  const group = useRef<Group>(null);
  const lamp = useRef<PointLight>(null);
  const flames = useRef<(Sprite | null)[]>([]);
  const puffs = useRef<(Sprite | null)[]>([]);
  const time = useRef(0);
  const level = useRef(1);
  const { textures, smokeTex } = useMemo(() => {
    const s = sheets();
    return {
      textures: Array.from({ length: count }, () => {
        const t = s.flames[kind].clone();
        t.needsUpdate = true;
        return t;
      }),
      smokeTex: s.smoke,
    };
  }, [count, kind]);
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: (hash(i, 1) - 0.5) * spread, z: (hash(i, 2) - 0.5) * spread, s: 0.7 + hash(i, 3) * 0.5, rate: 9 + hash(i, 4) * 6, phase: hash(i, 5) * FRAMES })), [count, spread]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const flags = getRun()?.flags;
    const on = (!untilFlag || !flags?.has(untilFlag)) && (!fromFlag || (flags?.has(fromFlag) ?? false));
    // Fires blow out quickly when restored, and catch over a second when they start.
    level.current += ((on ? 1 : 0) - level.current) * (1 - Math.exp(-(on ? 1.5 : 7) * dt));
    g.visible = level.current > 0.02;
    if (!g.visible) return;
    flames.current.forEach((sp, i) => {
      const seed = seeds[i];
      const tex = textures[i];
      if (!sp || !seed || !tex) return;
      const frame = Math.floor(time.current * seed.rate * 1.6 + seed.phase) % FRAMES;
      tex.offset.x = frame / FRAMES;
      const h = size * seed.s * level.current * (0.9 + Math.sin(time.current * 7 + i) * 0.1);
      sp.scale.set(h * 0.55, h, 1);
      sp.position.set(seed.x, h * 0.45, seed.z);
    });
    puffs.current.forEach((sp, i) => {
      if (!sp) return;
      const u = (time.current * 0.35 + i / 3) % 1;
      sp.position.set(Math.sin(i * 2 + time.current * 0.3) * 0.3, size * (0.8 + u * 2.2), Math.cos(i * 3) * 0.3);
      const s = size * (0.6 + u * 1.6);
      sp.scale.set(s, s, 1);
      (sp.material as { opacity: number }).opacity = (1 - u) * 0.5 * level.current;
    });
    if (lamp.current) lamp.current.intensity = level.current * (14 + Math.sin(time.current * 13) * 3 + Math.sin(time.current * 31) * 2) * size;
  });

  return (
    <group ref={group} position={position}>
      {seeds.map((_, i) => (
        <sprite key={i} ref={(s) => void (flames.current[i] = s)}>
          <spriteMaterial map={textures[i]} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
        </sprite>
      ))}
      {smoke &&
        [0, 1, 2].map((i) => (
          <sprite key={`s${i}`} ref={(s) => void (puffs.current[i] = s)}>
            <spriteMaterial map={smokeTex} transparent depthWrite={false} blending={NormalBlending} opacity={0} />
          </sprite>
        ))}
      {light && <pointLight ref={lamp} position={[0, size * 0.6, 0]} color={kind === 'ink' ? '#ff5a2a' : '#ffa040'} intensity={0} distance={size * 9} decay={2} />}
    </group>
  );
}

const ASH = new Color('#55504c');

/**
 * An object that burns to grey ash (with fire on it) until `flag` is set by its restore word, then
 * blazes back to full colour (LEVEL2_DESIGN A2-1). `burning` false keeps it ash without flames.
 */
export function Restorable({ flag, children, fire, burning = true }: { flag: string; children: ReactNode; fire?: FireProps; burning?: boolean }) {
  const group = useRef<Group>(null);
  const mats = useRef<{ m: MeshStandardMaterial; color: Color; emissive: Color }[] | null>(null);
  const level = useRef(0);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (!mats.current) {
      // Clone this object's materials once so the ash tint never leaks into shared kit materials.
      const list: { m: MeshStandardMaterial; color: Color; emissive: Color }[] = [];
      g.traverse((o) => {
        if (o instanceof Mesh && o.material instanceof MeshStandardMaterial) {
          const m = o.material.clone();
          o.material = m;
          list.push({ m, color: m.color.clone(), emissive: m.emissive.clone() });
        }
      });
      if (list.length === 0) return;
      mats.current = list;
    }
    const restored = getRun()?.flags.has(flag) ?? false;
    level.current += ((restored ? 1 : 0) - level.current) * (1 - Math.exp(-2.4 * Math.min(delta, 0.1)));
    const ember = 1 - level.current;
    for (const { m, color, emissive } of mats.current) {
      m.color.copy(ASH).lerp(color, level.current);
      m.emissive.copy(emissive).lerp(new Color('#ff3a10'), ember * 0.12);
    }
  });
  return (
    <group ref={group}>
      {children}
      {burning && fire && <Fire {...fire} untilFlag={flag} />}
    </group>
  );
}
