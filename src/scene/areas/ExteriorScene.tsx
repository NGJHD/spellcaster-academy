/**
 * PLACEHOLDER exterior campus: Arrival Gate, Sunlit Courtyard, East Hall and the Celebration
 * dressing. Coordinates match src/level/areas/{arrivalGate,courtyard,eastHall}.ts.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, type Group, type MeshBasicMaterial } from 'three';
import { CRYSTAL_POSITIONS } from '../../level/areas/arrivalGate';
import { COURTYARD_ANCHOR_POSITION, COURTYARD_DUMMY_POSITIONS } from '../../level/areas/courtyard';
import { CHEST_POSITION, MIRA_EAST_HALL_POSITION } from '../../level/areas/eastHall';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { Arch, Banner, Bench, Bookshelf, Box, Column, Planter, Rug, Shrub, Slab, StandingLamp, WallLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import {
  DormantTarget,
  FloatingLantern,
  KeeperOrin,
  Mira,
  ProgressCrystal,
  StaticWarden,
  Student,
  WardAnchor,
  useBeatIndex,
} from '../props';

const GATE_Z = 20;
const GATE_HALF = 2.5;
const GATE_HEIGHT = 5;

export function ExteriorScene({ celebration }: { celebration: boolean }) {
  return (
    <group name="exterior">
      <Campus />
      <ArrivalGate />
      <Courtyard celebration={celebration} />
      <EastHall />
      {celebration && <CelebrationDressing />}
      <WardDome celebration={celebration} />
    </group>
  );
}

// ---------- Campus backdrop ----------

function Campus() {
  const trees = useMemo(() => {
    let s = 7;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const out: { x: number; z: number; h: number }[] = [];
    while (out.length < 70) {
      const x = (rand() - 0.5) * 180;
      const z = 24 + rand() * 100;
      if (Math.abs(x) < 8) continue;
      out.push({ x, z, h: 6 + rand() * 6 });
    }
    return out;
  }, []);
  return (
    <group name="campus">
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} material={MAT.grass} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
      </mesh>
      <Slab x={[-1.8, 1.8]} y={[-0.01, 0.03]} z={[20.6, 120]} material={MAT.paving} shadows={false} />
      {/* Main academy wing behind the courtyard */}
      <Slab x={[-36, 36]} y={[0, 17]} z={[-42, -15]} material={MAT.academyStone} />
      <mesh position={[0, 17, -28.5]} rotation={[0, 0, 0]} material={MAT.slate} castShadow>
        <cylinderGeometry args={[0.1, 15, 7, 4, 1, false, Math.PI / 4]} />
      </mesh>
      {[-28, -20, -12, -4, 4, 12, 20, 28].flatMap((x) =>
        [4, 10].map((y) => <WindowPane key={`${x}-${y}`} position={[x, y + 1.6, -14.95]} size={[1.6, 3.2]} />),
      )}
      {/* Library wing (tall windows) and greenhouse glimpse */}
      <Slab x={[-70, -40]} y={[0, 14]} z={[-40, -10]} material={MAT.academyStoneDark} />
      {[-66, -58, -50, -44].map((x) => (
        <WindowPane key={x} position={[x, 7, -9.95]} size={[2, 7]} />
      ))}
      <mesh position={[60, 5, -25]} material={MAT.glass}>
        <boxGeometry args={[26, 10, 18]} />
      </mesh>
      {/* Moon Tower and observatory dome */}
      <mesh position={[0, 22, -60]} material={MAT.academyStone} castShadow>
        <cylinderGeometry args={[7, 7.8, 44, 40]} />
      </mesh>
      {[10, 20, 30].map((y) => (
        <mesh key={y} position={[0, y, -60]} material={MAT.academyStoneDark}>
          <torusGeometry args={[7.3, 0.25, 8, 40]} />
        </mesh>
      ))}
      <mesh position={[0, 44, -60]} material={MAT.agedBrass} castShadow>
        <sphereGeometry args={[7.4, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 30.5, -53]} material={MAT.academyStoneDark}>
        <boxGeometry args={[5, 0.4, 2.5]} />
      </mesh>
      {/* Distant dormitory roofs */}
      {[-90, -60, 60, 90].map((x, i) => (
        <group key={x} position={[x, 0, -90 - i * 8]}>
          <Slab x={[-12, 12]} y={[0, 10]} z={[-6, 6]} material={MAT.academyStone} />
          <mesh position={[0, 12, 0]} rotation={[0, Math.PI / 4, 0]} material={MAT.slate}>
            <coneGeometry args={[11, 5, 4]} />
          </mesh>
        </group>
      ))}
      {trees.map(({ x, z, h }) => (
        <group key={`${x.toFixed(1)}-${z.toFixed(1)}`} position={[x, 0, z]}>
          <mesh position={[0, h * 0.25, 0]} material={MAT.bark} castShadow>
            <cylinderGeometry args={[0.18, 0.32, h * 0.5, 8]} />
          </mesh>
          <Shrub position={[0, h * 0.35, 0]} size={h * 0.45} seed={Math.round(x * 13 + z)} />
        </group>
      ))}
      {[-2.8, 2.8].flatMap((x) => [30, 40, 52, 66].map((z) => <StandingLamp key={`${x}-${z}`} position={[x, 0, z]} />))}
    </group>
  );
}

