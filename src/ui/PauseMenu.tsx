import { useEffect, useState } from 'react';
import { strings } from '../content/strings';
import { useGameStore } from '../state/gameStore';
import type { TravelSpeed } from '../state/settings';
import { useSettingsStore } from '../state/settingsStore';

type Panel = 'main' | 'controls' | 'settings';

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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pause-heading">
      <div className="modal-panel">
        {panel === 'main' && (
          <>
            <h2 id="pause-heading" className="modal-panel__heading">{t.heading}</h2>
            <div className="modal-panel__buttons">
              <button type="button" className="menu-button" onClick={resume} autoFocus>{t.resume}</button>
              <button type="button" className="menu-button" onClick={() => setPanel('controls')}>{t.controls}</button>
              <button type="button" className="menu-button" onClick={() => setPanel('settings')}>{t.settings}</button>
              <button type="button" className="menu-button menu-button--quiet" onClick={quitToMenu}>{t.returnToTitle}</button>
            </div>
          </>
        )}
        {panel === 'controls' && <ControlsPanel onBack={() => setPanel('main')} />}
        {panel === 'settings' && <SettingsPanel onBack={() => setPanel('main')} />}
      </div>
    </div>
  );
}

function ControlsPanel({ onBack }: { onBack: () => void }) {
  const c = strings.controls;
  return (
    <>
      <h2 id="pause-heading" className="modal-panel__heading">{c.heading}</h2>
      <table className="controls-table">
        <tbody>
          {c.rows.map((row) => (
            <tr key={row.keys}>
              <th scope="row"><kbd>{row.keys}</kbd></th>
              <td>{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="modal-panel__note">{c.note}</p>
      <button type="button" className="menu-button" onClick={onBack} autoFocus>{strings.pause.back}</button>
    </>
  );
}

const TRAVEL_SPEEDS: readonly TravelSpeed[] = ['slow', 'normal', 'fast'];

function SettingsPanel({ onBack }: { onBack: () => void }) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const travelSpeed = useSettingsStore((s) => s.travelSpeed);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const setTravelSpeed = useSettingsStore((s) => s.setTravelSpeed);
  const s = strings.settings;

  return (
    <>
      <h2 id="pause-heading" className="modal-panel__heading">{s.heading}</h2>
      <div className="setting-row">
        <div>
          <div className="setting-row__label" id="reduced-motion-label">{s.reducedMotion}</div>
          <div className="setting-row__help">{s.reducedMotionHelp}</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={reducedMotion}
          aria-labelledby="reduced-motion-label"
          className="toggle"
          onClick={() => setReducedMotion(!reducedMotion)}
          autoFocus
        >
          {reducedMotion ? s.on : s.off}
        </button>
      </div>
      <div className="setting-row">
        <div className="setting-row__label" id="travel-speed-label">{s.travelSpeed}</div>
        <div className="segmented" role="radiogroup" aria-labelledby="travel-speed-label">
          {TRAVEL_SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              role="radio"
              aria-checked={travelSpeed === speed}
              className="segmented__option"
              onClick={() => setTravelSpeed(speed)}
            >
              {s.travelSpeeds[speed]}
            </button>
          ))}
        </div>
      </div>
      <button type="button" className="menu-button" onClick={onBack}>{strings.pause.back}</button>
    </>
  );
}
