import { SRGBColorSpace, TextureLoader, type Texture } from 'three';

/**
 * Flux-painted effect sprites (assets-src/scripts/ai/fx_sprites.py), loaded once each and shared:
 * dust, smoke, splashes, motes, sparks, embers, ash, fire, the crack in the sky and lightning.
 */
export type FxSpriteName =
  | 'dust_1'
  | 'dust_2'
  | 'dust_3'
  | 'smoke_1'
  | 'smoke_2'
  | 'fireball'
  | 'mote'
  | 'spark'
  | 'splash_1'
  | 'splash_2'
  | 'droplet'
  | 'ember'
  | 'ash'
  | 'tear_1'
  | 'tear_2'
  | 'bolt_1'
  | 'bolt_2'
  | 'script_ring';

const cache = new Map<FxSpriteName, Texture>();
let loader: TextureLoader | null = null;

export function fxSprite(name: FxSpriteName): Texture {
  const hit = cache.get(name);
  if (hit) return hit;
  loader ??= new TextureLoader();
  const tex = loader.load(`${import.meta.env.BASE_URL}assets/textures/fx/sprites/${name}.png`);
  tex.colorSpace = SRGBColorSpace;
  cache.set(name, tex);
  return tex;
}
