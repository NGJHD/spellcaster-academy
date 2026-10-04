/**
 * Excitement HUD (CLAUDE.md §1B): score and combo meter, cheer popups, encounter medals, boss name
 * cards and boss health bars. All text comes from content/strings.
 */
import { useEffect, useRef, useState, type AnimationEvent } from 'react';
import { strings } from '../content/strings';
import { useRunStore, type PopupInfo } from '../state/runStore';

/** Popup elements by key, positioned each frame by RunDriver (world → screen). */
export const popupElements = new Map<number, { el: HTMLDivElement; position: readonly [number, number, number] }>();

const POPUP_SEC = 0.9;

export function ScoreMeter() {
  const score = useRunStore((s) => s.score);
  const combo = useRunStore((s) => s.combo);
  const multiplier = useRunStore((s) => s.comboMultiplier);
  const shown = useCountUp(score);
  return (
    <div className="score-meter" aria-label={strings.hud.score}>
      <div className="score-meter__value">{shown.toLocaleString()}</div>
      {combo > 1 && (
        <div key={multiplier} className={`score-meter__combo score-meter__combo--x${multiplier}`}>
          {strings.hud.combo} {combo}
          {multiplier > 1 && <span className="score-meter__multiplier">×{multiplier}</span>}
        </div>
      )}
    </div>
  );
}

/** Rolls the displayed score up to the real one so every gain is visible. */
function useCountUp(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const diff = target - shownRef.current;
      if (diff === 0) return;
      const next = Math.abs(diff) < 2 ? target : shownRef.current + Math.ceil(Math.abs(diff) * 0.18) * Math.sign(diff);
      shownRef.current = next;
      setShown(next);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

export function Popups() {
  const popups = useRunStore((s) => s.popups);
  return (
    <div className="popups" aria-hidden="true">
      {popups.map((p) => (
        <Popup key={p.key} popup={p} />
      ))}
    </div>
  );
}

function Popup({ popup }: { popup: PopupInfo }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    popupElements.set(popup.key, { el, position: popup.position });
    const t = window.setTimeout(() => {
      popupElements.delete(popup.key);
      useRunStore.setState((s) => ({ popups: s.popups.filter((p) => p.key !== popup.key) }));
    }, POPUP_SEC * 1000);
    return () => {
      window.clearTimeout(t);
      popupElements.delete(popup.key);
    };
  }, [popup]);
  return (
    <div ref={ref} className="popup-anchor">
      <div className={`popup popup--${popup.tier}`}>{popup.text}</div>
    </div>
  );
}

export function MedalCard() {
  const medal = useRunStore((s) => s.medal);
  if (!medal) return null;
  return (
    <div key={medal.key} className="medal-card" role="status">
      <div className="medal-card__stars">
        {[1, 2, 3].map((n) => (
          <span key={n} className={`medal-card__star${n <= medal.stars ? ' medal-card__star--won' : ''}`} style={{ animationDelay: `${n * 0.18}s` }}>
            ★
          </span>
        ))}
      </div>
      <div className="medal-card__title">{strings.medals[medal.stars]}</div>
      <div className="medal-card__bonus">+{medal.bonus}</div>
    </div>
  );
}

/**
 * A full-screen card that clears for good the moment a word appears, so it never covers one (§1B).
 * Returns whether the card with this key is leaving and whether it has already gone.
 */
function useClearsForWords(key: number | undefined): { leaving: boolean; gone: boolean; onAnimationEnd: (e: AnimationEvent) => void } {
  const wordsShowing = useRunStore((s) => s.labels.length > 0);
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    if (key === undefined || !wordsShowing || left === key) return;
    const t = window.setTimeout(() => setLeft(key), 300);
    return () => window.clearTimeout(t);
  }, [key, wordsShowing, left]);
  // A card that has finished its own animation is gone too (it must not flash back later).
  const onAnimationEnd = (e: AnimationEvent) => {
    if (e.target === e.currentTarget && key !== undefined) setLeft(key);
  };
  return { leaving: key !== undefined && wordsShowing, gone: key !== undefined && left === key, onAnimationEnd };
}

export function BossCard() {
  const card = useRunStore((s) => s.bossCard);
  const { leaving, gone, onAnimationEnd } = useClearsForWords(card?.key);
  if (!card || gone) return null;
  const boss = strings.bosses[card.id];
  if (!boss) return null;
  return (
    <div key={card.key} className={`boss-card${leaving ? ' boss-card--leaving' : ''}`} role="status" onAnimationEnd={onAnimationEnd}>
      <div className="boss-card__stripe" />
      <div className="boss-card__name">{boss.name}</div>
      <div className="boss-card__title">{boss.title}</div>
    </div>
  );
}

