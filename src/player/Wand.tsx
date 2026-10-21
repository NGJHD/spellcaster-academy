import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { AdditiveBlending, CatmullRomCurve3, Color, SpriteMaterial, Vector3, type Group, type MeshStandardMaterial, type Object3D, type Sprite } from 'three';
import { glintTexture, glowTexture } from '../scene/glow';
import type { SpellId } from '../game/types';
import { useRunStore } from '../state/runStore';
import { MAT } from '../scene/materials';
import { useParts } from '../scene/partsGlb';

/** World-space wand tip, updated every frame; spell projectiles start here. */
export const wandTip = new Vector3();
/** Set by the spell system when a cast starts; drives the casting gesture. */
export const castSignal = { time: 99 };

const OFFSET = new Vector3(0.3, -0.3, -0.62);
const TIP_LOCAL = new Vector3(0, 0, -0.34);
const tmp = new Vector3();

interface Rig {
  tip: Object3D | null;
  glow: MeshStandardMaterial[];
}

/**
 * First-person forearm and wand: navy sleeve with star-thread motif, leather cuff, gripping
 * hand, walnut wand with a twisted silver inlay and moonstone tip (Blender GLB, code stand-in while
 * loading). Casting has anticipation, a forward thrust and recovery. Never intersects the camera.
 */
export function Wand() {
  const root = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const rig = useRef<Rig>({ tip: null, glow: [] });
  const time = useRef(0);

  useFrame((state, delta) => {
    const g = root.current;
    const a = arm.current;
    if (!g || !a) return;
    time.current += delta;
    castSignal.time += delta;
    const cam = state.camera;
    g.quaternion.copy(cam.quaternion);
    tmp.copy(OFFSET).applyQuaternion(cam.quaternion);
    g.position.copy(cam.position).add(tmp);

    // Cast: anticipation (pull back), forward thrust, recovery.
    const c = castSignal.time;
    let thrust = 0;
    let lift = 0;
    if (c < 0.08) {
      thrust = -0.04 * (c / 0.08);
      lift = 0.02 * (c / 0.08);
    } else if (c < 0.18) {
      const u = (c - 0.08) / 0.1;
      thrust = -0.04 + 0.16 * u;
      lift = 0.02 - 0.05 * u;
    } else if (c < 0.55) {
      const u = (c - 0.18) / 0.37;
      const e = 1 - (1 - u) ** 3;
      thrust = 0.12 * (1 - e);
      lift = -0.03 * (1 - e);
    }
    const sway = Math.sin(time.current * 1.1) * 0.004;
    a.position.set(sway, lift + Math.sin(time.current * 0.8) * 0.003, -thrust);
    a.rotation.x = -lift * 3;
    for (const m of rig.current.glow) m.emissiveIntensity = 3 + Math.max(0, 0.4 - c) * 16;

    if (rig.current.tip) rig.current.tip.getWorldPosition(wandTip);
    else g.getWorldPosition(wandTip);
  });

  return (
    <group ref={root}>
      <group ref={arm}>
        <Suspense fallback={<FallbackArm rig={rig} />}>
          <ArmGLB rig={rig} />
        </Suspense>
      </group>
      <WandAura root={root} />
    </group>
  );
}

/** Colour of the power-up swirl for each newly learned spell. */
const AURA_COLOURS: Record<SpellId, string> = {
  'spark-bolt': '#ffd36a',
  'frost-thread': '#9fe8ff',
  'chain-spark': '#7ff7ff',
  starfall: '#fff0a0',
  'bright-quill': '#ffb0f0',
};
const AURA_SEC = 6;
const AURA_PARTICLES = 44;
const auraLocal = new Vector3();

/**
 * Owner (2026-10-08): a new spell should show on the wand. When a spell is learned, glowing motes in
 * its colour spiral up the wand to the tip for a few seconds (gold sparks, swirling ice, cyan arcs).
 */
