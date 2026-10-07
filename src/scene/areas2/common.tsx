/**
 * Shared Level 2/3 scene pieces: beat/flag hooks, a big boss model with a code-built fallback, and the
 * burning-academy dressing (silhouette blocks of the academy on fire behind the action).
 */
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { CatmullRomCurve3, MeshStandardMaterial, TubeGeometry, Vector3, type Group } from 'three';
import { BUILT_AI_FILES, CreatureModel } from '../../enemies/CreatureModel';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { emptyPose, type TargetPose } from '../../enemies/TargetVisuals';
import type { Vec3 } from '../../level/rail/railTypes';
import { getRun } from '../../state/gameStore';
import { Box } from '../kit';
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
}: {
  file: string;
  position: Vec3;
  rotationY?: number;
  scale?: number;
  fromBeat: string;
  goneFlag: string;
  fallback: ReactNode;
  rearing?: () => boolean;
}) {
  const shown = useReached(fromBeat);
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const fade = useRef(1);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = pose.current;
    p.time += dt;
    const gone = getRun()?.flags.has(goneFlag) ?? false;
    p.windup += ((rearing?.() ? 1 : 0) - p.windup) * (1 - Math.exp(-4 * dt));
    fade.current += ((gone ? 0 : 1) - fade.current) * (1 - Math.exp(-5 * dt));
    const g = group.current;
    if (!g) return;
    g.visible = fade.current > 0.02;
    g.scale.setScalar(scale * (0.4 + 0.6 * fade.current));
  });
  if (!shown) return null;
  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {BUILT_AI_FILES.has(file) ? (
        <ModelBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <CreatureModel url={`${CREATURES}${file}`} pose={pose} />
          </Suspense>
        </ModelBoundary>
      ) : (
        fallback
      )}
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
      <Fire position={[0.75, 2.6, 0.3]} size={0.5} count={2} spread={0.2} smoke={false} />
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
export function BurningSkyline({ position, rotationY = 0, seed = 1 }: { position: Vec3; rotationY?: number; seed?: number }) {
  const blocks = useMemo(() => {
    const out: { x: number; w: number; h: number; d: number; tower: boolean; fire: boolean }[] = [];
    let x = -60;
    let i = 0;
    while (x < 60) {
      const r = Math.abs(Math.sin((i + 1) * 12.9898 * seed) * 43758.5453) % 1;
      const tower = r > 0.72;
      const w = tower ? 6 : 10 + r * 8;
      out.push({ x: x + w / 2, w, h: tower ? 26 + r * 10 : 12 + r * 6, d: tower ? 6 : 12, tower, fire: r > 0.35 });
      x += w + 1;
      i++;
    }
    return out;
  }, [seed]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {blocks.map((b, i) => {
        const cols = Math.max(2, Math.floor(b.w / 2.4));
        const rows = Math.max(2, Math.floor(b.h / 4));
        return (
          <group key={i} position={[b.x, 0, 0]}>
            <Box position={[0, b.h / 2, 0]} size={[b.w, b.h, b.d]} material={MAT.academyStone} shadows={false} />
            {/* Cornice and buttresses break up the silhouette */}
            <Box position={[0, b.h - 0.3, b.d / 2 + 0.2]} size={[b.w + 0.6, 0.6, 0.4]} material={MAT.academyStoneDark} shadows={false} />
            {b.tower ? (
              <mesh position={[0, b.h + 5, 0]} material={MAT.slate}>
                <coneGeometry args={[b.w * 0.72, 10, 8]} />
              </mesh>
            ) : (
              <mesh position={[0, b.h + 2.2, 0]} rotation={[0, Math.PI / 4, 0]} scale={[b.w / 2, 1, b.d / 2]} material={MAT.slate}>
                <coneGeometry args={[1.42, 4.4, 4]} />
              </mesh>
            )}
            {/* Rows of windows, most glowing with firelight, some dark */}
            {Array.from({ length: rows * cols }, (_, k) => {
              const r = Math.floor(k / cols);
              const c = k % cols;
              const lit = (k * 7 + i * 3) % 5 !== 0;
              return (
                <Box
                  key={k}
                  position={[-b.w / 2 + (c + 0.5) * (b.w / cols), 2.5 + r * 4, b.d / 2 + 0.03]}
                  size={[0.9, 1.8, 0.05]}
                  material={lit ? MAT.windowGlow : MAT.slate}
                  shadows={false}
                />
              );
            })}
            {b.fire && <Fire position={[0, b.h + (b.tower ? 1 : 2), 0]} size={4 + (i % 3)} count={3} spread={b.w * 0.6} />}
          </group>
        );
      })}
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
