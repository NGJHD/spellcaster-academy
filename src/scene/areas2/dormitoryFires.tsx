/** Level 2 Dormitory Tower (L2-8): burning doors on each landing of the reused spiral stairwell. */
import { DORM_DOORS } from '../../level/areas2/dormitory';
import { spiral, stairFloor, STAIRWELL_ORIGIN } from '../../level/areas/stairwell';
import type { Vec3 } from '../../level/rail/railTypes';
import { Fire, Restorable } from '../Fire';
import { Box } from '../kit';
import { MAT } from '../materials';
import { Student } from '../props';

const local = (p: Vec3): Vec3 => [p[0] - STAIRWELL_ORIGIN[0], p[1] - STAIRWELL_ORIGIN[1], p[2] - STAIRWELL_ORIGIN[2]];

export function DormitoryFires() {
  return (
    <group position={STAIRWELL_ORIGIN}>
      {DORM_DOORS.map((d) => {
        const floor = stairFloor(d.deg);
        const door = local(spiral(d.deg, floor, 9.25));
        const a = (d.deg * Math.PI) / 180;
        return (
          <group key={d.id}>
            <Restorable flag={`l2-dorm-door-${d.id}`} fire={{ position: [door[0] * 0.97, floor, door[2] * 0.97], size: 2.2, count: 4, spread: 1.4, light: true }}>
              <Box position={[door[0], floor + 1.3, door[2]]} size={[1.4, 2.6, 0.16]} rotation={[0, -a - Math.PI / 2, 0]} material={MAT.darkOak} />
            </Restorable>
            <Student position={local(spiral(d.deg + 4, floor, 8.6))} rotationY={-a - Math.PI / 2} height={1.25} />
          </group>
        );
      })}
      {[10, -100, -180, -260].map((deg) => (
        <Fire key={deg} position={local(spiral(deg, stairFloor(deg) + 0.2, 8.7))} size={1.4} count={3} spread={1} />
      ))}
    </group>
  );
}
