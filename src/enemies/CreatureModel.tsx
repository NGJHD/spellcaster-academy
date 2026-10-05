import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, type RefObject } from 'react';
import { AnimationMixer, Color, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial, type AnimationAction, type Object3D } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { TargetPose } from './TargetVisuals';

/** Fraction of the Attack clip that is anticipation; the rest is the strike and recovery. */
const ATTACK_ANTICIPATION = 14 / 30;
const FADE_SEC = 0.18;

type ClipName = 'Idle' | 'Move' | 'Attack' | 'Hit' | 'Dispel';

const base = `${import.meta.env.BASE_URL}assets/creatures/`;

/** Rigged creature GLBs built by assets-src/scripts/creatures/*.py. */
/**
 * Level 2/3 mobs whose realistic models have been built (assets-src/scripts/ai). Kinds not listed use
 * their code-built stand-in instead of requesting a file that does not exist yet.
 */
export const BUILT_AI_MOBS: ReadonlySet<string> = new Set<string>(['hollow-knight', 'eraser-moth', 'correction-moth', 'foreman', 'blotling', 'smudgehound', 'redactor', 'scribble-imp']);
/** Boss and set-piece model files built so far (scene creatures, not typing targets). */
export const BUILT_AI_FILES: ReadonlySet<string> = new Set<string>(['grey_herald.glb', 'perfect_warden.glb', 'unwriter.glb', 'vellum_wyrm.glb']);
const AI_MOB_KINDS = new Set(['blotling', 'eraser-moth', 'scribble-imp', 'smudgehound', 'hollow-knight', 'correction-moth', 'redactor', 'foreman']);

export function creatureUrl(kind: string, variant?: string): string | null {
  if (AI_MOB_KINDS.has(kind) && !BUILT_AI_MOBS.has(kind)) return null;
  switch (kind) {
    case 'sprite':
      // One realistic model (assets-src/scripts/ai); grey and teal variants are tints (CreatureModel `tint`).
      void variant;
      return `${base}mischief_sprite.glb`;
    case 'mossling':
      return `${base}mossling.glb`;
    case 'imp':
      return `${base}paint_imp.glb`;
    case 'thorn-pod':
      return `${base}thorn_pod.glb`;
    case 'wisp':
      return `${base}ink_wisp.glb`;
    case 'blotling':
      return `${base}blotling.glb`;
    case 'eraser-moth':
      return `${base}eraser_moth.glb`;
    case 'scribble-imp':
      return `${base}scribble_imp.glb`;
    case 'smudgehound':
      return `${base}smudgehound.glb`;
    case 'hollow-knight':
      return `${base}hollow_knight.glb`;
    case 'correction-moth':
      return `${base}correction_moth.glb`;
    case 'redactor':
      return `${base}redactor.glb`;
    case 'foreman':
      return `${base}foreman.glb`;
    default:
      return null;
  }
}

function chooseClip(p: TargetPose): ClipName {
  if (p.defeated) return 'Dispel';
  if (p.windup > 0 || p.recovering) return 'Attack';
  if (p.hit > 0.5) return 'Hit';
  return p.moving ? 'Move' : 'Idle';
}

/**
 * A skinned creature GLB driven by gameplay state. Each target gets its own skeleton clone and mixer;
 * the Attack clip's anticipation is scrubbed by the gameplay wind-up so the telegraph matches timing.
 */
/** Colour variants of one realistic model (grey sprite, teal bonus sprite) without extra downloads. */
const TINTS: Readonly<Record<string, { color: string; emissive?: string; emissiveIntensity?: number }>> = {
  grey: { color: '#9a9aa4' },
  teal: { color: '#c9e8e2', emissive: '#1fa594', emissiveIntensity: 0.35 },
  'book-blue': { color: '#7fa0ff' },
  'book-green': { color: '#8fd09a' },
};

export function CreatureModel({ url, pose, tint }: { url: string; pose: RefObject<TargetPose>; tint?: string }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => {
    const s = cloneSkinned(gltf.scene) as Object3D;
    const t = tint ? TINTS[tint] : undefined;
    s.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
        if (t && o.material instanceof MeshStandardMaterial) {
          const m = o.material.clone();
          m.color.multiply(new Color(t.color));
          if (t.emissive) {
            m.emissive.set(t.emissive);
            m.emissiveIntensity = t.emissiveIntensity ?? 0.3;
          }
          o.material = m;
        }
      }
    });
    return s;
  }, [gltf.scene, tint]);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const actions = useMemo(() => {
    const map = new Map<string, AnimationAction>();
    for (const clip of gltf.animations) map.set(clip.name, mixer.clipAction(clip));
    return map;
  }, [gltf.animations, mixer]);

  useEffect(() => {
    const idle = actions.get('Idle');
    idle?.play();
    return () => {
      mixer.stopAllAction();
    };
  }, [actions, mixer]);

  const state = useMemo(() => ({ current: 'Idle' as ClipName }), []);

  useFrame((_, dt) => {
    const p = pose.current;
    const want = chooseClip(p);
    const next = actions.get(want);
    if (want !== state.current && next) {
      const prev = actions.get(state.current);
      next.reset();
      const oneShot = want === 'Dispel' || want === 'Hit' || want === 'Attack';
      next.setLoop(oneShot ? LoopOnce : LoopRepeat, oneShot ? 1 : Infinity);
      next.clampWhenFinished = oneShot;
      if (want === 'Attack' && p.recovering) next.time = next.getClip().duration * ATTACK_ANTICIPATION;
      next.play();
      if (prev) next.crossFadeFrom(prev, FADE_SEC, false);
      state.current = want;
    }
    const attack = actions.get('Attack');
    if (attack && want === 'Attack') {
      if (p.windup > 0) {
        attack.paused = true;
        attack.time = attack.getClip().duration * ATTACK_ANTICIPATION * p.windup;
      } else {
        attack.paused = false;
      }
    }
    mixer.update(Math.min(dt, 0.1));
  });

  return <primitive object={scene} />;
}
