/**
 * Level 3 areas: the Blank, a scorched realm of grey ash under a red sky,
 * and the Unwriter's Cinder Citadel. Path words draw the route in coloured ink; restored objects lose
 * their fire and regain colour. PLACEHOLDER geometry is kit-built; mobs and bosses are AI-pipeline models.
 */
import { GuardianOrbs, UnwriterQuill } from '../bossFx';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, useState, type ReactNode } from 'react';
import { AdditiveBlending, Box3, BufferGeometry, CanvasTexture, DoubleSide, Float32BufferAttribute, MeshStandardMaterial, PlaneGeometry, SpriteMaterial, SRGBColorSpace, Vector3, type Group, type Sprite } from 'three';
import { THRONE_ORIGIN, UNWRITER } from '../../level/areas3/finale';
import { pipWorld } from '../../player/PipCompanion';
import { DEER, FLOCK, SHORE_CLIFF_Z, SHORE_ORIGIN, shorePathX, STONES, TORTOISE, WOOD_ORIGIN } from '../../level/areas3/journey1';
import { GORGE_TOP_Z, GORGE_X, ShoreVista } from './ShoreVista';
import { FALLS_ORIGIN, GALLERY3_ORIGIN, GALLERY_ARCH, JOURNAL, LIBRARY_DOOR, MARGIN_ORIGIN, PERFECT_WARDEN, RAFT_BEACHED_BEATS, RAFT_BEATS, RAFT_HOLD_BEATS, RAFT_WAITING, SLIDE_PITCH, SLIDE_SECTION_LENGTH, SLIDE_SECTIONS, WALKWAY_LENGTH, WALKWAYS } from '../../level/areas3/journey2';
import { CITADEL_ORIGIN, FLIGHTS, flightChunk, FORGE_LINES, FORGE_ORIGIN, GALLEONS, SEA_ORIGIN, SHIP_BEATS } from '../../level/areas3/journey3';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { useRunStore } from '../../state/runStore';
import { Fire, Restorable } from '../Fire';
import { FireRope, linePath, ringPath } from '../FireRope';
import { Bookshelf, Box, KitModel, Slab } from '../kit';
import { fxSprite } from '../fxSprites';
import { CastleDoor } from '../CastleDoor';
import { MAT } from '../materials';
import { Mira, StaticWarden } from '../props';
import { Carried } from '../areas2/Level2Scenes';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { Prop, propUrl } from '../Prop';
import { useGLTF } from '@react-three/drei';
import { DeadForest } from '../DeadForest';
import { GroundMist } from '../GroundMist';
import { moltenInk, useMoltenFlow } from '../molten';
import { glowTexture, LightBeam } from '../glow';
import { useKit, useKitGlow } from '../kitGlb';
import { worldGroundTiles, worldPlane } from '../surfaces';
import { CinderCitadel } from '../CinderCitadel';
import { surface } from '../surfaceTextures';
import { SceneCreature } from '../areas2/common';
import { CreatureModel } from '../../enemies/CreatureModel';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import { GalleryDressing, MarginDressing } from '../areas2/dressing';
import { GalleryArchAtLibrary, GalleryFrontDoor, LibraryDoorAtFalls, LibraryFrontDoor } from './passages';
import { PoolLight, VirtualLight } from '../LightPool';

const ashDarkFlat = new MeshStandardMaterial({ color: '#2e2a28', roughness: 0.95 });
/** Molten ink: cooled plates with glowing seams, flowing (see molten.ts). The ink stream in the forge stays a plain glow. */
const redInk = moltenInk();
/** Braziers and stakes in the Blank are black iron plate, not the academy's steel. */
const IRON = { darkSteel: MAT.ironPlate };
const ironSeam = new MeshStandardMaterial({ color: '#2a0804', roughness: 0.4, emissive: '#ff3a10', emissiveIntensity: 2 });
/** Glowing blue ink: the edges of everything the apprentice writes into being. */
const inkGlow = new MeshStandardMaterial({ color: '#9ec4ff', roughness: 0.3, emissive: '#3a7cff', emissiveIntensity: 2.4 });

/**
 * A written path (owner: the blue slabs were "plain rectangles of solid colour"): wooden planks laid
 * across it with small gaps, between two rails of glowing blue ink. Centred on its origin, `length`
 * along Z.
 */
function WrittenPlanks({ width, length }: { width: number; length: number }) {
  const count = Math.max(2, Math.floor(length / 0.42));
  const step = length / count;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <Box key={i} position={[((i * 7) % 3 - 1) * 0.02, 0, -length / 2 + step * (i + 0.5)]} size={[width * (0.96 + ((i * 5) % 4) * 0.01), 0.12, step * 0.86]} material={MAT.lightOak} />
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 + 0.04), 0.07, 0]} material={inkGlow}>
          <boxGeometry args={[0.07, 0.07, length]} />
        </mesh>
      ))}
    </group>
  );
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/**
 * A section of route written in by a path word: faint grey paper until its flag is set, then it
 * draws in, in bright ink (a quick grow from the near edge).
 */
function Written({ flag, children }: { flag: string; children: ReactNode }) {
  const group = useRef<Group>(null);
  const level = useRef(0);
  useFrame((_, delta) => {
    const on = getRun()?.flags.has(flag) ?? false;
    level.current += ((on ? 1 : 0) - level.current) * (1 - Math.exp(-6 * Math.min(delta, 0.1)));
    const g = group.current;
    if (!g) return;
    g.visible = level.current > 0.02;
    g.scale.set(1, 1, Math.max(0.001, level.current));
  });
  return <group ref={group}>{children}</group>;
}

/** Towers of the Cinder Citadel (AI-pipeline prop): black iron and charred stone with red windows. */
function CitadelTowers({ spots }: { spots: readonly (readonly [number, number, number, number])[] }) {
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        {spots.map(([x, y, z, h], i) => (
          <Prop key={i} id="citadel_tower" position={[x, y, z]} height={h} rotationY={i * 1.3} shadows={false} />
        ))}
      </Suspense>
    </ModelBoundary>
  );
}

/** Scorched volcanic rocks with glowing cracks (AI-pipeline prop), scattered in varied sizes. */
function AshRocks({ spots }: { spots: readonly (readonly [number, number, number])[] }) {
  return (
    <ModelBoundary fallback={null}>
      <Suspense fallback={null}>
        {spots.map(([x, z, h], i) => (
          <Prop key={i} id="ash_rock" position={[x, -0.3, z]} height={h} rotationY={i * 1.7} />
        ))}
      </Suspense>
    </ModelBoundary>
  );
}

/** A charred dead tree (AI-pipeline prop), varied by rotation and height; procedural until it loads. */
function BurntTree(props: { position: Vec3; height?: number; seed?: number }) {
  const fallback = <ProceduralTree {...props} />;
  const h = props.height ?? 9;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Prop id="dead_tree" position={props.position} height={h} rotationY={(props.seed ?? 1) * 2.39} />
        {(props.seed ?? 1) % 3 === 0 && <Fire position={[props.position[0], props.position[1] + h * 0.55, props.position[2]]} size={1.4} count={2} spread={0.8} />}
      </Suspense>
    </ModelBoundary>
  );
}

/** PLACEHOLDER burnt tree: trunk, a few broken branches, embers in the bark. */
function ProceduralTree({ position, height = 9, seed = 1 }: { position: Vec3; height?: number; seed?: number }) {
  const branches = useMemo(() => [0, 1, 2].map((i) => ({ y: height * (0.45 + i * 0.15), a: seed * 2.1 + i * 2.3, l: 1.6 + ((seed + i) % 3) * 0.7 })), [height, seed]);
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} material={ashDarkFlat} castShadow>
        <cylinderGeometry args={[0.18, 0.42, height, 8]} />
      </mesh>
      {branches.map((b, i) => (
        <mesh key={i} position={[Math.cos(b.a) * b.l * 0.5, b.y, Math.sin(b.a) * b.l * 0.5]} rotation={[Math.sin(b.a) * 0.9, 0, -Math.cos(b.a) * 0.9]} material={ashDarkFlat}>
          <cylinderGeometry args={[0.05, 0.12, b.l, 6]} />
        </mesh>
      ))}
      <mesh position={[0, height * 0.3, 0.3]} material={ironSeam}>
        <boxGeometry args={[0.06, height * 0.3, 0.06]} />
      </mesh>
      {seed % 3 === 0 && <Fire position={[0, height * 0.7, 0]} size={1.4} count={2} spread={0.6} />}
    </group>
  );
}

function AshGround({ x, z, y = 0 }: { x: readonly [number, number]; z: readonly [number, number]; y?: number }) {
  // Photo-scanned burnt earth (owner: "the ground looks untextured"). The top is built of 96 m tiles, not
  // one slab: the plain is up to 3 km wide, and over one huge triangle the texture swam (worldGroundTiles).
  const [x0, x1] = [Math.min(...x), Math.max(...x)];
  const [z0, z1] = [Math.min(...z), Math.max(...z)];
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, y, (z0 + z1) / 2]} geometry={worldGroundTiles(x1 - x0, z1 - z0)} material={MAT.burntGround} receiveShadow />
      {/* Its edges (seen across the river and the gorge), a little below the top */}
      <Slab x={[x0, x1]} y={[y - 0.3, y - 0.01]} z={[z0, z0 + 0.02]} material={MAT.burntGround} />
      <Slab x={[x0, x1]} y={[y - 0.3, y - 0.01]} z={[z1 - 0.02, z1]} material={MAT.burntGround} />
      <Slab x={[x0, x0 + 0.02]} y={[y - 0.3, y - 0.01]} z={[z0, z1]} material={MAT.burntGround} />
      <Slab x={[x1 - 0.02, x1]} y={[y - 0.3, y - 0.01]} z={[z0, z1]} material={MAT.burntGround} />
    </group>
  );
}

// ---------- Rift Shore ----------

