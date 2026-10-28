import { useFrame } from '@react-three/fiber';
import { Suspense, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Vector3, type Group } from 'three';
import { KitModel } from '../scene/kit';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';
import type { TargetSpawn } from '../level/levelTypes';
import { CreatureModel, creatureUrl } from './CreatureModel';
import { ModelBoundary } from './ModelBoundary';
import { Fire } from '../scene/Fire';
import { Guardian } from './GuardianGLB';
import { Book, Dummy, ThornPod } from './PropTargets';
import { APPEAR_SEC, DISPEL_SEC, isShielded, PROJECTILE_SEC, SHIELD_BREAK_SEC, type TargetRuntime } from './EnemyBrain';
import {
  emptyPose,
  FlyingPageModel,
  MosslingModel,
  PlateModel,
  PollenModel,
  RuneModel,
  SpriteModel,
  JournalPageModel,
  GemModel,
  ImpModel,
  FireballModel,
  FireWallModel,
  HushModel,
  WispModel,
  WispShield,
  type TargetPose,
} from './TargetVisuals';

const HIT_SEC = 0.5;
/** Kinds that turn to face the camera (creatures); props keep their authored orientation. */
const FACES_CAMERA = new Set(['blotling', 'eraser-moth', 'scribble-imp', 'smudgehound', 'hollow-knight', 'correction-moth', 'redactor', 'foreman', 'imp', 'sprite', 'mossling', 'wisp', 'guardian', 'thorn-pod', 'book', 'dummy', 'journal-page', 'pollen']);

/** Rigged GLB when one exists for the kind, with the code-built stand-in while it streams in. */
function Model({ spawn, pose }: { spawn: TargetSpawn; pose: RefObject<TargetPose> }): ReactNode {
  const url = creatureUrl(spawn.kind, spawn.variant);
  const fallback = <PlaceholderModel spawn={spawn} pose={pose} />;
  // Kit-built props (pages, clasps, plates) stream their GLBs; never blank other targets meanwhile.
  if (!url) return <Suspense fallback={null}>{fallback}</Suspense>;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <CreatureModel url={url} pose={pose} tint={spawn.variant} />
        {spawn.kind === 'wisp' && <WispShield pose={pose} />}
      </Suspense>
      {spawn.kind === 'smudgehound' && <Fire position={[0, 0.6, 0]} size={0.6} count={2} spread={0.6} />}
    </ModelBoundary>
  );
}

function PlaceholderModel({ spawn, pose }: { spawn: TargetSpawn; pose: RefObject<TargetPose> }): ReactNode {
  switch (spawn.kind) {
    case 'dummy':
      return <Dummy pose={pose} practice={spawn.variant === 'practice'} />;
    case 'sprite':
      return <SpriteModel pose={pose} variant={spawn.variant} />;
    case 'book':
      return <Book pose={pose} variant={spawn.variant} />;
    case 'wisp':
      return <WispModel pose={pose} />;
    case 'thorn-pod':
      return <ThornPod pose={pose} />;
    case 'mossling':
      return <MosslingModel pose={pose} />;
    case 'pollen':
      return <PollenModel pose={pose} />;
    case 'guardian':
      return <Guardian pose={pose} />;
    case 'journal-page':
      return <JournalPageModel pose={pose} />;
    case 'imp':
      return <ImpModel pose={pose} variant={spawn.variant} />;
    case 'fireball':
      return spawn.variant === 'wall' ? <FireWallModel pose={pose} /> : <FireballModel pose={pose} />;
    case 'blotling':
    case 'eraser-moth':
    case 'scribble-imp':
    case 'smudgehound':
    case 'hollow-knight':
    case 'correction-moth':
    case 'redactor':
    case 'foreman':
      return <HushModel pose={pose} kind={spawn.kind} />;
    case 'gem':
      return <GemModel pose={pose} seed={spawn.id} />;
    case 'flying-page':
      return <FlyingPageModel pose={pose} />;
    case 'plate':
      return <PlateModel pose={pose} />;
    case 'rune':
      return <RuneModel pose={pose} />;
    case 'marker':
      return null;
  }
}

