import { useMemo, useState } from 'react';
import { audio } from '../../audio/AudioManager';
import { strings } from '../../content/strings';
import { readProfile } from '../../game/saveData';
import { LEVEL_ORDER, levelOfArea, type Difficulty, type LevelId } from '../../game/types';
import { gameStorage, readResumableSave, useGameStore } from '../../state/gameStore';
import { ControlsPanel, SettingsPanel } from '../../ui/SettingsPanel';

type Panel = 'none' | 'confirm' | 'difficulty' | 'settings' | 'credits' | 'controls' | 'chapters';

const DIFFICULTIES: readonly Difficulty[] = ['gentle', 'standard', 'challenge'];

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}

/** Title screen: exactly two primary options, START and RESUME. */
export function TitleScreen() {
  const startNewRun = useGameStore((s) => s.startNewRun);
  const resumeSavedRun = useGameStore((s) => s.resumeSavedRun);
  const [panel, setPanel] = useState<Panel>('none');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const save = useMemo(() => readResumableSave(), []);
  const profile = useMemo(() => readProfile(gameStorage()), []);
  const t = strings.title;
  // START plays the next chapter not yet completed (Level 1 when none or all are done, §5).
  const nextUnbeaten = LEVEL_ORDER.find((l) => !profile.completedLevels.includes(l)) ?? 'level-1';
  const [level, setLevel] = useState<LevelId>(nextUnbeaten);
  const unlocked = (l: LevelId) => l === 'level-1' || profile.completedLevels.includes(LEVEL_ORDER[LEVEL_ORDER.indexOf(l) - 1] ?? 'level-1');

  const onStart = (chosen: LevelId = nextUnbeaten) => {
    audio.unlock();
    setLevel(chosen);
    setPanel(save ? 'confirm' : 'difficulty');
  };

  return (
    <main className="title-screen">
      <div className="title-screen__sky" aria-hidden="true">
        <div className="title-screen__tower" />
        <div className="title-screen__ward" />
      </div>
      {panel === 'none' && (
        <div className="title-screen__panel">
          <h1 className="title-screen__heading">
            <span className="title-screen__game">{t.game}</span>
            <span className="title-screen__subtitle">{t.subtitle}</span>
          </h1>
          <nav className="title-screen__options">
            <button type="button" className="menu-button menu-button--primary" onClick={() => onStart()} autoFocus>
              {/* Say which level START begins (owner: "why did I end up at level 2?" — Level 1 was already complete) */}
              {nextUnbeaten === 'level-1' ? t.start : t.startLevel(strings.levels[nextUnbeaten].number)}
            </button>
            <button
              type="button"
              className="menu-button menu-button--primary"
              disabled={!save}
              aria-describedby="resume-caption"
              onClick={() => {
                audio.unlock();
                resumeSavedRun();
              }}
            >
              {t.resume}
            </button>
            <div id="resume-caption" className="title-screen__caption">
              {save ? (
                <>
                  <div>{strings.levels[levelOfArea(save.areaId)].number} · {strings.areas[save.areaId]}</div>
                  <div>{strings.difficulty[save.difficulty]} difficulty</div>
                  <div>{t.lastSaved(timeAgo(save.savedAtIso))}</div>
                </>
              ) : (
                t.noResume
              )}
            </div>
          </nav>
          {profile.levelCompleted && (
            <div className="title-screen__crest">
              <span className="title-screen__crest-icon">✦</span> {t.levelComplete}
              {profile.completedLevels.length > 1 && <div className="title-screen__best">{t.completedLevels(profile.completedLevels.length)}</div>}
              {profile.bestResults && (
                <div className="title-screen__best">
                  {t.best(Math.round(profile.bestResults.bestAverageWpm), Math.round(profile.bestResults.bestAccuracy))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {panel === 'confirm' && (
        <div className="modal-panel title-modal">
          <h2 className="modal-panel__heading">{level === 'level-1' ? t.confirmHeading : t.confirmLevel(strings.levels[level].number)}</h2>
          <p className="modal-panel__note">{t.confirmBody}</p>
          <div className="modal-panel__buttons">
            <button type="button" className="menu-button" onClick={() => setPanel('difficulty')} autoFocus>{t.confirmStart}</button>
            <button type="button" className="menu-button menu-button--quiet" onClick={() => setPanel('none')}>{t.cancel}</button>
          </div>
        </div>
      )}

      {panel === 'difficulty' && (
        <div className="modal-panel title-modal">
          <h2 className="modal-panel__heading">{t.chooseDifficulty}</h2>
          <div className="difficulty-options" role="radiogroup" aria-label={t.chooseDifficulty}>
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" role="radio" aria-checked={difficulty === d} className="difficulty-option" onClick={() => setDifficulty(d)}>
                <span className="difficulty-option__name">{strings.difficulty[d]}</span>
                <span className="difficulty-option__help">{strings.difficultyHelp[d]}</span>
              </button>
            ))}
          </div>
          <div className="modal-panel__buttons">
            <button type="button" className="menu-button menu-button--primary" onClick={() => startNewRun(difficulty, level)} autoFocus>{t.begin}</button>
            <button type="button" className="menu-button menu-button--quiet" onClick={() => setPanel('none')}>{t.cancel}</button>
          </div>
        </div>
      )}

      {panel === 'chapters' && (
        <div className="modal-panel title-modal">
          <h2 className="modal-panel__heading">{t.chaptersHeading}</h2>
          <div className="difficulty-options">
            {LEVEL_ORDER.map((l) => (
              <button key={l} type="button" className="difficulty-option" disabled={!unlocked(l)} onClick={() => onStart(l)}>
                <span className="difficulty-option__name">{strings.levels[l].number}: {strings.levels[l].name}</span>
                <span className="difficulty-option__help">{unlocked(l) ? (profile.completedLevels.includes(l) ? '✦' : '') : t.locked}</span>
              </button>
            ))}
          </div>
          <button type="button" className="menu-button menu-button--quiet" onClick={() => setPanel('none')} autoFocus>{t.cancel}</button>
        </div>
      )}

      {panel === 'settings' && (
        <div className="modal-panel title-modal">
          <SettingsPanel onBack={() => setPanel('none')} />
        </div>
      )}
      {panel === 'controls' && (
        <div className="modal-panel title-modal">
          <ControlsPanel onBack={() => setPanel('none')} />
        </div>
      )}
      {panel === 'credits' && (
        <div className="modal-panel title-modal">
          <h2 className="modal-panel__heading">{strings.credits.heading}</h2>
          {strings.credits.lines.map((l) => (
            <p key={l} className="modal-panel__note">{l}</p>
          ))}
          <button type="button" className="menu-button" onClick={() => setPanel('none')} autoFocus>{strings.credits.close}</button>
        </div>
      )}

      {panel === 'none' && (
        <div className="title-screen__icons">
          <button type="button" className="icon-button" onClick={() => setPanel('chapters')} aria-label={t.chapters} title={t.chapters}>❖</button>
          <button type="button" className="icon-button" onClick={() => setPanel('settings')} aria-label={t.settings} title={t.settings}>⚙</button>
          <button type="button" className="icon-button" onClick={() => setPanel('controls')} aria-label={strings.controls.heading} title={strings.controls.heading}>⌨</button>
          <button type="button" className="icon-button" onClick={() => setPanel('credits')} aria-label={t.credits} title={t.credits}>✎</button>
          <button
            type="button"
            className="icon-button"
            aria-label={t.fullScreen}
            title={t.fullScreen}
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void document.documentElement.requestFullscreen?.();
            }}
          >
            ⛶
          </button>
        </div>
      )}
    </main>
  );
}
