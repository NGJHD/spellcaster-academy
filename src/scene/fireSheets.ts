/**
 * The fire flipbooks' pixels: turbulent noise rising through a flame shape, coloured by heat. Pure
 * maths with no DOM, so `scripts/generate-fire.ts` renders them once to image files at build time
 * (painting them in the browser took about two seconds the first time a fire appeared).
 */

/** Frames in a flame flipbook, laid side by side; each frame is FRAME_PX wide and twice as tall. */
export const FRAMES = 16;
export const FRAME_PX = 128;

/** Deterministic noise so the flipbook is the same every run. */
export const hash = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Smooth value noise that tiles every `period` cells vertically (so the flipbook loops). */
function noise(x: number, y: number, period: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const wrap = (v: number) => ((v % period) + period) % period;
  const h = (i: number, j: number) => hash(i, wrap(j));
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * sx;
  const b = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * sx;
  return a + (b - a) * sy;
}

/** Turbulence: four octaves of noise (each tiles vertically). */
export function fbm(x: number, y: number): number {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    sum += amp * noise(x * f, y * f, 4 * f);
    amp *= 0.5;
    f *= 2;
  }
  return sum;
}

/** Heat to colour (r, g, b in 0–255, a in 0–1). */
const RAMPS: Record<'ink' | 'warm', readonly (readonly [number, number, number, number, number])[]> = {
  // [heat, r, g, b, alpha]
  warm: [
    [0.0, 90, 10, 0, 0],
    [0.18, 150, 25, 5, 0.35],
    [0.4, 235, 85, 15, 0.85],
    [0.65, 255, 170, 45, 1],
    [0.85, 255, 230, 140, 1],
    [1.0, 255, 255, 235, 1],
  ],
  // Inkfire: redder, with a deep crimson body.
  ink: [
    [0.0, 60, 0, 0, 0],
    [0.18, 120, 10, 5, 0.4],
    [0.4, 215, 45, 15, 0.85],
    [0.65, 255, 120, 35, 1],
    [0.85, 255, 200, 110, 1],
    [1.0, 255, 245, 215, 1],
  ],
};

function ramp(kind: 'ink' | 'warm', heat: number): [number, number, number, number] {
  const stops = RAMPS[kind];
  for (let i = 1; i < stops.length; i++) {
    const b = stops[i];
    const a = stops[i - 1];
    if (!a || !b) continue;
    if (heat <= b[0]) {
      const t = (heat - a[0]) / (b[0] - a[0]);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t, a[4] + (b[4] - a[4]) * t];
    }
  }
  return [255, 255, 235, 1];
}

/**
 * A rendered flame flipbook (owner, 2026-10-07: the old bezier teardrops "look polygon"): every pixel
 * is computed from turbulent noise rising through a flame-shaped falloff and coloured by heat, so the
 * flames have soft edges, licking tongues and a white-hot core. Frames scroll the noise upwards and
 * loop seamlessly.
 */
export function flameSheetPixels(kind: 'ink' | 'warm'): { width: number; height: number; data: Uint8ClampedArray } {
  const W = FRAME_PX;
  const H = FRAME_PX * 2;
  const img = { data: new Uint8ClampedArray(W * FRAMES * H * 4) };
  for (let f = 0; f < FRAMES; f++) {
    const scroll = (f / FRAMES) * 4; // one full noise period per loop
    for (let py = 0; py < H; py++) {
      const v = 1 - py / (H - 1); // 0 at the base, 1 at the top
      for (let px = 0; px < W; px++) {
        const u = (px / (W - 1)) * 2 - 1;
        // Turbulence sways the flame sideways more the higher it rises.
        const n = fbm(u * 2.2 + 7, v * 3.2 - scroll);
        const uu = u + (n - 0.5) * 0.9 * v;
        // A teardrop body: wide at the base, licking to a point at the top.
        const halfWidth = 0.62 * Math.pow(1 - v, 0.55) + 0.02;
        const body = Math.max(0, 1 - Math.abs(uu) / halfWidth);
        const tongue = fbm(u * 4 + 3, v * 6 - scroll * 2);
        let heat = body * 1.35 - v * 0.85 + (tongue - 0.5) * 0.8;
        heat *= Math.min(1, v * 14 + 0.3); // soft at the very bottom edge
        heat = Math.max(0, Math.min(1, heat));
        const [r, gg, b, a] = ramp(kind, heat);
        const i = (py * W * FRAMES + f * W + px) * 4;
        img.data[i] = r;
        img.data[i + 1] = gg;
        img.data[i + 2] = b;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
  }
  return { width: W * FRAMES, height: H, data: img.data };
}
