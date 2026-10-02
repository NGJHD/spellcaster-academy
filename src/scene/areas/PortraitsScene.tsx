/** PLACEHOLDER Hall of Portraits (§14A.20). Local coordinates; see src/level/areas/portraits.ts. */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import { PLAQUE_POSITIONS, PORTRAITS_ORIGIN } from '../../level/areas/portraits';
import { getRun } from '../../state/gameStore';
import { Arch, Box, KitModel, Portrait, Rug, Slab, WallLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { Mira } from '../props';
import { Prop } from '../Prop';

const W = 3;
const H = 5.5;
/** Left wall: still lifes and bust studies; right wall mixes in the academy landscapes. */
const LEFT = ['painting_0', 'painting_1', 'painting_4', 'painting_2', 'painting_6', 'painting_3', 'painting_5'] as const;
const RIGHT = ['landscape_0', 'painting_7', 'painting_9', 'landscape_1', 'painting_8'] as const;

export function PortraitsScene() {
  return (
    <group name="portraits" position={PORTRAITS_ORIGIN}>
      <MergeStatic>
      <Slab x={[-W, W]} y={[-0.1, 0]} z={[-41, 2]} material={MAT.paving} shadows={false} />
      <Rug position={[0, 0, -19.5]} size={[2.2, 40]} />
      <Slab x={[-W - 0.3, -W]} y={[0, H]} z={[-41, 2]} material={MAT.plaster} />
      <Slab x={[W, W + 0.3]} y={[0, H]} z={[-41, 2]} material={MAT.plaster} />
      {/* Oak wainscot with dado rail, skirting and a picture rail */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab x={side < 0 ? [-W, -W + 0.04] : [W - 0.04, W]} y={[0, 1.2]} z={[-41, 2]} material={MAT.panelWood} />
          <Slab x={side < 0 ? [-W, -W + 0.07] : [W - 0.07, W]} y={[1.2, 1.27]} z={[-41, 2]} material={MAT.darkOak} />
          <Slab x={side < 0 ? [-W, -W + 0.06] : [W - 0.06, W]} y={[0, 0.16]} z={[-41, 2]} material={MAT.darkOak} />
          <Slab x={side < 0 ? [-W, -W + 0.05] : [W - 0.05, W]} y={[3.85, 3.92]} z={[-41, 2]} material={MAT.darkOak} />
        </group>
      ))}
      <Slab x={[-W - 0.3, W + 0.3]} y={[H, H + 0.3]} z={[-41, 2]} material={MAT.darkOak} />
      <Slab x={[-W, W]} y={[0, H]} z={[-41.3, -41]} material={MAT.academyStone} />
      <WindowPane position={[0, 2.8, -40.95]} size={[2.4, 4]} />
      {Array.from({ length: 8 }, (_, i) => -2 - i * 5).map((z) => (
        <Arch key={z} position={[0, H - 0.2, z]} width={W * 2} thickness={0.25} material={MAT.darkOak} />
      ))}
      {Array.from({ length: 7 }, (_, i) => -3 - i * 5.2).map((z, i) => (
        <group key={z}>
          <Portrait position={[-W + 0.05, 2.5, z]} rotationY={Math.PI / 2} painting={LEFT[i]} />
          {i !== 2 && i !== 5 && (
            <Portrait
              position={[W - 0.05, 2.5, z - 2]}
              rotationY={-Math.PI / 2}
              painting={RIGHT[[0, 1, -1, 2, 3, -1, 4][i] ?? 0]}
              size={RIGHT[[0, 1, -1, 2, 3, -1, 4][i] ?? 0]?.startsWith('landscape') ? [1.6, 1.1] : [1.0, 1.3]}
            />
          )}
          <WallLamp position={[-W + 0.02, 3.8, z - 2.6]} rotationY={Math.PI / 2} />
          <pointLight position={[0, 4.2, z - 1]} color="#ffcf98" intensity={7} distance={8} decay={2} />
        </group>
      ))}
      </MergeStatic>
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
      <KitModel id="gallery_bench" position={[-2.2, 0, -16]} rotationY={Math.PI / 2} />
      <KitModel id="gallery_bench" position={[2.2, 0, -24]} rotationY={-Math.PI / 2} />
      <Prop id="gothic_statue" position={[0, 0, -39.6]} height={2.3} />
      <Prop id="potted_plant_02" position={[-2.4, 0, -35]} height={1.3} />
      <Prop id="potted_plant_02" position={[2.4, 0, -6]} height={1.3} rotationY={2} />
      <Prop id="brass_candleholders" position={[2.2, 0.9, -13.2]} height={0.3} />
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
      <KitModel id="fountain_basin" />
      <mesh position={[0, 0.88, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[0.7, 40]} />
      </mesh>
      <mesh position={[0, 1.38, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[0.24, 24]} />
      </mesh>
      <mesh ref={glow} position={[0, 2.05, 0]}>
        <cylinderGeometry args={[0.04, 0.2, 1.2, 16, 1, true]} />
        <meshBasicMaterial color="#bfe6ff" transparent opacity={0.1} depthWrite={false} toneMapped={false} />
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
      <KitModel id="frame_1x1_3" scale={[1.1, 1.38, 1]} position={[0, 0, 0.0]} />
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
