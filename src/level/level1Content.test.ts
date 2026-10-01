import { describe, expect, it } from 'vitest';
import { getLine } from '../content/dialogue';
import { ALL_STAR_PAGES } from '../game/types';
import { LEVEL1_ENCOUNTERS, LEVEL1_ROUTE } from './level1Route';
import { validateRoute } from './rail/validateRoute';

describe('Level 1 content', () => {
  it('route is valid and the camera never jumps', () => {
    expect(validateRoute(LEVEL1_ROUTE)).toEqual([]);
  });

  it('every encounter beat has a definition and every line exists', () => {
    const missing: string[] = [];
    for (const beat of LEVEL1_ROUTE.beats) {
      if (beat.kind === 'encounter' && !LEVEL1_ENCOUNTERS.has(beat.encounterId)) missing.push(beat.encounterId);
      if (beat.kind === 'dialogue') for (const l of beat.lines) if (!getLine(l)) missing.push(l);
      for (const l of beat.barks ?? []) if (!getLine(l)) missing.push(l);
    }
    for (const e of LEVEL1_ENCOUNTERS.values()) for (const b of e.barks ?? []) if (!getLine(b.line)) missing.push(b.line);
    expect(missing).toEqual([]);
  });

  it('all eight star pages and two cosmetics can be found', () => {
    const pages = new Set<string>();
    const cosmetics = new Set<string>();
    const visit = (reward?: { starPage?: string; cosmetic?: string }) => {
      if (reward?.starPage) pages.add(reward.starPage);
      if (reward?.cosmetic) cosmetics.add(reward.cosmetic);
    };
    for (const beat of LEVEL1_ROUTE.beats) visit(beat.bonus?.reward);
    for (const e of LEVEL1_ENCOUNTERS.values()) {
      visit(e.onComplete?.reward);
      for (const w of e.waves) for (const t of w.targets) visit(t.reward);
    }
    expect([...pages].sort()).toEqual([...ALL_STAR_PAGES].sort());
    expect(cosmetics.size).toBeGreaterThanOrEqual(2);
  });

  it('target ids are unique within each encounter', () => {
    for (const e of LEVEL1_ENCOUNTERS.values()) {
      const ids = e.waves.flatMap((w) => w.targets.map((t) => t.id));
      expect(new Set(ids).size, e.id).toBe(ids.length);
    }
  });

  it('never more than four required enemies at once and six targets at most', () => {
    for (const e of LEVEL1_ENCOUNTERS.values()) {
      for (const w of e.waves) {
        const required = w.targets.filter((t) => !t.optional && !t.challengeOnly).length;
        if (!w.sequential) expect(required, `${e.id}/${w.id}`).toBeLessThanOrEqual(4);
        expect(w.targets.length, `${e.id}/${w.id}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('includes all ten areas plus the celebration', () => {
    expect(new Set(LEVEL1_ROUTE.beats.map((b) => b.areaId)).size).toBe(11);
  });
});
