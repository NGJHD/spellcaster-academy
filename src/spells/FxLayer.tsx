/**
 * Spectacle layer (CLAUDE.md §1B "Destruction", "Surprise entrances", "Big moments"): pooled,
 * bounded effects for FxEvents from the run — magical bursts, tumbling debris, dust, ink geysers,
 * leaves, glass, scattering doves, impacts (rolling dust, explosions, magic pulses), light pillars, meteors, lightning and
 * fireworks. Purely cosmetic.
 */
import { BEAM_GEOMETRY, beamTexture, placeStreak, STREAK_GEOMETRY } from '../scene/glow';
import { fxSprite } from '../scene/fxSprites';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  InstancedMesh,
  Matrix4,
  MeshBasicMaterial,
  NormalBlending,
  Object3D,
  Points,
  PointsMaterial,
  type Texture,
  Vector3,
  Mesh,
} from 'three';
import type { FxEvent } from '../game/GameRun';
import type { DebrisPieces, FxKind } from '../level/levelTypes';
import { propUrl } from '../scene/Prop';
import { getRun } from '../state/gameStore';

const SYSTEMS = 28;
const PARTICLES = 160;
const PILLARS = 4;
const BOLTS = 3;
/** The painted lightning (fx_sprites.py bolt_1, bolt_2) is four times as tall as it is wide. */
const BOLT_ASPECT = 0.25;
const BIRDS = 40;
/** A dove's wingspan (m): the model is a metre across. */
const BIRD_SIZE = 0.6;

interface ParticlePreset {
  count: number;
  /** Min/max launch speed (m/s). */
  speed: [number, number];
  /** Extra upward velocity. */
  lift: number;
  /** Spread of the upward cone (0 = straight up, 1 = full sphere). */
  spread: number;
  gravity: number;
  drag: number;
  life: number;
  size: number;
  color: string;
  additive: boolean;
  opacity: number;
  /** Random start offset radius. */
  jitter: number;
  /** Launch outwards along the ground in a ring instead of in a cone (a rolling wave of dust). */
  ring?: boolean;
  /** Painted sprites (fx_sprites.py) the particles are drawn with, one picked per effect; a soft dot otherwise. */
  sprites?: readonly SpriteName[];
}

/** Flux-painted particle sprites (assets-src/scripts/ai/fx_sprites.py). */
const SPRITE_NAMES = ['dust_1', 'dust_2', 'dust_3', 'smoke_1', 'smoke_2', 'fireball', 'mote', 'spark', 'splash_1', 'splash_2', 'droplet'] as const;
type SpriteName = (typeof SPRITE_NAMES)[number];
const DUST = ['dust_1', 'dust_2', 'dust_3'] as const;

