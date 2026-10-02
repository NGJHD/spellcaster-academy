/**
 * Automated asset checks (§14.7): every runtime GLB exists and loads, meshes have normals and finite
 * transforms, required animations are present and non-empty, scale is plausible, the word anchor is
 * above the visible asset, triangle/material budgets hold, and no cameras or lights are exported.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ASSETS, BUDGETS } from './build-manifests.mjs';
import { analyseGlb } from './glb.mjs';

const ROOT = join(import.meta.dirname, '..');

describe.each(Object.entries(ASSETS))('%s assets', (folder, assets) => {
  it.each(Object.entries(assets))('%s passes validation', (id, meta) => {
    const file = join(ROOT, 'public', 'assets', folder, `${id}.glb`);
    expect(existsSync(file), file).toBe(true);
    const a = analyseGlb(file);
    expect(a.missingNormals, 'meshes without normals').toBe(0);
    expect(a.nonFinite, 'non-finite transforms').toBe(false);
    expect(a.cameras + a.lights, 'exported cameras/lights').toBe(0);
    expect(a.triangles).toBeGreaterThan(500);
    expect(a.triangles).toBeLessThanOrEqual(BUDGETS[meta.budget]);
    expect(a.materials).toBeLessThanOrEqual(24);
    for (const clip of meta.animations) {
      const found = a.animations.find((x) => x.name === clip);
      expect(found, `animation ${clip}`).toBeDefined();
      expect(found.channels, `animation ${clip} channels`).toBeGreaterThan(0);
    }
    for (const node of meta.nodes ?? []) expect(a.nodeNames, `named part ${node}`).toContain(node);
    const height = a.bounds.max[1] - a.bounds.min[1];
    expect(height, 'height (m)').toBeGreaterThanOrEqual(meta.height[0]);
    expect(height, 'height (m)').toBeLessThanOrEqual(meta.height[1]);
    expect(meta.wordAnchor[1], 'word anchor above the asset').toBeGreaterThan(a.bounds.max[1]);
  });
});

describe('kit pieces', () => {
  const dir = join(ROOT, 'public', 'assets', 'kit');
  const files = readdirSync(dir).filter((f) => f.endsWith('.glb'));
  it('the kit exists', () => expect(files.length).toBeGreaterThan(20));
  it.each(files)('%s loads within budget', (file) => {
    const a = analyseGlb(join(dir, file));
    expect(a.missingNormals).toBe(0);
    expect(a.nonFinite).toBe(false);
    expect(a.cameras + a.lights).toBe(0);
    expect(a.triangles).toBeGreaterThan(0);
    expect(a.triangles).toBeLessThanOrEqual(BUDGETS.prop);
    expect(a.materials).toBeLessThanOrEqual(8);
  });
});

describe('CC0 props', () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'public', 'assets', 'manifests', 'props.json'), 'utf8'));
  it.each(Object.keys(manifest))('%s is within budget and loads', (id) => {
    const file = join(ROOT, 'public', 'assets', 'props', `${id}.glb`);
    expect(existsSync(file)).toBe(true);
    const a = analyseGlb(file);
    expect(a.triangles).toBeLessThanOrEqual(BUDGETS.prop);
    expect(a.missingNormals).toBe(0);
    expect(a.cameras + a.lights).toBe(0);
    expect(manifest[id].license).toMatch(/CC0/);
  });

  it('every prop referenced in code exists', () => {
    const sources = ['ExteriorScene', 'LibraryScene', 'PortraitsScene', 'GreenhouseScene', 'TowerScene'].map((n) =>
      readFileSync(join(ROOT, 'src', 'scene', 'areas', `${n}.tsx`), 'utf8'),
    );
    const ids = new Set();
    for (const src of sources) for (const m of src.matchAll(/id="([a-zA-Z0-9_]+)"/g)) ids.add(m[1]);
    // Ids name either a CC0 prop or a kit piece (assets-src/scripts/props/kit_props.py).
    const found = (id) => ['props', 'kit'].some((folder) => existsSync(join(ROOT, 'public', 'assets', folder, `${id}.glb`)));
    for (const id of ids) expect(found(id), id).toBe(true);
  });
});
