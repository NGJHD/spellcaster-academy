import { lazy, Suspense, useEffect } from 'react';
import { audio } from '../audio/AudioManager';
import { useGameStore } from '../state/gameStore';
import { FONT_SCALE } from '../state/settings';
import { useSettingsStore } from '../state/settingsStore';
import { GameScreen } from './screens/GameScreen';
import { TitleScreen } from './screens/TitleScreen';

/** Applies accessibility settings as root classes / CSS variables and keeps audio volumes in sync. */
function useGlobalSettings(): void {
  const fontSize = useSettingsStore((s) => s.fontSize);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const dyslexiaFont = useSettingsStore((s) => s.dyslexiaFont);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const volumes = useSettingsStore((s) => s.volumes);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-scale', String(FONT_SCALE[fontSize]));
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('dyslexia-font', dyslexiaFont);
    root.classList.toggle('reduced-motion', reducedMotion);
  }, [fontSize, highContrast, dyslexiaFont, reducedMotion]);

  useEffect(() => {
    audio.setVolumes(volumes);
  }, [volumes]);
}

/** Development asset viewer at /dev/assets (§14.7), loaded on demand. */
const AssetViewer = lazy(() => import('../dev/AssetViewer').then((m) => ({ default: m.AssetViewer })));
const IS_ASSET_VIEWER = window.location.pathname.replace(/\/+$/, '').endsWith('/dev/assets');

export function App() {
  if (IS_ASSET_VIEWER) {
    return (
      <Suspense fallback={null}>
        <AssetViewer />
      </Suspense>
    );
  }
  return <Game />;
}

function Game() {
  const onTitle = useGameStore((s) => s.mode === 'menu');
  useGlobalSettings();

  useEffect(() => {
    if (onTitle) audio.setMusic('title');
  }, [onTitle]);

  return onTitle ? <TitleScreen /> : <GameScreen />;
}
