/**
 * Beam struggle (CLAUDE.md §1B; LEVEL1_DESIGN LD-0 Grimoire G3 and Warden W3): the player's golden
 * beam meets the opponent's storm at a crackling clash point. Every word pushes the clash point
 * further toward the opponent until the last word blasts through.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, Color, DoubleSide, Vector3, type Group, type Mesh, type MeshBasicMaterial, type Sprite } from 'three';
import { glowTexture, placeStreak, STREAK_GEOMETRY, streakTexture } from '../scene/glow';
import { getRun } from '../state/gameStore';

const PLAYER_COLOUR = '#ffd56a';
const UP = new Vector3(0, 1, 0);

const target = new Vector3();
const start = new Vector3();
const clash = new Vector3();
const forward = new Vector3();
const right = new Vector3();

export function BeamStruggle() {
  const root = useRef<Group>(null);
  const playerBeam = useRef<Mesh>(null);
  const playerCore = useRef<Mesh>(null);
  const enemyBeam = useRef<Mesh>(null);
  const ball = useRef<Sprite>(null);
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
    if (playerBeam.current) placeStreak(playerBeam.current, start, clash, 0.12 * flicker * shown.current, cam.position);
    if (playerCore.current) placeStreak(playerCore.current, start, clash, 0.04 * shown.current, cam.position);
    if (enemyBeam.current) {
      placeStreak(enemyBeam.current, clash, target, 0.24 * (1.1 - push.current * 0.5) * shown.current, cam.position);
      enemyColour.set(beam.color);
      (enemyBeam.current.material as MeshBasicMaterial).color.copy(enemyColour);
    }
    if (ball.current) {
      ball.current.position.copy(clash);
      ball.current.scale.setScalar((1.1 + Math.sin(time.current * 23) * 0.2) * shown.current);
    }
  });

  // Rendered streaks of light and a soft glow at the clash (they were solid cylinders and a ball).
  const streak = useMemo(() => streakTexture(), []);
  const glow = useMemo(() => glowTexture(), []);
  return (
    <group ref={root} visible={false}>
      <mesh ref={playerBeam} geometry={STREAK_GEOMETRY} frustumCulled={false}>
        <meshBasicMaterial map={streak} color={PLAYER_COLOUR} transparent opacity={0.9} blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh ref={playerCore} geometry={STREAK_GEOMETRY} frustumCulled={false}>
        <meshBasicMaterial map={streak} color="#ffffff" transparent opacity={1} blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <mesh ref={enemyBeam} geometry={STREAK_GEOMETRY} frustumCulled={false}>
        <meshBasicMaterial map={streak} color="#b9a8ff" transparent opacity={0.85} blending={AdditiveBlending} depthWrite={false} toneMapped={false} side={DoubleSide} />
      </mesh>
      <sprite ref={ball} frustumCulled={false}>
        <spriteMaterial map={glow} color="#fff4d0" transparent opacity={1} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </sprite>
    </group>
  );
}