export function ShoreScene() {
  useMoltenFlow();
  return (
    <group position={SHORE_ORIGIN}>
      {/* The ash plain runs out to the fog, forested all the way (owner, 2026-10-23) */}
      <AshGround x={[-1500, 1500]} z={[-4, 400]} />
      <AshGround x={[-1500, 1500]} z={[GORGE_TOP_Z, -16]} />
      {/* Either side of the inkfall gorge (ShoreVista builds the ground the gorge is cut through) */}
      <AshGround x={[-1500, GORGE_X[0]]} z={[SHORE_CLIFF_Z, GORGE_TOP_Z]} />
      <AshGround x={[GORGE_X[1], 1500]} z={[SHORE_CLIFF_Z, GORGE_TOP_Z]} />
      {/* The river of molten red ink */}
      <mesh position={[0, -0.25, -10]} material={redInk} geometry={worldGroundTiles(3000, 12, 90)} />
      {/* Stepping stones written across the ink */}
      {STONES.map((s, i) => (
        <Written key={i} flag={`l3-stone-${i + 1}`}>
          <KitModel id="stepping_stone" position={sub(s, SHORE_ORIGIN)} rotationY={i * 1.9} />
        </Written>
      ))}
      {/* Burnt shell, boat and lantern on the beach, repainted when restored */}
      <Restorable flag="l3-shell" fire={{ position: [-5, 0.3, -26], size: 0.8, count: 2, spread: 0.5 }}>
        <KitModel id="beach_shell" position={[-5, 0, -26]} rotationY={0.6} />
      </Restorable>
      <Restorable flag="l3-boat" fire={{ position: [7, 0.4, -28], size: 1.2, count: 3, spread: 1.6 }}>
        <KitModel id="beach_boat" position={[7, 0.1, -28]} rotationY={0.15} />
      </Restorable>
      <Restorable flag="l3-lantern" fire={{ position: [-8, 1, -22], size: 0.6, count: 2, spread: 0.3 }}>
        <group name="beach-lantern">
          <KitModel id="beach_lantern" position={[-8, 0, -22]} rotationY={0.3} />
        </group>
      </Restorable>
      {[[-20, -40], [14, -50], [-34, -30], [30, -36], [-12, -60]].map(([x, z], i) => (
        <BurntTree key={i} position={[x ?? 0, 0, z ?? 0]} height={7 + i} seed={i + 1} />
      ))}
      {/* The edge of the Cinderwood: the same dense burnt forest starts here (owner: the shore looked
          like a bare wasteland next to the forest that follows). */}
      <Suspense fallback={null}>
        <DeadForest pathX={shorePathX} clear={14} depth={90} zRange={[-24, -200]} density={2.2} avoid={[[-5, -26, 3], [7, -28, 3], [-8, -22, 2]]} seed={5} />
        <DeadForest pathX={() => 0} clear={18} depth={68} zRange={[130, 10]} density={2.2} seed={9} />
        {/* Forest from side to side and out to the horizon, the path still clear down the middle, so the
            view from the Warden's palm is dense barren forest everywhere (owner, 2026-10-23). Lighter trees
            further out: 500 triangles in the middle belt, 150 in the far fill. */}
        <DeadForest model="dead_tree_lod2" pathX={() => 0} clear={86} depth={130} zRange={[130, -2]} density={1.6} seed={13} />
        <DeadForest model="dead_tree_lod2" pathX={shorePathX} clear={86} depth={130} zRange={[-18, -256]} density={1.6} seed={17} />
        <DeadForest model="dead_tree_lod2" pathX={shorePathX} clear={14} depth={72} zRange={[-200, SHORE_CLIFF_Z + 6]} density={1.6} avoid={[[shorePathX(SHORE_CLIFF_Z), SHORE_CLIFF_Z + 20, 14]]} seed={19} />
        <DeadForest model="dead_tree_lod3" pathX={shorePathX} clear={86} depth={520} zRange={[-256, SHORE_CLIFF_Z + 6]} density={1.5} seed={23} />
        <DeadForest model="dead_tree_lod3" pathX={() => 0} clear={216} depth={390} zRange={[130, -2]} density={1.5} seed={29} />
        <DeadForest model="dead_tree_lod3" pathX={shorePathX} clear={216} depth={390} zRange={[-18, -256]} density={1.5} seed={31} />
      </Suspense>
      {/* Low mist over the forest, seen from the Warden's palm: the ground hidden, the treetops above it */}
      <GroundMist x={[-1500, 1500]} z={[SHORE_CLIFF_Z, 400]} clear={14} pathX={shorePathX} fadeFar={30} opacity={0.5} />
      <ShoreVista />
      <AshRocks spots={[[-9, -20, 2.2], [11, -24, 3], [-16, -36, 4], [18, -44, 2.6], [-4, -52, 1.8], [24, -20, 5], [-28, -12, 4.5], [6, 14, 1.6], [-14, 12, 2.4]]} />
      <StaticWarden position={[6, 0, 2]} scale={1.1} rotationY={-0.5} />
      <Mira position={[-2, 0, 3]} rotationY={0.3} />
      {[[-40, -70], [36, -76], [0, -90]].map(([x, z], i) => (
        <Fire key={`f${i}`} position={[x ?? 0, 0, z ?? 0]} size={7} count={3} spread={8} />
      ))}
    </group>
  );
}

// ---------- Cinderwood ----------

function DeerFallback() {
  return (
    <>
      <Box position={[0, 1.1, 0]} size={[0.5, 0.6, 1.4]} material={MAT.fur} />
      <Box position={[0, 1.6, 0.75]} size={[0.3, 0.6, 0.3]} material={MAT.fur} />
      <Box position={[0, 1.9, 0.95]} size={[0.25, 0.25, 0.45]} material={MAT.fur} />
      {[[-0.18, 0.5], [0.18, 0.5], [-0.18, -0.5], [0.18, -0.5]].map(([x, z], i) => (
        <Box key={i} position={[x ?? 0, 0.45, z ?? 0]} size={[0.1, 0.9, 0.1]} material={MAT.fur} />
      ))}
    </>
  );
}

/** The Cinderwood path's centre line (local x at local z): straight ahead, nudged right for the ride. */
const CINDERWOOD_PATH_X = (z: number) => (z < -30 ? 3 : 1);

export function CinderwoodScene() {
  const deer = sub(DEER, WOOD_ORIGIN);
  const tortoise = sub(TORTOISE, WOOD_ORIGIN);
  return (
    <>
    {/* Riding on the tortoise's shell: it sits below the camera, head ahead (owner: "why did we wake
        the tortoise just to run?" — it carries us through the fire). */}
    <Carried beats={TORTOISE_RIDE_BEATS} drop={7.2}>
      {/* Seated towards the back of the shell, so the dome and the head are ahead and below */}
      <group position={[0, 0, -2.6]}>
        <GiantTortoise />
      </group>
    </Carried>
    <group position={WOOD_ORIGIN}>
      <AshGround x={[-160, 160]} z={[-200, 80]} />
      {Array.from({ length: 26 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        return <BurntTree key={i} position={[side * (5 + ((i * 7) % 14)), 0, 10 - i * 4.5]} height={8 + ((i * 5) % 6)} seed={i + 2} />;
      })}
      <AshRocks spots={[[-7, -8, 1.6], [8, -22, 2.4], [-9, -44, 3], [10, -58, 2], [-6, -74, 2.8], [7, -92, 3.4]]} />
      {/* A dense barren forest on both sides of the path, all the way to the tortoise ride's end */}
      <Suspense fallback={null}>
        <DeadForest pathX={CINDERWOOD_PATH_X} clear={7} depth={70} zRange={[40, -230]} density={2.4} avoid={[[3, -40, 9], [-2.2, -8, 3]]} />
      </Suspense>
      {/* The half-drawn deer: grey until its words restore it (AI-pipeline model; boxes until it loads) */}
      <Restorable flag="l3-deer-free" burning={false} erased>
        <group position={deer}>
          <ModelBoundary fallback={<DeerFallback />}>
            <Suspense fallback={<DeerFallback />}>
              <Prop id="erased_deer" position={[0, 0, 0]} height={2.1} rotationY={Math.PI / 2} />
            </Suspense>
          </ModelBoundary>
        </group>
      </Restorable>
      {/* The great tortoise, half rubbed out until its words restore it; it then carries the party */}
      <OnBeatsL3 hide={TORTOISE_RIDE_BEATS}>
        <Restorable flag="l3-tortoise-free" burning={false} erased>
          <group position={tortoise}>
            <GiantTortoise />
          </group>
        </Restorable>
      </OnBeatsL3>
      {/* The flock: half-erased birds over the path; each word restores one, which flies off in colour */}
      {FLOCK.map((at, i) => (
        <FlockBird key={i} position={sub(at, WOOD_ORIGIN)} flag={i < 2 ? `l3-bird-${i + 1}` : 'l3-flock-free'} seed={i} />
      ))}
      {/* The wall of fire the fireproof tortoise walks straight through */}
      {[-52, -58].map((z) => (
        <Fire key={z} position={[3, 0, z]} size={3.4} count={6} spread={12} light={z === -52} />
      ))}
      {[[-6, -30], [8, -60], [-10, -80]].map(([x, z], i) => (
        <Fire key={i} position={[x ?? 0, 0, z ?? 0]} size={2} count={3} spread={2.4} light={i === 0} />
      ))}
    </group>
    </>
  );
}

const TORTOISE_RIDE_BEATS = ['l3-tortoise-ride'] as const;

const FLOCK_BIRD_URL = `${import.meta.env.BASE_URL}assets/creatures/flock_bird.glb`;

/**
 * One bird of the Cinderwood flock (owner, 2026-10-23: "what is wing and song shooting at?"): it hovers
 * half rubbed out, beating its wings, until its word restores it; then it turns and flies off up the path.
 */
