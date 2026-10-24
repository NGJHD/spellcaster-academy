/**
 * Loads the creatures of the fights ahead before they spawn (owner, 2026-10-23: mobs first appeared as
 * their block stand-ins until their models arrived). Each upcoming model is fetched, and one hidden copy
 * is kept so its shaders and textures are ready too: the first mob of a kind then appears fully drawn.
 */
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import type { Group } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { LevelBeat, TargetSpawn } from '../level/levelTypes';
import type { LevelDef } from '../level/levels';
import { warmUp } from '../scene/warmUp';
import { creatureUrl } from './CreatureModel';
import { GUARDIAN_URL } from './GuardianGLB';

/** The model file a target is drawn with, if it has one. */
function spawnModelUrl(spawn: TargetSpawn): string | null {
  return spawn.kind === 'guardian' ? GUARDIAN_URL : creatureUrl(spawn.kind, spawn.variant);
}

/** Model files of every target in `beats` (fights and chase targets). */
export function creatureUrlsFor(level: LevelDef, beats: readonly LevelBeat[]): string[] {
  const urls = new Set<string>();
  const add = (spawn: TargetSpawn) => {
    const url = spawnModelUrl(spawn);
    if (url) urls.add(url);
  };
  for (const beat of beats) {
    if (beat.kind === 'encounter') {
      for (const wave of level.encounters.get(beat.encounterId)?.waves ?? []) wave.targets.forEach(add);
    }
    if ('chase' in beat) for (const c of beat.chase ?? []) add(c.target);
  }
  return [...urls].sort();
}

function WarmCreature({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const copy = useMemo(() => cloneSkinned(gltf.scene), [gltf.scene]);
  const group = useRef<Group>(null);
  const { gl, camera, scene } = useThree();
  useEffect(() => {
    if (group.current) void warmUp(gl, group.current, camera, scene);
  }, [gl, camera, scene, copy]);
  return (
    <group ref={group} visible={false}>
      <primitive object={copy} />
    </group>
  );
}

/** Keeps the given creature models loaded and their shaders compiled. */
export function CreatureWarmup({ urls }: { urls: readonly string[] }) {
  return (
    <>
      {urls.map((url) => (
        <Suspense key={url} fallback={null}>
          <WarmCreature url={url} />
        </Suspense>
      ))}
    </>
  );
}
