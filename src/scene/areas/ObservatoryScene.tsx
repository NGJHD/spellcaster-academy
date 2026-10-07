/** PLACEHOLDER Observatory boss arena (§14A.25) with the Ward Warden. */
import { LightBeam } from '../glow';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, type Group, type MeshBasicMaterial } from 'three';
import { OBSERVATORY_ORIGIN, VALUE_POSITIONS } from '../../level/areas/observatory';
import { beatIndexOf } from '../../level/level1Route';
import { getRun } from '../../state/gameStore';
import { useRunStore } from '../../state/runStore';
import { Box, KitModel } from '../kit';
import { MAT } from '../materials';
import { Seam } from '../Seam';
import { insideCylinder, worldCircle, worldCylinder } from '../surfaces';
import { WardenModel, useBeatIndex, type WardenState } from '../props';

const R = 14;
const INTRO_BEAT = beatIndexOf('observatory-intro');
const RESTORED_BEAT = beatIndexOf('observatory-restored');

export function ObservatoryScene() {
  return (
    <group name="observatory" position={OBSERVATORY_ORIGIN}>
      <Arena />
      <Instruments />
      <BossWarden />
      <WardDome />
      {/* The torn seam across the dome (local coordinates; the dome is centred on the arena). */}
      <Seam points={[[-1.5, 18, -40], [2.5, 30, -44], [-2.5, 42, -46], [2, 55, -45], [-1, 68, -42]]} radius={0.35} />
      <ValueBeams />
    </group>
  );
}

function Arena() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={MAT.marble} geometry={worldCircle(R, 64)} receiveShadow />
      {[3, 6, 9, 12].map((r) => (
        <mesh key={r} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
          <ringGeometry args={[r - 0.06, r, 96]} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, (i / 12) * Math.PI * 2]} material={MAT.agedBrass}>
          <planeGeometry args={[0.05, R * 2]} />
        </mesh>
      ))}
      {/* Four marked safe positions (§7.10). */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        return (
          <mesh key={i} position={[Math.cos(a) * 10, 0.02, Math.sin(a) * 10]} rotation={[-Math.PI / 2, 0, 0]} material={MAT.wardBlue}>
            <ringGeometry args={[0.7, 0.8, 32]} />
          </mesh>
        );
      })}
      {/* Drum wall of dressed stone with an oak dado, then the planked dome with its shutter open. */}
      <mesh position={[0, 1.6, 0]} material={MAT.academyStone} geometry={insideCylinder(R + 0.2, 3.2, 72)} receiveShadow />
      <mesh position={[0, 0.6, 0]} material={MAT.panelWood} geometry={insideCylinder(R + 0.15, 1.2, 72)} receiveShadow />
      <mesh position={[0, 1.22, 0]} material={MAT.darkOak} geometry={insideCylinder(R + 0.1, 0.06, 72)} />
      <KitModel id="observatory_dome" position={[0, 3.2, 0]} castShadow={false} />
      <mesh position={[0, 0.25, 0]} material={MAT.academyStoneDark} geometry={worldCylinder(2.2, 2.6, 0.5, 40)} castShadow receiveShadow />
      <mesh position={[0, 0.52, 0]} material={MAT.agedBrass} geometry={worldCylinder(2.25, 2.25, 0.04, 40)} />
    </group>
  );
}

