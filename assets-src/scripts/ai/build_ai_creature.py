"""
Builds a game-ready creature GLB from the AI asset pipeline (owner, 2026-10-04: realistic designs;
mobs may look scary):

    Flux 2 concept (comfy.py concept) -> TRELLIS.2 shape (comfy.py mesh) -> clean watertight mesh
    (prep_raw.py) -> TRELLIS.2 per-vertex colour (comfy.py texture) -> this script.

This script normalises the vertex-coloured mesh (scale, facing, feet on the ground), decimates a game
copy to the §15 triangle budget, unwraps it with xatlas, bakes the colours into a texture, rigs it with
a robust height-band skeleton, authors the gameplay clips the runtime expects (Idle, Move, Attack, Hit,
Dispel) and exports to public/assets/creatures.

    blender --background --python assets-src/scripts/ai/build_ai_creature.py -- <name> [--preview] [yaw=deg]
"""
import math
import os
import sys

import bmesh
import bpy
from mathutils import Vector

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".deps"))
import creature as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
NAME = args[0]

# height (m), triangle budget, texture size, rig style, defeat style, output file; optional yaw (deg).
CONFIG = {
    "sprite_a": dict(out="mischief_sprite", height=0.75, tris=30000, tex=1024, rig="biped", defeat="vanish"),
    "mossling": dict(out="mossling", height=1.05, tris=32000, tex=1024, rig="biped", defeat="slump", saturation=0.9, value=0.85),
    "ink_wisp": dict(out="ink_wisp", height=1.15, tris=26000, tex=1024, rig="floater", defeat="vanish"),
    "armour_guardian": dict(out="armour_guardian", height=2.05, tris=40000, tex=2048, rig="biped", defeat="bow", metallic=0.45, roughness=0.5),
    "paint_imp": dict(out="paint_imp", height=0.8, tris=26000, tex=1024, rig="biped", defeat="vanish"),
    "thorn_pod": dict(out="thorn_pod", height=1.4, tris=30000, tex=1024, rig="plant", defeat="wilt"),
    "runaway_book": dict(out="runaway_book", yaw=-90, height=0.5, tris=20000, tex=1024, rig="rigid", defeat="vanish"),
    "training_dummy": dict(out="training_dummy", height=1.65, tris=24000, tex=1024, rig="dummy", defeat="slump"),
    "tea_tray": dict(out="tea_tray", folder="props", height=0.06, fit="width", width=0.7, tris=6000, tex=1024, rig="none", defeat="vanish", metallic=0.8, roughness=0.3),
    "lift_platform": dict(out="lift_platform", folder="props", height=3.0, fit="width", width=2.5, tris=20000, tex=1024, rig="none", defeat="vanish", metallic=0.75, roughness=0.4),
    "inkwell": dict(out="inkwell", folder="props", height=0.2, fit="width", width=1.1, tris=8000, tex=1024, rig="none", defeat="vanish"),
    # Level 2: the Hush.
    "blotling": dict(out="blotling", height=0.7, tris=24000, tex=1024, rig="biped", defeat="vanish"),
    "eraser_moth": dict(out="eraser_moth", height=1.1, tris=24000, tex=1024, rig="rigid", defeat="vanish"),
    "scribble_imp": dict(out="scribble_imp", height=0.8, tris=24000, tex=1024, rig="biped", defeat="vanish"),
    "smudgehound": dict(out="smudgehound", height=1.1, tris=28000, tex=1024, rig="rigid", defeat="vanish"),
    "hollow_knight": dict(out="hollow_knight", height=2.2, tris=34000, tex=1024, rig="biped", defeat="slump", metallic=0.5, roughness=0.5),
    "grey_herald": dict(out="grey_herald", height=3.0, tris=40000, tex=2048, rig="biped", defeat="vanish"),
    "vellum_wyrm": dict(out="vellum_wyrm", height=6.0, tris=60000, tex=2048, rig="plant", defeat="vanish"),
    # Level 3: the Blank and the Cinder Citadel.
    "correction_moth": dict(out="correction_moth", height=1.1, tris=24000, tex=1024, rig="rigid", defeat="vanish"),
    "redactor": dict(out="redactor", height=2.4, tris=24000, tex=1024, rig="floater", defeat="vanish"),
    "foreman": dict(out="foreman", height=2.7, tris=36000, tex=1024, rig="biped", defeat="slump", metallic=0.5, roughness=0.5),
    "perfect_warden": dict(out="perfect_warden", height=4.0, tris=50000, tex=2048, rig="biped", defeat="vanish", metallic=0.5, roughness=0.45),
    "unwriter": dict(out="unwriter", height=3.4, tris=60000, tex=2048, rig="biped", defeat="vanish"),
    # Level 2/3 environment set pieces (static props).
    "festival_stall": dict(out="festival_stall", folder="props", rig="none", defeat="vanish", height=3, fit="width", width=3.2, tris=16000, tex=1024),
    "boathouse": dict(out="boathouse", folder="props", rig="none", defeat="vanish", height=7, fit="width", width=10, tris=24000, tex=2048),
    "bronze_bell": dict(out="bronze_bell", folder="props", rig="none", defeat="vanish", height=3.4, tris=14000, tex=1024, metallic=0.85, roughness=0.35),
    "alchemy_furnace": dict(out="alchemy_furnace", folder="props", rig="none", defeat="vanish", height=9, tris=20000, tex=2048),
    "copper_still": dict(out="copper_still", folder="props", rig="none", defeat="vanish", height=2.4, tris=10000, tex=1024, metallic=0.8, roughness=0.35),
    "lighthouse": dict(out="lighthouse", folder="props", rig="none", defeat="vanish", height=30, tris=20000, tex=2048),
    "rowing_boat": dict(out="rowing_boat", folder="props", rig="none", defeat="vanish", height=1.6, fit="width", width=4.4, tris=12000, tex=1024),
    "dead_tree": dict(out="dead_tree", folder="props", rig="none", defeat="vanish", height=10, tris=16000, tex=1024),
    "ash_rock": dict(out="ash_rock", folder="props", rig="none", defeat="vanish", height=3.2, tris=8000, tex=1024),
    "black_galleon": dict(out="black_galleon", folder="props", rig="none", defeat="vanish", height=14, fit="width", width=18, tris=30000, tex=2048),
    "iron_throne": dict(out="iron_throne", folder="props", rig="none", defeat="vanish", height=5.5, tris=24000, tex=2048),
    "ink_cauldron": dict(out="ink_cauldron", folder="props", rig="none", defeat="vanish", height=3, tris=12000, tex=1024),
    "forge_hammer": dict(out="forge_hammer", folder="props", rig="none", defeat="vanish", height=14, tris=20000, tex=1024),
    "citadel_tower": dict(out="citadel_tower", folder="props", rig="none", defeat="vanish", height=60, tris=16000, tex=1024),
    "journal_lectern": dict(out="journal_lectern", folder="props", rig="none", defeat="vanish", height=1.6, tris=10000, tex=1024),
    # 2026-10-07 playtest fixes (static props).
    "giant_tortoise": dict(out="giant_tortoise", folder="props", rig="none", defeat="vanish", height=4.5, fit="width", width=9, tris=60000, tex=2048),
    "ward_warden_ai": dict(out="ward_warden_ai", height=3.2, tris=40000, tex=2048, rig="floater", defeat="vanish", metallic=0.3, roughness=0.4),
    "erased_deer": dict(out="erased_deer", folder="props", rig="none", defeat="vanish", height=2.1, tris=40000, tex=1024),
    "paper_ship": dict(out="paper_ship", folder="props", rig="none", defeat="vanish", height=7, fit="width", width=9, tris=16000, tex=1024),
    "dorm_bed": dict(out="dorm_bed", folder="props", rig="none", defeat="vanish", height=2.4, fit="width", width=2.3, tris=14000, tex=1024),
    "wardrobe": dict(out="wardrobe", folder="props", rig="none", defeat="vanish", height=2.2, tris=10000, tex=1024),
    "beacon_brazier": dict(out="beacon_brazier", folder="props", rig="none", defeat="vanish", height=2.6, tris=12000, tex=1024, metallic=0.5, roughness=0.5),
    "snapvine": dict(out="snapvine_head", height=1.6, tris=30000, tex=1024, rig="rigid", defeat="vanish"),
}
cfg = CONFIG[NAME]
for a in args[1:]:
    if "=" in a:
        k, v = a.split("=", 1)
        cfg[k] = float(v)
