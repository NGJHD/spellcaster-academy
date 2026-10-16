/**
 * Lantern Lake's water at night (owner, 2026-10-16: "it looks like the lake is iced"; the flat glossy
 * plane read as ice). A slow swell moves the surface, and a drifting, tiling ripple normal map breaks
 * up the reflections of the burning sky, as on real water. Dark, wet and reflective, with a
 * faint red glow from the fires.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { CanvasTexture, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, Vector2 } from 'three';

const TILE = 256;

/** A tiling normal map of small wind ripples: a height field of whole-number waves, differentiated. */
function rippleNormals(): CanvasTexture {
  const height = new Float32Array(TILE * TILE);
  // Whole-number frequencies keep the field seamless across the tile's edges.
  const waves = [
    [3, 1, 0.0, 1.0], [-2, 4, 1.3, 0.8], [5, -3, 2.1, 0.6], [7, 2, 0.4, 0.45], [-6, -5, 3.3, 0.4],
    [11, 4, 1.7, 0.25], [-9, 10, 0.9, 0.22], [14, -11, 2.6, 0.15], [-17, 6, 4.1, 0.12], [19, 15, 5.2, 0.1],
  ] as const;
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let h = 0;
      for (const [fx, fy, phase, amp] of waves) h += Math.sin(((fx * x + fy * y) / TILE) * Math.PI * 2 + phase) * amp;
      height[y * TILE + x] = h;
    }
  }
  const canvas = document.createElement('canvas');
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const img = ctx.createImageData(TILE, TILE);
    const at = (x: number, y: number) => height[((y + TILE) % TILE) * TILE + ((x + TILE) % TILE)] ?? 0;
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const dx = (at(x + 1, y) - at(x - 1, y)) * 0.9;
        const dy = (at(x, y + 1) - at(x, y - 1)) * 0.9;
        const len = Math.hypot(dx, dy, 1);
        const i = (y * TILE + x) * 4;
        img.data[i] = Math.round(((-dx / len) * 0.5 + 0.5) * 255);
        img.data[i + 1] = Math.round(((-dy / len) * 0.5 + 0.5) * 255);
        img.data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

export function LakeWater({ position, size }: { position: readonly [number, number, number]; size: readonly [number, number] }) {
  const { geometry, material, base, ripples } = useMemo(() => {
    const g = new PlaneGeometry(size[0], size[1], 200, 160);
    g.rotateX(-Math.PI / 2);
    const normals = rippleNormals();
    // One ripple tile every 9 m.
    normals.repeat.set(size[0] / 9, size[1] / 9);
    const m = new MeshStandardMaterial({
      color: '#0a1620',
      roughness: 0.24,
      metalness: 0,
      normalMap: normals,
      normalScale: new Vector2(0.3, 0.3),
      // The environment map is a neutral studio light; much of it turned the lake grey.
      envMapIntensity: 0.35,
      emissive: '#3a0b05',
      emissiveIntensity: 0.3,
    });
    return { geometry: g, material: m, base: Float32Array.from(g.getAttribute('position').array), ripples: normals };
  }, [size]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // The ripples drift with the wind.
    ripples.offset.set(t * 0.012, t * 0.02);
    // Rolling swells like the paper sea's (owner, 2026-10-16: the gentle swell still looked flat): long
    // crested waves rolling towards the shore, a cross swell and a choppy surface. The lake sits 0.45 m
    // low, so crests lap the boat's hull but stay below the jetty.
    const pos = geometry.getAttribute('position');
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i] ?? 0;
      const z = base[i + 2] ?? 0;
      const roll = 1 - Math.abs(Math.sin(z * 0.075 - t * 0.8 + Math.sin(x * 0.03) * 0.9));
      const cross = Math.sin(x * 0.06 + z * 0.025 + t * 0.55);
      const chop = Math.sin(x * 0.31 + z * 0.17 + t * 1.6) * Math.sin(z * 0.27 - x * 0.12 - t * 1.3);
      arr[i + 1] = roll * roll * 0.85 - 0.4 + cross * 0.25 + chop * 0.08;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  return <mesh geometry={geometry} material={material} position={position} receiveShadow />;
}
