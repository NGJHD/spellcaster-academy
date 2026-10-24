/** PLACEHOLDER Hall of Portraits. Local coordinates; see src/level/areas/portraits.ts. */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, SpriteMaterial, type Sprite } from 'three';
import { PLAQUE_POSITIONS, PORTRAITS_ORIGIN } from '../../level/areas/portraits';
import { Arch, Box, KitModel, Portrait, Rug, Slab, WallLamp } from '../kit';
import { MAT } from '../materials';
import { MergeStatic } from '../MergeStatic';
import { StaticWarden } from '../props';
import { CastleDoor } from '../CastleDoor';
import { Prop } from '../Prop';
import { PoolLight } from '../LightPool';
import { fxSprite } from '../fxSprites';

const W = 3;
const H = 5.5;
/** Left wall: still lifes and bust studies; right wall mixes in the academy landscapes. */
const LEFT = ['painting_0', 'painting_1', 'painting_4', 'painting_2', 'painting_6', 'painting_3', 'painting_5'] as const;
const RIGHT = ['landscape_0', 'painting_7', 'painting_9', 'landscape_1', 'painting_8'] as const;

export function PortraitsScene() {
  return (
    <group name="portraits" position={PORTRAITS_ORIGIN}>
      <MergeStatic>
      <Slab x={[-W, W]} y={[-0.1, 0]} z={[-41, 2]} material={MAT.paving} shadows={false} />
      <Rug position={[0, 0, -19.5]} size={[2.2, 40]} />
      <Slab x={[-W - 0.3, -W]} y={[0, H]} z={[-41, 2]} material={MAT.plaster} />
      <Slab x={[W, W + 0.3]} y={[0, H]} z={[-41, 2]} material={MAT.plaster} />
      {/* Oak wainscot with dado rail, skirting and a picture rail */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab x={side < 0 ? [-W, -W + 0.04] : [W - 0.04, W]} y={[0, 1.2]} z={[-41, 2]} material={MAT.panelWood} />
          <Slab x={side < 0 ? [-W, -W + 0.07] : [W - 0.07, W]} y={[1.2, 1.27]} z={[-41, 2]} material={MAT.darkOak} />
          <Slab x={side < 0 ? [-W, -W + 0.06] : [W - 0.06, W]} y={[0, 0.16]} z={[-41, 2]} material={MAT.darkOak} />
          <Slab x={side < 0 ? [-W, -W + 0.05] : [W - 0.05, W]} y={[3.85, 3.92]} z={[-41, 2]} material={MAT.darkOak} />
        </group>
      ))}
      <Slab x={[-W - 0.3, W + 0.3]} y={[H, H + 0.3]} z={[-41, 2]} material={MAT.darkOak} />
      <Slab x={[-W, W]} y={[0, H]} z={[-41.3, -41]} material={MAT.academyStone} />
      {Array.from({ length: 8 }, (_, i) => -2 - i * 5).map((z) => (
        <Arch key={z} position={[0, H - 0.2, z]} width={W * 2} thickness={0.25} material={MAT.darkOak} />
      ))}
      {Array.from({ length: 7 }, (_, i) => -3 - i * 5.2).map((z, i) => (
        <group key={z}>
          {/* The Warden's portrait and the empty frame hang at z −21…−23 (no painting there: they overlapped) */}
          {i !== 4 && <Portrait position={[-W + 0.05, 2.5, z]} rotationY={Math.PI / 2} painting={LEFT[i]} />}
          {i !== 2 && i !== 5 && (
            <Portrait
              position={[W - 0.05, 2.5, z - 2]}
              rotationY={-Math.PI / 2}
              painting={RIGHT[[0, 1, -1, 2, 3, -1, 4][i] ?? 0]}
              size={RIGHT[[0, 1, -1, 2, 3, -1, 4][i] ?? 0]?.startsWith('landscape') ? [1.6, 1.1] : [1.0, 1.3]}
            />
          )}
          <WallLamp position={[-W + 0.02, 3.8, z - 2.6]} rotationY={Math.PI / 2} />
          <PoolLight position={[0, 4.2, z - 1]} color="#ffcf98" intensity={7} distance={8} decay={2} />
        </group>
      ))}
      </MergeStatic>
      <FocusFountain />
      <CommunicationMirror />
      {PLAQUE_POSITIONS.map((p, i) => (
        <group key={i} position={[p[0] - PORTRAITS_ORIGIN[0] - 0.05, p[1] - PORTRAITS_ORIGIN[1], p[2] - PORTRAITS_ORIGIN[2]]} rotation={[0, -Math.PI / 2, 0]}>
          <Box position={[0, 0, 0]} size={[0.9, 0.6, 0.06]} material={MAT.agedBrass} />
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} position={[-0.25 + k * 0.17, ((k * 37 + i * 11) % 5) * 0.05 - 0.1, 0.04]} material={MAT.wardBlue}>
              <circleGeometry args={[0.025, 8]} />
            </mesh>
          ))}
        </group>
      ))}
      <KitModel id="gallery_bench" position={[-2.2, 0, -16]} rotationY={Math.PI / 2} />
      <KitModel id="gallery_bench" position={[2.2, 0, -24]} rotationY={-Math.PI / 2} />
      {/* The oak door to the greenhouse (it was a window with a statue in front of it) */}
      <group position={[0, 0, -41]}>
        <CastleDoor height={3.6} />
      </group>
      <Prop id="gothic_statue" position={[-2.3, 0, -38.6]} height={2.3} rotationY={0.5} />
      <Prop id="potted_plant_02" position={[-2.4, 0, -35]} height={1.3} />
      <Prop id="potted_plant_02" position={[2.4, 0, -6]} height={1.3} rotationY={2} />
      <Prop id="brass_candleholders" position={[2.2, 0.9, -13.2]} height={0.3} />
    </group>
  );
}

