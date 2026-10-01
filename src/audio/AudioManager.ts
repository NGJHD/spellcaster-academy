import type { MusicId } from '../level/levelTypes';
import type { SfxId } from './audioCatalog';

export interface AudioVolumes {
  readonly master: number;
  readonly music: number;
  readonly sfx: number;
  readonly ui: number;
}

/** Game-facing audio API. The game must remain fully playable when every call is a no-op. */
export interface AudioApi {
  playSfx(id: SfxId, options?: { rate?: number; volume?: number }): void;
  setMusic(id: MusicId | null): void;
  setVolumes(volumes: AudioVolumes): void;
  /** Resume the audio context after the first user gesture. */
  unlock(): void;
}

let impl: AudioApi = {
  playSfx: () => {},
  setMusic: () => {},
  setVolumes: () => {},
  unlock: () => {},
};

export const audio: AudioApi = {
  playSfx: (id, options) => impl.playSfx(id, options),
  setMusic: (id) => impl.setMusic(id),
  setVolumes: (v) => impl.setVolumes(v),
  unlock: () => impl.unlock(),
};

export function installAudio(api: AudioApi): void {
  impl = api;
}
