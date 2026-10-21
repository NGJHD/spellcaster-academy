/**
 * The ways on between the Inkfall, the Margin Library and the Gallery (owner, 2026-10-21: "one moment
 * we were at a waterfall facing nothing, one moment we appear in a library … did we teleport?").
 * - At the foot of the falls a stone doorway in the cliff, lined with bookshelves inside, with the
 *   erased pages pouring off the falls and in at it: the library's door. We step off the raft, walk in,
 *   and come out of the same doorway on the library side.
 * - At the library's far end an arch onto a landing of grey half-made statues, and the gallery's own
 *   front door at its end; we walk through and in.
 * Local frames: a doorway faces +Z, its floor at y = 0.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Material } from 'three';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { Fire } from '../Fire';
import { Bookshelf, Box, KitModel, Slab } from '../kit';
import { MAT } from '../materials';
import { Prop } from '../Prop';
import { Mira } from '../props';

const HALF = 2;
const SPRING = 3.8;

/**
 * A wall `width` × `height` with an arched opening 4 m wide and 5.8 m tall at its middle, framed by
 * dressed stone jambs and an arch ring (so the same door reads from both sides).
 */
export function StoneDoorway({ width, height, wall, trim = MAT.academyStone }: { width: number; height: number; wall: Material; trim?: Material }) {
  return (
    <group>
      <Slab x={[-width / 2, -HALF]} y={[0, height]} z={[-0.75, 0.75]} material={wall} />
      <Slab x={[HALF, width / 2]} y={[0, height]} z={[-0.75, 0.75]} material={wall} />
      <Slab x={[-HALF, HALF]} y={[SPRING + HALF, height]} z={[-0.75, 0.75]} material={wall} />
      {/* The corners above the arch ring */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Box position={[s * 1.8, SPRING + 1.6, 0]} size={[0.4, 0.8, 1.5]} material={wall} />
          <Box position={[s * 1.3, SPRING + 1.9, 0]} size={[0.6, 0.2, 1.5]} material={wall} />
        </group>
      ))}
      {[-1, 1].map((s) => (
        <Box key={`j${s}`} position={[s * (HALF + 0.15), SPRING / 2, 0]} size={[0.5, SPRING, 1.8]} material={trim} />
      ))}
      {[-0.8, 0.8].map((z) => (
        <mesh key={z} position={[0, SPRING, z]} material={trim} castShadow>
          <torusGeometry args={[HALF + 0.15, 0.3, 10, 28, Math.PI]} />
        </mesh>
      ))}
      <Box position={[0, SPRING + HALF + 0.25, 0]} size={[0.6, 0.7, 1.8]} material={trim} />
    </group>
  );
}

/**
 * A short roofless walk between bookcases running back (−Z) from a doorway, open to the red sky like the
 * Margin Library itself (owner, 2026-10-21: the first one was a closed room, but the library is open
 * air). Its far end opens out between broken columns, with a burning heap of blank books by the way.
 */
export function BookHall({ length = 12, seed = 1 }: { length?: number; seed?: number }) {
  return (
    <group>
      <Slab x={[-3, 3]} y={[-0.3, 0]} z={[-length - 4, 0]} material={MAT.marble} />
      {[-1, 1].map((s) => (
        <group key={s}>
          {/* Ruined side walls, broken off at uneven heights */}
          <Slab x={s < 0 ? [-3.6, -3] : [3, 3.6]} y={[0, s < 0 ? 5.8 : 4.6]} z={[-length, 0]} material={MAT.academyStoneDark} />
          <Slab x={s < 0 ? [-3.6, -3] : [3, 3.6]} y={[0, s < 0 ? 7.4 : 6.6]} z={[-length * 0.45, -length * 0.15]} material={MAT.academyStoneDark} />
          {Array.from({ length: Math.floor(length / 3.2) }, (_, i) => (
            <Bookshelf key={i} position={[s * 2.6, 0, -1.8 - i * 3.2]} rotationY={s < 0 ? Math.PI / 2 : -Math.PI / 2} width={3} height={4.4} shelves={5} seed={seed + i + (s > 0 ? 10 : 0)} />
          ))}
          {/* Broken columns where the walk opens out */}
          <group position={[s * 2.4, 0, -length - 1.5]}>
            <mesh position={[0, s < 0 ? 2.6 : 1.6, 0]} material={MAT.academyStone} castShadow>
              <cylinderGeometry args={[0.45, 0.55, s < 0 ? 5.2 : 3.2, 18]} />
            </mesh>
            <Box position={[0, 0.2, 0]} size={[1.3, 0.4, 1.3]} material={MAT.academyStone} />
          </group>
        </group>
      ))}
      <Fire position={[1.6, 0, -length + 1]} size={1.2} count={2} spread={0.8} />
      <pointLight position={[0, 3.2, -1.5]} color="#ffb060" intensity={10} distance={8} decay={1.6} />
    </group>
  );
}

