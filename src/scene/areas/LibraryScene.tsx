/** PLACEHOLDER Whispering Library. Local coordinates; see src/level/areas/library.ts. */
import { LightBeam } from '../glow';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import type { Group, Object3D } from 'three';
import { INKWELL_POSITION, LIBRARY_ORIGIN } from '../../level/areas/library';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { Bookshelf, Column, KitModel, Rug, Slab, StandingLamp, WallLamp, WindowPane } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { WardAnchor, useBeatIndex } from '../props';
import { Prop } from '../Prop';
import { useParts } from '../partsGlb';
import { useKitGlow } from '../kitGlb';
import { PoolLight, VirtualLight } from '../LightPool';

const WAKE_BEAT = beatIndexOf('library-grimoire-wakes');
/** Fractions of the intro beat where each chain snaps (match the sparks in library.ts). */
const CHAIN_SNAP = [0.12, 0.26];
const CHAINS_SNAPPED = 0.3;
const TOPPLE_X = 6.5;
const TOPPLE_Z = -16;
const TOPPLE_SEC = 1.3;
const TOPPLE_DELAY_SEC = 0.15;
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
      <TopplingShelf />
      <Inkwell />
      {[[-6, -4], [6, -4], [-6, -26], [6, -20]].map(([x = 0, z = 0]) => (
        <LibraryLamp key={`${x}${z}`} position={[x, 0, z]} />
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
        // Rendered shafts angled down from the windows to the floor (were faint solid cones).
        <group key={x} position={[x, 8.6, -30.6]} rotation={[Math.PI - 0.77, 0, 0]}>
          <LightBeam height={11.5} width={2.6} color="#ffe2a8" intensity={0.22} />
        </group>
      ))}
      <Slab x={[-1.4, 1.4]} y={[0, 3.6]} z={[1.95, 2]} material={MAT.darkOak} />
      {[-4, -12, -20, -28].map((z) => (
        <group key={z}>
          <WallLamp position={[-11.95, 3.2, z]} rotationY={Math.PI / 2} />
          <WallLamp position={[11.95, 3.2, z]} rotationY={-Math.PI / 2} />
        </group>
      ))}
      <PoolLight position={[0, 7, -14]} color="#ffd6a0" intensity={30} distance={30} decay={2} />
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
        [-10, -16]
          // The shelf at (6.5, -16) topples during the book fight (TopplingShelf).
          .filter((z) => !(x === TOPPLE_X && z === TOPPLE_Z))
          .map((z, i) => <Bookshelf key={`${x}${z}`} position={[x, 0, z]} rotationY={x < 0 ? Math.PI / 2 : -Math.PI / 2} width={3.4} height={3} shelves={4} seed={i + (x < 0 ? 41 : 51)} />),
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

/**
 * The clue mosaic (lib-mosaic): the Warden below the arc of the sky-ward, holding it shut, and a man with
 * a glowing pen locked outside it. A tall panel that fits the gap between the wall shelves (it was wide
 * and hidden behind them): a Flux-painted tile mosaic (mosaic.py) set in a brass frame (kit_scene.py).
 */
