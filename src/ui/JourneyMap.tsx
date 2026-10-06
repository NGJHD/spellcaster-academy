/**
 * The journey map card (owner, 2026-10-07: "telling the player they have lit the beacon and the next
 * location is X, so let's head there now"). A small illustrated map of Asterfall pops up as the
 * apprentice sets off: the places already visited, the beacons lit so far, and a glowing dotted trail
 * to the next stop. It shows for a few seconds and never covers the middle of the screen.
 */
import { useEffect, useState } from 'react';
import { strings } from '../content/strings';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';

const SHOW_MS = 5200;

interface Stop {
  readonly x: number;
  readonly y: number;
  /** Flag set when this stop's beacon is lit (beacon stops only). */
  readonly beacon?: string;
}

/** Level 2: the beacon route around the academy, in story order. */
const STOPS: Readonly<Record<string, Stop>> = {
  'l2-dorm': { x: 262, y: 168 },
  'l2-lawn': { x: 214, y: 182 },
  'l2-bell': { x: 128, y: 170, beacon: 'l2-beacon-bell' },
  'l2-hall': { x: 112, y: 116 },
  'l2-workshops': { x: 176, y: 108, beacon: 'l2-beacon-furnace' },
  'l2-lake': { x: 238, y: 126 },
  'l2-lighthouse': { x: 290, y: 62, beacon: 'l2-beacon-lighthouse' },
  'l2-library': { x: 70, y: 64 },
  'l2-ramparts': { x: 36, y: 128, beacon: 'l2-beacon-rampart' },
  'l2-tower': { x: 160, y: 40 },
};
const ORDER = Object.keys(STOPS);

function Flame({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} className={lit ? 'journey__beacon journey__beacon--lit' : 'journey__beacon'}>
      <rect x={-5} y={2} width={10} height={9} rx={1.5} />
      <path d="M0 -12 C 6 -5, 7 0, 0 3 C -7 0, -6 -5, 0 -12 Z" />
    </g>
  );
}

export function JourneyMap() {
  const journey = useRunStore((s) => s.journey);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!journey) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), SHOW_MS);
    return () => window.clearTimeout(t);
  }, [journey]);
  if (!journey || !visible) return null;
  const to = ORDER.indexOf(journey.to);
  if (to < 0) return null;
  const flags = getRun()?.flags ?? new Set<string>();
  const lit = ORDER.filter((id) => {
    const b = STOPS[id]?.beacon;
    return b !== undefined && flags.has(b);
  }).length;
  const point = (id: string | undefined) => STOPS[id ?? ''] ?? { x: 0, y: 0 };
  const done = ORDER.slice(0, to).map((id) => `${point(id).x},${point(id).y}`).join(' ');
  const from = point(ORDER[to - 1]);
  const next = point(journey.to);
  const names = strings.journey.stops as Record<string, string | undefined>;
  return (
    <div className="journey" key={journey.key} role="status" aria-live="polite">
      <div className="journey__title">{strings.journey.title}</div>
      <svg className="journey__map" viewBox="0 0 320 210" aria-hidden="true">
        {/* Lantern Lake (with the Rift's red glow on the water) and the academy grounds */}
        <ellipse cx={278} cy={92} rx={52} ry={44} className="journey__lake" />
        <path d="M14 196 L 20 30 L 140 14 L 226 30 L 236 196 Z" className="journey__ground" />
        <polyline points={done} className="journey__trail journey__trail--done" />
        <line x1={from.x} y1={from.y} x2={next.x} y2={next.y} className="journey__trail journey__trail--next" />
        {ORDER.map((id, i) => {
          const s = STOPS[id];
          if (!s) return null;
          if (s.beacon) return <Flame key={id} x={s.x} y={s.y} lit={flags.has(s.beacon)} />;
          return <circle key={id} cx={s.x} cy={s.y} r={i < to ? 4 : 3} className={i < to ? 'journey__stop journey__stop--visited' : 'journey__stop'} />;
        })}
        <circle cx={next.x} cy={next.y} r={11} className="journey__here" />
      </svg>
      <div className="journey__beacons">{strings.journey.beacons(lit, 4)}</div>
      <div className="journey__next">
        {strings.journey.next} <strong>{names[journey.to] ?? ''}</strong>
      </div>
    </div>
  );
}
