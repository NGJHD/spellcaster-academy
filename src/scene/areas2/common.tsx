/**
 * Shared Level 2/3 scene pieces: beat/flag hooks, a big boss model with a code-built fallback, and the
 * burning-academy dressing (silhouette blocks of the academy on fire behind the action).
 */
import { useFrame } from '@react-three/fiber';
import { Suspense, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { CatmullRomCurve3, DoubleSide, Matrix4, MeshStandardMaterial, TubeGeometry, Vector3, type Group, type Object3D, type SkinnedMesh, type Texture } from 'three';
import { BUILT_AI_FILES, CreatureModel } from '../../enemies/CreatureModel';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { Box, Column, Slab, WindowPane } from '../kit';
import { Fire } from '../Fire';
import { MAT } from '../materials';
import { Prop } from '../Prop';
import { useBeatIndex } from '../props';

/** True once the current level has reached (or passed) the given beat. */
export function useReached(beatId: string): boolean {
  const beat = useBeatIndex();
  const index = getRun()?.level.beatIndexOf(beatId) ?? -1;
  return index >= 0 && beat >= index;
}

const CREATURES = `${import.meta.env.BASE_URL}assets/creatures/`;
/** How long a boss's strike plays after it attacks. */
const STRIKE_SEC = 0.9;

/** A scene creature's live model (null while loading or on its fallback) and its placed group. */
export interface CreatureRig {
  model: Object3D | null;
  group: Group | null;
}

const bonePoint = new Vector3();
const inverseWorld = new Matrix4();
const skinMatrix = new Matrix4();

/**
 * Where a point of the model's bind pose (`bind`, model units) is now, following bone `bone` as the
 * skin does, in the creature group's local space (so effects ride the moving body). False when the
 * model or bone isn't there (fallback shown).
 */
export function rigPoint(rig: CreatureRig, bone: string, bind: Vector3, out: Vector3): boolean {
  const model = rig.model;
  const group = rig.group;
  if (!model || !group) return false;
  let mesh: SkinnedMesh | null = null;
  model.traverse((o) => {
    if (!mesh && (o as SkinnedMesh).isSkinnedMesh) mesh = o as SkinnedMesh;
  });
  const skinned = mesh as SkinnedMesh | null;
  if (!skinned) return false;
  const i = skinned.skeleton.bones.findIndex((b) => b.name === bone);
  const b = skinned.skeleton.bones[i];
  const inv = skinned.skeleton.boneInverses[i];
  if (!b || !inv) return false;
  // world = mesh.matrixWorld · bindMatrixInverse · bone.matrixWorld · boneInverse · bindMatrix · bind
  skinMatrix.copy(skinned.matrixWorld).multiply(skinned.bindMatrixInverse).multiply(b.matrixWorld).multiply(inv).multiply(skinned.bindMatrix);
  bonePoint.copy(bind).applyMatrix4(skinMatrix);
  inverseWorld.copy(group.matrixWorld).invert();
  out.copy(bonePoint).applyMatrix4(inverseWorld);
  return true;
}

/**
 * A boss or set-piece creature placed by the scene (not a typing target): shown from `fromBeat` until
 * `goneFlag` is set, idling with its Idle clip and rearing (Attack) while `rearing` returns true.
 * Falls back to the code-built `fallback` until the realistic GLB exists (AI pipeline).
 */
export function SceneCreature({
  file,
  position,
  rotationY = 0,
  scale = 1,
  fromBeat,
  goneFlag,
  fallback,
  rearing,
  flying,
  threat = false,
  clip,
  effects,
  wander = 0,
}: {
  file: string;
  position: Vec3;
  rotationY?: number;
  scale?: number;
  fromBeat: string;
  goneFlag: string;
  fallback: ReactNode;
  rearing?: () => boolean;
  /** While true the creature plays its Move clip (the dragon's wingbeats). */
  flying?: () => boolean;
  /** A boss: winds up its Attack while an arena attack charges, and strikes when it lands or hurls a fireball. */
  threat?: boolean;
  /** One of the model's own extra clips to play now (a laugh, a point), or null. */
  clip?: () => string | null;
  /** Effects in the creature's own space (wisps, charging glows); `rig` gives its live bones. */
  effects?: (rig: CreatureRig) => ReactNode;
  /** Paces restlessly this far (metres) either side of its spot, turning a little as it steps. */
  wander?: number;
}) {
  const shown = useReached(fromBeat);
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const fade = useRef(1);
  const rig = useMemo<CreatureRig>(() => ({ model: null, group: null }), []);
  const onScene = useCallback((s: Object3D | null) => void (rig.model = s), [rig]);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = pose.current;
    p.time += dt;
    rig.group = group.current;
    const run = getRun();
    const gone = run?.flags.has(goneFlag) ?? false;
    const override = clip?.() ?? null;
    // An extra clip (the Unwriter pointing at Pip) wins over the attack animations.
    const th = threat && run && !override ? run.bossThreat() : null;
    const striking = !!th && th.strikeAge < STRIKE_SEC && th.windup === 0;
    const wantWindup = rearing?.() ? 1 : th ? th.windup : 0;
    p.windup += (wantWindup - p.windup) * (1 - Math.exp(-4 * dt));
    // The strike plays at once (CreatureModel holds the wind-up pose while any wind-up remains).
    if (striking || p.windup < 0.02) p.windup = wantWindup > 0 && !striking ? p.windup : 0;
    p.recovering = striking;
    p.override = override;
    p.moving = flying?.() ?? false;
    fade.current += ((gone ? 0 : 1) - fade.current) * (1 - Math.exp(-5 * dt));
    const g = group.current;
    if (!g) return;
    if (wander > 0) {
      // Two slow, unrelated swings, so the pacing never looks like a metronome.
      const dx = Math.sin(p.time * 0.37) * wander + Math.sin(p.time * 0.83 + 1) * wander * 0.35;
      const vx = Math.cos(p.time * 0.37) * 0.37 * wander + Math.cos(p.time * 0.83 + 1) * 0.83 * wander * 0.35;
      g.position.set(position[0] + dx, position[1], position[2] + Math.sin(p.time * 0.29 + 2) * wander * 0.3);
      g.rotation.y = rotationY + Math.max(-0.5, Math.min(0.5, vx * 0.6));
    }
    g.visible = fade.current > 0.02;
    g.scale.setScalar(scale * (0.4 + 0.6 * fade.current));
  });
  if (!shown) return null;
  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {BUILT_AI_FILES.has(file) ? (
        <ModelBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <CreatureModel url={`${CREATURES}${file}`} pose={pose} onScene={onScene} />
          </Suspense>
        </ModelBoundary>
      ) : (
        fallback
      )}
      {effects?.(rig)}
    </group>
  );
}

