import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/opendyslexic/400.css';
import { App } from './app/App';
import { installHowlerAudio } from './audio/HowlerAudio';
import './styles/global.css';

installHowlerAudio();

// Test hook for Playwright (`?test` only): read-only access to the live run.
if (new URLSearchParams(window.location.search).has('test')) {
  void import('./state/gameStore').then(({ getRun }) => {
    (window as unknown as { __spellcaster: unknown }).__spellcaster = {
      beat: () => getRun()?.director.currentBeat?.id ?? null,
      area: () => getRun()?.currentAreaId ?? null,
      focus: () => getRun()?.focus ?? null,
    };
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
