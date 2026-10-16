/**
 * PLACEHOLDER story props whose state follows the run (anchors, crystals, Grimoire, Warden,
 * characters). Everything is read imperatively from the run each frame — no React state per frame.
 */
import { LightBeam } from './glow';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Color, Mesh, Vector3, type Group, type MeshStandardMaterial, type Object3D } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ModelBoundary } from '../enemies/ModelBoundary';
import { emptyPose, type TargetPose } from '../enemies/TargetVisuals';
import { Dummy, ThornPod } from '../enemies/PropTargets';
import { LEVEL1_ENCOUNTERS, beatIndexOf } from '../level/level1Route';
import type { Vec3 } from '../level/rail/railTypes';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';
import { CharacterModel } from './CharacterModel';
import { Guardian } from '../enemies/GuardianGLB';
import { CreatureModel, creatureUrl } from '../enemies/CreatureModel';
import { useKitGlow } from './kitGlb';
import { MAT } from './materials';
import { useParts } from './partsGlb';

/** Current beat index (re-renders only when the beat changes). */
export function useBeatIndex(): number {
  const beatId = useRunStore((s) => s.beatId);
  // Index within the level being played (scene props compare against their own level's beats).
  return beatId ? (getRun()?.level.beatIndexOf(beatId) ?? beatIndexOf(beatId)) : -1;
}

const damp = (current: number, goal: number, rate: number, dt: number) => current + (goal - current) * (1 - Math.exp(-rate * Math.min(dt, 0.1)));

// ---------- Ward anchor (§14A.14) ----------

const ANCHOR_THEME = {
  courtyard: { base: MAT.academyStone, accent: '#ffcf6a' },
  library: { base: MAT.darkOak, accent: '#9fc8ff' },
  greenhouse: { base: MAT.academyStoneDark, accent: '#8ff0a8' },
} as const;

function WardAnchorFallback({ position, encounterId, theme }: { position: Vec3; encounterId: string; theme: keyof typeof ANCHOR_THEME }) {
  const rings = useRef<(Group | null)[]>([]);
  const shard = useRef<Group>(null);
  const column = useRef<Group>(null);
  const nodes = useMemo(() => [0, 1, 2].map(() => MAT.crystalDim.clone()), []);
  const accent = useMemo(() => new Color(ANCHOR_THEME[theme].accent), [theme]);
  const level = useRef(0);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    const run = getRun();
    const p = run?.encounterProgress(encounterId);
    const goal = p ? (p.complete ? 1 : p.total ? p.done / p.total : 0) : 0;
    level.current = damp(level.current, goal, 3, dt);
    const l = level.current;
    const restored = p?.complete ?? false;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const misalign = (1 - l) * (0.6 + i * 0.35);
      r.rotation.set(misalign * (i % 2 ? 1 : -1), restored ? time.current * (0.4 + i * 0.2) : Math.sin(time.current * 0.5 + i) * 0.1 * (1 - l), misalign * 0.6);
    });
    nodes.forEach((m, i) => {
      const lit = l * 3 > i + 0.5;
      m.emissive.copy(lit ? accent : new Color('#1d2a3a'));
      m.emissiveIntensity = lit ? 1.8 : 0.3 + Math.abs(Math.sin(time.current * 3 + i)) * 0.25 * (1 - l);
    });
    if (shard.current) {
      shard.current.position.y = 1.5 + Math.sin(time.current * 1.4) * 0.05 * (0.3 + l);
      shard.current.rotation.y = time.current * (0.2 + l);
    }
    if (column.current) {
      column.current.visible = restored;
      column.current.scale.y = damp(column.current.scale.y, restored ? 1 : 0.01, 2, dt);
    }
  });

  const base = ANCHOR_THEME[theme].base;
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]} material={base} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.95, 0.7, 3]} />
      </mesh>
      <mesh position={[0, 0.78, 0]} material={MAT.agedBrass} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.16, 24]} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * 0.62, 1.15, Math.sin(a) * 0.62]} material={MAT.agedBrass} castShadow>
              <cylinderGeometry args={[0.04, 0.05, 0.75, 10]} />
            </mesh>
            <mesh position={[Math.cos(a) * 0.62, 1.6, Math.sin(a) * 0.62]} material={nodes[i]}>
              <octahedronGeometry args={[0.1]} />
            </mesh>
          </group>
        );
      })}
      {[0.55, 0.45, 0.35].map((r, i) => (
        <group key={r} position={[0, 1.5, 0]} ref={(g) => void (rings.current[i] = g)}>
          <mesh material={MAT.agedBrass} castShadow>
            <torusGeometry args={[r, 0.022, 8, 48]} />
          </mesh>
        </group>
      ))}
      <group ref={shard} position={[0, 1.5, 0]}>
        <mesh material={MAT.crystal} scale={[0.6, 1.5, 0.6]}>
          <octahedronGeometry args={[0.16]} />
        </mesh>
      </group>
      {/* A rendered shaft of light rising from the restored anchor (was a solid cylinder). */}
      <group ref={column} position={[0, 1, 0]} visible={false}>
        <LightBeam height={22} width={1.4} color={ANCHOR_THEME[theme].accent} intensity={0.9} />
      </group>
    </group>
  );
}

