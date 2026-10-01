/**
 * Small procedural music engine (GD-20). Each story state is a "mood": tempo, scale, chord
 * progression and layer levels. Original material generated live with Web Audio — no recordings.
 * Moods cross-fade at story beats; dialogue and typing cues stay on top because music is quiet.
 */
import type { MusicId } from '../level/levelTypes';

interface Mood {
  readonly tempo: number;
  /** MIDI root note. */
  readonly root: number;
  readonly scale: readonly number[];
  /** Chords as scale degrees (0-based), one per bar. */
  readonly progression: readonly (readonly number[])[];
  readonly pad: number;
  readonly arp: number;
  readonly bass: number;
  readonly drums: number;
  /** Low-pass cutoff for the pad (brightness). */
  readonly brightness: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];

const I = [0, 2, 4];
const II = [1, 3, 5];
const IV = [3, 5, 7];
const V = [4, 6, 8];
const VI = [5, 7, 9];
const III = [2, 4, 6];

const MOODS: Record<MusicId, Mood> = {
  title: { tempo: 66, root: 57, scale: MAJOR, progression: [I, VI, IV, V], pad: 0.5, arp: 0.25, bass: 0.3, drums: 0, brightness: 1400 },
  'arrival-wonder': { tempo: 72, root: 60, scale: LYDIAN, progression: [I, II, I, V], pad: 0.5, arp: 0.35, bass: 0.3, drums: 0, brightness: 1800 },
  'ward-fracture': { tempo: 60, root: 57, scale: MINOR, progression: [I, VI, I, V], pad: 0.6, arp: 0.15, bass: 0.45, drums: 0, brightness: 900 },
  'courtyard-action': { tempo: 112, root: 62, scale: DORIAN, progression: [I, IV, I, V], pad: 0.35, arp: 0.4, bass: 0.45, drums: 0.45, brightness: 2200 },
  'east-hall-calm': { tempo: 70, root: 60, scale: MAJOR, progression: [I, III, IV, I], pad: 0.45, arp: 0.25, bass: 0.25, drums: 0, brightness: 1300 },
  'library-mystery': { tempo: 64, root: 55, scale: DORIAN, progression: [I, II, I, VI], pad: 0.5, arp: 0.35, bass: 0.3, drums: 0, brightness: 1100 },
  'grimoire-battle': { tempo: 120, root: 57, scale: MINOR, progression: [I, VI, III, V], pad: 0.35, arp: 0.45, bass: 0.5, drums: 0.55, brightness: 2400 },
  'portrait-rest': { tempo: 62, root: 59, scale: MAJOR, progression: [I, IV, VI, V], pad: 0.5, arp: 0.2, bass: 0.25, drums: 0, brightness: 1200 },
  'greenhouse-wonder': { tempo: 76, root: 62, scale: LYDIAN, progression: [I, II, III, II], pad: 0.45, arp: 0.4, bass: 0.25, drums: 0, brightness: 2000 },
  'greenhouse-action': { tempo: 116, root: 62, scale: DORIAN, progression: [I, IV, VI, V], pad: 0.35, arp: 0.45, bass: 0.45, drums: 0.45, brightness: 2400 },
  'tower-ascent': { tempo: 84, root: 55, scale: MINOR, progression: [I, III, IV, V], pad: 0.5, arp: 0.35, bass: 0.4, drums: 0.2, brightness: 1500 },
  'warden-defence': { tempo: 104, root: 52, scale: MINOR, progression: [I, VI, IV, V], pad: 0.5, arp: 0.4, bass: 0.55, drums: 0.55, brightness: 2000 },
  'ward-repair': { tempo: 80, root: 60, scale: MAJOR, progression: [IV, V, III, VI], pad: 0.65, arp: 0.4, bass: 0.35, drums: 0.15, brightness: 2600 },
  celebration: { tempo: 108, root: 62, scale: MAJOR, progression: [I, V, VI, IV], pad: 0.4, arp: 0.45, bass: 0.4, drums: 0.4, brightness: 2800 },
  results: { tempo: 72, root: 60, scale: MAJOR, progression: [I, IV, I, V], pad: 0.45, arp: 0.3, bass: 0.25, drums: 0, brightness: 1800 },
};

const LOOKAHEAD_SEC = 0.25;
const CROSSFADE_SEC = 2.5;
const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

interface Voice {
  readonly mood: Mood;
  readonly bus: GainNode;
  readonly padFilter: BiquadFilterNode;
  nextBeatTime: number;
  beat: number;
}

