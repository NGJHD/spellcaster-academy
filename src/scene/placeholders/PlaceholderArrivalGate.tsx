import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import { beatIndexOf } from '../../level/level1Route';
import { useGameStore } from '../../state/gameStore';
import { Box, Slab, placeholderMaterials as m } from './placeholderKit';

const GATE_Z = 20;
const GATE_HALF_WIDTH = 2.5;
const GATE_HEIGHT = 5;
const OPEN_AT_BEAT = beatIndexOf('arrival-gate-passage');
/** Doors swing inward (towards −Z) by this angle. */
const OPEN_ANGLE = 1.75;
/** Exponential approach rate; heavier doors would use a lower value. */
const DOOR_RATE = 2.2;

export function PlaceholderArrivalGate() {
  return (
    <group name="placeholder-arrival-gate">
      {/* Gate wall doubles as the courtyard's south wall */}
      <Slab x={[-14, -GATE_HALF_WIDTH]} y={[0, 7]} z={[GATE_Z - 0.6, GATE_Z + 0.6]} material={m.stone} />
      <Slab x={[GATE_HALF_WIDTH, 14]} y={[0, 7]} z={[GATE_Z - 0.6, GATE_Z + 0.6]} material={m.stone} />
      <Slab x={[-GATE_HALF_WIDTH, GATE_HALF_WIDTH]} y={[GATE_HEIGHT, 7]} z={[GATE_Z - 0.6, GATE_Z + 0.6]} material={m.stone} />
      {/* Gate towers */}
      <Slab x={[-5.2, -2.5]} y={[0, 9]} z={[GATE_Z - 1.2, GATE_Z + 1.2]} material={m.stoneDark} />
      <Slab x={[2.5, 5.2]} y={[0, 9]} z={[GATE_Z - 1.2, GATE_Z + 1.2]} material={m.stoneDark} />
      <Slab x={[-5.4, -2.3]} y={[9, 9.4]} z={[GATE_Z - 1.4, GATE_Z + 1.4]} material={m.slate} />
      <Slab x={[2.3, 5.4]} y={[9, 9.4]} z={[GATE_Z - 1.4, GATE_Z + 1.4]} material={m.slate} />
      {/* Banners */}
      <Slab x={[-4.4, -3.3]} y={[4.2, 7.8]} z={[GATE_Z + 1.21, GATE_Z + 1.26]} material={m.navyCloth} shadows={false} />
      <Slab x={[3.3, 4.4]} y={[4.2, 7.8]} z={[GATE_Z + 1.21, GATE_Z + 1.26]} material={m.navyCloth} shadows={false} />

      <GateDoors />

      {/* Three typing crystals (look points ARRIVAL_CRYSTAL_*) */}
      {([[-3.6, 2.2], [0, 5.6], [3.6, 2.2]] as const).map(([x, y]) => (
        <mesh key={x} position={[x, y, GATE_Z + 1.3]} material={m.crystal}>
          <octahedronGeometry args={[0.28]} />
        </mesh>
      ))}

      {/* Boundary hedges along the approach */}
      <Slab x={[-14, -6]} y={[0, 1.4]} z={[21.5, 23]} material={m.hedge} />
      <Slab x={[6, 14]} y={[0, 1.4]} z={[21.5, 23]} material={m.hedge} />
      {[-2.6, 2.6].flatMap((x) => [28, 36, 44].map((z) => <PathLamp key={`${x}-${z}`} x={x} z={z} />))}

      <PipPlaceholder />
    </group>
  );
}

function GateDoors() {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);

  useFrame((_, delta) => {
    const beat = useGameStore.getState().currentBeatId;
    const open = beat !== null && beatIndexOf(beat) >= OPEN_AT_BEAT;
    const target = open ? OPEN_ANGLE : 0;
    const k = 1 - Math.exp(-DOOR_RATE * Math.min(delta, 0.1));
    if (left.current) left.current.rotation.y += (target - left.current.rotation.y) * k;
    if (right.current) right.current.rotation.y += (-target - right.current.rotation.y) * k;
  });

  return (
    <>
      <group ref={left} position={[-GATE_HALF_WIDTH, 0, GATE_Z]}>
        <Box position={[GATE_HALF_WIDTH / 2, GATE_HEIGHT / 2, 0]} size={[GATE_HALF_WIDTH, GATE_HEIGHT, 0.2]} material={m.oak} />
        <Box position={[GATE_HALF_WIDTH / 2, GATE_HEIGHT * 0.7, 0.12]} size={[GATE_HALF_WIDTH * 0.9, 0.15, 0.05]} material={m.brass} />
      </group>
      <group ref={right} position={[GATE_HALF_WIDTH, 0, GATE_Z]}>
        <Box position={[-GATE_HALF_WIDTH / 2, GATE_HEIGHT / 2, 0]} size={[GATE_HALF_WIDTH, GATE_HEIGHT, 0.2]} material={m.oak} />
        <Box position={[-GATE_HALF_WIDTH / 2, GATE_HEIGHT * 0.7, 0.12]} size={[GATE_HALF_WIDTH * 0.9, 0.15, 0.05]} material={m.brass} />
      </group>
    </>
  );
}

function PathLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box position={[0, 1.2, 0]} size={[0.1, 2.4, 0.1]} material={m.brass} />
      <mesh position={[0, 2.5, 0]} material={m.windowGlow}>
        <sphereGeometry args={[0.16, 12, 8]} />
      </mesh>
    </group>
  );
}

/** Stand-in for Pip (§14A.2): a glowing core with one tilted ring, bobbing gently. */
function PipPlaceholder() {
  const ref = useRef<Group>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    const pip = ref.current;
    if (!pip) return;
    pip.position.y = 2 + Math.sin(time.current * 1.6) * 0.06;
    pip.rotation.y = time.current * 0.8;
  });

  return (
    <group ref={ref} position={[1.1, 2, 24.2]}>
      <mesh material={m.wardGold}>
        <sphereGeometry args={[0.1, 16, 12]} />
      </mesh>
      <mesh rotation-x={1.2} material={m.brass}>
        <torusGeometry args={[0.14, 0.008, 8, 32]} />
      </mesh>
    </group>
  );
}
