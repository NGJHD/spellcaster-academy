/**
 * The Cinder Citadel (Level 3; owner 2026-10-07: "can you have a nicer fortress? it looks like it was
 * created in power point"). A fortress on a rocky mount: a ring of AI-pipeline citadel towers joined
 * by crenellated curtain walls of photo-scanned volcanic stone, a tall central keep with two lesser
 * spires, a glowing gate and rivers of molten ink pouring down the mount.
 * Local units are metres with the mount's foot at y = 0; the gate faces +Z.
 * `distant` renders it as part of the sky (no fog, warmed towards the horizon glow) for the horizon view.
 */
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { AdditiveBlending, Box3, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshStandardMaterial, Vector3, type Material, type Object3D } from 'three';
import { moltenInk, useMoltenFlow } from './molten';
import { worldCylinder } from './surfaces';
import { Box } from './kit';
import { MAT } from './materials';
import { propUrl } from './Prop';

const RING = 46;
const WALL_H = 26;
const MOUNT_H = 30;
const OUTER = [0, 1, 2, 3, 4, 5].map((i) => {
  const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
  return [Math.sin(a) * RING, Math.cos(a) * RING] as const;
});
const HAZE = new Color('#7a2a18');
/** The curtain wall facing +Z (between OUTER[5] and OUTER[0]); the gatehouse model stands there. */
const FRONT_WALL = 5;

/** Distance from the mount's axis to its rocky surface at angle `phi` (from +Z towards +X) and height `y`. */
function mountSurface(phi: number, y: number): number {
  // Both rock cones are faceted (11 and 9 sides), so the surface lies inside the round radius between edges.
  const facet = (r: number, sides: number, offset: number) => {
    const seg = (Math.PI * 2) / sides;
    const a = ((((phi - offset) % seg) + seg) % seg) - seg / 2;
    return (r * Math.cos(seg / 2)) / Math.cos(a);
  };
  const upper = facet(RING + 14 + 32 * (1 - y / MOUNT_H), 11, 0);
  const lower = y <= MOUNT_H * 0.5 ? facet(RING + 40 + 30 * (1 - y / (MOUNT_H * 0.5)), 9, 0.4) : 0;
  return Math.max(upper, lower);
}

/**
 * A river of molten ink winding down the mount from the foot of the walls, hugging the rock (owner,
 * 2026-10-16: the old rivers were "2 long strips of solid orange block"). UVs are in metres so the
 * molten crust texture keeps its scale.
 */
function riverGeometry(angle: number, seed: number): BufferGeometry {
  const steps = 90;
  const positions: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  let run = 0;
  let prev: Vector3 | null = null;
  for (let k = 0; k <= steps; k++) {
    const s = k / steps;
    const y = MOUNT_H * (1 - s) + 0.2;
    const r0 = mountSurface(angle, y);
    const phi = angle + (Math.sin(s * 7 + seed) * 2.2 + Math.sin(s * 17 + seed * 2) * 0.6) / r0;
    const r = mountSurface(phi, y) + 0.25;
    const centre = new Vector3(Math.sin(phi) * r, y, Math.cos(phi) * r);
    if (prev) run += centre.distanceTo(prev);
    prev = centre;
    const half = (2.6 + s * 4 + Math.sin(s * 11 + seed) * 0.6) / 2;
    const across = new Vector3(Math.cos(phi), 0, -Math.sin(phi));
    for (const side of [-1, 1]) {
      const p = centre.clone().addScaledVector(across, side * half);
      positions.push(p.x, p.y, p.z);
      uvs.push(side * half, run);
    }
    if (k > 0) {
      const a = (k - 1) * 2;
      index.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(positions, 3));
  g.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

const RIVERS = [0.3, -0.36, 2.1, 4.2];

/** Clones a material for the sky view: no fog, its colour pulled towards the horizon glow. */
function skyMaterial(m: Material): Material {
  const c = m.clone();
  if (c instanceof MeshStandardMaterial) {
    c.fog = false;
    c.color.lerp(HAZE, 0.35);
  }
  return c;
}

function useTower(distant: boolean): Object3D {
  const { scene } = useGLTF(propUrl('citadel_tower'));
  return useMemo(() => {
    if (!distant) return scene;
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) o.material = Array.isArray(o.material) ? o.material.map(skyMaterial) : skyMaterial(o.material as Material);
    });
    return clone;
  }, [scene, distant]);
}

/**
 * The gatehouse at the front (owner, 2026-10-08: "the front of the cinder citadel looks blockish"): an
 * AI-pipeline model (`citadel_gate`, built on the RTX 3080) of a riveted black iron curtain wall between
 * two spired towers, with a fiery arched gate. It replaces the front wall segment and the flat gate glow.
 */