// ---------- Glowing crystals / markers that light up as their encounter progresses ----------

export function ProgressCrystal({ position, encounterId, index, scale = 1 }: { position: Vec3; encounterId: string; index: number; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <Suspense fallback={<CrystalFallback encounterId={encounterId} index={index} />}>
        <CrystalCluster encounterId={encounterId} index={index} />
      </Suspense>
    </group>
  );
}

/** Lights up (and spins faster) once its share of the encounter is done. */
function useCrystalGlow(material: MeshStandardMaterial | undefined, spinner: () => Object3D | null | undefined, encounterId: string, index: number): void {
  const time = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    if (!material) return;
    const p = getRun()?.encounterProgress(encounterId);
    const lit = !!p && p.done > index;
    material.emissive.set(lit ? '#7fc4ff' : '#2a4a70');
    material.emissiveIntensity = damp(material.emissiveIntensity, lit ? 2.6 : 0.6 + Math.sin(time.current * 2 + index) * 0.2, 4, dt);
    const s = spinner();
    if (s) s.rotation.y = time.current * (lit ? 1.0 : 0.25);
  });
}

function CrystalCluster({ encounterId, index }: { encounterId: string; index: number }) {
  const { root, glow } = useKitGlow('crystal_cluster', ['Crystal']);
  useCrystalGlow(glow[0], () => root.getObjectByName('Crystals'), encounterId, index);
  return <primitive object={root} position={[0, 0.12, 0]} />;
}

function CrystalFallback({ encounterId, index }: { encounterId: string; index: number }) {
  const mat = useMemo(() => MAT.crystalDim.clone(), []);
  const ref = useRef<Group>(null);
  useCrystalGlow(mat, () => ref.current, encounterId, index);
  return (
    <group ref={ref}>
      <mesh material={mat} scale={[1, 1.6, 1]}>
        <octahedronGeometry args={[0.24]} />
      </mesh>
    </group>
  );
}

// ---------- Dormant enemies shown before their encounter spawns them ----------

/**
 * Shows a resting version of an encounter target until the live target exists (dummies on stands,
 * guardians on plinths, closed thorn pods). Hidden once the encounter is complete.
 */
export function DormantTarget({ encounterId, targetId, kind, position, rotationY = 0 }: { encounterId: string; targetId: string; kind: 'dummy' | 'guardian' | 'thorn-pod'; position: Vec3; rotationY?: number }) {
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>({ ...emptyPose(), defeated: kind === 'thorn-pod', dispel: kind === 'thorn-pod' ? 1 : 0 });
  useFrame((_, dt) => {
    pose.current.time += dt;
    const run = getRun();
    const g = group.current;
    if (!g || !run) return;
    const done = run.progress.completedEncounterIds.includes(encounterId);
    const live = run.findTarget(targetId) !== undefined || run.isRetired(targetId);
    // A target trimmed from the encounter (young-typist word budget) has no dormant stand-in.
    const inFight = run.level.encounters.get(encounterId)?.waves.some((w) => w.targets.some((t) => t.id === targetId)) ?? false;
    g.visible = inFight && !done && !live;
  });
  const model: ReactNode =
    kind === 'dummy' ? (
      <Dummy pose={pose} practice={false} />
    ) : kind === 'guardian' ? (
      <Guardian pose={pose} />
    ) : (
      // Realistic AI-pipeline pod; its Dispel clip (wilted) is the dormant pose.
      <Suspense fallback={<ThornPod pose={pose} />}>
        <CreatureModel url={creatureUrl('thorn-pod') ?? ''} pose={pose} />
      </Suspense>
    );
  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]}>
      {model}
    </group>
  );
}

/** Spawn position of a target in an encounter definition (so dormant props line up exactly). */
export function spawnPosition(encounterId: string, targetId: string): Vec3 {
  const def = getRun()?.level.encounters.get(encounterId) ?? LEVEL1_ENCOUNTERS.get(encounterId);
  for (const w of def?.waves ?? []) for (const t of w.targets) if (t.id === targetId) return t.position;
  return [0, 0, 0];
}

