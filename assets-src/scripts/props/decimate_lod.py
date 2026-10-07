"""
Writes a low-detail copy of a prop GLB for dense, instanced background use (a forest of hundreds).

    blender --background --python assets-src/scripts/props/decimate_lod.py -- <prop id> <triangles>

Reads public/assets/props/<id>.glb, decimates to about <triangles>, keeps the texture, writes
public/assets/props/<id>_lod1.glb.
"""
import os
import sys

import bpy

args = sys.argv[sys.argv.index("--") + 1:]
NAME, TRIS = args[0], int(args[1])
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
src = os.path.join(ROOT, "public", "assets", "props", f"{NAME}.glb")
out = os.path.join(ROOT, "public", "assets", "props", f"{NAME}_lod1.glb")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=src)
for obj in [o for o in bpy.context.scene.objects if o.type == "MESH"]:
    obj.data.calc_loop_triangles()
    tris = len(obj.data.loop_triangles)
    dec = obj.modifiers.new("Decimate", "DECIMATE")
    dec.ratio = min(1.0, TRIS / max(1, tris))
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=dec.name)
    obj.data.calc_loop_triangles()
    print(f"LOD {NAME}: {tris} -> {len(obj.data.loop_triangles)} tris")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_image_format="WEBP")
print("wrote", out)
