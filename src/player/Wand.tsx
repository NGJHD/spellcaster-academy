import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, Vector3, type Group } from 'three';
import { MAT } from '../scene/materials';

/** World-space wand tip, updated every frame; spell projectiles start here. */
export const wandTip = new Vector3();
/** Set by the spell system when a cast starts; drives the casting gesture. */
export const castSignal = { time: 99 };

const OFFSET = new Vector3(0.3, -0.3, -0.62);
const TIP_LOCAL = new Vector3(0, 0, -0.34);
const tmp = new Vector3();

/**
 * PLACEHOLDER first-person forearm and wand (§14A.1): navy sleeve, leather cuff, walnut wand with a
 * silver twist and moonstone tip. Never intersects the camera; no head bob.
 */
export function Wand() {
  const root = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const tip = useRef<Group>(null);
  const time = useRef(0);
  const inlay = useMemo(() => {
    const pts: Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const a = u * Math.PI * 6;
      const r = 0.0105 - u * 0.004;
      pts.push(new Vector3(Math.cos(a) * r, Math.sin(a) * r, -u * 0.3));
    }
    return new CatmullRomCurve3(pts);
  }, []);
  const tipMat = useMemo(() => MAT.crystal.clone(), []);

  useFrame((state, delta) => {
    const g = root.current;
    const a = arm.current;
    if (!g || !a) return;
    time.current += delta;
    castSignal.time += delta;
    const cam = state.camera;
    g.quaternion.copy(cam.quaternion);
    tmp.copy(OFFSET).applyQuaternion(cam.quaternion);
    g.position.copy(cam.position).add(tmp);

    // Cast: anticipation (pull back), forward thrust, recovery.
    const c = castSignal.time;
    let thrust = 0;
    let lift = 0;
    if (c < 0.08) {
      thrust = -0.04 * (c / 0.08);
      lift = 0.02 * (c / 0.08);
    } else if (c < 0.18) {
      const u = (c - 0.08) / 0.1;
      thrust = -0.04 + 0.16 * u;
      lift = 0.02 - 0.05 * u;
    } else if (c < 0.55) {
      const u = (c - 0.18) / 0.37;
      const e = 1 - (1 - u) ** 3;
      thrust = 0.12 * (1 - e);
      lift = -0.03 * (1 - e);
    }
    const sway = Math.sin(time.current * 1.1) * 0.004;
    a.position.set(sway, lift + Math.sin(time.current * 0.8) * 0.003, -thrust);
    a.rotation.x = -lift * 3;
    tipMat.emissiveIntensity = 1.4 + Math.max(0, 0.4 - c) * 8;

    if (tip.current) tip.current.getWorldPosition(wandTip);
    else g.getWorldPosition(wandTip);
  });

  return (
    <group ref={root}>
      <group ref={arm}>
        {/* Sleeve, leather cuff and a gloved hand gripping the wand; the arm enters from below frame. */}
        <mesh position={[0.05, -0.12, 0.17]} rotation={[0.62, 0, 0.18]} material={MAT.navyCloth}>
          <cylinderGeometry args={[0.042, 0.06, 0.34, 20]} />
        </mesh>
        <mesh position={[0.018, -0.045, 0.035]} rotation={[0.62, 0, 0.18]} material={MAT.lightOak}>
          <cylinderGeometry args={[0.04, 0.043, 0.05, 20]} />
        </mesh>
        <mesh position={[0, -0.005, -0.012]} rotation={[0.3, 0, 0.1]} scale={[0.75, 0.6, 1.0]} material={MAT.skin}>
          <sphereGeometry args={[0.034, 20, 16]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.016 + i * 0.011, -0.012, -0.032]} rotation={[1.2, 0, 0]} material={MAT.skin}>
            <capsuleGeometry args={[0.0062, 0.016, 4, 8]} />
          </mesh>
        ))}
        <mesh position={[-0.024, 0.008, -0.03]} rotation={[0.2, 0.4, 0.9]} material={MAT.skin}>
          <capsuleGeometry args={[0.0068, 0.02, 4, 8]} />
        </mesh>
        <group position={[0, 0.01, -0.04]} rotation={[0.08, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]} material={MAT.darkOak}>
            <cylinderGeometry args={[0.006, 0.011, 0.32, 14]} />
          </mesh>
          <mesh position={[0, 0, 0.0]} material={MAT.steel}>
            <tubeGeometry args={[inlay, 48, 0.0018, 6, false]} />
          </mesh>
          <group ref={tip} position={TIP_LOCAL.toArray()}>
            <mesh material={tipMat}>
              <octahedronGeometry args={[0.012]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
