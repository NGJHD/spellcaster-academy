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

/** Per-character delivery so each voice is recognisable even with one synthesiser voice. */
const DELIVERY: Record<Speaker, { pitch: number; rate: number; prefer: RegExp }> = {
  pip: { pitch: 1.55, rate: 1.12, prefer: /female|zira|hazel|susan|libby|sonia|maisie/i },
  mira: { pitch: 1.25, rate: 1.05, prefer: /female|hazel|libby|sonia|susan|zira/i },
  orin: { pitch: 0.75, rate: 0.92, prefer: /male|george|ryan|thomas|david|daniel|alfie/i },
  'portrait-1': { pitch: 0.95, rate: 0.98, prefer: /male|george|ryan|david/i },
  'portrait-2': { pitch: 1.15, rate: 1.0, prefer: /female|hazel|susan|sonia/i },
  warden: { pitch: 0.4, rate: 0.82, prefer: /male|george|ryan|david/i },
  unwriter: { pitch: 0.55, rate: 0.85, prefer: /male|george|ryan|david|daniel/i },
};

/** Installs browser speech synthesis (Web Speech API). `settings()` supplies on/off and volume. */
export function installBrowserVoice(settings: () => { enabled: boolean; volume: number }): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  let voices: SpeechSynthesisVoice[] = [];
  const refresh = () => {
    voices = synth.getVoices();
  };
  refresh();
  synth.addEventListener?.('voiceschanged', refresh);

  const pick = (speaker: Speaker): SpeechSynthesisVoice | undefined => {
    const english = voices.filter((v) => /^en/i.test(v.lang));
    const british = english.filter((v) => /en-GB/i.test(v.lang));
    const pool = british.length ? british : english;
    return pool.find((v) => DELIVERY[speaker].prefer.test(v.name)) ?? pool[0];
  };

  impl = {
    speak(text, speaker, onEnd) {
      const s = settings();
      if (!s.enabled || s.volume <= 0) return false;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[—…]/g, ', '));
      const d = DELIVERY[speaker];
      const v = pick(speaker);
      if (v) u.voice = v;
      u.lang = v?.lang ?? 'en-GB';
      u.pitch = d.pitch;
      u.rate = d.rate;
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
