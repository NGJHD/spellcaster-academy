/**
 * Level 2 areas (LEVEL2_DESIGN L2-6 … L2-16): the academy at night under siege, lit by inkfire.
 * Each scene matches the local layout documented in its area script (src/level/areas2).
 * PLACEHOLDER geometry is kit-built; mobs and bosses are realistic AI-pipeline models.
 */
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, DoubleSide, Float32BufferAttribute, MeshStandardMaterial, Vector3, type Group, type PointLight } from 'three';
import { BELL_POSITION, BRIDGE_ORIGIN, PLANK_GAPS } from '../../level/areas2/bridge';
import { HALL_ORIGIN, HERALD_POSITION, LANE_DOORS } from '../../level/areas2/greatHall';
import { BOAT_BEATS, LAKE_ORIGIN, LIFT_BEATS_L2, LIGHTHOUSE_HEIGHT, MOORED_BEATS } from '../../level/areas2/lake';
import { DORM_DOOR, LAWN_ORIGIN, STALL_POSITIONS } from '../../level/areas2/lawn';
import { LADDERS, RAMPART_BEACON, RAMPART_ORIGIN, RAMPART_WARDEN } from '../../level/areas2/ramparts';
import { AFTERMATH_ORIGIN, DRAGON_STAND, ROOF_ORIGIN } from '../../level/areas2/towerRoof';
import { FURNACE_POSITION, WORKSHOP_ORIGIN } from '../../level/areas2/workshops';
import { LIBRARY_ORIGIN } from '../../level/areas/library';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { Fire, Restorable } from '../Fire';
import { Banner, Box, GableRoof, KitModel, Slab } from '../kit';
import { MAT } from '../materials';
import { Prop } from '../Prop';
import { glowTexture, LightBeam, WardBarrier } from '../glow';
import { insideCylinder, worldCircle, worldCylinder } from '../surfaces';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { FloatingLantern, KeeperOrin, Mira, StaticWarden, Student, useBeatIndex, WardenModel, type WardenState } from '../props';
import { CreatureModel, creatureUrl } from '../../enemies/CreatureModel';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import { AftermathDressing, HallDressing, LakeDressing, LawnDressing, RampartDressing, WorkshopDressing } from './dressing';
import { BeaconBrazier, StoneHall, BurningSkyline, HeraldFallback, SceneCreature, WyrmFallback, useReached } from './common';

/** Dark red crystal with a hot inner glow. */
const SHARD_MAT = new MeshStandardMaterial({ color: '#3a0606', roughness: 0.15, metalness: 0.2, emissive: '#ff2a10', emissiveIntensity: 1.6 });

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nightWater = new MeshStandardMaterial({ color: '#0a0606', roughness: 0.35, metalness: 0.1, emissive: '#4a0c04', emissiveIntensity: 0.35, envMapIntensity: 0.15 });

// ---------- Lantern Festival Lawn ----------

export function LawnScene() {
  return (
    <group position={LAWN_ORIGIN}>
      <LawnDressing />
      <Slab x={[-120, 120]} y={[-0.2, 0]} z={[-24, 120]} material={MAT.grass} />
      {/* Lantern Lake beyond the lawn, reflecting the red sky */}
      <mesh position={[0, -0.3, -140]} rotation={[-Math.PI / 2, 0, 0]} material={nightWater}>
        <planeGeometry args={[400, 240]} />
      </mesh>
      {/* Festival stalls: striped awnings on timber frames; the left one burns until restored */}
      {STALL_POSITIONS.map((p, i) => {
        const local = sub(p, LAWN_ORIGIN);
        const boxes = (
          <group position={local}>
            {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} position={[sx * 1.3, 1.2, sz * 0.8]} size={[0.12, 2.4, 0.12]} material={MAT.darkOak} />))}
            <Box position={[0, 1.0, 0.7]} size={[2.8, 0.9, 0.3]} material={MAT.lightOak} />
            <Box position={[0, 2.5, 0]} size={[3, 0.12, 2]} material={MAT.burgundyLeather} />
          </group>
        );
        // Realistic festival stall (AI-pipeline prop; its wide front faces the model's +X, turned to the lawn).
        const stall = (
          <ModelBoundary fallback={boxes}>
            <Suspense fallback={boxes}>
              <Prop id="festival_stall" position={local} height={3.2} rotationY={-Math.PI / 2 + (i - 1) * 0.25} />
            </Suspense>
          </ModelBoundary>
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
      <Boathouse position={[18, 0, -28]} rotationY={-0.5} />
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
      {/* The academy burning across the lake: what the bedroom window and the lawn look out on */}
      <BurningSkyline position={[-50, 0, -200]} rotationY={0} seed={7} />
      <BurningSkyline position={[70, 0, -230]} rotationY={0} seed={8} />
      {/* Students fleeing towards the Great Hall */}
      {[[-10, 0, 6], [-12, 0, 9], [-9, 0, 11]].map((p, i) => (
        <Student key={i} position={p as unknown as Vec3} rotationY={-2.2} />
      ))}
      <Mira position={[-7, 0, 8]} rotationY={-2.4} waving />
    </group>
  );
}

/**
 * The boathouse: stone walls, oak corner posts, a slate gable roof and a dark arched water door, on
 * fire. (The AI-pipeline boathouse was rejected: its texturing invented pastel swirls on the walls.)
 */
function Boathouse({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box position={[0, 2.2, 0]} size={[8, 4.4, 6.4]} material={MAT.paving} />
      {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} position={[sx * 4, 2.2, sz * 3.2]} size={[0.35, 4.6, 0.35]} material={MAT.darkOak} />))}
      <Box position={[0, 4.5, 3.25]} size={[8.4, 0.3, 0.3]} material={MAT.darkOak} />
      <Box position={[0, 4.5, -3.25]} size={[8.4, 0.3, 0.3]} material={MAT.darkOak} />
      {/* Arched water door facing the lake, and a small window */}
      <Box position={[0, 1.4, 3.22]} size={[3, 2.8, 0.1]} material={MAT.ink} />
      <mesh position={[0, 2.8, 3.24]} material={MAT.darkOak}>
        <torusGeometry args={[1.55, 0.14, 8, 20, Math.PI]} />
      </mesh>
      <Box position={[-2.6, 2.6, 3.22]} size={[0.9, 1.1, 0.08]} material={MAT.windowGlow} />
      <GableRoof position={[0, 4.4, 0]} length={8.6} span={7} rise={3} />
      {/* A short jetty */}
      <Box position={[0, 0.3, 6]} size={[2.4, 0.2, 5.6]} material={MAT.lightOak} />
      <Fire position={[0, 5.6, 0]} size={4.5} count={5} spread={6} light />
      <Fire position={[-2.5, 0.6, 3.6]} size={1.4} count={2} spread={1} smoke={false} />
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
          {/* Stone balustrades (the Level 1 kit piece) with oak posts carrying the roof */}
          {[-1, 1].map((s) => (
            <group key={s}>
              {[-1, 1].map((k) => (
                <KitModel key={k} id="balustrade_2m" position={[s * 2.5, 0, k * 1]} rotationY={Math.PI / 2} />
              ))}
              <mesh position={[s * 2.5, 2, -SEG / 2 + 0.1]} material={MAT.darkOak} geometry={worldCylinder(0.12, 0.14, 4, 12)} castShadow />
            </group>
          ))}
          {z > -44 && (
            <>
              {/* Oak tie beam and a slate roof */}
              <Box position={[0, 3.95, -SEG / 2 + 0.1]} size={[5.2, 0.22, 0.22]} material={MAT.darkOak} />
              <Box position={[0, 4.1, 0]} size={[5.6, 0.2, SEG]} material={MAT.slate} />
            </>
          )}
        </group>
      ))}
    </>
  );
}

