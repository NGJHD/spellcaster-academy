/**
 * The burning seam: after the ward is mended, a jagged split stays in the
 * sky where it was torn from outside. It glows in the observatory reveal and lingers faintly over the
 * celebration, foreshadowing the Rift of Level 2.
 */
import { SkyTear } from './glow';
import { beatIndexOf } from '../level/level1Route';
import { useBeatIndex } from './props';

const REVEAL = beatIndexOf('observatory-seam');

/**
 * A rendered split in the sky (see glow.tsx SkyTear) from the first to the last point; `radius` sets
 * how wide it gapes (the old tube radius, kept so callers read the same). It shows from `fromBeat`
 * until `untilBeat` (exclusive), gaping twice as wide before `wideUntilBeat` (the open crack the
 * Warden holds shut, before it is mended to a seam).
 */
export function Seam({
  points,
  radius = 0.25,
  fromBeat = REVEAL,
  untilBeat = -1,
  wideUntilBeat = -1,
  strength = 1,
}: {
  points: readonly [number, number, number][];
  radius?: number;
  fromBeat?: number;
  untilBeat?: number;
  wideUntilBeat?: number;
  strength?: number;
}) {
  const beat = useBeatIndex();
  const first = points[0] ?? [0, 0, 0];
  const last = points[points.length - 1] ?? first;
  const on = fromBeat >= 0 && beat >= fromBeat && (untilBeat < 0 || beat < untilBeat);
  const wide = beat < wideUntilBeat;
  return <SkyTear from={first} to={last} width={radius * 14} painting={2} open={() => (wide ? 1 : 0.55)} opacity={() => (on ? strength : 0)} />;
}
