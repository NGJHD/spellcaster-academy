/** PLACEHOLDER Lower Stairwell: broad spiral around a central column. */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three';
import { GUARD_BLOCK_RADIUS, SLIDE_BEATS, STAIRWELL_EXIT_DEG, STAIRWELL_ORIGIN, STAIR_GUARDS, TRAY_REST_DEG, TRAY_REST_RADIUS, stairFloor } from '../../level/areas/stairwell';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import { Guardian } from '../../enemies/GuardianGLB';
import { WallLamp, WindowPane } from '../kit';
import { CastleDoor } from '../CastleDoor';
import { MergeStatic } from '../MergeStatic';
import { insideCylinder, worldBox, worldCircle, worldCylinder } from '../surfaces';
import { MAT } from '../materials';
import { PROJECTILE_SEC } from '../../enemies/EnemyBrain';
import { DORM_DOORS } from '../../level/areas2/dormitory';

const R = 6;
const TOP = 19;
/** The handrail and its posts stop here, at the foot of the stairs, clear of the exit door at 99° (−261°). */
const HANDRAIL_END_DEG = -236;
/** The rail breaks this many degrees either side of a dormitory door, so it never runs across one. */
const DOOR_GAP_DEG = 8;
/** Level 1 windows, and the dormitory's (moved off the doors, owner 2026-10-16: a window covered the first student). */
const WINDOW_DEGS = [30, -60, -150, -230] as const;
const DORM_WINDOW_DEGS = [20, -100, -180, -265] as const;
/** A guard waits for the spell to land before stepping aside. */
const SPELL_FLIGHT_SEC = PROJECTILE_SEC + 0.05;

const polar = (deg: number, y: number, r = R): [number, number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.cos(a), y, r * Math.sin(a)];
};

/** `dormitory`: the Level 2 Dormitory Tower reuses the spiral without the Level 1 guards and tea tray. */
export function StairwellScene({ dormitory = false }: { dormitory?: boolean } = {}) {
  const steps = useMemo(() => {
    // Descend 4 m per 80° from 60° above landing 1 to below the bottom.
    const out: { deg: number; y: number }[] = [];
    for (let deg = 60; deg >= -290; deg -= 6) {
      out.push({ deg, y: stairFloor(deg) });
    }
    return out;
  }, []);

  // The dormitory's rail stops at each door (owner, 2026-10-16: "the hand rail is blocking the doors").
  const gaps = dormitory ? DORM_DOORS.map((d) => d.deg) : [];
  const railed = (deg: number) => deg >= HANDRAIL_END_DEG && gaps.every((g) => Math.abs(deg - g) > DOOR_GAP_DEG);
  const railRuns = (() => {
    const runs: { deg: number; y: number }[][] = [];
    let run: { deg: number; y: number }[] = [];
    for (const st of steps) {
      if (railed(st.deg)) run.push(st);
      else if (run.length) {
        runs.push(run);
        run = [];
      }
    }
    if (run.length) runs.push(run);
    return runs.filter((r) => r.length > 1);
  })();

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
        {steps.filter((st, i) => i % 4 === 0 && railed(st.deg)).map((s, i) => {
          const [x, , z] = polar(s.deg, 0, 8.9);
          return (
            <mesh key={`post${i}`} position={[x, s.y + 0.5, z]} material={MAT.agedBrass}>
              <cylinderGeometry args={[0.025, 0.035, 1.0, 10]} />
            </mesh>
          );
        })}
      </MergeStatic>
      {/* The rail ends where the stairs reach the ground, short of the exit door (it ran across it). */}
      {railRuns.map((run) => (
        <Handrail key={run[0]?.deg} steps={run} />
      ))}
      {/* Tall slit windows and lamps cooling toward the tower */}
      {/* Windows and lamps sit above the stairs at their own angle (owner: some windows were below the
          staircase). */}
      {(dormitory ? DORM_WINDOW_DEGS : WINDOW_DEGS).map((deg, i) => {
        const [x, , z] = polar(deg, 0, 9.35);
        const floor = stairFloor(deg);
        return (
          <group key={deg}>
            <WindowPane position={[x * 0.995, floor + 3.1, z * 0.995]} size={[0.7, 2.2]} rotationY={-((deg * Math.PI) / 180) - Math.PI / 2} />
            <WallLamp position={[x * 0.97, floor + 2.2, z * 0.97]} rotationY={-((deg * Math.PI) / 180) - Math.PI / 2} />
            <pointLight position={[x * 0.7, floor + 2.8, z * 0.7]} color={i < 2 ? '#ffc98a' : '#c9d8ff'} intensity={9} distance={11} decay={2} />
          </group>
        );
      })}
      {!dormitory && STAIR_GUARDS.slice(0, 2).map((g, i) => (
        <CommandedGuard key={g.id} deg={g.deg} floor={g.floor} flag={`stair-guard-${i + 1}-calm`} slideBeat={SLIDE_BEATS[i] ?? ''} />
      ))}
      {!dormitory && <ReassemblingGuard />}
      {!dormitory && <TeaTray />}
      {!dormitory && <ExitDoor />}
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
 * Guardians 1 and 2 stand in the tray's path; once their word is typed they step aside and bow (the
 * camera waits for the word, so they never leap away untold).
 */
