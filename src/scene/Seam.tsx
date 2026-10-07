/**
 * The burning seam (LEVEL1_DESIGN LD-21): after the ward is mended, a jagged split stays in the
 * sky where it was torn from outside. It glows in the observatory reveal and lingers faintly over the
 * celebration, foreshadowing the Rift of Level 2.
 */
import { SkyTear } from './glow';
import { beatIndexOf } from '../level/level1Route';
import { useBeatIndex } from './props';

const REVEAL = beatIndexOf('observatory-seam');

/**
 * A rendered split in the sky (see glow.tsx SkyTear) from the first to the last point; `radius` sets
 * how wide it gapes (the old tube radius, kept so callers read the same).
 */
export function Seam({ points, radius = 0.25, fromBeat = REVEAL, strength = 1 }: { points: readonly [number, number, number][]; radius?: number; fromBeat?: number; strength?: number }) {
  const beat = useBeatIndex();
  const first = points[0] ?? [0, 0, 0];
  const last = points[points.length - 1] ?? first;
  const on = fromBeat >= 0 && beat >= fromBeat;
  return <SkyTear from={first} to={last} width={radius * 14} seed={Math.round(first[0] * 7 + last[1])} open={() => 0.55} opacity={() => (on ? strength : 0)} />;
}