/** Sparkles of healing light rising off the fountain's top basin (painted motes). */
const SPARKLES = 10;

function FocusFountain() {
  const sparkles = useRef<(Sprite | null)[]>([]);
  const mats = useMemo(
    () => Array.from({ length: SPARKLES }, () => new SpriteMaterial({ map: fxSprite('mote'), color: '#bfe6ff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false })),
    [],
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    sparkles.current.forEach((sp, i) => {
      const m = mats[i];
      if (!sp || !m) return;
      // Each one drifts up from the basin in a slow spiral, swelling and fading out.
      const u = (t * 0.32 + i / SPARKLES) % 1;
      const a = i * 2.4 + u * 2.5;
      const r = 0.08 + u * 0.22;
      sp.position.set(Math.cos(a) * r, 1.45 + u * 1.3, Math.sin(a) * r);
      sp.scale.setScalar(0.07 + Math.sin(u * Math.PI) * 0.08);
      m.opacity = Math.sin(u * Math.PI) * 0.9;
    });
  });
  return (
    <group position={[2.2, 0, -14]}>
      <KitModel id="fountain_basin" />
      <mesh position={[0, 0.88, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[0.7, 40]} />
      </mesh>
      <mesh position={[0, 1.38, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.water}>
        <circleGeometry args={[0.24, 24]} />
      </mesh>
      {mats.map((m, i) => (
        <sprite key={i} ref={(sp) => void (sparkles.current[i] = sp)} material={m} />
      ))}
      <PoolLight position={[0, 1.4, 0]} color="#bfe6ff" intensity={5} distance={5} />
    </group>
  );
}

/**
 * Two frantic zig-zag strokes across the scratched-out nameplate (0.6 × 0.12 m), uneven in spacing,
 * height and slant (owner, 2026-10-23: one even zig-zag looked too tidy): centre x, y, length, angle.
 */
const SCRATCH = (() => {
  let seed = 7;
  const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const strokes: (readonly [number, number, number, number])[] = [];
  for (let pass = 0; pass < 2; pass++) {
    const pts: [number, number][] = [];
    let x = -0.29 + rand() * 0.02;
    for (let i = 0; x < 0.29; i++) {
      const reach = 0.018 + rand() * 0.03;
      pts.push([x, (i % 2 ? 1 : -1) * reach + (rand() - 0.5) * 0.016]);
      x += 0.015 + rand() * 0.05;
    }
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i - 1] ?? [0, 0];
      const [qx, qy] = pts[i] ?? [0, 0];
      strokes.push([(px + qx) / 2, (py + qy) / 2, Math.hypot(qx - px, qy - py) + 0.01, Math.atan2(qy - py, qx - px)]);
    }
  }
  return strokes;
})();

/**
 * The clue Mira finds (por-4): the Warden's portrait, and beside it an empty frame whose brass
 * nameplate has been scratched out. The camera looks here while the line plays. They hang level with
 * the other portraits (owner, 2026-10-23: they hung much lower).
 */
function CommunicationMirror() {
  return (
    <group position={[-W + 0.06, 2.5, -22]} rotation={[0, Math.PI / 2, 0]}>
      {/* The Warden's portrait */}
      <group position={[0.9, 0, 0]}>
        <KitModel id="frame_1x1_3" scale={[1.0, 1.25, 1]} />
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[1.0, 1.6]} />
          <meshStandardMaterial color="#3a4a5e" roughness={0.9} />
        </mesh>
        <group position={[0, -0.62, 0.05]} scale={0.27}>
          <StaticWarden position={[0, 0, 0]} />
        </group>
        <Box position={[0, -1.05, 0.06]} size={[0.6, 0.12, 0.02]} material={MAT.agedBrass} />
      </group>
      {/* The empty frame: no painting, and its name scratched away */}
      <group position={[-0.9, 0, 0]}>
        <KitModel id="frame_1x1_3" scale={[1.0, 1.25, 1]} />
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[1.0, 1.6]} />
          <meshStandardMaterial color="#1a1612" roughness={1} />
        </mesh>
        <Box position={[0, -1.05, 0.06]} size={[0.6, 0.12, 0.02]} material={MAT.agedBrass} />
        {/* Its name scored out: a hard zig-zag from end to end of the plate (owner, 2026-10-23) */}
        {SCRATCH.map(([x, y, length, angle]) => (
          <Box key={`${x}-${y}`} position={[x, -1.05 + y, 0.075]} size={[length, 0.014, 0.01]} rotation={[0, 0, angle]} material={MAT.ink} />
        ))}
      </group>
    </group>
  );
}

