/**
 * The view ahead from the Rift Shore (owner, 2026-10-23: "the scene doesn't make sense"): a dirt path
 * winds from the shore through the dead forest to the edge of the plain, where a stream of molten ink
 * steps down a gorge along the path and pours off the cliff into the paper sea (owner, 2026-10-23: the
 * sea itself is plain paper, no ink across it); the Cinder Citadel stands small on the
 * sea's far shore. Area-local coordinates (inside the shore's group), along −Z.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { BufferGeometry, Color, Float32BufferAttribute, LinearSRGBColorSpace, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2 } from 'three';
import { SHORE_CITADEL_AT, SHORE_CLIFF_Z, SHORE_SEA_Y, shorePathX } from '../../level/areas3/journey1';
import { CinderCitadel } from '../CinderCitadel';
import { Fire } from '../Fire';
import { Slab } from '../kit';
import { MergeStatic } from '../MergeStatic';
import { MAT } from '../materials';
import { surface } from '../surfaceTextures';

/**
 * Far ink (owner, 2026-10-23: "strips of yellow like the actual inkfall", not a flat orange blob). Seen
 * almost edge-on from the Warden's palm, the molten texture's thin seams blur to a pale average, so the far
 * cascade and the stream are a deep red base with bright yellow streaks modelled along the flow, which
 * stay visible at a grazing angle. Kept clear of the haze; the streaks flicker like the molten glow.
 */
const farInk = new MeshBasicMaterial({ color: '#9c220c', fog: false });
const hotInk = new MeshBasicMaterial({ color: '#ffb02a', fog: false });
const HOT = new Color('#ffd250');
const WARM = new Color('#ff7a1a');
/** Streaks across the ink's width, as fractions of its half-width. */
const STREAKS = [-0.72, -0.38, -0.05, 0.3, 0.64] as const;
/** Where the path meets the falls. */
const FALLS_X = shorePathX(SHORE_CLIFF_Z);
/** The cliff face, a little beyond the edge of the plain. */
const FACE_Z = SHORE_CLIFF_Z - 2;

/**
 * A realistic dirt track (owner, 2026-10-23: "not a block of solid colour"): photo-scanned soil with a
 * strong normal map, shaded across its width (a worn, paler middle, two darker wheel ruts) and in patches
 * along it, its edges feathering out into the ash rather than stopping at a hard line.
 */
// Seen from tens of metres up, so it uses an aerial scan of stony ground at a large tile (a close-up soil
// scan blurred to a flat brown), tinted to dry earth.
const SOIL = `${import.meta.env.BASE_URL}assets/textures/aerial_rocks_02/`;
const dirtMaterial = (() => {
  const load = (f: string, srgb: boolean) => {
    const t = new TextureLoader().load(`${SOIL}${f}.jpg`);
    t.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    t.repeat.set(1 / 9, 1 / 9);
    t.anisotropy = 8;
    return t;
  };
  const arm = load('arm', false);
  return new MeshStandardMaterial({
    map: load('diff', true),
    normalMap: load('nor', false),
    normalScale: new Vector2(1.6, 1.6),
    roughnessMap: arm,
    aoMap: arm,
    color: '#c89870',
    roughness: 1,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
  });
})();
/** Across the track (fraction of its width), its shade and how solid it is: feathered edges, ruts, a worn middle. */
const ACROSS: readonly (readonly [number, number, number])[] = [
  [0, 0.55, 0], [0.08, 0.62, 0.8], [0.16, 0.9, 1], [0.25, 0.5, 1], [0.31, 0.95, 1], [0.5, 1.2, 1],
  [0.69, 0.95, 1], [0.75, 0.5, 1], [0.84, 0.9, 1], [0.92, 0.62, 0.8], [1, 0.55, 0],
];

