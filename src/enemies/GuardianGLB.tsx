import { Suspense, type RefObject } from 'react';
import { CreatureModel } from './CreatureModel';
import { GuardianModel, type TargetPose } from './TargetVisuals';

export const GUARDIAN_URL = `${import.meta.env.BASE_URL}assets/creatures/armour_guardian.glb`;

/**
 * Animated armour guardian (realistic AI-pipeline model, assets-src/scripts/ai/build_ai_creature.py):
 * the shared skinned creature loader drives Idle/Move/Attack/Hit and the formal bow on defeat.
 * The code-built stand-in shows while it streams in.
 */
export function Guardian({ pose }: { pose: RefObject<TargetPose> }) {
  return (
    <Suspense fallback={<GuardianModel pose={pose} />}>
      <CreatureModel url={GUARDIAN_URL} pose={pose} />
    </Suspense>
  );
}
