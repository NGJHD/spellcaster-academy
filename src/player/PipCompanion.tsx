import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Vector3, type Group } from 'three';
import { MAT } from '../scene/materials';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';

/** Pip floats to the right of the view, clear of word labels (lower-right third of the screen). */
const OFFSET_CALM = new Vector3(0.85, -0.05, -1.7);
const OFFSET_COMBAT = new Vector3(1.15, -0.32, -1.9);
const FOLLOW_RATE = 2.6;

const goal = new Vector3();
const offset = new Vector3();

/**
 * PLACEHOLDER Pip (§14A.2): brass astrolabe rings around a warm opalescent core. Follows the camera
 * with soft inertia and overlap; brightens while speaking.
 */
export function PipCompanion() {
  const root = useRef<Group>(null);
  const rings = useRef<(Group | null)[]>([]);
  const time = useRef(0);
  const core = useMemo(() => MAT.wardGold.clone(), []);
  const placed = useRef(false);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    time.current += delta;
    const run = getRun();
    const combat = run?.isEncounterActive ?? false;
    offset.copy(combat ? OFFSET_COMBAT : OFFSET_CALM).applyQuaternion(state.camera.quaternion);
    goal.copy(state.camera.position).add(offset);
    goal.y += Math.sin(time.current * 1.6) * 0.04;
    if (!placed.current) {
      g.position.copy(goal);
      placed.current = true;
    }
    const k = 1 - Math.exp(-FOLLOW_RATE * Math.min(delta, 0.1));
    g.position.lerp(goal, k);
    g.lookAt(state.camera.position);

    const speaking = useRunStore.getState().subtitle?.speaker === 'pip';
    core.emissiveIntensity += ((speaking ? 2.6 : 1.4) - core.emissiveIntensity) * k;
    core.emissive.setRGB(1, speaking ? 0.8 : 0.68, speaking ? 0.45 : 0.25);
    rings.current.forEach((r, i) => {
      if (!r) return;
      r.rotation.x = time.current * (0.4 + i * 0.25);
      r.rotation.y = time.current * (0.25 + i * 0.3) * (i % 2 ? -1 : 1);
    });
  });

  return (
    <group ref={root} scale={0.85}>
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
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.06 * s, 0.075, 0.02]} rotation={[0, 0, -0.5 * s]} material={MAT.agedBrass}>
          <boxGeometry args={[0.05, 0.012, 0.004]} />
        </mesh>
      ))}
    </group>
  );
}
