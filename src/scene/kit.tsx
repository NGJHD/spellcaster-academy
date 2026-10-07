/**
 * PLACEHOLDER architecture kit (§14A.15): code-built modules standing in for the Blender kit.
 * Dimensions follow the documented academy conventions (1 unit = 1 m, doors 2.4–3.2 m, eye 1.6 m).
 */
import { useGLTF, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { Group, Mesh, MeshStandardMaterial, Object3D, Quaternion, SRGBColorSpace, Vector3, type Material } from 'three';
import type { Vec3 } from '../level/rail/railTypes';
import { kitUrl, libraryMaterial, useKit } from './kitGlb';
import { Prop } from './Prop';
import { MAT } from './materials';
import { worldBox, worldCylinder, worldPlane } from './surfaces';

type V3 = readonly [number, number, number];

export function Box({
  position,
  size,
  material,
  rotation = [0, 0, 0],
  shadows = true,
}: {
  position: V3;
  size: V3;
  material: Material;
  rotation?: V3;
  shadows?: boolean;
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} geometry={worldBox(size[0], size[1], size[2])} castShadow={shadows} receiveShadow />
  );
}

/** Box spanning (x0,y0,z0)–(x1,y1,z1). */
export function Slab({
  x: [x0, x1],
  y: [y0, y1],
  z: [z0, z1],
  material,
  shadows = true,
}: {
  x: readonly [number, number];
  y: readonly [number, number];
  z: readonly [number, number];
  material: Material;
  shadows?: boolean;
}) {
  return (
    <Box
      position={[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2]}
      size={[Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)]}
      material={material}
      shadows={shadows}
    />
  );
}

export function Column({ position, height, radius = 0.32, material = MAT.academyStone }: { position: V3; height: number; radius?: number; material?: Material }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.15, 0]} material={MAT.academyStoneDark} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.35, radius * 1.45, 0.3, 20]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={material} geometry={worldCylinder(radius * 0.92, radius, height - 0.5, 24)} castShadow receiveShadow />
      <mesh position={[0, height - 0.12, 0]} material={MAT.academyStoneDark} castShadow>
        <cylinderGeometry args={[radius * 1.4, radius * 1.05, 0.24, 20]} />
      </mesh>
    </group>
  );
}

/** Semicircular arch in the XY plane (rotated by `rotationY`), centred at `position`, spanning `width`. */
export function Arch({ position, width, thickness = 0.35, rotationY = 0, material = MAT.academyStone }: { position: V3; width: number; thickness?: number; rotationY?: number; material?: Material }) {
  return (
    <mesh position={position} rotation={[0, rotationY, 0]} material={material} castShadow receiveShadow>
      <torusGeometry args={[width / 2, thickness / 2, 10, 32, Math.PI]} />
    </mesh>
  );
}

/** Leaded window GLBs built for the sizes the level uses (kit_props.py `window`). */
const WINDOW_SIZES = new Set(['2.2x5', '1.4x2.4', '1.8x4', '2.4x4', '0.7x3', '0.8x3.4']);
const NIGHT_GLASS: Readonly<Record<string, Material>> = { windowGlass: MAT.windowGlassNight };
const DAY_GLASS: Readonly<Record<string, Material>> = { windowGlass: MAT.windowGlassDay };

export function WindowPane({ position, size, rotationY = 0, material = MAT.windowLit, night = false }: { position: V3; size: readonly [number, number]; rotationY?: number; material?: Material; night?: boolean }) {
  const key = `${size[0]}x${size[1]}`;
  if (WINDOW_SIZES.has(key)) {
    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        <KitModel id={`window_${key.replace(/\./g, '_')}`} position={[0, -size[1] / 2, 0]} overrides={night ? NIGHT_GLASS : undefined} />
      </group>
    );
  }
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={material}>
        <planeGeometry args={size} />
      </mesh>
      <mesh position={[0, size[1] / 2, 0]} rotation={[0, 0, Math.PI / 2]} material={MAT.academyStoneDark}>
        <cylinderGeometry args={[0.06, 0.06, size[0] + 0.2, 8, 1, false, 0, Math.PI]} />
      </mesh>
    </group>
  );
}

