import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh, type Material, type MeshStandardMaterial, type Object3D } from 'three';
import { MAT } from './materials';

const base = `${import.meta.env.BASE_URL}assets/kit/`;
export const kitUrl = (id: string) => `${base}${id}.glb`;

/**
 * Kit GLBs (assets-src/scripts/props/kit_props.py) name their materials after `MAT` keys and carry
 * metre UVs, so every copy shares the game's CC0-textured materials (and batches with MergeStatic).
 */
export function libraryMaterial(name: string): Material | undefined {
  return (MAT as Record<string, Material>)[name];
}

function dress(root: Object3D, castShadow: boolean): void {
  root.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.castShadow = castShadow;
    o.receiveShadow = true;
    const shared = libraryMaterial((o.material as Material).name);
    if (shared) o.material = shared;
  });
}

/** A shared-geometry clone of a kit GLB dressed with library materials. */
export function useKit(id: string, castShadow = true): Object3D {
  const gltf = useGLTF(kitUrl(id));
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    dress(root, castShadow);
    return root;
  }, [gltf.scene, castShadow]);
}

/**
 * A kit GLB whose glow materials (by GLB material name) are cloned for this instance, so a target
 * can pulse its own runes. Other materials stay shared.
 */
export function useKitGlow(id: string, glowNames: readonly string[], castShadow = true): { root: Object3D; glow: MeshStandardMaterial[] } {
  const gltf = useGLTF(kitUrl(id));
  const key = glowNames.join(',');
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    dress(root, castShadow);
    const clones = new Map<string, MeshStandardMaterial>();
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const m = o.material as MeshStandardMaterial;
      if (!key.split(',').includes(m.name)) return;
      let c = clones.get(m.name);
      if (!c) {
        c = m.clone();
        clones.set(m.name, c);
      }
      o.material = c;
    });
    return { root, glow: [...clones.values()] };
  }, [gltf.scene, key, castShadow]);
}

export function preloadKit(ids: readonly string[]): void {
  for (const id of ids) useGLTF.preload(kitUrl(id));
}
