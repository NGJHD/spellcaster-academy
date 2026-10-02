import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Mesh, type Material, type MeshStandardMaterial, type Object3D } from 'three';
import { MAT } from './materials';

const base = `${import.meta.env.BASE_URL}assets/props_original/`;
export const originalPropUrl = (id: string) => `${base}${id}.glb`;

/** Materials in the GLBs that should use the shared (CC0-textured) library instead. */
const SHARED: Record<string, () => Material> = {
  Stone: () => MAT.academyStone,
  StoneDark: () => MAT.academyStoneDark,
  Canvas: () => MAT.canvas,
};

/** Materials cloned per instance so each copy can pulse its own glow or take its own tint. */
const PER_INSTANCE = new Set(['Energy', 'Crystal', 'Opal', 'Amber', 'TealGlow', 'Leather']);

/** Per-instance materials that start from a textured library material rather than the GLB's flat one. */
const PER_INSTANCE_BASE: Record<string, () => Material> = {
  Leather: () => MAT.bookLeather,
};

export interface Parts {
  readonly root: Object3D;
  get(name: string): Object3D | undefined;
  /** Per-instance materials by original material name. */
  materials(name: string): MeshStandardMaterial[];
}

/**
 * Clones a part-based GLB (assets-src/scripts/props/hero_props.py) for one instance and exposes its
 * named nodes. Geometry is shared between copies; glow and tint materials are per instance.
 */
export function useParts(id: string, shadows = true): Parts {
  const gltf = useGLTF(originalPropUrl(id));
  return useMemo(() => {
    const root = gltf.scene.clone(true);
    const byMaterial = new Map<string, MeshStandardMaterial[]>();
    const clones = new Map<string, MeshStandardMaterial>();
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = shadows;
      o.receiveShadow = true;
      const m = o.material as MeshStandardMaterial;
      // Library-named materials (kit_props / books.py) use the shared CC0-textured materials.
      const shared = SHARED[m.name]?.() ?? (PER_INSTANCE.has(m.name) ? undefined : (MAT as Record<string, Material>)[m.name]);
      if (shared) {
        o.material = shared;
        return;
      }
      if (PER_INSTANCE.has(m.name)) {
        let c = clones.get(m.name);
        if (!c) {
          c = ((PER_INSTANCE_BASE[m.name]?.() as MeshStandardMaterial | undefined) ?? m).clone();
          clones.set(m.name, c);
          byMaterial.set(m.name, [c]);
        }
        o.material = c;
      }
    });
    return {
      root,
      get: (name) => root.getObjectByName(name),
      materials: (name) => byMaterial.get(name) ?? [],
    };
  }, [gltf.scene, shadows]);
}

export function preloadOriginalProps(ids: readonly string[]): void {
  for (const id of ids) useGLTF.preload(originalPropUrl(id));
}
