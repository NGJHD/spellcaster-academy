/**
 * Level 2 areas (LEVEL2_DESIGN L2-6 … L2-16): the academy at night under siege, lit by inkfire.
 * Each scene matches the local layout documented in its area script (src/level/areas2).
 * PLACEHOLDER geometry is kit-built; mobs and bosses are realistic AI-pipeline models.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, DoubleSide, MeshStandardMaterial, type Group } from 'three';
import { BELL_POSITION, BRIDGE_ORIGIN, PLANK_GAPS } from '../../level/areas2/bridge';
import { HALL_ORIGIN, HERALD_POSITION, LANE_DOORS } from '../../level/areas2/greatHall';
import { BOAT_BEATS, LAKE_ORIGIN, LIFT_BEATS_L2, LIGHTHOUSE_HEIGHT } from '../../level/areas2/lake';
import { DORM_DOOR, LAWN_ORIGIN, STALL_POSITIONS } from '../../level/areas2/lawn';
import { LADDERS, RAMPART_ORIGIN, RAMPART_WARDEN } from '../../level/areas2/ramparts';
import { AFTERMATH_ORIGIN, ROOF_ORIGIN, WYRM_HEAD } from '../../level/areas2/towerRoof';
import { FURNACE_POSITION, WORKSHOP_ORIGIN } from '../../level/areas2/workshops';
import { LIBRARY_ORIGIN } from '../../level/areas/library';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { Fire, Restorable } from '../Fire';
import { Banner, Box, KitModel, Slab } from '../kit';
import { MAT } from '../materials';
import { Prop } from '../Prop';
import { metreSurface } from '../surfaceTextures';
import { FloatingLantern, KeeperOrin, Mira, StaticWarden, Student, useBeatIndex } from '../props';
import { BurningSkyline, HeraldFallback, SceneCreature, WyrmFallback, useReached } from './common';

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nightWater = new MeshStandardMaterial({ color: '#0a0606', roughness: 0.35, metalness: 0.1, emissive: '#4a0c04', emissiveIntensity: 0.35, envMapIntensity: 0.15 });
const scorched = () => metreSurface('scorched', 6);
const lawnGrass = () => metreSurface('grass', 5);
const stoneFloor = () => metreSurface('stone', 3);

// ---------- Lantern Festival Lawn ----------

export function LawnScene() {
  return (
    <group position={LAWN_ORIGIN}>
      <Slab x={[-120, 120]} y={[-0.2, 0]} z={[-24, 120]} material={lawnGrass()} />
      {/* Lantern Lake beyond the lawn, reflecting the red sky */}
      <mesh position={[0, -0.3, -140]} rotation={[-Math.PI / 2, 0, 0]} material={nightWater}>
        <planeGeometry args={[400, 240]} />
      </mesh>
      {/* Festival stalls: striped awnings on timber frames; the left one burns until restored */}
      {STALL_POSITIONS.map((p, i) => {
        const local = sub(p, LAWN_ORIGIN);
        const stall = (
          <group position={local}>
            {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} position={[sx * 1.3, 1.2, sz * 0.8]} size={[0.12, 2.4, 0.12]} material={MAT.darkOak} />))}
            <Box position={[0, 1.0, 0.7]} size={[2.8, 0.9, 0.3]} material={MAT.lightOak} />
            <Box position={[0, 2.5, 0]} size={[3, 0.12, 2]} material={MAT.burgundyLeather} />
            <Prop id="wooden_lantern_01" position={[0.8, 1.45, 0.7]} height={0.4} />
          </group>
        );
        if (i === 2) return <group key={i}>{stall}<Fire position={[local[0], 2.4, local[2]]} size={1.6} count={3} spread={2} /></group>;
        return (
          <Restorable key={i} flag={`l2-stall-${i + 1}`} fire={{ position: [local[0], 1.2, local[2]], size: 2, count: 4, spread: 2.2, light: i === 0 }}>
            {stall}
          </Restorable>
        );
      })}
      {/* Festival lanterns still drifting over the lawn and lake */}
      {[[-14, 6, -10], [10, 7, -16], [-4, 9, -26], [16, 8, -34], [-20, 10, -40], [4, 12, -52]].map((p, i) => (
        <FloatingLantern key={i} position={p as unknown as Vec3} seed={i + 3} />
      ))}
      {/* Boathouse on the shore, burning */}
      <group position={[18, 0, -28]}>
        <Box position={[0, 2, 0]} size={[8, 4, 6]} material={MAT.darkOak} />
        <mesh position={[0, 5, 0]} rotation={[0, 0, 0]} material={MAT.slate}>
          <coneGeometry args={[5.6, 2.4, 4]} />
        </mesh>
        <Fire position={[0, 4.5, 0]} size={4} count={5} spread={5} light />
      </group>
      {/* Dormitory tower to the east, its door burning */}
      <group position={sub(DORM_DOOR, LAWN_ORIGIN)}>
        <mesh position={[4.6, 12, 0]} material={MAT.academyStone} castShadow>
          <cylinderGeometry args={[4.6, 4.8, 24, 32]} />
        </mesh>
        <mesh position={[4.6, 27, 0]} material={MAT.slate}>
          <coneGeometry args={[5.4, 7, 32]} />
        </mesh>
        <Box position={[0, 1.4, 0]} size={[0.2, 2.8, 1.8]} material={MAT.darkOak} />
        <Fire position={[0.4, 0.2, 0]} size={2.4} count={4} spread={1.6} light />
        <Fire position={[4.6, 24, 0]} size={5} count={4} spread={6} />
      </group>
      <BurningSkyline position={[0, 0, 70]} rotationY={Math.PI} seed={1} />
      <BurningSkyline position={[-70, 0, -10]} rotationY={Math.PI / 2} seed={2} />
      {/* Students fleeing towards the Great Hall */}
      {[[-10, 0, 6], [-12, 0, 9], [-9, 0, 11]].map((p, i) => (
        <Student key={i} position={p as unknown as Vec3} rotationY={-2.2} />
      ))}
      <Mira position={[-7, 0, 8]} rotationY={-2.4} waving />
    </group>
  );
}

