import { describe, expect, it } from 'vitest';
import { getLine } from '../content/dialogue';
import { BEAT_ALIASES, LEVEL1_ENCOUNTERS, LEVEL1_ROUTE, beatIndexOf, resolveBeatId } from './level1Route';
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

  it('the Starlight trail can be won', () => {
    const cosmetics = new Set<string>();
    for (const beat of LEVEL1_ROUTE.beats) if ('chase' in beat) for (const c of beat.chase ?? []) if (c.target.reward?.cosmetic) cosmetics.add(c.target.reward.cosmetic);
    for (const e of LEVEL1_ENCOUNTERS.values()) {
      if (e.onComplete?.reward?.cosmetic) cosmetics.add(e.onComplete.reward.cosmetic);
      for (const w of e.waves) for (const t of w.targets) if (t.reward?.cosmetic) cosmetics.add(t.reward.cosmetic);
    }
    expect([...cosmetics]).toEqual(['trail-starlight']);
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

describe('saves from before the excitement rewrite', () => {
  it('every removed beat resumes at a beat that exists', () => {
    for (const [old, now] of Object.entries(BEAT_ALIASES)) {
      expect(beatIndexOf(old), `${old} should be gone`).toBe(-1);
      expect(resolveBeatId(old), `${old} → ${now}`).toBe(now);
    }
    expect(resolveBeatId('courtyard-c2')).toBe('courtyard-c2');
    expect(resolveBeatId('no-such-beat')).toBeNull();
  });
});
