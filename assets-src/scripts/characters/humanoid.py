"""
Stylised-realistic robed humanoids (§14A.3 apprentice, ending cast): Mira, Keeper Orin, students.

    blender --background --python assets-src/scripts/characters/humanoid.py -- <mira|orin|student_a|student_b> [--preview]

Built from blended volumes (skull, jaw, nose, ears; negative volumes carve eye sockets), with seated
eyeballs, hair clumps, robe with flared skirt, sleeves, hands and boots. Natural proportions, softly
stylised; no exaggerated anime anatomy. Actions: Idle, Wave, TalkShort, Celebrate.
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import bpy  # noqa: E402
import creature as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
who = next((a for a in args if not a.startswith("--")), "mira")

CAST = {
    "mira": dict(height=1.45, robe="#26365e", trim="#c9a24a", skin="#c08a66", hair="#2b1d15", style="bob", satchel=True),
    "orin": dict(height=1.85, robe="#5e1c27", trim="#d4b05a", skin="#e2b998", hair="#d9d4ca", style="beard", satchel=False),
    "student_a": dict(height=1.4, robe="#26365e", trim="#c9a24a", skin="#8d5a3e", hair="#1a120d", style="short", satchel=True),
    "student_b": dict(height=1.5, robe="#5e1c27", trim="#d4b05a", skin="#f0c8a8", hair="#8a5a2e", style="long", satchel=False),
}
spec = CAST[who]
H = spec["height"]
k = H / 1.45  # everything is authored for a 1.45 m apprentice and scaled


def v(x, y, z):
    return (x * k, y * k, z * k)


C.reset_scene()
E, K = C.ellipsoid, C.capsule
vol = [
    # Head: cranium/forehead, lower face kept below the eye line, cheeks, chin, nose, brow, ears
    E(v(0, 0.005, 1.34), (0.084 * k, 0.09 * k, 0.1 * k), "skin"),
    E(v(0, -0.02, 1.264), (0.06 * k, 0.066 * k, 0.066 * k), "skin"),
    E(v(0.038, -0.05, 1.278), (0.028 * k, 0.026 * k, 0.024 * k), "skin"),
    E(v(-0.038, -0.05, 1.278), (0.028 * k, 0.026 * k, 0.024 * k), "skin"),
    E(v(0, -0.045, 1.218), (0.03 * k, 0.032 * k, 0.022 * k), "skin"),
    E(v(0, -0.087, 1.296), (0.009 * k, 0.013 * k, 0.019 * k), "skin", rotation=(-15, 0, 0)),
    E(v(0, -0.074, 1.348), (0.055 * k, 0.012 * k, 0.009 * k), "skin"),
    E(v(0.084, 0.004, 1.31), (0.011 * k, 0.02 * k, 0.028 * k), "skin"),
    E(v(-0.084, 0.004, 1.31), (0.011 * k, 0.02 * k, 0.028 * k), "skin"),
    E(v(0, -0.078, 1.248), (0.02 * k, 0.01 * k, 0.007 * k), "lips"),
    # Neck and robe
    K(v(0, 0.0, 1.2), v(0, 0.0, 1.13), 0.042 * k, "skin"),
    E(v(0, 0.0, 1.06), (0.16 * k, 0.11 * k, 0.1 * k), "robe"),
    E(v(0, 0.0, 0.9), (0.15 * k, 0.11 * k, 0.16 * k), "robe"),
    E(v(0, 0.0, 0.64), (0.17 * k, 0.13 * k, 0.2 * k), "robe"),
    E(v(0, 0.0, 0.4), (0.195 * k, 0.155 * k, 0.2 * k), "robe"),
    E(v(0, 0.0, 0.18), (0.215 * k, 0.17 * k, 0.16 * k), "robe"),
    E(v(0, 0.0, 0.06), (0.225 * k, 0.18 * k, 0.05 * k), "trim"),
]
# Sleeves and hands are separate pieces hinged on the arm bones (owner, 2026-10-16: raised arms looked
# weird; fused into the robe, lifting them stretched a band of robe and skin between arm and body).
arm_parts = []  # (bone, volumes)
for s in (1, -1):
    side = "L" if s > 0 else "R"
    vol += [
        E(v(0.15 * s, 0.0, 1.07), (0.07 * k, 0.07 * k, 0.065 * k), "robe"),
        E(v(0.08 * s, -0.06, 0.035), (0.05 * k, 0.09 * k, 0.035 * k), "boots"),
    ]
    arm_parts += [
        (f"arm_{side}", [K(v(0.17 * s, 0.0, 1.05), v(0.21 * s, -0.01, 0.82), 0.05 * k, "robe")]),
        (f"forearm_{side}", [
            K(v(0.21 * s, -0.01, 0.82), v(0.22 * s, -0.06, 0.6), 0.055 * k, "robe"),
            E(v(0.222 * s, -0.065, 0.585), (0.06 * k, 0.06 * k, 0.03 * k), "trim"),
        ]),
        (f"hand_{side}", [
            E(v(0.222 * s, -0.072, 0.53), (0.026 * k, 0.04 * k, 0.055 * k), "skin"),
            E(v(0.212 * s, -0.098, 0.548), (0.012 * k, 0.018 * k, 0.022 * k), "skin", rotation=(0, 0, 20 * s)),
        ]),
    ]

style = spec["style"]
if style in ("bob", "short", "long"):
    vol += [
        E(v(0, 0.022, 1.383), (0.093 * k, 0.098 * k, 0.082 * k), "hair"),
        E(v(0, -0.066, 1.392), (0.068 * k, 0.026 * k, 0.026 * k), "hair", rotation=(20, 0, 0)),
    ]
    if style in ("bob", "long"):
        drop = 1.25 if style == "bob" else 1.12
        for s in (1, -1):
            vol.append(K(v(0.085 * s, 0.02, 1.36), v(0.09 * s, 0.03, drop), 0.03 * k, "hair"))
        vol.append(K(v(0, 0.075, 1.36), v(0, 0.08, drop), 0.06 * k, "hair"))
if style == "beard":
    vol += [
        E(v(0, 0.03, 1.39), (0.09 * k, 0.094 * k, 0.07 * k), "hair"),
        E(v(0, -0.06, 1.2), (0.058 * k, 0.038 * k, 0.085 * k), "hair"),
        E(v(0, -0.08, 1.262), (0.045 * k, 0.016 * k, 0.01 * k), "hair"),
    ]
if spec["satchel"]:
    vol += [
        E(v(-0.2, 0.06, 0.66), (0.05 * k, 0.12 * k, 0.1 * k), "leather"),
        K(v(0.13, -0.11, 1.05), v(-0.18, -0.1, 0.72), 0.012 * k, "leather"),
    ]

# Eye sockets carved with negative volumes so the eyeballs sit naturally.
sockets = [C.ellipsoid(v(0.032 * s, -0.088, 1.322), (0.02 * k, 0.019 * k, 0.014 * k)) for s in (1, -1)]

body = C.build_volume_mesh(who.title(), vol, voxel=0.0045 * k, smooth=3, target_tris=24000)
# Carve sockets with a boolean against small spheres (keeps the surface watertight).
for i, sk in enumerate(sockets):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=sk.center)
    cutter = bpy.context.active_object
    cutter.scale = tuple(sk.radii)
    mod = body.modifiers.new(f"Socket{i}", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)

C.paint_zones(
    body,
    vol,
    {
        "skin": spec["skin"],
        "lips": "#a0574f" if who != "orin" else "#b77a6a",
        "robe": spec["robe"],
        "trim": spec["trim"],
        "hair": spec["hair"],
        "boots": "#3a2a1e",
        "leather": "#6e4a2c",
    },
    noise=0.035,
    blend=0.1,
)
body.data.materials.clear()  # boolean cutters leave empty slots behind
skin_material = C.make_material(f"{who}Skin", roughness=0.62, vertex_colors=True)
body.data.materials.append(skin_material)
for poly in body.data.polygons:
    poly.material_index = 0

ZONE_COLOURS = {
    "skin": spec["skin"],
    "robe": spec["robe"],
    "trim": spec["trim"],
}
arm_meshes = []
for bone, parts in arm_parts:
    piece = C.build_volume_mesh(f"{who.title()}_{bone}", parts, voxel=0.0045 * k, smooth=3, target_tris=700)
    C.paint_zones(piece, parts, ZONE_COLOURS, noise=0.035, blend=0.1)
    piece.data.materials.clear()
    piece.data.materials.append(skin_material)
    arm_meshes.append((piece, bone))

sclera = C.make_material("Sclera", color="#f2ece4", roughness=0.25)
iris = C.make_material("Iris", color="#4a3020" if who != "student_b" else "#3a5a70", roughness=0.15)
pupil = C.make_material("Pupil", color="#0a0806", roughness=0.05)
acc = []
for s in (1, -1):
    c = v(0.032 * s, -0.069, 1.322)
    acc.append((C.sphere(f"Eye_{s}", c, 0.0165 * k, sclera), "head"))
    acc.append((C.sphere(f"Iris_{s}", (c[0], c[1] - 0.0138 * k, c[2]), 0.0082 * k, iris, scale=(1, 0.45, 1)), "head"))
    acc.append((C.sphere(f"Pupil_{s}", (c[0], c[1] - 0.0162 * k, c[2]), 0.0038 * k, pupil, scale=(1, 0.45, 1)), "head"))
    brow = C.sphere(f"Brow_{s}", v(0.033 * s, -0.083, 1.346), 0.018 * k, C.make_material(f"Brow{s}", color=spec["hair"], roughness=0.8), scale=(1.25, 0.3, 0.22))
    acc.append((brow, "head"))
badge = C.sphere("Badge", v(0.07, -0.112, 1.05), 0.016 * k, C.make_material("Badge", color="#e8c46e", metallic=1, roughness=0.3), scale=(1, 0.3, 1))
acc.append((badge, "chest"))

J = C.Joint
joints = [
    J("hips", v(0, 0, 0.55), v(0, 0, 0.8)),
    J("spine", v(0, 0, 0.8), v(0, 0, 1.0), "hips"),
    J("chest", v(0, 0, 1.0), v(0, 0, 1.13), "spine"),
    J("neck", v(0, 0, 1.13), v(0, -0.01, 1.22), "chest"),
    J("head", v(0, -0.01, 1.22), v(0, -0.01, 1.44), "neck"),
]
for side, s in (("L", 1), ("R", -1)):
    joints += [
        J(f"shoulder_{side}", v(0.05 * s, 0, 1.08), v(0.17 * s, 0, 1.06), "chest"),
        J(f"arm_{side}", v(0.17 * s, 0, 1.06), v(0.21 * s, -0.01, 0.82), f"shoulder_{side}"),
        J(f"forearm_{side}", v(0.21 * s, -0.01, 0.82), v(0.222 * s, -0.065, 0.585), f"arm_{side}"),
        J(f"hand_{side}", v(0.222 * s, -0.065, 0.585), v(0.224 * s, -0.09, 0.47), f"forearm_{side}"),
    ]
rig = C.build_armature(who.title(), joints, body)
for piece, bone in arm_meshes:
    C.attach(piece, rig, bone)


def bone_for(vol):
    """The bone that carries a source volume (sleeves on the arm chain, robe on the spine)."""
    c = (vol.center + vol.end) / 2 if vol.end is not None else vol.center
    x, z = c.x / k, c.z / k
    side = "L" if c.x > 0 else "R"
    if vol.zone == "boots":
        return "hips"
    if vol.zone == "leather":
        return "chest" if vol.kind == "capsule" else "hips"
    if abs(x) >= 0.12 and z > 0.45 and vol.zone != "hair":
        return f"shoulder_{side}" if z >= 1.0 else f"arm_{side}" if z >= 0.8 else f"forearm_{side}" if z >= 0.6 else f"hand_{side}"
    if z >= 1.2 or vol.zone in ("hair", "lips"):
        return "head"
    if z >= 1.12:
        return "neck"
    return "chest" if z >= 1.0 else "spine" if z >= 0.8 else "hips"


# Bone heat fails on this blended mesh (no skin was exported): weight it from its volumes instead.
C.weights_from_volumes(body, rig, vol, [bone_for(x) for x in vol])
for obj, bone in acc:
    C.attach(obj, rig, bone)

C.pose_action(rig, "Idle", [
    (0, {"chest": (0, 0, 0), "head": (0, 0, 0), "spine": (0, 0, 0)}),
    (45, {"chest": (2, 0, 0), "head": (-3, 4, 0), "spine": (0, 0, 1.5)}),
    (90, {"chest": (0, 0, 0), "head": (0, 0, 0), "spine": (0, 0, 0)}),
])
wave_up = {"arm_R": (0, 0, -135), "forearm_R": (0, 0, -20), "head": (0, -8, 4)}
C.pose_action(rig, "Wave", [
    (0, {"arm_R": (0, 0, 0), "forearm_R": (0, 0, 0), "hand_R": (0, 0, 0), "head": (0, 0, 0)}),
    (10, {**wave_up, "hand_R": (0, 0, 0)}),
    (18, {**wave_up, "hand_R": (0, 0, 25)}),
    (26, {**wave_up, "hand_R": (0, 0, -25)}),
    (34, {**wave_up, "hand_R": (0, 0, 25)}),
    (42, {**wave_up, "hand_R": (0, 0, -25)}),
    (50, {**wave_up, "hand_R": (0, 0, 0)}),
])
C.pose_action(rig, "TalkShort", [
    (0, {"forearm_L": (0, 0, 0), "arm_L": (0, 0, 0), "head": (0, 0, 0)}),
    (12, {"forearm_L": (-55, 0, 10), "arm_L": (-15, 0, 10), "head": (4, 6, 0)}),
    (30, {"forearm_L": (-45, 0, 25), "arm_L": (-12, 0, 14), "head": (-3, -5, 0)}),
    (48, {"forearm_L": (0, 0, 0), "arm_L": (0, 0, 0), "head": (0, 0, 0)}),
])


def raise_arm(side, out=0.45):
    """Euler (degrees) turning arm_<side> from hanging down to pointing straight up (a touch outward)."""
    from mathutils import Vector

    bone = rig.data.bones[f"arm_{side}"]
    target = Vector(((out if side == "L" else -out), 0.0, 1.0)).normalized()
    local = bone.matrix_local.to_3x3().inverted() @ target
    euler = Vector((0.0, 1.0, 0.0)).rotation_difference(local).to_euler("XYZ")
    return tuple(math.degrees(a) for a in euler)


# Both hands straight up in the air, spread apart (owner, 2026-10-16).
cheer = {"arm_L": raise_arm("L"), "arm_R": raise_arm("R"), "forearm_L": (0, 0, 0), "forearm_R": (0, 0, 0)}
C.pose_action(rig, "Celebrate", [
    (0, {"arm_L": (0, 0, 0), "arm_R": (0, 0, 0), "forearm_L": (0, 0, 0), "forearm_R": (0, 0, 0), "hips": {"loc": (0, 0, 0)}}),
    (10, {**cheer, "hips": {"loc": (0, 0.05, 0)}}),
    (20, {**cheer, "hips": {"loc": (0, 0, 0)}}),
    (30, {**cheer, "hips": {"loc": (0, 0.05, 0)}}),
    (40, {"arm_L": (0, 0, 0), "arm_R": (0, 0, 0), "forearm_L": (0, 0, 0), "forearm_R": (0, 0, 0), "hips": {"loc": (0, 0, 0)}}),
])

os.makedirs(os.path.join(ROOT, "public", "assets", "characters"), exist_ok=True)
out = os.path.join(ROOT, "public", "assets", "characters", f"{who}.glb")
C.export_glb(out)
print(f"{who}: {C.triangle_count()} tris -> {out}")

# LOD1 for background use (§14.6): decimate the skinned body before the armature so weights carry over.
dec = body.modifiers.new("Decimate", "DECIMATE")
dec.ratio = 0.28
bpy.context.view_layer.objects.active = body
bpy.ops.object.modifier_move_to_index(modifier=dec.name, index=0)
bpy.ops.object.modifier_apply(modifier=dec.name)
lod = os.path.join(ROOT, "public", "assets", "characters", f"{who}_lod1.glb")
C.export_glb(lod)
print(f"{who}_lod1: {C.triangle_count()} tris -> {lod}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", who), H)
    C.render_close(os.path.join(ROOT, "assets-src", "previews", f"{who}_face.png"), v(0, 0, 1.31), 0.55 * k, angle=20)
