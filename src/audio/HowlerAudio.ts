import { Howl, Howler } from 'howler';
import type { MusicId } from '../level/levelTypes';
import { SFX_CATEGORY, SFX_IDS, type SfxId } from './audioCatalog';
import { installAudio, type AudioVolumes } from './AudioManager';
import { MusicEngine } from './MusicEngine';

/** Minimum gap between repeats of the same sound so rapid typing never becomes a wall of noise. */
const MIN_REPEAT_MS = 28;

/** Howler-backed sound effects plus the procedural music engine, sharing Howler's master gain. */
export function installHowlerAudio(): void {
  const sounds = new Map<SfxId, Howl>();
  const lastPlayed = new Map<SfxId, number>();
  let volumes: AudioVolumes = { master: 0.8, music: 0.6, sfx: 0.8, ui: 0.7 };
  let music: MusicEngine | null = null;
  let wantedMusic: MusicId | null = null;

  const load = () => {
    if (sounds.size > 0) return;
    for (const id of SFX_IDS) {
      sounds.set(id, new Howl({ src: [`${import.meta.env.BASE_URL}audio/sfx/${id}.wav`], preload: true }));
    }
  };

  const musicEngine = (): MusicEngine | null => {
    if (music) return music;
    const ctx = Howler.ctx;
    if (!ctx) return null;
    music = new MusicEngine(ctx, Howler.masterGain);
    music.setVolume(volumes.music);
    return music;
  };

  installAudio({
    playSfx(id, options) {
      load();
      const now = performance.now();
      if (now - (lastPlayed.get(id) ?? 0) < MIN_REPEAT_MS) return;
      lastPlayed.set(id, now);
      const howl = sounds.get(id);
      if (!howl) return;
      const category = SFX_CATEGORY[id];
      const playId = howl.play();
      howl.volume((category === 'ui' ? volumes.ui : volumes.sfx) * (options?.volume ?? 1), playId);
      if (options?.rate) howl.rate(options.rate, playId);
    },
    setMusic(id) {
      wantedMusic = id;
      musicEngine()?.play(id);
    },
    setVolumes(v) {
      volumes = v;
      Howler.volume(v.master);
      music?.setVolume(v.music);
    },
    unlock() {
      load();
      const ctx = Howler.ctx;
      if (ctx && ctx.state === 'suspended') {
        void ctx.resume().then(() => {
          const engine = musicEngine();
          engine?.play(wantedMusic);
        });
      } else {
        const engine = musicEngine();
        if (engine && wantedMusic) engine.resume();
      }
    },
  });

  // Browsers only allow audio after a user gesture.
  const firstGesture = () => {
    window.removeEventListener('pointerdown', firstGesture);
    window.removeEventListener('keydown', firstGesture);
    load();
    const ctx = Howler.ctx;
    void ctx?.resume().then(() => musicEngine()?.play(wantedMusic));
  };
  window.addEventListener('pointerdown', firstGesture);
  window.addEventListener('keydown', firstGesture);
}