/** A kit GLB (shared geometry, library materials) placed in the world. */
export function KitModel({ id, position = [0, 0, 0], rotationY = 0, scale = 1, castShadow = true, overrides }: { id: string; position?: V3; rotationY?: number; scale?: number | V3; castShadow?: boolean; overrides?: Readonly<Record<string, Material>> }) {
  const object = useKit(id, castShadow);
  useMemo(() => {
    if (!overrides) return;
    object.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      // Kit materials are already swapped for library ones; match on the library material's key.
      for (const [name, material] of Object.entries(overrides)) if (o.material === (MAT as Record<string, Material>)[name]) o.material = material;
    });
  }, [object, overrides]);
  return <primitive object={object} position={position} rotation={[0, rotationY, 0]} scale={scale} />;
}

export function WallLamp({ position, rotationY = 0, light = false, color = '#ffc98a', intensity = 6 }: { position: V3; rotationY?: number; light?: boolean; color?: string; intensity?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* A brass wall bracket holding a real lantern (CC0 model), its flame glowing (was a box and a ball) */}
      <mesh position={[0, 0.12, 0.1]} rotation={[Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 8]} />
      </mesh>
      <mesh position={[0, 0.02, 0.01]} material={MAT.agedBrass}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
      </mesh>
      <Prop id="Lantern_01" position={[0, -0.18, 0.2]} height={0.34} shadows={false} />
      <mesh position={[0, -0.04, 0.2]} material={MAT.lampGlow}>
        <sphereGeometry args={[0.035, 12, 8]} />
      </mesh>
      {light && <pointLight position={[0, 0.2, 0.45]} color={color} intensity={intensity} distance={8} decay={2} />}
    </group>
  );
}

export function StandingLamp({ position, light = false }: { position: V3; light?: boolean }) {
  return (
    <group position={position}>
      {/* A cast-iron lamp post (CC0 model) */}
      <Prop id="street_lamp_01" position={[0, 0, 0]} height={2.7} />
      {light && <pointLight position={[0, 2.5, 0]} color="#ffc98a" intensity={7} distance={9} decay={2} />}
    </group>
  );
}

/** Instanced books on a shelf unit; one draw call for the books (§14A.19). */
const BOOK_ROWS_TALL = Array.from({ length: 8 }, (_, i) => `bookrow_tall_${i}`);
const BOOK_ROWS_SHORT = Array.from({ length: 4 }, (_, i) => `bookrow_short_${i}`);
const BOOK_ROW_LENGTH = 0.5;
/** Shelves whose base is this high (world metres) use the simplified distant rows. */
const BOOK_LOD_HEIGHT = 4;

/**
 * Oak bookcase (§14A.19): plinth, crown moulding, pilasters and lipped shelves, filled with
 * Blender-built 0.5 m book rows (kit_props.py) chosen per slot. Books never cast shadows.
 */
