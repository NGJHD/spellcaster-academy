/**
 * Low-lying mist over a plain (owner, 2026-10-23: "the fog still covers the ground but the top half of the
 * trees are still peeking out", the central path kept clear). Scene fog in three.js has no height, so the
 * mist is a few stacked, slowly drifting translucent sheets a few metres up. Each sheet fades to nothing
 * over the path, and the whole mist fades out as the camera comes down to it, so from the ground it never
 * hangs overhead.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { CanvasTexture, DoubleSide, Float32BufferAttribute, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three';

/** A tiling cloudy alpha texture (periodic value noise, three octaves). */
function mistTexture(): CanvasTexture {
  const S = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = S;
  const g = canvas.getContext('2d');
  const hash = (x: number, y: number, p: number) => {
    const v = Math.sin(((x % p) + p) % p * 127.1 + (((y % p) + p) % p) * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const noise = (x: number, y: number, p: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, p) + (hash(xi + 1, yi, p) - hash(xi, yi, p)) * sx;
    const b = hash(xi, yi + 1, p) + (hash(xi + 1, yi + 1, p) - hash(xi, yi + 1, p)) * sx;
    return a + (b - a) * sy;
  };
  if (g) {
    const img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        let n = 0;
        let amp = 0.55;
        for (const p of [4, 8, 16]) {
          n += noise((x / S) * p, (y / S) * p, p) * amp;
          amp *= 0.5;
        }
        const a = Math.min(1, Math.max(0, (n - 0.22) * 1.9));
        const i = (y * S + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

interface MistProps {
  /** Extent of the sheets (local x and z). */
  readonly x: readonly [number, number];
  readonly z: readonly [number, number];
  /** Half-width of the clear path, and how far the mist takes to thicken beyond it. */
  readonly clear: number;
  /** The path's centre line: x at a given z (straight down x = 0 by default). */
  readonly pathX?: (z: number) => number;
  /** Thins out over this many metres towards the far end (z[0]), e.g. at a cliff edge. */
  readonly fadeFar?: number;
  readonly edge?: number;
  /** Heights of the sheets (metres), thickest first. */
  readonly layers?: readonly number[];
  readonly color?: string;
  readonly opacity?: number;
  /** Camera heights (world) over which the mist fades out as the camera comes down. */
  readonly fadeBelow?: readonly [number, number];
}

export function GroundMist({ x, z, clear, pathX = () => 0, fadeFar = 0, edge = 18, layers = [1.2, 2.6, 4, 5.2], color = '#b4523a', opacity = 0.85, fadeBelow = [10, 24] }: MistProps) {
  const { geometry, materials } = useMemo(() => {
    const w = x[1] - x[0];
    const d = z[1] - z[0];
    const geo = new PlaneGeometry(w, d, Math.ceil(w / 4), Math.ceil(d / 6));
    geo.rotateX(-Math.PI / 2);
    geo.translate((x[0] + x[1]) / 2, 0, (z[0] + z[1]) / 2);
    // Per-vertex alpha: none over the path, thickening to full over `edge` metres beyond it.
    const pos = geo.getAttribute('position');
    const colours: number[] = [];
    const ramp = (v: number) => {
      const c = Math.min(1, Math.max(0, v));
      return c * c * (3 - 2 * c);
    };
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const far = fadeFar > 0 ? ramp((pz - z[0]) / fadeFar) : 1;
      colours.push(1, 1, 1, ramp((Math.abs(px - pathX(pz)) - clear) / edge) * far);
    }
    geo.setAttribute('color', new Float32BufferAttribute(colours, 4));
    const tex = mistTexture();
    const mats = layers.map((_, k) => {
      const t = tex.clone();
      t.repeat.set(w / (70 + k * 25), d / (70 + k * 25));
      t.offset.set(k * 0.37, k * 0.61);
      t.needsUpdate = true;
      return new MeshBasicMaterial({ color, map: t, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, side: DoubleSide });
    });
    return { geometry: geo, materials: mats };
  }, [x, z, clear, pathX, fadeFar, edge, layers, color]);

  useFrame((state, delta) => {
    const [lo, hi] = fadeBelow;
    const k = Math.min(1, Math.max(0, (state.camera.position.y - lo) / (hi - lo)));
    const dt = Math.min(delta, 0.1);
    materials.forEach((m, i) => {
      // The lower sheets are the thickest; each drifts slowly on its own heading.
      m.opacity = opacity * k * (1 - i * 0.17);
      if (m.map) m.map.offset.x += dt * 0.004 * (i % 2 ? 1 : -1);
      if (m.map) m.map.offset.y += dt * 0.0025;
    });
  });

  return (
    <group>
      {layers.map((h, i) => (
        <mesh key={i} geometry={geometry} material={materials[i]} position={[0, h, 0]} frustumCulled={false} />
      ))}
    </group>
  );
}
