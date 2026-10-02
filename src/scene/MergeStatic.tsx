import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { BufferGeometry, InstancedMesh, Mesh, SkinnedMesh, type Group, type Material } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface Batch {
  readonly key: string;
  readonly geometry: BufferGeometry;
  readonly material: Material;
  readonly castShadow: boolean;
}

interface Bucket {
  readonly material: Material;
  readonly castShadow: boolean;
  readonly list: BufferGeometry[];
}

/** Attributes a batch may keep; vertex colours survive only when every member has them. */
const KEEP = ['position', 'normal', 'uv', 'color'];

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
    // One batch per material and shadow setting (books, for example, never cast shadows).
    const buckets = new Map<string, Bucket>();
    const merged: Mesh[] = [];
    root.traverse((o) => {
      if (!(o instanceof Mesh) || o instanceof InstancedMesh || o instanceof SkinnedMesh || Array.isArray(o.material) || o.userData.dynamic) return;
      const g = (o.geometry as BufferGeometry).clone();
      g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      for (const name of Object.keys(g.attributes)) if (!KEEP.includes(name)) g.deleteAttribute(name);
      if (!g.index) return;
      const key = `${o.material.uuid}|${o.castShadow}`;
      const bucket: Bucket = buckets.get(key) ?? { material: o.material, castShadow: o.castShadow, list: [] };
      bucket.list.push(g);
      buckets.set(key, bucket);
      merged.push(o);
    });
    // Originals stay mounted (lights, instanced meshes and anything unmergeable keep working); merged ones are hidden.
    for (const o of merged) o.visible = false;
    const out: Batch[] = [];
    let i = 0;
    for (const { material, castShadow, list } of buckets.values()) {
      // mergeGeometries needs identical attribute sets: keep only those every member has.
      const common = KEEP.filter((name) => list.every((g) => g.getAttribute(name) !== undefined));
      for (const g of list) for (const name of Object.keys(g.attributes)) if (!common.includes(name)) g.deleteAttribute(name);
      const merged = mergeGeometries(list, false);
      for (const g of list) g.dispose();
      if (merged) out.push({ key: `${i++}`, geometry: merged, material, castShadow: castShadow && shadows });
    }
    setBatches(out);
    return () => {
      for (const b of out) b.geometry.dispose();
    };
  }, [shadows]);

  return (
    <>
      <group ref={source}>{children}</group>
      {batches?.map((b) => (
        <mesh key={b.key} geometry={b.geometry} material={b.material} castShadow={b.castShadow} receiveShadow />
      ))}
    </>
  );
}