function FlockBird({ position, flag, seed }: { position: Vec3; flag: string; seed: number }) {
  const fly = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const since = useRef(-1);
  useFrame((state, delta) => {
    const g = fly.current;
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    pose.current.time += dt;
    const restored = getRun()?.flags.has(flag) ?? false;
    if (restored && since.current < 0) since.current = 0;
    if (since.current >= 0) since.current += dt;
    // A slow hover while erased; it beats its wings and flies once its colour has swept back (about 1 s).
    pose.current.moving = since.current > 0.2;
    const t = state.clock.elapsedTime + seed * 1.7;
    const u = Math.max(0, since.current - 1.1);
    g.position.set(position[0] + Math.sin(t * 0.7) * 0.15 + Math.sin(u * 1.3 + seed) * u * 0.6, position[1] + Math.sin(t * 1.3) * 0.12 + u * u * 0.5 + u * 1.2, position[2] - u * u * 1.6);
    // It faces the camera while hovering, and turns to fly away up the path.
    g.rotation.y = Math.min(1, u * 0.8) * Math.PI;
    g.visible = u < 7;
  });
  return (
    <group ref={fly} position={position} scale={1.6}>
      <Restorable flag={flag} burning={false} erased>
        <ModelBoundary fallback={null}>
          <Suspense fallback={null}>
            <CreatureModel url={FLOCK_BIRD_URL} pose={pose} />
          </Suspense>
        </ModelBoundary>
      </Restorable>
    </group>
  );
}

/** The giant tortoise (AI-pipeline prop, 4.5 m tall, head along −Z); a mossy dome until it loads. */
function GiantTortoise() {
  const fallback = (
    <group>
      <mesh position={[0, 1.4, 0]} scale={[1, 0.6, 1.2]} material={MAT.moss}>
        <sphereGeometry args={[2.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Box position={[0, 1.2, -3.2]} size={[0.9, 0.8, 1.2]} material={MAT.bark} />
    </group>
  );
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Prop id="giant_tortoise" position={[0, 0, 0]} height={6} rotationY={TORTOISE_YAW} />
      </Suspense>
    </ModelBoundary>
  );
}
/** Turns the tortoise model (head along its +Z) so its head points along −Z. */
const TORTOISE_YAW = Math.PI;

/** Hides its children during the given beats. */
function OnBeatsL3({ hide, children }: { hide: readonly string[]; children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const id = getRun()?.director.currentBeat?.id ?? '';
    if (group.current) group.current.visible = !hide.includes(id);
  });
  return <group ref={group}>{children}</group>;
}

// ---------- Inkfall Cascades ----------

const RAFT_WAITING_BEATS = ['l3-if-enter', 'l3-raft-board'] as const;

/** Shows its children only during the given beats. */
function OnBeatsShow({ show, children }: { show: readonly string[]; children: ReactNode }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const id = getRun()?.director.currentBeat?.id ?? '';
    if (group.current) group.current.visible = show.includes(id);
  });
  return <group ref={group}>{children}</group>;
}

/** Handwriting across the raft page (owner: "a page with writings on it"). */
let writingTexture: CanvasTexture | null = null;
function pageWriting(): CanvasTexture {
  if (writingTexture) return writingTexture;
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 768;
  const g = c.getContext('2d');
  if (g) {
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = 'rgb(18, 26, 70)';
    g.font = 'bold italic 40px Georgia, serif';
    const lines = ['Once upon a time,', 'in a school of stars,', 'a young apprentice', 'learned that every', 'mistake is a step', 'towards something', 'wonderful. And when', 'the pages went blank,', 'they wrote them back,', 'one word at a time.'];
    lines.forEach((text, i) => {
      g.globalAlpha = i % 4 === 3 ? 0.45 : 1;
      g.fillText(text, 36 + (i % 2) * 10, 70 + i * 68);
    });
  }
  writingTexture = new CanvasTexture(c);
  writingTexture.colorSpace = SRGBColorSpace;
  return writingTexture;
}

/**
 * The raft: one giant page folded at its edges into a shallow tray (owner: the white box was a "plain
 * rectangle"), cream paper with faint ruled lines, its folds catching the firelight.
 */
/**
 * A generated wooden oar (AI pipeline `wooden_oar`; its long axis is along Z, turned here to X), scaled to `length` metres
 * (owner, 2026-10-08: "generate and render proper oars for the raft").
 */
function Oar({ length = 2.8 }: { length?: number }) {
  const { scene } = useGLTF(propUrl('wooden_oar'));
  const { object, scale } = useMemo(() => {
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    return { object: scene.clone(true), scale: length / Math.max(size.x, size.y, size.z, 1e-3) };
  }, [scene, length]);
  return <primitive object={object} scale={scale} rotation={[0, Math.PI / 2, 0]} />;
}

/** Two oars stowed along the raft's sides, blades towards the bow (they stuck up like boards). */
function RaftOars() {
  const fallback = (
    <mesh rotation={[0, 0, Math.PI / 2]} material={MAT.lightOak}>
      <cylinderGeometry args={[0.035, 0.035, 2.8, 10]} />
    </mesh>
  );
  return (
    <>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.95, 0.08, -0.4]} rotation={[0, Math.PI / 2 + side * 0.06, 0]}>
          <group>
            <ModelBoundary fallback={fallback}>
              <Suspense fallback={fallback}>
                <Oar />
              </Suspense>
            </ModelBoundary>
          </group>
        </group>
      ))}
    </>
  );
}

/** Mira at the raft's bow; she steps back to the left while the apprentice looks over the edge. */
function RaftMira() {
  const ref = useRef<Group>(null);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const id = getRun()?.director.currentBeat?.id ?? '';
    const aside = (RAFT_HOLD_BEATS as readonly string[]).includes(id);
    const k = 1 - Math.exp(-4 * Math.min(delta, 0.1));
    g.position.x += ((aside ? -0.85 : 0) - g.position.x) * k;
    g.position.z += ((aside ? -1.5 : -2.4) - g.position.z) * k;
  });
  return (
    <group ref={ref} position={[0, 0.06, -2.4]}>
      <Mira position={[0, 0, 0]} rotationY={Math.PI} />
    </group>
  );
}

