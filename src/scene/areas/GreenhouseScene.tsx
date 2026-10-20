/** PLACEHOLDER Enchanted Greenhouse (§14A.21). Local coordinates; see src/level/areas/greenhouse.ts. */
import { placeStreak, STREAK_GEOMETRY, streakTexture } from '../glow';
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { AdditiveBlending, CanvasTexture, CatmullRomCurve3, DoubleSide, Mesh, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TubeGeometry, Vector3, type Group, type Object3D } from 'three';
import { GREENHOUSE_ANCHOR_POSITION, GREENHOUSE_ORIGIN, ROOF_PANEL_POSITION } from '../../level/areas/greenhouse';
import { beatIndexOf } from '../../level/level1Route';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { KitModel, Slab } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { WardAnchor, WardenCameo, useBeatIndex } from '../props';
import { Prop } from '../Prop';

const local = (p: Vec3): Vec3 => [p[0] - GREENHOUSE_ORIGIN[0], p[1] - GREENHOUSE_ORIGIN[1], p[2] - GREENHOUSE_ORIGIN[2]];
const WARDEN_BEAT = beatIndexOf('greenhouse-warden-scene');
const VINE_WORDS = ['greenhouse-vine', 'greenhouse-vine-2', 'greenhouse-vine-3'] as const;
/** Beats where the snapvine lunges (the camera hops forward just in time), and where it snaps. */
const SNAPVINE_LUNGES: Readonly<Record<string, readonly [number, number, number]>> = {
  'greenhouse-vine-hop-1': [0.7, 1.6, -16],
  'greenhouse-vine-hop-2': [0.8, 1.7, -20.4],
  'greenhouse-cross-bridge': [0.8, 1.7, -22.4],
};
const SNAPVINE_VISIBLE = new Set(['greenhouse-to-vine', 'greenhouse-vine', 'greenhouse-vine-2', 'greenhouse-vine-3', ...Object.keys(SNAPVINE_LUNGES)]);

export function GreenhouseScene() {
  return (
    <group name="greenhouse" position={GREENHOUSE_ORIGIN}>
      <MergeStatic>
      <Frame />
      <Beds />
      </MergeStatic>
      <Grounds />
      <Channel />
      <VineBridge />
      <Snapvine />
      <WardAnchor position={local(GREENHOUSE_ANCHOR_POSITION)} encounterId="greenhouse-anchor" theme="greenhouse" />
      <AnchorVines position={local(GREENHOUSE_ANCHOR_POSITION)} />
      <WardenRescue />
      <ConvergingBeams />
    </group>
  );
}

function Frame() {
  return (
    <group>
      {/* Paving stops at the water channel (z −26 … −20) so the vine bridge spans open water. */}
      <Slab x={[-11, 11]} y={[-0.1, 0]} z={[-20, 3]} material={MAT.paving} shadows={false} />
      <Slab x={[-11, 11]} y={[-0.1, 0]} z={[-53, -26]} material={MAT.paving} shadows={false} />
      {/* Victorian glasshouse: fourteen 4 m bays (kit_props greenhouse_bay) and glazed gable ends. */}
      {Array.from({ length: 14 }, (_, k) => (
        <KitModel key={k} id="greenhouse_bay" position={[0, 0, 3 - 4 * k]} />
      ))}
      <KitModel id="greenhouse_end" position={[0, 0, -53]} />
      <KitModel id="greenhouse_end" position={[0, 0, 3]} rotationY={Math.PI} />
    </group>
  );
}

