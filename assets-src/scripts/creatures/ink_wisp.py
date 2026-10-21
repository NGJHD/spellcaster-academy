"""
Ink wisp: 0.9–1.2 m floating being of dark indigo ink in a faint membrane; narrow upper
torso, trailing lower body, two tapered arms, two soft cyan eye lights; calligraphic tendrils.
No skulls or hollow faces. The rune shield is rendered separately at runtime.

    blender --background --python assets-src/scripts/creatures/ink_wisp.py -- [--preview]
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
    E((0, 0.0, 0.95), (0.115, 0.1, 0.13), "head"),
    E((0, 0.01, 0.76), (0.15, 0.11, 0.17)),
    K((0, 0.02, 0.62), (0, 0.06, 0.38), 0.095),
    K((0, 0.06, 0.38), (0.035, 0.15, 0.2), 0.062, "tail"),
    K((0.035, 0.15, 0.2), (-0.02, 0.27, 0.08), 0.038, "tail"),
    K((-0.02, 0.27, 0.08), (0.03, 0.38, 0.03), 0.02, "tail"),
]
for s in (1, -1):
    volumes += [
        K((0.12 * s, 0.0, 0.82), (0.23 * s, -0.06, 0.64), 0.045),
        K((0.23 * s, -0.06, 0.64), (0.28 * s, -0.13, 0.46), 0.024),
    ]

body = C.build_volume_mesh("WispBody", volumes, voxel=0.006, smooth=5, target_tris=12000)
C.paint_zones(body, volumes, {"body": "#1f1c4f", "head": "#26225f", "tail": "#110f2c"}, noise=0.18)
body.data.materials.append(C.make_material("WispInk", roughness=0.32, vertex_colors=True, emission="#141238", emission_strength=0.5))

eye_mat = C.make_material("WispEye", color="#c8fbff", emission="#55e6ff", emission_strength=6)
acc = [(C.sphere(f"Eye_{s}", (0.045 * s, -0.09, 0.97), 0.022, eye_mat, scale=(1, 0.5, 0.7)), "head") for s in (1, -1)]

J = C.Joint
joints = [
    J("core", (0, 0.04, 0.45), (0, 0.01, 0.72)),
    J("chest", (0, 0.01, 0.72), (0, 0.0, 0.88), "core"),
    J("head", (0, 0.0, 0.88), (0, 0.0, 1.07), "chest"),
    J("tail_1", (0, 0.04, 0.45), (0.03, 0.13, 0.18), "core"),
    J("tail_2", (0.03, 0.13, 0.18), (0.03, 0.38, 0.03), "tail_1"),
]
for side, s in (("L", 1), ("R", -1)):
    joints += [
        J(f"arm_{side}", (0.12 * s, 0.0, 0.82), (0.23 * s, -0.06, 0.64), "chest"),
        J(f"hand_{side}", (0.23 * s, -0.06, 0.64), (0.29 * s, -0.14, 0.44), f"arm_{side}"),
    ]
rig = C.build_armature("Wisp", joints, body)
for obj, bone in acc:
    C.attach(obj, rig, bone)

C.pose_action(rig, "Idle", [
    (0, {"core": {"loc": (0, 0, 0)}, "tail_1": (0, 0, 10), "tail_2": (0, 0, -14), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
    (40, {"core": {"loc": (0, 0.03, 0)}, "tail_1": (6, 0, -10), "tail_2": (8, 0, 14), "arm_L": (-8, 0, 0), "arm_R": (6, 0, 0)}),
    (80, {"core": {"loc": (0, 0, 0)}, "tail_1": (0, 0, 10), "tail_2": (0, 0, -14), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
])
# Glide: compress before accelerating, tail trails behind.
C.pose_action(rig, "Move", [
    (0, {"core": {"scale": (1.05, 0.92, 1.05)}, "chest": (-10, 0, 0), "tail_1": (-25, 0, 0), "tail_2": (-20, 0, 0)}),
    (15, {"core": {"scale": (0.97, 1.05, 0.97)}, "chest": (-18, 0, 0), "tail_1": (-35, 0, 8), "tail_2": (-30, 0, -8)}),
    (30, {"core": {"scale": (1.05, 0.92, 1.05)}, "chest": (-10, 0, 0), "tail_1": (-25, 0, 0), "tail_2": (-20, 0, 0)}),
])
C.pose_action(rig, "Attack", [
    (0, {"core": {"scale": (1, 1, 1)}, "chest": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
    (14, {"core": {"scale": (1.1, 0.85, 1.1)}, "chest": (12, 0, 0), "arm_L": (40, 0, 30), "arm_R": (40, 0, -30)}),
    (19, {"core": {"scale": (0.95, 1.08, 0.95)}, "chest": (-15, 0, 0), "arm_L": (-70, 0, 0), "arm_R": (-70, 0, 0)}),
    (30, {"core": {"scale": (1, 1, 1)}, "chest": (0, 0, 0), "arm_L": (0, 0, 0), "arm_R": (0, 0, 0)}),
])
C.pose_action(rig, "Hit", [
    (0, {"chest": (0, 0, 0), "head": (0, 0, 0)}),
    (3, {"chest": (18, 0, 6), "head": (14, 0, 0)}),
    (14, {"chest": (0, 0, 0), "head": (0, 0, 0)}),
])
# Ink flows harmlessly away.
C.pose_action(rig, "Dispel", [
    (0, {"core": {"loc": (0, 0, 0), "scale": (1, 1, 1)}}),
    (30, {"core": {"loc": (0, -0.25, 0), "scale": (0.05, 0.05, 0.05)}}),
])

out = os.path.join(ROOT, "public", "assets", "creatures", "ink_wisp.glb")
C.export_glb(out)
print(f"ink_wisp: {C.triangle_count()} tris -> {out}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", "ink_wisp"), 1.1)
