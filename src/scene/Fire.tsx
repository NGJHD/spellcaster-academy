/**
 * Fire for Levels 2 and 3 (LEVEL2_DESIGN A2-1b): camera-facing flame sprites animated from a
 * procedurally painted flipbook, with a flickering light for big fires and rising smoke.
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

const FRAMES = 8;
const FRAME_PX = 128;

let flameSheets: Record<'ink' | 'warm', CanvasTexture> | null = null;
let smokeTexture: CanvasTexture | null = null;

/** Deterministic noise so the flipbook is the same every run. */
const hash = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

function paintFlames(kind: 'ink' | 'warm'): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_PX * FRAMES;
  canvas.height = FRAME_PX * 2;
  const g = canvas.getContext('2d');
  if (!g) return new CanvasTexture(canvas);
  const stops =
    kind === 'ink'
      ? ['rgba(255,240,180,1)', 'rgba(255,140,40,0.95)', 'rgba(220,40,20,0.85)', 'rgba(40,6,6,0.6)', 'rgba(0,0,0,0)']
      : ['rgba(255,255,220,1)', 'rgba(255,200,80,0.95)', 'rgba(255,110,30,0.8)', 'rgba(160,40,10,0.4)', 'rgba(0,0,0,0)'];
  for (let f = 0; f < FRAMES; f++) {
    const ox = f * FRAME_PX;
    // Several tongues of flame per frame, each a gradient-filled teardrop that sways with the frame.
    for (let t = 0; t < 5; t++) {
      const base = ox + FRAME_PX * (0.28 + 0.44 * hash(t, 7));
      const sway = (hash(f, t) - 0.5) * FRAME_PX * 0.22;
      const height = FRAME_PX * 2 * (0.55 + 0.4 * hash(t, f + 3));
      const width = FRAME_PX * (0.18 + 0.16 * hash(t + 9, f));
      const bottom = FRAME_PX * 2 - 4;
      const grad = g.createLinearGradient(0, bottom, 0, bottom - height);
      stops.forEach((c, i) => grad.addColorStop(i / (stops.length - 1), c));
      g.fillStyle = grad;
      g.globalCompositeOperation = 'lighter';
      g.beginPath();
      g.moveTo(base - width, bottom);
      g.bezierCurveTo(base - width * 1.1, bottom - height * 0.45, base + sway - width * 0.3, bottom - height * 0.8, base + sway, bottom - height);
      g.bezierCurveTo(base + sway + width * 0.3, bottom - height * 0.8, base + width * 1.1, bottom - height * 0.45, base + width, bottom);
      g.closePath();
      g.fill();
    }
    if (kind === 'ink') {
      // Dark smoky cores: the inkfire "burns black" in the middle.
      g.globalCompositeOperation = 'source-atop';
      const core = g.createRadialGradient(ox + FRAME_PX / 2, FRAME_PX * 1.45, 2, ox + FRAME_PX / 2, FRAME_PX * 1.45, FRAME_PX * 0.35);
      core.addColorStop(0, 'rgba(20,0,0,0.75)');
      core.addColorStop(1, 'rgba(20,0,0,0)');
      g.fillStyle = core;
      g.fillRect(ox, 0, FRAME_PX, FRAME_PX * 2);
    }
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.repeat.set(1 / FRAMES, 1);
  return tex;
}

function paintSmoke(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    grad.addColorStop(0, 'rgba(40,36,34,0.7)');
    grad.addColorStop(1, 'rgba(40,36,34,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
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
      const frame = Math.floor(time.current * seed.rate + seed.phase) % FRAMES;
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