function DirtPath({ z0, z1, width }: { z0: number; z1: number; width: number }) {
  const geometry = useMemo(() => {
    const pos: number[] = [];
    const uv: number[] = [];
    const col: number[] = [];
    const index: number[] = [];
    const steps = Math.ceil(Math.abs(z1 - z0) / 1.5);
    const cols = ACROSS.length;
    let along = 0;
    let px = shorePathX(z0);
    let pz = z0;
    for (let i = 0; i <= steps; i++) {
      const z = z0 + ((z1 - z0) * i) / steps;
      const x = shorePathX(z);
      along += Math.hypot(x - px, z - pz);
      px = x;
      pz = z;
      const dx = shorePathX(z - 0.5) - shorePathX(z + 0.5);
      const len = Math.hypot(dx, 1);
      // Patches along the track: damp darker stretches and dusty paler ones.
      const patch = 0.88 + 0.16 * Math.sin(along * 0.05) + 0.1 * Math.sin(along * 0.19 + 1.3);
      for (let c = 0; c < cols; c++) {
        const [f, shade, alpha] = ACROSS[c] ?? [0, 1, 1];
        // The edges wander a little, so the track is not ruler-straight.
        const wobble = c === 0 || c === cols - 1 ? Math.sin(along * 0.11 + c) * 1.2 : 0;
        const o = (f - 0.5) * width + wobble * (c === 0 ? -1 : 1);
        pos.push(x + (1 / len) * o, 0.03, z + (dx / len) * o);
        uv.push(f * width, along);
        const k = shade * patch;
        col.push(k, k, k, alpha);
        if (i > 0 && c > 0) {
          const a = (i - 1) * cols + c - 1;
          const b = i * cols + c - 1;
          index.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new Float32BufferAttribute(col, 4));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, [z0, z1, width]);
  return <mesh geometry={geometry} material={dirtMaterial} receiveShadow />;
}

/**
 * The inkfall cascade (owner, 2026-10-23: "the inkfall cascade should be here", on the far stretch of the
 * path): the path becomes a gorge winding down through the forest, the ink stepping down it in short tiers
 * that follow the bends, until it pours out of the cliff into the paper sea.
 */
export const GORGE_TOP_Z = SHORE_CLIFF_Z + 140;
const TIERS = 14;
const TIER_LENGTH = (GORGE_TOP_Z - FACE_Z) / TIERS;
/** The block of ground the gorge is cut through (x range, area-local): the plain's ground stops here. */
export const GORGE_X: readonly [number, number] = (() => {
  let lo = Infinity;
  let hi = -Infinity;
  for (let z = GORGE_TOP_Z; z >= FACE_Z; z -= 2) {
    lo = Math.min(lo, shorePathX(z));
    hi = Math.max(hi, shorePathX(z));
  }
  return [Math.floor(lo - 60), Math.ceil(hi + 60)];
})();
/** Half-width of the ink in the gorge at tier `i`: it widens as it falls. */
const gorgeHalf = (i: number) => 6 + i * 0.35;

/** How far the ink steps down inside the gorge; shallow, so the falls stay in view from the Warden's palm. */
const GORGE_DEPTH = 4;

function Cascade() {
  const drop = GORGE_DEPTH / TIERS;
  const end = shorePathX(FACE_Z);
  const ew = gorgeHalf(TIERS);
  const [g0, g1] = GORGE_X;
  return (
    <group>
      {Array.from({ length: TIERS }, (_, i) => {
        const top = -drop * (i + 1);
        const z0 = GORGE_TOP_Z - i * TIER_LENGTH;
        const z1 = z0 - TIER_LENGTH;
        const x = shorePathX((z0 + z1) / 2);
        const w = gorgeHalf(i);
        return (
          <group key={i}>
            {/* The forest floor either side, its rock walls dropping into the gorge */}
            <Slab x={[g0, x - w]} y={[SHORE_SEA_Y - 8, -0.3]} z={[z1, z0]} material={MAT.rockGround} />
            <Slab x={[x + w, g1]} y={[SHORE_SEA_Y - 8, -0.3]} z={[z1, z0]} material={MAT.rockGround} />
            <Slab x={[g0, x - w]} y={[-0.3, 0]} z={[z1, z0]} material={MAT.burntGround} />
            <Slab x={[x + w, g1]} y={[-0.3, 0]} z={[z1, z0]} material={MAT.burntGround} />
            {/* The rock step under this tier */}
            <Slab x={[x - w, x + w]} y={[SHORE_SEA_Y - 8, top]} z={[z1, z0]} material={MAT.rockGround} />
            {/* The ink on the step, and the sheet pouring over its lip to the next */}
            <Slab x={[x - w, x + w]} y={[top, top + 0.12]} z={[z1, z0]} material={farInk} />
            <Slab x={[x - w, x + w]} y={[top - drop, top + 0.12]} z={[z1 - 0.4, z1]} material={farInk} />
            {/* Yellow-hot streaks along the flow, and down over the lip */}
            {STREAKS.map((f, k) => {
              const sx = x + f * w + Math.sin(i * 1.7 + k * 2.3) * 0.12 * w;
              const sw = 0.35 + ((i + k) % 3) * 0.2;
              return (
                <group key={k}>
                  <Slab x={[sx - sw, sx + sw]} y={[top + 0.12, top + 0.18]} z={[z1, z0]} material={hotInk} />
                  <Slab x={[sx - sw, sx + sw]} y={[top - drop, top + 0.18]} z={[z1 - 0.5, z1 - 0.38]} material={hotInk} />
                </group>
              );
            })}
          </group>
        );
      })}
      {/* The last fall, off the cliff into the sea */}
      <Slab x={[end - ew, end + ew]} y={[SHORE_SEA_Y - 8, -GORGE_DEPTH]} z={[FACE_Z, SHORE_CLIFF_Z]} material={MAT.rockGround} />
      <Slab x={[end - ew, end + ew]} y={[SHORE_SEA_Y, -GORGE_DEPTH + 0.12]} z={[FACE_Z - 0.4, FACE_Z]} material={farInk} />
      {STREAKS.map((f, k) => (
        <Slab key={k} x={[end + f * ew - 0.5, end + f * ew + 0.5]} y={[SHORE_SEA_Y, -GORGE_DEPTH + 0.18]} z={[FACE_Z - 0.5, FACE_Z - 0.38]} material={hotInk} />
      ))}
    </group>
  );
}

/**
 * The paper sea below the plain: matte folded paper with low creases rolling slowly towards the shore
 * (18k vertices, against the Paper Sea's 33k).
 */
function DistantPaperSea() {
  const { geometry, material, base } = useMemo(() => {
    const w = 3000;
    const d = 1100;
    const g = new PlaneGeometry(w, d, 160, 110);
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0, FACE_Z - d / 2);
    const m = surface('paper', [w, d], 14);
    m.color.set('#f0e2c8');
    m.roughness = 1;
    m.envMapIntensity = 0.1;
    // Crests pale and troughs shadowed by vertex colour as well as by the light, so the folds still read
    // through the haze at 500 m (lighting alone left the sea a flat lilac).
    m.vertexColors = true;
    g.setAttribute('color', new Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 3).fill(1), 3));
    return { geometry: g, material: m, base: Float32Array.from(g.getAttribute('position').array) };
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = geometry.getAttribute('position');
    const arr = pos.array as Float32Array;
    const colour = geometry.getAttribute('color');
    const shade = colour.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i] ?? 0;
      const z = base[i + 2] ?? 0;
      // Tall folded crests (owner, 2026-10-23: the waves could not be seen from the Rift): long enough to
      // read across 500 m, sharp enough at the fold to catch the red light.
      const crease = 1 - Math.abs(Math.sin(z * 0.03 - t * 0.5 + Math.sin(x * 0.012) * 1.1));
      const cross = 1 - Math.abs(Math.sin(x * 0.02 + z * 0.008 + t * 0.3));
      const h = crease * crease * 4.2 + cross * 1.1 + Math.sin((x + z) * 0.008 + t * 0.25) * 1.2;
      arr[i + 1] = h;
      const k = 0.42 + 0.58 * Math.min(1, Math.max(0, (h + 1.2) / 6.5));
      shade[i] = k;
      shade[i + 1] = k * 0.97;
      shade[i + 2] = k * 0.93;
    }
    pos.needsUpdate = true;
    colour.needsUpdate = true;
    geometry.computeVertexNormals();
  });
  return <mesh geometry={geometry} material={material} position={[0, SHORE_SEA_Y, 0]} receiveShadow />;
}