/** What the glass looks out on: lawn, hedges and trees, so the house sits in a garden. */
function Grounds() {
  const trees = useMemo(
    () =>
      [-1, 1].flatMap((s) =>
        Array.from({ length: 6 }, (_, i) => ({ x: s * (17 + (i % 2) * 5), z: 6 - i * 11, id: i % 2 ? 'island_tree_01' : 'island_tree_02', h: 9 + (i % 3) * 2 })),
      ).concat(
        // A stand of trees beyond the far gable gives the view through the glass some depth.
        Array.from({ length: 6 }, (_, i) => ({ x: -18 + i * 7.2, z: -64 - (i % 2) * 6, id: i % 2 ? 'island_tree_01' : 'island_tree_02', h: 10 + (i % 3) * 2 })),
      ),
    [],
  );
  return (
    <group>
      {/* Grass everywhere except over the water channel. */}
      <Slab x={[-60, 60]} y={[-0.16, -0.11]} z={[-20, 40]} material={MAT.grass} shadows={false} />
      <Slab x={[-60, 60]} y={[-0.16, -0.11]} z={[-100, -26]} material={MAT.grass} shadows={false} />
      <Slab x={[-60, -10.5]} y={[-0.16, -0.11]} z={[-26, -20]} material={MAT.grass} shadows={false} />
      <Slab x={[10.5, 60]} y={[-0.16, -0.11]} z={[-26, -20]} material={MAT.grass} shadows={false} />
      {[-1, 1].map((s) =>
        Array.from({ length: 9 }, (_, i) => <Prop key={`${s}${i}`} id={`shrub_0${(i % 4) + 1}`} position={[s * 12.6, 0, 1 - i * 6.5]} height={1.6 + (i % 3) * 0.3} rotationY={i} />),
      )}
      {trees.map((t, i) => (
        <Prop key={i} id={t.id} position={[t.x, 0, t.z]} height={t.h} rotationY={i * 1.7} />
      ))}
    </group>
  );
}

function Beds() {
  const beds: [number, number, number, number][] = [
    [-8.5, -4, 3, 12],
    [8.5, -4, 3, 12],
    [-8.5, -16, 3, 6],
    [8.5, -16, 3, 6],
    [-8.5, -38, 3, 18],
    [8.5, -36, 3, 14],
  ];
  return (
    <group>
      {beds.map(([x, z, w, d], i) => (
        <group key={i}>
          <Slab x={[x - w / 2, x + w / 2]} y={[0, 0.66]} z={[z - d / 2, z + d / 2]} material={MAT.academyStoneDark} />
          {/* Coping stones overhanging the bed walls */}
          <Slab x={[x - w / 2 - 0.05, x + w / 2 + 0.05]} y={[0.66, 0.74]} z={[z - d / 2 - 0.05, z - d / 2 + 0.16]} material={MAT.academyStone} />
          <Slab x={[x - w / 2 - 0.05, x + w / 2 + 0.05]} y={[0.66, 0.74]} z={[z + d / 2 - 0.16, z + d / 2 + 0.05]} material={MAT.academyStone} />
          <Slab x={[x - w / 2 - 0.05, x - w / 2 + 0.16]} y={[0.66, 0.74]} z={[z - d / 2 + 0.16, z + d / 2 - 0.16]} material={MAT.academyStone} />
          <Slab x={[x + w / 2 - 0.16, x + w / 2 + 0.05]} y={[0.66, 0.74]} z={[z - d / 2 + 0.16, z + d / 2 - 0.16]} material={MAT.academyStone} />
          <Slab x={[x - w / 2 + 0.16, x + w / 2 - 0.16]} y={[0.66, 0.71]} z={[z - d / 2 + 0.16, z + d / 2 - 0.16]} material={MAT.soil} shadows={false} />
          {Array.from({ length: Math.max(2, Math.floor(d / 2.2)) }, (_, k) => (
            <BedPlant key={k} position={[x + ((k * 37) % 7) / 10 - 0.3, 0.72, z - d / 2 + 1 + k * 2.1]} index={i * 5 + k} />
          ))}
        </group>
      ))}
      {/* Clear central path; potted plants and benches at the edges only. */}
      {[[-4.5, 1], [4.5, -9], [-4, -32], [5, -47]].map(([x = 0, z = 0], i) => (
        <Prop key={i} id={i % 2 ? 'potted_plant_01' : 'potted_plant_04'} position={[x, 0, z]} height={1.4 + (i % 2) * 0.4} rotationY={i} />
      ))}
      {[[-6, 2.2], [6, 2.2], [-3.5, -50], [3.5, -50]].map(([x = 0, z = 0], i) => (
        <Prop key={`clay${i}`} id="planter_pot_clay" position={[x, 0, z]} height={0.7} />
      ))}
      {/* Potting bench with the gardener's tools */}
      <Prop id="WoodenTable_01" position={[-4.5, 0, -46]} height={0.85} rotationY={Math.PI / 2} />
      <Prop id="seeding_tray_01" position={[-4.5, 0.85, -45.6]} height={0.12} />
      <Prop id="watering_can_metal_01" position={[-4.4, 0.85, -46.7]} height={0.34} rotationY={0.8} />
      <Prop id="trowel_01" position={[-4.7, 0.86, -46.2]} height={0.05} rotationY={1.2} />
      <Prop id="wicker_basket_01" position={[-3.4, 0, -46.4]} height={0.38} />
    </group>
  );
}

