import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/opendyslexic/400.css';
import { App } from './app/App';
import { installHowlerAudio } from './audio/HowlerAudio';
import './styles/global.css';

installHowlerAudio();

// Test hook for Playwright (`?test` only): read-only access to the live run.
if (new URLSearchParams(window.location.search).has('test')) {
  void Promise.all([import('./state/gameStore'), import('./player/RunDriver')]).then(([{ getRun }, { renderStats, debugScene }]) => {
    (window as unknown as { __spellcaster: unknown }).__spellcaster = {
      beat: () => getRun()?.director.currentBeat?.id ?? null,
      area: () => getRun()?.currentAreaId ?? null,
      focus: () => getRun()?.focus ?? null,
      render: () => ({ ...renderStats }),
      scene: () => debugScene.current,
      /** Visible triangles per top-level named group (performance investigation). */
      breakdown: () => {
        const out: Record<string, number> = {};
        debugScene.current?.traverseVisible((o) => {
          const mesh = o as import('three').Mesh;
          if (!mesh.isMesh) return;
          const g = mesh.geometry;
          const tris = (g.index ? g.index.count : (g.attributes.position?.count ?? 0)) / 3;
          let key = mesh.name || '';
          for (let p = mesh.parent; p && !key; p = p.parent) key = p.name;
          key ||= 'unnamed';
          out[key] = (out[key] ?? 0) + Math.round(tris);
        });
        return out;
      },
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