export class MusicEngine {
  private readonly out: GainNode;
  private voice: Voice | null = null;
  private pending: MusicId | null = null;
  private timer: number | null = null;
  private noise: AudioBuffer | null = null;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = 0.5;
    this.out.connect(destination);
  }

  setVolume(volume: number): void {
    this.out.gain.setTargetAtTime(volume * 0.55, this.ctx.currentTime, 0.1);
  }

  play(id: MusicId | null): void {
    if (this.ctx.state !== 'running') {
      this.pending = id;
      return;
    }
    this.pending = null;
    const now = this.ctx.currentTime;
    const old = this.voice;
    if (old) {
      old.bus.gain.cancelScheduledValues(now);
      old.bus.gain.setValueAtTime(old.bus.gain.value, now);
      old.bus.gain.linearRampToValueAtTime(0, now + CROSSFADE_SEC);
      window.setTimeout(() => old.bus.disconnect(), (CROSSFADE_SEC + 0.5) * 1000);
    }
    if (!id) {
      this.voice = null;
      return;
    }
    const mood = MOODS[id];
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0, now);
    bus.gain.linearRampToValueAtTime(1, now + CROSSFADE_SEC);
    bus.connect(this.out);
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = mood.brightness;
    padFilter.connect(bus);
    this.voice = { mood, bus, padFilter, nextBeatTime: now + 0.1, beat: 0 };
    this.timer ??= window.setInterval(() => this.schedule(), 100);
  }

  /** Called when the context resumes after the first user gesture. */
  resume(): void {
    if (this.pending !== null) this.play(this.pending);
  }

  private schedule(): void {
    const v = this.voice;
    if (!v) return;
    const secPerBeat = 60 / v.mood.tempo;
    while (v.nextBeatTime < this.ctx.currentTime + LOOKAHEAD_SEC) {
      this.playBeat(v, v.beat, v.nextBeatTime, secPerBeat);
      v.nextBeatTime += secPerBeat;
      v.beat++;
    }
  }

  private pitch(mood: Mood, degree: number, octave = 0): number {
    const n = mood.scale.length;
    const oct = Math.floor(degree / n);
    const step = mood.scale[((degree % n) + n) % n] ?? 0;
    return midiToHz(mood.root + step + 12 * (oct + octave));
  }

  private playBeat(v: Voice, beat: number, time: number, secPerBeat: number): void {
    const m = v.mood;
    const bar = Math.floor(beat / 4);
    const inBar = beat % 4;
    const chord = m.progression[bar % m.progression.length] ?? I;

    if (inBar === 0 && m.pad > 0) {
      for (const d of chord) this.pad(v, this.pitch(m, d), time, secPerBeat * 4, m.pad);
    }
    if (m.bass > 0 && (inBar === 0 || (inBar === 2 && m.drums > 0))) {
      this.pluck(v.bus, this.pitch(m, chord[0] ?? 0, -2), time, secPerBeat * 1.8, m.bass * 0.5, 'sine');
    }
    if (m.arp > 0) {
      const steps = m.drums > 0 ? 2 : 1;
      for (let s = 0; s < steps; s++) {
        const idx = (beat * steps + s) % (chord.length + 1);
        const degree = idx === chord.length ? (chord[0] ?? 0) + m.scale.length : (chord[idx] ?? 0);
        this.pluck(v.bus, this.pitch(m, degree, 1), time + (s * secPerBeat) / steps, secPerBeat * 0.9, m.arp * 0.22, 'triangle');
      }
    }
    if (m.drums > 0) {
      if (inBar === 0 || inBar === 2) this.kick(v.bus, time, m.drums * 0.5);
      this.hat(v.bus, time + secPerBeat / 2, m.drums * 0.12);
    }
  }

  private pad(v: Voice, freq: number, time: number, length: number, level: number): void {
    for (const detune of [-6, 6]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(level * 0.05, time + length * 0.3);
      g.gain.linearRampToValueAtTime(level * 0.04, time + length * 0.8);
      g.gain.linearRampToValueAtTime(0, time + length * 1.05);
      osc.connect(g).connect(v.padFilter);
      osc.start(time);
      osc.stop(time + length * 1.1);
    }
  }

  private pluck(dest: AudioNode, freq: number, time: number, length: number, level: number, type: OscillatorType): void {
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(level, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, time + length);
    osc.connect(g).connect(dest);
    osc.start(time);
    osc.stop(time + length + 0.05);
  }

  private kick(dest: AudioNode, time: number, level: number): void {
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(110, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(g).connect(dest);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private hat(dest: AudioNode, time: number, level: number): void {
    if (!this.noise) {
      const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    src.connect(hp).connect(g).connect(dest);
    src.start(time);
    src.stop(time + 0.08);
  }
}
