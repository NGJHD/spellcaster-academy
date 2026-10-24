/**
 * Readies hidden objects (the next area, upcoming creatures) before they are seen: their shaders are
 * compiled in the background (KHR_parallel_shader_compile, so nothing blocks) and their textures are
 * uploaded. Without this, the first frame that showed them waited seconds on shader compiles.
 */
import { Texture, type Camera, type Material, type Object3D, type Scene, type WebGLRenderer } from 'three';

/** Meshes, sprites and the like under `root` (a cheap fingerprint for "something new has loaded"). */
export function countDrawables(root: Object3D): number {
  let n = 0;
  root.traverse((o) => {
    if ((o as { material?: unknown }).material) n++;
  });
  return n;
}

/** Compiles everything under `root` as if it were visible, then hides it again; resolves when ready. */
export function warmUp(gl: WebGLRenderer, root: Object3D, camera: Camera, scene: Scene): Promise<unknown> {
  const wasVisible = root.visible;
  root.visible = true;
  let ready: Promise<unknown>;
  try {
    // The compile call itself only starts the work; it runs before the root is hidden again.
    ready = gl.compileAsync(root, camera, scene);
    const seen = new Set<Texture>();
    root.traverseVisible((o) => {
      const m = (o as { material?: Material | Material[] }).material;
      for (const mat of Array.isArray(m) ? m : m ? [m] : []) {
        for (const value of Object.values(mat)) {
          if (value instanceof Texture && !seen.has(value) && value.image) {
            seen.add(value);
            gl.initTexture(value);
          }
        }
      }
    });
  } finally {
    root.visible = wasVisible;
  }
  return ready;
}
