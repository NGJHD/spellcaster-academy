"""
Stage 1b: turn the raw TRELLIS.2 surface (millions of non-manifold dual-contouring triangles) into a
clean, watertight, manifold mesh that TRELLIS.2 can texture with per-vertex colours. The CuMesh
clean-up and UV-atlas steps in the owner's ComfyUI-3D install corrupt meshes, so this replaces them:
voxel shell -> keep the outer skin -> relax -> decimate.

    blender --background --python assets-src/scripts/ai/prep_raw.py -- <name> [target_tris] [voxels_per_height]
"""
import os
import sys

import bmesh
import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :]
name = args[0]
target = int(args[1]) if len(args) > 1 else 300000
density = float(args[2]) if len(args) > 2 else 560.0
# Hard-surface subjects (armour with open shells) lose whole parts in a VDB voxel remesh, which needs a
# well-defined inside; the octree remesh wraps any surface.
# The octree remesh keeps thin parts (petals, plates, drips) that a VDB voxel shell drops or detaches;
# the voxel path stays available for subjects that prefer it.
# Furry and soft-bodied creatures: the octree keeps their noisy fur shards, the voxel shell smooths them.
VOXEL = {"sprite_a", "mossling", "ink_wisp"}
mode = "voxel" if name in VOXEL else "octree"
src = os.path.join(ROOT, "assets-src", "ai-meshes", f"{name}_white.glb")
dst = os.path.join(ROOT, "assets-src", "ai-meshes", f"{name}_dec.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
obj = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
bpy.context.view_layer.objects.active = obj
obj.select_set(True)
height = max(obj.dimensions)

if mode == "octree":
    remesh = obj.modifiers.new("Octree", "REMESH")
    remesh.mode = "SMOOTH"
    remesh.octree_depth = 9
    remesh.scale = 0.95
    remesh.use_remove_disconnected = False
else:
    remesh = obj.modifiers.new("Voxel", "REMESH")
    remesh.mode = "VOXEL"
    remesh.voxel_size = height / density
bpy.ops.object.modifier_apply(modifier=remesh.name)

# Voxelising an open surface wraps it in a double wall: keep only the outer skin (largest extent).
bm = bmesh.new()
bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table()
seen = set()
islands = []
for v in bm.verts:
    if v.index in seen:
        continue
    stack, part = [v], []
    seen.add(v.index)
    while stack:
        cur = stack.pop()
        part.append(cur)
        for e in cur.link_edges:
            o = e.other_vert(cur)
            if o.index not in seen:
                seen.add(o.index)
                stack.append(o)
    islands.append(part)


# Cavity walls face inward, so their signed volume is negative; real outer surfaces (a body, separate
# armour plates, claws) enclose positive volume. Keep every substantial outer part.
bm.faces.ensure_lookup_table()
total = len(bm.verts)
island_of = {}
for i, part in enumerate(islands):
    for v in part:
        island_of[v.index] = i
volume = [0.0] * len(islands)
for f in bm.faces:
    vs = f.verts
    a0 = vs[0].co
    for k in range(1, len(vs) - 1):
        volume[island_of[vs[0].index]] += a0.dot(vs[k].co.cross(vs[k + 1].co)) / 6.0
doomed = []
kept = 0
for i, part in enumerate(islands):
    if volume[i] <= 0 or len(part) < total * 0.0015:
        doomed.extend(part)
    else:
        kept += 1
if doomed:
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
bm.to_mesh(obj.data)
bm.free()
obj.data.validate()

smooth = obj.modifiers.new("Relax", "SMOOTH")
smooth.factor = 0.5
smooth.iterations = 4
bpy.ops.object.modifier_apply(modifier=smooth.name)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.mesh.remove_doubles(threshold=height / 4000)
bpy.ops.object.mode_set(mode="OBJECT")
obj.data.calc_loop_triangles()
before = len(obj.data.loop_triangles)
# Collapse decimation can stop early on awkward topology: repeat passes until the budget is met.
for _ in range(4):
    obj.data.calc_loop_triangles()
    now = len(obj.data.loop_triangles)
    if now <= target * 1.05:
        break
    dec = obj.modifiers.new("Decimate", "DECIMATE")
    dec.ratio = max(0.02, target / now)
    dec.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=dec.name)
obj.data.calc_loop_triangles()
if len(obj.data.loop_triangles) > target * 1.5:
    # Collapse decimation stalls on some octree output; the mesh is closed now, so a fine voxel shell
    # keeps its thin parts and decimates cleanly.
    fix = obj.modifiers.new("Revoxel", "REMESH")
    fix.mode = "VOXEL"
    fix.voxel_size = height / density
    bpy.ops.object.modifier_apply(modifier=fix.name)
    for _ in range(4):
        obj.data.calc_loop_triangles()
        now = len(obj.data.loop_triangles)
        if now <= target * 1.05:
            break
        dec = obj.modifiers.new("Decimate", "DECIMATE")
        dec.ratio = max(0.02, target / now)
        dec.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.shade_smooth()
obj.data.calc_loop_triangles()
print(f"PREP {name}: {len(islands)} islands, kept {kept} outer parts, {before} -> {len(obj.data.loop_triangles)} tris")
bpy.ops.export_scene.gltf(filepath=dst, export_format="GLB", use_selection=True, export_materials="NONE")
print(f"PREP wrote {dst}")
