/**
 * The apprentice's dormitory bedroom (Level 2 opening, see src/level/areas2/bedroom.ts): a stone room
 * inside the Dormitory Tower with a wooden floor, a four-poster bed, a wardrobe, a desk and a tall
 * window on the −Z wall that looks out over the burning lawn, the lake and the Rift.
 * Kit boxes use the shared photo-scanned materials; the bed and wardrobe are AI-pipeline props.
 */
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { SphereGeometry, type PointLight } from 'three';
import { BEDROOM_CENTRE, BEDROOM_HALF as H, BEDROOM_HEIGHT as T } from '../../level/areas2/bedroom';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { Box, Slab } from '../kit';
import { MAT } from '../materials';
import { Prop } from '../Prop';
import { worldCylinder } from '../surfaces';

const W = 0.3; // wall thickness
/** Window opening on the −Z wall. */
const WIN = { x: [-1.3, 1.3], y: [0.7, 3.0] } as const;
/** Door opening on the −X wall. */
const DOOR = { z: [0.3, 1.7], y: [0, 2.3] } as const;

function Fallback({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return <Box position={position} size={size} material={MAT.darkOak} />;
}

function Furniture({ id, position, size, height, rotationY = 0 }: { id: string; position: [number, number, number]; size: [number, number, number]; height: number; rotationY?: number }) {
  const fallback = <Fallback position={[position[0], position[1] + size[1] / 2, position[2]]} size={size} />;
  return (
    <ModelBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Prop id={id} position={position} height={height} rotationY={rotationY} />
      </Suspense>
    </ModelBoundary>
  );
}

/** Firelight from outside flickers through the window. */
function FireGlow() {
  const light = useRef<PointLight>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (light.current) light.current.intensity = 22 + Math.sin(t * 7) * 5 + Math.sin(t * 13.3) * 4;
  });
  return <pointLight ref={light} position={[0, 2.2, -H - 1.5]} color="#ff6a2a" distance={12} decay={1.6} />;
}

/**
 * A four-poster bed built from photo-scanned wood and cloth (the AI bed's posts came out as flat
 * shards): turned posts, a panelled frame, a mattress, a patchwork quilt pulled back and two soft
 * pillows. Headboard towards +Z, 2.2 m long.
 */
function FourPosterBed({ position }: { position: [number, number, number] }) {
  const pillow = useMemo(() => new SphereGeometry(0.5, 24, 12).scale(0.62, 0.16, 0.34), []);
  return (
    <group position={position}>
      {[[-0.72, -1.05], [0.72, -1.05], [-0.72, 1.05], [0.72, 1.05]].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x ?? 0, 0, z ?? 0]}>
          <mesh position={[0, 1.05, 0]} material={MAT.darkOak} geometry={worldCylinder(0.05, 0.06, 2.1, 16)} castShadow />
          <mesh position={[0, 0.25, 0]} material={MAT.darkOak} geometry={worldCylinder(0.08, 0.08, 0.5, 16)} />
          <mesh position={[0, 2.14, 0]} material={MAT.darkOak}>
            <sphereGeometry args={[0.07, 16, 10]} />
          </mesh>
        </group>
      ))}
      {/* Canopy rails, frame, headboard and footboard */}
      {[-1.05, 1.05].map((z) => (
        <Box key={`r${z}`} position={[0, 2.05, z]} size={[1.5, 0.08, 0.08]} material={MAT.darkOak} />
      ))}
      {[-0.72, 0.72].map((x) => (
        <Box key={`s${x}`} position={[x, 2.05, 0]} size={[0.08, 0.08, 2.2]} material={MAT.darkOak} />
      ))}
      <Box position={[0, 0.3, 0]} size={[1.4, 0.24, 2.1]} material={MAT.darkOak} />
      <Box position={[0, 0.85, 1.05]} size={[1.36, 0.9, 0.06]} material={MAT.panelWood} />
      <Box position={[0, 0.55, -1.05]} size={[1.36, 0.36, 0.06]} material={MAT.panelWood} />
      {/* Mattress, sheet and quilt (pulled back from the pillows) */}
      <Box position={[0, 0.52, 0]} size={[1.3, 0.2, 2.0]} material={MAT.linen} />
      <Box position={[0, 0.635, -0.25]} size={[1.36, 0.05, 1.5]} material={MAT.jacquard} />
      <Box position={[0, 0.66, 0.42]} size={[1.36, 0.06, 0.18]} material={MAT.jacquard} />
      {[-0.32, 0.32].map((x) => (
        <mesh key={x} position={[x, 0.7, 0.78]} geometry={pillow} material={MAT.linen} />
      ))}
      {/* Chest at the foot of the bed */}
      <Box position={[0, 0.24, -1.4]} size={[1.0, 0.48, 0.42]} material={MAT.lightOak} />
      <Box position={[0, 0.49, -1.4]} size={[1.04, 0.04, 0.46]} material={MAT.darkOak} />
    </group>
  );
}

