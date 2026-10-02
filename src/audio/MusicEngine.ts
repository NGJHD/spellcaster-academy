/**
 * Small procedural music engine (GD-20). Each story state is a "mood": tempo, scale, chord
 * progression and layer levels. Original material generated live with Web Audio — no recordings.
 * Layers: warm pad, arpeggio, bass, a generated lead melody, and drums; a synthetic hall reverb
 * gives them space. Story moods cross-fade slowly; battle moods cut in quickly (owner feedback).
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
  /** Lead melody level (0 = none). */
  readonly lead: number;
  /** Battle groove: snare backbeat, driving bass and quick fades. */
  readonly battle?: boolean;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MINOR = [0, 2, 3, 5, 7, 8, 10];
const DORIAN = [0, 2, 3, 5, 7, 9, 10];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11];

const I = [0, 2, 4];
const II = [1, 3, 5];
const III = [2, 4, 6];
const IV = [3, 5, 7];
const V = [4, 6, 8];
const VI = [5, 7, 9];
const VII = [6, 8, 10];

const MOODS: Record<MusicId, Mood> = {
  title: { tempo: 66, root: 57, scale: MAJOR, progression: [I, VI, IV, V], pad: 0.5, arp: 0.25, bass: 0.3, drums: 0, brightness: 1400, lead: 0.35 },
  'arrival-wonder': { tempo: 76, root: 60, scale: LYDIAN, progression: [I, II, I, V], pad: 0.5, arp: 0.35, bass: 0.3, drums: 0, brightness: 1800, lead: 0.4 },
  'ward-fracture': { tempo: 64, root: 57, scale: MINOR, progression: [I, VI, I, V], pad: 0.6, arp: 0.2, bass: 0.45, drums: 0, brightness: 1000, lead: 0.25 },
  'courtyard-action': { tempo: 126, root: 62, scale: DORIAN, progression: [I, IV, I, V], pad: 0.35, arp: 0.45, bass: 0.55, drums: 0.6, brightness: 2400, lead: 0.45, battle: true },
  'east-hall-calm': { tempo: 74, root: 60, scale: MAJOR, progression: [I, III, IV, I], pad: 0.45, arp: 0.3, bass: 0.25, drums: 0, brightness: 1400, lead: 0.35 },
  'library-mystery': { tempo: 70, root: 55, scale: DORIAN, progression: [I, II, I, VI], pad: 0.5, arp: 0.35, bass: 0.3, drums: 0, brightness: 1200, lead: 0.35 },
  'grimoire-battle': { tempo: 132, root: 57, scale: MINOR, progression: [I, VI, III, V], pad: 0.35, arp: 0.5, bass: 0.6, drums: 0.65, brightness: 2500, lead: 0.45, battle: true },
  'portrait-rest': { tempo: 66, root: 59, scale: MAJOR, progression: [I, IV, VI, V], pad: 0.5, arp: 0.25, bass: 0.25, drums: 0, brightness: 1300, lead: 0.35 },
  'greenhouse-wonder': { tempo: 80, root: 62, scale: LYDIAN, progression: [I, II, III, II], pad: 0.45, arp: 0.4, bass: 0.25, drums: 0, brightness: 2000, lead: 0.4 },
  'greenhouse-action': { tempo: 128, root: 62, scale: DORIAN, progression: [I, IV, VI, V], pad: 0.35, arp: 0.5, bass: 0.55, drums: 0.6, brightness: 2500, lead: 0.45, battle: true },
  'tower-ascent': { tempo: 88, root: 55, scale: MINOR, progression: [I, III, IV, V], pad: 0.5, arp: 0.35, bass: 0.4, drums: 0.2, brightness: 1500, lead: 0.35 },
  'tower-battle': { tempo: 130, root: 55, scale: MINOR, progression: [I, VI, VII, V], pad: 0.35, arp: 0.5, bass: 0.6, drums: 0.65, brightness: 2300, lead: 0.4, battle: true },
  'warden-defence': { tempo: 120, root: 52, scale: MINOR, progression: [I, VI, IV, V], pad: 0.5, arp: 0.45, bass: 0.65, drums: 0.7, brightness: 2200, lead: 0.45, battle: true },
  'ward-repair': { tempo: 84, root: 60, scale: MAJOR, progression: [IV, V, III, VI], pad: 0.65, arp: 0.4, bass: 0.35, drums: 0.15, brightness: 2600, lead: 0.5 },
  celebration: { tempo: 112, root: 62, scale: MAJOR, progression: [I, V, VI, IV], pad: 0.4, arp: 0.45, bass: 0.4, drums: 0.4, brightness: 2800, lead: 0.5 },
  results: { tempo: 76, root: 60, scale: MAJOR, progression: [I, IV, I, V], pad: 0.45, arp: 0.3, bass: 0.25, drums: 0, brightness: 1800, lead: 0.4 },
};

