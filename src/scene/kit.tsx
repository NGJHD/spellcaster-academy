/**
 * PLACEHOLDER architecture kit (§14A.15): code-built modules standing in for the Blender kit.
 * Dimensions follow the documented academy conventions (1 unit = 1 m, doors 2.4–3.2 m, eye 1.6 m).
 */
import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Object3D, Quaternion, Vector3, type InstancedMesh, type Material } from 'three';
import type { Vec3 } from '../level/rail/railTypes';
import { MAT } from './materials';

type V3 = readonly [number, number, number];

export function Box({
  position,
  size,
  material,
  rotation = [0, 0, 0],
  shadows = true,
}: {
  position: V3;
  size: V3;
  material: Material;
  rotation?: V3;
  shadows?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow={shadows} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** Box spanning (x0,y0,z0)–(x1,y1,z1). */
export function Slab({
  x: [x0, x1],
  y: [y0, y1],
  z: [z0, z1],
  material,
  shadows = true,
}: {
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
  material: Material;
  shadows?: boolean;
}) {
  return (
    <Box
      position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]}
      size={[Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)]}
      material={material}
      shadows={shadows}
    />
  );
}

export function Column({ position, height, radius = 0.32, material = MAT.academyStone }: { position: V3; height: number; radius?: number; material?: Material }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={MAT.academyStoneDark} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.35, radius * 1.45, 0.3, 20]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={material} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 0.92, radius, height - 0.5, 24]} />
      </mesh>
      <mesh position={[0, height - 0.12, 0]} material={MAT.academyStoneDark} castShadow>
        <cylinderGeometry args={[radius * 1.4, radius * 1.05, 0.24, 20]} />
      </mesh>
    </group>
  );
}

/** Semicircular arch in the XY plane (rotated by `rotationY`), centred at `position`, spanning `width`. */
export function Arch({ position, width, thickness = 0.35, rotationY = 0, material = MAT.academyStone }: { position: V3; width: number; thickness?: number; rotationY?: number; material?: Material }) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} material={material} castShadow receiveShadow>
      <torusGeometry args={[width / 2, thickness / 2, 10, 32, Math.PI]} />
    </mesh>
  );
}

export function WindowPane({ position, size, rotationY = 0, material = MAT.windowGlow }: { position: V3; size: readonly [number, number]; rotationY?: number; material?: Material }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={material}>
        <planeGeometry args={size} />
      </mesh>
      <mesh position={[0, size[1] / 2, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.academyStoneDark}>
        <cylinderGeometry args={[0.06, 0.06, size[0] + 0.2, 8, 1, false, 0, Math.PI]} />
      </mesh>
    </group>
  );
}

export function WallLamp({ position, rotationY = 0, light = false, color = '#ffc98a', intensity = 6 }: { position: V3; rotationY?: number; light?: boolean; color?: string; intensity?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, 0.08]} material={MAT.agedBrass}>
        <boxGeometry args={[0.06, 0.25, 0.16]} />
      </mesh>
      <mesh position={[0, 0.15, 0.18]} material={MAT.lampGlow}>
        <sphereGeometry args={[0.09, 16, 12]} />
      </mesh>
      {light && <pointLight position={[0, 0.2, 0.45]} color={color} intensity={intensity} distance={8} decay={2} />}
    </group>
  );
}

export function StandingLamp({ position, light = false }: { position: V3; light?: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]} material={MAT.agedBrass}>
        <cylinderGeometry args={[0.18, 0.22, 0.1, 16]} />
      </mesh>
      <mesh position={[0, 1.2, 0]} material={MAT.agedBrass}>
        <cylinderGeometry args={[0.03, 0.04, 2.3, 10]} />
      </mesh>
      <mesh position={[0, 2.45, 0]} material={MAT.lampGlow}>
        <sphereGeometry args={[0.15, 18, 14]} />
      </mesh>
      {light && <pointLight position={[0, 2.5, 0]} color="#ffc98a" intensity={7} distance={9} decay={2} />}
    </group>
  );
}

