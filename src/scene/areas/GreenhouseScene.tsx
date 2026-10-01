/** PLACEHOLDER Enchanted Greenhouse (§14A.21). Local coordinates; see src/level/areas/greenhouse.ts. */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { GREENHOUSE_ANCHOR_POSITION, GREENHOUSE_ORIGIN, ROOF_PANEL_POSITION } from '../../level/areas/greenhouse';
import { beatIndexOf } from '../../level/level1Route';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { Box, Shrub, Slab } from '../kit';
import { MAT } from '../materials';
import { DormantTarget, StaticWarden, WardAnchor, spawnPosition, useBeatIndex } from '../props';
import { Prop } from '../Prop';

const local = (p: Vec3): Vec3 => [p[0] - GREENHOUSE_ORIGIN[0], p[1] - GREENHOUSE_ORIGIN[1], p[2] - GREENHOUSE_ORIGIN[2]];
const ROOF = 8;
const WARDEN_BEAT = beatIndexOf('greenhouse-warden-scene');

export function GreenhouseScene() {
  return (
    <group name="greenhouse" position={GREENHOUSE_ORIGIN}>
      <Frame />
      <Beds />
      <Channel />
      <VineBridge />
      {(['pod-1', 'pod-2'] as const).map((id) => (
        <DormantTarget key={id} encounterId="greenhouse-h1" targetId={id} kind="thorn-pod" position={local(spawnPosition('greenhouse-h1', id))} />
      ))}
      <WardAnchor position={local(GREENHOUSE_ANCHOR_POSITION)} encounterId="greenhouse-anchor" theme="greenhouse" />
      <WardenRescue />
    </group>
  );
}

function Frame() {
  const ribs = useMemo(() => Array.from({ length: 14 }, (_, i) => 2 - i * 4), []);
  return (
    <group>
      <Slab x={[-11, 11]} y={[-0.1, 0]} z={[-53, 3]} material={MAT.paving} shadows={false} />
      {ribs.map((z) => (
        <group key={z}>
          {[-1, 1].map((s) => (
            <Box key={s} position={[10.5 * s, ROOF / 2, z]} size={[0.12, ROOF, 0.12]} material={MAT.darkSteel} />
          ))}
          <mesh position={[0, ROOF, z]} rotation={[0, 0, 0]} material={MAT.darkSteel}>
            <torusGeometry args={[10.5, 0.06, 6, 32, Math.PI]} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[10.5 * s, ROOF / 2, -25]} rotation={[0, Math.PI / 2, 0]} material={MAT.glass}>
          <planeGeometry args={[56, ROOF]} />
        </mesh>
      ))}
      <mesh position={[0, ROOF, -25]} rotation={[0, 0, 0]} scale={[1, 0.45, 1]} material={MAT.glass}>
        <cylinderGeometry args={[10.5, 10.5, 56, 32, 1, true, -Math.PI / 2, Math.PI]} />
      </mesh>
      <Slab x={[-10.5, 10.5]} y={[0, 0.6]} z={[2.9, 3]} material={MAT.academyStoneDark} />
      <Slab x={[-10.5, 10.5]} y={[0, ROOF]} z={[-53, -52.9]} material={MAT.academyStone} />
    </group>
  );
}

const PLANT_MATS = [MAT.hedge, MAT.leaf, MAT.moss, MAT.stem];

