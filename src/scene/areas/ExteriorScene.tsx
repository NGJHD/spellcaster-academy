/**
 * PLACEHOLDER exterior campus: Arrival Gate, Sunlit Courtyard, East Hall and the Celebration
 * dressing. Coordinates match src/level/areas/{arrivalGate,courtyard,eastHall}.ts.
 */
import { Fireworks } from '../Fireworks';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, type Group, type MeshBasicMaterial } from 'three';
import { CRYSTAL_POSITIONS, WARDEN_HELLO_POSITION } from '../../level/areas/arrivalGate';
import { COURTYARD_ANCHOR_POSITION, COURTYARD_DUMMY_POSITIONS } from '../../level/areas/courtyard';
import { CHEST_POSITION, MIRA_EAST_HALL_END, MIRA_EAST_HALL_POSITION } from '../../level/areas/eastHall';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { useRunStore } from '../../state/runStore';
import { Arch, Banner, Bookshelf, Column, Facade, GableRoof, KitModel, Planter, Portrait, Rug, Slab, WallLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import { BookSwarm } from '../Swarm';
import { Seam } from '../Seam';
import { MergeStatic } from '../MergeStatic';
import { Prop } from '../Prop';
import { worldBox, worldCylinder, worldPlane } from '../surfaces';
import {
  DormantTarget,
  FloatingLantern,
  KeeperOrin,
  Mira,
  ProgressCrystal,
  StaticWarden,
  WardenCameo,
  Student,
  WardAnchor,
  useBeatIndex,
} from '../props';

const TOWER_GLASS = { windowGlass: MAT.windowGlassDay };
const GATE_Z = 20;
const GATE_HALF = 2.5;
const GATE_HEIGHT = 5;

/**
 * `cheering`: the Level 3 homecoming crowd cheers at random; at the end of Level 1 they just stand
 * around (owner, 2026-10-17).
 */
export function ExteriorScene({ celebration, cheering = false }: { celebration: boolean; cheering?: boolean }) {
  return (
    <group name="exterior">
      <Campus />
      <ArrivalGate />
      <Courtyard celebration={celebration} />
      <EastHall />
      {celebration && <CelebrationDressing cheering={cheering} />}
      <WardDome celebration={celebration} />
      {/* The crack in the ward above the Moon Tower, from the moment it breaks until the Warden fight
          (owner: "look at the sky, it's cracking" but the sky looked fine). */}
      {!celebration && <Seam points={[[-14, 58, -78], [-4, 72, -84], [6, 66, -86], [18, 84, -90]]} radius={0.8} fromBeat={FRACTURE_BEAT} wideUntilBeat={OBSERVATORY_RESTORED_BEAT} />}
      {/* The seam lingers faintly over the celebration. */}
      {celebration && <Seam points={[[-60, 95, -150], [-25, 108, -160], [0, 100, -165], [30, 112, -158], [65, 102, -148]]} radius={0.5} strength={0.55} />}
      {/* The Warden floats down to greet the apprentice, then waits for the "hi". */}
      <WardenCameo
        beatId="arrival-warden-hello"
        scale={1.1}
        keys={[
          { t: 0, position: [0, 12, -4] },
          { t: 0.45, position: [...WARDEN_HELLO_POSITION] },
          { t: 1, position: [...WARDEN_HELLO_POSITION], arm: 0.6 },
        ]}
      />
      {/* The blast at the tower: the Warden turns to look, rising, before it says where it is going. */}
      <WardenCameo
        beatId="arrival-warden-boom"
        scale={1.1}
        keys={[
          { t: 0, position: [...WARDEN_HELLO_POSITION] },
          { t: 0.15, position: [...WARDEN_HELLO_POSITION] },
          { t: 0.6, position: [0, 3.4, 5.4], yaw: Math.PI },
          { t: 1, position: [0, 3.6, 5.2], yaw: Math.PI },
        ]}
      />
      {/* It flies to the tower at a pace you can follow, then holds the cracking ward from the top. */}
      <WardenCameo
        beatId="arrival-ward-fracture"
        scale={1.3}
        rotationY={Math.PI}
        keys={[
          // Straight up first, then over the academy roofs (ridge about 24 m), never through them.
          { t: 0, position: [0, 3.6, 5.2] },
          { t: 0.22, position: [0, 30, 3] },
          { t: 0.45, position: [0, 40, -24] },
          { t: 0.62, position: [0, 46, -55] },
          { t: 0.7, position: [0, 44, -57], arm: 1, yaw: 0 },
          { t: 1, position: [0, 44, -57], arm: 1, yaw: 0 },
        ]}
      />
    </group>
  );
}

// ---------- Campus backdrop ----------

function Campus() {
  // From inside the East Hall the walls hide the grounds; skip the foliage there (frustum culling cannot know).
  const indoors = useRunStore((s) => s.areaId === 'east-hall');
  const trees = useMemo(() => {
    let s = 7;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const kinds = ['island_tree_01', 'island_tree_02'] as const;
    const out: { id: string; x: number; z: number; h: number; r: number }[] = [];
    // Broadleaf trees framing the arrival path, then a ring of firs in the distance.
    while (out.length < 18) {
      const x = (rand() < 0.5 ? -1 : 1) * (9 + rand() * 26);
      const z = 26 + rand() * 60;
      out.push({ id: kinds[out.length % 2] ?? 'island_tree_01', x, z, h: 8 + rand() * 4, r: rand() * Math.PI * 2 });
    }
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 1.2 - Math.PI * 0.1;
      const radius = 110 + rand() * 40;
      out.push({ id: 'fir_tree_01', x: Math.cos(a) * radius, z: Math.sin(a) * radius * 0.6 + 40, h: 13 + rand() * 6, r: rand() * 6 });
    }
    return out;
  }, []);
  return (
    <group name="campus">
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.02, 0]} material={MAT.grass} geometry={worldPlane(900, 900)} receiveShadow />
      <MergeStatic>
      <Slab x={[-1.8, 1.8]} y={[-0.01, 0.03]} z={[20.6, 120]} material={MAT.paving} shadows={false} />
      {/* Main academy wing behind the courtyard */}
      <Slab x={[-36, 36]} y={[0, 16.5]} z={[-42, -16]} material={MAT.academyStone} />
      <Facade position={[0, 0, -15.5]} length={72} height={17} bay={6} windows={[[3.2, 3], [9.8, 3.4]]} />
      <GableRoof position={[0, 17, -28.75]} length={72} span={27.5} rise={7} />
      {/* Library wing (tall windows) and greenhouse glimpse */}
      <Slab x={[-70, -40]} y={[0, 13.5]} z={[-40, -11]} material={MAT.academyStoneDark} />
      <Facade position={[-55, 0, -10.5]} length={30} height={14} bay={6} windows={[[3.5, 7]]} wall={MAT.academyStoneDark} />
      <GableRoof position={[-55, 14, -25.25]} length={30} span={29.5} rise={6} />
      {/* The glasshouse (same kit as the Enchanted Greenhouse, scaled) seen across the grounds. */}
      <group position={[48, 0, -25]} rotation={[0, -Math.PI / 2, 0]} scale={0.85}>
        {Array.from({ length: 6 }, (_, k) => (
          <KitModel key={k} id="greenhouse_bay" position={[0, 0, -4 * k]} castShadow={false} />
        ))}
        <KitModel id="greenhouse_end" position={[0, 0, -24]} castShadow={false} />
        <KitModel id="greenhouse_end" rotationY={Math.PI} castShadow={false} />
      </group>
      {/* Chimney stacks along the main roof ridge */}
      {[-28, -12, 12, 28].map((x) => (
        <group key={x} position={[x, 22, -25]}>
          <Slab x={[-0.9, 0.9]} y={[0, 3.2]} z={[-0.7, 0.7]} material={MAT.academyStoneDark} />
          <Slab x={[-1.05, 1.05]} y={[3.2, 3.5]} z={[-0.85, 0.85]} material={MAT.academyStone} />
        </group>
      ))}
      {/* Moon Tower and observatory dome */}
      <mesh position={[0, 22, -60]} material={MAT.academyStone} geometry={worldCylinder(7, 7.8, 44, 40)} castShadow />
      {[10, 20, 30].map((y) => (
        <mesh key={y} position={[0, y, -60]} material={MAT.academyStoneDark}>
          <torusGeometry args={[7.3, 0.25, 8, 40]} />
        </mesh>
      ))}
      <mesh position={[0, 44, -60]} material={MAT.agedBrass} castShadow>
        <sphereGeometry args={[7.4, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {/* Cornice and parapet under the dome, gilded dome ribs and a lantern on top */}
      <mesh position={[0, 43.4, -60]} material={MAT.academyStoneDark} geometry={worldCylinder(7.9, 7.3, 1.2, 40)} />
      {Array.from({ length: 16 }, (_, i) => (i / 16) * Math.PI * 2).map((a) => (
        <mesh key={a} position={[Math.cos(a) * 7.75, 44.5, -60 + Math.sin(a) * 7.75]} material={MAT.academyStoneDark} geometry={worldBox(1.1, 1.0, 0.6)} rotation={[0, -a, 0]} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 44, -60]} rotation={[0, (i / 8) * Math.PI * 2, 0]} material={MAT.academyStoneDark}>
          <torusGeometry args={[7.45, 0.12, 6, 24, Math.PI / 2]} />
        </mesh>
      ))}
      <mesh position={[0, 52.2, -60]} material={MAT.academyStone} geometry={worldCylinder(1.1, 1.3, 2.4, 16)} />
      <mesh position={[0, 54, -60]} material={MAT.agedBrass}>
        <coneGeometry args={[1.5, 2.4, 16]} />
      </mesh>
      <mesh position={[0, 30.5, -53]} material={MAT.academyStoneDark}>
        <boxGeometry args={[5, 0.4, 2.5]} />
      </mesh>
      {/* Leaded windows climbing the Moon Tower */}
      {[12, 22, 32].flatMap((y, row) =>
        Array.from({ length: 8 }, (_, i) => ((i + row * 0.5) / 8) * Math.PI * 2).map((a) => (
          <group key={`${y}-${a.toFixed(2)}`} position={[Math.sin(a) * 7.42, y, -60 + Math.cos(a) * 7.42]} rotation={[0, a, 0]}>
            <KitModel id="leaded_light" scale={[1.1, 2.0, 1]} castShadow={false} overrides={TOWER_GLASS} />
          </group>
        )),
      )}
      {/* Distant dormitory roofs */}
      {[-90, -60, 60, 90].map((x, i) => (
        <group key={x} position={[x, 0, -90 - i * 8]}>
          <Slab x={[-12, 12]} y={[0, 10]} z={[-6, 6]} material={MAT.academyStone} />
          <mesh position={[0, 12, 0]} rotation={[0, Math.PI / 4, 0]} material={MAT.slate}>
            <coneGeometry args={[11, 5, 4]} />
          </mesh>
        </group>
      ))}
      </MergeStatic>
      {!indoors && trees.map((t) => (
        <Prop key={`${t.x.toFixed(1)}-${t.z.toFixed(1)}`} id={t.id} position={[t.x, 0, t.z]} height={t.h} rotationY={t.r} lodDistance={45} shadows={t.id !== 'fir_tree_01'} />
      ))}
      {[-2.9, 2.9].flatMap((x) => [30, 42, 56, 72].map((z) => <Prop key={`${x}-${z}`} id="street_lamp_01" position={[x, 0, z]} height={3.6} rotationY={x < 0 ? Math.PI / 2 : -Math.PI / 2} />))}
      {/* Clipped shrubs lining the drive */}
      {!indoors &&
        [-4.6, 4.6].flatMap((x) =>
          Array.from({ length: 12 }, (_, i) => 26 + i * 7.5).map((z, i) => <Prop key={`hedge${x}${z}`} id={`shrub_0${(i % 4) + 1}`} position={[x, 0, z]} height={1.3} rotationY={i * 2.1} lodDistance={22} />),
        )}
      {[[-9, 30], [12, 44]].map(([x = 0, z = 0], i) => (
        <Prop key={`rock${i}`} id="rock_moss_set_01" position={[x, 0, z]} scale={0.35} rotationY={i * 1.7} />
      ))}
    </group>
  );
}

