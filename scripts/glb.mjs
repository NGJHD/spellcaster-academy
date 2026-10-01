/**
 * Minimal GLB reader for asset validation (no three.js needed): parses the JSON chunk, walks the node
 * hierarchy with TRS transforms, and measures triangles, materials, animations and world bounds.
 */
import { readFileSync } from 'node:fs';

export function readGlbJson(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error(`${path}: not a GLB`);
  const jsonLength = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8'));
}

const identity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}

function trs(node) {
  if (node.matrix) return node.matrix;
  const [tx, ty, tz] = node.translation ?? [0, 0, 0];
  const [x, y, z, w] = node.rotation ?? [0, 0, 0, 1];
  const [sx, sy, sz] = node.scale ?? [1, 1, 1];
  return [
    (1 - 2 * (y * y + z * z)) * sx, (2 * (x * y + z * w)) * sx, (2 * (x * z - y * w)) * sx, 0,
    (2 * (x * y - z * w)) * sy, (1 - 2 * (x * x + z * z)) * sy, (2 * (y * z + x * w)) * sy, 0,
    (2 * (x * z + y * w)) * sz, (2 * (y * z - x * w)) * sz, (1 - 2 * (x * x + y * y)) * sz, 0,
    tx, ty, tz, 1,
  ];
}

const apply = (m, [x, y, z]) => [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];

export function analyseGlb(path) {
  const json = readGlbJson(path);
  const accessors = json.accessors ?? [];
  let triangles = 0;
  let missingNormals = 0;
  let nonFinite = false;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  const visit = (index, parent) => {
    const node = json.nodes[index];
    const local = trs(node);
    if (local.some((v) => !Number.isFinite(v))) nonFinite = true;
    const world = multiply(parent, local);
    if (node.mesh !== undefined) {
      for (const prim of json.meshes[node.mesh].primitives) {
        const pos = accessors[prim.attributes.POSITION];
        const count = prim.indices !== undefined ? accessors[prim.indices].count : pos.count;
        if ((prim.mode ?? 4) === 4) triangles += Math.floor(count / 3);
        if (prim.attributes.NORMAL === undefined) missingNormals++;
        if (pos.min && pos.max && node.skin === undefined) {
          for (const corner of [0, 1, 2, 3, 4, 5, 6, 7]) {
            const p = [corner & 1 ? pos.max[0] : pos.min[0], corner & 2 ? pos.max[1] : pos.min[1], corner & 4 ? pos.max[2] : pos.min[2]];
            const w = apply(world, p);
            for (let i = 0; i < 3; i++) {
              lo[i] = Math.min(lo[i], w[i]);
              hi[i] = Math.max(hi[i], w[i]);
            }
          }
        } else if (pos.min && pos.max) {
          // Skinned meshes are authored in bind space (no node transform applies).
          for (let i = 0; i < 3; i++) {
            lo[i] = Math.min(lo[i], pos.min[i]);
            hi[i] = Math.max(hi[i], pos.max[i]);
          }
        }
      }
    }
    for (const child of node.children ?? []) visit(child, world);
  };
  const scene = json.scenes?.[json.scene ?? 0];
  for (const root of scene?.nodes ?? []) visit(root, identity());
  return {
    triangles,
    materials: (json.materials ?? []).length,
    missingNormals,
    nonFinite,
    cameras: (json.cameras ?? []).length,
    lights: json.extensions?.KHR_lights_punctual?.lights?.length ?? 0,
    animations: (json.animations ?? []).map((a) => ({ name: a.name, channels: a.channels.length })),
    nodeNames: (json.nodes ?? []).map((n) => n.name),
    images: (json.images ?? []).map((i) => i.mimeType ?? 'uri'),
    bounds: { min: lo, max: hi },
  };
}
