import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { installHowlerAudio, musicDiagnostics } from './audio/HowlerAudio';
import { installBrowserVoice, musicDuckFor } from './audio/voice';
import { audio } from './audio/AudioManager';
import { useRunStore } from './state/runStore';
import { getSettings } from './state/settingsStore';
import './styles/global.css';

installHowlerAudio();
// Soften the music whenever a line of dialogue is on screen (spoken or not).
useRunStore.subscribe((state, prev) => {
  if ((state.subtitle === null) !== (prev.subtitle === null) || state.subtitle?.speaker !== prev.subtitle?.speaker) {
    audio.duckMusic(state.subtitle !== null, state.subtitle ? musicDuckFor(state.subtitle.speaker) : undefined);
  }
});
installBrowserVoice(() => {
  const s = getSettings();
  return { enabled: s.spokenDialogue, volume: s.volumes.voice * s.volumes.master };
});

// Test hook for Playwright (`?test` only): read-only access to the live run.
if (new URLSearchParams(window.location.search).has('test')) {
  void Promise.all([import('./state/gameStore'), import('./player/RunDriver'), import('./state/runStore'), import('./scene/LightPool')]).then(([{ getRun }, { renderStats, debugScene, debugCamera, debugGl, debugView }, { useRunStore }, { poolStats }]) => {
    (window as unknown as { __spellcaster: unknown }).__spellcaster = {
      beat: () => getRun()?.director.currentBeat?.id ?? null,
      /** Words on screen, the subtitle and any choice (for scripted play-throughs). */
      labels: () => useRunStore.getState().labels.map((l) => ({ id: l.id, word: l.word, locked: l.locked, done: l.locked ? l.correctLength : l.pendingPrefix })),
      subtitle: () => useRunStore.getState().subtitle,
      choice: () => useRunStore.getState().choice !== null,
      music: () => musicDiagnostics.read(),
      area: () => getRun()?.currentAreaId ?? null,
      focus: () => getRun()?.focus ?? null,
      /** The live encounter's targets (id, phase, world position). */
      targets: () => [...(getRun()?.encounter?.targets.values() ?? [])].map((t) => ({ id: t.id, phase: t.phase, at: t.position.toArray().map((v) => Math.round(v * 10) / 10), attack: t.attackPhase })),
      render: () => ({ ...renderStats, poolLights: poolStats.live }),
      /** Plays a spectacle effect, by default a few metres in front of the camera (checking effects). */
      fx: (cue: import('./level/levelTypes').FxCue) => (getRun() as unknown as { emitFx(c: import('./level/levelTypes').FxCue): void } | null)?.emitFx(cue),
      scene: () => debugScene.current,
      camera: () => debugCamera.current,
      flag: (name: string) => getRun()?.flags.add(name),
      view: (position: [number, number, number] | null, lookAt?: [number, number, number]) => {
        debugView.current = position && lookAt ? { position, lookAt } : null;
      },
      /** Shader programs compiled so far (name and a short key), to find what compiles late. */
      programs: () => (debugGl.current?.info.programs ?? []).map((p) => `${p.name} ${String(p.cacheKey).length}`),
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
