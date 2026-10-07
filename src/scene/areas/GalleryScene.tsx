/** PLACEHOLDER Practice Gallery (§14A.23): prestigious duelling hall with three zones. */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { GALLERY_ORIGIN, GALLERY_ZONES, MIRA_GALLERY_POSITION } from '../../level/areas/gallery';
import { getRun } from '../../state/gameStore';
import { Arch, Column, Slab, StandingLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { Mira, Student } from '../props';
import { Prop } from '../Prop';

const W = 6;
const H = 9;
const ZONE_ENCOUNTERS = ['gallery-p1', 'gallery-p2'] as const;

export function GalleryScene() {
  const mira: [number, number, number] = [
    MIRA_GALLERY_POSITION[0] - GALLERY_ORIGIN[0],
    0,
    MIRA_GALLERY_POSITION[2] - GALLERY_ORIGIN[2],
  ];
  return (
    <group name="gallery" position={GALLERY_ORIGIN}>
      <MergeStatic>
      <Slab x={[-W, W]} y={[-0.1, 0]} z={[-63, 2]} material={MAT.lightOak} shadows={false} />
      <Slab x={[-W - 0.4, -W]} y={[0, H]} z={[-63, 2]} material={MAT.academyStone} />
      <Slab x={[W, W + 0.4]} y={[0, H]} z={[-63, 2]} material={MAT.academyStone} />
      <Slab x={[-W - 0.4, W + 0.4]} y={[H, H + 0.4]} z={[-63, 2]} material={MAT.darkOak} />
      <Slab x={[-W, W]} y={[0, H]} z={[-63.4, -63]} material={MAT.academyStone} />
      <Slab x={[-1.6, 1.6]} y={[0, 4]} z={[-62.95, -62.9]} material={MAT.darkOak} />
      {Array.from({ length: 9 }, (_, i) => -2 - i * 7).map((z) => (
        <group key={z}>
          <Column position={[-W + 0.5, 0, z]} height={H} radius={0.35} />
          <Column position={[W - 0.5, 0, z]} height={H} radius={0.35} />
          <Arch position={[0, H - 1.2, z]} width={W * 2 - 1} thickness={0.35} material={MAT.academyStoneDark} />
          <WindowPane position={[-W + 0.02, 5.5, z - 3.5]} size={[1.8, 4]} rotationY={Math.PI / 2} />
          <WindowPane position={[W - 0.02, 5.5, z - 3.5]} size={[1.8, 4]} rotationY={-Math.PI / 2} />
        </group>
      ))}
      {/* Observation balcony silhouettes */}
      <Slab x={[-W, -W + 1.6]} y={[4.6, 4.8]} z={[-60, -2]} material={MAT.darkOak} />
      </MergeStatic>
      {[-10, -22, -35, -47].map((z, i) => (
        <Student key={z} position={[-W + 0.8, 4.8, z]} rotationY={Math.PI / 2} height={1.4 + (i % 2) * 0.1} />
      ))}
      {GALLERY_ZONES.map((z, i) => (
        <ZoneEmblem key={z} z={z} index={i} />
      ))}
      {GALLERY_ZONES.map((z, i) => (
        <Barrier key={`barrier-${z}`} z={z - 7} encounterId={ZONE_ENCOUNTERS[i] ?? 'gallery-p1'} />
      ))}
      {[-4.8, 4.8].flatMap((x) => [-10, -28, -46].map((z) => <StandingLamp key={`${x}${z}`} position={[x, 0, z]} light={x < 0} />))}
      {[-18, -38].map((z) => (
        <group key={z} position={[W - 0.6, 0, z]}>
          {/* A wand rack: real display shelves (CC0) with practice wands resting on them */}
          <Prop id="wooden_display_shelves_01" position={[0, 0, 0]} height={2} rotationY={-Math.PI / 2} />
          {[-0.6, 0, 0.6].map((dz) => (
            <mesh key={dz} position={[-0.2, 1.35, dz]} rotation={[0, 0, 0.3]} material={MAT.lightOak}>
              <cylinderGeometry args={[0.015, 0.025, 1.0, 12]} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[3.2, 0, -55]}>
        <mesh position={[0, 0.5, 0]} material={MAT.academyStone}>
          <cylinderGeometry args={[0.4, 0.5, 1, 20]} />
        </mesh>
        <mesh position={[0, 1.25, 0]} material={MAT.crystal}>
          <octahedronGeometry args={[0.25]} />
        </mesh>
      </group>
      {/* Mira's station: a table with practice books and a candle (was a flat brass panel) */}
      <Prop id="WoodenTable_01" position={[-4.6, 0, -8.2]} height={0.85} />
      <Prop id="book_encyclopedia_set_01" position={[-4.9, 0.86, -8.2]} height={0.3} rotationY={0.4} />
      <Prop id="brass_candleholders" position={[-4.0, 0.86, -8.1]} height={0.35} />
      <Mira position={mira} rotationY={0.8} />
      <pointLight position={[0, 7, -30]} color="#ffe9c8" intensity={40} distance={50} decay={2} />
    </group>
  );
}

function ZoneEmblem({ z, index }: { z: number; index: number }) {
  return (
    <group position={[0, 0.015, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
        <ringGeometry args={[3, 3.2, 64]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, index * 0.6]} material={MAT.agedBrass}>
        <ringGeometry args={[1.0, 1.1, 3 + index]} />
      </mesh>
    </group>
  );
}

/** Retractable brass-and-glass barrier that lowers once the previous zone is complete. */
function Barrier({ z, encounterId }: { z: number; encounterId: string }) {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    const done = getRun()?.progress.completedEncounterIds.includes(encounterId) ?? false;
    if (ref.current) ref.current.position.y += ((done ? -2.6 : 0) - ref.current.position.y) * (1 - Math.exp(-1.5 * Math.min(dt, 0.1)));
  });
  return (
    <group ref={ref} position={[0, 0, z]}>
      <Slab x={[-W + 1, W - 1]} y={[0, 0.12]} z={[-0.08, 0.08]} material={MAT.agedBrass} />
      <Slab x={[-W + 1, W - 1]} y={[2.4, 2.5]} z={[-0.08, 0.08]} material={MAT.agedBrass} />
      <mesh position={[0, 1.25, 0]} material={MAT.glass}>
        <planeGeometry args={[W * 2 - 2, 2.3]} />
      </mesh>
    </group>
  );
}