/** CC0 plant models for the beds, mixed with the code-built families below for variety (§14A.21). */
const BED_PROPS = ['fern_02', 'calathea_orbifolia_01', 'nettle_plant', 'anthurium_botany_01', 'periwinkle_plant', 'wild_rooibos_bush', 'flower_gazania', 'pachira_aquatica_01', 'flower_ursinia', 'shrub_03', 'potted_plant_02'] as const;
const BED_HEIGHTS: Record<(typeof BED_PROPS)[number], number> = {
  fern_02: 0.9,
  nettle_plant: 0.8,
  periwinkle_plant: 0.4,
  wild_rooibos_bush: 1.1,
  flower_gazania: 0.35,
  flower_ursinia: 0.45,
  shrub_03: 1.0,
  potted_plant_02: 1.0,
  calathea_orbifolia_01: 0.7,
  anthurium_botany_01: 0.8,
  pachira_aquatica_01: 1.6,
};

function BedPlant({ position, index }: { position: Vec3; index: number }) {
  const id = BED_PROPS[index % BED_PROPS.length] ?? 'fern_02';
  return <Prop id={id} position={position} height={BED_HEIGHTS[id]} rotationY={index * 1.3} />;
}

function Channel() {
  return (
    <group>
      <Slab x={[-10.5, 10.5]} y={[-1.2, -1.1]} z={[-26, -20]} material={MAT.academyStoneDark} shadows={false} />
      <mesh position={[0, -0.6, -23]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <planeGeometry args={[21, 6]} />
      </mesh>
      {[-20, -26].map((z) => (
        <Slab key={z} x={[-10.5, 10.5]} y={[-1.2, 0]} z={[z - 0.15, z + 0.15]} material={MAT.academyStone} />
      ))}
    </group>
  );
}

/** Grows as the three vine words are typed; the camera then crosses it on rails. */
function VineBridge() {
  const segments = useRef<(Group | null)[]>([]);
  useFrame((_, dt) => {
    // One bridge word per encounter (the Snapvine Chase hops the camera forward between them).
    const run = getRun();
    const grown = VINE_WORDS.reduce((n, id) => n + (run?.encounterProgress(id).complete ? 1 : 0), 0);
    segments.current.forEach((g, i) => {
      if (!g) return;
      const goal = grown > i ? 1 : 0.02;
      g.scale.z += (goal - g.scale.z) * (1 - Math.exp(-3 * Math.min(dt, 0.1)));
      g.visible = g.scale.z > 0.03;
    });
  });
  return (
    <group position={[0, -0.05, -20]}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0, -i * 2]} ref={(g) => void (segments.current[i] = g)} scale={[1, 1, 0.02]}>
          {/* A woven deck of thick vine stems, slightly bowed. */}
          {[-0.56, -0.28, 0, 0.28, 0.56].map((x, k) => (
            <mesh key={x} position={[x, -0.02 - Math.abs(x) * 0.08, -1]} rotation={[Math.PI / 2, 0, (k - 2) * 0.03]} material={MAT.stem} castShadow receiveShadow>
              <cylinderGeometry args={[0.12, 0.13, 2.08, 10]} />
            </mesh>
          ))}
          {[-0.5, 0.5].map((z) => (
            <mesh key={z} position={[0, -0.04, -1 + z]} rotation={[0, 0, Math.PI / 2]} material={MAT.stem}>
              <cylinderGeometry args={[0.06, 0.06, 1.5, 8]} />
            </mesh>
          ))}
          {[-0.85, 0.85].map((x) => (
            <mesh key={x} position={[x, 0.5, -1]} rotation={[Math.PI / 2, 0, 0]} material={MAT.leaf}>
              <cylinderGeometry args={[0.05, 0.05, 2.05, 6]} />
            </mesh>
          ))}
          <mesh position={[0.6, 0.25, -0.6]} rotation={[0.4, 0.3, 0.8]} scale={[0.6, 0.08, 0.3]} material={MAT.leaf}>
            <sphereGeometry args={[0.4, 10, 6]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/**
 * LD-13 midpoint reversal as revised by LD-0: the roof panel shatters, the Warden smashes down through
 * the glass, catches the falling sheet in one hand, sets it down safely and leaps away.
 */
function WardenRescue() {
  const beat = useBeatIndex();
  const panel = useRef<Group>(null);
  const panelHome = local(ROOF_PANEL_POSITION);
  useFrame(() => {
    if (!panel.current) return;
    const t = beat === WARDEN_BEAT ? (getRun()?.beatProgress() ?? 0) : beat > WARDEN_BEAT ? 1 : 0;
    // Falls (0.08–0.3), is caught in the Warden's hand (0.3–0.45), then set down by 0.6.
    const fall = Math.min(1, Math.max(0, (t - 0.08) / 0.22));
    const set = Math.min(1, Math.max(0, (t - 0.45) / 0.15));
    const caught: [number, number, number] = [6.2, 2.6, -37];
    if (t >= 0.6 || beat > WARDEN_BEAT) {
      panel.current.position.set(6.5, 0.6, -38);
      panel.current.rotation.set(0, 0, 1.3);
    } else if (t >= 0.3) {
      panel.current.position.set(caught[0] + (6.5 - caught[0]) * set, caught[1] + (0.6 - caught[1]) * set, caught[2] + (-38 - caught[2]) * set);
      panel.current.rotation.set(0, 0, 0.6 + 0.7 * set);
    } else {
      panel.current.position.set(panelHome[0] + (caught[0] - panelHome[0]) * fall, panelHome[1] + (caught[1] - panelHome[1]) * fall * fall, panelHome[2] + (caught[2] - panelHome[2]) * fall);
      panel.current.rotation.set(fall * 0.4, 0, fall * 0.6);
    }
  });
  return (
    <group>
      <group ref={panel}>
        <mesh material={MAT.glass}>
          <boxGeometry args={[1.4, 0.04, 1.0]} />
        </mesh>
        <mesh material={MAT.darkSteel}>
          <boxGeometry args={[1.46, 0.06, 0.06]} />
        </mesh>
      </group>
      <WardenCameo
        beatId="greenhouse-warden-scene"
        scale={0.8}
        rotationY={-1.9}
        keys={[
          { t: 0, position: [5.5, 13, -36] },
          { t: 0.08, position: [5.5, 9, -36] },
          { t: 0.3, position: [7.2, 0.3, -37] },
          { t: 0.38, position: [7.2, 0.3, -37], arm: 1 },
          { t: 0.6, position: [7.2, 0.3, -37.5], arm: 0.4 },
          { t: 0.78, position: [7.2, 0.3, -37.5] },
          { t: 1, position: [5.5, 16, -36] },
        ]}
      />
    </group>
  );
}

const SNAPVINE_ROOT: [number, number, number] = [5, -1, -23.5];
const aim = new Vector3();
const SNAPVINE_COIL: [number, number, number] = [3.4, 3.1, -24.5];

const SNAPVINE_URL = `${import.meta.env.BASE_URL}assets/creatures/snapvine_head.glb`;
/** The model is 1.6 m tall with its jaws at the top; this scale makes the jaws about 2 m across. */
const SNAPVINE_SCALE = 2.2;
/** Height of the jaws above the model's own base, after scaling. */
const SNAPVINE_JAW = 1.15 * SNAPVINE_SCALE;
const toCamera = new Vector3();

/**
 * The giant snapvine (LD-0 Snapvine Chase): the AI-built snapvine (Flux2 → TRELLIS.2 → Blender, rigged
 * with Idle and Attack clips) on a long stem rising out of the channel. It sways in a coil, then
 * lunges at the spot the camera has just left and snaps shut on empty air (scripted, never a hit).
 */
/**
 * The snapvine's stem: uneven strands wound loosely together, each its own thickness, twisting at its
 * own uneven rate, bulging apart and pinching back in, plus two thin tendrils that peel off and curl
 * (owner, 2026-10-19: the even three-strand rope was "twisted too nicely").
 */
interface StrandSpec {
  readonly radius: number;
  /** Distance from the stem's centre line. */
  readonly sep: number;
  /** Whole turns round the stem from root to head. */
  readonly turns: number;
  readonly phase: number;
  /** Tendrils only: where along the stem it peels off (0–1) and how far along it runs. */
  readonly from?: number;
  readonly span?: number;
}
const STRAND_SPECS: readonly StrandSpec[] = [
  { radius: 0.16, sep: 0.09, turns: 1.4, phase: 0 },
  { radius: 0.12, sep: 0.15, turns: 2.3, phase: 2.1 },
  { radius: 0.1, sep: 0.13, turns: 0.9, phase: 4.2 },
  { radius: 0.06, sep: 0.2, turns: 3.1, phase: 1.1 },
  { radius: 0.035, sep: 0.2, turns: 0, phase: 0.6, from: 0.22, span: 0.28 },
  { radius: 0.03, sep: 0.18, turns: 0, phase: 3.6, from: 0.52, span: 0.24 },
];
const STEM_SAMPLES = 36;

/**
 * A fibrous vine skin: lengthwise streaks of light and dark green with knotty bands, so the stem reads
 * as a living plant like the generated head, not a plain green pipe (owner, 2026-10-17: "blockish").
 */
function vineSkin(): MeshStandardMaterial {
  const W = 128;
  const Hh = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = Hh;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // u (canvas x) runs along the stem, v (canvas y) around it.
    ctx.fillStyle = '#3d6a26';
    ctx.fillRect(0, 0, W, Hh);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) {
      const y = rnd() * Hh;
      const light = rnd() > 0.5;
      ctx.fillStyle = light ? `rgba(150, 196, 84, ${0.18 + rnd() * 0.25})` : `rgba(18, 44, 14, ${0.2 + rnd() * 0.3})`;
      ctx.fillRect(0, y, W, 1 + rnd() * 4);
    }
    // Knots where leaves once grew.
    for (let i = 0; i < 3; i++) {
      const x = (i + 0.3) * (W / 3);
      ctx.fillStyle = 'rgba(28, 52, 16, 0.55)';
      ctx.fillRect(x, 0, 3, Hh);
      ctx.fillStyle = 'rgba(170, 206, 104, 0.35)';
      ctx.fillRect(x + 3, 0, 2, Hh);
    }
  }
  const map = new CanvasTexture(canvas);
  map.wrapS = RepeatWrapping;
  map.wrapT = RepeatWrapping;
  map.repeat.set(5, 1);
  map.colorSpace = SRGBColorSpace;
  return new MeshStandardMaterial({ map, roughness: 0.62, color: '#ffffff' });
}

