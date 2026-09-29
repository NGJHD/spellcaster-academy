import { strings } from '../../content/strings';
import { useGameStore } from '../../state/gameStore';

export function TitleScreen() {
  const startLevel = useGameStore((s) => s.startLevel);
  const t = strings.title;

  return (
    <main className="title-screen">
      <div className="title-screen__panel">
        <h1 className="title-screen__heading">
          <span className="title-screen__game">{t.game}</span>
          <span className="title-screen__subtitle">{t.subtitle}</span>
        </h1>
        <nav className="title-screen__options">
          <button type="button" className="menu-button menu-button--primary" onClick={startLevel} autoFocus>
            {t.start}
          </button>
          {/* Autosave arrives with checkpoint persistence (Milestone 3). */}
          <button type="button" className="menu-button menu-button--primary" disabled aria-describedby="resume-caption">
            {t.resume}
          </button>
          <p id="resume-caption" className="title-screen__caption">
            {t.noResume}
          </p>
        </nav>
      </div>
      <p className="title-screen__build">{t.buildLabel}</p>
    </main>
  );
}
