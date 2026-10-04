import { SPEAKER_NAMES } from '../content/dialogue';
import { strings } from '../content/strings';
import type { AreaId } from '../game/types';
import type { LevelRoute } from '../level/levelTypes';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';
import { useSettingsStore } from '../state/settingsStore';
import { BossBar, BossCard, FlashOverlay, MedalCard, PaintSplats, Popups, PowerUpCard, ScoreMeter, SpeedRoundBanner } from './Juice';

/** Chapter marks on the progress bar: where each area begins along the level's route. */
const chapterCache = new WeakMap<LevelRoute, readonly { areaId: AreaId; at: number }[]>();
function chaptersOf(route: LevelRoute | undefined): readonly { areaId: AreaId; at: number }[] {
  if (!route) return [];
  const cached = chapterCache.get(route);
  if (cached) return cached;
  const beats = route.beats;
  const out: { areaId: AreaId; at: number }[] = [];
  beats.forEach((b, i) => {
    if (i > 0 && b.areaId !== beats[i - 1]?.areaId && !out.some((c) => c.areaId === b.areaId)) {
      out.push({ areaId: b.areaId, at: i / Math.max(1, beats.length - 1) });
    }
  });
  chapterCache.set(route, out);
  return out;
}

/** HUD (GD-19): Focus, objective, streak, star pages, subtitles, prompts and short notices only. */
export function HUD() {
  const areaId = useRunStore((s) => s.areaId);
  const areaCardKey = useRunStore((s) => s.areaCardKey);
  const focus = useRunStore((s) => s.focus);
  const unlimitedHp = useRunStore((s) => s.unlimitedHp);
  const objective = useRunStore((s) => s.objective);
  const streak = useRunStore((s) => s.streak);
  const starPages = useRunStore((s) => s.starPages);
  const saveKey = useRunStore((s) => s.saveKey);
  const toast = useRunStore((s) => s.toast);
  const prompt = useRunStore((s) => s.prompt);
  const hazard = useRunStore((s) => s.hazard);
  const damageKey = useRunStore((s) => s.damageKey);
  const liveWpm = useRunStore((s) => s.liveWpm);
  const beatId = useRunStore((s) => s.beatId);
  const progress = useRunStore((s) => s.progress);
  const showWpm = useSettingsStore((s) => s.showWpm);
  const objectiveText = objective ? strings.objectives[objective] : null;

  return (
    <div className="hud">
      <div className="hud__top-left">
        {!unlimitedHp && (
        <div className="focus-meter" role="meter" title={strings.hud.focusHelp} aria-label={strings.hud.focus} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(focus)}>
          <span className="focus-meter__label">{strings.hud.focus}</span>
          <span className="focus-meter__track">
            <span className="focus-meter__fill" style={{ transform: `scaleX(${focus / 100})` }} />
          </span>
          <span className="focus-meter__value">{Math.round(focus)}</span>
        </div>
        )}
        {objectiveText && <div className="hud__objective">{objectiveText}</div>}
      </div>

      <div className="hud__progress-wrap">
        <div className="hud__progress-label">{strings.hud.progress}</div>
        <div className="hud__progress" role="progressbar" aria-label={strings.hud.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <span className="hud__progress-fill" style={{ transform: `scaleX(${progress})` }} />
          {chaptersOf(getRun()?.level.route).map((c) => (
            <span
              key={c.areaId}
              className={`hud__chapter${progress >= c.at ? ' hud__chapter--reached' : ''}`}
              style={{ left: `${c.at * 100}%` }}
              title={strings.areas[c.areaId]}
            />
          ))}
          <span className="hud__progress-marker" style={{ left: `${progress * 100}%` }} />
        </div>
        {areaId && <div className="hud__progress-chapter">{strings.areas[areaId]}</div>}
      </div>

      <div className="hud__top-right">
        <ScoreMeter />
        {streak > 0 && (
          <div className="hud__chip" title={strings.hud.streakHelp}>
            <span className="hud__chip-icon">✦</span>
            <span className="hud__chip-label">{strings.hud.streak}</span> {streak}
          </div>
        )}
        {starPages > 0 && (
          <div className="hud__chip" title={strings.hud.starPagesHelp}>
            <span className="hud__chip-icon">★</span>
            <span className="hud__chip-label">{strings.hud.starPages}</span> {starPages} / {getRun()?.level.collectibles.length ?? 8}
          </div>
        )}
        {showWpm && liveWpm > 0 && (
          <div className="hud__chip">
            {Math.round(liveWpm)} {strings.hud.wpm}
          </div>
        )}
      </div>

      {areaId && areaCardKey > 0 && (
        <div key={areaCardKey} className="area-card">
          {strings.areas[areaId]}
        </div>
      )}

      {toast && (
        <div key={toast.key} className="toast" role="status">
          <div className="toast__title">{toast.title}</div>
          {toast.detail && <div className="toast__detail">{toast.detail}</div>}
        </div>
      )}

      {saveKey > 0 && (
        <div key={saveKey} className="save-indicator" role="status">
          <span className="save-indicator__icon">✦</span> {strings.hud.saved}
        </div>
      )}

      {hazard && (
        <div key={hazard.key} className={`hazard-telegraph hazard-telegraph--${hazard.attack}`} style={{ animationDuration: `${hazard.windupSec}s` }}>
          <span className="hazard-telegraph__text">{strings.hazards[hazard.attack]}</span>
        </div>
      )}

      {damageKey > 0 && <div key={damageKey} className="damage-glow" aria-hidden="true" />}

      {prompt && <div className="hud__prompt">{strings.prompts[prompt]}</div>}

      <PaintSplats />
      <Popups />
      <SpeedRoundBanner />
      <BossBar />
      <BossCard />
      <MedalCard />
      <PowerUpCard />
      <FlashOverlay />
      <Subtitles />

      <div className="hud__pause-hint">{strings.pause.hint}</div>
      {import.meta.env.DEV && beatId && <div className="hud__debug">beat: {beatId}</div>}
    </div>
  );
}