// ---------- Arrival Gate ----------

function ArrivalGate() {
  return (
    <group name="arrival-gate">
      <Slab x={[-15, -GATE_HALF]} y={[0, 7.5]} z={[GATE_Z - 0.6, GATE_Z + 0.6]} material={MAT.academyStone} />
      <Slab x={[GATE_HALF, 15]} y={[0, 7.5]} z={[GATE_Z - 0.6, GATE_Z + 0.6]} material={MAT.academyStone} />
      <Slab x={[-GATE_HALF, GATE_HALF]} y={[GATE_HEIGHT + 0.6, 7.5]} z={[GATE_Z - 0.6, GATE_Z + 0.6]} material={MAT.academyStone} />
      <Arch position={[0, GATE_HEIGHT - 0.3, GATE_Z + 0.62]} width={GATE_HALF * 2} thickness={0.4} material={MAT.academyStoneDark} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Slab x={s < 0 ? [-5.4, -2.5] : [2.5, 5.4]} y={[0, 9.5]} z={[GATE_Z - 1.2, GATE_Z + 1.2]} material={MAT.academyStoneDark} />
          <mesh position={[3.95 * s, 10.6, GATE_Z]} rotation={[0, Math.PI / 4, 0]} material={MAT.slate} castShadow>
            <coneGeometry args={[2.3, 2.4, 4]} />
          </mesh>
          <Banner position={[3.95 * s, 8.6, GATE_Z + 1.24]} height={3.6} />
        </group>
      ))}
      <GateDoors />
      {(['left', 'centre', 'right'] as const).map((k, i) => (
        <ProgressCrystal key={k} position={CRYSTAL_POSITIONS[k]} encounterId="arrival-crystals" index={i} />
      ))}
      <Slab x={[-15, -6]} y={[0, 1.5]} z={[21.5, 23]} material={MAT.hedge} />
      <Slab x={[6, 15]} y={[0, 1.5]} z={[21.5, 23]} material={MAT.hedge} />
      {/* Decorative fallen banner pole (no jump tutorial: §GD-4). */}
      <mesh position={[-6.5, 0.12, 25]} rotation={[Math.PI / 2, 0, 0.7]} material={MAT.darkOak} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 3.4, 10]} />
      </mesh>
    </group>
  );
}

const GATE_OPEN_BEAT = beatIndexOf('arrival-gate-passage');

function GateDoors() {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const beat = useBeatIndex();
  useFrame((_, delta) => {
    const open = beat >= GATE_OPEN_BEAT || (getRun()?.flags.has('gate-open') ?? false);
    const goal = open ? 1.75 : 0;
    const k = 1 - Math.exp(-1.8 * Math.min(delta, 0.1));
    if (left.current) left.current.rotation.y += (goal - left.current.rotation.y) * k;
    if (right.current) right.current.rotation.y += (-goal - right.current.rotation.y) * k;
  });
  const door = (sign: number) => (
    <>
      <Box position={[(sign * -GATE_HALF) / 2, GATE_HEIGHT / 2, 0]} size={[GATE_HALF, GATE_HEIGHT, 0.22]} material={MAT.darkOak} />
      {[0.25, 0.5, 0.75].map((y) => (
        <Box key={y} position={[(sign * -GATE_HALF) / 2, GATE_HEIGHT * y, 0.13]} size={[GATE_HALF * 0.92, 0.12, 0.05]} material={MAT.agedBrass} />
      ))}
      <mesh position={[sign * -0.25, GATE_HEIGHT * 0.55, 0.16]} rotation={[0, 0, 0]} material={MAT.agedBrass}>
        <torusGeometry args={[0.35, 0.04, 8, 32]} />
      </mesh>
    </>
  );
  return (
    <>
      <group ref={left} position={[-GATE_HALF, 0, GATE_Z]}>
        {door(-1)}
      </group>
      <group ref={right} position={[GATE_HALF, 0, GATE_Z]}>
        {door(1)}
      </group>
    </>
  );
}