/** Instanced books on a shelf unit; one draw call for the books (§14A.19). */
export function Bookshelf({ position, width = 3, height = 3.6, shelves = 5, rotationY = 0, seed = 1 }: { position: V3; width?: number; height?: number; shelves?: number; rotationY?: number; seed?: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const books = useMemo(() => {
    let s = seed * 9301 + 49297;
    const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const out: { pos: Vector3; scale: Vector3; tilt: number; color: Color }[] = [];
    const palette = ['#6e1f28', '#24533d', '#24406e', '#7a5a2a', '#4a2f4f', '#8a6a3a', '#2f4a4a'];
    for (let row = 0; row < shelves; row++) {
      let x = -width / 2 + 0.06;
      const y = 0.2 + row * (height / shelves);
      while (x < width / 2 - 0.08) {
        const w = 0.04 + rand() * 0.05;
        const h = (height / shelves) * (0.55 + rand() * 0.3);
        if (rand() < 0.06) {
          x += 0.15;
          continue;
        }
        out.push({
          pos: new Vector3(x + w / 2, y + h / 2, 0),
          scale: new Vector3(w, h, 0.22 + rand() * 0.06),
          tilt: rand() < 0.08 ? 0.25 : 0,
          color: new Color(palette[Math.floor(rand() * palette.length)] ?? '#6e1f28'),
        });
        x += w + 0.004;
      }
    }
    return out;
  }, [width, height, shelves, seed]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const o = new Object3D();
    books.forEach((b, i) => {
      o.position.copy(b.pos);
      o.rotation.set(0, 0, b.tilt);
      o.scale.copy(b.scale);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, b.color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [books]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Slab x={[-width / 2 - 0.05, width / 2 + 0.05]} y={[0, height]} z={[-0.2, -0.16]} material={MAT.darkOak} />
      <Slab x={[-width / 2 - 0.07, -width / 2]} y={[0, height]} z={[-0.2, 0.18]} material={MAT.darkOak} />
      <Slab x={[width / 2, width / 2 + 0.07]} y={[0, height]} z={[-0.2, 0.18]} material={MAT.darkOak} />
      {Array.from({ length: shelves + 1 }, (_, row) => (
        <Slab key={row} x={[-width / 2, width / 2]} y={[row * (height / shelves) + 0.15, row * (height / shelves) + 0.2]} z={[-0.2, 0.18]} material={MAT.darkOak} />
      ))}
      <instancedMesh ref={mesh} args={[undefined, undefined, books.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>
    </group>
  );
}

export function Bench({ position, rotationY = 0, upholstered = false }: { position: V3; rotationY?: number; upholstered?: boolean }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box position={[0, 0.45, 0]} size={[1.8, 0.08, 0.5]} material={upholstered ? MAT.navyCloth : MAT.lightOak} />
      {[-0.75, 0.75].map((x) => (
        <Box key={x} position={[x, 0.21, 0]} size={[0.08, 0.42, 0.42]} material={MAT.agedBrass} />
      ))}
      <Box position={[0, 0.78, -0.22]} size={[1.8, 0.4, 0.06]} material={upholstered ? MAT.navyCloth : MAT.lightOak} />
    </group>
  );
}

/** Rounded leafy shrub cluster (several overlapping spheres). */
export function Shrub({ position, size = 1, seed = 1, material = MAT.hedge }: { position: V3; size?: number; seed?: number; material?: Material }) {
  const blobs = useMemo(() => {
    let s = seed * 7919;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    return Array.from({ length: 6 }, () => ({
      p: [(rand() - 0.5) * 0.7 * size, (0.35 + rand() * 0.45) * size, (rand() - 0.5) * 0.7 * size] as const,
      r: (0.3 + rand() * 0.22) * size,
    }));
  }, [size, seed]);
  return (
    <group position={position}>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} material={material} castShadow receiveShadow>
          <icosahedronGeometry args={[b.r, 2]} />
        </mesh>
      ))}
    </group>
  );
}

