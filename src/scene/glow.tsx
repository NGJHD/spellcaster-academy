/**
 * Rendered light effects (owner, 2026-10-07: "the crack in the sky looks like it was done in ms paint
 * … those beams need a proper render. I don't want a plain rectangle of solid colour").
 *
 * - SkyTear: a split in the sky. A jagged opening, white-hot at its centre through gold to red at its
 *   torn edges, with a bright rim, branching hairline cracks and a soft glow, painted procedurally on a
 *   canvas. It lies along its two end points and turns about that axis to face the camera.
 * - LightBeam: a shaft of light that is brightest down its middle and fades softly to nothing at its
 *   sides and top, with faint motes drifting up it. It turns about its vertical axis to face the camera.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, CanvasTexture, Float32BufferAttribute, Matrix4, Mesh, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector3, type MeshBasicMaterial } from 'three';
import type { Vec3 } from '../level/rail/railTypes';

/** Deterministic pseudo-random numbers (render must stay pure and repeatable). */
/** Exported for tests. */
export const rngForTest = (seed: number) => rng(seed);

function rng(seed: number) {
  // Kept positive whatever the seed (a negative seed gave negative glow radii, which throw).
  let s = ((Math.round(seed) % 233280) + 233280) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// ---------- The tear ----------

export interface TearPalette {
  readonly core: string;
  readonly mid: string;
  readonly edge: string;
  readonly glow: string;
}

export const TEAR_FIRE: TearPalette = { core: '#fff6d8', mid: '#ffb040', edge: '#ff3a0a', glow: 'rgba(255, 70, 15, 0.9)' };

const tearCache = new Map<string, CanvasTexture>();

/** A painted tear across a 1024×512 canvas, centred on its middle line. */
function tearTexture(seed: number, palette: TearPalette): CanvasTexture {
  const key = `${seed}:${palette.core}:${palette.edge}`;
  const hit = tearCache.get(key);
  if (hit) return hit;
  const W = 1024;
  const H = 512;
  const cy = H / 2;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tearCache.set(key, tex);
  if (!g) return tex;
  const r = rng(seed);
  // The opening: widest in the middle, pinched to a point at both ends, with jagged torn edges.
  const top: [number, number][] = [];
  const bottom: [number, number][] = [];
  const steps = 70;
  let wobble = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = 40 + t * (W - 80);
    wobble += (r() - 0.5) * 18;
    wobble *= 0.85;
    const half = Math.pow(Math.sin(Math.PI * t), 0.9) * (H * 0.2) * (0.65 + 0.35 * r());
    const centre = cy + wobble + Math.sin(t * 9 + seed) * 10;
    top.push([x, centre - half - r() * 10]);
    bottom.push([x, centre + half + r() * 10]);
  }
  const outline = () => {
    g.beginPath();
    top.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = bottom.length - 1; i >= 0; i--) {
      const p = bottom[i];
      if (p) g.lineTo(p[0], p[1]);
    }
    g.closePath();
  };
  // Hairline cracks branching out from the torn edges.
  g.lineCap = 'round';
  for (let k = 0; k < 26; k++) {
    const fromTop = r() < 0.5;
    const pts = fromTop ? top : bottom;
    const start = pts[Math.floor(4 + r() * (pts.length - 8))];
    if (!start) continue;
    let [x, y] = start;
    const dir = fromTop ? -1 : 1;
    const len = 4 + Math.floor(r() * 8);
    g.beginPath();
    g.moveTo(x, y);
    for (let s = 0; s < len; s++) {
      x += (r() - 0.5) * 34;
      y += dir * (6 + r() * 16);
      g.lineTo(x, y);
    }
    g.strokeStyle = palette.mid;
    g.shadowColor = palette.glow;
    g.shadowBlur = 14;
    g.lineWidth = 1.5 + r() * 2;
    g.globalAlpha = 0.55 + r() * 0.4;
    g.stroke();
  }
  g.globalAlpha = 1;
  // Wide soft glow around the opening.
  for (const blur of [90, 50, 24]) {
    outline();
    g.shadowColor = palette.glow;
    g.shadowBlur = blur;
    g.fillStyle = palette.edge;
    g.fill();
  }
  // The inside: white-hot down the middle, gold, then red at the torn edges.
  g.shadowBlur = 0;
  outline();
  const grad = g.createLinearGradient(0, cy - H * 0.26, 0, cy + H * 0.26);
  grad.addColorStop(0, palette.edge);
  grad.addColorStop(0.32, palette.mid);
  grad.addColorStop(0.5, palette.core);
  grad.addColorStop(0.68, palette.mid);
  grad.addColorStop(1, palette.edge);
  g.fillStyle = grad;
  g.fill();
  // Soft swirls of brighter and darker light inside the split, so it looks like churning fire.
  g.save();
  outline();
  g.clip();
  for (let k = 0; k < 70; k++) {
    const x = 60 + r() * (W - 120);
    const y = cy + (r() - 0.5) * H * 0.3;
    const rad = 12 + r() * 46;
    const bright = r() < 0.6;
    const blob = g.createRadialGradient(x, y, 0, x, y, rad);
    blob.addColorStop(0, bright ? `rgba(255, 245, 210, ${0.18 + r() * 0.25})` : `rgba(150, 20, 0, ${0.2 + r() * 0.3})`);
    blob.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = blob;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.restore();
  // A bright rim along the torn edges.
  outline();
  g.strokeStyle = palette.core;
  g.shadowColor = palette.glow;
  g.shadowBlur = 18;
  g.lineWidth = 3;
  g.stroke();
  tex.needsUpdate = true;
  return tex;
}

