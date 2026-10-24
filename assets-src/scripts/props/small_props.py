"""
Small hero props for targets and collectibles (realism pass 2). Imported by kit_props.py.

Glow materials use the per-instance names the game pulses: 'Energy' (gold), 'Crystal' (blue).
"""
import math

import bpy
import kitgeo as K
from mathutils import Vector


def _smooth(obj, degrees=35):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(degrees))
    return obj


def _sheet(mb, lib, w, h, curl, twist, material, text=True, seed=1, gilt=None):
    """A slightly curled sheet in the XZ plane (faces -Y), origin at its centre. Two-sided material."""
    nx, nz = 6, 8
    pts = {}
    for i in range(nx + 1):
        for j in range(nz + 1):
            u = i / nx - 0.5
            v = j / nz - 0.5
            x = u * w
            z = v * h
            # Curl along the width and a corner twist so it reads as paper, not a card.
            y = curl * (u * 2) ** 2 + twist * u * v * 4
            pts[i, j] = (x, y, z)
    for i in range(nx):
        for j in range(nz):
            quad = [pts[i, j], pts[i + 1, j], pts[i + 1, j + 1], pts[i, j + 1]]
            mb.face(quad, material, None, (0, -1, 0))
    if text:
        rnd = K.rng(seed)
        line_h = h * 0.035
        z = h * 0.36
        while z > -h * 0.38:
            length = w * (0.5 + rnd.random() * 0.25)
            x0 = -w * 0.36
            if rnd.random() < 0.1:
                z -= line_h * 1.8
                continue
            # Split each stroke along the curl so it never dips behind the paper.
            pieces = 6
            for k in range(pieces):
                xa = x0 + length * k / pieces
                xb = x0 + length * (k + 1) / pieces
                quad = []
                for x, dz in ((xa, -line_h * 0.35), (xb, -line_h * 0.35), (xb, 0), (xa, 0)):
                    u = x / w
                    v = (z + dz) / h
                    y = curl * (u * 2) ** 2 + twist * u * v * 4 - 0.0015
                    quad.append((x, y, z + dz))
                mb.face(quad, lib["ink"], None, (0, -1, 0))
            z -= line_h * 1.55
    if gilt:
        # Gold-leaf edge along the border.
        for i in range(nx):
            for j in (0, nz):
                a, b = pts[i, j], pts[i + 1, j]
                d = -0.006 if j == 0 else 0.006
                mb.face([a, b, (b[0], b[1] - 0.0005, b[2] - d), (a[0], a[1] - 0.0005, a[2] - d)], gilt, None, (0, -1, 0))
        for j in range(nz):
            for i in (0, nx):
                a, b = pts[i, j], pts[i, j + 1]
                d = -0.006 if i == 0 else 0.006
                mb.face([a, b, (b[0] - d, b[1] - 0.0005, b[2]), (a[0] - d, a[1] - 0.0005, a[2])], gilt, None, (0, -1, 0))


def page_loose(name):
    lib = K.lib()
    mb = K.MeshBuilder([lib["parchment"], lib["ink"]])
    _sheet(mb, lib, 0.3, 0.4, 0.03, 0.02, lib["parchment"], seed=5)
    _smooth(mb.finish(name))


def star_page(name, glow_name="Energy"):
    lib = K.lib()
    glow = K.library_material(glow_name, "#ffe3a0", 0.3, emission="#ffb640", strength=3)
    mb = K.MeshBuilder([lib["parchment"], lib["ink"], lib["agedBrass"], glow])
    _sheet(mb, lib, 0.24, 0.32, 0.02, 0.015, lib["parchment"], seed=9, gilt=lib["agedBrass"])
    # A wax-and-gold star seal in the lower half.
    cx, cz = 0.0, -0.07
    points = []
    for i in range(10):
        a = math.pi / 2 + math.tau * i / 10
        r = 0.04 if i % 2 == 0 else 0.017
        points.append((cx + math.cos(a) * r, -0.008, cz + math.sin(a) * r))
    centre = (cx, -0.009, cz)
    for i in range(10):
        mb.face([centre, points[i], points[(i + 1) % 10]], glow, None, (0, -1, 0))
    # Brass ring around the seal (lathe axis turned from +Z to face the viewer, -Y).
    K.lathe(mb, [(0.045, 0.0), (0.05, 0.0), (0.05, 0.004)], lib["agedBrass"], segments=24, cap_top=False, matrix=K.Matrix.Translation((cx, -0.006, cz)) @ K.Matrix.Rotation(math.pi / 2, 4, "X"))
    _smooth(mb.finish(name))


