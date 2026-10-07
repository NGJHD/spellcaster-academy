import { describe, expect, it } from 'vitest';
import { rngForTest } from './glow';

describe('glow random numbers', () => {
  it('stay between 0 and 1 for any seed (a negative seed once crashed the sky tear painter)', () => {
    for (const seed of [-420, -1, 0, 7, 1234.5]) {
      const r = rngForTest(seed);
      for (let i = 0; i < 200; i++) {
        const v = r();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });
});
