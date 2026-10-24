/**
 * A dense forest either side of a path (owner, 2026-10-24: "can there be a dense forest? the sprites are
 * supposed to come from a forest"): hundreds of far trees as impostors, each a pair of crossed cards
 * carrying a picture of a whole tree (Flux-painted, tree_cards.py), so the forest costs a few triangles a tree. Full tree models stay in the near rows.
 */
import { useTexture } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Euler, Float32BufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, Quaternion, SRGBColorSpace, Vector3, Color } from 'three';

const base = `${import.meta.env.BASE_URL}assets/textures/impostors/`;

/**
 * The pictures, their width for a height of 1, how tall the trees grow (metres) and their share of the
 * forest: a beech wood with some limes among the beeches (owner, 2026-10-24: a mix of many kinds did not
 * look like a forest).
 */
const KINDS = [
  { file: 'beech_card', aspect: 2 / 3, height: [16, 23], share: 0.75 },
  { file: 'lime_card', aspect: 2 / 3, height: [15, 21], share: 0.25 },
] as const;

/** Deterministic scatter (render must stay pure and repeatable). */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Two crossed upright cards, 1 tall and `aspect` wide, standing on their bottom edge, lit as if facing up. */
function crossedCards(aspect: number): BufferGeometry {
  const w = aspect / 2;
  const pos: number[] = [];
  const uv: number[] = [];
  for (const [dx, dz] of [[1, 0], [0, 1]] as const) {
    const corners = [
      [-w * dx, 0, -w * dz, 0, 0],
      [w * dx, 0, w * dz, 1, 0],
      [w * dx, 1, w * dz, 1, 1],
      [-w * dx, 1, -w * dz, 0, 1],
    ] as const;
    // Both windings, so each card has a real back face (a double-sided material flips the normal there,
    // and the back of every card went dark).
    for (const k of [0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]) {
      const c = corners[k];
      if (!c) continue;
      pos.push(c[0], c[1], c[2]);
      uv.push(c[3], c[4]);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  // Normals straight up: every card is lit the same whichever way it is turned (the picture has its own shading).
  g.setAttribute('normal', new Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  return g;
}

interface WoodlandProps {
  /** Path centre line: x at a given z (local space). */
  readonly pathX?: (z: number) => number;
  /** Where the forest starts either side of the path, and how far out it goes. */
  readonly clear: number;
  readonly depth: number;
  readonly zRange: readonly [number, number];
  /** Trees per 100 square metres. */
  readonly density?: number;
  /** Places to keep clear (x, z, radius). */
  readonly avoid?: readonly (readonly [number, number, number])[];
  /** Multiplies the pictures (time of day). */
  readonly tint?: string;
  readonly seed?: number;
}

export function Woodland({ pathX = () => 0, clear, depth, zRange, density = 1.5, avoid = [], tint = '#ffffff', seed = 1 }: WoodlandProps) {
  const textures = useTexture(KINDS.map((k) => `${base}${k.file}.png`));
  const parts = useMemo(
    () =>
      KINDS.map((k, i) => {
        const map = textures[i];
        if (map) {
          map.colorSpace = SRGBColorSpace;
          map.anisotropy = 4;
        }
        return {
          geometry: crossedCards(k.aspect),
          material: new MeshStandardMaterial({ map, alphaTest: 0.45, roughness: 1, color: new Color(tint).multiplyScalar(0.85), envMapIntensity: 0.5 }),
        };
      }),
    [textures, tint],
  );

  const key = JSON.stringify([clear, depth, zRange, density, avoid, seed]);
  const placements = useMemo(() => {
    const out: Matrix4[][] = KINDS.map(() => []);
    const [z0, z1] = [Math.min(...zRange), Math.max(...zRange)];
    const count = Math.round(((z1 - z0) * depth * 2 * density) / 100);
    for (let i = 0; i < count; i++) {
      const k = i + seed * 10000;
      const z = z0 + rand(k, 1) * (z1 - z0);
      const side = rand(k, 2) < 0.5 ? -1 : 1;
      // A ragged forest edge, then trees all the way out.
      const edge = clear + (Math.sin(z * 0.11 + side) * 0.5 + 0.5) * 6;
      const x = pathX(z) + side * (edge + rand(k, 3) * depth);
      if (avoid.some(([ax, az, r]) => (x - ax) ** 2 + (z - az) ** 2 < r * r)) continue;
      const kind = rand(k, 5) < (KINDS[0]?.share ?? 1) ? 0 : 1;
      const spec = KINDS[kind];
      if (!spec) continue;
      const h = spec.height[0] + rand(k, 6) * (spec.height[1] - spec.height[0]);
      const q = new Quaternion().setFromEuler(new Euler(0, rand(k, 7) * Math.PI, 0));
      out[kind]?.push(new Matrix4().compose(new Vector3(x, -0.2, z), q, new Vector3(h, h, h)));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` carries the inputs by value; pathX is stable per caller
  }, [key]);

  return (
    <group>
      {parts.map((p, i) => (
        <Cards key={KINDS[i]?.file} geometry={p.geometry} material={p.material} matrices={placements[i] ?? []} />
      ))}
    </group>
  );
}

function Cards({ geometry, material, matrices }: { geometry: BufferGeometry; material: MeshStandardMaterial; matrices: readonly Matrix4[] }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices]);
  if (matrices.length === 0) return null;
  return <instancedMesh ref={ref} args={[geometry, material, matrices.length]} />;
}
