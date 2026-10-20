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

/** How long the fire breath blast lasts after the dragon attacks. */
const BLAST_SEC = 0.7;

/**
 * The dragon's fire breath, built up from nothing (owner, 2026-10-19: not fire in its mouth all the
 * time): after each attack its throat is dark. A glow kindles deep in the throat, its chest and then its
 * belly start to glow and pulse faster, flames lick from its jaws as the attack winds up, then it
 * looses a blast of fire at the player and the build-up starts again.
 */
export function DragonFireCharge({ rig }: { rig: CreatureRig }) {
  const mouth = useRef<Sprite | null>(null);
  const throat = useRef<Sprite | null>(null);
  const chest = useRef<Sprite | null>(null);
  const belly = useRef<Sprite | null>(null);
  const flames = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const breath = useRef<Mesh>(null);
  const breathHead = useRef<Sprite | null>(null);
  const at = useMemo(() => new Vector3(), []);
  const jaws = useMemo(() => new Vector3(), []);
  const aim = useMemo(() => new Vector3(), []);
  const streak = useMemo(() => streakTexture(), []);
  const level = useRef(0);
  const time = useRef(0);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const t = time.current;
    const th = getRun()?.bossThreat();
    const blasting = !!th && th.strikeAge < BLAST_SEC;
    // Towards the next attack (the arena attack's clock), or a slow build between fireballs.
    const build = !th ? 0 : th.build !== null ? Math.pow(th.build, 1.6) : Math.pow(Math.min(1, Math.max(0, (th.strikeAge - BLAST_SEC) / 4)), 1.6);
    const goal = blasting ? 0 : Math.max(build * 0.8, th && th.windup > 0 ? 0.8 + th.windup * 0.2 : 0);
    // It builds slowly and is spent at once.
    level.current = blasting ? 0 : level.current + (goal - level.current) * (1 - Math.exp(-(goal > level.current ? 2.5 : 6) * dt));
    const c = level.current;
    const beat = 0.5 + 0.5 * Math.sin(t * (2 + c * 9));
    const ramp = (lo: number, hi: number) => Math.min(1, Math.max(0, (c - lo) / (hi - lo)));
    const place = (s: Sprite | null, bone: string, bind: Vector3, size: number, opacity: number) => {
      if (!s) return;
      s.visible = opacity > 0.01 && rigPoint(rig, bone, bind, at);
      s.position.copy(at);
      s.scale.setScalar(Math.max(0.01, size));
      (s.material as { opacity: number }).opacity = Math.min(1, opacity);
    };
    place(throat.current, 'spine', DRAGON_THROAT, 0.6 + c * 2.4, ramp(0, 0.4) * (0.25 + c * 0.45) * (0.7 + beat * 0.3));
    place(chest.current, 'spine', DRAGON_CHEST, 1 + c * 3, ramp(0.25, 0.65) * (0.15 + c * 0.4) * (0.5 + beat * 0.5));
    place(belly.current, 'pelvis', DRAGON_BELLY, 1.5 + c * 3.4, ramp(0.45, 0.85) * (0.15 + c * 0.35) * (0.4 + beat * 0.6));
    place(mouth.current, 'spine', DRAGON_MOUTH, 0.4 + c * 2, ramp(0.55, 0.9) * (0.4 + c * 0.6));
    const ok = rigPoint(rig, 'spine', DRAGON_MOUTH, jaws);
    if (flames.current) {
      const lick = ramp(0.7, 1);
      flames.current.visible = ok && lick > 0.02;
      flames.current.position.copy(jaws);
      flames.current.scale.setScalar(Math.max(0.01, lick * 1.1));
    }
    // The blast: a roaring jet of fire from its jaws towards the player.
    const g = rig.group;
    const b = breath.current;
    const head = breathHead.current;
    const showBlast = blasting && ok && !!g;
    if (b) b.visible = showBlast;
    if (head) head.visible = showBlast;
    if (showBlast && b && head && g && th) {
      const k = th.strikeAge / BLAST_SEC;
      aim.copy(state.camera.position);
      g.worldToLocal(aim);
      aim.lerp(jaws, 0.25);
      const reach = aim.clone().sub(jaws).multiplyScalar(Math.min(1, k * 2.2)).add(jaws);
      placeStreak(b, jaws, reach, 2.2 * (1 - k * 0.5), state.camera.position);
      head.position.copy(reach);
      head.scale.setScalar(4 + k * 3);
      (head.material as { opacity: number }).opacity = 1 - k;
    }
    if (light.current) {
      light.current.position.copy(jaws);
      light.current.intensity = showBlast ? 400 : c * 160 * (0.8 + beat * 0.2);
    }
  });
  return (
    <group>
      <GlowSprite sprite={(s) => void (throat.current = s)} color="#ff7a20" depthTest={false} />
      <GlowSprite sprite={(s) => void (chest.current = s)} color="#ff5a14" />
      <GlowSprite sprite={(s) => void (belly.current = s)} color="#ff4a10" />
      <GlowSprite sprite={(s) => void (mouth.current = s)} color="#ffcf6a" />
      <group ref={flames} visible={false}>
        <Fire position={[0, 0, 0]} size={1.4} count={3} spread={0.6} smoke={false} kind="warm" />
      </group>
      <mesh ref={breath} geometry={STREAK_GEOMETRY} visible={false} frustumCulled={false}>
        <meshBasicMaterial map={streak} color="#ff7a20" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <GlowSprite sprite={(s) => void (breathHead.current = s)} color="#ffb040" />
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

const EMBERS = 10;

/**
 * The quill's nib glows as he gathers power. While `burning()` (Pip seized) he turns to face Pip and
 * a thick stream of red fire pours from the nib to Pip, embers racing along it (owner, 2026-10-17 and
 * 2026-10-19: "I don't see him pointing the quill at Pip, nor the stream of fire").
 */
export function UnwriterQuill({ rig, pip, burning }: { rig: CreatureRig; pip: Vec3; burning: () => boolean }) {
  const nib = useRef<Sprite | null>(null);
  const flare = useRef<Sprite | null>(null);
  const beam = useRef<Mesh>(null);
  const core = useRef<Mesh>(null);
  const embers = useRef<(Sprite | null)[]>([]);
  const tip = useMemo(() => new Vector3(), []);
  const target = useMemo(() => new Vector3(), []);
  const at = useMemo(() => new Vector3(), []);
  const streak = useMemo(() => streakTexture(), []);
  const beamColor = useMemo(() => new Color('#ff3a0a'), []);
  const coreColor = useMemo(() => new Color('#ffd27a'), []);
  const time = useRef(0);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const t = time.current;
    const on = burning();
    const c = on ? 1.1 : chargeLevel(t);
    const g = rig.group;
    // He turns to face Pip while burning Pip's rings, and back to the player after.
    if (g) {
      g.getWorldPosition(at);
      const yaw = on ? Math.atan2(pip[0] - at.x, pip[2] - at.z) : 0;
      g.rotation.y += (yaw - g.rotation.y) * (1 - Math.exp(-3 * dt));
    }
    const ok = rigPoint(rig, 'arm_l', QUILL_TIP, tip);
    const n = nib.current;
    if (n) {
      n.visible = ok;
      n.position.copy(tip);
      n.scale.setScalar(0.3 + c * 0.7 + Math.sin(t * 11) * 0.05);
      (n.material as { opacity: number }).opacity = Math.min(1, 0.5 + c * 0.5);
    }
    const b = beam.current;
    const k = core.current;
    const f = flare.current;
    const show = on && ok && !!g;
    if (b) b.visible = show;
    if (k) k.visible = show;
    if (f) f.visible = show;
    embers.current.forEach((e) => e && (e.visible = show));
    if (!show || !b || !k || !f || !g) return;
    target.set(...pip);
    g.worldToLocal(target);
    const flicker = Math.sin(t * 23) * 0.04 + Math.sin(t * 37) * 0.03;
    placeStreak(b, tip, target, 0.42 + flicker, state.camera.position);
    placeStreak(k, tip, target, 0.13 + flicker * 0.5, state.camera.position);
    f.position.copy(target);
    f.scale.setScalar(1.6 + Math.sin(t * 17) * 0.25);
    // Embers pouring down the stream from the nib to Pip.
    embers.current.forEach((e, i) => {
      if (!e) return;
      const u = (t * 1.6 + i / EMBERS) % 1;
      e.position.lerpVectors(tip, target, u);
      e.position.y += Math.sin(t * 9 + i * 2.1) * 0.12;
      e.scale.setScalar(0.35 * (1 - u * 0.4));
    });
  });
  return (
    <group>
      <GlowSprite sprite={(s) => void (nib.current = s)} color="#ff5a1a" />
      <mesh ref={beam} geometry={STREAK_GEOMETRY} visible={false} frustumCulled={false}>
        <meshBasicMaterial map={streak} color={beamColor} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh ref={core} geometry={STREAK_GEOMETRY} visible={false} frustumCulled={false}>
        <meshBasicMaterial map={streak} color={coreColor} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      {Array.from({ length: EMBERS }, (_, i) => (
        <GlowSprite key={i} sprite={(s) => void (embers.current[i] = s)} color="#ff8a3a" />
      ))}
      <GlowSprite sprite={(s) => void (flare.current = s)} color="#ff6a2a" />
    </group>
  );
}
