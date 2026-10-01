import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, type RefObject } from 'react';
import { Mesh, type MeshStandardMaterial } from 'three';
import { GuardianModel, type TargetPose } from './TargetVisuals';

const URL = `${import.meta.env.BASE_URL}assets/creatures/armour_guardian.glb`;

/** Armour guardian GLB (assets-src/scripts/creatures/armour_guardian.py) posed from gameplay state. */
function GuardianGLB({ pose }: { pose: RefObject<TargetPose> }) {
  const gltf = useGLTF(URL);
  const parts = useMemo(() => {
    const root = gltf.scene.clone(true);
    const glow: MeshStandardMaterial[] = [];
    root.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const m = o.material as MeshStandardMaterial;
      if (m.name === 'Visor') {
        const c = m.clone();
        glow.push(c);
        o.material = c;
      }
    });
    return { root, torso: root.getObjectByName('Torso'), armL: root.getObjectByName('Arm_L'), armR: root.getObjectByName('Arm_R'), glow };
  }, [gltf.scene]);

  useFrame(() => {
    const p = pose.current;
    // A slow, formal bow on defeat; arms draw back during the wind-up so the sweep reads clearly.
    const bow = p.defeated ? Math.min(1, p.dispel * 1.2) * 0.55 : 0;
    if (parts.torso) parts.torso.rotation.x = bow - p.windup * 0.15 - p.hit * 0.12 + Math.sin(p.time * 1.2) * 0.01;
    if (parts.armL) parts.armL.rotation.x = -p.windup * 1.1 + bow * 0.5;
    if (parts.armR) {
      parts.armR.rotation.x = -p.windup * 1.5 + bow * 0.5;
      parts.armR.rotation.z = -p.windup * 0.5;
    }
    for (const m of parts.glow) m.emissiveIntensity = (3 + p.windup * 6 + p.hit * 4) * (p.defeated ? 0.5 : 1);
  });

  return <primitive object={parts.root} />;
}

/** Rigged guardian with the code-built stand-in while it streams in. */
export function Guardian({ pose }: { pose: RefObject<TargetPose> }) {
  return (
    <Suspense fallback={<GuardianModel pose={pose} />}>
      <GuardianGLB pose={pose} />
    </Suspense>
  );
}
