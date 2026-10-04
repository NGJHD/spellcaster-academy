import { describe, expect, it } from 'vitest';
import { Combo } from './combo';
import { encounterStars } from './medals';

describe('Combo', () => {
  it('grows the multiplier with the combo', () => {
    const c = new Combo();
    expect(c.multiplier).toBe(1);
    c.word();
    c.word();
    expect(c.multiplier).toBe(1);
    c.word();
    expect(c.multiplier).toBe(2);
    for (let i = 0; i < 3; i++) c.word();
    expect(c.multiplier).toBe(3);
    for (let i = 0; i < 4; i++) c.word();
    expect(c.multiplier).toBe(4);
  });

  it('cheers at milestones only once', () => {
    const c = new Combo();
    const cheers = Array.from({ length: 12 }, () => c.word()).filter(Boolean);
    expect(cheers).toEqual(['COMBO!', 'SUPER!', 'AMAZING!', 'UNSTOPPABLE!']);
  });

  it('halves on a mistake instead of wiping out', () => {
    const c = new Combo();
    for (let i = 0; i < 7; i++) c.word();
    c.mistake();
    expect(c.count).toBe(3);
    c.mistake();
    expect(c.count).toBe(1);
    c.mistake();
    expect(c.count).toBe(0);
  });
});

describe('encounterStars', () => {
  it('rates accuracy and damage', () => {
    expect(encounterStars({ words: 5, correct: 30, incorrect: 0, damage: 0 })).toBe(3);
    expect(encounterStars({ words: 5, correct: 30, incorrect: 0, damage: 10 })).toBe(2);
    expect(encounterStars({ words: 5, correct: 30, incorrect: 3, damage: 0 })).toBe(2);
    expect(encounterStars({ words: 5, correct: 20, incorrect: 8, damage: 0 })).toBe(1);
  });

  it('always awards at least one star and skips tiny encounters', () => {
    expect(encounterStars({ words: 3, correct: 1, incorrect: 50, damage: 99 })).toBe(1);
    expect(encounterStars({ words: 1, correct: 4, incorrect: 0, damage: 0 })).toBeNull();
  });
});