// ---------- Ward Warden (§14A.13) ----------

export interface WardenState {
  /** 0 = dormant/kneeling, 1 = fully risen. */
  rise: number;
  /** 0…1 how many shell plates have separated. */
  shellOpen: number;
  /** Core exposure / brightness. */
  core: number;
  /** Final calm, repaired form. */
  calm: number;
  /** -1 left arc, 1 right arc, 0 none: drives the attack pose. */
  attack: number;
  /** Bow in the ending. */
  bow: number;
  /** 0…1 progress through a strike (the Attack clip); 0 when not striking. */
  strike?: number;
}

function WardenFallback({ state, scale = 1 }: { state: { current: WardenState }; scale?: number }) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const halo = useRef<Group>(null);
  const plates = useRef<(Group | null)[]>([]);
  const core = useMemo(() => MAT.wardGold.clone(), []);
  const seam = useMemo(() => MAT.wardGold.clone(), []);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    const s = state.current;
    const t = time.current;
    if (!root.current || !torso.current || !armL.current || !armR.current || !halo.current) return;
    root.current.position.y = (1 - s.rise) * -1.2 + Math.sin(t * 0.9) * 0.08 * s.rise;
    torso.current.rotation.x = (1 - s.rise) * 0.5 + s.bow * 0.55;
    armL.current.rotation.z = 0.25 + s.rise * 0.2 + (s.attack < 0 ? 1.1 : 0);
    armR.current.rotation.z = -0.25 - s.rise * 0.2 - (s.attack > 0 ? 1.1 : 0);
    armL.current.rotation.x = -s.calm * 0.3;
    armR.current.rotation.x = -s.calm * 0.3;
    halo.current.rotation.z = t * (0.2 + (1 - s.calm) * 0.4);
    core.emissiveIntensity = 1.2 + s.core * 2.5 + Math.sin(t * 6) * 0.3 * (1 - s.calm);
    seam.emissiveIntensity = 1 + s.calm * 1.5;
    plates.current.forEach((p, i) => {
      if (!p) return;
      const open = Math.min(1, Math.max(0, s.shellOpen * 5 - i)) * (1 - s.calm);
      const a = (i / 5) * Math.PI * 2 + t * 0.4;
      p.position.set(Math.cos(a) * open * 2.6, 1.9 + Math.sin(a * 2) * 0.3 * open, Math.sin(a) * open * 1.2 + 0.55 * (1 - open));
      p.rotation.y = open * a;
    });
  });

  return (
    <group ref={root} scale={scale}>
      <group ref={torso} position={[0, 1.8, 0]}>
        <mesh scale={[1, 1.15, 0.7]} material={MAT.wardStone} castShadow>
          <sphereGeometry args={[0.75, 32, 24]} />
        </mesh>
        <mesh position={[0, 0.05, 0.42]} material={core}>
          <icosahedronGeometry args={[0.26, 1]} />
        </mesh>
        <group position={[0, 1.1, 0.05]}>
          <mesh scale={[0.8, 1, 0.85]} material={MAT.marble} castShadow>
            <sphereGeometry args={[0.38, 28, 20]} />
          </mesh>
          <mesh position={[0, 0.02, 0.31]} scale={[1, 0.12, 0.2]} material={seam}>
            <sphereGeometry args={[0.2, 16, 8]} />
          </mesh>
          <group ref={halo} position={[0, 0.1, -0.35]}>
            <mesh material={MAT.agedBrass}>
              <torusGeometry args={[0.62, 0.035, 10, 64]} />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => (
              <mesh key={i} position={[Math.cos((i / 8) * Math.PI * 2) * 0.62, Math.sin((i / 8) * Math.PI * 2) * 0.62, 0]} material={seam}>
                <octahedronGeometry args={[0.05]} />
              </mesh>
            ))}
          </group>
        </group>
        {[-1, 1].map((sgn) => (
          <group key={sgn} ref={sgn < 0 ? armL : armR} position={[0.85 * sgn, 0.45, 0]}>
            <mesh material={MAT.wardStone} castShadow>
              <sphereGeometry args={[0.3, 20, 16]} />
            </mesh>
            <mesh position={[0.1 * sgn, -0.75, 0]} material={MAT.wardStone} castShadow>
              <capsuleGeometry args={[0.16, 0.9, 8, 14]} />
            </mesh>
            <mesh position={[0.12 * sgn, -1.45, 0.05]} material={MAT.marble} castShadow>
              <sphereGeometry args={[0.2, 16, 12]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -1.0, 0]} scale={[0.8, 1, 0.6]} material={MAT.wardStone} castShadow>
          <coneGeometry args={[0.55, 1.3, 24]} />
        </mesh>
      </group>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} ref={(g) => void (plates.current[i] = g)} position={[0, 1.9, 0.55]}>
          <mesh scale={[1, 0.8, 0.3]} material={MAT.wardStone} castShadow>
            <sphereGeometry args={[0.32, 16, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export interface CameoKey {
  /** 0–1 through the beat. */
  readonly t: number;
  readonly position: Vec3;
  /** Arm raised towards something (drives the attack pose). */
  readonly arm?: number;
  /** Facing (radians about Y); defaults to the cameo's `rotationY`. */
  readonly yaw?: number;
}

/**
 * Scripted Warden appearance during one beat (LD-0: crash-landing in the courtyard, smashing
 * through the greenhouse roof): moves through keyframes by beat progress with eased motion.
 */
export function WardenCameo({ beatId, keys, scale = 1, rotationY = 0 }: { beatId: string; keys: readonly CameoKey[]; scale?: number; rotationY?: number }) {
  const group = useRef<Group>(null);
  const state = useRef<WardenState>({ rise: 1, shellOpen: 0, core: 0.6, calm: 0, attack: 0, bow: 0 });
  const index = getRun()?.level.beatIndexOf(beatId) ?? beatIndexOf(beatId);
  useFrame(() => {
    const g = group.current;
    const run = getRun();
    if (!g || !run) return;
    // The live beat, not React's copy: that lags a frame, and for that frame the cameo was drawn at the
    // start of its path using the next beat's progress (owner: the Warden "flashed" after leaving).
    g.visible = run.director.currentIndex === index;
    if (!g.visible) return;
    const t = run.beatProgress();
    let i = 0;
    while (i < keys.length - 2 && (keys[i + 1]?.t ?? 1) < t) i++;
    const a = keys[i];
    const b = keys[i + 1] ?? a;
    if (!a || !b) return;
    const span = Math.max(1e-3, b.t - a.t);
    const u = Math.min(1, Math.max(0, (t - a.t) / span));
    const e = u * u * (3 - 2 * u);
    g.position.set(a.position[0] + (b.position[0] - a.position[0]) * e, a.position[1] + (b.position[1] - a.position[1]) * e, a.position[2] + (b.position[2] - a.position[2]) * e);
    state.current.attack = (a.arm ?? 0) + ((b.arm ?? 0) - (a.arm ?? 0)) * e;
    const yawA = a.yaw ?? rotationY;
    g.rotation.y = yawA + ((b.yaw ?? rotationY) - yawA) * e;
  });
  return (
    <group ref={group} visible={false} rotation={[0, rotationY, 0]}>
      <WardenModel state={state} scale={scale} />
    </group>
  );
}

/** A Warden that simply hovers calmly (sightings, ending balcony). */
export function StaticWarden({ position, scale = 1, visible = true, rotationY = 0 }: { position: Vec3; scale?: number; visible?: boolean; rotationY?: number }) {
  const state = useRef<WardenState>({ rise: 1, shellOpen: 0, core: 0.3, calm: 0, attack: 0, bow: 0 });
  return (
    <group position={position} visible={visible} rotation={[0, rotationY, 0]}>
      <WardenModel state={state} scale={scale} />
    </group>
  );
}

// ---------- Characters ----------

function MiraFallback({ position, rotationY = 0, waving = false }: { position: Vec3; rotationY?: number; waving?: boolean }) {
  const arm = useRef<Group>(null);
  const body = useRef<Group>(null);
  const time = useRef(position[0] * 3.1 + position[2]);
  useFrame((_, dt) => {
    time.current += dt;
    if (body.current) body.current.position.y = Math.sin(time.current * 1.5) * 0.008;
    if (arm.current) arm.current.rotation.z = waving ? -2.4 + Math.sin(time.current * 6) * 0.35 : -0.15;
  });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={body}>
        <mesh position={[0, 0.5, 0]} material={MAT.navyCloth} castShadow>
          <cylinderGeometry args={[0.16, 0.3, 1.0, 20]} />
        </mesh>
        <mesh position={[0, 1.05, 0]} scale={[1, 1.1, 0.8]} material={MAT.navyCloth} castShadow>
          <sphereGeometry args={[0.2, 20, 16]} />
        </mesh>
        <mesh position={[0, 1.3, 0]} material={MAT.skin} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 0.1, 10]} />
        </mesh>
        <mesh position={[0, 1.44, 0.01]} scale={[0.9, 1.05, 0.95]} material={MAT.skin} castShadow>
          <sphereGeometry args={[0.13, 24, 20]} />
        </mesh>
        <mesh position={[0, 1.5, -0.02]} scale={[1, 0.85, 1.05]} material={MAT.hair} castShadow>
          <sphereGeometry args={[0.142, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[0.045 * s, 1.46, 0.115]} material={MAT.eyeDark}>
            <sphereGeometry args={[0.014, 10, 8]} />
          </mesh>
        ))}
        <mesh position={[-0.23, 1.05, 0]} rotation={[0, 0, 0.12]} material={MAT.navyCloth} castShadow>
          <capsuleGeometry args={[0.055, 0.45, 6, 10]} />
        </mesh>
        <group ref={arm} position={[0.23, 1.22, 0]}>
          <mesh position={[0, -0.24, 0]} material={MAT.navyCloth} castShadow>
            <capsuleGeometry args={[0.055, 0.45, 6, 10]} />
          </mesh>
        </group>
        <mesh position={[0.2, 0.85, -0.12]} rotation={[0, 0, -0.2]} material={MAT.lightOak} castShadow>
          <boxGeometry args={[0.22, 0.3, 0.1]} />
        </mesh>
        <mesh position={[0.1, 1.15, 0.17]} material={MAT.wardGold}>
          <circleGeometry args={[0.03, 12]} />
        </mesh>
      </group>
    </group>
  );
}

