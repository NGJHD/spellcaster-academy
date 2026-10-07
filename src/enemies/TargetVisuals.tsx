/**
 * PLACEHOLDER creature and target stand-ins (CLAUDE.md §14A, MD-2 … MD-11).
 * Built from smooth primitives so gameplay can be finished before the Blender GLBs land.
 * Every model reads only a `TargetPose`, so swapping in a GLB never touches gameplay code.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type RefObject } from 'react';
import { AdditiveBlending, CanvasTexture, CatmullRomCurve3, LatheGeometry, MeshStandardMaterial, Quaternion, SphereGeometry, SpriteMaterial, Vector2, Vector3, type Group, type Sprite } from 'three';
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

const IMP_PAINT: Record<string, string> = { red: '#e8483c', blue: '#3f7fe8', yellow: '#f2c230', green: '#3fbf6a', purple: '#9b5de5' };

/** Paint-blob body: a smooth sphere with soft lumps and a drippy base (no faceting). */
function impBodyGeometry(): SphereGeometry {
  const g = new SphereGeometry(0.28, 40, 28);
  const pos = g.getAttribute('position');
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const lump = 1 + 0.07 * Math.sin(v.x * 21 + v.y * 9) * Math.cos(v.z * 17);
    v.multiplyScalar(lump);
    // Drips hang from the lower half.
    if (v.y < -0.05) v.y -= Math.max(0, Math.sin(Math.atan2(v.z, v.x) * 5)) * 0.12 * (-v.y / 0.28);
    v.y *= 1.15;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * PLACEHOLDER paint imp (LD-0 Hall of Portraits): a cheeky glossy blob of portrait paint with big
 * eyes and stubby arms. Hops, rears back to throw a splat, and bursts back into paint when beaten.
 */
export function ImpModel({ pose, variant }: { pose: PoseRef; variant?: string }) {
  const body = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const colour = IMP_PAINT[variant ?? 'red'] ?? '#e8483c';
  const geometry = useMemo(() => impBodyGeometry(), []);
  const paint = useMemo(() => new MeshStandardMaterial({ color: colour, roughness: 0.18, metalness: 0, emissive: colour, emissiveIntensity: 0.08 }), [colour]);
  useFrame(() => {
    const p = pose.current;
    const b = body.current;
    if (!b) return;
    const hop = Math.abs(Math.sin(p.time * (p.moving ? 9 : 3.4))) * (p.moving ? 0.25 : 0.06);
    const squash = 1 - p.hit * 0.35 + Math.sin(p.time * 6.8) * 0.03;
    b.position.y = hop + 0.3;
    b.scale.set(1 / Math.sqrt(squash) + p.dispel * 1.4, squash * (1 - p.dispel * 0.8), 1 / Math.sqrt(squash) + p.dispel * 1.4);
    b.rotation.x = -p.windup * 0.45;
    if (arm.current) arm.current.rotation.x = -p.windup * 2.4 + (p.recovering ? 1.2 : 0) + Math.sin(p.time * 5) * 0.15;
  });
  return (
    <group scale={1.5}>
    <group ref={body}>
      <mesh geometry={geometry} material={paint} castShadow />
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0.1 * s, 0.1, 0.24]} material={MAT.eyeWhite}>
            <sphereGeometry args={[0.075, 16, 12]} />
          </mesh>
          <mesh position={[0.11 * s, 0.1, 0.31]} material={MAT.eyeDark}>
            <sphereGeometry args={[0.035, 12, 10]} />
          </mesh>
        </group>
      ))}
      <mesh position={[-0.27, -0.02, 0.05]} rotation={[0, 0, 0.9]} material={paint}>
        <capsuleGeometry args={[0.045, 0.14, 6, 10]} />
      </mesh>
      <group ref={arm} position={[0.24, 0.05, 0]}>
        <mesh position={[0.06, 0.08, 0]} rotation={[0, 0, -0.5]} material={paint}>
          <capsuleGeometry args={[0.045, 0.14, 6, 10]} />
        </mesh>
        {/* The paint ball it is about to throw. */}
        <mesh position={[0.12, 0.2, 0]} material={paint}>
          <sphereGeometry args={[0.07, 14, 10]} />
        </mesh>
      </group>
    </group>
    </group>
  );
}

/**
 * PLACEHOLDER Hush stand-in (Levels 2-3) shown only while a realistic model streams in or is missing:
 * a smouldering charcoal body with ember eyes and glowing cracks, sized per kind.
 */
