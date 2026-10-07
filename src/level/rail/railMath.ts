import { CatmullRomCurve3, Vector3 } from 'three';
import { ease } from './easing';
import type {
  CameraBeat,
  CameraNode,
  CameraPose,
  CameraRevealBeat,
  CameraSpace,
  LoadingTransitionBeat,
  RailSettings,
  RailTravelBeat,
  Vec3,
} from './railTypes';

/** Timings for the reduced-motion fade cut that replaces a rail glide. */
export const FADE_CUT = { outSec: 0.35, holdSec: 0.1, inSec: 0.45 } as const;

/** Reduced motion shortens reveal pans by this factor. */
export const REDUCED_MOTION_PAN_SCALE = 0.5;

/**
 * Global pacing (owner feedback: faster, no dead time). Authored durations are multiplied by these and
 * then divided by the travel-speed setting, so looking around and holds speed up with travel.
 */
export const PACE = { travel: 0.8, pan: 0.45, hold: 0.5, fade: 0.55 } as const;

export function createPose(): CameraPose {
  return { position: new Vector3(), lookAt: new Vector3(), fade: 0 };
}

export function copyPose(from: CameraPose, to: CameraPose): void {
  to.position.copy(from.position);
  to.lookAt.copy(from.lookAt);
  to.fade = from.fade;
}

function setPose(out: CameraPose, position: Vec3, lookAt: Vec3, fade: number): void {
  out.position.set(...position);
  out.lookAt.set(...lookAt);
  out.fade = fade;
}

export function getNode(route: CameraSpace, id: string): CameraNode {
  const node = route.nodes[id];
  if (!node) throw new Error(`Unknown camera node "${id}" in route "${route.id}"`);
  return node;
}

export function getLookPoint(route: CameraSpace, id: string): Vec3 {
  const point = route.lookPoints[id];
  if (!point) throw new Error(`Unknown look point "${id}" in route "${route.id}"`);
  return point;
}

export interface TravelCurves {
  readonly position: CatmullRomCurve3;
  readonly lookAt: CatmullRomCurve3;
}

export function buildTravelCurves(route: CameraSpace, beat: RailTravelBeat): TravelCurves {
  const nodes = beat.nodes.map((id) => getNode(route, id));
  return {
    position: new CatmullRomCurve3(nodes.map((n) => new Vector3(...n.position)), false, 'centripetal'),
    lookAt: new CatmullRomCurve3(nodes.map((n) => new Vector3(...n.lookAt)), false, 'centripetal'),
  };
}

function revealLookSequence(route: CameraSpace, beat: CameraRevealBeat): Vec3[] {
  const node = getNode(route, beat.atNode);
  const targets = beat.lookTargets.map((id) => getLookPoint(route, id));
  return beat.returnToNode && targets.length > 0 ? [node.lookAt, ...targets, node.lookAt] : [node.lookAt, ...targets];
}

function usesFadeCut(beat: RailTravelBeat, settings: RailSettings): boolean {
  return settings.reducedMotion && beat.reducedMotion === 'fade-cut';
}

function revealPanSec(beat: CameraRevealBeat, settings: RailSettings): number {
  const pan = (beat.panSec * PACE.pan) / settings.travelSpeed;
  return settings.reducedMotion ? pan * REDUCED_MOTION_PAN_SCALE : pan;
}

function revealHoldSec(beat: CameraRevealBeat, settings: RailSettings): number {
  return Math.max(0.15, (beat.holdSec * PACE.hold) / settings.travelSpeed);
}

function fadeSec(sec: number): number {
  return sec * PACE.fade;
}

/**
 * Seconds at the end of a reveal spent panning back to the node's own view (0 when it does not
 * return). While a word shown by the reveal is waiting, the camera holds just before this, still
 * looking at the word (owner, 2026-10-07: "it was looking at the target then the camera shifted away").
 */
export function revealReturnSec(beat: CameraBeat, settings: RailSettings): number {
  if (beat.kind !== 'camera-reveal' || !beat.returnToNode || beat.lookTargets.length === 0) return 0;
  return revealPanSec(beat, settings) + revealHoldSec(beat, settings);
}

export function beatDurationSec(route: CameraSpace, beat: CameraBeat, settings: RailSettings): number {
  switch (beat.kind) {
    case 'rail-travel':
      return usesFadeCut(beat, settings)
        ? FADE_CUT.outSec + FADE_CUT.holdSec + FADE_CUT.inSec
        : (beat.durationSec * PACE.travel) / settings.travelSpeed;
    case 'camera-reveal': {
      const segments = revealLookSequence(route, beat).length - 1;
      // Every pan is followed by a hold; a pure hold (no targets) is just the hold.
      return segments * revealPanSec(beat, settings) + Math.max(1, segments) * revealHoldSec(beat, settings);
    }
    case 'loading-transition':
      return fadeSec(beat.fadeOutSec + beat.holdSec + beat.fadeInSec);
  }
}

