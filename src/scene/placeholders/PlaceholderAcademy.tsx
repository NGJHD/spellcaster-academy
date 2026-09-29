/**
 * PLACEHOLDER academy layout for the Milestone 1 route. See level1Route.ts for the coordinate plan.
 * Every piece here is a stand-in for Blender-authored assets and will be replaced area by area.
 */
import { PlaceholderArrivalGate } from './PlaceholderArrivalGate';
import { PlaceholderCampus } from './PlaceholderCampus';
import { PlaceholderCourtyard } from './PlaceholderCourtyard';
import { PlaceholderEastHall } from './PlaceholderEastHall';

export function PlaceholderAcademy() {
  return (
    <group name="placeholder-academy">
      <PlaceholderCampus />
      <PlaceholderArrivalGate />
      <PlaceholderCourtyard />
      <PlaceholderEastHall />
    </group>
  );
}