function OrinFallback({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.65, 0]} material={MAT.burgundyLeather} castShadow>
        <cylinderGeometry args={[0.22, 0.42, 1.3, 24]} />
      </mesh>
      <mesh position={[0, 1.45, 0]} scale={[1, 1.1, 0.8]} material={MAT.burgundyLeather} castShadow>
        <sphereGeometry args={[0.27, 24, 18]} />
      </mesh>
      <mesh position={[0, 1.88, 0]} material={MAT.skin} castShadow>
        <sphereGeometry args={[0.15, 24, 20]} />
      </mesh>
      <mesh position={[0, 1.78, 0.06]} scale={[1, 1.3, 0.7]} material={MAT.plaster} castShadow>
        <sphereGeometry args={[0.12, 16, 12, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55]} />
      </mesh>
      <mesh position={[0, 1.6, 0.2]} material={MAT.agedBrass}>
        <torusGeometry args={[0.07, 0.012, 8, 24]} />
      </mesh>
      <mesh position={[0.35, 0.95, 0.05]} rotation={[0, 0, -0.08]} material={MAT.darkOak} castShadow>
        <cylinderGeometry args={[0.025, 0.03, 1.9, 10]} />
      </mesh>
      <mesh position={[0.43, 1.92, 0.05]} material={MAT.crystal}>
        <octahedronGeometry args={[0.06]} />
      </mesh>
    </group>
  );
}

