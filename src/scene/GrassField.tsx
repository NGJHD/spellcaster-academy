/**
 * Wild grass scattered over open ground (owner, 2026-10-24: the flat grass "looks like minecraft"): one
 * instanced mesh of the generated grass tuft (kit_scene.py grass_tuft, 280 triangles), each copy turned,
 * sized and shaded differently, thinning out with distance from `near` so the far field stays cheap.
 */
import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, Euler, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3, type BufferGeometry } from 'three';
import { kitUrl } from './kitGlb';

/** Deterministic scatter (render must stay pure and repeatable). */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

interface GrassFieldProps {
  /** Ground rectangle (local space): x from–to, z from–to, at height y. */
  readonly x: readonly [number, number];
  readonly z: readonly [number, number];
  readonly y?: number;
  /** Where it is densest (the camera's side); density falls away from this z. */
  readonly nearZ: number;
  /** Tufts per square metre at `nearZ`. */
  readonly density?: number;
  /** Places to keep clear (x, z, radius): paths, buildings' feet. */
  readonly avoid?: readonly (readonly [number, number, number])[];
  /** Multiplies the blades' colour (night tint). */
  readonly tint?: string;
  readonly seed?: number;
}

export function GrassField({ x, z, y = 0, nearZ, density = 1.6, avoid = [], tint = '#ffffff', seed = 1 }: GrassFieldProps) {
  const { scene } = useGLTF(kitUrl('grass_tuft'));
  const part = useMemo(() => {
    let mesh: Mesh | null = null;
    scene.traverse((o) => {
      if (!mesh && o instanceof Mesh) mesh = o;
    });
    const m = mesh as Mesh | null;
    const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: DoubleSide, color: tint });
    return m ? { geometry: m.geometry as BufferGeometry, material } : null;
  }, [scene, tint]);

  // Callers pass literal arrays; key the scatter by their values so a re-render does not redo it.
  const key = JSON.stringify([x, z, y, nearZ, density, avoid, seed]);
  const placements = useMemo(() => {
    const out: Matrix4[] = [];
    const [x0, x1] = x;
    const [z0, z1] = [Math.min(z[0], z[1]), Math.max(z[0], z[1])];
    const far = Math.max(Math.abs(z0 - nearZ), Math.abs(z1 - nearZ));
    // Candidates on a jittered grid, kept with a chance that falls off with distance from nearZ.
    const step = 1 / Math.sqrt(density);
    let i = 0;
    for (let gz = z0; gz < z1; gz += step) {
      for (let gx = x0; gx < x1; gx += step) {
        i++;
        const px = gx + (rand(i, seed) - 0.5) * step;
        const pz = gz + (rand(i, seed + 1) - 0.5) * step;
        const keep = 1 - 0.85 * Math.min(1, Math.abs(pz - nearZ) / far);
        // Clumped, not even: big patches of grass with thinner ground between them.
        const patch = 0.5 + 0.5 * Math.sin(px * 0.21 + seed) * Math.sin(pz * 0.17 + seed * 2) + 0.3 * Math.sin(px * 0.7 - pz * 0.5);
        if (rand(i, seed + 2) > keep * Math.min(1, Math.max(0.15, patch))) continue;
        if (avoid.some(([ax, az, r]) => (px - ax) ** 2 + (pz - az) ** 2 < r * r)) continue;
        // Mostly short, the odd taller clump.
        const s = 0.35 + rand(i, seed + 3) ** 2 * 0.75;
        const q = new Quaternion().setFromEuler(new Euler((rand(i, seed + 4) - 0.5) * 0.15, rand(i, seed + 5) * Math.PI * 2, (rand(i, seed + 6) - 0.5) * 0.15));
        out.push(new Matrix4().compose(new Vector3(px, y, pz), q, new Vector3(s, s * (0.8 + rand(i, seed + 7) * 0.5), s)));
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` carries every input by value
  }, [key]);

  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const shade = new Color();
    placements.forEach((m, i) => {
      mesh.setMatrixAt(i, m);
      // Some clumps lusher, some drier.
      shade.setRGB(0.8 + rand(i, 91) * 0.35, 0.8 + rand(i, 92) * 0.3, 0.75 + rand(i, 93) * 0.25);
      mesh.setColorAt(i, shade);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  if (!part) return null;
  return <instancedMesh ref={ref} args={[part.geometry, part.material, placements.length]} receiveShadow />;
}

useGLTF.preload(kitUrl('grass_tuft'));