const HUSH_SIZE: Record<string, number> = {
  blotling: 0.7, 'eraser-moth': 1.0, 'scribble-imp': 0.8, smudgehound: 1.0, 'hollow-knight': 2.1,
  'correction-moth': 1.0, redactor: 2.3, foreman: 2.6,
};

export function HushModel({ pose, kind }: { pose: PoseRef; kind: string }) {
  const body = useRef<Group>(null);
  const h = HUSH_SIZE[kind] ?? 1;
  const skin = useMemo(() => new MeshStandardMaterial({ color: '#141010', roughness: 0.6, emissive: '#ff2a08', emissiveIntensity: 0.15 }), []);
  const eye = useMemo(() => new MeshStandardMaterial({ color: '#ff8a20', emissive: '#ff5a10', emissiveIntensity: 3 }), []);
  useFrame(() => {
    const p = pose.current;
    const b = body.current;
    if (!b) return;
    b.position.y = Math.abs(Math.sin(p.time * (p.moving ? 8 : 2))) * 0.05 * h;
    b.rotation.x = -p.windup * 0.4 + p.hit * 0.3;
    b.scale.setScalar(Math.max(0.001, 1 - p.dispel));
    skin.emissiveIntensity = 0.15 + p.windup * 0.8 + p.hit * 0.6;
  });
  return (
    <group ref={body}>
      <mesh position={[0, h * 0.45, 0]} scale={[0.32 * h, 0.45 * h, 0.28 * h]} material={skin} castShadow>
        <sphereGeometry args={[1, 24, 18]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0.1 * h * s, h * 0.72, 0.24 * h]} material={eye}>
          <sphereGeometry args={[0.045 * h, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

/** An incoming fireball carrying a counter-word: a burning core with a trail of flame. */
/** A soft radial glow texture (white centre fading to nothing), shared by every fireball. */
let glowTexture: CanvasTexture | null = null;
function softGlow(): CanvasTexture {
  if (glowTexture) return glowTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0.75)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  }
  glowTexture = new CanvasTexture(c);
  return glowTexture;
}

/**
 * A fireball (owner, 2026-10-07: "the circle yellow with a blockish glow … needs a better render"):
 * a white-hot core inside layers of soft additive glow (no hard edges), with a flickering orange
 * corona and a short ember trail, all facing the camera.
 */
export function FireballModel({ pose }: { pose: PoseRef }) {
  const core = useRef<Group>(null);
  const corona = useRef<Sprite>(null);
  const embers = useRef<Group>(null);
  const hot = useMemo(() => new MeshStandardMaterial({ color: '#fff0c0', emissive: '#ffb040', emissiveIntensity: 5, toneMapped: false }), []);
  const glows = useMemo(
    () =>
      (['#ffe8a0', '#ff8a20', '#ff3a08'] as const).map(
        (color, i) => new SpriteMaterial({ map: softGlow(), color, transparent: true, opacity: [0.95, 0.7, 0.45][i] ?? 0.5, blending: AdditiveBlending, depthWrite: false, toneMapped: false }),
      ),
    [],
  );
  useFrame(() => {
    const p = pose.current;
    const g = core.current;
    if (!g) return;
    const fade = Math.max(0.001, 1 - p.dispel * 1.5);
    g.scale.setScalar(fade);
    const flick = 1 + Math.sin(p.time * 23) * 0.08 + Math.sin(p.time * 37) * 0.05;
    corona.current?.scale.setScalar(1.6 * flick);
    const e = embers.current;
    if (e) {
      e.children.forEach((child, i) => {
        const k = (p.time * 1.8 + i * 0.27) % 1;
        child.position.set(Math.sin(i * 2.3 + p.time * 3) * 0.12 * k, Math.cos(i * 1.7) * 0.1 * k, k * 0.9);
        child.scale.setScalar(0.12 * (1 - k));
      });
    }
  });
  return (
    <group ref={core}>
      <mesh material={hot}>
        <sphereGeometry args={[0.16, 20, 14]} />
      </mesh>
      <sprite material={glows[0]} scale={0.7} />
      <sprite ref={corona} material={glows[1]} scale={1.6} />
      <sprite material={glows[2]} scale={2.6} />
      {/* A short trail of embers behind it */}
      <group ref={embers}>
        {[0, 1, 2, 3, 4].map((i) => (
          <sprite key={i} material={glows[1]} scale={0.1} />
        ))}
      </group>
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
