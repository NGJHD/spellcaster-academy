import {
  beatDurationSec,
  beatStartPose,
  buildTravelCurves,
  copyPose,
  createPose,
  evaluateBeat,
  type TravelCurves,
} from './railMath';
import type { CameraPose, RailBeat, RailRoute, RailSettings } from './railTypes';

/** Large frame gaps (tab switch, breakpoint) must never make the camera jump. */
export const MAX_FRAME_DELTA_SEC = 0.1;

export interface RailDirectorEvents {
  onBeatStart?(beat: RailBeat, index: number): void;
  onComplete?(): void;
}

/**
 * Plays a route's beats in order and exposes the current camera pose.
 * Framework-free: the R3F controller calls `update` each frame and copies `pose` to the camera.
 */
export class RailDirector {
  readonly pose: CameraPose = createPose();
  private readonly beatStart: CameraPose = createPose();
  private readonly curves = new Map<string, TravelCurves>();
  private index = 0;
  private elapsedSec = 0;
  private complete = false;

  constructor(
    private readonly route: RailRoute,
    private readonly events: RailDirectorEvents = {},
  ) {
    for (const beat of route.beats) {
      if (beat.kind === 'rail-travel') this.curves.set(beat.id, buildTravelCurves(route, beat));
    }
  }

  get currentBeat(): RailBeat | undefined {
    return this.route.beats[this.index];
  }

  get currentIndex(): number {
    return this.index;
  }

  get isComplete(): boolean {
    return this.complete;
  }

  /** Restart playback at a beat (checkpoint restart or replay). Defaults to the first beat. */
  start(settings: RailSettings, fromBeatId?: string): void {
    const found = fromBeatId ? this.route.beats.findIndex((b) => b.id === fromBeatId) : 0;
    if (found < 0) throw new Error(`Unknown beat "${fromBeatId}" in route "${this.route.id}"`);
    this.complete = false;
    this.enterBeat(found, settings, undefined);
  }

  update(deltaSec: number, settings: RailSettings): void {
    if (this.complete) return;
    let remaining = Math.min(Math.max(deltaSec, 0), MAX_FRAME_DELTA_SEC);

    // Carry leftover time into following beats so beat boundaries do not stall a frame.
    for (;;) {
      const beat = this.currentBeat;
      if (!beat) return;
      const duration = beatDurationSec(this.route, beat, settings);
      const available = duration - this.elapsedSec;
      if (remaining < available) {
        this.elapsedSec += remaining;
        this.evaluate(beat, settings);
        return;
      }
      remaining -= Math.max(available, 0);
      this.elapsedSec = duration;
      this.evaluate(beat, settings);
      if (this.index + 1 >= this.route.beats.length) {
        this.complete = true;
        this.events.onComplete?.();
        return;
      }
      this.enterBeat(this.index + 1, settings, this.pose);
    }
  }

  private enterBeat(index: number, settings: RailSettings, previous: CameraPose | undefined): void {
    const beat = this.route.beats[index];
    if (!beat) return;
    this.index = index;
    this.elapsedSec = 0;
    if (previous) copyPose(previous, this.beatStart);
    beatStartPose(this.route, beat, this.beatStart, previous ? this.beatStart : undefined);
    this.evaluate(beat, settings);
    this.events.onBeatStart?.(beat, index);
  }

  private evaluate(beat: RailBeat, settings: RailSettings): void {
    evaluateBeat(this.route, beat, this.elapsedSec, settings, this.beatStart, this.pose, this.curves.get(beat.id));
  }
}
