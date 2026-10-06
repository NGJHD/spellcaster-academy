import type { Speaker } from '../content/dialogue';

/** Spoken dialogue (text-to-speech). The game reads subtitles aloud when available; always optional. */
export interface VoiceApi {
  /** Speak a line; returns true if speech started (then `onEnd` fires when it finishes or is cut). */
  speak(text: string, speaker: Speaker, onEnd: () => void): boolean;
  cancel(): void;
}

let impl: VoiceApi = { speak: () => false, cancel: () => {} };

export const voice: VoiceApi = {
  speak: (text, speaker, onEnd) => impl.speak(text, speaker, onEnd),
  cancel: () => impl.cancel(),
};

interface Casting {
  /** Voice-name fragments in order of preference (Edge natural voices first, then common system voices). */
  readonly prefer: readonly string[];
  readonly gender: 'female' | 'male';
  readonly pitch: number;
  readonly rate: number;
}

/**
 * Each character gets their own voice (owner, 2026-10-06): no two speakers share a voice when the
 * system has enough of them; pitch and rate keep them distinct when it does not.
 */
const CASTING: Record<Speaker, Casting> = {
  // The guide orb: bright and young.
  pip: { prefer: ['Ana', 'Maisie', 'Molly', 'Emily', 'Google UK English Female'], gender: 'female', pitch: 1.3, rate: 1.1 },
  // Mira: a brave older student.
  mira: { prefer: ['Libby', 'Sonia', 'Clara', 'Jenny', 'Aria', 'Hazel'], gender: 'female', pitch: 1.05, rate: 1.05 },
  // Keeper Orin: the warm old headmaster (also the game's narrator voice).
  orin: { prefer: ['Ryan', 'George', 'Guy', 'Roger', 'David'], gender: 'male', pitch: 0.85, rate: 0.94 },
  // The Ward Warden: deep and slow stone.
  warden: { prefer: ['Christopher', 'Davis', 'Eric', 'Steffan', 'William'], gender: 'male', pitch: 0.5, rate: 0.84 },
  // The Unwriter: cold and precise.
  unwriter: { prefer: ['Thomas', 'Brian', 'Connor', 'Mitchell', 'Google UK English Male'], gender: 'male', pitch: 0.7, rate: 0.88 },
  // Prefect Idris: a calm senior student.
  idris: { prefer: ['Andrew', 'Liam', 'Alfie', 'Elliot', 'Mark'], gender: 'male', pitch: 1.0, rate: 1.04 },
  // Oarsby the boatman: gruff and cheerful.
  oarsby: { prefer: ['Roger', 'Guy', 'William', 'Prabhat', 'James'], gender: 'male', pitch: 0.78, rate: 0.95 },
  'portrait-1': { prefer: ['Steffan', 'Eric', 'Connor', 'Prabhat'], gender: 'male', pitch: 0.92, rate: 0.98 },
  'portrait-2': { prefer: ['Michelle', 'Emma', 'Ava', 'Natasha', 'Susan'], gender: 'female', pitch: 1.15, rate: 1.0 },
};

/** Order of assignment: main characters choose first. */
const ORDER: readonly Speaker[] = ['pip', 'mira', 'orin', 'warden', 'unwriter', 'idris', 'oarsby', 'portrait-1', 'portrait-2'];

const FEMALE = /female|zira|hazel|susan|libby|sonia|maisie|\bana\b|aria|jenny|emma|\bava\b|michelle|natasha|clara|emily|molly|neerja|catherine|samantha|karen|moira|tessa/i;

/** Assigns a distinct voice to each speaker. Exported for tests. */
export function castVoices<V extends { name: string; lang: string }>(voices: readonly V[]): Partial<Record<Speaker, V>> {
  const english = voices.filter((v) => /^en/i.test(v.lang));
  const used = new Set<V>();
  const cast: Partial<Record<Speaker, V>> = {};
  const take = (v: V | undefined, s: Speaker) => {
    if (!v) return false;
    used.add(v);
    cast[s] = v;
    return true;
  };
  for (const s of ORDER) {
    const c = CASTING[s];
    const free = english.filter((v) => !used.has(v));
    const byName = c.prefer.map((n) => free.find((v) => v.name.toLowerCase().includes(n.toLowerCase()))).find((v) => v !== undefined);
    if (take(byName, s)) continue;
    const byGender = free.find((v) => FEMALE.test(v.name) === (c.gender === 'female'));
    if (take(byGender, s)) continue;
    if (take(free[0], s)) continue;
    // Fewer voices than characters: share, and pitch and rate keep them apart.
    const shared = english.find((v) => FEMALE.test(v.name) === (c.gender === 'female')) ?? english[0];
    if (shared) cast[s] = shared;
  }
  return cast;
}

/**
 * Text as it should be spoken. Words in CAPITALS (subtitle emphasis like "A SNAPVINE!") are read by
 * speech engines as abbreviations, letter by letter (owner bug), so they are spoken in lower case.
 * Dashes and ellipses become short pauses.
 */
export function spokenText(text: string): string {
  return text.replace(/\b[A-Z]{2,}\b/g, (w) => w.toLowerCase()).replace(/[—…]/g, ', ');
}

/** Installs browser speech synthesis (Web Speech API). `settings()` supplies on/off and volume. */
export function installBrowserVoice(settings: () => { enabled: boolean; volume: number }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  let cast: Partial<Record<Speaker, SpeechSynthesisVoice>> = {};
  const refresh = () => {
    cast = castVoices(synth.getVoices());
  };
  refresh();
  synth.addEventListener?.('voiceschanged', refresh);

  impl = {
    speak(text, speaker, onEnd) {
      const s = settings();
      if (!s.enabled || s.volume <= 0) return false;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(spokenText(text));
      const c = CASTING[speaker];
      const v = cast[speaker];
      if (v) u.voice = v;
      u.lang = v?.lang ?? 'en-GB';
      u.pitch = c.pitch;
      u.rate = c.rate;
      u.volume = s.volume;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        onEnd();
      };
      u.onend = finish;
      u.onerror = finish;
      synth.speak(u);
      return true;
    },
    cancel() {
      synth.cancel();
    },
  };
}
