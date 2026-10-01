/** PLACEHOLDER Whispering Library (§14A.19). Local coordinates; see src/level/areas/library.ts. */
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import type { Group, Object3D } from 'three';
import { LIBRARY_ORIGIN } from '../../level/areas/library';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { Bookshelf, Box, Column, Rug, Slab, StandingLamp, WallLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { WardAnchor, useBeatIndex } from '../props';
import { Prop } from '../Prop';
import { useParts } from '../partsGlb';

const WAKE_BEAT = beatIndexOf('library-grimoire-wakes');

export function LibraryScene() {
  return (
    <group name="library" position={LIBRARY_ORIGIN}>
      <MergeStatic>
      <Shell />
      <Shelves />
      </MergeStatic>
      <ReadingArea />
      <Mosaic />
      <CirclingBooks />
      <Grimoire />
      <WardAnchor position={[8, 0, -26]} encounterId="library-anchor" theme="library" />
      {[[-6, -4], [6, -4], [-6, -26], [6, -20]].map(([x = 0, z = 0]) => (
        <StandingLamp key={`${x}${z}`} position={[x, 0, z]} light />
      ))}
    </group>
  );
}

function Shell() {
  return (
    <group>
      <Slab x={[-12, 12]} y={[-0.1, 0]} z={[-32, 2]} material={MAT.lightOak} shadows={false} />
      <Rug position={[0, 0, -14]} size={[6, 22]} />
      <Slab x={[-12.5, -12]} y={[0, 10]} z={[-32, 2]} material={MAT.academyStone} />
      <Slab x={[12, 12.5]} y={[0, 10]} z={[-32, 2]} material={MAT.academyStone} />
      <Slab x={[-12.5, 12.5]} y={[0, 10]} z={[-32.5, -32]} material={MAT.academyStone} />
      <Slab x={[-12.5, 12.5]} y={[0, 10]} z={[2, 2.5]} material={MAT.academyStone} />
      <Slab x={[-12.5, 12.5]} y={[10, 10.4]} z={[-32.5, 2.5]} material={MAT.darkOak} />
      {[-28, -20, -12, -4].map((z) => (
        <Slab key={z} x={[-12, 12]} y={[9.4, 10]} z={[z - 0.25, z + 0.25]} material={MAT.darkOak} />
      ))}
      {/* Upper galleries */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Slab x={s < 0 ? [-12, -8.6] : [8.6, 12]} y={[4.4, 4.6]} z={[-32, 2]} material={MAT.darkOak} />
          <Slab x={s < 0 ? [-8.7, -8.6] : [8.6, 8.7]} y={[4.6, 5.6]} z={[-32, 2]} material={MAT.agedBrass} shadows={false} />
          {[-28, -20, -12, -4].map((z) => (
            <Column key={z} position={[8.8 * s, 0, z]} height={4.4} radius={0.22} material={MAT.darkOak} />
          ))}
        </group>
      ))}
      {[-8, -3, 3, 8].map((x) => (
        <WindowPane key={x} position={[x, 6.5, -31.95]} size={[2.2, 5]} />
      ))}
      {/* Dust light beams through the end windows */}
      {[-3, 3].map((x) => (
        <mesh key={x} position={[x, 4.5, -26]} rotation={[0.45, 0, 0]}>
          <cylinderGeometry args={[0.8, 1.6, 9, 16, 1, true]} />
          <meshBasicMaterial color="#ffe2a8" transparent opacity={0.05} depthWrite={false} />
        </mesh>
      ))}
      <Slab x={[-1.4, 1.4]} y={[0, 3.6]} z={[1.95, 2]} material={MAT.darkOak} />
      {[-4, -12, -20, -28].map((z) => (
        <group key={z}>
          <WallLamp position={[-11.95, 3.2, z]} rotationY={Math.PI / 2} />
          <WallLamp position={[11.95, 3.2, z]} rotationY={-Math.PI / 2} />
        </group>
      ))}
      <pointLight position={[0, 7, -14]} color="#ffd6a0" intensity={30} distance={30} decay={2} />
    </group>
  );
}

