/** PLACEHOLDER Moon Tower ascent (§14A.24): three round floors, warm below, moonlit above. */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BackSide, Path, Shape, ShapeGeometry, Vector3, type Group } from 'three';
import { LIFT_BEATS, LIFT_SHAFT, TOWER_FLOOR_HEIGHT, TOWER_ORIGIN } from '../../level/areas/moonTower';
import { getRun } from '../../state/gameStore';
import { KitModel, Portrait, WallLamp, WindowPane } from '../kit';
import { Prop } from '../Prop';
import { MAT } from '../materials';
import { worldCircle, worldCylinder } from '../surfaces';

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
      <mesh position={[0, 4.5, 0]} material={towerWallMaterial()} geometry={worldCylinder(R, R, 9, 48, true)} receiveShadow />
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.darkOak} geometry={shaftDisc(1)} />
      <mesh position={[LIFT_SHAFT.x, 9.5, LIFT_SHAFT.z]} material={MAT.agedBrass}>
        <cylinderGeometry args={[LIFT_SHAFT.radius, LIFT_SHAFT.radius, 1, 32, 1, true]} />
      </mesh>
      {[0.6, 1.6, 2.6, 3.6, 4.6].map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <WindowPane position={[R - 0.02, 4.5, 0]} rotationY={-Math.PI / 2} size={[0.8, 3.4]} night={floor > 0} />
          <WallLamp position={[R - 0.05, 3, 1.2]} rotationY={-Math.PI / 2} />
        </group>
      ))}
      {/* Hanging celestial instruments */}
      <group position={[0, 6.5, -2]}>
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
      <pointLight position={[0, 6, 0]} color={light} intensity={22} distance={18} decay={2} />
    </group>
  );
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
  const y = 2 * TOWER_FLOOR_HEIGHT;
  return (
    <group position={[0, y, -8.6]}>
      <group ref={left} position={[-1.2, 0, 0]}>
        <KitModel id="door_leaf" position={[0, 0, 0.06]} />
      </group>
      <group ref={right} position={[1.2, 0, 0]}>
        {/* Mirrored leaf: hinge on the right */}
        <KitModel id="door_leaf" position={[0, 0, 0.06]} scale={[-1, 1, 1]} />
      </group>
      <mesh position={[0, 3.6, 0.1]} material={MAT.agedBrass}>
        <torusGeometry args={[0.5, 0.05, 8, 32]} />
      </mesh>
      <mesh position={[0, 1.6, -0.3]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshBasicMaterial color="#9fbcff" />
      </mesh>
    </group>
  );
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
 * PLACEHOLDER runaway lift (LD-0): a brass platform with a railing that carries the camera (no cables:
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
    <group ref={lift} visible={false}>
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
