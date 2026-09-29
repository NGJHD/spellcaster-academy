import type { AreaId } from '../level/rail/railTypes';
import type { TravelSpeed } from '../state/settings';

/** All user-facing text lives here to support later localisation. British English. */
export const strings = {
  title: {
    game: 'Spellcaster Academy',
    subtitle: 'The Broken Ward',
    start: 'START',
    resume: 'RESUME',
    noResume: 'No journey to resume',
    buildLabel: 'Milestone 1 preview · placeholder art',
  },
  pause: {
    heading: 'Paused',
    resume: 'Resume',
    controls: 'Controls',
    settings: 'Settings',
    returnToTitle: 'Return to Title',
    back: 'Back',
    hint: 'Esc — pause',
  },
  settings: {
    heading: 'Settings',
    reducedMotion: 'Reduced motion',
    reducedMotionHelp: 'Shorter camera pans and fades instead of long glides.',
    travelSpeed: 'Travel speed between encounters',
    travelSpeeds: { slow: 'Slow', normal: 'Normal', fast: 'Fast' } satisfies Record<TravelSpeed, string>,
    on: 'On',
    off: 'Off',
  },
  controls: {
    heading: 'Controls',
    rows: [
      { keys: 'Letter keys', action: 'Type the word on a target' },
      { keys: 'Backspace', action: 'Fix a letter' },
      { keys: 'Tab', action: 'Switch between targets' },
      { keys: 'Left / Right', action: 'Choose a route or option' },
      { keys: 'Enter', action: 'Continue or interact' },
      { keys: 'Escape', action: 'Pause' },
    ],
    note: 'The camera moves by itself. You never need to aim — just type.',
  },
  areas: {
    'arrival-gate': 'Arrival Gate',
    'sunlit-courtyard': 'Sunlit Courtyard',
    'east-hall': 'East Hall',
  } satisfies Record<AreaId, string>,
  routeComplete: {
    heading: 'End of the preview route',
    body: 'The Library comes in a later milestone.',
    replay: 'Replay Route',
    returnToTitle: 'Return to Title',
  },
} as const;