function Mosaic() {
  return (
    <group position={[-11.45, 2.55, -13]} rotation={[0, Math.PI / 2, 0]}>
      <KitModel id="mosaic_clue" castShadow={false} />
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
 * The Great Grimoire: closed and chained on its pedestal until it wakes; rises, turns its
 * cover to the player and strains against its two clasps; each clasp word springs one open; once both
 * are gone the heavy front board swings open; afterwards it closes and settles back.
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
    // The chains snap a moment into the intro; only then does the Grimoire rise.
    const wakeProgress = beat === WAKE_BEAT ? (run?.beatProgress() ?? 0) : beat > WAKE_BEAT ? 1 : 0;
    const awake = wakeProgress > CHAINS_SNAPPED && !settled;
    const opened = (run?.encounterProgress('grimoire-g1').complete ?? false) || beat > G1_BEAT;
    // Rises heavily; the final sentence blasts it back down onto the pedestal fast.
    const k = 1 - Math.exp(-(settled ? 7 : 1.5) * Math.min(dt, 0.1));
    hover.current += ((awake ? 1 : 0) - hover.current) * k;
    const h = hover.current;
    if (root.current) {
      root.current.position.y = 1.06 + h * (1.25 + Math.sin(t * 1.1) * 0.1);
      // Tilt the cover (or the open pages) towards the player while airborne.
      root.current.rotation.x = h * 1.15;
      // While its clasps hold, it strains against them in a fast shiver of the whole book.
      const strain = awake && !opened ? Math.sin(t * 38) * 0.012 + Math.sin(t * 23) * 0.008 : 0;
      root.current.rotation.z = Math.sin(t * 0.7) * 0.05 * h + strain;
    }
    // Heavy board: held shut while the clasps hold (lifting it hid the straps); pages flutter when open.
    const goal = settled || !awake || !opened ? 1 : 0.08 + Math.sin(t * 2.2) * 0.04;
    closed.current += (goal - closed.current) * (1 - Math.exp(-2.2 * Math.min(dt, 0.1)));
    const c = closed.current;
    const { front, spine, clasps, centre } = rig.current;
    if (front) front.rotation.z = Math.PI * c;
    if (spine) spine.scale.set(0.2 + 0.8 * c, 0.55 + 0.45 * c, 1);
    if (centre) centre.position.x = 0.5 * c;
    // The model's own small clasp tabs give way to the two big strap clasps (GrimoireClasp).
    for (const clasp of clasps) clasp.visible = false;
    if (chains.current) {
      chains.current.children.forEach((chain, i) => {
        chain.visible = wakeProgress < (CHAIN_SNAP[i] ?? 1);
      });
    }
  });
  return (
    <group position={[0, 0, -20]}>
      <group ref={root} position={[0, 1.06, 0]}>
        <Suspense fallback={null}>
          <GrimoireGLB rig={rig} />
          {GRIMOIRE_CLASPS.map((c) => (
            <GrimoireClasp key={c.flag} z={c.z} flag={c.flag} />
          ))}
        </Suspense>
      </group>
      <group ref={chains}>
        {/* Forged chain loops (kit_scene.py grimoire_chain) */}
        {[-0.35, 0.35].map((z) => (
          <group key={z} position={[0, 1.24, z]} rotation={[0, Math.PI / 2, 0]}>
            <KitModel id="grimoire_chain" castShadow={false} />
          </group>
        ))}
      </group>
    </group>
  );
}

/**
 * The Grimoire's clasps (owner, 2026-10-24: "can the clasp be on the grimoire to show that it's
 * bounded"): straps over the fore-edge (x -0.51 in the closed book's frame) at each end of the cover.
 * Each clasp's word (library.ts grimoire-g1) sets its flag and the strap springs open and flies off.
 */
const GRIMOIRE_CLASPS = [
  // The first word breaks the upper clasp (the end tilted away as the book faces us), then the lower.
  { z: -0.38, flag: 'grimoire-clasp-1' },
  { z: 0.38, flag: 'grimoire-clasp-2' },
] as const;
const CLASP_OPEN_SEC = 0.9;

