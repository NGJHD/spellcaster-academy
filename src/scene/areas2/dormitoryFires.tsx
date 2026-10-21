/** Level 2 Dormitory Tower: burning doors on each landing of the reused spiral stairwell. */
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
            <Restorable flag={`l2-dorm-door-${d.id}`} fire={{ position: [door[0] * 0.995, floor, door[2] * 0.995], size: 2.2, count: 4, spread: 0.6, light: true }}>
              {/* A carved oak door (CC0 model; its base sits 1.13 m below its origin at full size) */}
              <ModelBoundary fallback={<Box position={[door[0], floor + 1.3, door[2]]} size={[1.4, 2.6, 0.16]} rotation={[0, -a - Math.PI / 2, 0]} material={MAT.darkOak} />}>
                <Suspense fallback={null}>
                  <Prop id="large_castle_door" position={[door[0], floor + 0.02, door[2]]} height={2.6} rotationY={-a - Math.PI / 2} />
                </Suspense>
              </ModelBoundary>
            </Restorable>
            {/* The door model stands about 4° round from its anchor: the student backs against it. */}
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

/** Where a trapped first-year stands: backed against their burning door. */
const TRAPPED_RADIUS = 8.75;
/** The fire's half-ring round them, and how many flames make it. */
const TRAP_RING_RADIUS = 1.35;
const TRAP_FLAMES = 7;

/**
 * A half-ring of tall inkfire round each trapped first-year, from the wall on one side, round in front
 * of them, to the wall on the other, so they are cornered against their door (owner, 2026-10-19: the
 * flames sat under the student and made no sense). It goes out with the door's word.
 */
function TrapFires({ deg, flag }: { deg: number; flag: string }) {
  const a = (deg * Math.PI) / 180;
  const centre = { x: TRAPPED_RADIUS * Math.cos(a), z: TRAPPED_RADIUS * Math.sin(a) };
  const out = { x: Math.cos(a), z: Math.sin(a) };
  const along = { x: -Math.sin(a), z: Math.cos(a) };
  return (
    <>
      {Array.from({ length: TRAP_FLAMES }, (_, i) => {
        const th = (i / (TRAP_FLAMES - 1)) * Math.PI;
        const x = centre.x + TRAP_RING_RADIUS * (Math.cos(th) * along.x - Math.sin(th) * out.x);
        const z = centre.z + TRAP_RING_RADIUS * (Math.cos(th) * along.z - Math.sin(th) * out.z);
        const at = (Math.atan2(z, x) * 180) / Math.PI;
        // Unwrap to the door's turn of the spiral before reading the stair height.
        const d = at + Math.round((deg - at) / 360) * 360;
        return <Fire key={i} position={[x, stairFloor(d) + 0.05, z]} size={1.7 + (i % 2) * 0.25} count={3} spread={0.5} smoke={i % 3 === 0} untilFlag={flag} />;
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
    const p = local(spiral(at, stairFloor(at) + lift, free ? TRAPPED_RADIUS - walk * 0.6 : TRAPPED_RADIUS));
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
