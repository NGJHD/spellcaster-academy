/**
 * Level 3 areas (LEVEL3_DESIGN L3-6 … L3-15): the Blank, a scorched realm of grey ash under a red sky,
 * and the Unwriter's Cinder Citadel. Path words draw the route in coloured ink; restored objects lose
 * their fire and regain colour. PLACEHOLDER geometry is kit-built; mobs and bosses are AI-pipeline models.
 */
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { MeshStandardMaterial, PlaneGeometry, type Group, type PointLight } from 'three';
import { THRONE_ORIGIN, PIP_SEIZED, UNWRITER } from '../../level/areas3/finale';
import { DEER, SHORE_ORIGIN, STONES, TORTOISE, WOOD_ORIGIN } from '../../level/areas3/journey1';
import { FALLS_ORIGIN, GALLERY3_ORIGIN, JOURNAL, MARGIN_ORIGIN, PERFECT_WARDEN, RAFT_BEATS, SLIDE_SECTIONS, WALKWAYS } from '../../level/areas3/journey2';
import { CITADEL_ORIGIN, FLIGHTS, FORGE_LINES, FORGE_ORIGIN, GALLEONS, SEA_ORIGIN, SHIP_BEATS } from '../../level/areas3/journey3';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { Fire, Restorable } from '../Fire';
import { Bookshelf, Box, KitModel, Slab } from '../kit';
import { MAT } from '../materials';
import { Mira, StaticWarden } from '../props';
import { Carried } from '../areas2/Level2Scenes';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { Prop } from '../Prop';
import { metreSurface, surface } from '../surfaceTextures';
import { SceneCreature } from '../areas2/common';
import { GalleryDressing, MarginDressing } from '../areas2/dressing';

const ash = () => metreSurface('ash', 7);
const ashDarkFlat = new MeshStandardMaterial({ color: '#2e2a28', roughness: 0.95 });
const scorchedRock = () => metreSurface('scorched', 5);
const redInk = new MeshStandardMaterial({ color: '#3a0804', roughness: 0.15, emissive: '#ff2a08', emissiveIntensity: 1.2 });
const blackIron = () => metreSurface('iron', 3, { metalness: 0.45 });
const ironSeam = new MeshStandardMaterial({ color: '#2a0804', roughness: 0.4, emissive: '#ff3a10', emissiveIntensity: 2 });
const paper = new MeshStandardMaterial({ color: '#d8d2c4', roughness: 0.9 });
const inkBlue = new MeshStandardMaterial({ color: '#2a5cff', roughness: 0.3, emissive: '#2a5cff', emissiveIntensity: 0.4 });

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
        {(props.seed ?? 1) % 3 === 0 && <Fire position={[props.position[0], props.position[1] + h * 0.55, props.position[2]]} size={1.4} count={2} spread={0.8} smoke={false} />}
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
      {seed % 3 === 0 && <Fire position={[0, height * 0.7, 0]} size={1.4} count={2} spread={0.6} smoke={false} />}
    </group>
  );
}

function AshGround({ x, z, y = 0 }: { x: readonly [number, number]; z: readonly [number, number]; y?: number }) {
  return <Slab x={x} y={[y - 0.3, y]} z={z} material={ash()} />;
}

// ---------- Rift Shore ----------