const strandPoint = new Vector3();
const frameN = new Vector3();
const frameB = new Vector3();
const tangent = new Vector3();
const worldUp = new Vector3(0, 1, 0);

/** Points of strand `i` winding round `centre`, irregularly, or a tendril curling away from it. */
function strandPoints(centre: CatmullRomCurve3, i: number, out: Vector3[]): void {
  const spec = STRAND_SPECS[i];
  if (!spec) return;
  for (let s = 0; s < STEM_SAMPLES; s++) {
    const k = s / (STEM_SAMPLES - 1);
    const tendril = spec.from !== undefined;
    const u = tendril ? (spec.from ?? 0) + k * (spec.span ?? 0) : k;
    centre.getPointAt(Math.min(1, u), strandPoint);
    centre.getTangentAt(Math.min(1, u), tangent);
    frameN.crossVectors(tangent, worldUp);
    if (frameN.lengthSq() < 1e-4) frameN.set(1, 0, 0);
    frameN.normalize();
    frameB.crossVectors(tangent, frameN).normalize();
    let a: number;
    let r: number;
    if (tendril) {
      // Peels away from the stem and coils into a spiral at its tip.
      a = spec.phase + k * k * 7;
      r = spec.sep + k * 0.55 * (1 - k * 0.45);
    } else {
      // An uneven twist (faster here, slower there) and strands that drift apart and pinch together.
      a = spec.phase + u * spec.turns * Math.PI * 2 + Math.sin(u * 7.3 + i * 1.7) * 0.9 + Math.sin(u * 13.1 + i * 0.6) * 0.45;
      r = spec.sep * (0.55 + 0.55 * (0.5 + 0.5 * Math.sin(u * 5.1 + i * 2.3)) + 0.25 * Math.sin(u * 11 + i)) * (1.1 - u * 0.35);
    }
    const p = out[s] ?? (out[s] = new Vector3());
    p.copy(strandPoint).addScaledVector(frameN, Math.cos(a) * r).addScaledVector(frameB, Math.sin(a) * r);
    if (tendril) p.addScaledVector(tangent, k * 0.15);
  }
}

