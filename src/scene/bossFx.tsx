/**
 * Boss charge effects (owner, 2026-10-17: the bosses stood still "like target practice"). Each boss
 * shows its own build-up of power while it idles, brighter as an attack winds up, with a flash as it
 * strikes, riding the moving body through `rigPoint`. They sit inside SceneCreature (model units).
 *
 * - Grey Herald: wisps rising from its glowing book to circle its head, then rushing the player.
 * - Page dragon: fire gathering deep in its throat and a pulsing glow in its chest and belly.
 * - Perfect Guardian: floating up as fire orbs circle in front of it, faster, into a ring it blasts.
 * - Unwriter: the quill's nib glowing, and a burning stroke from it to Pip while Pip is seized.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, Vector3, type Group, type Mesh, type PointLight, type Sprite, type SpriteMaterial } from 'three';
import { pipWorld } from '../player/PipCompanion';
import { getRun } from '../state/gameStore';
import { rigPoint, type CreatureRig } from './areas2/common';
import { Fire } from './Fire';
import { fireballTexture, glowTexture, placeStreak, STREAK_GEOMETRY, streakTexture } from './glow';

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

const WISPS = 10;
const TRAIL = 6;
/**
 * The open book in its left hand, the circle above its hooded head, and its free (preaching, pointing)
 * hand (grey_herald.glb, 3 m tall, bind pose).
 */
const HERALD_BOOK = new Vector3(-0.81, 2.27, 0.34);
const HERALD_CROWN = new Vector3(-0.06, 3.35, -0.1);
const HERALD_HAND = new Vector3(0.82, 2.11, 0.26);
/** How long the gathered wisps take to rush at the player when it attacks. */
const RUSH_SEC = 0.9;

/**
 * The Grey Herald preaches from its book (owner, 2026-10-19/20): wisps of light rise from the glowing
 * pages one by one and circle above its head, faster as more gather; when it points at the player they
 * draw together at its pointing hand and rush at the player, and the reading starts again.
 */