/** Rocks on the far bank: [x, z, height]. */
const BANK_ROCKS: readonly (readonly [number, number, number])[] = [
  [-14, -79, 1.4], [-7, -81, 0.9], [8, -80, 1.2], [15, -78, 1.6], [24, -82, 1], [-24, -80, 1.3], [-38, -79, 1.1], [36, -80, 1.4],
  [-52, -104, 2.6], [-30, -102, 2.2], [-6, -100, 1.8], [12, -101, 2.4], [32, -103, 2], [54, -102, 2.8],
  [-46, -120, 2.2], [-12, -119, 2], [20, -121, 2.4], [48, -118, 2],
];

export function BridgeScene() {
  const bellLit = useMemo(() => MAT.agedBrass.clone() as MeshStandardMaterial, []);
  // Greener than the daytime grass, so it still reads as grass under the red night sky.
  const bankGrass = useMemo(() => {
    const m = MAT.grass.clone() as MeshStandardMaterial;
    m.color.set('#78c050');
    // Matte: lit by the red sky, its sheen glared orange like water.
    m.envMapIntensity = 0.1;
    m.roughnessMap = null;
    m.roughness = 1;
    return m;
  }, []);
  const bellGlow = useRef<PointLight>(null);
  useFrame(() => {
    const lit = getRun()?.flags.has('l2-beacon-bell') ?? false;
    bellLit.emissive.set(lit ? '#ffb640' : '#000000');
    bellLit.emissiveIntensity = lit ? 1.4 : 0;
    if (bellGlow.current) bellGlow.current.intensity = lit ? 40 : 0;
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
      {/* Grass on the gorge's rims, the same as the far bank, with rock cliffs below (owner, 2026-10-16:
          the flat grey rims looked like water) */}
      {([[-90, -22], [22, 90]] as const).map((x) => (
        <group key={x[0]}>
          <Slab x={x} y={[-80, -2.5]} z={[-80, 20]} material={MAT.rockGround} />
          <Slab x={x} y={[-2.5, -2]} z={[-80, 20]} material={bankGrass} />
        </group>
      ))}
      {/* The far bank the bridge reaches: a rocky cliff, a strip of trodden earth where the bridge lands,
          then grassy ground with rocky outcrops under the burning castle (owner, 2026-10-16: the
          buildings looked like they floated on water; then "nobody builds on sand") */}
      <Slab x={[-160, 160]} y={[-80, -0.6]} z={[-260, -64]} material={MAT.rockGround} />
      <Slab x={[-160, 160]} y={[-0.6, 0]} z={[-80, -64]} material={MAT.earth} />
      <Slab x={[-160, 160]} y={[-0.6, 0.02]} z={[-260, -80]} material={bankGrass} />
      {/* Rocks breaking up the line where the earth meets the grass, and round the buildings' feet */}
      {BANK_ROCKS.map(([x, z, h], i) => (
        <Prop key={i} id={i % 3 === 0 ? 'ash_rock' : 'rock_moss_set_01'} position={[x, -0.2, z]} height={h} rotationY={i * 2.1} shadows={false} />
      ))}
      {/* Belfry: a stone tower straddling the bridge, the great bell hanging inside */}
      <group position={[0, 0, bell[2]]}>
        {[-1, 1].map((s) => (
          <Box key={s} position={[s * 3.4, 5, 0]} size={[1.4, 10, 3]} material={MAT.academyStone} />
        ))}
        <Box position={[0, 10.4, 0]} size={[8.2, 1, 3.4]} material={MAT.academyStoneDark} />
        <mesh position={[0, 12.6, 0]} material={MAT.slate}>
          <coneGeometry args={[4.4, 4, 4]} />
        </mesh>
        {/* The great bronze bell in its oak yoke (AI-pipeline prop); glows gold once the beacon is lit */}
        <ModelBoundary fallback={<BellShape y={bell[1]} material={bellLit} />}>
          <Suspense fallback={<BellShape y={bell[1]} material={bellLit} />}>
            <Prop id="bronze_bell" position={[0, bell[1] - 2.3, 0]} height={3.6} />
          </Suspense>
        </ModelBoundary>
        <pointLight ref={bellGlow} position={[0, bell[1], 1.6]} color="#ffb640" intensity={0} distance={14} decay={2} />
      </group>
      {/* Fires along the roof and in the gorge below */}
      {[2, -8, -20, -30, -44, -58].map((z, i) => (
        <Fire key={z} position={[i % 2 ? 2 : -2, 4.2, z]} size={2} count={3} spread={1.5} />
      ))}
      <Fire position={[-10, -30, -30]} size={8} count={4} spread={8} smoke={false} />
      {/* On the ground, not sunk 10 m into it (owner: the castle behind the bell looked half sunken). */}
      <BurningSkyline position={[0, 0, -110]} seed={3} />
    </group>
  );
}

/** PLACEHOLDER bell shape until the bell model loads. */
function BellShape({ y, material }: { y: number; material: MeshStandardMaterial }) {
  return (
    <>
      <mesh position={[0, y, 0]} material={material} castShadow>
        <cylinderGeometry args={[0.9, 1.6, 2.2, 32, 1, true]} />
      </mesh>
      <mesh position={[0, y + 1.2, 0]} material={material}>
        <sphereGeometry args={[0.95, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
    </>
  );
}

// ---------- Great Hall ----------

export function HallScene() {
  const doorsBlown = useReached('l2-herald-enters');
  const herald = sub(HERALD_POSITION, HALL_ORIGIN);
  return (
    <group position={HALL_ORIGIN}>
      <HallDressing />
      <Slab x={[-9.5, 9.5]} y={[-0.2, 0]} z={[-48, 8]} material={MAT.paving} />
      {/* The gallery's stone, columns and windows, under a plastered barrel vault (no gap to the sky) */}
      <StoneHall half={9.5} z0={-48} z1={8} height={11} noWindowAt={[[1, -20]]} />
      {/* Long tables pushed into barricades in front of the camera */}
      {[[-4, -9, 0.3], [0.5, -10, -0.2], [4.5, -9, 0.4]].map(([x, z, r], i) => (
        <Prop key={i} id="WoodenTable_01" position={[x ?? 0, 0, z ?? 0]} rotationY={r ?? 0} height={0.85} />
      ))}
      {/* Lane doors on the west wall, each with inkfire licking round the frame */}
      {LANE_DOORS.map((d, i) => {
        const l = sub(d, HALL_ORIGIN);
        return (
          <group key={i} position={[l[0] + 0.55, 0, l[2]]}>
            {/* Carved oak door (CC0; its base sits 1.13 m below its origin at full size) */}
            <Prop id="large_castle_door" position={[0, 0.02, 0]} height={3.6} rotationY={Math.PI / 2} />
            <Fire position={[0.3, 0, 0]} size={1.4} count={3} spread={2} light={i === 1} />
          </group>
        );
      })}
      {/* East doors, blasted off their hinges by the Herald */}
      {/* Between two columns, with no window over it (owner, 2026-10-16: check the door positions) */}
      {!doorsBlown && <Prop id="large_castle_door" position={[8.9, 0.02, -20]} height={5.2} rotationY={-Math.PI / 2} />}
      {doorsBlown && <Fire position={[8.4, 0, -20]} size={2.4} count={4} spread={3} light />}
      {/* Idris's barrier and the students behind it, close enough to see when he speaks (owner: the hall
          looked empty while Idris talked and Pip said the students were safe there) */}
      <group position={[0, 0, -26]}>
        <WardBarrier width={18} height={7} />
      </group>
      {[-6, -3.5, -1, 1.5, 4, 6.5].map((x, i) => (
        <Student key={x} position={[x, 0, -28.5 - (i % 2)]} rotationY={0} height={1.3 + (i % 3) * 0.08} />
      ))}
      <Student position={[-3, 0, -24.6]} rotationY={0} robe={MAT.greenLeather} height={1.75} />
      {/* Banners along the walls, two of them burning. Each hangs between a window and a column, clear
          of the doors (owner, 2026-10-16: a door had a banner behind it). */}
      {[-30, -38, -46].map((z, i) => (
        <group key={z}>
          <Banner position={[-8.8, 5, z]} rotationY={Math.PI / 2} />
          {i !== 1 && <Fire position={[-8.6, 3.4, z]} size={1.6} count={2} spread={0.6} smoke={false} />}
        </group>
      ))}
      {[-6, -30, -38].map((z) => (
        <Banner key={z} position={[8.8, 5, z]} rotationY={-Math.PI / 2} />
      ))}
      <SceneCreature
        file="grey_herald.glb"
        position={herald}
        rotationY={-0.4}
        scale={1.5}
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

function FurnaceBoxes() {
  return (
    <>
      <Box position={[0, 3, 0]} size={[6, 6, 4]} material={MAT.academyStoneDark} />
      <mesh position={[0, 8.5, 0]} material={MAT.academyStoneDark}>
        <cylinderGeometry args={[1.2, 1.8, 5, 16]} />
      </mesh>
    </>
  );
}

export function WorkshopScene() {
  const furnace = sub(FURNACE_POSITION, WORKSHOP_ORIGIN);
  return (
    <group position={WORKSHOP_ORIGIN}>
      <WorkshopDressing />
      <Slab x={[-12, 12]} y={[-0.2, 0]} z={[-32, 8]} material={MAT.paving} />
      {/* The gallery's stone and columns, under a plaster ceiling crossed by oak beams */}
      <StoneHall half={12} z0={-32} z1={8} height={9} vault={false} bay={10} />
      {/* Cabinets, shelves and barrels along the back wall */}
      {[-9, -5.5, 5.5, 9].map((x, i) => (
        <Prop key={x} id={i % 2 ? 'wooden_display_shelves_01' : 'GothicCabinet_01'} position={[x, 0, -31.4]} height={2.6} />
      ))}
      <Prop id="wooden_barrels_01" position={[-11, 0, -28]} height={1.1} />
      <Prop id="wooden_crate_01" position={[11, 0, -28.5]} height={0.8} rotationY={0.4} />
      <Prop id="wooden_barrels_01" position={[11, 0, -5]} height={1.1} rotationY={1.2} />
      {[-8, 0, 8].map((x) => (
        <Prop key={x} id="Chandelier_01" position={[x * 0.8, 6.2, -12 - Math.abs(x)]} height={1.6} />
      ))}
      <pointLight position={[0, 6, -14]} color="#ffb070" intensity={18} distance={22} decay={1.6} />
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
          <ModelBoundary key={`s${x}${z}`} fallback={null}>
            <Suspense fallback={null}>
              {/* Copper alchemy still (AI-pipeline prop) */}
              <Prop id="copper_still" position={[x, 0, z]} height={2.8} rotationY={x < 0 ? Math.PI / 2 : -Math.PI / 2} />
            </Suspense>
          </ModelBoundary>
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
        {/* The great alchemy furnace (AI-pipeline prop; boxes until it loads) */}
        <ModelBoundary fallback={<FurnaceBoxes />}>
          <Suspense fallback={<FurnaceBoxes />}>
            <Prop id="alchemy_furnace" position={[0, 0, 0]} height={10} />
          </Suspense>
        </ModelBoundary>
        <Fire position={[0, 1.2, 2.9]} size={2} count={4} spread={1.4} kind="warm" light fromFlag="l2-beacon-furnace" />
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
    // The camera's local +Z axis is column 3 of its world matrix; it looks along −Z. Turning the group by
    // atan2(z.x, z.z) puts the group's −Z (the bow) along the camera's view. (It was turned 180° before,
    // which hid every boat, ship and ride behind the camera.)
    g.rotation.y = Math.atan2(state.camera.matrixWorld.elements[8] ?? 0, state.camera.matrixWorld.elements[10] ?? 1);
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
        <LakeDressing />
        <LakeShore />
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
        <Boathouse position={[18, 0, -50]} rotationY={-Math.PI / 2} />
        <Box position={[12, 0.3, -46]} size={[7, 0.3, 2.4]} material={MAT.lightOak} />
        {/* Lighthouse island */}
        {/* The lighthouse island: a low rocky shore ringed with boulders (was a flat polygon disc) */}
        <mesh position={[0, -0.6, -128]} material={MAT.rockGround} geometry={worldCylinder(11, 15, 1.6, 48)} receiveShadow />
        {Array.from({ length: 14 }, (_, i) => (i / 14) * Math.PI * 2).map((a, i) => (
          <Prop key={i} id={i % 2 ? 'rock_moss_set_01' : 'ash_rock'} position={[Math.cos(a) * (12 + (i % 3)), -0.6, -128 + Math.sin(a) * (12 + (i % 3))]} height={1.2 + (i % 4) * 0.5} rotationY={a * 3} />
        ))}
        <group position={[0, 0, -128]}>
          {/* Red-and-white lighthouse (AI-pipeline prop; striped cylinders until it loads) */}
          <ModelBoundary fallback={<LighthouseStripes />}>
            <Suspense fallback={<LighthouseStripes />}>
              <Prop id="lighthouse" position={[0, -0.4, 0]} height={LIGHTHOUSE_HEIGHT + 5} />
            </Suspense>
          </ModelBoundary>
          <mesh position={[0, LIGHTHOUSE_HEIGHT + 2.6, 0]} material={lamp}>
            <sphereGeometry args={[0.8, 24, 16]} />
          </mesh>
        </group>
        <LighthouseLift />
        <BurningSkyline position={[0, 0, 60]} rotationY={Math.PI} seed={4} />
      </group>
      {/* Oarsby's boat moored at the end of the jetty, then carried with the camera. The camera sits
          at the stern, so the bow and Oarsby are in view ahead (owner: "I can't tell we are on a boat"). */}
      <OnBeats beats={MOORED_BEATS}>
        <group position={[LAKE_ORIGIN[0], 0.62, LAKE_ORIGIN[2] + 20]}>
          <OarsbyBoat />
        </group>
      </OnBeats>
      <Carried beats={BOAT_BEATS} drop={0.78}>
        <OarsbyBoat />
      </Carried>
      <Carried beats={LIFT_BEATS_L2} drop={1.6}>
        <Prop id="lift_cage" position={[0, 0, 0]} height={1.35} />
      </Carried>
      {/* The lift waits at the foot of its shaft as the boat comes in, and stays at the top afterwards */}
      <OnBeats beats={LIFT_WAITING_BEATS}>
        <Prop id="lift_cage" position={[LAKE_ORIGIN[0] + LIFT_X, 0, LAKE_ORIGIN[2] + LIFT_Z]} height={1.35} />
      </OnBeats>
      <OnBeats beats={LIFT_UP_BEATS}>
        <Prop id="lift_cage" position={[LAKE_ORIGIN[0] + LIFT_X, LIGHTHOUSE_HEIGHT, LAKE_ORIGIN[2] + LIFT_Z]} height={1.35} />
      </OnBeats>
    </>
  );
}

/** The lighthouse lift's shaft stands on the island's rim, where the boat docks (lake-local). */
const LIFT_X = 11;
const LIFT_Z = -121;
const LIFT_WAITING_BEATS = ['l2-lake-seg-2', 'l2-lake-dock-island'] as const;
const LIFT_UP_BEATS = ['l2-lighthouse-beacon', 'l2-lighthouse-sweep', 'l2-lake-checkpoint', 'l2-lake-exit'] as const;

/**
 * The lighthouse lift (owner, 2026-10-16: riding the boat past the lighthouse and then flying up felt
 * weird). A brass shaft beside the tower: four rails from a small landing stage at the water to a
 * pulley house at the top, crossed by iron hoops, with a gangway across to the lantern gallery.
 */
function LighthouseLift() {
  const top = LIGHTHOUSE_HEIGHT;
  const half = 1.35;
  const hoops = Array.from({ length: Math.floor(top / 5) }, (_, i) => 3 + i * 5);
  // Gangway from the shaft to the gallery round the lamp (the tower is at the origin's (0, −128)).
  const dx = -LIFT_X;
  const dz = -128 - LIFT_Z;
  const span = Math.hypot(dx, dz) - 3;
  const yaw = Math.atan2(dx, dz);
  return (
    <group position={[LIFT_X, 0, LIFT_Z]}>
      {/* Landing stage at the water's edge */}
      <Box position={[0, -0.15, 0]} size={[3.6, 0.3, 3.6]} material={MAT.lightOak} />
      <Box position={[0, -0.15, 2.8]} size={[2.2, 0.3, 2.4]} material={MAT.lightOak} />
      {/* Four brass rails */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * half, (top + 3) / 2, sz * half]} material={MAT.agedBrass} geometry={worldCylinder(0.07, 0.09, top + 3, 10)} castShadow />
        )),
      )}
      {/* Iron hoops holding the rails, every five metres */}
      {hoops.map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]} material={MAT.darkSteel}>
          <torusGeometry args={[half * Math.SQRT2, 0.05, 6, 4]} />
        </mesh>
      ))}
      {/* Pulley house and wheel at the top */}
      <Box position={[0, top + 3.2, 0]} size={[3.2, 0.4, 3.2]} material={MAT.darkSteel} />
      <mesh position={[0, top + 3.8, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.agedBrass}>
        <torusGeometry args={[0.6, 0.08, 8, 24]} />
      </mesh>
      {/* Gangway across to the lantern gallery */}
      <group position={[0, top - 0.1, 0]} rotation={[0, yaw, 0]}>
        <Box position={[0, 0, span / 2 + 1.4]} size={[1.3, 0.2, span]} material={MAT.lightOak} />
        {[-1, 1].map((s) => (
          <Box key={s} position={[s * 0.65, 0.55, span / 2 + 1.4]} size={[0.05, 0.05, span]} material={MAT.agedBrass} />
        ))}
      </group>
    </group>
  );
}

