/**
 * /dev/assets — asset viewer (§14.7): orbit camera, animation switching, neutral vs game lighting,
 * wireframe, LOD switching, collider and word-anchor display, bounding-box measurements, triangle and
 * material counts. Development tool only; never part of the story level.
 */
import { Environment, Grid, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { AnimationMixer, Box3, Mesh, Vector3, type AnimationAction, type Material, type Object3D } from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import creatures from '../../public/assets/manifests/creatures.json';
import characters from '../../public/assets/manifests/characters.json';
import props from '../../public/assets/manifests/props.json';
import { applySurfaceTextures } from '../scene/surfaces';

interface Entry {
  id: string;
  file: string;
  group: string;
  lod?: string;
  collision?: { shape: string; radius: number; height: number };
  wordAnchor?: number[];
  license: string;
}

const ENTRIES: Entry[] = [
  ...Object.values(creatures).map((c) => ({ ...c, group: 'Creatures' })),
  ...Object.values(characters).map((c) => ({ ...c, group: 'Characters' })),
  ...Object.values(props as Record<string, { id: string; file: string; license: string; lodFiles?: string[] }>).map((p) => ({
    id: p.id,
    file: p.file,
    group: 'CC0 props',
    lod: p.lodFiles?.[0],
    license: p.license,
  })),
];

interface Stats {
  triangles: number;
  materials: number;
  size: Vector3;
  clips: string[];
}

function Model({ url, clip, wireframe, onStats }: { url: string; clip: string; wireframe: boolean; onStats: (s: Stats) => void }) {
  const gltf = useGLTF(`${import.meta.env.BASE_URL}${url.replace(/^\//, '')}`);
  const scene = useMemo(() => cloneSkinned(gltf.scene) as Object3D, [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(scene), [scene]);

  useEffect(() => {
    let triangles = 0;
    const materials = new Set<Material>();
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const g = o.geometry;
      triangles += (g.index ? g.index.count : g.attributes.position?.count ?? 0) / 3;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) materials.add(m);
    });
    onStats({
      triangles: Math.round(triangles),
      materials: materials.size,
      size: new Box3().setFromObject(scene).getSize(new Vector3()),
      clips: gltf.animations.map((a) => a.name),
    });
  }, [scene, gltf.animations, onStats]);

  useEffect(() => {
    scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of list) (m as Material & { wireframe?: boolean }).wireframe = wireframe;
    });
  }, [scene, wireframe]);

  useEffect(() => {
    mixer.stopAllAction();
    const c = gltf.animations.find((a) => a.name === clip);
    let action: AnimationAction | null = null;
    if (c) {
      action = mixer.clipAction(c);
      action.play();
    }
    return () => {
      action?.stop();
    };
  }, [clip, gltf.animations, mixer]);

  useFrame((_, dt) => {
    mixer.update(dt);
  });
  return <primitive object={scene} />;
}

export function AssetViewer() {
  const [index, setIndex] = useState(0);
  const [clip, setClip] = useState('Idle');
  const [wireframe, setWireframe] = useState(false);
  const [gameLight, setGameLight] = useState(false);
  const [useLod, setUseLod] = useState(false);
  const [showHelpers, setShowHelpers] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const entry = ENTRIES[index] ?? ENTRIES[0];

  useEffect(() => applySurfaceTextures(), []);

  if (!entry) return <p>No assets.</p>;
  const url = useLod && entry.lod ? entry.lod : entry.file;
  const height = stats?.size.y ?? 1;

  return (
    <div className="asset-viewer">
      <aside className="asset-viewer__panel">
        <h1>Asset viewer</h1>
        <label>
          Asset
          <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
            {['Creatures', 'Characters', 'CC0 props'].map((g) => (
              <optgroup key={g} label={g}>
                {ENTRIES.map((en, i) =>
                  en.group === g ? (
                    <option key={en.id} value={i}>
                      {en.id}
                    </option>
                  ) : null,
                )}
              </optgroup>
            ))}
          </select>
        </label>
        {stats && stats.clips.length > 0 && (
          <label>
            Animation
            <select value={clip} onChange={(e) => setClip(e.target.value)}>
              {stats.clips.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} /> Wireframe
        </label>
        <label>
          <input type="checkbox" checked={gameLight} onChange={(e) => setGameLight(e.target.checked)} /> Game lighting
        </label>
        <label>
          <input type="checkbox" checked={showHelpers} onChange={(e) => setShowHelpers(e.target.checked)} /> Collider, anchor, bounds
        </label>
        {entry.lod && (
          <label>
            <input type="checkbox" checked={useLod} onChange={(e) => setUseLod(e.target.checked)} /> LOD1
          </label>
        )}
        {stats && (
          <dl>
            <dt>Triangles</dt>
            <dd>{stats.triangles.toLocaleString()}</dd>
            <dt>Materials</dt>
            <dd>{stats.materials}</dd>
            <dt>Size (m)</dt>
            <dd>
              {stats.size.x.toFixed(2)} × {stats.size.y.toFixed(2)} × {stats.size.z.toFixed(2)}
            </dd>
            <dt>Licence</dt>
            <dd>{entry.license}</dd>
          </dl>
        )}
      </aside>
      <Canvas shadows camera={{ position: [2.5, 1.8, 3.5], fov: 45, near: 0.01, far: 200 }}>
        <color attach="background" args={[gameLight ? '#1b1f2a' : '#4a4f58']} />
        <hemisphereLight args={['#ffffff', '#555555', gameLight ? 0.4 : 1.1]} />
        <directionalLight position={[4, 6, 3]} intensity={gameLight ? 2.6 : 1.4} color={gameLight ? '#ffe0b0' : '#ffffff'} castShadow />
        <Suspense fallback={null}>
          {gameLight && <Environment files={`${import.meta.env.BASE_URL}assets/hdri/afrikaans_church_interior_1k.hdr`} />}
          <Model key={url} url={url} clip={clip} wireframe={wireframe} onStats={setStats} />
        </Suspense>
        {showHelpers && stats && (
          <group>
            <mesh position={[0, height / 2, 0]}>
              <boxGeometry args={[stats.size.x, stats.size.y, stats.size.z]} />
              <meshBasicMaterial color="#ffcc33" wireframe />
            </mesh>
            {entry.collision && (
              <mesh position={[0, entry.collision.height / 2, 0]}>
                <capsuleGeometry args={[entry.collision.radius, Math.max(0.01, entry.collision.height - entry.collision.radius * 2), 6, 16]} />
                <meshBasicMaterial color="#33ccff" wireframe />
              </mesh>
            )}
            {entry.wordAnchor && (
              <mesh position={entry.wordAnchor as [number, number, number]}>
                <sphereGeometry args={[0.04, 12, 8]} />
                <meshBasicMaterial color="#ff66aa" />
                <Html center style={{ color: '#ff66aa', fontSize: 12, whiteSpace: 'nowrap', transform: 'translateY(-14px)' }}>
                  word anchor
                </Html>
              </mesh>
            )}
          </group>
        )}
        <Grid args={[20, 20]} cellSize={0.25} sectionSize={1} infiniteGrid fadeDistance={25} />
        <OrbitControls target={[0, Math.max(0.3, height / 2), 0]} makeDefault />
      </Canvas>
    </div>
  );
}