function writePose(t: TargetRuntime, p: TargetPose): void {
  p.time = t.clock;
  p.appear = t.phase === 'appearing' ? Math.min(1, t.phaseTime / APPEAR_SEC) : t.phase === 'waiting' ? 0 : 1;
  p.windup = t.attackPhase === 'windup' && t.windupTotal > 0 ? Math.min(1, t.attackTimer / t.windupTotal) : 0;
  p.hit = t.sinceHit >= 0 && t.sinceHit < HIT_SEC ? 1 - t.sinceHit / HIT_SEC : 0;
  // A foe a Chain Spark is still flying towards keeps its live pose until the last bolt-flight moment.
  p.defeated = t.defeated && !(t.phase === 'dispelling' && t.phaseTime < -PROJECTILE_SEC);
  p.dispel = t.phase === 'dispelling' ? Math.max(0, t.phaseTime) / DISPEL_SEC : t.phase === 'gone' ? 1 : 0;
  p.stunned = t.phase === 'stunned' ? Math.max(0, t.phaseTime) / SHIELD_BREAK_SEC : 0;
  p.shielded = isShielded(t) && t.phase !== 'stunned';
  const m = t.spawn.movement;
  p.moving = !!m && ((m.kind === 'approach' && !t.atPathEnd) || m.kind === 'patrol') && t.attackPhase === 'idle';
  p.frosted = t.frostTimer > 0;
  p.recovering = t.attackPhase === 'recover';
}

const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};

/** A stolen page, half its writing rubbed out, held in front of the thief's chest (the kit page stands upright, facing +z). */
const HELD_PAGE = { position: [0.02, 0.42, 0.2] as const, scale: 0.85 };
/** The page flies back to us and sweeps down past the bottom of the view, tucked away. */
const RETURN_SEC = 1.3;

interface ReturningPage {
  key: number;
  from: Vector3;
  age: number;
}
const returning: ReturningPage[] = [];
let returnKey = 0;

function HeldPage() {
  return (
    <group rotation={[-0.15, 0, 0.12]}>
      <KitModel id="page_half_erased" scale={HELD_PAGE.scale} castShadow={false} />
    </group>
  );
}

/**
 * Pages won back from thieves (owner, 2026-10-28: "when we defeat him can the page fly back to us?"): each
 * flutters from where the thief let go up to the camera, spinning, and sweeps down out of view as if tucked away.
 */
function ReturningPages() {
  const refs = useRef<(Group | null)[]>([]);
  const to = useRef(new Vector3());
  const [, rerender] = useState(0);
  const count = useRef(0);
  useFrame((state, delta) => {
    if (returning.length !== count.current) {
      count.current = returning.length;
      rerender((n) => n + 1);
    }
    const cam = state.camera;
    for (let i = returning.length - 1; i >= 0; i--) {
      const r = returning[i];
      if (!r) continue;
      r.age += Math.min(delta, 0.1);
      const u = Math.min(1, r.age / RETURN_SEC);
      const g = refs.current[i];
      if (g) {
        to.current.set(0.25, -0.75, -0.7).applyQuaternion(cam.quaternion).add(cam.position);
        const e = u * u * (3 - 2 * u);
        g.position.lerpVectors(r.from, to.current, e);
        g.position.y += Math.sin(u * Math.PI) * 0.8;
        g.quaternion.copy(cam.quaternion);
        g.rotateX(-0.4 * (1 - u));
        g.rotateZ(Math.sin(r.age * 9) * 0.5 * (1 - u) + (1 - e) * Math.PI * 2);
        g.scale.setScalar(HELD_PAGE.scale);
      }
      if (u >= 1) returning.splice(i, 1);
    }
  });
  return (
    <>
      {returning.map((r, i) => (
        <group key={r.key} ref={(o) => void (refs.current[i] = o)} position={r.from}>
          <KitModel id="page_half_erased" castShadow={false} />
        </group>
      ))}
    </>
  );
}

