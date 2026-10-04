/**
 * PLACEHOLDER creature and target stand-ins (CLAUDE.md §14A, MD-2 … MD-11).
 * Built from smooth primitives so gameplay can be finished before the Blender GLBs land.
 * Every model reads only a `TargetPose`, so swapping in a GLB never touches gameplay code.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import { CatmullRomCurve3, LatheGeometry, MeshStandardMaterial, Quaternion, Vector2, Vector3, type Group } from 'three';
import { preloadKit, useKit, useKitGlow } from '../scene/kitGlb';
import { MAT } from '../scene/materials';

/** Per-frame animation inputs derived from simulation state (0…1 unless noted). */
export interface TargetPose {
  /** Seconds since spawn; drives idle loops. */
  time: number;
  appear: number;
  windup: number;
  hit: number;
  dispel: number;
  stunned: number;
  shielded: boolean;
  moving: boolean;
  frosted: boolean;
  defeated: boolean;
  /** The strike has landed and the creature is recovering. */
  recovering: boolean;
}

export const emptyPose = (): TargetPose => ({
  time: 0,
  appear: 1,
  windup: 0,
  hit: 0,
  dispel: 0,
  stunned: 0,
  shielded: false,
  moving: false,
  frosted: false,
  defeated: false,
  recovering: false,
});

type PoseRef = RefObject<TargetPose>;

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** A private clone so each target can pulse its own glow. */
function useOwnMaterial(base: MeshStandardMaterial): MeshStandardMaterial {
  return useMemo(() => base.clone(), [base]);
}

function useGlowPulse(pose: PoseRef, material: MeshStandardMaterial, base: number, windupBoost = 2.5): void {
  useFrame(() => {
    const p = pose.current;
    material.emissiveIntensity = base * (1 + p.windup * windupBoost + p.hit * 1.5) * (p.defeated ? Math.max(0, 1 - p.dispel * 1.5) : 1);
  });
}

// ---------- Training dummy (MD-2) ----------

preloadKit(['star_page', 'star_page_teal', 'clasp', 'page_loose', 'warden_plate']);

/** useGlowPulse for every per-instance glow material of a kit model. */
function useGlowPulses(pose: PoseRef, materials: readonly MeshStandardMaterial[], base: number): void {
  useFrame(() => {
    const p = pose.current;
    const k = (base + p.windup * 2.5 + p.hit * 2) * (p.defeated ? Math.max(0.05, 1 - p.dispel) : 1);
    for (const m of materials) m.emissiveIntensity = k;
  });
}

