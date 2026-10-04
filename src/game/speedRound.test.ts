import { describe, expect, it } from 'vitest';
import { SpeedRound } from './speedRound';

describe('SpeedRound', () => {
  it('wins when every word is done in time, with a time bonus', () => {
    const r = new SpeedRound(8, 'standard', 3);
    r.tick(2);
    expect(r.word()).toBe(false);
    expect(r.word()).toBe(false);
    r.tick(1);
    expect(r.word()).toBe(true);
    expect(r.state).toBe('won');
    expect(r.bonus).toBe(3 * 60 + 5 * 25);
  });

  it('runs out of time without failing anything', () => {
    const r = new SpeedRound(8, 'standard', 3);
    r.word();
    expect(r.tick(7.9)).toBe(false);
    expect(r.tick(0.2)).toBe(true);
    expect(r.state).toBe('time-up');
    expect(r.word()).toBe(false);
    expect(r.bonus).toBe(0);
  });

  it('gives Gentle players a generous countdown', () => {
    expect(new SpeedRound(10, 'gentle', 5).totalSec).toBe(16);
    expect(new SpeedRound(10, 'challenge', 5).totalSec).toBe(8.5);
  });
});
