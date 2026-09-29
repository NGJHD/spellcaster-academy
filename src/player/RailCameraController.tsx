import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, type RefObject } from 'react';
import { LEVEL1_ROUTE } from '../level/level1Route';
import { RailDirector } from '../level/rail/RailDirector';
import type { RailSettings } from '../level/rail/railTypes';
import { isGameplayActive, useGameStore } from '../state/gameStore';
import { TRAVEL_SPEED_MULTIPLIER } from '../state/settings';
import { useSettingsStore } from '../state/settingsStore';

/** Dev-only authoring aid: `?beat=<beat-id>` starts the route at that beat. */
const DEV_START_BEAT = import.meta.env.DEV
  ? (new URLSearchParams(window.location.search).get('beat') ?? undefined)
  : undefined;

function readRailSettings(): RailSettings {
  const { reducedMotion, travelSpeed } = useSettingsStore.getState();
  return { reducedMotion, travelSpeed: TRAVEL_SPEED_MULTIPLIER[travelSpeed] };
}

/**
 * Drives the camera from the rail director. The player never steers the camera.
 * Per-frame values go straight to the camera and fade overlay; only beat changes reach the store.
 */
export function RailCameraController({ fadeRef }: { fadeRef: RefObject<HTMLDivElement | null> }) {
  const camera = useThree((s) => s.camera);
  const runId = useGameStore((s) => s.runId);

  const director = useMemo(
    () =>
      new RailDirector(LEVEL1_ROUTE, {
        onBeatStart: (beat) => useGameStore.getState().enterBeat(beat.id, beat.areaId),
        onComplete: () => useGameStore.getState().completeRoute(),
      }),
    [],
  );

  useEffect(() => {
    director.start(readRailSettings(), DEV_START_BEAT);
  }, [director, runId]);

  useFrame((_, delta) => {
    if (isGameplayActive(useGameStore.getState().mode)) director.update(delta, readRailSettings());
    const { position, lookAt, fade } = director.pose;
    camera.position.copy(position);
    camera.lookAt(lookAt);
    const overlay = fadeRef.current;
    if (overlay) overlay.style.opacity = fade.toFixed(3);
  });

  return null;
}
