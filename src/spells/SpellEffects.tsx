import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Line,
  LineBasicMaterial,
  Points,
  PointsMaterial,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three';
import { PROJECTILE_SEC } from '../enemies/EnemyBrain';
import { getRun } from '../state/gameStore';
import { castSignal, wandTip } from '../player/Wand';

const POOL = 10;
const TRAIL = 7;
const BURSTS = 8;
const BURST_PARTICLES = 28;
const BURST_SEC = 0.55;
const CHAIN_SEC = 0.35;

/** Trail colours by cosmetic (§7.3 Starlight, §7.6 Verdant). */
const TRAILS: Record<string, { core: string; halo: string }> = {
  default: { core: '#fff1c2', halo: '#7fc8ff' },
  'trail-starlight': { core: '#ffffff', halo: '#ffe08a' },
  'trail-verdant': { core: '#eaffd8', halo: '#6fe39a' },
  'trail-inkwell': { core: '#dce6ff', halo: '#3a5cff' },
  frost: { core: '#f2fbff', halo: '#8fd8ff' },
};

interface Projectile {
  active: boolean;
  t: number;
  from: Vector3;
  to: Vector3;
  arc: Vector3;
  history: Vector3[];
  color: { core: Color; halo: Color };
  /** 0–1: grows with the combo, making the bolt bigger and the burst wider. */
  power: number;
}

interface Burst {
  active: boolean;
  t: number;
  origin: Vector3;
  velocities: Float32Array;
}

/**
 * Pooled spell visuals: projectiles from the wand tip, sparkle bursts on impact, and Chain Spark
 * arcs. No allocation per cast; effects never linger over a word for more than ~250 ms (§10).
 */
