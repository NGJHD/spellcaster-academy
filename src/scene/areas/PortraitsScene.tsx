/** PLACEHOLDER Hall of Portraits (§14A.20). Local coordinates; see src/level/areas/portraits.ts. */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { PLAQUE_POSITIONS, PORTRAITS_ORIGIN } from '../../level/areas/portraits';
import { getRun } from '../../state/gameStore';
import { Arch, Bench, Box, Portrait, Rug, Slab, WallLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import { Mira } from '../props';

const W = 3;
const H = 5.5;
const PORTRAIT_TINTS = ['#5a3a2a', '#2f3b55', '#4a3a24', '#3a2a40', '#2e4a3a', '#5a4a30'];

export function PortraitsScene() {
  return (
    <group name="portraits" position={PORTRAITS_ORIGIN}>
      <Slab x={[-W, W]} y={[-0.1, 0]} z={[-41, 2]} material={MAT.paving} shadows={false} />
      <Rug position={[0, 0, -19.5]} size={[2.2, 40]} />
      <Slab x={[-W - 0.3, -W]} y={[0, H]} z={[-41, 2]} material={MAT.plaster} />
      <Slab x={[W, W + 0.3]} y={[0, H]} z={[-41, 2]} material={MAT.plaster} />
      <Slab x={[-W - 0.3, W + 0.3]} y={[H, H + 0.3]} z={[-41, 2]} material={MAT.darkOak} />
      <Slab x={[-W, W]} y={[0, H]} z={[-41.3, -41]} material={MAT.academyStone} />
      <WindowPane position={[0, 2.8, -40.95]} size={[2.4, 4]} />
      {Array.from({ length: 8 }, (_, i) => -2 - i * 5).map((z) => (
        <Arch key={z} position={[0, H - 0.2, z]} width={W * 2} thickness={0.25} material={MAT.darkOak} />
      ))}
      {Array.from({ length: 7 }, (_, i) => -3 - i * 5.2).map((z, i) => (
        <group key={z}>
          <Portrait position={[-W + 0.05, 2.6, z]} rotationY={Math.PI / 2} tint={PORTRAIT_TINTS[i % 6]} seed={i} />
          {i !== 2 && i !== 5 && <Portrait position={[W - 0.05, 2.6, z - 2]} rotationY={-Math.PI / 2} tint={PORTRAIT_TINTS[(i + 3) % 6]} seed={i + 4} size={[1.0, 1.3]} />}
          <WallLamp position={[-W + 0.02, 3.8, z - 2.6]} rotationY={Math.PI / 2} />
          <pointLight position={[0, 4.2, z - 1]} color="#ffcf98" intensity={7} distance={8} decay={2} />
        </group>
      ))}
      <FocusFountain />
      <CommunicationMirror />
      {PLAQUE_POSITIONS.map((p, i) => (
        <group key={i} position={[p[0] - PORTRAITS_ORIGIN[0] - 0.05, p[1] - PORTRAITS_ORIGIN[1], p[2] - PORTRAITS_ORIGIN[2]]} rotation={[0, -Math.PI / 2, 0]}>
          <Box position={[0, 0, 0]} size={[0.9, 0.6, 0.06]} material={MAT.agedBrass} />
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[-0.25 + k * 0.17, ((k * 37 + i * 11) % 5) * 0.05 - 0.1, 0.04]} material={MAT.wardBlue}>
              <circleGeometry args={[0.025, 8]} />
            </mesh>
          ))}
        </group>
      ))}
      <Bench position={[-2.2, 0, -16]} rotationY={Math.PI / 2} upholstered />
      <Bench position={[2.2, 0, -24]} rotationY={-Math.PI / 2} upholstered />
    </group>
  );
}

function FocusFountain() {
  const glow = useRef<Mesh>(null);
  useFrame((state) => {
    if (glow.current) glow.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
  });
  return (
    <group position={[2.2, 0, -14]}>
      <mesh position={[0, 0.45, 0]} material={MAT.academyStone} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.7, 0.9, 24]} />
      </mesh>
      <mesh position={[0, 0.91, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[0.52, 24]} />
      </mesh>
      <mesh ref={glow} position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.08, 0.3, 1.3, 16, 1, true]} />
        <meshBasicMaterial color="#bfe6ff" transparent opacity={0.25} depthWrite={false} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color="#bfe6ff" intensity={5} distance={5} />
    </group>
  );
}

function CommunicationMirror() {
  const surface = useRef<Mesh>(null);
  useFrame(() => {
    const beat = getRun()?.director.currentBeat?.id;
    if (surface.current) surface.current.visible = beat === 'portraits-mirror';
  });
  return (
    <group position={[-W + 0.06, 1.9, -22]} rotation={[0, Math.PI / 2, 0]}>
      <Box position={[0, 0, -0.02]} size={[1.3, 2.0, 0.08]} material={MAT.agedBrass} />
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[1.1, 1.8]} />
        <meshStandardMaterial color="#9fb6c8" roughness={0.05} metalness={0.9} />
      </mesh>
      <group ref={surface} position={[0, -0.85, 0.12]} scale={0.75} visible={false}>
        <Mira position={[0, 0, 0]} rotationY={0} />
      </group>
    </group>
  );
}
