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
from mathutils import Euler, Matrix, Quaternion, Vector

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
    # (Its old yaw=-90 was never applied, see the yaw fix below; the book is right as built.)
    "runaway_book": dict(out="runaway_book", height=0.5, tris=20000, tex=1024, rig="rigid", defeat="vanish"),
    "training_dummy": dict(out="training_dummy", height=1.65, tris=24000, tex=1024, rig="dummy", defeat="slump"),
    "tea_tray": dict(out="tea_tray", folder="props", height=0.06, fit="width", width=0.7, tris=6000, tex=1024, rig="none", defeat="vanish", metallic=0.8, roughness=0.3),
    "lift_platform": dict(out="lift_platform", folder="props", height=3.0, fit="width", width=2.5, tris=20000, tex=1024, rig="none", defeat="vanish", metallic=0.75, roughness=0.4),
    "inkwell": dict(out="inkwell", folder="props", height=0.2, fit="width", width=1.1, tris=8000, tex=1024, rig="none", defeat="vanish"),
    # Level 2: the Hush.
    "blotling": dict(out="blotling", height=0.7, tris=24000, tex=1024, rig="biped", defeat="vanish"),
    "eraser_moth": dict(out="eraser_moth", height=1.1, tris=24000, tex=1024, rig="rigid", defeat="vanish"),
    "scribble_imp": dict(out="scribble_imp", height=0.8, tris=24000, tex=1024, rig="biped", defeat="vanish"),
    # yaw: the generated hound faced +X, so it walked at the camera sideways (owner, 2026-10-17).
    # sway: how far a rigid creature rolls and pitches as it moves (owner, 2026-10-19: the hound swayed badly).
    "smudgehound": dict(out="smudgehound", yaw=-90, height=1.1, tris=28000, tex=1024, rig="rigid", defeat="vanish", sway=0.25),
    "hollow_knight": dict(out="hollow_knight", height=2.2, tris=34000, tex=1024, rig="biped", defeat="slump", metallic=0.5, roughness=0.5),
    # moves: a boss's own Idle and Attack (owner, 2026-10-17: bosses stood "doing nothing", and every
    # boss must move differently). The Herald channels with its hands already raised.
    # The Herald reads from an open book held in both hands (owner, 2026-10-19), so its arms stay with
    # the body: it reads with its head, shoulders and body while its wisps gather (in the game).
    # (2026-10-20) The book is held in one hand; the other arm, out to the side with the palm up, preaches
    # and points (its bone runs from the shoulder to the hand; the sleeve hanging below it goes with it).
    "grey_herald": dict(out="grey_herald", height=3.0, tris=40000, tex=2048, rig="biped", defeat="vanish", moves="herald",
                        limbs=[dict(bone="arm_r", side=1, x=0.17, z=(0.42, 0.77), head=(0.15, 0.72), tail=(0.45, 0.71), ramp=0.04)]),
    "vellum_wyrm": dict(out="vellum_wyrm", height=6.0, tris=60000, tex=2048, rig="plant", defeat="vanish"),
    # Level 3: the Blank and the Cinder Citadel.
    "correction_moth": dict(out="correction_moth", height=1.1, tris=24000, tex=1024, rig="rigid", defeat="vanish"),
    "redactor": dict(out="redactor", height=2.4, tris=24000, tex=1024, rig="floater", defeat="vanish"),
    # The hammer arm, so it swings its hammer instead of headbutting (owner, 2026-10-19).
    "foreman": dict(out="foreman", height=2.7, tris=36000, tex=1024, rig="biped", defeat="slump", metallic=0.5, roughness=0.5, moves="foreman",
                    limbs=[dict(bone="arm_l", side=-1, x=0.22, z=(0.22, 0.68), head=(0.25, 0.72), tail=(0.36, 0.42))]),
    # limbs: extra bones for limbs that stand clear of the body (fractions of W and H, measured): the
    # Guardian's hanging arms, and the Unwriter's raised quill arm (forearm, hand and quill).
    # The Guardian is generated in the owner's "Mystic Ascension" pose (2026-10-20): arms straight, spread
    # 45 degrees down with the palms forward, one leg crossed behind the other. Bending the old model's
    # arms broke them at the elbow, so each straight arm is one bone from the shoulder to the hand.
    # TRELLIS.2 painted it 75% red (its fire reflected in the black armour): graded down to dark iron with
    # red seams, and its faceted surface relaxed.
    "perfect_warden": dict(out="perfect_warden", height=4.0, tris=50000, tex=2048, rig="biped", defeat="vanish", metallic=0.5, roughness=0.45, moves="guardian",
                           saturation=0.95, value=0.62, smooth_shape=3, normal_map=True,
                           limbs=[dict(bone="arm_l", side=-1, x=0.17, z=(0.42, 0.72), head=(0.15, 0.70), tail=(0.48, 0.47), ramp=0.05),
                                  dict(bone="arm_r", side=1, x=0.17, z=(0.42, 0.72), head=(0.15, 0.70), tail=(0.48, 0.47), ramp=0.05)]),
    # (2026-10-20) Regenerated with his quill arm held out from the shoulder: the whole arm, sleeve, hand
    # and quill is one bone, so he can raise it overhead and point it straight at Pip.
    "unwriter": dict(out="unwriter", normal_map=True, height=3.4, tris=60000, tex=2048, rig="biped", defeat="vanish", moves="unwriter",
                     # The hand and quill are a bone of their own (a wrist), so the arm stays raised while the
                     # quill tips down to point straight at Pip (child first: it takes its share, the arm the rest).
                     limbs=[dict(bone="quill_l", side=-1, x=0.30, z=(0.72, 1.0), head=(0.33, 0.765, -0.53), tail=(0.47, 0.94, -0.39), ramp=0.03, parent="arm_l"),
                            dict(bone="arm_l", side=-1, x=0.15, z=(0.55, 1.0), head=(0.13, 0.72), tail=(0.33, 0.765, -0.53), ramp=0.04)]),
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
    "giant_tortoise": dict(out="giant_tortoise", folder="props", rig="none", defeat="vanish", height=4.5, fit="width", width=9, tris=60000, tex=2048, smooth_colours=4),
    # arms: the hanging arms stand clear of the robe outside ±0.31 W between 0.36 and 0.72 H (measured);
    # they get their own bones so the Warden can cast with a hand (owner, 2026-10-16: it "headbutts").
    "ward_warden_ai": dict(out="ward_warden_ai", height=3.2, tris=40000, tex=2048, rig="floater", defeat="vanish", metallic=0.3, roughness=0.4, arms=(0.31, 0.36, 0.72)),
    "academy_hall": dict(out="academy_hall", folder="props", rig="none", defeat="vanish", height=22, fit="width", width=30, tris=30000, tex=2048, smooth_colours=2),
    "academy_tower": dict(out="academy_tower", folder="props", rig="none", defeat="vanish", height=30, tris=20000, tex=2048, smooth_colours=2),
    "erased_deer": dict(out="erased_deer", folder="props", rig="none", defeat="vanish", height=2.1, tris=40000, tex=1024),
    "paper_ship": dict(out="paper_ship", folder="props", rig="none", defeat="vanish", height=7, fit="width", width=9, tris=16000, tex=1024),
    # 2026-10-08: the Cinder Citadel's front (owner: "the front of the cinder citadel looks blockish").
    "vellum_dragon": dict(out="vellum_dragon", normal_map=True, height=6.5, fit="width", width=15, tris=70000, tex=2048, rig="dragon", defeat="vanish"),
    "vine_tangle": dict(out="vine_tangle", folder="props", rig="none", defeat="vanish", height=2.4, tris=30000, tex=1024),
    "wooden_oar": dict(out="wooden_oar", folder="props", rig="none", defeat="vanish", height=0.18, fit="width", width=2.8, tris=6000, tex=1024),
    "lift_cage": dict(out="lift_cage", folder="props", rig="none", defeat="vanish", height=1.25, fit="width", width=2.8, tris=20000, tex=1024),
    "burning_wreck": dict(out="burning_wreck", normal_map=True, folder="props", rig="none", defeat="vanish", height=3, fit="width", width=7, tris=20000, tex=1024),
    "citadel_gate": dict(out="citadel_gate", folder="props", rig="none", defeat="vanish", height=36, fit="width", width=64, tris=40000, tex=2048),
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
# Through the matrix: glTF imports use quaternion rotation, so rotation_euler was silently ignored.
high.matrix_world = Matrix.Rotation(math.radians(cfg.get("yaw", 0.0)), 4, "Z") @ high.matrix_world
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