// ---------- Sunlit Courtyard ----------

const DOOR_HALF = 1.5;
const DOOR_HEIGHT = 3.2;
const WARDEN_SIGHTING = beatIndexOf('courtyard-warden-sighting');

function Courtyard({ celebration }: { celebration: boolean }) {
  const beat = useBeatIndex();
  return (
    <group name="courtyard">
      <Slab x={[-14, 14]} y={[-0.01, 0.02]} z={[-14, 19.4]} material={MAT.paving} shadows={false} />
      <Slab x={[-15, -14]} y={[0, 8]} z={[-15, 20]} material={MAT.academyStone} />
      <Slab x={[-15, 15]} y={[0, 8]} z={[-15, -14]} material={MAT.academyStone} />
      <Slab x={[14, 15]} y={[0, 8]} z={[DOOR_HALF, 20]} material={MAT.academyStone} />
      <Slab x={[14, 15]} y={[0, 8]} z={[-15, -DOOR_HALF]} material={MAT.academyStone} />
      <Slab x={[14, 15]} y={[DOOR_HEIGHT, 8]} z={[-DOOR_HALF, DOOR_HALF]} material={MAT.academyStone} />
      <Arch position={[13.95, DOOR_HEIGHT, 0]} width={DOOR_HALF * 2} rotationY={Math.PI / 2} material={MAT.academyStoneDark} />
      {[-10, -5, 0, 5, 10].map((z) => (
        <WindowPane key={z} position={[-13.95, 4.5, z]} size={[1.4, 2.6]} rotationY={Math.PI / 2} />
      ))}
      {[-9, -3, 3, 9].map((x) => (
        <WindowPane key={x} position={[x, 4.5, -13.95]} size={[1.4, 2.6]} />
      ))}
      {/* Arcade along the gate wall */}
      {[-12, -9, -6, -3.2, 3.2, 6, 9, 12].map((x) => (
        <Column key={x} position={[x, 0, 16]} height={4.2} />
      ))}
      <Slab x={[-14, 14]} y={[4.2, 4.8]} z={[15.4, 19.4]} material={MAT.academyStoneDark} />
      {[-10.5, -7.5, -4.6, 4.6, 7.5, 10.5].map((x) => (
        <Arch key={x} position={[x, 3.4, 15.75]} width={2.6} thickness={0.3} />
      ))}
      <Fountain celebration={celebration} />
      <TrainingCircle />
      {COURTYARD_DUMMY_POSITIONS.map((p, i) => (
        <DormantTarget key={i} encounterId="courtyard-c1" targetId={`dummy-${i + 1}`} kind="dummy" position={p} />
      ))}
      <WardAnchor position={COURTYARD_ANCHOR_POSITION} encounterId="courtyard-anchor" theme="courtyard" />
      {[[-10, 4], [10, 4], [-10, -10], [10, 7]].map(([x = 0, z = 0]) => (
        <Bench key={`b${x}${z}`} position={[x, 0, z]} rotationY={x < 0 ? Math.PI / 2 : -Math.PI / 2} />
      ))}
      {[[-12, 12], [12, 12], [-12, -12], [12, -12], [-12, 0]].map(([x = 0, z = 0], i) => (
        <Planter key={`p${x}${z}`} position={[x, 0, z]} seed={i + 3} />
      ))}
      {[-12, -4, 4, 12].map((z) => (
        <WallLamp key={z} position={[-13.9, 3.2, z]} rotationY={Math.PI / 2} />
      ))}
      <StaticWarden position={[6, 15.8, -16.5]} scale={0.7} visible={beat === WARDEN_SIGHTING} />
    </group>
  );
}