function CommandedGuard({ deg, floor, flag, slideBeat }: { deg: number; floor: number; flag: string; slideBeat: string }) {
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const aside = useRef(0);
  const sinceCommand = useRef(0);
  const slideIndex = beatIndexOf(slideBeat);
  useFrame((state, dt) => {
    pose.current.time += dt;
    const run = getRun();
    const beat = run?.director.currentIndex ?? -1;
    const commanded = run?.flags.has(flag) ?? false;
    sinceCommand.current = commanded ? sinceCommand.current + dt : 0;
    // Words are never skipped, so a guard only steps aside once its word is typed (owner: they jumped
    // aside the moment the tray reached them). After its slide (a resume) it is out of the way.
    const lastMoment = beat > slideIndex;
    // It stays put until the spell has landed (owner: the spell missed, flying to where it had been).
    const clear = (commanded && sinceCommand.current > SPELL_FLIGHT_SEC) || lastMoment;
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
 * re-assembles before the short fight. Hidden while the live fight target exists.
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
 * PLACEHOLDER tea tray (Banister Slide): a polished silver tray under the camera while sliding,
 * banking into the curve. Replaceable with the first-person hands-on-rim GLB.
 */
function TeaTray() {
  const tray = useRef<Group>(null);
  const flat = useMemo(() => new Vector3(), []);
  const rest = useMemo(() => new Vector3(...polar(TRAY_REST_DEG, 16.03, TRAY_REST_RADIUS)), []);
  useFrame((state) => {
    const g = tray.current;
    const run = getRun();
    if (!g || !run) return;
    const id = run.director.currentBeat?.id ?? '';
    const riding = (SLIDE_BEATS as readonly string[]).includes(id) || id === REASSEMBLE_BEAT;
    const waiting = id === 'stairwell-enter' || id === 'stairwell-hop';
    g.visible = riding || waiting;
    if (!g.visible) return;
    if (waiting) {
      // Owner (2026-10-08): the tray waits on the landing before Pip says to hop on.
      g.position.copy(rest);
      g.rotation.set(0, -((TRAY_REST_DEG - 90) * Math.PI) / 180, 0);
      return;
    }
    // Riding: the tray is under us, a little ahead, so only its front half shows at the bottom of the
    // view (it used to float whole in front of the camera). It faces the way we slide, nose down the stairs.
    const cam = state.camera;
    cam.getWorldDirection(flat);
    flat.y = 0;
    if (flat.lengthSq() < 1e-6) flat.set(0, 0, -1);
    flat.normalize();
    g.position.copy(cam.position).addScaledVector(flat, 0.32).sub(TRAY_ORIGIN);
    g.position.y -= 0.82;
    g.rotation.set(0, Math.atan2(flat.x, flat.z), 0);
    g.rotateX(0.28 + Math.sin(state.clock.elapsedTime * 3) * 0.02);
    g.rotateZ(Math.sin(state.clock.elapsedTime * 2.3) * 0.03);
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

/**
 * The way out at the bottom of the stairwell (owner: the scene ended facing a bare wall): an arched
 * doorway with its doors thrown open and warm light from the gallery beyond.
 */
function ExitDoor() {
  // On the wall at the foot of the stairs; the door faces into the stairwell.
  const [x, , z] = polar(STAIRWELL_EXIT_DEG, 0, 9.35);
  return (
    <group position={[x, 0, z]} rotation={[0, -((STAIRWELL_EXIT_DEG * Math.PI) / 180) - Math.PI / 2, 0]}>
      <CastleDoor height={3.4} />
    </group>
  );
}

/** The scene group sits at the stairwell origin, so world positions are offset by it. */
const TRAY_ORIGIN = new Vector3(...STAIRWELL_ORIGIN);