const BOAT_LENGTH = 4.6;
/** Stern at z = +0.9 (just behind the camera), bow at z = −3.7. */
const BOAT_STERN_Z = 0.9;

/**
 * A smooth clinker rowing boat hull, lofted from cross-sections (owner: the AI boat looked shredded up
 * close). Each section is a rounded U from gunwale to keel to gunwale; the beam narrows to a sharp bow
 * and a square-ish stern. UVs are in metres so the plank texture keeps its size.
 */
/** Half the hull's width at height `y` (hull-local) at a station `t` (0 stern → 1 bow). */
function hullHalfWidth(t: number, y: number): number {
  const beam = 0.82 * Math.pow(Math.sin(Math.PI * (0.18 + t * 0.82)), 0.7) * (t > 0.85 ? 1 - (t - 0.85) * 2.2 : 1);
  const depth = 0.62 - t * 0.12;
  const sheer = 0.08 * Math.pow(t, 3) + 0.03 * (1 - t);
  const s = Math.min(1, Math.max(0, (sheer - y) / depth));
  return Math.max(0.04, beam) * Math.sqrt(Math.max(0, 1 - Math.pow(s, 2 / 1.4)));
}

/** Height of the floorboards inside the hull (hull-local), above the waterline when afloat. */
const FLOORBOARDS_Y = -0.36;