export function Bookshelf({ position, width = 3, height = 3.6, shelves = 5, rotationY = 0, seed = 1 }: { position: V3; width?: number; height?: number; shelves?: number; rotationY?: number; seed?: number }) {
  const spacing = height / shelves;
  const short = spacing < 0.68;
  const distant = position[1] >= BOOK_LOD_HEIGHT;
  const ids = short ? BOOK_ROWS_SHORT : distant ? BOOK_ROWS_TALL.map((id) => `${id}_lod`) : BOOK_ROWS_TALL;
  const gltfs = useGLTF(ids.map(kitUrl));
  const books = useMemo(() => {
    let s = seed * 9301 + 49297;
    const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    const group = new Group();
    const slots = Math.floor((width - 0.08) / BOOK_ROW_LENGTH);
    const start = -slots * BOOK_ROW_LENGTH * 0.5;
    for (let row = 0; row < shelves; row++) {
      const y = row * spacing + 0.2;
      for (let k = 0; k < slots; k++) {
        if (rand() < 0.05) continue;
        const scene = gltfs[Math.floor(rand() * gltfs.length)]?.scene;
        if (!scene) continue;
        const copy = scene.clone(true);
        copy.position.set(start + k * BOOK_ROW_LENGTH, y, 0);
        group.add(copy);
      }
    }
    group.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.castShadow = false;
      o.receiveShadow = true;
      const shared = libraryMaterial((o.material as Material).name);
      if (shared) o.material = shared;
    });
    return group;
  }, [gltfs, width, shelves, spacing, seed]);

  const w2 = width / 2;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Back panel, plinth, crown and pilasters */}
      <Slab x={[-w2 - 0.05, w2 + 0.05]} y={[0, height]} z={[-0.22, -0.18]} material={MAT.panelWood} />
      <Slab x={[-w2 - 0.1, w2 + 0.1]} y={[0, 0.16]} z={[-0.22, 0.22]} material={MAT.darkOak} />
      <Slab x={[-w2 - 0.08, w2 + 0.08]} y={[0.16, 0.2]} z={[-0.22, 0.2]} material={MAT.darkOak} />
      <Slab x={[-w2 - 0.1, w2 + 0.1]} y={[height, height + 0.06]} z={[-0.22, 0.22]} material={MAT.darkOak} />
      <Slab x={[-w2 - 0.14, w2 + 0.14]} y={[height + 0.06, height + 0.14]} z={[-0.22, 0.26]} material={MAT.darkOak} />
      <Slab x={[-w2 - 0.11, w2 + 0.11]} y={[height + 0.14, height + 0.18]} z={[-0.22, 0.23]} material={MAT.darkOak} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Slab x={side < 0 ? [-w2 - 0.08, -w2] : [w2, w2 + 0.08]} y={[0, height]} z={[-0.22, 0.2]} material={MAT.darkOak} />
          <Slab x={side < 0 ? [-w2 - 0.1, -w2 + 0.02] : [w2 - 0.02, w2 + 0.1]} y={[0.2, height]} z={[0.2, 0.235]} material={MAT.darkOak} />
        </group>
      ))}
      {/* Division posts every ~1.5 m keep long cases believable */}
      {Array.from({ length: Math.max(0, Math.round(width / 1.5) - 1) }, (_, i) => {
        const x = -w2 + (width / Math.round(width / 1.5)) * (i + 1);
        return <Slab key={i} x={[x - 0.025, x + 0.025]} y={[0.2, height]} z={[-0.2, 0.2]} material={MAT.darkOak} />;
      })}
      {Array.from({ length: shelves }, (_, row) => (
        <group key={row}>
          <Slab x={[-w2, w2]} y={[row * spacing + 0.16, row * spacing + 0.2]} z={[-0.2, 0.19]} material={MAT.darkOak} />
          <Slab x={[-w2, w2]} y={[row * spacing + 0.15, row * spacing + 0.2]} z={[0.19, 0.215]} material={MAT.darkOak} />
        </group>
      ))}
      <primitive object={books} />
    </group>
  );
}

export function Bench({ position, rotationY = 0, upholstered = false }: { position: V3; rotationY?: number; upholstered?: boolean }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box position={[0, 0.45, 0]} size={[1.8, 0.08, 0.5]} material={upholstered ? MAT.navyCloth : MAT.lightOak} />
      {[-0.75, 0.75].map((x) => (
        <Box key={x} position={[x, 0.21, 0]} size={[0.08, 0.42, 0.42]} material={MAT.agedBrass} />
      ))}
      <Box position={[0, 0.78, -0.22]} size={[1.8, 0.4, 0.06]} material={upholstered ? MAT.navyCloth : MAT.lightOak} />
    </group>
  );
}

/** Rounded leafy shrub cluster (several overlapping spheres). */
/** A photo-scanned CC0 shrub (four species), chosen by seed. */
export function Shrub({ position, size = 1, seed = 1 }: { position: V3; size?: number; seed?: number }) {
  const id = `shrub_0${(Math.abs(Math.round(seed)) % 4) + 1}`;
  return <Prop id={id} position={position} height={size} rotationY={seed * 1.7} lodDistance={30} />;
}

export function Planter({ position, size = 1.4, seed = 1 }: { position: V3; size?: number; seed?: number }) {
  return (
    <group position={position}>
      <KitModel id="planter_stone" scale={[size / 1.6, 1.1, size / 1.0]} />
      <Shrub position={[0, 0.77, 0]} size={size * 0.75} seed={seed} />
    </group>
  );
}

