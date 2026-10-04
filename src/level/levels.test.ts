import { describe, expect, it } from 'vitest';
import { getLine } from '../content/dialogue';
import { strings } from '../content/strings';
import { LEVEL_AREAS, LEVEL_ORDER } from '../game/types';
import { LEVELS, levelOfBeat, nextLevel } from './levels';
import { validateRoute } from './rail/validateRoute';

describe.each(LEVEL_ORDER.filter((id) => LEVELS[id].route.beats.length > 0))('%s content', (id) => {
  const level = LEVELS[id];

  it('route is valid and the camera never jumps', () => {
    expect(validateRoute(level.route)).toEqual([]);
  });

  it('every encounter, line, objective and prompt exists', () => {
    const missing: string[] = [];
    for (const beat of level.route.beats) {
      if (beat.kind === 'encounter' && !level.encounters.has(beat.encounterId)) missing.push(`encounter ${beat.encounterId}`);
      if (beat.kind === 'dialogue') for (const l of beat.lines) if (!getLine(l)) missing.push(`line ${l}`);
      for (const l of beat.barks ?? []) if (!getLine(l)) missing.push(`line ${l}`);
      if (beat.objective && beat.objective !== 'none' && !strings.objectives[beat.objective]) missing.push(`objective ${beat.objective}`);
    }
    for (const e of level.encounters.values()) {
      for (const b of e.barks ?? []) if (!getLine(b.line)) missing.push(`line ${b.line}`);
      if (e.optionalPrompt && !strings.prompts[e.optionalPrompt]) missing.push(`prompt ${e.optionalPrompt}`);
      for (const w of e.waves) for (const t of w.targets) if (t.defeatBark && !getLine(t.defeatBark)) missing.push(`line ${t.defeatBark}`);
    }
    expect(missing).toEqual([]);
  });

  it('every collectible can be found', () => {
    const found = new Set<string>();
    for (const beat of level.route.beats) {
      if (beat.bonus?.reward?.starPage) found.add(beat.bonus.reward.starPage);
      if ('chase' in beat) for (const c of beat.chase ?? []) if (c.target.reward?.starPage) found.add(c.target.reward.starPage);
    }
    for (const e of level.encounters.values()) for (const w of e.waves) for (const t of w.targets) if (t.reward?.starPage) found.add(t.reward.starPage);
    expect([...found].sort()).toEqual([...level.collectibles].sort());
  });

  it('never more than four required enemies at once and six targets at most', () => {
    for (const e of level.encounters.values()) {
      for (const w of e.waves) {
        const required = w.targets.filter((t) => !t.optional && !t.challengeOnly).length;
        if (!w.sequential) expect(required, `${e.id}/${w.id}`).toBeLessThanOrEqual(4);
        expect(w.targets.length, `${e.id}/${w.id}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('only uses its own areas, and ends with results', () => {
    for (const beat of level.route.beats) expect(LEVEL_AREAS[id], beat.id).toContain(beat.areaId);
    expect(level.route.beats.at(-1)?.kind).toBe('results');
  });

  it('bosses point at real beats and encounters', () => {
    for (const boss of level.bosses) {
      expect(level.beatIndexOf(boss.introBeat), boss.introBeat).toBeGreaterThanOrEqual(0);
      for (const p of boss.phases) expect(level.encounters.has(p), p).toBe(true);
    }
  });
});

describe('level registry', () => {
  it('beat ids are unique across levels', () => {
    const seen = new Map<string, string>();
    for (const id of LEVEL_ORDER) {
      for (const b of LEVELS[id].route.beats) {
        expect(seen.get(b.id), `${b.id} in ${id}`).toBeUndefined();
        seen.set(b.id, id);
      }
    }
  });

  it('finds the level of a beat and the next level', () => {
    expect(levelOfBeat('arrival-crystals')).toBe('level-1');
    expect(nextLevel('level-1')).toBe('level-2');
    expect(nextLevel('level-3')).toBeNull();
  });
});
