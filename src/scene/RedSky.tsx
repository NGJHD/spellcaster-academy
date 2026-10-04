/**
 * Level 2 and 3 skies (CLAUDE.md §5 visual tone): a gradient sky dome plus drifting embers or ash
 * around the camera. 'inferno' is the burning siege night (black overhead, a red-orange fire glow along
 * the horizon); 'blank' is the red sky over the scorched Blank that never darkens.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { getRun } from '../state/gameStore';
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, CurvePath, LineCurve3, NormalBlending, SphereGeometry, TubeGeometry, Vector3, type Group, type MeshBasicMaterial, type Points } from 'three';

const PALETTES = {
  inferno: { zenith: '#050204', mid: '#2a0806', horizon: '#ff4a12', glow: 0.55 },
  blank: { zenith: '#3a0806', mid: '#9a2210', horizon: '#ff7a3a', glow: 0.75 },
} as const;

export function RedSky({ kind }: { kind: 'inferno' | 'blank' }) {
  const geometry = useMemo(() => {
    const g = new SphereGeometry(600, 48, 24);
    const p = PALETTES[kind];
    const zenith = new Color(p.zenith);
    const mid = new Color(p.mid);
    const horizon = new Color(p.horizon);
    const pos = g.getAttribute('position');
    const colors = new Float32Array(pos.count * 3);
    const c = new Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 600;
      // Bright band at the horizon, fading to the mid colour and then the zenith.
      if (y < 0) c.copy(horizon).lerp(new Color('#120404'), Math.min(1, -y * 3));
      else if (y < p.glow * 0.4) c.copy(horizon).lerp(mid, y / (p.glow * 0.4));
      else c.copy(mid).lerp(zenith, Math.min(1, (y - p.glow * 0.4) / (1 - p.glow * 0.4)));
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new BufferAttribute(colors, 3));
    return g;
  }, [kind]);
  return (
    <mesh geometry={geometry} renderOrder={-10}>
      <meshBasicMaterial vertexColors side={BackSide} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

const DRIFT = 420;

/** Deterministic scatter (render must stay pure). */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Embers rising (siege) or grey ash falling (the Blank) in a box around the camera. */
export function Drift({ kind }: { kind: 'embers' | 'ash' }) {
  const points = useRef<Points>(null);
  const { geometry, speeds } = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(DRIFT * 3);
    const sp = new Float32Array(DRIFT);
    for (let i = 0; i < DRIFT; i++) {
      pos[i * 3] = (rand(i, 1) - 0.5) * 60;
      pos[i * 3 + 1] = rand(i, 2) * 30 - 5;
      pos[i * 3 + 2] = (rand(i, 3) - 0.5) * 60;
      sp[i] = 0.5 + rand(i, 4) * 1.2;
    }
    g.setAttribute('position', new BufferAttribute(pos, 3));
    return { geometry: g, speeds: sp };
  }, []);
  const time = useRef(0);
  useFrame((state, delta) => {
    const pts = points.current;
    if (!pts) return;
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    pts.position.set(state.camera.position.x, state.camera.position.y - 6, state.camera.position.z);
    const arr = (geometry.getAttribute('position') as BufferAttribute).array as Float32Array;
    const dir = kind === 'embers' ? 1 : -0.6;
    for (let i = 0; i < DRIFT; i++) {
      const s = speeds[i] ?? 1;
      arr[i * 3 + 1] = (arr[i * 3 + 1] ?? 0) + dir * s * dt;
      arr[i * 3] = (arr[i * 3] ?? 0) + Math.sin(time.current * 0.7 + i) * 0.3 * dt;
      const y = arr[i * 3 + 1] ?? 0;
      if (y > 25) arr[i * 3 + 1] = -5;
      if (y < -5) arr[i * 3 + 1] = 25;
    }
    (geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
  });
  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={kind === 'embers' ? 0.09 : 0.12}
        color={kind === 'embers' ? '#ff8a3a' : '#9a9490'}
        transparent
        opacity={kind === 'embers' ? 0.95 : 0.7}
        blending={kind === 'embers' ? AdditiveBlending : NormalBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

/** The Cinder Citadel on the Blank's horizon: a black fortress of spires wrapped in fire (L3-6). */
export function CitadelOnHorizon() {
  const spires = useMemo(() => [0, 1, 2, 3, 4, 5, 6].map((i) => ({ x: (i - 3) * 12 + (rand(i, 3) - 0.5) * 6, h: 50 + rand(i, 4) * 70, w: 7 + rand(i, 5) * 7 })), []);
  return (
    <group position={[220, -30, -620]}>
      {spires.map((s, i) => (
        <group key={i} position={[s.x, 0, (rand(i, 6) - 0.5) * 30]}>
          <mesh position={[0, s.h / 2, 0]}>
            <boxGeometry args={[s.w, s.h, s.w]} />
            <meshBasicMaterial color="#0a0406" fog={false} />
          </mesh>
          <mesh position={[0, s.h + s.w, 0]}>
            <coneGeometry args={[s.w * 0.8, s.w * 2.4, 4]} />
            <meshBasicMaterial color="#0a0406" fog={false} />
          </mesh>
          <mesh position={[0, s.h * 0.6, s.w / 2 + 0.5]}>
            <planeGeometry args={[s.w * 0.4, s.h * 0.5]} />
            <meshBasicMaterial color="#ff4a12" transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 70, 10]}>
        <sphereGeometry args={[70, 24, 16]} />
        <meshBasicMaterial color="#ff3a10" transparent opacity={0.16} blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}

/**
 * The Rift (LEVEL2_DESIGN L2-6): a ragged tear of red fire across the sky over Lantern Lake. Before
 * the opening beat it is the thin seam left by Level 1; once the sky splits it blazes wide.
 * Sits in the camera-following sky rig, so it reads as infinitely far away.
 */
export function Rift() {
  const core = useRef<MeshBasicMaterial>(null);
  const halo = useRef<MeshBasicMaterial>(null);
  const group = useRef<Group>(null);
  const width = useRef(0.15);
  const geometry = useMemo(() => {
    // A ragged zig-zag tear: many short straight segments (centripetal spline keeps the corners sharp).
    const pts: Vector3[] = [];
    for (let i = 0; i <= 13; i++) {
      const t = i / 13;
      // Irregular kinks, like a crack in glass, slanting up across the sky.
      const jag = (rand(i, 7) - 0.5) * 40;
      pts.push(new Vector3(-300 + t * 600 + (rand(i, 9) - 0.5) * 30, 300 + t * 60 + jag, -540 + (rand(i, 8) - 0.5) * 30));
    }
    // Straight segments keep the corners sharp: a crack, not a ribbon.
    const curve = new CurvePath<Vector3>();
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      if (a && b) curve.add(new LineCurve3(a, b));
    }
    return { core: new TubeGeometry(curve, 260, 2.2, 6, false), halo: new TubeGeometry(curve, 260, 12, 8, false) };
  }, []);
  useFrame((state, delta) => {
    const run = getRun();
    const rift = run?.level.beatIndexOf('l2-rift-opens') ?? -1;
    const open = run !== null && run !== undefined && rift >= 0 && run.director.currentIndex >= rift;
    width.current += ((open ? 1 : 0.15) - width.current) * (1 - Math.exp(-1.2 * Math.min(delta, 0.1)));
    const t = state.clock.elapsedTime;
    const flicker = 0.8 + Math.sin(t * 5) * 0.12 + Math.sin(t * 17) * 0.08;
    if (group.current) group.current.scale.set(1, width.current, width.current);
    if (core.current) core.current.opacity = flicker;
    if (halo.current) halo.current.opacity = 0.35 * flicker * width.current;
  });
  return (
    <group ref={group}>
      <mesh geometry={geometry.core} frustumCulled={false} renderOrder={-9}>
        <meshBasicMaterial ref={core} color="#ffb070" transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
      <mesh geometry={geometry.halo} frustumCulled={false} renderOrder={-9}>
        <meshBasicMaterial ref={halo} color="#ff2a0a" transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}