export function DummyModel({ pose, practice }: { pose: PoseRef; practice: boolean }) {
  const torso = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const wood = practice ? MAT.lightOak : MAT.darkOak;
  const ward = useOwnMaterial(MAT.wardGold);
  useGlowPulse(pose, ward, 1.2);
  useFrame(() => {
    const p = pose.current;
    if (!torso.current || !armL.current || !armR.current) return;
    const wobble = Math.sin(p.time * 9) * p.hit * 0.25 * (1 - p.hit * 0.3);
    torso.current.rotation.x = -p.hit * 0.45 + wobble - p.windup * 0.15 + (p.defeated ? Math.min(1, p.dispel * 2) * 0.12 : 0);
    torso.current.rotation.z = Math.sin(p.time * 1.3) * 0.02;
    const swing = p.windup * 1.3;
    armL.current.rotation.x = -swing;
    armR.current.rotation.x = -swing * 0.6;
  });
  return (
    <group>
      <mesh position={[0, 0.12, 0]} material={MAT.academyStoneDark} castShadow receiveShadow>
        <cylinderGeometry args={[0.36, 0.42, 0.24, 24]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={wood} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.7, 12]} />
      </mesh>
      <group ref={torso} position={[0, 0.9, 0]}>
        <mesh position={[0, 0.32, 0]} material={MAT.canvas} castShadow>
          <capsuleGeometry args={[0.2, 0.42, 8, 16]} />
        </mesh>
        <mesh position={[0, 0.38, 0.2]} material={ward}>
          <torusGeometry args={[0.1, 0.022, 10, 28]} />
        </mesh>
        <mesh position={[0, 0.82, 0]} material={wood} castShadow>
          <sphereGeometry args={[0.13, 20, 16]} />
        </mesh>
        <group ref={armL} position={[-0.27, 0.55, 0]}>
          <mesh position={[-0.05, -0.18, 0]} rotation={[0, 0, 0.25]} material={wood} castShadow>
            <capsuleGeometry args={[0.045, 0.34, 6, 10]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.27, 0.55, 0]}>
          <mesh position={[0.05, -0.18, 0]} rotation={[0, 0, -0.25]} material={wood} castShadow>
            <capsuleGeometry args={[0.045, 0.34, 6, 10]} />
          </mesh>
        </group>
        {[-0.15, 0.15].map((y) => (
          <mesh key={y} position={[0, 0.32 + y, 0]} material={MAT.burgundyLeather}>
            <torusGeometry args={[0.205, 0.012, 6, 28]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ---------- Mischief sprite (MD-3) ----------

export function SpriteModel({ pose, variant }: { pose: PoseRef; variant?: string }) {
  const body = useRef<Group>(null);
  const tail = useRef<Group>(null);
  const fur = variant === 'grey' ? MAT.furGrey : MAT.fur;
  const freckles = useOwnMaterial(MAT.tealGlow);
  useGlowPulse(pose, freckles, 1.2, 3);
  useFrame(() => {
    const p = pose.current;
    if (!body.current || !tail.current) return;
    const hop = p.moving ? Math.abs(Math.sin(p.time * 9)) * 0.12 : Math.abs(Math.sin(p.time * 2.2)) * 0.02;
    body.current.position.y = hop - p.windup * 0.1;
    body.current.rotation.x = p.windup * 0.35 - p.hit * 0.5;
    body.current.rotation.y = p.defeated ? p.dispel * 12 : 0;
    tail.current.rotation.x = Math.sin(p.time * 4) * 0.3;
    tail.current.rotation.z = Math.sin(p.time * 3.1) * 0.25;
  });
  return (
    <group ref={body}>
      <mesh position={[0, 0.3, 0]} rotation={[0.35, 0, 0]} material={fur} castShadow>
        <capsuleGeometry args={[0.13, 0.2, 8, 16]} />
      </mesh>
      <mesh position={[0, 0.5, 0.08]} material={fur} castShadow>
        <sphereGeometry args={[0.13, 20, 16]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0.05 * s, 0.53, 0.2]} material={MAT.eyeDark}>
            <sphereGeometry args={[0.032, 12, 10]} />
          </mesh>
          <mesh position={[0.13 * s, 0.66, 0.02]} rotation={[0, 0, -0.5 * s]} scale={[0.6, 1.6, 0.25]} material={variant === 'teal' ? freckles : MAT.leaf}>
            <sphereGeometry args={[0.07, 12, 10]} />
          </mesh>
          <mesh position={[0.07 * s, 0.36, 0.13]} material={freckles}>
            <sphereGeometry args={[0.014, 8, 6]} />
          </mesh>
        </group>
      ))}
      <group ref={tail} position={[0, 0.28, -0.14]}>
        <mesh position={[0, 0.12, -0.12]} rotation={[-0.9, 0, 0]} material={fur}>
          <capsuleGeometry args={[0.03, 0.3, 6, 8]} />
        </mesh>
        <mesh position={[0, 0.26, -0.26]} scale={[1, 0.4, 1.4]} material={MAT.leaf}>
          <sphereGeometry args={[0.07, 12, 8]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- Runaway book (MD-4) ----------

const BOOK_COVERS = { default: MAT.burgundyLeather, green: MAT.greenLeather, blue: MAT.blueLeather } as const;

export function BookModel({ pose, variant }: { pose: PoseRef; variant?: string }) {
  const body = useRef<Group>(null);
  const coverL = useRef<Group>(null);
  const coverR = useRef<Group>(null);
  const cover = BOOK_COVERS[(variant ?? 'default') as keyof typeof BOOK_COVERS] ?? MAT.burgundyLeather;
  const runes = useOwnMaterial(MAT.wardGold);
  useGlowPulse(pose, runes, 0.9);
  useFrame(() => {
    const p = pose.current;
    if (!body.current || !coverL.current || !coverR.current) return;
    const flap = p.defeated ? 0 : 0.5 + Math.sin(p.time * 7) * 0.35 + p.windup * 0.6;
    coverL.current.rotation.z = flap;
    coverR.current.rotation.z = -flap;
    body.current.rotation.z = Math.sin(p.time * 1.7) * 0.15;
    body.current.rotation.x = -0.4 - p.hit * 0.6;
  });
  return (
    <group ref={body} scale={1.15}>
      <mesh material={MAT.parchment} castShadow>
        <boxGeometry args={[0.3, 0.05, 0.4]} />
      </mesh>
      <group ref={coverL} position={[0, 0.03, 0]}>
        <mesh position={[-0.16, 0, 0]} material={cover} castShadow>
          <boxGeometry args={[0.32, 0.018, 0.42]} />
        </mesh>
        <mesh position={[-0.16, 0.012, 0]} rotation={[Math.PI / 2, 0, 0]} material={runes}>
          <torusGeometry args={[0.06, 0.008, 6, 20]} />
        </mesh>
      </group>
      <group ref={coverR} position={[0, 0.03, 0]}>
        <mesh position={[0.16, 0, 0]} material={cover} castShadow>
          <boxGeometry args={[0.32, 0.018, 0.42]} />
        </mesh>
      </group>
    </group>
  );
}

// ---------- Ink wisp (MD-5) ----------

export function WispModel({ pose }: { pose: PoseRef }) {
  const body = useRef<Group>(null);
  const shield = useRef<Group>(null);
  const eyes = useOwnMaterial(MAT.eyeCyan);
  useGlowPulse(pose, eyes, 2.2, 1.5);
  const tail = useMemo(
    () => new CatmullRomCurve3([v(0, 0.6, 0), v(0.05, 0.35, -0.05), v(-0.06, 0.12, -0.14), v(0.04, -0.12, -0.22)]),
    [],
  );
  useFrame(() => {
    const p = pose.current;
    if (!body.current || !shield.current) return;
    const squash = 1 - p.windup * 0.15;
    body.current.scale.set(1 + p.windup * 0.1, squash, 1);
    body.current.rotation.z = Math.sin(p.time * 1.4) * 0.08;
    const s = p.shielded ? 1 : Math.max(0, 1 - p.stunned * 3);
    shield.current.scale.setScalar(s + p.stunned * 0.6);
    shield.current.visible = s > 0.01;
    shield.current.rotation.z = p.time * 0.6;
  });
  return (
    <group ref={body}>
      <mesh position={[0, 0.85, 0]} scale={[1, 1.3, 0.8]} material={MAT.inkBody} castShadow>
        <sphereGeometry args={[0.24, 24, 20]} />
      </mesh>
      <mesh material={MAT.inkBody}>
        <tubeGeometry args={[tail, 24, 0.12, 12, false]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0.08 * s, 0.95, 0.19]} material={eyes}>
            <sphereGeometry args={[0.035, 12, 10]} />
          </mesh>
          <mesh position={[0.26 * s, 0.7, 0.05]} rotation={[0, 0, 0.6 * s]} material={MAT.inkBody}>
            <capsuleGeometry args={[0.045, 0.3, 6, 10]} />
          </mesh>
        </group>
      ))}
      <group ref={shield} position={[0, 0.85, 0.45]}>
        <mesh material={MAT.wardBlue}>
          <torusGeometry args={[0.42, 0.02, 10, 48]} />
        </mesh>
        <mesh material={MAT.wardBlue}>
          <torusGeometry args={[0.3, 0.01, 8, 6]} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.42, 48]} />
          <meshBasicMaterial color="#7fc4ff" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