def smooth_colours(obj, iterations):
    """
    Averages each vertex colour with its neighbours `iterations` times (owner: the tortoise's texture
    showed triangle facets, TRELLIS colour varies sharply between neighbouring vertices).
    """
    import numpy as np

    mesh = obj.data
    attr = mesh.color_attributes.active_color
    if attr is None:
        return
    n = len(mesh.vertices)
    if attr.domain == "POINT":
        cols = np.array([c.color[:] for c in attr.data], dtype=np.float64)
    else:
        cols = np.zeros((n, 4))
        counts = np.zeros(n)
        for loop in mesh.loops:
            cols[loop.vertex_index] += attr.data[loop.index].color[:]
            counts[loop.vertex_index] += 1
        cols /= np.maximum(counts, 1)[:, None]
    edges = np.array([e.vertices[:] for e in mesh.edges], dtype=np.int64)
    deg = np.bincount(edges.ravel(), minlength=n).astype(np.float64)
    for _ in range(iterations):
        acc = cols.copy()
        np.add.at(acc, edges[:, 0], cols[edges[:, 1]])
        np.add.at(acc, edges[:, 1], cols[edges[:, 0]])
        cols = acc / (deg + 1)[:, None]
    if attr.domain == "POINT":
        for i, c in enumerate(attr.data):
            c.color = cols[i]
    else:
        for loop in mesh.loops:
            attr.data[loop.index].color = cols[loop.vertex_index]
    print(f"PREP smoothed colours x{iterations}")