H = cfg["height"]


def bbox(obj):
    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    return Vector((min(xs), min(ys), min(zs))), Vector((max(xs), max(ys), max(zs)))


# ---------- Import and normalise ----------

C.reset_scene()
bpy.ops.import_scene.gltf(filepath=os.path.join(ROOT, "assets-src", "ai-meshes", f"{NAME}_vc.glb"))
high = [o for o in bpy.context.scene.objects if o.type == "MESH"][0]
world = high.matrix_world.copy()
high.parent = None
high.matrix_world = world
for o in list(bpy.context.scene.objects):
    if o is not high:
        bpy.data.objects.remove(o, do_unlink=True)
high.rotation_euler[2] += math.radians(cfg.get("yaw", 0.0))
bpy.ops.object.select_all(action="DESELECT")
high.select_set(True)
bpy.context.view_layer.objects.active = high
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
lo, hi = bbox(high)
scale = cfg["width"] / max(hi.x - lo.x, hi.y - lo.y) if cfg.get("fit") == "width" else H / (hi.z - lo.z)
for v in high.data.vertices:
    v.co = Vector(((v.co.x - (lo.x + hi.x) / 2) * scale, (v.co.y - (lo.y + hi.y) / 2) * scale, (v.co.z - lo.z) * scale))
high.data.update()
if cfg.get("fit") == "width":
    H = max(0.01, bbox(high)[1].z)
