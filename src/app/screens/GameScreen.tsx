import { useRef } from 'react';
import { GameCanvas } from '../../scene/GameCanvas';
import { useGameStore } from '../../state/gameStore';
import { LabelLayer } from '../../ui/EnemyWordLabel';
import { ChoicePanel, FocusResetOverlay, HUD, ResumeIntroOverlay } from '../../ui/HUD';
import { PauseMenu } from '../../ui/PauseMenu';
import { LoadingScreen } from '../../ui/LoadingScreen';
import { ResultsScreen } from '../../ui/ResultsScreen';
import { useGameInput } from '../../ui/useGameInput';

export function GameScreen() {
  const fadeRef = useRef<HTMLDivElement>(null);
  const mode = useGameStore((s) => s.mode);
  const runId = useGameStore((s) => s.runId);
  useGameInput();

  return (
    <div className="game-screen">
      <GameCanvas key={runId} fadeRef={fadeRef} />
      <LabelLayer />
      {/* Opacity is written directly by the rail camera each frame; never through React state. */}
      <div ref={fadeRef} className="fade-overlay" style={{ opacity: 1 }} aria-hidden="true" />
      {mode !== 'results' && mode !== 'loading' && <HUD />}
      <ChoicePanel />
      <FocusResetOverlay />
      <ResumeIntroOverlay />
      {mode === 'paused' && <PauseMenu />}
      {mode === 'results' && <ResultsScreen />}
      <LoadingScreen />
    </div>
  );
}
