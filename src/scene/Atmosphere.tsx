import { Environment, Sky, Stars } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Color, Fog, Vector3, type DirectionalLight, type Group } from 'three';
import type { AreaId } from '../game/types';
import { useSettingsStore } from '../state/settingsStore';
import { AREA_LOOKS } from './areaLooks';
import { Drift, RedSky } from './RedSky';

const sunDir = new Vector3();
const forward = new Vector3();

/**
 * Lighting and atmosphere for the current area: one shadow-casting sun that follows the camera,
 * a hemisphere fill, fog, sky/stars, and a procedural environment map for PBR reflections.
 */
export function Atmosphere({ areaId }: { areaId: AreaId }) {
  const look = AREA_LOOKS[areaId];
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const quality = useSettingsStore((s) => s.quality);
  const sun = useRef<DirectionalLight>(null);
  const skyRig = useRef<Group>(null);

  useEffect(() => {
    scene.background = new Color(look.background);
    scene.fog = new Fog(look.fog[0], look.fog[1], look.fog[2]);
    gl.toneMappingExposure = look.exposure;
    scene.environmentIntensity = look.envIntensity;
  }, [scene, gl, look]);

  useFrame((state) => {
    skyRig.current?.position.copy(state.camera.position);
    const light = sun.current;
    if (!light || !look.sun) return;
    // Keep the shadow frustum around what the camera sees (one shadow light only, §15).
    state.camera.getWorldDirection(forward);
    sunDir.set(...look.sun.position).normalize();
    const cx = state.camera.position.x + forward.x * 10;
    const cz = state.camera.position.z + forward.z * 10;
    light.target.position.set(cx, state.camera.position.y - 1.6, cz);
    light.position.set(cx + sunDir.x * 60, state.camera.position.y + sunDir.y * 60, cz + sunDir.z * 60);
    light.target.updateMatrixWorld();
  });

  const shadowSize = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <hemisphereLight args={[look.hemi[0], look.hemi[1], look.hemi[2]]} />
      {look.sun && (
        <directionalLight
          ref={sun}
          color={look.sun.color}
          intensity={look.sun.intensity}
          castShadow={quality !== 'low'}
          shadow-mapSize={[shadowSize, shadowSize]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.03}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={1}
          shadow-camera-far={160}
        />
      )}
      {/* The sky box follows the camera: areas far from the origin would otherwise look past its edge. */}
      <group ref={skyRig}>
      {look.sky === 'afternoon' && <Sky distance={700} sunPosition={look.sun?.position ?? [0, 1, 0]} turbidity={4.5} rayleigh={1.1} mieCoefficient={0.004} mieDirectionalG={0.8} />}
      {look.sky === 'dawn' && <Sky distance={700} sunPosition={look.sun?.position ?? [1, 0.1, 0]} turbidity={7} rayleigh={2.4} mieCoefficient={0.006} mieDirectionalG={0.85} />}
      {(look.sky === 'inferno' || look.sky === 'blank') && <RedSky kind={look.sky} />}
      </group>
      {look.sky === 'inferno' && <Stars radius={300} depth={60} count={quality === 'low' ? 600 : 1500} factor={4} saturation={0} fade speed={0.2} />}
      {/* Embers drift through the burning academy; grey ash falls in the Blank (indoors too in Level 2). */}
      {(look.sky === 'inferno' || (look.sky === 'interior' && look.background.startsWith('#16'))) && <Drift kind="embers" />}
      {look.sky === 'blank' && <Drift kind="ash" />}
      {look.sky === 'night' && <Stars radius={300} depth={60} count={quality === 'low' ? 1500 : 4000} factor={5} saturation={0.2} fade speed={0.3} />}
      {/* CC0 HDRI image-based lighting for physically plausible reflections (lighting only, not the backdrop). */}
      <Environment files={`${import.meta.env.BASE_URL}assets/hdri/${look.hdri}_1k.hdr`} />
    </>
  );
}