const PRESETS: Partial<Record<FxKind | 'smoke' | 'fireball' | 'droplets', ParticlePreset>> = {
  // A firework shell: a big sphere of bright sparks that droop and fade (owner: the ending's fireworks
  // were thin scattered specks).
  shell: { count: 320, speed: [16, 20], lift: 0, spread: 1, gravity: -2.5, drag: 1.4, life: 2.4, size: 0.7, color: '#ffe08a', additive: true, opacity: 1, jitter: 0.05, sprites: ['mote'] },
  burst: { count: 140, speed: [3, 7], lift: 1, spread: 1, gravity: -2.5, drag: 1.6, life: 1.1, size: 0.16, color: '#ffe08a', additive: true, opacity: 1, jitter: 0.1, sprites: ['mote'] },
  sparks: { count: 70, speed: [4, 9], lift: 2, spread: 1, gravity: -11, drag: 0.6, life: 0.8, size: 0.07, color: '#ffd27a', additive: true, opacity: 1, jitter: 0.05, sprites: ['spark'] },
  dust: { count: 90, speed: [0.8, 2.6], lift: 0.4, spread: 0.9, gravity: 0.25, drag: 1.4, life: 1.8, size: 0.7, color: '#d9c7a4', additive: false, opacity: 0.42, jitter: 0.6, sprites: DUST },
  // An ink geyser: a column of painted splashes, with a spray of droplets thrown wider (droplets).
  geyser: { count: 40, speed: [0.6, 1.8], lift: 8, spread: 0.2, gravity: -9, drag: 0.2, life: 1.7, size: 1.7, color: '#3b3f8f', additive: false, opacity: 0.95, jitter: 0.25, sprites: ['splash_1', 'splash_2'] },
  droplets: { count: 90, speed: [1, 3], lift: 7, spread: 0.35, gravity: -10, drag: 0.15, life: 1.8, size: 0.13, color: '#3b3f8f', additive: false, opacity: 0.95, jitter: 0.2, sprites: ['droplet'] },
  // A wave of dust rolling out along the ground from a landing or a slam.
  dustwave: { count: 160, speed: [5, 10], lift: 0.9, spread: 0, gravity: 0.35, drag: 2.2, life: 2.6, size: 2.2, color: '#cdbb98', additive: false, opacity: 0.78, jitter: 0.5, ring: true, sprites: DUST },
  // Magic going off: glowing motes burst out in every direction and slow as they fade.
  pulse: { count: 160, speed: [7, 12], lift: 0, spread: 1, gravity: 0, drag: 2.8, life: 1.2, size: 0.3, color: '#ffe6a0', additive: true, opacity: 1, jitter: 0.1, sprites: ['mote'] },
  // The smoke an explosion leaves hanging.
  smoke: { count: 90, speed: [1.5, 3.5], lift: 1.8, spread: 0.8, gravity: 0.3, drag: 1.1, life: 3.2, size: 2.8, color: '#5d5650', additive: false, opacity: 0.68, jitter: 0.8, sprites: ['smoke_1', 'smoke_2'] },
  // The flash of an explosion: a few big billowing fireballs that swell and fade fast.
  fireball: { count: 14, speed: [2, 4.5], lift: 1.2, spread: 1, gravity: 0.6, drag: 2.2, life: 0.9, size: 5, color: '#ffffff', additive: true, opacity: 1, jitter: 0.5, sprites: ['fireball'] },
  meteors: { count: 36, speed: [0, 0.5], lift: 0, spread: 1, gravity: 0, drag: 0, life: 2.6, size: 0.9, color: '#ffe3a0', additive: true, opacity: 1, jitter: 0, sprites: ['spark'] },
};

/** Modelled debris pieces (assets-src/scripts/props/fx_debris.py), by what they are. */
const PIECE_SETS: Record<DebrisPieces, readonly string[]> = {
  stone: ['stone_1', 'stone_2', 'stone_3'],
  slate: ['slate_1', 'slate_2'],
  wood: ['wood_1', 'wood_2'],
  earth: ['clod_1', 'clod_2'],
  glass: ['glass_1', 'glass_2'],
  book: ['book_red', 'book_blue', 'book_green'],
  page: ['page_1', 'page_2'],
  metal: ['metal_1', 'metal_2'],
  leaf: ['leaf_1', 'leaf_2', 'leaf_3'],
};
const PIECE_NAMES = Object.values(PIECE_SETS).flat();
/** Pieces of one kind in flight at once. */
const PER_PIECE = 40;
/** Coloured in their own right: the cue's colour does not tint them. */
const UNTINTED = new Set<DebrisPieces>(['glass', 'book', 'page', 'leaf']);
/** Light pieces that flutter down on the air instead of falling. */
const FLUTTER = new Set<DebrisPieces>(['page', 'leaf']);
const FLUTTERING = new Set([...FLUTTER].flatMap((set) => PIECE_SETS[set]));
/** How big each kind of piece is next to the effect's base size. */
const PIECE_SIZE: Partial<Record<DebrisPieces, number>> = { book: 1.25, page: 1.4, glass: 1.1, slate: 1.2 };

/** Debris presets: how many pieces, how big, how hard they are thrown and what they are by default. */
const DEBRIS_PRESETS: Partial<Record<FxKind | 'chips', { count: number; size: number; speed: number; up: number; life: number; grow?: boolean; pieces: DebrisPieces }>> = {
  debris: { count: 24, size: 0.3, speed: 6, up: 4, life: 2.2, pieces: 'stone' },
  glass: { count: 30, size: 0.22, speed: 5, up: 4, life: 2.2, pieces: 'glass' },
  // An explosion flings bigger chunks harder and higher, sized with the blast so they read from afar.
  explosion: { count: 40, size: 0.38, speed: 10, up: 9, life: 3.6, grow: true, pieces: 'stone' },
  // Leaves shaken from a hedge or a tree, or (pieces: 'page') pages torn from a book.
  leaves: { count: 30, size: 0.16, speed: 3.5, up: 5, life: 3.2, pieces: 'leaf' },
  // Small stones kicked up by a dust wave.
  chips: { count: 12, size: 0.14, speed: 5, up: 3, life: 1.6, pieces: 'stone' },
};

