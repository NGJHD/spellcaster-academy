import { Html, Line } from '@react-three/drei';
import { useMemo } from 'react';
import { LEVELS } from '../level/levels';
import { getRun } from '../state/gameStore';
import { buildTravelCurves } from '../level/rail/railMath';
import type { CameraNode, Vec3 } from '../level/rail/railTypes';

/** Debug view of authored rails: position splines, look splines and named nodes. */
export function RailGizmos() {
  const ROUTE = getRun()?.level.route ?? LEVELS['level-1'].route;
  const rails = useMemo(
    () =>
      ROUTE.beats.flatMap((beat) => {
        if (beat.kind !== 'rail-travel') return [];
        const curves = buildTravelCurves(ROUTE, beat);
        return [{ id: beat.id, position: curves.position.getPoints(64), lookAt: curves.lookAt.getPoints(32) }];
      }),
    [ROUTE],
  );

  return (
    <group>
      {rails.map((rail) => (
        <group key={rail.id}>
          <Line points={rail.position} color="#ffcc33" lineWidth={2} />
          <Line points={rail.lookAt} color="#33ccff" lineWidth={1} dashed dashSize={0.5} gapSize={0.3} />
        </group>
      ))}
      {(Object.entries(ROUTE.nodes) as [string, CameraNode][]).map(([name, node]) => (
        <mesh key={name} position={node.position}>
          <sphereGeometry args={[0.15, 12, 8]} />
          <meshBasicMaterial color="#ffcc33" />
          <Html center distanceFactor={12} className="rail-gizmo-label">{name}</Html>
        </mesh>
      ))}
      {(Object.entries(ROUTE.lookPoints) as [string, Vec3][]).map(([name, point]) => (
        <mesh key={name} position={point}>
          <octahedronGeometry args={[0.2]} />
          <meshBasicMaterial color="#33ccff" wireframe />
        </mesh>
      ))}
    </group>
  );
}
