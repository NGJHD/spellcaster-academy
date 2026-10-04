/**
 * Combo rules (CLAUDE.md §1B "Every word should feel powerful"):
 * - every completed word adds one to the combo;
 * - a mistake halves the combo (it never wipes it out, so a slip never feels like a disaster);
 * - the score multiplier grows with the combo;
 * - reaching certain combos announces a cheer.
 */
export const COMBO_TIERS: readonly { readonly at: number; readonly multiplier: number }[] = [
  { at: 0, multiplier: 1 },
  { at: 3, multiplier: 2 },
  { at: 6, multiplier: 3 },
  { at: 10, multiplier: 4 },
];

/** Cheers shown when the combo reaches these counts. */
export const COMBO_CHEERS: Readonly<Record<number, string>> = {
  3: 'COMBO!',
  5: 'SUPER!',
  8: 'AMAZING!',
  12: 'UNSTOPPABLE!',
  20: 'LEGENDARY!',
};

export class Combo {
  count = 0;

  /** Multiplier for the current combo. */
  get multiplier(): number {
    let m = 1;
    for (const tier of COMBO_TIERS) if (this.count >= tier.at) m = tier.multiplier;
    return m;
  }

  /** A word was completed. Returns the cheer for a newly reached milestone, if any. */
  word(): string | null {
    this.count++;
    return COMBO_CHEERS[this.count] ?? null;
  }

  /** A wrong key halves the combo (rounding down). */
  mistake(): void {
    this.count = Math.floor(this.count / 2);
  }

  /** Start over (new run or HP reset). */
  reset(): void {
    this.count = 0;
  }
}