/**
 * Floorboards laid inside the hull (owner: the boat looked "full of water" because the lake showed
 * through the open hull). A flat deck following the hull's width at FLOORBOARDS_Y.
 */
function boatFloor(): BufferGeometry {
  const ALONG = 24;
  const pos: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= ALONG; i++) {
    const t = 0.02 + (i / ALONG) * 0.9;
    const z = BOAT_STERN_Z - t * BOAT_LENGTH;
    const w = hullHalfWidth(t, FLOORBOARDS_Y) * 0.98;
    pos.push(-w, FLOORBOARDS_Y, z, w, FLOORBOARDS_Y, z);
    uv.push(-w, z, w, z);
  }
  const idx: number[] = [];
  for (let i = 0; i < ALONG; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function boatHull(): BufferGeometry {
  const ALONG = 28;
  const AROUND = 18;
  const pos: number[] = [];
  const uv: number[] = [];
  for (let i = 0; i <= ALONG; i++) {
    const t = i / ALONG; // 0 stern → 1 bow
    const z = BOAT_STERN_Z - t * BOAT_LENGTH;
    const beam = 0.82 * Math.pow(Math.sin(Math.PI * (0.18 + t * 0.82)), 0.7) * (t > 0.85 ? 1 - (t - 0.85) * 2.2 : 1);
    const depth = 0.62 - t * 0.12;
    const sheer = 0.08 * Math.pow(t, 3) + 0.03 * (1 - t); // gunwale rises to the bow
    let arc = 0;
    let prev: [number, number] | null = null;
    for (let j = 0; j <= AROUND; j++) {
      const a = Math.PI * (j / AROUND); // 0 port gunwale → π starboard gunwale
      const x = -Math.cos(a) * Math.max(0.04, beam);
      const y = sheer - Math.pow(Math.sin(a), 1.4) * depth;
      if (prev) arc += Math.hypot(x - prev[0], y - prev[1]);
      prev = [x, y];
      pos.push(x, y, z);
      uv.push(arc, z);
    }
  }
  const idx: number[] = [];
  const row = AROUND + 1;
  for (let i = 0; i < ALONG; i++) {
    for (let j = 0; j < AROUND; j++) {
      const a = i * row + j;
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}


/** Oarsby's rowing boat with Oarsby at the oars and a lantern on the bow; origin at the stern seat. */
function OarsbyBoat() {
  const hull = useMemo(() => boatHull(), []);
  const floor = useMemo(() => boatFloor(), []);
  // Cloned at render time, after the photo-scanned plank texture has been attached to the shared material.
  const hullMaterial = useMemo(() => {
    const m = MAT.lightOak.clone();
    m.side = DoubleSide;
    return m;
  }, []);
  return (
    // Gunwale about 0.55 m above the water, floorboards above the waterline (owner: the boat looked
    // half sunk and full of water). Carried drops it 0.78 m below the eye.
    <group position={[0, -0.16, 0]}>
      <mesh geometry={hull} material={hullMaterial} castShadow receiveShadow />
      <mesh geometry={floor} material={hullMaterial} receiveShadow />
      {/* Gunwale rails and the transom */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.74, 0.06, BOAT_STERN_Z - BOAT_LENGTH * 0.42]} rotation={[0, side * 0.05, 0]} material={MAT.lightOak}>
          <boxGeometry args={[0.07, 0.07, BOAT_LENGTH * 0.72]} />
        </mesh>
      ))}
      {/* Thwarts (seats) */}
      {[0.1, -1.3, -2.5].map((z) => (
        <mesh key={z} position={[0, -0.18, z]} material={MAT.lightOak} castShadow>
          <boxGeometry args={[1.45, 0.06, 0.3]} />
        </mesh>
      ))}
      {/* Oars resting in their locks */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.78, 0.1, -2.45]} rotation={[0, side * 0.35, side * -0.25]}>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[side * 1.0, 0, 0]} material={MAT.lightOak}>
            <cylinderGeometry args={[0.035, 0.035, 2.6, 12]} />
          </mesh>
          <mesh position={[side * 2.25, 0, 0]} material={MAT.lightOak}>
            <boxGeometry args={[0.55, 0.03, 0.18]} />
          </mesh>
        </group>
      ))}
      {/* Oarsby at the oars, facing the stern, low on the middle thwart */}
      <Student position={[0.42, -0.2, -2.45]} rotationY={Math.PI} robe={MAT.darkOak} height={1.2} />
      {/* The bow lantern on a short post */}
      <mesh position={[0, 0.3, BOAT_STERN_Z - BOAT_LENGTH + 0.25]} material={MAT.darkOak}>
        <cylinderGeometry args={[0.025, 0.03, 0.6, 8]} />
      </mesh>
      <Prop id="wooden_lantern_01" position={[0, 0.6, BOAT_STERN_Z - BOAT_LENGTH + 0.25]} height={0.4} />
      <pointLight position={[0, 0.9, BOAT_STERN_Z - BOAT_LENGTH + 0.25]} color="#ffc070" intensity={3} distance={6} decay={2} />
    </group>
  );
}