export function SpellEffects() {
  const projectiles = useMemo<Projectile[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        active: false,
        t: 0,
        from: new Vector3(),
        to: new Vector3(),
        arc: new Vector3(),
        history: Array.from({ length: TRAIL }, () => new Vector3()),
        color: { core: new Color(), halo: new Color() },
        power: 0,
      })),
    [],
  );
  const bursts = useMemo<Burst[]>(
    () =>
      Array.from({ length: BURSTS }, () => ({
        active: false,
        t: 0,
        origin: new Vector3(),
        velocities: new Float32Array(BURST_PARTICLES * 3),
      })),
    [],
  );
  const burstPoints = useMemo(
    () =>
      bursts.map(() => {
        const geo = new BufferGeometry();
        geo.setAttribute('position', new BufferAttribute(new Float32Array(BURST_PARTICLES * 3), 3));
        const mat = new PointsMaterial({
          color: '#ffe7a3',
          size: 0.06,
          transparent: true,
          opacity: 1,
          depthWrite: false,
          blending: AdditiveBlending,
        });
        const pts = new Points(geo, mat);
        pts.frustumCulled = false;
        pts.visible = false;
        return pts;
      }),
    [bursts],
  );
  const chains = useMemo(
    () =>
      Array.from({ length: 4 }, () => {
        const geo = new BufferGeometry();
        geo.setAttribute('position', new BufferAttribute(new Float32Array(10 * 3), 3));
        const line = new Line(geo, new LineBasicMaterial({ color: '#9ff4ff', toneMapped: false }));
        line.frustumCulled = false;
        line.visible = false;
        return { line, t: 99 };
      }),
    [],
  );
  const projectileMeshes = useRef<(Group | null)[]>([]);
  const seen = useRef(0);

  useFrame((_, delta) => {
    const run = getRun();
    if (!run) return;
    const trailKey = run.trail ?? 'default';

    // Consume new spell events.
    while (run.spellEvents.length > 0) {
      const e = run.spellEvents.shift();
      if (!e || e.key <= seen.current) continue;
      seen.current = e.key;
      const target = run.findTarget(e.targetId);
      const to = e.to.clone();
      to.y += (target?.spawn.labelHeight ?? 1) * 0.45;
      if (e.kind === 'chain') {
        startChain(chains, wandTip, to);
        startBurst(bursts, to, false);
        continue;
      }
      castSignal.time = 0;
      const p = projectiles.find((x) => !x.active);
      if (!p) continue;
      p.active = true;
      p.t = 0;
      p.from.copy(wandTip);
      p.to.copy(to);
      p.arc.set((Math.random() - 0.5) * 0.4, 0.35 + Math.random() * 0.2, 0);
      p.power = e.power ?? 0;
      for (const h of p.history) h.copy(wandTip);
      const palette = TRAILS[e.kind === 'frost' ? 'frost' : trailKey] ?? TRAILS.default;
      if (palette) {
        p.color.core.set(palette.core);
        p.color.halo.set(palette.halo);
      }
    }

    projectiles.forEach((p, i) => {
      const g = projectileMeshes.current[i];
      if (!g) return;
      if (!p.active) {
        g.visible = false;
        return;
      }
      p.t += delta;
      const u = Math.min(1, p.t / PROJECTILE_SEC);
      const pos = g.children[0]?.position ?? new Vector3();
      pos.lerpVectors(p.from, p.to, u);
      pos.addScaledVector(p.arc, Math.sin(u * Math.PI));
      for (let k = TRAIL - 1; k > 0; k--) p.history[k]?.copy(p.history[k - 1] ?? pos);
      p.history[0]?.copy(pos);
      g.visible = true;
      g.children.forEach((child, k) => {
        if (k === 0) {
          const mat = (child as Mesh).material as MeshBasicMaterial;
          mat.color.copy(p.color.core);
          child.scale.setScalar(1 + p.power * 1.4);
          return;
        }
        const h = p.history[k - 1];
        if (h) child.position.copy(h);
        const mat = (child as Mesh).material as MeshBasicMaterial;
        mat.color.copy(p.color.halo);
        mat.opacity = 0.5 * (1 - k / (TRAIL + 1));
        child.scale.setScalar((1 - k / (TRAIL + 2)) * (1 + p.power * 1.4));
      });
      if (u >= 1) {
        p.active = false;
        startBurst(bursts, p.to, false, p.color.halo, p.power);
      }
    });

    bursts.forEach((b, i) => {
      const pts = burstPoints[i];
      if (!pts) return;
      if (!b.active) {
        pts.visible = false;
        return;
      }
      b.t += delta;
      const u = b.t / BURST_SEC;
      if (u >= 1) {
        b.active = false;
        pts.visible = false;
        return;
      }
      pts.visible = true;
      const arr = (pts.geometry.getAttribute('position') as BufferAttribute).array as Float32Array;
      for (let k = 0; k < BURST_PARTICLES; k++) {
        const ease = 1 - (1 - u) ** 2;
        arr[k * 3] = b.origin.x + (b.velocities[k * 3] ?? 0) * ease;
        arr[k * 3 + 1] = b.origin.y + (b.velocities[k * 3 + 1] ?? 0) * ease - 0.3 * u * u;
        arr[k * 3 + 2] = b.origin.z + (b.velocities[k * 3 + 2] ?? 0) * ease;
      }
      pts.geometry.getAttribute('position').needsUpdate = true;
      (pts.material as PointsMaterial).opacity = 1 - u;
    });

    for (const c of chains) {
      c.t += delta;
      c.line.visible = c.t < CHAIN_SEC;
    }
  });

  return (
    <group name="spell-effects">
      {projectiles.map((_, i) => (
        <group key={i} ref={(g) => void (projectileMeshes.current[i] = g)} visible={false}>
          <mesh>
            <sphereGeometry args={[0.07, 14, 10]} />
            <meshBasicMaterial color="#fff1c2" toneMapped={false} />
          </mesh>
          {Array.from({ length: TRAIL }, (_, k) => (
            <mesh key={k}>
              <sphereGeometry args={[0.09, 10, 8]} />
              <meshBasicMaterial color="#7fc8ff" transparent opacity={0.4} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
      {burstPoints.map((p, i) => (
        <primitive key={`burst-${i}`} object={p} />
      ))}
      {chains.map((c, i) => (
        <primitive key={`chain-${i}`} object={c.line} />
      ))}
    </group>
  );
}

function startBurst(bursts: Burst[], origin: Vector3, reduced: boolean, color?: Color, power = 0): void {
  const b = bursts.find((x) => !x.active) ?? bursts[0];
  if (!b) return;
  b.active = true;
  b.t = 0;
  b.origin.copy(origin);
  const count = reduced ? 10 : BURST_PARTICLES;
  for (let k = 0; k < BURST_PARTICLES; k++) {
    const live = k < count;
    const a = Math.random() * Math.PI * 2;
    const y = Math.random() * 2 - 1;
    const r = Math.sqrt(1 - y * y);
    const speed = live ? (0.4 + Math.random() * 0.5) * (1 + power * 1.5) : 0;
    b.velocities[k * 3] = Math.cos(a) * r * speed;
    b.velocities[k * 3 + 1] = y * speed + (live ? 0.2 : 0);
    b.velocities[k * 3 + 2] = Math.sin(a) * r * speed;
  }
  void color;
}

function startChain(chains: { line: Line; t: number }[], from: Vector3, to: Vector3): void {
  const c = chains.find((x) => x.t >= CHAIN_SEC) ?? chains[0];
  if (!c) return;
  c.t = 0;
  const attr = c.line.geometry.getAttribute('position') as BufferAttribute;
  const arr = attr.array as Float32Array;
  const n = arr.length / 3;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const jitter = i === 0 || i === n - 1 ? 0 : 0.18;
    arr[i * 3] = from.x + (to.x - from.x) * u + (Math.random() - 0.5) * jitter;
    arr[i * 3 + 1] = from.y + (to.y - from.y) * u + (Math.random() - 0.5) * jitter;
    arr[i * 3 + 2] = from.z + (to.z - from.z) * u + (Math.random() - 0.5) * jitter;
  }
  attr.needsUpdate = true;
  c.line.visible = true;
}
