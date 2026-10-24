/**
 * The painted loading screen (owner, 2026-10-23: "a loading page with a graphic background and a loading
 * bar at the bottom"). It covers the first load of a session while the first area loads and readies
 * behind it, then fades away as the level begins. The bar is written directly each frame from
 * `loadProgress` (never through React state).
 */
import { useEffect, useRef, useState } from 'react';
import { strings } from '../content/strings';
import { loadProgress } from '../scene/LoadTracker';
import { getRun, useGameStore } from '../state/gameStore';

const FADE_MS = 700;

const pickTip = (): string => strings.loading.tips[Math.floor(Math.random() * strings.loading.tips.length)] ?? '';
const ART = `${import.meta.env.BASE_URL}assets/ui/loading.webp`;

export function LoadingScreen() {
  const loading = useGameStore((s) => s.mode === 'loading');
  // Stays mounted while it fades out after loading ends.
  const [shown, setShown] = useState(loading);
  if (loading && !shown) setShown(true);
  useEffect(() => {
    if (loading || !shown) return;
    const id = window.setTimeout(() => setShown(false), FADE_MS);
    return () => window.clearTimeout(id);
  }, [loading, shown]);

  const fill = useRef<HTMLDivElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!shown) return;
    let frame = 0;
    let shownValue = 0;
    const tick = () => {
      // Eases towards the real progress, so the bar glides rather than jumps.
      shownValue += (loadProgress.value - shownValue) * 0.12;
      if (fill.current) fill.current.style.transform = `scaleX(${Math.max(0.02, shownValue)})`;
      if (status.current) status.current.textContent = loadProgress.readying ? strings.loading.readying : strings.loading.label;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown]);

  const [tip] = useState(pickTip);
  if (!shown) return null;
  const level = strings.levels[getRun()?.level.id ?? 'level-1'];
  return (
    <div className={`loading-screen${loading ? '' : ' loading-screen--out'}`} role="status" aria-live="polite">
      <img className="loading-screen__art" src={ART} alt="" />
      <div className="loading-screen__title">
        <h1>{strings.title.game}</h1>
        <p>{strings.title.subtitle}</p>
      </div>
      <div className="loading-screen__foot">
        <p className="loading-screen__level">
          {level.number}: {level.name}
        </p>
        <p className="loading-screen__tip">
          <span>{strings.loading.tip}</span> {tip}
        </p>
        <div className="loading-screen__bar" aria-hidden="true">
          <div ref={fill} className="loading-screen__fill" />
        </div>
        <span ref={status} className="loading-screen__status">
          {strings.loading.label}
        </span>
      </div>
    </div>
  );
}