def warden_plate(name):
    """Carved limestone armour plate of the Ward Warden: a curved shell with a moulded rim and a glowing motif."""
    lib = K.lib()
    glow = K.library_material("Energy", "#ffe3a0", 0.3, emission="#ffb640", strength=3)
    stone = K.library_material("wardStone", "#e2dccd", 0.6)
    mb = K.MeshBuilder([stone, lib["agedBrass"], glow])
    rx, rz, depth = 0.38, 0.3, 0.12
    nu, nv = 16, 10
    grid = {}
    for i in range(nu + 1):
        for j in range(nv + 1):
            u = -1 + 2 * i / nu
            v = -1 + 2 * j / nv
            # Rounded-rectangle outline with a domed front.
            x = u * rx
            z = v * rz
            d = 1 - min(1.0, (abs(u) ** 2.4 + abs(v) ** 2.4))
            y = -depth * d ** 0.6
            grid[i, j] = (x, y, z)
    for i in range(nu):
        for j in range(nv):
            mb.face([grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]], stone, None, (0, -1, 0))
    # Back face (flat) so the plate reads solid when it turns.
    mb.face([(-rx, 0.0, -rz), (-rx, 0.0, rz), (rx, 0.0, rz), (rx, 0.0, -rz)], stone, None, (0, 1, 0))
    # Brass edge band.
    for i in range(nu):
        for j in (0, nv):
            a, b = grid[i, j], grid[i + 1, j]
            mb.face([a, b, (b[0], b[1] + 0.03, b[2]), (a[0], a[1] + 0.03, a[2])], lib["agedBrass"], None, (0, 0, -1 if j == 0 else 1))
    for j in range(nv):
        for i in (0, nu):
            a, b = grid[i, j], grid[i, j + 1]
            mb.face([a, b, (b[0], b[1] + 0.03, b[2]), (a[0], a[1] + 0.03, a[2])], lib["agedBrass"], None, (-1 if i == 0 else 1, 0, 0))
    # Carved star motif: a raised glowing ring and a four-point star at the crown of the dome.
    top = Vector(grid[nu // 2, nv // 2]) + Vector((0, -0.004, 0))
    ring_pts = 40
    for k in range(ring_pts):
        a0 = math.tau * k / ring_pts
        a1 = math.tau * (k + 1) / ring_pts
        pts = []
        for a, r in ((a0, 0.1), (a1, 0.1), (a1, 0.115), (a0, 0.115)):
            pts.append((top.x + math.cos(a) * r, top.y + 0.02 * r, top.z + math.sin(a) * r))
        mb.face(pts, glow, None, (0, -1, 0))
    star = []
    for k in range(8):
        a = math.pi / 2 + math.tau * k / 8
        r = 0.075 if k % 2 == 0 else 0.022
        star.append((top.x + math.cos(a) * r, top.y - 0.002, top.z + math.sin(a) * r))
    for k in range(8):
        mb.face([tuple(top), star[k], star[(k + 1) % 8]], glow, None, (0, -1, 0))
    return _smooth(mb.finish(name), 30)


def crystal_cluster(name):
    """Glowing quartz cluster in a brass claw cradle on a carved corbel (gate crystals, focus pedestal).

    Nodes: 'Crystals' (the game spins it) and 'Cradle'. Crystal material 'Crystal' glows per instance."""
    lib = K.lib()
    crystal = K.library_material("Crystal", "#cfe8ff", 0.1, emission="#5aa8ff", strength=2)
    rnd = K.rng(42)
    mb = K.MeshBuilder([crystal])
    # Hexagonal prisms with pyramidal tips; faceted on purpose (real quartz has flat faces).
    specs = [(0.0, 0.0, 0.0, 0.07, 0.42, 0.13)]
    for k in range(6):
        a = math.tau * k / 6 + rnd.random() * 0.4
        specs.append((math.cos(a) * 0.06, math.sin(a) * 0.06, 0.25 + rnd.random() * 0.25, 0.028 + rnd.random() * 0.025, 0.14 + rnd.random() * 0.16, 0.06 + rnd.random() * 0.04))
    for x, y, tilt, r, h, tip in specs:
        a = math.atan2(y, x)
        mat = K.Matrix.Translation((x, y, -0.26)) @ K.Matrix.Rotation(a, 4, "Z") @ K.Matrix.Rotation(tilt, 4, "Y")
        K.lathe(mb, [(r * 0.8, 0.0), (r, 0.03), (r, h), (0.0, h + tip)], crystal, segments=6, cap_top=False, matrix=mat)
    crystals = mb.finish("CrystalMesh")
    mb = K.MeshBuilder([lib["agedBrass"], lib["academyStoneDark"]])
    brass = lib["agedBrass"]
    # Cradle ring and three curling claws.
    K.lathe(mb, [(0.1, -0.29), (0.13, -0.28), (0.13, -0.24), (0.1, -0.23)], brass, segments=24, cap_top=False)
    for k in range(3):
        a = math.tau * k / 3
        prev = None
        for i in range(8):
            t = i / 7
            rr = 0.13 - 0.02 * t + 0.03 * math.sin(t * math.pi)
            z = -0.24 + t * 0.2
            p = Vector((math.cos(a) * rr, math.sin(a) * rr, z))
            if prev is not None:
                side = Vector((-math.sin(a), math.cos(a), 0)) * 0.012
                out = Vector((math.cos(a), math.sin(a), 0)) * 0.008
                q = [prev - side + out, prev + side + out, p + side + out, p - side + out]
                mb.face([tuple(v) for v in q], brass, None, tuple(out))
                q = [prev - side - out, p - side - out, p + side - out, prev + side - out]
                mb.face([tuple(v) for v in q], brass, None, tuple(-out))
            prev = p
    # Carved corbel below the cradle.
    K.lathe(mb, [(0.0, -0.62), (0.06, -0.62), (0.1, -0.56), (0.16, -0.44), (0.18, -0.36), (0.19, -0.33), (0.17, -0.29), (0.0, -0.29)], lib["academyStoneDark"], segments=16, cap_top=True)
    cradle = mb.finish("CradleMesh")
    for obj, node in ((crystals, "Crystals"), (cradle, "Cradle")):
        empty = bpy.data.objects.new(node, None)
        bpy.context.collection.objects.link(empty)
        obj.parent = empty
    return crystals


FRAME_PROFILE = [(0.0, -0.012), (0.012, -0.03), (0.03, -0.055), (0.05, -0.06), (0.062, -0.075), (0.075, -0.07), (0.09, -0.05), (0.11, -0.062), (0.13, -0.05), (0.145, -0.028), (0.15, 0.0)]


def picture_frame(name, width, height):
    """Moulded gilt frame (profile swept round the opening) with a canvas named 'portraitCanvas'.

    Origin at the canvas centre on the wall plane; the frame stands proud towards -Y (the viewer)."""
    lib = K.lib()
    gilt = lib["agedBrass"]
    mb = K.MeshBuilder([gilt])
    hw, hh = width / 2, height / 2
    rings = []
    for off, depth in FRAME_PROFILE:
        rings.append([(-hw - off, depth, -hh - off), (hw + off, depth, -hh - off), (hw + off, depth, hh + off), (-hw - off, depth, hh + off)])
    for a, b in zip(rings, rings[1:]):
        for i in range(4):
            j = (i + 1) % 4
            pts = [a[i], a[j], b[j], b[i]]
            mid = sum((Vector(p) for p in pts), Vector()) / 4
            mb.face(pts, gilt, None, (mid.x * 0.2, -1.0, mid.z * 0.2))
    # Ornament: raised gilt bosses at the corners and mid-sides.
    for x, z in ((-1, -1), (1, -1), (1, 1), (-1, 1), (0, -1), (0, 1), (-1, 0), (1, 0)):
        cx = x * (hw + 0.075)
        cz = z * (hh + 0.075)
        K.lathe(mb, [(0.035, 0.0), (0.03, 0.012), (0.018, 0.02), (0.0, 0.023)], gilt, segments=10, cap_top=False, matrix=K.Matrix.Translation((cx, -0.07, cz)) @ K.Matrix.Rotation(math.pi / 2, 4, "X"))
    frame = _smooth(mb.finish(name + "_frame"), 40)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -0.012, 0), rotation=(math.pi / 2, 0, 0))
    canvas = bpy.context.active_object
    canvas.name = name + "_canvas"
    canvas.scale = (width, height, 1)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    canvas.data.materials.append(K.library_material("portraitCanvas", "#806040", 0.5))
    return frame