function Subtitles() {
  const subtitle = useRunStore((s) => s.subtitle);
  if (!subtitle) return null;
  return (
    <div key={subtitle.key} className={`subtitle${subtitle.blocking ? ' subtitle--blocking' : ''}`} role="status" aria-live="polite">
      <div className={`subtitle__speaker subtitle__speaker--${subtitle.speaker}`}>{SPEAKER_NAMES[subtitle.speaker]}</div>
      <div className="subtitle__text">{subtitle.text}</div>
    </div>
  );
}

export function FocusResetOverlay() {
  const active = useRunStore((s) => s.focusReset);
  if (!active) return null;
  return (
    <div className="calm-overlay" role="status">
      <div className="calm-overlay__ring" />
      <div className="calm-overlay__title">{strings.hud.focusReset}</div>
      <div className="calm-overlay__body">{strings.hud.focusResetBody}</div>
    </div>
  );
}

export function ResumeIntroOverlay() {
  const active = useRunStore((s) => s.resumeIntro);
  if (!active) return null;
  return (
    <div className="resume-card" role="status">
      <div className="resume-card__title">{strings.title.welcomeBack}</div>
      <div className="resume-card__body">{strings.title.welcomeBackBody}</div>
    </div>
  );
}

export function ChoicePanel() {
  const choice = useRunStore((s) => s.choice);
  if (!choice) return null;
  const run = getRun();
  const c = strings.choice;

  if (choice.panel === 'controls') {
    return (
      <div className="choice-panel">
        <h2 className="choice-panel__heading">{strings.controls.heading}</h2>
        <table className="controls-table">
          <tbody>
            {strings.controls.rows.map((row) => (
              <tr key={row.keys}>
                <th scope="row"><kbd>{row.keys}</kbd></th>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="choice-panel__hint">{c.back}</div>
      </div>
    );
  }

  if (choice.panel === 'difficulty') {
    const order = ['gentle', 'standard', 'challenge'] as const;
    return (
      <div className="choice-panel">
        <h2 className="choice-panel__heading">{c.difficulty}</h2>
        <div className="choice-panel__options">
          {order.map((d, i) => (
            <button key={d} type="button" className={`choice-option${choice.index === i ? ' choice-option--active' : ''}`} onClick={() => run?.selectChoice(i)}>
              {strings.difficulty[d]}
            </button>
          ))}
        </div>
        <div className="choice-panel__hint">{c.difficultyHint}</div>
      </div>
    );
  }

  return (
    <div className="choice-panel">
      <h2 className="choice-panel__heading">{c.heading}</h2>
      <div className="choice-panel__options">
        {choice.options.map((o, i) => (
          <button key={o.id} type="button" className={`choice-option${choice.index === i ? ' choice-option--active' : ''}`} onClick={() => run?.selectChoice(i)}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="choice-panel__hint">{c.hint}</div>
    </div>
  );
}
