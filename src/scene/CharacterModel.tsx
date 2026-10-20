import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AnimationMixer, LoopRepeat, Mesh, type AnimationAction, type Object3D } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Speaker } from '../content/dialogue';
import { useRunStore } from '../state/runStore';

export type CharacterId = 'mira' | 'orin' | 'student_a' | 'student_b' | 'student_a_lod1' | 'student_b_lod1';
export type CharacterClip = 'Idle' | 'Wave' | 'TalkShort' | 'Celebrate' | 'Run';

const base = `${import.meta.env.BASE_URL}assets/characters/`;
const FADE_SEC = 0.35;

/**
 * Rigged character GLB (assets-src/scripts/characters/humanoid.py). Plays `clip` on loop; when
 * `speaker` is set, gestures with TalkShort while that character's subtitle is on screen.
 */
export function CharacterModel({ id, clip = 'Idle', speaker }: { id: CharacterId; clip?: CharacterClip | (() => CharacterClip); speaker?: Speaker }) {
  const gltf = useGLTF(`${base}${id}.glb`);
  const scene = useMemo(() => {
    const s = cloneSkinned(gltf.scene) as Object3D;
    s.traverse((o) => {
      if (o instanceof Mesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;
      }
    });
    return s;
  }, [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);
  const actions = useMemo(() => {
    const map = new Map<string, AnimationAction>();
    for (const c of gltf.animations) {
      const a = mixer.clipAction(c);
      a.setLoop(LoopRepeat, Infinity);
      map.set(c.name, a);
    }
    return map;
  }, [gltf.animations, mixer]);
  const state = useMemo(() => ({ current: '' }), []);

  useEffect(() => {
    // Also re-runs when a Suspense boundary above hides and re-shows the model: the cleanup stopped every
    // action, so start over and let the next frame play the wanted clip again (characters used to freeze
    // in their rest pose, arms down, after another asset loaded).
    state.current = '';
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, state]);

  useFrame((_, dt) => {
    const talking = speaker !== undefined && useRunStore.getState().subtitle?.speaker === speaker;
    const chosen = typeof clip === 'function' ? clip() : clip;
    // Talking gestures never interrupt a run.
    const want = talking && chosen !== 'Run' ? 'TalkShort' : chosen;
    if (want !== state.current) {
      const next = actions.get(want) ?? actions.get('Idle');
      const prev = actions.get(state.current);
      if (next) {
        next.reset().play();
        if (prev && prev !== next) next.crossFadeFrom(prev, FADE_SEC, false);
      }
      state.current = want;
    }
    mixer.update(Math.min(dt, 0.1));
  });

  return <primitive object={scene} />;
}

useGLTF.preload(`${base}mira.glb`);
