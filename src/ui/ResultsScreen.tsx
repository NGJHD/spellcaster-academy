import { strings } from '../content/strings';
import { LEVEL_ORDER } from '../game/types';
import { nextLevel } from '../level/levels';
import type { ResultsData } from '../game/scoring';
import { readProfile } from '../game/saveData';
import { gameStorage, useGameStore } from '../state/gameStore';
import { useRunStore } from '../state/runStore';

const fmtSeconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
const fmtClock = (ms: number) => {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

function rows(r: ResultsData): { group: keyof typeof strings.results.groups; label: string; value: string }[] {
  const t = strings.results.metrics;
  return [
    { group: 'speed', label: t.averageWpm, value: `${Math.round(r.averageWpm)} WPM` },
    { group: 'speed', label: t.peakWpm, value: r.peakWpm === null ? strings.results.none : `${Math.round(r.peakWpm)} WPM` },
    { group: 'speed', label: t.avgWord, value: r.averageWordMs > 0 ? fmtSeconds(r.averageWordMs) : strings.results.none },
    {
      group: 'speed',
      label: t.fastest,
      value: r.fastestWord ? `${r.fastestWord.word} · ${fmtSeconds(r.fastestWord.ms)}` : strings.results.none,
    },
    { group: 'speed', label: t.activeTime, value: fmtClock(r.activeTypingMs) },
    { group: 'accuracy', label: t.accuracy, value: `${Math.round(r.accuracy)}%` },
    { group: 'accuracy', label: t.firstAttempt, value: `${Math.round(r.firstAttemptAccuracy)}%` },
    { group: 'accuracy', label: t.correct, value: String(r.correctEntries) },
    { group: 'accuracy', label: t.incorrect, value: String(r.incorrectEntries) },
    { group: 'accuracy', label: t.corrected, value: String(r.correctedMistakes) },
    { group: 'accuracy', label: t.perfect, value: String(r.perfectWords) },
    { group: 'accuracy', label: t.streak, value: String(r.bestStreak) },
    { group: 'journey', label: t.words, value: String(r.completedWords) },
    { group: 'journey', label: t.levelTime, value: fmtClock(r.levelTimeMs) },
    { group: 'journey', label: t.optional, value: String(r.optionalTargets) },
    { group: 'journey', label: t.focusLost, value: String(r.focusLost) },
    { group: 'journey', label: t.restarts, value: String(r.checkpointRestarts) },
    { group: 'journey', label: t.difficulty, value: strings.difficulty[r.difficulty] },
  ];
}

/** After Level 3 (L3-17): each chapter's best, with positive framing only. */
function CampaignSummary() {
  const profile = readProfile(gameStorage());
  const t = strings.results;
  const rows = LEVEL_ORDER.map((id) => ({ id, best: profile.bestByLevel[id] })).filter((r) => r.best);
  if (rows.length === 0) return null;
  const first = rows[0]?.best?.bestAccuracy ?? 0;
  const last = rows.at(-1)?.best?.bestAccuracy ?? 0;
  return (
    <section className="results__campaign" aria-label={t.campaign}>
      <h2 className="results__campaign-heading">{t.campaign}</h2>
      {rows.map(({ id, best }) => (
        <div key={id} className="results__campaign-row">
          <span>{strings.levels[id].number}</span>
          <span>{Math.round(best?.bestAverageWpm ?? 0)} WPM</span>
          <span>{Math.round(best?.bestAccuracy ?? 0)}%</span>
          <span>{best?.fastestLevelMs ? fmtClock(best.fastestLevelMs) : '—'}</span>
        </div>
      ))}
      {last > first && <p className="results__subheading">{t.campaignRise(Math.round(first), Math.round(last))}</p>}
    </section>
  );
}

/** LD-19 completion screen: encouraging, no grades, no comparisons. */
export function ResultsScreen() {
  const results = useRunStore((s) => s.results);
  const startNewRun = useGameStore((s) => s.startNewRun);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  if (!results) return null;
  const t = strings.results;
  const all = rows(results);
  const levelNumber = LEVEL_ORDER.indexOf(results.levelId) + 1;
  const next = nextLevel(results.levelId);

  return (
    <div className="results" role="dialog" aria-labelledby="results-heading">
      <div className="results__panel">
        <header className="results__header">
          <h1 id="results-heading" className="results__heading">{t.headingFor(levelNumber)}</h1>
          <p className="results__subheading">{strings.levels[results.levelId].name}</p>
          {!next && results.levelId === 'level-3' && <p className="results__subheading">{t.campaignDone}</p>}
          <div className="results__rank">
            <span className="results__rank-label">{t.rank}</span>
            <span className="results__rank-title">{results.rank}</span>
          </div>
        </header>
        {results.medals.fights > 0 && (
          <div className="results__medals" aria-label={t.medals}>
            <span className="results__medal-stars" aria-hidden="true">
              {'★'.repeat(Math.max(1, Math.round((results.medals.stars / (results.medals.fights * 3)) * 5)))}
            </span>
            <span>
              {t.medals}: {t.medalSummary(results.medals.stars, results.medals.fights * 3, results.medals.perfect)}
            </span>
          </div>
        )}
        {results.levelId === 'level-3' && <CampaignSummary />}
        <ul className="results__messages">
          {results.messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <div className="results__grid">
          {(Object.keys(t.groups) as (keyof typeof t.groups)[]).map((group) => (
            <section key={group} className="results__group">
              <h2>{t.groups[group]}</h2>
              <dl>
                {all
                  .filter((r) => r.group === group)
                  .map((r) => (
                    <div key={r.label} className="results__row">
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
              </dl>
            </section>
          ))}
        </div>
        <div className="results__footer">
          <div>
            {t.score}: <strong>{results.score}</strong>
          </div>
          {results.newCosmetics.length > 0 && (
            <div>
              {t.newCosmetics}: {results.newCosmetics.map((c) => strings.cosmetics[c]).join(', ')}
            </div>
          )}
        </div>
        <div className="results__actions">
          {next && (
            <button type="button" className="menu-button menu-button--primary" onClick={() => startNewRun(results.difficulty, next)} autoFocus>
              {t.nextLevel(levelNumber + 1)}
            </button>
          )}
          <button type="button" className={`menu-button ${next ? '' : 'menu-button--primary'}`} onClick={() => startNewRun(results.difficulty, results.levelId)} autoFocus={!next}>
            {t.playAgainFor(levelNumber)}
          </button>
          <button type="button" className="menu-button menu-button--quiet" onClick={quitToMenu}>
            {t.returnToTitle}
          </button>
        </div>
      </div>
    </div>
  );
}
