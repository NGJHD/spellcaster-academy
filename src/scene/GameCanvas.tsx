import { Sky } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import type { RefObject } from 'react';
import { RailCameraController } from '../player/RailCameraController';
import { Lighting, SUN_POSITION } from './Lighting';
import { PlaceholderAcademy } from './placeholders/PlaceholderAcademy';
import { RailGizmos } from './RailGizmos';

/** `?rails` in the URL shows the authored camera rails and node names. */
const SHOW_RAILS = new URLSearchParams(window.location.search).has('rails');

export function GameCanvas({ fadeRef }: { fadeRef: RefObject<HTMLDivElement | null> }) {
  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 60, near: 0.1, far: 700, position: [0, 24, 95] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <Sky distance={600} sunPosition={SUN_POSITION} turbidity={5} rayleigh={1.2} mieCoefficient={0.004} />
      <fog attach="fog" args={['#d8e2ec', 80, 420]} />
      <Lighting />
      <PlaceholderAcademy />
      <RailCameraController fadeRef={fadeRef} />
      {SHOW_RAILS && <RailGizmos />}
    </Canvas>
  );
}
