import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, type MeshBasicMaterial } from 'three';
import { beatIndexOf } from '../../level/level1Route';
import { useGameStore } from '../../state/gameStore';
import { Slab, placeholderMaterials as m, seededRandom } from './placeholderKit';

const TOWER = { x: 0, z: -60, radius: 7, height: 40 } as const;

/** Ground, trees, main building, Moon Tower and the ward dome visible across the campus. */
export function PlaceholderCampus() {
  return (
    <group name="placeholder-campus">
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} material={m.grass} receiveShadow>
        <planeGeometry args={[900, 900]} />
      </mesh>
      {/* Arrival path */}
      <Slab x={[-1.6, 1.6]} y={[-0.01, 0.03]} z={[20, 110]} material={m.paving} shadows={false} />

      {/* Main academy block behind the courtyard's north wall */}
      <Slab x={[-34, 34]} y={[0, 16]} z={[-40, -14]} material={m.stone} />
      <Slab x={[-35, 35]} y={[16, 17]} z={[-41, -13]} material={m.slate} />
      {[-24, -16, -8, 8, 16, 24].map((x) =>
        [4, 9].map((y) => <Slab key={`${x}-${y}`} x={[x - 1, x + 1]} y={[y, y + 3]} z={[-13.95, -13.9]} material={m.windowGlow} shadows={false} />),
      )}

      {/* Moon Tower and observatory dome */}
      <mesh position={[TOWER.x, TOWER.height / 2, TOWER.z]} material={m.stone} castShadow>
        <cylinderGeometry args={[TOWER.radius, TOWER.radius * 1.1, TOWER.height, 32]} />
      </mesh>
      <mesh position={[TOWER.x, TOWER.height, TOWER.z]} material={m.brass}>
        <sphereGeometry args={[TOWER.radius * 1.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>

      <Trees />
      <WardDome />
    </group>
  );
}

function Trees() {
  const trees = useMemo(() => {
    const rand = seededRandom(7);
    const result: { x: number; z: number; h: number }[] = [];
    while (result.length < 60) {
      const x = (rand() - 0.5) * 160;
      const z = 24 + rand() * 90;
      if (Math.abs(x) < 7) continue; // keep the arrival path and camera flyover clear
      result.push({ x, z, h: 5 + rand() * 5 });
    }
    return result;
  }, []);

  return (
    <group name="placeholder-trees">
      {trees.map(({ x, z, h }) => (
        <group key={`${x.toFixed(2)}-${z.toFixed(2)}`} position={[x, 0, z]}>
          <mesh position={[0, h * 0.2, 0]} material={m.bark} castShadow>
            <cylinderGeometry args={[0.2, 0.3, h * 0.4, 8]} />
          </mesh>
          <mesh position={[0, h * 0.62, 0]} material={m.hedge} castShadow>
            <sphereGeometry args={[h * 0.3, 12, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const FRACTURE_BEAT = beatIndexOf('arrival-ward-fracture');

/** Faint gold-blue ward over the campus. Flickers during the fracture reveal, then stays dimmer. */
function WardDome() {
  const material = useRef<MeshBasicMaterial>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    const dome = material.current;
    if (!dome) return;
    time.current += delta;
    const beat = useGameStore.getState().currentBeatId;
    const index = beat ? beatIndexOf(beat) : -1;
    if (index === FRACTURE_BEAT) {
      const t = time.current;
      dome.opacity = 0.08 + 0.12 * Math.abs(Math.sin(t * 7) * Math.sin(t * 2.3));
      dome.color.set('#ffd27a');
    } else {
      dome.opacity = index > FRACTURE_BEAT ? 0.05 : 0.1;
      dome.color.set('#9cc4ff');
    }
  });

  return (
    <mesh position={[0, 0, -30]}>
      <sphereGeometry args={[170, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial ref={material} color="#9cc4ff" transparent opacity={0.1} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}
