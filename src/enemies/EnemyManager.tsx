import { useFrame } from '@react-three/fiber';
import { Suspense, useRef, type ReactNode, type RefObject } from 'react';
import type { Group } from 'three';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';
import type { TargetSpawn } from '../level/levelTypes';
import { CreatureModel, creatureUrl } from './CreatureModel';
import { ModelBoundary } from './ModelBoundary';
import { Fire } from '../scene/Fire';
import { Guardian } from './GuardianGLB';
import { Book, Dummy, ThornPod } from './PropTargets';
import { APPEAR_SEC, DISPEL_SEC, isShielded, SHIELD_BREAK_SEC, type TargetRuntime } from './EnemyBrain';
import {
  ClaspModel,
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
      {spawn.kind === 'smudgehound' && <Fire position={[0, 0.6, 0]} size={0.6} count={2} spread={0.6} smoke={false} />}
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
    case 'clasp':
      return <ClaspModel pose={pose} />;
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
  p.defeated = t.defeated;
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

function TargetView({ id }: { id: string }) {
  const group = useRef<Group>(null);
  const pose = useRef<TargetPose>(emptyPose());
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
      // Ease toward the camera rather than snapping.
      let diff = yaw - g.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      g.rotation.y += diff * 0.15;
    }
    const p = pose.current;
    // Arcade targets (Practice Gallery) spin as they pop up.
    if (t.spawn.variant === 'practice' && p.appear < 1) g.rotation.y += (1 - p.appear) * 0.9;
    let scale = easeOutBack(p.appear);
    if (t.phase === 'dispelling' && !t.spawn.persist) scale *= Math.max(0, 1 - p.dispel * 1.1);
    g.scale.setScalar(Math.max(0.001, scale));
  }, -1);

  if (!spawn) return null;
  return (
    <group ref={group}>
      <Model spawn={spawn} pose={pose} />
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
    </group>
  );
}
