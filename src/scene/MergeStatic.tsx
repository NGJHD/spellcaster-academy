import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BufferGeometry, InstancedMesh, Mesh, SkinnedMesh, type Group, type Material } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface Batch {
  readonly key: string;
  readonly geometry: BufferGeometry;
  readonly material: Material;
}

/**
 * Static batching (§15 draw-call budget): bakes every plain indexed mesh among its children into one
 * geometry per material (transforms applied) and hides the originals. Instanced meshes, lights and
 * multi-material meshes are left as they are. Only wrap non-animated architecture.
 */
export function MergeStatic({ children, shadows = true }: { children: ReactNode; shadows?: boolean }) {
  const source = useRef<Group>(null);
  const [batches, setBatches] = useState<Batch[] | null>(null);

  useLayoutEffect(() => {
    const root = source.current;
    if (!root) return;
    root.updateMatrixWorld(true);
    const inverse = root.matrixWorld.clone().invert();
    const buckets = new Map<Material, BufferGeometry[]>();
    const merged: Mesh[] = [];
    root.traverse((o) => {
      if (!(o instanceof Mesh) || o instanceof InstancedMesh || o instanceof SkinnedMesh || Array.isArray(o.material) || o.userData.dynamic) return;
      const g = (o.geometry as BufferGeometry).clone();
      g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      // mergeGeometries needs identical attribute sets.
      for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
      if (!g.index) return;
      const list = buckets.get(o.material) ?? [];
      list.push(g);
      buckets.set(o.material, list);
      merged.push(o);
    });
    // Originals stay mounted (lights, instanced meshes and anything unmergeable keep working); merged ones are hidden.
    for (const o of merged) o.visible = false;
    const out: Batch[] = [];
    let i = 0;
    for (const [material, list] of buckets) {
      const merged = mergeGeometries(list, false);
      for (const g of list) g.dispose();
      if (merged) out.push({ key: `${i++}`, geometry: merged, material });
    }
    setBatches(out);
    return () => {
      for (const b of out) b.geometry.dispose();
    };
  }, []);

  return (
    <>
      <group ref={source}>{children}</group>
      {batches?.map((b) => (
        <mesh key={b.key} geometry={b.geometry} material={b.material} castShadow={shadows} receiveShadow />
      ))}
    </>
  );
}
