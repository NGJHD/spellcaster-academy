/**
 * The swarm of runaway books (East Hall Book Stampede): a flock of flapping books that chases
 * the camera during the listed beats. Cosmetic only; the typeable books are ordinary chase targets.
 * Owner (2026-10-08): the books are instances of the generated `runaway_book` model (AI pipeline), each
 * tinted a different cover colour; tinted boxes only while it loads.
 */
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { Box3, BoxGeometry, BufferGeometry, Color, Mesh, MeshStandardMaterial, Object3D, Vector3, type InstancedMesh, type Material } from 'three';
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
const WHITE = new Color('#ffffff');
const BOOK_URL = `${import.meta.env.BASE_URL}assets/creatures/runaway_book.glb`;
/** About how wide each flying book is, in metres. */
const BOOK_SIZE = 0.5;

interface BookShape {
  geometry: BufferGeometry;
  material: Material;
  /** Scale that makes the shape BOOK_SIZE wide. */
  scale: number;
  /** Whether the covers flap by a rotation (the boxes) rather than being part of the model. */
  box: boolean;
}

const boxShape: BookShape = { geometry: new BoxGeometry(0.46, 0.33, 0.09), material: new MeshStandardMaterial({ roughness: 0.7 }), scale: 1, box: true };

/** The generated book's mesh, centred, as one geometry for instancing. */
function useBookShape(): BookShape {
  const { scene } = useGLTF(BOOK_URL);
  return useMemo(() => {
    let found: Mesh | null = null;
    scene.updateMatrixWorld(true);
    scene.traverse((o) => {
      if (!found && o instanceof Mesh) found = o;
    });
    const mesh = found as Mesh | null;
    if (!mesh) return boxShape;
    const geometry = (mesh.geometry as BufferGeometry).clone();
    geometry.deleteAttribute('skinIndex');
    geometry.deleteAttribute('skinWeight');
    geometry.computeBoundingBox();
    const box = geometry.boundingBox ?? new Box3();
    const centre = box.getCenter(new Vector3());
    geometry.translate(-centre.x, -centre.y, -centre.z);
    const size = box.getSize(new Vector3());
    const material = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as Material;
    const tinted = material.clone();
    return { geometry, material: tinted, scale: BOOK_SIZE / Math.max(size.x, size.y, size.z, 1e-3), box: false };
  }, [scene]);
}

export function BookSwarm(props: SwarmProps) {
  return (
    <Suspense fallback={<Swarm {...props} shape={boxShape} />}>
      <GeneratedSwarm {...props} />
    </Suspense>
  );
}

function GeneratedSwarm(props: SwarmProps) {
  const shape = useBookShape();
  return <Swarm {...props} shape={shape} />;
}

interface SwarmProps {
  beats: readonly string[];
  count?: number;
  near?: number;
  far?: number;
  spread?: number;
  /** Fraction of the first listed beat before the swarm appears (e.g. after the camera turns round). */
  startAt?: number;
}

function Swarm({
  beats,
  count = 44,
  near = 4.5,
  far = 9.5,
  spread = 1.7,
  startAt = 0,
  shape,
}: SwarmProps & { shape: BookShape }) {
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
      // Facing the camera, tumbling and fluttering as it flies.
      dummy.lookAt(cam.position);
      dummy.rotateZ(Math.sin(t * 13) * (shape.box ? 0.55 : 0.35));
      dummy.rotateX(-0.3 + Math.sin(t * 7) * 0.2);
      dummy.scale.setScalar(shape.scale * (0.85 + ((i * 37) % 10) / 30));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    placed.current = true;
    m.instanceMatrix.needsUpdate = true;
  });

  // The generated book is textured, so its tints are lighter (they multiply the texture).
  const colours = useMemo(() => fliers.map((_, i) => new Color(COVERS[i % COVERS.length]).lerp(WHITE, shape.box ? 0 : 0.5)), [fliers, shape.box]);
  return (
    <instancedMesh
      ref={(m) => {
        mesh.current = m;
        if (m) {
          colours.forEach((c, i) => m.setColorAt(i, c));
          if (m.instanceColor) m.instanceColor.needsUpdate = true;
        }
      }}
      args={[shape.geometry, shape.material, count]}
      frustumCulled={false}
      visible={false}
    />
  );
}
