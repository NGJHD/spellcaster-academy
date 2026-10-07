/**
 * A fireworks display for the night celebration (owner, 2026-10-07: "end with fireworks and
 * celebration … the ending doesn't feel satisfying"). Rockets climb on a glowing trail, burst with a
 * flash into a sphere of sparks, and the sparks streak outwards, droop under gravity, twinkle and
 * fade. Each spark is drawn as a short glowing streak along its velocity (a point sprite with a
 * motion trail of fading copies), so bursts read as real fireworks, not floating confetti.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type Points, type Sprite } from 'three';
import type { Vec3 } from '../level/rail/railTypes';
import { glowTexture } from './glow';

const COLOURS = ['#ff4a5a', '#ffd24a', '#5ae08a', '#4ab8ff', '#c78aff', '#ff9a3a', '#ffffff'];
const SHELLS = 6;
const SPARKS = 160;
const TRAIL = 4;
const RISE_SEC = 1.3;
const BURST_SEC = 2.6;

interface Shell {
  t: number;
  launch: [number, number, number];
  apex: [number, number, number];
  colour: Color;
  second: Color;
  vel: Float32Array;
  wait: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export function Fireworks({ origin, spread = 40, height = [26, 40], active = () => true }: { origin: Vec3; spread?: number; height?: [number, number]; active?: () => boolean }) {
  const points = useRef<Points>(null);
  const flashes = useRef<(Sprite | null)[]>([]);
  const glow = useMemo(() => glowTexture(), []);
  const { geometry, positions, colours, shells } = useMemo(() => {
    const n = SHELLS * SPARKS * TRAIL + SHELLS * TRAIL;
    const g = new BufferGeometry();
    const p = new Float32Array(n * 3);
    const c = new Float32Array(n * 3);
    g.setAttribute('position', new BufferAttribute(p, 3));
    g.setAttribute('color', new BufferAttribute(c, 3));
    const list: Shell[] = Array.from({ length: SHELLS }, (_, i) => ({ t: 0, launch: [0, 0, 0], apex: [0, 0, 0], colour: new Color(), second: new Color(), vel: new Float32Array(SPARKS * 3), wait: i * 0.55 }));
    return { geometry: g, positions: p, colours: c, shells: list };
  }, []);

  const relaunch = (s: Shell) => {
    const x = origin[0] + rand(-spread / 2, spread / 2);
    const z = origin[2] + rand(-spread / 4, spread / 4);
    s.launch = [x + rand(-3, 3), origin[1], z];
    s.apex = [x, origin[1] + rand(height[0], height[1]), z];
    s.colour.set(COLOURS[(Math.random() * COLOURS.length) | 0] ?? '#ffffff');
    s.second.set(COLOURS[(Math.random() * COLOURS.length) | 0] ?? '#ffffff');
    const speed = rand(9, 13);
    for (let k = 0; k < SPARKS; k++) {
      // Evenly spread directions on a sphere (golden spiral), with a little jitter.
      const yv = 1 - (2 * (k + 0.5)) / SPARKS;
      const r = Math.sqrt(1 - yv * yv);
      const th = k * 2.399963 + Math.random() * 0.1;
      const v = speed * rand(0.92, 1.05);
      s.vel[k * 3] = Math.cos(th) * r * v;
      s.vel[k * 3 + 1] = yv * v;
      s.vel[k * 3 + 2] = Math.sin(th) * r * v;
    }
    s.t = 0;
  };

  useFrame((_, delta) => {
    const pts = points.current;
    if (!pts) return;
    const on = active();
    pts.visible = on;
    const dt = Math.min(delta, 0.05);
    let o = 0;
    const put = (x: number, y: number, z: number, r: number, g: number, b: number) => {
      positions[o * 3] = x;
      positions[o * 3 + 1] = y;
      positions[o * 3 + 2] = z;
      colours[o * 3] = r;
      colours[o * 3 + 1] = g;
      colours[o * 3 + 2] = b;
      o++;
    };
    shells.forEach((s, i) => {
      const flash = flashes.current[i];
      if (!on) {
        if (flash) flash.visible = false;
        return;
      }
      if (s.wait > 0) {
        s.wait -= dt;
        if (s.wait <= 0) relaunch(s);
        for (let k = 0; k < SPARKS * TRAIL + TRAIL; k++) put(0, -9999, 0, 0, 0, 0);
        if (flash) flash.visible = false;
        return;
      }
      s.t += dt;
      const t = s.t;
      if (t < RISE_SEC) {
        // The rocket: a bright head and a short fading trail climbing (ease-out).
        for (let k = 0; k < TRAIL; k++) {
          const u = Math.max(0, (t - k * 0.05) / RISE_SEC);
          const e = 1 - (1 - u) * (1 - u);
          const fade = (1 - k / TRAIL) * 0.9;
          put(s.launch[0] + (s.apex[0] - s.launch[0]) * e, s.launch[1] + (s.apex[1] - s.launch[1]) * e, s.launch[2] + (s.apex[2] - s.launch[2]) * e, fade, fade * 0.8, fade * 0.5);
        }
        for (let k = 0; k < SPARKS * TRAIL; k++) put(0, -9999, 0, 0, 0, 0);
        if (flash) flash.visible = false;
        return;
      }
      for (let k = 0; k < TRAIL; k++) put(0, -9999, 0, 0, 0, 0);
      const b = t - RISE_SEC;
      if (b > BURST_SEC) {
        s.wait = rand(0.2, 1.4);
        for (let k = 0; k < SPARKS * TRAIL; k++) put(0, -9999, 0, 0, 0, 0);
        if (flash) flash.visible = false;
        return;
      }
      // The flash at the moment of bursting.
      if (flash) {
        flash.visible = b < 0.35;
        flash.position.set(s.apex[0], s.apex[1], s.apex[2]);
        flash.scale.setScalar(4 + b * 30);
        (flash.material as { opacity: number }).opacity = Math.max(0, 1 - b / 0.35);
      }
      const life = 1 - b / BURST_SEC;
      for (let k = 0; k < SPARKS; k++) {
        const vx = s.vel[k * 3] ?? 0;
        const vy = s.vel[k * 3 + 1] ?? 0;
        const vz = s.vel[k * 3 + 2] ?? 0;
        // Drag slows the sparks; gravity droops them.
        const twinkle = b > 1.4 && Math.random() < 0.25 ? 0.2 : 1;
        const c = k % 3 === 0 ? s.second : s.colour;
        for (let j = 0; j < TRAIL; j++) {
          const tb = Math.max(0, b - j * 0.045);
          const travel = (1 - Math.exp(-1.6 * tb)) / 1.6;
          const x = s.apex[0] + vx * travel;
          const y = s.apex[1] + vy * travel - 2.2 * tb * tb;
          const z = s.apex[2] + vz * travel;
          const f = life * (1 - j / TRAIL) * twinkle * (b < 0.15 ? 1.6 : 1);
          put(x, y, z, c.r * f, c.g * f, c.b * f);
        }
      }
    });
    (geometry.getAttribute('position') as BufferAttribute).needsUpdate = true;
    (geometry.getAttribute('color') as BufferAttribute).needsUpdate = true;
  });

  return (
    <group>
      <points ref={points} geometry={geometry} frustumCulled={false}>
        <pointsMaterial map={glow} size={0.9} sizeAttenuation vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
      </points>
      {Array.from({ length: SHELLS }, (_, i) => (
        <sprite key={i} ref={(s) => void (flashes.current[i] = s)} visible={false}>
          <spriteMaterial map={glow} color="#fff4e0" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} fog={false} />
        </sprite>
      ))}
    </group>
  );
}
