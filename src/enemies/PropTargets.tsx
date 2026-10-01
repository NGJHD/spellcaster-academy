/**
 * Blender-built target models (training dummy, runaway book, thorn pod) posed from gameplay state.
 * Each falls back to its code-built stand-in while the GLB streams in.
 */
import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, type RefObject } from 'react';
import { Quaternion, Vector3 } from 'three';
import { useParts } from '../scene/partsGlb';
import { BookModel, DummyModel, ThornPodModel, type TargetPose } from './TargetVisuals';

type PoseRef = RefObject<TargetPose>;

const COVER_TINT: Record<string, string> = { default: '#7a2a30', green: '#2c5e45', blue: '#2c4a7e' };

function DummyGLB({ pose }: { pose: PoseRef }) {
  const parts = useParts('training_dummy');
  const torso = parts.get('Torso');
  const armL = parts.get('Arm_L');
  const armR = parts.get('Arm_R');
  const glow = parts.materials('Energy');
  useFrame(() => {
    const p = pose.current;
    const wobble = Math.sin(p.time * 9) * p.hit * 0.22;
    // Force travels through torso and base with diminishing overlap (§14A.4).
    if (torso) {
      torso.rotation.x = p.hit * 0.4 + wobble + p.windup * 0.15 - (p.defeated ? Math.min(1, p.dispel * 2) * 0.1 : 0);
      torso.rotation.z = Math.sin(p.time * 1.3) * 0.02;
    }
    if (armL) armL.rotation.x = p.windup * 1.2;
    if (armR) armR.rotation.x = p.windup * 0.7;
    for (const m of glow) m.emissiveIntensity = (2 + p.windup * 6 + p.hit * 4) * (p.defeated ? Math.max(0.1, 1 - p.dispel) : 1);
  });
  return <primitive object={parts.root} />;
}

function BookGLB({ pose, variant }: { pose: PoseRef; variant?: string }) {
  const parts = useParts('runaway_book');
  const coverL = parts.get('Cover_L');
  const coverR = parts.get('Cover_R');
  const runes = parts.materials('Energy');
  useEffect(() => {
    for (const m of parts.materials('Leather')) m.color.set(COVER_TINT[variant ?? 'default'] ?? '#7a2a30');
  }, [parts, variant]);
  useFrame(() => {
    const p = pose.current;
    // Covers open like wings; the page drag comes from the tilt and banking below.
    const flap = p.defeated ? 0 : 0.5 + Math.sin(p.time * 7) * 0.35 + p.windup * 0.6;
    if (coverL) coverL.rotation.z = flap;
    if (coverR) coverR.rotation.z = -flap;
    parts.root.rotation.x = -0.4 - p.hit * 0.6;
    parts.root.rotation.z = Math.sin(p.time * 1.7) * 0.15;
    for (const m of runes) m.emissiveIntensity = 1.5 + p.windup * 4;
  });
  return <primitive object={parts.root} />;
}


function ThornPodGLB({ pose }: { pose: PoseRef }) {
  const parts = useParts('thorn_pod');
  const head = parts.get('Head');
  const core = parts.materials('Amber');
  const petals = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        // Tangent to the flower in three.js space: petals close by rotating about it.
        return { node: parts.get(`Petal_${i}`), axis: new Vector3(-Math.sin(a), 0, -Math.cos(a)), rest: parts.get(`Petal_${i}`)?.quaternion.clone() ?? new Quaternion() };
      }),
    [parts],
  );
  const q = useMemo(() => new Quaternion(), []);
  useFrame(() => {
    const p = pose.current;
    if (head) head.rotation.x = 0.15 - p.windup * 0.4 + p.hit * 0.3 - (p.defeated ? p.dispel * 0.6 : 0);
    if (head) head.rotation.z = Math.sin(p.time * 0.9) * 0.06;
    // Petals tighten as the seed charges; they relax (wilt) when dispelled.
    const close = p.defeated ? -0.3 : p.windup * 0.8;
    for (const petal of petals) {
      if (!petal.node) continue;
      q.setFromAxisAngle(petal.axis, -close);
      petal.node.quaternion.copy(petal.rest).premultiply(q);
    }
    for (const m of core) m.emissiveIntensity = (2 + p.windup * 7 + p.hit * 3) * (p.defeated ? 0.3 : 1);
  });
  return <primitive object={parts.root} />;
}

export function Dummy({ pose, practice }: { pose: PoseRef; practice: boolean }) {
  return (
    <Suspense fallback={<DummyModel pose={pose} practice={practice} />}>
      <DummyGLB pose={pose} />
    </Suspense>
  );
}

export function Book({ pose, variant }: { pose: PoseRef; variant?: string }) {
  return (
    <Suspense fallback={<BookModel pose={pose} variant={variant} />}>
      <BookGLB pose={pose} variant={variant} />
    </Suspense>
  );
}

export function ThornPod({ pose }: { pose: PoseRef }) {
  return (
    <Suspense fallback={<ThornPodModel pose={pose} />}>
      <ThornPodGLB pose={pose} />
    </Suspense>
  );
}