function Shelves() {
  return (
    <group>
      {[-28, -22, -16, -10, -4].map((z, i) => (
        <group key={z}>
          <Bookshelf position={[-11.75, 0, z]} rotationY={Math.PI / 2} width={4.6} height={4.2} shelves={6} seed={i + 1} />
          <Bookshelf position={[11.75, 0, z]} rotationY={-Math.PI / 2} width={4.6} height={4.2} shelves={6} seed={i + 11} />
          <Bookshelf position={[-11.75, 4.6, z]} rotationY={Math.PI / 2} width={4.6} height={3.6} shelves={5} seed={i + 21} />
          <Bookshelf position={[11.75, 4.6, z]} rotationY={-Math.PI / 2} width={4.6} height={3.6} shelves={5} seed={i + 31} />
        </group>
      ))}
      {/* Free-standing stacks create readable aisles, never a maze. */}
      {[-6.5, 6.5].map((x) =>
        [-10, -16].map((z, i) => <Bookshelf key={`${x}${z}`} position={[x, 0, z]} rotationY={x < 0 ? Math.PI / 2 : -Math.PI / 2} width={3.4} height={3} shelves={4} seed={i + (x < 0 ? 41 : 51)} />),
      )}
    </group>
  );
}

function ReadingArea() {
  return (
    <group>
      {[-3.2, 3.2].map((x) => (
        <group key={x} position={[x, 0, -7]}>
          <Prop id="WoodenTable_01" position={[0, 0, 0]} height={0.78} rotationY={Math.PI / 2} />
          {[-0.7, 0.7].map((dz) => (
            <Prop key={dz} id="WoodenChair_01" position={[x < 0 ? 0.75 : -0.75, 0, dz]} height={0.95} rotationY={x < 0 ? -Math.PI / 2 : Math.PI / 2} />
          ))}
          <Prop id="vintage_oil_lamp" position={[0.1, 0.78, 0.5]} height={0.38} />
          <Prop id="book_encyclopedia_set_01" position={[0, 0.78, -0.45]} height={0.28} rotationY={x} />
        </group>
      ))}
      <group position={[0, 0, -20]}>
        <mesh position={[0, 0.5, 0]} material={MAT.academyStoneDark} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.9, 1.0, 8]} />
        </mesh>
        <mesh position={[0, 1.02, 0]} material={MAT.agedBrass}>
          <cylinderGeometry args={[0.8, 0.8, 0.06, 32]} />
        </mesh>
      </group>
      <Prop id="lantern_chandelier_01" position={[0, 6.4, -7]} height={2.2} shadows={false} />
      <Prop id="lantern_chandelier_01" position={[0, 6.4, -24]} height={2.2} shadows={false} />
      <Prop id="GothicCabinet_01" position={[-7.6, 0, -29.5]} height={2.2} />
      <Prop id="vintage_grandfather_clock_01" position={[7.4, 0, -2.8]} height={2.3} rotationY={-Math.PI / 2} />
      <Prop id="brass_candleholders" position={[3.2, 0.78, -6.6]} height={0.35} />
      <Prop id="mantel_clock_01" position={[-3.2, 0.78, -6.3]} height={0.3} />
    </group>
  );
}

function Mosaic() {
  return (
    <group position={[-11.9, 2.6, -13]} rotation={[0, Math.PI / 2, 0]}>
      <Box position={[0, 0, -0.02]} size={[3.4, 2.6, 0.05]} material={MAT.agedBrass} />
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[3.2, 2.4]} />
        <meshStandardMaterial color="#21365e" roughness={0.6} />
      </mesh>
      {/* Warden silhouette shielding the academy from a storm. */}
      <mesh position={[0, -0.1, 0.03]} scale={[1, 1.3, 1]}>
        <circleGeometry args={[0.45, 24]} />
        <meshStandardMaterial color="#e2dccd" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.65, 0.03]}>
        <circleGeometry args={[0.2, 20]} />
        <meshStandardMaterial color="#e2dccd" roughness={0.5} />
      </mesh>
      {[-0.8, 0, 0.8].map((x) => (
        <mesh key={x} position={[x, 0.95, 0.035]} material={MAT.wardGold}>
          <circleGeometry args={[0.09, 12]} />
        </mesh>
      ))}
      <mesh position={[0, -0.1, 0.031]} material={MAT.wardBlue}>
        <torusGeometry args={[0.95, 0.03, 8, 48, Math.PI]} />
      </mesh>
    </group>
  );
}