export function DormBedroom() {
  return (
    <group position={BEDROOM_CENTRE}>
      {/* Floor and ceiling */}
      <Slab x={[-H, H]} y={[-0.2, 0]} z={[-H, H]} material={MAT.lightOak} />
      <Slab x={[-H, H]} y={[T, T + 0.2]} z={[-H, H]} material={MAT.plaster} />
      {[-1.6, 0, 1.6].map((x) => (
        <Box key={x} position={[x, T - 0.12, 0]} size={[0.22, 0.24, H * 2]} material={MAT.darkOak} />
      ))}
      {/* Back (+Z) and right (+X) walls */}
      <Slab x={[-H, H]} y={[0, T]} z={[H, H + W]} material={MAT.academyStoneDark} />
      <Slab x={[H, H + W]} y={[0, T]} z={[-H, H]} material={MAT.academyStoneDark} />
      {/* Left (−X) wall with the door opening */}
      <Slab x={[-H - W, -H]} y={[0, T]} z={[-H, DOOR.z[0]]} material={MAT.academyStoneDark} />
      <Slab x={[-H - W, -H]} y={[0, T]} z={[DOOR.z[1], H]} material={MAT.academyStoneDark} />
      <Slab x={[-H - W, -H]} y={[DOOR.y[1], T]} z={[DOOR.z[0], DOOR.z[1]]} material={MAT.academyStoneDark} />
      {/* The door, flung open */}
      <Box position={[-H - 0.05, 1.15, DOOR.z[1] - 0.05]} size={[1.3, 2.3, 0.08]} rotation={[0, -1.2, 0]} material={MAT.panelWood} />
      {/* Window (−Z) wall around the opening, with an oak frame and a centre mullion */}
      <Slab x={[-H, WIN.x[0]]} y={[0, T]} z={[-H - W, -H]} material={MAT.academyStoneDark} />
      <Slab x={[WIN.x[1], H]} y={[0, T]} z={[-H - W, -H]} material={MAT.academyStoneDark} />
      <Slab x={[WIN.x[0], WIN.x[1]]} y={[0, WIN.y[0]]} z={[-H - W, -H]} material={MAT.academyStoneDark} />
      <Slab x={[WIN.x[0], WIN.x[1]]} y={[WIN.y[1], T]} z={[-H - W, -H]} material={MAT.academyStoneDark} />
      <Box position={[0, WIN.y[0] - 0.04, -H + 0.1]} size={[2.8, 0.1, 0.4]} material={MAT.darkOak} />
      <Box position={[0, (WIN.y[0] + WIN.y[1]) / 2, -H - W / 2]} size={[0.08, WIN.y[1] - WIN.y[0], 0.12]} material={MAT.darkOak} />
      <Box position={[0, 2.2, -H - W / 2]} size={[2.6, 0.06, 0.1]} material={MAT.darkOak} />
      {/* Bed against the right wall, foot towards the window */}
      <FourPosterBed position={[1.5, 0, 1.1]} />
      {/* Wardrobe on the back wall, desk and chair by the window */}
      <Furniture id="wardrobe" position={[-1.6, 0, H - 0.4]} size={[1.4, 2.1, 0.6]} height={2.1} rotationY={Math.PI} />
      <Box position={[-1.9, 0.75, -1.6]} size={[1.0, 0.06, 1.6]} material={MAT.lightOak} />
      {[[-2.3, -2.3], [-1.5, -2.3], [-2.3, -0.9], [-1.5, -0.9]].map(([x, z]) => (
        <Box key={`${x}${z}`} position={[x ?? 0, 0.37, z ?? 0]} size={[0.06, 0.74, 0.06]} material={MAT.darkOak} />
      ))}
      <Box position={[-1.9, 0.86, -1.9]} size={[0.3, 0.16, 0.22]} material={MAT.blueLeather} />
      <Box position={[-1.85, 0.97, -1.85]} size={[0.28, 0.06, 0.2]} material={MAT.burgundyLeather} />
      <Box position={[-2.0, 0.8, -1.2]} size={[0.32, 0.02, 0.24]} material={MAT.parchment} />
      {/* A rug between the bed and the window */}
      <Box position={[0, 0.01, -0.4]} size={[2.0, 0.02, 1.4]} material={MAT.carpet} />
      {/* A dim candle on the desk; most of the light is the fire outside */}
      <mesh position={[-1.6, 0.86, -2.1]} material={MAT.linen}>
        <cylinderGeometry args={[0.03, 0.03, 0.18, 12]} />
      </mesh>
      <pointLight position={[-1.6, 1.1, -2.1]} color="#ffc070" intensity={1.6} distance={5} decay={2} />
      {/* Beyond the door: a stone landing and the top of the spiral stairs going down, lit by fire
          from below (Chrome playtest: the doorway showed open sky 16 m up). */}
      <group position={[-H - W, 0, (DOOR.z[0] + DOOR.z[1]) / 2]}>
        <Slab x={[-3.2, 0]} y={[-0.2, 0]} z={[-1.6, 1.6]} material={MAT.paving} />
        <Slab x={[-3.4, 0]} y={[0, T]} z={[-1.9, -1.6]} material={MAT.academyStoneDark} />
        <Slab x={[-3.4, 0]} y={[0, T]} z={[1.6, 1.9]} material={MAT.academyStoneDark} />
        <Slab x={[-3.6, -3.2]} y={[-3, T]} z={[-1.9, 1.9]} material={MAT.academyStoneDark} />
        <Slab x={[-3.4, 0]} y={[T, T + 0.3]} z={[-1.9, 1.9]} material={MAT.academyStoneDark} />
        {/* Steps turning down to the right */}
        {[0, 1, 2, 3].map((k) => (
          <Box key={k} position={[-2.4, -0.25 - k * 0.25, 1.0 - k * 0.0]} size={[1.4, 0.12, 0.5]} material={MAT.paving} />
        ))}
        <pointLight position={[-2.2, 0.4, 0.6]} color="#ff6a2a" intensity={8} distance={6} decay={1.8} />
      </group>
      <FireGlow />
    </group>
  );
}
