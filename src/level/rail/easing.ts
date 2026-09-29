import type { EasingName } from './railTypes';

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);

const EASINGS: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  easeOutCubic: (t) => 1 - (1 - t) ** 3,
};

export function ease(name: EasingName, t: number): number {
  return EASINGS[name](clamp01(t));
}