export function Banner({ position, rotationY = 0, width = 1.1, height = 3 }: { position: V3; rotationY?: number; width?: number; height?: number }) {
  const ref = useRef<Object3D>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.9 + position[0]) * 0.03;
  });
  // Cloth banner (kit_props banner_cloth: folds, forked tail, gilt border, emblem) swaying from its rod.
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <group ref={ref}>
        <KitModel id="banner_cloth" scale={[width / 1.1, height / 3.6, 1]} />
      </group>
    </group>
  );
}

export function Rug({ position, size, rotationY = 0, material = MAT.carpet }: { position: V3; size: readonly [number, number]; rotationY?: number; material?: Material }) {
  return (
    <mesh position={[position[0], position[1] + 0.012, position[2]]} rotation={[-Math.PI / 2, 0, rotationY]} material={material} geometry={worldPlane(size[0], size[1])} receiveShadow />
  );
}

/** Simple portrait frame with a painted canvas tint (original, abstract figures). */
/** Painted canvases (scripts/paint_portraits.py) and the frame GLB for each canvas size. */
export const PAINTINGS = [
  'painting_0', 'painting_1', 'painting_2', 'painting_3', 'painting_4', 'painting_5',
  'painting_6', 'painting_7', 'painting_8', 'painting_9', 'landscape_0', 'landscape_1',
] as const;
const FRAME_SIZES = new Set(['1.1x1.4', '1x1.3', '1.6x1.1']);

/** A framed oil painting on a wall (§14A.20). `painting` names a canvas texture. */
export function Portrait({ position, rotationY = 0, size = [1.1, 1.4], painting = 'painting_0' }: { position: V3; rotationY?: number; size?: readonly [number, number]; painting?: string }) {
  const key = `${size[0]}x${size[1]}`;
  if (!FRAME_SIZES.has(key)) return null;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <FramedCanvas frame={`frame_${key.replace(/\./g, '_')}`} painting={painting} />
    </group>
  );
}

function FramedCanvas({ frame, painting }: { frame: string; painting: string }) {
  const object = useKit(frame);
  const map = useTexture(`${import.meta.env.BASE_URL}assets/textures/paintings/${painting}.jpg`);
  useMemo(() => {
    map.colorSpace = SRGBColorSpace;
    // glTF UVs put the image origin top-left.
    map.flipY = false;
    map.needsUpdate = true;
    map.anisotropy = 8;
    // Varnished oil: a soft sheen, no metal.
    const canvas = new MeshStandardMaterial({ map, roughness: 0.42 });
    object.traverse((o) => {
      if (o instanceof Mesh && (o.material as Material).name === 'portraitCanvas') o.material = canvas;
    });
  }, [object, map]);
  return <primitive object={object} />;
}

/** Spiral or straight stair steps between two heights along a path. */
export function Steps({ from, to, width = 2, count = 12, material = MAT.academyStone }: { from: Vec3; to: Vec3; width?: number; count?: number; material?: Material }) {
  const steps = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const yaw = Math.atan2(dir.x, dir.z);
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw);
    const depth = Math.hypot(dir.x, dir.z) / count;
    return Array.from({ length: count }, (_, i) => {
      const u = (i + 0.5) / count;
      return { p: a.clone().lerp(b, u), q, depth, rise: dir.y / count, i };
    });
  }, [from, to, count]);
  return (
    <group>
      {steps.map((s) => (
        <mesh key={s.i} position={[s.p.x, s.p.y - Math.abs(s.rise) / 2, s.p.z]} quaternion={s.q} material={material} castShadow receiveShadow>
          <boxGeometry args={[width, Math.abs(s.rise) + 0.05, s.depth + 0.02]} />
        </mesh>
      ))}
    </group>
  );
}


interface FacadeProps {
  /** Centre of the wall's base. The decorated face points along local +Z (rotate with `rotationY`). */
  readonly position: V3;
  readonly length: number;
  readonly height: number;
  readonly thickness?: number;
  readonly rotationY?: number;
  /** Bay width: one pilaster and one window column per bay. */
  readonly bay?: number;
  /** Window rows as [sill height, window height]. */
  readonly windows?: readonly (readonly [number, number])[];
  readonly crenellations?: boolean;
  readonly glass?: Material;
  readonly wall?: Material;
}

