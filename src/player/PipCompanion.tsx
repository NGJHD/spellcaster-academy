import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { Color, Vector3, type Group, type MeshStandardMaterial, type Object3D } from 'three';
import { MAT } from '../scene/materials';
import { useParts } from '../scene/partsGlb';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';

/** Pip floats to the right of the view, clear of word labels (lower-right third of the screen). */
const OFFSET_CALM = new Vector3(0.85, -0.05, -1.7);
const OFFSET_COMBAT = new Vector3(1.15, -0.32, -1.9);
const FOLLOW_RATE = 2.6;
/**
 * Where Pip re-enters from when it has fallen out of view (a camera cut or a big turn): just past the
 * bottom-right corner of the screen, so it floats up into its place there (owner, 2026-10-24: it always
 * swept in from the left, trailing behind the turn).
 */
const OFFSET_ENTER = new Vector3(1.9, -1.35, -1.6);
/** Beyond this far from its place, Pip is lost from view and re-enters rather than trailing across. */
const LOST = 1.4;

const goal = new Vector3();
const seen = new Vector3();
const offset = new Vector3();
const carried = new Vector3();
/** Where Pip is in the world this frame (the Unwriter aims his quill at it). */
export const pipWorld = new Vector3();

/**
 * PLACEHOLDER Pip: brass astrolabe rings around a warm opalescent core. Follows the camera
 * with soft inertia and overlap; brightens while speaking.
 */
interface PipRig {
  rings: Object3D[];
  fins: Object3D[];
  core: MeshStandardMaterial[];
}

export function PipCompanion() {
  const root = useRef<Group>(null);
  const rig = useRef<PipRig>({ rings: [], fins: [], core: [] });
  const time = useRef(0);
  const placed = useRef(false);
  /** Floating back in from the bottom right: not checked for being lost until it has arrived. */
  const entering = useRef(false);
  const warm = useMemo(() => new Color('#ffb640'), []);
  const cool = useMemo(() => new Color('#bfe0ff'), []);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    time.current += delta;
    const run = getRun();
    const combat = run?.isEncounterActive ?? false;
    offset.copy(combat ? OFFSET_COMBAT : OFFSET_CALM).applyQuaternion(state.camera.quaternion);
    goal.copy(state.camera.position).add(offset);
    goal.y += Math.sin(time.current * 1.6) * 0.04;
    // Snatched! A creature is carrying Pip off (cold open): Pip dangles and struggles.
    const snatched = run?.pipCarrier(carried) ?? false;
    if (snatched) {
      goal.copy(carried);
      goal.x += Math.sin(time.current * 13) * 0.03;
      goal.y += Math.sin(time.current * 17) * 0.02;
    }
    if (!placed.current) {
      g.position.copy(goal);
      placed.current = true;
    }
    if (entering.current && g.position.distanceTo(goal) < 0.35) entering.current = false;
    if (!snatched && !entering.current) {
      // Out of view, or far from its place: re-enter from the bottom right instead of sweeping across.
      seen.copy(g.position).project(state.camera);
      const offScreen = seen.z > 1 || Math.abs(seen.x) > 1.05 || Math.abs(seen.y) > 1.05;
      if (offScreen || g.position.distanceTo(goal) > LOST) {
        g.position.copy(OFFSET_ENTER).applyQuaternion(state.camera.quaternion).add(state.camera.position);
        entering.current = true;
      }
    }
    // Soft inertia: Pip lags behind camera moves and settles (never a rigid UI icon).
    // Held in the thief's chest, Pip moves with it (no lag that would leave Pip trailing behind).
    const k = 1 - Math.exp(-(snatched ? 30 : FOLLOW_RATE) * Math.min(delta, 0.1));
    g.position.lerp(goal, k);
    g.lookAt(state.camera.position);
    pipWorld.copy(g.position);
    run?.pipAt.copy(g.position);

    const speaking = useRunStore.getState().subtitle?.speaker === 'pip';
    for (const m of rig.current.core) {
      m.emissiveIntensity += ((speaking ? 4 : 2.2) - m.emissiveIntensity) * k;
      m.emissive.lerp(speaking ? cool : warm, k);
    }
    const dt = Math.min(delta, 0.1);
    rig.current.rings.forEach((r, i) => {
      r.rotateX(dt * (0.4 + i * 0.25));
      r.rotateY(dt * (0.25 + i * 0.3) * (i % 2 ? -1 : 1));
    });
    rig.current.fins.forEach((f, i) => {
      const lift = speaking ? 0.35 + Math.sin(time.current * 9 + i) * 0.15 : 0.05 * Math.sin(time.current * 1.5);
      f.rotation.z = (i === 0 ? 1 : -1) * lift;
    });
  });

  return (
    <group ref={root} scale={0.85}>
      <Suspense fallback={<FallbackPip rig={rig} />}>
        <PipGLB rig={rig} />
      </Suspense>
    </group>
  );
}

function PipGLB({ rig }: { rig: RefObject<PipRig> }) {
  const parts = useParts('pip', false);
  useEffect(() => {
    rig.current.rings = [0, 1, 2].map((i) => parts.get(`Ring_${i}`)).filter((o): o is Object3D => !!o);
    rig.current.fins = ['Fin_L', 'Fin_R'].map((n) => parts.get(n)).filter((o): o is Object3D => !!o);
    rig.current.core = parts.materials('Opal');
  }, [parts, rig]);
  return <primitive object={parts.root} />;
}

/** Code-built stand-in while the GLB loads. */
function FallbackPip({ rig }: { rig: RefObject<PipRig> }) {
  const core = useMemo(() => MAT.wardGold.clone(), []);
  const rings = useRef<(Group | null)[]>([]);
  useEffect(() => {
    rig.current.rings = rings.current.filter((o): o is Group => !!o);
    rig.current.core = [core];
    rig.current.fins = [];
  }, [core, rig]);
  return (
    <>
      <mesh material={core}>
        <sphereGeometry args={[0.065, 24, 18]} />
      </mesh>
      {[0.1, 0.12, 0.14].map((r, i) => (
        <group key={r} ref={(o) => void (rings.current[i] = o)}>
          <mesh material={MAT.agedBrass}>
            <torusGeometry args={[r, 0.004, 8, 48]} />
          </mesh>
        </group>
      ))}
    </>
  );
}
