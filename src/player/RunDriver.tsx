import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef, type RefObject } from 'react';
import { Vector3 } from 'three';
import { TIME_SCALE, getRun, isGameplayActive, useGameStore } from '../state/gameStore';
import { KICK_SEC } from '../game/GameRun';
import { labelElements } from '../ui/EnemyWordLabel';
import { popupElements } from '../ui/Juice';

/** How far the camera eases its gaze toward the locked target (subtle combat framing). */
const FRAMING_RATE = 3;
const SHAKE_AMPLITUDE = 0.045;
const KICK_DISTANCE = 0.06;
const kick = new Vector3();
/** Labels stay this many pixels inside the viewport edge. */
const SAFE_MARGIN = 56;
/** Labels never drop into the subtitle band at the bottom of the screen (GD-19). */
const SUBTITLE_BAND = 150;

/** Last frame's render statistics (read by the `?test` hook for performance checks). */
export const renderStats = { triangles: 0, calls: 0, frameMs: 0 };
/** Scene handle for the `?test` hook's triangle breakdown. */
export const debugScene: { current: import('three').Object3D | null } = { current: null };

const look = new Vector3();
const framing = new Vector3();
const projected = new Vector3();
const forward = new Vector3();
const toTarget = new Vector3();

/**
 * Per-frame glue: advances the run, places the camera from the level director (with gentle
 * framing and optional shake), drives the fade overlay, and projects word labels to the screen.
 * Nothing here touches React state.
 */
export function RunDriver({ fadeRef }: { fadeRef: RefObject<HTMLDivElement | null> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  debugScene.current = scene;
  const blend = useRef(0);
  const time = useRef(0);

  useEffect(() => {
    const run = getRun();
    if (!run) return;
    run.centralityOf = (id) => {
      const t = run.findTarget(id);
      if (!t) return 99;
      projected.copy(t.position).project(camera);
      if (projected.z > 1) return 50;
      return Math.hypot(projected.x, projected.y);
    };
  }, [camera]);

  useFrame((_, delta) => {
    renderStats.triangles = gl.info.render.triangles;
    renderStats.calls = gl.info.render.calls;
    renderStats.frameMs = delta * 1000;
    const run = getRun();
    if (!run) return;
    time.current += delta;
    if (isGameplayActive(useGameStore.getState().mode)) run.update(delta * TIME_SCALE);

    const pose = run.director.pose;
    camera.position.copy(pose.position);
    const goal = run.framingTarget(framing);
    const hasTarget = goal > 0;
    blend.current += (goal - blend.current) * (1 - Math.exp(-FRAMING_RATE * Math.min(delta, 0.1)));
    look.copy(pose.lookAt);
    if (blend.current > 0.001 && hasTarget) look.lerp(framing, blend.current);
    if (run.shakeTime > 0) {
      const k = run.shakeTime * SHAKE_AMPLITUDE * 3;
      const t = time.current * 37;
      camera.position.x += Math.sin(t) * k;
      camera.position.y += Math.sin(t * 1.3 + 1) * k;
    }
    if (run.kickTime > 0) {
      // A small forward punch when a word lands (hit feedback, CLAUDE.md §1B).
      const k = Math.sin((run.kickTime / KICK_SEC) * Math.PI) * KICK_DISTANCE;
      kick.copy(look).sub(camera.position).normalize();
      camera.position.addScaledVector(kick, k);
    }
    camera.lookAt(look);
    camera.updateMatrixWorld();

    const overlay = fadeRef.current;
    if (overlay) overlay.style.opacity = pose.fade.toFixed(3);

    projectLabels(run, camera, size.width, size.height);
    projectPopups(camera, size.width, size.height);
    // Runs before every other frame callback (targets at -1, effects at 0) so models, labels and the
    // camera all use this frame's simulation: no one-frame lag during fast-rail set pieces.
  }, -2);

  return null;
}

function projectPopups(camera: import('three').Camera, width: number, height: number): void {
  for (const { el, position } of popupElements.values()) {
    projected.set(position[0], position[1], position[2]).project(camera);
    const x = Math.min(width - SAFE_MARGIN, Math.max(SAFE_MARGIN, (projected.x * 0.5 + 0.5) * width));
    const y = Math.min(height - SUBTITLE_BAND, Math.max(SAFE_MARGIN, (-projected.y * 0.5 + 0.5) * height));
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }
}

function projectLabels(
  run: NonNullable<ReturnType<typeof getRun>>,
  camera: import('three').Camera,
  width: number,
  height: number,
): void {
  camera.getWorldDirection(forward);
  for (const [id, el] of labelElements) {
    const t = run.findTarget(id);
    if (!t) {
      el.style.transform = 'translate(-9999px, -9999px)';
      continue;
    }
    projected.copy(t.position);
    projected.y += t.spawn.labelHeight ?? 1;
    toTarget.copy(projected).sub(camera.position);
    const behind = toTarget.dot(forward) < 0;
    projected.project(camera);
    let x = (projected.x * 0.5 + 0.5) * width;
    let y = (-projected.y * 0.5 + 0.5) * height;
    if (behind) {
      // Mirror so the indicator points the right way, then push to the edge.
      x = width - x;
      y = height - SUBTITLE_BAND;
    }
    const clampedX = Math.min(width - SAFE_MARGIN, Math.max(SAFE_MARGIN, x));
    const clampedY = Math.min(height - SUBTITLE_BAND, Math.max(SAFE_MARGIN * 1.6, y));
    const offscreen = behind || clampedX !== x || clampedY !== y;
    el.style.transform = `translate(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px)`;
    if (!el.dataset.fly) {
      // First placement of a new word: it flies in from the centre of the screen (owner feedback).
      el.style.setProperty('--fly-dx', `${(width / 2 - clampedX).toFixed(1)}px`);
      el.style.setProperty('--fly-dy', `${(height * 0.45 - clampedY).toFixed(1)}px`);
      el.dataset.fly = 'true';
    }
    if (offscreen) {
      const angle = Math.atan2(y - clampedY, x - clampedX);
      el.dataset.offscreen = 'true';
      el.style.setProperty('--arrow-angle', `${angle}rad`);
    } else if (el.dataset.offscreen) {
      delete el.dataset.offscreen;
    }
  }
}
