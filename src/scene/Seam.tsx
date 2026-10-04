/**
 * The burning seam (LEVEL1_DESIGN LD-21): after the ward is mended, a jagged red line stays in the
 * sky where it was torn from outside. It glows in the observatory reveal and lingers faintly over the
 * celebration, foreshadowing the Rift of Level 2.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, CatmullRomCurve3, TubeGeometry, Vector3, type MeshBasicMaterial } from 'three';
import { beatIndexOf } from '../level/level1Route';
import { useBeatIndex } from './props';

const REVEAL = beatIndexOf('observatory-seam');

export function Seam({ points, radius = 0.25, fromBeat = REVEAL, strength = 1 }: { points: readonly [number, number, number][]; radius?: number; fromBeat?: number; strength?: number }) {
  const beat = useBeatIndex();
  const mat = useRef<MeshBasicMaterial>(null);
  const glow = useRef<MeshBasicMaterial>(null);
  const time = useRef(0);
  const geometry = useMemo(() => {
    const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
    return { core: new TubeGeometry(curve, 96, radius, 6, false), halo: new TubeGeometry(curve, 96, radius * 4, 8, false) };
  }, [points, radius]);
  useFrame((_, dt) => {
    time.current += Math.min(dt, 0.1);
    const on = fromBeat >= 0 && beat >= fromBeat;
    const flicker = 0.75 + Math.sin(time.current * 7) * 0.15 + Math.sin(time.current * 23) * 0.1;
    if (mat.current) mat.current.opacity = on ? strength * flicker : 0;
    if (glow.current) glow.current.opacity = on ? strength * 0.3 * flicker : 0;
  });
  return (
    <group>
      <mesh geometry={geometry.core} frustumCulled={false}>
        <meshBasicMaterial ref={mat} color="#ff4a20" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
      <mesh geometry={geometry.halo} frustumCulled={false}>
        <meshBasicMaterial ref={glow} color="#ff1a10" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
      </mesh>
    </group>
  );
}