const GATE_WIDTH = 56;
function GateHouse({ distant }: { distant: boolean }) {
  const { scene } = useGLTF(propUrl('citadel_gate'));
  const { object, scale, lift } = useMemo(() => {
    const clone = scene.clone(true);
    if (distant) {
      clone.traverse((o) => {
        if (o instanceof Mesh) o.material = Array.isArray(o.material) ? o.material.map(skyMaterial) : skyMaterial(o.material as Material);
      });
    }
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const k = size.x > 0 ? GATE_WIDTH / size.x : 1;
    return { object: clone, scale: k, lift: -box.min.y * k };
  }, [scene, distant]);
  return <primitive object={object} position={[0, lift - 1, RING * Math.cos(Math.PI / 6) + 1.5]} scale={scale} />;
}

/** One tower: `h` metres tall (the source model is scaled to height). */
function Tower({ source, position, h, rotationY }: { source: Object3D; position: [number, number, number]; h: number; rotationY: number }) {
  // The GLB is 60 m tall at scale 1 (its bounds run from y = 0 to 60); scale to h.
  const object = useMemo(() => source.clone(true), [source]);
  return <primitive object={object} position={position} scale={h / 60} rotation={[0, rotationY, 0]} />;
}

export function CinderCitadel({ distant = false }: { distant?: boolean }) {
  const tower = useTower(distant);
  const stone = useMemo(() => (distant ? skyMaterial(MAT.volcanicStone) : MAT.volcanicStone) as MeshStandardMaterial, [distant]);
  const rock = useMemo(() => (distant ? skyMaterial(MAT.rockGround) : MAT.rockGround) as MeshStandardMaterial, [distant]);
  const rivers = useMemo(() => RIVERS.map((a, i) => riverGeometry(a, i * 1.7)), []);
  const lava = useMemo(() => {
    const m = moltenInk().clone();
    m.side = DoubleSide;
    m.fog = !distant;
    m.emissiveIntensity = 3.2;
    return m;
  }, [distant]);
  useMoltenFlow();
  const walls = OUTER.map(([x, z], i) => {
    const [nx, nz] = OUTER[(i + 1) % OUTER.length] ?? [0, 0];
    const len = Math.hypot(nx - x, nz - z);
    const mid: [number, number] = [(x + nx) / 2, (z + nz) / 2];
    const yaw = Math.atan2(nx - x, nz - z) + Math.PI / 2;
    return { mid, len, yaw };
  });
  return (
    <group>
      {/* A wide rocky skirt running down below the horizon, so the fortress never floats */}
      <mesh position={[0, -70, 0]} material={rock} geometry={worldCylinder(RING + 70, RING + 230, 140, 13)} />
      {/* The rocky mount, stepped like a broken cliff */}
      {/* (Metre UVs, so the rock texture is not smeared into stripes across the slope) */}
      <mesh position={[0, MOUNT_H / 2, 0]} material={rock} geometry={worldCylinder(RING + 14, RING + 46, MOUNT_H, 11)} />
      <mesh position={[0, MOUNT_H * 0.25, 0]} rotation={[0, 0.4, 0]} material={rock} geometry={worldCylinder(RING + 40, RING + 70, MOUNT_H * 0.5, 9)} />
      {/* Molten ink pouring down the mount from the gate and the walls */}
      {/* Each river lies along the slope (owner: an upright glowing slab at the front looked blockish),
          to either side of the gate rather than over it. */}
      {rivers.map((g, i) => (
        <mesh key={i} geometry={g} material={lava} />
      ))}
      <group position={[0, MOUNT_H, 0]}>
        {/* Curtain walls with crenellations */}
        {walls.map(({ mid, len, yaw }, i) => (i === FRONT_WALL ? null : (
          <group key={i} position={[mid[0], 0, mid[1]]} rotation={[0, yaw, 0]}>
            <Box position={[0, WALL_H / 2, 0]} size={[len, WALL_H, 6]} material={stone} />
            {Array.from({ length: Math.floor(len / 5) }, (_, k) => (
              <Box key={k} position={[-len / 2 + 2.5 + k * 5, WALL_H + 1.4, 0]} size={[2.6, 2.8, 6.4]} material={stone} />
            ))}
          </group>
        )))}
        {/* The gatehouse across the front, with its burning gate */}
        <GateHouse distant={distant} />
        {/* Ring towers, the keep and its spires */}
        {OUTER.map(([x, z], i) => (
          <Tower key={i} source={tower} position={[x, -2, z]} h={WALL_H + 30 + (i % 3) * 8} rotationY={i * 1.1} />
        ))}
        <Tower source={tower} position={[0, -4, -6]} h={150} rotationY={0.3} />
        <Tower source={tower} position={[-20, -4, -14]} h={104} rotationY={2.2} />
        <Tower source={tower} position={[22, -4, -10]} h={96} rotationY={4} />
        {/* Firelight glowing up the keep */}
        <mesh position={[0, 60, 0]}>
          <sphereGeometry args={[60, 20, 12]} />
          <meshBasicMaterial color="#ff4010" transparent opacity={0.07} blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={!distant} />
        </mesh>
      </group>
    </group>
  );
}
useGLTF.preload(propUrl('citadel_tower'));
useGLTF.preload(propUrl('citadel_gate'));
