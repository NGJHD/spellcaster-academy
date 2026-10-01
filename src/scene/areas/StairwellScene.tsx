/** PLACEHOLDER Lower Stairwell (§14A.22): broad spiral around a central column. */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, type Group } from 'three';
import { STAIRWELL_ORIGIN, STAIR_GUARDS, stairFloor } from '../../level/areas/stairwell';
import { getRun } from '../../state/gameStore';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import { Guardian } from '../../enemies/GuardianGLB';
import { WallLamp } from '../kit';
import { MAT } from '../materials';
import { DormantTarget } from '../props';

const R = 6;
const TOP = 19;

const polar = (deg: number, y: number, r = R): [number, number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.cos(a), y, r * Math.sin(a)];
};

export function StairwellScene() {
  const steps = useMemo(() => {
    // Descend 4 m per 80° from 60° above landing 1 to below the bottom.
    const out: { deg: number; y: number }[] = [];
    for (let deg = 60; deg >= -290; deg -= 6) {
      out.push({ deg, y: stairFloor(deg) });
    }
    return out;
  }, []);

  return (
    <group name="stairwell" position={STAIRWELL_ORIGIN}>
      <mesh position={[0, TOP / 2 - 1, 0]} material={MAT.academyStone} castShadow receiveShadow>
        <cylinderGeometry args={[2.4, 2.6, TOP + 2, 32]} />
      </mesh>
      <mesh position={[0, TOP / 2 - 1, 0]}>
        <cylinderGeometry args={[9.4, 9.4, TOP + 2, 48, 1, true]} />
        <meshStandardMaterial attach="material" color="#c6ab86" roughness={0.9} side={BackSide} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.paving}>
        <circleGeometry args={[9.4, 48]} />
      </mesh>
      {steps.map((s, i) => {
        const [x, , z] = polar(s.deg, 0, 6);
        return (
          <mesh key={i} position={[x, s.y - 0.15, z]} rotation={[0, -(s.deg * Math.PI) / 180, 0]} material={i % 2 ? MAT.academyStone : MAT.academyStoneDark} castShadow receiveShadow>
            <boxGeometry args={[6.6, 0.3, 0.75]} />
          </mesh>
        );
      })}
      {/* Brass handrail along the outer edge */}
      {steps.filter((_, i) => i % 3 === 0).map((s, i) => {
        const [x, , z] = polar(s.deg, 0, 8.9);
        return (
          <mesh key={`rail${i}`} position={[x, s.y + 0.5, z]} material={MAT.agedBrass}>
            <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
          </mesh>
        );
      })}
      {/* Tall slit windows and lamps cooling toward the tower */}
      {[30, -60, -150, -240].map((deg, i) => {
        const [x, , z] = polar(deg, 0, 9.35);
        return (
          <group key={deg}>
            <mesh position={[x, 13 - i * 3.5, z]} rotation={[0, -((deg * Math.PI) / 180) - Math.PI / 2, 0]} material={MAT.windowGlow}>
              <planeGeometry args={[0.7, 3]} />
            </mesh>
            <WallLamp position={[x * 0.97, 11.5 - i * 3.5, z * 0.97]} rotationY={-((deg * Math.PI) / 180) - Math.PI / 2} />
            <pointLight position={[x * 0.7, 12 - i * 3.5, z * 0.7]} color={i < 2 ? '#ffc98a' : '#c9d8ff'} intensity={9} distance={11} decay={2} />
          </group>
        );
      })}
      {STAIR_GUARDS.slice(0, 2).map((g, i) => (
        <CommandedGuard key={g.id} deg={g.deg} floor={g.floor} flag={`stair-guard-${i + 1}-calm`} />
      ))}
      <DormantTarget
        encounterId="stair-3-guard"
        targetId="stair-guard-3-awake"
        kind="guardian"
        position={polar(STAIR_GUARDS[2].deg, STAIR_GUARDS[2].floor)}
        rotationY={-((STAIR_GUARDS[2].deg * Math.PI) / 180) + Math.PI}
      />
      {STAIR_GUARDS.map((g) => {
        const [x, , z] = polar(g.deg, 0, 6);
        return (
          <mesh key={`circle-${g.id}`} position={[x, g.floor + 0.02, z]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.wardGold}>
            <ringGeometry args={[0.9, 1.0, 40]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Guardians 1 and 2: step aside and bow once their command word is typed. */
function CommandedGuard({ deg, floor, flag }: { deg: number; floor: number; flag: string }) {
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const aside = useRef(0);
  useFrame((state, dt) => {
    pose.current.time += dt;
    const calm = getRun()?.flags.has(flag) ?? false;
    aside.current += ((calm ? 1 : 0) - aside.current) * (1 - Math.exp(-1.2 * Math.min(dt, 0.1)));
    pose.current.defeated = calm;
    pose.current.dispel = aside.current;
    const g = group.current;
    if (!g) return;
    const [x, , z] = polar(deg, floor, R + aside.current * 2.2);
    g.position.set(x, floor, z);
    const cx = state.camera.position.x - STAIRWELL_ORIGIN[0] - x;
    const cz = state.camera.position.z - STAIRWELL_ORIGIN[2] - z;
    g.rotation.y = Math.atan2(cx, cz);
  });
  return (
    <group ref={group}>
      <Guardian pose={pose} />
    </group>
  );
}
