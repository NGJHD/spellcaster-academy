/**
 * A closed oak castle door, set on a wall (owner, 2026-10-08: use one of the existing wooden doors; it
 * doesn't need to open). Uses the `large_castle_door` model (also in the Great Hall), which includes its
 * own frame; it stands on its origin (about 2.0 m wide by 2.97 m tall at full size). No surround: the
 * wall itself runs up to the frame (owner, 2026-10-08).
 * Local frame: the door faces +Z, the floor is y = 0.
 */
import { Prop } from './Prop';

export function CastleDoor({ height = 3.4 }: { height?: number }) {
  return (
    <group>
      <Prop id="large_castle_door" position={[0, 0.02, 0.14]} height={height} />
    </group>
  );
}