function GrimoireClasp({ z, flag }: { z: number; flag: string }) {
  const hinge = useRef<Group>(null);
  const { root, glow } = useKitGlow('grimoire_clasp', ['claspGlow']);
  const since = useRef(-1);
  useFrame((state, dt) => {
    const g = hinge.current;
    if (!g) return;
    const run = getRun();
    // Only Level 1 binds the book; later levels reuse this room with the Grimoire open (owner, 2026-10-24).
    if (run?.level.id !== 'level-1') {
      g.visible = false;
      return;
    }
    const broken = run.flags.has(flag);
    if (!broken) {
      since.current = -1;
      g.visible = true;
      g.rotation.z = 0;
      g.position.set(-0.51, 0, z);
      // The moonstone throbs as the book strains against it.
      for (const m of glow) m.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 6 + z * 5) * 0.6;
      return;
    }
    since.current = since.current < 0 ? 0 : since.current + Math.min(dt, 0.1);
    const u = since.current / CLASP_OPEN_SEC;
    g.visible = u < 1;
    // Springs open about its hinge, then is flung clear of the book, falling away.
    g.rotation.z = Math.min(1, u * 4) * 2.4 + u * 3;
    g.position.set(-0.51 - u * 1.6, -u * u * 1.4, z + Math.sign(z) * u * 0.6);
    for (const m of glow) m.emissiveIntensity = 4 * (1 - u);
  });
  return (
    <group ref={hinge}>
      <primitive object={root} />
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

/**
 * The free-standing shelf at (6.5, -16) topples in slow motion when the third book wave starts
 * (the books then spill out as debris). It falls away from the camera's aisle and stays down.
 */
function TopplingShelf() {
  const pivot = useRef<Group>(null);
  const fallTime = useRef(-1);
  useFrame((_, dt) => {
    const g = pivot.current;
    const run = getRun();
    if (!g || !run) return;
    const fallen = run.encounterWave('library-l1') >= 2;
    if (!fallen) {
      fallTime.current = -1;
      g.rotation.z = 0;
      return;
    }
    if (fallTime.current < 0) fallTime.current = run.encounterWave('library-l1') > 2 ? TOPPLE_SEC + TOPPLE_DELAY_SEC : 0;
    fallTime.current += Math.min(dt, 0.1);
    const u = Math.min(1, Math.max(0, (fallTime.current - TOPPLE_DELAY_SEC) / TOPPLE_SEC));
    // Slow tip, then gravity takes over (ease-in), with a small bounce on landing.
    const tip = u < 1 ? u * u * u : 1;
    const bounce = u >= 1 ? Math.max(0, Math.sin((fallTime.current - TOPPLE_DELAY_SEC - TOPPLE_SEC) * 18) * 0.04 * Math.exp(-(fallTime.current - TOPPLE_DELAY_SEC - TOPPLE_SEC) * 6)) : 0;
    g.rotation.z = -(Math.PI / 2 - 0.12) * tip + bounce;
  });
  // Pivot on the outer bottom edge so it falls outward, away from the reading-room aisle.
  return (
    <group position={[TOPPLE_X + 0.25, 0, TOPPLE_Z]}>
      <group ref={pivot}>
        <Bookshelf position={[-0.25, 0, 0]} rotationY={-Math.PI / 2} width={3.4} height={3} shelves={4} seed={52} />
      </group>
    </group>
  );
}

/** The overturned inkwell the ink wisps erupt from: its glass bottle, cork and spilled ink. */
function Inkwell() {
  const [x, , z] = INKWELL_POSITION;
  return (
    <group name="inkwell" position={[x - LIBRARY_ORIGIN[0], 0.01, z - LIBRARY_ORIGIN[2]]} rotation={[0, 0.6, 0]}>
      <KitModel id="inkwell" />
    </group>
  );
}

const WAKE_DARK = 0.12;

/** Standing lamps: the Grimoire's roar blows them down to embers until it is calmed. */
function LibraryLamp({ position }: { position: [number, number, number] }) {
  const light = useRef<VirtualLight>(null);
  const beat = useBeatIndex();
  useFrame((_, dt) => {
    const l = light.current;
    const run = getRun();
    if (!l || !run) return;
    const settled = run.flags.has('grimoire-settled');
    const roared = beat > WAKE_BEAT || (beat === WAKE_BEAT && run.beatProgress() > 0.55);
    const goal = roared && !settled ? 7 * WAKE_DARK : 7;
    l.intensity += (goal - l.intensity) * (1 - Math.exp(-(goal < l.intensity ? 12 : 1.5) * Math.min(dt, 0.1)));
  });
  return (
    <group>
      <StandingLamp position={position} />
      <PoolLight ref={light} position={[position[0], 2.5, position[2]]} color="#ffc98a" intensity={7} distance={9} decay={2} />
    </group>
  );
}