/** Children visible only during the given beats. */
function OnBeats({ beats, children }: { beats: readonly string[]; children: React.ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const id = getRun()?.director.currentBeat?.id ?? '';
    if (group.current) group.current.visible = beats.includes(id);
  });
  return <group ref={group}>{children}</group>;
}

/** The lakeshore where the lake crossing begins: a scorched bank and a jetty out to Oarsby's boat. */
function LakeShore() {
  return (
    <>
      <Slab x={[-80, 80]} y={[-0.6, 0.35]} z={[32, 110]} material={MAT.burntGround} />
      <Box position={[-2.2, 0.3, 26.5]} size={[2.2, 0.18, 12]} material={MAT.lightOak} />
      {[21, 24.5, 28, 31.5].map((z) => [-3.3, -1.1].map((x) => <Box key={`${x}${z}`} position={[x, -0.4, z]} size={[0.2, 1.6, 0.2]} material={MAT.darkOak} />))}
      <Prop id="wooden_lantern_01" position={[-3.2, 0.4, 21.4]} height={0.5} />
      <Prop id="wooden_barrels_01" position={[-5, 0.35, 34]} height={1.1} />
      <Fire position={[14, 0.4, 40]} size={2.4} count={4} spread={3} light />
      <Fire position={[-16, 0.4, 44]} size={2} count={3} spread={2} />
    </>
  );
}