const PAGES = 16;
const PAGE_SEC = 5.5;

/** Loose pages streaming off the falls and in at the library door (local to the falls). */
function StreamingPages({ door }: { door: Vec3 }) {
  const refs = useRef<(Group | null)[]>([]);
  const time = useRef(0);
  const seeds = useMemo(
    () => Array.from({ length: PAGES }, (_, i) => ({ x: Math.sin(i * 7.3) * 5, y: 7 + ((i * 5) % 9), z: -118 - ((i * 3) % 10), phase: i / PAGES })),
    [],
  );
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1);
    const t = time.current;
    refs.current.forEach((g, i) => {
      const s = seeds[i];
      if (!g || !s) return;
      const u = (t / PAGE_SEC + s.phase) % 1;
      // Fluttering down off the falls, then gliding in low over the shore and through the door.
      const e = u * u * (3 - 2 * u);
      g.position.set(
        s.x + (door[0] - s.x) * e + Math.sin(t * 2 + i) * 0.5 * (1 - u),
        s.y + (door[1] + 2.6 - s.y) * e + Math.sin(t * 3.1 + i * 2) * 0.35,
        s.z + (door[2] - 2 - s.z) * u,
      );
      g.rotation.set(Math.sin(t * 5 + i) * 0.6, t * 1.4 + i, Math.cos(t * 4 + i) * 0.4);
      g.scale.setScalar(u > 0.94 ? (1 - u) / 0.06 : Math.min(1, u / 0.05));
    });
  });
  return (
    <>
      {seeds.map((_, i) => (
        <group key={i} ref={(g) => void (refs.current[i] = g)}>
          <KitModel id="page_loose" scale={1.6} castShadow={false} />
        </group>
      ))}
    </>
  );
}

const MIRA_RUN_SEC = 3;

/** Mira hopping off the raft and running ahead of us to the door, during `beat`. */
function MiraToDoor({ beat, from, to }: { beat: string; from: Vec3; to: Vec3 }) {
  const ref = useRef<Group>(null);
  const since = useRef(0);
  const running = useRef(true);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const on = getRun()?.director.currentBeat?.id === beat;
    g.visible = on;
    if (!on) {
      since.current = 0;
      return;
    }
    since.current += Math.min(delta, 0.1);
    const k = Math.min(1, since.current / MIRA_RUN_SEC);
    running.current = k < 1;
    g.position.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k);
  });
  return (
    <group ref={ref} visible={false}>
      <Mira position={[0, 0, 0]} rotationY={Math.PI} clip={() => (running.current ? 'Run' : 'Idle')} />
    </group>
  );
}

/**
 * The foot of the falls (local to FALLS_ORIGIN): a rocky shore below a cliff, the library door in it
 * with its bookshelf hall behind, the pages pouring in, and Mira running ahead of us to it.
 */
export function LibraryDoorAtFalls({ door, ashoreBeat }: { door: Vec3; ashoreBeat: string }) {
  const [x, y, z] = door;
  return (
    <>
      {/* The shore between the pool and the cliff */}
      <Slab x={[-14, 14]} y={[-5, y]} z={[z + 0.75, -150]} material={MAT.rockGround} />
      <group position={[x, y, z]}>
        <StoneDoorway width={60} height={34} wall={MAT.rockGround} />
        <group position={[0, 0, -0.75]}>
          <BookHall length={12} seed={140} />
        </group>
        {/* Lanterns either side of the door, so it reads from the top of the slide */}
        {[-1, 1].map((s) => (
          <Fire key={s} position={[s * 3.2, 0.2, 1.4]} size={1.2} count={2} spread={0.3} smoke={false} kind="warm" light={s < 0} />
        ))}
      </group>
      <StreamingPages door={door} />
      <MiraToDoor beat={ashoreBeat} from={[-1.2, y, -152]} to={[-0.8, y, z - 3]} />
    </>
  );
}

