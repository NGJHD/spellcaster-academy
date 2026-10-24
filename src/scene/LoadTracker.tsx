/**
 * Follows the first load behind the loading screen (owner, 2026-10-23: the first area froze for seconds
 * as it loaded and compiled in view). While the game is in its `loading` mode the run stands still at its
 * first camera pose; this watches the files arriving, then readies the scene's shaders, and starts the
 * level once nothing new has arrived for a moment. Progress goes to `loadProgress`, which the loading
 * screen reads directly (never through React state).
 */
import { useProgress } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { useGameStore } from '../state/gameStore';
import { preloadFlames } from './Fire';
import { countDrawables, warmUp } from './warmUp';

/** 0–1, never moving backwards; `readying` once the files are in and the shaders are compiling. */
export const loadProgress = { value: 0, readying: false };

/** Nothing new for this long counts as loaded. */
const SETTLE_SEC = 0.6;
/** The loading screen stays at least this long, so it never just flashes. */
const MIN_SEC = 1.5;
/** A load that never settles (a missing file) still lets the game start. */
const MAX_SEC = 25;

export function LoadTracker() {
  const { gl, scene, camera } = useThree();
  const state = useRef({ time: 0, quiet: 0, drawables: -1, warming: false, warmed: false, done: false });
  // The fire flipbooks are used across every level: fetch them now, while the screen is covered.
  useEffect(() => void preloadFlames(), []);

  useFrame((_, delta) => {
    if (useGameStore.getState().mode !== 'loading') return;
    const s = state.current;
    if (s.done) return;
    s.time += Math.min(delta, 0.1);
    const { active, loaded, total } = useProgress.getState();
    const n = countDrawables(scene);
    if (active || n !== s.drawables) {
      // Something is still arriving: wait, and ready the shaders again once it settles.
      s.drawables = n;
      s.quiet = 0;
      s.warmed = false;
    } else {
      s.quiet += Math.min(delta, 0.1);
    }
    if (s.quiet >= SETTLE_SEC && !s.warmed && !s.warming) {
      s.warming = true;
      loadProgress.readying = true;
      void warmUp(gl, scene, camera, scene).finally(() => {
        s.warming = false;
        s.warmed = true;
      });
    }
    const files = total > 0 ? loaded / total : 0;
    const target = s.warmed ? 1 : Math.min(0.9, files * 0.85 + (s.warming ? 0.05 : 0));
    loadProgress.value = Math.max(loadProgress.value, target);
    if ((s.warmed && s.quiet >= SETTLE_SEC && s.time >= MIN_SEC) || s.time >= MAX_SEC) {
      s.done = true;
      loadProgress.value = 1;
      // A moment on the full bar before the level begins.
      window.setTimeout(() => useGameStore.getState().finishLoading(), 350);
    }
  });

  return null;
}