// ---------- Dormitory (fires inside the reused stairwell) ----------

export { DormitoryFires } from './dormitoryFires';

// ---------- Bell Bridge ----------

const SEG = 4;

/** Deck sections that fall into the gorge once the camera is safely past them. */
function CollapsingDeck() {
  const segments = useMemo(() => {
    const out: number[] = [];
    for (let z = 10; z > -64; z -= SEG) {
      const centre = z - SEG / 2;
      if (PLANK_GAPS.some((g) => Math.abs(centre - g) < SEG / 2)) continue;
      out.push(centre);
    }
    return out;
  }, []);
  const refs = useRef<(Group | null)[]>([]);
  const drop = useRef<number[]>(segments.map(() => 0));
  useFrame((state, delta) => {
    const camZ = state.camera.position.z - BRIDGE_ORIGIN[2];
    const dt = Math.min(delta, 0.1);
    segments.forEach((z, i) => {
      const g = refs.current[i];
      if (!g) return;
      const falling = z > camZ + 7 && z < 6;
      const v = drop.current[i] ?? 0;
      const next = falling ? v + dt : 0;
      drop.current[i] = next;
      g.position.y = -4.9 * next * next;
      g.rotation.x = next * 0.6 * (i % 2 ? 1 : -1);
      g.visible = g.position.y > -60;
    });
  });
  return (
    <>
      {segments.map((z, i) => (
        <group key={z} ref={(g) => void (refs.current[i] = g)} position={[0, 0, z]}>
          <Box position={[0, -0.15, 0]} size={[5.2, 0.3, SEG]} material={MAT.darkOak} />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Box position={[s * 2.5, 0.55, 0]} size={[0.12, 1.1, SEG]} material={MAT.lightOak} />
              <Box position={[s * 2.5, 2, 0]} size={[0.2, 4, 0.2]} material={MAT.darkOak} />
            </group>
          ))}
          {z > -44 && <Box position={[0, 4.1, 0]} size={[5.6, 0.2, SEG]} material={MAT.slate} />}
        </group>
      ))}
    </>
  );
}