function LighthouseStripes() {
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 2 + i * 4, 0]} material={i % 2 ? MAT.burgundyLeather : MAT.plaster} castShadow>
          <cylinderGeometry args={[3.6 - i * 0.18, 3.8 - i * 0.18, 4, 32, 1, true]} />
        </mesh>
      ))}
      <mesh position={[0, LIGHTHOUSE_HEIGHT + 5, 0]} material={MAT.slate}>
        <coneGeometry args={[2.6, 3, 24]} />
      </mesh>
    </>
  );
}

// ---------- Burning library (fires over the reused Level 1 library) ----------

export function LibraryFires() {
  const L = LIBRARY_ORIGIN;
  return (
    <group position={L}>
      <LibraryWyrmPass />
      {[[-11, 2, -10], [11, 2, -14], [-11, 6.5, -20], [11, 6.5, -26], [-6, 0, -30], [8, 0, -8]].map((p, i) => (
        <Fire key={i} position={p as unknown as Vec3} size={2.2} count={3} spread={2} light={i < 2} />
      ))}
      {[1, 2, 3].map((n, i) => (
        <Fire key={n} position={[i === 1 ? 11 : -11, 1.2, i === 2 ? -22 : -16]} size={1.6} count={3} spread={2.4} untilFlag={`l2-shelf-${n}`} />
      ))}
    </group>
  );
}

/**
 * The page dragon swoops through the burning library during the glimpse (owner: "it says is that a
 * dragon made of pages, but I don't see any dragon"): it enters by the far windows on one side, sweeps
 * across the hall high above the floor with pages streaming after it, and leaves by the other side.
 */
function LibraryWyrmPass() {
  const group = useRef<Group>(null);
  useFrame((state) => {
    const g = group.current;
    const run = getRun();
    if (!g || !run) return;
    const on = run.director.currentBeat?.id === 'l2-wyrm-glimpse';
    g.visible = on;
    if (!on) return;
    const u = Math.min(1, run.beatProgress() * 1.15);
    const e = u * u * (3 - 2 * u);
    g.position.set(-13 + 26 * e, 6.4 + Math.sin(e * Math.PI) * 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.2, -27 + Math.sin(e * Math.PI) * 4);
  });
  return (
    <group ref={group} visible={false}>
      {/* Smaller indoors, side-on and flying (wingbeats), heading the way it moves (+X). */}
      <SceneCreature file="vellum_dragon.glb" position={[0, -2.5, 0]} rotationY={Math.PI / 2} scale={0.42} fromBeat="l2-lib-enter" goneFlag="l2-wyrm-defeated" fallback={<WyrmFallback />} flying={() => true} />
      <Fire position={[-1.5, 0.2, 0]} size={1.4} count={2} spread={1} smoke={false} />
    </group>
  );
}

// ---------- East Ramparts ----------

/** One round of the Warden's fight: a climber comes over the parapet, the Warden swings, it flies off. */
const FIGHT_ROUND_SEC = 4.2;
/** Where the climbers come over: on the Warden's near side, so it never hides them (rampart-local x offsets). */
const CLIMB_SIDES = [-1.8, -2.6, -1.4, -2.2] as const;

