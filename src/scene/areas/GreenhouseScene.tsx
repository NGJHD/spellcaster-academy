/** PLACEHOLDER Enchanted Greenhouse (§14A.21). Local coordinates; see src/level/areas/greenhouse.ts. */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { GREENHOUSE_ANCHOR_POSITION, GREENHOUSE_ORIGIN, ROOF_PANEL_POSITION } from '../../level/areas/greenhouse';
import { beatIndexOf } from '../../level/level1Route';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { KitModel, Slab } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { DormantTarget, StaticWarden, WardAnchor, spawnPosition, useBeatIndex } from '../props';
import { Prop } from '../Prop';

const local = (p: Vec3): Vec3 => [p[0] - GREENHOUSE_ORIGIN[0], p[1] - GREENHOUSE_ORIGIN[1], p[2] - GREENHOUSE_ORIGIN[2]];
const WARDEN_BEAT = beatIndexOf('greenhouse-warden-scene');

export function GreenhouseScene() {
  return (
    <group name="greenhouse" position={GREENHOUSE_ORIGIN}>
      <MergeStatic>
      <Frame />
      <Beds />
      </MergeStatic>
      <Grounds />
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
  return (
    <group>
      <Slab x={[-11, 11]} y={[-0.1, 0]} z={[-53, 3]} material={MAT.paving} shadows={false} />
      {/* Victorian glasshouse: fourteen 4 m bays (kit_props greenhouse_bay) and glazed gable ends. */}
      {Array.from({ length: 14 }, (_, k) => (
        <KitModel key={k} id="greenhouse_bay" position={[0, 0, 3 - 4 * k]} />
      ))}
      <KitModel id="greenhouse_end" position={[0, 0, -53]} />
      <KitModel id="greenhouse_end" position={[0, 0, 3]} rotationY={Math.PI} />
    </group>
  );
}

/** What the glass looks out on: lawn, hedges and trees, so the house sits in a garden. */
function Grounds() {
  const trees = useMemo(
    () =>
      [-1, 1].flatMap((s) =>
        Array.from({ length: 6 }, (_, i) => ({ x: s * (17 + (i % 2) * 5), z: 6 - i * 11, id: i % 2 ? 'island_tree_01' : 'island_tree_02', h: 9 + (i % 3) * 2 })),
      ).concat(
        // A stand of trees beyond the far gable gives the view through the glass some depth.
        Array.from({ length: 6 }, (_, i) => ({ x: -18 + i * 7.2, z: -64 - (i % 2) * 6, id: i % 2 ? 'island_tree_01' : 'island_tree_02', h: 10 + (i % 3) * 2 })),
      ),
    [],
  );
  return (
    <group>
      <Slab x={[-60, 60]} y={[-0.16, -0.11]} z={[-100, 40]} material={MAT.grass} shadows={false} />
      {[-1, 1].map((s) =>
        Array.from({ length: 9 }, (_, i) => <Prop key={`${s}${i}`} id={`shrub_0${(i % 4) + 1}`} position={[s * 12.6, 0, 1 - i * 6.5]} height={1.6 + (i % 3) * 0.3} rotationY={i} />),
      )}
      {trees.map((t, i) => (
        <Prop key={i} id={t.id} position={[t.x, 0, t.z]} height={t.h} rotationY={i * 1.7} />
      ))}
    </group>
  );
}

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
          <Slab x={[x - w / 2, x + w / 2]} y={[0, 0.66]} z={[z - d / 2, z + d / 2]} material={MAT.academyStoneDark} />
          {/* Coping stones overhanging the bed walls */}
          <Slab x={[x - w / 2 - 0.05, x + w / 2 + 0.05]} y={[0.66, 0.74]} z={[z - d / 2 - 0.05, z - d / 2 + 0.16]} material={MAT.academyStone} />
          <Slab x={[x - w / 2 - 0.05, x + w / 2 + 0.05]} y={[0.66, 0.74]} z={[z + d / 2 - 0.16, z + d / 2 + 0.05]} material={MAT.academyStone} />
          <Slab x={[x - w / 2 - 0.05, x - w / 2 + 0.16]} y={[0.66, 0.74]} z={[z - d / 2 + 0.16, z + d / 2 - 0.16]} material={MAT.academyStone} />
          <Slab x={[x + w / 2 - 0.16, x + w / 2 + 0.05]} y={[0.66, 0.74]} z={[z - d / 2 + 0.16, z + d / 2 - 0.16]} material={MAT.academyStone} />
          <Slab x={[x - w / 2 + 0.16, x + w / 2 - 0.16]} y={[0.66, 0.71]} z={[z - d / 2 + 0.16, z + d / 2 - 0.16]} material={MAT.soil} shadows={false} />
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
      {/* Potting bench with the gardener's tools */}
      <Prop id="WoodenTable_01" position={[-4.5, 0, -46]} height={0.85} rotationY={Math.PI / 2} />
      <Prop id="seeding_tray_01" position={[-4.5, 0.85, -45.6]} height={0.12} />
      <Prop id="watering_can_metal_01" position={[-4.4, 0.85, -46.7]} height={0.34} rotationY={0.8} />
      <Prop id="trowel_01" position={[-4.7, 0.86, -46.2]} height={0.05} rotationY={1.2} />
      <Prop id="wicker_basket_01" position={[-3.4, 0, -46.4]} height={0.38} />
    </group>
  );
}

/** CC0 plant models for the beds, mixed with the code-built families below for variety (§14A.21). */
const BED_PROPS = ['fern_02', 'calathea_orbifolia_01', 'nettle_plant', 'anthurium_botany_01', 'periwinkle_plant', 'wild_rooibos_bush', 'flower_gazania', 'pachira_aquatica_01', 'flower_ursinia', 'shrub_03', 'potted_plant_02'] as const;
const BED_HEIGHTS: Record<(typeof BED_PROPS)[number], number> = {
  fern_02: 0.9,
  nettle_plant: 0.8,
  periwinkle_plant: 0.4,
  wild_rooibos_bush: 1.1,
  flower_gazania: 0.35,
  flower_ursinia: 0.45,
  shrub_03: 1.0,
  potted_plant_02: 1.0,
  calathea_orbifolia_01: 0.7,
  anthurium_botany_01: 0.8,
  pachira_aquatica_01: 1.6,
};

function BedPlant({ position, index }: { position: Vec3; index: number }) {
  const id = BED_PROPS[index % BED_PROPS.length] ?? 'fern_02';
  return <Prop id={id} position={position} height={BED_HEIGHTS[id]} rotationY={index * 1.3} />;
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