function PaperRaft() {
  const sheet = useMemo(() => {
    const m = surface('paper', [3, 4.4], 1.2);
    const c = m.clone();
    c.color.set('#efe3c8');
    c.side = DoubleSide;
    c.roughness = 0.95;
    c.envMapIntensity = 0.15;
    return c;
  }, []);
  return (
    <group name="paper-raft" position={[0, 0, -0.8]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sheet} receiveShadow>
        <planeGeometry args={[2.6, 4]} />
      </mesh>
      {/* A low folded-up rim (the old tall flaps looked like giant planks from the bank) */}
      {/* (A plane stands upright by default: the side strips are laid along the raft first, then
          tilted up into a rim.) */}
      {[-1, 1].map((side) => (
        <group key={`s${side}`} position={[side * 1.3, 0.04, 0]} rotation={[0, 0, side * 1.1]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[side * 0.06, 0, 0]} material={sheet}>
            <planeGeometry args={[0.12, 4]} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((end) => (
        <mesh key={`e${end}`} position={[0, 0.05, end * 2.02]} rotation={[end * 0.45, 0, 0]} material={sheet}>
          <planeGeometry args={[2.6, 0.12]} />
        </mesh>
      ))}
      <RaftOars />
      {/* The writing on the page, then its faint ruled lines */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 3.6]} />
        <meshBasicMaterial map={pageWriting()} transparent depthWrite={false} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={`l${i}`} position={[0, 0.004, -1.7 + i * 0.42]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.3, 0.012]} />
          <meshBasicMaterial color="#8aa0c8" transparent opacity={0.45} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The frost bubble around the raft (owner: "won't we burn to death?"): once the apprentice types
 * "shield", a shimmering icy dome grows over the raft and keeps the burning ink off it.
 */
function FrostBubble({ flag }: { flag: string }) {
  const group = useRef<Group>(null);
  const grow = useRef(0);
  const shell = useMemo(() => new MeshStandardMaterial({ color: '#bfe8ff', emissive: '#4aa8ff', emissiveIntensity: 0.6, transparent: true, opacity: 0.16, roughness: 0.1, side: DoubleSide, depthWrite: false }), []);
  const rim = useMemo(() => new MeshStandardMaterial({ color: '#dff4ff', emissive: '#7ac8ff', emissiveIntensity: 1.6, transparent: true, opacity: 0.55, depthWrite: false }), []);
  useFrame((state, delta) => {
    const on = getRun()?.flags.has(flag) ?? false;
    grow.current += ((on ? 1 : 0) - grow.current) * (1 - Math.exp(-4 * Math.min(delta, 0.1)));
    const g = group.current;
    if (!g) return;
    g.visible = grow.current > 0.02;
    g.scale.setScalar(Math.max(0.001, grow.current));
    shell.opacity = 0.13 + Math.sin(state.clock.elapsedTime * 2.4) * 0.03;
  });
  return (
    <group ref={group} position={[0, 0, -1]}>
      <mesh material={shell} renderOrder={5}>
        <sphereGeometry args={[3.6, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={rim} renderOrder={5}>
        <torusGeometry args={[3.6, 0.05, 8, 64]} />
      </mesh>
    </group>
  );
}

export function InkfallScene() {
  useMoltenFlow();
  return (
    <>
      <group position={FALLS_ORIGIN}>
        {/* Terraced falls of molten red ink, stepping down along −Z */}
        {[[40, 0, -30], [30, -30, -60], [20, -60, -88], [0, -120, -150]].map(([y, z0, z1], i) => (
          <group key={i}>
            <Slab x={[-6, 6]} y={[(y ?? 0) - 0.4, (y ?? 0) - 0.2]} z={[z1 ?? 0, z0 ?? 0]} material={redInk} />
            <Slab x={[-14, -6]} y={[-5, (y ?? 0) + 2]} z={[z1 ?? 0, z0 ?? 0]} material={MAT.rockGround} />
            <Slab x={[6, 14]} y={[-5, (y ?? 0) + 2]} z={[z1 ?? 0, z0 ?? 0]} material={MAT.rockGround} />
            {[-1, 1].map((s) => (
              <Fire key={s} position={[s * 7, (y ?? 0) + 2, ((z0 ?? 0) + (z1 ?? 0)) / 2]} size={3} count={4} spread={14} light={i === 1 && s < 0} />
            ))}
          </group>
        ))}
        <AshRocks spots={[[-7.5, -12, 2.4], [7.5, -24, 2], [-7.8, -46, 2.8], [7.6, -70, 2.2], [-7.4, -100, 3], [7.8, -128, 2.6]]} />
        {/* The broken drop: written into a slide sloping down from the basin into the pool */}
        {SLIDE_SECTIONS.map((p, i) => (
          <Written key={i} flag={`l3-slide-${i + 1}`}>
            <group position={sub(p, FALLS_ORIGIN)} rotation={[-SLIDE_PITCH, 0, 0]}>
              <WrittenPlanks width={4} length={SLIDE_SECTION_LENGTH + 0.4} />
            </group>
          </Written>
        ))}
        {/* The rocky bank at the top, where the raft is boarded */}
        <Slab x={[-14, 14]} y={[-5, 40.3]} z={[1.3, 14]} material={MAT.rockGround} />
        {/* The way on: the library door in the cliff below the pool, the erased pages pouring in */}
        <LibraryDoorAtFalls door={sub(LIBRARY_DOOR, FALLS_ORIGIN)} ashoreBeat="l3-if-ashore" />
        {/* The raft run ashore while we walk to the door */}
        <OnBeatsShow show={RAFT_BEACHED_BEATS}>
          <group position={[0, 0.5, -148.5]} rotation={[0.06, 0.15, 0]}>
            <PaperRaft />
          </group>
        </OnBeatsShow>
      </group>
      {/* The page raft waiting on the ink with Mira aboard, until we hop on */}
      <OnBeatsShow show={RAFT_WAITING_BEATS}>
        <group position={RAFT_WAITING}>
          <PaperRaft />
          <Mira position={[0, 0.06, -2.4]} rotationY={0} />
        </group>
      </OnBeatsShow>
      <Carried beats={RAFT_BEATS} drop={1.1} hold={RAFT_HOLD_BEATS}>
        <PaperRaft />
        <RaftMira />
        <FrostBubble flag="l3-shield-on" />
      </Carried>
    </>
  );
}

// ---------- Margin Library ----------

export function MarginScene() {
  const tornado = useRef<Group>(null);
  useFrame((state) => {
    if (tornado.current) tornado.current.rotation.y = state.clock.elapsedTime * 2;
  });
  const journal = sub(JOURNAL, MARGIN_ORIGIN);
  return (
    <group position={MARGIN_ORIGIN}>
      <MarginDressing />
      {/* Its front door (we come in from the foot of the falls) and the arch on to the gallery */}
      <LibraryFrontDoor door={[0, 0, 18.5]} />
      <GalleryArchAtLibrary arch={sub(GALLERY_ARCH, MARGIN_ORIGIN)} />
      {/* Owner (2026-10-07): "why is there a library in the Unwriter's world? … needs a serious dose of
          realistic rendering". This is Asterfall's own library, erased: a roofless ruined hall of
          marble and stone under the fire sky, its bookcases full of blank books, broken by a chasm
          over burning ink that the apprentice writes walkways across. */}
      {/* Marble floors: the entrance (z 2…14) and the heart of the hall (z −24…−48) */}
      <Slab x={[-9, 9]} y={[-0.4, 0]} z={[2, 18]} material={MAT.marble} />
      <Slab x={[-9, 9]} y={[-0.4, 0]} z={[-48, -24]} material={MAT.marble} />
      {/* Broken edges of the floor at the chasm, and the burning ink far below */}
      <Slab x={[-9, 9]} y={[-3, -0.4]} z={[1.4, 2]} material={MAT.rockGround} />
      <Slab x={[-9, 9]} y={[-3, -0.4]} z={[-24, -23.4]} material={MAT.rockGround} />
      <mesh position={[0, -26, -11]} rotation={[-Math.PI / 2, 0, 0]} material={redInk} geometry={worldPlane(120, 80)} />
      {/* Rocky undersides: the two halves of the hall are floating ruins, torn out of the ground */}
      {([[9, 14], [-36, 24]] as const).map(([z, len]) => (
        <group key={z} position={[0, -0.4, z]}>
          <KitModel id="floating_rock" scale={[1, 1, len / 18]} castShadow={false} />
          {[-6, 0, 5].map((x, i) => (
            <KitModel key={x} id="rock_spike" position={[x, -7.5 - i * 2, (i - 1) * 2]} rotationY={i} castShadow={false} />
          ))}
        </group>
      ))}
      {/* Broken arches still reaching across the chasm */}
      {[-6.5, 6.5].map((x) => (
        <group key={x} position={[x, 0, 1.6]}>
          {/* Voussoir arches broken off part-way (kit_scene.py) */}
          <group rotation={[0, Math.PI / 2, 0]} position={[0, 6, -6]}>
            <KitModel id="arch_broken_a" />
          </group>
          <group rotation={[0, -Math.PI / 2, Math.PI]} position={[0, 6, -19]}>
            <KitModel id="arch_broken_b" />
          </group>
        </group>
      ))}
      {/* Stone side walls lined with tall bookcases (only where there is floor) */}
      {([[2, 17.8], [-48, -24]] as const).map(([z0, z1], k) => (
        <group key={k}>
          {[-1, 1].map((side) => (
            <group key={side}>
              <Slab x={side < 0 ? [-10.4, -9.4] : [9.4, 10.4]} y={[0, 11]} z={[z0, z1]} material={MAT.academyStoneDark} />
              {Array.from({ length: Math.floor((z1 - z0) / 3.2) }, (_, i) => (
                <Bookshelf key={i} position={[side * 8.9, 0, z0 + 1.8 + i * 3.2]} rotationY={side < 0 ? Math.PI / 2 : -Math.PI / 2} width={3} height={6.5} shelves={7} seed={k * 40 + i + (side > 0 ? 20 : 0) + 60} />
              ))}
            </group>
          ))}
        </group>
      ))}
      {/* Columns down the hall, some broken off */}
      {[14, 8, -28, -36, -44].flatMap((z, i) =>
        [-1, 1].map((side) => {
          const h = (i + side) % 3 === 0 ? 4.5 : 10;
          return (
            <KitModel key={`${z}${side}`} id={h > 5 ? 'column_hall' : 'column_hall_broken'} position={[side * 7, 0, z]} rotationY={i + side} />
          );
        }),
      )}
      {/* Fallen columns and burning heaps of blank books */}
      <KitModel id="column_fallen" position={[-4.5, 0, 10]} rotationY={0.5} />
      <Fire position={[5, 0, 11]} size={1.6} count={3} spread={1.2} light />
      <Fire position={[-6, 0, -33]} size={1.8} count={3} spread={1.4} />
      {/* Chandeliers still hanging from broken beams, lit */}
      {[[0, 9, 9], [0, 9, -34]].map(([x, y, z], i) => (
        <group key={i} position={[x ?? 0, y ?? 0, z ?? 0]}>
          <Box position={[0, 2.4, 0]} size={[18, 0.5, 0.6]} material={MAT.darkOak} />
          <Prop id="lantern_chandelier_01" position={[0, -0.4, 0]} height={2.2} />
          <PoolLight color="#ffc070" intensity={14} distance={20} decay={1.6} />
        </group>
      ))}
      {/* Bookcases torn loose, floating upside down above the chasm */}
      {Array.from({ length: 6 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        return (
          <group key={i} position={[side * (5 + (i % 3)), 9 + (i % 3) * 3, -2 - Math.floor(i / 2) * 7]} rotation={[0.3 * side, i, Math.PI + 0.2]}>
            <Bookshelf position={[0, 0, 0]} rotationY={0} width={3} height={5} shelves={5} seed={i + 90} />
          </group>
        );
      })}
      {WALKWAYS.map((p, i) => (
        <Written key={i} flag={`l3-walk-${i + 1}`}>
          <group position={sub(p, MARGIN_ORIGIN)}>
            <WrittenPlanks width={3} length={WALKWAY_LENGTH + 0.3} />
          </group>
        </Written>
      ))}
      {/* Corvane's journal on its lectern, burning into a tornado of pages */}
      <group position={journal}>
        {/* Corvane's journal on its carved lectern (AI-pipeline prop) */}
        <ModelBoundary fallback={<Box position={[0, -1, 0]} size={[0.8, 2, 0.8]} material={MAT.darkOak} />}>
          <Suspense fallback={<Box position={[0, -1, 0]} size={[0.8, 2, 0.8]} material={MAT.darkOak} />}>
            <Prop id="journal_lectern" position={[0, -2, 0]} height={2.2} />
          </Suspense>
        </ModelBoundary>
        <group ref={tornado}>
          {[0, 1, 2, 3].map((i) => (
            <Fire key={i} position={[Math.cos(i * 1.6) * (0.6 + i * 0.4), i * 2, Math.sin(i * 1.6) * (0.6 + i * 0.4)]} size={2 + i * 0.5} count={3} spread={1} light={i === 0} />
          ))}
        </group>
      </group>
    </group>
  );
}

// ---------- Gallery of Unfinished Things ----------

/** A marble plinth for a stolen exhibit. */
function Plinth({ position, size = [3.4, 0.6, 3.4] }: { position: Vec3; size?: [number, number, number] }) {
  return (
    <>
      <Box position={[position[0], 0.3, position[2]]} size={size} material={MAT.marble} />
      <Box position={[position[0], 0.66, position[2]]} size={[size[0] - 0.3, 0.12, size[2] - 0.3]} material={MAT.marble} />
    </>
  );
}

/**
 * The Gallery of Unfinished Things (owner, 2026-10-07: Level 3 visuals): a roofless museum hall of
 * black volcanic stone under the fire sky, where the Unwriter keeps the treasures he stole from
 * Asterfall on marble plinths, smouldering until the apprentice restores them.
 */
export function Gallery3Scene() {
  return (
    <group position={GALLERY3_ORIGIN}>
      <GalleryDressing />
      {/* Its front door, with the statue landing we came along from the library behind us */}
      <GalleryFrontDoor door={[0, 0, 22.5]} />
      <Slab x={[-16, 16]} y={[-0.3, 0]} z={[-26, 22]} material={MAT.marble} />
      {/* Back wall and buttressed side walls of volcanic stone, with columns between the bays */}
      <CollapsingWall />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab x={side < 0 ? [-17.5, -16] : [16, 17.5]} y={[0, 12]} z={[-26, 22]} material={MAT.volcanicStone} />
          {[-20, -12, -4, 4, 12, 20].map((z) => (
            <group key={z} position={[side * 15.2, 0, z]}>
              <KitModel id="column_citadel" />
              {z % 8 === 4 && <Fire position={[side * -0.9, 4, 0]} size={0.7} count={2} spread={0.2} kind="warm" light={z === 4} />}
            </group>
          ))}
        </group>
      ))}
      {/* A long red runner down the hall */}
      <Box position={[0, 0.02, -2]} size={[3, 0.04, 40]} material={MAT.burgundyLeather} />
      {/* Stolen treasures: the courtyard fountain, the Bell Bridge bell, the Great Hall clock */}
      <Plinth position={[-6, 0, -2]} size={[4.4, 0.6, 4.4]} />
      <Restorable flag="l3-sculpt-1" fire={{ position: [-6, 1.6, -2], size: 1, count: 2, spread: 1.6 }}>
        <KitModel id="fountain_basin" position={[-6, 0.72, -2]} />
      </Restorable>
      <Plinth position={[6, 0, -4]} />
      <Restorable flag="l3-sculpt-2" fire={{ position: [6, 1.6, -4], size: 1, count: 2, spread: 1.6 }}>
        <group position={[6, 0.72, -4]}>
          {[-1.2, 1.2].map((x) => (
            <Box key={x} position={[x, 2, 0]} size={[0.25, 4, 0.25]} material={MAT.darkOak} />
          ))}
          <Box position={[0, 4, 0]} size={[2.9, 0.3, 0.35]} material={MAT.darkOak} />
          <Prop id="bronze_bell" position={[0, 1.3, 0]} height={2.4} />
        </group>
      </Restorable>
      <Plinth position={[-9, 0, -12]} size={[2.4, 0.6, 2.4]} />
      <Restorable flag="l3-sculpt-3" fire={{ position: [-9, 2.4, -12], size: 1.2, count: 3, spread: 1 }}>
        <Prop id="vintage_grandfather_clock_01" position={[-9, 0.72, -12]} height={3.2} rotationY={0.3} />
      </Restorable>
      <StaticWarden position={[5, 0, 6]} scale={1.1} rotationY={-2.6} />
      <SceneCreature
        file="perfect_warden.glb"
        position={sub(PERFECT_WARDEN, GALLERY3_ORIGIN)}
        scale={2}
        fromBeat="l3-perfect-warden"
        goneFlag="l3-perfect-warden-gone"
        fallback={<IronGiant height={7} />}
        // Owner (2026-10-19): it levitates and channels a ring of fire orbs, then blasts it.
        threat
        effects={(rig) => <GuardianOrbs rig={rig} />}
      />
    </group>
  );
}

const WALL_COLS = 8;
const WALL_ROWS = 4;
const WALL_FALL_SEC = 2.6;

/**
 * The gallery's back wall (owner, 2026-10-17): when the Perfect Guardian is beaten it cracks into
 * blocks that topple outwards and tumble down the cliff, opening the view of the paper sea far below
 * with the Cinder Citadel beyond, the way we go next.
 */
function CollapsingWall() {
  const blocks = useRef<(Group | null)[]>([]);
  const fallen = useRef(0);
  const [down, setDown] = useState(false);
  const seeds = useMemo(
    () =>
      Array.from({ length: WALL_COLS * WALL_ROWS }, (_, i) => {
        const col = i % WALL_COLS;
        const row = Math.floor(i / WALL_COLS);
        const h = (n: number) => {
          const x = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
          return x - Math.floor(x);
        };
        return { col, row, delay: 0.15 + (WALL_ROWS - 1 - row) * 0.12 + h(1) * 0.35, spin: (h(2) - 0.5) * 3, drift: (h(3) - 0.5) * 4, push: 2 + h(4) * 3 };
      }),
    [],
  );
  useFrame((_, delta) => {
    const gone = getRun()?.flags.has('l3-perfect-warden-gone') ?? false;
    if (!gone) {
      fallen.current = 0;
      if (down) setDown(false);
    } else {
      fallen.current += Math.min(delta, 0.1);
      if (!down) setDown(true);
    }
    const t = fallen.current;
    const w = 32 / WALL_COLS;
    const hgt = 15 / WALL_ROWS;
    blocks.current.forEach((b, i) => {
      const s = seeds[i];
      if (!b || !s) return;
      const u = Math.max(0, t - s.delay);
      // Each block tips outwards, then falls with gravity past the cliff edge and out of sight.
      b.position.set(-16 + w * (s.col + 0.5) + s.drift * u, hgt * (s.row + 0.5) - 4.9 * u * u, -27 - s.push * u * u * 0.8);
      b.rotation.set(-Math.min(1.4, u * 1.2) + s.spin * u * 0.2, s.spin * u * 0.3, s.spin * u * 0.4);
      b.visible = u < WALL_FALL_SEC;
    });
  });
  return (
    <group>
      {seeds.map((_, i) => (
        <group key={i} ref={(g) => void (blocks.current[i] = g)}>
          <Box position={[0, 0, 0]} size={[32 / WALL_COLS - 0.04, 15 / WALL_ROWS - 0.04, 2]} material={MAT.volcanicStone} />
        </group>
      ))}
      {/* Revealed beyond: the paper sea below the cliff and the Citadel on its far shore. */}
      {down && (
        <group position={[0, -9, -60]}>
          <PaperWaves />
          <group position={[0, -4, -260]}>
            <CinderCitadel />
          </group>
        </group>
      )}
    </group>
  );
}

/** PLACEHOLDER Perfect Warden / Foreman: a black-iron giant with fire burning through its seams. */
function IronGiant({ height }: { height: number }) {
  const s = height / 7;
  return (
    <group scale={s}>
      <Box position={[0, 4.2, 0]} size={[2.4, 3, 1.4]} material={MAT.ironPlate} />
      <Box position={[0, 4.4, 0.72]} size={[0.6, 0.8, 0.05]} material={ironSeam} />
      <Box position={[0, 6.3, 0]} size={[1, 1, 1]} material={MAT.ironPlate} />
      <Box position={[0, 6.3, 0.51]} size={[0.7, 0.1, 0.02]} material={ironSeam} />
      {[-1, 1].map((x) => (
        <group key={x}>
          <Box position={[x * 1.6, 4.2, 0]} size={[0.7, 2.8, 0.7]} material={MAT.ironPlate} />
          <Box position={[x * 0.6, 1.4, 0]} size={[0.8, 2.8, 0.8]} material={MAT.ironPlate} />
        </group>
      ))}
      <Fire position={[0, 4.6, 0.8]} size={1.2} count={2} spread={0.6} />
    </group>
  );
}

// ---------- Paper Sea ----------

function Galleon({ position, index }: { position: Vec3; index: number }) {
  const ship = useRef<Group>(null);
  const tilt = useRef(0);
  useFrame((state, delta) => {
    const down = getRun()?.flags.has(`l3-mast-${index}-down`) ?? false;
    tilt.current += ((down ? 1 : 0) - tilt.current) * (1 - Math.exp(-1.2 * Math.min(delta, 0.1)));
    const g = ship.current;
    if (!g) return;
    // Rides the swell; once its masts are brought down it lists hard and settles, burning.
    const t = state.clock.elapsedTime + index;
    g.rotation.z = Math.sin(t * 0.6) * 0.04 + tilt.current * 0.5 * (index % 2 ? 1 : -1);
    g.rotation.x = Math.sin(t * 0.45) * 0.03;
    g.position.y = Math.sin(t * 0.7) * 0.25 - tilt.current * 2.2;
  });
  const fallback = (
    <>
      <Box position={[0, 1, 0]} size={[5, 2.4, 14]} material={MAT.ironPlate} />
      <mesh position={[0, 8.2, 0]} material={MAT.darkOak}>
        <cylinderGeometry args={[0.2, 0.3, 12, 10]} />
      </mesh>
    </>
  );
  return (
    <group position={position}>
      <group ref={ship}>
        {/* Black galleon with torn sails (AI-pipeline prop), sitting down in the paper up to its lower hull
            (owner, 2026-10-20: ships floated on top of the water) */}
        <ModelBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Prop id="black_galleon" position={[0, -2.8, 0]} height={16} rotationY={index === 2 ? Math.PI : 0} />
          </Suspense>
        </ModelBoundary>
        <Fire position={[0, 1.4, 8]} size={2} count={3} spread={1} light={index === 2} />
        <Fire position={[0, 9, 0]} size={3} count={4} spread={5} fromFlag={`l3-mast-${index}-down`} />
      </group>
    </group>
  );
}

/** The Paper Sea: creased paper rolling in slow swells (vertex waves, updated each frame). */
function PaperWaves() {
  const { geometry, material } = useMemo(() => {
    const g = new PlaneGeometry(500, 500, 180, 180);
    g.rotateX(-Math.PI / 2);
    // Matte cream paper: no sky reflections (they turned it lavender), so the creases read by shading.
    const m = surface('paper', [500, 500], 10);
    m.color.set('#f0e2c8');
    m.roughness = 1;
    m.envMapIntensity = 0.1;
    return { geometry: g, material: m };
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.getAttribute('position').array), [geometry]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geometry.getAttribute('position');
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i] ?? 0;
      const z = base[i + 2] ?? 0;
      // Folded-paper waves: sharp crease ridges (1 − |sin|) rolling towards the ship, plus a slow swell,
      // so the creases catch the red light like real folded paper.
      const crease = 1 - Math.abs(Math.sin(z * 0.09 - t * 0.9 + Math.sin(x * 0.04) * 0.8));
      const cross = 1 - Math.abs(Math.sin(x * 0.07 + z * 0.02 + t * 0.5));
      arr[i + 1] = crease * crease * 1.1 + cross * 0.3 + Math.sin((x + z) * 0.025 + t * 0.4) * 0.45;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  // Crests stay below the ship's deck (they buried the hull before).
  return <mesh geometry={geometry} material={material} position={[0, -1.4, -100]} receiveShadow />;
}

/** Folded paper: matte cream, both faces, flat-shaded so every fold catches the light. */
const foldedPaper = new MeshStandardMaterial({ color: '#f2e6cf', roughness: 0.92, side: DoubleSide, flatShading: true, envMapIntensity: 0.2 });

/**
 * The prow of Mira's paper ship, folded like origami: a deck narrowing to a point 5 m ahead, hull
 * sides sloping down to the keel, raised gunwale folds, and the bow lantern on its post at the tip.
 * Local origin is the deck where the camera stands (the group is placed 1.9 m below the eye).
 */
function OrigamiProw() {
  const geometry = useMemo(() => {
    // Deck (centre ridge raised a little, like a fold), port and starboard hull sides down to the keel.
    const v = [
      // deck
      -1.6, 0, 1.5, 1.6, 0, 1.5, 0, 0.12, 1.5, 0, 0.18, -5.2,
      // keel points (below the waterline)
      0, -1.8, 1.5, 0, -1.4, -5.2,
    ];
    const idx = [
      0, 2, 3, 2, 1, 3, // deck halves meeting at the centre fold
      0, 3, 5, 0, 5, 4, // port side
      1, 4, 5, 1, 5, 3, // starboard side
    ];
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(v, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group>
      <mesh geometry={geometry} material={foldedPaper} castShadow />
      {/* Raised gunwale folds along both edges, meeting at the prow */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.8, 0.22, -1.85]} rotation={[0, side * Math.atan2(1.6, 6.7), 0]} material={foldedPaper}>
          <boxGeometry args={[0.06, 0.44, 6.9]} />
        </mesh>
      ))}
      {/* The bow lantern on a post at the very tip */}
      <KitModel id="lantern_post" position={[0, 0.05, -5.0]} castShadow={false} />
      <Prop id="wooden_lantern_01" position={[0, 1.37, -5.05]} height={0.45} />
      <PoolLight position={[0, 1.5, -5.0]} color="#ffc070" intensity={5} distance={9} decay={2} />
    </group>
  );
}

