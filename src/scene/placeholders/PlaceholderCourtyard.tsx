import { Box, Slab, placeholderMaterials as m } from './placeholderKit';

const DOOR_HALF_WIDTH = 1.5;
const DOOR_HEIGHT = 3.2;

/** Sunlit Courtyard: x ∈ [-14, 14], z ∈ [-14, 20]; fountain at the origin. */
export function PlaceholderCourtyard() {
  return (
    <group name="placeholder-courtyard">
      <Slab x={[-14, 14]} y={[-0.01, 0.02]} z={[-14, 19.4]} material={m.paving} shadows={false} />

      {/* Perimeter walls; the east wall has the East Hall doorway */}
      <Slab x={[-15, -14]} y={[0, 8]} z={[-14, 20]} material={m.stone} />
      <Slab x={[-15, 15]} y={[0, 8]} z={[-15, -14]} material={m.stone} />
      <Slab x={[14, 15]} y={[0, 8]} z={[DOOR_HALF_WIDTH, 20]} material={m.stone} />
      <Slab x={[14, 15]} y={[0, 8]} z={[-14, -DOOR_HALF_WIDTH]} material={m.stone} />
      <Slab x={[14, 15]} y={[DOOR_HEIGHT, 8]} z={[-DOOR_HALF_WIDTH, DOOR_HALF_WIDTH]} material={m.stone} />
      <Slab x={[13.9, 14]} y={[0, DOOR_HEIGHT + 0.3]} z={[-DOOR_HALF_WIDTH - 0.3, -DOOR_HALF_WIDTH]} material={m.oak} />
      <Slab x={[13.9, 14]} y={[0, DOOR_HEIGHT + 0.3]} z={[DOOR_HALF_WIDTH, DOOR_HALF_WIDTH + 0.3]} material={m.oak} />

      <Arcade />
      <Fountain />
      <TrainingCircle x={-6} z={-7} />
      <AnchorPlaceholder x={7} z={-8} />

      {/* Benches and planters */}
      {[[-10, 4], [10, 4], [-10, -10], [10, 6]].map(([x = 0, z = 0]) => (
        <group key={`bench-${x}-${z}`}>
          <Box position={[x, 0.45, z]} size={[2, 0.1, 0.6]} material={m.oak} />
          <Box position={[x - 0.8, 0.2, z]} size={[0.1, 0.4, 0.5]} material={m.brass} />
          <Box position={[x + 0.8, 0.2, z]} size={[0.1, 0.4, 0.5]} material={m.brass} />
        </group>
      ))}
      {[[-12, 12], [12, 12], [-12, -12], [12, -12]].map(([x = 0, z = 0]) => (
        <group key={`planter-${x}-${z}`}>
          <Box position={[x, 0.4, z]} size={[1.6, 0.8, 1.6]} material={m.stoneDark} />
          <mesh position={[x, 1.2, z]} material={m.hedge} castShadow>
            <sphereGeometry args={[0.85, 12, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Covered walkway just inside the gate wall; the camera enters beneath it. */
function Arcade() {
  const columns = [-12, -9, -6, -3.2, 3.2, 6, 9, 12];
  return (
    <group name="arcade">
      {columns.map((x) => (
        <mesh key={x} position={[x, 2, 16]} material={m.stone} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.36, 4, 16]} />
        </mesh>
      ))}
      <Slab x={[-14, 14]} y={[4, 4.6]} z={[15.4, 19.4]} material={m.stoneDark} />
    </group>
  );
}

function Fountain() {
  return (
    <group name="fountain">
      <mesh position={[0, 0.3, 0]} material={m.stone} castShadow receiveShadow>
        <cylinderGeometry args={[3, 3.2, 0.6, 40]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={m.water}>
        <cylinderGeometry args={[2.75, 2.75, 0.05, 40]} />
      </mesh>
      <mesh position={[0, 1.2, 0]} material={m.stone} castShadow>
        <cylinderGeometry args={[0.35, 0.5, 1.8, 16]} />
      </mesh>
      <mesh position={[0, 2.1, 0]} material={m.stone} castShadow>
        <cylinderGeometry args={[1.1, 0.4, 0.35, 32]} />
      </mesh>
    </group>
  );
}

/** Training circle with three dummy stand-ins (§14A.4). */
function TrainingCircle({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} material={m.brass} receiveShadow>
        <ringGeometry args={[2.6, 2.8, 48]} />
      </mesh>
      {[-2, 0, 2].map((dx) => (
        <group key={dx} position={[dx, 0, dx === 0 ? -1 : 0]}>
          <Box position={[0, 0.1, 0]} size={[0.6, 0.2, 0.6]} material={m.stoneDark} />
          <mesh position={[0, 1.0, 0]} material={m.dummy} castShadow>
            <capsuleGeometry args={[0.22, 1.0, 6, 12]} />
          </mesh>
          <mesh position={[0, 1.65, 0]} material={m.dummy} castShadow>
            <sphereGeometry args={[0.16, 12, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Courtyard Ward Anchor stand-in (§14A.14): stone base, brass rings, central shard. */
function AnchorPlaceholder({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} material={m.stoneDark} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.8, 3]} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[0.3, 0, 0.2]} material={m.brass} castShadow>
        <torusGeometry args={[0.55, 0.035, 8, 40]} />
      </mesh>
      <mesh position={[0, 1.4, 0]} rotation={[1.3, 0.4, 0]} material={m.brass} castShadow>
        <torusGeometry args={[0.45, 0.03, 8, 40]} />
      </mesh>
      <mesh position={[0, 1.4, 0]} material={m.crystal}>
        <octahedronGeometry args={[0.22]} />
      </mesh>
    </group>
  );
}
