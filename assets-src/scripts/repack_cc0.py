"""
Repack downloaded CC0 Poly Haven models into compact runtime GLBs.

    blender --background --python assets-src/scripts/repack_cc0.py -- [model_id ...]

For each model in assets-src/cc0/models/<id>/<id>.gltf:
  * decimate meshes above the asset's triangle budget (CLAUDE.md §15 runtime budgets),
  * scale textures down to the asset's texture budget,
  * export public/assets/props/<id>.glb with WebP textures (keeps alpha for leaves),
  * record triangles, materials and bounds in public/assets/manifests/props.json.
"""
import json
import os
import sys

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "assets-src", "cc0", "models")
OUT = os.path.join(ROOT, "public", "assets", "props")
MANIFEST = os.path.join(ROOT, "public", "assets", "manifests", "props.json")

# (triangle budget, max texture size)
BUDGETS = {
    "island_tree_01": (24000, 512),
    "island_tree_02": (24000, 512),
    "jacaranda_tree": (28000, 512),
    "treasure_chest": (20000, 1024),
    "street_lamp_01": (2500, 512),
    "gothic_cabinet_01": (15000, 1024),
    "fir_tree_01": (16000, 512),
    "shrub_01": (8000, 512),
    "shrub_02": (8000, 512),
    "shrub_03": (8000, 512),
    "shrub_04": (8000, 512),
    "fern_02": (6000, 512),
    "flower_gazania": (4000, 512),
    "flower_ursinia": (4000, 512),
    "potted_plant_01": (8000, 512),
    "potted_plant_02": (8000, 512),
    "potted_plant_04": (8000, 512),
    "nettle_plant": (5000, 512),
    "periwinkle_plant": (5000, 512),
    "wild_rooibos_bush": (8000, 512),
    "rock_moss_set_01": (8000, 1024),
    "lantern_chandelier_01": (15000, 1024),
    "wooden_bookshelf_worn": (12000, 1024),
    "book_encyclopedia_set_01": (8000, 1024),
    "gothic_statue": (20000, 1024),
    "large_castle_door": (12000, 1024),
    "vintage_grandfather_clock_01": (15000, 1024),
    "wooden_candlestick": (3000, 512),
    "seadogs_compass": (4000, 512),
    "magnifying_glass_01": (3000, 512),
    "trowel_01": (2000, 512),
    "tea_set_01": (6000, 512),
    "Chandelier_01": (12000, 1024),
}
DEFAULT_BUDGET = (10000, 1024)

# Assets whose single-channel maps fail WebP encoding keep their original image formats.
KEEP_IMAGE_FORMAT = {
    "book_encyclopedia_set_01",
    "fancy_picture_frame_01",
    "fancy_picture_frame_02",
    "hanging_picture_frame_02",
    "lantern_chandelier_01",
    "potted_plant_01",
    "potted_plant_02",
    "marble_bust_01",
    "ceramic_vase_02",
    "magnifying_glass_01",
    "hanging_picture_frame_01",
    "vintage_cabinet_01",
    "standing_picture_frame_01",
}

# Many-object assets (trees) are joined first so decimation works on the whole model.
JOIN_FIRST = {"island_tree_01", "island_tree_02", "jacaranda_tree", "fir_tree_01"}

# Extra low-detail versions (LOD1) for heavily repeated or distant assets (§14.6).
LOD1 = {
    "island_tree_01": 7000,
    "island_tree_02": 7000,
    "jacaranda_tree": 9000,
    "fir_tree_01": 4000,
    "shrub_01": 2000,
    "shrub_02": 2000,
    "shrub_03": 2000,
    "shrub_04": 2000,
}


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def triangles(obj):
    mesh = obj.data
    mesh.calc_loop_triangles()
    return len(mesh.loop_triangles)


def scene_triangles():
    return sum(triangles(o) for o in bpy.context.scene.objects if o.type == "MESH")


def decimate_to(budget):
    """Collapse-decimate (in passes, for very dense models) until the scene meets the budget."""
    for _ in range(4):
        total = scene_triangles()
        if total <= budget * 1.05:
            return total
        ratio = max(0.01, budget / total)
        for obj in [o for o in bpy.context.scene.objects if o.type == "MESH"]:
            if triangles(obj) < 300 and total < budget * 4:
                continue
            if obj.data.shape_keys:
                # Static props never animate their shape keys; bake the basis so modifiers can apply.
                obj.shape_key_clear()
            mod = obj.modifiers.new("Decimate", "DECIMATE")
            mod.decimate_type = "COLLAPSE"
            mod.ratio = ratio
            mod.use_collapse_triangulate = True
            bpy.context.view_layer.objects.active = obj
            bpy.ops.object.select_all(action="DESELECT")
            obj.select_set(True)
            bpy.ops.object.modifier_apply(modifier=mod.name)
    return scene_triangles()


