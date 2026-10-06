import { it } from 'vitest';
import { getLine } from '../content/dialogue';
import { LEVELS } from './levels';
it('dump', () => {
  const out: string[] = [];
  for (const id of ['level-2', 'level-3'] as const) {
    const level = LEVELS[id];
    out.push(`=== ${id}`);
    for (const b of level.route.beats) {
      const extra = b.kind === 'rail-travel' ? ` ${b.durationSec}s` : b.kind === 'camera-reveal' ? ` hold ${b.holdSec}` : '';
      out.push(`${b.areaId} | ${b.kind} ${b.id}${extra}${'attention' in b && b.attention ? ' [' + b.attention + ']' : ''}`);
      for (const k of b.barks ?? []) { const key = typeof k === 'string' ? k : JSON.stringify(k); const l = getLine(key); out.push(`    ${key} (${l?.speaker}): ${l?.text}`); }
      if (b.kind === 'encounter') {
        const e = level.encounters.get(b.id);
        for (const bk of e?.barks ?? []) { const l = getLine(bk.line); out.push(`    ~${JSON.stringify(bk.when)} ${bk.line} (${l?.speaker}): ${l?.text}`); }
        for (const w of e?.waves ?? []) out.push(`    wave ${w.id}: ${w.targets.map((t) => `${t.kind}:${t.id}${t.defeatBark ? '->' + t.defeatBark + ' "' + getLine(t.defeatBark)?.text + '"' : ''}`).join(', ')}`);
      }
      for (const c of ('chase' in b ? b.chase : undefined) ?? []) out.push(`    chase ${c.target.kind}:${c.target.id} ${JSON.stringify(c.target.words)}${c.target.defeatBark ? ' -> "' + getLine(c.target.defeatBark)?.text + '"' : ''}`);
    }
  }
  // eslint-disable-next-line no-console
  console.log(out.join('\n'));
});