export function ShoreScene() {
  return (
    <group position={SHORE_ORIGIN}>
      <AshGround x={[-220, 220]} z={[-4, 260]} />
      <AshGround x={[-220, 220]} z={[-260, -16]} />
      {/* The river of molten red ink */}
      <mesh position={[0, -0.25, -10]} rotation={[-Math.PI / 2, 0, 0]} material={redInk}>
        <planeGeometry args={[440, 12]} />
      </mesh>
      {/* Stepping stones written across the ink */}
      {STONES.map((s, i) => (
        <Written key={i} flag={`l3-stone-${i + 1}`}>
          <mesh position={sub(s, SHORE_ORIGIN)} material={inkBlue}>
            <cylinderGeometry args={[1.1, 1.2, 0.4, 16]} />
          </mesh>
        </Written>
      ))}
      {/* Burnt shell, boat and lantern on the beach, repainted when restored */}
      <Restorable flag="l3-shell" fire={{ position: [-5, 0.3, -26], size: 0.8, count: 2, spread: 0.5, smoke: true }}>
        <mesh position={[-5, 0.35, -26]} scale={[1, 0.6, 0.8]} material={MAT.petal}>
          <sphereGeometry args={[0.7, 16, 10]} />
        </mesh>
      </Restorable>
      <Restorable flag="l3-boat" fire={{ position: [7, 0.4, -28], size: 1.2, count: 3, spread: 1.6 }}>
        <Box position={[7, 0.4, -28]} size={[1.4, 0.6, 3.6]} material={MAT.blueLeather} />
      </Restorable>
      <Restorable flag="l3-lantern" fire={{ position: [-8, 1, -22], size: 0.6, count: 2, spread: 0.3, smoke: false }}>
        <Box position={[-8, 0.6, -22]} size={[0.5, 1.2, 0.5]} material={MAT.agedBrass} />
      </Restorable>
      {[[-20, -40], [14, -50], [-34, -30], [30, -36], [-12, -60]].map(([x, z], i) => (
        <BurntTree key={i} position={[x ?? 0, 0, z ?? 0]} height={7 + i} seed={i + 1} />
      ))}
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

export function CinderwoodScene() {
  const deer = sub(DEER, WOOD_ORIGIN);
  const tortoise = sub(TORTOISE, WOOD_ORIGIN);
  return (
    <group position={WOOD_ORIGIN}>
      <AshGround x={[-160, 160]} z={[-200, 80]} />
      {Array.from({ length: 26 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        return <BurntTree key={i} position={[side * (5 + ((i * 7) % 14)), 0, 10 - i * 4.5]} height={8 + ((i * 5) % 6)} seed={i + 2} />;
      })}
      <AshRocks spots={[[-7, -8, 1.6], [8, -22, 2.4], [-9, -44, 3], [10, -58, 2], [-6, -74, 2.8], [7, -92, 3.4]]} />
      {/* The half-drawn deer: grey outline until restored */}
      <Restorable flag="l3-deer-free" burning={false}>
        <group position={deer}>
          <Box position={[0, 1.1, 0]} size={[0.5, 0.6, 1.4]} material={MAT.fur} />
          <Box position={[0, 1.6, 0.75]} size={[0.3, 0.6, 0.3]} material={MAT.fur} />
          <Box position={[0, 1.9, 0.95]} size={[0.25, 0.25, 0.45]} material={MAT.fur} />
          {[[-0.18, 0.5], [0.18, 0.5], [-0.18, -0.5], [0.18, -0.5]].map(([x, z], i) => (
            <Box key={i} position={[x ?? 0, 0.45, z ?? 0]} size={[0.1, 0.9, 0.1]} material={MAT.fur} />
          ))}
        </group>
      </Restorable>
      {/* The great outline tortoise */}
      <Restorable flag="l3-tortoise-free" burning={false}>
        <group position={tortoise}>
          <mesh position={[0, 1.4, 0]} scale={[1, 0.6, 1.2]} material={MAT.moss}>
            <sphereGeometry args={[2.6, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <Box position={[0, 1.2, 3.2]} size={[0.9, 0.8, 1.2]} material={MAT.bark} />
        </group>
      </Restorable>
      {[[-6, -30], [8, -60], [-10, -80]].map(([x, z], i) => (
        <Fire key={i} position={[x ?? 0, 0, z ?? 0]} size={2} count={3} spread={2.4} light={i === 0} />
      ))}
    </group>
  );
}

// ---------- Inkfall Cascades ----------

export function InkfallScene() {
  return (
    <>
      <group position={FALLS_ORIGIN}>
        {/* Terraced falls of molten red ink, stepping down along −Z */}
        {[[40, 0, -30], [30, -30, -60], [20, -60, -88], [0, -120, -150]].map(([y, z0, z1], i) => (
          <group key={i}>
            <Slab x={[-6, 6]} y={[(y ?? 0) - 0.4, (y ?? 0) - 0.2]} z={[z1 ?? 0, z0 ?? 0]} material={redInk} />
            <Slab x={[-14, -6]} y={[-5, (y ?? 0) + 2]} z={[z1 ?? 0, z0 ?? 0]} material={scorchedRock()} />
            <Slab x={[6, 14]} y={[-5, (y ?? 0) + 2]} z={[z1 ?? 0, z0 ?? 0]} material={scorchedRock()} />
            {[-1, 1].map((s) => (
              <Fire key={s} position={[s * 7, (y ?? 0) + 2, ((z0 ?? 0) + (z1 ?? 0)) / 2]} size={3} count={4} spread={14} light={i === 1 && s < 0} />
            ))}
          </group>
        ))}
        <AshRocks spots={[[-7.5, -12, 2.4], [7.5, -24, 2], [-7.8, -46, 2.8], [7.6, -70, 2.2], [-7.4, -100, 3], [7.8, -128, 2.6]]} />
        {/* The broken drop: written into a slide of blue ink */}
        {SLIDE_SECTIONS.map((p, i) => (
          <Written key={i} flag={`l3-slide-${i + 1}`}>
            <Box position={sub(p, FALLS_ORIGIN)} size={[4, 0.3, 10]} rotation={[0.45, 0, 0]} material={inkBlue} />
          </Written>
        ))}
      </group>
      <Carried beats={RAFT_BEATS} drop={1.1}>
        <Box position={[0, 0, -0.8]} size={[2.6, 0.12, 4]} material={paper} />
        <Mira position={[0, 0.06, -2.4]} rotationY={Math.PI} />
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
      {/* Upside-down shelves hanging from the red sky */}
      {Array.from({ length: 12 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        return (
          <group key={i} position={[side * 6, 14, 6 - Math.floor(i / 2) * 8]} rotation={[0, 0, Math.PI]}>
            <Bookshelf position={[0, 0, 0]} rotationY={side * Math.PI / 2} width={5} height={8} shelves={6} seed={i + 60} />
          </group>
        );
      })}
      <Slab x={[-1.5, 1.5]} y={[-0.3, 0]} z={[2, 12]} material={MAT.darkOak} />
      {WALKWAYS.map((p, i) => (
        <Written key={i} flag={`l3-walk-${i + 1}`}>
          <Box position={sub(p, MARGIN_ORIGIN)} size={[3, 0.3, 8]} material={inkBlue} />
        </Written>
      ))}
      <Slab x={[-1.5, 1.5]} y={[-0.3, 0]} z={[-26, -24]} material={MAT.darkOak} />
      <Slab x={[-6, 6]} y={[-0.3, 0]} z={[-46, -26]} material={MAT.darkOak} />
      {/* Corvane's journal on its lectern, burning into a tornado of pages */}
      <group position={journal}>
        <Box position={[0, -1, 0]} size={[0.8, 2, 0.8]} material={MAT.darkOak} />
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

export function Gallery3Scene() {
  return (
    <group position={GALLERY3_ORIGIN}>
      <GalleryDressing />
      <Slab x={[-16, 16]} y={[-0.3, 0]} z={[-26, 22]} material={MAT.marble} />
      <Slab x={[-16, 16]} y={[0, 14]} z={[-27, -26]} material={metreSurface('stone', 3)} />
      {[-12, -4, 4, 12].map((z) => (
        <group key={z}>
          <Box position={[-15.5, 7, z]} size={[1, 14, 6]} material={metreSurface('stone', 3)} />
          <Box position={[15.5, 7, z]} size={[1, 14, 6]} material={metreSurface('stone', 3)} />
        </group>
      ))}
      <Restorable flag="l3-sculpt-1" fire={{ position: [-6, 1.2, -2], size: 1, count: 2, spread: 1.6, smoke: false }}>
        <KitModel id="fountain_basin" position={[-6, 0, -2]} />
      </Restorable>
      <Restorable flag="l3-sculpt-2" fire={{ position: [6, 1, -4], size: 1, count: 2, spread: 1.6, smoke: false }}>
        <group position={[6, 0, -4]}>
          <mesh position={[0, 0.2, 0]} material={MAT.burgundyLeather}>
            <cylinderGeometry args={[2, 2, 0.4, 24]} />
          </mesh>
          <mesh position={[0, 3, 0]} material={MAT.wardGold}>
            <coneGeometry args={[2.2, 1.2, 24]} />
          </mesh>
          <mesh position={[0, 1.4, 0]} material={MAT.agedBrass}>
            <cylinderGeometry args={[0.1, 0.1, 2.6, 8]} />
          </mesh>
        </group>
      </Restorable>
      <Restorable flag="l3-sculpt-3" fire={{ position: [-9, 3, -12], size: 1.4, count: 3, spread: 2 }}>
        <group position={[-9, 0, -12]}>
          <mesh position={[0, 3, 0]} material={MAT.academyStone}>
            <cylinderGeometry args={[1.4, 1.6, 6, 16]} />
          </mesh>
          <mesh position={[0, 7, 0]} material={MAT.slate}>
            <coneGeometry args={[1.8, 2.4, 16]} />
          </mesh>
        </group>
      </Restorable>
      <StaticWarden position={[5, 0, 6]} scale={1.1} rotationY={-2.6} />
      <SceneCreature
        file="perfect_warden.glb"
        position={sub(PERFECT_WARDEN, GALLERY3_ORIGIN)}
        scale={2}
        fromBeat="l3-perfect-warden"
        goneFlag="l3-perfect-warden-gone"
        fallback={<IronGiant height={7} />}
      />
    </group>
  );
}

/** PLACEHOLDER Perfect Warden / Foreman: a black-iron giant with fire burning through its seams. */
function IronGiant({ height }: { height: number }) {
  const s = height / 7;
  return (
    <group scale={s}>
      <Box position={[0, 4.2, 0]} size={[2.4, 3, 1.4]} material={blackIron()} />
      <Box position={[0, 4.4, 0.72]} size={[0.6, 0.8, 0.05]} material={ironSeam} />
      <Box position={[0, 6.3, 0]} size={[1, 1, 1]} material={blackIron()} />
      <Box position={[0, 6.3, 0.51]} size={[0.7, 0.1, 0.02]} material={ironSeam} />
      {[-1, 1].map((x) => (
        <group key={x}>
          <Box position={[x * 1.6, 4.2, 0]} size={[0.7, 2.8, 0.7]} material={blackIron()} />
          <Box position={[x * 0.6, 1.4, 0]} size={[0.8, 2.8, 0.8]} material={blackIron()} />
        </group>
      ))}
      <Fire position={[0, 4.6, 0.8]} size={1.2} count={2} spread={0.6} smoke={false} />
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
      <Box position={[0, 1, 0]} size={[5, 2.4, 14]} material={blackIron()} />
      <mesh position={[0, 8.2, 0]} material={MAT.darkOak}>
        <cylinderGeometry args={[0.2, 0.3, 12, 10]} />
      </mesh>
    </>
  );
  return (
    <group position={position}>
      <group ref={ship}>
        {/* Black galleon with torn sails (AI-pipeline prop) */}
        <ModelBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Prop id="black_galleon" position={[0, -1.2, 0]} height={16} rotationY={index === 2 ? Math.PI : 0} />
          </Suspense>
        </ModelBoundary>
        <Fire position={[0, 3, 8]} size={2} count={3} spread={1} light={index === 2} />
        <Fire position={[0, 9, 0]} size={3} count={4} spread={5} smoke fromFlag={`l3-mast-${index}-down`} />
      </group>
    </group>
  );
}

/** The Paper Sea: creased paper rolling in slow swells (vertex waves, updated each frame). */
function PaperWaves() {
  const { geometry, material } = useMemo(() => {
    const g = new PlaneGeometry(500, 500, 120, 120);
    g.rotateX(-Math.PI / 2);
    return { geometry: g, material: surface('paper', [500, 500], 10) };
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.getAttribute('position').array), [geometry]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geometry.getAttribute('position');
    const arr = pos.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i] ?? 0;
      const z = base[i + 2] ?? 0;
      arr[i + 1] = Math.sin(x * 0.08 + t * 0.9) * 0.6 + Math.sin(z * 0.11 - t * 1.2) * 0.5 + Math.sin((x + z) * 0.03 + t * 0.4) * 0.8;
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  return <mesh geometry={geometry} material={material} position={[0, -0.6, -100]} receiveShadow />;
}

export function SeaScene() {
  return (
    <>
      <group position={SEA_ORIGIN}>
        <PaperWaves />
        {GALLEONS.map((g, i) => (
          <Galleon key={i} position={sub(g, SEA_ORIGIN)} index={i + 1} />
        ))}
        {[[-20, -30], [24, -60], [-30, -140], [18, -190], [-10, -240]].map(([x, z], i) => (
          <group key={i} position={[x ?? 0, 0, z ?? 0]}>
            <Box position={[0, 0.6, 0]} size={[3, 1.2, 6]} rotation={[0, i, 0.3]} material={ashDarkFlat} />
            <Fire position={[0, 1.2, 0]} size={2.6} count={3} spread={3} />
          </group>
        ))}
      </group>
      <Carried beats={SHIP_BEATS} drop={1.9}>
        <Box position={[0, 0, -1]} size={[3, 1, 7]} material={paper} />
        <mesh position={[0, 3.4, -2]} material={paper}>
          <planeGeometry args={[3.6, 4.4]} />
        </mesh>
        <Mira position={[0.8, 0.5, -3.4]} rotationY={Math.PI} />
      </Carried>
    </>
  );
}

// ---------- Forge of Unwriting ----------

/** A giant forge hammer machine (AI-pipeline prop); each slam flares the anvil (light pulse and sparks). */
function Hammer({ position, phase }: { position: Vec3; phase: number }) {
  const glow = useRef<PointLight>(null);
  useFrame((state) => {
    const t = (state.clock.elapsedTime * 0.5 + phase) % 1;
    // Slow lift, fast slam: the anvil flares right after each strike.
    const flare = t > 0.8 ? Math.max(0, 1 - (t - 0.8) / 0.2) : 0;
    if (glow.current) glow.current.intensity = 30 + flare * 260;
  });
  const fallback = (
    <>
      <Box position={[0, 8, 0]} size={[6, 4, 6]} material={blackIron()} />
      <Box position={[0, 1, 0]} size={[8, 2, 8]} material={blackIron()} />
    </>
  );
  return (
    <group position={position}>
      <ModelBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Prop id="forge_hammer" position={[0, 0, 0]} height={16} rotationY={phase * 3} />
        </Suspense>
      </ModelBoundary>
      <pointLight ref={glow} position={[0, 6, 2]} color="#ff7a2a" intensity={30} distance={22} decay={2} />
      <Fire position={[0, 5.6, 0]} size={2} count={3} spread={2} kind="warm" smoke={false} />
    </group>
  );
}

export function ForgeScene() {
  return (
    <group position={FORGE_ORIGIN}>
      <Slab x={[-20, 20]} y={[-0.3, 0]} z={[-50, 20]} material={blackIron()} />
      <Slab x={[-21, -20]} y={[0, 30]} z={[-50, 20]} material={blackIron()} />
      <Slab x={[20, 21]} y={[0, 30]} z={[-50, 20]} material={blackIron()} />
      {FORGE_LINES.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          {/* The line: a conveyor of moulds running towards the player, its furnace at the back */}
          <Box position={[0, 0.5, -16]} size={[2.4, 1, 20]} material={blackIron()} />
          <Box position={[0, 4, -28]} size={[5, 8, 4]} material={blackIron()} />
          <Box position={[0, 3, -25.9]} size={[2.4, 2.6, 0.1]} material={ironSeam} />
          <Fire position={[0, 1.6, -25.6]} size={3} count={4} spread={2} light untilFlag={`l3-line-${i + 1}`} />
          {/* Cauldron pouring molten red ink */}
          {/* Black iron cauldron of molten red ink (AI-pipeline prop) on a gantry */}
          <ModelBoundary fallback={null}>
            <Suspense fallback={null}>
              <Prop id="ink_cauldron" position={[0, 7.6, -22]} height={3.2} rotationY={i * 1.1} />
            </Suspense>
          </ModelBoundary>
          <Box position={[0, 7.4, -22]} size={[4.4, 0.3, 0.3]} material={blackIron()} />
          <Fire position={[0, 10.6, -22]} size={1} count={2} spread={1.4} smoke={false} />
          <mesh position={[0, 5, -22]} material={redInk}>
            <cylinderGeometry args={[0.2, 0.25, 6, 8]} />
          </mesh>
          {[-1, 0, 1].map((k) => (
            <Box key={k} position={[k * 0.8, 1.2, -14]} size={[0.15, 1.2, 0.15]} material={MAT.agedBrass} />
          ))}
        </group>
      ))}
      <AshRocks spots={[[-17, 8, 1.6], [16, 10, 1.4], [-18, -20, 2], [17, -24, 2.2]]} />
      <Hammer position={[-12, 0, -38]} phase={0} />
      <Hammer position={[12, 0, -40]} phase={0.5} />
      {[-30, -10, 10].map((z) => (
        <Fire key={z} position={[-18, 0, z]} size={4} count={3} spread={2} />
      ))}
    </group>
  );
}

// ---------- Cinder Citadel ----------

export function CitadelScene() {
  const rising = useRef<Group>(null);
  useFrame((state) => {
    // The wall of fire racing up the stairwell, always just below the camera.
    if (rising.current) rising.current.position.y = state.camera.position.y - CITADEL_ORIGIN[1] - 7;
  });
  return (
    <group position={CITADEL_ORIGIN}>
      <Slab x={[-8, 8]} y={[-0.3, 0]} z={[-4, 8]} material={blackIron()} />
      <Slab x={[-9, -8]} y={[-10, 44]} z={[-60, 8]} material={blackIron()} />
      <Slab x={[8, 9]} y={[-10, 44]} z={[-60, 8]} material={blackIron()} />
      {/* Arrow slits glowing red */}
      {[4, 12, 20, 28, 36].map((y) => (
        <group key={y}>
          <Box position={[-7.95, y, -(y * 1.5)]} size={[0.1, 2, 0.4]} material={ironSeam} />
          <Box position={[7.95, y, -(y * 1.5) - 4]} size={[0.1, 2, 0.4]} material={ironSeam} />
        </group>
      ))}
      {FLIGHTS.map((f, n) =>
        [0, 1, 2].map((i) => (
          <Written key={`${n}-${i}`} flag={`l3-flight-${n + 1}-${i + 1}`}>
            <Box position={[0, f[1] - CITADEL_ORIGIN[1] + 1 + i * 2.4, f[2] - CITADEL_ORIGIN[2] - 3 - i * 3]} size={[4, 0.4, 3.2]} material={inkBlue} />
          </Written>
        )),
      )}
      {/* Landings at the top of each flight */}
      {[1, 2, 3].map((n) => (
        <Box key={n} position={[0, n * 8 - 0.2, -n * 12 + 2]} size={[10, 0.4, 6]} material={blackIron()} />
      ))}
      <Box position={[0, 36, -56]} size={[8, 10, 0.6]} material={blackIron()} />
      <Fire position={[0, 33, -55]} size={3} count={4} spread={8} light />
      <group ref={rising}>
        <Fire position={[0, 0, -20]} size={6} count={6} spread={14} light smoke={false} />
      </group>
    </group>
  );
}

// ---------- Throne of Ash ----------

function ThroneBoxes() {
  return (
    <>
      <Box position={[0, 2.5, -14.5]} size={[4, 5, 1.2]} material={blackIron()} />
      <Box position={[0, 1, -13.5]} size={[3, 2, 2]} material={blackIron()} />
    </>
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
        <mesh rotation={[0, 0, 0.5]} material={blackIron()}>
          <coneGeometry args={[0.12, 2.4, 8]} />
        </mesh>
        <Fire position={[0, 1, 0]} size={0.9} count={2} spread={0.3} smoke={false} />
      </group>
    </group>
  );
}

export function ThroneScene() {
  const ring = useRef<Group>(null);
  const book = useRef<Group>(null);
  const grow = useRef<Group>(null);
  const size = useRef(1);
  useFrame((state, delta) => {
    const run = getRun();
    const id = run?.director.currentBeat?.id ?? '';
    // He grows larger and more fiery as the fight goes on (M3-8): full height for the final clash.
    const target = id === 'l3-u4' ? 1.7 : id === 'l3-u3' || id === 'l3-pip-seized' || id === 'l3-pip-free' ? 1.35 : 1;
    size.current += (target - size.current) * (1 - Math.exp(-1.2 * Math.min(delta, 0.1)));
    grow.current?.scale.setScalar(size.current);
    const seized = (id === 'l3-pip-seized' || id === 'l3-u3') && !(run?.flags.has('l3-pip-free') ?? false);
    if (ring.current) {
      ring.current.visible = seized;
      ring.current.rotation.z = state.clock.elapsedTime * 2;
    }
    if (book.current) book.current.visible = run?.flags.has('l3-unwriter-sealed') ?? false;
  });
  const unwriter = sub(UNWRITER, THRONE_ORIGIN);
  const pip = sub(PIP_SEIZED, THRONE_ORIGIN);
  return (
    <group position={THRONE_ORIGIN}>
      <mesh position={[0, -0.2, 0]} material={blackIron()} receiveShadow>
        <cylinderGeometry args={[14, 13, 0.4, 48]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={ironSeam}>
        <ringGeometry args={[11.5, 11.7, 64]} />
      </mesh>
      {/* Braziers ringing the platform */}
      {Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2).map((a, i) => (
        <group key={i} position={[Math.cos(a) * 12.5, 0, Math.sin(a) * 12.5]}>
          <mesh position={[0, 0.6, 0]} material={blackIron()}>
            <cylinderGeometry args={[0.5, 0.3, 1.2, 10]} />
          </mesh>
          <Fire position={[0, 1.2, 0]} size={1.4} count={2} spread={0.4} smoke={false} light={i % 4 === 0} />
        </group>
      ))}
      {/* The Unwriter's throne of charred book pages (AI-pipeline prop; boxes until it loads) */}
      <ModelBoundary fallback={<ThroneBoxes />}>
        <Suspense fallback={<ThroneBoxes />}>
          <Prop id="iron_throne" position={[0, 0, -16.5]} height={8} />
        </Suspense>
      </ModelBoundary>
      {/* The sea of fire far below */}
      <mesh position={[0, -60, 0]} rotation={[-Math.PI / 2, 0, 0]} material={redInk}>
        <planeGeometry args={[600, 600]} />
      </mesh>
      {[[-40, -60, -30], [50, -60, -60], [0, -60, -90], [-60, -60, 20]].map((p, i) => (
        <Fire key={i} position={p as unknown as Vec3} size={18} count={4} spread={30} smoke={false} />
      ))}
      <group ref={grow} position={unwriter}>
      <SceneCreature
        file="unwriter.glb"
        position={[0, 0, 0]}
        scale={1.6}
        fromBeat="l3-unwriter-rises"
        goneFlag="l3-unwriter-sealed"
        fallback={<UnwriterFallback />}
        rearing={() => (getRun()?.director.currentBeat?.id ?? '') === 'l3-u4'}
      />
      </group>
      {/* Pip held in a ring of burning red script */}
      <group ref={ring} position={pip}>
        <mesh material={ironSeam}>
          <torusGeometry args={[0.7, 0.05, 8, 32]} />
        </mesh>
      </group>
      {/* The Unwriter's own blank book, slammed shut with a gold seal */}
      <group ref={book} position={[0, 0.2, -10]}>
        <Box position={[0, 0, 0]} size={[1.6, 0.4, 2.2]} material={MAT.burgundyLeather} />
        <Box position={[0, 0.21, 0]} size={[0.6, 0.02, 0.6]} material={MAT.wardGold} />
      </group>
      <StaticWarden position={[13, 0, -10]} scale={1.2} rotationY={-1.0} />
      <Mira position={[4, 0, 3]} rotationY={-0.8} />
    </group>
  );
}
