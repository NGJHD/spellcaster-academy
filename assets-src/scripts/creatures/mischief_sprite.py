"""
Mischief sprite (§14A.5, MD-3): 55 cm woodland creature with a lemur-like body plan, long leaf-membrane
ears, large but seated eyes, teal bioluminescent freckles and a leaf-tufted tail. Appealing, cheeky.

    blender --background --python assets-src/scripts/creatures/mischief_sprite.py -- [russet|grey|teal] [--preview]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import creature as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
variant = next((a for a in args if not a.startswith("--")), "russet")

PALETTE = {
    "russet": {"body": "#8c4a26", "belly": "#d9a77a", "head": "#8c4a26", "snout": "#e3bc94", "paw": "#4a2a18", "tip": "#5a3a1c"},
    "grey": {"body": "#6e6b66", "belly": "#c9c3b8", "head": "#6e6b66", "snout": "#d6d0c4", "paw": "#3a3835", "tip": "#4a4743"},
    "teal": {"body": "#8c4a26", "belly": "#d9a77a", "head": "#8c4a26", "snout": "#e3bc94", "paw": "#4a2a18", "tip": "#2a7a6e"},
}[variant]

C.reset_scene()
E, K = C.ellipsoid, C.capsule

volumes = [
    E((0, 0.03, 0.17), (0.085, 0.09, 0.08)),
    E((0, -0.03, 0.29), (0.078, 0.072, 0.11), rotation=(15, 0, 0)),
    E((0, -0.078, 0.28), (0.052, 0.028, 0.08), "belly", rotation=(15, 0, 0)),
    E((0, -0.06, 0.38), (0.07, 0.064, 0.068)),
    E((0, -0.10, 0.5), (0.095, 0.088, 0.085), "head"),
    E((0, -0.172, 0.474), (0.04, 0.05, 0.034), "snout"),
    E((0.055, -0.135, 0.468), (0.042, 0.04, 0.036), "snout"),
    E((-0.055, -0.135, 0.468), (0.042, 0.04, 0.036), "snout"),
]
for s in (1, -1):
    volumes += [
        K((0.06 * s, -0.06, 0.385), (0.085 * s, -0.12, 0.31), 0.027),
        K((0.085 * s, -0.12, 0.31), (0.072 * s, -0.16, 0.24), 0.023),
        E((0.072 * s, -0.168, 0.226), (0.027, 0.032, 0.02), "paw"),
        E((0.06 * s, 0.0, 0.155), (0.048, 0.072, 0.064)),
        K((0.066 * s, -0.03, 0.11), (0.07 * s, -0.04, 0.045), 0.028),
        E((0.07 * s, -0.08, 0.022), (0.031, 0.058, 0.021), "paw"),
    ]
volumes += [
    K((0, 0.1, 0.17), (0, 0.2, 0.24), 0.033),
    K((0, 0.2, 0.24), (0, 0.27, 0.38), 0.028),
    K((0, 0.27, 0.38), (0, 0.25, 0.52), 0.023),
    E((0, 0.245, 0.55), (0.036, 0.036, 0.045), "tip"),
]

body = C.build_volume_mesh("SpriteBody", volumes, voxel=0.0045, smooth=4, target_tris=9000)
C.paint_zones(body, volumes, PALETTE, noise=0.06)
body.data.materials.append(C.make_material("SpriteFur", roughness=0.82, vertex_colors=True))

eye_mat = C.make_material("SpriteEye", color="#0b0806", roughness=0.05)
glint_mat = C.make_material("SpriteGlint", color="#ffffff", emission="#ffffff", emission_strength=3)
freckle_mat = C.make_material("SpriteFreckle", color="#8ff3e2", emission="#2fd6c0", emission_strength=4)
leaf_mat = C.make_material("SpriteEar", color="#5f9a3a" if variant != "teal" else "#3fb3a0", roughness=0.5)

accessories = []
for s in (1, -1):
    accessories.append((C.sphere(f"Eye_{s}", (0.04 * s, -0.17, 0.515), 0.024, eye_mat, scale=(1, 0.7, 1)), "head"))
    accessories.append((C.sphere(f"Glint_{s}", (0.034 * s, -0.188, 0.528), 0.005, glint_mat, segments=8), "head"))
    accessories.append((C.leaf(f"Ear_{s}", (0.058 * s, -0.09, 0.555), 0.17, 0.11, leaf_mat, rotation=(20, 0, -55 * s), curl=0.15), "head"))
for i, (x, y, z) in enumerate([(0.045, -0.105, 0.36), (-0.045, -0.105, 0.36), (0.06, -0.06, 0.31), (-0.06, -0.065, 0.31), (0.07, -0.16, 0.48), (-0.07, -0.16, 0.48)]):
    accessories.append((C.sphere(f"Freckle_{i}", (x, y, z), 0.007, freckle_mat, segments=8), "chest" if z < 0.42 else "head"))
accessories.append((C.leaf("TailTuft", (0, 0.24, 0.57), 0.12, 0.08, leaf_mat, rotation=(-20, 0, 0), curl=0.35), "tail_3"))

J = C.Joint
joints = [J("pelvis", (0, 0.03, 0.10), (0, 0.0, 0.22))]
joints += [
    J("spine", (0, 0.0, 0.22), (0, -0.05, 0.36), "pelvis"),
    J("chest", (0, -0.05, 0.36), (0, -0.08, 0.44), "spine"),
    J("head", (0, -0.08, 0.44), (0, -0.12, 0.6), "chest"),
    J("tail_1", (0, 0.1, 0.17), (0, 0.2, 0.24), "pelvis"),
    J("tail_2", (0, 0.2, 0.24), (0, 0.27, 0.38), "tail_1"),
    J("tail_3", (0, 0.27, 0.38), (0, 0.25, 0.56), "tail_2"),
]
for side, s in (("L", 1), ("R", -1)):
    joints += [
        J(f"arm_{side}", (0.06 * s, -0.06, 0.385), (0.085 * s, -0.12, 0.31), "chest"),
        J(f"forearm_{side}", (0.085 * s, -0.12, 0.31), (0.072 * s, -0.17, 0.225), f"arm_{side}"),
        J(f"thigh_{side}", (0.06 * s, 0.01, 0.17), (0.066 * s, -0.03, 0.11), "pelvis"),
        J(f"shin_{side}", (0.066 * s, -0.03, 0.11), (0.07 * s, -0.04, 0.04), f"thigh_{side}"),
        J(f"foot_{side}", (0.07 * s, -0.04, 0.04), (0.07 * s, -0.12, 0.02), f"shin_{side}"),
    ]
rig = C.build_armature("Sprite", joints, body)
for obj, bone in accessories:
    C.attach(obj, rig, bone)

# ---------- Actions (30 fps, degrees, bone-local; X pitches a bone forward/back) ----------
C.pose_action(rig, "Idle", [
    (0, {"chest": (0, 0, 0), "head": (0, 0, 0), "tail_2": (0, 6, 0), "tail_3": (0, 10, 0)}),
    (30, {"chest": (3, 0, 0), "head": (-5, 6, 0), "tail_2": (0, -6, 0), "tail_3": (0, -12, 0)}),
    (60, {"chest": (0, 0, 0), "head": (0, 0, 0), "tail_2": (0, 6, 0), "tail_3": (0, 10, 0)}),
])
C.pose_action(rig, "Move", [
    (0, {"pelvis": {"loc": (0, 0, 0)}, "thigh_L": (28, 0, 0), "thigh_R": (-28, 0, 0), "arm_L": (-30, 0, 0), "arm_R": (30, 0, 0), "tail_2": (10, 0, 0)}),
    (4, {"pelvis": {"loc": (0, 0.03, 0)}, "thigh_L": (0, 0, 0), "thigh_R": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0), "tail_2": (-6, 0, 0)}),
    (8, {"pelvis": {"loc": (0, 0, 0)}, "thigh_L": (-28, 0, 0), "thigh_R": (28, 0, 0), "arm_L": (30, 0, 0), "arm_R": (-30, 0, 0), "tail_2": (10, 0, 0)}),
    (12, {"pelvis": {"loc": (0, 0.03, 0)}, "thigh_L": (0, 0, 0), "thigh_R": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0), "tail_2": (-6, 0, 0)}),
    (16, {"pelvis": {"loc": (0, 0, 0)}, "thigh_L": (28, 0, 0), "thigh_R": (-28, 0, 0), "arm_L": (-30, 0, 0), "arm_R": (30, 0, 0), "tail_2": (10, 0, 0)}),
])
C.pose_action(rig, "Attack", [
    (0, {"pelvis": {"loc": (0, 0, 0)}, "spine": (0, 0, 0), "head": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
    (14, {"pelvis": {"loc": (0, -0.04, 0)}, "spine": (20, 0, 0), "head": (-18, 0, 0), "arm_L": (40, 0, 0), "arm_R": (40, 0, 0)}),
    (20, {"pelvis": {"loc": (0, 0.05, 0.1)}, "spine": (-22, 0, 0), "head": (12, 0, 0), "arm_L": (-75, 0, 0), "arm_R": (-75, 0, 0)}),
    (30, {"pelvis": {"loc": (0, 0, 0)}, "spine": (0, 0, 0), "head": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
])
C.pose_action(rig, "Hit", [
    (0, {"spine": (0, 0, 0), "head": (0, 0, 0)}),
    (3, {"spine": (-22, 0, 6), "head": (-18, 8, 0)}),
    (12, {"spine": (0, 0, 0), "head": (0, 0, 0)}),
])
C.pose_action(rig, "Dispel", [
    (0, {"pelvis": {"rot": (0, 0, 0), "scale": (1, 1, 1)}}),
    (15, {"pelvis": {"rot": (0, 360, 0), "loc": (0, 0.08, 0), "scale": (0.7, 0.7, 0.7)}}),
    (30, {"pelvis": {"rot": (0, 720, 0), "loc": (0, 0.15, 0), "scale": (0.05, 0.05, 0.05)}}),
])

name = "mischief_sprite" if variant == "russet" else f"mischief_sprite_{variant}"
out = os.path.join(ROOT, "public", "assets", "creatures", f"{name}.glb")
C.export_glb(out)
print(f"{name}: {C.triangle_count()} tris -> {out}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", name), 0.6)