export function ShoreVista() {
  const x = FALLS_X;
  // The hot streaks breathe like the molten glow.
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    hotInk.color.copy(WARM).lerp(HOT, 0.6 + Math.sin(t * 1.7) * 0.25 + Math.sin(t * 4.1) * 0.1);
  });
  return (
    <group name="shore-vista">
      {/* The dirt path fills the corridor between the tree lines (owner, 2026-10-23) right up to the head
          of the falls */}
      <DirtPath z0={-34} z1={GORGE_TOP_Z} width={28} />
      {/* The edge of the plain, dropping to the sea, open where the gorge comes out */}
      <Slab x={[-1500, x - gorgeHalf(TIERS)]} y={[SHORE_SEA_Y - 8, 0]} z={[FACE_Z, SHORE_CLIFF_Z]} material={MAT.rockGround} />
      <Slab x={[x + gorgeHalf(TIERS), 1500]} y={[SHORE_SEA_Y - 8, 0]} z={[FACE_Z, SHORE_CLIFF_Z]} material={MAT.rockGround} />
      {/* About 230 static blocks: batched into one draw per material (§15) */}
      <MergeStatic>
        <Cascade />
      </MergeStatic>
      {[-1, 1].map((s) => (
        <Fire key={s} position={[shorePathX(GORGE_TOP_Z) + s * 9, 0.4, GORGE_TOP_Z + 4]} size={4} count={3} spread={4} />
      ))}
      <DistantPaperSea />
      {/* The Cinder Citadel on the sea's far shore, small with distance */}
      <group position={SHORE_CITADEL_AT}>
        <CinderCitadel distant />
      </group>
    </group>
  );
}