function Beds() {
  const beds: [number, number, number, number][] = [
    [-8.5, -4, 3, 12],
    [8.5, -4, 3, 12],
    [-8.5, -16, 3, 6],
    [8.5, -16, 3, 6],
    [-8.5, -38, 3, 18],
    [8.5, -36, 3, 14],
  ];
  return (
    <group>
      {beds.map(([x, z, w, d], i) => (
        <group key={i}>
          <Slab x={[x - w / 2, x + w / 2]} y={[0, 0.7]} z={[z - d / 2, z + d / 2]} material={MAT.academyStoneDark} />
          <Slab x={[x - w / 2 + 0.1, x + w / 2 - 0.1]} y={[0.7, 0.75]} z={[z - d / 2 + 0.1, z + d / 2 - 0.1]} material={MAT.soil} shadows={false} />
          {Array.from({ length: Math.max(2, Math.floor(d / 2.2)) }, (_, k) => (
            <BedPlant key={k} position={[x + ((k * 37) % 7) / 10 - 0.3, 0.72, z - d / 2 + 1 + k * 2.1]} index={i * 5 + k} />
          ))}
        </group>
      ))}
      {/* Clear central path; potted plants and benches at the edges only. */}
      {[[-4.5, 1], [4.5, -9], [-4, -32], [5, -47]].map(([x = 0, z = 0], i) => (
        <Prop key={i} id={i % 2 ? 'potted_plant_01' : 'potted_plant_04'} position={[x, 0, z]} height={1.4 + (i % 2) * 0.4} rotationY={i} />
      ))}
      {[[-6, 2.2], [6, 2.2], [-3.5, -50], [3.5, -50]].map(([x = 0, z = 0], i) => (
        <Prop key={`clay${i}`} id="planter_pot_clay" position={[x, 0, z]} height={0.7} />
      ))}
      <Box position={[-4.5, 0.45, -46]} size={[2.2, 0.08, 0.8]} material={MAT.lightOak} />
    </group>
  );
}

/** CC0 plant models for the beds, mixed with the code-built families below for variety (§14A.21). */
const BED_PROPS = ['fern_02', 'nettle_plant', 'periwinkle_plant', 'wild_rooibos_bush', 'flower_gazania', 'flower_ursinia', 'shrub_03', 'potted_plant_02'] as const;
const BED_HEIGHTS: Record<(typeof BED_PROPS)[number], number> = {
  fern_02: 0.9,
  nettle_plant: 0.8,
  periwinkle_plant: 0.4,
  wild_rooibos_bush: 1.1,
  flower_gazania: 0.35,
  flower_ursinia: 0.45,
  shrub_03: 1.0,
  potted_plant_02: 1.0,
};

function BedPlant({ position, index }: { position: Vec3; index: number }) {
  if (index % 5 === 4) return <Plant position={position} family={index % 8} />;
  const id = BED_PROPS[index % BED_PROPS.length] ?? 'fern_02';
  return <Prop id={id} position={position} height={BED_HEIGHTS[id]} rotationY={index * 1.3} />;
}

/** Eight visually distinct plant families (§14A.21) built from simple shapes. */
function Plant({ position, family }: { position: Vec3; family: number }) {
  const mat = PLANT_MATS[family % PLANT_MATS.length] ?? MAT.leaf;
  switch (family) {
    case 0:
      return <Shrub position={position} size={1.1} seed={family + position[2]} />;
    case 1:
      return (
        <group position={position}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[0, 0.5, 0]} rotation={[0.6, (i / 7) * Math.PI * 2, 0]} scale={[0.25, 1, 0.05]} material={MAT.leaf}>
              <sphereGeometry args={[0.5, 10, 8]} />
            </mesh>
          ))}
        </group>
      );
    case 2:
      return (
        <group position={position}>
          <mesh position={[0, 0.8, 0]} material={MAT.stem}>
            <cylinderGeometry args={[0.04, 0.06, 1.6, 8]} />
          </mesh>
          <mesh position={[0, 1.7, 0]} material={MAT.petal}>
            <sphereGeometry args={[0.22, 14, 10]} />
          </mesh>
        </group>
      );
    case 3:
      return (
        <group position={position}>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i) * 0.25, 0.3 + i * 0.12, Math.sin(i) * 0.25]} material={MAT.moss}>
              <sphereGeometry args={[0.22 - i * 0.02, 12, 10]} />
            </mesh>
          ))}
        </group>
      );
    case 4:
      return (
        <group position={position}>
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[0, 0.35, 0]} rotation={[0.9, (i / 9) * Math.PI * 2, 0]} scale={[0.08, 0.7, 0.02]} material={MAT.stem}>
              <sphereGeometry args={[0.5, 8, 6]} />
            </mesh>
          ))}
        </group>
      );
    case 5:
      return (
        <group position={position}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[(i - 1) * 0.25, 0.5 + i * 0.1, 0]} material={i === 1 ? MAT.wardGold : MAT.petal}>
              <sphereGeometry args={[0.12, 12, 10]} />
            </mesh>
          ))}
          <Shrub position={[0, 0, 0]} size={0.5} seed={9} material={MAT.leaf} />
        </group>
      );
    case 6:
      return (
        <group position={position}>
          <mesh position={[0, 0.9, 0]} material={MAT.bark}>
            <cylinderGeometry args={[0.06, 0.1, 1.8, 8]} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[Math.cos(i) * 0.4, 1.8, Math.sin(i) * 0.4]} rotation={[0, i, 0.9]} scale={[0.6, 0.06, 0.2]} material={MAT.leaf}>
              <sphereGeometry args={[0.5, 10, 6]} />
            </mesh>
          ))}
        </group>
      );
    default:
      return <Shrub position={position} size={0.8} seed={family * 3 + position[0]} material={mat} />;
  }
}

