/** PLACEHOLDER Moon Tower ascent: three round floors, warm below, moonlit above. */
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { BackSide, Box3, CylinderGeometry, Path, Shape, ShapeGeometry, Vector3, type Group, type Object3D } from 'three';
import { useGLTF } from '@react-three/drei';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { propUrl } from '../Prop';
import { LIFT_BEATS, LIFT_SHAFT, TOWER_FLOOR_HEIGHT, TOWER_ORIGIN } from '../../level/areas/moonTower';
import { getRun } from '../../state/gameStore';
import { Box, KitModel, Portrait, WallLamp, WindowPane } from '../kit';
import { Prop } from '../Prop';
import { MAT } from '../materials';
import { scaleUv, worldCircle, worldCylinder } from '../surfaces';
import { PoolLight } from '../LightPool';

/** Inside face of the round tower wall (same textured stone, rendered from within). */
let towerWall: import('three').MeshStandardMaterial | null = null;
function towerWallMaterial() {
  if (!towerWall) {
    towerWall = MAT.academyStone.clone();
    towerWall.side = BackSide;
  }
  return towerWall;
}

const R = 9;
const FLOOR_LIGHT = ['#ffc98a', '#d9d4ff', '#a9c4ff'] as const;

export function TowerScene() {
  return (
    <group name="tower" position={TOWER_ORIGIN}>
      {[0, 1, 2].map((f) => (
        <Floor key={f} floor={f} />
      ))}
      <Door />
      <Lift />
    </group>
  );
}

function Floor({ floor }: { floor: number }) {
  const y = floor * TOWER_FLOOR_HEIGHT;
  const light = FLOOR_LIGHT[floor] ?? '#ffc98a';
  return (
    <group position={[0, y, 0]}>
      {/* Floors above the ground and every ceiling have the lift shaft cut through them. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor === 2 ? MAT.paving : MAT.lightOak} geometry={floor === 0 ? worldCircle(R, 48) : shaftDisc(-1)} receiveShadow />
      {/* The top floor's wall has a gap behind the observatory door, so the passage leads somewhere
          (owner: "there is a wall behind the door"). */}
      <mesh position={[0, 4.5, 0]} material={towerWallMaterial()} geometry={floor === 2 ? doorWall() : worldCylinder(R, R, 9, 48, true)} receiveShadow />
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.darkOak} geometry={shaftDisc(1)} />
      <mesh position={[LIFT_SHAFT.x, 9.5, LIFT_SHAFT.z]} material={MAT.agedBrass}>
        <cylinderGeometry args={[LIFT_SHAFT.radius, LIFT_SHAFT.radius, 1, 32, 1, true]} />
      </mesh>
      {/* The top floor has the observatory door where the 1.6 window would be (owner: a window showed
          through the open door). */}
      {[0.6, 1.6, 2.6, 3.6, 4.6].filter((a) => !(floor === 2 && a === 1.6)).map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <WindowPane position={[R - 0.02, 4.5, 0]} rotationY={-Math.PI / 2} size={[0.8, 3.4]} night={floor > 0} />
          <WallLamp position={[R - 0.05, 3, 1.2]} rotationY={-Math.PI / 2} />
        </group>
      ))}
      {/* Hanging celestial instruments (off to the side on the top floor, clear of the door view) */}
      <group name="celestial-rings" position={floor === 2 ? [4, 7, 1] : [0, 6.5, -2]}>
        <mesh material={MAT.agedBrass}>
          <torusGeometry args={[1.2, 0.03, 8, 48]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
          <torusGeometry args={[0.9, 0.03, 8, 48]} />
        </mesh>
        <mesh material={MAT.wardBlue}>
          <sphereGeometry args={[0.18, 16, 12]} />
        </mesh>
      </group>
      {/* Star maps */}
      {[-2.2, 2.2].map((a, i) => (
        <group key={a} rotation={[0, a, 0]}>
          <Portrait position={[0, 3, -R + 0.25]} size={[1.6, 1.1]} painting={`star_chart_${(i + floor) % 2}`} />
        </group>
      ))}
      {floor === 0 &&
        [-4.5, 4.5].map((x) => (
          <group key={x} position={[x, 0, 1.5]}>
            <KitModel id="planter_stone" />
            <Prop id="fern_02" position={[0, 0.7, 0]} height={0.8} rotationY={x} />
          </group>
        ))}
      {/* Hung off-centre so its chain never splits the lift-camera view. */}
      <Prop id="lantern_chandelier_01" position={[-3, 8.6, 0.5]} height={1.6} shadows={false} />
      {floor === 1 && <Prop id="vintage_grandfather_clock_01" position={[-6.5, 0, -5]} height={2.2} rotationY={0.9} />}
      {floor === 2 && <Prop id="brass_candleholders" position={[3, 0, -6.8]} height={0.9} />}
      <PoolLight position={[0, 6, 0]} color={light} intensity={22} distance={18} decay={2} />
    </group>
  );
}

