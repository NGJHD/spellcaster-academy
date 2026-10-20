/**
 * A rope of fire (owner, 2026-10-20: the Warden's bonds "still look like rubber bands"): a Flux-painted
 * strip of braided burning rope (assets-src/concepts/fire_rope.png → public/assets/textures/fx/fire_rope.png,
 * tiled seamlessly, black made transparent) drawn as a ribbon along a path that turns to face the camera,
 * with its flames always licking upward. The texture scrolls so the fire crawls along the rope.
 */
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { BufferAttribute, BufferGeometry, DoubleSide, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector3, type Mesh } from 'three';

/** Where the rope's core sits across the strip (from the bottom); the flames rise above it. */
const CORE_V = 0.31;
const UP = new Vector3(0, 1, 0);

/** Each rope its own texture (its own scroll); the browser caches the image. */
function ropeTexture() {
  const t = new TextureLoader().load(`${import.meta.env.BASE_URL}assets/textures/fx/fire_rope.png`);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/** Points round a horizontal circle (local space). */
export function ringPath(radius: number, segments = 48): Vector3[] {
  return Array.from({ length: segments }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return new Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius);
  });
}

/** Points along a straight line (local space). */
export function linePath(from: Vector3, to: Vector3, segments = 12): Vector3[] {
  return Array.from({ length: segments + 1 }, (_, i) => from.clone().lerp(to, i / segments));
}

export function FireRope({ points, closed = false, width = 0.35, tile = 1.2, speed = 0.35 }: { points: readonly Vector3[]; closed?: boolean; width?: number; tile?: number; speed?: number }) {
  const mesh = useRef<Mesh>(null);
  const texture = useMemo(() => ropeTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const path = useMemo(() => (closed ? [...points, points[0] ?? new Vector3()] : [...points]), [points, closed]);
  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    const n = path.length;
    g.setAttribute('position', new BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const uv = new Float32Array(n * 2 * 2);
    let run = 0;
    path.forEach((p, i) => {
      if (i > 0) run += p.distanceTo(path[i - 1] ?? p);
      uv.set([run / tile, 0, run / tile, 1], i * 4);
    });
    g.setAttribute('uv', new BufferAttribute(uv, 2));
    const index: number[] = [];
    for (let i = 0; i < n - 1; i++) index.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    g.setIndex(index);
    return g;
  }, [path, tile]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const scratch = useMemo(() => ({ eye: new Vector3(), view: new Vector3(), tangent: new Vector3(), side: new Vector3() }), []);
  const time = useRef(0);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    time.current += Math.min(delta, 0.1);
    texture.offset.x = -time.current * speed;
    const { eye, view, tangent, side } = scratch;
    eye.copy(state.camera.position);
    m.worldToLocal(eye);
    const pos = geometry.getAttribute('position') as BufferAttribute;
    const n = path.length;
    for (let i = 0; i < n; i++) {
      const p = path[i];
      if (!p) continue;
      const prev = path[Math.max(0, i - 1)] ?? p;
      const next = path[Math.min(n - 1, i + 1)] ?? p;
      tangent.copy(next).sub(prev).normalize();
      view.copy(eye).sub(p).normalize();
      // Across the rope, facing the camera; flames up. Leaning on "up" keeps it steady where the rope
      // runs straight towards the camera.
      side.crossVectors(view, tangent);
      if (side.y < 0) side.negate();
      side.addScaledVector(UP, 0.25).normalize();
      // The ribbon is narrower where the rope turns towards the camera (seen end-on).
      const w = width * (0.55 + 0.45 * Math.min(1, side.length()));
      pos.setXYZ(i * 2, p.x - side.x * w * CORE_V, p.y - side.y * w * CORE_V, p.z - side.z * w * CORE_V);
      pos.setXYZ(i * 2 + 1, p.x + side.x * w * (1 - CORE_V), p.y + side.y * w * (1 - CORE_V), p.z + side.z * w * (1 - CORE_V));
    }
    pos.needsUpdate = true;
    geometry.computeBoundingSphere();
  });

  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false}>
      <meshBasicMaterial map={texture} transparent depthWrite={false} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}
