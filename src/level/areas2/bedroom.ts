/**
 * Level 2 opening (owner, 2026-10-07): the apprentice wakes in their dormitory bedroom at the top of
 * the Dormitory Tower. Pip shouts them awake; through the window the academy burns under a red sky
 * and the crack from Level 1 tears open into the Rift. Scribble imps climb in at the window, then the
 * apprentice runs out to rescue the first-years trapped on the stairs below.
 * The room is built inside the lawn's Dormitory Tower (see DormBedroom), so the window looks out on
 * the real burning lawn, the lake and the Rift. It belongs to the lawn area for its outdoor sky.
 */
import type { Vec3 } from '../rail/railTypes';
import { fade, fight, hold, marker, reveal, travel, type AreaScript } from '../areas/builders';
import { DORM_DOOR } from './lawn';
import { scribbleImp } from './hush';

const A = 'l2-festival-lawn';

/** Centre of the bedroom floor, inside the Dormitory Tower (radius 4.6 m), 16 m up. */
export const BEDROOM_CENTRE: Vec3 = [DORM_DOOR[0] + 4.6, 16, DORM_DOOR[2]];
/** Half the room's width; the window is on the −Z wall (towards the lake and the Rift). */
export const BEDROOM_HALF = 2.8;
export const BEDROOM_HEIGHT = 3.4;
const R = (x: number, y: number, z: number): Vec3 => [BEDROOM_CENTRE[0] + x, BEDROOM_CENTRE[1] + y, BEDROOM_CENTRE[2] + z];

export const bedroom: AreaScript = {
  nodes: {
    // Lying in bed, looking up at the ceiling and Pip.
    BED_LIE: { position: R(1.3, 0.85, 1.4), lookAt: R(0.9, 3.4, 0.4) },
    BED_SIT: { position: R(1.1, 1.3, 0.9), lookAt: R(0, 1.9, -2.8) },
    BED_WINDOW: { position: R(0, 1.6, -1.5), lookAt: R(-0.4, 2.6, -6) },
    // At the window, looking up at the Rift (where the Rift reveal ends).
    BED_WINDOW_UP: { position: R(0, 1.6, -1.5), lookAt: R(-3, 16, -26) },
    BED_ROOM: { position: R(1.2, 1.6, 1.6), lookAt: R(-0.3, 1.0, -2.6) },
    BED_DOOR: { position: R(-1.4, 1.6, 1.0), lookAt: R(-2.8, 1.4, 1.0) },
  },
  lookPoints: {
    BED_RIFT: R(-3, 16, -26),
    // The academy burning across the lake (kept above the windowsill from the window).
    BED_SHORE: R(8, -8, -80),
  },
  beats: [
    fade('l2-wake-fade', A, 'BED_LIE', { fadeOutSec: 0, holdSec: 0.6, fadeInSec: 1.4, music: 'siege-dread', objective: 'l2-wake' }),
    // Pip shouts the apprentice awake: the first word of the level.
    hold('l2-wake-up', A, 'BED_LIE', 1.5, {
      barks: ['l2-wake-1'],
      chase: [{ at: 0.05, target: marker('wake-word', R(1.0, 2.5, 0.2), 'wake', { labelHeight: 0.2 }) }],
    }),
    travel('l2-wake-sit', A, ['BED_LIE', 'BED_SIT', 'BED_WINDOW'], 4, { barks: ['l2-wake-2'], easing: 'easeInOutCubic' }),
    // Through the window: the academy burning, and the crack tearing open into the Rift.
    // The fires first, then up to the Rift, holding on it while it is talked about (owner: the Rift
    // line played over the plain horizon).
    reveal('l2-rift-opens', A, 'BED_WINDOW', ['BED_SHORE', 'BED_RIFT'], 1.0, 6.5, {
      returnToNode: false,
      barks: ['l2-seam', 'l2-seam-2', 'l2-voice-1', 'l2-voice-react'],
      fx: [
        { kind: 'flash', atBeat: 0.12 },
        { kind: 'lightning', at: 'BED_RIFT', atBeat: 0.12 },
        { kind: 'shake', atBeat: 0.12, scale: 1.4 },
        { kind: 'meteors', at: 'BED_SHORE', atBeat: 0.4, scale: 1.2, color: '#ff4a12' },
        { kind: 'lightning', at: 'BED_RIFT', atBeat: 0.6 },
      ],
    }),
    travel('l2-wake-back', A, ['BED_WINDOW_UP', 'BED_ROOM'], 1.6, { easing: 'easeOutCubic' }),
    // Scribble imps climb in through the window.
    fight('l2-bedroom-imps', A, { music: 'siege-battle', barks: ['l2-imps-window'] }),
    travel('l2-to-door', A, ['BED_ROOM', 'BED_DOOR'], 2.5, { barks: ['l2-firstyears'] }),
  ],
  encounters: [
    {
      id: 'l2-bedroom-imps',
      areaId: A,
      kind: 'combat',
      waves: [
        {
          id: 'window',
          targets: [
            scribbleImp('bed-imp-1', [R(-0.6, 0.9, -2.9), R(-0.4, 0, -1.6), R(0.2, 0, 0.2)], { entrance: { kind: 'glass', scale: 0.8 } }),
            scribbleImp('bed-imp-2', [R(0.7, 0.9, -2.9), R(0.6, 0, -1.4), R(0.7, 0, 0.4)], { delaySec: 0.9, entrance: { kind: 'glass', scale: 0.8 } }),
          ],
        },
      ],
    },
  ],
};