/**
 * A burnt boat wreck listing in the paper sea, still burning. Half sunk (owner, 2026-10-20: they sat on
 * top of the water; then "too low, I barely saw the tip of the hull"): the keel 1.5 m under the paper
 * (mean surface about −0.7 m), rolled a little onto one side and down by the bow, so about half the hull
 * shows above the paper with the broken mast and the flames.
 */
function BurningWreck() {
  const fallback = <Box position={[0, 0.6, 0]} size={[3, 1.2, 6]} rotation={[0, 0, 0.3]} material={ashDarkFlat} />;
  return (
    <group>
      <group position={[0, -1.5, 0]} rotation={[0.1, 0, 0.2]}>
        <ModelBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Prop id="burning_wreck" position={[0, 0, 0]} height={4.2} rotationY={0} />
          </Suspense>
        </ModelBoundary>
      </group>
      <Fire position={[0.2, 0.4, 0]} size={2.2} count={3} spread={2.4} />
    </group>
  );
}

export function SeaScene() {
  return (
    <>
      <group position={SEA_ORIGIN}>
        <PaperWaves />
        {GALLEONS.map((g, i) => (
          <Galleon key={i} position={sub(g, SEA_ORIGIN)} index={i + 1} />
        ))}
        {/* The Cinder Citadel rising from the far shore of the paper sea */}
        <group position={[0, -6, -340]}>
          <CinderCitadel />
        </group>
        {/* Burning wrecks of paper-sea boats drifting past (AI-pipeline `burning_wreck`; owner,
            2026-10-16: the burning blocks were unreadable) */}
        {[[-20, -30], [24, -60], [-30, -140], [18, -190], [-10, -240]].map(([x, z], i) => (
          <group key={i} position={[x ?? 0, 0, z ?? 0]} rotation={[0, i * 1.3, 0]}>
            <BurningWreck />
          </group>
        ))}
      </group>
      {/* Mira's folded paper ship: the camera stands at the bow, with the origami prow and its
          lantern ahead (owner: "you need to have the head of the boat in front of the player"). */}
      <Carried beats={SHIP_BEATS} drop={1.9}>
        <OrigamiProw />
        <Mira position={[1.0, -0.05, 0.6]} rotationY={-2.6} />
      </Carried>
    </>
  );
}