function Instruments() {
  const orrery = useRef<Group>(null);
  useFrame((_, dt) => {
    if (orrery.current) orrery.current.rotation.y += dt * 0.15;
  });
  return (
    <group>
      {/* The great refractor, aimed up through the open shutter. */}
      <KitModel id="telescope" position={[-9, 0, -6]} rotationY={Math.PI + 0.6} scale={1.3} />
      <group ref={orrery} position={[9, 2.2, -6]}>
        <mesh material={MAT.wardGold}>
          <sphereGeometry args={[0.35, 20, 16]} />
        </mesh>
        {[1, 1.6, 2.2].map((r, i) => (
          <group key={r} rotation={[0, i * 1.7, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
              <torusGeometry args={[r, 0.02, 6, 48]} />
            </mesh>
            <mesh position={[r, 0, 0]} material={i === 1 ? MAT.wardBlue : MAT.academyStone}>
              <sphereGeometry args={[0.12, 12, 10]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -1.2, 0]} material={MAT.darkSteel}>
          <cylinderGeometry args={[0.08, 0.2, 2, 10]} />
        </mesh>
      </group>
      <Box position={[0, 0.6, 13.2]} size={[3, 1.2, 0.4]} material={MAT.academyStoneDark} />
    </group>
  );
}

/** Drives the Warden's pose from boss progress (rise, plates, runes, repair, bow). */
function BossWarden() {
  const beat = useBeatIndex();
  const state = useRef<WardenState>({ rise: 0, shellOpen: 0, core: 0, calm: 0, attack: 0, bow: 0 });
  useFrame((_, dt) => {
    const run = getRun();
    if (!run) return;
    const s = state.current;
    const k = 1 - Math.exp(-2 * Math.min(dt, 0.1));
    const w1 = run.encounterProgress('warden-w1');
    const w2 = run.encounterProgress('warden-w2');
    const w3 = run.encounterProgress('warden-w3');
    const repaired = run.flags.has('ward-repaired');
    s.rise += ((beat >= INTRO_BEAT ? 1 : 0) - s.rise) * k;
    s.shellOpen += ((w1.total ? w1.done / w1.total : 0) - s.shellOpen) * k;
    s.core += ((w2.total ? 0.3 + (w2.done / w2.total) * 0.7 : 0) - s.core) * k;
    s.calm += ((repaired ? 1 : w3.total ? (w3.done / w3.total) * 0.6 : 0) - s.calm) * k * 0.6;
    s.bow += ((beat >= RESTORED_BEAT ? 1 : 0) - s.bow) * k * 0.5;
    const hazard = useRunStore.getState().hazard;
    const goal = hazard ? (hazard.attack === 'arc-left' ? -1 : hazard.attack === 'arc-right' ? 1 : 0) : 0;
    s.attack += (goal - s.attack) * k;
  });
  return (
    <group position={[0, 0.3, 0]}>
      <WardenModel state={state} />
    </group>
  );
}

function WardDome() {
  const material = useRef<MeshBasicMaterial>(null);
  useFrame((state) => {
    const run = getRun();
    const m = material.current;
    if (!run || !m) return;
    const p = run.encounterProgress('warden-w3');
    const repair = p.complete ? 1 : p.total ? p.done / p.total : 0;
    const t = state.clock.elapsedTime;
    m.opacity = 0.05 + (1 - repair) * 0.06 * (0.6 + Math.abs(Math.sin(t * 3)) * 0.4) + repair * 0.06;
    m.color.setRGB(0.6 + repair * 0.4, 0.75 + repair * 0.15, 1 - repair * 0.3);
  });
  return (
    <mesh>
      <sphereGeometry args={[60, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshBasicMaterial ref={material} color="#9cc4ff" transparent opacity={0.08} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}

/** One beam from the wand area into the dome for each value word typed (Phase W3). */
function ValueBeams() {
  const beams = useRef<(Group | null)[]>([]);
  const geo = useMemo(
    () =>
      VALUE_POSITIONS.map((p) => {
        const local: [number, number, number] = [p[0] - OBSERVATORY_ORIGIN[0], p[1] - OBSERVATORY_ORIGIN[1], p[2] - OBSERVATORY_ORIGIN[2]];
        return local;
      }),
    [],
  );
  useFrame((_, dt) => {
    const p = getRun()?.encounterProgress('warden-w3');
    const done = p ? (p.complete ? 6 : p.done) : 0;
    beams.current.forEach((b, i) => {
      if (!b) return;
      const goal = done > i ? 1 : 0;
      b.scale.y += (goal - b.scale.y) * (1 - Math.exp(-3 * Math.min(dt, 0.1)));
      b.visible = b.scale.y > 0.02;
    });
  });
  return (
    <group>
      {geo.map((p, i) => (
        <group key={i} ref={(m) => void (beams.current[i] = m)} position={[p[0], 0, p[2]]} scale={[1, 0.01, 1]} visible={false}>
          <LightBeam height={p[1] + 12} width={0.9} color="#ffe08a" intensity={0.9} />
        </group>
      ))}
    </group>
  );
}