/** Pose at the very start of a beat. `previous` is the end pose of the prior beat, if any. */
export function beatStartPose(route: CameraSpace, beat: CameraBeat, out: CameraPose, previous?: CameraPose): CameraPose {
  switch (beat.kind) {
    case 'rail-travel': {
      const first = getNode(route, beat.nodes[0] ?? '');
      setPose(out, first.position, first.lookAt, 0);
      return out;
    }
    case 'camera-reveal': {
      const node = getNode(route, beat.atNode);
      setPose(out, node.position, node.lookAt, 0);
      return out;
    }
    case 'loading-transition': {
      if (previous) {
        copyPose(previous, out);
      } else {
        // Nothing to fade out from: start black at the destination.
        const node = getNode(route, beat.toNode);
        setPose(out, node.position, node.lookAt, 1);
      }
      return out;
    }
  }
}

export function beatEndPose(route: CameraSpace, beat: CameraBeat, out: CameraPose): CameraPose {
  switch (beat.kind) {
    case 'rail-travel': {
      const last = getNode(route, beat.nodes[beat.nodes.length - 1] ?? '');
      setPose(out, last.position, last.lookAt, 0);
      return out;
    }
    case 'camera-reveal': {
      const node = getNode(route, beat.atNode);
      const sequence = revealLookSequence(route, beat);
      setPose(out, node.position, sequence[sequence.length - 1] ?? node.lookAt, 0);
      return out;
    }
    case 'loading-transition': {
      const node = getNode(route, beat.toNode);
      setPose(out, node.position, node.lookAt, 0);
      return out;
    }
  }
}

/**
 * Writes the camera pose `elapsedSec` into a beat.
 * `start` is the pose captured when the beat began (needed to fade out from the previous shot).
 */
export function evaluateBeat(
  route: CameraSpace,
  beat: CameraBeat,
  elapsedSec: number,
  settings: RailSettings,
  start: CameraPose,
  out: CameraPose,
  curves?: TravelCurves,
): void {
  switch (beat.kind) {
    case 'rail-travel':
      evaluateTravel(route, beat, elapsedSec, settings, out, curves ?? buildTravelCurves(route, beat));
      return;
    case 'camera-reveal':
      evaluateReveal(route, beat, elapsedSec, settings, out);
      return;
    case 'loading-transition':
      evaluateLoading(route, beat, elapsedSec, start, out);
      return;
  }
}

function evaluateTravel(
  route: CameraSpace,
  beat: RailTravelBeat,
  elapsedSec: number,
  settings: RailSettings,
  out: CameraPose,
  curves: TravelCurves,
): void {
  if (usesFadeCut(beat, settings)) {
    const cutAt = FADE_CUT.outSec + FADE_CUT.holdSec;
    if (elapsedSec < cutAt) {
      beatStartPose(route, beat, out);
      out.fade = Math.min(1, elapsedSec / FADE_CUT.outSec);
    } else {
      beatEndPose(route, beat, out);
      out.fade = 1 - Math.min(1, (elapsedSec - cutAt) / FADE_CUT.inSec);
    }
    return;
  }
  const u = ease(beat.easing, elapsedSec / beatDurationSec(route, beat, settings));
  curves.position.getPointAt(u, out.position);
  curves.lookAt.getPointAt(u, out.lookAt);
  out.fade = 0;
}

const scratchFrom = new Vector3();
const scratchTo = new Vector3();

function evaluateReveal(
  route: CameraSpace,
  beat: CameraRevealBeat,
  elapsedSec: number,
  settings: RailSettings,
  out: CameraPose,
): void {
  const node = getNode(route, beat.atNode);
  const sequence = revealLookSequence(route, beat);
  out.position.set(...node.position);
  out.fade = 0;

  const panSec = revealPanSec(beat, settings);
  const stepSec = panSec + revealHoldSec(beat, settings);
  const segments = sequence.length - 1;
  const segment = stepSec > 0 ? Math.floor(elapsedSec / stepSec) : segments;

  if (segment >= segments) {
    out.lookAt.set(...(sequence[segments] ?? node.lookAt));
    return;
  }
  const from = scratchFrom.set(...(sequence[segment] ?? node.lookAt));
  const to = scratchTo.set(...(sequence[segment + 1] ?? node.lookAt));
  const u = panSec > 0 ? ease('easeInOutSine', (elapsedSec - segment * stepSec) / panSec) : 1;
  out.lookAt.copy(from).lerp(to, u);
}

function evaluateLoading(
  route: CameraSpace,
  beat: LoadingTransitionBeat,
  elapsedSec: number,
  start: CameraPose,
  out: CameraPose,
): void {
  const fadeOutSec = fadeSec(beat.fadeOutSec);
  const fadeInSec = fadeSec(beat.fadeInSec);
  const cutAt = fadeOutSec + fadeSec(beat.holdSec);
  if (elapsedSec < cutAt) {
    copyPose(start, out);
    const fadeOut = fadeOutSec > 0 ? elapsedSec / fadeOutSec : 1;
    out.fade = Math.min(1, Math.max(start.fade, fadeOut));
    return;
  }
  beatEndPose(route, beat, out);
  out.fade = fadeInSec > 0 ? 1 - Math.min(1, (elapsedSec - cutAt) / fadeInSec) : 0;
}
