"""
Animated armour guardian: 2.05 m original ceremonial academy armour — brushed steel
plates (sabatons, greaves, knee cops, cuisses, tassets, cuirass, gorget, pauldrons, couters,
vambraces, gauntlets), engraved brass edging, a quilted navy skirt, a moon-shaped chest ward and a
closed, non-human visor with gentle blue light (no skull imagery). No weapon.

Realism pass 2: real plate construction (turned/elliptical shells) instead of blended volumes.
Exported as pivoted parts driven by the game: Legs (static) > Torso (pivot at hips) > Arm_L, Arm_R.

    blender --background --python assets-src/scripts/creatures/armour_guardian.py -- [--preview]
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import bpy  # noqa: E402
import creature as C  # noqa: E402
import kitgeo as K  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

C.reset_scene()
lib = K.lib()
steel = K.library_material("ArmourSteel", "#9aa2ad", 0.4, metallic=1.0)
brass = lib["agedBrass"]
cloth = lib["navyCloth"]
visor = K.library_material("Visor", "#cfe6ff", 0.3, emission="#6fb6ff", strength=5)


def along(a, b):
    """Matrix placing a lathe's +Z axis from point a towards point b."""
    a, b = Vector(a), Vector(b)
    d = b - a
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    return Matrix.Translation(a) @ rot, d.length


def shell(mb, profile, material, matrix, rx=1.0, ry=1.0, segments=20, cap=True):
    """Elliptical turned plate: profile (radius, z) scaled by rx/ry across the section."""
    K.lathe(mb, profile, material, segments=segments, cap_top=cap, matrix=matrix @ Matrix.Diagonal((rx, ry, 1, 1)))


def limb(mb, a, b, profile_u, material, rx=1.0, ry=1.0, segments=16):
    """A plate along a limb from a to b; profile given as (radius, u in 0..1)."""
    m, length = along(a, b)
    shell(mb, [(r, u * length) for r, u in profile_u], material, m, rx, ry, segments, cap=False)


def disc(mb, centre, normal, radius, material, thickness=0.006, segments=16):
    """A small fan plate (knee and elbow wings)."""
    m, _ = along(centre, Vector(centre) + Vector(normal))
    K.lathe(mb, [(0.0, 0.0), (radius, 0.0), (radius * 0.96, thickness), (0.0, thickness * 1.6)], material, segments=segments, cap_top=False, matrix=m)


def finish(mb, name, pivot):
    obj = mb.finish(name)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(38))
    C.set_origin(obj, pivot)
    return obj


# ---------- Legs (static): sabatons, greaves, knee cops, cuisses, skirt and tassets ----------
mb = K.MeshBuilder([steel, brass, cloth])
for s in (1, -1):
    x = 0.17 * s
    # Sabaton: a long low shell, toe forward (-Y), built from overlapping lames.
    for k in range(4):
        y = -0.02 - k * 0.045
        shell(mb, [(0.0, 0.0), (0.07, 0.0), (0.072, 0.05), (0.06, 0.085 - k * 0.012), (0.0, 0.1 - k * 0.012)], steel, Matrix.Translation((x, y, 0.0)), rx=1.0, ry=0.9, segments=16)
    # Greave: calf swell, ankle taper.
    limb(mb, (x, 0.0, 0.1), (x, -0.01, 0.52), [(0.06, 0.0), (0.072, 0.15), (0.084, 0.55), (0.078, 0.85), (0.074, 1.0)], steel, ry=0.92)
    # Knee cop with its side fan.
    shell(mb, [(0.0, 0.0), (0.085, 0.0), (0.095, 0.05), (0.08, 0.1), (0.0, 0.13)], steel, Matrix.Translation((x, -0.03, 0.5)) @ Matrix.Rotation(math.radians(-80), 4, "X"), rx=1.0, ry=1.1)
    disc(mb, (x + 0.07 * s, -0.04, 0.56), (s, -0.3, 0), 0.07, steel)
    # Cuisse up the thigh, with a brass edge at the top.
    limb(mb, (x, -0.01, 0.6), (x * 0.9, 0.0, 0.98), [(0.085, 0.0), (0.098, 0.4), (0.108, 1.0)], steel, ry=0.95)
    limb(mb, (x * 0.9, 0.0, 0.97), (x * 0.9, 0.0, 0.99), [(0.111, 0.0), (0.111, 1.0)], brass)
