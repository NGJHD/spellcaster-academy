/**
 * A dense barren forest (owner, 2026-10-07: "this wasteland looks very bare. Can it be a dense barren
 * forest on either side of the path?"): hundreds of burnt dead trees packed on both sides of a clear
 * path, drawn as one instanced mesh of the low-detail dead tree (2.5k triangles each), with varied
 * height, lean, turn and charring, a few snapped off as stumps, and the odd one still smouldering.
 * Rows nearest the path are the full-detail trees placed by the scene itself.
 */
import { useGLTF } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Euler, InstancedMesh, Matrix4, Mesh, Quaternion, Vector3, type BufferGeometry, type Material } from 'three';
import type { Vec3 } from '../level/rail/railTypes';
import { Fire } from './Fire';
import { propUrl } from './Prop';

/** Deterministic scatter (render must stay pure and repeatable). */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

interface ForestProps {
  /** Path centre line: x at a given z (local space). */
  readonly pathX?: (z: number) => number;
  /** Clear half-width either side of the path. */
  readonly clear: number;
  /** How far out the forest reaches from the path. */
  readonly depth: number;
  readonly zRange: readonly [number, number];
  /** Trees per 100 square metres. */
  readonly density?: number;
  /** Places the forest must keep clear (x, z, radius), e.g. where the tortoise stands. */
  readonly avoid?: readonly (readonly [number, number, number])[];
  readonly seed?: number;
  /** The tree model: the low-detail tree near the path, or the far ones (500 and 150 triangles) for distant belts. */
  readonly model?: 'dead_tree_lod1' | 'dead_tree_lod2' | 'dead_tree_lod3';
}

/** Side of a forest tile (metres): small enough that tiles out of view are skipped, big enough to batch. */
const TILE = 80;

type Tree = { x: number; z: number; h: number; yaw: number; lean: Euler; char: number; stump: boolean };

/** One tile of a forest: its trees as one instanced mesh, culled when out of view. */
function ForestTile({ trees, geometry, material, modelHeight }: { trees: readonly Tree[]; geometry: BufferGeometry; material: Material; modelHeight: number }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const turn = new Quaternion();
    const s = new Vector3();
    const p = new Vector3();
    const c = new Color();
    trees.forEach((t, i) => {
      const scale = t.h / modelHeight;
      q.setFromEuler(t.lean).multiply(turn.setFromAxisAngle(new Vector3(0, 1, 0), t.yaw));
      // Stumps: a full tree sunk into the ash with only its broken base showing.
      p.set(t.x, t.stump ? -t.h * 2.2 : 0, t.z);
      s.setScalar(t.stump ? scale * 3.2 : scale);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.setScalar(t.char));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [trees, modelHeight]);
  return <instancedMesh ref={ref} args={[geometry, material, trees.length]} castShadow={false} receiveShadow />;
}

/** A tree model's meshes, baked to its own space, and its height (to scale each tree to metres). */
function useTreeParts(model: string): { parts: { geometry: BufferGeometry; material: Material }[]; height: number } {
  const { scene } = useGLTF(propUrl(model));
  return useMemo(() => {
    const parts: { geometry: BufferGeometry; material: Material }[] = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (o instanceof Mesh) {
        const g = (o.geometry as BufferGeometry).clone();
        g.applyMatrix4(o.matrixWorld);
        g.computeBoundingBox();
        parts.push({ geometry: g, material: o.material as Material });
      }
    });
    return { parts, height: Math.max(...parts.map((p) => p.geometry.boundingBox?.max.y ?? 1)) };
  }, [scene]);
}

/** Beyond this far out from the edge of the path, a near forest's trees use the lighter model. */
const NEAR_BAND = 25;

export function DeadForest({ pathX = () => 0, clear, depth, zRange, density = 2.2, avoid = [], seed = 1, model = 'dead_tree_lod1' }: ForestProps) {
  const near = useTreeParts(model);
  // The near forest's back rows, never seen up close, use the 500-triangle tree.
  const far = useTreeParts(model === 'dead_tree_lod1' ? 'dead_tree_lod2' : model);

  const trees = useMemo(() => {
    const out: Tree[] = [];
    const [z0, z1] = zRange;
    const span = Math.abs(z1 - z0);
    const count = Math.round(((span * depth * 2) / 100) * density);
    for (let i = 0; i < count * 3 && out.length < count; i++) {
      const k = i + seed * 1000;
      const z = Math.min(z0, z1) + rand(k, 1) * span;
      const side = rand(k, 2) < 0.5 ? -1 : 1;
      // Denser near the path, thinning out into the distance.
      const out01 = Math.pow(rand(k, 3), 1.4);
      const x = pathX(z) + side * (clear + out01 * depth);
      if (avoid.some(([ax, az, r]) => (x - ax) ** 2 + (z - az) ** 2 < r * r)) continue;
      const stump = rand(k, 4) < 0.12;
      const h = stump ? 1.6 + rand(k, 5) * 2 : 7 + rand(k, 6) * 9;
      out.push({ x, z, h, yaw: rand(k, 7) * Math.PI * 2, lean: new Euler((rand(k, 8) - 0.5) * 0.25, 0, (rand(k, 9) - 0.5) * 0.25), char: 0.45 + rand(k, 10) * 0.55, stump });
    }
    return out;
  }, [zRange, depth, density, clear, pathX, avoid, seed]);

  // A few trees still smoulder (fires are sprites, so only a handful).
  // Only the forest along the path smoulders: the far belts' fires were too small to see but cost frames.
  const burning = useMemo(() => (model === 'dead_tree_lod1' ? trees.filter((t, i) => !t.stump && i % 23 === 5).slice(0, 10) : []), [trees, model]);

  // Tiles of TILE metres, each its own instanced mesh with frustum culling (owner, 2026-10-24: the ground
  // "vibrated" on the Rift Shore: every tree of every belt, behind the camera too, was drawn each frame,
  // 6.5 M triangles, and the frame rate dropped so each small camera move juddered).
  const tiles = useMemo(() => {
    const byCell = new Map<string, Tree[]>();
    for (const t of trees) {
      const back = Math.abs(t.x - pathX(t.z)) > clear + NEAR_BAND;
      const key = `${back ? 'far' : 'near'}:${Math.floor(t.x / TILE)},${Math.floor(t.z / TILE)}`;
      const list = byCell.get(key) ?? [];
      list.push(t);
      byCell.set(key, list);
    }
    return [...byCell.entries()].map(([key, list]) => ({ far: key.startsWith('far'), trees: list }));
  }, [trees, pathX, clear]);

  return (
    <group>
      {tiles.map((tile, ti) => {
        const set = tile.far ? far : near;
        return set.parts.map((part, j) => <ForestTile key={`${ti}-${j}`} trees={tile.trees} geometry={part.geometry} material={part.material} modelHeight={set.height} />);
      })}
      {burning.map((t, i) => (
        <Fire key={i} position={[t.x, t.h * 0.55, t.z] as unknown as Vec3} size={1.6} count={2} spread={1} />
      ))}
    </group>
  );
}
useGLTF.preload(propUrl('dead_tree_lod1'));
useGLTF.preload(propUrl('dead_tree_lod2'));
useGLTF.preload(propUrl('dead_tree_lod3'));
