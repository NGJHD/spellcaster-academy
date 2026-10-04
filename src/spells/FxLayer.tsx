/**
 * Spectacle layer (CLAUDE.md §1B "Destruction", "Surprise entrances", "Big moments"): pooled,
 * bounded effects for FxEvents from the run — magical bursts, tumbling debris, dust, ink geysers,
 * leaves, glass, shockwaves, light pillars, meteors, lightning and fireworks. Purely cosmetic.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  DynamicDrawUsage,
  type InstancedMesh,
  Line,
  LineBasicMaterial,
  MeshBasicMaterial,
  NormalBlending,
  Object3D,
  Points,
  PointsMaterial,
  Vector3,
  type Mesh,
} from 'three';
import type { FxEvent } from '../game/GameRun';
import type { FxKind } from '../level/levelTypes';
import { getRun } from '../state/gameStore';

const SYSTEMS = 28;
const PARTICLES = 160;
const DEBRIS = 220;
const RINGS = 6;
const PILLARS = 4;
const BOLTS = 3;
const BOLT_POINTS = 14;

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
}

const PRESETS: Partial<Record<FxKind, ParticlePreset>> = {
  burst: { count: 140, speed: [3, 7], lift: 1, spread: 1, gravity: -2.5, drag: 1.6, life: 1.1, size: 0.16, color: '#ffe08a', additive: true, opacity: 1, jitter: 0.1 },
  sparks: { count: 70, speed: [4, 9], lift: 2, spread: 1, gravity: -11, drag: 0.6, life: 0.8, size: 0.07, color: '#ffd27a', additive: true, opacity: 1, jitter: 0.05 },
  dust: { count: 90, speed: [0.8, 2.6], lift: 0.4, spread: 0.9, gravity: 0.25, drag: 1.4, life: 1.8, size: 0.7, color: '#d9c7a4', additive: false, opacity: 0.42, jitter: 0.6 },
  geyser: { count: 150, speed: [1, 2.5], lift: 8, spread: 0.25, gravity: -9, drag: 0.2, life: 1.7, size: 0.2, color: '#3b3f8f', additive: false, opacity: 0.9, jitter: 0.2 },
  leaves: { count: 90, speed: [2, 5], lift: 2.5, spread: 1, gravity: -1.3, drag: 1.2, life: 2.4, size: 0.16, color: '#8fcf5a', additive: false, opacity: 1, jitter: 0.4 },
  meteors: { count: 36, speed: [0, 0.5], lift: 0, spread: 1, gravity: 0, drag: 0, life: 2.6, size: 0.9, color: '#ffe3a0', additive: true, opacity: 1, jitter: 0 },
};

/** Debris presets: count, size, tint, whether it is glass. */
const DEBRIS_PRESETS: Partial<Record<FxKind, { count: number; size: number; color: string; speed: number }>> = {
  debris: { count: 26, size: 0.22, color: '#8a6440', speed: 6 },
  glass: { count: 34, size: 0.18, color: '#cfeaff', speed: 5 },
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
  active: boolean;
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
  line: Line;
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
  const debris = useMemo<DebrisPiece[]>(
    () =>
      Array.from({ length: DEBRIS }, () => ({
        active: false,
        t: 0,
        life: 2,
        floor: 0,
        position: new Vector3(),
        velocity: new Vector3(),
        rotation: new Vector3(),
        spin: new Vector3(),
        size: 0.2,
      })),
    [],
  );
  // Pillars rise from their base: the cylinder is shifted up so scaling Y grows it skyward.
  const pillarGeometry = useMemo(() => new CylinderGeometry(0.7, 0.9, 80, 24, 1, true).translate(0, 40, 0), []);
  const rings = useRef<TimedMesh[]>([]);
  const pillars = useRef<TimedMesh[]>([]);
  const bolts = useMemo<Bolt[]>(
    () =>
      Array.from({ length: BOLTS }, () => {
        const geo = new BufferGeometry();
        geo.setAttribute('position', new BufferAttribute(new Float32Array(BOLT_POINTS * 3), 3));
        const line = new Line(geo, new LineBasicMaterial({ color: '#f2f6ff', toneMapped: false, transparent: true }));
        line.frustumCulled = false;
        line.visible = false;
        return { active: false, t: 0, from: new Vector3(), to: new Vector3(), line };
      }),
    [],
  );
  const debrisRef = useRef<InstancedMesh>(null);
  const seen = useRef(0);
  const scheduled = useRef<{ inSec: number; event: FxEvent }[]>([]);
  const dummy = useMemo(() => new Object3D(), []);
  const colour = useMemo(() => new Color(), []);

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
      const y = 1 - Math.random() * (1 + preset.spread);
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

  const startDebris = (kind: FxKind, origin: Vector3, scale: number, color?: string) => {
    const preset = DEBRIS_PRESETS[kind];
    if (!preset) return;
    const mesh = debrisRef.current;
    const count = Math.round(preset.count * Math.min(1.8, Math.max(0.5, scale)));
    let made = 0;
    for (const p of debris) {
      if (made >= count) break;
      if (p.active) continue;
      made++;
      p.active = true;
      p.t = 0;
      p.life = 2.2 + Math.random() * 0.8;
      p.floor = origin.y - 2.5;
      p.position.copy(origin).add(new Vector3((Math.random() - 0.5) * 0.6, Math.random() * 0.5, (Math.random() - 0.5) * 0.6));
      const a = Math.random() * Math.PI * 2;
      const speed = preset.speed * (0.4 + Math.random() * 0.8) * Math.sqrt(scale);
      p.velocity.set(Math.cos(a) * speed, 2 + Math.random() * 4, Math.sin(a) * speed);
      p.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      p.spin.set((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14);
      p.size = preset.size * (0.5 + Math.random()) * Math.sqrt(scale);
      if (mesh) {
        colour.set(color ?? preset.color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
        mesh.setColorAt(debris.indexOf(p), colour);
      }
    }
    if (mesh?.instanceColor) mesh.instanceColor.needsUpdate = true;
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
    b.line.visible = true;
  };

  const play = (e: FxEvent) => {
    const scale = e.scale;
    switch (e.kind) {
      case 'debris':
      case 'glass':
        startDebris(e.kind, e.position, scale, e.color);
        startParticles(PRESETS.dust as ParticlePreset, e.position, scale * 0.6);
        break;
      case 'shockwave':
        startTimed(rings.current, e.position, scale, 0.9, e.color);
        startParticles(PRESETS.sparks as ParticlePreset, e.position, scale, e.color);
        break;
      case 'pillar':
        startTimed(pillars.current, e.position, scale, 3.2, e.color);
        startParticles(PRESETS.burst as ParticlePreset, e.position, scale, e.color);
        break;
      case 'lightning':
        startBolt(e.position);
        break;
      case 'meteors':
        startParticles(PRESETS.meteors as ParticlePreset, e.position, scale, e.color, true);
        break;
      case 'fireworks':
        // A volley of coloured shells: each bursts high above the cue position.
        for (let i = 0; i < 4; i++) {
          const at = e.position.clone().add(new Vector3((Math.random() - 0.5) * 16 * scale, 10 + Math.random() * 8, (Math.random() - 0.5) * 6));
          scheduled.current.push({
            inSec: i * 0.35 + Math.random() * 0.15,
            event: { ...e, kind: 'burst', position: at, scale: 2.6 * scale, color: e.color ?? FIREWORK_COLOURS[(Math.random() * FIREWORK_COLOURS.length) | 0] },
          });
        }
        break;
      default: {
        const preset = PRESETS[e.kind];
        if (preset) startParticles(preset, e.position, scale, e.color);
      }
    }
  };

  useFrame((_, delta) => {
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

    const mesh = debrisRef.current;
    if (mesh) {
      let any = false;
      debris.forEach((p, i) => {
        if (!p.active) {
          dummy.position.set(0, -9999, 0);
          dummy.scale.setScalar(0.0001);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          return;
        }
        any = true;
        p.t += dt;
        p.velocity.y -= 12 * dt;
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
        dummy.position.copy(p.position);
        dummy.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
        dummy.scale.set(p.size * fade, p.size * 0.6 * fade, p.size * 0.35 * fade);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.visible = any;
    }

    for (const r of rings.current) {
      if (!r.active) continue;
      r.t += dt;
      const u = r.t / r.life;
      if (u >= 1) {
        r.active = false;
        r.mesh.visible = false;
        continue;
      }
      const eased = 1 - (1 - u) ** 3;
      r.mesh.scale.setScalar(0.2 + eased * 9 * r.scale);
      (r.mesh.material as MeshBasicMaterial).opacity = 0.85 * (1 - u);
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
      p.mesh.scale.set(p.scale * (1 + Math.sin(p.t * 9) * 0.06), grow, p.scale * (1 + Math.sin(p.t * 9) * 0.06));
      (p.mesh.material as MeshBasicMaterial).opacity = 0.75 * Math.min(1, (1 - u) * 2.5);
    }
    for (const b of bolts) {
      if (!b.active) continue;
      b.t += dt;
      if (b.t > 0.45) {
        b.active = false;
        b.line.visible = false;
        continue;
      }
      // Re-jag every frame and flicker for a crackling strike.
      const pos = b.line.geometry.getAttribute('position') as BufferAttribute;
      const arr = pos.array as Float32Array;
      for (let k = 0; k < BOLT_POINTS; k++) {
        const u = k / (BOLT_POINTS - 1);
        const j = k === 0 || k === BOLT_POINTS - 1 ? 0 : 3.5;
        arr[k * 3] = b.from.x + (b.to.x - b.from.x) * u + (Math.random() - 0.5) * j;
        arr[k * 3 + 1] = b.from.y + (b.to.y - b.from.y) * u;
        arr[k * 3 + 2] = b.from.z + (b.to.z - b.from.z) * u + (Math.random() - 0.5) * j;
      }
      pos.needsUpdate = true;
      (b.line.material as LineBasicMaterial).opacity = Math.random() > 0.3 ? 1 : 0.2;
    }
  });

  return (
    <group>
      {systems.map((sys, i) => (
        <primitive key={`p${i}`} object={sys.points} />
      ))}
      <instancedMesh ref={debrisRef} args={[undefined, undefined, DEBRIS]} frustumCulled={false} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.55} metalness={0.05} />
      </instancedMesh>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={`r${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
          ref={(m) => {
            if (m) rings.current[i] = rings.current[i] ?? { active: false, t: 0, life: 1, scale: 1, mesh: m };
          }}
        >
          <ringGeometry args={[0.8, 1, 64]} />
          <meshBasicMaterial color="#ffe6a0" transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {Array.from({ length: PILLARS }, (_, i) => (
        <mesh
          key={`c${i}`}
          visible={false}
          ref={(m) => {
            if (m) pillars.current[i] = pillars.current[i] ?? { active: false, t: 0, life: 1, scale: 1, mesh: m };
          }}
        >
          <primitive object={pillarGeometry} attach="geometry" />
          <meshBasicMaterial color="#ffe6a0" transparent opacity={0} side={DoubleSide} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {bolts.map((b, i) => (
        <primitive key={`b${i}`} object={b.line} />
      ))}
    </group>
  );
}
