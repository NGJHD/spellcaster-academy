import { strings } from '../content/strings';
import { useGameStore } from '../state/gameStore';

/** Temporary end card for the Milestone 1 preview route. */
export function RouteCompletePanel() {
  const startLevel = useGameStore((s) => s.startLevel);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  const t = strings.routeComplete;

  return (
    <div className="modal-backdrop modal-backdrop--light" role="dialog" aria-labelledby="route-complete-heading">
      <div className="modal-panel">
        <h2 id="route-complete-heading" className="modal-panel__heading">{t.heading}</h2>
        <p className="modal-panel__note">{t.body}</p>
        <div className="modal-panel__buttons">
          <button type="button" className="menu-button" onClick={startLevel} autoFocus>{t.replay}</button>
          <button type="button" className="menu-button menu-button--quiet" onClick={quitToMenu}>{t.returnToTitle}</button>
        </div>
      </div>
    </div>
  );
}