const ember = new MeshStandardMaterial({ color: '#1a1212', roughness: 0.7, emissive: '#ff3a10', emissiveIntensity: 0.6 });
const charred = new MeshStandardMaterial({ color: '#1c1816', roughness: 0.85 });

/** PLACEHOLDER Grey Herald: a tall faceless figure of charred paper with glowing red edges. */
export function HeraldFallback() {
  const g = useRef<Group>(null);
  useFrame((s) => {
    if (g.current) g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.6) * 0.12;
  });
  return (
    <group ref={g}>
      <mesh position={[0, 1.3, 0]} material={charred} castShadow>
        <coneGeometry args={[0.85, 2.6, 18, 1, true]} />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={ember}>
        <torusGeometry args={[0.85, 0.04, 6, 24]} />
      </mesh>
      <mesh position={[0, 2.85, 0]} material={charred}>
        <sphereGeometry args={[0.3, 16, 12]} />
      </mesh>
      <mesh position={[0.55, 2.3, 0.3]} rotation={[0, 0, -0.9]} material={MAT.agedBrass}>
        <coneGeometry args={[0.16, 0.9, 12, 1, true]} />
      </mesh>
      <Fire position={[0.75, 2.6, 0.3]} size={0.5} count={2} spread={0.2} />
    </group>
  );
}