function Fountain({ celebration }: { celebration: boolean }) {
  const water = useRef<import('three').Mesh>(null);
  useFrame((state) => {
    if (water.current) water.current.position.y = 0.64 + Math.sin(state.clock.elapsedTime * 1.4) * 0.008;
  });
  return (
    <group name="fountain">
      <mesh position={[0, 0.3, 0]} material={MAT.academyStone} castShadow receiveShadow>
        <cylinderGeometry args={[3, 3.25, 0.6, 48]} />
      </mesh>
      <mesh position={[0, 0.61, 0]} material={MAT.academyStoneDark}>
        <torusGeometry args={[3, 0.12, 10, 48]} />
      </mesh>
      <mesh ref={water} position={[0, 0.64, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[2.85, 48]} />
      </mesh>
      <mesh position={[0, 1.3, 0]} material={MAT.academyStone} castShadow>
        <cylinderGeometry args={[0.3, 0.48, 1.8, 20]} />
      </mesh>
      <mesh position={[0, 2.25, 0]} material={MAT.academyStone} castShadow>
        <cylinderGeometry args={[1.15, 0.38, 0.38, 32]} />
      </mesh>
      <mesh position={[0, 2.46, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[1.02, 32]} />
      </mesh>
      {celebration && <pointLight position={[0, 1.5, 0]} color="#9fd6ff" intensity={6} distance={10} />}
    </group>
  );
}

function TrainingCircle() {
  return (
    <group position={[-6, 0, -7]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} material={MAT.agedBrass} receiveShadow>
        <ringGeometry args={[2.7, 2.85, 64]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]} material={MAT.academyStoneDark} receiveShadow>
        <circleGeometry args={[2.7, 64]} />
      </mesh>
    </group>
  );
}

// ---------- East Hall ----------

function EastHall() {
  const H = 5;
  const W = 2.5;
  return (
    <group name="east-hall">
      <Slab x={[15, 44]} y={[-0.01, 0.02]} z={[-W, W]} material={MAT.paving} shadows={false} />
      <Rug position={[29.5, 0.02, 0]} size={[29, 1.8]} />
      <Slab x={[15, 44]} y={[0, H]} z={[-W - 0.3, -W]} material={MAT.plaster} />
      <Slab x={[15, 44]} y={[0, H]} z={[W, W + 0.3]} material={MAT.plaster} />
      <Slab x={[14, 44.3]} y={[H, H + 0.4]} z={[-W - 0.3, W + 0.3]} material={MAT.slate} />
      <Slab x={[44, 44.3]} y={[0, H]} z={[-W, W]} material={MAT.academyStone} />
      {Array.from({ length: 10 }, (_, i) => 16.5 + i * 3).map((x) => (
        <group key={x}>
          <Slab x={[x - 0.15, x + 0.15]} y={[H - 0.35, H]} z={[-W, W]} material={MAT.darkOak} />
          <Slab x={[x - 0.18, x + 0.18]} y={[0, H]} z={[-W, -W + 0.15]} material={MAT.academyStoneDark} />
          <Slab x={[x - 0.18, x + 0.18]} y={[0, H]} z={[W - 0.15, W]} material={MAT.academyStoneDark} />
        </group>
      ))}
      <Slab x={[43.9, 44]} y={[0, 3.6]} z={[-1.3, 1.3]} material={MAT.darkOak} />
      <Arch position={[43.95, 3.6, 0]} width={2.6} rotationY={Math.PI / 2} material={MAT.academyStoneDark} />
      {[20, 27, 34, 41].map((x) => (
        <group key={x}>
          <WallLamp position={[x, 3.0, -W + 0.02]} />
          <WallLamp position={[x, 3.0, W - 0.02]} rotationY={Math.PI} />
          <pointLight position={[x, 3.7, 0]} color="#ffc98a" intensity={10} distance={10} decay={2} />
        </group>
      ))}
      {[18, 24, 37].map((x) => (
        <Slab key={x} x={[x - 0.8, x + 0.8]} y={[1.4, 2.6]} z={[W - 0.05, W]} material={MAT.darkOak} shadows={false} />
      ))}
      {[22, 39].map((x) => (
        <WindowPane key={x} position={[x, 2.6, -W + 0.01]} size={[1.4, 2.4]} />
      ))}
      <Bookshelf position={[26, 0, W - 0.05]} rotationY={Math.PI} width={2.4} height={2.6} shelves={4} seed={3} />
      <Mira position={MIRA_EAST_HALL_POSITION} rotationY={-2.2} />
      <Chest />
    </group>
  );
}

function Chest() {
  const lid = useRef<Group>(null);
  useFrame((_, dt) => {
    const open = getRun()?.flags.has('chest-open') ?? false;
    if (lid.current) lid.current.rotation.x += ((open ? -1.6 : 0) - lid.current.rotation.x) * (1 - Math.exp(-3 * Math.min(dt, 0.1)));
  });
  const [x, , z] = CHEST_POSITION;
  return (
    <group position={[x, 0, z]}>
      <Box position={[0, 0.27, 0]} size={[0.9, 0.5, 0.55]} material={MAT.darkOak} />
      {[-0.3, 0.3].map((dx) => (
        <Box key={dx} position={[dx, 0.27, 0]} size={[0.06, 0.52, 0.57]} material={MAT.agedBrass} />
      ))}
      <group ref={lid} position={[0, 0.52, -0.27]}>
        <mesh position={[0, 0.06, 0.27]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]} material={MAT.darkOak} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.9, 20, 1, false, 0, Math.PI]} />
        </mesh>
      </group>
      <mesh position={[0, 0.4, 0.29]} material={MAT.wardGold}>
        <torusGeometry args={[0.07, 0.012, 8, 20]} />
      </mesh>
    </group>
  );
}

