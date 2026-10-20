/** Level 2 Dormitory Tower (L2-8): burning doors on each landing of the reused spiral stairwell. */
import { DORM_DOORS } from '../../level/areas2/dormitory';
import { spiral, stairFloor, STAIRWELL_ORIGIN } from '../../level/areas/stairwell';
import type { Vec3 } from '../../level/rail/railTypes';
import { Fire, Restorable } from '../Fire';
import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { getRun } from '../../state/gameStore';
import { CharacterModel } from '../CharacterModel';
import { RAISE_CYCLE_SEC, RAISE_SEC } from '../props';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { Box } from '../kit';
import { Prop } from '../Prop';
import { MAT } from '../materials';

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
              {/* A carved oak door (CC0 model; its base sits 1.13 m below its origin at full size) */}
              <ModelBoundary fallback={<Box position={[door[0], floor + 1.3, door[2]]} size={[1.4, 2.6, 0.16]} rotation={[0, -a - Math.PI / 2, 0]} material={MAT.darkOak} />}>
                <Suspense fallback={null}>
                  <Prop id="large_castle_door" position={[door[0], floor + 0.02, door[2]]} height={2.6} rotationY={-a - Math.PI / 2} />
                </Suspense>
              </ModelBoundary>
            </Restorable>
            <TrappedStudent deg={d.deg + 4} flag={`l2-dorm-door-${d.id}`} />
            <TrapFires deg={d.deg + 4} flag={`l2-dorm-door-${d.id}`} />
          </group>
        );
      })}
      {[10, -100, -180, -260].map((deg) => (
        <Fire key={deg} position={local(spiral(deg, stairFloor(deg) + 0.2, 8.7))} size={1.4} count={3} spread={1} />
      ))}
    </group>
  );
}

/**
 * A ring of inkfire round each trapped first-year (owner, 2026-10-17: more fire, so they look trapped):
 * tall flames either side and behind, low ones in front so the student stays in view. They go out with
 * the door's restore word.
 */
const TRAP_RING: readonly { dDeg: number; r: number; size: number }[] = [
  { dDeg: -7, r: 8.7, size: 1.7 },
  { dDeg: 8, r: 8.7, size: 1.7 },
  { dDeg: -4, r: 9.15, size: 1.5 },
  { dDeg: 4, r: 9.2, size: 1.4 },
  { dDeg: -5, r: 7.95, size: 0.8 },
  { dDeg: 0, r: 7.75, size: 0.65 },
  { dDeg: 5, r: 7.95, size: 0.8 },
];

function TrapFires({ deg, flag }: { deg: number; flag: string }) {
  return (
    <>
      {TRAP_RING.map(({ dDeg, r, size }) => {
        const at = deg + dDeg;
        return <Fire key={`${dDeg}:${r}`} position={local(spiral(at, stairFloor(at) + 0.05, r))} size={size} count={size > 1 ? 3 : 2} spread={0.6} smoke={size > 1} untilFlag={flag} />;
      })}
    </>
  );
}

const STUDENT_HEIGHT = 1.25;
const cycle = (t: number) => ((t % RAISE_CYCLE_SEC) + RAISE_CYCLE_SEC) % RAISE_CYCLE_SEC;
/** Seconds a freed student waits, then walks down the stairs, before slipping out of sight. */
const FREED_PAUSE_SEC = 0.8;
const WALK_SEC = 4;
const WALK_DEG = 40;

/**
 * A first-year trapped at a burning door (owner, 2026-10-16: they stood calmly in the fire "like they
 * are enjoying being burnt"). Until the door is restored they wave both arms over their head and jump
 * twice every few seconds; once freed they calm down, walk off down the stairs and are gone.
 */
function TrappedStudent({ deg, flag }: { deg: number; flag: string }) {
  const group = useRef<Group>(null);
  const freedFor = useRef(0);
  const isFree = () => getRun()?.flags.has(flag) ?? false;
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const free = isFree();
    freedFor.current = free ? freedFor.current + Math.min(delta, 0.1) : 0;
    const s = freedFor.current;
    const walk = Math.min(1, Math.max(0, (s - FREED_PAUSE_SEC) / WALK_SEC));
    const at = deg - walk * WALK_DEG;
    const a = (at * Math.PI) / 180;
    let lift = 0;
    if (!free) {
      // Hands up and two quick hops, then a rest (the same rhythm as the students in the Great Hall).
      const c = cycle(performance.now() / 1000 + deg * 0.05);
      lift = c < 0.9 ? Math.abs(Math.sin((c / 0.45) * Math.PI)) * 0.28 : 0;
    } else if (walk > 0 && walk < 1) {
      lift = Math.abs(Math.sin(s * 9)) * 0.04;
    }
    const p = local(spiral(at, stairFloor(at) + lift, free ? 8.6 - walk * 0.5 : 8.6));
    g.position.set(p[0], p[1], p[2]);
    // Facing in towards the stairs while trapped; facing down the stairs while walking away.
    g.rotation.y = walk > 0 ? Math.atan2(Math.sin(a), -Math.cos(a)) : -a - Math.PI / 2;
    g.visible = s < FREED_PAUSE_SEC + WALK_SEC + 0.2;
  });
  return (
    <group ref={group} scale={STUDENT_HEIGHT / 1.4}>
      <Suspense fallback={null}>
        <CharacterModel id="student_a_lod1" clip={() => (isFree() || cycle(performance.now() / 1000 + deg * 0.05) >= RAISE_SEC ? 'Idle' : 'Celebrate')} />
      </Suspense>
    </group>
  );
}