/** The wisp's luminous rune shield disc (§14A.7), shown until the shield word is typed. */
export function WispShield({ pose }: { pose: PoseRef }) {
  const shield = useRef<Group>(null);
  useFrame(() => {
    const p = pose.current;
    if (!shield.current) return;
    const s = p.shielded ? 1 : Math.max(0, 1 - p.stunned * 3);
    shield.current.scale.setScalar(s + p.stunned * 0.6);
    shield.current.visible = s > 0.01;
    shield.current.rotation.z = p.time * 0.6;
  });
  return (
    <group ref={shield} position={[0, 0.85, 0.45]}>
      <mesh material={MAT.wardBlue}>
        <torusGeometry args={[0.42, 0.02, 10, 48]} />
      </mesh>
      <mesh material={MAT.wardBlue}>
        <torusGeometry args={[0.3, 0.01, 8, 6]} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.42, 48]} />
        <meshBasicMaterial color="#7fc4ff" transparent opacity={0.16} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------- Thorn pod (MD-7) ----------

export function ThornPodModel({ pose }: { pose: PoseRef }) {
  const head = useRef<Group>(null);
  const petals = useRef<(Group | null)[]>([]);
  const core = useOwnMaterial(MAT.eyeAmber);
  useGlowPulse(pose, core, 1.4, 3);
  const stem = useMemo(() => new CatmullRomCurve3([v(0, 0, 0), v(0.05, 0.5, 0.02), v(-0.04, 0.95, 0.06), v(0, 1.25, 0.1)]), []);
  useFrame(() => {
    const p = pose.current;
    if (!head.current) return;
    head.current.rotation.x = -0.2 + p.windup * 0.5 - p.hit * 0.4 + (p.defeated ? p.dispel * 0.8 : 0);
    head.current.rotation.z = Math.sin(p.time * 0.9) * 0.08;
    const close = p.defeated ? 0.6 : p.windup * 0.7;
    petals.current.forEach((g) => {
      if (g) g.rotation.x = 0.25 + close;
    });
  });
  return (
    <group>
      <mesh position={[0, 0.06, 0]} material={MAT.soil} receiveShadow>
        <cylinderGeometry args={[0.45, 0.55, 0.12, 20]} />
      </mesh>
      <mesh material={MAT.stem} castShadow>
        <tubeGeometry args={[stem, 20, 0.05, 10, false]} />
      </mesh>
      {[0.4, 0.75].map((y, i) => (
        <mesh key={y} position={[0.18 * (i ? -1 : 1), y, 0.02]} rotation={[0.2, 0, i ? 0.9 : -0.9]} scale={[1, 0.18, 0.45]} material={MAT.leaf} castShadow>
          <sphereGeometry args={[0.22, 14, 10]} />
        </mesh>
      ))}
      <group ref={head} position={[0, 1.3, 0.1]}>
        <mesh material={core}>
          <sphereGeometry args={[0.12, 18, 14]} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i / 7) * Math.PI * 2]}>
            <group ref={(g) => void (petals.current[i] = g)} position={[0, 0.1, 0]}>
              <mesh position={[0, 0.15, 0.02]} scale={[0.55, 1, 0.2]} material={MAT.petal} castShadow>
                <sphereGeometry args={[0.16, 12, 10]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </group>
  );
}

