import type { LevelRoute } from '../levelTypes';
import { beatEndPose, beatStartPose, createPose } from './railMath';
import { isCameraBeat, type CameraBeat } from './railTypes';

/** Camera must not jump more than this between consecutive camera beats (gated beats hold the camera). */
const CONTINUITY_TOLERANCE = 0.01;

/**
 * Checks an authored route for missing names, bad timings and camera jumps.
 * Returns human-readable problems; an empty list means the route is valid.
 */
export function validateRoute(route: LevelRoute): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const hasNode = (id: string) => id in route.nodes;

  for (const beat of route.beats) {
    if (seen.has(beat.id)) problems.push(`Duplicate beat id "${beat.id}"`);
    seen.add(beat.id);

    switch (beat.kind) {
      case 'rail-travel':
        if (beat.nodes.length < 2) problems.push(`Beat "${beat.id}" needs at least two nodes`);
        for (const id of beat.nodes) if (!hasNode(id)) problems.push(`Beat "${beat.id}" uses unknown node "${id}"`);
        if (!(beat.durationSec > 0)) problems.push(`Beat "${beat.id}" needs a positive duration`);
        break;
      case 'camera-reveal':
        if (!hasNode(beat.atNode)) problems.push(`Beat "${beat.id}" uses unknown node "${beat.atNode}"`);
        for (const id of beat.lookTargets) {
          if (!(id in route.lookPoints)) problems.push(`Beat "${beat.id}" uses unknown look point "${id}"`);
        }
        if (beat.panSec < 0 || beat.holdSec < 0) problems.push(`Beat "${beat.id}" has negative timing`);
        if (beat.lookTargets.length === 0 && !(beat.holdSec > 0)) {
          problems.push(`Beat "${beat.id}" is a hold with no hold time`);
        }
        break;
      case 'loading-transition':
        if (!hasNode(beat.toNode)) problems.push(`Beat "${beat.id}" uses unknown node "${beat.toNode}"`);
        if (beat.fadeOutSec < 0 || beat.holdSec < 0 || beat.fadeInSec < 0) {
          problems.push(`Beat "${beat.id}" has negative timing`);
        }
        break;
      default:
        break;
    }
  }
  if (problems.length > 0) return problems;

  const end = createPose();
  const start = createPose();
  let prev: CameraBeat | null = null;
  for (const beat of route.beats) {
    if (!isCameraBeat(beat)) continue;
    if (prev && beat.kind !== 'loading-transition') {
      beatEndPose(route, prev, end);
      beatStartPose(route, beat, start);
      const moved = end.position.distanceTo(start.position);
      const turned = end.lookAt.distanceTo(start.lookAt);
      if (moved > CONTINUITY_TOLERANCE || turned > CONTINUITY_TOLERANCE) {
        problems.push(
          `Camera jumps between "${prev.id}" and "${beat.id}" (position ${moved.toFixed(2)} m, look ${turned.toFixed(2)} m)`,
        );
      }
    }
    prev = beat;
  }
  return problems;
}
