/**
 * Molten ink (Level 3; owner 2026-10-07: "needs some realistic rendering"): a cooled dark crust broken
 * into plates with glowing seams (baked by assets-src/scripts/sky/molten.py from a CC0 photo). The
 * texture drifts slowly downstream and the glow breathes, so rivers and falls read as flowing heat.
 */
import { useFrame } from '@react-three/fiber';
import { MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from 'three';

const loader = new TextureLoader();
function tex(name: string): Texture {
  const t = loader.load(`${import.meta.env.BASE_URL}assets/textures/molten_ink/${name}.jpg`);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

let material: MeshStandardMaterial | null = null;

/** The shared molten-ink material; UVs are in metres on kit geometry, one tile every `tile` metres. */
export function moltenInk(): MeshStandardMaterial {
  if (material) return material;
  const map = tex('diff');
  const glow = tex('glow');
  // Large plates: smaller tiles read as a tiled floor rather than cooling lava.
  for (const t of [map, glow]) t.repeat.set(1 / 15, 1 / 15);
  material = new MeshStandardMaterial({ map, emissiveMap: glow, emissive: '#ffffff', emissiveIntensity: 2.2, roughness: 0.55, metalness: 0 });
  return material;
}

/** Animates the shared molten ink (mount once per scene that shows it). */
export function useMoltenFlow(speed = 0.03): void {
  useFrame((state) => {
    const m = moltenInk();
    const t = state.clock.elapsedTime;
    if (m.map) m.map.offset.y = t * speed;
    if (m.emissiveMap) m.emissiveMap.offset.y = t * speed;
    m.emissiveIntensity = 2.0 + Math.sin(t * 1.7) * 0.35 + Math.sin(t * 4.1) * 0.15;
  });
}
