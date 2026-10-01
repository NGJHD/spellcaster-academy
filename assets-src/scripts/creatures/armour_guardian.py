"""
Animated armour guardian (§14A.12, MD-10): 2.05 m original ceremonial academy armour — darkened steel,
engraved brass trim, quilted navy under-layers, a moon-shaped chest ward, and a closed, non-human
visor with gentle blue light (no skull imagery). No weapon.

Exported as pivoted parts driven by the game: Legs (static) ▸ Torso (pivot at hips) ▸ Arm_L, Arm_R.

    blender --background --python assets-src/scripts/creatures/armour_guardian.py -- [--preview]
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import creature as C  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

C.reset_scene()
E, K = C.ellipsoid, C.capsule

steel = C.make_material("Steel", color="#4a5262", roughness=0.32, metallic=1.0)
brass = C.make_material("Brass", color="#c49a4f", roughness=0.3, metallic=1.0)
cloth = C.make_material("Cloth", color="#22355f", roughness=0.9)
visor = C.make_material("Visor", color="#cfe6ff", emission="#6fb6ff", emission_strength=5)

legs = C.part(
    "Legs",
    [
        K((0.15, 0, 0.98), (0.17, -0.02, 0.55), 0.1),
        K((-0.15, 0, 0.98), (-0.17, -0.02, 0.55), 0.1),
        K((0.17, -0.02, 0.55), (0.17, 0.0, 0.12), 0.085),
        K((-0.17, -0.02, 0.55), (-0.17, 0.0, 0.12), 0.085),
        E((0.17, -0.08, 0.05), (0.09, 0.17, 0.06)),
        E((-0.17, -0.08, 0.05), (0.09, 0.17, 0.06)),
        E((0.17, -0.05, 0.56), (0.1, 0.08, 0.075)),
        E((-0.17, -0.05, 0.56), (0.1, 0.08, 0.075)),
    ],
    pivot=(0, 0, 0),
    material=steel,
    voxel=0.012,
    target_tris=6000,
)
skirt = C.part("Skirt", [E((0, 0.0, 1.0), (0.3, 0.24, 0.2)), E((0, 0.0, 0.86), (0.33, 0.27, 0.12))], pivot=(0, 0, 1.05), material=cloth, voxel=0.012, target_tris=3000)
torso = C.part(
    "Torso",
    [
        E((0, 0.0, 1.45), (0.33, 0.23, 0.3)),
        E((0, -0.04, 1.52), (0.3, 0.2, 0.22)),
        K((0, 0.0, 1.2), (0, 0.0, 1.08), 0.24),
        E((0, 0.0, 1.78), (0.12, 0.11, 0.06)),
        E((0, -0.01, 1.92), (0.155, 0.175, 0.18)),
        E((0, 0.03, 2.06), (0.05, 0.16, 0.07)),
        E((0.38, 0.0, 1.66), (0.2, 0.2, 0.13), rotation=(0, -25, 0)),
        E((-0.38, 0.0, 1.66), (0.2, 0.2, 0.13), rotation=(0, 25, 0)),
    ],
    pivot=(0, 0, 1.05),
    material=steel,
    voxel=0.011,
    target_tris=9000,
)
slit = C.part("VisorSlit", [C.capsule((-0.08, -0.165, 1.93), (0.08, -0.165, 1.93), 0.013)], pivot=(0, -0.165, 1.93), material=visor, voxel=0.005, target_tris=500)
ward = C.torus("ChestWard", (0, -0.235, 1.5), 0.09, 0.016, visor, rotation=(90, 0, 0), segments=(40, 8))
trims = [
    C.torus("Trim_Neck", (0, 0, 1.76), 0.14, 0.018, brass),
    C.torus("Trim_Waist", (0, 0, 1.17), 0.25, 0.022, brass),
    C.torus("Trim_Crest", (0, 0.03, 2.03), 0.12, 0.012, brass, rotation=(0, 90, 0), segments=(32, 8)),
]
arms = []
for side, s in (("L", 1), ("R", -1)):
    arm = C.part(
        f"Arm_{side}",
        [
            K((0.42 * s, 0, 1.62), (0.47 * s, -0.02, 1.28), 0.085),
            E((0.47 * s, -0.03, 1.27), (0.09, 0.09, 0.08)),
            K((0.47 * s, -0.03, 1.27), (0.49 * s, -0.08, 0.95), 0.075),
            E((0.5 * s, -0.1, 0.86), (0.085, 0.09, 0.1)),
        ],
        pivot=(0.42 * s, 0, 1.62),
        material=steel,
        voxel=0.01,
        target_tris=3500,
    )
    cuff = C.torus(f"Cuff_{side}", (0.49 * s, -0.08, 0.97), 0.085, 0.016, brass)
    C.parent_keep(cuff, arm)
    arms.append(arm)

for child in (slit, ward, *trims, *arms):
    C.parent_keep(child, torso)
C.parent_keep(torso, legs)
C.parent_keep(skirt, legs)

out = os.path.join(ROOT, "public", "assets", "creatures", "armour_guardian.glb")
C.export_static(out)
print(f"armour_guardian: {C.triangle_count()} tris -> {out}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", "armour_guardian"), 2.05)
