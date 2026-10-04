/**
 * Level 2 and 3 skies (CLAUDE.md §5 visual tone): a gradient sky dome plus drifting embers or ash
 * around the camera. 'inferno' is the burning siege night (black overhead, a red-orange fire glow along
 * the horizon); 'blank' is the red sky over the scorched Blank that never darkens.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BackSide, BufferAttribute, BufferGeometry, Color, NormalBlending, SphereGeometry, type Points } from 'three';

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