function Channel() {
  return (
    <group>
      <Slab x={[-10.5, 10.5]} y={[-1.2, -1.1]} z={[-26, -20]} material={MAT.academyStoneDark} shadows={false} />
      <mesh position={[0, -0.6, -23]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <planeGeometry args={[21, 6]} />
      </mesh>
      {[-20, -26].map((z) => (
        <Slab key={z} x={[-10.5, 10.5]} y={[-1.2, 0]} z={[z - 0.15, z + 0.15]} material={MAT.academyStone} />
      ))}
    </group>
  );
}

/** Grows as the three vine words are typed; the camera then crosses it on rails. */
function VineBridge() {
  const segments = useRef<(Group | null)[]>([]);
  useFrame((_, dt) => {
    const p = getRun()?.encounterProgress('greenhouse-vine');
    const grown = p ? (p.complete ? 3 : p.done) : 0;
    segments.current.forEach((g, i) => {
      if (!g) return;
      const goal = grown > i ? 1 : 0.02;
      g.scale.z += (goal - g.scale.z) * (1 - Math.exp(-3 * Math.min(dt, 0.1)));
      g.visible = g.scale.z > 0.03;
    });
  });
  return (
    <group position={[0, -0.05, -20]}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0, -i * 2]} ref={(g) => void (segments.current[i] = g)} scale={[1, 1, 0.02]}>
          <mesh position={[0, 0, -1]} rotation={[Math.PI / 2, 0, 0]} material={MAT.stem} castShadow receiveShadow>
            <cylinderGeometry args={[0.9, 0.9, 2.05, 12, 1, false, Math.PI * 0.75, Math.PI * 0.5]} />
          </mesh>
          {[-0.85, 0.85].map((x) => (
            <mesh key={x} position={[x, 0.5, -1]} rotation={[Math.PI / 2, 0, 0]} material={MAT.leaf}>
              <cylinderGeometry args={[0.05, 0.05, 2.05, 6]} />
            </mesh>
          ))}
          <mesh position={[0.6, 0.25, -0.6]} rotation={[0.4, 0.3, 0.8]} scale={[0.6, 0.08, 0.3]} material={MAT.leaf}>
            <sphereGeometry args={[0.4, 10, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** LD-13 midpoint reversal: the Warden catches a falling glass panel and sets it safely aside. */
function WardenRescue() {
  const beat = useBeatIndex();
  const panel = useRef<Group>(null);
  const time = useRef(0);
  const panelHome = local(ROOF_PANEL_POSITION);
  useFrame((_, dt) => {
    if (!panel.current) return;
    if (beat === WARDEN_BEAT) time.current += dt;
    const t = Math.min(1, time.current / 3);
    const placed = beat > WARDEN_BEAT || t >= 1;
    if (placed) {
      panel.current.position.set(6.5, 0.6, -38);
      panel.current.rotation.set(0, 0, 1.3);
    } else {
      panel.current.position.set(panelHome[0], panelHome[1] - t * 6.6, panelHome[2] - t * 2);
      panel.current.rotation.set(0, 0, t * 1.3);
    }
  });
  return (
    <group>
      <group ref={panel}>
        <mesh material={MAT.glass}>
          <boxGeometry args={[1.4, 0.04, 1.0]} />
        </mesh>
        <mesh material={MAT.darkSteel}>
          <boxGeometry args={[1.46, 0.06, 0.06]} />
        </mesh>
      </group>
      <StaticWarden position={[11.5, 0.5, -37]} scale={0.8} rotationY={-1.4} visible={beat === WARDEN_BEAT} />
    </group>
  );
}