// ---------- Arrival Gate ----------

function ArrivalGate() {
  return (
    <group name="arrival-gate">
      <MergeStatic>
        <Facade position={[-8.75, 0, GATE_Z]} length={12.5} height={7.5} thickness={1.2} bay={4} crenellations />
        <Facade position={[8.75, 0, GATE_Z]} length={12.5} height={7.5} thickness={1.2} bay={4} crenellations />
        <Slab x={[-GATE_HALF, GATE_HALF]} y={[GATE_HEIGHT + 0.6, 7.5]} z={[GATE_Z - 0.6, GATE_Z + 0.6]} material={MAT.academyStone} />
        <Arch position={[0, GATE_HEIGHT - 0.3, GATE_Z + 0.62]} width={GATE_HALF * 2} thickness={0.4} material={MAT.academyStoneDark} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Slab x={s < 0 ? [-5.4, -2.5] : [2.5, 5.4]} y={[0, 9.5]} z={[GATE_Z - 1.2, GATE_Z + 1.2]} material={MAT.academyStoneDark} />
            <mesh position={[3.95 * s, 10.6, GATE_Z]} rotation={[0, Math.PI / 4, 0]} material={MAT.slate}>
              <coneGeometry args={[2.3, 2.4, 4]} />
            </mesh>
          </group>
        ))}
      </MergeStatic>
      {[-1, 1].map((s) => (
        <Banner key={s} position={[3.95 * s, 8.6, GATE_Z + 1.24]} height={3.6} />
      ))}
      <GateDoors />
      {(['left', 'right'] as const).map((k, i) => (
        <ProgressCrystal key={k} position={CRYSTAL_POSITIONS[k]} encounterId="arrival-crystals" index={i} />
      ))}
      {[-14, -11.5, -9, -6.5, 6.5, 9, 11.5, 14].map((x, i) => (
        <Prop key={x} id={`shrub_0${(i % 4) + 1}`} position={[x, 0, 22.3]} height={1.5} rotationY={i * 2.1} />
      ))}
      {/* Decorative fallen banner pole (no jump tutorial). */}
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
    // The crystal words blast the doors open: a fast swing with a little overshoot damping.
    const k = 1 - Math.exp(-(open ? 6 : 1.8) * Math.min(delta, 0.1));
    if (left.current) left.current.rotation.y += (goal - left.current.rotation.y) * k;
    if (right.current) right.current.rotation.y += (-goal - right.current.rotation.y) * k;
  });
  // Planked oak leaves with iron strap hinges (kit door_leaf, scaled up) and the brass celestial lock.
  const door = (sign: number) => (
    <>
      <KitModel id="door_leaf" position={[0, 0, 0.12]} scale={[(-sign * GATE_HALF) / 1.2, GATE_HEIGHT / 3.2, 3]} />
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

function Courtyard({ celebration }: { celebration: boolean }) {
  return (
    <group name="courtyard">
      <MergeStatic>
      <Slab x={[-14, 14]} y={[-0.01, 0.02]} z={[-14, 19.4]} material={MAT.paving} shadows={false} />
      <Facade position={[-14.5, 0, 2.5]} length={35} height={8} rotationY={Math.PI / 2} bay={5} windows={[[3, 2.6]]} />
      <Facade position={[0, 0, -14.5]} length={30} height={8} bay={5} windows={[[3, 2.6]]} />
      <Slab x={[14, 15]} y={[0, 8]} z={[DOOR_HALF, 20]} material={MAT.academyStone} />
      <Slab x={[14, 15]} y={[0, 8]} z={[-15, -DOOR_HALF]} material={MAT.academyStone} />
      <Slab x={[14, 15]} y={[DOOR_HEIGHT, 8]} z={[-DOOR_HALF, DOOR_HALF]} material={MAT.academyStone} />
      <Arch position={[13.95, DOOR_HEIGHT, 0]} width={DOOR_HALF * 2} rotationY={Math.PI / 2} material={MAT.academyStoneDark} />
      {/* Arcade along the gate wall */}
      {[-12, -9, -6, -3.2, 3.2, 6, 9, 12].map((x) => (
        <Column key={x} position={[x, 0, 16]} height={4.2} />
      ))}
      <Slab x={[-14, 14]} y={[4.2, 4.8]} z={[15.4, 19.4]} material={MAT.academyStoneDark} />
      {[-10.5, -7.5, -4.6, 4.6, 7.5, 10.5].map((x) => (
        <Arch key={x} position={[x, 3.4, 15.75]} width={2.6} thickness={0.3} />
      ))}
      </MergeStatic>
      <Fountain celebration={celebration} />
      <MergeStatic shadows={false}>
        <TrainingCircle />
      </MergeStatic>
      {COURTYARD_DUMMY_POSITIONS.map((p, i) => (
        <DormantTarget key={i} encounterId="courtyard-c1" targetId={`dummy-${i + 1}`} kind="dummy" position={p} />
      ))}
      <WardAnchor position={COURTYARD_ANCHOR_POSITION} encounterId="courtyard-anchor" theme="courtyard" />
      {[[-10, 4], [10, 4], [-10, -10], [10, 7]].map(([x = 0, z = 0]) => (
        <Prop key={`b${x}${z}`} id="painted_wooden_bench" position={[x, 0, z]} rotationY={x < 0 ? Math.PI / 2 : -Math.PI / 2} />
      ))}
      {[[-12, 12], [12, 12], [-12, -12], [12, -12], [-12, 0]].map(([x = 0, z = 0], i) => (
        <Planter key={`p${x}${z}`} position={[x, 0, z]} seed={i + 3} />
      ))}
      {[-12, -4, 4, 12].map((z) => (
        <WallLamp key={z} position={[-13.9, 3.2, z]} rotationY={Math.PI / 2} />
      ))}
      {/* The Warden crash-lands in the courtyard, points at the broken anchor, then leaps back to the tower. */}
      <WardenCameo
        beatId="courtyard-warden-sighting"
        scale={0.8}
        rotationY={0.5}
        keys={[
          { t: 0, position: [3, 26, -14] },
          { t: 0.15, position: [3, 0.2, -10] },
          { t: 0.25, position: [3, 0.2, -10] },
          { t: 0.35, position: [3, 0.2, -10], arm: 1 },
          { t: 0.72, position: [3, 0.2, -10], arm: 1 },
          { t: 0.8, position: [3, 0.2, -10] },
          // Leaps straight up clear of the facade (17 m) before heading back to the tower.
          { t: 0.9, position: [3, 22, -10] },
          { t: 1, position: [-2, 36, -28] },
        ]}
      />
    </group>
  );
}

function Fountain({ celebration }: { celebration: boolean }) {
  const water = useRef<import('three').Mesh>(null);
  useFrame((state) => {
    if (water.current) water.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 1.4) * 0.008;
  });
  return (
    <group name="fountain">
      <KitModel id="fountain_courtyard" />
      <mesh ref={water} position={[0, 0.55, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[3.0, 8]} />
      </mesh>
      <mesh position={[0, 2.04, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[1.22, 32]} />
      </mesh>
      <mesh position={[0, 2.86, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[0.58, 24]} />
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
  // Mira only needs to exist while the player is in the hall (keeps the courtyard views lighter).
  const inHall = useRunStore((s) => s.areaId === 'east-hall');
  const H = 5;
  const W = 2.5;
  return (
    <group name="east-hall">
      <MergeStatic>
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
      </MergeStatic>
      {[20, 27, 34, 41].map((x) => (
        <group key={x}>
          <WallLamp position={[x, 3.0, -W + 0.02]} />
          <WallLamp position={[x, 3.0, W - 0.02]} rotationY={Math.PI} />
          <pointLight position={[x, 3.7, 0]} color="#ffc98a" intensity={10} distance={10} decay={2} />
        </group>
      ))}
      <MergeStatic shadows={false}>
        {[-1, 1].map((side) => (
          <group key={side}>
            <Slab x={[15, 44]} y={[0, 1.15]} z={side < 0 ? [-W, -W + 0.04] : [W - 0.04, W]} material={MAT.panelWood} shadows={false} />
            <Slab x={[15, 44]} y={[1.15, 1.22]} z={side < 0 ? [-W, -W + 0.07] : [W - 0.07, W]} material={MAT.darkOak} shadows={false} />
          </group>
        ))}
        {[22, 39].map((x) => (
          <WindowPane key={x} position={[x, 2.6, -W + 0.01]} size={[1.4, 2.4]} />
        ))}
      </MergeStatic>
      {(
        [
          [18, 'landscape_1', [1.6, 1.1]],
          [24, 'star_chart_1', [1.6, 1.1]],
          [37, 'painting_3', [1.0, 1.3]],
        ] as const
      ).map(([x, painting, size]) => (
        <Portrait key={x} position={[x, 2.2, W - 0.05]} rotationY={Math.PI} painting={painting} size={size} />
      ))}
      <Bookshelf position={[26, 0, W - 0.05]} rotationY={Math.PI} width={2.4} height={2.6} shelves={4} seed={3} />
      <EastHallMira inHall={inHall} />
      <BookSwarm beats={['east-hall-stampede', 'east-hall-chest', 'east-hall-stampede-2']} startAt={0.3} />
      <Chest />
      <Prop id="GothicCabinet_01" position={[21, 0, -W + 0.35]} height={2.1} />
      <Prop id="vintage_grandfather_clock_01" position={[36.5, 0, -W + 0.3]} height={2.2} />
      <Prop id="WoodenTable_01" position={[35, 0, W - 0.5]} height={0.78} rotationY={Math.PI / 2} />
      <Prop id="book_encyclopedia_set_01" position={[35, 0.78, W - 0.5]} height={0.3} rotationY={Math.PI} />
      <Prop id="Lantern_01" position={[34.6, 0.78, W - 0.35]} height={0.4} />
      <Prop id="potted_plant_02" position={[16.5, 0, W - 0.5]} height={1.3} />
    </group>
  );
}

const MIRA_BURST_LAST = beatIndexOf('east-hall-mira-burst');
const MIRA_SLAM = beatIndexOf('east-hall-slam');

/**
 * Mira bursts out of the alcove, runs off down the hall ahead of the books, and holds the line at the
 * end (owner, 2026-10-17: she used to vanish when the books came out).
 */
function EastHallMira({ inHall }: { inHall: boolean }) {
  const beat = useBeatIndex();
  if (!inHall) return null;
  if (beat <= MIRA_BURST_LAST) return <Mira position={MIRA_EAST_HALL_POSITION} rotationY={-1.9} waving />;
  if (beat >= MIRA_SLAM) return <Mira position={MIRA_EAST_HALL_END} rotationY={-1.4} />;
  return <MiraRunsOff />;
}

const MIRA_RUN_SPEED = 4.2;

function MiraRunsOff() {
  const ref = useRef<Group>(null);
  const run = useMemo(() => ({ x: MIRA_EAST_HALL_POSITION[0] as number, arrived: false }), []);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    run.x = Math.min(MIRA_EAST_HALL_END[0], run.x + MIRA_RUN_SPEED * Math.min(dt, 0.1));
    run.arrived = run.x >= MIRA_EAST_HALL_END[0];
    const k = (run.x - MIRA_EAST_HALL_POSITION[0]) / (MIRA_EAST_HALL_END[0] - MIRA_EAST_HALL_POSITION[0]);
    g.position.set(run.x, 0, MIRA_EAST_HALL_POSITION[2] + (MIRA_EAST_HALL_END[2] - MIRA_EAST_HALL_POSITION[2]) * k);
    // She turns from the books towards the library doors, runs, and turns back to face them at the end.
    const want = run.arrived ? -1.4 : Math.PI / 2;
    g.rotation.y += (want - g.rotation.y) * (1 - Math.exp(-8 * Math.min(dt, 0.1)));
  });
  return (
    <group ref={ref} position={MIRA_EAST_HALL_POSITION} rotation={[0, -1.9, 0]}>
      <Mira position={[0, 0, 0]} clip={() => (run.arrived ? 'Idle' : 'Run')} />
    </group>
  );
}

function Chest() {
  const glow = useRef<import('three').PointLight>(null);
  useFrame((_, dt) => {
    const open = getRun()?.flags.has('chest-open') ?? false;
    if (glow.current) glow.current.intensity += ((open ? 6 : 0) - glow.current.intensity) * (1 - Math.exp(-3 * Math.min(dt, 0.1)));
  });
  const [x, , z] = CHEST_POSITION;
  return (
    <group position={[x, 0, z]}>
      <Prop id="treasure_chest" position={[0, 0, 0]} height={0.6} rotationY={-0.84} />
      <pointLight ref={glow} position={[0, 0.8, 0.2]} color="#ffd88a" intensity={0} distance={4} />
    </group>
  );
}

// ---------- Celebration ----------

function CelebrationDressing({ cheering }: { cheering: boolean }) {
  return (
    <group name="celebration">
      <Mira position={[-4, 0, 3]} rotationY={0.6} waving />
      <KeeperOrin position={[3.5, 0, 3.2]} rotationY={-1.9} />
      {[[-8, 2, 0.6], [-9, -4, 1.2], [8, -2, -1.2], [9, 3, -1.6], [-6, 9, 2.4], [7, 10, -2.6], [4, -9, 0.2], [-3, -10, 0.4]].map(
        ([x = 0, z = 0, r = 0], i) => (
          <Student key={i} position={[x, 0, z]} rotationY={r} robe={i % 3 === 0 ? MAT.burgundyLeather : MAT.navyCloth} height={1.35 + (i % 3) * 0.12} calm={!cheering} cheering={cheering} />
        ),
      )}
      {/* Night celebration light: warm lamplight across the courtyard and a soft fill so faces read */}
      <pointLight position={[0, 6, 2]} color="#ffc070" intensity={60} distance={40} decay={1.4} />
      <pointLight position={[-10, 4, -6]} color="#ffb060" intensity={30} distance={26} decay={1.5} />
      <pointLight position={[10, 4, 6]} color="#ffb060" intensity={30} distance={26} decay={1.5} />
      <hemisphereLight args={['#8090c8', '#3a2a20', 0.6]} />
      {/* Fireworks over the hall roof, all through the night homecoming */}
      <Fireworks origin={[0, 18, -45]} spread={70} height={[16, 34]} active={() => getRun()?.level.id === 'level-3'} />
      {Array.from({ length: 14 }, (_, i) => (
        <FloatingLantern key={i} position={[Math.cos(i * 1.3) * (6 + (i % 3) * 2.5), 5 + (i % 4) * 0.8, Math.sin(i * 1.3) * (6 + (i % 3) * 2.5)]} seed={i} />
      ))}
      {[-6, 6].map((x) => (
        <group key={x} position={[x, 0, -7]}>
          <Prop id="WoodenTable_01" position={[0, 0, 0]} height={0.78} />
          <Prop id="wooden_lantern_01" position={[-0.4, 0.78, 0]} height={0.35} />
          <Prop id="brass_candleholders" position={[0.4, 0.78, 0]} height={0.3} />
        </group>
      ))}
      <StaticWarden position={[0, 31.5, -53.5]} scale={0.75} />
    </group>
  );
}

// ---------- Ward dome over the campus ----------

const FRACTURE_BEAT = beatIndexOf('arrival-ward-fracture');
const OBSERVATORY_RESTORED_BEAT = beatIndexOf('observatory-restored');

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