high.name = "HighPoly"


def unwrap_xatlas(obj):
    """
    Large, low-distortion UV charts from xatlas (Smart UV Project shatters a remeshed surface into
    thousands of slivers). Installed for Blender's Python in assets-src/scripts/ai/.deps:
        "<blender>/python/bin/python.exe" -m pip install xatlas --target assets-src/scripts/ai/.deps
    """
    import numpy as np
    import xatlas

    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.triangulate(bm, faces=bm.faces[:])
    bm.to_mesh(mesh)
    bm.free()
    verts = np.array([v.co[:] for v in mesh.vertices], dtype=np.float32)
    faces = np.array([p.vertices[:] for p in mesh.polygons], dtype=np.uint32)
    atlas = xatlas.Atlas()
    atlas.add_mesh(verts, faces)
    chart = xatlas.ChartOptions()
    chart.max_iterations = 4
    pack = xatlas.PackOptions()
    pack.padding = 4
    pack.resolution = 2048
    pack.bilinear = True
    atlas.generate(chart, pack)
    _, indices, uvs = atlas[0]
    layer = mesh.uv_layers.new(name="UVMap")
    for poly, tri in zip(mesh.polygons, indices):
        for loop_index, corner in zip(poly.loop_indices, tri):
            layer.data[loop_index].uv = (float(uvs[corner][0]), float(uvs[corner][1]))
    print(f"UV xatlas: {atlas.chart_count} charts")


# ---------- Game mesh: decimate, unwrap, bake the vertex colours into a texture ----------

bpy.ops.object.select_all(action="DESELECT")
high.select_set(True)
bpy.context.view_layer.objects.active = high
bpy.ops.object.duplicate()
low = bpy.context.view_layer.objects.active
low.name = f"{cfg['out']}_body"
low.data.materials.clear()
for attr in list(low.data.color_attributes):
    low.data.color_attributes.remove(attr)
for _ in range(4):
    low.data.calc_loop_triangles()
    current = len(low.data.loop_triangles)
    if current <= cfg["tris"] * 1.05:
        break
    dec = low.modifiers.new("Decimate", "DECIMATE")
    dec.ratio = max(0.02, cfg["tris"] / current)
    dec.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.shade_smooth()
unwrap_xatlas(low)