# Quilted skirt and three flared steel tassets (fauld) over it.
shell(mb, [(0.27, 0.78), (0.29, 0.9), (0.27, 1.02), (0.25, 1.1)], cloth, Matrix.Identity(4), rx=1.0, ry=0.8, segments=28, cap=False)
for k, z in enumerate((0.94, 1.0, 1.06)):
    r = 0.3 - k * 0.012
    shell(mb, [(r + 0.02, z - 0.07), (r, z)], steel, Matrix.Identity(4), rx=1.0, ry=0.8, segments=28, cap=False)
    shell(mb, [(r + 0.022, z - 0.075), (r + 0.024, z - 0.068)], brass, Matrix.Identity(4), rx=1.0, ry=0.8, segments=28, cap=False)
legs = finish(mb, "Legs", (0, 0, 0))

# ---------- Torso (pivot at hips): cuirass, gorget, helm, pauldrons, chest ward ----------
mb = K.MeshBuilder([steel, brass, visor])
cuirass = [(0.25, 1.08), (0.265, 1.16), (0.3, 1.3), (0.335, 1.45), (0.34, 1.55), (0.31, 1.65), (0.25, 1.71), (0.16, 1.75)]
shell(mb, cuirass, steel, Matrix.Identity(4), rx=1.0, ry=0.72, segments=32, cap=False)
# Central ridge (the breastplate's medial line) and brass edging.
for z0, z1 in ((1.1, 1.7),):
    for t in range(12):
        za = z0 + (z1 - z0) * t / 12
        zb = z0 + (z1 - z0) * (t + 1) / 12
        ra = next(r for r, z in reversed(cuirass) if z <= za + 1e-6) if za >= cuirass[0][1] else cuirass[0][0]
        y = -ra * 0.72 - 0.012
        K.box_faces(mb, (-0.012, y - 0.008, za), (0.012, y + 0.01, zb), steel)
shell(mb, [(0.255, 1.08), (0.26, 1.105)], brass, Matrix.Identity(4), rx=1.0, ry=0.73, segments=32, cap=False)
# Gorget and helm.
shell(mb, [(0.17, 1.72), (0.15, 1.78), (0.13, 1.83)], steel, Matrix.Identity(4), rx=1.0, ry=0.95, segments=24, cap=False)
shell(mb, [(0.175, 1.725), (0.178, 1.745)], brass, Matrix.Identity(4), rx=1.0, ry=0.95, segments=24, cap=False)
helm = [(0.13, 1.82), (0.152, 1.86), (0.162, 1.93), (0.158, 2.0), (0.14, 2.05), (0.1, 2.09), (0.05, 2.11), (0.0, 2.115)]
shell(mb, helm, steel, Matrix.Identity(4), rx=0.92, ry=1.08, segments=28, cap=False)
# Visor ridge: a prow down the face, and the brass crest over the top.
for k in range(10):
    a0 = math.radians(-70 + 14 * k)
    a1 = math.radians(-70 + 14 * (k + 1))
    p0 = Vector((0, math.sin(a0) * 0.17, 1.95 + math.cos(a0) * 0.16))
    p1 = Vector((0, math.sin(a1) * 0.17, 1.95 + math.cos(a1) * 0.16))
    K.box_faces(mb, (-0.008, min(p0.y, p1.y) - 0.004, min(p0.z, p1.z)), (0.008, max(p0.y, p1.y) + 0.004, max(p0.z, p1.z) + 0.03), brass)
