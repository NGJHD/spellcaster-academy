import { describe, expect, it } from 'vitest';
import { LEVEL1_ROUTE } from '../level1Route';
import { ease } from './easing';
import { FADE_CUT, beatDurationSec, createPose, evaluateBeat } from './railMath';
import { MAX_FRAME_DELTA_SEC, RailDirector } from './RailDirector';
import type { RailBeat, RailRoute, RailSettings } from './railTypes';
import { validateRoute } from './validateRoute';

const NORMAL: RailSettings = { reducedMotion: false, travelSpeed: 1 };
const REDUCED: RailSettings = { reducedMotion: true, travelSpeed: 1 };

const TEST_ROUTE: RailRoute = {
  id: 'test',
  nodes: {
    A: { position: [0, 0, 0], lookAt: [0, 0, -1] },
    B: { position: [10, 0, 0], lookAt: [10, 0, -1] },
    C: { position: [50, 0, 0], lookAt: [50, 0, -1] },
  },
  lookPoints: { LEFT: [-5, 0, -1] },
  beats: [
    { kind: 'rail-travel', id: 'a-to-b', areaId: 'arrival-gate', nodes: ['A', 'B'], durationSec: 2, easing: 'linear', reducedMotion: 'fade-cut' },
    { kind: 'camera-reveal', id: 'look-left', areaId: 'arrival-gate', atNode: 'B', lookTargets: ['LEFT'], panSec: 1, holdSec: 0.5, returnToNode: true },
    { kind: 'loading-transition', id: 'fade-to-c', areaId: 'arrival-gate', toNode: 'C', fadeOutSec: 0.5, holdSec: 0.5, fadeInSec: 0.5 },
  ],
};

function beat(id: string): RailBeat {
  const found = TEST_ROUTE.beats.find((b) => b.id === id);
  if (!found) throw new Error(id);
  return found;
}

/** Steps the director in small frames for `seconds`. */
function run(director: RailDirector, seconds: number, settings = NORMAL): void {
  const step = 1 / 60;
  for (let t = 0; t < seconds - 1e-9; t += step) director.update(Math.min(step, seconds - t), settings);
}

describe('easing', () => {
  it('starts at 0, ends at 1 and clamps outside the range', () => {
    for (const name of ['linear', 'easeInOutSine', 'easeInOutCubic', 'easeOutCubic'] as const) {
      expect(ease(name, 0)).toBeCloseTo(0);
      expect(ease(name, 1)).toBeCloseTo(1);
      expect(ease(name, -1)).toBeCloseTo(0);
      expect(ease(name, 2)).toBeCloseTo(1);
    }
  });

  it('is monotonic', () => {
    let last = 0;
    for (let t = 0; t <= 1; t += 0.01) {
      const v = ease('easeInOutCubic', t);
      expect(v).toBeGreaterThanOrEqual(last - 1e-12);
      last = v;
    }
  });
});

describe('beat evaluation', () => {
  it('travel moves from first node to last node', () => {
    const start = createPose();
    const out = createPose();
    evaluateBeat(TEST_ROUTE, beat('a-to-b'), 0, NORMAL, start, out);
    expect(out.position.x).toBeCloseTo(0);
    evaluateBeat(TEST_ROUTE, beat('a-to-b'), 1, NORMAL, start, out);
    expect(out.position.x).toBeCloseTo(5);
    evaluateBeat(TEST_ROUTE, beat('a-to-b'), 2, NORMAL, start, out);
    expect(out.position.x).toBeCloseTo(10);
    expect(out.fade).toBe(0);
  });

  it('travel speed scales travel duration', () => {
    expect(beatDurationSec(TEST_ROUTE, beat('a-to-b'), { reducedMotion: false, travelSpeed: 2 })).toBeCloseTo(1);
  });

  it('reduced motion replaces a fade-cut glide with a short fade and cut', () => {
    const duration = beatDurationSec(TEST_ROUTE, beat('a-to-b'), REDUCED);
    expect(duration).toBeCloseTo(FADE_CUT.outSec + FADE_CUT.holdSec + FADE_CUT.inSec);
    const start = createPose();
    const out = createPose();
    evaluateBeat(TEST_ROUTE, beat('a-to-b'), FADE_CUT.outSec * 0.99, REDUCED, start, out);
    expect(out.position.x).toBeCloseTo(0); // never shown mid-glide
    evaluateBeat(TEST_ROUTE, beat('a-to-b'), FADE_CUT.outSec + FADE_CUT.holdSec + 0.01, REDUCED, start, out);
    expect(out.position.x).toBeCloseTo(10);
    expect(out.fade).toBeGreaterThan(0.9);
    evaluateBeat(TEST_ROUTE, beat('a-to-b'), duration, REDUCED, start, out);
    expect(out.fade).toBeCloseTo(0);
  });

  it('reveal keeps position fixed, pans to the target, and returns', () => {
    const reveal = beat('look-left');
    // pan out (1) + hold (0.5) + pan back (1) + hold (0.5)
    expect(beatDurationSec(TEST_ROUTE, reveal, NORMAL)).toBeCloseTo(3);
    expect(beatDurationSec(TEST_ROUTE, reveal, REDUCED)).toBeCloseTo(2);
    const start = createPose();
    const out = createPose();
    evaluateBeat(TEST_ROUTE, reveal, 1.2, NORMAL, start, out);
    expect(out.position.x).toBeCloseTo(10);
    expect(out.lookAt.x).toBeCloseTo(-5);
    evaluateBeat(TEST_ROUTE, reveal, 3, NORMAL, start, out);
    expect(out.lookAt.x).toBeCloseTo(10);
  });

  it('loading transition fades out from the previous shot, then cuts to the destination', () => {
    const load = beat('fade-to-c');
    const start = createPose();
    start.position.set(10, 0, 0);
    const out = createPose();
    evaluateBeat(TEST_ROUTE, load, 0.25, NORMAL, start, out);
    expect(out.position.x).toBeCloseTo(10);
    expect(out.fade).toBeCloseTo(0.5);
    evaluateBeat(TEST_ROUTE, load, 1.25, NORMAL, start, out);
    expect(out.position.x).toBeCloseTo(50);
    expect(out.fade).toBeCloseTo(0.5);
  });
});

