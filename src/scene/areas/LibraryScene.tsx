/** PLACEHOLDER Whispering Library (§14A.19). Local coordinates; see src/level/areas/library.ts. */
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import type { Group, Object3D } from 'three';
import { LIBRARY_ORIGIN } from '../../level/areas/library';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { Bookshelf, Box, Column, KitModel, Rug, Slab, StandingLamp, WallLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { WardAnchor, useBeatIndex } from '../props';
import { Prop } from '../Prop';
import { useParts } from '../partsGlb';

const WAKE_BEAT = beatIndexOf('library-grimoire-wakes');
const G1_BEAT = beatIndexOf('grimoire-g1');

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
          {Array.from({ length: 17 }, (_, k) => (
            <KitModel key={k} id="balustrade_2m" position={[8.65 * s, 4.6, 2 - 2 * k]} rotationY={Math.PI / 2} />
          ))}
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
        <KitModel id="pedestal_grimoire" />
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
      <Suspense fallback={null}>
        {books.map((b, i) => (
          // Flying tangentially around the room, banked into the turn.
          <group key={i} position={[Math.cos(b.a) * b.r, b.y, Math.sin(b.a) * b.r]} rotation={[0, -b.a, 0.35]}>
            <FlyingBook phase={i * 1.7} tint={CIRCLE_TINTS[i % CIRCLE_TINTS.length] ?? '#6e1f28'} />
          </group>
        ))}
      </Suspense>
    </group>
  );
}

const CIRCLE_TINTS = ['#6e2228', '#23412f', '#2a3f6e', '#5a3620', '#3c2436'];

/** A runaway-book model drifting with slow wing-beats (decorative, not a target). */
function FlyingBook({ phase, tint }: { phase: number; tint: string }) {
  const parts = useParts('runaway_book', false);
  const coverL = parts.get('Cover_L');
  const coverR = parts.get('Cover_R');
  useEffect(() => {
    for (const m of parts.materials('Leather')) m.color.set(tint).multiplyScalar(1.7);
  }, [parts, tint]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const flap = 0.35 + Math.sin(t * 3.2) * 0.3;
    if (coverL) coverL.rotation.z = flap;
    if (coverR) coverR.rotation.z = -flap;
    parts.root.position.y = Math.sin(t * 3.2 - 0.6) * 0.04;
  });
  return <primitive object={parts.root} />;
}

interface GrimoireRig {
  /** Front half (hinged at the spine top, modelled open). */
  front: Object3D | null;
  spine: Object3D | null;
  clasps: Object3D[];
  /** Shifts the book so the closed volume sits centred on the pedestal. */
  centre: Object3D | null;
}

/**
 * The Great Grimoire (§14A.8): closed and chained on its pedestal until it wakes; rises, turns its
 * cover to the player and strains against its clasps; once the clasps break the heavy front board
 * swings open; afterwards it closes and settles back.
 */
function Grimoire() {
  const root = useRef<Group>(null);
  const chains = useRef<Group>(null);
  const rig = useRef<GrimoireRig>({ front: null, spine: null, clasps: [], centre: null });
  const beat = useBeatIndex();
  const time = useRef(0);
  const hover = useRef(0);
  const closed = useRef(1);
  useFrame((_, dt) => {
    time.current += dt;
    const t = time.current;
    const run = getRun();
    const settled = run?.flags.has('grimoire-settled') ?? false;
    const awake = beat >= WAKE_BEAT && !settled;
    const opened = (run?.encounterProgress('grimoire-g1').complete ?? false) || beat > G1_BEAT;
    const k = 1 - Math.exp(-1.5 * Math.min(dt, 0.1));
    hover.current += ((awake ? 1 : 0) - hover.current) * k;
    const h = hover.current;
    if (root.current) {
      root.current.position.y = 1.06 + h * (1.25 + Math.sin(t * 1.1) * 0.1);
      // Tilt the cover (or the open pages) towards the player while airborne.
      root.current.rotation.x = h * 1.15;
      root.current.rotation.z = Math.sin(t * 0.7) * 0.05 * h;
    }
    // Heavy board: slow to swing; strains against the clasps while bound; pages flutter when open.
    const goal = settled || !awake ? 1 : opened ? 0.08 + Math.sin(t * 2.2) * 0.04 : 0.985 - Math.abs(Math.sin(t * 9)) * 0.02;
    closed.current += (goal - closed.current) * (1 - Math.exp(-2.2 * Math.min(dt, 0.1)));
    const c = closed.current;
    const { front, spine, clasps, centre } = rig.current;
    if (front) front.rotation.z = Math.PI * c;
    if (spine) spine.scale.set(0.2 + 0.8 * c, 0.55 + 0.45 * c, 1);
    if (centre) centre.position.x = 0.5 * c;
    for (const clasp of clasps) clasp.visible = !opened || settled;
    if (chains.current) chains.current.visible = beat < WAKE_BEAT;
  });
  return (
    <group position={[0, 0, -20]}>
      <group ref={root} position={[0, 1.06, 0]}>
        <Suspense fallback={null}>
          <GrimoireGLB rig={rig} />
        </Suspense>
      </group>
      <group ref={chains}>
        {[-0.35, 0.35].map((z) => (
          <mesh key={z} position={[0, 1.24, z]} rotation={[0, Math.PI / 2, 0]} material={MAT.steel}>
            <torusGeometry args={[0.62, 0.022, 8, 40]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function GrimoireGLB({ rig }: { rig: RefObject<GrimoireRig> }) {
  const parts = useParts('grimoire');
  const centre = useRef<Group>(null);
  useEffect(() => {
    rig.current.front = parts.get('Cover_R') ?? null;
    rig.current.spine = parts.get('Spine') ?? null;
    rig.current.clasps = ['Clasp_0', 'Clasp_1'].map((n) => parts.get(n)).filter((o): o is Object3D => !!o);
    rig.current.centre = centre.current;
  }, [parts, rig]);
  return (
    <group ref={centre}>
      <primitive object={parts.root} />
    </group>
  );
}