interface ParticleSystem {
  active: boolean;
  t: number;
  life: number;
  preset: ParticlePreset;
  origin: Vector3;
  velocities: Float32Array;
  points: Points;
  meteor: boolean;
}

interface DebrisPiece {
  /** Which modelled piece it is, and its instance slot in that piece's mesh. */
  readonly piece: string;
  readonly slot: number;
  active: boolean;
  tint: Color;
  t: number;
  life: number;
  floor: number;
  position: Vector3;
  velocity: Vector3;
  rotation: Vector3;
  spin: Vector3;
  size: number;
}

interface TimedMesh {
  active: boolean;
  t: number;
  life: number;
  scale: number;
  mesh: Mesh;
}

interface Bolt {
  active: boolean;
  t: number;
  from: Vector3;
  to: Vector3;
  /** A camera-facing card along the strike carrying one of the painted bolts. */
  mesh: Mesh;
}

let dotTexture: CanvasTexture | null = null;
/** Soft round sprite so particles read as glows, not squares. */
function softDot(): CanvasTexture | null {
  if (dotTexture || typeof document === 'undefined') return dotTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  dotTexture = new CanvasTexture(c);
  return dotTexture;
}

const FIREWORK_COLOURS = ['#ff6fb5', '#6fd3ff', '#ffd24a', '#8dff7a', '#c78bff'];