/** Background student silhouette for the celebration (authored idle sway, no random jitter). */
function StudentFallback({ position, rotationY = 0, robe = MAT.navyCloth, height = 1.45 }: { position: Vec3; rotationY?: number; robe?: MeshStandardMaterial; height?: number }) {
  const ref = useRef<Group>(null);
  const phase = useMemo(() => position[0] * 1.7 + position[2], [position]);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.2 + phase) * 0.02;
  });
  const k = height / 1.45;
  return (
    <group ref={ref} position={position} rotation={[0, rotationY, 0]} scale={k}>
      <mesh position={[0, 0.55, 0]} material={robe} castShadow>
        <cylinderGeometry args={[0.15, 0.3, 1.1, 16]} />
      </mesh>
      <mesh position={[0, 1.38, 0]} material={MAT.skin} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.44, -0.02]} material={MAT.hair}>
        <sphereGeometry args={[0.138, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      </mesh>
    </group>
  );
}

export function FloatingLantern({ position, seed = 1 }: { position: Vec3; seed?: number }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.7 + seed) * 0.15;
  });
  return (
    <group ref={ref} position={position}>
      <mesh material={MAT.lampGlow}>
        <cylinderGeometry args={[0.14, 0.11, 0.3, 12]} />
      </mesh>
      <mesh position={[0, 0.17, 0]} material={MAT.agedBrass}>
        <coneGeometry args={[0.15, 0.1, 12]} />
      </mesh>
    </group>
  );
}

export const UP = new Vector3(0, 1, 0);

// ---------- Characters (rigged GLBs with code-built fallbacks while streaming) ----------