# The high mesh shows its per-vertex colour as emission, so an EMIT bake copies colour exactly.
high_mat = bpy.data.materials.new("HighColour")
high_mat.use_nodes = True
hnt = high_mat.node_tree
for n in list(hnt.nodes):
    hnt.nodes.remove(n)
attr_node = hnt.nodes.new("ShaderNodeVertexColor")
attr_node.layer_name = high.data.color_attributes.active_color.name if high.data.color_attributes.active_color else ""
emit = hnt.nodes.new("ShaderNodeEmission")
out_node = hnt.nodes.new("ShaderNodeOutputMaterial")
# A gentle grade to enrich the colours slightly.
grade = hnt.nodes.new("ShaderNodeHueSaturation")
grade.inputs["Saturation"].default_value = cfg.get("saturation", 1.08)
grade.inputs["Value"].default_value = cfg.get("value", 1.0)
# TRELLIS.2 writes sRGB values into the (linear) glTF vertex colour channel: undo the gamma first,
# otherwise every texture bakes out pale and washed out.
to_linear = hnt.nodes.new("ShaderNodeGamma")
to_linear.inputs["Gamma"].default_value = 2.2
hnt.links.new(attr_node.outputs["Color"], to_linear.inputs["Color"])
hnt.links.new(to_linear.outputs["Color"], grade.inputs["Color"])
hnt.links.new(grade.outputs["Color"], emit.inputs["Color"])
hnt.links.new(emit.outputs["Emission"], out_node.inputs["Surface"])
high.data.materials.clear()
high.data.materials.append(high_mat)

size = max(2048, int(cfg["tex"]))
color_img = bpy.data.images.new(f"{cfg['out']}_color", size, size)
mat = bpy.data.materials.new(f"{cfg['out']}_skin")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = cfg.get("roughness", 0.72 if cfg["rig"] != "rigid" else 0.55)
bsdf.inputs["Metallic"].default_value = cfg.get("metallic", 0.0)
color_node = nt.nodes.new("ShaderNodeTexImage")
color_node.image = color_img
low.data.materials.append(mat)

scene = bpy.context.scene
scene.render.engine = "CYCLES"
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for kind in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = kind
            break
        except TypeError:
            continue
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    scene.cycles.device = "GPU"
except Exception:  # noqa: BLE001 - CPU baking still works
    pass
scene.cycles.samples = 4
bake = scene.render.bake
bake.use_selected_to_active = True
bake.use_cage = False
bake.cage_extrusion = H * 0.01
bake.max_ray_distance = H * 0.03
bake.margin = 8
for n in nt.nodes:
    n.select = False
color_node.select = True
nt.nodes.active = color_node
bpy.ops.object.select_all(action="DESELECT")
high.select_set(True)
low.select_set(True)
bpy.context.view_layer.objects.active = low
bpy.ops.object.bake(type="EMIT")
nt.links.new(color_node.outputs["Color"], bsdf.inputs["Base Color"])
if size > cfg["tex"]:
    color_img.scale(int(cfg["tex"]), int(cfg["tex"]))
color_img.pack()
bpy.data.objects.remove(high, do_unlink=True)
body = low
lo, hi = bbox(body)
W = hi.x - lo.x
D = hi.y - lo.y


