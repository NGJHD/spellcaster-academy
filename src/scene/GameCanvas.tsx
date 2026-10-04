import { HIDE_WAND } from '../state/gameStore';
import { Canvas } from '@react-three/fiber';
import { Suspense, type RefObject } from 'react';
import { ACESFilmicToneMapping, PCFShadowMap, SRGBColorSpace } from 'three';
import { EnemyManager } from '../enemies/EnemyManager';
import { PipCompanion } from '../player/PipCompanion';
import { RunDriver } from '../player/RunDriver';
import { Wand } from '../player/Wand';
import { BeamStruggle } from '../spells/BeamStruggle';
import { FxLayer } from '../spells/FxLayer';
import { SpellEffects } from '../spells/SpellEffects';
import { useSettingsStore } from '../state/settingsStore';
import { RailGizmos } from './RailGizmos';
import { applySurfaceTextures } from './surfaces';
import { World } from './World';

applySurfaceTextures();

/** `?rails` in the URL shows the authored camera rails and node names. */
const SHOW_RAILS = new URLSearchParams(window.location.search).has('rails');

const DPR = { low: [1, 1], medium: [1, 1.5], high: [1, 2] } as const;

export function GameCanvas({ fadeRef }: { fadeRef: RefObject<HTMLDivElement | null> }) {
  const quality = useSettingsStore((s) => s.quality);
  return (
    <Canvas
      className="game-canvas"
      shadows={quality === 'low' ? false : { type: PCFShadowMap }}
      dpr={[...DPR[quality]]}
      camera={{ fov: 62, near: 0.05, far: 900, position: [0, 24, 95] }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace }}
    >
      <RunDriver fadeRef={fadeRef} />
      <Suspense fallback={null}>
        <World />
      </Suspense>
      <EnemyManager />
      <SpellEffects />
      <FxLayer />
      <BeamStruggle />
      {!HIDE_WAND && <Wand />}
      <PipCompanion />
      {SHOW_RAILS && <RailGizmos />}
    </Canvas>
  );
}