// ---------- Forge of Unwriting ----------

/** A giant forge hammer machine (AI-pipeline prop); each slam flares the anvil (light pulse and sparks). */
function Hammer({ position, phase }: { position: Vec3; phase: number }) {
  const glow = useRef<VirtualLight>(null);
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.5 + phase) % 1;
    // Slow lift, fast slam: the anvil flares right after each strike.
    const flare = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 0;
    if (glow.current) glow.current.intensity = 30 + flare * 260;
  });
  const fallback = (
    <>
      <Box position={[0, 8, 0]} size={[6, 4, 6]} material={MAT.ironPlate} />
      <Box position={[0, 1, 0]} size={[8, 2, 8]} material={MAT.ironPlate} />
    </>
  );
  return (
    <group position={position}>
      <ModelBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Prop id="forge_hammer" position={[0, 0, 0]} height={16} rotationY={phase * 3} />
        </Suspense>
      </ModelBoundary>
      <PoolLight ref={glow} position={[0, 6, 2]} color="#ff7a2a" intensity={30} distance={22} decay={2} />
      <Fire position={[0, 5.6, 0]} size={2} count={3} spread={2} kind="warm" />
    </group>
  );
}

export function ForgeScene() {
  useMoltenFlow();
  return (
    <group position={FORGE_ORIGIN}>
      {/* Buttresses and glowing window slits along both walls */}
      {[-1, 1].map((side) =>
        [-44, -32, -20, -8, 4, 16].map((z) => (
          <group key={`${side}${z}`}>
            <Box position={[side * 19.4, 13, z]} size={[1.4, 26, 1.8]} material={MAT.ironPlate} />
            <Box position={[side * 19.95, 9, z + 6]} size={[0.1, 4, 0.8]} material={ironSeam} />
          </group>
        )),
      )}
      {/* Volcanic stone floor and walls (were flat procedural iron) */}
      <Slab x={[-20, 20]} y={[-0.3, 0]} z={[-50, 20]} material={MAT.volcanicStone} />
      <Slab x={[-21, -20]} y={[0, 30]} z={[-50, 20]} material={MAT.volcanicStone} />
      <Slab x={[20, 21]} y={[0, 30]} z={[-50, 20]} material={MAT.volcanicStone} />
      {FORGE_LINES.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          {/* The line: a conveyor of moulds running towards the player, its furnace at the back */}
          <Box position={[0, 0.5, -16]} size={[2.4, 1, 20]} material={MAT.ironPlate} />
          {/* The line's furnace (AI-pipeline alchemy furnace), its mouth glowing until the line stops */}
          <ModelBoundary fallback={<Box position={[0, 4, -28]} size={[5, 8, 4]} material={MAT.volcanicStone} />}>
            <Suspense fallback={<Box position={[0, 4, -28]} size={[5, 8, 4]} material={MAT.volcanicStone} />}>
              <Prop id="alchemy_furnace" position={[0, 0, -28.5]} height={7.5} rotationY={Math.PI} />
            </Suspense>
          </ModelBoundary>
          <Fire position={[0, 1.6, -25.6]} size={3} count={4} spread={2} light untilFlag={`l3-line-${i + 1}`} />
          {/* Cauldron pouring molten red ink */}
          {/* Black iron cauldron of molten red ink (AI-pipeline prop) on a gantry */}
          <ModelBoundary fallback={null}>
            <Suspense fallback={null}>
              <Prop id="ink_cauldron" position={[0, 7.6, -22]} height={3.2} rotationY={i * 1.1} />
            </Suspense>
          </ModelBoundary>
          <Box position={[0, 7.4, -22]} size={[4.4, 0.3, 0.3]} material={MAT.ironPlate} />
          <Fire position={[0, 10.6, -22]} size={1} count={2} spread={1.4} />
          {/* Molten ink pouring from the cauldron: a rendered glowing stream (was a flat-glow rod) */}
          <group position={[0, 7.4, -22]} rotation={[Math.PI, 0, 0]}>
            <LightBeam height={6.6} width={0.55} color="#ff4a12" intensity={1.4} />
          </group>
          {[-1, 0, 1].map((k) => (
            <Box key={k} position={[k * 0.8, 1.2, -14]} size={[0.15, 1.2, 0.15]} material={MAT.agedBrass} />
          ))}
        </group>
      ))}
      <AshRocks spots={[[-17, 8, 1.6], [16, 10, 1.4], [-18, -20, 2], [17, -24, 2.2]]} />
      {/* The way out, up into the Citadel (the escape beat turns to it) */}
      <group position={[19.9, 0, -2]} rotation={[0, -Math.PI / 2, 0]}>
        <CastleDoor height={4} />
      </group>
      <Hammer position={[-12, 0, -38]} phase={0} />
      <Hammer position={[12, 0, -40]} phase={0.5} />
      {[-30, -10, 10].map((z) => (
        <Fire key={z} position={[-18, 0, z]} size={4} count={3} spread={2} />
      ))}
    </group>
  );
}