function WandAura({ root }: { root: RefObject<Group | null> }) {
  const group = useRef<Group>(null);
  const motes = useRef<(Sprite | null)[]>([]);
  const tipGlow = useRef<Sprite>(null);
  const seen = useRef(useRunStore.getState().powerUp?.key ?? -1);
  const t = useRef(AURA_SEC);
  // Twinkling star sparks and a soft glow at the tip (owner: no blocky circles).
  const material = useMemo(() => new SpriteMaterial({ map: glintTexture(), color: '#ffffff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const glowMaterial = useMemo(() => new SpriteMaterial({ map: glowTexture(), color: '#ffffff', transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false, toneMapped: false }), []);
  const colour = useMemo(() => new Color(), []);
  useFrame((_, delta) => {
    const g = group.current;
    const r = root.current;
    if (!g || !r) return;
    const p = useRunStore.getState().powerUp;
    if (p && p.key !== seen.current) {
      seen.current = p.key;
      t.current = 0;
      material.color.copy(colour.set(AURA_COLOURS[p.spell]));
      glowMaterial.color.copy(colour);
    }
    t.current += delta;
    const live = t.current < AURA_SEC;
    g.visible = live;
    if (!live) return;
    // Fade in fast, hold, fade out over the last second.
    material.opacity = Math.min(1, t.current * 4, AURA_SEC - t.current);
    glowMaterial.opacity = material.opacity * 0.8;
    material.rotation = t.current * 3;
    // The tip in the wand's own space; the wand runs back from the tip towards the hand.
    auraLocal.copy(wandTip);
    r.worldToLocal(auraLocal);
    const time = t.current;
    motes.current.forEach((m, i) => {
      if (!m) return;
      const phase = i / AURA_PARTICLES;
      const along = (phase + time * 0.45) % 1;
      const angle = phase * Math.PI * 10 + time * 7;
      const radius = 0.03 + 0.03 * Math.sin(along * Math.PI);
      m.position.set(auraLocal.x + Math.cos(angle) * radius, auraLocal.y + Math.sin(angle) * radius, auraLocal.z + 0.3 * (1 - along));
      // Each spark twinkles: it swells and shrinks quickly as it climbs.
      m.scale.setScalar((0.018 + 0.03 * along) * (0.4 + 0.6 * Math.abs(Math.sin(time * 9 + i * 1.7))));
    });
    // A pulsing glow at the tip, in the same colour.
    const glow = tipGlow.current;
    if (glow) {
      glow.position.copy(auraLocal);
      glow.scale.setScalar(0.09 + 0.03 * Math.sin(time * 9));
    }
  });
  return (
    <group ref={group} visible={false}>
      <sprite ref={tipGlow} material={glowMaterial} />
      {Array.from({ length: AURA_PARTICLES }, (_, i) => (
        <sprite key={i} ref={(m) => void (motes.current[i] = m)} material={material} />
      ))}
    </group>
  );
}

function ArmGLB({ rig }: { rig: RefObject<Rig> }) {
  const parts = useParts('fp_arm', false);
  useEffect(() => {
    rig.current.tip = parts.get('Tip') ?? null;
    rig.current.glow = parts.materials('Crystal');
  }, [parts, rig]);
  return <primitive object={parts.root} />;
}

/** Code-built stand-in shown while the arm GLB loads. */
function FallbackArm({ rig }: { rig: RefObject<Rig> }) {
  const tip = useRef<Group>(null);
  const inlay = useMemo(() => {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const a = u * Math.PI * 6;
      const r = 0.0105 - u * 0.004;
      pts.push(new Vector3(Math.cos(a) * r, Math.sin(a) * r, -u * 0.3));
    }
    return new CatmullRomCurve3(pts);
  }, []);
  const tipMat = useMemo(() => MAT.crystal.clone(), []);
  useEffect(() => {
    rig.current.tip = tip.current;
    rig.current.glow = [tipMat];
  }, [rig, tipMat]);
  return (
    <>
      <mesh position={[0.05, -0.12, 0.17]} rotation={[0.62, 0, 0.18]} material={MAT.navyCloth}>
        <cylinderGeometry args={[0.042, 0.06, 0.34, 20]} />
      </mesh>
      <mesh position={[0, -0.005, -0.012]} rotation={[0.3, 0, 0.1]} scale={[0.75, 0.6, 1.0]} material={MAT.skin}>
        <sphereGeometry args={[0.034, 20, 16]} />
      </mesh>
      <group position={[0, 0.01, -0.04]} rotation={[0.08, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]} material={MAT.darkOak}>
          <cylinderGeometry args={[0.006, 0.011, 0.32, 14]} />
        </mesh>
        <mesh material={MAT.steel}>
          <tubeGeometry args={[inlay, 48, 0.0018, 6, false]} />
        </mesh>
        <group ref={tip} position={TIP_LOCAL.toArray()}>
          <mesh material={tipMat}>
            <octahedronGeometry args={[0.012]} />
          </mesh>
        </group>
      </group>
    </>
  );
}
