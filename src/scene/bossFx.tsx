/**
 * Boss charge effects (owner, 2026-10-17: the bosses stood still "like target practice"). Each boss
 * shows its own build-up of power while it idles, brighter as an attack winds up, with a flash as it
 * strikes, riding the moving body through `rigPoint`. They sit inside SceneCreature (model units).
 *
 * - Grey Herald: wisps of ember light circling it, drawn into the glow between its raised hands.
 * - Page dragon: fire gathering deep in its throat and a pulsing glow in its chest and belly.
 * - Perfect Guardian: fists blazing as it draws them back.
 * - Unwriter: the quill's nib glowing, and a burning stroke from it to Pip while Pip is seized.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, Vector3, type Group, type Mesh, type PointLight, type Sprite } from 'three';
import type { Vec3 } from '../level/rail/railTypes';
import { getRun } from '../state/gameStore';
import { rigPoint, type CreatureRig } from './areas2/common';
import { Fire } from './Fire';
import { glowTexture, placeStreak, STREAK_GEOMETRY, streakTexture } from './glow';

/**
 * 0–1+ charge: builds slowly between attacks (so the boss is always visibly gathering power), races
 * up while an attack winds up, and flares past 1 for a moment as it strikes.
 */
function chargeLevel(t: number): number {
  const th = getRun()?.bossThreat();
  if (!th) return 0.35 + Math.sin(t * 2) * 0.1;
  if (th.strikeAge < 0.35) return 1.4 - th.strikeAge;
  const build = Math.min(1, Math.max(0, (th.strikeAge - 0.35) / 3.5));
  const idle = 0.25 + 0.4 * build + Math.sin(t * (2.2 + build * 3)) * (0.06 + 0.08 * build);
  return Math.max(idle, th.windup * (0.85 + Math.sin(t * 18) * 0.15));
}

function GlowSprite({ sprite, color, opacity = 1, depthTest = true }: { sprite: (s: Sprite | null) => void; color: string; opacity?: number; depthTest?: boolean }) {
  const map = useMemo(() => glowTexture(), []);
  return (
    <sprite ref={sprite} renderOrder={depthTest ? 0 : 5}>
      <spriteMaterial map={map} color={color} transparent opacity={opacity} blending={AdditiveBlending} depthWrite={false} depthTest={depthTest} toneMapped={false} />
    </sprite>
  );
}

// ---------- Grey Herald ----------

const WISPS = 7;
const TRAIL = 6;
const HERALD_ORB = new Vector3(0, 2.1, 0.6);

interface WispOrbit {
  phase: number;
  radius: number;
  height: number;
  speed: number;
  tilt: number;
}

/** Ember wisps circling the Herald as it channels, contracting into the orb between its hands. */
export function HeraldWisps({ rig }: { rig: CreatureRig }) {
  const orbits = useMemo<WispOrbit[]>(
    () =>
      Array.from({ length: WISPS }, (_, i) => ({
        phase: (i / WISPS) * Math.PI * 2,
        radius: 1.25 + ((i * 37) % 5) * 0.15,
        height: 1.3 + ((i * 53) % 7) * 0.2,
        speed: 1.1 + ((i * 29) % 4) * 0.25,
        tilt: (((i * 71) % 9) - 4) * 0.08,
      })),
    [],
  );
  const sprites = useRef<(Sprite | null)[]>([]);
  const orb = useRef<Sprite | null>(null);
  const orbAt = useMemo(() => new Vector3(), []);
  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1);
    const t = time.current;
    const c = chargeLevel(t);
    if (!rigPoint(rig, 'chest', HERALD_ORB, orbAt)) orbAt.copy(HERALD_ORB);
    // Wind-up draws the wisps in towards the hands.
    const pull = Math.min(1, Math.max(0, (c - 0.6) / 0.6));
    orbits.forEach((o, i) => {
      for (let k = 0; k < TRAIL; k++) {
        const s = sprites.current[i * TRAIL + k];
        if (!s) continue;
        const tt = t - k * 0.045;
        const a = o.phase + tt * o.speed * (1 + c * 0.8);
        const r = o.radius * (1 - pull * 0.6);
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r * 0.85;
        const y = o.height + Math.sin(a * 2 + o.phase) * 0.25 + x * o.tilt;
        s.position.set(x + (orbAt.x - x) * pull * 0.4, y + (orbAt.y - y) * pull * 0.5, z + (orbAt.z - z) * pull * 0.4);
        const size = (0.42 - k * 0.055) * (0.8 + c * 0.4);
        s.scale.setScalar(Math.max(0.02, size));
        (s.material as { opacity: number }).opacity = (1 - k / TRAIL) * (0.55 + c * 0.35);
      }
    });
    const o = orb.current;
    if (o) {
      o.position.copy(orbAt);
      o.scale.setScalar(0.35 + c * 0.75 + Math.sin(t * 9) * 0.06);
      (o.material as { opacity: number }).opacity = Math.min(1, 0.4 + c * 0.6);
    }
  });
  return (
    <group>
      {Array.from({ length: WISPS * TRAIL }, (_, i) => (
        <GlowSprite key={i} sprite={(s) => void (sprites.current[i] = s)} color={i % TRAIL === 0 ? '#ffd0a0' : '#ff7a3a'} />
      ))}
      <GlowSprite sprite={(s) => void (orb.current = s)} color="#ff6a2a" />
    </group>
  );
}