describe('RailDirector', () => {
  it('plays every beat in order and reports completion once', () => {
    const started: string[] = [];
    let completions = 0;
    const director = new RailDirector(TEST_ROUTE, {
      onBeatStart: (b) => started.push(b.id),
      onComplete: () => completions++,
    });
    director.start(NORMAL);
    run(director, 10);
    expect(started).toEqual(['a-to-b', 'look-left', 'fade-to-c']);
    expect(completions).toBe(1);
    expect(director.isComplete).toBe(true);
    expect(director.pose.position.x).toBeCloseTo(50);
    expect(director.pose.fade).toBeCloseTo(0);
  });

  it('does not advance while not updated (paused)', () => {
    const director = new RailDirector(TEST_ROUTE);
    director.start(NORMAL);
    run(director, 1);
    const x = director.pose.position.x;
    // Pausing = the controller simply stops calling update.
    expect(director.currentBeat?.id).toBe('a-to-b');
    expect(x).toBeCloseTo(5, 0);
  });

  it('clamps a huge frame delta so the camera never jumps', () => {
    const director = new RailDirector(TEST_ROUTE);
    director.start(NORMAL);
    director.update(30, NORMAL);
    expect(director.currentBeat?.id).toBe('a-to-b');
    expect(director.pose.position.x).toBeCloseTo(5 * MAX_FRAME_DELTA_SEC);
  });

  it('can restart from a named beat', () => {
    const director = new RailDirector(TEST_ROUTE);
    director.start(NORMAL, 'look-left');
    expect(director.currentBeat?.id).toBe('look-left');
    expect(director.pose.position.x).toBeCloseTo(10);
    expect(() => director.start(NORMAL, 'missing')).toThrow();
  });
});

describe('route validation', () => {
  it('accepts the test route', () => {
    expect(validateRoute(TEST_ROUTE)).toEqual([]);
  });

  it('reports unknown names and camera jumps', () => {
    const broken: RailRoute = {
      ...TEST_ROUTE,
      beats: [
        { kind: 'rail-travel', id: 'x', areaId: 'arrival-gate', nodes: ['A', 'B'], durationSec: 1, easing: 'linear', reducedMotion: 'glide' },
        { kind: 'rail-travel', id: 'y', areaId: 'arrival-gate', nodes: ['C', 'A'], durationSec: 1, easing: 'linear', reducedMotion: 'glide' },
      ],
    };
    expect(validateRoute(broken).some((p) => p.includes('jumps'))).toBe(true);
    const unknown: RailRoute = { ...TEST_ROUTE, beats: [{ ...TEST_ROUTE.beats[1], atNode: 'NOPE' } as RailBeat] };
    expect(validateRoute(unknown)[0]).toContain('unknown node');
  });

  it('the authored Level 1 route is valid and continuous', () => {
    expect(validateRoute(LEVEL1_ROUTE)).toEqual([]);
  });

  it('the authored Level 1 route plays to completion with and without reduced motion', () => {
    for (const settings of [NORMAL, REDUCED]) {
      const director = new RailDirector(LEVEL1_ROUTE);
      director.start(settings);
      run(director, 300, settings);
      expect(director.isComplete).toBe(true);
    }
  });
});