/**
 * Academy façade (§14A.15 wall modules): plinth, pilasters, cornice, framed arched windows and
 * optional crenellations, so large walls read as constructed masonry rather than flat boxes.
 */
export function Facade({
  position,
  length,
  height,
  thickness = 1,
  rotationY = 0,
  bay = 5,
  windows = [],
  crenellations = false,
  glass = MAT.windowGlow,
  wall = MAT.academyStone,
}: FacadeProps) {
  const bays = Math.max(1, Math.round(length / bay));
  const step = length / bays;
  const face = thickness / 2;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box position={[0, height / 2, 0]} size={[length, height, thickness]} material={wall} />
      <Box position={[0, 0.35, face + 0.08]} size={[length + 0.2, 0.7, 0.16]} material={MAT.academyStoneDark} />
      <Box position={[0, height - 0.25, face + 0.14]} size={[length + 0.4, 0.5, 0.28]} material={MAT.academyStoneDark} />
      <Box position={[0, height - 0.6, face + 0.07]} size={[length + 0.2, 0.18, 0.14]} material={MAT.academyStoneDark} />
      {Array.from({ length: bays + 1 }, (_, i) => -length / 2 + i * step).map((x) => (
        <Box key={`p${x.toFixed(2)}`} position={[x, height / 2, face + 0.1]} size={[0.55, height - 0.9, 0.2]} material={MAT.academyStoneDark} />
      ))}
      {windows.flatMap(([sill, h]) =>
        Array.from({ length: bays }, (_, i) => -length / 2 + (i + 0.5) * step).map((x) => {
          const w = Math.min(1.6, step * 0.42);
          return (
            <group key={`w${x.toFixed(2)}-${sill}`} position={[x, sill, face]}>
              {/* Leaded glazing (kit leaded_light: 1 x 2 m arch) scaled to the opening; dark day glass outside. */}
              <KitModel id="leaded_light" position={[0, 0, 0.02]} scale={[w, (h + w / 2) / 2, 1]} castShadow={false} overrides={glass === MAT.windowGlow ? DAY_GLASS : undefined} />
              <Box position={[-w / 2 - 0.09, h / 2, 0.06]} size={[0.18, h, 0.14]} material={MAT.academyStoneDark} />
              <Box position={[w / 2 + 0.09, h / 2, 0.06]} size={[0.18, h, 0.14]} material={MAT.academyStoneDark} />
              <Box position={[0, -0.06, 0.1]} size={[w + 0.5, 0.12, 0.22]} material={MAT.academyStoneDark} />
              <mesh position={[0, h, 0.06]} material={MAT.academyStoneDark}>
                <torusGeometry args={[w / 2 + 0.09, 0.09, 8, 20, Math.PI]} />
              </mesh>
              <Box position={[0, h / 2, 0.02]} size={[0.05, h, 0.04]} material={MAT.darkSteel} shadows={false} />
            </group>
          );
        }),
      )}
      {crenellations &&
        Array.from({ length: Math.floor(length / 1.2) }, (_, i) => -length / 2 + 0.6 + i * 1.2).map((x, i) =>
          i % 2 === 0 ? <Box key={`c${i}`} position={[x, height + 0.4, 0]} size={[0.7, 0.8, thickness]} material={wall} /> : null,
        )}
    </group>
  );
}

/** Gable roof along local X: two slate slopes and stone gable ends. */
export function GableRoof({ position, length, span, rise, rotationY = 0 }: { position: V3; length: number; span: number; rise: number; rotationY?: number }) {
  const slope = Math.hypot(span / 2, rise);
  const angle = Math.atan2(rise, span / 2);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} position={[0, rise / 2, (s * span) / 4]} rotation={[s * angle, 0, 0]}>
          <Box position={[0, 0, 0]} size={[length + 0.6, 0.2, slope + 0.4]} material={MAT.slate} />
        </group>
      ))}
      <Box position={[0, rise + 0.1, 0]} size={[length + 0.7, 0.25, 0.35]} material={MAT.academyStoneDark} />
    </group>
  );
}