// ---------- Page dragon ----------

/** Bind-pose points on the dragon (measured from vellum_dragon.glb): inside the open mouth, deep in the throat, chest and belly. */
const DRAGON_MOUTH = new Vector3(0, 4.25, 7.1);
const DRAGON_THROAT = new Vector3(0, 4.5, 5.9);
const DRAGON_CHEST = new Vector3(0, 3.5, 5.3);
const DRAGON_BELLY = new Vector3(0, 1.7, 2.0);

/** Fire gathering in the dragon's throat; its chest and belly pulse brighter as the breath builds. */
export function DragonFireCharge({ rig }: { rig: CreatureRig }) {
  const mouth = useRef<Sprite | null>(null);
  const throat = useRef<Sprite | null>(null);
  const chest = useRef<Sprite | null>(null);
  const belly = useRef<Sprite | null>(null);
  const flames = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const at = useMemo(() => new Vector3(), []);
  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1);
    const t = time.current;
    const c = chargeLevel(t);
    // A slow heartbeat of fire in the belly, quickening as it charges.
    const beat = 0.5 + 0.5 * Math.sin(t * (2.5 + c * 6));
    const place = (s: Sprite | null, bone: string, bind: Vector3, size: number, opacity: number) => {
      if (!s) return;
      s.visible = rigPoint(rig, bone, bind, at);
      s.position.copy(at);
      s.scale.setScalar(size);
      (s.material as { opacity: number }).opacity = Math.min(1, opacity);
    };
    place(mouth.current, 'spine', DRAGON_MOUTH, 0.8 + c * 1.6, 0.35 + c * 0.6);
    place(throat.current, 'spine', DRAGON_THROAT, 1.2 + c * 1.8, (0.15 + c * 0.45) * (0.7 + beat * 0.3));
    place(chest.current, 'spine', DRAGON_CHEST, 1.8 + c * 2.2, (0.12 + c * 0.4) * (0.6 + beat * 0.4));
    place(belly.current, 'pelvis', DRAGON_BELLY, 2.4 + c * 2.4, (0.1 + c * 0.35) * (0.5 + beat * 0.5));
    if (flames.current && rigPoint(rig, 'spine', DRAGON_MOUTH, at)) {
      flames.current.position.copy(at);
      flames.current.scale.setScalar(0.25 + c * 0.9);
    }
    if (light.current) {
      light.current.position.copy(at);
      light.current.intensity = 20 + c * 160 * (0.8 + beat * 0.2);
    }
  });
  return (
    <group>
      <GlowSprite sprite={(s) => void (mouth.current = s)} color="#ffcf6a" />
      <GlowSprite sprite={(s) => void (throat.current = s)} color="#ff7a20" depthTest={false} />
      <GlowSprite sprite={(s) => void (chest.current = s)} color="#ff5a14" />
      <GlowSprite sprite={(s) => void (belly.current = s)} color="#ff4a10" />
      <group ref={flames}>
        <Fire position={[0, 0, 0]} size={1.4} count={3} spread={0.6} smoke={false} kind="warm" />
      </group>
      <pointLight ref={light} color="#ff7a2a" intensity={0} distance={18} decay={2} />
    </group>
  );
}

// ---------- Perfect Guardian ----------