export function HeraldWisps({ rig }: { rig: CreatureRig }) {
  const sprites = useRef<(Sprite | null)[]>([]);
  const page = useRef<Sprite | null>(null);
  const trails = useMemo(() => Array.from({ length: WISPS }, () => Array.from({ length: TRAIL }, () => new Vector3())), []);
  const born = useMemo(() => new Float32Array(WISPS).fill(-1), []);
  const book = useMemo(() => new Vector3(), []);
  const crown = useMemo(() => new Vector3(), []);
  const target = useMemo(() => new Vector3(), []);
  const gather = useMemo(() => new Vector3(), []);
  const hand = useMemo(() => new Vector3(), []);
  const pos = useMemo(() => new Vector3(), []);
  const spin = useRef(0);
  const time = useRef(0);
  const level = useRef(0);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const t = time.current;
    const th = getRun()?.bossThreat();
    const rushing = !!th && th.strikeAge < RUSH_SEC;
    const build = !th ? 0.3 : th.build !== null ? th.build : Math.min(1, Math.max(0, (th.strikeAge - RUSH_SEC) / 5));
    const goal = rushing ? 0 : Math.max(build, th && th.windup > 0 ? 1 : 0);
    level.current = rushing ? 0 : level.current + (goal - level.current) * (1 - Math.exp(-2 * dt));
    const count = rushing ? WISPS : Math.min(WISPS, Math.floor(1 + level.current * WISPS));
    if (!rigPoint(rig, 'chest', HERALD_BOOK, book)) book.copy(HERALD_BOOK);
    if (!rigPoint(rig, 'head', HERALD_CROWN, crown)) crown.copy(HERALD_CROWN);
    spin.current += dt * (0.8 + count * 0.45);
    const g = rig.group;
    if (rushing && g && th) {
      target.copy(state.camera.position);
      g.worldToLocal(target);
    }
    // They gather at the hand it points at the player (owner, 2026-10-20), then rush along its aim.
    if (rigPoint(rig, 'arm_r', HERALD_HAND, hand)) gather.copy(hand).add(pos.set(0, 0.1, 0.3));
    else gather.copy(crown).add(pos.set(0, -0.4, 0.9));
    for (let i = 0; i < WISPS; i++) {
      const trail = trails[i];
      const head = trail?.[0];
      if (!trail || !head) continue;
      const alive = i < count;
      if (alive && (born[i] ?? -1) < 0) born[i] = t;
      if (!alive && !rushing) born[i] = -1;
      const age = (born[i] ?? -1) >= 0 ? t - (born[i] ?? 0) : -1;
      if (age < 0) {
        head.copy(book);
      } else if (rushing && th) {
        // Draw together in front of it, then rush the player as one.
        const k = th.strikeAge / RUSH_SEC;
        if (k < 0.35) pos.copy(head).lerp(gather, k / 0.35);
        else pos.copy(gather).lerp(target, Math.min(1, (k - 0.35) / 0.55));
        head.copy(pos);
      } else {
        // Rising from the pages to the circle over its head, then circling it.
        const a = spin.current + (i / WISPS) * Math.PI * 2;
        const r = 0.75 + (i % 3) * 0.12;
        pos.set(crown.x + Math.cos(a) * r, crown.y + Math.sin(a * 2 + i) * 0.12 + (i % 2) * 0.15, crown.z + Math.sin(a) * r);
        const rise = Math.min(1, age / 0.9);
        head.copy(book).lerp(pos, rise * rise * (3 - 2 * rise));
      }
      // Trails: each point eases after the one ahead of it.
      for (let k = TRAIL - 1; k > 0; k--) trail[k]?.lerp(trail[k - 1] ?? head, Math.min(1, dt * 22));
      for (let k = 0; k < TRAIL; k++) {
        const sp = sprites.current[i * TRAIL + k];
        const p = trail[k];
        if (!sp || !p) continue;
        sp.visible = age >= 0;
        sp.position.copy(p);
        sp.scale.setScalar(Math.max(0.03, (0.34 - k * 0.045) * (rushing ? 1.4 : 1)));
        (sp.material as { opacity: number }).opacity = (1 - k / TRAIL) * 0.9;
      }
    }
    const pg = page.current;
    if (pg) {
      pg.position.copy(book);
      pg.scale.setScalar(0.8 + level.current * 0.9 + Math.sin(t * 7) * 0.08);
      (pg.material as { opacity: number }).opacity = 0.45 + level.current * 0.5;
    }
  });
  return (
    <group>
      {Array.from({ length: WISPS * TRAIL }, (_, i) => (
        <GlowSprite key={i} sprite={(sp) => void (sprites.current[i] = sp)} color={i % TRAIL === 0 ? '#ffd0a0' : '#ff7a3a'} />
      ))}
      <GlowSprite sprite={(sp) => void (page.current = sp)} color="#ff6a2a" />
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

/** Centre of the ring of fire orbs, in front of the Guardian's chest (perfect_warden.glb, 4 m tall). */
const GUARDIAN_RING = new Vector3(0, 2.6, 1.1);
const ORBS = 6;
const RING_SPARKS = 28;

/**
 * The Perfect Guardian channels (owner, 2026-10-19: "too nonchalant"; reference: levitating with arms
 * spread): it floats up off the floor, rising higher as its attack builds, while orbs of fire appear one
 * by one in front of it and circle faster and faster until they blur into a ring of fire; then it
 * thrusts its palms and the ring blasts at the player as a stream, it sinks, and it starts again.
 */
export function GuardianOrbs({ rig }: { rig: CreatureRig }) {
  const orbs = useRef<(Sprite | null)[]>([]);
  const sparks = useRef<(Sprite | null)[]>([]);
  const jet = useRef<Mesh>(null);
  const jetHead = useRef<Sprite | null>(null);
  const centre = useMemo(() => new Vector3(), []);
  const aim = useMemo(() => new Vector3(), []);
  const fire = useMemo(() => fireballTexture(), []);
  const streak = useMemo(() => streakTexture(), []);
  const level = useRef(0);
  const spin = useRef(0);
  const lift = useRef(0);
  const baseY = useRef<number | null>(null);
  const time = useRef(0);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const g = rig.group;
    const th = getRun()?.bossThreat();
    const blasting = !!th && th.strikeAge < BLAST_SEC;
    const build = !th ? 0 : th.build !== null ? th.build : Math.min(1, Math.max(0, (th.strikeAge - BLAST_SEC) / 5));
    const goal = blasting ? 0 : Math.max(build * 0.85, th && th.windup > 0 ? 0.85 + th.windup * 0.15 : 0);
    level.current = blasting ? Math.max(0, level.current - dt * 3) : level.current + (goal - level.current) * (1 - Math.exp(-2.5 * dt));
    const c = level.current;
    // It floats: a little off the floor at rest, rising as it charges, sinking back after the blast.
    if (g) {
      if (baseY.current === null) baseY.current = g.position.y;
      lift.current += (0.5 + c * 1.8 - lift.current) * (1 - Math.exp(-(blasting ? 3 : 1.2) * dt));
      g.position.y = baseY.current + lift.current + Math.sin(time.current * 1.4) * 0.12;
    }
    spin.current += dt * (1.2 + c * c * 14);
    const ok = rigPoint(rig, 'chest', GUARDIAN_RING, centre);
    const radius = 1.3 - c * 0.2;
    const shown = blasting ? 0 : Math.min(ORBS, Math.floor(1 + c * ORBS));
    orbs.current.forEach((o, i) => {
      if (!o) return;
      const a = spin.current + (i / ORBS) * Math.PI * 2;
      o.visible = ok && i < shown;
      o.position.set(centre.x + Math.cos(a) * radius, centre.y + Math.sin(a) * radius, centre.z);
      o.scale.setScalar(0.8 + c * 0.35);
      (o.material as SpriteMaterial).rotation = time.current * 4 + i;
    });
    // The orbs blur into a ring of fire as they race round.
    const ring = blasting ? 0 : Math.min(1, Math.max(0, (c - 0.55) / 0.35));
    sparks.current.forEach((p, i) => {
      if (!p) return;
      const a = spin.current * 1.3 + (i / RING_SPARKS) * Math.PI * 2;
      p.visible = ok && ring > 0.02;
      p.position.set(centre.x + Math.cos(a) * radius, centre.y + Math.sin(a) * radius, centre.z);
      p.scale.setScalar(0.55);
      (p.material as SpriteMaterial).opacity = ring * 0.85;
    });
    // The release: the ring streams at the player.
    const b = jet.current;
    const h = jetHead.current;
    const show = blasting && ok && !!g && !!th;
    if (b) b.visible = show;
    if (h) h.visible = show;
    if (show && b && h && g && th) {
      const k = th.strikeAge / BLAST_SEC;
      aim.copy(state.camera.position);
      g.worldToLocal(aim);
      aim.lerp(centre, 0.25);
      const reach = aim.sub(centre).multiplyScalar(Math.min(1, k * 2.2)).add(centre);
      placeStreak(b, centre, reach, 1.2 * (1 - k * 0.5), state.camera.position);
      h.position.copy(reach);
      h.scale.setScalar(2.4 + k * 2);
      (h.material as SpriteMaterial).opacity = 1 - k;
    }
  });
  return (
    <group>
      {Array.from({ length: ORBS }, (_, i) => (
        <sprite key={i} ref={(o) => void (orbs.current[i] = o)}>
          <spriteMaterial map={fire} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </sprite>
      ))}
      {Array.from({ length: RING_SPARKS }, (_, i) => (
        <GlowSprite key={i} sprite={(p) => void (sparks.current[i] = p)} color="#ff6a1a" />
      ))}
      <mesh ref={jet} geometry={STREAK_GEOMETRY} visible={false} frustumCulled={false}>
        <meshBasicMaterial map={streak} color="#ff5a14" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <GlowSprite sprite={(p) => void (jetHead.current = p)} color="#ffb040" />
    </group>
  );
}

// ---------- Unwriter ----------

/** The glowing nib of the quill in his outstretched hand (unwriter.glb bind pose, bound to the quill arm). */
const QUILL_TIP = new Vector3(-0.8, 2.78, 0.5);

const EMBERS = 10;

/**
 * The quill's nib glows as he gathers power. While `burning()` he turns to face Pip, beside the
 * apprentice, points the quill and a thick stream of red fire pours from the nib to Pip, embers racing along it (owner, 2026-10-17 and
 * 2026-10-19: "I don't see him pointing the quill at Pip, nor the stream of fire").
 */
export function UnwriterQuill({ rig, burning }: { rig: CreatureRig; burning: () => boolean }) {
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
      const yaw = on ? Math.atan2(pipWorld.x - at.x, pipWorld.z - at.z) : 0;
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
    target.copy(pipWorld);
    g.worldToLocal(target);
    const flicker = Math.sin(t * 23) * 0.04 + Math.sin(t * 37) * 0.03;
    // A thin, bright stroke, so his pointing arm and quill stay visible behind it (owner, 2026-10-20).
    placeStreak(b, tip, target, 0.2 + flicker * 0.5, state.camera.position);
    placeStreak(k, tip, target, 0.06 + flicker * 0.25, state.camera.position);
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
