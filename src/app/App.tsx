import { useGameStore } from '../state/gameStore';
import { GameScreen } from './screens/GameScreen';
import { TitleScreen } from './screens/TitleScreen';

export function App() {
  const onTitle = useGameStore((s) => s.mode === 'menu');
  return onTitle ? <TitleScreen /> : <GameScreen />;
}