// ---------- Celebration (LD-18) ----------

function CelebrationDressing() {
  return (
    <group name="celebration">
      <Mira position={[-4, 0, 3]} rotationY={0.6} waving />
      <KeeperOrin position={[3.5, 0, 3.2]} rotationY={-1.9} />
      {[[-8, 2, 0.6], [-9, -4, 1.2], [8, -2, -1.2], [9, 3, -1.6], [-6, 9, 2.4], [7, 10, -2.6], [4, -9, 0.2], [-3, -10, 0.4]].map(
        ([x = 0, z = 0, r = 0], i) => (
          <Student key={i} position={[x, 0, z]} rotationY={r} robe={i % 3 === 0 ? MAT.burgundyLeather : MAT.navyCloth} height={1.35 + (i % 3) * 0.12} />
        ),
      )}
      {Array.from({ length: 14 }, (_, i) => (
        <FloatingLantern key={i} position={[Math.cos(i * 1.3) * (6 + (i % 3) * 2.5), 5 + (i % 4) * 0.8, Math.sin(i * 1.3) * (6 + (i % 3) * 2.5)]} seed={i} />
      ))}
      {[-6, 6].map((x) => (
        <group key={x} position={[x, 0, -7]}>
          <Box position={[0, 0.75, 0]} size={[2.2, 0.08, 0.9]} material={MAT.lightOak} />
          <Box position={[0, 0.38, 0]} size={[0.1, 0.75, 0.1]} material={MAT.darkOak} />
          {[-0.6, 0, 0.6].map((dx) => (
            <mesh key={dx} position={[dx, 0.85, 0]} material={MAT.lampGlow}>
              <sphereGeometry args={[0.08, 12, 10]} />
            </mesh>
          ))}
        </group>
      ))}
      <StaticWarden position={[0, 31.5, -53.5]} scale={0.75} />
    </group>
  );
}

// ---------- Ward dome over the campus ----------

const FRACTURE_BEAT = beatIndexOf('arrival-ward-fracture');

function WardDome({ celebration }: { celebration: boolean }) {
  const material = useRef<MeshBasicMaterial>(null);
  const time = useRef(0);
  const beat = useBeatIndex();
  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;
    time.current += delta;
    if (beat === FRACTURE_BEAT) {
      const t = time.current;
      m.opacity = 0.06 + 0.12 * Math.abs(Math.sin(t * 7) * Math.sin(t * 2.3));
      m.color.set('#ffd27a');
    } else if (celebration) {
      m.opacity = 0.08;
      m.color.set('#ffe6a8');
    } else {
      m.opacity = beat > FRACTURE_BEAT ? 0.04 : 0.08;
      m.color.set('#9cc4ff');
    }
  });
  return (
    <mesh position={[0, 0, -30]}>
      <sphereGeometry args={[180, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial ref={material} color="#9cc4ff" transparent opacity={0.08} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}