// ---------- Cinder Citadel ----------

const goldInk = new MeshStandardMaterial({ color: '#ffd27a', emissive: '#ffb030', emissiveIntensity: 2.4, roughness: 0.4 });

/** One written chunk of stairs: four volcanic stone steps, their front edges glowing with gold ink. */
function WrittenSteps({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {[0, 1, 2, 3].map((k) => (
        <group key={k} position={[0, -0.6 + k * 0.6, 1.2 - k * 0.8]}>
          <Box position={[0, 0, 0]} size={[4.4, 0.6, 0.85]} material={MAT.volcanicStone} />
          <Box position={[0, 0.27, 0.44]} size={[4.4, 0.07, 0.05]} material={goldInk} />
        </group>
      ))}
    </group>
  );
}

/**
 * The Cinder Citadel stairwell (owner, 2026-10-07: Level 3 visuals): a towering hall of black volcanic
 * stone open to the fire sky, with buttresses, glowing window slits and braziers on each landing. The
 * stairs were burned away; each word writes the next flight back in stone edged with gold ink, while a
 * wall of fire races up from below.
 */
export function CitadelScene() {
  const rising = useRef<Group>(null);
  useFrame((state) => {
    // The wall of fire racing up the stairwell, always just below the camera.
    if (rising.current) rising.current.position.y = state.camera.position.y - CITADEL_ORIGIN[1] - 7;
  });
  return (
    <group position={CITADEL_ORIGIN}>
      <Slab x={[-8, 8]} y={[-0.6, 0]} z={[-4, 8]} material={MAT.volcanicStone} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab x={side < 0 ? [-9.5, -8] : [8, 9.5]} y={[-10, 46]} z={[-62, 8]} material={MAT.volcanicStone} />
          {/* Buttresses and glowing window slits between them */}
          {[4, -6, -16, -26, -36, -46, -56].map((z, i) => (
            <group key={z}>
              <Box position={[side * 7.5, 18, z]} size={[1.2, 56, 1.6]} material={MAT.academyStoneDark} />
              <Box position={[side * 7.95, 4 + i * 6, z - 5]} size={[0.12, 3, 0.7]} material={ironSeam} />
            </group>
          ))}
        </group>
      ))}
      {FLIGHTS.map((f, n) =>
        [0, 1, 2].map((i) => (
          <Written key={`${n}-${i}`} flag={`l3-flight-${n + 1}-${i + 1}`}>
            <WrittenSteps position={[0, f[1] - CITADEL_ORIGIN[1] + flightChunk(i).dy, f[2] - CITADEL_ORIGIN[2] + flightChunk(i).dz]} />
          </Written>
        )),
      )}
      {/* Landings at the top of each flight, each with a brazier */}
      {[1, 2, 3].map((n) => (
        <group key={n}>
          <Box position={[0, n * 8 - 0.3, -n * 12 + 2]} size={[10, 0.6, 6]} material={MAT.volcanicStone} />
          <KitModel id="iron_brazier" position={[-4, n * 8, -n * 12 + 2]} rotationY={n} overrides={IRON} />
          <Fire position={[-4, n * 8 + 1.2, -n * 12 + 2]} size={1.1} count={3} spread={0.5} kind="warm" light={n === 2} />
        </group>
      ))}
      {/* The top landing, from the last flight right up to the doors (owner: there was a gap between
          the end of the stairs and the door) */}
      <Box position={[0, 31.7, -50]} size={[10, 0.6, 14]} material={MAT.volcanicStone} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <KitModel id="iron_brazier" position={[s * 4, 32, -50]} overrides={IRON} />
          <Fire position={[s * 4, 33.2, -50]} size={1.1} count={3} spread={0.5} kind="warm" />
        </group>
      ))}
      {/* The great doors to the Throne of Blank Pages, standing on the landing */}
      <Box position={[0, 36.5, -56.4]} size={[9, 10, 0.8]} material={MAT.volcanicStone} />
      <Prop id="large_castle_door" position={[0, 32, -55.9]} height={8} />
      <Fire position={[0, 33, -55]} size={3} count={4} spread={8} light />
      <group ref={rising}>
        <Fire position={[0, 0, -20]} size={6} count={6} spread={14} light />
      </group>
    </group>
  );
}

// ---------- Throne of Ash ----------

function ThroneBoxes() {
  return (
    <>
      <Box position={[0, 2.5, -14.5]} size={[4, 5, 1.2]} material={MAT.ironPlate} />
      <Box position={[0, 1, -13.5]} size={[3, 2, 2]} material={MAT.ironPlate} />
    </>
  );
}

/** The ropes of fire binding the Warden, tight round it: height, radius, tilt (radians), spin direction. */
const BINDINGS: readonly (readonly [number, number, number, number])[] = [
  [0.95, 0.42, 0.12, 1],
  [1.65, 0.5, -0.1, -1],
  [2.3, 0.66, 0.08, 1],
  [2.85, 0.62, -0.12, -1],
];
const STAKES: readonly Vec3[] = [[2.2, 0, 1.2], [-2, 0, 1.4], [0.4, 0, -2.3]];

/**
 * The Warden at the Throne, bound by the Unwriter (owner, 2026-10-20: it stood at the side doing
 * nothing; the burning rings looked like rubber bands). Ropes of fire (a Flux-painted burning rope,
 * `FireRope`) clamp it round the legs, waist, pinned arms and chest and pin it to stakes in the floor,
 * and it strains against them; they break when the Unwriter is sealed, and it carries everyone home.
 */
function BoundWarden({ position }: { position: Vec3 }) {
  const body = useRef<Group>(null);
  const rings = useRef<(Group | null)[]>([]);
  const bonds = useRef<Group>(null);
  const time = useRef(0);
  const loops = useMemo(() => BINDINGS.map(([, radius]) => ringPath(radius)), []);
  const chains = useMemo(() => STAKES.map((stake) => linePath(new Vector3(stake[0] * 0.2, 1.65, stake[2] * 0.2), new Vector3(stake[0], 0.55, stake[2]))), []);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const t = time.current;
    const free = getRun()?.flags.has('l3-unwriter-sealed') ?? false;
    if (bonds.current) bonds.current.visible = !free;
    if (free) {
      if (body.current) body.current.rotation.set(0, 0, 0);
      return;
    }
    // Straining against the bonds: a shudder, then a heave.
    if (body.current) {
      const heave = Math.max(0, Math.sin(t * 0.9)) ** 6;
      body.current.rotation.z = Math.sin(t * 23) * 0.012 + heave * 0.05 * Math.sin(t * 3);
      body.current.rotation.x = heave * -0.06;
    }
    rings.current.forEach((r, i) => {
      if (!r) return;
      const [, , tilt, dir] = BINDINGS[i] ?? [0, 1, 0, 1];
      r.rotation.set(tilt, t * 0.25 * dir, 0);
    });
  });
  return (
    <group position={position}>
      <group ref={body}>
        <StaticWarden position={[0, 0, 0]} scale={1.2} rotationY={-1.0} />
      </group>
      <group ref={bonds}>
        {BINDINGS.map(([y], i) => (
          <group key={i} position={[0, y, 0]} ref={(g) => void (rings.current[i] = g)}>
            <FireRope points={loops[i] ?? []} closed width={0.42} tile={0.9} speed={0.3 * ((BINDINGS[i]?.[3] ?? 1))} />
          </group>
        ))}
        <PoolLight position={[0, 1.9, 0.8]} color="#ff5a2a" intensity={40} distance={6} decay={2} />
        {chains.map((points, i) => (
          <FireRope key={i} points={points} width={0.36} tile={1.1} speed={0.4} />
        ))}
        {STAKES.map((p, i) => (
          <group key={i} position={p}>
            <KitModel id="iron_stake" rotationY={i} />
            <Fire position={[0, 0.6, 0]} size={0.6} count={1} spread={0.2} />
          </group>
        ))}
      </group>
    </group>
  );
}

/** PLACEHOLDER Unwriter: a towering figure in charred paper robes, a cracked white mask with a burning line. */
function UnwriterFallback() {
  const quill = useRef<Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (quill.current) quill.current.position.set(Math.cos(t * 0.8) * 2, 5.5 + Math.sin(t * 1.3) * 0.4, Math.sin(t * 0.8) * 1);
  });
  return (
    <group>
      <mesh position={[0, 2.2, 0]} material={ashDarkFlat} castShadow>
        <coneGeometry args={[1.3, 4.4, 20, 1, true]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={ironSeam}>
        <torusGeometry args={[1.3, 0.05, 6, 32]} />
      </mesh>
      <mesh position={[0, 4.7, 0]} material={MAT.marble}>
        <sphereGeometry args={[0.45, 20, 14]} />
      </mesh>
      <Box position={[0, 4.7, 0.44]} size={[0.06, 0.6, 0.04]} material={ironSeam} />
      <group ref={quill}>
        <mesh rotation={[0, 0, 0.5]} material={MAT.ironPlate}>
          <coneGeometry args={[0.12, 2.4, 8]} />
        </mesh>
        <Fire position={[0, 1, 0]} size={0.9} count={2} spread={0.3} />
      </group>
    </group>
  );
}

/**
 * The sealing (beat `l3-sealing`), as fractions of the beat: the book rises into the air, bursts open, drags the
 * Unwriter in, slams shut and drops to the floor. The route's fx cues are timed to the same marks.
 */
