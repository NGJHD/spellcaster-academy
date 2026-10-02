import { useEffect, useState } from 'react';
import { strings } from '../content/strings';
import type { Difficulty } from '../game/types';
import { getRun, useGameStore } from '../state/gameStore';
import { ControlsPanel, SettingsPanel } from './SettingsPanel';

type Panel = 'main' | 'controls' | 'settings' | 'difficulty';

const DIFFICULTIES: readonly Difficulty[] = ['gentle', 'standard', 'challenge'];

export function PauseMenu() {
  const [panel, setPanel] = useState<Panel>('main');
  const resume = useGameStore((s) => s.resume);
  const quitToMenu = useGameStore((s) => s.quitToMenu);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (panel === 'main') resume();
      else setPanel('main');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [panel, resume]);

  const t = strings.pause;
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={t.heading}>
      <div className="modal-panel">
        {panel === 'main' && (
          <>
            <h2 className="modal-panel__heading">{t.heading}</h2>
            <div className="modal-panel__buttons">
              <button type="button" className="menu-button" onClick={() => setPanel('controls')}>{t.controls}</button>
              <button type="button" className="menu-button" onClick={() => setPanel('settings')}>{t.settings}</button>
              <button type="button" className="menu-button" onClick={() => setPanel('difficulty')}>{t.difficulty}</button>
            </div>
            <div className="modal-panel__footer">
              <button type="button" className="menu-button menu-button--danger" onClick={quitToMenu}>{t.returnToTitle}</button>
              <button type="button" className="menu-button menu-button--primary" onClick={resume} autoFocus>{t.resume}</button>
            </div>
          </>
        )}
        {panel === 'controls' && <ControlsPanel onBack={() => setPanel('main')} />}
        {panel === 'settings' && <SettingsPanel onBack={() => setPanel('main')} />}
        {panel === 'difficulty' && <DifficultyPanel onBack={() => setPanel('main')} />}
      </div>
    </div>
  );
}

function DifficultyPanel({ onBack }: { onBack: () => void }) {
  const run = getRun();
  const [current, setCurrent] = useState<Difficulty>(run?.difficulty ?? 'standard');
  const [assist, setAssist] = useState<boolean>(run?.assist ?? false);
  const locked = run ? !run.canChangeDifficulty : true;

  const choose = (d: Difficulty) => {
    if (!run || locked) return;
    run.setDifficulty(d);
    setCurrent(d);
  };

  return (
    <>
      <h2 className="modal-panel__heading">{strings.pause.difficulty}</h2>
      {locked && <p className="modal-panel__note">{strings.pause.difficultyLocked}</p>}
      <div className="difficulty-options" role="radiogroup" aria-label={strings.pause.difficulty}>
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={current === d}
            disabled={locked}
            className="difficulty-option"
            onClick={() => choose(d)}
          >
            <span className="difficulty-option__name">{strings.difficulty[d]}</span>
            <span className="difficulty-option__help">{strings.difficultyHelp[d]}</span>
          </button>
        ))}
      </div>
      <div className="setting-row">
        <div className="setting-row__label">{strings.pause.assist}</div>
        <button
          type="button"
          role="switch"
          aria-checked={assist}
          className="toggle"
          onClick={() => {
            if (!run) return;
            run.setAssist(!assist);
            setAssist(!assist);
          }}
        >
          {assist ? strings.settings.on : strings.settings.off}
        </button>
      </div>
      <button type="button" className="menu-button" onClick={onBack} autoFocus>{strings.pause.back}</button>
    </>
  );
}
