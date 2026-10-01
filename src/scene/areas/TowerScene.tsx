/** PLACEHOLDER Moon Tower ascent (§14A.24): three round floors, warm below, moonlit above. */
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { BackSide, type Group } from 'three';
import { TOWER_FLOOR_HEIGHT, TOWER_ORIGIN } from '../../level/areas/moonTower';
import { getRun } from '../../state/gameStore';
import { Box, Shrub, WallLamp } from '../kit';
import { MAT } from '../materials';
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={floor === 2 ? MAT.paving : MAT.lightOak} receiveShadow>
        <circleGeometry args={[R, 48]} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <cylinderGeometry args={[R, R, 9, 48, 1, true]} />
        <meshStandardMaterial color="#c4a982" roughness={0.9} side={BackSide} />
      </mesh>
      <mesh position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.darkOak}>
        <circleGeometry args={[R, 48]} />
      </mesh>
      {[0.6, 1.6, 2.6, 3.6, 4.6].map((a, i) => (
        <group key={i} rotation={[0, a, 0]}>
          <mesh position={[R - 0.02, 4.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={floor === 0 ? MAT.windowGlow : MAT.crystal}>
            <planeGeometry args={[0.8, 3.4]} />
          </mesh>
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
      {[-2.2, 2.2].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <mesh position={[0, 3, -R + 0.05]}>
            <planeGeometry args={[2, 1.4]} />
            <meshStandardMaterial color="#1d2a4a" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {floor === 0 &&
        [-4.5, 4.5].map((x) => (
          <group key={x} position={[x, 0, 1.5]}>
            <Box position={[0, 0.35, 0]} size={[1.6, 0.7, 1.0]} material={MAT.academyStoneDark} />
            <Shrub position={[0, 0.6, 0]} size={0.8} seed={x + 3} material={MAT.moss} />
          </group>
        ))}
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
        <Box position={[0.6, 1.6, 0]} size={[1.2, 3.2, 0.15]} material={MAT.darkOak} />
      </group>
      <group ref={right} position={[1.2, 0, 0]}>
        <Box position={[-0.6, 1.6, 0]} size={[1.2, 3.2, 0.15]} material={MAT.darkOak} />
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
