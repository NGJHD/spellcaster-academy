/** PLACEHOLDER Lower Stairwell (§14A.22): broad spiral around a central column. */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three';
import { GUARD_BLOCK_RADIUS, SLIDE_BEATS, STAIRWELL_ORIGIN, STAIR_GUARDS, stairFloor } from '../../level/areas/stairwell';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import { Guardian } from '../../enemies/GuardianGLB';
import { WallLamp, WindowPane } from '../kit';
import { MergeStatic } from '../MergeStatic';
import { insideCylinder, worldBox, worldCircle, worldCylinder } from '../surfaces';
import { MAT } from '../materials';

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
        <CommandedGuard key={g.id} deg={g.deg} floor={g.floor} flag={`stair-guard-${i + 1}-calm`} slideBeat={SLIDE_BEATS[i] ?? ''} />
      ))}
      <ReassemblingGuard />
      <TeaTray />
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

/**
 * Guardians 1 and 2 step out into the tray's path. Commanded in time, they step aside and bow; if the
 * word is not finished, they leap aside at the last moment anyway (LD-0: never a fail).
 */
function CommandedGuard({ deg, floor, flag, slideBeat }: { deg: number; floor: number; flag: string; slideBeat: string }) {
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const aside = useRef(0);
  const slideIndex = beatIndexOf(slideBeat);
  useFrame((state, dt) => {
    pose.current.time += dt;
    const run = getRun();
    const beat = run?.director.currentIndex ?? -1;
    const commanded = run?.flags.has(flag) ?? false;
    const lastMoment = beat > slideIndex || (beat === slideIndex && (run?.beatProgress() ?? 0) > 0.86);
    const clear = commanded || lastMoment;
    aside.current += ((clear ? 1 : 0) - aside.current) * (1 - Math.exp(-(commanded ? 2 : 6) * Math.min(dt, 0.1)));
    pose.current.defeated = commanded;
    pose.current.dispel = commanded ? aside.current : 0;
    const g = group.current;
    if (!g) return;
    // Leap inward towards the column, clear of the banister, with a little hop.
    const a = aside.current;
    const [x, , z] = polar(deg, floor, GUARD_BLOCK_RADIUS - a * 3.1);
    g.position.set(x, floor + Math.sin(a * Math.PI) * (commanded ? 0.1 : 0.6), z);
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

const REASSEMBLE_BEAT = 'stairwell-reassemble';

/**
 * Guardian 3 stands on the last landing; when the tray arrives it bursts apart into armour pieces and
 * re-assembles (LD-0) before the short fight. Hidden while the live fight target exists.
 */
function ReassemblingGuard() {
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const g3 = STAIR_GUARDS[2];
  useFrame((_, dt) => {
    pose.current.time += dt;
    const g = group.current;
    const run = getRun();
    if (!g || !run) return;
    const done = run.progress.completedEncounterIds.includes('stair-3-guard');
    const live = run.findTarget('stair-guard-3-awake') !== undefined || run.isRetired('stair-guard-3-awake');
    const beatId = run.director.currentBeat?.id;
    const p = beatId === REASSEMBLE_BEAT ? run.beatProgress() : -1;
    // Apart from the burst until the pieces fly back together.
    const apart = p > 0.02 && p < 0.6;
    g.visible = !done && !live && !apart;
    const grow = p >= 0.6 ? Math.min(1, (p - 0.6) / 0.15) : 1;
    g.scale.setScalar(0.6 + 0.4 * grow);
  });
  const [x, y, z] = polar(g3.deg, g3.floor);
  return (
    <group ref={group} position={[x, y, z]} rotation={[0, -((g3.deg * Math.PI) / 180) + Math.PI, 0]}>
      <Guardian pose={pose} />
    </group>
  );
}

/**
 * PLACEHOLDER tea tray (LD-0 Banister Slide): a polished silver tray under the camera while sliding,
 * banking into the curve. Replaceable with the first-person hands-on-rim GLB.
 */
function TeaTray() {
  const tray = useRef<Group>(null);
  const offset = useMemo(() => new Vector3(), []);
  useFrame((state) => {
    const g = tray.current;
    const run = getRun();
    if (!g || !run) return;
    const id = run.director.currentBeat?.id ?? '';
    g.visible = (SLIDE_BEATS as readonly string[]).includes(id) || id === REASSEMBLE_BEAT;
    if (!g.visible) return;
    const cam = state.camera;
    offset.set(0.1, -0.46, -0.95).applyQuaternion(cam.quaternion);
    g.position.copy(cam.position).add(offset).sub(TRAY_ORIGIN);
    g.quaternion.copy(cam.quaternion);
    // Tip the tray flat under the rider and bank it slightly into the turn.
    g.rotateX(-0.95);
    g.rotateY(Math.sin(state.clock.elapsedTime * 3) * 0.03);
    g.rotateZ(0.12);
  });
  return (
    <group ref={tray} visible={false}>
      <mesh scale={[1, 1, 0.72]} material={MAT.silver}>
        <cylinderGeometry args={[0.42, 0.4, 0.025, 40]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]} position={[0, 0.02, 0]} material={MAT.silver}>
        <torusGeometry args={[0.42, 0.018, 8, 48]} />
      </mesh>
    </group>
  );
}

/** The scene group sits at the stairwell origin, so world positions are offset by it. */
const TRAY_ORIGIN = new Vector3(...STAIRWELL_ORIGIN);
