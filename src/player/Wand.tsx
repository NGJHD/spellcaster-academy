import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import { CatmullRomCurve3, Vector3, type Group, type MeshStandardMaterial, type Object3D } from 'three';
import { MAT } from '../scene/materials';
import { useParts } from '../scene/partsGlb';

/** World-space wand tip, updated every frame; spell projectiles start here. */
export const wandTip = new Vector3();
/** Set by the spell system when a cast starts; drives the casting gesture. */
export const castSignal = { time: 99 };

const OFFSET = new Vector3(0.3, -0.3, -0.62);
const TIP_LOCAL = new Vector3(0, 0, -0.34);
const tmp = new Vector3();

interface Rig {
  tip: Object3D | null;
  glow: MeshStandardMaterial[];
}

/**
 * First-person forearm and wand (§14A.1): navy sleeve with star-thread motif, leather cuff, gripping
 * hand, walnut wand with a twisted silver inlay and moonstone tip (Blender GLB, code stand-in while
 * loading). Casting has anticipation, a forward thrust and recovery. Never intersects the camera.
 */
export function Wand() {
  const root = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const rig = useRef<Rig>({ tip: null, glow: [] });
  const time = useRef(0);

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
    for (const m of rig.current.glow) m.emissiveIntensity = 3 + Math.max(0, 0.4 - c) * 16;

    if (rig.current.tip) rig.current.tip.getWorldPosition(wandTip);
    else g.getWorldPosition(wandTip);
  });

  return (
    <group ref={root}>
      <group ref={arm}>
        <Suspense fallback={<FallbackArm rig={rig} />}>
          <ArmGLB rig={rig} />
        </Suspense>
      </group>
    </group>
  );
}

function ArmGLB({ rig }: { rig: RefObject<Rig> }) {
  const parts = useParts('fp_arm', false);
  useEffect(() => {
    rig.current.tip = parts.get('Tip') ?? null;
    rig.current.glow = parts.materials('Crystal');
  }, [parts, rig]);
  return <primitive object={parts.root} />;
}

/** Code-built stand-in shown while the arm GLB loads. */
function FallbackArm({ rig }: { rig: RefObject<Rig> }) {
  const tip = useRef<Group>(null);
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
  useEffect(() => {
    rig.current.tip = tip.current;
    rig.current.glow = [tipMat];
  }, [rig, tipMat]);
  return (
    <>
      <mesh position={[0.05, -0.12, 0.17]} rotation={[0.62, 0, 0.18]} material={MAT.navyCloth}>
        <cylinderGeometry args={[0.042, 0.06, 0.34, 20]} />
      </mesh>
      <mesh position={[0, -0.005, -0.012]} rotation={[0.3, 0, 0.1]} scale={[0.75, 0.6, 1.0]} material={MAT.skin}>
        <sphereGeometry args={[0.034, 20, 16]} />
      </mesh>
      <group position={[0, 0.01, -0.04]} rotation={[0.08, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.15]} material={MAT.darkOak}>
          <cylinderGeometry args={[0.006, 0.011, 0.32, 14]} />
        </mesh>
        <mesh material={MAT.steel}>
          <tubeGeometry args={[inlay, 48, 0.0018, 6, false]} />
        </mesh>
        <group ref={tip} position={TIP_LOCAL.toArray()}>
          <mesh material={tipMat}>
            <octahedronGeometry args={[0.012]} />
          </mesh>
        </group>
      </group>
    </>
  );
}
