/**
 * Fire for Levels 2 and 3: camera-facing flame sprites animated from a
 * flipbook rendered from turbulent noise coloured by heat (fireSheets.ts, baked to image files), with a flickering light for big fires and painted smoke (fxSprites) billowing up from every fire.
 * - 'ink': the enemy's inkfire, red-orange with dark smoky cores.
 * - 'warm': ordinary flame (furnace, beacons, braziers).
 * Restorable objects burn to grey ash until their restore word is typed (flag set), then blaze back
 * to colour. Purely cosmetic; never covers a word (labels sit above their own dark backing).
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AdditiveBlending, Box3, CanvasTexture, Color, Mesh, MeshBasicMaterial, MeshStandardMaterial, Plane, SpriteMaterial, SRGBColorSpace, Texture, TextureLoader, Vector3, type Group, type Sprite } from 'three';
import { fxSprite } from './fxSprites';
import type { Vec3 } from '../level/rail/railTypes';
import { getRun } from '../state/gameStore';
import { PoolLight, VirtualLight } from './LightPool';
import { fbm, FRAMES, hash } from './fireSheets';

/**
 * The flame flipbooks, rendered once at build time (`npm run gen:fire`) and loaded with the rest of the
 * game's files, so the loading screen waits for them and no fire stalls the game when it first appears.
 */
const flameUrl = (kind: 'ink' | 'warm') => `${import.meta.env.BASE_URL}assets/textures/fx/flames_${kind}.png`;
/** Per-sprite copies made before their flipbook arrived; refreshed when it does. */
const waitingCopies = new Set<Texture>();
function loadFlames(kind: 'ink' | 'warm'): Texture {
  const tex = new TextureLoader().load(flameUrl(kind), () => {
    for (const t of waitingCopies) t.needsUpdate = true;
    waitingCopies.clear();
  });
  tex.colorSpace = SRGBColorSpace;
  tex.repeat.set(1 / FRAMES, 1);
  return tex;
}
let flameSheets: Record<'ink' | 'warm', Texture> | null = null;
/** Starts loading the flipbooks (the game canvas calls this as it mounts, behind the loading screen). */
export function preloadFlames(): Record<'ink' | 'warm', Texture> {
  flameSheets ??= { ink: loadFlames('ink'), warm: loadFlames('warm') };
  return flameSheets;
}
const smokePuffs = new Map<string, CanvasTexture>();

/** A soft smoke puff of the given colour (cached), for smoke and dust that is not part of a fire. */
export function smokePuffTexture(rgb: readonly [number, number, number] = [42, 38, 36]): CanvasTexture {
  const key = rgb.join(',');
  let tex = smokePuffs.get(key);
  if (!tex) {
    tex = paintSmoke(rgb);
    smokePuffs.set(key, tex);
  }
  return tex;
}

/** A soft, billowing smoke puff (noise-shaped, not a plain disc). */
function paintSmoke([r, gr, b]: readonly [number, number, number] = [42, 38, 36]): CanvasTexture {
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
        img.data[i] = r;
        img.data[i + 1] = gr;
        img.data[i + 2] = b;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
  }
  return new CanvasTexture(canvas);
}

/** Puffs of smoke over every fire: painted smoke sprites, each rising and spreading over SMOKE_SEC. */
const PUFFS = 8;
const SMOKE_SEC = 4.2;
/** Smoke glows with the fire's colour just above the flames and cools to grey as it rises. */
const SMOKE_LIT: Record<'ink' | 'warm', Color> = { ink: new Color('#b0583c'), warm: new Color('#b8844e') };
const SMOKE_COOL = new Color('#45403d');

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
  const lamp = useRef<VirtualLight>(null);
  const flames = useRef<(Sprite | null)[]>([]);
  const puffs = useRef<(Sprite | null)[]>([]);
  const time = useRef(0);
  const level = useRef(1);
  const textures = useMemo(() => {
    const flamesheets = preloadFlames();
    return Array.from({ length: count }, () => {
      const t = flamesheets[kind].clone();
      if (t.image) t.needsUpdate = true;
      else waitingCopies.add(t);
      return t;
    });
  }, [count, kind]);
  const smokeMats = useMemo(
    () =>
      smoke
        ? Array.from({ length: PUFFS }, (_, i) => new SpriteMaterial({ map: fxSprite(i % 2 ? 'smoke_2' : 'smoke_1'), transparent: true, depthWrite: false, opacity: 0, fog: false }))
        : [],
    [smoke],
  );
  useEffect(() => () => smokeMats.forEach((m) => m.dispose()), [smokeMats]);
  useEffect(
    () => () =>
      textures.forEach((t) => {
        waitingCopies.delete(t);
        t.dispose();
      }),
    [textures],
  );
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
      const m = smokeMats[i];
      if (!sp || !m) return;
      // Each puff loops: born just over the flames, it billows up, swells, drifts downwind and thins out.
      const n = smokeMats.length;
      const u = (time.current / SMOKE_SEC + i / n + hash(i, 9) * 0.05) % 1;
      const loop = Math.floor(time.current / SMOKE_SEC + i / n);
      const x0 = (hash(i, loop + 11) - 0.5) * spread * 0.7;
      const z0 = (hash(i, loop + 23) - 0.5) * spread * 0.7;
      sp.position.set(x0 + u * u * size * 0.9, size * (0.7 + u * 3.6), z0 + Math.sin(u * 3 + i) * size * 0.15);
      const s = size * (0.9 + u * 2.6) + spread * 0.3;
      sp.scale.set(s, s, 1);
      m.rotation = hash(i, loop) * Math.PI * 2 + u * (i % 2 ? 0.6 : -0.6);
      m.color.copy(SMOKE_LIT[kind]).lerp(SMOKE_COOL, Math.min(1, u * 4));
      m.opacity = Math.min(1, u / 0.08) * (1 - u) ** 0.7 * level.current;
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
      {smokeMats.map((m, i) => (
        <sprite key={`s${i}`} ref={(s) => void (puffs.current[i] = s)} material={m} />
      ))}
      {light && <PoolLight ref={lamp} position={[0, size * 0.6, 0]} color={kind === 'ink' ? '#ff5a2a' : '#ffa040'} intensity={0} distance={size * 9} decay={2} />}
    </group>
  );
}

