import { describe, expect, it } from 'vitest';
import { AttentionTracker } from './attention';

describe('AttentionTracker', () => {
  it('records the longest stretch without a prompt per area', () => {
    const t = new AttentionTracker();
    for (let i = 0; i < 30; i++) t.step(0.1, 'a', 'b1', false, false); // 3 s gap
    t.step(0.1, 'a', 'b2', true, false);
    for (let i = 0; i < 50; i++) t.step(0.1, 'a', 'b3', false, false); // 5 s gap
    t.step(0.1, 'a', 'b4', true, false);
    for (let i = 0; i < 20; i++) t.step(0.1, 'c', 'b5', false, false); // 2 s in area c
    const report = t.report('end');
    const a = report.find((r) => r.areaId === 'a');
    expect(a?.longest).toBeCloseTo(5, 5);
    expect(a?.beatId).toBe('b4');
    expect(report.find((r) => r.areaId === 'c')?.longest).toBeCloseTo(2, 5);
  });

  it('does not count exempt beats', () => {
    const t = new AttentionTracker();
    for (let i = 0; i < 100; i++) t.step(0.1, 'a', 'intro', false, true);
    t.step(0.1, 'a', 'x', true, false);
    expect(t.report()).toEqual([]);
  });

  it('attributes a gap to the area it started in', () => {
    const t = new AttentionTracker();
    for (let i = 0; i < 10; i++) t.step(0.1, 'a', 'b1', false, false);
    for (let i = 0; i < 10; i++) t.step(0.1, 'b', 'b2', false, false);
    t.step(0.1, 'b', 'b3', true, false);
    expect(t.report()).toEqual([{ areaId: 'a', longest: expect.closeTo(2, 5), beatId: 'b3' }]);
  });
});