if cfg.get("smooth_colours"):
    smooth_colours(high, cfg["smooth_colours"])


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
if cfg.get("smooth_shape"):
    # Relax faceted AI geometry (Laplacian smoothing that preserves volume), then smooth shading.
    lap = low.modifiers.new("Relax", "LAPLACIANSMOOTH")
    lap.iterations = cfg["smooth_shape"]
    lap.lambda_factor = 0.6
    lap.use_volume_preserve = True
    lap.use_normalized = True
    bpy.ops.object.modifier_apply(modifier=lap.name)
    print(f"PREP relaxed shape x{cfg['smooth_shape']}")
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
if cfg.get("normal_map"):
    # The detailed TRELLIS surface as a tangent-space normal map on the decimated game mesh (§14.3 step 6),
    # so plates, seams and folds survive the cut to the triangle budget.
    normal_img = bpy.data.images.new(f"{cfg['out']}_normal", size, size, float_buffer=False)
    normal_img.colorspace_settings.name = "Non-Color"
    normal_node = nt.nodes.new("ShaderNodeTexImage")
    normal_node.image = normal_img
    for n in nt.nodes:
        n.select = False
    normal_node.select = True
    nt.nodes.active = normal_node
    bpy.ops.object.select_all(action="DESELECT")
    high.select_set(True)
    low.select_set(True)
    bpy.context.view_layer.objects.active = low
    bpy.ops.object.bake(type="NORMAL", normal_space="TANGENT")
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = 1.0
    nt.links.new(normal_node.outputs["Color"], nmap.inputs["Color"])
    nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    if size > cfg["tex"]:
        normal_img.scale(int(cfg["tex"]), int(cfg["tex"]))
    normal_img.pack()
    print("BAKED normal map")
