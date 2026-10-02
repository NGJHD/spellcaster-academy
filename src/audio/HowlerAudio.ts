import { Howl, Howler } from 'howler';
import type { MusicId } from '../level/levelTypes';
import { SFX_CATEGORY, SFX_IDS, type SfxId } from './audioCatalog';
import { installAudio, type AudioVolumes } from './AudioManager';
import { MusicEngine } from './MusicEngine';

/** Minimum gap between repeats of the same sound so rapid typing never becomes a wall of noise. */
const MIN_REPEAT_MS = 28;

/**
 * Howler plays the sound effects; the procedural music engine runs on its own AudioContext so the
 * score plays continuously underneath every effect. (Sharing Howler's context silenced the music:
 * Howler can suspend or replace its context, leaving the engine waiting on a dead one.)
 */
/** Diagnostics for the ?test hook: is the music actually sounding? */
export const musicDiagnostics = {
  read: (): { context: string; mood: string | null; level: number } => ({ context: 'none', mood: null, level: 0 }),
};

export function installHowlerAudio(): void {
  Howler.autoSuspend = false;
  const sounds = new Map<SfxId, Howl>();
  const lastPlayed = new Map<SfxId, number>();
  let volumes: AudioVolumes = { master: 0.8, music: 0.6, sfx: 0.8, ui: 0.7 };
  let wantedMusic: MusicId | null = null;

  const musicCtx = new AudioContext();
  const musicMaster = musicCtx.createGain();
  musicMaster.connect(musicCtx.destination);
  const music = new MusicEngine(musicCtx, musicMaster);

  const applyMusicVolume = () => {
    musicMaster.gain.setTargetAtTime(volumes.master, musicCtx.currentTime, 0.05);
    music.setVolume(volumes.music);
  };
  applyMusicVolume();

  const startMusic = () => {
    if (musicCtx.state === 'running') {
      if (music.current === wantedMusic) return;
      music.play(wantedMusic);
      return;
    }
    void musicCtx.resume().then(() => music.play(wantedMusic));
  };

  const load = () => {
    if (sounds.size > 0) return;
    for (const id of SFX_IDS) {
      sounds.set(id, new Howl({ src: [`${import.meta.env.BASE_URL}audio/sfx/${id}.wav`], preload: true }));
    }
  };

  musicDiagnostics.read = () => ({ context: musicCtx.state, mood: music.current, level: music.level() });

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
      if (id === wantedMusic && music.current === id) return;
      wantedMusic = id;
      startMusic();
    },
    setVolumes(v) {
      volumes = v;
      Howler.volume(v.master);
      applyMusicVolume();
    },
    unlock() {
      load();
      void Howler.ctx?.resume();
      startMusic();
    },
  });

  // Browsers only allow audio after a user gesture; keep trying on gestures until both contexts run.
  const gesture = () => {
    load();
    void Howler.ctx?.resume();
    startMusic();
    if (musicCtx.state === 'running') {
      window.removeEventListener('pointerdown', gesture);
      window.removeEventListener('keydown', gesture);
    }
  };
  window.addEventListener('pointerdown', gesture);
  window.addEventListener('keydown', gesture);
  // A hidden tab may suspend the context; resume the music when the player comes back.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') startMusic();
  });
}
