import { Suspense, useEffect, useState, type ReactNode } from 'react';
import type { AreaId } from '../game/types';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';
import { EXTERIOR_AREAS } from './areaLooks';
import { ExteriorScene } from './areas/ExteriorScene';
import { GalleryScene } from './areas/GalleryScene';
import { GreenhouseScene } from './areas/GreenhouseScene';
import { LibraryScene } from './areas/LibraryScene';
import { ObservatoryScene } from './areas/ObservatoryScene';
import { PortraitsScene } from './areas/PortraitsScene';
import { StairwellScene } from './areas/StairwellScene';
import { TowerScene } from './areas/TowerScene';
import { Atmosphere } from './Atmosphere';

type SceneKey = 'exterior' | 'library' | 'portraits' | 'greenhouse' | 'stairwell' | 'gallery' | 'tower' | 'observatory';

function sceneFor(area: AreaId): SceneKey {
  if (EXTERIOR_AREAS.has(area)) return 'exterior';
  switch (area) {
    case 'whispering-library':
      return 'library';
    case 'hall-of-portraits':
      return 'portraits';
    case 'enchanted-greenhouse':
      return 'greenhouse';
    case 'lower-stairwell':
      return 'stairwell';
    case 'practice-gallery':
      return 'gallery';
    case 'moon-tower':
      return 'tower';
    default:
      return 'observatory';
  }
}

/** How long the previous area stays mounted after a transition (covers the fade). */
const KEEP_PREVIOUS_MS = 2500;

/**
 * Area-based loading (§15): only the current area — plus the previous one briefly, so a fade
 * never reveals an empty world — is mounted at a time.
 */
export function World() {
  const storeArea = useRunStore((s) => s.areaId);
  const area: AreaId = storeArea ?? getRun()?.currentAreaId ?? 'arrival-gate';
  const current = sceneFor(area);
  // Keep the previous scene mounted briefly (state adjusted during render when the area changes).
  const [shown, setShown] = useState<{ current: SceneKey; previous: SceneKey | null }>({ current, previous: null });
  if (shown.current !== current) setShown({ current, previous: shown.current });

  useEffect(() => {
    if (!shown.previous) return;
    const timer = window.setTimeout(() => setShown((s) => ({ ...s, previous: null })), KEEP_PREVIOUS_MS);
    return () => window.clearTimeout(timer);
  }, [shown.previous]);

  const mounted = new Set<SceneKey>([current]);
  if (shown.previous && shown.previous !== current) mounted.add(shown.previous);

  const scenes: Record<SceneKey, ReactNode> = {
    exterior: <ExteriorScene celebration={area === 'celebration-courtyard'} />,
    library: <LibraryScene />,
    portraits: <PortraitsScene />,
    greenhouse: <GreenhouseScene />,
    stairwell: <StairwellScene />,
    gallery: <GalleryScene />,
    tower: <TowerScene />,
    observatory: <ObservatoryScene />,
  };

  return (
    <>
      <Suspense fallback={null}>
        <Atmosphere areaId={area} />
      </Suspense>
      {[...mounted].map((key) => (
        // Each area streams its own assets; one area loading never blanks another.
        <Suspense key={key} fallback={null}>
          <group>{scenes[key]}</group>
        </Suspense>
      ))}
    </>
  );
}