function TargetView({ id }: { id: string }) {
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
  const faced = useRef(false);
  const page = useRef<Group>(null);
  const spawn = getRun()?.findTarget(id)?.spawn;

  useFrame((state) => {
    const g = group.current;
    const t = getRun()?.findTarget(id);
    if (!g) return;
    if (!t) {
      g.visible = false;
      return;
    }
    g.visible = true;
    writePose(t, pose.current);
    g.position.copy(t.position);
    // Charging training dummies hop on their weighted bases.
    if (t.spawn.kind === 'dummy' && pose.current.moving) g.position.y += Math.abs(Math.sin(t.clock * 6.5)) * 0.32;
    if (FACES_CAMERA.has(t.spawn.kind)) {
      const dx = state.camera.position.x - t.position.x;
      const dz = state.camera.position.z - t.position.z;
      const yaw = Math.atan2(dx, dz);
      // Already facing the camera when it first shows (owner, 2026-10-24: the reassembled stair guard
      // turned its back for a moment), then eases round as things move rather than snapping.
      if (!faced.current) {
        g.rotation.y = yaw;
        faced.current = true;
      }
      let diff = yaw - g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      g.rotation.y += diff * 0.15;
    }
    const p = pose.current;
    // The held page turns to face the camera (seen from the roof, it was edge-on); the thief lets go of
    // it as it is beaten, and it flies back to us.
    if (page.current?.visible) page.current.quaternion.copy(g.quaternion).invert().multiply(state.camera.quaternion);
    if (page.current && page.current.visible && p.defeated) {
      page.current.visible = false;
      returning.push({ key: returnKey++, from: page.current.getWorldPosition(new Vector3()), age: 0 });
    }
    // Arcade targets (Practice Gallery) spin as they pop up.
    if (t.spawn.variant === 'practice' && p.appear < 1) g.rotation.y += (1 - p.appear) * 0.9;
    let scale = t.spawn.inPlace ? 1 : easeOutBack(p.appear);
    if (t.phase === 'dispelling' && !t.spawn.persist) scale *= Math.max(0, 1 - p.dispel * 1.1);
    g.scale.setScalar(Math.max(0.001, scale));
  }, -1);

  if (!spawn) return null;
  return (
    <group ref={group}>
      <Model spawn={spawn} pose={pose} />
      {spawn.holdsPage && (
        <group ref={page} position={HELD_PAGE.position}>
          <Suspense fallback={null}>
            <HeldPage />
          </Suspense>
        </group>
      )}
    </group>
  );
}

/** Defeated targets that stay in the scene in a calm pose (bowed guardian, moss mound, dormant pod). */
function RetiredView({ spawn, position }: { spawn: TargetSpawn; position: import('three').Vector3 }) {
  const pose = useRef<TargetPose>({ ...emptyPose(), defeated: true, dispel: 1 });
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    pose.current.time += delta;
    const g = group.current;
    if (!g) return;
    const dx = state.camera.position.x - position.x;
    const dz = state.camera.position.z - position.z;
    if (g.userData.faced !== true) {
      g.rotation.y = Math.atan2(dx, dz);
      g.userData.faced = true;
    }
  });
  return (
    <group ref={group} position={position}>
      <Model spawn={spawn} pose={pose} />
    </group>
  );
}

export function EnemyManager() {
  const ids = useRunStore((s) => s.targetIds);
  useRunStore((s) => s.retiredKey);
  const retired = getRun()?.retired ?? [];
  return (
    <group name="targets">
      {ids.map((id) => (
        <TargetView key={id} id={id} />
      ))}
      {retired.map((r) => (
        <RetiredView key={`retired-${r.id}`} spawn={r.spawn} position={r.position} />
      ))}
      <Suspense fallback={null}>
        <ReturningPages />
      </Suspense>
    </group>
  );
}
