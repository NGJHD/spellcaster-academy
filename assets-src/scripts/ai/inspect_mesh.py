"""
Inspect a TRELLIS.2 mesh: import, report size and triangle count, stand it on the ground and render
the standard turntable previews (front, side, three-quarter).

    blender --background --python assets-src/scripts/ai/inspect_mesh.py -- <in.glb> <preview_prefix>
"""
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import creature as C  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1 :]
src, prefix = args[0], args[1]

C.reset_scene()
bpy.ops.import_scene.gltf(filepath=src)
meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
lo = Vector((1e9, 1e9, 1e9))
hi = Vector((-1e9, -1e9, -1e9))
tris = 0
for o in meshes:
    for v in o.bound_box:
        w = o.matrix_world @ Vector(v)
        lo = Vector(map(min, lo, w))
        hi = Vector(map(max, hi, w))
    tris += sum(len(p.vertices) - 2 for p in o.data.polygons)
size = hi - lo
print(f"INSPECT objects={len(meshes)} tris={tris} size=({size.x:.3f}, {size.y:.3f}, {size.z:.3f}) min=({lo.x:.3f},{lo.y:.3f},{lo.z:.3f})")
for o in meshes:
    print("INSPECT material", o.name, [m.name for m in o.data.materials])
# Centre on the origin with the feet on the ground.
offset = Vector((-(lo.x + hi.x) / 2, -(lo.y + hi.y) / 2, -lo.z))
roots = [o for o in bpy.context.scene.objects if o.parent is None]
for o in roots:
    o.location += offset
C.render_previews(prefix, size.z)
