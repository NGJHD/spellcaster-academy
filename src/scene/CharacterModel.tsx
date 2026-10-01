import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { AnimationMixer, LoopRepeat, Mesh, type AnimationAction, type Object3D } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Speaker } from '../content/dialogue';
import { useRunStore } from '../state/runStore';

export type CharacterId = 'mira' | 'orin' | 'student_a' | 'student_b';
export type CharacterClip = 'Idle' | 'Wave' | 'TalkShort' | 'Celebrate';

const base = `${import.meta.env.BASE_URL}assets/characters/`;
const FADE_SEC = 0.35;

/**
 * Rigged character GLB (assets-src/scripts/characters/humanoid.py). Plays `clip` on loop; when
 * `speaker` is set, gestures with TalkShort while that character's subtitle is on screen.
 */
export function CharacterModel({ id, clip = 'Idle', speaker }: { id: CharacterId; clip?: CharacterClip; speaker?: Speaker }) {
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

  useEffect(() => () => {
    mixer.stopAllAction();
  }, [mixer]);

  useFrame((_, dt) => {
    const talking = speaker !== undefined && useRunStore.getState().subtitle?.speaker === speaker;
    const want = talking ? 'TalkShort' : clip;
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
