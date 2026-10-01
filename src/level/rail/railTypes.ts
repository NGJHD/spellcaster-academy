import type { Vector3 } from 'three';
import type { AreaId } from '../../game/types';

export type Vec3 = readonly [number, number, number];

/** A named camera placement. Position and look target are authored separately for art direction. */
export interface CameraNode {
  readonly position: Vec3;
  readonly lookAt: Vec3;
}

export type EasingName = 'linear' | 'easeInOutSine' | 'easeInOutCubic' | 'easeOutCubic';

export interface CameraBeatBase {
  /** Stable identifier used for checkpoints, resume and debugging. */
  readonly id: string;
  readonly areaId: AreaId;
}

/** Camera glides along a Catmull–Rom spline through named nodes. */
export interface RailTravelBeat extends CameraBeatBase {
  readonly kind: 'rail-travel';
  readonly nodes: readonly string[];
  readonly durationSec: number;
  readonly easing: EasingName;
  /** Reduced-motion alternative: keep the glide (slow, short moves) or replace it with a fade cut. */
  readonly reducedMotion: 'glide' | 'fade-cut';
}

/** Camera holds position at a node and pans its look target across named look points. */
export interface CameraRevealBeat extends CameraBeatBase {
  readonly kind: 'camera-reveal';
  readonly atNode: string;
  /** Look points visited in order. Empty means a pure hold on the node's own framing. */
  readonly lookTargets: readonly string[];
  readonly panSec: number;
  readonly holdSec: number;
  /** Pan back to the node's own look target at the end, so the next rail starts cleanly. */
  readonly returnToNode: boolean;
}

/** Fade to black, cut to a node, fade back in. Used for area loading and doors. */
export interface LoadingTransitionBeat extends CameraBeatBase {
  readonly kind: 'loading-transition';
  readonly toNode: string;
  readonly fadeOutSec: number;
  readonly holdSec: number;
  readonly fadeInSec: number;
}

export type CameraBeat = RailTravelBeat | CameraRevealBeat | LoadingTransitionBeat;

export const isCameraBeat = (beat: { kind: string }): beat is CameraBeat =>
  beat.kind === 'rail-travel' || beat.kind === 'camera-reveal' || beat.kind === 'loading-transition';

/** Named camera nodes and look points shared by all beats of a route. */
export interface CameraSpace {
  readonly id: string;
  readonly nodes: Readonly<Record<string, CameraNode>>;
  readonly lookPoints: Readonly<Record<string, Vec3>>;
}

export interface CameraPose {
  readonly position: Vector3;
  readonly lookAt: Vector3;
  /** 0 = fully visible, 1 = fully black. */
  fade: number;
}

export interface RailSettings {
  readonly reducedMotion: boolean;
  /** Multiplier applied to rail travel speed between encounters. */
  readonly travelSpeed: number;
}
