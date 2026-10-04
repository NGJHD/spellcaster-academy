/**
 * PLACEHOLDER swarm of runaway books (LD-0 East Hall Book Stampede, library book spills): a flock
 * of flapping covers that chases the camera during the listed beats. Cosmetic only; the typeable
 * books are ordinary chase targets. Replaceable with instanced book GLBs without gameplay changes.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Color, Object3D, Vector3, type InstancedMesh } from 'three';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';

const COVERS = ['#7a2f2a', '#2f4a7a', '#2f6a4a', '#6a4a2a', '#5a2f6a', '#8a6a2a'];

interface Flier {
  position: Vector3;
  seed: number;
  depth: number;
  side: number;
  height: number;
}

const forward = new Vector3();
const right = new Vector3();
const up = new Vector3();
const goal = new Vector3();
const WORLD_UP = new Vector3(0, 1, 0);

export function BookSwarm({
  beats,
  count = 44,
  near = 4.5,
  far = 9.5,
  spread = 1.7,
  startAt = 0,
}: {
  beats: readonly string[];
  count?: number;
  near?: number;
  far?: number;
  spread?: number;
  /** Fraction of the first listed beat before the swarm appears (e.g. after the camera turns round). */
  startAt?: number;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const active = useRunStore((s) => s.beatId !== null && beats.includes(s.beatId));
  const fliers = useMemo<Flier[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        position: new Vector3(),
        seed: i * 1.37,
        depth: near + ((i * 7919) % 100) / 100 * (far - near),
        side: (((i * 104729) % 200) / 100 - 1) * spread,
        height: (((i * 1299709) % 200) / 100 - 1) * 0.9,
      })),
    [count, near, far, spread],
  );
  const placed = useRef(false);
  const dummy = useMemo(() => new Object3D(), []);
  const time = useRef(0);

  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m) return;
    const run = getRun();
    const waiting = startAt > 0 && run?.director.currentBeat?.id === beats[0] && (run?.beatProgress() ?? 1) < startAt;
    m.visible = active && !waiting;
    if (!m.visible) {
      placed.current = false;
      return;
    }
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const cam = state.camera;
    cam.getWorldDirection(forward);
    right.crossVectors(forward, WORLD_UP).normalize();
    up.crossVectors(right, forward).normalize();
    const k = 1 - Math.exp(-3 * dt);
    fliers.forEach((f, i) => {
      const t = time.current + f.seed;
      goal
        .copy(cam.position)
        .addScaledVector(forward, f.depth + Math.sin(t * 1.3) * 0.8)
        .addScaledVector(right, f.side + Math.sin(t * 0.9) * 0.5)
        .addScaledVector(up, f.height + Math.sin(t * 2.1) * 0.35);
      if (!placed.current) f.position.copy(goal).addScaledVector(forward, 6);
      f.position.lerp(goal, k);
      dummy.position.copy(f.position);
      // Facing the camera with the covers flapping like wings.
      dummy.lookAt(cam.position);
      dummy.rotateZ(Math.sin(t * 13) * 0.55);
      dummy.rotateX(-0.3);
      dummy.scale.set(0.46, 0.33, 0.09);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    placed.current = true;
    m.instanceMatrix.needsUpdate = true;
  });

  const colours = useMemo(() => fliers.map((_, i) => new Color(COVERS[i % COVERS.length])), [fliers]);
  return (
    <instancedMesh
      ref={(m) => {
        mesh.current = m;
        if (m) {
          colours.forEach((c, i) => m.setColorAt(i, c));
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
      }}
      args={[undefined, undefined, count]}
      frustumCulled={false}
      visible={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.7} />
    </instancedMesh>
  );
}