export function BridgeScene() {
  const bellLit = useMemo(() => MAT.agedBrass.clone() as MeshStandardMaterial, []);
  useFrame(() => {
    const lit = getRun()?.flags.has('l2-beacon-bell') ?? false;
    bellLit.emissive.set(lit ? '#ffb640' : '#000000');
    bellLit.emissiveIntensity = lit ? 1.4 : 0;
  });
  const bell = sub(BELL_POSITION, BRIDGE_ORIGIN);
  return (
    <group position={BRIDGE_ORIGIN}>
      <CollapsingDeck />
      {/* Burning planks over the gaps: restored by their words */}
      {PLANK_GAPS.map((z, i) => (
        <Restorable key={z} flag={`l2-plank-${i + 1}`} fire={{ position: [0, 0, z], size: 1.6, count: 4, spread: 3.5, light: true }}>
          <Box position={[0, -0.15, z]} size={[5.2, 0.3, SEG]} material={MAT.darkOak} />
        </Restorable>
      ))}
      {/* Gorge walls and the far floor */}
      <Slab x={[-60, -6]} y={[-80, -2]} z={[-80, 20]} material={scorched()} />
      <Slab x={[6, 60]} y={[-80, -2]} z={[-80, 20]} material={scorched()} />
      {/* Belfry: a stone tower straddling the bridge, the great bell hanging inside */}
      <group position={[0, 0, bell[2]]}>
        {[-1, 1].map((s) => (
          <Box key={s} position={[s * 3.4, 5, 0]} size={[1.4, 10, 3]} material={MAT.academyStone} />
        ))}
        <Box position={[0, 10.4, 0]} size={[8.2, 1, 3.4]} material={MAT.academyStoneDark} />
        <mesh position={[0, 12.6, 0]} material={MAT.slate}>
          <coneGeometry args={[4.4, 4, 4]} />
        </mesh>
        <mesh position={[0, bell[1], 0]} material={bellLit} castShadow>
          <cylinderGeometry args={[0.9, 1.6, 2.2, 32, 1, true]} />
        </mesh>
        <mesh position={[0, bell[1] + 1.2, 0]} material={bellLit}>
          <sphereGeometry args={[0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      </group>
      {/* Fires along the roof and in the gorge below */}
      {[2, -8, -20, -30, -44, -58].map((z, i) => (
        <Fire key={z} position={[i % 2 ? 2 : -2, 4.2, z]} size={2} count={3} spread={1.5} />
      ))}
      <Fire position={[-10, -30, -30]} size={8} count={4} spread={8} smoke={false} />
      <BurningSkyline position={[0, -10, -110]} seed={3} />
    </group>
  );
}

// ---------- Great Hall ----------

export function HallScene() {
  const doorsBlown = useReached('l2-herald-enters');
  const herald = sub(HERALD_POSITION, HALL_ORIGIN);
  return (
    <group position={HALL_ORIGIN}>
      <Slab x={[-9.5, 9.5]} y={[-0.2, 0]} z={[-48, 8]} material={stoneFloor()} />
      <Slab x={[-10, -9]} y={[0, 12]} z={[-48, 8]} material={MAT.academyStone} />
      <Slab x={[9, 10]} y={[0, 12]} z={[-48, 8]} material={MAT.academyStone} />
      <Slab x={[-10, 10]} y={[0, 12]} z={[-49, -48]} material={MAT.academyStone} />
      <Slab x={[-10, 10]} y={[0, 12]} z={[8, 9]} material={MAT.academyStone} />
      {/* Vaulted ceiling ribs */}
      {[-40, -32, -24, -16, -8, 0].map((z) => (
        <mesh key={z} position={[0, 12, z]} rotation={[0, 0, 0]} material={MAT.academyStoneDark}>
          <torusGeometry args={[9.5, 0.3, 8, 24, Math.PI]} />
        </mesh>
      ))}
      <Slab x={[-10, 10]} y={[19, 19.6]} z={[-48, 8]} material={MAT.slate} />
      {/* Long tables pushed into barricades in front of the camera */}
      {[[-4, -9, 0.3], [0.5, -10, -0.2], [4.5, -9, 0.4]].map(([x, z, r], i) => (
        <Prop key={i} id="WoodenTable_01" position={[x ?? 0, 0, z ?? 0]} rotationY={r ?? 0} height={0.85} />
      ))}
      {/* Lane doors on the west wall, each with inkfire licking round the frame */}
      {LANE_DOORS.map((d, i) => {
        const l = sub(d, HALL_ORIGIN);
        return (
          <group key={i} position={[l[0] + 0.55, 0, l[2]]}>
            <Box position={[0, 1.8, 0]} size={[0.1, 3.6, 2.2]} material={MAT.darkOak} />
            <Fire position={[0.3, 0, 0]} size={1.4} count={3} spread={2} light={i === 1} />
          </group>
        );
      })}
      {/* East doors, blasted off their hinges by the Herald */}
      {!doorsBlown && <Box position={[8.9, 2.6, -22]} size={[0.2, 5.2, 3.6]} material={MAT.darkOak} />}
      {doorsBlown && <Fire position={[8.4, 0, -22]} size={2.4} count={4} spread={3} light />}
      {/* Idris's barrier and the students behind it */}
      <mesh position={[0, 3, -42]}>
        <planeGeometry args={[18, 6]} />
        <meshBasicMaterial color="#6fb6ff" transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
      </mesh>
      {[-6, -3.5, -1, 1.5, 4, 6.5].map((x, i) => (
        <Student key={x} position={[x, 0, -45 - (i % 2)]} rotationY={0} height={1.3 + (i % 3) * 0.08} />
      ))}
      <Student position={[0, 0, -41]} rotationY={Math.PI} robe={MAT.greenLeather} height={1.7} />
      {/* Banners along the walls, two of them burning */}
      {[-30, -18, -6].map((z, i) => (
        <group key={z}>
          <Banner position={[-8.8, 5, z]} rotationY={Math.PI / 2} />
          <Banner position={[8.8, 5, z + 6]} rotationY={-Math.PI / 2} />
          {i !== 1 && <Fire position={[-8.6, 3.4, z]} size={1.6} count={2} spread={0.6} smoke={false} />}
        </group>
      ))}
      <SceneCreature
        file="grey_herald.glb"
        position={herald}
        rotationY={-0.4}
        scale={1.6}
        fromBeat="l2-herald-enters"
        goneFlag="l2-herald-gone"
        fallback={<HeraldFallback />}
        rearing={() => {
          const run = getRun();
          return (run?.director.currentBeat?.id ?? '').startsWith('l2-herald-2');
        }}
      />
    </group>
  );
}

// ---------- Alchemy Workshops ----------

export function WorkshopScene() {
  const furnace = sub(FURNACE_POSITION, WORKSHOP_ORIGIN);
  return (
    <group position={WORKSHOP_ORIGIN}>
      <Slab x={[-12, 12]} y={[-0.2, 0]} z={[-32, 8]} material={stoneFloor()} />
      <Slab x={[-12.5, -12]} y={[0, 9]} z={[-32, 8]} material={MAT.academyStoneDark} />
      <Slab x={[12, 12.5]} y={[0, 9]} z={[-32, 8]} material={MAT.academyStoneDark} />
      <Slab x={[-12, 12]} y={[9, 9.4]} z={[-32, 8]} material={MAT.darkOak} />
      {/* Benches in two rows with glassware and instruments */}
      {[-14, -20].map((z) =>
        [-6, 6].map((x) => (
          <group key={`${x}${z}`} position={[x, 0, z]}>
            <Prop id="WoodenTable_01" position={[0, 0, 0]} height={0.9} />
            <Prop id="vintage_microscope" position={[-0.4, 0.9, 0]} height={0.35} />
            <Prop id="brass_vase_01" position={[0.5, 0.9, 0.1]} height={0.3} />
          </group>
        )),
      )}
      {/* Copper stills along the walls, inkfire running along the pipes */}
      {[-24, -10, 2].map((z) =>
        [-10.5, 10.5].map((x) => (
          <group key={`s${x}${z}`} position={[x, 0, z]}>
            <mesh position={[0, 1.4, 0]} material={MAT.agedBrass} castShadow>
              <sphereGeometry args={[1, 24, 16]} />
            </mesh>
            <mesh position={[0, 3, 0]} material={MAT.agedBrass}>
              <cylinderGeometry args={[0.12, 0.3, 2.2, 12]} />
            </mesh>
          </group>
        )),
      )}
      <Restorable flag="l2-beacon-furnace" burning={false}>
        <mesh position={[-10.5, 6, -10]} rotation={[Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
          <cylinderGeometry args={[0.18, 0.18, 34, 10]} />
        </mesh>
      </Restorable>
      {[-24, -12, 0].map((z) => (
        <Fire key={z} position={[-10.5, 6, z]} size={0.9} count={2} spread={1.4} smoke={false} untilFlag="l2-beacon-furnace" />
      ))}
      {/* The great furnace: ash-choked until the beacon roars back */}
      <group position={furnace}>
        <Box position={[0, 3, 0]} size={[6, 6, 4]} material={MAT.academyStoneDark} />
        <mesh position={[0, 8.5, 0]} material={MAT.academyStoneDark}>
          <cylinderGeometry args={[1.2, 1.8, 5, 16]} />
        </mesh>
        <Box position={[0, 2, 2.05]} size={[2.6, 2.2, 0.1]} material={scorched()} />
        <Fire position={[0, 1, 2]} size={2.6} count={5} spread={2} kind="warm" light fromFlag="l2-beacon-furnace" />
        <Fire position={[0, 11, 0]} size={3} count={3} spread={1.6} kind="warm" fromFlag="l2-beacon-furnace" />
      </group>
    </group>
  );
}

// ---------- Lantern Lake ----------

/** The boat (and the lighthouse lift) carried under the camera during their rail beats. */
export function Carried({ beats, children, drop }: { beats: readonly string[]; children: React.ReactNode; drop: number }) {
  const group = useRef<Group>(null);
  useBeatIndex();
  useFrame((state) => {
    const run = getRun();
    const g = group.current;
    if (!g || !run) return;
    const id = run.director.currentBeat?.id ?? '';
    const on = beats.includes(id);
    g.visible = on;
    if (!on) return;
    g.position.set(state.camera.position.x, state.camera.position.y - drop, state.camera.position.z);
    g.rotation.y = Math.atan2(-(state.camera.matrixWorld.elements[8] ?? 0), -(state.camera.matrixWorld.elements[10] ?? 1));
  });
  return <group ref={group}>{children}</group>;
}

export function LakeScene() {
  const lampOn = useRef(0);
  const lamp = useMemo(() => MAT.lampGlow.clone() as MeshStandardMaterial, []);
  useFrame((_, delta) => {
    const on = getRun()?.flags.has('l2-beacon-lighthouse') ?? false;
    lampOn.current += ((on ? 1 : 0) - lampOn.current) * (1 - Math.exp(-2 * Math.min(delta, 0.1)));
    lamp.emissiveIntensity = 0.2 + lampOn.current * 4;
  });
  return (
    <>
      <group position={LAKE_ORIGIN}>
        <mesh position={[0, 0, -80]} rotation={[-Math.PI / 2, 0, 0]} material={nightWater}>
          <planeGeometry args={[500, 400]} />
        </mesh>
        {/* Burning lanterns adrift */}
        {[[-6, -20], [7, -28], [-9, -52], [5, -66], [-3, -90], [9, -104]].map(([x, z], i) => (
          <group key={i} position={[x ?? 0, 0.2, z ?? 0]}>
            <FloatingLantern position={[0, 0.2, 0]} seed={i + 9} />
            <Fire position={[0, 0.5, 0]} size={0.7} count={2} spread={0.3} smoke={false} />
          </group>
        ))}
        {/* The boathouse and jetty, on fire */}
        <group position={[18, 0, -50]}>
          <Box position={[0, 2.5, 0]} size={[8, 5, 7]} material={MAT.darkOak} />
          <mesh position={[0, 6.2, 0]} material={MAT.slate}>
            <coneGeometry args={[6, 2.6, 4]} />
          </mesh>
          <Fire position={[0, 5.6, 0]} size={5} count={5} spread={6} light />
        </group>
        <Box position={[12, 0.3, -46]} size={[7, 0.3, 2.4]} material={MAT.lightOak} />
        {/* Lighthouse island */}
        <mesh position={[0, -0.5, -128]} material={scorched()}>
          <cylinderGeometry args={[12, 16, 2, 32]} />
        </mesh>
        <group position={[0, 0, -128]}>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[0, 2 + i * 4, 0]} material={i % 2 ? MAT.burgundyLeather : MAT.plaster} castShadow>
              <cylinderGeometry args={[3.6 - i * 0.18, 3.8 - i * 0.18, 4, 32, 1, true]} />
            </mesh>
          ))}
          <mesh position={[0, LIGHTHOUSE_HEIGHT + 2.6, 0]} material={lamp}>
            <sphereGeometry args={[0.8, 24, 16]} />
          </mesh>
          <mesh position={[0, LIGHTHOUSE_HEIGHT + 5, 0]} material={MAT.slate}>
            <coneGeometry args={[2.6, 3, 24]} />
          </mesh>
        </group>
        <BurningSkyline position={[0, 0, 60]} rotationY={Math.PI} seed={4} />
      </group>
      <Carried beats={BOAT_BEATS} drop={1.0}>
        <Box position={[0, 0, -0.6]} size={[1.8, 0.5, 4.2]} material={MAT.darkOak} />
        <Student position={[0, 0.25, -2.2]} rotationY={Math.PI} robe={MAT.darkOak} height={1.6} />
        <Prop id="wooden_lantern_01" position={[0.7, 0.25, -2.6]} height={0.5} />
      </Carried>
      <Carried beats={LIFT_BEATS_L2} drop={1.6}>
        <Prop id="lift_platform" position={[0, 0, -0.4]} height={2.4} />
      </Carried>
    </>
  );
}

