import { Box, Slab, placeholderMaterials as m } from './placeholderKit';

const START_X = 15;
const END_X = 44;
const HALF_WIDTH = 2.5;
const HEIGHT = 5;
const LAMP_X = [20, 27, 34, 41];

/** East Hall corridor from the courtyard door (x = 14) to the library doors (x = 44). */
export function PlaceholderEastHall() {
  return (
    <group name="placeholder-east-hall">
      <Slab x={[START_X, END_X]} y={[-0.01, 0.02]} z={[-HALF_WIDTH, HALF_WIDTH]} material={m.paving} shadows={false} />
      <Slab x={[START_X, END_X]} y={[0.02, 0.04]} z={[-0.9, 0.9]} material={m.carpet} shadows={false} />
      <Slab x={[START_X, END_X]} y={[0, HEIGHT]} z={[-HALF_WIDTH - 0.3, -HALF_WIDTH]} material={m.plaster} />
      <Slab x={[START_X, END_X]} y={[0, HEIGHT]} z={[HALF_WIDTH, HALF_WIDTH + 0.3]} material={m.plaster} />
      <Slab x={[START_X - 1, END_X + 0.3]} y={[HEIGHT, HEIGHT + 0.4]} z={[-HALF_WIDTH - 0.3, HALF_WIDTH + 0.3]} material={m.slate} />
      <Slab x={[END_X, END_X + 0.3]} y={[0, HEIGHT]} z={[-HALF_WIDTH, HALF_WIDTH]} material={m.stone} />

      {/* Oak beams across the ceiling */}
      {Array.from({ length: 10 }, (_, i) => START_X + 1.5 + i * 3).map((x) => (
        <Slab key={x} x={[x - 0.15, x + 0.15]} y={[HEIGHT - 0.35, HEIGHT]} z={[-HALF_WIDTH, HALF_WIDTH]} material={m.oak} />
      ))}

      {/* Library double doors at the far end */}
      <Slab x={[END_X - 0.1, END_X]} y={[0, 3.6]} z={[-1.3, 1.3]} material={m.oak} />
      <Slab x={[END_X - 0.14, END_X - 0.1]} y={[1.6, 1.8]} z={[-0.4, 0.4]} material={m.brass} shadows={false} />

      {/* Wall lamps — emissive stand-ins plus a few unshadowed local lights (budgeted) */}
      {LAMP_X.map((x) => (
        <group key={x}>
          <Box position={[x, 3.2, -HALF_WIDTH + 0.12]} size={[0.25, 0.4, 0.2]} material={m.windowGlow} shadows={false} />
          <Box position={[x, 3.2, HALF_WIDTH - 0.12]} size={[0.25, 0.4, 0.2]} material={m.windowGlow} shadows={false} />
          <pointLight position={[x, 3.6, 0]} color="#ffc98a" intensity={9} distance={9} decay={2} />
        </group>
      ))}

      {/* Student alcove notice frames */}
      {[18, 24, 37].map((x) => (
        <Slab key={x} x={[x - 0.8, x + 0.8]} y={[1.4, 2.6]} z={[HALF_WIDTH - 0.05, HALF_WIDTH]} material={m.oak} shadows={false} />
      ))}

      {/* Mira stand-in (§14A.3) and the charm chest (look point EAST_HALL_CHEST_POINT) */}
      <group position={[32.5, 0, 1.6]}>
        <mesh position={[0, 0.72, 0]} material={m.mira} castShadow>
          <capsuleGeometry args={[0.22, 0.95, 6, 12]} />
        </mesh>
        <mesh position={[0, 1.36, 0]} material={m.dummy} castShadow>
          <sphereGeometry args={[0.13, 16, 12]} />
        </mesh>
      </group>
      <Box position={[31, 0.3, -2]} size={[0.9, 0.6, 0.55]} material={m.oak} />
      <Box position={[31, 0.45, -1.71]} size={[0.2, 0.2, 0.03]} material={m.brass} shadows={false} />
    </group>
  );
}
