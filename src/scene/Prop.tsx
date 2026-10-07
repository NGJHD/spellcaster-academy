import { Detailed, useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, DoubleSide, Material, Mesh, Vector3, type Object3D } from 'three';
import type { Vec3 } from '../level/rail/railTypes';

const base = `${import.meta.env.BASE_URL}assets/props/`;
export const propUrl = (id: string) => `${base}${id}.glb`;

/** Props with a low-detail LOD1 file (see assets-src/scripts/repack_cc0.py). */
const HAS_LOD = new Set(['island_tree_01', 'island_tree_02', 'jacaranda_tree', 'fir_tree_01', 'shrub_01', 'shrub_02', 'shrub_03', 'shrub_04']);

interface PropProps {
  readonly id: string;
  readonly position: Vec3;
  readonly rotationY?: number;
  /** Uniform scale; ignored when `height` is set. */
  readonly scale?: number;
  /** Scale the model so its bounding box is this tall (metres). */
  readonly height?: number;
  readonly shadows?: boolean;
  /** Switch to LOD1 beyond this distance (metres). */
  readonly lodDistance?: number;
  /** Render both faces (thin shells seen from inside, such as a hull the camera stands in). */
  readonly doubleSided?: boolean;
}

function prepare(source: Object3D, shadows: boolean, doubleSided: boolean): Object3D {
  const clone = source.clone(true);
  clone.traverse((o) => {
    if (o instanceof Mesh) {
      o.castShadow = shadows;
      o.receiveShadow = true;
      if (doubleSided && o.material instanceof Material) {
        o.material = o.material.clone();
        o.material.side = DoubleSide;
      }
    }
  });
  return clone;
}

function useScaled(id: string, height: number | undefined, scale: number): number {
  const { scene } = useGLTF(propUrl(id));
  return useMemo(() => {
    if (!height) return scale;
    const size = new Box3().setFromObject(scene).getSize(new Vector3());
    return size.y > 0 ? height / size.y : scale;
  }, [scene, height, scale]);
}

function Model({ id, shadows, doubleSided = false }: { id: string; shadows: boolean; doubleSided?: boolean }) {
  const { scene } = useGLTF(propUrl(id));
  const object = useMemo(() => prepare(scene, shadows, doubleSided), [scene, shadows, doubleSided]);
  return <primitive object={object} />;
}

/** A CC0 prop GLB placed in the world. Geometry and textures are shared between copies. */
export function Prop({ id, position, rotationY = 0, scale = 1, height, shadows = true, lodDistance = 35, doubleSided = false }: PropProps) {
  const s = useScaled(id, height, scale);
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={s}>
      {HAS_LOD.has(id) ? (
        <Detailed distances={[0, lodDistance]}>
          <Model id={id} shadows={shadows} />
          <Model id={`${id}_lod1`} shadows={false} />
        </Detailed>
      ) : (
        <Model id={id} shadows={shadows} doubleSided={doubleSided} />
      )}
    </group>
  );
}

export function preloadProps(ids: readonly string[]): void {
  for (const id of ids) useGLTF.preload(propUrl(id));
}
