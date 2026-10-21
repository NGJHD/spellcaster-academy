import type { LevelBeat, LevelRoute } from './levelTypes';
import {
  beatDurationSec,
  beatEndPose,
  beatStartPose,
  buildTravelCurves,
  copyPose,
  createPose,
  evaluateBeat,
  revealReturnSec,
  type TravelCurves,
} from './rail/railMath';
import { isCameraBeat, type CameraPose, type RailSettings } from './rail/railTypes';

/** Large frame gaps (tab switch, breakpoint) must never make the camera jump. */
export const MAX_FRAME_DELTA_SEC = 0.1;

export interface LevelDirectorEvents {
  onBeatStart?(beat: LevelBeat, index: number): void;
  onBeatEnd?(beat: LevelBeat, index: number): void;
  onComplete?(): void;
}

/**
 * Owns level progression (§6A). Camera beats advance with time; gated beats hold the camera
 * until `completeGatedBeat` is called by the system that runs them. Nothing else can advance the story.
 */
export class LevelDirector {
  readonly pose: CameraPose = createPose();
  private readonly beatStart: CameraPose = createPose();
  private readonly curves = new Map<string, TravelCurves>();
  private index = 0;
  private elapsedSec = 0;
  private gatedDone = false;
  private complete = false;

  constructor(
    readonly route: LevelRoute,
    private readonly events: LevelDirectorEvents = {},
  ) {
    for (const beat of route.beats) {
      if (beat.kind === 'rail-travel') this.curves.set(beat.id, buildTravelCurves(route, beat));
    }
  }

  get currentBeat(): LevelBeat | undefined {
    return this.route.beats[this.index];
  }

  get currentIndex(): number {
    return this.index;
  }

  get isComplete(): boolean {
    return this.complete;
  }

  indexOf(beatId: string): number {
    return this.route.beats.findIndex((b) => b.id === beatId);
  }

  /** Full length of the current camera beat at these settings (0 for gated beats). */
  beatDurationSec(settings: RailSettings): number {
    const beat = this.currentBeat;
    return beat && isCameraBeat(beat) ? beatDurationSec(this.route, beat, settings) : 0;
  }

  /** Seconds left in the current camera beat (0 for gated beats). */
  remainingSec(settings: RailSettings): number {
    const beat = this.currentBeat;
    if (!beat || !isCameraBeat(beat)) return 0;
    return Math.max(0, beatDurationSec(this.route, beat, settings) - this.elapsedSec);
  }

  /** Seconds left before a reveal starts panning back to its own view (see revealReturnSec). */
  remainingBeforeReturnSec(settings: RailSettings): number {
    const beat = this.currentBeat;
    if (!beat || !isCameraBeat(beat)) return 0;
    return Math.max(0, this.remainingSec(settings) - revealReturnSec(beat, settings));
  }

  /** Begin playback at a beat (new run, resume, or checkpoint restart). */
  start(settings: RailSettings, fromBeatId?: string): void {
    const found = fromBeatId ? this.indexOf(fromBeatId) : 0;
    if (found < 0) throw new Error(`Unknown beat "${fromBeatId}" in route "${this.route.id}"`);
    this.complete = false;
    this.holdPoseBefore(found, this.pose);
    this.enterBeat(found, settings, fromBeatId !== undefined && found > 0 ? this.pose : undefined);
  }

  /** Called by the system running the current gated beat. Ignored for any other beat. */
  completeGatedBeat(beatId: string): void {
    const beat = this.currentBeat;
    if (beat && beat.id === beatId && !isCameraBeat(beat)) this.gatedDone = true;
  }

  update(deltaSec: number, settings: RailSettings): void {
    if (this.complete) return;
    let remaining = Math.min(Math.max(deltaSec, 0), MAX_FRAME_DELTA_SEC);

    // Carry leftover time into following beats so beat boundaries do not stall a frame.
    for (let guard = 0; guard < 64; guard++) {
      const beat = this.currentBeat;
      if (!beat) return;

      if (!isCameraBeat(beat)) {
        if (!this.gatedDone) return;
      } else {
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
      }

      this.events.onBeatEnd?.(beat, this.index);
      if (this.index + 1 >= this.route.beats.length) {
        this.complete = true;
        this.events.onComplete?.();
        return;
      }
      this.enterBeat(this.index + 1, settings, this.pose);
    }
  }

  /** Camera pose to show before playback starts at a beat (resume establishing shot). */
  previewPose(beatId: string, out: CameraPose): CameraPose {
    const index = this.indexOf(beatId);
    const beat = this.route.beats[index];
    if (beat && isCameraBeat(beat)) {
      if (beat.kind === 'loading-transition') beatEndPose(this.route, beat, out);
      else beatStartPose(this.route, beat, out);
    } else {
      this.holdPoseBefore(Math.max(0, index), out);
    }
    out.fade = 0;
    return out;
  }

  /** Pose the camera holds during a gated beat at `index`: the end of the last camera beat before it. */
  holdPoseBefore(index: number, out: CameraPose): CameraPose {
    for (let i = index - 1; i >= 0; i--) {
      const beat = this.route.beats[i];
      if (beat && isCameraBeat(beat)) return beatEndPose(this.route, beat, out);
    }
    const first = this.route.beats.find(isCameraBeat);
    if (first) beatStartPose(this.route, first, out);
    return out;
  }

  private enterBeat(index: number, settings: RailSettings, previous: CameraPose | undefined): void {
    const beat = this.route.beats[index];
    if (!beat) return;
    this.index = index;
    this.elapsedSec = 0;
    this.gatedDone = false;
    if (previous) copyPose(previous, this.beatStart);
    if (isCameraBeat(beat)) {
      beatStartPose(this.route, beat, this.beatStart, previous ? this.beatStart : undefined);
      this.evaluate(beat, settings);
    } else {
      this.pose.fade = 0;
    }
    this.events.onBeatStart?.(beat, index);
  }

  private evaluate(beat: LevelBeat, settings: RailSettings): void {
    if (!isCameraBeat(beat)) return;
    evaluateBeat(this.route, beat, this.elapsedSec, settings, this.beatStart, this.pose, this.curves.get(beat.id));
  }
}