const axis = new Vector3();
const toCam = new Vector3();
const yAxis = new Vector3();
const zAxis = new Vector3();
const basis = new Matrix4();
const camLocal = new Vector3();

/**
 * A split in the sky between `from` and `to` (in the parent's space), `width` metres across at its
 * widest. `open` (0–1) is read every frame: 0 is a hairline seam, 1 fully torn open.
 */
export function SkyTear({
  from,
  to,
  width,
  seed = 1,
  palette = TEAR_FIRE,
  open = () => 1,
  opacity = () => 1,
  renderOrder = -9,
}: {
  from: Vec3;
  to: Vec3;
  width: number;
  seed?: number;
  palette?: TearPalette;
  open?: () => number;
  opacity?: () => number;
  renderOrder?: number;
}) {
  const mesh = useRef<Mesh>(null);
  const mat = useRef<MeshBasicMaterial>(null);
  const time = useRef(0);
  const texture = useMemo(() => tearTexture(seed, palette), [seed, palette]);
  const geometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const centre = useMemo(() => new Vector3((from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2), [from, to]);
  const length = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
  useFrame((state, delta) => {
    const m = mesh.current;
    if (!m || !m.parent) return;
    time.current += Math.min(delta, 0.1);
    // Lie along the tear and turn about it to face the camera (in the parent's space).
    axis.set(to[0] - from[0], to[1] - from[1], to[2] - from[2]).normalize();
    camLocal.copy(state.camera.position);
    m.parent.worldToLocal(camLocal);
    toCam.copy(camLocal).sub(centre);
    zAxis.copy(toCam).addScaledVector(axis, -toCam.dot(axis)).normalize();
    yAxis.crossVectors(zAxis, axis).normalize();
    basis.makeBasis(axis, yAxis, zAxis);
    m.quaternion.setFromRotationMatrix(basis);
    m.position.copy(centre);
    // The texture's opening fills about 46% of its height.
    const o = Math.max(0.04, Math.min(1, open()));
    m.scale.set(length, (width / 0.46) * o, 1);
    const t = time.current;
    const flicker = 0.85 + Math.sin(t * 5.3) * 0.08 + Math.sin(t * 13.7) * 0.05;
    if (mat.current) mat.current.opacity = Math.max(0, opacity()) * flicker;
  });
  return (
    <mesh ref={mesh} geometry={geometry} frustumCulled={false} renderOrder={renderOrder}>
      <meshBasicMaterial ref={mat} map={texture} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
    </mesh>
  );
}

// ---------- Beams of light ----------

let beamTex: CanvasTexture | null = null;
let motesTex: CanvasTexture | null = null;

/** A soft shaft: a smooth falloff across its width, fading out towards its top. */
export function beamTexture(): CanvasTexture {
  if (beamTex) return beamTex;
  const W = 128;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const v = y / (H - 1); // 0 at the top, 1 at the base
      const along = Math.pow(v, 0.7) * (1 - Math.pow(1 - v, 30)); // fades out upwards, soft at the very base
      for (let x = 0; x < W; x++) {
        const u = (x / (W - 1)) * 2 - 1;
        const core = Math.exp(-u * u * 22);
        const soft = Math.exp(-u * u * 4) * 0.45;
        const a = Math.min(1, (core + soft) * along);
        const i = (y * W + x) * 4;
        img.data[i] = 255;
        img.data[i + 1] = 255;
        img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
  }
  beamTex = new CanvasTexture(c);
  return beamTex;
}

/** Faint motes and streaks drifting up a beam (tiles vertically, scrolled over time). */
function motesTexture(): CanvasTexture {
  if (motesTex) return motesTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 256;
  const g = c.getContext('2d');
  const r = rng(11);
  if (g) {
    for (let k = 0; k < 60; k++) {
      const x = 16 + r() * 32;
      const y = r() * 256;
      const len = 4 + r() * 22;
      const grad = g.createLinearGradient(0, y, 0, y + len);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, `rgba(255,255,255,${0.25 + r() * 0.5})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grad;
      g.fillRect(x, y, 1 + r() * 1.5, len);
    }
  }
  motesTex = new CanvasTexture(c);
  motesTex.wrapS = RepeatWrapping;
  motesTex.wrapT = RepeatWrapping;
  return motesTex;
}

/** Shared geometry: a unit plane with its base at y = 0. */
export const BEAM_GEOMETRY = new PlaneGeometry(1, 1).translate(0, 0.5, 0);

const beamCam = new Vector3();

/**
 * A vertical shaft of light, `height` metres tall and `width` across at its base, standing on its
 * group origin. `level` (0–1) is read every frame: it grows the beam upwards and fades it in.
 */
export function LightBeam({ height, width, color, intensity = 1, level = () => 1 }: { height: number; width: number; color: string; intensity?: number; level?: () => number }) {
  const group = useRef<Mesh>(null);
  const motes = useRef<Mesh>(null);
  const core = useRef<MeshBasicMaterial>(null);
  const moteMat = useRef<MeshBasicMaterial>(null);
  const texture = useMemo(() => beamTexture(), []);
  const moteTexture = useMemo(() => {
    const t = motesTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(1, Math.max(1, height / 6));
    return t;
  }, [height]);
  useFrame((state, delta) => {
    const g = group.current;
    if (!g || !g.parent) return;
    const l = Math.max(0, Math.min(1, level()));
    g.visible = l > 0.01;
    if (!g.visible) return;
    // Turn about the vertical axis to face the camera.
    beamCam.copy(state.camera.position);
    g.parent.worldToLocal(beamCam);
    const yaw = Math.atan2(beamCam.x - g.position.x, beamCam.z - g.position.z);
    g.rotation.set(0, yaw, 0);
    g.scale.set(width, height * (0.15 + 0.85 * l), 1);
    if (motes.current) motes.current.visible = true;
    moteTexture.offset.y -= Math.min(delta, 0.1) * 0.35;
    const t = state.clock.elapsedTime;
    if (core.current) core.current.opacity = l * intensity * (0.9 + Math.sin(t * 3.1) * 0.06);
    if (moteMat.current) moteMat.current.opacity = l * intensity * 0.55;
  });
  return (
    <mesh ref={group} geometry={BEAM_GEOMETRY} frustumCulled={false}>
      <meshBasicMaterial ref={core} map={texture} color={color} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} side={2} />
      <mesh ref={motes} geometry={BEAM_GEOMETRY} position={[0, 0, 0.001]}>
        <meshBasicMaterial ref={moteMat} map={moteTexture} color={color} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} side={2} />
      </mesh>
    </mesh>
  );
}

// ---------- Beams between two points ----------

let streakTex: CanvasTexture | null = null;
let glowTex: CanvasTexture | null = null;

/** A beam lying along U: brightest down its centre line, soft to nothing across its width and at its tips. */
export function streakTexture(): CanvasTexture {
  if (streakTex) return streakTex;
  const W = 256;
  const H = 64;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) {
      const v = (y / (H - 1)) * 2 - 1;
      const across = Math.exp(-v * v * 26) + Math.exp(-v * v * 5) * 0.4;
      for (let x = 0; x < W; x++) {
        const u = x / (W - 1);
        const tips = Math.min(1, u / 0.04, (1 - u) / 0.04);
        const i = (y * W + x) * 4;
        img.data[i] = 255;
        img.data[i + 1] = 255;
        img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(Math.min(1, across) * tips * 255);
      }
    }
    g.putImageData(img, 0, 0);
  }
  streakTex = new CanvasTexture(c);
  return streakTex;
}

/** A soft round glow (white centre fading to nothing), for sprites. */
export function glowTexture(): CanvasTexture {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.55, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  glowTex = new CanvasTexture(c);
  return glowTex;
}

/** Unit plane centred on the origin, for streaks. */
export const STREAK_GEOMETRY = new PlaneGeometry(1, 1);

const sAxis = new Vector3();
const sMid = new Vector3();
const sCam = new Vector3();
const sY = new Vector3();
const sZ = new Vector3();
const sBasis = new Matrix4();

/**
 * Lays a streak mesh (STREAK_GEOMETRY + streakTexture) from `a` to `b` (in its parent's space),
 * `width` across, turned about its own length to face the camera at world position `camera`.
 */
export function placeStreak(mesh: Mesh, a: Vector3, b: Vector3, width: number, camera: Vector3): void {
  sAxis.copy(b).sub(a);
  const length = sAxis.length();
  if (length < 1e-4) {
    mesh.scale.set(0.0001, 0.0001, 1);
    return;
  }
  sAxis.multiplyScalar(1 / length);
  sMid.copy(a).add(b).multiplyScalar(0.5);
  sCam.copy(camera);
  mesh.parent?.worldToLocal(sCam);
  sZ.copy(sCam).sub(sMid);
  sZ.addScaledVector(sAxis, -sZ.dot(sAxis)).normalize();
  sY.crossVectors(sZ, sAxis).normalize();
  sBasis.makeBasis(sAxis, sY, sZ);
  mesh.quaternion.setFromRotationMatrix(sBasis);
  mesh.position.copy(sMid);
  // The bright core fills about a third of the texture's height: widen the plane to match.
  mesh.scale.set(length, width * 3, 1);
}

// ---------- Fireball and gem sparkle textures ----------

let fireballTex: CanvasTexture | null = null;
let glintTex: CanvasTexture | null = null;

/** Smooth 2D value noise for the fireball (tiles around the circle by angle). */
function vnoise(x: number, y: number, period: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (i: number, j: number) => {
    const ii = ((i % period) + period) % period;
    const v = Math.sin(ii * 127.1 + j * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const a = h(xi, yi) + (h(xi + 1, yi) - h(xi, yi)) * sx;
  const b = h(xi, yi + 1) + (h(xi + 1, yi + 1) - h(xi, yi + 1)) * sx;
  return a + (b - a) * sy;
}

/**
 * A ball of fire (owner, 2026-10-07: the fireball read as a white light bulb): a churning orange body
 * with a yellow-white heart, its edge broken into licking tongues of flame, fading to nothing. Drawn
 * per pixel from noise around the circle, so the outline is ragged fire, not a disc.
 */
export function fireballTexture(): CanvasTexture {
  if (fireballTex) return fireballTex;
  const S = 192;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = (x / (S - 1)) * 2 - 1;
        const dy = (y / (S - 1)) * 2 - 1;
        const r = Math.sqrt(dx * dx + dy * dy);
        const ang = (Math.atan2(dy, dx) / (Math.PI * 2) + 0.5) * 16;
        // Ragged edge: tongues of flame around the rim, with finer flicker on top.
        const edge = 0.52 + (vnoise(ang, r * 3, 16) - 0.5) * 0.34 + (vnoise(ang * 2.3, r * 7 + 3, 37) - 0.5) * 0.14;
        // Churning body: mottled heat inside.
        const churn = vnoise(dx * 5 + 9, dy * 5 + 4, 1000) * 0.5 + vnoise(dx * 11 + 2, dy * 11 + 7, 1000) * 0.25;
        let heat = Math.max(0, 1 - r / edge);
        heat = Math.pow(heat, 0.8) * (0.75 + churn * 0.6);
        heat = Math.min(1, heat * 1.25);
        // Colour ramp: deep red edge → orange → yellow → white-hot heart.
        const rr = 255;
        const gg = Math.round(255 * Math.min(1, Math.pow(heat, 1.1) * 1.15));
        const bb = Math.round(255 * Math.max(0, (heat - 0.72) / 0.28) * 0.85);
        const a = Math.min(1, heat * 1.6);
        const i = (y * S + x) * 4;
        img.data[i] = rr;
        img.data[i + 1] = Math.round(gg * 0.85 + 40 * heat);
        img.data[i + 2] = bb;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
  }
  fireballTex = new CanvasTexture(c);
  fireballTex.colorSpace = SRGBColorSpace;
  return fireballTex;
}

/** A four-pointed sparkle (the glint that flashes across a cut gem). */
export function glintTexture(): CanvasTexture {
  if (glintTex) return glintTex;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(S, S);
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const dx = Math.abs((x / (S - 1)) * 2 - 1);
        const dy = Math.abs((y / (S - 1)) * 2 - 1);
        const ray = Math.max(Math.exp(-dy * 40) * (1 - dx), Math.exp(-dx * 40) * (1 - dy));
        const core = Math.exp(-(dx * dx + dy * dy) * 30);
        const a = Math.min(1, ray * 1.2 + core);
        const i = (y * S + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    g.putImageData(img, 0, 0);
  }
  glintTex = new CanvasTexture(c);
  return glintTex;
}

/**
 * A brilliant-cut gem (owner: the 8-sided gem "looks blockish"): an octagonal table, eight star and
 * eight kite (bezel) facets on the crown, sixteen upper-girdle facets, and sixteen pavilion mains down
 * to a point. Flat-shaded per facet so each catches the light. Height about 0.3 m.
 */
export function brilliantGeometry(): BufferGeometry {
  const T = new Vector3(0, 0.085, 0);
  const C = new Vector3(0, -0.2, 0);
  const A = Array.from({ length: 8 }, (_, i) => new Vector3(Math.cos((i / 8) * Math.PI * 2) * 0.085, 0.085, Math.sin((i / 8) * Math.PI * 2) * 0.085));
  const B = Array.from({ length: 8 }, (_, i) => new Vector3(Math.cos(((i + 0.5) / 8) * Math.PI * 2) * 0.138, 0.046, Math.sin(((i + 0.5) / 8) * Math.PI * 2) * 0.138));
  const G = Array.from({ length: 16 }, (_, k) => new Vector3(Math.cos((k / 16) * Math.PI * 2) * 0.165, 0, Math.sin((k / 16) * Math.PI * 2) * 0.165));
  const tris: Vector3[][] = [];
  for (let i = 0; i < 8; i++) {
    const a0 = A[i] as Vector3;
    const a1 = A[(i + 1) % 8] as Vector3;
    const b0 = B[i] as Vector3;
    const bPrev = B[(i + 7) % 8] as Vector3;
    const g0 = G[2 * i] as Vector3;
    const g1 = G[2 * i + 1] as Vector3;
    const g2 = G[(2 * i + 2) % 16] as Vector3;
    tris.push([T, a0, a1]); // table
    tris.push([a0, b0, a1]); // star
    tris.push([a0, bPrev, g0], [a0, g0, b0]); // kite (bezel)
    tris.push([b0, g0, g1], [b0, g1, g2]); // upper girdle
  }
  for (let k = 0; k < 16; k++) tris.push([G[k] as Vector3, C, G[(k + 1) % 16] as Vector3]); // pavilion
  const pos: number[] = [];
  const n = new Vector3();
  const e1 = new Vector3();
  const e2 = new Vector3();
  const mid = new Vector3();
  for (const [p, q, r] of tris) {
    if (!p || !q || !r) continue;
    e1.subVectors(q, p);
    e2.subVectors(r, p);
    n.crossVectors(e1, e2);
    mid.copy(p).add(q).add(r).multiplyScalar(1 / 3);
    // The gem is convex: wind every facet to face away from its centre.
    const [a, b, c] = n.dot(mid) < 0 ? [p, r, q] : [p, q, r];
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

// ---------- A magic barrier ----------

let wardTex: CanvasTexture | null = null;

/** A faint honeycomb of light with glowing seams (tiles). */
function wardTexture(): CanvasTexture {
  if (wardTex) return wardTex;
  const W = 256;
  const H = 222; // two hex rows per tile
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (g) {
    g.fillStyle = 'rgba(120, 180, 255, 0.10)';
    g.fillRect(0, 0, W, H);
    const r = 37;
    const hexW = r * Math.sqrt(3);
    g.lineJoin = 'round';
    for (let row = -1; row < 4; row++) {
      for (let col = -1; col < 5; col++) {
        const cx = col * hexW + (row % 2 ? hexW / 2 : 0);
        const cy = row * r * 1.5;
        g.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (Math.PI / 3) * k + Math.PI / 6;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (k === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.closePath();
        g.shadowColor = 'rgba(140, 200, 255, 1)';
        g.shadowBlur = 10;
        g.strokeStyle = 'rgba(200, 235, 255, 0.85)';
        g.lineWidth = 2;
        g.stroke();
      }
    }
  }
  wardTex = new CanvasTexture(c);
  wardTex.wrapS = RepeatWrapping;
  wardTex.wrapT = RepeatWrapping;
  return wardTex;
}

/**
 * A shimmering magic barrier (owner: no "plain rectangle of solid colour"): a gently curved wall of
 * faint honeycomb light that ripples, with a brighter glow along its base and edges fading out.
 * Stands on its origin, `width` across and `height` tall, curving towards +Z.
 */
export function WardBarrier({ width, height, color = '#7fb8ff' }: { width: number; height: number; color?: string }) {
  const mat = useRef<MeshBasicMaterial>(null);
  const edge = useRef<MeshBasicMaterial>(null);
  const tex = useMemo(() => {
    const t = wardTexture().clone();
    t.needsUpdate = true;
    t.repeat.set(width / 3, height / 2.6);
    return t;
  }, [width, height]);
  const geometry = useMemo(() => {
    const g = new PlaneGeometry(width, height, 32, 8);
    const pos = g.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) / (width / 2);
      pos.setZ(i, (1 - x * x) * width * 0.08);
    }
    g.translate(0, height / 2, 0);
    g.computeVertexNormals();
    return g;
  }, [width, height]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    tex.offset.set(t * 0.02, Math.sin(t * 0.7) * 0.02);
    if (mat.current) mat.current.opacity = 0.55 + Math.sin(t * 2.3) * 0.12 + Math.sin(t * 5.1) * 0.05;
    if (edge.current) edge.current.opacity = 0.5 + Math.sin(t * 3) * 0.15;
  });
  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial ref={mat} map={tex} color={color} transparent depthWrite={false} blending={AdditiveBlending} side={2} toneMapped={false} />
      </mesh>
      {/* A glowing band where the ward meets the floor */}
      <group position={[0, 0, width * 0.04]} rotation={[0, 0, Math.PI / 2]}>
        <mesh geometry={STREAK_GEOMETRY} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, width, 1]}>
          <meshBasicMaterial ref={edge} map={streakTexture()} color={color} transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} side={2} />
        </mesh>
      </group>
    </group>
  );
}