/**
 * The observatory door: the studded `large_castle_door` model (owner: the plank leaves didn't read as a
 * door), whose two leaves are separate nodes, so they swing open when the stone guard is calmed.
 */
const DOOR_HEIGHT = 3.4;
function CastleDoorOpening() {
  const { scene } = useGLTF(propUrl('large_castle_door'));
  const { object, scale, leaves } = useMemo(() => {
    const clone = scene.clone(true);
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const found: { node: Object3D; base: number; dir: number }[] = [];
    clone.traverse((o) => {
      if (/door_left$/.test(o.name)) found.push({ node: o, base: o.rotation.y, dir: -1 });
      if (/door_right$/.test(o.name)) found.push({ node: o, base: o.rotation.y, dir: 1 });
    });
    return { object: clone, scale: DOOR_HEIGHT / Math.max(size.y, 1e-3), leaves: found };
  }, [scene]);
  const amount = useRef(0);
  useFrame((_, dt) => {
    const open = getRun()?.flags.has('tower-door-open') ?? false;
    amount.current += ((open ? 1 : 0) - amount.current) * (1 - Math.exp(-1.4 * Math.min(dt, 0.1)));
    // Each leaf hinges at its outer edge; they swing in towards the room (+Z).
    for (const l of leaves) l.node.rotation.y = l.base + l.dir * 1.3 * amount.current;
  });
  return <primitive object={object} scale={scale} position={[0.045 * scale, 0.02, 0.12]} />;
}

