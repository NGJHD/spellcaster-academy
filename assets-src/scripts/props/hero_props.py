"""
Original hero props and small characters built as named, pivoted parts (the game animates the parts):

  fp_arm          §14A.1  first-person forearm, gloved grip, walnut wand with silver twist, moonstone Tip
  pip             §14A.2  brass astrolabe guide orb: Core, Ring_0..2, Fin_L/R
  training_dummy  §14A.4  stone base, hardwood post, canvas torso with straps & ward target, Arm_L/R, Head
  runaway_book    §14A.6  leather covers hinged at the spine (Cover_L/R), layered pages, brass corners
  thorn_pod       §14A.9  rooted plant: stem, leaves, Head with Petal_0..6 and amber Core
  ward_anchor     §14A.14 triangular carved base, Ring_0..2, Node_0..2, Shard
  grimoire        §14A.8  massive reference book: Pages, Cover_L/R, Spine, clasps, corner ornaments

    blender --background --python assets-src/scripts/props/hero_props.py -- [ids…] [--preview]
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import bmesh  # noqa: E402
import bpy  # noqa: E402
import creature as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "assets", "props_original")
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
E, K = C.ellipsoid, C.capsule


def mats():
    return dict(
        stone=C.make_material("Stone", color="#c9b08a", roughness=0.85),
        stone_dark=C.make_material("StoneDark", color="#9a8466", roughness=0.9),
        walnut=C.make_material("Walnut", color="#5a3a24", roughness=0.5),
        oak=C.make_material("Oak", color="#7a5233", roughness=0.6),
        brass=C.make_material("Brass", color="#c49a4f", roughness=0.28, metallic=1.0),
        silver=C.make_material("Silver", color="#c8ccd2", roughness=0.25, metallic=1.0),
        leather=C.make_material("Leather", color="#7a2a30", roughness=0.55),
        leather_brown=C.make_material("LeatherBrown", color="#6e4a2c", roughness=0.6),
        canvas=C.make_material("Canvas", color="#cbb894", roughness=0.95),
        cloth=C.make_material("Cloth", color="#22355f", roughness=0.9),
        skin=C.make_material("Skin", color="#c79a7a", roughness=0.6),
        parchment=C.make_material("Parchment", color="#eadbb5", roughness=0.85),
        crystal=C.make_material("Crystal", color="#d8ecff", roughness=0.1, emission="#7fbfff", emission_strength=3),
        gold_glow=C.make_material("Energy", color="#ffe3a0", emission="#ffb640", emission_strength=4),
        teal_glow=C.make_material("TealGlow", color="#9ff3e2", emission="#2fd6c0", emission_strength=3),
        opal=C.make_material("Opal", color="#fff4dc", roughness=0.15, emission="#ffcf7a", emission_strength=2.5),
        stem=C.make_material("Stem", color="#3f6b2e", roughness=0.7),
        leaf=C.make_material("Leaf", color="#4d8a3c", roughness=0.6),
        petal=C.make_material("Petal", color="#7a1f3a", roughness=0.55),
        amber=C.make_material("Amber", color="#ffbf5a", emission="#ff9a1f", emission_strength=3),
        soil=C.make_material("Soil", color="#4a3726", roughness=1.0),
    )


def box(name, size, location, material, bevel=0.01, rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    obj.rotation_euler = tuple(math.radians(a) for a in rotation)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel > 0:
        mod = obj.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(material)
    return obj


def empty(name, location, parent=None):
    obj = bpy.data.objects.new(name, None)
    obj.location = location
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.update()
    if parent:
        C.parent_keep(obj, parent)
    return obj


def group(name, pivot, children):
    """An empty at the pivot that owns the given parts (the game rotates the empty)."""
    g = empty(name, pivot)
    for c in children:
        C.parent_keep(c, g)
    return g


def helix(name, start, end, radius, turns, thickness, material):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    spline = curve.splines.new("POLY")
    n = int(turns * 24)
    spline.points.add(n)
    for i in range(n + 1):
        u = i / n
        a = u * turns * math.tau
        r = radius * (1 - u * 0.4)
        x = start[0] + (end[0] - start[0]) * u + math.cos(a) * r
        y = start[1] + (end[1] - start[1]) * u
        z = start[2] + (end[2] - start[2]) * u + math.sin(a) * r
        spline.points[i].co = (x, y, z, 1)
    curve.bevel_depth = thickness
    curve.bevel_resolution = 2
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.active_object
    obj.data.materials.append(material)
    bpy.ops.object.shade_smooth()
    return obj


# ---------------------------------------------------------------------------- fp_arm


def fp_arm(m):
    """Blender +Y = forward (three −Z), +Z = up. Origin at the grip."""
    wand = C.part(
        "Wand",
        [K((0, -0.05, 0.004), (0, 0.06, 0.006), 0.0105), K((0, 0.06, 0.006), (0, 0.2, 0.009), 0.0085), K((0, 0.2, 0.009), (0, 0.32, 0.012), 0.006)],
        pivot=(0, 0, 0),
        material=m["walnut"],
        voxel=0.0018,
        smooth=2,
        target_tris=3000,
    )
    inlay = helix("Inlay", (0, 0.0, 0.006), (0, 0.31, 0.012), 0.0095, 5, 0.0016, m["silver"])
    pommel = C.part("Pommel", [E((0, -0.056, 0.004), (0.014, 0.012, 0.014))], pivot=(0, -0.056, 0.004), material=m["silver"], voxel=0.0015, target_tris=600)
    tip = C.part("Tip", [E((0, 0.335, 0.012), (0.009, 0.02, 0.009))], pivot=(0, 0.335, 0.012), material=m["crystal"], voxel=0.0012, target_tris=500)
    hand = C.part(
        "Hand",
        [
            E((0.012, -0.012, -0.012), (0.034, 0.048, 0.026), rotation=(10, 0, 15)),
            *[K((0.032, y, 0.004), (0.004, y + 0.004, -0.024), 0.0088) for y in (-0.035, -0.017, 0.001, 0.018)],
            *[K((0.004, y + 0.004, -0.024), (-0.014, y + 0.006, -0.008), 0.0078) for y in (-0.035, -0.017, 0.001, 0.018)],
            K((0.03, -0.045, 0.012), (0.008, -0.012, 0.022), 0.0095),
            K((0.008, -0.012, 0.022), (-0.006, 0.012, 0.016), 0.0085),
            K((0.025, -0.06, -0.012), (0.03, -0.085, -0.025), 0.03),
        ],
        pivot=(0, 0, 0),
        material=m["skin"],
        voxel=0.0018,
        smooth=3,
        target_tris=5000,
    )
    cuff = C.part("Cuff", [K((0.03, -0.085, -0.025), (0.038, -0.115, -0.036), 0.04)], pivot=(0.03, -0.085, -0.025), material=m["leather_brown"], voxel=0.002, target_tris=1500)
    sleeve = C.part(
        "Sleeve",
        [K((0.038, -0.11, -0.035), (0.08, -0.32, -0.14), 0.05), K((0.08, -0.32, -0.14), (0.11, -0.48, -0.24), 0.062), E((0.06, -0.2, -0.085), (0.058, 0.07, 0.052))],
        pivot=(0, 0, 0),
        material=m["cloth"],
        voxel=0.003,
        smooth=4,
        target_tris=4000,
    )
    stars = [C.sphere(f"Star_{i}", (0.06 + 0.012 * i, -0.2 - 0.03 * i, -0.04 - 0.02 * i), 0.004, m["gold_glow"], segments=8) for i in range(4)]
    for s in stars:
        C.parent_keep(s, sleeve)
    for c in (inlay, pommel, tip):
        C.parent_keep(c, wand)


# ---------------------------------------------------------------------------- pip


def pip(m):
    core = C.part("Core", [E((0, 0, 0), (0.065, 0.065, 0.065))], pivot=(0, 0, 0), material=m["opal"], voxel=0.003, target_tris=2000)
    for i, (r, rot) in enumerate(((0.1, (90, 0, 0)), (0.118, (90, 0, 60)), (0.136, (20, 0, 0)))):
        ring = C.torus(f"Ring_{i}", (0, 0, 0), r, 0.005, m["brass"], rotation=rot, segments=(72, 10))
        # Engraved constellation studs along each ring (computed in the ring's own plane).
        from mathutils import Euler, Vector

        rot_m = Euler(tuple(math.radians(x) for x in rot), "XYZ").to_matrix()
        for k in range(12):
            a = k / 12 * math.tau
            p = rot_m @ Vector((math.cos(a) * r, math.sin(a) * r, 0))
            stud = C.sphere(f"Ring_{i}_stud_{k}", tuple(p), 0.0055, m["brass"], segments=8)
            C.parent_keep(stud, ring)
    for side, s in (("L", 1), ("R", -1)):
        fin = box(f"FinMesh_{side}", (0.05, 0.004, 0.014), (0.075 * s, 0, 0.078), m["brass"], bevel=0.002, rotation=(0, -20 * s, 0))
        group(f"Fin_{side}", (0.055 * s, 0, 0.075), [fin])
    _ = core


# ---------------------------------------------------------------------------- training dummy


def training_dummy(m):
    C.part("Base", [E((0, 0, 0.11), (0.38, 0.38, 0.12)), E((0, 0, 0.2), (0.3, 0.3, 0.05))], pivot=(0, 0, 0), material=m["stone_dark"], voxel=0.01, target_tris=2500)
    C.part("Post", [K((0, 0, 0.2), (0, 0, 0.95), 0.05)], pivot=(0, 0, 0), material=m["oak"], voxel=0.006, target_tris=1200)
    torso = C.part(
        "TorsoMesh",
        [E((0, 0, 1.22), (0.2, 0.15, 0.3)), E((0, 0, 1.45), (0.22, 0.15, 0.1)), K((0, 0, 0.92), (0, 0, 1.0), 0.07)],
        pivot=(0, 0, 0.95),
        material=m["canvas"],
        voxel=0.008,
        target_tris=4000,
    )
    straps = [C.torus(f"Strap_{i}", (0, 0, z), 0.205, 0.012, m["leather_brown"]) for i, z in enumerate((1.08, 1.3))]
    target = C.torus("WardTarget", (0, -0.155, 1.24), 0.08, 0.014, m["gold_glow"], rotation=(90, 0, 0), segments=(40, 8))
    head = C.part("Head", [E((0, 0, 1.68), (0.12, 0.12, 0.13)), K((0, 0, 1.5), (0, 0, 1.58), 0.04)], pivot=(0, 0, 1.55), material=m["oak"], voxel=0.006, target_tris=2500)
    arms = []
    for side, s in (("L", 1), ("R", -1)):
        mesh = C.part(f"ArmMesh_{side}", [K((0.24 * s, 0, 1.42), (0.3 * s, -0.02, 1.12), 0.04), E((0.31 * s, -0.025, 1.08), (0.05, 0.05, 0.05))], pivot=(0.24 * s, 0, 1.42), material=m["oak"], voxel=0.005, target_tris=1500)
        pin = C.sphere(f"Pin_{side}", (0.24 * s, 0, 1.42), 0.022, m["brass"], segments=12)
        arms.append(group(f"Arm_{side}", (0.24 * s, 0, 1.42), [mesh, pin]))
    group("Torso", (0, 0, 0.95), [torso, *straps, target, head, *arms])


# ---------------------------------------------------------------------------- runaway book


def runaway_book(m):
    pages = []
    for i in range(5):
        pages.append(box(f"PageBlock_{i}", (0.29, 0.38, 0.009), (0, 0, 0.004 + i * 0.0095), m["parchment"], bevel=0.002))
    group("Pages", (0, 0, 0), pages)
    spine = C.part("Spine", [K((0, -0.19, 0.024), (0, 0.19, 0.024), 0.032)], pivot=(0, 0, 0.024), material=m["leather"], voxel=0.004, target_tris=1200)
    _ = spine
    for side, s in (("L", 1), ("R", -1)):
        cover = box(f"CoverMesh_{side}", (0.31, 0.41, 0.012), (0.155 * s, 0, 0.05), m["leather"], bevel=0.003)
        corners = [box(f"Corner_{side}_{k}", (0.035, 0.035, 0.016), (0.285 * s, 0.18 * (1 if k else -1), 0.05), m["brass"], bevel=0.003) for k in (0, 1)]
        rune = C.torus(f"Rune_{side}", (0.155 * s, 0, 0.058), 0.06, 0.005, m["gold_glow"], segments=(40, 6))
        group(f"Cover_{side}", (0, 0, 0.05), [cover, *corners, rune])
    clasp = box("Clasp", (0.05, 0.03, 0.06), (0.3, 0, 0.03), m["brass"], bevel=0.004)
    _ = clasp


# ---------------------------------------------------------------------------- thorn pod


def thorn_pod(m):
    C.part("Soil", [E((0, 0, 0.04), (0.45, 0.45, 0.06))], pivot=(0, 0, 0), material=m["soil"], voxel=0.012, target_tris=1500)
    C.part(
        "Roots",
        [K((0, 0, 0.05), (0.3 * math.cos(a), 0.3 * math.sin(a), 0.0), 0.03) for a in (0.3, 1.8, 3.4, 4.9)],
        pivot=(0, 0, 0),
        material=m["oak"],
        voxel=0.006,
        target_tris=2000,
    )
    C.part("Stem", [K((0, 0, 0.0), (0.05, 0.02, 0.5), 0.05), K((0.05, 0.02, 0.5), (-0.04, 0.06, 0.95), 0.045), K((-0.04, 0.06, 0.95), (0, 0.1, 1.25), 0.04)], pivot=(0, 0, 0), material=m["stem"], voxel=0.006, target_tris=3000)
    for i, (z, s) in enumerate(((0.4, 1), (0.75, -1))):
        C.leaf(f"Leaf_{i}", (0.03 * s, 0.04, z), 0.36, 0.16, m["leaf"], rotation=(70, 0, -70 * s), curl=0.25)
    for i in range(6):
        a = i / 6 * math.tau
        thorn = C.part(f"Thorn_{i}", [K((0.04 * math.cos(a), 0.04 * math.sin(a), 0.3 + i * 0.12), (0.09 * math.cos(a), 0.09 * math.sin(a), 0.33 + i * 0.12), 0.008)], pivot=(0, 0, 0), material=m["oak"], voxel=0.003, target_tris=200)
        _ = thorn
    core = C.part("Core", [E((0, 0.1, 1.3), (0.11, 0.11, 0.12))], pivot=(0, 0.1, 1.3), material=m["amber"], voxel=0.004, target_tris=1500)
    petals = []
    for i in range(7):
        a = i / 7 * math.tau
        mesh = C.part(
            f"PetalMesh_{i}",
            [E((math.cos(a) * 0.12, 0.1 + math.sin(a) * 0.12, 1.36), (0.07, 0.035, 0.15), rotation=(math.degrees(math.sin(a)) * 0.6, -math.degrees(math.cos(a)) * 0.6, 0))],
            pivot=(math.cos(a) * 0.08, 0.1 + math.sin(a) * 0.08, 1.28),
            material=m["petal"],
            voxel=0.004,
            target_tris=900,
        )
        petals.append(group(f"Petal_{i}", (math.cos(a) * 0.08, 0.1 + math.sin(a) * 0.08, 1.28), [mesh]))
    group("Head", (0, 0.1, 1.25), [core, *petals])


# ---------------------------------------------------------------------------- ward anchor


def ward_anchor(m):
    # Carved triangular plinth: a bevelled three-sided prism with a stepped top.
    bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=0.95, depth=0.62, location=(0, 0, 0.31))
    base = bpy.context.active_object
    base.name = "Base"
    bev = base.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.09
    bev.segments = 4
    bpy.ops.object.modifier_apply(modifier=bev.name)
    bpy.ops.mesh.primitive_cylinder_add(vertices=3, radius=0.68, depth=0.16, location=(0, 0, 0.7), rotation=(0, 0, math.radians(60)))
    step = bpy.context.active_object
    step.name = "Step"
    bev = step.modifiers.new("Bevel", "BEVEL")
    bev.width = 0.05
    bev.segments = 3
    bpy.ops.object.modifier_apply(modifier=bev.name)
    for o in (base, step):
        bpy.ops.object.select_all(action="DESELECT")
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.shade_auto_smooth() if hasattr(bpy.ops.object, "shade_auto_smooth") else bpy.ops.object.shade_smooth()
        C.smart_uv(o)
        o.data.materials.append(m["stone"])
    C.torus("Collar", (0, 0, 0.84), 0.5, 0.03, m["brass"])
    for i in range(3):
        a = i / 3 * math.tau
        C.part(f"Pillar_{i}", [K((math.cos(a) * 0.6, math.sin(a) * 0.6, 0.78), (math.cos(a) * 0.6, math.sin(a) * 0.6, 1.5), 0.035)], pivot=(0, 0, 0), material=m["brass"], voxel=0.004, target_tris=600)
        node = C.part(f"NodeMesh_{i}", [E((math.cos(a) * 0.6, math.sin(a) * 0.6, 1.6), (0.07, 0.07, 0.11))], pivot=(math.cos(a) * 0.6, math.sin(a) * 0.6, 1.6), material=m["crystal"], voxel=0.004, target_tris=500)
        group(f"Node_{i}", (math.cos(a) * 0.6, math.sin(a) * 0.6, 1.6), [node])
    for i, r in enumerate((0.55, 0.45, 0.35)):
        ring = C.torus(f"RingMesh_{i}", (0, 0, 1.5), r, 0.022, m["brass"], segments=(64, 10))
        ticks = [box(f"Tick_{i}_{k}", (0.02, 0.05, 0.03), (math.cos(k / 8 * math.tau) * r, math.sin(k / 8 * math.tau) * r, 1.5), m["brass"], bevel=0.004, rotation=(0, 0, k / 8 * 360)) for k in range(8)]
        group(f"Ring_{i}", (0, 0, 1.5), [ring, *ticks])
    shard = C.part("ShardMesh", [E((0, 0, 1.5), (0.09, 0.09, 0.24))], pivot=(0, 0, 1.5), material=m["crystal"], voxel=0.003, target_tris=600)
    group("Shard", (0, 0, 1.5), [shard])


# ---------------------------------------------------------------------------- grimoire


def grimoire(m):
    blocks = [box(f"PageBlock_{i}", (0.98, 1.28, 0.03), (0, 0, 0.018 + i * 0.031), m["parchment"], bevel=0.006) for i in range(5)]
    group("Pages", (0, 0, 0), blocks)
    C.part("Spine", [K((0, -0.66, 0.09), (0, 0.66, 0.09), 0.1)], pivot=(0, 0, 0.09), material=m["leather"], voxel=0.008, target_tris=2500)
    for side, s in (("L", 1), ("R", -1)):
        cover = box(f"CoverMesh_{side}", (1.04, 1.36, 0.045), (0.52 * s, 0, 0.18), m["leather"], bevel=0.012)
        corners = [C.part(f"Ornament_{side}_{k}", [E((0.98 * s, 0.62 * (1 if k else -1), 0.2), (0.07, 0.07, 0.03))], pivot=(0.98 * s, 0.62 * (1 if k else -1), 0.2), material=m["brass"], voxel=0.004, target_tris=600) for k in (0, 1)]
        diagram = [C.torus(f"Diagram_{side}_{r}", (0.52 * s, 0, 0.205), r, 0.008, m["gold_glow"], segments=(64, 6)) for r in (0.18, 0.3)]
        group(f"Cover_{side}", (0, 0, 0.18), [cover, *corners, *diagram])
    for i, z in enumerate((-0.35, 0.35)):
        mark = box(f"Bookmark_{i}", (0.04, 0.4, 0.004), (0.2 * (1 if i else -1), -0.8, 0.12), m["cloth"], bevel=0.0)
        _ = mark


BUILDERS = dict(fp_arm=fp_arm, pip=pip, training_dummy=training_dummy, runaway_book=runaway_book, thorn_pod=thorn_pod, ward_anchor=ward_anchor, grimoire=grimoire)
HEIGHTS = dict(fp_arm=0.5, pip=0.3, training_dummy=1.8, runaway_book=0.4, thorn_pod=1.5, ward_anchor=1.8, grimoire=1.4)

os.makedirs(OUT, exist_ok=True)
for name in [a for a in args if not a.startswith("--")] or list(BUILDERS):
    C.reset_scene()
    BUILDERS[name](mats())
    path = os.path.join(OUT, f"{name}.glb")
    C.export_static(path)
    print(f"{name}: {C.triangle_count()} tris -> {path}")
    if "--preview" in args:
        C.render_previews(os.path.join(ROOT, "assets-src", "previews", name), HEIGHTS[name])