export function FxLayer() {
  const texture = useMemo(() => softDot(), []);
  const systems = useMemo<ParticleSystem[]>(
    () =>
      Array.from({ length: SYSTEMS }, () => {
        const geo = new BufferGeometry();
        const pos = new BufferAttribute(new Float32Array(PARTICLES * 3), 3);
        pos.setUsage(DynamicDrawUsage);
        geo.setAttribute('position', pos);
        const mat = new PointsMaterial({ size: 0.1, map: texture, transparent: true, depthWrite: false });
        const points = new Points(geo, mat);
        points.frustumCulled = false;
        points.visible = false;
        return {
          active: false,
          t: 0,
          life: 1,
          preset: PRESETS.burst as ParticlePreset,
          origin: new Vector3(),
          velocities: new Float32Array(PARTICLES * 3),
          points,
          meteor: false,
        };
      }),
    [texture],
  );
  // A pool per modelled piece, each piece drawn by its own instanced mesh (DebrisModels).
  const debris = useMemo<DebrisPiece[]>(
    () =>
      PIECE_NAMES.flatMap((piece) =>
        Array.from({ length: PER_PIECE }, (_, slot) => ({
          piece,
          slot,
          active: false,
          tint: new Color('#ffffff'),
          t: 0,
          life: 2,
          floor: 0,
          position: new Vector3(),
          velocity: new Vector3(),
          rotation: new Vector3(),
          spin: new Vector3(),
          size: 0.2,
        })),
      ),
    [],
  );
  const debrisMeshes = useRef(new Map<string, InstancedMesh>());
  const sprites = useMemo(() => Object.fromEntries(SPRITE_NAMES.map((name) => [name, fxSprite(name)])) as Record<SpriteName, Texture>, []);
  // Pillars rise from their base: the cylinder is shifted up so scaling Y grows it skyward.
  const pillarGeometry = BEAM_GEOMETRY;
  const pillarTexture = useMemo(() => beamTexture(), []);
  const pillars = useRef<TimedMesh[]>([]);
  const bolts = useMemo<Bolt[]>(
    () =>
      Array.from({ length: BOLTS }, () => {
        const mat = new MeshBasicMaterial({ transparent: true, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false, fog: false });
        const mesh = new Mesh(STREAK_GEOMETRY, mat);
        mesh.frustumCulled = false;
        mesh.visible = false;
        return { active: false, t: 0, from: new Vector3(), to: new Vector3(), mesh };
      }),
    [],
  );
  const flockRef = useRef<Flock | null>(null);
  const birds = useMemo(
    () => Array.from({ length: BIRDS }, () => ({ active: false, t: 0, life: 3, flap: 0, position: new Vector3(), velocity: new Vector3() })),
    [],
  );
  const wingMatrix = useMemo(() => new Matrix4(), []);
  const seen = useRef(0);
  const scheduled = useRef<{ inSec: number; event: FxEvent }[]>([]);
  const dummy = useMemo(() => new Object3D(), []);

  const startParticles = (preset: ParticlePreset, origin: Vector3, scale: number, color?: string, meteor = false) => {
    const sys = systems.find((x) => !x.active) ?? systems[0];
    if (!sys) return;
    sys.active = true;
    sys.t = 0;
    sys.life = preset.life;
    sys.preset = preset;
    sys.meteor = meteor;
    sys.origin.copy(origin);
    const mat = sys.points.material as PointsMaterial;
    mat.size = preset.size * Math.sqrt(scale);
    mat.color.set(color ?? preset.color);
    mat.blending = preset.additive ? AdditiveBlending : NormalBlending;
    mat.opacity = preset.opacity;
    const sprite = preset.sprites?.[Math.floor(Math.random() * preset.sprites.length)];
    mat.map = (sprite && sprites[sprite]) || texture;
    const pos = sys.points.geometry.getAttribute('position') as BufferAttribute;
    const arr = pos.array as Float32Array;
    const count = Math.min(PARTICLES, Math.round(preset.count * Math.min(1.6, Math.max(0.5, scale))));
    for (let k = 0; k < PARTICLES; k++) {
      const live = k < count;
      if (meteor) {
        // Streaks start high above and fall at an angle towards the target area.
        arr[k * 3] = origin.x + (Math.random() - 0.5) * 120 * scale;
        arr[k * 3 + 1] = origin.y + 50 + Math.random() * 60;
        arr[k * 3 + 2] = origin.z + (Math.random() - 0.5) * 80 * scale;
        sys.velocities[k * 3] = live ? -8 - Math.random() * 6 : 0;
        sys.velocities[k * 3 + 1] = live ? -28 - Math.random() * 14 : 0;
        sys.velocities[k * 3 + 2] = live ? (Math.random() - 0.5) * 6 : 0;
        if (!live) arr[k * 3 + 1] = -9999;
        continue;
      }
      const a = Math.random() * Math.PI * 2;
      // A ring rolls out flat along the ground; otherwise a cone (spread 0) up to a full sphere (spread 1).
      const y = preset.ring ? Math.random() * 0.12 : 1 - Math.random() * (1 + preset.spread);
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const speed = (preset.speed[0] + Math.random() * (preset.speed[1] - preset.speed[0])) * Math.sqrt(scale);
      sys.velocities[k * 3] = live ? Math.cos(a) * r * speed : 0;
      sys.velocities[k * 3 + 1] = live ? y * speed + preset.lift * (0.6 + Math.random() * 0.6) * Math.sqrt(scale) : 0;
      sys.velocities[k * 3 + 2] = live ? Math.sin(a) * r * speed : 0;
      arr[k * 3] = origin.x + (Math.random() - 0.5) * preset.jitter * 2;
      arr[k * 3 + 1] = live ? origin.y + (Math.random() - 0.5) * preset.jitter : -9999;
      arr[k * 3 + 2] = origin.z + (Math.random() - 0.5) * preset.jitter * 2;
    }
    pos.needsUpdate = true;
    sys.points.visible = true;
  };

  const startDebris = (kind: FxKind | 'chips', origin: Vector3, scale: number, color?: string, landY?: number, pieces?: DebrisPieces) => {
    const preset = DEBRIS_PRESETS[kind];
    if (!preset) return;
    const set = pieces ?? preset.pieces;
    const names = PIECE_SETS[set];
    // The cue's colour shades the textured pieces a little (dark iron, charred wood); glass, books and pages keep theirs.
    const tint = new Color('#ffffff');
    if (color && !UNTINTED.has(set)) tint.set(color).lerp(new Color('#ffffff'), 0.45);
    const count = Math.round(preset.count * Math.min(1.8, Math.max(0.5, scale)));
    for (let made = 0; made < count; made++) {
      const name = names[made % names.length];
      if (!name) continue;
      const p = debris.find((x) => !x.active && x.piece === name);
      if (!p) continue;
      p.active = true;
      p.t = 0;
      p.life = preset.life + Math.random() * 0.8;
      p.floor = landY ?? origin.y - 2.5;
      p.tint.copy(tint);
      p.position.copy(origin).add(new Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.5, (Math.random() - 0.5) * 0.6));
      const a = Math.random() * Math.PI * 2;
      const speed = preset.speed * (0.4 + Math.random() * 0.8) * Math.sqrt(scale);
      p.velocity.set(Math.cos(a) * speed, (preset.up / 2 + Math.random() * preset.up) * Math.sqrt(scale) * 0.5 + 1, Math.sin(a) * speed);
      p.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      // Pages flutter, everything else tumbles.
      const spin = FLUTTER.has(set) ? 5 : 14;
      p.spin.set((Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin, (Math.random() - 0.5) * spin);
      p.size = preset.size * (PIECE_SIZE[set] ?? 1) * (0.6 + Math.random() * 0.8) * (preset.grow ? scale : Math.sqrt(scale));
      debrisMeshes.current.get(name)?.setColorAt(p.slot, p.tint);
    }
    for (const mesh of debrisMeshes.current.values()) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  const startTimed = (list: TimedMesh[], origin: Vector3, scale: number, life: number, color?: string) => {
    const item = list.find((x) => !x.active) ?? list[0];
    if (!item) return;
    item.active = true;
    item.t = 0;
    item.life = life;
    item.scale = scale;
    item.mesh.position.copy(origin);
    item.mesh.visible = true;
    const mat = item.mesh.material as MeshBasicMaterial;
    if (color) mat.color.set(color);
  };

  const startBolt = (origin: Vector3) => {
    const b = bolts.find((x) => !x.active) ?? bolts[0];
    if (!b) return;
    b.active = true;
    b.t = 0;
    b.to.copy(origin);
    b.from.copy(origin).add(new Vector3((Math.random() - 0.5) * 20, 70, (Math.random() - 0.5) * 20));
    const map = fxSprite(Math.random() < 0.5 ? 'bolt_1' : 'bolt_2');
    map.center.set(0.5, 0.5);
    map.rotation = Math.PI / 2;
    (b.mesh.material as MeshBasicMaterial).map = map;
    // Mirrored half the time, so two strikes in a row never look the same.
    b.mesh.userData.flip = Math.random() < 0.5 ? -1 : 1;
    b.mesh.visible = true;
  };

  const startBirds = (origin: Vector3, scale: number) => {
    const count = Math.round(10 * Math.min(2, Math.max(0.5, scale)));
    let made = 0;
    for (const b of birds) {
      if (made >= count) break;
      if (b.active) continue;
      made++;
      b.active = true;
      b.t = 0;
      b.life = 2.6 + Math.random();
      b.position.copy(origin).add(new Vector3((Math.random() - 0.5) * 3, Math.random() * 0.5, (Math.random() - 0.5) * 3));
      const a = Math.random() * Math.PI * 2;
      b.velocity.set(Math.cos(a) * (3 + Math.random() * 3), 4 + Math.random() * 3, Math.sin(a) * (3 + Math.random() * 3));
      b.flap = Math.random() * 6;
    }
  };

  const play = (e: FxEvent) => {
    const scale = e.scale;
    switch (e.kind) {
      case 'leaves':
        startDebris('leaves', e.position, scale, e.color, e.landY, e.pieces);
        break;
      case 'geyser':
        startParticles(PRESETS.geyser as ParticlePreset, e.position, scale, e.color);
        startParticles(PRESETS.droplets as ParticlePreset, e.position, scale, e.color);
        break;
      case 'debris':
      case 'glass':
        startDebris(e.kind, e.position, scale, e.color, e.landY, e.pieces);
        startParticles(PRESETS.dust as ParticlePreset, e.position, scale * 0.6);
        break;
      case 'dustwave':
        // Two layers: a fast outer ring and a slower, thicker roll behind it.
        startParticles(PRESETS.dustwave as ParticlePreset, e.position, scale, e.color);
        startParticles({ ...(PRESETS.dustwave as ParticlePreset), speed: [2, 5], size: 2.8, life: 3 }, e.position, scale, e.color);
        startDebris('chips', e.position, scale, e.color, e.position.y - 0.2, e.pieces);
        break;
      case 'explosion':
        startParticles(PRESETS.fireball as ParticlePreset, e.position, scale);
        startParticles(PRESETS.sparks as ParticlePreset, e.position, scale, '#ffb060');
        startDebris('explosion', e.position, scale, e.color, e.landY, e.pieces);
        scheduled.current.push({ inSec: 0.15, event: { ...e, kind: 'smoke' as FxKind } });
        break;
      case 'pulse':
        startParticles(PRESETS.pulse as ParticlePreset, e.position, scale, e.color);
        startParticles(PRESETS.burst as ParticlePreset, e.position, scale * 0.6, '#ffffff');
        break;
      case 'pillar':
        startTimed(pillars.current, e.position, scale, 3.2, e.color);
        startParticles(PRESETS.burst as ParticlePreset, e.position, scale, e.color);
        break;
      case 'lightning':
        startBolt(e.position);
        break;
      case 'birds':
        startBirds(e.position, scale);
        break;
      case 'meteors':
        startParticles(PRESETS.meteors as ParticlePreset, e.position, scale, e.color, true);
        break;
      case 'fireworks':
        // A volley of big coloured shells high over the cue position, each with a white flash core.
        for (let i = 0; i < 6; i++) {
          const at = e.position.clone().add(new Vector3((Math.random() - 0.5) * 30 * scale, 22 + Math.random() * 14, -10 + (Math.random() - 0.5) * 10));
          const colour = e.color ?? FIREWORK_COLOURS[(Math.random() * FIREWORK_COLOURS.length) | 0];
          scheduled.current.push({ inSec: i * 0.3 + Math.random() * 0.2, event: { ...e, kind: 'shell', position: at, scale: 1.6 * scale, color: colour } });
          scheduled.current.push({ inSec: i * 0.3 + 0.02, event: { ...e, kind: 'burst', position: at, scale: 0.8 * scale, color: '#ffffff' } });
        }
        break;
      default: {
        const preset = PRESETS[e.kind as FxKind | 'smoke'];
        if (preset) startParticles(preset, e.position, scale, e.color);
      }
    }
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const run = getRun();
    if (run) {
      while (run.fxEvents.length > 0) {
        const e = run.fxEvents.shift();
        if (!e || e.key <= seen.current) continue;
        seen.current = e.key;
        play(e);
      }
    }
    if (scheduled.current.length > 0) {
      const due: FxEvent[] = [];
      scheduled.current = scheduled.current.filter((x) => {
        x.inSec -= dt;
        if (x.inSec > 0) return true;
        due.push(x.event);
        return false;
      });
      for (const e of due) play(e);
    }

    for (const sys of systems) {
      if (!sys.active) continue;
      sys.t += dt;
      const u = sys.t / sys.life;
      if (u >= 1) {
        sys.active = false;
        sys.points.visible = false;
        continue;
      }
      const p = sys.preset;
      const pos = sys.points.geometry.getAttribute('position') as BufferAttribute;
      const arr = pos.array as Float32Array;
      const damp = Math.exp(-p.drag * dt);
      for (let k = 0; k < PARTICLES; k++) {
        const i = k * 3;
        sys.velocities[i] = (sys.velocities[i] ?? 0) * damp;
        sys.velocities[i + 1] = (sys.velocities[i + 1] ?? 0) * damp + p.gravity * dt;
        sys.velocities[i + 2] = (sys.velocities[i + 2] ?? 0) * damp;
        arr[i] = (arr[i] ?? 0) + (sys.velocities[i] ?? 0) * dt;
        arr[i + 1] = (arr[i + 1] ?? 0) + (sys.velocities[i + 1] ?? 0) * dt;
        arr[i + 2] = (arr[i + 2] ?? 0) + (sys.velocities[i + 2] ?? 0) * dt;
      }
      pos.needsUpdate = true;
      const mat = sys.points.material as PointsMaterial;
      mat.opacity = p.opacity * (sys.meteor ? 1 : Math.min(1, (1 - u) * 1.6));
    }

    const live = new Set<InstancedMesh>();
    for (const p of debris) {
      const mesh = debrisMeshes.current.get(p.piece);
      if (!p.active) {
        if (mesh && p.t >= 0) {
          // Parked out of sight once, not every frame.
          dummy.position.set(0, -9999, 0);
          dummy.scale.setScalar(0.0001);
          dummy.updateMatrix();
          mesh.setMatrixAt(p.slot, dummy.matrix);
          mesh.instanceMatrix.needsUpdate = true;
          p.t = -1;
        }
        continue;
      }
      p.t += dt;
      // Loose pages and leaves drift down on the air; everything else falls.
      const paper = FLUTTERING.has(p.piece);
      p.velocity.y -= (paper ? 3 : 12) * dt;
      if (paper) p.velocity.multiplyScalar(Math.exp(-1.6 * dt));
      p.position.addScaledVector(p.velocity, dt);
      if (p.position.y < p.floor) {
        // One soft bounce, then settle and shrink away.
        p.position.y = p.floor;
        p.velocity.y = Math.abs(p.velocity.y) * 0.3;
        p.velocity.x *= 0.5;
        p.velocity.z *= 0.5;
        p.spin.multiplyScalar(0.5);
      }
      p.rotation.addScaledVector(p.spin, dt);
      const fade = p.t > p.life - 0.5 ? Math.max(0, (p.life - p.t) / 0.5) : 1;
      if (p.t >= p.life) p.active = false;
      if (!mesh) continue;
      dummy.position.copy(p.position);
      dummy.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
      dummy.scale.setScalar(p.size * fade);
      dummy.updateMatrix();
      mesh.setMatrixAt(p.slot, dummy.matrix);
      mesh.instanceMatrix.needsUpdate = true;
      live.add(mesh);
    }
    for (const mesh of debrisMeshes.current.values()) {
      mesh.visible = live.has(mesh);
      for (const other of followers.get(mesh) ?? []) other.visible = mesh.visible;
    }

    for (const p of pillars.current) {
      if (!p.active) continue;
      p.t += dt;
      const u = p.t / p.life;
      if (u >= 1) {
        p.active = false;
        p.mesh.visible = false;
        continue;
      }
      const grow = Math.min(1, p.t / 0.45);
      // A rendered shaft of light (glow.tsx beam texture) turned to face the camera, 80 m tall.
      p.mesh.rotation.set(0, Math.atan2(state.camera.position.x - p.mesh.position.x, state.camera.position.z - p.mesh.position.z), 0);
      p.mesh.scale.set(2.6 * p.scale * (1 + Math.sin(p.t * 9) * 0.06), 80 * grow, 1);
      (p.mesh.material as MeshBasicMaterial).opacity = 0.75 * Math.min(1, (1 - u) * 2.5);
    }
    const flock = flockRef.current;
    if (flock) {
      let any = false;
      birds.forEach((b, i) => {
        if (!b.active) {
          dummy.position.set(0, -9999, 0);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.setScalar(0.0001);
          dummy.updateMatrix();
          for (const m of [flock.body, ...flock.wings]) m.setMatrixAt(i, dummy.matrix);
          return;
        }
        any = true;
        b.t += dt;
        if (b.t >= b.life) b.active = false;
        // Startled take-off: climb steeply, then level out and scatter.
        b.velocity.y = Math.max(1, b.velocity.y - 2.5 * dt);
        b.position.addScaledVector(b.velocity, dt);
        b.flap += dt * 22;
        // Heading along its flight, nose raised while it climbs; the wings beat at the shoulders.
        dummy.position.copy(b.position);
        dummy.rotation.set(-0.6 * Math.atan2(b.velocity.y, Math.hypot(b.velocity.x, b.velocity.z)), Math.atan2(b.velocity.x, b.velocity.z), 0, 'YXZ');
        dummy.scale.setScalar(BIRD_SIZE);
        dummy.updateMatrix();
        flock.body.setMatrixAt(i, dummy.matrix);
        const lift = 0.2 + 0.65 * Math.sin(b.flap);
        flock.wings.forEach((wing, side) => {
          wingMatrix.makeRotationZ(side === 0 ? -lift : lift).setPosition(flock.shoulders[side] ?? dummy.position);
          wing.setMatrixAt(i, wingMatrix.premultiply(dummy.matrix));
        });
      });
      for (const m of [flock.body, ...flock.wings]) {
        m.instanceMatrix.needsUpdate = true;
        m.visible = any;
      }
    }

    for (const b of bolts) {
      if (!b.active) continue;
      b.t += dt;
      if (b.t > 0.45) {
        b.active = false;
        b.mesh.visible = false;
        continue;
      }
      // Along the strike, turned about it to face the camera, flickering for a crackling strike.
      placeStreak(b.mesh, b.from, b.to, 1, state.camera.position);
      // The streak card runs along its X axis; the painting stands upright, so it is turned a quarter.
      const length = b.from.distanceTo(b.to);
      b.mesh.scale.set(length, length * BOLT_ASPECT * ((b.mesh.userData.flip as number | undefined) ?? 1), 1);
      (b.mesh.material as MeshBasicMaterial).opacity = Math.random() > 0.3 ? 1 : 0.25;
    }
  });

  return (
    <group>
      {systems.map((sys, i) => (
        <primitive key={`p${i}`} object={sys.points} />
      ))}
      {/* Modelled debris, streamed in on its own so a slow load never holds up the game. */}
      <Suspense fallback={null}>
        <DebrisModels meshes={debrisMeshes} />
      </Suspense>
      {Array.from({ length: PILLARS }, (_, i) => (
        <mesh
          key={`c${i}`}
          visible={false}
          ref={(m) => {
            if (m) pillars.current[i] = pillars.current[i] ?? { active: false, t: 0, life: 1, scale: 1, mesh: m };
          }}
        >
          <primitive object={pillarGeometry} attach="geometry" />
          <meshBasicMaterial map={pillarTexture} color="#ffe6a0" transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {bolts.map((b, i) => (
        <primitive key={`b${i}`} object={b.mesh} />
      ))}
      <Suspense fallback={null}>
        <BirdModels flock={flockRef} />
      </Suspense>
    </group>
  );
}

/** One instanced mesh per modelled debris piece (public/assets/props/fx_debris.glb), registered by name. */
function DebrisModels({ meshes: registry }: { meshes: RefObject<Map<string, InstancedMesh>> }) {
  const { scene } = useGLTF(propUrl('fx_debris'));
  const parts = useMemo(
    () =>
      PIECE_NAMES.flatMap((name) => {
        const node = scene.getObjectByName(name);
        // A piece with several materials (a book's cover and pages) is a group of meshes in the GLB.
        const found: Mesh[] = [];
        node?.traverse((o) => {
          if ((o as Mesh).isMesh) found.push(o as Mesh);
        });
        return found.map((m, i) => ({ key: `${name}:${i}`, name, geometry: m.geometry, material: m.material }));
      }),
    [scene],
  );
  return (
    <>
      {parts.map((part) => (
        <instancedMesh
          key={part.key}
          args={[part.geometry, part.material, PER_PIECE]}
          frustumCulled={false}
          visible={false}
          castShadow
          ref={(mesh) => {
            if (!mesh) return;
            const meshes = registry.current;
            // Every part of a piece follows the same instances; the first registered drives them all.
            const existing = meshes.get(part.name);
            if (!existing) {
              for (let i = 0; i < PER_PIECE; i++) mesh.setColorAt(i, WHITE);
              meshes.set(part.name, mesh);
            } else if (existing !== mesh) {
              mesh.instanceMatrix = existing.instanceMatrix;
              mesh.instanceColor = existing.instanceColor;
              followers.set(existing, [...(followers.get(existing) ?? []).filter((m) => m !== mesh), mesh]);
            }
          }}
        />
      ))}
    </>
  );
}

/** The scattering doves: a body and two wings, each wing posed at its shoulder. */
interface Flock {
  body: InstancedMesh;
  wings: InstancedMesh[];
  shoulders: Vector3[];
}

/** The dove (fx_debris.glb bird_body, bird_wing_l, bird_wing_r) as three instanced meshes. */
function BirdModels({ flock }: { flock: RefObject<Flock | null> }) {
  const { scene } = useGLTF(propUrl('fx_debris'));
  const made = useMemo<Flock>(() => {
    const part = (name: string) => {
      const node = scene.getObjectByName(name) as Mesh | undefined;
      const mesh = new InstancedMesh(node?.geometry, node?.material, BIRDS);
      mesh.frustumCulled = false;
      mesh.visible = false;
      return { mesh, at: node?.position.clone() ?? new Vector3() };
    };
    const [body, left, right] = [part('bird_body'), part('bird_wing_l'), part('bird_wing_r')];
    return { body: body.mesh, wings: [left.mesh, right.mesh], shoulders: [left.at, right.at] };
  }, [scene]);
  useEffect(() => {
    flock.current = made;
    return () => {
      flock.current = null;
    };
  }, [flock, made]);
  return (
    <>
      {[made.body, ...made.wings].map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </>
  );
}

const WHITE = new Color('#ffffff');
/** Extra meshes of multi-material pieces, shown and hidden with their piece's first mesh. */
const followers = new Map<InstancedMesh, InstancedMesh[]>();

// Loaded with the rest of the game behind the loading screen, so the first debris is already modelled.
useGLTF.preload(propUrl('fx_debris'));