// ---------- Mossling (MD-8) ----------

export function MosslingModel({ pose }: { pose: PoseRef }) {
  const body = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const eyes = useOwnMaterial(MAT.eyeAmber);
  useGlowPulse(pose, eyes, 1.6, 1.2);
  useFrame(() => {
    const p = pose.current;
    if (!body.current || !armL.current || !armR.current || !legL.current || !legR.current) return;
    const stride = p.moving ? Math.sin(p.time * 5.2) : 0;
    legL.current.rotation.x = stride * 0.5;
    legR.current.rotation.x = -stride * 0.5;
    body.current.position.y = p.moving ? Math.abs(stride) * 0.04 : 0;
    body.current.rotation.z = stride * 0.05;
    armL.current.rotation.x = -stride * 0.35 - p.windup * 1.8;
    armR.current.rotation.x = stride * 0.35 - p.windup * 0.4;
    body.current.rotation.y = p.windup * 0.4;
    // Defeat: settle into a harmless moss mound.
    if (p.defeated) {
      const k = Math.min(1, p.dispel * 1.4);
      body.current.scale.set(1 + k * 0.25, 1 - k * 0.55, 1 + k * 0.25);
      body.current.rotation.x = 0;
    } else {
      body.current.scale.set(1, 1, 1);
      body.current.rotation.x = -p.hit * 0.3;
    }
  });
  return (
    <group ref={body}>
      <mesh position={[0, 0.58, 0]} scale={[1, 0.95, 0.85]} material={MAT.moss} castShadow>
        <sphereGeometry args={[0.36, 24, 20]} />
      </mesh>
      <mesh position={[0, 0.9, 0.08]} scale={[1, 0.9, 0.95]} material={MAT.moss} castShadow>
        <sphereGeometry args={[0.22, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.66, -0.2]} rotation={[-0.4, 0, 0]} scale={[1.1, 0.5, 0.6]} material={MAT.bark} castShadow>
        <sphereGeometry args={[0.3, 16, 12]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0.08 * s, 0.94, 0.27]} material={eyes}>
            <sphereGeometry args={[0.035, 12, 10]} />
          </mesh>
          <mesh position={[0.17 * s, 1.07, 0.02]} rotation={[0, 0, -0.7 * s]} scale={[0.5, 1.4, 0.3]} material={MAT.moss}>
            <sphereGeometry args={[0.06, 10, 8]} />
          </mesh>
          <group ref={s < 0 ? armL : armR} position={[0.36 * s, 0.75, 0.04]}>
            <mesh position={[0.04 * s, -0.24, 0.06]} rotation={[0.2, 0, 0.15 * s]} material={MAT.moss} castShadow>
              <capsuleGeometry args={[0.08, 0.36, 8, 12]} />
            </mesh>
          </group>
          <group ref={s < 0 ? legL : legR} position={[0.16 * s, 0.28, 0]}>
            <mesh position={[0, -0.12, 0]} material={MAT.bark} castShadow>
              <capsuleGeometry args={[0.08, 0.14, 6, 10]} />
            </mesh>
          </group>
        </group>
      ))}
      {[-0.1, 0.05, 0.18].map((x, i) => (
        <mesh key={i} position={[x, 1.02 - i * 0.07, -0.22]} rotation={[-0.6, 0, x * 3]} scale={[0.4, 1.2, 0.08]} material={MAT.leaf}>
          <sphereGeometry args={[0.12, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Pollen puff (MD-9) ----------

const Y_AXIS = v(0, 1, 0);

export function PollenModel({ pose }: { pose: PoseRef }) {
  const body = useRef<Group>(null);
  const fibres = useMemo(() => {
    const out: { position: Vector3; quaternion: Quaternion }[] = [];
    for (let i = 0; i < 40; i++) {
      const y = 1 - (i / 39) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.39996;
      const dir = v(Math.cos(a) * r, y, Math.sin(a) * r);
      out.push({ position: dir.clone().multiplyScalar(0.17), quaternion: new Quaternion().setFromUnitVectors(Y_AXIS, dir) });
    }
    return out;
  }, []);
  useFrame(() => {
    const p = pose.current;
    if (!body.current) return;
    body.current.rotation.y = p.time * 0.4;
    body.current.position.y = Math.sin(p.time * 1.2) * 0.08;
  });
  return (
    <group ref={body}>
      <mesh material={MAT.stem}>
        <sphereGeometry args={[0.07, 14, 10]} />
      </mesh>
      {fibres.map((f, i) => (
        <mesh key={i} position={f.position} quaternion={f.quaternion} material={MAT.parchment}>
          <cylinderGeometry args={[0.003, 0.003, 0.2, 4]} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.03 * s, 0.02, 0.065]} material={MAT.eyeDark}>
          <sphereGeometry args={[0.012, 8, 6]} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[0.32, 20, 16]} />
        <meshBasicMaterial color="#fff6c8" transparent opacity={0.08} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------- Armour guardian (MD-10) ----------

export function GuardianModel({ pose }: { pose: PoseRef }) {
  const torso = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const visor = useOwnMaterial(MAT.wardBlue);
  useGlowPulse(pose, visor, 1.4, 1.5);
  useFrame(() => {
    const p = pose.current;
    if (!torso.current || !armL.current || !armR.current) return;
    const breathe = Math.sin(p.time * 1.2) * 0.01;
    // Defeat: a slow, formal bow.
    const bow = p.defeated ? Math.min(1, p.dispel * 1.2) * 0.6 : 0;
    torso.current.rotation.x = bow + p.windup * -0.2 - p.hit * 0.15;
    torso.current.position.y = 1.05 + breathe;
    armL.current.rotation.x = -p.windup * 1.2 + bow * 0.4;
    armR.current.rotation.x = -p.windup * 1.6 + bow * 0.4;
    armR.current.rotation.z = -p.windup * 0.6;
  });
  return (
    <group>
      <group ref={torso} position={[0, 1.05, 0]}>
        <mesh position={[0, 0.35, 0]} scale={[1, 1.1, 0.75]} material={MAT.darkSteel} castShadow>
          <sphereGeometry args={[0.36, 24, 20]} />
        </mesh>
        <mesh position={[0, 0.42, 0.26]} material={visor}>
          <torusGeometry args={[0.1, 0.02, 8, 24, Math.PI * 1.4]} />
        </mesh>
        <mesh position={[0, -0.05, 0]} material={MAT.navyCloth} castShadow>
          <cylinderGeometry args={[0.3, 0.38, 0.45, 20]} />
        </mesh>
        <group position={[0, 0.85, 0]}>
          <mesh scale={[0.85, 1, 0.9]} material={MAT.steel} castShadow>
            <sphereGeometry args={[0.2, 24, 20]} />
          </mesh>
          <mesh position={[0, 0, 0.16]} scale={[1, 0.25, 0.3]} material={visor}>
            <sphereGeometry args={[0.13, 16, 10]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={MAT.agedBrass}>
            <torusGeometry args={[0.12, 0.02, 8, 24]} />
          </mesh>
        </group>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[0.42 * s, 0.6, 0]} material={MAT.steel} castShadow>
              <sphereGeometry args={[0.16, 18, 14]} />
            </mesh>
            <group ref={s < 0 ? armL : armR} position={[0.44 * s, 0.55, 0]}>
              <mesh position={[0.04 * s, -0.35, 0]} material={MAT.darkSteel} castShadow>
                <capsuleGeometry args={[0.08, 0.5, 8, 12]} />
              </mesh>
              <mesh position={[0.05 * s, -0.68, 0.02]} material={MAT.steel}>
                <sphereGeometry args={[0.09, 14, 10]} />
              </mesh>
            </group>
          </group>
        ))}
      </group>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.16 * s, 0.45, 0]} material={MAT.darkSteel} castShadow>
          <capsuleGeometry args={[0.1, 0.62, 8, 12]} />
        </mesh>
      ))}
    </group>
  );
}

