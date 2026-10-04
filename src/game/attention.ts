/**
 * Attention rule (CLAUDE.md §1B): at the Fast travel speed the player should never wait more than
 * about seven seconds without something to type. This pure tracker measures the longest stretch
 * with no typeable prompt, per area, skipping beats marked as exempt (boss intros, endings).
 */
export const ATTENTION_GAP_LIMIT_SEC = 7;
/** Boss introductions may run a little longer (§1B). */
export const BOSS_INTRO_LIMIT_SEC = 8;

export interface GapRecord {
  readonly areaId: string;
  /** Longest gap in seconds. */
  readonly longest: number;
  /** Beat where the longest gap ended (for fixing it). */
  readonly beatId: string;
}

export class AttentionTracker {
  private gap = 0;
  private gapArea = '';
  private readonly worst = new Map<string, GapRecord>();

  /**
   * Advance by `dt` seconds. `prompt` is true while anything typeable is on screen; `exempt` is true
   * during beats the rule does not cover.
   */
  step(dt: number, areaId: string, beatId: string, prompt: boolean, exempt: boolean): void {
    if (prompt || exempt) {
      this.close(beatId);
      return;
    }
    if (this.gap === 0) this.gapArea = areaId;
    this.gap += dt;
  }

  private close(beatId: string): void {
    if (this.gap <= 0) return;
    const prev = this.worst.get(this.gapArea);
    if (!prev || this.gap > prev.longest) this.worst.set(this.gapArea, { areaId: this.gapArea, longest: this.gap, beatId });
    this.gap = 0;
  }

  /** Finish any open gap and return the worst gap per area. */
  report(beatId = ''): GapRecord[] {
    this.close(beatId);
    return [...this.worst.values()];
  }
}
