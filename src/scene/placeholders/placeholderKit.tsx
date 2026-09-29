/**
 * PLACEHOLDER ART KIT — flat-coloured primitives standing in for the Blender-authored
 * academy assets (CLAUDE.md §14A). Gameplay code never depends on these components,
 * so each can be swapped for a GLB without touching rails or encounters.
 */
import { MeshStandardMaterial, type Material } from 'three';

export const placeholderMaterials = {
  stone: new MeshStandardMaterial({ color: '#d8b98a', roughness: 0.88 }),
  stoneDark: new MeshStandardMaterial({ color: '#b0916a', roughness: 0.9 }),
  paving: new MeshStandardMaterial({ color: '#cdb892', roughness: 0.92 }),
  slate: new MeshStandardMaterial({ color: '#4d5868', roughness: 0.75 }),
  oak: new MeshStandardMaterial({ color: '#4a3121', roughness: 0.7 }),
  brass: new MeshStandardMaterial({ color: '#c8a052', roughness: 0.35, metalness: 0.9 }),
  navyCloth: new MeshStandardMaterial({ color: '#233a6b', roughness: 0.95 }),
  grass: new MeshStandardMaterial({ color: '#6c8c4a', roughness: 1 }),
  hedge: new MeshStandardMaterial({ color: '#3f6b35', roughness: 1 }),
  bark: new MeshStandardMaterial({ color: '#5a4230', roughness: 1 }),
  water: new MeshStandardMaterial({ color: '#6fb4d8', roughness: 0.1, metalness: 0.1 }),
  crystal: new MeshStandardMaterial({ color: '#bfe4ff', emissive: '#5aa8ff', emissiveIntensity: 1.6, roughness: 0.2 }),
  wardGold: new MeshStandardMaterial({ color: '#ffe3a0', emissive: '#ffb640', emissiveIntensity: 1.4, roughness: 0.3 }),
  windowGlow: new MeshStandardMaterial({ color: '#ffd89a', emissive: '#ffb65c', emissiveIntensity: 0.9, roughness: 0.5 }),
  carpet: new MeshStandardMaterial({ color: '#2d4a86', roughness: 1 }),
  plaster: new MeshStandardMaterial({ color: '#e6d6b8', roughness: 0.95 }),
  dummy: new MeshStandardMaterial({ color: '#a47a4d', roughness: 0.8 }),
  mira: new MeshStandardMaterial({ color: '#3a5fa8', roughness: 0.9 }),
} satisfies Record<string, Material>;

type V3 = readonly [number, number, number];

interface BoxProps {
  readonly position: V3;
  readonly size: V3;
  readonly material: Material;
  readonly rotationY?: number;
  readonly shadows?: boolean;
}

/** Axis-aligned box positioned by its centre. */
export function Box({ position, size, material, rotationY = 0, shadows = true }: BoxProps) {
  return (
    <mesh position={position} rotation-y={rotationY} material={material} castShadow={shadows} receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** Box spanning two corners on the floor (x0,z0)–(x1,z1), from y0 to y1. Easier for authoring walls. */
export function Slab({
  x: [x0, x1],
  y: [y0, y1],
  z: [z0, z1],
  material,
  shadows = true,
}: {
  readonly x: readonly [number, number];
  readonly y: readonly [number, number];
  readonly z: readonly [number, number];
  readonly material: Material;
  readonly shadows?: boolean;
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

/** Deterministic pseudo-random sequence so placeholder scatter never changes between runs. */
export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