function Snapvine() {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const strands = useRef<(Mesh | null)[]>([]);
  const skin = useMemo(() => vineSkin(), []);
  const strandCurves = useMemo(() => Array.from({ length: STRAND_SPECS.length }, () => new CatmullRomCurve3(Array.from({ length: STEM_SAMPLES }, () => new Vector3()))), []);
  const time = useRef(0);
  const striking = useRef(false);
  const { scene, animations } = useGLTF(SNAPVINE_URL);
  const { actions } = useAnimations(animations, head);
  const headPos = useMemo(() => new Vector3(...SNAPVINE_COIL), []);
  const goal = useMemo(() => new Vector3(), []);
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(...SNAPVINE_ROOT),
        new Vector3(SNAPVINE_ROOT[0], SNAPVINE_ROOT[1] + 0.8, SNAPVINE_ROOT[2]),
        new Vector3(4.6, 1.4, -24),
        new Vector3(3.6, 0, -24.5),
        headPos.clone(),
      ]),
    [headPos],
  );
  useEffect(() => {
    scene.traverse((o: Object3D) => {
      if (o instanceof Mesh) o.castShadow = true;
    });
    actions.Idle?.reset().play();
  }, [scene, actions]);
  useFrame((_, delta) => {
    const g = root.current;
    const run = getRun();
    if (!g || !run) return;
    const id = run.director.currentBeat?.id ?? '';
    g.visible = SNAPVINE_VISIBLE.has(id);
    if (!g.visible) return;
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const t = time.current;
    const lunge = SNAPVINE_LUNGES[id];
    const p = lunge ? run.beatProgress() : 0;
    // Wind up (0–0.25), strike (0.25–0.55), snap and recoil (0.55–1).
    const strike = !!lunge && p > 0.2 && p < 0.9;
    if (lunge && p > 0.25 && p < 0.9) {
      const u = Math.min(1, (p - 0.25) / 0.3);
      goal.set(SNAPVINE_COIL[0] + (lunge[0] - SNAPVINE_COIL[0]) * u, SNAPVINE_COIL[1] + (lunge[1] - SNAPVINE_COIL[1]) * u, SNAPVINE_COIL[2] + (lunge[2] - SNAPVINE_COIL[2]) * u);
    } else {
      const coil = lunge && p <= 0.25 ? 1 + p * 2 : 1;
      goal.set(SNAPVINE_COIL[0] + Math.sin(t * 1.3) * 0.4 * coil, SNAPVINE_COIL[1] + Math.sin(t * 2.1) * 0.25, SNAPVINE_COIL[2] - (lunge ? p * 1.2 : 0));
    }
    if (strike !== striking.current) {
      striking.current = strike;
      const to = strike ? actions.Attack : actions.Idle;
      const from = strike ? actions.Idle : actions.Attack;
      if (to) to.reset().fadeIn(0.15).play();
      from?.fadeOut(0.15);
    }
    headPos.lerp(goal, 1 - Math.exp(-(lunge && p > 0.25 ? 14 : 4) * dt));
    const h = head.current;
    if (h) {
      // The model stands on its base; the jaws sit at headPos. It turns (never tilts) to face its prey.
      h.position.set(headPos.x, headPos.y - SNAPVINE_JAW, headPos.z);
      const look = lunge ? aim.set(lunge[0] - 2, lunge[1], lunge[2] + 2) : toCamera.copy(run.director.pose.position);
      h.rotation.y = Math.atan2(look.x - headPos.x, look.z - headPos.z);
    }
    // Rebuild the stem from the roots to the model's base: it rises straight out of the water and
    // enters the base upright (no elbow), as three strands twisted together.
    const pts = curve.points;
    const baseY = headPos.y - SNAPVINE_JAW + 0.25;
    pts[4]?.set(headPos.x, baseY, headPos.z);
    pts[3]?.set(headPos.x, baseY - 0.45, headPos.z);
    pts[2]?.set((SNAPVINE_ROOT[0] + headPos.x) * 0.5 + 0.25, (SNAPVINE_ROOT[1] + 0.8 + baseY - 0.45) * 0.5, (SNAPVINE_ROOT[2] + headPos.z) * 0.5);
    curve.updateArcLengths();
    strands.current.forEach((m, i) => {
      const c = strandCurves[i];
      if (!m || !c) return;
      strandPoints(curve, i, c.points);
      c.updateArcLengths();
      m.geometry.dispose();
      m.geometry = new TubeGeometry(c, 64, STRAND_SPECS[i]?.radius ?? 0.1, (STRAND_SPECS[i]?.radius ?? 0.1) > 0.05 ? 10 : 6, false);
    });
  });
  return (
    <group ref={root} visible={false}>
      {strandCurves.map((_, i) => (
        <mesh key={i} ref={(m) => void (strands.current[i] = m)} material={skin} castShadow />
      ))}
      <group ref={head} scale={SNAPVINE_SCALE}>
        <primitive object={scene} />
      </group>
    </group>
  );
}
useGLTF.preload(SNAPVINE_URL);

