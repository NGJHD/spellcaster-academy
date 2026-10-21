import { describe, expect, it } from 'vitest';
import type { EncounterDef, TargetSpawn } from '../levelTypes';
import { EncounterRunner, type EncounterEvent } from './EncounterRunner';

const strike = { kind: 'ranged', windupSec: 0.6, recoverSec: 0.5, intervalSec: 1, damage: 10 } as const;

function runner(targets: TargetSpawn[], extra: Partial<EncounterDef> = {}): EncounterRunner {
  const def: EncounterDef = { id: 'test', areaId: 'sunlit-courtyard', kind: 'combat', waves: [{ id: 'w', targets }], ...extra };
  return new EncounterRunner(def, { difficulty: 'standard', assist: false, attempt: 0 });
}

function step(r: EncounterRunner, seconds: number, locked: string | null = null): EncounterEvent[] {
  const events: EncounterEvent[] = [];
  for (let t = 0; t < seconds; t += 0.05) events.push(...r.update(0.05, 1, locked));
  return events;
}

const hits = (events: EncounterEvent[]) => events.filter((e) => e.type === 'hazard-hit' || e.type === 'hit');

describe('EncounterRunner fairness (owner bug reports)', () => {
  it('a creature never strikes while its next word is still arriving', () => {
    const r = runner([{ id: 'armour', kind: 'guardian', position: [0, 0, -5], words: ['stand', 'honour', 'yield'], attack: strike }]);
    step(r, 1.5);
    const t = r.targets.get('armour');
    expect(t).toBeDefined();
    if (!t) return;
    // Complete the first word just before the attack would land.
    r.completeWord('armour', 0);
    const during = step(r, 0.6);
    expect(hits(during)).toEqual([]);
    expect(t.attackPhase).toBe('idle');
  });

  it('arena hazards pause when nothing is typeable and restart their clock after each word', () => {
    const r = runner([{ id: 'plate', kind: 'marker', position: [0, 0, -5], words: ['brave', 'focus'] }], {
      hazard: { attacks: ['pulse'], firstDelaySec: 1, intervalSec: 1, windupSec: 0.6, damage: 10 },
    });
    step(r, 1.4);
    r.completeWord('plate', 0);
    // Between words there is no hazard pressure, and the clock restarted on completion.
    const gap = step(r, 0.6);
    expect(hits(gap)).toEqual([]);
    expect(r.hazardTelegraph).toBeNull();
  });

  it('a word never disappears on a timer, and the wave waits for it (owner, 2026-10-06)', () => {
    const r = runner([{ id: 'page', kind: 'journal-page', position: [0, 0, -5], words: ['glint'], optional: true, leaveAfterSec: 1 }]);
    step(r, 0.8);
    step(r, 2, 'page');
    step(r, 5, null);
    expect(r.targets.get('page')?.phase).toBe('active');
    expect(r.state).not.toBe('complete');
    r.completeWord('page', 0);
    step(r, 2);
    expect(r.state).toBe('complete');
  });
});

describe('perfect-only targets (Perfect Warden shell)', () => {
  const shell: TargetSpawn = { id: 'shell', kind: 'marker', position: [0, 0, -5], words: ['flawless'], perfectOnly: true };

  it('a perfect word breaks it at once', () => {
    const r = runner([shell]);
    step(r, 1);
    expect(r.completeWord('shell', 0).defeated).toBe(true);
  });

  it('an imperfect word counts half, so two of them break it (never stalls)', () => {
    const r = runner([shell]);
    step(r, 1);
    expect(r.completeWord('shell', 2).defeated).toBe(false);
    expect(r.completeWord('shell', 1).defeated).toBe(true);
  });

  it('on Gentle every word counts in full', () => {
    const def: EncounterDef = { id: 'g', areaId: 'sunlit-courtyard', kind: 'combat', waves: [{ id: 'w', targets: [shell] }] };
    const r = new EncounterRunner(def, { difficulty: 'gentle', assist: false, attempt: 0 });
    step(r, 1);
    expect(r.completeWord('shell', 3).defeated).toBe(true);
  });
});
