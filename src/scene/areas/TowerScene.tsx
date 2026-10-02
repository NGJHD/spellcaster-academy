/** PLACEHOLDER Moon Tower ascent (§14A.24): three round floors, warm below, moonlit above. */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BackSide, type Group } from 'three';
import { TOWER_FLOOR_HEIGHT, TOWER_ORIGIN } from '../../level/areas/moonTower';
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
import { DormantTarget } from '../props';

const R = 9;
const FLOOR_LIGHT = ['#ffc98a', '#d9d4ff', '#a9c4ff'] as const;

export function TowerScene() {
  return (
    <group name="tower" position={TOWER_ORIGIN}>
      {[0, 1, 2].map((f) => (
        <Floor key={f} floor={f} />
      ))}
      <DormantTarget
        encounterId="tower-t3"
        targetId="tower-guardian"
        kind="guardian"
        position={[0, 2 * TOWER_FLOOR_HEIGHT, -4.5]}
      />
      <Door />
    </group>
  );
}

function Floor({ floor }: { floor: number }) {
  const y = floor * TOWER_FLOOR_HEIGHT;
  const light = FLOOR_LIGHT[floor] ?? '#ffc98a';
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor === 2 ? MAT.paving : MAT.lightOak} geometry={worldCircle(R, 48)} receiveShadow />
      <mesh position={[0, 4.5, 0]} material={towerWallMaterial()} geometry={worldCylinder(R, R, 9, 48, true)} receiveShadow />
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.darkOak}>
        <circleGeometry args={[R, 48]} />
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
      <Prop id="lantern_chandelier_01" position={[0, 8.6, 2]} height={1.6} shadows={false} />
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
