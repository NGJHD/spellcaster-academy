import { useRef } from 'react';
import { GameCanvas } from '../../scene/GameCanvas';
import { useGameStore } from '../../state/gameStore';
import { HUD } from '../../ui/HUD';
import { PauseMenu } from '../../ui/PauseMenu';
import { RouteCompletePanel } from '../../ui/RouteCompletePanel';
import { useGameplayPauseTriggers } from '../../ui/useGameplayPauseTriggers';

export function GameScreen() {
  const fadeRef = useRef<HTMLDivElement>(null);
  const paused = useGameStore((s) => s.mode === 'paused');
  const routeComplete = useGameStore((s) => s.routeComplete);
  useGameplayPauseTriggers();

  return (
    <div className="game-screen">
      <GameCanvas fadeRef={fadeRef} />
      {/* Opacity is written directly by the rail camera each frame; never through React state. */}
      <div ref={fadeRef} className="fade-overlay" style={{ opacity: 1 }} aria-hidden="true" />
      <HUD />
      {routeComplete && !paused && <RouteCompletePanel />}
      {paused && <PauseMenu />}
    </div>
  );
}