const ASH = new Color('#55504c');

/**
 * An object that burns to grey ash (with fire on it) until `flag` is set by its restore word, then
 * blazes back to full colour. `burning` false keeps it ash without flames.
 */
/** The slant of the line that rubs out half of an `erased` creature (world space, normalised). */
const ERASE_NORMAL = new Vector3(0.85, 0.45, 0.3).normalize();

/**
 * `erased` (Level 3 creatures, owner: "the deer is fully intact"): until restored, a slanted line cuts
 * the model in half; the far half is gone except for a faint pencil ghost. Restoring sweeps the line
 * across, drawing the rest of it back in.
 */
export function Restorable({ flag, children, fire, burning = true, erased = false }: { flag: string; children: ReactNode; fire?: FireProps; burning?: boolean; erased?: boolean }) {
  const group = useRef<Group>(null);
  const mats = useRef<{ m: MeshStandardMaterial; color: Color; emissive: Color }[]>([]);
  const seen = useRef(new Set<Mesh>());
  const level = useRef(0);
  const erase = useRef<{ solid: Plane; ghost: Plane; ghostMat: MeshBasicMaterial; centre: Vector3; reach: number } | null>(null);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // Clone each mesh's material once so the ash tint never leaks into shared kit materials. Meshes
    // that appear later (a model replacing its loading stand-in) are picked up as they arrive.
    const fresh: Mesh[] = [];
    g.traverse((o) => {
      if (o instanceof Mesh && o.name !== 'erased-ghost' && !seen.current.has(o) && o.material instanceof MeshStandardMaterial) fresh.push(o);
    });
    if (fresh.length > 0) {
      for (const o of fresh) {
        seen.current.add(o);
        const m = (o.material as MeshStandardMaterial).clone();
        o.material = m;
        mats.current.push({ m, color: m.color.clone(), emissive: m.emissive.clone() });
      }
      if (erased) {
        // Parents too: a model can arrive while its area is staged and its ancestors' world matrices are
        // not yet computed, which put the cut metres away (the whole deer rubbed out, restoring late).
        g.updateWorldMatrix(true, true);
        const box = new Box3().setFromObject(g);
        const centre = box.getCenter(new Vector3());
        const reach = box.getSize(new Vector3()).length() / 2 + 0.2;
        const e = erase.current ?? {
          solid: new Plane(ERASE_NORMAL.clone().negate(), 0),
          ghost: new Plane(ERASE_NORMAL.clone(), 0),
          // The rubbed-out half: the same shape as a faint grey pencil ghost.
          ghostMat: new MeshBasicMaterial({ color: '#d8d4cc', transparent: true, opacity: 0.16, depthWrite: false }),
          centre,
          reach,
        };
        e.ghostMat.clippingPlanes = [e.ghost];
        e.centre.copy(centre);
        e.reach = reach;
        erase.current = e;
        for (const { m } of mats.current) m.clippingPlanes = [e.solid];
        for (const o of fresh) {
          const copy = new Mesh(o.geometry, e.ghostMat);
          copy.name = 'erased-ghost';
          o.add(copy);
        }
      }
    }
    if (mats.current.length === 0) return;
    const restored = getRun()?.flags.has(flag) ?? false;
    level.current += ((restored ? 1 : 0) - level.current) * (1 - Math.exp(-2.4 * Math.min(delta, 0.1)));
    const ember = 1 - level.current;
    for (const { m, color, emissive } of mats.current) {
      m.color.copy(ASH).lerp(color, level.current);
      m.emissive.copy(emissive).lerp(new Color('#ff3a10'), ember * 0.12);
    }
    const e = erase.current;
    if (e) {
      // The cut sits at the middle while erased and sweeps out past the far side as it is restored. Once
      // fully restored it is dropped, so a restored creature can move off (the flock flies away).
      const done = restored && level.current > 0.98;
      const d = e.centre.dot(ERASE_NORMAL) + (done ? 1e6 : level.current * e.reach);
      e.solid.constant = d;
      e.ghost.constant = -d;
    }
  });
  return (
    <group ref={group}>
      {children}
      {burning && fire && <Fire {...fire} untilFlag={flag} />}
    </group>
  );
}
