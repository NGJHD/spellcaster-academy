import { SPEAKER_NAMES } from '../content/dialogue';
import { strings } from '../content/strings';
import { getRun } from '../state/gameStore';
import { useRunStore } from '../state/runStore';
import { useSettingsStore } from '../state/settingsStore';

/** HUD (GD-19): Focus, objective, streak, star pages, subtitles, prompts and short notices only. */
export function HUD() {
  const areaId = useRunStore((s) => s.areaId);
  const areaCardKey = useRunStore((s) => s.areaCardKey);
  const focus = useRunStore((s) => s.focus);
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
  const showWpm = useSettingsStore((s) => s.showWpm);
  const objectiveText = objective ? strings.objectives[objective] : null;

  return (
    <div className="hud">
      <div className="hud__top-left">
        <div className="focus-meter" role="meter" aria-label={strings.hud.focus} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(focus)}>
          <span className="focus-meter__label">{strings.hud.focus}</span>
          <span className="focus-meter__track">
            <span className="focus-meter__fill" style={{ transform: `scaleX(${focus / 100})` }} />
          </span>
        </div>
        {objectiveText && <div className="hud__objective">{objectiveText}</div>}
      </div>

      <div className="hud__top-right">
        {streak > 0 && (
          <div className="hud__chip" aria-label={strings.hud.streak}>
            <span className="hud__chip-icon">✦</span> {streak}
          </div>
        )}
        {starPages > 0 && (
          <div className="hud__chip" aria-label={strings.hud.starPages}>
            <span className="hud__chip-icon">★</span> {starPages} / 8
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
      {subtitle.blocking && <div className="subtitle__continue">{strings.hud.pressEnter}</div>}
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