// ---------- Small magical targets ----------

export function StarPageModel({ pose, cosmetic }: { pose: PoseRef; cosmetic: boolean }) {
  const body = useRef<Group>(null);
  const { root, glow } = useKitGlow(cosmetic ? 'star_page_teal' : 'star_page', [cosmetic ? 'TealGlow' : 'Energy']);
  useGlowPulses(pose, glow, 2.2);
  useFrame(() => {
    const p = pose.current;
    if (!body.current) return;
    body.current.rotation.y = Math.sin(p.time * 1.1) * 0.5;
    body.current.position.y = Math.sin(p.time * 1.7) * 0.05;
  });
  return (
    <group ref={body}>
      <primitive object={root} rotation={[0.15, 0, 0.1]} />
      <mesh>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshBasicMaterial color={cosmetic ? '#8fffd8' : '#ffe9a0'} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Cut-gem silhouette (crown and pavilion), revolved with eight facets for a crisp sparkle. */
const GEM_PROFILE = [new Vector2(0, -0.19), new Vector2(0.15, -0.02), new Vector2(0.16, 0.02), new Vector2(0.1, 0.08), new Vector2(0, 0.08)];
const GEM_COLOURS = ['#ffd45a', '#5ec8ff', '#ff7ab8', '#6dffa8'];

/** Spark gem (CLAUDE.md §1B): spins, glints, and bursts outward when caught. */
export function GemModel({ pose, seed }: { pose: PoseRef; seed: string }) {
  const body = useRef<Group>(null);
  const colour = GEM_COLOURS[[...seed].reduce((n, c) => n + c.charCodeAt(0), 0) % GEM_COLOURS.length] ?? '#ffd45a';
  const geometry = useMemo(() => new LatheGeometry(GEM_PROFILE, 8), []);
  const material = useMemo(
    () => new MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.3, flatShading: true }),
    [colour],
  );
  useFrame(() => {
    const p = pose.current;
    const b = body.current;
    if (!b) return;
    b.rotation.y = p.time * 2.4;
    b.rotation.z = Math.sin(p.time * 1.7) * 0.25;
    const burst = p.defeated ? Math.min(1, p.dispel * 2) : 0;
    b.scale.setScalar(1 + burst * 1.8);
    material.opacity = 1 - burst;
    material.transparent = burst > 0;
    material.emissiveIntensity = 1.6 + Math.sin(p.time * 6) * 0.4 + burst * 4;
  });
  return (
    <group ref={body}>
      <mesh geometry={geometry} material={material} />
      <mesh>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshBasicMaterial color={colour} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function ClaspModel({ pose }: { pose: PoseRef }) {
  const body = useRef<Group>(null);
  const { root, glow } = useKitGlow('clasp', ['Crystal']);
  useGlowPulses(pose, glow, 1.8);
  useFrame(() => {
    const p = pose.current;
    if (!body.current) return;
    // Straining against the book: a fast shiver that grows when struck.
    body.current.rotation.z = Math.sin(p.time * 14) * 0.04 * (1 + p.hit * 4);
  });
  return (
    <group ref={body}>
      <primitive object={root} />
    </group>
  );
}

export function FlyingPageModel({ pose }: { pose: PoseRef }) {
  const body = useRef<Group>(null);
  const page = useKit('page_loose');
  useFrame(() => {
    const p = pose.current;
    if (!body.current) return;
    body.current.rotation.x = Math.sin(p.time * 6) * 0.4;
    body.current.rotation.y = p.time * 1.5;
  });
  return (
    <group ref={body}>
      <primitive object={page} />
    </group>
  );
}

export function PlateModel({ pose }: { pose: PoseRef }) {
  const body = useRef<Group>(null);
  const { root, glow } = useKitGlow('warden_plate', ['Energy']);
  useGlowPulses(pose, glow, 1.6);
  useFrame(() => {
    const p = pose.current;
    if (!body.current) return;
    body.current.rotation.z = Math.sin(p.time * 1.3) * 0.05 + p.hit * 0.2;
  });
  return (
    <group ref={body}>
      <primitive object={root} />
    </group>
  );
}

export function RuneModel({ pose }: { pose: PoseRef }) {
  const body = useRef<Group>(null);
  const glow = useOwnMaterial(MAT.wardBlue);
  useGlowPulse(pose, glow, 1.8, 1);
  useFrame(() => {
    const p = pose.current;
    if (!body.current) return;
    body.current.rotation.z = p.time * 0.8;
  });
  return (
    <group ref={body}>
      <mesh material={glow}>
        <torusGeometry args={[0.26, 0.025, 10, 40]} />
      </mesh>
      <mesh material={glow} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.16, 0.015, 6, 4]} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.26, 32]} />
        <meshBasicMaterial color="#9fd0ff" transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}
