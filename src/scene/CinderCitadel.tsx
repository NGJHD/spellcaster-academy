/**
 * The Cinder Citadel (Level 3; owner 2026-10-07: "can you have a nicer fortress? it looks like it was
 * created in power point"). A fortress on a rocky mount: a ring of AI-pipeline citadel towers joined
 * by crenellated curtain walls of photo-scanned volcanic stone, a tall central keep with two lesser
 * spires, a glowing gate and rivers of molten ink pouring down the mount.
 * Local units are metres with the mount's foot at y = 0; the gate faces +Z.
 * `distant` renders it as part of the sky (no fog, warmed towards the horizon glow) for the horizon view.
 */
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { AdditiveBlending, Color, Mesh, MeshStandardMaterial, type Material, type Object3D } from 'three';
import { Box } from './kit';
import { MAT } from './materials';
import { propUrl } from './Prop';

const RING = 46;
const WALL_H = 26;
const MOUNT_H = 30;
const OUTER = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
  return [Math.sin(a) * RING, Math.cos(a) * RING] as const;
});
const HAZE = new Color('#7a2a18');

const lava = new MeshStandardMaterial({ color: '#2a0402', emissive: '#ff3a0a', emissiveIntensity: 2.2, roughness: 0.4 });
const gateGlow = new MeshStandardMaterial({ color: '#2a0402', emissive: '#ff5a1a', emissiveIntensity: 3, roughness: 0.6 });

/** Clones a material for the sky view: no fog, its colour pulled towards the horizon glow. */
function skyMaterial(m: Material): Material {
  const c = m.clone();
  if (c instanceof MeshStandardMaterial) {
    c.fog = false;
    c.color.lerp(HAZE, 0.35);
  }
  return c;
}

function useTower(distant: boolean): Object3D {
  const { scene } = useGLTF(propUrl('citadel_tower'));
  return useMemo(() => {
    if (!distant) return scene;
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) o.material = Array.isArray(o.material) ? o.material.map(skyMaterial) : skyMaterial(o.material as Material);
    });
    return clone;
  }, [scene, distant]);
}

/** One tower: `h` metres tall (the source model is scaled to height). */
function Tower({ source, position, h, rotationY }: { source: Object3D; position: [number, number, number]; h: number; rotationY: number }) {
  // The GLB is 60 m tall at scale 1 (its bounds run from y = 0 to 60); scale to h.
  const object = useMemo(() => source.clone(true), [source]);
  return <primitive object={object} position={position} scale={h / 60} rotation={[0, rotationY, 0]} />;
}

export function CinderCitadel({ distant = false }: { distant?: boolean }) {
  const tower = useTower(distant);
  const stone = useMemo(() => (distant ? skyMaterial(MAT.volcanicStone) : MAT.volcanicStone) as MeshStandardMaterial, [distant]);
  const rock = useMemo(() => (distant ? skyMaterial(MAT.rockGround) : MAT.rockGround) as MeshStandardMaterial, [distant]);
  const walls = OUTER.map(([x, z], i) => {
    const [nx, nz] = OUTER[(i + 1) % OUTER.length] ?? [0, 0];
    const len = Math.hypot(nx - x, nz - z);
    const mid: [number, number] = [(x + nx) / 2, (z + nz) / 2];
    const yaw = Math.atan2(nx - x, nz - z) + Math.PI / 2;
    return { mid, len, yaw };
  });
  return (
    <group>
      {/* The rocky mount, stepped like a broken cliff */}
      <mesh position={[0, MOUNT_H / 2, 0]} material={rock}>
        <cylinderGeometry args={[RING + 14, RING + 46, MOUNT_H, 11, 3]} />
      </mesh>
      <mesh position={[0, MOUNT_H * 0.25, 0]} rotation={[0, 0.4, 0]} material={rock}>
        <cylinderGeometry args={[RING + 40, RING + 70, MOUNT_H * 0.5, 9]} />
      </mesh>
      {/* Molten ink pouring down the mount from the gate and the walls */}
      {[0, 2.1, 4.2].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * (RING + 30), MOUNT_H * 0.5, Math.cos(a) * (RING + 30)]} rotation={[0, a, -0.0]} material={lava}>
          <boxGeometry args={[6 - i, MOUNT_H * 1.05, 2]} />
        </mesh>
      ))}
      <group position={[0, MOUNT_H, 0]}>
        {/* Curtain walls with crenellations */}
        {walls.map(({ mid, len, yaw }, i) => (
          <group key={i} position={[mid[0], 0, mid[1]]} rotation={[0, yaw, 0]}>
            <Box position={[0, WALL_H / 2, 0]} size={[len, WALL_H, 6]} material={stone} />
            {Array.from({ length: Math.floor(len / 5) }, (_, k) => (
              <Box key={k} position={[-len / 2 + 2.5 + k * 5, WALL_H + 1.4, 0]} size={[2.6, 2.8, 6.4]} material={stone} />
            ))}
          </group>
        ))}
        {/* The gate in the front wall, glowing with fire */}
        <mesh position={[0, 8, RING * Math.cos(Math.PI / 6) + 3.2]} material={gateGlow}>
          <planeGeometry args={[10, 16]} />
        </mesh>
        {/* Ring towers, the keep and its spires */}
        {OUTER.map(([x, z], i) => (
          <Tower key={i} source={tower} position={[x, -2, z]} h={WALL_H + 30 + (i % 3) * 8} rotationY={i * 1.1} />
        ))}
        <Tower source={tower} position={[0, -4, -6]} h={150} rotationY={0.3} />
        <Tower source={tower} position={[-20, -4, -14]} h={104} rotationY={2.2} />
        <Tower source={tower} position={[22, -4, -10]} h={96} rotationY={4} />
        {/* Firelight glowing up the keep */}
        <mesh position={[0, 60, 0]}>
          <sphereGeometry args={[60, 20, 12]} />
          <meshBasicMaterial color="#ff4010" transparent opacity={0.07} blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={!distant} />
        </mesh>
      </group>
    </group>
  );
}
useGLTF.preload(propUrl('citadel_tower'));
