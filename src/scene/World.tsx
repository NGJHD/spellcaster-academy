import { useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';
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
import { CinderwoodScene, CitadelScene, ForgeScene, Gallery3Scene, InkfallScene, MarginScene, SeaScene, ShoreScene, ThroneScene } from './areas3/Level3Scenes';
import { DormBedroom } from './areas2/bedroom';
import { AftermathScene, BridgeScene, DormitoryFires, HallScene, LakeScene, LawnScene, LibraryFires, RampartScene, RoofScene, WorkshopScene } from './areas2/Level2Scenes';

type SceneKey =
  | 'exterior'
  | 'library'
  | 'portraits'
  | 'greenhouse'
  | 'stairwell'
  | 'gallery'
  | 'tower'
  | 'observatory'
  // Level 2
  | 'l2-lawn'
  | 'l2-dormitory'
  | 'l2-bridge'
  | 'l2-hall'
  | 'l2-workshops'
  | 'l2-lake'
  | 'l2-library'
  | 'l2-ramparts'
  | 'l2-roof'
  | 'l2-aftermath'
  // Level 3
  | 'l3-shore'
  | 'l3-wood'
  | 'l3-falls'
  | 'l3-margin'
  | 'l3-gallery'
  | 'l3-sea'
  | 'l3-forge'
  | 'l3-citadel'
  | 'l3-throne'
  | 'l3-home';

const LEVEL2_SCENES: Partial<Record<AreaId, SceneKey>> = {
  'l2-festival-lawn': 'l2-lawn',
  'l2-dormitory': 'l2-dormitory',
  'l2-bell-bridge': 'l2-bridge',
  'l2-great-hall': 'l2-hall',
  'l2-workshops': 'l2-workshops',
  'l2-lantern-lake': 'l2-lake',
  'l2-burning-library': 'l2-library',
  'l2-ramparts': 'l2-ramparts',
  'l2-tower-roof': 'l2-roof',
  'l2-aftermath': 'l2-aftermath',
  'l3-rift-shore': 'l3-shore',
  'l3-cinderwood': 'l3-wood',
  'l3-inkfall': 'l3-falls',
  'l3-margin-library': 'l3-margin',
  'l3-unfinished-gallery': 'l3-gallery',
  'l3-paper-sea': 'l3-sea',
  'l3-forge': 'l3-forge',
  'l3-citadel': 'l3-citadel',
  'l3-throne': 'l3-throne',
  'l3-homecoming': 'l3-home',
};

function sceneFor(area: AreaId): SceneKey {
  if (EXTERIOR_AREAS.has(area)) return 'exterior';
  const level2 = LEVEL2_SCENES[area];
  if (level2) return level2;
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
/**
 * Holds one area's scene. While it is only being staged (the next area) it is hidden, and its
 * materials are compiled once in the background so showing it later costs no frame-rate dip.
 */
function Staged({ shown, children }: { shown: boolean; children: ReactNode }) {
  const group = useRef<Group>(null);
  const { gl, camera, scene } = useThree();
  const compiled = useRef(false);
  useEffect(() => {
    const g = group.current;
    if (!g || shown || compiled.current) return;
    compiled.current = true;
    const id = window.setTimeout(() => {
      g.visible = true;
      gl.compile(scene, camera);
      g.visible = false;
    }, 500);
    return () => window.clearTimeout(id);
  }, [gl, camera, scene, shown]);
  return (
    <group ref={group} visible={shown}>
      {children}
    </group>
  );
}

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
  // The next area loads in the background while this one plays (Chrome playtest: entering the
  // burning library stalled for 16 s while its assets loaded and its materials compiled).
  const beatId = useRunStore((st) => st.beatId);
  const next = useMemo(() => {
    const run = getRun();
    if (!run || !beatId) return null;
    const beats = run.level.route.beats;
    const i = run.level.beatIndexOf(beatId);
    for (let k = Math.max(0, i); k < beats.length; k++) {
      const b = beats[k];
      if (b && sceneFor(b.areaId) !== current) return sceneFor(b.areaId);
    }
    return null;
  }, [beatId, current]);

  const scenes: Record<SceneKey, ReactNode> = {
    exterior: <ExteriorScene celebration={area === 'celebration-courtyard'} />,
    library: <LibraryScene />,
    portraits: <PortraitsScene />,
    greenhouse: <GreenhouseScene />,
    stairwell: <StairwellScene />,
    gallery: <GalleryScene />,
    tower: <TowerScene />,
    observatory: <ObservatoryScene />,
    'l2-lawn': (
      <>
        <LawnScene />
        <DormBedroom />
      </>
    ),
    'l2-dormitory': (
      <>
        <StairwellScene dormitory />
        <DormitoryFires />
      </>
    ),
    'l2-bridge': <BridgeScene />,
    'l2-hall': <HallScene />,
    'l2-workshops': <WorkshopScene />,
    'l2-lake': <LakeScene />,
    'l2-library': (
      <>
        <LibraryScene />
        <LibraryFires />
      </>
    ),
    'l2-ramparts': <RampartScene />,
    'l2-roof': <RoofScene />,
    'l2-aftermath': <AftermathScene />,
    'l3-shore': <ShoreScene />,
    'l3-wood': <CinderwoodScene />,
    'l3-falls': <InkfallScene />,
    'l3-margin': <MarginScene />,
    'l3-gallery': <Gallery3Scene />,
    'l3-sea': <SeaScene />,
    'l3-forge': <ForgeScene />,
    'l3-citadel': <CitadelScene />,
    'l3-throne': <ThroneScene />,
    // The homecoming ends in the Level 1 courtyard at dawn, celebrating.
    'l3-home': <ExteriorScene celebration cheering />,
  };

  return (
    <>
      <Suspense fallback={null}>
        <Atmosphere areaId={area} />
      </Suspense>
      {/* The upcoming area is mounted hidden under the same key, so when the story reaches it the very
          same scene simply becomes visible: assets loaded and materials compiled, no remount. */}
      {[...mounted, ...(next && !mounted.has(next) ? [next] : [])].map((key) => (
        // Each area streams its own assets; one area loading never blanks another.
        <Suspense key={key} fallback={null}>
          <Staged shown={mounted.has(key)}>{scenes[key]}</Staged>
        </Suspense>
      ))}
    </>
  );
}