const PILLAR_BEAT = beatIndexOf('greenhouse-anchor-pillar');
/** Where the three anchor beams meet: high over the Moon Tower, seen through the glass roof. */
const CONVERGE = new Vector3(-14, 70, -120);
const BEAM_SOURCES: readonly { from: Vector3; color: string }[] = [
  { from: new Vector3(-6, 0, -46), color: '#8ff0a8' },
  { from: new Vector3(-160, 0, -40), color: '#ffcf6a' },
  { from: new Vector3(90, 0, -150), color: '#9fc8ff' },
];
const beamTo = new Vector3();

/**
 * LD-13: after the third anchor, all three anchor beams converge toward the Moon Tower: the greenhouse
 * beam joined by the courtyard and library beams from across the campus.
 */
function ConvergingBeams() {
  const beams = useRef<(Mesh | null)[]>([]);
  const time = useRef(0);
  const beat = useBeatIndex();
  const streak = useMemo(() => streakTexture(), []);
  useFrame((state, dt) => {
    const on = PILLAR_BEAT >= 0 && beat >= PILLAR_BEAT;
    time.current = on ? time.current + Math.min(dt, 0.1) : 0;
    beams.current.forEach((m, i) => {
      if (!m) return;
      m.visible = on;
      if (!on) return;
      const src = BEAM_SOURCES[i];
      if (!src) return;
      // Each beam shoots up in turn and reaches the meeting point.
      const grow = Math.min(1, Math.max(0, (time.current - i * 0.35) / 1.2));
      beamTo.copy(src.from).lerp(CONVERGE, grow);
      const pulse = 1 + Math.sin(time.current * 6 + i) * 0.15;
      // A rendered streak of light (was a solid cylinder).
      placeStreak(m, src.from, beamTo, 0.7 * pulse, state.camera.position);
    });
  });
  return (
    <group>
      {BEAM_SOURCES.map((b, i) => (
        <mesh key={i} ref={(m) => void (beams.current[i] = m)} visible={false} frustumCulled={false} geometry={STREAK_GEOMETRY}>
          <meshBasicMaterial map={streak} color={b.color} transparent opacity={0.95} blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} side={DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * The vines tying up the greenhouse anchor (owner, 2026-10-08: "it's supposed to be covered in vines",
 * AI-pipeline `vine_tangle`). Each knot untied loosens and lowers them; once the anchor is free they sink
 * into the soil.
 */
function AnchorVines({ position }: { position: Vec3 }) {
  const group = useRef<Group>(null);
  const loose = useRef(0);
  useFrame((_, delta) => {
    const g = group.current;
    const run = getRun();
    if (!g || !run) return;
    const done = run.progress.completedEncounterIds.includes('greenhouse-anchor');
    const live = run.encounter?.def.id === 'greenhouse-anchor' ? run.encounter.totalDefeats : 0;
    const goal = done ? 4 : live;
    loose.current += (goal - loose.current) * (1 - Math.exp(-3 * Math.min(delta, 0.1)));
    const k = loose.current;
    g.visible = k < 3.95;
    g.scale.set(1 + k * 0.12, Math.max(0.05, 1 - k * 0.24), 1 + k * 0.12);
    g.position.set(position[0], position[1] - Math.max(0, k - 3) * 2.4, position[2]);
  });
  return (
    <group ref={group} position={position}>
      <ModelBoundary fallback={null}>
        <Suspense fallback={null}>
          <Prop id="vine_tangle" position={[0, -0.05, 0]} height={2.5} />
        </Suspense>
      </ModelBoundary>
    </group>
  );
}