def thin_islands(keep_ratio, max_island_tris=40, seed=7):
    """Remove a share of small disconnected islands (leaf cards) — collapse decimation cannot."""
    import random

    import bmesh

    rng = random.Random(seed)
    for obj in [o for o in bpy.context.scene.objects if o.type == "MESH"]:
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        bm.faces.ensure_lookup_table()
        seen = set()
        doomed = []
        for f in bm.faces:
            if f.index in seen:
                continue
            island = []
            stack = [f]
            seen.add(f.index)
            while stack:
                cur = stack.pop()
                island.append(cur)
                for e in cur.edges:
                    for nf in e.link_faces:
                        if nf.index not in seen:
                            seen.add(nf.index)
                            stack.append(nf)
            if len(island) <= max_island_tris and rng.random() > keep_ratio:
                doomed.extend(island)
        bmesh.ops.delete(bm, geom=list(set(doomed)), context="FACES")
        bm.to_mesh(obj.data)
        bm.free()


def downscale_images(max_size):
    for img in bpy.data.images:
        if img.size[0] == 0:
            continue
        w, h = img.size
        if max(w, h) > max_size:
            scale = max_size / max(w, h)
            img.scale(max(1, int(w * scale)), max(1, int(h * scale)))


def remove_cameras_lights():
    for obj in list(bpy.context.scene.objects):
        if obj.type in {"CAMERA", "LIGHT"}:
            bpy.data.objects.remove(obj, do_unlink=True)


def bounds():
    import mathutils

    lo = mathutils.Vector((1e9, 1e9, 1e9))
    hi = mathutils.Vector((-1e9, -1e9, -1e9))
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        for corner in obj.bound_box:
            p = obj.matrix_world @ mathutils.Vector(corner)
            lo = mathutils.Vector(map(min, lo, p))
            hi = mathutils.Vector(map(max, hi, p))
    # Blender Z-up → glTF Y-up
    return {"min": [lo.x, lo.z, -hi.y], "max": [hi.x, hi.z, -lo.y]}


def join_meshes():
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    if len(meshes) < 2:
        return
    bpy.ops.object.select_all(action="DESELECT")
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()


def export(path, webp=True):
    kwargs = dict(filepath=path, export_format="GLB", export_apply=True, export_cameras=False, export_lights=False)
    options = ({"export_image_format": "WEBP", "export_image_quality": 82}, {"export_image_format": "WEBP"}, {}) if webp else ({},)
    for extra in options:
        try:
            bpy.ops.export_scene.gltf(**kwargs, **extra)
            return
        except TypeError:
            continue


def repack(model_id):
    src = os.path.join(SRC, model_id, f"{model_id}.gltf")
    if not os.path.exists(src):
        print(f"missing {src}")
        return None
    reset()
    bpy.ops.import_scene.gltf(filepath=src)
    remove_cameras_lights()
    budget, tex = BUDGETS.get(model_id, DEFAULT_BUDGET)
    if model_id in JOIN_FIRST:
        join_meshes()
    before = scene_triangles()
    after = decimate_to(budget)
    downscale_images(tex)
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f"{model_id}.glb")
    webp = model_id not in KEEP_IMAGE_FORMAT
    export(out, webp)
    info = {
        "id": model_id,
        "file": f"/assets/props/{model_id}.glb",
        "sourceTriangles": before,
        "triangles": after,
        "materials": len([m for m in bpy.data.materials if m.users > 0]),
        "textureMax": tex,
        "bounds": bounds(),
        "bytes": os.path.getsize(out),
        "license": "CC0-1.0 (Poly Haven)",
    }
    if model_id in LOD1:
        downscale_images(512)
        if model_id in JOIN_FIRST:
            thin_islands(0.3)
        lod_tris = decimate_to(LOD1[model_id])
        lod_out = os.path.join(OUT, f"{model_id}_lod1.glb")
        export(lod_out, webp)
        info["lodFiles"] = [f"/assets/props/{model_id}_lod1.glb"]
        info["lod1Triangles"] = lod_tris
    print(f"{model_id}: {before} -> {after} tris, {info['bytes'] // 1024} KiB")
    return info


def main():
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    ids = args or sorted(d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d)))
    manifest = {}
    if os.path.exists(MANIFEST):
        with open(MANIFEST, encoding="utf-8") as f:
            manifest = json.load(f)
    for model_id in ids:
        info = repack(model_id)
        if info:
            manifest[model_id] = info
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, sort_keys=True)


main()
