"""
Ward Warden (§14A.13, MD-11): 3.6 m majestic floating protector of carved pale stone held together by
gold-blue ward energy. Broad torso, long articulated arms, a crown-like halo ring, a faceless polished
mask with a narrow warm light seam, and a fractured celestial core (not an eye).

Exported as named, pivoted parts so the game drives rise, attacks, plate release, repair and bow:
  Torso (pivot at chest) ▸ Head, Seam, Core, Halo, Arm_L, Arm_R

    blender --background --python assets-src/scripts/creatures/ward_warden.py -- [--preview]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import creature as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

C.reset_scene()
E, K = C.ellipsoid, C.capsule

stone = C.make_material("Stone", color="#e6e0d3", roughness=0.55)
mask = C.make_material("Mask", color="#f2efe8", roughness=0.22)
brass = C.make_material("Brass", color="#c49a4f", roughness=0.3, metallic=1.0)
energy = C.make_material("Energy", color="#ffe3a0", emission="#ffb640", emission_strength=6)

torso = C.part(
    "Torso",
    [
        E((0, 0, 2.0), (0.62, 0.4, 0.58)),
        E((0, 0.14, 2.28), (0.55, 0.3, 0.34)),
        E((0, 0, 2.54), (0.3, 0.26, 0.1)),
        K((0, 0, 1.62), (0, 0.02, 1.15), 0.32),
        E((0, 0.02, 0.98), (0.36, 0.3, 0.32)),
        K((0, 0.02, 0.8), (0, 0.08, 0.22), 0.16),
        E((0.62, 0, 2.3), (0.3, 0.3, 0.22), rotation=(0, -20, 0)),
        E((-0.62, 0, 2.3), (0.3, 0.3, 0.22), rotation=(0, 20, 0)),
    ],
    pivot=(0, 0, 1.8),
    material=stone,
    voxel=0.018,
    target_tris=14000,
)
head = C.part(
    "Head",
    [
        E((0, 0, 3.02), (0.23, 0.26, 0.31)),
        E((0, -0.04, 2.82), (0.17, 0.19, 0.13)),
        E((0, 0.06, 3.3), (0.07, 0.2, 0.1)),
    ],
    pivot=(0, 0, 2.7),
    material=mask,
    voxel=0.012,
    target_tris=6000,
)
seam = C.part("Seam", [C.capsule((-0.16, -0.235, 3.02), (0.16, -0.235, 3.02), 0.018)], pivot=(0, -0.235, 3.02), material=energy, voxel=0.006, target_tris=600)
core = C.part(
    "Core",
    [E((0, -0.36, 2.02), (0.2, 0.12, 0.22)), E((0.08, -0.4, 2.08), (0.08, 0.06, 0.1)), E((-0.07, -0.4, 1.95), (0.07, 0.05, 0.09))],
    pivot=(0, -0.36, 2.02),
    material=energy,
    voxel=0.01,
    target_tris=2500,
)
arms = []
for side, s in (("L", 1), ("R", -1)):
    arm = C.part(
        f"Arm_{side}",
        [
            K((0.78 * s, 0, 2.3), (0.95 * s, -0.04, 1.62), 0.17),
            K((0.95 * s, -0.04, 1.62), (1.0 * s, -0.14, 1.02), 0.15),
            E((1.0 * s, -0.17, 0.86), (0.17, 0.15, 0.21)),
            E((1.0 * s, -0.25, 0.74), (0.13, 0.06, 0.1)),
        ],
        pivot=(0.8 * s, 0, 2.3),
        material=stone,
        voxel=0.014,
        target_tris=6000,
    )
    bracer = C.torus(f"Bracer_{side}", (0.985 * s, -0.09, 1.3), 0.17, 0.035, brass, rotation=(8, 4 * s, 0))
    C.parent_keep(bracer, arm)
    arms.append(arm)

halo = C.torus("Halo", (0, 0.36, 3.05), 0.72, 0.04, brass, rotation=(90, 0, 0), segments=(72, 12))
for i in range(8):
    import math

    a = i / 8 * math.tau
    star = C.part(f"Star_{i}", [E((math.cos(a) * 0.72, 0.36, 3.05 + math.sin(a) * 0.72), (0.06, 0.03, 0.06))], pivot=(math.cos(a) * 0.72, 0.36, 3.05 + math.sin(a) * 0.72), material=energy, voxel=0.008, target_tris=200)
    C.parent_keep(star, halo)

# Ward energy binding the carved segments, and a brass ward diagram around the core.
bands = [
    C.torus("Band_Waist", (0, 0.01, 1.42), 0.335, 0.03, energy),
    C.torus("Band_Hips", (0, 0.02, 1.12), 0.36, 0.025, energy),
    C.torus("Band_Neck", (0, 0, 2.64), 0.2, 0.025, energy),
    C.torus("CoreRing", (0, -0.39, 2.02), 0.27, 0.025, brass, rotation=(90, 0, 0)),
    C.torus("CoreRing2", (0, -0.4, 2.02), 0.33, 0.012, brass, rotation=(90, 0, 0), segments=(48, 8)),
]
for side, s_ in (("L", 1), ("R", -1)):
    bands.append(C.torus(f"Band_Shoulder_{side}", (0.78 * s_, 0, 2.3), 0.19, 0.022, energy, rotation=(0, 90, 0)))

for child in (head, seam, core, halo, *arms, *bands):
    C.parent_keep(child, torso)

out = os.path.join(ROOT, "public", "assets", "creatures", "ward_warden.glb")
C.export_static(out)
print(f"ward_warden: {C.triangle_count()} tris -> {out}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", "ward_warden"), 3.6)
