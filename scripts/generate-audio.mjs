/**
 * Synthesises every Level 1 sound effect into public/audio/sfx/*.wav.
 * All sounds are original, generated from oscillators and noise — no samples.
 * Run: node scripts/generate-audio.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio', 'sfx');

let seed = 12345;
const noise = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
};

function render(seconds, fn) {
  const n = Math.round(seconds * RATE);
  const data = new Float32Array(n);
  for (let i = 0; i < n; i++) data[i] = fn(i / RATE, i);
  return data;
}

const env = (t, attack, decay) => (t < attack ? t / attack : Math.exp(-(t - attack) / decay));
const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const tri = (f, t) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t));
const note = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** One-pole low-pass over a buffer. */
function lowpass(data, cutoff) {
  const a = Math.exp((-2 * Math.PI * cutoff) / RATE);
  let y = 0;
  for (let i = 0; i < data.length; i++) {
    y = (1 - a) * data[i] + a * y;
    data[i] = y;
  }
  return data;
}

function mix(...buffers) {
  const n = Math.max(...buffers.map((b) => b.length));
  const out = new Float32Array(n);
  for (const b of buffers) for (let i = 0; i < b.length; i++) out[i] += b[i];
  return out;
}

function normalise(data, peak = 0.8) {
  let max = 0;
  for (const v of data) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < data.length; i++) data[i] = (data[i] / max) * peak;
  // 4 ms fade-out to avoid clicks.
  const fade = Math.min(data.length, Math.round(0.004 * RATE));
  for (let i = 0; i < fade; i++) data[data.length - 1 - i] *= i / fade;
  return data;
}

/** Chime made of a few decaying partials. */
function chime(freq, start, length, level = 1) {
  return render(start + length, (t) => {
    if (t < start) return 0;
    const u = t - start;
    const e = env(u, 0.004, length / 4);
    return level * e * (sine(freq, u) + 0.4 * sine(freq * 2.01, u) * Math.exp(-u * 6) + 0.15 * sine(freq * 3.02, u) * Math.exp(-u * 10));
  });
}

const SOUNDS = {
  'key-correct': () => normalise(render(0.05, (t) => env(t, 0.001, 0.008) * (sine(1900, t) * 0.6 + noise() * 0.25)), 0.45),
  'key-incorrect': () => normalise(lowpass(render(0.12, (t) => env(t, 0.002, 0.03) * (tri(190, t) + noise() * 0.2)), 900), 0.4),
  'word-progress': () => normalise(render(0.12, (t) => env(t, 0.005, 0.04) * sine(700 + t * 2400, t)), 0.35),
  'spell-cast': () =>
    normalise(
      mix(
        lowpass(render(0.32, (t) => env(t, 0.03, 0.08) * noise()), 2600),
        render(0.32, (t) => env(t, 0.02, 0.1) * sine(500 + t * 1800, t) * 0.5),
      ),
      0.6,
    ),
  'spell-hit': () => normalise(mix(chime(note(88), 0, 0.35, 0.6), chime(note(93), 0.02, 0.3, 0.4), render(0.08, (t) => env(t, 0.001, 0.015) * noise() * 0.5)), 0.55),
  'perfect-word': () => normalise(mix(chime(note(84), 0, 0.5), chime(note(88), 0.06, 0.5), chime(note(91), 0.12, 0.6)), 0.55),
  frost: () =>
    normalise(
      mix(
        render(0.7, (t) => env(t, 0.02, 0.2) * (sine(2600, t) * sine(3.1, t) + sine(3300, t) * 0.6) * 0.5),
        lowpass(render(0.7, (t) => env(t, 0.05, 0.2) * noise() * 0.3), 6000),
      ),
      0.5,
    ),
  'chain-spark': () =>
    normalise(
      render(0.5, (t) => {
        const crackle = Math.abs(noise()) > 0.92 ? noise() : 0;
        return env(t, 0.003, 0.15) * (crackle + sine(1200 + 800 * sine(23, t), t) * 0.4);
      }),
      0.55,
    ),
  'shield-break': () =>
    normalise(
      mix(render(0.4, (t) => env(t, 0.001, 0.06) * noise()), chime(note(96), 0, 0.4, 0.6), chime(note(100), 0.01, 0.35, 0.4)),
      0.6,
    ),
  'enemy-telegraph': () => normalise(lowpass(render(0.7, (t) => (t / 0.7) ** 2 * (noise() * 0.5 + sine(220 + t * 260, t) * 0.5)), 1400), 0.45),
  'focus-hit': () => normalise(lowpass(render(0.35, (t) => env(t, 0.004, 0.07) * (sine(110 - t * 60, t) + noise() * 0.3)), 700), 0.55),
  checkpoint: () => normalise(mix(chime(note(79), 0, 0.8), chime(note(86), 0.15, 0.9)), 0.5),
  'boss-phase': () =>
    normalise(
      mix(
        render(2.2, (t) => env(t, 0.02, 0.7) * (sine(note(43), t) + 0.5 * sine(note(50), t) + 0.3 * sine(note(55) * 1.003, t))),
        chime(note(74), 0.1, 1.5, 0.3),
      ),
      0.6,
    ),
  'star-page': () => normalise(mix(chime(note(84), 0, 0.4), chime(note(88), 0.07, 0.4), chime(note(91), 0.14, 0.4), chime(note(96), 0.21, 0.6)), 0.55),
  'ui-select': () => normalise(render(0.08, (t) => env(t, 0.002, 0.02) * (sine(880, t) + 0.5 * sine(1320, t))), 0.4),
  'ui-move': () => normalise(render(0.04, (t) => env(t, 0.001, 0.008) * sine(1200, t)), 0.3),
  unlock: () => normalise(mix(chime(note(72), 0, 0.5), chime(note(76), 0.1, 0.5), chime(note(79), 0.2, 0.5), chime(note(84), 0.3, 0.9)), 0.55),
  'gate-open': () =>
    normalise(
      mix(
        lowpass(render(1.6, (t) => env(t, 0.3, 0.6) * noise() * 0.6), 400),
        render(1.6, (t) => env(t, 0.2, 0.5) * sine(70 + sine(3, t) * 6, t) * 0.6),
      ),
      0.5,
    ),
  dispel: () =>
    normalise(
      mix(...[0, 1, 2, 3, 4].map((i) => chime(note(96 - i * 3), i * 0.05, 0.35, 0.5))),
      0.5,
    ),
};

function wav(data) {
  const bytes = 44 + data.length * 2;
  const buf = Buffer.alloc(bytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(bytes - 8, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24);
  buf.writeUInt32LE(RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(data[i] * 32767))), 44 + i * 2);
  return buf;
}

mkdirSync(OUT, { recursive: true });
let total = 0;
for (const [id, make] of Object.entries(SOUNDS)) {
  const file = wav(make());
  writeFileSync(join(OUT, `${id}.wav`), file);
  total += file.length;
}
console.log(`Wrote ${Object.keys(SOUNDS).length} sounds (${(total / 1024).toFixed(0)} KiB) to ${OUT}`);
