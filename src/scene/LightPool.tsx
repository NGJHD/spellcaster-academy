/**
 * A fixed set of point lights shared by every scene. three.js builds the number of lights into every
 * shader, so a light appearing or disappearing (an area shown, the previous one unmounted, a fire lit)
 * recompiled every material in view: transitions froze for 2–6 s. Scenes place `PoolLight`s instead,
 * which are only markers; each frame the pool lends its real lights to the markers that matter most to
 * the camera, fading a marker in or out as it gains or loses a light, so the count never changes.
 */
import { useFrame } from '@react-three/fiber';
import { useImperativeHandle, useLayoutEffect, useMemo, type Ref } from 'react';
import { Color, Object3D, PointLight, Vector3, type ColorRepresentation } from 'three';

/**
 * Real point lights in the world at all times: the most any settled area shows at once (the night
 * celebration), so every light still shines; areas mid-change lend them to the nearest.
 */
export const POOL_SIZE = 9;
/** How quickly a light fades in or out as it gains or loses a slot (per second). */
const FADE_RATE = 5;

/** A scene's point light: where it is and how bright. The pool decides which ones actually shine. */
export class VirtualLight extends Object3D {
  intensity = 1;
  readonly color = new Color('#ffffff');
  distance = 0;
  decay = 2;
  /** 0–1: how far it has faded in on a pooled light. */
  weight = 0;
}

const markers = new Set<VirtualLight>();
/** Scene lights wanting to shine last frame (`?test` hook: more than POOL_SIZE means some were dropped). */
export const poolStats = { live: 0 };

interface PoolLightProps {
  ref?: Ref<VirtualLight>;
  position?: readonly [number, number, number];
  color?: ColorRepresentation;
  intensity?: number;
  distance?: number;
  decay?: number;
}

/** Drop-in for `<pointLight>`: the same props, and a ref whose `intensity` and `position` can be animated. */
export function PoolLight({ ref, position, color = '#ffffff', intensity = 1, distance = 0, decay = 2 }: PoolLightProps) {
  const light = useMemo(() => new VirtualLight(), []);
  useImperativeHandle(ref, () => light, [light]);
  useLayoutEffect(() => {
    markers.add(light);
    return () => void markers.delete(light);
  }, [light]);
  useLayoutEffect(() => void light.color.set(color), [light, color]);
  useLayoutEffect(() => {
    light.intensity = intensity;
  }, [light, intensity]);
  useLayoutEffect(() => {
    light.distance = distance;
    light.decay = decay;
  }, [light, distance, decay]);
  return <primitive object={light} position={position} />;
}

/** True when the marker and every ancestor are visible and it is in the scene (not in a staged, hidden area). */
function shown(o: Object3D): boolean {
  for (let p: Object3D | null = o; p; p = p.parent) {
    if (!p.visible) return false;
    if (!p.parent) return (p as { isScene?: boolean }).isScene === true;
  }
  return false;
}

const at = new Vector3();

/** How much a light matters from the camera: its brightness, falling off beyond its reach. */
function score(v: VirtualLight, camera: Vector3): number {
  v.getWorldPosition(at);
  const reach = v.distance > 0 ? v.distance : 30;
  const d = at.distanceTo(camera);
  return v.intensity / (1 + (d / reach) * (d / reach));
}

export function LightPool() {
  const lights = useMemo(
    () =>
      Array.from({ length: POOL_SIZE }, () => {
        const l = new PointLight('#ffffff', 0);
        l.decay = 2;
        return l;
      }),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const cam = state.camera.position;
    const live: { v: VirtualLight; s: number }[] = [];
    for (const v of markers) {
      if (shown(v) && v.intensity > 0) live.push({ v, s: score(v, cam) });
      else v.weight = 0;
    }
    poolStats.live = live.length;
    live.sort((a, b) => b.s - a.s);
    const wanted = new Set(live.slice(0, POOL_SIZE).map((x) => x.v));
    const ease = 1 - Math.exp(-FADE_RATE * dt);
    // Lights already shining keep their place while they fade in or out; newcomers take free places.
    const lit: VirtualLight[] = [];
    for (const { v } of live) {
      if (v.weight <= 0) continue;
      v.weight += ((wanted.has(v) ? 1 : 0) - v.weight) * ease;
      if (v.weight > 0.01 && lit.length < POOL_SIZE) lit.push(v);
      else v.weight = 0;
    }
    for (const { v } of live) {
      if (lit.length >= POOL_SIZE) break;
      if (v.weight > 0 || !wanted.has(v)) continue;
      v.weight = ease;
      lit.push(v);
    }
    lights.forEach((l, i) => {
      const v = lit[i];
      if (!v) {
        l.intensity = 0;
        return;
      }
      v.getWorldPosition(l.position);
      l.color.copy(v.color);
      l.intensity = v.intensity * v.weight;
      l.distance = v.distance;
      l.decay = v.decay;
    });
  });

  return (
    <>
      {lights.map((l, i) => (
        <primitive key={i} object={l} />
      ))}
    </>
  );
}