const SEAL = { rise: 0.15, open: [0.14, 0.24], pullFrom: 0.26, shut: 0.64, slam: [0.62, 0.66], fall: [0.86, 0.95] } as const;
/** Where the book hangs in the air and where it lands (throne-local; the route's TH_BOOK and TH_BOOK_FLOOR). */
const BOOK_AIR: Vec3 = [0, 1.1, -7.8];
const BOOK_FLOOR: Vec3 = [0, 0.2, -7.8];
/** The book's closed thickness (kit_scene.py: two boards and the page block) and its width. */
const BOOK_THICK = 0.35;
const BOOK_WIDTH = 1.2;
/** Shown larger than the model: a great tome, big enough to swallow him, low enough to keep him in view. */
const BOOK_SCALE = 1.7;

/** The sealing beat's progress: -1 before it, 0–1 during it, 2 after it. */
function sealProgress(): number {
  const run = getRun();
  if (!run) return -1;
  const at = run.level.beatIndexOf('l3-sealing');
  if (at < 0) return -1;
  const now = run.director.currentIndex;
  return now < at ? -1 : now > at ? 2 : run.beatProgress();
}

/** The Unwriter has gone into the book once its cover slams shut. */
const unwriterGone = () => sealProgress() >= SEAL.shut;

const ease = (u: number) => u * u * (3 - 2 * u);
const span = (p: number, [a, b]: readonly [number, number]) => Math.min(1, Math.max(0, (p - a) / (b - a)));

function SealingBook() {
  const root = useRef<Group>(null);
  const cover = useRef<Group>(null);
  const glowSprite = useRef<Sprite>(null);
  const lamp = useRef<VirtualLight>(null);
  const body = useKit('sealed_book_body');
  const { root: coverModel, glow } = useKitGlow('sealed_book_cover', ['sealGlow']);
  const light = useMemo(() => new SpriteMaterial({ map: glowTexture(), color: '#ffe0a0', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  useFrame((state) => {
    const g = root.current;
    if (!g) return;
    const p = sealProgress();
    g.visible = p >= 0;
    if (p < 0) return;
    const t = state.clock.elapsedTime;
    // Rise from the floor, spinning up to face the camera; hang trembling; fall and settle flat.
    const rise = p >= 1 ? 1 : ease(Math.min(1, p / SEAL.rise));
    const fall = p >= 1 ? 1 : ease(span(p, SEAL.fall));
    const air = rise * (1 - fall);
    const shake = p > SEAL.pullFrom && p < SEAL.shut ? Math.sin(t * 40) * 0.03 : 0;
    g.position.set(BOOK_FLOOR[0] + shake, BOOK_FLOOR[1] + (BOOK_AIR[1] - BOOK_FLOOR[1]) * air, BOOK_FLOOR[2]);
    // Hanging low in front with its pages tipped up to us, so he is seen dropping over its top edge into them.
    g.rotation.set(air * 0.7, (1 - rise) * Math.PI * 3, shake * 2);
    // The cover bursts open, stays open while he is dragged in, then slams.
    const open = span(p, SEAL.open) * (1 - span(p, SEAL.slam));
    if (cover.current) cover.current.rotation.z = Math.PI * 0.9 * ease(open);
    // Light pours out of the open pages; the seal blazes as it shuts, then glows on.
    if (glowSprite.current) glowSprite.current.scale.setScalar(1 + open * 2.2 + Math.sin(t * 9) * 0.15 * open);
    light.opacity = open * 0.3;
    const slammed = span(p, [SEAL.slam[1], SEAL.slam[1] + 0.1]);
    const seal = p >= SEAL.slam[1] ? 6 * (1 - slammed) + 1.6 + Math.sin(t * 2) * 0.4 : 1.2;
    for (const m of glow) m.emissiveIntensity = seal;
    if (lamp.current) lamp.current.intensity = open * 9 + (p >= SEAL.slam[1] ? 10 * (1 - slammed) : 0);
  });
  return (
    <group ref={root} visible={false} scale={BOOK_SCALE}>
      {/* Pivot at the book's middle, so it turns about its centre in the air */}
      <group position={[0, -BOOK_THICK / 2, 0]}>
        <primitive object={body} />
        <group ref={cover} position={[-BOOK_WIDTH / 2, BOOK_THICK, 0]}>
          <primitive object={coverModel} />
        </group>
        <sprite ref={glowSprite} material={light} position={[0, BOOK_THICK + 1.8, -0.6]} />
      </group>
      <PoolLight ref={lamp} position={[0, 2.2, -1.2]} color="#ffd27a" intensity={0} distance={14} decay={2} />
    </group>
  );
}

export function ThroneScene() {
  useMoltenFlow();
  const ring = useRef<Group>(null);
  // A ring of burning red script (Flux-painted, fx_sprites.py script_ring).
  const scriptRing = useMemo(() => fxSprite('script_ring'), []);
  const grow = useRef<Group>(null);
  const size = useRef(1);
  useFrame((state, delta) => {
    const run = getRun();
    const id = run?.director.currentBeat?.id ?? '';
    // He grows larger and more fiery as the fight goes on: full height for the final clash.
    const target = id === 'l3-u4' || id === 'l3-sealing' ? 1.7 : id === 'l3-u3' || id === 'l3-pip-seized' || id === 'l3-pip-free' ? 1.35 : 1;
    size.current += (target - size.current) * (1 - Math.exp(-1.2 * Math.min(delta, 0.1)));
    const g = grow.current;
    if (g) {
      // Sealed: dragged into his own book (SEAL), stretching thin and spinning faster as he shrinks into it.
      const u = id === 'l3-sealing' ? Math.min(1, Math.max(0, ((run?.beatProgress() ?? 0) - SEAL.pullFrom) / (SEAL.shut - SEAL.pullFrom))) : 0;
      const e = u * u;
      g.position.set(unwriter[0] + (BOOK_AIR[0] - unwriter[0]) * e, unwriter[1] + (BOOK_AIR[1] - unwriter[1]) * e, unwriter[2] + (BOOK_AIR[2] - unwriter[2]) * e);
      const k = size.current * Math.max(0.02, 1 - e);
      g.scale.set(k * (1 - 0.55 * u), k * (1 + 0.7 * u), k * (1 - 0.55 * u));
      g.rotation.set(-0.5 * u, e * 14, 0);
    }
    const seized = (id === 'l3-pip-seized' || id === 'l3-u3') && !(run?.flags.has('l3-pip-free') ?? false);
    if (ring.current) {
      // The ring of burning script closes round Pip, beside the apprentice (owner, 2026-10-19).
      ring.current.visible = seized;
      ring.current.position.set(pipWorld.x - THRONE_ORIGIN[0], pipWorld.y - THRONE_ORIGIN[1], pipWorld.z - THRONE_ORIGIN[2]);
      ring.current.lookAt(state.camera.position);
      ring.current.rotateZ(state.clock.elapsedTime * 2);
    }
  });
  const unwriter = sub(UNWRITER, THRONE_ORIGIN);
  const pipSeized = () => {
    const run = getRun();
    const id = run?.director.currentBeat?.id ?? '';
    return (id === 'l3-pip-seized' || id === 'l3-u3') && !(run?.flags.has('l3-pip-free') ?? false);
  };
  return (
    <group position={THRONE_ORIGIN}>
      <mesh position={[0, -0.2, 0]} material={MAT.ironPlate} receiveShadow>
        <cylinderGeometry args={[14, 13, 0.4, 48]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ironSeam}>
        <ringGeometry args={[11.5, 11.7, 64]} />
      </mesh>
      {/* Braziers ringing the platform */}
      {Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2).map((a, i) => (
        <group key={i} position={[Math.cos(a) * 12.5, 0, Math.sin(a) * 12.5]}>
          <KitModel id="iron_brazier" rotationY={a} overrides={IRON} />
          <Fire position={[0, 1.2, 0]} size={1.4} count={2} spread={0.4} light={i % 4 === 0} />
        </group>
      ))}
      {/* The Unwriter's throne of charred book pages (AI-pipeline prop; boxes until it loads) */}
      <ModelBoundary fallback={<ThroneBoxes />}>
        <Suspense fallback={<ThroneBoxes />}>
          <Prop id="iron_throne" position={[0, 0, -16.5]} height={8} />
        </Suspense>
      </ModelBoundary>
      <CitadelTowers spots={[[-46, -40, -52, 80], [48, -44, -48, 74], [-60, -48, 8, 70], [62, -46, 16, 76], [0, -52, -80, 96]]} />
      {/* The sea of fire far below */}
      <mesh position={[0, -60, 0]} material={redInk} geometry={worldGroundTiles(600, 600, 90)} />
      {[[-40, -60, -30], [50, -60, -60], [0, -60, -90], [-60, -60, 20]].map((p, i) => (
        <Fire key={i} position={p as unknown as Vec3} size={18} count={4} spread={30} />
      ))}
      <group ref={grow} position={unwriter}>
      <SceneCreature
        file="unwriter.glb"
        position={[0, 0, 0]}
        scale={1.6}
        fromBeat="l3-unwriter-rises"
        goneFlag="l3-unwriter-sealed"
        gone={unwriterGone}
        fallback={<UnwriterFallback />}
        rearing={() => (getRun()?.director.currentBeat?.id ?? '') === 'l3-u4'}
        // Owner (2026-10-17): he laughs as he talks, charges his quill before he attacks, and points it
        // at Pip to burn Pip's rings.
        threat
        clip={() => (pipSeized() ? 'Point' : useRunStore.getState().subtitle?.speaker === 'unwriter' ? 'Laugh' : null)}
        effects={(rig) => <UnwriterQuill rig={rig} burning={pipSeized} />}
      />
      </group>
      {/* Pip caught in a ring of burning red script, beside the apprentice */}
      <group ref={ring}>
        <mesh>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial map={scriptRing} transparent blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      {/* The Unwriter's own book: it flies up, opens, swallows him, slams shut and drops (kit_scene.py sealed_book) */}
      <Suspense fallback={null}>
        <SealingBook />
      </Suspense>
      <BoundWarden position={[13, 0, -10]} />
      <Mira position={[4, 0, 3]} rotationY={-0.8} />
    </group>
  );
}
