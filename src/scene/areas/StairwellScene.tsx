/** PLACEHOLDER Lower Stairwell (§14A.22): broad spiral around a central column. */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three';
import { STAIRWELL_ORIGIN, STAIR_GUARDS, stairFloor } from '../../level/areas/stairwell';
import { getRun } from '../../state/gameStore';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import { Guardian } from '../../enemies/GuardianGLB';
import { WallLamp, WindowPane } from '../kit';
import { MergeStatic } from '../MergeStatic';
import { insideCylinder, worldBox, worldCircle, worldCylinder } from '../surfaces';
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
      <MergeStatic>
        {/* Newel column and the round outer wall (dressed stone inside) */}
        <mesh position={[0, TOP / 2 - 1, 0]} material={MAT.academyStone} geometry={worldCylinder(2.4, 2.6, TOP + 2, 40)} castShadow receiveShadow />
        <mesh position={[0, TOP / 2 - 1, 0]} material={MAT.academyStone} geometry={insideCylinder(9.4, TOP + 2, 64)} receiveShadow />
        <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.paving} geometry={worldCircle(9.4, 48)} receiveShadow />
        {/* Stone treads with a rounded nosing on each */}
        {steps.map((s, i) => {
          const [x, , z] = polar(s.deg, 0, 6);
          return (
            <group key={i} position={[x, s.y - 0.15, z]} rotation={[0, -(s.deg * Math.PI) / 180, 0]}>
              <mesh material={MAT.academyStoneDark} geometry={worldBox(6.6, 0.3, 0.75)} castShadow receiveShadow />
              <mesh position={[0, 0.12, 0.38]} rotation={[0, 0, Math.PI / 2]} material={MAT.academyStoneDark} geometry={worldCylinder(0.05, 0.05, 6.6, 8)} />
            </group>
          );
        })}
        {/* Brass newel posts on the outer side */}
        {steps.filter((_, i) => i % 4 === 0).map((s, i) => {
          const [x, , z] = polar(s.deg, 0, 8.9);
          return (
            <mesh key={`post${i}`} position={[x, s.y + 0.5, z]} material={MAT.agedBrass}>
              <cylinderGeometry args={[0.025, 0.035, 1.0, 10]} />
            </mesh>
          );
        })}
      </MergeStatic>
      <Handrail steps={steps} />
      {/* Tall slit windows and lamps cooling toward the tower */}
      {[30, -60, -150, -240].map((deg, i) => {
        const [x, , z] = polar(deg, 0, 9.35);
        return (
          <group key={deg}>
            <WindowPane position={[x * 0.995, 13 - i * 3.5, z * 0.995]} size={[0.7, 3]} rotationY={-((deg * Math.PI) / 180) - Math.PI / 2} />
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

/** A continuous brass handrail following the spiral, one metre above the treads. */
function Handrail({ steps }: { steps: readonly { deg: number; y: number }[] }) {
  const geometry = useMemo(() => {
    const pts = steps.map((s) => new Vector3(...polar(s.deg, s.y + 1.0, 8.9)));
    return new TubeGeometry(new CatmullRomCurve3(pts), pts.length * 4, 0.035, 8, false);
  }, [steps]);
  return <mesh geometry={geometry} material={MAT.agedBrass} castShadow />;
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
