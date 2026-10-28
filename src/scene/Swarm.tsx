/**
 * The swarm of runaway books (East Hall Book Stampede): a flock of flapping books that chases
 * the camera during the listed beats. Cosmetic only; the typeable books are ordinary chase targets.
 * Each book is the same animated `runaway_book` model as the targets (owner, 2026-10-24: frozen
 * closed copies read as blocks), flapping out of step and tinted a different cover colour. Nothing
 * shows while the model loads.
 */
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { Box3, Vector3, type Group } from 'three';
import { CreatureModel } from '../enemies/CreatureModel';
import { emptyPose, type TargetPose } from '../enemies/TargetVisuals';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';

const TINTS = [undefined, 'book-blue', 'book-green', 'book-purple', 'book-gold'] as const;

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
const BOOK_URL = `${import.meta.env.BASE_URL}assets/creatures/runaway_book.glb`;
/** About how wide each flying book is, in metres. */
const BOOK_SIZE = 0.5;

export function BookSwarm(props: SwarmProps) {
  return (
    <Suspense fallback={null}>
      <Swarm {...props} />
    </Suspense>
  );
}

interface SwarmProps {
  beats: readonly string[];
  count?: number;
  near?: number;
  far?: number;
  spread?: number;
  /** Fraction of the first listed beat before the swarm appears (e.g. after the camera turns round). */
  startAt?: number;
  /**
   * Beats behind a fade where the books are drawn parked behind the camera, unseen. Their shadow-pass
   * shaders cannot be compiled ahead (warmUp only covers the main pass), and compiling them when the
   * swarm first appeared froze the stampede's turn for a quarter of a second.
   */
  primeBeats?: readonly string[];
}

function Swarm({ beats, count = 18, near = 4.5, far = 9.5, spread = 1.7, startAt = 0, primeBeats }: SwarmProps) {
  const root = useRef<Group>(null);
  const books = useRef<(Group | null)[]>([]);
  const active = useRunStore((s) => s.beatId !== null && beats.includes(s.beatId));
  const priming = useRunStore((s) => s.beatId !== null && (primeBeats?.includes(s.beatId) ?? false));
  const { scene } = useGLTF(BOOK_URL);
  const scale = useMemo(() => {
    const size = new Box3().setFromObject(scene).getSize(new Vector3());
    return BOOK_SIZE / Math.max(size.x, size.y, size.z, 1e-3);
  }, [scene]);
  // Every book flies (its Move clip), each starting the flap at a different point.
  const pose = useRef<TargetPose>({ ...emptyPose(), moving: true });
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
  const time = useRef(0);

  useFrame((state, delta) => {
    const g = root.current;
    if (!g) return;
    const run = getRun();
    const waiting = startAt > 0 && run?.director.currentBeat?.id === beats[0] && (run?.beatProgress() ?? 1) < startAt;
    g.visible = (active && !waiting) || priming;
    if (!g.visible) {
      placed.current = false;
      return;
    }
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    pose.current.time = time.current;
    const cam = state.camera;
    cam.getWorldDirection(forward);
    right.crossVectors(forward, WORLD_UP).normalize();
    up.crossVectors(right, forward).normalize();
    const k = 1 - Math.exp(-3 * dt);
    fliers.forEach((f, i) => {
      const b = books.current[i];
      if (!b) return;
      const t = time.current + f.seed;
      goal
        .copy(cam.position)
        .addScaledVector(forward, f.depth + Math.sin(t * 1.3) * 0.8)
        .addScaledVector(right, f.side + Math.sin(t * 0.9) * 0.5)
        .addScaledVector(up, f.height + Math.sin(t * 2.1) * 0.35);
      if (!placed.current) f.position.copy(goal).addScaledVector(forward, 6);
      if (priming) f.position.copy(cam.position).addScaledVector(forward, -3);
      f.position.lerp(goal, k);
      b.position.copy(f.position);
      // Facing the camera with its covers spread, rocking a little as it flies.
      b.lookAt(cam.position);
      b.rotateZ(Math.sin(t * 3.1) * 0.25);
      b.rotateX(Math.sin(t * 2.3) * 0.15);
      b.scale.setScalar(scale * (0.85 + ((i * 37) % 10) / 30));
    });
    placed.current = true;
  });

  return (
    <group ref={root} visible={false}>
      {fliers.map((f, i) => (
        <group key={i} ref={(b) => void (books.current[i] = b)}>
          <CreatureModel url={BOOK_URL} pose={pose} tint={TINTS[i % TINTS.length]} phase={f.seed * 0.73} />
        </group>
      ))}
    </group>
  );
}