export function Mira({ position, rotationY = 0, waving = false }: { position: Vec3; rotationY?: number; waving?: boolean }) {
  return (
    <Suspense fallback={<MiraFallback position={position} rotationY={rotationY} waving={waving} />}>
      <group position={position} rotation={[0, rotationY, 0]}>
        <CharacterModel id="mira" clip={waving ? 'Wave' : 'Idle'} speaker="mira" />
      </group>
    </Suspense>
  );
}

export function KeeperOrin({ position, rotationY = 0 }: { position: Vec3; rotationY?: number }) {
  return (
    <Suspense fallback={<OrinFallback position={position} rotationY={rotationY} />}>
      <group position={position} rotation={[0, rotationY, 0]}>
        <CharacterModel id="orin" speaker="orin" />
      </group>
    </Suspense>
  );
}

/** One raise of both hands (a Celebrate loop) then a rest, repeated; seconds. */
export const RAISE_SEC = 1.35;
export const RAISE_CYCLE_SEC = 3.4;

/**
 * A background student. `raising`: raises both hands, rests a couple of seconds, raises them again
 * (owner, 2026-10-16: cheering non-stop looked like exercising); otherwise cheers continuously.
 */
export function Student({ position, rotationY = 0, robe = MAT.navyCloth, height = 1.45, raising = false }: { position: Vec3; rotationY?: number; robe?: MeshStandardMaterial; height?: number; raising?: boolean }) {
  const id = robe === MAT.navyCloth ? 'student_a' : 'student_b';
  const phase = position[0] * 0.9 + position[2] * 0.3;
  const clip = raising ? () => (((performance.now() / 1000 + phase) % RAISE_CYCLE_SEC + RAISE_CYCLE_SEC) % RAISE_CYCLE_SEC < RAISE_SEC ? 'Celebrate' : 'Idle') : 'Celebrate';
  return (
    <Suspense fallback={<StudentFallback position={position} rotationY={rotationY} robe={robe} height={height} />}>
      <group position={position} rotation={[0, rotationY, 0]} scale={height / (id === 'student_a' ? 1.4 : 1.5)}>
        {/* Background students always use the lighter LOD1 (§14.6). */}
        <CharacterModel id={id === 'student_a' ? 'student_a_lod1' : 'student_b_lod1'} clip={clip} />
      </group>
    </Suspense>
  );
}

// ---------- Ward Warden GLB (assets-src/scripts/creatures/ward_warden.py) ----------

const WARDEN_URL = `${import.meta.env.BASE_URL}assets/creatures/ward_warden.glb`;