/** PLACEHOLDER Vellum Wyrm: a coiled serpent of burning pages with a horned book head. */
export function WyrmFallback() {
  const body = useMemo(() => {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const a = t * Math.PI * 3;
      pts.push(new Vector3(Math.cos(a) * (6 - t * 3), -14 + t * 18, Math.sin(a) * (6 - t * 3) - 4));
    }
    return new TubeGeometry(new CatmullRomCurve3(pts), 160, 1.1, 12, false);
  }, []);
  return (
    <group>
      <mesh geometry={body} material={MAT.parchment} castShadow />
      <mesh geometry={body} scale={1.01} material={ember} />
      <group position={[0, 4.6, 2]}>
        <Box position={[0, 0, 0]} size={[2.2, 1.4, 2.8]} material={MAT.burgundyLeather} />
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.9, 1.1, -0.6]} rotation={[-0.5, 0, s * -0.4]} material={MAT.pageEdge}>
            <coneGeometry args={[0.22, 1.6, 10]} />
          </mesh>
        ))}
        {[-1, 1].map((s) => (
          <mesh key={`e${s}`} position={[s * 0.6, 0.3, 1.42]} material={MAT.eyeAmber}>
            <sphereGeometry args={[0.18, 10, 8]} />
          </mesh>
        ))}
        <Fire position={[0, -0.4, 1.6]} size={1.2} count={3} spread={0.6} />
      </group>
      <Fire position={[0, -2, 0]} size={3} count={5} spread={6} light />
    </group>
  );
}

/**
 * The academy burning in the distance: blocky silhouettes of halls and towers with fires on the roofs
 * and glowing windows. Cheap (merged-looking boxes, a handful of flame sprites, no extra lights).
 */
/**
 * The burning academy on the horizon (Level 2): AI-modelled gothic halls and round towers in a row
 * (owner: the box buildings looked "blockish"), many of them burning. Seen only from far away.
 */
export function BurningSkyline({ position, rotationY = 0, seed = 1 }: { position: Vec3; rotationY?: number; seed?: number }) {
  const buildings = useMemo(() => {
    const out: { x: number; z: number; tower: boolean; h: number; yaw: number; fire: boolean }[] = [];
    let x = -60;
    let i = 0;
    while (x < 60) {
      const r = Math.abs(Math.sin((i + 1) * 12.9898 * seed) * 43758.5453) % 1;
      const tower = r > 0.62;
      const w = tower ? 13 : 30;
      out.push({ x: x + w / 2, z: (r - 0.5) * 8, tower, h: tower ? 26 + r * 10 : 18 + r * 6, yaw: tower ? r * 6 : r > 0.3 ? 0 : Math.PI, fire: r > 0.3 });
      x += w - 2;
      i++;
    }
    return out;
  }, [seed]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <ModelBoundary fallback={null}>
            <Suspense fallback={null}>
              <Prop id={b.tower ? 'academy_tower' : 'academy_hall'} position={[0, 0, 0]} height={b.h} rotationY={b.yaw} shadows={false} />
            </Suspense>
          </ModelBoundary>
          {b.fire && <Fire position={[0, b.h * (b.tower ? 0.75 : 0.65), 0]} size={4 + (i % 3) * 1.5} count={3} spread={b.tower ? 4 : 12} />}
        </group>
      ))}
    </group>
  );
}

/**
 * A beacon brazier (Level 2): an iron fire bowl on a stone pedestal. Dark until its flag is set, then
 * it roars with golden fire. The AI-pipeline model loads over a simple stone-and-iron fallback.
 */
export function BeaconBrazier({ position, flag, height = 2.6 }: { position: Vec3; flag: string; height?: number }) {
  const fallback = (
    <group>
      <mesh position={[0, height * 0.35, 0]} material={MAT.academyStoneDark} castShadow>
        <cylinderGeometry args={[0.35, 0.5, height * 0.7, 20]} />
      </mesh>
      <mesh position={[0, height * 0.82, 0]} material={MAT.darkSteel} castShadow>
        <cylinderGeometry args={[0.8, 0.4, height * 0.25, 24, 1, true]} />
      </mesh>
    </group>
  );
  return (
    <group position={position}>
      <ModelBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <Prop id="beacon_brazier" position={[0, 0, 0]} height={height} />
        </Suspense>
      </ModelBoundary>
      <Fire position={[0, height * 0.92, 0]} kind="warm" size={2.2} count={5} spread={0.7} light fromFlag={flag} />
    </group>
  );
}

/**
 * A stone hall interior with the practice gallery's treatment (owner, 2026-10-07: the Great Hall "looks
 * so blockish … I want texture like the practice gallery"): large photo-scanned sandstone blocks,
 * an oak wainscot, a cornice, engaged columns between tall arched windows, and a plastered barrel vault
 * (or a timber ceiling with beams) so there is no gap to the sky. Local space: floor at y = 0, the
 * hall runs along Z from z0 to z1, walls at x = ±half.
 */