export function Planter({ position, size = 1.4, seed = 1 }: { position: V3; size?: number; seed?: number }) {
  return (
    <group position={position}>
      <Box position={[0, 0.4, 0]} size={[size, 0.8, size]} material={MAT.academyStoneDark} />
      <Box position={[0, 0.79, 0]} size={[size - 0.12, 0.04, size - 0.12]} material={MAT.soil} shadows={false} />
      <Shrub position={[0, 0.7, 0]} size={size * 0.7} seed={seed} />
    </group>
  );
}

export function Banner({ position, rotationY = 0, width = 1.1, height = 3 }: { position: V3; rotationY?: number; width?: number; height?: number }) {
  const ref = useRef<Object3D>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.9 + position[0]) * 0.03;
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI / 2]} material={MAT.agedBrass}>
        <cylinderGeometry args={[0.025, 0.025, width + 0.2, 8]} />
      </mesh>
      <group ref={ref}>
        <mesh position={[0, -height / 2, 0]} material={MAT.navyCloth} castShadow>
          <boxGeometry args={[width, height, 0.03]} />
        </mesh>
        <mesh position={[0, -height * 0.4, 0.02]} material={MAT.wardGold}>
          <torusGeometry args={[width * 0.22, 0.02, 8, 28]} />
        </mesh>
        <mesh position={[0, -height * 0.4, 0.025]} material={MAT.wardGold}>
          <circleGeometry args={[width * 0.08, 5]} />
        </mesh>
      </group>
    </group>
  );
}

export function Rug({ position, size, rotationY = 0, material = MAT.carpet }: { position: V3; size: readonly [number, number]; rotationY?: number; material?: Material }) {
  return (
    <mesh position={[position[0], position[1] + 0.012, position[2]]} rotation={[-Math.PI / 2, 0, rotationY]} material={material} receiveShadow>
      <planeGeometry args={size} />
    </mesh>
  );
}

/** Simple portrait frame with a painted canvas tint (original, abstract figures). */
export function Portrait({ position, rotationY = 0, size = [1.1, 1.4], tint = '#6a4a3a', seed = 1 }: { position: V3; rotationY?: number; size?: readonly [number, number]; tint?: string; seed?: number }) {
  const canvasMat = useMemo(() => MAT.canvas.clone(), []);
  canvasMat.color.set(tint);
  const face = useMemo(() => {
    const hues = ['#e2b796', '#c99a78', '#a57458', '#7d5a46'];
    return hues[seed % hues.length] ?? '#c99a78';
  }, [seed]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box position={[0, 0, 0]} size={[size[0] + 0.24, size[1] + 0.24, 0.08]} material={MAT.agedBrass} />
      <mesh position={[0, 0, 0.045]} material={canvasMat}>
        <planeGeometry args={size} />
      </mesh>
      <mesh position={[0, size[1] * 0.12, 0.05]} scale={[0.75, 1, 0.2]}>
        <sphereGeometry args={[size[0] * 0.2, 16, 12]} />
        <meshStandardMaterial color={face} roughness={0.8} />
      </mesh>
      <mesh position={[0, -size[1] * 0.28, 0.05]} scale={[1, 0.6, 0.15]}>
        <sphereGeometry args={[size[0] * 0.34, 16, 12]} />
        <meshStandardMaterial color={seed % 2 ? '#2a3a6a' : '#5a2a34'} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Spiral or straight stair steps between two heights along a path. */
export function Steps({ from, to, width = 2, count = 12, material = MAT.academyStone }: { from: Vec3; to: Vec3; width?: number; count?: number; material?: Material }) {
  const steps = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const yaw = Math.atan2(dir.x, dir.z);
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    const depth = Math.hypot(dir.x, dir.z) / count;
    return Array.from({ length: count }, (_, i) => {
      const u = (i + 0.5) / count;
      return { p: a.clone().lerp(b, u), q, depth, rise: dir.y / count, i };
    });
  }, [from, to, count]);
  return (
    <group>
      {steps.map((s) => (
        <mesh key={s.i} position={[s.p.x, s.p.y - Math.abs(s.rise) / 2, s.p.z]} quaternion={s.q} material={material} castShadow receiveShadow>
          <boxGeometry args={[width, Math.abs(s.rise) + 0.05, s.depth + 0.02]} />
        </mesh>
      ))}
    </group>
  );
}