export function BossBar() {
  const boss = useRunStore((s) => s.boss);
  if (!boss) return null;
  const name = strings.bosses[boss.id]?.name ?? '';
  return (
    <div className="boss-bar" role="meter" aria-label={name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(boss.health * 100)}>
      <div className="boss-bar__name">{name}</div>
      <div className="boss-bar__track">
        <span className="boss-bar__trail" style={{ transform: `scaleX(${boss.health})` }} />
        <span className="boss-bar__fill" style={{ transform: `scaleX(${boss.health})` }} />
      </div>
    </div>
  );
}

export function SpeedRoundBanner() {
  const r = useRunStore((s) => s.speedRound);
  if (!r) return null;
  const t = strings.speedRound;
  const fraction = r.totalSec > 0 ? r.remainingSec / r.totalSec : 0;
  return (
    <div key={r.key} className={`speed-round speed-round--${r.state}`} role="status">
      <div className="speed-round__title">{r.state === 'won' ? t.won : r.state === 'time-up' ? t.timeUp : t.title}</div>
      {r.state === 'running' && (
        <>
          <div className="speed-round__goal">{t.goal(r.words, Math.round(r.totalSec))}</div>
          <div className="speed-round__clock">{r.remainingSec.toFixed(1)}</div>
          <div className="speed-round__track">
            <span className={`speed-round__fill${fraction < 0.3 ? ' speed-round__fill--low' : ''}`} style={{ transform: `scaleX(${fraction})` }} />
          </div>
          <div className="speed-round__count">
            {r.done} / {r.words}
          </div>
        </>
      )}
      {r.state === 'won' && <div className="speed-round__bonus">+{r.bonus}</div>}
      {r.state === 'time-up' && <div className="speed-round__goal">{t.keepGoing}</div>}
    </div>
  );
}

/** Full-screen white flash for explosions and the ward re-sealing. */
export function FlashOverlay() {
  const key = useRunStore((s) => s.flashKey);
  if (key === 0) return null;
  return <div key={key} className="screen-flash" aria-hidden="true" />;
}

const SPLAT_SPOTS = [
  { left: '3%', top: '18%', rotate: 20, colour: '#e8483c' },
  { left: '82%', top: '62%', rotate: -35, colour: '#3f7fe8' },
  { left: '6%', top: '64%', rotate: 75, colour: '#f2c230' },
  { left: '86%', top: '14%', rotate: -10, colour: '#3fbf6a' },
  { left: '1%', top: '40%', rotate: 140, colour: '#9b5de5' },
];

/**
 * Paint splats from the portrait imps land at the screen edges only (LD-0: they never cover a
 * word) and slide off after a moment.
 */
export function PaintSplats() {
  const key = useRunStore((s) => s.splatKey);
  if (key === 0) return null;
  const spot = SPLAT_SPOTS[key % SPLAT_SPOTS.length] ?? SPLAT_SPOTS[0];
  if (!spot) return null;
  return (
    <div key={key} className="paint-splat" aria-hidden="true" style={{ left: spot.left, top: spot.top, transform: `rotate(${spot.rotate}deg)`, color: spot.colour }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path
          fill="currentColor"
          d="M50 12c7 0 9 10 15 11s14-8 18-2-4 13 0 19 15 5 14 13-12 6-14 12 6 15-1 19-12-5-18-3-8 13-15 12-6-12-12-14-16 6-19-1 6-12 3-18-14-7-12-15 13-5 16-11-3-14 3-18 13 4 18 2 3-15 4-16z"
        />
        <circle cx="88" cy="20" r="5" fill="currentColor" />
        <circle cx="12" cy="84" r="4" fill="currentColor" />
      </svg>
    </div>
  );
}

/** New spell announced like a power-up (§1B "Unlock moments"). */
export function PowerUpCard() {
  const p = useRunStore((s) => s.powerUp);
  const { leaving, gone, onAnimationEnd } = useClearsForWords(p?.key);
  if (!p || gone) return null;
  const card = strings.powerUps[p.spell];
  return (
    <div key={p.key} className={`power-up${leaving ? ' boss-card--leaving' : ''}`} role="status" onAnimationEnd={onAnimationEnd}>
      <div className="power-up__burst" />
      <div className="power-up__kicker">{strings.powerUpKicker}</div>
      <div className="power-up__name">{card.name}</div>
      <div className="power-up__detail">{card.detail}</div>
    </div>
  );
}
