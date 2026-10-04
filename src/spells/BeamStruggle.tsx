/**
 * Beam struggle (CLAUDE.md §1B; LEVEL1_DESIGN LD-0 Grimoire G3 and Warden W3): the player's golden
 * beam meets the opponent's storm at a crackling clash point. Every word pushes the clash point
 * further toward the opponent until the last word blasts through.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, Quaternion, Vector3, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { getRun } from '../state/gameStore';

const PLAYER_COLOUR = '#ffd56a';
const UP = new Vector3(0, 1, 0);

const target = new Vector3();
const start = new Vector3();
const clash = new Vector3();
const forward = new Vector3();
const right = new Vector3();
const dir = new Vector3();
const quat = new Quaternion();

/** Stretches a unit cylinder (height 1 along Y) between two points. */
function span(mesh: Mesh, a: Vector3, b: Vector3, radius: number): void {
  dir.copy(b).sub(a);
  const length = dir.length();
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  quat.setFromUnitVectors(UP, dir.normalize());
  mesh.quaternion.copy(quat);
  mesh.scale.set(radius, Math.max(0.001, length), radius);
}

export function BeamStruggle() {
  const root = useRef<Group>(null);
  const playerBeam = useRef<Mesh>(null);
  const playerCore = useRef<Mesh>(null);
  const enemyBeam = useRef<Mesh>(null);
  const ball = useRef<Mesh>(null);
  const shown = useRef(0);
  const push = useRef(0);
  const time = useRef(0);
  const enemyColour = useMemo(() => new Color(), []);

  useFrame((state, delta) => {
    const g = root.current;
    const run = getRun();
    if (!g) return;
    const dt = Math.min(delta, 0.1);
    time.current += dt;
    const beam = run?.beamStruggle(target) ?? null;
    shown.current += ((beam ? 1 : 0) - shown.current) * (1 - Math.exp(-6 * dt));
    g.visible = shown.current > 0.02;
    if (!g.visible || !beam) return;

    // The clash point eases forward with each word, with a little back-and-forth tussle.
    push.current += (beam.progress - push.current) * (1 - Math.exp(-3 * dt));
    const cam = state.camera;
    cam.getWorldDirection(forward);
    right.crossVectors(forward, UP).normalize();
    start.copy(cam.position).addScaledVector(forward, 0.9).addScaledVector(right, 0.28);
    start.y -= 0.28;
    const tussle = Math.sin(time.current * 7) * 0.025 + Math.sin(time.current * 2.3) * 0.02;
    const u = Math.min(0.96, 0.38 + push.current * 0.56 + tussle);
    clash.lerpVectors(start, target, u);

    const flicker = 1 + Math.sin(time.current * 31) * 0.12;
    if (playerBeam.current) span(playerBeam.current, start, clash, 0.07 * flicker * shown.current);
    if (playerCore.current) span(playerCore.current, start, clash, 0.025 * shown.current);
    if (enemyBeam.current) {
      span(enemyBeam.current, clash, target, 0.14 * (1.1 - push.current * 0.5) * shown.current);
      enemyColour.set(beam.color);
      (enemyBeam.current.material as MeshBasicMaterial).color.copy(enemyColour);
    }
    if (ball.current) {
      ball.current.position.copy(clash);
      ball.current.scale.setScalar((0.22 + Math.sin(time.current * 23) * 0.04) * shown.current);
    }
  });

  return (
    <group ref={root} visible={false}>
      <mesh ref={playerBeam} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 12, 1, true]} />
        <meshBasicMaterial color={PLAYER_COLOUR} transparent opacity={0.55} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={playerCore} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 8, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={enemyBeam} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 12, 1, true]} />
        <meshBasicMaterial color="#b9a8ff" transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={ball} frustumCulled={false}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshBasicMaterial color="#fff4d0" transparent opacity={0.85} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}