// ---------- Burning library (fires over the reused Level 1 library) ----------

export function LibraryFires() {
  const L = LIBRARY_ORIGIN;
  return (
    <group position={L}>
      {[[-11, 2, -10], [11, 2, -14], [-11, 6.5, -20], [11, 6.5, -26], [-6, 0, -30], [8, 0, -8]].map((p, i) => (
        <Fire key={i} position={p as unknown as Vec3} size={2.2} count={3} spread={2} light={i < 2} />
      ))}
      {[1, 2, 3].map((n, i) => (
        <Fire key={n} position={[i === 1 ? 11 : -11, 1.2, i === 2 ? -22 : -16]} size={1.6} count={3} spread={2.4} untilFlag={`l2-shelf-${n}`} />
      ))}
    </group>
  );
}

// ---------- East Ramparts ----------

export function RampartScene() {
  const warden = sub(RAMPART_WARDEN, RAMPART_ORIGIN);
  return (
    <group position={RAMPART_ORIGIN}>
      <Slab x={[-20, 20]} y={[-1, 0]} z={[-2.6, 6]} material={stoneFloor()} />
      {/* Parapet with crenellations along the cliff edge */}
      <Slab x={[-20, 20]} y={[0, 1]} z={[-3.2, -2.6]} material={MAT.academyStone} />
      {Array.from({ length: 20 }, (_, i) => -19 + i * 2).map((x) => (
        <Box key={x} position={[x, 1.4, -2.9]} size={[1, 0.8, 0.6]} material={MAT.academyStone} />
      ))}
      {/* Towers at each end */}
      {[-14, 14].map((x) => (
        <group key={x} position={[x, 0, -1]}>
          <mesh position={[0, 4, 0]} material={MAT.academyStone} castShadow>
            <cylinderGeometry args={[2.6, 2.8, 10, 24]} />
          </mesh>
          <Fire position={[0, 9, 0]} size={3} count={3} spread={2} light={x < 0} />
        </group>
      ))}
      {/* The cliff, the ladders of the Hush, and the lake far below */}
      <Slab x={[-40, 40]} y={[-34, -1]} z={[-12, -3]} material={scorched()} />
      {LADDERS.map((l, i) => {
        const p = sub(l, RAMPART_ORIGIN);
        return (
          <group key={i} position={[p[0], p[1], p[2] + 3]} rotation={[-0.35, 0, 0]}>
            {[-0.35, 0.35].map((x) => (
              <Box key={x} position={[x, 3, 0]} size={[0.1, 7, 0.1]} material={MAT.darkOak} />
            ))}
            <Fire position={[0, 2, 0]} size={1.4} count={3} spread={0.6} smoke={false} />
          </group>
        );
      })}
      <mesh position={[0, -30, -120]} rotation={[-Math.PI / 2, 0, 0]} material={nightWater}>
        <planeGeometry args={[400, 220]} />
      </mesh>
      <StaticWarden position={warden} scale={1.1} rotationY={Math.PI} />
      {[1, 2, 3].map((n) => (
        <Fire key={n} position={[warden[0] + (n - 2) * 0.5, 2 + n * 0.6, warden[2] + 0.3]} size={0.9} count={2} spread={0.4} smoke={false} untilFlag={`l2-warden-${n}`} />
      ))}
      <BurningSkyline position={[0, -30, 70]} rotationY={Math.PI} seed={5} />
    </group>
  );
}