function CirclingBooks() {
  const ref = useRef<Group>(null);
  const books = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, r: 4 + (i % 3) * 0.8, y: 6 + (i % 2) * 0.7 })), []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <group ref={ref} position={[0, 0, -13]}>
      {books.map((b, i) => (
        <group key={i} position={[Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r]} rotation={[0.3, -b.a, 0.4]}>
          <Box position={[0, 0, 0]} size={[0.32, 0.06, 0.42]} material={i % 2 ? MAT.greenLeather : MAT.burgundyLeather} />
        </group>
      ))}
    </group>
  );
}

interface GrimoireRig {
  coverL: Object3D | null;
  coverR: Object3D | null;
  /** Code stand-in covers rotate about Y; GLB covers about Z. */
  axis: 'y' | 'z';
  /** Hinge direction (the GLB is flipped so the open pages face up). */
  sign: 1 | -1;
}

/** The Great Grimoire (§14A.8): dormant and chained until it wakes; settles back afterwards. */
function Grimoire() {
  const root = useRef<Group>(null);
  const chains = useRef<Group>(null);
  const rig = useRef<GrimoireRig>({ coverL: null, coverR: null, axis: 'z', sign: -1 });
  const beat = useBeatIndex();
  const time = useRef(0);
  const hover = useRef(0);
  const open = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    const run = getRun();
    const settled = run?.flags.has('grimoire-settled') ?? false;
    const awake = beat >= WAKE_BEAT && !settled;
    const opened = run?.encounterProgress('grimoire-g1').complete ?? false;
    const k = 1 - Math.exp(-1.5 * Math.min(dt, 0.1));
    hover.current += ((awake ? 1 : 0) - hover.current) * k;
    const h = hover.current;
    if (root.current) {
      root.current.position.y = 1.08 + h * (1.3 + Math.sin(time.current * 1.1) * 0.12);
      root.current.rotation.x = h * 1.25;
      root.current.rotation.z = Math.sin(time.current * 0.7) * 0.05 * h;
    }
    // Heavy covers: slow to open, with a little strain while clasped (§14A.8 hinge weight).
    const goal = settled ? 0.25 : opened ? Math.sin(time.current * 2.2) * 0.06 : awake ? 1.35 + Math.sin(time.current * 14) * 0.03 : 1.45;
    open.current += (goal - open.current) * (1 - Math.exp(-2 * Math.min(dt, 0.1)));
    const { coverL, coverR, axis, sign } = rig.current;
    if (coverL) coverL.rotation[axis] = sign * open.current;
    if (coverR) coverR.rotation[axis] = -sign * open.current;
    if (chains.current) chains.current.visible = beat < WAKE_BEAT;
  });
  return (
    <group position={[0, 0, -20]}>
      <group ref={root} position={[0, 1.08, 0]}>
        <Suspense fallback={<GrimoireFallback rig={rig} />}>
          <GrimoireGLB rig={rig} />
        </Suspense>
      </group>
      <group ref={chains}>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 1.15, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.steel}>
            <torusGeometry args={[0.25, 0.025, 6, 20]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function GrimoireGLB({ rig }: { rig: RefObject<GrimoireRig> }) {
  const parts = useParts('grimoire');
  useEffect(() => {
    rig.current.coverL = parts.get('Cover_L') ?? null;
    rig.current.coverR = parts.get('Cover_R') ?? null;
    rig.current.axis = 'z';
    rig.current.sign = -1;
  }, [parts, rig]);
  // Modelled covers-up; flipped about the spine so the open pages face the player.
  return <primitive object={parts.root} rotation={[0, 0, Math.PI]} />;
}

function GrimoireFallback({ rig }: { rig: RefObject<GrimoireRig> }) {
  const coverL = useRef<Group>(null);
  const coverR = useRef<Group>(null);
  useEffect(() => {
    rig.current.coverL = coverL.current;
    rig.current.coverR = coverR.current;
    rig.current.axis = 'y';
    rig.current.sign = 1;
  }, [rig]);
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <Box position={[0, 0, 0.09]} size={[1.0, 1.3, 0.16]} material={MAT.parchment} />
      <group ref={coverL} position={[0, 0, 0.18]}>
        <Box position={[-0.52, 0, 0]} size={[1.04, 1.36, 0.05]} material={MAT.burgundyLeather} />
      </group>
      <group ref={coverR} position={[0, 0, 0.18]}>
        <Box position={[0.52, 0, 0]} size={[1.04, 1.36, 0.05]} material={MAT.burgundyLeather} />
      </group>
    </group>
  );
}