const LOOKAHEAD_SEC = 0.25;
const CROSSFADE_SEC = 2.2;
/** Battle music cuts in (and out) quickly so the change in danger is heard at once. */
const BATTLE_FADE_SEC = 0.8;
const midiToHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

interface Voice {
  readonly mood: Mood;
  readonly bus: GainNode;
  readonly padFilter: BiquadFilterNode;
  /** Reverb send. */
  readonly wet: GainNode;
  /** Deterministic melody seed per mood, so each place has a recognisable repeating theme. */
  readonly seed: number;
  nextBeatTime: number;
  beat: number;
}

export class MusicEngine {
  private readonly out: GainNode;
  private readonly reverb: ConvolverNode;
  private voice: Voice | null = null;
  private pending: MusicId | null = null;
  private timer: number | null = null;
  private noise: AudioBuffer | null = null;
  private readonly meter: AnalyserNode;
  private readonly meterData = new Float32Array(1024);
  /** Mood currently playing (diagnostics). */
  current: MusicId | null = null;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
  ) {
    this.out = ctx.createGain();
    this.out.gain.value = 0.5;
    // Gentle compression keeps the louder score from clipping when layers stack up.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.out.connect(comp).connect(destination);
    this.meter = ctx.createAnalyser();
    this.meter.fftSize = 1024;
    this.out.connect(this.meter);
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.makeImpulse(2.6);
    const reverbReturn = ctx.createGain();
    reverbReturn.gain.value = 0.5;
    this.reverb.connect(reverbReturn).connect(this.out);
  }

  setVolume(volume: number): void {
    this.out.gain.setTargetAtTime(volume * 1.6, this.ctx.currentTime, 0.1);
  }

  play(id: MusicId | null): void {
    if (this.ctx.state !== 'running') {
      this.pending = id;
      return;
    }
    this.pending = null;
    this.current = id;
    const now = this.ctx.currentTime;
    const old = this.voice;
    const mood = id ? MOODS[id] : null;
    const fade = mood?.battle || old?.mood.battle ? BATTLE_FADE_SEC : CROSSFADE_SEC;
    if (old) {
      old.bus.gain.cancelScheduledValues(now);
      old.bus.gain.setValueAtTime(old.bus.gain.value, now);
      old.bus.gain.linearRampToValueAtTime(0, now + fade);
      window.setTimeout(() => {
        old.bus.disconnect();
        old.wet.disconnect();
      }, (fade + 3) * 1000);
    }
    if (!id || !mood) {
      this.voice = null;
      return;
    }
    const bus = this.ctx.createGain();
    bus.gain.setValueAtTime(0, now);
    bus.gain.linearRampToValueAtTime(1, now + fade);
    bus.connect(this.out);
    const wet = this.ctx.createGain();
    wet.gain.value = mood.battle ? 0.6 : 1;
    bus.connect(wet).connect(this.reverb);
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = mood.brightness;
    padFilter.connect(bus);
    let seed = 7;
    for (let i = 0; i < id.length; i++) seed = (Math.imul(seed, 31) + id.charCodeAt(i)) >>> 0;
    // Battles start on the beat at once; story moods ease in.
    this.voice = { mood, bus, padFilter, wet, seed, nextBeatTime: now + 0.05, beat: 0 };
    this.timer ??= window.setInterval(() => this.schedule(), 100);
  }

  /** RMS level of the music output, for diagnostics and tests. */
  level(): number {
    this.meter.getFloatTimeDomainData(this.meterData);
    let sum = 0;
    for (const v of this.meterData) sum += v * v;
    return Math.sqrt(sum / this.meterData.length);
  }

  /** Called when the context resumes after the first user gesture. */
  resume(): void {
    if (this.pending !== null) this.play(this.pending);
  }

  private makeImpulse(seconds: number): AudioBuffer {
    const rate = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(2, Math.floor(rate * seconds), rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    }
    return buf;
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
    if (m.bass > 0) {
      const root = this.pitch(m, chord[0] ?? 0, -2);
      if (m.battle) {
        // Driving eighth-note bass.
        this.pluck(v.bus, root, time, secPerBeat * 0.45, m.bass * 0.55, 'triangle');
        this.pluck(v.bus, root, time + secPerBeat / 2, secPerBeat * 0.4, m.bass * 0.4, 'triangle');
      } else if (inBar === 0 || (inBar === 2 && m.drums > 0)) {
        this.pluck(v.bus, root, time, secPerBeat * 1.8, m.bass * 0.7, 'sine');
      }
    }
    if (m.arp > 0) {
      const steps = m.drums > 0 ? 2 : 1;
      for (let s = 0; s < steps; s++) {
        const idx = (beat * steps + s) % (chord.length + 1);
        const degree = idx === chord.length ? (chord[0] ?? 0) + m.scale.length : (chord[idx] ?? 0);
        this.pluck(v.bus, this.pitch(m, degree, 1), time + (s * secPerBeat) / steps, secPerBeat * 0.9, m.arp * 0.2, 'triangle');
      }
    }
    if (m.lead > 0) this.melody(v, bar, inBar, chord, time, secPerBeat);
    if (m.drums > 0) {
      if (inBar === 0 || inBar === 2) this.kick(v.bus, time, m.drums * 0.75);
      if (m.battle && (inBar === 1 || inBar === 3)) this.snare(v.bus, time, m.drums * 0.4);
      this.hat(v.bus, time + secPerBeat / 2, m.drums * 0.14);
      if (m.battle) this.hat(v.bus, time, m.drums * 0.07);
    }
  }

  /** An 8-bar phrase of chord tones and passing notes, fixed per mood. */
  private melody(v: Voice, bar: number, inBar: number, chord: readonly number[], time: number, spb: number): void {
    const m = v.mood;
    const phraseBar = bar % 8;
    // Phrasing: bar 8 holds one long note; every second bar rests on its last beat.
    if (phraseBar === 7 && inBar > 0) return;
    if (phraseBar % 2 === 1 && inBar === 3) return;
    const hash = (n: number): number => {
      let x = (v.seed ^ Math.imul(n + 1, 0x9e3779b1)) >>> 0;
      x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d) >>> 0;
      return (x ^ (x >>> 13)) >>> 0;
    };
    const subdivisions = m.battle ? 2 : 1;
    for (let s = 0; s < subdivisions; s++) {
      const step = (phraseBar * 4 + inBar) * subdivisions + s;
      if (s === 1 && hash(step + 500) % 3 === 0) continue;
      const strong = inBar === 0 && s === 0;
      const base = chord[hash(step) % chord.length] ?? 0;
      const degree = strong ? base : base + ((hash(step + 99) % 3) - 1);
      const length = phraseBar === 7 ? spb * 4 : (spb / subdivisions) * 0.95;
      this.bell(v, this.pitch(m, degree, 1), time + (s * spb) / subdivisions, length, m.lead * (strong ? 0.2 : 0.15));
    }
  }

  private bell(v: Voice, freq: number, time: number, length: number, level: number): void {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(level, time + 0.02);
    g.gain.exponentialRampToValueAtTime(level * 0.4, time + Math.min(0.3, length));
    g.gain.exponentialRampToValueAtTime(0.0005, time + length + 0.4);
    g.connect(v.bus);
    const partials: readonly (readonly [number, number, OscillatorType])[] = [
      [1, 1, 'triangle'],
      [2, 0.25, 'sine'],
      [3, 0.08, 'sine'],
    ];
    for (const [mult, amp, type] of partials) {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq * mult;
      const og = this.ctx.createGain();
      og.gain.value = amp;
      osc.connect(og).connect(g);
      osc.start(time);
      osc.stop(time + length + 0.5);
    }
  }

  private pad(v: Voice, freq: number, time: number, length: number, level: number): void {
    for (const detune of [-7, 7]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.detune.value = detune;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(level * 0.11, time + length * 0.3);
      g.gain.linearRampToValueAtTime(level * 0.09, time + length * 0.8);
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
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(g).connect(dest);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private noiseBuffer(): AudioBuffer {
    if (!this.noise) {
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.15), this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
    }
    return this.noise;
  }

  private snare(dest: AudioNode, time: number, level: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(level, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    src.connect(bp).connect(g).connect(dest);
    src.start(time);
    src.stop(time + 0.14);
  }

  private hat(dest: AudioNode, time: number, level: number): void {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
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