// ---------- Moon Tower roof and the Vellum Wyrm ----------

export function RoofScene() {
  const head = sub(WYRM_HEAD, ROOF_ORIGIN);
  const wyrm = useRef<Group>(null);
  useFrame((state) => {
    const g = wyrm.current;
    if (!g) return;
    const id = getRun()?.director.currentBeat?.id ?? '';
    const flying = id.startsWith('l2-wyrm-v2') || id === 'l2-wyrm-orbit' || id === 'l2-wyrm-takeoff';
    const t = state.clock.elapsedTime;
    // Circles the tower during the sky chase; rears and sways on the roof otherwise.
    const target = flying ? { x: Math.sin(t * 0.5) * 14, y: 6 + Math.sin(t) * 2 } : { x: Math.sin(t * 0.7) * 0.6, y: Math.sin(t * 1.3) * 0.3 };
    g.position.x += (target.x - g.position.x) * 0.03;
    g.position.y += (target.y - g.position.y) * 0.03;
  });
  return (
    <group position={ROOF_ORIGIN}>
      {/* Tower shaft (the palm ride climbs its outside) and the crenellated roof */}
      <mesh position={[0, -30, 0]} material={MAT.academyStone} castShadow receiveShadow>
        <cylinderGeometry args={[9, 9.6, 60, 48]} />
      </mesh>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.paving}>
        <circleGeometry args={[9, 48]} />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => (i / 24) * Math.PI * 2).map((a, i) =>
        i % 2 ? null : <Box key={i} position={[Math.cos(a) * 8.8, 0.6, Math.sin(a) * 8.8]} size={[1.2, 1.2, 0.6]} rotation={[0, -a, 0]} material={MAT.academyStone} />,
      )}
      {[[-6, 0, -3], [6, 0, -4], [-3, 0, 6], [5, 0, 5]].map((p, i) => (
        <Fire key={i} position={p as unknown as Vec3} size={2} count={3} spread={1.6} light={i === 0} />
      ))}
      {[-20, -40].map((y) => (
        <Fire key={y} position={[7, y, 6]} size={4} count={3} spread={3} />
      ))}
      <StaticWarden position={[7, -8, 3]} scale={1.6} rotationY={-2.4} />
      <group ref={wyrm}>
        <SceneCreature
          file="vellum_wyrm.glb"
          position={[head[0], head[1] - 4, head[2] - 8]}
          scale={1.8}
          fromBeat="l2-wyrm-rises"
          goneFlag="l2-wyrm-defeated"
          fallback={<WyrmFallback />}
          rearing={() => (getRun()?.director.currentBeat?.id ?? '') === 'l2-wyrm-v1'}
        />
      </group>
      <BurningSkyline position={[0, -60, -90]} seed={6} />
      <BurningSkyline position={[0, -60, 90]} rotationY={Math.PI} seed={7} />
    </group>
  );
}

