import { describe, expect, it } from 'vitest';
import { LEVELS } from '../level/levels';
import { creatureUrlsFor } from './CreatureWarmup';

describe('creatures loaded ahead of their fights', () => {
  it('lists every model the fights in a stretch of beats will spawn, chase targets included', () => {
    const level = LEVELS['level-2'];
    const beats = level.route.beats.filter((b) => b.areaId === 'l2-festival-lawn');
    const urls = creatureUrlsFor(level, beats).map((u) => u.split('/').pop());
    expect(urls).toEqual(expect.arrayContaining(['blotling.glb', 'eraser_moth.glb']));
  });

  it('every built creature model in the campaign is preloaded somewhere', () => {
    const all = new Set<string>();
    for (const level of Object.values(LEVELS)) for (const u of creatureUrlsFor(level, level.route.beats)) all.add(u.split('/').pop() ?? '');
    expect([...all]).toEqual(expect.arrayContaining(['armour_guardian.glb', 'hollow_knight.glb', 'smudgehound.glb', 'redactor.glb']));
  });
});
