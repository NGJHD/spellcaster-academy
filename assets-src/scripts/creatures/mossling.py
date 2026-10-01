"""
Mossling (§14A.10, MD-8): ~1.05 m compact forest guardian — mammalian anatomy under thick moss and
rooted bark armour, broad shoulders, long forearms, short stable legs, small deer-like ears, amber
eyes, fern growth along the back, three thick fingers. Heavy but never slow-motion.

    blender --background --python assets-src/scripts/creatures/mossling.py -- [--preview]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import creature as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

C.reset_scene()
E, K = C.ellipsoid, C.capsule
volumes = [
    E((0, 0.02, 0.36), (0.2, 0.17, 0.15)),
    E((0, -0.03, 0.5), (0.24, 0.2, 0.2), "belly"),
    E((0, -0.01, 0.68), (0.27, 0.2, 0.17)),
    E((0, 0.08, 0.74), (0.25, 0.13, 0.15), "bark", rotation=(-15, 0, 0)),
    E((0, -0.12, 0.86), (0.14, 0.13, 0.12)),
    E((0, -0.205, 0.915), (0.12, 0.045, 0.035), "bark"),
    E((0, -0.235, 0.835), (0.075, 0.065, 0.05), "face"),
]
for s in (1, -1):
    volumes += [
        E((0.28 * s, 0.0, 0.76), (0.13, 0.13, 0.085), "bark", rotation=(0, 25 * s, 0)),
        K((0.27 * s, -0.02, 0.7), (0.36 * s, -0.06, 0.5), 0.075),
        K((0.36 * s, -0.06, 0.5), (0.34 * s, -0.12, 0.24), 0.07),
        E((0.34 * s, -0.14, 0.18), (0.085, 0.085, 0.075), "bark"),
        K((0.34 * s, -0.16, 0.16), (0.3 * s, -0.24, 0.1), 0.032, "bark"),
        K((0.36 * s, -0.17, 0.16), (0.37 * s, -0.25, 0.1), 0.032, "bark"),
        K((0.38 * s, -0.13, 0.17), (0.43 * s, -0.19, 0.11), 0.03, "bark"),
        K((0.12 * s, 0.02, 0.33), (0.14 * s, -0.02, 0.15), 0.085),
        E((0.14 * s, -0.06, 0.05), (0.09, 0.13, 0.05), "bark"),
    ]

body = C.build_volume_mesh("MosslingBody", volumes, voxel=0.007, smooth=4, target_tris=16000)
C.paint_zones(body, volumes, {"body": "#566f2c", "belly": "#6c8638", "bark": "#5a4231", "face": "#7d9447"}, noise=0.12)
body.data.materials.append(C.make_material("MosslingSkin", roughness=0.9, vertex_colors=True))

eye_mat = C.make_material("MosslingEye", color="#ffbf5a", emission="#ff9a1f", emission_strength=4, roughness=0.2)
fern_mat = C.make_material("MosslingFern", color="#4d8a32", roughness=0.6)
ear_mat = C.make_material("MosslingEar", color="#6c8638", roughness=0.8)

acc = []
for s in (1, -1):
    acc.append((C.sphere(f"Eye_{s}", (0.058 * s, -0.235, 0.895), 0.022, eye_mat, scale=(1, 0.6, 0.8)), "head"))
    acc.append((C.leaf(f"Ear_{s}", (0.11 * s, -0.1, 0.95), 0.11, 0.06, ear_mat, rotation=(10, 0, -60 * s), curl=0.1, thickness=0.006), "head"))
for i, (x, z, rx, rz) in enumerate([(-0.12, 0.86, -35, 20), (0.0, 0.9, -30, 0), (0.12, 0.86, -35, -20), (-0.06, 0.74, -55, 12), (0.07, 0.74, -55, -12), (0.0, 0.62, -70, 0)]):
    acc.append((C.leaf(f"Fern_{i}", (x, 0.14, z), 0.26, 0.09, fern_mat, rotation=(rx, 0, rz), curl=0.35), "chest" if z > 0.7 else "spine"))

J = C.Joint
joints = [
    J("pelvis", (0, 0.02, 0.25), (0, 0.0, 0.45)),
    J("spine", (0, 0.0, 0.45), (0, -0.01, 0.65), "pelvis"),
    J("chest", (0, -0.01, 0.65), (0, -0.05, 0.78), "spine"),
    J("head", (0, -0.05, 0.78), (0, -0.15, 0.99), "chest"),
]
for side, s in (("L", 1), ("R", -1)):
    joints += [
        J(f"arm_{side}", (0.25 * s, -0.02, 0.72), (0.36 * s, -0.06, 0.5), "chest"),
        J(f"forearm_{side}", (0.36 * s, -0.06, 0.5), (0.34 * s, -0.13, 0.2), f"arm_{side}"),
        J(f"hand_{side}", (0.34 * s, -0.13, 0.2), (0.35 * s, -0.22, 0.1), f"forearm_{side}"),
        J(f"thigh_{side}", (0.12 * s, 0.02, 0.36), (0.14 * s, -0.02, 0.15), "pelvis"),
        J(f"foot_{side}", (0.14 * s, -0.02, 0.15), (0.14 * s, -0.15, 0.04), f"thigh_{side}"),
    ]
rig = C.build_armature("Mossling", joints, body)
for obj, bone in acc:
    C.attach(obj, rig, bone)

C.pose_action(rig, "Idle", [
    (0, {"chest": (0, 0, 0), "head": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
    (36, {"chest": (3, 0, 2), "head": (-4, 4, 0), "arm_L": (4, 0, 0), "arm_R": (-3, 0, 0)}),
    (72, {"chest": (0, 0, 0), "head": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
])
# Heavy walk: planted feet, visible compression, shoulder-led turn, fern overlap.
C.pose_action(rig, "Move", [
    (0, {"pelvis": {"loc": (0, 0, 0)}, "thigh_L": (24, 0, 0), "thigh_R": (-20, 0, 0), "chest": (0, 0, -6), "arm_L": (-18, 0, 0), "arm_R": (18, 0, 0)}),
    (6, {"pelvis": {"loc": (0, -0.025, 0)}, "thigh_L": (8, 0, 0), "thigh_R": (-4, 0, 0), "chest": (4, 0, 0)}),
    (12, {"pelvis": {"loc": (0, 0, 0)}, "thigh_L": (-20, 0, 0), "thigh_R": (24, 0, 0), "chest": (0, 0, 6), "arm_L": (18, 0, 0), "arm_R": (-18, 0, 0)}),
    (18, {"pelvis": {"loc": (0, -0.025, 0)}, "thigh_L": (-4, 0, 0), "thigh_R": (8, 0, 0), "chest": (4, 0, 0)}),
    (24, {"pelvis": {"loc": (0, 0, 0)}, "thigh_L": (24, 0, 0), "thigh_R": (-20, 0, 0), "chest": (0, 0, -6), "arm_L": (-18, 0, 0), "arm_R": (18, 0, 0)}),
])
C.pose_action(rig, "Attack", [
    (0, {"chest": (0, 0, 0), "arm_R": (0, 0, 0), "forearm_R": (0, 0, 0), "pelvis": {"loc": (0, 0, 0)}}),
    (14, {"chest": (-8, 0, 28), "arm_R": (-70, 0, 20), "forearm_R": (-30, 0, 0), "pelvis": {"loc": (0, -0.04, 0)}}),
    (20, {"chest": (10, 0, -30), "arm_R": (60, 0, -10), "forearm_R": (10, 0, 0), "pelvis": {"loc": (0, -0.02, 0)}}),
    (32, {"chest": (0, 0, 0), "arm_R": (0, 0, 0), "forearm_R": (0, 0, 0), "pelvis": {"loc": (0, 0, 0)}}),
])
C.pose_action(rig, "Hit", [
    (0, {"chest": (0, 0, 0), "head": (0, 0, 0)}),
    (4, {"chest": (-14, 0, 4), "head": (-12, 0, 0)}),
    (16, {"chest": (0, 0, 0), "head": (0, 0, 0)}),
])
# Settles into a harmless moss mound (kept in the scene afterwards).
C.pose_action(rig, "Dispel", [
    (0, {"pelvis": {"loc": (0, 0, 0), "scale": (1, 1, 1)}, "chest": (0, 0, 0), "head": (0, 0, 0)}),
    (14, {"pelvis": {"loc": (0, -0.1, 0), "scale": (1.15, 0.8, 1.15)}, "chest": (35, 0, 0), "head": (30, 0, 0)}),
    (30, {"pelvis": {"loc": (0, -0.2, 0), "scale": (1.35, 0.45, 1.35)}, "chest": (60, 0, 0), "head": (50, 0, 0)}),
])

out = os.path.join(ROOT, "public", "assets", "creatures", "mossling.glb")
C.export_glb(out)
print(f"mossling: {C.triangle_count()} tris -> {out}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", "mossling"), 1.05)