function WardenGLB({ state, scale = 1 }: { state: { current: WardenState }; scale?: number }) {
  const gltf = useGLTF(WARDEN_URL);
  const parts = useMemo(() => {
    const root = gltf.scene.clone(true);
    const energy: MeshStandardMaterial[] = [];
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const m = o.material as MeshStandardMaterial;
      if (m.name === 'Stone') o.material = MAT.wardStone;
      else if (m.name === 'Mask') o.material = MAT.marble;
      else if (m.name === 'Energy') {
        const e = m.clone();
        energy.push(e);
        o.material = e;
      }
    });
    return {
      root,
      torso: root.getObjectByName('Torso'),
      armL: root.getObjectByName('Arm_L'),
      armR: root.getObjectByName('Arm_R'),
      halo: root.getObjectByName('Halo'),
      energy,
    };
  }, [gltf.scene]);
  const lift = useRef<Group>(null);
  const plates = useRef<(Group | null)[]>([]);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    const s = state.current;
    const t = time.current;
    if (lift.current) lift.current.position.y = (1 - s.rise) * -1.2 + Math.sin(t * 0.9) * 0.08 * s.rise;
    if (parts.torso) parts.torso.rotation.x = (1 - s.rise) * 0.5 + s.bow * 0.55;
    if (parts.armL) {
      parts.armL.rotation.z = 0.1 + s.rise * 0.1 + (s.attack < 0 ? 1.1 * -s.attack : 0);
      parts.armL.rotation.x = -s.calm * 0.25;
    }
    if (parts.armR) {
      parts.armR.rotation.z = -0.1 - s.rise * 0.1 - (s.attack > 0 ? 1.1 * s.attack : 0);
      parts.armR.rotation.x = -s.calm * 0.25;
    }
    parts.halo?.rotateY(dt * (0.2 + (1 - s.calm) * 0.4));
    const glow = 2 + s.core * 4 + Math.sin(t * 6) * 0.6 * (1 - s.calm) + s.calm * 2;
    for (const m of parts.energy) m.emissiveIntensity = glow;
    plates.current.forEach((p, i) => {
      if (!p) return;
      const open = Math.min(1, Math.max(0, s.shellOpen * 5 - i)) * (1 - s.calm);
      const a = (i / 5) * Math.PI * 2 + t * 0.4;
      p.position.set(Math.cos(a) * open * 2.6, 1.9 + Math.sin(a * 2) * 0.3 * open, Math.sin(a) * open * 1.2 + 0.55 * (1 - open));
      p.rotation.y = open * a;
      p.visible = open > 0.02 || s.calm < 0.5;
    });
  });

  return (
    <group scale={scale}>
      <group ref={lift}>
        <primitive object={parts.root} />
      </group>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} ref={(g) => void (plates.current[i] = g)} position={[0, 1.9, 0.55]}>
          <mesh scale={[1, 0.8, 0.3]} material={MAT.wardStone} castShadow>
            <sphereGeometry args={[0.32, 20, 14]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const WARDEN_AI_URL = `${import.meta.env.BASE_URL}assets/creatures/ward_warden_ai.glb`;
/** The AI model is 3.2 m tall; the old Warden was about 2.8 m, so shrink it slightly to keep framing. */
const WARDEN_AI_SCALE = 0.9;

/**
 * The Ward Warden (owner, 2026-10-07: "improve the visual uniqueness of the warden"): the AI-pipeline
 * guardian of white marble and gold with a glowing star in its chest and a robe of starlight, posed
 * from the same state as before (rising, bowing, leaning into its attacks, the core glowing brighter
 * as it is reached), with its five shell plates orbiting it in the boss fight.
 */
function WardenAI({ state, scale = 1 }: { state: { current: WardenState }; scale?: number }) {
  const gltf = useGLTF(WARDEN_AI_URL);
  const parts = useMemo(() => {
    const root = cloneSkinned(gltf.scene) as Object3D;
    const glowing: MeshStandardMaterial[] = [];
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      const m = (o.material as MeshStandardMaterial).clone();
      // A soft blue-white inner light so the starlight robe and chest star glow.
      m.emissive = new Color('#9cc8ff');
      m.emissiveIntensity = 0.12;
      o.material = m;
      glowing.push(m);
    });
    return { root, glowing };
  }, [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(parts.root), [parts.root]);
  const clips = useMemo(() => {
    const idleClip = gltf.animations.find((c) => c.name === 'Idle');
    const attackClip = gltf.animations.find((c) => c.name === 'Attack');
    return { idle: idleClip ? mixer.clipAction(idleClip) : null, attack: attackClip ? mixer.clipAction(attackClip) : null };
  }, [gltf.animations, mixer]);
  const strikeWeight = useRef(0);
  useEffect(() => {
    clips.idle?.reset().play();
    // The Attack clip is scrubbed by state.strike (the rampart fight), never played on its own.
    if (clips.attack) {
      clips.attack.reset().play();
      clips.attack.paused = true;
      clips.attack.setEffectiveWeight(0);
    }
    return () => void mixer.stopAllAction();
  }, [clips, mixer]);
  const body = useRef<Group>(null);
  const plates = useRef<(Group | null)[]>([]);
  const time = useRef(0);
  useFrame((_, dt) => {
    const s = state.current;
    const striking = (s.strike ?? 0) > 0;
    strikeWeight.current += ((striking ? 1 : 0) - strikeWeight.current) * (1 - Math.exp(-12 * Math.min(dt, 0.1)));
    if (clips.attack) {
      clips.attack.time = (s.strike ?? 0) * clips.attack.getClip().duration;
      clips.attack.setEffectiveWeight(strikeWeight.current);
    }
    clips.idle?.setEffectiveWeight(1 - strikeWeight.current);
    mixer.update(Math.min(dt, 0.1));
    time.current += dt;
    const t = time.current;
    const b = body.current;
    if (b) {
      b.position.y = (1 - s.rise) * -1.2 + Math.sin(t * 0.9) * 0.08 * s.rise;
      b.rotation.x = (1 - s.rise) * 0.35 + s.bow * 0.4;
      b.rotation.z = -s.attack * 0.18;
    }
    const glow = 0.12 + s.core * 0.5 + Math.sin(t * 6) * 0.06 * (1 - s.calm) + s.calm * 0.25;
    for (const m of parts.glowing) m.emissiveIntensity = glow;
    plates.current.forEach((p, i) => {
      if (!p) return;
      const open = Math.min(1, Math.max(0, s.shellOpen * 5 - i)) * (1 - s.calm);
      const a = (i / 5) * Math.PI * 2 + t * 0.4;
      p.position.set(Math.cos(a) * (1.1 + open * 1.5), 1.9 + Math.sin(a * 2) * 0.3, Math.sin(a) * (0.6 + open * 0.6));
      p.rotation.set(0.3, a, 0);
      p.visible = open > 0.02;
    });
  });
  return (
    <group scale={scale}>
      <group ref={body}>
        <primitive object={parts.root} scale={WARDEN_AI_SCALE} />
      </group>
      {Array.from({ length: 5 }, (_, i) => (
        <group key={i} ref={(g) => void (plates.current[i] = g)} visible={false}>
          {/* A curved marble shell plate edged in gold */}
          <mesh scale={[1, 0.8, 0.28]} material={MAT.marble} castShadow>
            <sphereGeometry args={[0.34, 28, 18]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]} material={MAT.agedBrass}>
            <torusGeometry args={[0.33, 0.018, 8, 40]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function WardenModel({ state, scale = 1 }: { state: { current: WardenState }; scale?: number }) {
  return (
    <Suspense fallback={<WardenFallback state={state} scale={scale} />}>
      <ModelBoundary fallback={<WardenGLB state={state} scale={scale} />}>
        <WardenAI state={state} scale={scale} />
      </ModelBoundary>
    </Suspense>
  );
}
useGLTF.preload(WARDEN_AI_URL);

// ---------- Ward anchor GLB (assets-src/scripts/props/hero_props.py) ----------

function WardAnchorGLB({ position, encounterId, theme }: { position: Vec3; encounterId: string; theme: keyof typeof ANCHOR_THEME }) {
  const parts = useParts('ward_anchor');
  const rig = useMemo(() => {
    const nodes = [0, 1, 2].map((i) => {
      const mats: MeshStandardMaterial[] = [];
      parts.get(`Node_${i}`)?.traverse((o) => {
        if (o instanceof Mesh) {
          const m = (o.material as MeshStandardMaterial).clone();
          o.material = m;
          mats.push(m);
        }
      });
      return mats;
    });
    return {
      rings: [0, 1, 2].map((i) => parts.get(`Ring_${i}`)),
      shard: parts.get('Shard'),
      nodes,
    };
  }, [parts]);
  const accent = useMemo(() => new Color(ANCHOR_THEME[theme].accent), [theme]);
  const dim = useMemo(() => new Color('#1d2a3a'), []);
  const column = useRef<Group>(null);
  const level = useRef(0);
  const time = useRef(0);

  useFrame((_, dt) => {
    time.current += dt;
    const p = getRun()?.encounterProgress(encounterId);
    const goal = p ? (p.complete ? 1 : p.total ? p.done / p.total : 0) : 0;
    level.current = damp(level.current, goal, 3, dt);
    const l = level.current;
    const restored = p?.complete ?? false;
    // Broken: misaligned rings and dim, flickering nodes. Restored: aligned, turning smoothly, column of light.
    rig.rings.forEach((r, i) => {
      if (!r) return;
      const mis = (1 - l) * (0.5 + i * 0.3);
      r.rotation.set(mis * (i % 2 ? 1 : -1), restored ? time.current * (0.4 + i * 0.2) : Math.sin(time.current * 0.5 + i) * 0.1 * (1 - l), mis * 0.6);
    });
    rig.nodes.forEach((mats, i) => {
      const lit = l * 3 > i + 0.5;
      for (const m of mats) {
        m.emissive.copy(lit ? accent : dim);
        m.emissiveIntensity = lit ? 3 : 0.4 + Math.abs(Math.sin(time.current * 3 + i)) * 0.3 * (1 - l);
      }
    });
    if (rig.shard) {
      rig.shard.position.y = 1.5 + Math.sin(time.current * 1.4) * 0.05 * (0.3 + l);
      rig.shard.rotation.y = time.current * (0.2 + l);
    }
    if (column.current) {
      column.current.visible = restored;
      column.current.scale.y = damp(column.current.scale.y, restored ? 1 : 0.01, 2, dt);
    }
  });

  return (
    <group position={position}>
      <primitive object={parts.root} />
      {/* A rendered shaft of light rising from the restored anchor (was a solid cylinder). */}
      <group ref={column} position={[0, 1, 0]} visible={false}>
        <LightBeam height={22} width={1.4} color={ANCHOR_THEME[theme].accent} intensity={0.9} />
      </group>
    </group>
  );
}

export function WardAnchor(props: { position: Vec3; encounterId: string; theme: keyof typeof ANCHOR_THEME }) {
  return (
    <Suspense fallback={<WardAnchorFallback {...props} />}>
      <WardAnchorGLB {...props} />
    </Suspense>
  );
}