bpy.data.objects.remove(high, do_unlink=True)
body = low
lo, hi = bbox(body)
W = hi.x - lo.x
D = hi.y - lo.y
if os.environ.get("MEASURE"):
    # Where the body is, slice by slice (fractions of W across, H up), for placing limbs.
    for i in range(40):
        z0, z1 = lo.z + H * i / 40, lo.z + H * (i + 1) / 40
        xs = [v.co.x / W for v in body.data.vertices if z0 <= v.co.z < z1]
        print(f"MEASURE {i / 40:.3f} " + "".join("#" if any(b * 0.02 - 0.5 <= x < b * 0.02 - 0.48 for x in xs) else "." for b in range(50)))


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
        cut = {"biped": (0.3, 0.6, 0.8), "dummy": (0.18, 0.62, 0.82), "floater": (0.35, 0.62, 0.82), "plant": (0.25, 0.55, 0.72), "dragon": (0.3, 0.55, 0.75)}[cfg["rig"]]
        z1, z2, z3 = (c * H for c in cut)
        BANDS = [("pelvis", 0.0, z1), ("spine", z1, z2), ("chest", z2, z3), ("head", z3, H)]
        joints = [
            J("pelvis", (0, 0, 0.0), (0, 0, z1)),
            J("spine", (0, 0, z1), (0, 0, z2), "pelvis"),
            J("chest", (0, 0, z2), (0, 0, z3), "spine"),
            J("head", (0, 0, z3), (0, 0, H), "chest"),
        ]
        if cfg.get("arms"):
            ax, _, _ = cfg["arms"]
            # An arm bone each side, from the shoulder down to the hand (−X is the left).
            joints += [
                J("arm_l", (-(ax + 0.02) * W, 0, 0.76 * H), (-(ax + 0.06) * W, 0, 0.4 * H), "chest"),
                J("arm_r", ((ax + 0.02) * W, 0, 0.76 * H), ((ax + 0.06) * W, 0, 0.4 * H), "chest"),
            ]
        # Parents first (a forearm hangs from its upper arm), though limbs are listed child-first for weights.
        for limb in sorted(cfg.get("limbs", ()), key=lambda limb: limb.get("parent", "chest") not in ("chest", "pelvis")):
            # (x, z) as fractions of W and H, and optionally y in metres (−Y is forward: a hand held out in front).
            hx, hz, hy = (*limb["head"], 0.0)[:3]
            tx, tz, ty = (*limb["tail"], 0.0)[:3]
            joints.append(J(limb["bone"], (limb["side"] * hx * W, hy, hz * H), (limb["side"] * tx * W, ty, tz * H), limb.get("parent", "chest")))
        if cfg["rig"] == "dragon":
            # A wing bone each side, from the shoulder out along the span (wings lie along ±X).
            joints += [
                J("wing_l", (-0.22 * W, 0, 0.62 * H), (-0.48 * W, 0, 0.8 * H), "chest"),
                J("wing_r", (0.22 * W, 0, 0.62 * H), (0.48 * W, 0, 0.8 * H), "chest"),
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
            # Only bones that start where their parent ends connect (limbs keep their own shoulders).
            b.use_connect = (Vector(j.head) - made[j.parent].tail).length < 1e-4
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


    if cfg["rig"] == "dragon":
        groups["wing_l"] = body.vertex_groups.new(name="wing_l")
        groups["wing_r"] = body.vertex_groups.new(name="wing_r")

    def wing_share(co):
        """How much a vertex belongs to a wing: out beyond the body's flanks and above the legs."""
        if cfg["rig"] != "dragon" or co.z < 0.45 * H:
            return 0.0
        # The body spans about ±0.21 W (vellum_dragon concept); the wings start just outside it.
        u = min(1.0, max(0.0, (abs(co.x) - 0.22 * W) / (0.1 * W)))
        return u * u * (3 - 2 * u)

    if cfg.get("arms"):
        groups["arm_l"] = body.vertex_groups.new(name="arm_l")
        groups["arm_r"] = body.vertex_groups.new(name="arm_r")

    def arm_share(co):
        """How much a vertex belongs to an arm: outside the robe's flanks, between hand and shoulder."""
        if not cfg.get("arms"):
            return 0.0
        ax, z_lo, z_hi = cfg["arms"]
        f = co.z / H
        # A hard cut at the gap between arm and robe: a soft blend stretched a sheet of robe up with the
        # arm. Only the shoulder, where the arm really joins the body, blends.
        if abs(co.x) < ax * W or f < z_lo - 0.06:
            return 0.0
        return min(1.0, max(0.0, (z_hi + 0.08 - f) / 0.08))

    for limb in cfg.get("limbs", ()):
        groups[limb["bone"]] = body.vertex_groups.new(name=limb["bone"])

    def limb_shares(co):
        """[(bone, share)] of the limbs a vertex belongs to: beyond each limb's x line on its side, inside its
        height band. Limbs are listed child-first: a forearm takes its share and its upper arm the rest."""
        out = []
        left = 1.0
        for limb in cfg.get("limbs", ()):
            if co.x * limb["side"] <= 0:
                continue
            u = min(1.0, max(0.0, (abs(co.x) / W - limb["x"]) / limb.get("ramp", 0.025)))
            f = co.z / H
            z_lo, z_hi = limb["z"]
            zw = min(1.0, max(0.0, (f - (z_lo - 0.03)) / 0.03)) * min(1.0, max(0.0, ((z_hi + 0.03) - f) / 0.03))
            w = u * u * (3 - 2 * u) * zw * left
            if w > 0:
                out.append((limb["bone"], w))
                left -= w
        return out

    for v in body.data.vertices:
        shares = limb_shares(v.co)
        if shares:
            limb_w = sum(w for _, w in shares)
            for name, w in band_weights(v.co.z).items():
                if w * (1 - limb_w) > 0:
                    groups[name].add([v.index], w * (1 - limb_w), "REPLACE")
            for limb_bone, w in shares:
                groups[limb_bone].add([v.index], w, "REPLACE")
            continue
        wing = max(wing_share(v.co), arm_share(v.co))
        for name, w in band_weights(v.co.z).items():
            if w * (1 - wing) > 0:
                groups[name].add([v.index], w * (1 - wing), "REPLACE")
        if wing > 0:
            limb = ("arm" if cfg.get("arms") else "wing") + ("_l" if v.co.x < 0 else "_r")
            groups[limb].add([v.index], wing, "REPLACE")
    if cfg.get("arms"):
        # Cut the thin skin of faces bridging arm and robe below the shoulder; bound to both, they
        # stretched into a sheet when the arm rose. They sit in the hidden gap under the arm.
        _, _, z_hi = cfg["arms"]
        bm = bmesh.new()
        bm.from_mesh(body.data)
        bridging = []
        for face in bm.faces:
            shares = [arm_share(vert.co) for vert in face.verts]
            if max(shares) > 0 and min(shares) == 0 and all(vert.co.z / H < z_hi for vert in face.verts):
                bridging.append(face)
        bmesh.ops.delete(bm, geom=bridging, context="FACES")
        bm.to_mesh(body.data)
        bm.free()
        print(f"arms: cut {len(bridging)} bridging faces")
    body.parent = rig
    mod = body.modifiers.new("Armature", "ARMATURE")
    mod.object = rig

    # ---------- Clips (30 fps, degrees, bone-local; +X leans a bone forward, local Z is forward) ----------

    P = C.pose_action
    style = cfg["rig"]

    if style == "rigid":
        # A flying book: hover bob and tilt; lunge; recoil; spin away.
        k = cfg.get("sway", 1.0)
        P(rig, "Idle", [(0, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}}), (30, {"pelvis": {"rot": (8 * k, 0, 6 * k), "loc": (0, 0.03 * H * k, 0)}}), (60, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}})])
        P(rig, "Move", [(0, {"pelvis": {"rot": (10 * k, 0, -12 * k), "loc": (0, 0, 0)}}), (10, {"pelvis": {"rot": (14 * k, 0, 12 * k), "loc": (0, 0.04 * H * k, 0)}}), (20, {"pelvis": {"rot": (10 * k, 0, -12 * k), "loc": (0, 0, 0)}})])
        P(rig, "Attack", [(0, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}}), (14, {"pelvis": {"rot": (-35, 0, 0), "loc": (0, 0.05 * H, -0.15 * H)}}), (20, {"pelvis": {"rot": (30, 0, 0), "loc": (0, -0.02 * H, 0.35 * H)}}), (30, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0)}})])
        P(rig, "Hit", [(0, {"pelvis": {"rot": (0, 0, 0)}}), (3, {"pelvis": {"rot": (-25, 15, 10)}}), (12, {"pelvis": {"rot": (0, 0, 0)}})])
        P(rig, "Dispel", [(0, {"pelvis": {"rot": (0, 0, 0), "scale": (1, 1, 1)}}), (15, {"pelvis": {"rot": (-40, 360, 0), "scale": (0.7, 0.7, 0.7)}}), (30, {"pelvis": {"rot": (-80, 720, 0), "scale": (0.05, 0.05, 0.05)}})])
    elif style == "dragon":
        # Wings: +X rotation lifts a wing (both sides). Idle breathes; Move is flight with full beats.
        def wings(a):
            return {"wing_l": (a, 0, 0), "wing_r": (a, 0, 0)}
        P(rig, "Idle", [
            (0, {**wings(6), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (40, {**wings(-4), "chest": (3, 0, 0), "head": (-4, 6, 0)}),
            (80, {**wings(6), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ])
        P(rig, "Move", [
            (0, {**wings(38), "pelvis": {"loc": (0, 0, 0)}, "head": (-6, 0, 0)}),
            (8, {**wings(-32), "pelvis": {"loc": (0, 0.05 * H, 0)}, "head": (4, 0, 0)}),
            (16, {**wings(38), "pelvis": {"loc": (0, 0, 0)}, "head": (-6, 0, 0)}),
        ])
        # Rears up with wings raised, then lunges with a roar, wings sweeping forward.
        P(rig, "Attack", [
            (0, {**wings(0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (14, {**wings(40), "spine": (-14, 0, 0), "chest": (-12, 0, 0), "head": (18, 0, 0)}),
            (20, {**wings(-20), "spine": (18, 0, 0), "chest": (14, 0, 0), "head": (-14, 0, 0)}),
            (34, {**wings(0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ])
        P(rig, "Hit", [
            (0, {**wings(0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
            (3, {**wings(25), "chest": (-10, 0, 6), "head": (-18, 10, 0)}),
            (14, {**wings(0), "chest": (0, 0, 0), "head": (0, 0, 0)}),
        ])
        P(rig, "Dispel", [
            (0, {"pelvis": {"rot": (0, 0, 0), "loc": (0, 0, 0), "scale": (1, 1, 1)}}),
            (15, {"pelvis": {"rot": (0, 360, 0), "loc": (0, 0.1 * H, 0), "scale": (0.7, 0.7, 0.7)}}),
            (30, {"pelvis": {"rot": (0, 720, 0), "loc": (0, 0.2 * H, 0), "scale": (0.05, 0.05, 0.05)}}),
        ])
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
        if cfg.get("arms"):
            # A spell cast, not a lunge: the casting arm swings up and back, then thrusts its open hand
            # forward at the foe (the model faces −Y); the body leans in only a little.
            def aim(bone_name, direction):
                bone = rig.data.bones[bone_name]
                local = bone.matrix_local.to_3x3().inverted() @ Vector(direction).normalized()
                return tuple(math.degrees(a) for a in Vector((0.0, 1.0, 0.0)).rotation_difference(local).to_euler("XYZ"))

            rest = {"arm_l": (0, 0, 0), "arm_r": (0, 0, 0), "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}
            P(rig, "Attack", [
                (0, rest),
                (12, {**rest, "arm_l": aim("arm_l", (-0.35, 0.35, 0.87)), "arm_r": aim("arm_r", (0.3, 0.1, -0.95)), "chest": (-6, 0, 0), "head": (6, 0, 0)}),
                (18, {**rest, "arm_l": aim("arm_l", (-0.1, -0.97, 0.2)), "arm_r": aim("arm_r", (0.3, 0.2, -0.93)), "chest": (6, 0, 0), "spine": (4, 0, 0)}),
                (24, {**rest, "arm_l": aim("arm_l", (-0.1, -0.97, 0.22))}),
                (34, rest),
            ])
        else:
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

def aim_bone(bone_name, direction, roll=0.0, parent=None, along=None):
    """Euler (degrees) turning a bone from its rest direction to point along `direction` (armature space),
    then twisting it `roll` degrees about its own length. `parent`: the Euler already posed on its parent
    limb, so the direction stays in armature space. `along`: aim this rest vector (armature space; say,
    from the elbow to the tip of a held quill) instead of the bone itself."""
    bone = rig.data.bones[bone_name]
    d = Vector(direction).normalized()
    if parent is not None:
        rest = bone.parent.matrix_local.to_3x3()
        turn = rest @ Euler(tuple(math.radians(a) for a in parent), "XYZ").to_matrix() @ rest.inverted()
        d = turn.inverted() @ d
    m = bone.matrix_local.to_3x3().inverted()
    ref = (m @ Vector(along)).normalized() if along is not None else Vector((0.0, 1.0, 0.0))
    q = ref.rotation_difference(m @ d) @ Quaternion((0.0, 1.0, 0.0), math.radians(roll))
    return tuple(math.degrees(a) for a in q.to_euler("XYZ"))


def nudge(bone_name, dx, dy, dz):
    """Euler (degrees) turning a bone from its rest direction by (dx, dy, dz) added to that direction (−Y is forward)."""
    bone = rig.data.bones[bone_name]
    rest = (bone.tail_local - bone.head_local).normalized()
    return aim_bone(bone_name, (rest.x + dx, rest.y + dy, rest.z + dz))


def replace_action(name, keys):
    """Drop the default clip `name` and author this one instead."""
    for track in list(rig.animation_data.nla_tracks):
        if track.name == name:
            rig.animation_data.nla_tracks.remove(track)
    old = bpy.data.actions.get(name)
    if old:
        bpy.data.actions.remove(old)
    C.pose_action(rig, name, keys)


# Attacks keep the runtime's timing: 30 frames, the wind-up peaking at frame 14 (CreatureModel scrubs it).
moves = cfg.get("moves")
if rig and moves == "herald":
    # Preaching from its book (owner, 2026-10-20): the head bowed over the page, the free hand, palm up,
    # rising and falling as it chants (the wisps rise and gather in the game), the body swaying.
    def preach(lift, sway, line=0.0):
        return {
            "arm_r": aim_bone("arm_r", (0.9 - 0.35 * lift, -0.3 - 0.1 * lift, -0.3 + 0.95 * lift)),
            "spine": (2 + lift * 2, sway, sway * 0.6),
            "chest": (4 - lift * 3, sway * 0.8, -lift * 3),
            "head": (14 + line * 10 - lift * 8, -sway * 1.2, sway * 0.5),
        }
    # Half the pace it first had (owner, 2026-10-20): each raise and lower takes about 1.3 s.
    replace_action("Idle", [
        (0, preach(0, 0)),
        (40, preach(1, 2, 0.5)),
        (80, preach(0, 3, 1)),
        (120, preach(1, -2, 0.3)),
        (160, preach(0, -3, 0.8)),
        (200, preach(0.9, 1, 0.4)),
        (240, preach(0, 0)),
    ])
    # The command: it draws its hand back and up, then straightens its arm and points its hand at the
    # player like a blade (the fingers together, the palm turned on its side) as the wisps rush in.
    replace_action("Attack", [
        (0, preach(0, 0)),
        (14, {**preach(1, 0), "arm_r": aim_bone("arm_r", (0.55, 0.45, 0.7), 40), "spine": (-6, -8, 0), "chest": (-10, -8, 0), "head": (-12, 6, 0)}),
        (19, {**preach(0, 0), "arm_r": aim_bone("arm_r", (0.12, -0.98, 0.12), 90), "spine": (8, 10, 0), "chest": (10, 8, 0), "head": (-4, -4, 0)}),
        (25, {**preach(0, 0), "arm_r": aim_bone("arm_r", (0.12, -0.98, 0.1), 90), "spine": (8, 10, 0), "chest": (10, 8, 0), "head": (-4, -4, 0)}),
        (30, preach(0, 0)),
    ])
elif rig and moves == "guardian":
    # Levitating to channel (owner, 2026-10-19/20, with a "Mystic Ascension" reference): the arms held
    # out and down, palms forward (its generated pose), the chest lifted and the head raised, slowly
    # rising and falling as the fire orbs circle in front of it (the rise and the orbs are in the game).
    def arms(direction_l):
        """Both arms along `direction_l` (the left arm; the right one mirrored)."""
        return {"arm_l": aim_bone("arm_l", direction_l), "arm_r": aim_bone("arm_r", (-direction_l[0], direction_l[1], direction_l[2]))}

    def channel(k, sway=0.0):
        return {
            **arms((-0.72 - 0.06 * k, -0.08 - 0.06 * k, -0.69 + 0.14 * k)),
            "pelvis": {"loc": (0, 0.015 * k * H, 0), "rot": (0, sway * 0.4, 0)},
            "spine": (-3 - 2 * k, sway, 0),
            "chest": (-6 - 3 * k, sway * 0.6, 0),
            "head": (-6 - 4 * k, -sway, 0),
        }
    replace_action("Idle", [(0, channel(0, 0)), (40, channel(1, 3)), (80, channel(0.4, -3)), (120, channel(0, 0))])
    # The release: hands drawn back and up to gather the ring of fire, then both palms thrust at the
    # player to fire it as a stream.
    replace_action("Attack", [
        (0, channel(0)),
        (14, {**channel(1), **arms((-0.6, 0.45, -0.66)), "spine": (-8, 0, 0), "chest": (-12, 0, 0), "head": (-10, 0, 0)}),
        (20, {**channel(1), **arms((-0.2, -0.97, 0.05)), "spine": (10, 0, 0), "chest": (12, 0, 0), "head": (0, 0, 0)}),
        (24, {**channel(1), **arms((-0.2, -0.96, 0.1)), "spine": (8, 0, 0), "chest": (10, 0, 0), "head": (0, 0, 0)}),
        (30, channel(0)),
    ])
elif rig and moves == "foreman":
    # The hammer: swung up over its shoulder, then smashed down in front of it.
    rest = {"arm_l": (0, 0, 0), "pelvis": {"loc": (0, 0, 0)}, "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}
    replace_action("Attack", [
        (0, rest),
        (14, {**rest, "arm_l": aim_bone("arm_l", (-0.2, 0.45, 0.87)), "pelvis": {"loc": (0, 0.01 * H, -0.02 * H)}, "spine": (-8, -12, 0), "chest": (-12, -10, 0), "head": (6, 6, 0)}),
        (20, {**rest, "arm_l": aim_bone("arm_l", (-0.1, -0.85, -0.5)), "pelvis": {"loc": (0, -0.03 * H, 0.04 * H)}, "spine": (18, 8, 0), "chest": (14, 6, 0), "head": (-6, 0, 0)}),
        (24, {**rest, "arm_l": aim_bone("arm_l", (-0.1, -0.8, -0.58)), "pelvis": {"loc": (0, -0.03 * H, 0.04 * H)}, "spine": (16, 8, 0), "chest": (12, 6, 0), "head": (-4, 0, 0)}),
        (30, rest),
    ])
elif rig and moves == "unwriter":
    still = {"arm_l": (0, 0, 0), "quill_l": (0, 0, 0), "pelvis": {"loc": (0, 0, 0)}, "spine": (0, 0, 0), "chest": (0, 0, 0), "head": (0, 0, 0)}
    # His arm, from the shoulder to the hand gripping the quill (unwriter.glb bind pose: hand at -0.75,
    # 2.6, 0.53 in glTF), and the quill from the hand to its tip (-1.07, 3.21, 0.39): he points with the
    # quill itself, its fire leaving the tip (owner, 2026-10-20: the fire came from his fist).
    reach = Vector((-0.75, -0.53, 2.6)) - rig.data.bones["arm_l"].head_local
    quill = Vector((-1.07, -0.39, 3.21)) - Vector((-0.75, -0.53, 2.6))

    def arm(direction):
        return aim_bone("arm_l", direction, along=reach)
    # Brooding: the quill held out, turning slowly, his head tilting as he watches.
    replace_action("Idle", [
        (0, still),
        (40, {**still, "arm_l": (6, 0, -5), "spine": (0, 4, 0), "chest": (2, 4, 0), "head": (-4, 8, 3)}),
        (80, still),
    ])
    # A sinister laugh: head thrown back, shoulders shaking.
    shake = []
    for i, frame in enumerate(range(0, 33, 4)):
        up = i % 2 == 1
        shake.append((frame, {**still, "arm_l": (4, 0, 0), "pelvis": {"loc": (0, (0.012 if up else 0) * H, 0)}, "spine": (-4, 0, 0), "chest": (-3 if up else -9, 0, 0), "head": (-22 if up else -16, 0, 0)}))
    C.pose_action(rig, "Laugh", shake)
    # Burning Pip's rings (owner, 2026-10-20: "raise his arm and point at Pip"): the arm raised high over
    # his head, then thrust straight out at Pip and held there, jabbing, before he raises it again for the
    # next stroke (the scene turns him to face Pip, beside the apprentice).
    high = arm((-0.2, -0.15, 0.97))
    # The arm raised out in front at shoulder height; the quill tipped down along it, straight at Pip.
    point_arm = arm((0.08, -0.92, 0.38))
    point = {"arm_l": point_arm, "quill_l": aim_bone("quill_l", (0.05, -0.97, -0.22), parent=point_arm, along=quill)}
    jab_arm = arm((0.08, -0.95, 0.3))
    jab = {"arm_l": jab_arm, "quill_l": aim_bone("quill_l", (0.05, -0.98, -0.18), parent=jab_arm, along=quill)}
    lean = {"spine": (8, 0, 0), "chest": (10, 0, 0), "head": (8, 0, 0)}
    C.pose_action(rig, "Point", [
        (0, {**still, "arm_l": high, "spine": (-4, 0, 0), "chest": (-8, 0, 0), "head": (-6, 0, 0)}),
        (9, {**still, **point, **lean}),
        (30, {**still, **jab, **lean}),
        (48, {**still, **point, **lean}),
        (60, {**still, "arm_l": high, "spine": (-4, 0, 0), "chest": (-8, 0, 0), "head": (-6, 0, 0)}),
    ])
    # The quill stroke: the arm sweeps up and back, then slashes down across the body.
    replace_action("Attack", [
        (0, still),
        (14, {**still, "arm_l": arm((-0.35, 0.35, 0.87)), "spine": (-4, -14, 0), "chest": (-10, -8, 0), "head": (-6, 6, 0)}),
        (20, {**still, "arm_l": arm((0.3, -0.8, -0.5)), "spine": (8, 18, 0), "chest": (16, 10, 0), "head": (6, -6, 0)}),
        (24, {**still, "arm_l": arm((0.32, -0.75, -0.55)), "spine": (8, 18, 0), "chest": (14, 10, 0), "head": (6, -6, 0)}),
        (30, still),
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
    # Idle check (bosses fidget and channel): three moments of the loop.
    if rig and cfg.get("moves"):
        rig.animation_data.action = bpy.data.actions.get("Idle")
        for frame in (15, 45, 75):
            bpy.context.scene.frame_set(frame)
            C.render_previews(os.path.join(ROOT, "assets-src", "previews", f"{cfg['out']}_idle{frame}"), H, views=((0, "front"), (35, "three-quarter")))
    # Point check (the Unwriter at Pip): raised, then thrust out.
    if rig and bpy.data.actions.get("Point"):
        rig.animation_data.action = bpy.data.actions.get("Point")
        for frame in (0, 20):
            bpy.context.scene.frame_set(frame)
            C.render_previews(os.path.join(ROOT, "assets-src", "previews", f"{cfg['out']}_point{frame}"), H, views=((0, "front"), (35, "three-quarter")))
    # Wing check for the dragon rig: the top and bottom of a wingbeat.
    if rig and cfg["rig"] == "dragon":
        rig.animation_data.action = bpy.data.actions.get("Move")
        for frame, label in ((0, "wings_up"), (8, "wings_down")):
            bpy.context.scene.frame_set(frame)
            C.render_previews(os.path.join(ROOT, "assets-src", "previews", f"{cfg['out']}_{label}"), H, views=((0, "front"),))