function Door() {
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  useFrame((_, dt) => {
    const open = getRun()?.flags.has('tower-door-open') ?? false;
    const k = 1 - Math.exp(-1.4 * Math.min(dt, 0.1));
    if (left.current) left.current.rotation.y += ((open ? -1.4 : 0) - left.current.rotation.y) * k;
    if (right.current) right.current.rotation.y += ((open ? 1.4 : 0) - right.current.rotation.y) * k;
  });
  // The old plank leaves, kept only as the stand-in while the castle door loads.
  const plankLeaves = (
    <>
      <group ref={left} position={[-1.2, 0, 0]}>
        <KitModel id="door_leaf" position={[0, 0, 0.06]} />
      </group>
      <group ref={right} position={[1.2, 0, 0]}>
        <KitModel id="door_leaf" position={[0, 0, 0.06]} scale={[-1, 1, 1]} />
      </group>
    </>
  );
  const y = 2 * TOWER_FLOOR_HEIGHT;
  // Owner (2026-10-08): the open door showed a window, then a wall. It now opens onto a stone passage
  // through a gap in the tower wall, with stairs climbing to a moonlit arch (the way to the observatory).
  return (
    // On the wall line (the round wall is at z ≈ −8.8 at the doorway's edges), so nothing sticks out.
    <group position={[0, y, -8.75]}>
      <ModelBoundary fallback={plankLeaves}>
        <Suspense fallback={plankLeaves}>
          <CastleDoorOpening />
        </Suspense>
      </ModelBoundary>

      {/* Jambs, lintel and passage in the tower wall's own stone, set just behind the wall surface so the
          wall runs right up to the door (owner: no lighter bricks around the door) */}
      {/* The castle door is 2.29 m wide by 3.36 m to the top of its frame: the jambs close in on its frame
          (owner: there were gaps between the wall and the door) and reach out to the wall's gap (±1.8). */}
      {[-1, 1].map((s) => (
        <Box key={s} position={[s * 1.49, 3, -4.4]} size={[0.7, 6.4, 8.6]} material={MAT.academyStone} />
      ))}
      <Box position={[0, 6.17, -0.35]} size={[3.6, 5.66, 0.4]} material={MAT.academyStone} />
      {/* Wall stone filling the corners above the door's arched frame (dark gaps showed there) */}
      <mesh position={[0, 0, 0.06]} geometry={archSpandrels()} material={MAT.academyStone} />
      <Box position={[0, 6.3, -4.4]} size={[3.6, 0.4, 8.6]} material={MAT.academyStone} />
      {/* Stairs climbing away from the door */}
      {/* Stairs that read as stairs (owner: they looked like more wall): dark stone risers, oak treads with
          a rounded nose, and a red runner up the middle */}
      {Array.from({ length: 11 }, (_, i) => {
        const top = 0.25 * (i + 1);
        const z = -0.6 - i * 0.62;
        return (
          <group key={i}>
            <Box position={[0, top / 2 - 0.03, z]} size={[2.6, top - 0.06, 0.62]} material={MAT.academyStoneDark} shadows={false} />
            <Box position={[0, top - 0.03, z + 0.02]} size={[2.6, 0.06, 0.66]} material={MAT.lightOak} shadows={false} />
            <mesh position={[0, top - 0.03, z + 0.35]} rotation={[0, 0, Math.PI / 2]} material={MAT.darkOak}>
              <cylinderGeometry args={[0.04, 0.04, 2.6, 10]} />
            </mesh>
            <Box position={[0, top + 0.005, z + 0.02]} size={[1.2, 0.012, 0.66]} material={MAT.burgundyLeather} shadows={false} />
          </group>
        );
      })}
      {/* The top landing and a moonlit arch onto the observatory roof */}
      <Box position={[0, 2.75, -7.9]} size={[2.6, 0.2, 0.8]} material={MAT.academyStone} />
      <mesh position={[0, 4.4, -8.45]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshBasicMaterial color="#9fb8ff" />
      </mesh>
      <Box position={[0, 3, -8.6]} size={[3.4, 6, 0.2]} material={MAT.academyStone} />
      <PoolLight position={[0, 4.4, -7.4]} color="#a9c4ff" intensity={10} distance={8} decay={2} />
      <PoolLight position={[0, 2.2, -2]} color="#a9c4ff" intensity={4} distance={6} decay={2} />
    </group>
  );
}

/** A 2.36 m × 1.2 m panel above the door's springing line with an arch cut out of it (metre UVs). */
let spandrelGeometry: ShapeGeometry | null = null;
function archSpandrels(): ShapeGeometry {
  if (!spandrelGeometry) {
    const shape = new Shape();
    shape.moveTo(-1.18, 2.2);
    shape.lineTo(1.18, 2.2);
    shape.lineTo(1.18, 3.4);
    shape.lineTo(-1.18, 3.4);
    shape.lineTo(-1.18, 2.2);
    const hole = new Path();
    hole.absellipse(0, 2.2, 1.06, 1.08, 0, Math.PI, false);
    shape.holes.push(hole);
    spandrelGeometry = new ShapeGeometry(shape, 24);
  }
  return spandrelGeometry;
}

/** The top floor's round wall with an opening behind the observatory door (CylinderGeometry θ = π is −Z). */
let doorWallGeometry: CylinderGeometry | null = null;
function doorWall(): CylinderGeometry {
  if (!doorWallGeometry) {
    const half = Math.asin(1.8 / R);
    const arc = Math.PI * 2 - half * 2;
    doorWallGeometry = new CylinderGeometry(R, R, 9, 48, 1, true, Math.PI + half, arc);
    // Metre UVs like every other wall (without this the stone was stretched once round the tower: blurry).
    scaleUv(doorWallGeometry, arc * R, 9);
  }
  return doorWallGeometry;
}

/**
 * A floor or ceiling disc with the lift shaft cut out. `flip` matches the mesh rotation (−1 for a
 * floor rotated −90° about X, +1 for a ceiling rotated +90°), so the hole lands at the shaft's z.
 */
const shaftDiscs = new Map<number, ShapeGeometry>();
function shaftDisc(flip: -1 | 1): ShapeGeometry {
  const cached = shaftDiscs.get(flip);
  if (cached) return cached;
  const shape = new Shape();
  shape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new Path();
  hole.absarc(LIFT_SHAFT.x, flip * LIFT_SHAFT.z, LIFT_SHAFT.radius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new ShapeGeometry(shape, 48);
  shaftDiscs.set(flip, geometry);
  return geometry;
}

const liftOffset = new Vector3();

/**
 * PLACEHOLDER runaway lift: a brass platform with a railing that carries the camera (no cables:
 * one passed right in front of the camera and split the view, Chrome playtest 2026-10-07)
 * up the shaft. Rides under the camera while the lift beats play.
 */
function Lift() {
  const lift = useRef<Group>(null);
  useFrame((state) => {
    const g = lift.current;
    const run = getRun();
    if (!g || !run) return;
    const id = run.director.currentBeat?.id ?? '';
    g.visible = (LIFT_BEATS as readonly string[]).includes(id);
    if (!g.visible) return;
    const cam = state.camera;
    // The cage stays level under the rider; it follows the camera's height through the shaft.
    liftOffset.set(LIFT_SHAFT.x, cam.position.y - TOWER_ORIGIN[1] - 1.6, LIFT_SHAFT.z);
    g.position.copy(liftOffset);
    g.rotation.z = Math.sin(state.clock.elapsedTime * 9) * 0.006;
  });
  return (
    <group name="lift-cage" ref={lift} visible={false}>
      <mesh position={[0, -0.06, 0]} material={MAT.agedBrass} castShadow receiveShadow>
        <cylinderGeometry args={[1.25, 1.25, 0.12, 40]} />
      </mesh>
      <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
        <torusGeometry args={[1.22, 0.035, 8, 48]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <group key={i} rotation={[0, (i / 6) * Math.PI * 2 + 0.5, 0]}>
          <mesh position={[1.22, 0.5, 0]} material={MAT.agedBrass}>
            <cylinderGeometry args={[0.03, 0.03, 1.0, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