# Static props (rig="none") skip the skeleton and clips.
rig = None
if cfg["rig"] != "none":
    # ---------- Skeleton: height bands along the body's centre line ----------
    # Arbitrary AI meshes have no reliable limb topology, so the rig is robust rather than anatomical:
    # a planted root (legs, roots, base), torso, chest and head, blended smoothly by height. That gives
    # believable rearing, lunging, breathing, nodding, waddling, recoil and defeat poses at play distance.

    J = C.Joint
    if cfg["rig"] == "rigid":
        BANDS = [("pelvis", 0.0, H)]
        joints = [J("pelvis", (0, 0, 0.5 * H), (0, 0, H))]
    else:
        cut = {"biped": (0.3, 0.6, 0.8), "dummy": (0.18, 0.62, 0.82), "floater": (0.35, 0.62, 0.82), "plant": (0.25, 0.55, 0.72)}[cfg["rig"]]
        z1, z2, z3 = (c * H for c in cut)
        BANDS = [("pelvis", 0.0, z1), ("spine", z1, z2), ("chest", z2, z3), ("head", z3, H)]
        joints = [
            J("pelvis", (0, 0, 0.0), (0, 0, z1)),
            J("spine", (0, 0, z1), (0, 0, z2), "pelvis"),
            J("chest", (0, 0, z2), (0, 0, z3), "spine"),
            J("head", (0, 0, z3), (0, 0, H), "chest"),
        ]

    arm_data = bpy.data.armatures.new(cfg["out"] + "Rig")
    rig = bpy.data.objects.new(cfg["out"] + "Rig", arm_data)
    bpy.context.collection.objects.link(rig)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode="EDIT")
    made = {}
    for j in joints:
        b = arm_data.edit_bones.new(j.name)
        b.head, b.tail = j.head, j.tail
        if j.parent:
            b.parent = made[j.parent]
            b.use_connect = True
        made[j.name] = b
    bpy.ops.object.mode_set(mode="OBJECT")

    blend = 0.07 * H
    groups = {name: body.vertex_groups.new(name=name) for name, _, _ in BANDS}


    def band_weights(z):
        """Smoothly blended membership of each band (overlapping by `blend` at every boundary)."""
        out = {}
        for name, lo_z, hi_z in BANDS:
            rise = 1.0 if lo_z <= 0 else min(1.0, max(0.0, (z - (lo_z - blend)) / (2 * blend)))
            fall = 1.0 if hi_z >= H else min(1.0, max(0.0, ((hi_z + blend) - z) / (2 * blend)))
            w = rise * fall
            if w > 0:
                out[name] = w
        total = sum(out.values()) or 1.0
        return {k: v / total for k, v in out.items()}


    for v in body.data.vertices:
        for name, w in band_weights(v.co.z).items():
            groups[name].add([v.index], w, "REPLACE")
    body.parent = rig
    mod = body.modifiers.new("Armature", "ARMATURE")
    mod.object = rig

    # ---------- Clips (30 fps, degrees, bone-local; +X leans a bone forward, local Z is forward) ----------

    P = C.pose_action
    style = cfg["rig"]

    if style == "rigid":
        # A flying book: hover bob and tilt; lunge; recoil; spin away.
        P(rig, "Idle", [(0, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}}), (30, {"pelvis": {"rot": (8, 0, 6), "loc": (0, 0.03 * H, 0)}}), (60, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}})])
        P(rig, "Move", [(0, {"pelvis": {"rot": (10, 0, -12), "loc": (0, 0, 0)}}), (10, {"pelvis": {"rot": (14, 0, 12), "loc": (0, 0.04 * H, 0)}}), (20, {"pelvis": {"rot": (10, 0, -12), "loc": (0, 0, 0)}})])
        P(rig, "Attack", [(0, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}}), (14, {"pelvis": {"rot": (-35, 0, 0), "loc": (0, 0.05 * H, -0.15 * H)}}), (20, {"pelvis": {"rot": (30, 0, 0), "loc": (0, -0.02 * H, 0.35 * H)}}), (30, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}})])
        P(rig, "Hit", [(0, {"pelvis": {"rot": (0, 0, 0)}}), (3, {"pelvis": {"rot": (-25, 15, 10)}}), (12, {"pelvis": {"rot": (0, 0, 0)}})])
        P(rig, "Dispel", [(0, {"pelvis": {"rot": (0, 0, 0), "scale": (1, 1, 1)}}), (15, {"pelvis": {"rot": (-40, 360, 0), "scale": (0.7, 0.7, 0.7)}}), (30, {"pelvis": {"rot": (-80, 720, 0), "scale": (0.05, 0.05, 0.05)}})])
    else:
        sway = {"biped": 4, "dummy": 2, "floater": 6, "plant": 5}[style]
        P(rig, "Idle", [
            (0, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (30, {"spine": (sway * 0.4, 0, sway * 0.3), "chest": (sway * 0.5, 0, 0), "head": (-sway * 0.6, sway * 2, 0)}),
            (60, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ])
        if style == "plant":
            move = [(0, {"spine": (0, 0, 5), "chest": (0, 0, 7)}), (20, {"spine": (0, 0, -5), "chest": (0, 0, -7)}), (40, {"spine": (0, 0, 5), "chest": (0, 0, 7)})]
        else:
            # A heavy, rolling gait: bob on each step, the body rolling side to side and leaning in.
            bob = 0.025 * H if style != "floater" else 0.015 * H
            move = []
            for i, frame in enumerate((0, 6, 12, 18, 24)):
                up = i % 2 == 1
                roll = (6 if i in (0, 4) else -6) if not up else 0
                move.append((frame, {"pelvis": {"loc": (0, bob if up else 0, 0), "rot": (0, roll, 0)}, "spine": (10, 0, -roll * 0.5), "chest": (4, 0, 0), "head": (-8, 0, roll * 0.4)}))
        P(rig, "Move", move)
        # Anticipation (rear back and crouch), strike (lunge forward), recovery.
        P(rig, "Attack", [
            (0, {"pelvis": {"loc": (0, 0, 0)}, "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (14, {"pelvis": {"loc": (0, -0.03 * H, -0.03 * H)}, "spine": (-16, 0, 0), "chest": (-14, 0, 0), "head": (16, 0, 0)}),
            (20, {"pelvis": {"loc": (0, 0.02 * H, 0.08 * H)}, "spine": (24, 0, 0), "chest": (18, 0, 0), "head": (-10, 0, 0)}),
            (30, {"pelvis": {"loc": (0, 0, 0)}, "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ])
        P(rig, "Hit", [
            (0, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (3, {"spine": (-14, 0, 6), "chest": (-10, 0, 0), "head": (-18, 10, 0)}),
            (12, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ])
        defeat = cfg["defeat"]
        if defeat == "vanish":
            P(rig, "Dispel", [
                (0, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0), "scale": (1, 1, 1)}}),
                (15, {"pelvis": {"rot": (0, 360, 0), "loc": (0, 0.1 * H, 0), "scale": (0.7, 0.7, 0.7)}}),
                (30, {"pelvis": {"rot": (0, 720, 0), "loc": (0, 0.2 * H, 0), "scale": (0.05, 0.05, 0.05)}}),
            ])
        elif defeat == "bow":
            P(rig, "Dispel", [(0, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}), (30, {"spine": (26, 0, 0), "chest": (12, 0, 0), "head": (16, 0, 0)})])
        elif defeat == "wilt":
            P(rig, "Dispel", [(0, {"spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}), (30, {"spine": (18, 0, 0), "chest": (30, 0, 0), "head": (45, 0, 0)})])
        else:
            # Slumps down and goes still (stays in the scene: a moss mound, a resting dummy).
            P(rig, "Dispel", [
                (0, {"pelvis": {"loc": (0, 0, 0), "scale": (1, 1, 1)}, "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
                (30, {"pelvis": {"loc": (0, 0, 0), "scale": (1.08, 0.82, 1.08)}, "spine": (30, 0, 0), "chest": (22, 0, 0), "head": (28, 0, 0)}),
            ])

out = os.path.join(ROOT, "public", "assets", cfg.get("folder", "creatures"), f"{cfg['out']}.glb")
C.export_glb(out)
print(f"BUILT {cfg['out']}: {C.triangle_count()} tris, {W:.2f} x {D:.2f} x {H:.2f} m -> {out}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", cfg["out"]), H)
    # Deformation check: the Attack wind-up and strike poses (§14.5 motion check).
    for track in (rig.animation_data.nla_tracks if rig else []):
        track.mute = True
    if rig:
        rig.animation_data.action = bpy.data.actions.get("Attack")
    for frame, label in (((14, "windup"), (20, "strike")) if rig else ()):
        bpy.context.scene.frame_set(frame)
        C.render_previews(os.path.join(ROOT, "assets-src", "previews", f"{cfg['out']}_{label}"), H, views=((35, "three-quarter"),))