/** Its fists in the bind pose (perfect_warden.glb: the arm bones end at the hands). */
const GUARDIAN_FISTS: readonly [string, Vector3][] = [
  ['arm_l', new Vector3(-0.63, 1.55, 0.05)],
  ['arm_r', new Vector3(0.63, 1.55, 0.05)],
];

/** Fists blazing red as the Guardian draws them back to charge; a flare as it smashes. */
export function GuardianFists({ rig }: { rig: CreatureRig }) {
  const glows = useRef<(Sprite | null)[]>([]);
  const cores = useRef<(Sprite | null)[]>([]);
  const at = useMemo(() => new Vector3(), []);
  const time = useRef(0);
  useFrame((_, delta) => {
    time.current += Math.min(delta, 0.1);
    const t = time.current;
    const c = chargeLevel(t);
    GUARDIAN_FISTS.forEach(([bone, bind], i) => {
      const ok = rigPoint(rig, bone, bind, at);
      const flicker = 1 + Math.sin(t * 13 + i * 2) * 0.08;
      for (const [list, size, alpha] of [
        [glows.current, 0.7 + c * 1.1, 0.35 + c * 0.5],
        [cores.current, 0.25 + c * 0.35, 0.7 + c * 0.3],
      ] as const) {
        const s = list[i];
        if (!s) continue;
        s.visible = ok;
        s.position.copy(at);
        s.scale.setScalar(size * flicker);
        (s.material as { opacity: number }).opacity = Math.min(1, alpha);
      }
    });
  });
  return (
    <group>
      {GUARDIAN_FISTS.map(([bone], i) => (
        <group key={bone}>
          <GlowSprite sprite={(s) => void (glows.current[i] = s)} color="#ff3a14" />
          <GlowSprite sprite={(s) => void (cores.current[i] = s)} color="#ffd08a" />
        </group>
      ))}
    </group>
  );
}

// ---------- Unwriter ----------

/** The nib of the quill in his raised hand (unwriter.glb, bound to the quill arm). */
const QUILL_TIP = new Vector3(-1.05, 3.27, 0.82);

/**
 * The quill's nib glows as he gathers power. While `burning()` (Pip seized), a stroke of red fire
 * runs from the nib to Pip (owner, 2026-10-17: "he's burning Pip's rings" but nothing showed).
 */
export function UnwriterQuill({ rig, pip, burning }: { rig: CreatureRig; pip: Vec3; burning: () => boolean }) {
  const nib = useRef<Sprite | null>(null);
  const flare = useRef<Sprite | null>(null);
  const beam = useRef<Mesh>(null);
  const tip = useMemo(() => new Vector3(), []);
  const target = useMemo(() => new Vector3(), []);
  const streak = useMemo(() => streakTexture(), []);
  const beamColor = useMemo(() => new Color('#ff4a14'), []);
  const time = useRef(0);
  useFrame((state, delta) => {
    time.current += Math.min(delta, 0.1);
    const t = time.current;
    const on = burning();
    const c = on ? 1.1 : chargeLevel(t);
    const ok = rigPoint(rig, 'arm_l', QUILL_TIP, tip);
    const n = nib.current;
    if (n) {
      n.visible = ok;
      n.position.copy(tip);
      n.scale.setScalar(0.3 + c * 0.6 + Math.sin(t * 11) * 0.04);
      (n.material as { opacity: number }).opacity = Math.min(1, 0.5 + c * 0.5);
    }
    const b = beam.current;
    const f = flare.current;
    const g = rig.group;
    if (b && f && g) {
      b.visible = on && ok;
      f.visible = b.visible;
      if (b.visible) {
        target.set(...pip);
        g.worldToLocal(target);
        placeStreak(b, tip, target, 0.12 + Math.sin(t * 23) * 0.03, state.camera.position);
        f.position.copy(target);
        f.scale.setScalar(0.9 + Math.sin(t * 17) * 0.15);
      }
    }
  });
  return (
    <group>
      <GlowSprite sprite={(s) => void (nib.current = s)} color="#ff5a1a" />
      <mesh ref={beam} geometry={STREAK_GEOMETRY} visible={false} frustumCulled={false}>
        <meshBasicMaterial map={streak} color={beamColor} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <GlowSprite sprite={(s) => void (flare.current = s)} color="#ff6a2a" />
    </group>
  );
}