/**
 * The Warden holds the wall beside us (owner, 2026-10-16: "have the warden fight some climbers"). Hush
 * climbers keep coming over the parapet next to it; it turns, strikes with its Attack clip and sends each
 * one flying off the wall in a burst of sparks. It pauses while the inkfire covers it (until the
 * apprentice restores it) and stops once the Lantern Ward closes and the Hush are gone.
 */
function WardenHoldsTheWall({ position }: { position: Vec3 }) {
  const warden = useRef<Group>(null);
  const climber = useRef<Group>(null);
  const state = useRef<WardenState>({ rise: 1, shellOpen: 0, core: 0.3, calm: 0, attack: 0, bow: 0, strike: 0 });
  const pose = useRef<TargetPose>(emptyPose());
  const clock = useRef(0);
  const round = useRef(-1);
  const burst = useRef(false);
  const yaw = useRef(Math.PI);
  const url = creatureUrl('scribble-imp') ?? creatureUrl('blotling');
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const run = getRun();
    const w = warden.current;
    const c = climber.current;
    if (!run || !w || !c) return;
    const beat = run.director.currentBeat?.id ?? '';
    const scorched = beat === 'l2-rp-warden' && !run.flags.has('l2-warden-restored');
    const fighting = !scorched && !run.flags.has('l2-ward-closed') && run.currentAreaId === 'l2-ramparts';
    if (fighting) clock.current += dt;
    const t = clock.current % FIGHT_ROUND_SEC;
    const n = Math.floor(clock.current / FIGHT_ROUND_SEC);
    if (n !== round.current) {
      round.current = n;
      burst.current = false;
    }
    const side = CLIMB_SIDES[n % CLIMB_SIDES.length] ?? 2;
    const u = t / FIGHT_ROUND_SEC;
    // The climber: up the wall and over the parapet (0–0.25), down onto the wall walk (to 0.35), crouched
    // ready to pounce (to 0.5), then knocked flying back over the wall (0.5–0.9).
    c.visible = fighting && u < 0.9;
    pose.current.time += dt;
    pose.current.moving = u < 0.35;
    pose.current.windup = u > 0.35 && u < 0.5 ? (u - 0.35) / 0.15 : 0;
    const px = position[0] + side;
    if (u < 0.25) {
      const k = u / 0.25;
      c.position.set(px, -2.4 + k * 4.4, -3.8 + k * 0.8);
      c.rotation.set(0, 0, 0);
    } else if (u < 0.35) {
      const k = (u - 0.25) / 0.1;
      c.position.set(px, 2 * (1 - k) + Math.sin(k * Math.PI) * 0.5, -3 + k * 1.1);
    } else if (u < 0.5) {
      c.position.set(px, 0, -1.9);
    } else {
      const k = (u - 0.5) / 0.4;
      c.position.set(px + Math.sign(side) * k * 3, k * 4 - k * k * 10, -1.9 - k * 10);
      c.rotation.set(k * 9, 0, k * 6 * Math.sign(side));
    }
    if (fighting && u >= 0.5 && !burst.current) {
      burst.current = true;
      run.emitFx({ kind: 'burst', scale: 1.3, color: '#ffd27a' }, new Vector3(px + RAMPART_ORIGIN[0], 0.8 + RAMPART_ORIGIN[1], -1.9 + RAMPART_ORIGIN[2]));
    }
    // The Warden turns to face each climber and strikes as it lands on the parapet.
    const face = Math.atan2(side, -0.7);
    const turn = Math.atan2(Math.sin(face - yaw.current), Math.cos(face - yaw.current));
    yaw.current += turn * (1 - Math.exp(-5 * dt));
    w.rotation.y = yaw.current;
    state.current.strike = fighting && u > 0.3 && u < 0.62 ? (u - 0.3) / 0.32 : 0;
  });
  return (
    <>
      <group ref={warden} position={position} rotation={[0, Math.PI, 0]}>
        <WardenModel state={state} scale={1.1} />
      </group>
      <group ref={climber} visible={false} name="warden-climber" scale={1.8}>
        {url && (
          <ModelBoundary fallback={null}>
            <Suspense fallback={null}>
              <CreatureModel url={url} pose={pose} />
            </Suspense>
          </ModelBoundary>
        )}
      </group>
    </>
  );
}

export function RampartScene() {
  const warden = sub(RAMPART_WARDEN, RAMPART_ORIGIN);
  return (
    <group position={RAMPART_ORIGIN}>
      <RampartDressing />
      <Slab x={[-20, 20]} y={[-1, 0]} z={[-2.6, 6]} material={MAT.paving} />
      {/* Parapet with crenellations along the cliff edge */}
      <Slab x={[-20, 20]} y={[0, 1]} z={[-3.2, -2.6]} material={MAT.paving} />
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
      <Slab x={[-40, 40]} y={[-34, -1]} z={[-12, -3]} material={MAT.rockGround} />
      {LADDERS.map((l, i) => {
        const q = sub(l, RAMPART_ORIGIN);
        return <Fire key={i} position={[q[0], q[1] + 2, q[2] + 2.4]} size={1.4} count={3} spread={0.6} smoke={false} />;
      })}
      <mesh position={[0, -30, -120]} rotation={[-Math.PI / 2, 0, 0]} material={nightWater}>
        <planeGeometry args={[400, 220]} />
      </mesh>
      <WardenHoldsTheWall position={warden} />
      <BeaconBrazier position={sub(RAMPART_BEACON, RAMPART_ORIGIN)} flag="l2-beacon-rampart" />
      {[1, 2, 3].map((n) => (
        <Fire key={n} position={[warden[0] + (n - 2) * 0.5, 2 + n * 0.6, warden[2] + 0.3]} size={0.9} count={2} spread={0.4} smoke={false} untilFlag={`l2-warden-${n}`} />
      ))}
      <BurningSkyline position={[0, -30, 70]} rotationY={Math.PI} seed={5} />
    </group>
  );
}