export function StoneHall({
  half,
  z0,
  z1,
  height,
  vault = true,
  bay = 8,
  windows = true,
  ends = true,
  noWindowAt = [],
}: {
  half: number;
  z0: number;
  z1: number;
  height: number;
  vault?: boolean;
  bay?: number;
  windows?: boolean;
  ends?: boolean;
  /** Bays (side, window z) left without a window, e.g. over a tall door. */
  noWindowAt?: readonly (readonly [number, number])[];
}) {
  const length = z1 - z0;
  const mid = (z0 + z1) / 2;
  const vaultMat = useMemo(() => {
    const m = MAT.plaster.clone();
    m.side = DoubleSide;
    if (m.map) {
      const scale = (t: Texture | null) => {
        if (!t) return t;
        const c = t.clone();
        c.repeat.set(length / 3, (Math.PI * half) / 3);
        c.needsUpdate = true;
        return c;
      };
      m.map = scale(m.map);
      m.normalMap = scale(m.normalMap);
      m.roughnessMap = scale(m.roughnessMap);
      m.aoMap = m.roughnessMap;
    }
    return m;
  }, [length, half]);
  const bays = Array.from({ length: Math.floor(length / bay) + 1 }, (_, i) => z0 + i * bay).filter((z) => z <= z1);
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab x={side < 0 ? [-half - 0.6, -half] : [half, half + 0.6]} y={[0, height]} z={[z0, z1]} material={MAT.academyStone} />
          {/* Oak wainscot with a moulded rail */}
          <Slab x={side < 0 ? [-half, -half + 0.08] : [half - 0.08, half]} y={[0, 1.3]} z={[z0, z1]} material={MAT.panelWood} />
          <Slab x={side < 0 ? [-half, -half + 0.14] : [half - 0.14, half]} y={[1.3, 1.42]} z={[z0, z1]} material={MAT.darkOak} />
          {/* Cornice where the wall meets the ceiling */}
          <Slab x={side < 0 ? [-half, -half + 0.45] : [half - 0.45, half]} y={[height - 0.5, height - 0.2]} z={[z0, z1]} material={MAT.academyStoneDark} />
          {bays.map((z) => (
            <Column key={z} position={[side * (half - 0.35), 0, z]} height={height - 0.5} radius={0.42} />
          ))}
          {windows &&
            bays.slice(0, -1).filter((z) => !noWindowAt.some(([s, wz]) => s === side && wz === z + bay / 2)).map((z) => (
              <WindowPane key={`w${z}`} position={[side * (half - 0.02), height * 0.55, z + bay / 2]} size={[1.8, 4]} rotationY={side < 0 ? Math.PI / 2 : -Math.PI / 2} night />
            ))}
        </group>
      ))}
      {ends &&
        [z0, z1].map((z, i) => (
          <Slab key={z} x={[-half - 0.6, half + 0.6]} y={[0, height + (vault ? half : 0.4)]} z={i === 0 ? [z - 0.6, z] : [z, z + 0.6]} material={MAT.academyStone} />
        ))}
      {vault ? (
        <>
          {/* Plastered barrel vault springing from the cornice, with stone ribs at every bay */}
          <mesh position={[0, height - 0.2, mid]} rotation={[Math.PI / 2, Math.PI / 2, 0]} material={vaultMat}>
            <cylinderGeometry args={[half, half, length, 48, 1, true, 0, Math.PI]} />
          </mesh>
          {bays.map((z) => (
            <mesh key={z} position={[0, height - 0.2, z]} material={MAT.academyStoneDark}>
              <torusGeometry args={[half - 0.15, 0.28, 10, 40, Math.PI]} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          {/* Plaster ceiling crossed by oak beams */}
          <Slab x={[-half, half]} y={[height, height + 0.3]} z={[z0, z1]} material={MAT.plaster} />
          {bays.map((z) => (
            <Slab key={z} x={[-half, half]} y={[height - 0.45, height]} z={[z - 0.25, z + 0.25]} material={MAT.darkOak} />
          ))}
        </>
      )}
    </group>
  );
}
