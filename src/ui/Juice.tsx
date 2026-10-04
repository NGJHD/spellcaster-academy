/**
 * Excitement HUD (CLAUDE.md §1B): score and combo meter, cheer popups, encounter medals, boss name
 * cards and boss health bars. All text comes from content/strings.
 */
import { useEffect, useRef, useState } from 'react';
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

export function BossCard() {
  const card = useRunStore((s) => s.bossCard);
  // The card clears the moment the first word flies in, so it never covers a word (§1B).
  const wordsShowing = useRunStore((s) => s.labels.length > 0);
  if (!card) return null;
  const boss = strings.bosses[card.id];
  if (!boss) return null;
  return (
    <div key={card.key} className={`boss-card${wordsShowing ? ' boss-card--leaving' : ''}`} role="status">
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
