import { useLayoutEffect, useRef } from 'react';
import type { DirectionalLight } from 'three';

/** Warm late-afternoon sun from the south-west, so facades facing the arrival path are lit. */
export const SUN_POSITION: [number, number, number] = [-60, 45, 80];

/** Centre of the shadowed play space (courtyard and gate). */
const SHADOW_FOCUS: [number, number, number] = [4, 0, 4];

export function Lighting() {
  const sun = useRef<DirectionalLight>(null);

  useLayoutEffect(() => {
    const light = sun.current;
    if (!light) return;
    light.target.position.set(...SHADOW_FOCUS);
    light.target.updateMatrixWorld();
  }, []);

  return (
    <>
      <hemisphereLight args={['#dbe8ff', '#6d5a3c', 1.1]} />
      <directionalLight
        ref={sun}
        position={[SUN_POSITION[0] * 0.8 + SHADOW_FOCUS[0], SUN_POSITION[1] * 0.8, SUN_POSITION[2] * 0.8 + SHADOW_FOCUS[2]]}
        intensity={2.6}
        color="#ffe2b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={45}
        shadow-camera-bottom={-45}
        shadow-camera-near={10}
        shadow-camera-far={220}
      />
    </>
  );
}
