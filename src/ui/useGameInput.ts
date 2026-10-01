import { useEffect } from 'react';
import { audio } from '../audio/AudioManager';
import { getRun, isGameplayActive, useGameStore } from '../state/gameStore';
import { useRunStore } from '../state/runStore';
import { interpretKey, shouldPreventDefault } from '../typing/keys';

/** The pre-boss choice uses Escape to close its sub-panels rather than pausing. */
function choiceSubPanelOpen(): boolean {
  const choice = useRunStore.getState().choice;
  return choice !== null && choice.panel !== 'none';
}

/**
 * Gameplay keyboard handling. Keys are read only while gameplay is active — never while a menu,
 * the pause screen or results are open (§9). Escape pauses; losing focus or hiding the tab also
 * pauses so a child never returns to an encounter that kept running without them.
 */
export function useGameInput(): void {
  useEffect(() => {
    const pauseIfPlaying = () => {
      const { mode, pause } = useGameStore.getState();
      if (isGameplayActive(mode)) pause();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isGameplayActive(useGameStore.getState().mode)) return;
      audio.unlock();
      const intent = interpretKey(e);
      const run = getRun();
      if (intent.kind === 'escape') {
        e.preventDefault();
        if (run && choiceSubPanelOpen()) run.handleIntent(intent);
        else pauseIfPlaying();
        return;
      }
      if (shouldPreventDefault(e) || intent.kind === 'enter') e.preventDefault();
      if (intent.kind !== 'ignored') run?.handleIntent(intent);
    };

    const onVisibility = () => {
      if (!document.hidden) return;
      getRun()?.suspend();
      pauseIfPlaying();
    };
    const onPageHide = () => getRun()?.suspend();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', pauseIfPlaying);
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', pauseIfPlaying);
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
