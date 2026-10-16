import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  MeshBasicMaterial as BasicMaterial,
  Points,
  Sprite,
  SpriteMaterial,
  PointsMaterial,
  Vector3,
  type Group,
  type Mesh,
} from 'three';
import { PROJECTILE_SEC } from '../enemies/EnemyBrain';
import { getRun } from '../state/gameStore';
import { castSignal, wandTip } from '../player/Wand';
import { glintTexture, glowTexture, placeStreak, STREAK_GEOMETRY, streakTexture } from '../scene/glow';

const POOL = 10;
const TRAIL = 7;
const BURSTS = 8;
const BURST_PARTICLES = 28;
const BURST_SEC = 0.55;
/** A Chain Spark bolt: it races from the struck foe to the next in CHAIN_TRAVEL, then fades. */
const CHAIN_SEC = 0.6;
const CHAIN_TRAVEL = 0.22;
const CHAIN_BEADS = 22;

interface ChainBolt {
  group: Group | null;
  beads: (Sprite | null)[];
  material: SpriteMaterial;
  path: Vector3[];
  to: Vector3;
  t: number;
  landed: boolean;
}

/** Trail colours by cosmetic (§7.3 Starlight, §7.6 Verdant). */
const TRAILS: Record<string, { core: string; halo: string }> = {
  default: { core: '#fff1c2', halo: '#7fc8ff' },
  'trail-starlight': { core: '#ffffff', halo: '#ffe08a' },
  'trail-verdant': { core: '#eaffd8', halo: '#6fe39a' },
  'trail-inkwell': { core: '#dce6ff', halo: '#3a5cff' },
  'trail-bright-quill': { core: '#fff6d8', halo: '#ffb640' },
  'trail-prism': { core: '#ffffff', halo: '#ff6ad5' },
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

interface ProjectileVisual {
  group: Group | null;
  core: Sprite | null;
  halo: Sprite | null;
  flare: Sprite | null;
  streak: Mesh | null;
  coreMat: SpriteMaterial;
  haloMat: SpriteMaterial;
  flareMat: SpriteMaterial;
  streakMat: BasicMaterial;
}

const head = new Vector3();
const tail = new Vector3();

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
          // Soft round glows (square points looked blocky).
          map: glowTexture(),
          size: 0.14,
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
  const chains = useMemo<ChainBolt[]>(
    () =>
      Array.from({ length: 6 }, () => ({
        group: null,
        beads: [],
        material: new SpriteMaterial({ map: glowTexture(), color: '#9ff4ff', transparent: true, opacity: 1, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
        path: Array.from({ length: CHAIN_BEADS }, () => new Vector3()),
        to: new Vector3(),
        t: 99,
        landed: true,
      })),
    [],
  );
  // Each projectile: a white-hot core, a coloured halo, a turning star flare and a streak behind it.
  const projectileVisuals = useMemo<ProjectileVisual[]>(
    () =>
      projectiles.map(() => ({
        group: null,
        core: null,
        halo: null,
        flare: null,
        streak: null,
        coreMat: new SpriteMaterial({ map: glowTexture(), color: '#ffffff', blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
        haloMat: new SpriteMaterial({ map: glowTexture(), color: '#7fc8ff', opacity: 0.8, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
        flareMat: new SpriteMaterial({ map: glintTexture(), color: '#7fc8ff', opacity: 0.9, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
        streakMat: new BasicMaterial({ map: streakTexture(), color: '#7fc8ff', transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }),
      })),
    [projectiles],
  );
  const seen = useRef(0);

  useFrame(({ camera }, delta) => {
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
        // Owner (2026-10-08): the next foe "suddenly died". The bolt now jumps visibly from the foe
        // that was hit to the next one, and bursts where it lands.
        const from = e.from ? e.from.clone() : wandTip.clone();
        if (e.from) from.y += 0.5;
        startChain(chains, from, to);
        continue;
      }
      castSignal.time = 0;
      const p = projectiles.find((x) => !x.active);
      if (!p) continue;
      p.active = true;
      p.t = 0;
      p.from.copy(wandTip);
      p.to.copy(to);
      // Owner (2026-10-08): straight from the wand to the target, not lobbed like artillery.
      p.arc.set(0, 0, 0);
      p.power = e.power ?? 0;
      for (const h of p.history) h.copy(wandTip);
      const palette = TRAILS[e.kind === 'frost' ? 'frost' : trailKey] ?? TRAILS.default;
      if (palette) {
        p.color.core.set(palette.core);
        p.color.halo.set(palette.halo);
      }
    }

    projectiles.forEach((p, i) => {
      const v = projectileVisuals[i];
      if (!v || !v.group) return;
      if (!p.active) {
        v.group.visible = false;
        return;
      }
      p.t += delta;
      const u = Math.min(1, p.t / PROJECTILE_SEC);
      head.lerpVectors(p.from, p.to, u);
      tail.lerpVectors(p.from, p.to, Math.max(0, u - 0.35));
      v.group.visible = true;
      const size = 1 + p.power * 1.4;
      v.coreMat.color.copy(p.color.core);
      v.haloMat.color.copy(p.color.halo);
      v.flareMat.color.copy(p.color.halo);
      v.streakMat.color.copy(p.color.halo);
      v.core?.position.copy(head);
      v.core?.scale.setScalar(0.22 * size);
      v.halo?.position.copy(head);
      v.halo?.scale.setScalar(0.6 * size);
      if (v.flare) {
        v.flare.position.copy(head);
        v.flare.scale.setScalar(0.5 * size);
        v.flareMat.rotation = p.t * 9;
      }
      if (v.streak) placeStreak(v.streak, tail, head, 0.07 * size, camera.position);
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
      const live = c.t < CHAIN_SEC;
      if (c.group) c.group.visible = live;
      if (!live) continue;
      const head = Math.min(1, c.t / CHAIN_TRAVEL);
      c.material.opacity = c.t < CHAIN_TRAVEL ? 1 : Math.max(0, 1 - (c.t - CHAIN_TRAVEL) / (CHAIN_SEC - CHAIN_TRAVEL));
      c.beads.forEach((m, i) => {
        if (!m) return;
        const u = i / (CHAIN_BEADS - 1);
        m.visible = u <= head;
        const p = c.path[i];
        if (p) m.position.set(p.x + (Math.random() - 0.5) * 0.05, p.y + (Math.random() - 0.5) * 0.05, p.z + (Math.random() - 0.5) * 0.05);
        // A bright head races ahead of a crackling trail.
        const atHead = Math.abs(u - head) < 0.08 && head < 1;
        m.scale.setScalar(atHead ? 0.38 : 0.16 + Math.random() * 0.08);
      });
      if (!c.landed && head >= 1) {
        c.landed = true;
        startBurst(bursts, c.to, false, undefined, 0.6);
      }
    }
  });

  return (
    <group name="spell-effects">
      {projectileVisuals.map((v, i) => (
        <group key={i} ref={(g) => void (v.group = g)} visible={false}>
          <mesh ref={(m) => void (v.streak = m)} geometry={STREAK_GEOMETRY} material={v.streakMat} frustumCulled={false} />
          <sprite ref={(m) => void (v.halo = m)} material={v.haloMat} />
          <sprite ref={(m) => void (v.flare = m)} material={v.flareMat} />
          <sprite ref={(m) => void (v.core = m)} material={v.coreMat} />
        </group>
      ))}
      {burstPoints.map((p, i) => (
        <primitive key={`burst-${i}`} object={p} />
      ))}
      {chains.map((c, i) => (
        <group key={`chain-${i}`} ref={(g) => void (c.group = g)} visible={false}>
          {Array.from({ length: CHAIN_BEADS }, (_, k) => (
            <sprite key={k} ref={(m) => void (c.beads[k] = m)} material={c.material} frustumCulled={false} />
          ))}
        </group>
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

/** A jagged, arcing lightning path from one foe to the next. */
function startChain(chains: ChainBolt[], from: Vector3, to: Vector3): void {
  const c = chains.find((x) => x.t >= CHAIN_SEC) ?? chains[0];
  if (!c) return;
  c.t = 0;
  c.landed = false;
  c.to.copy(to);
  const span = from.distanceTo(to);
  for (let i = 0; i < CHAIN_BEADS; i++) {
    const u = i / (CHAIN_BEADS - 1);
    const jag = i === 0 || i === CHAIN_BEADS - 1 ? 0 : 0.12 + span * 0.04;
    c.path[i]?.set(
      from.x + (to.x - from.x) * u + (Math.random() - 0.5) * jag,
      from.y + (to.y - from.y) * u + Math.sin(u * Math.PI) * Math.min(1.2, span * 0.25) + (Math.random() - 0.5) * jag,
      from.z + (to.z - from.z) * u + (Math.random() - 0.5) * jag,
    );
  }
}