# Chest ward (moon) in brass with a glowing inlay.
ward_m = Matrix.Translation((0, -0.245, 1.5)) @ Matrix.Rotation(math.radians(90), 4, "X")
K.lathe(mb, [(0.08, 0.0), (0.105, 0.0), (0.105, 0.01), (0.08, 0.012)], brass, segments=32, cap_top=False, matrix=ward_m)
torso = finish(mb, "Torso", (0, 0, 1.05))
ward = C.torus("ChestWard", (0, -0.25, 1.5), 0.09, 0.012, visor, rotation=(90, 0, 0), segments=(40, 8))
slit = C.part("VisorSlit", [C.capsule((-0.075, -0.168, 1.94), (0.075, -0.168, 1.94), 0.011)], pivot=(0, -0.168, 1.94), material=visor, voxel=0.005, target_tris=500)
for child in (ward, slit):
    C.parent_keep(child, torso)

# Pauldrons: layered shoulder shells, each lame a little lower and wider.
mb = K.MeshBuilder([steel, brass])
for s in (1, -1):
    for k in range(3):
        c = (0.36 * s + 0.03 * s * k, 0.0, 1.66 - k * 0.06)
        m = Matrix.Translation(c) @ Matrix.Rotation(math.radians(-28 * s), 4, "Y")
        r = 0.16 + k * 0.012
        shell(mb, [(0.0, 0.1), (r * 0.6, 0.085), (r * 0.92, 0.045), (r, 0.0)], steel if k < 2 else brass, m, rx=1.0, ry=1.25, segments=20, cap=False)
pauldrons = finish(mb, "Pauldrons", (0, 0, 1.05))
C.parent_keep(pauldrons, torso)

# ---------- Arms (pivot at the shoulder): rerebrace, couter, vambrace, gauntlet ----------
arms = []
for side, s in (("L", 1), ("R", -1)):
    mb = K.MeshBuilder([steel, brass])
    sh = (0.42 * s, 0.0, 1.62)
    el = (0.47 * s, -0.03, 1.28)
    wr = (0.49 * s, -0.08, 0.96)
    limb(mb, sh, el, [(0.072, 0.0), (0.078, 0.5), (0.07, 1.0)], steel)
    shell(mb, [(0.0, 0.0), (0.078, 0.0), (0.085, 0.045), (0.07, 0.09), (0.0, 0.11)], steel, Matrix.Translation((el[0], el[1] + 0.03, el[2])) @ Matrix.Rotation(math.radians(80), 4, "X"))
    disc(mb, (el[0] + 0.06 * s, el[1] + 0.02, el[2]), (s, 0.4, 0), 0.06, steel)
    limb(mb, el, wr, [(0.068, 0.0), (0.072, 0.35), (0.06, 1.0)], steel)
    limb(mb, wr, (wr[0], wr[1] - 0.004, wr[2] + 0.025), [(0.075, 0.0), (0.075, 1.0)], brass)
    # Gauntlet: cuff flare, back-of-hand plate and curled finger lames.
    limb(mb, wr, (wr[0] + 0.01 * s, wr[1] - 0.02, wr[2] - 0.1), [(0.08, 0.0), (0.062, 0.6), (0.055, 1.0)], steel, ry=0.8)
    for k in range(4):
        z = wr[2] - 0.12 - k * 0.03
        y = wr[1] - 0.03 - k * 0.012
        K.box_faces(mb, (wr[0] - 0.045, y - 0.02, z - 0.028), (wr[0] + 0.045, y + 0.035, z), steel)
    arm = finish(mb, f"Arm_{side}", sh)
    C.parent_keep(arm, torso)
    arms.append(arm)

C.parent_keep(torso, legs)

out = os.path.join(ROOT, "public", "assets", "creatures", "armour_guardian.glb")
K.export_kit(out)
print(f"armour_guardian: {C.triangle_count()} tris -> {out}")
if "--preview" in args:
    C.render_previews(os.path.join(ROOT, "assets-src", "previews", "armour_guardian"), 2.05)
