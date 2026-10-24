/**
 * Level 2 and 3 skies (CLAUDE.md §5 visual tone): a gradient sky dome plus drifting embers or ash
 * around the camera. 'inferno' is the burning siege night (black overhead, a red-orange fire glow along
 * the horizon); 'blank' is the red sky over the scorched Blank that never darkens.
 */
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { getRun } from '../state/gameStore';
import { CinderCitadel } from './CinderCitadel';
import { SHORE_CITADEL_AT } from '../level/areas3/journey1';
import { fxSprite } from './fxSprites';
import { SkyTear } from './glow';
import { AdditiveBlending, BackSide, SRGBColorSpace, BufferAttribute, BufferGeometry, NormalBlending, type Points } from 'three';


const FIRE_SKY_URL = `${import.meta.env.BASE_URL}assets/sky/fire_sky.jpg`;

/**
 * The Blank's sky (owner, 2026-10-07: "the sky is bland"): real cloud shapes recoloured into smoke lit
 * from below by fire (baked by assets-src/scripts/sky/fire_sky.py), on a sphere around the camera.
 */
function FireSky({ url = FIRE_SKY_URL }: { url?: string }) {
  const texture = useTexture(url);
  useMemo(() => {
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
  }, [texture]);
  return (
    <mesh renderOrder={-10} rotation={[0, Math.PI * 0.35, 0]}>
      <sphereGeometry args={[600, 64, 32]} />
      <meshBasicMaterial map={texture} side={BackSide} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}

/** Level 2's burning night: smoke clouds lit red from the fires below (was a plain gradient). */
const NIGHT_SKY_URL = `${import.meta.env.BASE_URL}assets/sky/fire_sky_night.jpg`;

export function RedSky({ kind }: { kind: 'inferno' | 'blank' }) {
  return <FireSky url={kind === 'blank' ? FIRE_SKY_URL : NIGHT_SKY_URL} />;
}


const DRIFT = 420;

/** Deterministic scatter (render must stay pure). */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Embers rising (siege) or grey ash falling (the Blank) in a box around the camera. */
export function Drift({ kind }: { kind: 'embers' | 'ash' }) {
  const points = useRef<Points>(null);
  const { geometry, speeds } = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(DRIFT * 3);
    const sp = new Float32Array(DRIFT);
    for (let i = 0; i < DRIFT; i++) {
      pos[i * 3] = (rand(i, 1) - 0.5) * 60;
      pos[i * 3 + 1] = rand(i, 2) * 30 - 5;
      pos[i * 3 + 2] = (rand(i, 3) - 0.5) * 60;
      sp[i] = 0.5 + rand(i, 4) * 1.2;
    }
    g.setAttribute('position', new BufferAttribute(pos, 3));
    return { geometry: g, speeds: sp };
  }, []);
  const sprite = useMemo(() => fxSprite(kind === 'embers' ? 'ember' : 'ash'), [kind]);
  const time = useRef(0);
  useFrame((state, delta) => {
    const pts = points.current;
    if (!pts) return;
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    pts.position.set(state.camera.position.x, state.camera.position.y - 6, state.camera.position.z);
    const arr = (geometry.getAttribute('position') as BufferAttribute).array as Float32Array;
    const dir = kind === 'embers' ? 1 : -0.6;
    for (let i = 0; i < DRIFT; i++) {
      const s = speeds[i] ?? 1;
      arr[i * 3 + 1] = (arr[i * 3 + 1] ?? 0) + dir * s * dt;
      arr[i * 3] = (arr[i * 3] ?? 0) + Math.sin(time.current * 0.7 + i) * 0.3 * dt;
      const y = arr[i * 3 + 1] ?? 0;
      if (y > 25) arr[i * 3 + 1] = -5;
      if (y < -5) arr[i * 3 + 1] = 25;
    }
    (geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
  });
  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      {/* Painted ember and ash-flake sprites (fx_sprites.py) */}
      <pointsMaterial
        map={sprite}
        size={kind === 'embers' ? 0.26 : 0.3}
        color={kind === 'embers' ? '#ff8a3a' : '#9a9490'}
        transparent
        opacity={kind === 'embers' ? 0.95 : 0.7}
        blending={kind === 'embers' ? AdditiveBlending : NormalBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  );
}

/** The real Citadel relative to the camera on the Rift Shore landing (area-local SHORE_LAND is [0, 1.6, 6]). */
const CITADEL_ON_HORIZON: [number, number, number] = [SHORE_CITADEL_AT[0], SHORE_CITADEL_AT[1] - 1.6, SHORE_CITADEL_AT[2] - 6];

/**
 * The Cinder Citadel on the Blank's horizon (owner, 2026-10-07: "it looks like it was created in power
 * point"): the full fortress (see CinderCitadel), far away and huge, so every view of the Blank shows
 * where the journey ends.
 */
export function CitadelOnHorizon() {
  // Where the real Citadel stands as seen from the Rift Shore landing (SHORE_CITADEL_AT), at its size,
  // so it does not jump between the shore and Cinderwood (owner, 2026-10-23: "the castle moved to the right").
  return (
    <group position={CITADEL_ON_HORIZON}>
      <CinderCitadel distant />
    </group>
  );
}

/**
 * The Rift: a ragged tear of red fire across the sky over Lantern Lake. Before
 * the opening beat it is the thin seam left by Level 1; once the sky splits it blazes wide.
 * Sits in the camera-following sky rig, so it reads as infinitely far away.
 */
export function Rift() {
  const width = useRef(0.15);
  useFrame((_, delta) => {
    const run = getRun();
    const rift = run?.level.beatIndexOf('l2-rift-opens') ?? -1;
    const open = run !== null && run !== undefined && rift >= 0 && run.director.currentIndex >= rift;
    width.current += ((open ? 1 : 0.12) - width.current) * (1 - Math.exp(-1.2 * Math.min(delta, 0.1)));
  });
  // A rendered split across the sky (owner: the zig-zag tube "looks like it was done in ms paint").
  return (
    <>
      <SkyTear from={[-320, 290, -540]} to={[320, 360, -540]} width={130} open={() => width.current} renderOrder={-9} />
      <SkyTear from={[-160, 250, -560]} to={[60, 300, -560]} width={40} painting={2} open={() => width.current * 0.8} opacity={() => 0.6} renderOrder={-9} />
    </>
  );
}