// ---------- Aftermath: the observatory at dawn ----------

export function AftermathScene() {
  const shard = useRef<Group>(null);
  useFrame((state) => {
    if (shard.current) shard.current.rotation.y = state.clock.elapsedTime * 0.5;
  });
  return (
    <group position={AFTERMATH_ORIGIN}>
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.paving}>
        <circleGeometry args={[12, 48]} />
      </mesh>
      <KitModel id="telescope" position={[-5, 0, -4]} rotationY={0.6} />
      <Box position={[0, 0.5, 0]} size={[1, 1, 1]} material={MAT.marble} />
      <group ref={shard} position={[0, 1.4, 0]}>
        <mesh>
          <octahedronGeometry args={[0.28, 0]} />
          <meshStandardMaterial color="#120808" roughness={0.1} metalness={0.4} emissive="#ff2a10" emissiveIntensity={1.4} />
        </mesh>
      </group>
      <KeeperOrin position={[1.4, 0, -1.2]} rotationY={-0.6} />
      <Mira position={[-1.6, 0, -0.8]} rotationY={0.7} />
      <StaticWarden position={[4, 0, -6]} scale={1} rotationY={-0.5} />
      {/* Smoke still rising from the academy below */}
      {[[-30, 0, -60], [20, 0, -80], [50, 0, -40]].map((p, i) => (
        <Fire key={i} position={p as unknown as Vec3} size={5} count={2} spread={4} kind="warm" />
      ))}
    </group>
  );
}