/** A grey, half-finished statue on a marble plinth (the gallery's exhibits), local to its landing. */
function Exhibit({ id, position, height, rotationY }: { id: string; position: Vec3; height: number; rotationY: number }) {
  return (
    <group position={position}>
      <Box position={[0, 0.3, 0]} size={[1.8, 0.6, 1.8]} material={MAT.marble} />
      <Prop id={id} position={[0, 0.6, 0]} height={height} rotationY={rotationY} />
    </group>
  );
}

/** Half-made statues lining a landing that runs back (−Z) from a doorway. */
function StatueLanding({ length }: { length: number }) {
  return (
    <group>
      <Slab x={[-7, 7]} y={[-0.4, 0]} z={[-length, 0]} material={MAT.marble} />
      <mesh rotation={[Math.PI, 0, 0]} position={[0, -6, -length / 2]} scale={[1, 1, length / 14]} material={MAT.rockGround}>
        <coneGeometry args={[8, 11, 9, 3]} />
      </mesh>
      <Exhibit id="gothic_statue" position={[-4.5, 0, -3]} height={2.8} rotationY={0.6} />
      <Exhibit id="horse_statue_01" position={[4.5, 0, -4]} height={2.2} rotationY={-0.8} />
      <Exhibit id="marble_bust_01" position={[-4.5, 0, -length + 3]} height={1.2} rotationY={0.9} />
      <Exhibit id="gothic_statue" position={[4.5, 0, -length + 3]} height={2.6} rotationY={-0.5} />
    </group>
  );
}

/**
 * The library's far end (local to MARGIN_ORIGIN): its back wall with an arch onto a landing of grey
 * statues, and the gallery's front door of volcanic stone at the landing's end, glowing within.
 */
export function GalleryArchAtLibrary({ arch }: { arch: Vec3 }) {
  return (
    <group position={arch}>
      <StoneDoorway width={20.8} height={11} wall={MAT.academyStoneDark} />
      <group position={[0, 0, -0.75]}>
        <StatueLanding length={13} />
        <group position={[0, 0, -13.75]}>
          <StoneDoorway width={14} height={9} wall={MAT.volcanicStone} trim={MAT.academyStoneDark} />
          <GalleryFoyer />
        </group>
      </group>
    </group>
  );
}

/** Just inside the gallery's door, as seen from the library: a firelit hall with its red runner. */
function GalleryFoyer() {
  return (
    <group position={[0, 0, -0.75]}>
      <Slab x={[-5, 5]} y={[-0.3, 0]} z={[-10, 0]} material={MAT.marble} />
      <Box position={[0, 0.02, -5]} size={[2.4, 0.04, 10]} material={MAT.burgundyLeather} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Slab x={s < 0 ? [-5.6, -5] : [5, 5.6]} y={[0, 8]} z={[-10, 0]} material={MAT.volcanicStone} />
          <Fire position={[s * 4.4, 2.6, -5]} size={0.8} count={2} spread={0.2} smoke={false} kind="warm" light={s < 0} />
        </group>
      ))}
      <Slab x={[-5.6, 5.6]} y={[8, 8.6]} z={[-10, 0]} material={MAT.volcanicStone} />
      <Slab x={[-5.6, 5.6]} y={[0, 8.6]} z={[-10.6, -10]} material={MAT.volcanicStone} />
      <Exhibit id="marble_bust_01" position={[0, 0, -8.6]} height={1.3} rotationY={0} />
      <pointLight position={[0, 4, -4]} color="#ff9a5a" intensity={24} distance={14} decay={1.6} />
    </group>
  );
}

/**
 * The gallery's front (local to GALLERY3_ORIGIN, door at z 22.5): the volcanic-stone wall and door we
 * saw from the library, with its statue landing behind us.
 */
export function GalleryFrontDoor({ door }: { door: Vec3 }) {
  return (
    <group position={door}>
      <group rotation={[0, Math.PI, 0]}>
        <StoneDoorway width={35} height={12} wall={MAT.volcanicStone} trim={MAT.academyStoneDark} />
        <group position={[0, 0, -0.75]}>
          <StatueLanding length={10} />
        </group>
      </group>
    </group>
  );
}

/** The library's front door (local to MARGIN_ORIGIN): its wall at z 18.5, the bookshelf hall behind us. */
export function LibraryFrontDoor({ door }: { door: Vec3 }) {
  return (
    <group position={door}>
      <group rotation={[0, Math.PI, 0]}>
        <StoneDoorway width={20.8} height={11} wall={MAT.academyStoneDark} />
        <group position={[0, 0, -0.75]}>
          <BookHall length={8} seed={170} />
        </group>
      </group>
    </group>
  );
}