// ---------- Moon Tower roof and the Vellum Wyrm ----------

/**
 * The Moon Tower roof (Level 2 finale and dawn aftermath): the tower shaft, a paved roof, a continuous
 * parapet ring crowned with merlons, and four iron braziers.
 */
function RoofBase() {
  return (
    <>
      <mesh position={[0, -30, 0]} material={MAT.academyStone} geometry={worldCylinder(9, 9.6, 60, 64)} castShadow receiveShadow />
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.paving} geometry={worldCircle(9, 64)} receiveShadow />
      {/* Parapet ring, inside and out, with a walkway lip */}
      {/* Open-ended: a capped cylinder put a solid lid over the whole roof at parapet height, sinking
          everyone on it to the chest (seen in the aftermath). */}
      <mesh position={[0, 0.55, 0]} material={MAT.academyStoneDark} geometry={worldCylinder(9.2, 9.2, 1.1, 64, true)} />
      <mesh position={[0, 0.55, 0]} material={MAT.academyStoneDark} geometry={insideCylinder(8.7, 1.1, 64)} />
      <mesh position={[0, 1.14, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.academyStone}>
        <ringGeometry args={[8.65, 9.25, 64]} />
      </mesh>
      {Array.from({ length: 28 }, (_, i) => (i / 28) * Math.PI * 2).map((a, i) => (
        <Box key={i} position={[Math.cos(a) * 8.95, 1.55, Math.sin(a) * 8.95]} size={[0.62, 0.8, 1.05]} rotation={[0, -a, 0]} material={MAT.academyStone} />
      ))}
      {[0.6, 2.2, 3.8, 5.4].map((a) => (
        <group key={a} position={[Math.cos(a) * 7.6, 0, Math.sin(a) * 7.6]}>
          <mesh position={[0, 0.5, 0]} material={MAT.darkSteel}>
            <cylinderGeometry args={[0.12, 0.2, 1, 16]} />
          </mesh>
          <mesh position={[0, 1.05, 0]} material={MAT.darkSteel}>
            <cylinderGeometry args={[0.45, 0.25, 0.3, 24, 1, true]} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function RoofScene() {
  const stand = sub(DRAGON_STAND, ROOF_ORIGIN);
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
      <RoofBase />
      {[[-6, 0, -3], [6, 0, -4], [-3, 0, 6], [5, 0, 5]].map((p, i) => (
        <Fire key={i} position={p as unknown as Vec3} size={2} count={3} spread={1.6} light={i === 0} />
      ))}
      {[-20, -40].map((y) => (
        <Fire key={y} position={[7, y, 6]} size={4} count={3} spread={3} />
      ))}
      <StaticWarden position={[7, -8, 3]} scale={1.6} rotationY={-2.4} />
      <group ref={wyrm}>
        {/* The page dragon (AI pipeline, 15 m wingspan): on all fours, wings spread, staring down at
            the apprentice, its wings always beating. */}
        <SceneCreature
          file="vellum_dragon.glb"
          position={stand}
          scale={1}
          // On the roof from the start of the climb (owner, 2026-10-16: an empty roof, then the dragon
          // suddenly appeared).
          fromBeat="l2-roof-enter"
          goneFlag="l2-wyrm-defeated"
          fallback={<WyrmFallback />}
          // Owner (2026-10-16): its wings beat whenever it is in view.
          flying={() => true}
        />
      </group>
      <BurningSkyline position={[0, -60, -90]} seed={6} />
      <BurningSkyline position={[0, -60, 90]} rotationY={Math.PI} seed={7} />
    </group>
  );
}

// ---------- Aftermath: the observatory at dawn ----------

/**
 * Dawn after the siege (owner: the aftermath was a bare disc in a pale void): on the Moon Tower roof
 * where the Wyrm fell, the fires out, Keeper Orin and Mira gathered round the Quill shard on a marble
 * column. The shard is a red crystal cluster with a soft glow and a shaft of light.
 */
export function AftermathScene() {
  const shard = useRef<Group>(null);
  useFrame((state) => {
    if (shard.current) shard.current.rotation.y = state.clock.elapsedTime * 0.5;
  });
  const glow = useMemo(() => glowTexture(), []);
  return (
    <group position={AFTERMATH_ORIGIN}>
      <RoofBase />
      <AftermathDressing />
      {/* Marble column */}
      <mesh position={[0, 0.5, 0]} material={MAT.marble} geometry={worldCylinder(0.32, 0.38, 1, 32)} castShadow />
      <mesh position={[0, 1.04, 0]} material={MAT.marble} geometry={worldCylinder(0.48, 0.36, 0.1, 32)} />
      <mesh position={[0, 0.04, 0]} material={MAT.marble} geometry={worldCylinder(0.55, 0.6, 0.08, 32)} />
      {/* The Quill shard: a cluster of red crystal points, glowing */}
      <group ref={shard} position={[0, 1.12, 0]}>
        {([[0, 0, 0, 0.34, 0], [0.07, 0, 0.04, 0.2, 0.5], [-0.06, 0, -0.05, 0.24, -0.45]] as const).map(([x, y, z, h, tilt], i) => (
          <mesh key={i} position={[x, y + h / 2, z]} rotation={[tilt * 0.6, i, tilt]} material={SHARD_MAT}>
            <cylinderGeometry args={[0, 0.05 + h * 0.12, h, 6]} />
          </mesh>
        ))}
        <sprite position={[0, 0.18, 0]} scale={1.1}>
          <spriteMaterial map={glow} color="#ff4a20" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      </group>
      <group position={[0, 1.1, 0]}>
        <LightBeam height={6} width={0.7} color="#ff6a3a" intensity={0.5} />
      </group>
      <pointLight position={[0, 1.5, 0]} color="#ff4a20" intensity={3} distance={5} decay={2} />
      <KeeperOrin position={[1.4, 0, -1.2]} rotationY={-0.6} />
      <Mira position={[-1.6, 0, -0.8]} rotationY={0.7} />
      <StaticWarden position={[4, 0, -5]} scale={1} rotationY={-0.5} />
    </group>
  );
}
