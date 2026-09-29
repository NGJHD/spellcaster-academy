import { useEffect } from 'react';
import { isGameplayActive, useGameStore } from '../state/gameStore';

/**
 * Escape pauses during gameplay. Losing focus or hiding the tab also pauses,
 * so a child never returns to an encounter that kept running without them.
 * While paused, Escape is handled by the pause menu itself.
 */
export function useGameplayPauseTriggers(): void {
  useEffect(() => {
    const pauseIfPlaying = () => {
      const { mode, pause } = useGameStore.getState();
      if (isGameplayActive(mode)) pause();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isGameplayActive(useGameStore.getState().mode)) return;
      e.preventDefault();
      pauseIfPlaying();
    };
    const onVisibility = () => {
      if (document.hidden) pauseIfPlaying();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', pauseIfPlaying);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', pauseIfPlaying);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
