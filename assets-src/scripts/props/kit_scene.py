"""
Scenery kit props that replace code-built shapes (owner, 2026-10-24: "go back through the code … things
that are hand drawn from code"). Same conventions as kit_props.py: materials named after the runtime
library (kitgeo.lib), metre UVs, so the game dresses them with its shared CC0 PBR textures.

    blender --background --python assets-src/scripts/props/kit_scene.py -- [ids…] [--preview]

Outputs public/assets/kit/<id>.glb:

  mosaic_clue           the library's clue mosaic (Flux painting, mosaic.py) in a moulded brass frame
  grimoire_chain        a loop of forged chain links, 0.62 m radius, round the Great Grimoire
  orrery_stand          cast-iron pillar on three scrolled feet with a brass collar (top at the origin)
  orrery_sun            gilded glowing sun with a brass equator band
  orrery_arm_1..3       a brass orbit ring (1, 1.6, 2.2 m) with its spoke and planet
  practice_wand         a turned oak practice wand with a brass ferrule, 0.42 m
  crystal_pedestal      carved stone pedestal crowned with a glowing quartz cluster
  vine_deck             one 2 m section of the greenhouse vine bridge: twisted stems, ties, leafy rails
  sky_lantern           a glowing paper sky lantern on bamboo ribs with a brass rim and burner
  round_tower           the dormitory tower: battered plinth, string courses, lit windows, a doorway on
                        -X, corbelled eaves and a conical slate roof with a finial (31 m)
  belfry_roof           a hipped slate roof with stone eaves, lead ridge and a weathervane (8.6 x 3.8 m)
  iron_brazier          a wrought-iron fire bowl on three scrolled legs with glowing coals (1.2 m)
  quill_shard           the Quill shard: a cluster of sharp red crystal points
  lantern_post          a turned oak post on an iron foot plate (1.3 m)
  beach_shell           a giant scallop shell, ribbed and fluted (1.4 m)
  beach_boat            a small clinker-built rowing boat, painted blue, with thwarts (3.6 m)
  stepping_stone        a flat rounded boulder with a glowing written ring cut into its top
  iron_stake            a forged square stake with a ring eye (0.6 m)
  floating_rock         the craggy rock under a floating ruin, flat on top (21 x 18 x 14 m)
  gorge_slope           one side of the Bell Bridge gorge: a craggy rock slope falling in ledges to its foot (105 m)
  grass_tuft            a clump of wild grass blades in mixed greens and straw (0.5 m), scattered by instancing
  gorge_end             the gorge's far wall under the bank the bridge reaches: a craggy face slumping to scree (150 m)
  rock_spike            a jagged stalactite hanging under it (9 m)
  arch_broken_a/b       stone arches of voussoir blocks broken off part-way (6 m radius)
  column_hall, column_hall_broken, column_fallen, column_citadel, column_passage_tall/_short
                        fluted columns with moulded bases and capitals, whole or broken off
  beach_lantern         a hexagonal storm lantern on the sand: a globe glowing behind clear panes (1.3 m)
  inkwell               the library's overturned green glass inkwell, its cork and the spilled ink
  sealed_book_body      the book that seals the Unwriter: back board, gilt page block, banded spine (1.2 x 1.65 m)
  sealed_book_cover     its front cover: painted tooled leather (book_cover.py), brass corners, a glowing gold seal
  rune_ring             the Warden fight's ward rune: a brass band of glowing glyphs round a star
  grimoire_clasp        a clasp of the Great Grimoire: a brass-edged leather strap over the fore-edge, moonstone lock
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import bmesh  # noqa: E402
import bpy  # noqa: E402
import creature as C  # noqa: E402
import kitgeo as K  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "assets", "kit")
MOSAIC = os.path.join(ROOT, "assets-src", "concepts", "mosaic", "mosaic_521.png")
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def mat(name, colour="#ffffff", roughness=0.7, metallic=0.0, emission=None, strength=1.0):
    return K.library_material(name, colour, roughness, metallic, emission=emission, strength=strength)


def sweep(mb, path, radius, material, sides=6, closed=False):
    """A tube along a polyline (parallel-transported frames); `radius` may be a function of 0..1."""
    path = [Vector(p) for p in path]
    n = len(path)
    tangents = []
    for i in range(n):
        a = path[(i - 1) % n] if closed else path[max(i - 1, 0)]
        b = path[(i + 1) % n] if closed else path[min(i + 1, n - 1)]
        tangents.append((b - a).normalized())
    t0 = tangents[0]
    up = Vector((0, 0, 1)) if abs(t0.z) < 0.9 else Vector((1, 0, 0))
    normal = (up - t0 * up.dot(t0)).normalized()
    rings = []
    for i in range(n):
        t = tangents[i]
        normal = (normal - t * normal.dot(t)).normalized()
        binormal = t.cross(normal)
        r = radius(i / max(1, n - 1)) if callable(radius) else radius
        rings.append([tuple(path[i] + (normal * math.cos(math.tau * k / sides) + binormal * math.sin(math.tau * k / sides)) * r) for k in range(sides)])
    for i in range(n if closed else n - 1):
        A, B = rings[i], rings[(i + 1) % n]
        centre = (path[i] + path[(i + 1) % n]) / 2
        for k in range(sides):
            j = (k + 1) % sides
            pts = [A[k], A[j], B[j], B[k]]
            mid = sum((Vector(p) for p in pts), Vector()) / 4
            mb.face(pts, material, None, tuple(mid - centre))
    if not closed:
        mb.face(rings[0], material, None, tuple(-tangents[0]))
        mb.face(rings[-1], material, None, tuple(tangents[-1]))


def obox(mb, centre, size, material, rot=Matrix.Identity(3)):
    """A box of `size` turned by `rot` about its centre."""
    c = Vector(centre)
    hx, hy, hz = (s / 2 for s in size)
    corners = {}
    for sx in (-1, 1):
        for sy in (-1, 1):
            for sz in (-1, 1):
                corners[sx, sy, sz] = tuple(c + rot @ Vector((sx * hx, sy * hy, sz * hz)))
    faces = [
        [(-1, -1, -1), (-1, 1, -1), (-1, 1, 1), (-1, -1, 1)],
        [(1, -1, -1), (1, -1, 1), (1, 1, 1), (1, 1, -1)],
        [(-1, -1, -1), (-1, -1, 1), (1, -1, 1), (1, -1, -1)],
        [(-1, 1, -1), (1, 1, -1), (1, 1, 1), (-1, 1, 1)],
        [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1)],
        [(-1, -1, 1), (-1, 1, 1), (1, 1, 1), (1, -1, 1)],
    ]
    for f in faces:
        pts = [corners[k] for k in f]
        mid = sum((Vector(p) for p in pts), Vector()) / 4
        mb.face(pts, material, None, tuple(mid - c))


def rings_mesh(mb, rings, material, centre_axis=True, cap_top=False, cap_bottom=False):
    """Quads between consecutive closed rings (lists of points), facing away from the Z axis."""
    for a, b in zip(rings, rings[1:]):
        n = len(a)
        for i in range(n):
            j = (i + 1) % n
            pts = [a[i], a[j], b[j], b[i]]
            mid = sum((Vector(p) for p in pts), Vector()) / 4
            out = Vector((mid.x, mid.y, 0)) if centre_axis else mid
            mb.face(pts, material, None, tuple(out))
    if cap_top:
        mb.face(rings[-1], material, None, (0, 0, 1))
    if cap_bottom:
        mb.face(rings[0][::-1], material, None, (0, 0, -1))


def roughen(obj, strength, scale=0.6, levels=2, seed=0, flatten_top=None):
    """Subdivide and displace with cloud noise (rock, earth); optionally keep a flat top at z."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if levels:
        mod = obj.modifiers.new("Subdiv", "SUBSURF")
        mod.levels = levels
        mod.subdivision_type = "SIMPLE"
        bpy.ops.object.modifier_apply(modifier=mod.name)
    tex = bpy.data.textures.new(f"{obj.name}_noise{seed}", "CLOUDS")
    tex.noise_scale = scale
    tex.noise_depth = 3
    mod = obj.modifiers.new("Rough", "DISPLACE")
    mod.texture = tex
    mod.strength = strength
    mod.mid_level = 0.5
    mod.texture_coords = "LOCAL"
    bpy.ops.object.modifier_apply(modifier=mod.name)
    if flatten_top is not None:
        for v in obj.data.vertices:
            if v.co.z > flatten_top:
                v.co.z = flatten_top
    obj.select_set(False)


def smooth(obj, degrees=40):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(degrees))
    obj.select_set(False)


def decimate(obj, tris):
    obj.data.calc_loop_triangles()
    have = len(obj.data.loop_triangles)
    if have > tris:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        mod = obj.modifiers.new("Budget", "DECIMATE")
        mod.ratio = tris / have
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.select_set(False)


# ---------------------------------------------------------------------------- library

def mosaic_clue(name):
    """Panel 1.22 x 3.06 m facing -Y (the room), centred on the origin, in a moulded brass frame."""
    lib = K.lib()
    brass = lib["agedBrass"]
    tiles = bpy.data.materials.new("mosaicTiles")
    tiles.use_nodes = True
    nt = tiles.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    img = bpy.data.images.load(MOSAIC)
    img.scale(512, 1280)
    img.pack()
    node = nt.nodes.new("ShaderNodeTexImage")
    node.image = img
    nt.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.45
    # The picture: a grid of slightly tilted tiles, so the glass catches the light unevenly.
    W, H, cols, rows = 1.22, 3.06, 24, 60
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    rnd = random.Random(5)
    tw, th = W / cols, H / rows
    for a in range(cols):
        for b in range(rows):
            x0, z0 = -W / 2 + a * tw, -H / 2 + b * th
            g = 0.0025
            tilt = (rnd.uniform(-0.004, 0.004), rnd.uniform(-0.004, 0.004))
            corners = [(x0 + g, z0 + g), (x0 + tw - g, z0 + g), (x0 + tw - g, z0 + th - g), (x0 + g, z0 + th - g)]
            verts = [bm.verts.new((x, -0.004 - tilt[0] * (x - x0 - tw / 2) / tw - tilt[1] * (z - z0 - th / 2) / th, z)) for x, z in corners]
            f = bm.faces.new(verts[::-1])
            for loop in f.loops:
                p = loop.vert.co
                loop[uv].uv = ((p.x + W / 2) / W, (p.z + H / 2) / H)
    # Dark grout behind the tiles (its own material, not the white wall plaster).
    grout = [bm.verts.new(p) for p in ((-W / 2, 0, -H / 2), (-W / 2, 0, H / 2), (W / 2, 0, H / 2), (W / 2, 0, -H / 2))]
    gf = bm.faces.new(grout)
    gf.material_index = 1
    for loop in gf.loops:
        loop[uv].uv = (0.5, 0.02)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(tiles)
    grout_mat = bpy.data.materials.new("mosaicGrout")
    grout_mat.use_nodes = True
    grout_mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*C.srgb_to_linear((0.16, 0.13, 0.1)), 1.0)
    me.materials.append(grout_mat)
    panel = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(panel)
    # Frame: brass bars round the panel with a half-round bead along their inner edge.
    mb = K.MeshBuilder([brass])
    w2, h2 = W / 2, H / 2
    for cx, cz, sx, sz in ((0, h2 + 0.035, W + 0.14, 0.07), (0, -h2 - 0.035, W + 0.14, 0.07), (-w2 - 0.035, 0, 0.07, H), (w2 + 0.035, 0, 0.07, H)):
        obox(mb, (cx, -0.02, cz), (sx, 0.05, sz), brass)
    sweep(mb, [(-w2, -0.03, -h2), (w2, -0.03, -h2), (w2, -0.03, h2), (-w2, -0.03, h2)], 0.016, brass, sides=6, closed=True)
    frame = mb.finish(f"{name}_frame")
    smooth(frame, 50)
    K.join([panel, frame], name)


def grimoire_chain(name):
    """A loop of oval links round a circle of 0.62 m in the XZ plane (the game turns it about Y)."""
    steel = K.lib()["steel"]
    mb = K.MeshBuilder([steel])
    R, length, width, wire = 0.62, 0.085, 0.05, 0.011
    count = int(math.tau * R / (length * 0.78))
    for k in range(count):
        a = math.tau * k / count
        centre = Vector((math.cos(a) * R, 0, math.sin(a) * R))
        tangent = Vector((-math.sin(a), 0, math.cos(a)))
        radial = Vector((math.cos(a), 0, math.sin(a)))
        # Alternate links lie flat on the book and stand across it.
        side = radial if k % 2 else Vector((0, 1, 0))
        path = []
        for i in range(12):
            t = math.tau * i / 12
            # A stadium: straight sides joined by round ends.
            x = math.cos(t) * (length / 2 - width / 2) + math.cos(t) * width / 2
            y = math.sin(t) * width / 2
            path.append(tuple(centre + tangent * x + side * y))
        sweep(mb, path, wire, steel, sides=5, closed=True)
    obj = mb.finish(name)
    smooth(obj, 60)


# ---------------------------------------------------------------------------- observatory

def orrery_stand(name):
    """Iron pillar from the floor (z -2.2) up to the sun's socket (z -0.3), on three scrolled feet."""
    lib = K.lib()
    iron, brass = lib["darkSteel"], lib["agedBrass"]
    mb = K.MeshBuilder([iron, brass])
    K.lathe(mb, [(0.0, -2.2), (0.16, -2.2), (0.16, -2.12), (0.11, -2.05), (0.07, -1.9), (0.055, -1.2), (0.05, -0.55), (0.0, -0.55)], iron, segments=16)
    K.lathe(mb, [(0.0, -1.3), (0.085, -1.28), (0.09, -1.2), (0.085, -1.12), (0.0, -1.1)], brass, segments=16)
    K.lathe(mb, [(0.0, -0.58), (0.08, -0.56), (0.12, -0.46), (0.07, -0.38), (0.05, -0.3), (0.0, -0.3)], brass, segments=16)
    for k in range(3):
        a = math.tau * k / 3
        d = Vector((math.cos(a), math.sin(a), 0))
        path = []
        for i in range(10):
            t = i / 9
            r = 0.08 + 0.55 * t
            z = -1.95 - 0.22 * math.sin(t * math.pi * 0.5) + 0.05 * math.sin(t * math.pi * 3) * (1 - t)
            path.append(tuple(d * r + Vector((0, 0, z))))
        # The scroll curling up at the toe.
        for i in range(1, 6):
            t = i / 5 * math.pi * 1.2
            path.append(tuple(d * (0.63 + 0.06 * math.sin(t)) + Vector((0, 0, -2.17 + 0.06 * (1 - math.cos(t))))))
        sweep(mb, path, lambda u: 0.03 - 0.015 * u, iron, sides=6)
    obj = mb.finish(name)
    smooth(obj, 45)


def orrery_sun(name):
    lib = K.lib()
    mb = K.MeshBuilder([lib["wardGold"], lib["agedBrass"]])
    prof = [(0.35 * math.sin(math.pi * i / 16), -0.35 * math.cos(math.pi * i / 16)) for i in range(17)]
    K.lathe(mb, prof, lib["wardGold"], segments=24, cap_top=False)
    K.lathe(mb, [(0.355, -0.03), (0.375, -0.02), (0.375, 0.02), (0.355, 0.03)], lib["agedBrass"], segments=32, cap_top=False)
    obj = mb.finish(name)
    smooth(obj, 60)


def orrery_arm(name, r, planet, planet_r):
    """A horizontal orbit ring of radius r in the XY plane, a spoke from the hub and a planet at (r, 0, 0)."""
    lib = K.lib()
    brass = lib["agedBrass"]
    mb = K.MeshBuilder([brass, lib[planet] if planet in lib else mat(planet)])
    ring = [(math.cos(math.tau * i / 64) * r, math.sin(math.tau * i / 64) * r, 0) for i in range(64)]
    sweep(mb, ring, 0.018, brass, sides=6, closed=True)
    sweep(mb, [(0.38, 0, 0), (r * 0.5, 0, 0.02), (r - 0.02, 0, 0)], 0.012, brass, sides=6)
    pm = lib[planet] if planet in lib else mat(planet)
    prof = [(planet_r * math.sin(math.pi * i / 10), -planet_r * math.cos(math.pi * i / 10)) for i in range(11)]
    K.lathe(mb, prof, pm, centre=(r, 0, 0), segments=16, cap_top=False)
    K.lathe(mb, [(planet_r * 0.4, -planet_r - 0.06), (0.012, -planet_r - 0.02), (0.012, -planet_r + 0.01)], brass, centre=(r, 0, 0), segments=8)
    obj = mb.finish(name)
    smooth(obj, 50)


# ---------------------------------------------------------------------------- gallery

def practice_wand(name):
    """Upright along Z from 0 to 0.42 m."""
    lib = K.lib()
    oak, dark, brass = lib["lightOak"], lib["darkOak"], lib["agedBrass"]
    mb = K.MeshBuilder([oak, dark, brass])
    K.lathe(mb, [(0.0, 0.0), (0.013, 0.0), (0.016, 0.01), (0.014, 0.03), (0.016, 0.05), (0.014, 0.07), (0.016, 0.09), (0.015, 0.11), (0.013, 0.12)], dark, segments=12)
    K.lathe(mb, [(0.0, 0.12), (0.014, 0.12), (0.0145, 0.135), (0.0125, 0.14)], brass, segments=12)
    K.lathe(mb, [(0.0, 0.14), (0.0115, 0.14), (0.009, 0.3), (0.0065, 0.4), (0.004, 0.418), (0.0, 0.42)], oak, segments=12)
    obj = mb.finish(name)
    smooth(obj, 50)


def quartz(mb, crystal, base, seed, size=1.0, specs=None):
    """A cluster of hexagonal quartz prisms with pyramid tips, rising from `base`."""
    rnd = random.Random(seed)
    if specs is None:
        specs = [(0.0, 0.0, 0.0, 0.07, 0.42, 0.13)]
        for k in range(6):
            a = math.tau * k / 6 + rnd.random() * 0.4
            specs.append((math.cos(a) * 0.06, math.sin(a) * 0.06, 0.25 + rnd.random() * 0.25, 0.028 + rnd.random() * 0.025, 0.14 + rnd.random() * 0.16, 0.06 + rnd.random() * 0.04))
    for x, y, tilt, r, h, tip in specs:
        a = math.atan2(y, x)
        m = Matrix.Translation(Vector(base) + Vector((x, y, 0)) * size) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Rotation(tilt, 4, "Y") @ Matrix.Scale(size, 4)
        K.lathe(mb, [(r * 0.8, 0.0), (r, 0.03), (r, h), (0.0, h + tip)], crystal, segments=6, cap_top=False, matrix=m)


def crystal_pedestal(name):
    """A carved stone pedestal 1 m tall with a glowing quartz cluster on top."""
    lib = K.lib()
    stone, dark, crystal = lib["academyStone"], lib["academyStoneDark"], lib["crystal"]
    mb = K.MeshBuilder([stone, dark, crystal])
    K.lathe(mb, [(0.52, 0.0), (0.52, 0.1), (0.46, 0.14), (0.44, 0.2), (0.36, 0.26), (0.3, 0.3)], dark, segments=8, cap_top=False)
    K.lathe(mb, [(0.3, 0.3), (0.27, 0.36), (0.25, 0.7), (0.27, 0.76), (0.32, 0.8)], stone, segments=24, cap_top=False)
    K.lathe(mb, [(0.32, 0.8), (0.38, 0.86), (0.4, 0.92), (0.4, 0.98), (0.36, 1.0)], dark, segments=8)
    quartz(mb, crystal, (0, 0, 1.0), 9, size=0.9)
    obj = mb.finish(name)
    smooth(obj, 35)


# ---------------------------------------------------------------------------- greenhouse

def vine_deck(name):
    """2 m of the vine bridge running from y=0 to y=2 (the game's -Z), deck top at z=0, 1.7 m wide."""
    lib = K.lib()
    stem, leaf = mat("stem", "#5f7a3a", 0.8), mat("leaf", "#4f8a3a", 0.7)
    mb = K.MeshBuilder([stem, leaf])
    rnd = random.Random(3)
    for k, x in enumerate((-0.56, -0.28, 0.0, 0.28, 0.56)):
        # Thick stems, each a pair twisted together, bowed slightly and wandering.
        for strand in range(2):
            path = []
            for i in range(17):
                t = i / 16
                y = -0.02 + t * 2.04
                twist = t * math.tau * 1.5 + strand * math.pi + k
                path.append((x + math.cos(twist) * 0.045 + 0.02 * math.sin(t * 7 + k), y, -0.1 - abs(x) * 0.08 + math.sin(twist) * 0.04))
            sweep(mb, path, lambda u: 0.075 + 0.01 * math.sin(u * 9), stem, sides=7)
    for yy in (0.5, 1.5):
        # Ties: thinner vines wrapped over and under the deck stems.
        path = [(-0.75 + i * 0.075, yy + 0.03 * math.sin(i), -0.1 + 0.09 * math.cos(i * math.pi / 3.5)) for i in range(21)]
        sweep(mb, path, 0.035, stem, sides=6)
    for x in (-0.85, 0.85):
        # Hand-rail vines, with leaves along them.
        path = [(x + 0.03 * math.sin(i * 1.3), -0.02 + i * 0.17, 0.45 + 0.06 * math.sin(i * 0.9)) for i in range(13)]
        sweep(mb, path, 0.04, stem, sides=6)
        for i in range(1, 12):
            p = Vector(path[i])
            for side in (-1, 1):
                a = rnd.uniform(-0.6, 0.6) + (0 if side > 0 else math.pi)
                d = Vector((math.cos(a) * 0.3, rnd.uniform(-0.2, 0.2), math.sin(a) * 0.6 + 0.3)).normalized()
                tip = p + d * rnd.uniform(0.13, 0.2)
                mid = (p + tip) / 2
                across = d.cross(Vector((0, 1, 0))).normalized() * 0.045
                curl = Vector((0, 0, 0.02))
                mb.face([tuple(p), tuple(mid + across + curl), tuple(tip), tuple(mid - across + curl)], leaf, None, (0, 0, 1))
        # Uprights tying the rail down to the deck every metre.
        for yy in (0.1, 1.1):
            sweep(mb, [(x, yy, 0.45), (x * 0.9, yy + 0.05, 0.2), (x * 0.78, yy, -0.06)], 0.03, stem, sides=5)
    obj = mb.finish(name)
    smooth(obj, 50)


# ---------------------------------------------------------------------------- lanterns

def sky_lantern(name):
    """A paper sky lantern centred on the origin, 0.34 m tall."""
    lib = K.lib()
    paper, wood, brass = mat("lampGlow", "#ffd9a0", 0.8, emission="#ffb050", strength=2), lib["darkOak"], lib["agedBrass"]
    mb = K.MeshBuilder([paper, wood, brass])
    prof = [(0.105, -0.16), (0.12, -0.12), (0.135, -0.04), (0.145, 0.05), (0.15, 0.12), (0.145, 0.16)]
    K.lathe(mb, prof, paper, segments=16, cap_top=True)
    for k in range(8):
        a = math.tau * k / 8
        path = [(math.cos(a) * (r + 0.004), math.sin(a) * (r + 0.004), z) for r, z in prof]
        sweep(mb, path, 0.004, wood, sides=4)
    K.lathe(mb, [(0.1, -0.165), (0.112, -0.16), (0.112, -0.15), (0.1, -0.145)], brass, segments=16, cap_top=False)
    for a in (0, math.pi / 2):
        sweep(mb, [(math.cos(a) * -0.1, math.sin(a) * -0.1, -0.16), (math.cos(a) * 0.1, math.sin(a) * 0.1, -0.16)], 0.003, wood, sides=4)
    K.lathe(mb, [(0.0, -0.19), (0.025, -0.185), (0.025, -0.16), (0.0, -0.16)], brass, segments=8)
    obj = mb.finish(name)
    smooth(obj, 45)


def lantern_post(name):
    """A turned oak post from z=0 to 1.3 on an iron foot plate, flat on top for a lantern."""
    lib = K.lib()
    oak, iron = lib["darkOak"], lib["darkSteel"]
    mb = K.MeshBuilder([oak, iron])
    obox(mb, (0, 0, 0.015), (0.2, 0.2, 0.03), iron)
    K.lathe(mb, [(0.0, 0.03), (0.06, 0.03), (0.055, 0.08), (0.042, 0.11), (0.045, 0.16), (0.035, 0.2), (0.032, 1.1), (0.04, 1.15), (0.036, 1.2), (0.05, 1.26), (0.05, 1.3), (0.0, 1.3)], oak, segments=12)
    obox(mb, (0, 0, 1.31), (0.13, 0.13, 0.02), iron)
    obj = mb.finish(name)
    smooth(obj, 45)


def beach_lantern(name):
    """A big hexagonal storm lantern standing on the sand, 1.25 m tall: ball feet and a moulded iron
    base, clear glass panes between square brass posts, a frosted globe glowing inside on a brass
    candle cup, a crown of brass points, a ribbed iron cap, finial and carrying ring."""
    lib = K.lib()
    # Weathered, textured metal (CC0 rusty_metal_03 and rust_coarse_01) so it sits in the gritty Blank.
    brass, iron, glass = mat("weatheredBrass", "#c49a4f", 0.5, 0.9), mat("scorchedIron", "#3a3634", 0.7, 0.7), lib["glass"]
    globe = mat("lampGlow", "#ffd9a0", 0.5, emission="#ffb050", strength=1.5)
    mb = K.MeshBuilder([brass, iron, glass, globe])
    S = 6
    for k in range(S):
        f = radial(math.tau * (k + 0.5) / S, 0.24, 0)
        K.lathe(mb, [(0.0, 0.0), (0.03, 0.005), (0.04, 0.025), (0.03, 0.045), (0.0, 0.05)], iron, centre=(f.x, f.y, 0), segments=8)
    K.lathe(mb, [(0.0, 0.04), (0.3, 0.04), (0.31, 0.06), (0.3, 0.08), (0.26, 0.1), (0.25, 0.15), (0.27, 0.17), (0.28, 0.2), (0.0, 0.2)], iron, segments=S)
    lo, hi = 0.2, 0.84
    R = 0.25

    def corner(k, z):
        return radial(math.tau * k / S, R, z)

    for k in range(S):
        mid_dir = radial(math.tau * (k + 0.5) / S, 1, 0)
        a, b = corner(k, lo + 0.04), corner(k + 1, lo + 0.04)
        c, d = corner(k + 1, hi - 0.04), corner(k, hi - 0.04)
        mb.face([tuple(p - mid_dir * 0.02) for p in (a, b, c, d)], glass, None, tuple(mid_dir))
        # A square post at each corner, capped top and bottom.
        rot = Matrix.Rotation(math.tau * k / S, 3, "Z")
        cx = corner(k, 0)
        obox(mb, (cx.x, cx.y, (lo + hi) / 2), (0.04, 0.04, hi - lo), brass, rot)
        for z in (lo + 0.01, hi - 0.01):
            obox(mb, (cx.x, cx.y, z), (0.055, 0.055, 0.025), brass, rot)
        # Top and bottom rails, a middle bar, and a small brass point on top of each post.
        side = (corner(k + 1, 0) - corner(k, 0))
        srot = Matrix((side.normalized(), mid_dir.normalized(), Vector((0, 0, 1)))).transposed()
        for z, hgt in ((lo + 0.02, 0.04), (hi - 0.02, 0.04), ((lo + hi) / 2, 0.012)):
            m = (corner(k, z) + corner(k + 1, z)) / 2 + mid_dir * 0.004
            obox(mb, tuple(m), (side.length, 0.03, hgt), brass, srot)
        K.lathe(mb, [(0.0, 0.0), (0.02, 0.0), (0.012, 0.03), (0.0, 0.06)], brass, centre=(cx.x * 1.06, cx.y * 1.06, hi + 0.05), segments=6)
    # Inside: an iron floor, a brass candle cup and a frosted globe glowing through the clear panes.
    K.lathe(mb, [(0.0, lo + 0.005), (0.23, lo + 0.005), (0.23, lo + 0.02), (0.0, lo + 0.02)], iron, segments=S)
    K.lathe(mb, [(0.0, lo + 0.02), (0.08, lo + 0.02), (0.06, lo + 0.05), (0.07, lo + 0.08), (0.0, lo + 0.08)], brass, segments=16)
    K.lathe(mb, [(0.0, lo + 0.08), (0.06, lo + 0.09), (0.11, lo + 0.16), (0.13, lo + 0.26), (0.12, lo + 0.36), (0.08, lo + 0.44), (0.05, lo + 0.5), (0.0, lo + 0.51)], globe, segments=20)
    # The cap: a moulded rim, a ribbed iron roof, finial and ring.
    K.lathe(mb, [(0.0, hi - 0.01), (0.28, hi - 0.01), (0.3, hi + 0.01), (0.3, hi + 0.04), (0.0, hi + 0.04)], brass, segments=S)
    roof = [(0.34, hi + 0.04), (0.33, hi + 0.07), (0.26, hi + 0.11), (0.17, hi + 0.17), (0.1, hi + 0.24), (0.06, hi + 0.3), (0.045, hi + 0.33)]
    K.lathe(mb, roof + [(0.0, hi + 0.33)], iron, segments=S, cap_top=False, cap_bottom=True)
    for k in range(S):
        a = math.tau * k / S
        # Hexagon corners sit at 1/cos(30) of the lathe's flat radius.
        sweep(mb, [radial(a, r * 1.02, z + 0.008) for r, z in roof], 0.012, brass, sides=5)
    K.lathe(mb, [(0.0, hi + 0.32), (0.04, hi + 0.33), (0.025, hi + 0.36), (0.035, hi + 0.38), (0.0, hi + 0.41)], brass, segments=10)
    ring = [(math.cos(math.tau * i / 16) * 0.07, 0, hi + 0.48 + math.sin(math.tau * i / 16) * 0.07) for i in range(16)]
    sweep(mb, ring, 0.011, brass, sides=6, closed=True)
    obj = mb.finish(name)
    smooth(obj, 35)


# ---------------------------------------------------------------------------- level 1 small props

def inkwell(name):
    """The overturned inkwell in the library, laid out in game axes (Blender x = game x, -y = game z):
    a glass bottle on its side with its neck at -X, a brass collar, its cork rolled away and the ink
    it spilled spreading 1.1 m out from the neck."""
    lib = K.lib()
    glass, brass, pool = mat("inkGlass", "#4fbf7a", 0.06), lib["agedBrass"], mat("inkPool", "#14183a", 0.05)
    cork = mat("cork", "#9c7650", 0.9)
    mb = K.MeshBuilder([glass, brass, pool, cork])
    # Lying on its side: the bottle's axis runs along -X (rotated -90 degrees about Y), dipping a little.
    lie = Matrix.Translation((0.1, 0, 0.115)) @ Matrix.Rotation(-math.pi / 2 + 0.12, 4, "Y")
    K.lathe(mb, [(0.0, 0.0), (0.095, 0.0), (0.11, 0.015), (0.115, 0.05), (0.115, 0.12), (0.1, 0.16), (0.06, 0.185), (0.036, 0.2), (0.034, 0.23)], glass, segments=24, cap_top=False, cap_bottom=True, matrix=lie)
    # The ink left inside, lying along the bottom of the bottle and showing through the green glass.
    sunk = Matrix.Translation((0, 0, -0.03)) @ lie
    K.lathe(mb, [(0.0, 0.01), (0.07, 0.01), (0.08, 0.04), (0.08, 0.12), (0.06, 0.15), (0.0, 0.16)], pool, segments=16, matrix=sunk)
    K.lathe(mb, [(0.034, 0.215), (0.045, 0.215), (0.048, 0.235), (0.043, 0.25), (0.03, 0.25)], brass, segments=24, cap_top=False, matrix=lie)
    # The cork, lying on its side by the pool.
    roll = Matrix.Translation((-0.22, -0.2, 0.022)) @ Matrix.Rotation(0.7, 4, "Z") @ Matrix.Rotation(math.pi / 2, 4, "X")
    K.lathe(mb, [(0.0, -0.03), (0.019, -0.03), (0.024, 0.03), (0.0, 0.03)], cork, segments=12, cap_bottom=True, matrix=roll)
    # The spill: a wobbly-edged puddle from the neck outwards, with a few splashes beyond it.
    rnd = random.Random(7)
    def puddle(cx, cy, rx, ry, n, wobble, z):
        phase = [rnd.uniform(0, math.tau) for _ in range(3)]
        rim = []
        for i in range(n):
            a = math.tau * i / n
            w = 1 + wobble * (0.5 * math.sin(3 * a + phase[0]) + 0.3 * math.sin(5 * a + phase[1]) + 0.2 * math.sin(8 * a + phase[2]))
            rim.append((cx + math.cos(a) * rx * w, cy + math.sin(a) * ry * w, z))
        inner = [(cx + (p[0] - cx) * 0.8, cy + (p[1] - cy) * 0.8, z + 0.003) for p in rim]
        for i in range(n):
            j = (i + 1) % n
            mb.face([rim[i], rim[j], inner[j], inner[i]], pool, None, (0, 0, 1))
        mb.face(inner, pool, None, (0, 0, 1))
    puddle(-0.5, 0.0, 0.5, 0.3, 48, 0.22, 0.003)
    puddle(-0.08, 0.0, 0.12, 0.09, 20, 0.15, 0.004)
    for k in range(6):
        a = rnd.uniform(-1.4, 1.4) + math.pi
        d = rnd.uniform(0.62, 0.95)
        r = rnd.uniform(0.018, 0.045)
        puddle(-0.4 + math.cos(a) * d, math.sin(a) * d * 0.7, r, r * rnd.uniform(0.7, 1), 10, 0.2, 0.003)
    obj = mb.finish(name)
    smooth(obj, 40)


def grimoire_clasp(name):
    """One of the Great Grimoire's two clasps, built in the closed book's own frame (game axes: x across
    the cover, y up, z along the spine) with its origin at the hinge: the bottom of the front cover's
    fore-edge (the game puts it at x -0.51; the cover's top is 0.35 above it). A dark leather strap edged
    in brass runs tight up the fore-edge and over the front cover (owner, 2026-10-24: it looked detached
    from the side of the book), ending in a pointed brass hasp with a glowing moonstone lock (material
    'claspGlow', pulsed by the game). The game swings it open about the hinge when its word is typed."""
    lib = K.lib()
    leather = mat("strapLeather", "#3a2418", 0.6)
    brass = lib["agedBrass"]
    glow = mat("claspGlow", "#cfe8ff", 0.1, emission="#5aa8ff", strength=2)
    mb = K.MeshBuilder([leather, brass, glow])

    def g(x, y, z):
        """Game axes to Blender's (the exporter turns Blender z-up back into game y-up)."""
        return (x, -z, y)

    W, T, TOP, OVER = 0.085, 0.014, 0.35, 0.36
    R = 0.03  # corner radius of the bend round the fore-edge
    # The strap's centre line, its inner face touching the fore-edge (x 0) and the cover (y TOP).
    cx, cy = R, TOP - R
    line = [(-T / 2, y) for y in (0.0, 0.1, 0.2, cy)]
    line += [(cx - (R + T / 2) * math.cos(a), cy + (R + T / 2) * math.sin(a)) for a in (0.4, 0.8, 1.2)]
    line += [(x, TOP + T / 2) for x in (cx, 0.15, 0.25, OVER)]

    def offset(i, d):
        """The point of the line at i, moved d outwards (away from the book)."""
        x0, y0 = line[max(0, i - 1)]
        x1, y1 = line[min(len(line) - 1, i + 1)]
        n = Vector((-(y1 - y0), x1 - x0)).normalized()
        if n.x > 0 or (abs(n.x) < 1e-6 and n.y < 0):
            n = -n
        return Vector(line[i]) + n * d

    outer = [offset(i, T / 2) for i in range(len(line))]
    inner = [offset(i, -T / 2) for i in range(len(line))]
    for i in range(len(line) - 1):
        o0, o1, i0, i1 = outer[i], outer[i + 1], inner[i], inner[i + 1]
        n = (o0 + o1 - i0 - i1).normalized()
        mb.face([g(o0.x, o0.y, -W), g(o1.x, o1.y, -W), g(o1.x, o1.y, W), g(o0.x, o0.y, W)], leather, None, g(n.x, n.y, 0))
        mb.face([g(i1.x, i1.y, -W), g(i0.x, i0.y, -W), g(i0.x, i0.y, W), g(i1.x, i1.y, W)], leather, None, g(-n.x, -n.y, 0))
        for sz in (-1, 1):
            mb.face([g(o0.x, o0.y, sz * W), g(i0.x, i0.y, sz * W), g(i1.x, i1.y, sz * W), g(o1.x, o1.y, sz * W)], leather, None, g(0, 0, sz))
    # Brass edging along both sides of the strap, from the hinge to the hasp.
    rail = [offset(i, T / 2) for i in range(len(line))]
    for sz in (-1, 1):
        sweep(mb, [g(p.x, p.y, sz * (W - 0.006)) for p in rail], 0.007, brass, sides=6)
    # The hinge barrel at the bottom of the fore-edge, and rivets between the rails.
    K.lathe(mb, [(0.016, -W), (0.016, W)], brass, segments=12, cap_top=True, cap_bottom=True,
            matrix=Matrix.Translation(g(-T / 2, 0.0, 0)) @ Matrix.Rotation(math.pi / 2, 4, "X"))
    for y in (0.1, 0.22):
        K.lathe(mb, [(0.0, 0.0), (0.014, 0.0), (0.011, 0.007), (0.0, 0.01)], brass, segments=10, cap_top=False,
                matrix=Matrix.Translation(g(-T, y, 0)) @ Matrix.Rotation(-math.pi / 2, 4, "Y"))
    for x in (0.12,):
        K.lathe(mb, [(0.0, 0.0), (0.014, 0.0), (0.011, 0.007), (0.0, 0.01)], brass, segments=10, cap_top=False,
                matrix=Matrix.Translation(g(x, TOP + T, 0)))
    # The hasp: a pointed brass plate as wide as the strap, lying on its end, with a moonstone lock.
    hx0, hx1, hy = 0.2, OVER + 0.07, TOP + T
    plate = [(hx0, -W - 0.008), (hx1 - 0.05, -W - 0.008), (hx1, 0.0), (hx1 - 0.05, W + 0.008), (hx0, W + 0.008)]
    top = [g(x, hy + 0.01, z) for x, z in plate]
    bot = [g(x, hy, z) for x, z in plate]
    mb.face(top, brass, None, g(0, 1, 0))
    mb.face(bot[::-1], brass, None, g(0, -1, 0))
    for k in range(len(plate)):
        j = (k + 1) % len(plate)
        mid = Vector(((plate[k][0] + plate[j][0]) / 2 - (hx0 + hx1) / 2, (plate[k][1] + plate[j][1]) / 2))
        mb.face([bot[k], bot[j], top[j], top[k]], brass, None, g(mid.x, 0, mid.y))
    lock = OVER - 0.02
    K.lathe(mb, [(0.0, 0.0), (0.05, 0.0), (0.054, 0.01), (0.046, 0.016), (0.0, 0.016)], brass, segments=24, matrix=Matrix.Translation(g(lock, hy + 0.01, 0)))
    K.lathe(mb, [(0.039, 0.0), (0.038, 0.012), (0.029, 0.026), (0.014, 0.034), (0.0, 0.036)], glow, segments=24, cap_top=False, matrix=Matrix.Translation(g(lock, hy + 0.024, 0)))
    obj = mb.finish(name)
    smooth(obj, 35)


def rune_ring(name):
    """A spinning ward rune for the Warden fight, 0.56 m across, in the XZ plane facing -Y (the game's
    +Z): a forged brass band set with eight glowing rune glyphs (material 'runeGlow'), an inner glowing
    ring and a four-pointed star at its heart."""
    lib = K.lib()
    brass = lib["agedBrass"]
    glow = mat("runeGlow", "#cfe6ff", 0.3, emission="#6fb6ff", strength=2)
    mb = K.MeshBuilder([brass, glow])
    N = 48
    def flat_ring(r0, r1, y0, y1, material):
        """A band between radii r0..r1 in XZ, from y0 (front) to y1 (back)."""
        def pt(r, a, y):
            return (math.cos(a) * r, y, math.sin(a) * r)
        for i in range(N):
            a, b = math.tau * i / N, math.tau * (i + 1) / N
            mb.face([pt(r1, a, y0), pt(r1, b, y0), pt(r0, b, y0), pt(r0, a, y0)], material, None, (0, -1, 0))
            mb.face([pt(r0, a, y1), pt(r0, b, y1), pt(r1, b, y1), pt(r1, a, y1)], material, None, (0, 1, 0))
            mid = (a + b) / 2
            mb.face([pt(r1, a, y0), pt(r1, a, y1), pt(r1, b, y1), pt(r1, b, y0)], material, None, (math.cos(mid), 0, math.sin(mid)))
            mb.face([pt(r0, a, y0), pt(r0, b, y0), pt(r0, b, y1), pt(r0, a, y1)], material, None, (-math.cos(mid), 0, -math.sin(mid)))
    # The band, with a raised lip round each edge.
    flat_ring(0.215, 0.28, -0.012, 0.012, brass)
    flat_ring(0.268, 0.285, -0.02, 0.02, brass)
    flat_ring(0.205, 0.218, -0.02, 0.02, brass)
    # The inner ring of light.
    flat_ring(0.15, 0.165, -0.008, 0.008, glow)
    # Eight original glyphs (staves with branches and hooks), standing proud of the band's face.
    glyphs = [
        [((0, -1), (0, 1)), ((0, 0.2), (0.6, 0.8))],
        [((0, -1), (0, 1)), ((0, 1), (0.6, 0.4)), ((0, 0), (0.6, -0.6))],
        [((-0.5, -1), (0.5, 1)), ((0.5, -1), (-0.5, 1))],
        [((0, -1), (0, 1)), ((-0.6, 0.6), (0, 0)), ((0.6, 0.6), (0, 0))],
        [((-0.5, -1), (-0.5, 1)), ((0.5, -1), (0.5, 1)), ((-0.5, 1), (0.5, 0))],
        [((0, -1), (0, 1)), ((-0.6, -0.2), (0.6, 0.6))],
        [((0, 1), (0.6, 0)), ((0.6, 0), (0, -1)), ((0, -1), (-0.6, 0)), ((-0.6, 0), (0, 1))],
        [((0, -1), (0, 1)), ((0, 0.5), (0.6, 1)), ((0, -0.2), (0.6, 0.3))],
    ]
    rc, h = 0.2475, 0.022
    for k, glyph in enumerate(glyphs):
        a = math.tau * k / len(glyphs) + math.pi / 2
        radial_dir = Vector((math.cos(a), 0, math.sin(a)))
        tangent = Vector((-math.sin(a), 0, math.cos(a)))
        centre = radial_dir * rc
        for (u0, v0), (u1, v1) in glyph:
            # u runs along the band, v across it (outwards).
            p0 = centre + tangent * (u0 * h) + radial_dir * (v0 * h)
            p1 = centre + tangent * (u1 * h) + radial_dir * (v1 * h)
            mid = (p0 + p1) / 2
            along = (p1 - p0)
            length = along.length + 0.006
            side = along.normalized().cross(Vector((0, -1, 0)))
            rot = Matrix((along.normalized(), side, Vector((0, -1, 0)))).transposed()
            obox(mb, (mid.x, -0.014, mid.z), (length, 0.006, 0.005), glow, rot)
    # The heart: a four-pointed star of light pinned by brass spokes.
    for k in range(4):
        a = math.tau * k / 4
        sweep(mb, [(math.cos(a) * 0.03, 0, math.sin(a) * 0.03), (math.cos(a) * 0.21, 0, math.sin(a) * 0.21)], 0.006, brass, sides=6)
    star = []
    for i in range(8):
        a = math.tau * i / 8 + math.pi / 4
        r = 0.11 if i % 2 == 0 else 0.03
        star.append((math.cos(a) * r, math.sin(a) * r))
    front = [(x, -0.012, z) for x, z in star]
    back = [(x, 0.012, z) for x, z in star]
    mb.face(front, glow, None, (0, -1, 0))
    mb.face(back[::-1], glow, None, (0, 1, 0))
    for i in range(8):
        j = (i + 1) % 8
        mid = Vector(((star[i][0] + star[j][0]) / 2, 0, (star[i][1] + star[j][1]) / 2))
        mb.face([front[i], back[i], back[j], front[j]], glow, None, tuple(mid))
    obj = mb.finish(name)
    smooth(obj, 30)


# ---------------------------------------------------------------------------- the sealing book (Level 3 finale)

# The book that seals the Unwriter, in game axes: x across from the spine (-x) to the fore-edge (+x), z from the
# top of the book (-z) to its foot, y up through the closed book.
BOOK_W, BOOK_L, BOARD, PAGES = 1.2, 1.65, 0.035, 0.28
BOOK_COVER = os.path.join(ROOT, "assets-src", "concepts", "book", "cover.png")
BOOK_PAGES = os.path.join(ROOT, "assets-src", "concepts", "book", "pages.png")


def image_material(name, path, roughness, size=(768, 1056)):
    """A material showing a painted image (book_cover.py), packed into the GLB at `size`."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    img = bpy.data.images.load(path)
    img.scale(*size)
    img.pack()
    node = nt.nodes.new("ShaderNodeTexImage")
    node.image = img
    nt.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = roughness
    return m


def fit_image_uvs(obj, material, x0, x1, z0, z1):
    """Stretch the painting across the faces of `material`: u from x0 to x1, v from the book's foot (z1) to its top
    (z0), in game axes (Blender y = -game z)."""
    slot = list(obj.data.materials).index(material)
    uvs = obj.data.uv_layers.active.data
    for poly in obj.data.polygons:
        if poly.material_index != slot:
            continue
        for li in poly.loop_indices:
            v = obj.data.vertices[obj.data.loops[li].vertex_index].co
            uvs[li].uv = ((v.x - x0) / (x1 - x0), (-v.y - z1) / (z0 - z1))


def g3(x, y, z):
    """Game axes to Blender's (the exporter turns Blender z-up back into game y-up)."""
    return (x, -z, y)


def book_corners(mb, y, brass, flip=False):
    """Brass corner caps on a board at height y: an L of two plates at each of the fore-edge corners."""
    for sz in (-1, 1):
        cx, cz = BOOK_W / 2 - 0.06, sz * (BOOK_L / 2 - 0.06)
        h = 0.012 * (-1 if flip else 1)
        obox(mb, g3(cx, y + h / 2, cz), (0.16, 0.04, abs(h) + 0.004), brass)
        obox(mb, g3(cx + 0.06, y + h / 2, cz - sz * 0.05), (0.04, 0.16, abs(h) + 0.004), brass)


def sealed_book_body(name):
    """The sealing book without its front cover, lying flat with its spine on -X: the back board, the page block
    (pages slightly hollowed, gilt edges) and a rounded spine with raised bands. Origin under the centre of the
    book on the floor; the front cover (sealed_book_cover) hinges at the top of the spine."""
    lib = K.lib()
    leather, brass = lib["burgundyLeather"], lib["agedBrass"]
    pages = mat("pageEdge", "#e4d2a8", 0.9)
    gilt = mat("wardGold", "#ffe3a0", 0.3, emission="#ffb640", strength=0.6)
    parchment = image_material("bookPagesArt", BOOK_PAGES, 0.85)
    mb = K.MeshBuilder([leather, brass, pages, gilt, parchment])
    obox(mb, g3(0, BOARD / 2, 0), (BOOK_W, BOOK_L, BOARD), leather)
    book_corners(mb, BOARD, brass)
    # The page block, set in from three edges, with gilt edges on top and bottom.
    px0, px1 = -BOOK_W / 2 + 0.02, BOOK_W / 2 - 0.04
    obox(mb, g3((px0 + px1) / 2, BOARD + PAGES / 2 - 0.001, 0), (px1 - px0, BOOK_L - 0.07, PAGES - 0.002), pages)
    # The top page: the painted blank parchment, the first thing seen when the book bursts open.
    pz = (BOOK_L - 0.07) / 2
    mb.face([g3(px0, BOARD + PAGES, -pz), g3(px1, BOARD + PAGES, -pz), g3(px1, BOARD + PAGES, pz), g3(px0, BOARD + PAGES, pz)], parchment, None, (0, 0, 1))
    obox(mb, g3(px1 + 0.004, BOARD + PAGES / 2, 0), (0.008, BOOK_L - 0.08, PAGES - 0.01), gilt)
    # The spine: a half-round from the back board up to where the front cover hinges, with four raised bands.
    top = BOARD * 2 + PAGES
    r = top / 2
    N = 12
    for k in range(N):
        a0, a1 = math.pi / 2 + math.pi * k / N, math.pi / 2 + math.pi * (k + 1) / N
        p0 = (-BOOK_W / 2 + math.cos(a0) * r * 0.5, r + math.sin(a0) * r)
        p1 = (-BOOK_W / 2 + math.cos(a1) * r * 0.5, r + math.sin(a1) * r)
        mid = ((math.cos(a0) + math.cos(a1)) / 2, (math.sin(a0) + math.sin(a1)) / 2)
        mb.face([g3(p0[0], p0[1], -BOOK_L / 2), g3(p1[0], p1[1], -BOOK_L / 2), g3(p1[0], p1[1], BOOK_L / 2), g3(p0[0], p0[1], BOOK_L / 2)], leather, None, g3(mid[0], mid[1], 0))
    for bz in (-0.45, -0.15, 0.15, 0.45):
        sweep(mb, [g3(-BOOK_W / 2 + math.cos(math.pi / 2 + math.pi * k / 10) * (r * 0.5 + 0.012), r + math.sin(math.pi / 2 + math.pi * k / 10) * (r + 0.012), bz * BOOK_L) for k in range(11)], 0.016, leather, sides=6)
    obj = mb.finish(name)
    fit_image_uvs(obj, parchment, px0, px1, -pz, pz)
    smooth(obj, 35)


def sealed_book_cover(name):
    """The front cover of the sealing book, its origin at the hinge (the top of the spine, -X edge). The painted
    tooled-leather art (book_cover.py) is on top; a raised gold seal sits in the painted circle, its star glowing
    (material 'sealGlow', which the game pulses). The game swings it open about z."""
    lib = K.lib()
    leather, brass = lib["burgundyLeather"], lib["agedBrass"]
    art = image_material("bookCoverArt", BOOK_COVER, 0.55)
    glow = mat("sealGlow", "#ffe3a0", 0.25, emission="#ffb640", strength=2.5)
    mb = K.MeshBuilder([leather, art, brass, glow])
    # The board, hinge at x=0: it reaches to the fore-edge at x=BOOK_W; its top face carries the art.
    x0, x1, t = 0.0, BOOK_W, BOARD
    obox(mb, g3((x0 + x1) / 2, -t / 2, 0), (BOOK_W, BOOK_L, t - 0.002), leather)
    top = [g3(x0, 0.0, -BOOK_L / 2), g3(x1, 0.0, -BOOK_L / 2), g3(x1, 0.0, BOOK_L / 2), g3(x0, 0.0, BOOK_L / 2)]
    mb.face(top, art, None, (0, 0, 1))
    for sz in (-1, 1):
        cx, cz = BOOK_W - 0.06, sz * (BOOK_L / 2 - 0.06)
        obox(mb, g3(cx, 0.006, cz), (0.16, 0.04, 0.016), brass)
        obox(mb, g3(cx + 0.06, 0.006, cz - sz * 0.05), (0.04, 0.16, 0.016), brass)
    # The seal: a brass ring in the painted circle and an eight-pointed star of light inside it.
    cx = BOOK_W / 2
    K.lathe(mb, [(0.24, 0.0), (0.26, 0.0), (0.27, 0.02), (0.25, 0.035), (0.22, 0.035), (0.21, 0.02), (0.22, 0.0)], brass, segments=48, cap_top=False, matrix=Matrix.Translation(g3(cx, 0.0, 0.0)))
    star = []
    for i in range(16):
        a = math.tau * i / 16
        r = 0.19 if i % 2 == 0 else 0.07
        star.append((cx + math.cos(a) * r, math.sin(a) * r))
    front = [g3(x, 0.03, z) for x, z in star]
    back = [g3(x, 0.004, z) for x, z in star]
    mb.face(front, glow, None, (0, 0, 1))
    for i in range(16):
        j = (i + 1) % 16
        mid = ((star[i][0] + star[j][0]) / 2 - cx, (star[i][1] + star[j][1]) / 2)
        mb.face([back[i], back[j], front[j], front[i]], glow, None, g3(mid[0], 0, mid[1]))
    obj = mb.finish(name)
    fit_image_uvs(obj, art, 0.0, BOOK_W, -BOOK_L / 2, BOOK_L / 2)
    smooth(obj, 35)


# ---------------------------------------------------------------------------- level 2 buildings

def radial(a, r, z):
    return Vector((math.cos(a) * r, math.sin(a) * r, z))


def round_tower(name):
    """Origin at the tower's centre on the ground; radius 4.6 m, walls to 24 m, roof tip at 31 m.
    The doorway faces -X."""
    lib = K.lib()
    stone, dark, slate, oak, brass = lib["academyStone"], lib["academyStoneDark"], mat("slate", "#4a5260", 0.8), lib["darkOak"], lib["agedBrass"]
    glow = mat("windowLit", "#ffd59a", 0.4, emission="#ffb060", strength=1.5)
    mb = K.MeshBuilder([stone, dark, slate, oak, brass, glow])
    N = 40
    ring = lambda r, z: [radial(math.tau * i / N, r, z) for i in range(N)]  # noqa: E731
    # Battered plinth, then the shaft, broken by two string courses.
    rings_mesh(mb, [ring(5.1, 0.0), ring(4.95, 1.2), ring(4.75, 1.6)], dark)
    rings_mesh(mb, [ring(4.75, 1.6), ring(4.62, 8.0)], stone)
    for z in (8.0, 16.0):
        rings_mesh(mb, [ring(4.62, z), ring(4.78, z + 0.1), ring(4.78, z + 0.35), ring(4.6, z + 0.45)], dark)
    rings_mesh(mb, [ring(4.6, 8.45), ring(4.6, 16.0)], stone)
    rings_mesh(mb, [ring(4.6, 16.45), ring(4.6, 22.6)], stone)
    # Corbelled eaves: a stepped ring out to the roof's overhang.
    rings_mesh(mb, [ring(4.6, 22.6), ring(4.9, 22.9), ring(4.9, 23.2), ring(5.2, 23.5), ring(5.2, 23.8)], dark)
    # Conical slate roof, its foot flared over the eaves, with a turned brass finial.
    rings_mesh(mb, [ring(5.55, 23.7), ring(5.2, 24.3), ring(3.6, 26.6), ring(1.8, 28.9), ring(0.25, 30.5)], slate, cap_top=True)
    mb.face(ring(5.55, 23.7)[::-1], slate, None, (0, 0, -1))
    K.lathe(mb, [(0.0, 30.4), (0.18, 30.5), (0.1, 30.8), (0.16, 31.0), (0.06, 31.3), (0.02, 32.0), (0.0, 32.1)], brass, segments=10)
    # Lit lancet windows: three tiers of four, set in stone surrounds, clear of the doorway.
    for tier, z in enumerate((4.5, 11.5, 18.5)):
        for k in range(4):
            a = math.tau * (k + 0.5 * (tier % 2)) / 4 + math.pi / 4
            if abs(math.cos(a) + 1) < 0.05:
                continue
            out = radial(a, 1, 0)
            side = Vector((-math.sin(a), math.cos(a), 0))
            rot = Matrix((side, out, (0, 0, 1))).transposed()
            c = radial(a, 4.63, z)
            w, h = 0.7, 1.9
            mb.face([tuple(c + side * (-w / 2) + Vector((0, 0, -h / 2))), tuple(c + side * (w / 2) + Vector((0, 0, -h / 2))), tuple(c + side * (w / 2) + Vector((0, 0, h / 2))), tuple(c + side * (-w / 2) + Vector((0, 0, h / 2)))], glow, None, tuple(out))
            for dx in (-1, 1):
                obox(mb, c + side * (dx * (w / 2 + 0.1)), (0.2, 0.3, h + 0.2), dark, rot)
            obox(mb, c + Vector((0, 0, -h / 2 - 0.12)), (w + 0.5, 0.36, 0.16), dark, rot)
            # A pointed head: two sloping stones meeting over the window.
            for dx in (-1, 1):
                tilt = Matrix.Rotation(-dx * 0.75, 3, out)
                obox(mb, c + side * (dx * w * 0.24) + Vector((0, 0, h / 2 + 0.22)), (w * 0.62, 0.3, 0.2), dark, tilt @ rot)
    # The doorway on -X: a deep arched stone surround round the burning door.
    out = Vector((-1, 0, 0))
    side = Vector((0, -1, 0))
    rot = Matrix((side, out, (0, 0, 1))).transposed()
    for dy in (-1, 1):
        obox(mb, Vector((-4.7, dy * 1.12, 1.5)), (0.36, 0.5, 3.0), dark, rot)
    for i in range(9):
        t = math.pi * i / 8
        p = Vector((-4.72, math.cos(t) * 1.12, 3.0 + math.sin(t) * 1.0))
        obox(mb, p, (0.34, 0.5, 0.36), dark, Matrix.Rotation(-t + math.pi / 2, 3, out) @ rot)
    obj = mb.finish(name)
    smooth(obj, 30)


def belfry_roof(name):
    """A hipped roof on an 8.6 x 3.8 m footprint from z=0, rising 3 m, ridge along X."""
    lib = K.lib()
    slate, dark, lead, brass = mat("slate", "#4a5260", 0.8), lib["academyStoneDark"], lib["darkSteel"], lib["agedBrass"]
    mb = K.MeshBuilder([slate, dark, lead, brass])
    obox(mb, (0, 0, -0.05), (8.6, 3.8, 0.3), dark)
    L, Wd, rise, ov = 4.4, 2.0, 3.0, 0.25
    a, b, c, d = (-L - ov, -Wd - ov, 0.1), (L + ov, -Wd - ov, 0.1), (L + ov, Wd + ov, 0.1), (-L - ov, Wd + ov, 0.1)
    r0, r1 = (-L + Wd, 0, rise), (L - Wd, 0, rise)
    for pts, n in (([a, b, r1, r0], (0, -1, 1)), ([c, d, r0, r1], (0, 1, 1)), ([b, c, r1], (1, 0, 1)), ([d, a, r0], (-1, 0, 1))):
        mb.face(pts, slate, None, n)
    mb.face([a, d, c, b], slate, None, (0, 0, -1))
    sweep(mb, [(r0[0] - 0.05, 0, rise + 0.05), (r1[0] + 0.05, 0, rise + 0.05)], 0.08, lead, sides=6)
    for p0, p1 in ((r0, a), (r0, d), (r1, b), (r1, c)):
        sweep(mb, [(p0[0], p0[1], p0[2] + 0.04), (p1[0], p1[1], p1[2] + 0.06)], 0.06, lead, sides=5)
    # Weathervane over the ridge's middle.
    K.lathe(mb, [(0.0, rise), (0.12, rise + 0.05), (0.06, rise + 0.2), (0.03, rise + 1.4), (0.0, rise + 1.5)], brass, segments=8)
    sweep(mb, [(-0.6, 0, rise + 1.1), (0.6, 0, rise + 1.1)], 0.02, brass, sides=4)
    mb.face([(0.6, 0, rise + 1.0), (0.95, 0, rise + 1.1), (0.6, 0, rise + 1.2)], brass, None, (0, -1, 0))
    mb.face([(-0.6, 0, rise + 1.1), (-0.95, 0, rise + 1.3), (-0.75, 0, rise + 1.1), (-0.95, 0, rise + 0.9)], brass, None, (0, -1, 0))
    obj = mb.finish(name)
    smooth(obj, 30)


# ---------------------------------------------------------------------------- iron and fire

def iron_brazier(name):
    """A fire bowl 1.2 m tall: rim at z 1.15, three scrolled legs, a brace ring and glowing coals."""
    lib = K.lib()
    iron = lib["darkSteel"]
    coals = mat("amberGlow", "#ff7a2a", 0.9, emission="#ff5a10", strength=2)
    mb = K.MeshBuilder([iron, coals])
    K.lathe(mb, [(0.06, 0.82), (0.2, 0.86), (0.36, 0.96), (0.46, 1.08), (0.5, 1.15), (0.52, 1.17), (0.5, 1.19), (0.46, 1.15), (0.42, 1.1), (0.32, 1.0), (0.16, 0.93), (0.0, 0.92)], iron, segments=20, cap_top=False, cap_bottom=True)
    rnd = random.Random(4)
    coal_ring = [[radial(math.tau * i / 14, r, 1.02 + rnd.uniform(0, 0.05) + (0.04 if r < 0.2 else 0)) for i in range(14)] for r in (0.4, 0.28, 0.14)]
    for a_ring, b_ring in zip(coal_ring, coal_ring[1:]):
        for i in range(14):
            j = (i + 1) % 14
            mb.face([tuple(a_ring[i]), tuple(a_ring[j]), tuple(b_ring[j]), tuple(b_ring[i])], coals, None, (0, 0, 1))
    mb.face([tuple(p) for p in coal_ring[-1]], coals, None, (0, 0, 1))
    for k in range(3):
        a = math.tau * k / 3
        path = [radial(a, 0.36, 0.95), radial(a, 0.4, 0.75), radial(a, 0.38, 0.45), radial(a, 0.42, 0.2), radial(a, 0.52, 0.05)]
        for i in range(1, 6):
            t = i / 5 * math.pi * 1.3
            path.append(radial(a, 0.52 + 0.07 * math.sin(t), 0.05 + 0.07 * (1 - math.cos(t))))
        sweep(mb, [tuple(p) for p in path], lambda u: 0.035 - 0.015 * u, iron, sides=6)
    sweep(mb, [tuple(radial(math.tau * i / 24, 0.38, 0.42)) for i in range(24)], 0.018, iron, sides=5, closed=True)
    obj = mb.finish(name)
    smooth(obj, 45)


def iron_stake(name):
    """A forged stake: square tapering shaft from z=0 to 0.5, a collar and a ring eye on top."""
    iron = mat("ironPlate", "#3a3634", 0.5, 0.8)
    mb = K.MeshBuilder([iron])
    rings = []
    for z, r in ((0.0, 0.02), (0.08, 0.07), (0.45, 0.085), (0.5, 0.11), (0.54, 0.11), (0.56, 0.07)):
        rings.append([tuple(radial(math.pi / 4 + math.tau * i / 4, r, z)) for i in range(4)])
    rings_mesh(mb, rings, iron, cap_top=True, cap_bottom=True)
    eye = [(math.cos(math.tau * i / 16) * 0.075, 0, 0.64 + math.sin(math.tau * i / 16) * 0.075) for i in range(16)]
    sweep(mb, eye, 0.018, iron, sides=6, closed=True)
    obj = mb.finish(name)
    smooth(obj, 35)


def quill_shard(name):
    """Sharp red crystal points (material 'crystal'; the game gives them the shard's red glow)."""
    crystal = K.lib()["crystal"]
    mb = K.MeshBuilder([crystal])
    specs = [(0.0, 0.0, 0.05, 0.045, 0.26, 0.12), (0.06, 0.03, 0.5, 0.03, 0.15, 0.08), (-0.05, -0.04, -0.45, 0.032, 0.17, 0.09), (0.02, -0.06, 0.35, 0.02, 0.1, 0.06), (-0.04, 0.05, -0.3, 0.022, 0.12, 0.05)]
    quartz(mb, crystal, (0, 0, 0), 2, specs=specs)
    obj = mb.finish(name)


# ---------------------------------------------------------------------------- the Blank's beach

def beach_shell(name):
    """A giant scallop lying on the sand, hinge towards +Y, 1.4 m across, 0.5 m high."""
    petal = mat("petal", "#f2b8c6", 0.55)
    bm = bmesh.new()
    grid = {}
    na, nr = 48, 14
    for i in range(na + 1):
        th = -1.25 + 2.5 * i / na
        for j in range(nr + 1):
            r = 0.04 + 0.66 * j / nr
            rib = 0.035 * abs(math.sin(th * 9)) * (j / nr)
            dome = 0.42 * math.sqrt(max(0.0, 1 - (r / 0.72) ** 2)) * (0.6 + 0.4 * math.cos(th * 0.9))
            rim = 0.03 * math.sin(th * 18) * (j / nr) ** 3
            grid[i, j] = bm.verts.new((math.sin(th) * r, 0.35 - math.cos(th) * r, dome + rib + rim))
    for i in range(na):
        for j in range(nr):
            bm.faces.new((grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]))
    # The lower valve: a flatter dish closing the shell underneath.
    low = {}
    for i in range(na + 1):
        for j in range(nr + 1):
            v = grid[i, j].co
            low[i, j] = bm.verts.new((v.x, v.y, 0.02 * (1 - j / nr)))
    for i in range(na):
        for j in range(nr):
            bm.faces.new((low[i, j + 1], low[i + 1, j + 1], low[i + 1, j], low[i, j]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(petal)
    obj = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(obj)
    # The hinge's two "ears".
    mb = K.MeshBuilder([petal])
    for sx in (-1, 1):
        obox(mb, (sx * 0.12, 0.33, 0.04), (0.2, 0.12, 0.08), petal, Matrix.Rotation(sx * 0.3, 3, "Z"))
    ears = mb.finish(f"{name}_ears")
    K.metre_uvs(obj)
    obj = K.join([obj, ears], name)
    smooth(obj, 50)


def beach_boat(name):
    """A small clinker rowing boat, 3.6 m along Y (bow at -Y, the game's +Z), keel at z=0."""
    lib = K.lib()
    paint = mat("boatPaint", "#3c6aa6", 0.7)
    oak = lib["lightOak"]
    mb = K.MeshBuilder([paint, oak])
    L, B, D = 3.6, 1.4, 0.6
    sections = 16
    strakes = 5

    def half_breadth(t):
        # t from 0 (bow) to 1 (stern): fine bow, full middle, a broad transom.
        return B / 2 * (math.sin(min(1.0, t * 1.4) * math.pi / 2) ** 0.8) * (0.92 if t > 0.85 else 1)

    def point(t, s, side):
        y = -L / 2 + L * t
        hb = half_breadth(t)
        z = D * s + (0.12 * (1 - t) ** 3)
        x = side * hb * math.sin(s * math.pi / 2) ** 0.6
        return (x, y, z)

    for side in (-1, 1):
        for k in range(strakes):
            s0, s1 = k / strakes, (k + 1) / strakes + 0.02
            for i in range(sections):
                t0, t1 = i / sections, (i + 1) / sections
                pts = [point(t0, s0, side), point(t1, s0, side), point(t1, s1, side), point(t0, s1, side)]
                mid = sum((Vector(p) for p in pts), Vector()) / 4
                mb.face(pts, paint, None, (side, 0, -0.3 + mid.z * 0.1))
                # The inside: plain oak, set in by the planking's thickness.
                inner = [tuple(Vector(p) - Vector((side * 0.03, 0, -0.02))) for p in pts]
                mb.face(inner[::-1], oak, None, (-side, 0, 0.3))
    # Transom and gunwale rails.
    tr = [point(1, s / 6, -1) for s in range(7)] + [point(1, s / 6, 1) for s in range(6, -1, -1)]
    mb.face(tr, paint, None, (0, 1, 0))
    for side in (-1, 1):
        sweep(mb, [point(i / 16, 1.02, side) for i in range(17)], 0.035, oak, sides=5)
    # Thwarts (seats) across the middle.
    for t in (0.35, 0.62):
        hb = half_breadth(t) * 0.92
        obox(mb, (0, -L / 2 + L * t, D * 0.62), (hb * 2, 0.28, 0.05), oak)
    obj = mb.finish(name)
    smooth(obj, 35)


def stepping_stone(name):
    """A flat rounded boulder about 2.4 m across, centred on the origin (top at about z=0.23), with a
    ring of glowing script cut into its top."""
    rock = mat("rockGround", "#6b625a", 0.95)
    glow = mat("inkGlow", "#ff6a3a", 0.5, emission="#ff3a10", strength=2.5)
    mb = K.MeshBuilder([rock, glow])
    N = 28
    rnd = random.Random(8)
    prof = [(1.0, -0.24), (1.18, -0.16), (1.24, -0.02), (1.2, 0.12), (1.08, 0.2), (0.85, 0.235), (0.0, 0.24)]
    rings = []
    for r, z in prof:
        rings.append([tuple(radial(math.tau * i / N, r * (1 + rnd.uniform(-0.04, 0.04)), z)) for i in range(N)])
    rings_mesh(mb, rings[:-1], rock)
    centre = (0, 0, 0.24)
    for i in range(N):
        j = (i + 1) % N
        mb.face([rings[-2][i], rings[-2][j], centre], rock, None, (0, 0, 1))
    mb.face(rings[0][::-1], rock, None, (0, 0, -1))
    obj = mb.finish(name)
    roughen(obj, 0.12, scale=0.5, levels=2, flatten_top=0.235)
    decimate(obj, 1600)
    K.metre_uvs(obj)
    # The written ring: a thin glowing band let into the top.
    mb = K.MeshBuilder([glow])
    band = [[tuple(radial(math.tau * i / 48, r, 0.24)) for i in range(48)] for r in (1.04, 1.1)]
    rings_mesh(mb, band, glow, centre_axis=False)
    ringobj = mb.finish(f"{name}_ring")
    for p in ringobj.data.polygons:
        if p.normal.z < 0:
            p.flip()
    obj = K.join([obj, ringobj], name)
    smooth(obj, 50)


# ---------------------------------------------------------------------------- level 3 ruins

def gorge_slope(name):
    """One side of the Bell Bridge's gorge (owner, 2026-10-24: "sloping cliffs starting from the side of the
    screen, sloping towards the center but ending before the center", no grass): a craggy rock slope 105 m
    long. Game axes: it runs along -Z from z +20 to -85; across, it rises from its foot (x 9 m from the
    bridge, 48 m down) in broken ledges to its crest (x 50, 7 m above the deck), then a back slope. The
    game mirrors it for the other side."""
    rock = mat("rockGround", "#6b625a", 0.95)
    mb = K.MeshBuilder([rock])
    rnd = random.Random(31)
    NX, NZ = 34, 44
    X0, X1, Z0, Z1 = 9.0, 50.0, 20.0, -85.0
    # Each row along the gorge wobbles its foot in and out a little, so the cliff line is not a ruler edge.
    wobble = [rnd.uniform(-2.2, 2.2) for _ in range(NZ + 1)]
    for k in range(1, NZ):
        wobble[k] = (wobble[k - 1] + wobble[k] + wobble[k + 1]) / 3

    def height(u, k):
        # Steep near the foot, easing towards the crest, with ledges every few metres.
        base = -48 + 55 * (1 - (1 - u) ** 1.7)
        ledges = 2.2 * math.sin(u * 19 + k * 0.35) * (1 - u) + 1.1 * math.sin(u * 41 + k * 0.9)
        return base + ledges

    grid = []
    for k in range(NZ + 1):
        z = Z0 + (Z1 - Z0) * k / NZ
        row = []
        for i in range(NX + 1):
            u = i / NX
            x = X0 + wobble[k] * (1 - u) + (X1 - X0) * u
            row.append((x, -z, height(u, k)))  # Blender: x, -game z, game y
        # Behind the crest the ground falls away, out of view, closing the shape.
        row.append((X1 + 6, -z, -20.0))
        # Below the foot a sheer drop to the gorge floor.
        row.insert(0, (row[0][0] - 1.5, -z, -70.0))
        grid.append(row)
    for k in range(NZ):
        a, b = grid[k], grid[k + 1]
        for i in range(len(a) - 1):
            pts = [a[i], a[i + 1], b[i + 1], b[i]]
            mid = Vector(sum((Vector(p) for p in pts), Vector()) / 4)
            mb.face(pts, rock, None, (-1, 0, 1))
    obj = mb.finish(name)
    roughen(obj, 3.2, scale=6.0, levels=2, seed=5)
    roughen(obj, 0.9, scale=1.4, levels=0, seed=6)
    decimate(obj, 9000)
    K.metre_uvs(obj, 0.25)
    smooth(obj, 40)


def gorge_end(name):
    """The far wall of the Bell Bridge gorge, under the bank the bridge reaches (owner, 2026-10-24: the flat
    wall there): a craggy rock face 150 m wide (x -75..75), its top lip at y 0 along z 0, slumping forward
    (+z, towards the bridge) in broken ledges to a scree foot 70 m down. Game axes, origin on the lip."""
    rock = mat("rockGround", "#6b625a", 0.95)
    mb = K.MeshBuilder([rock])
    rnd = random.Random(41)
    NX, NY = 48, 24
    # The lip juts out and bites back by several metres along its length, so its line is broken.
    lip = [rnd.uniform(-6.0, 6.0) for _ in range(NX + 1)]
    for i in range(1, NX):
        lip[i] = (lip[i - 1] + 2 * lip[i] + lip[i + 1]) / 4
    # Where the bridge lands (x within 8 m of the middle) the lip juts out past z 0, so the deck rests on rock.
    for i in range(NX + 1):
        x = -75 + 150 * i / NX
        if abs(x) < 8:
            lip[i] = max(lip[i], 1.5)
        elif abs(x) < 14:
            lip[i] = max(lip[i], 1.5 * (14 - abs(x)) / 6 + lip[i] * (abs(x) - 8) / 6)
    grid = []
    for j in range(NY + 1):
        v = j / NY  # 0 at the lip, 1 at the foot
        y = -70.0 * v
        row = []
        for i in range(NX + 1):
            x = -75 + 150 * i / NX
            # Steep under the lip, spreading into a slope of fallen rock towards the foot, with ledges.
            # Slopes back from the lip (never a sheer wall), steepening into ledges, then a scree fan.
            z = lip[i] * (1 - v) + 34 * v ** 1.5 + 2.4 * math.sin(v * 15 + i * 0.7) * (0.5 + v)
            # The lip itself dips and rises a little.
            y = y - (abs(lip[i]) * 0.5 if j == 0 else 0)
            row.append((x, -z, y))  # Blender: x, -game z, game y
        # A lip set back over the top so the ground behind meets it.
        grid.append(row)
    # A shelf of ground running back from the lip under the bank's earth (the game keeps that behind z -72).
    top = [(p[0], 18.0, -0.3) for p in grid[0]]
    grid.insert(0, top)
    for j in range(len(grid) - 1):
        a, b = grid[j], grid[j + 1]
        for i in range(NX):
            mb.face([a[i], b[i], b[i + 1], a[i + 1]], rock, None, (0, -1, 0.3))
    obj = mb.finish(name)
    roughen(obj, 5.0, scale=9.0, levels=2, seed=8)
    roughen(obj, 1.2, scale=2.0, levels=0, seed=9)
    decimate(obj, 9000)
    K.metre_uvs(obj, 0.25)
    smooth(obj, 40)


def grass_tuft(name):
    """A clump of wild grass about 0.5 m tall and 0.6 m across (owner, 2026-10-24: the far bank's grass
    "looks like minecraft"): 28 curved, tapering blades leaning out from the middle, each a thin strip
    bent over its length, in mixed greens with dry straw-coloured ones among them (vertex colours on
    one material, 'grassBlade', which the game draws double-sided). The game scatters it by instancing."""
    blade = K.library_material("grassBlade", "#ffffff", 0.85, vertex_colors=True)
    mb = K.MeshBuilder([blade])
    rnd = random.Random(51)
    greens = [(0.30, 0.42, 0.16), (0.36, 0.48, 0.18), (0.26, 0.36, 0.14), (0.42, 0.50, 0.20)]
    dry = [(0.62, 0.56, 0.32), (0.55, 0.48, 0.26)]
    for b in range(28):
        a = rnd.uniform(0, math.tau)
        r0 = rnd.uniform(0.0, 0.12)
        base = Vector((math.cos(a) * r0, math.sin(a) * r0, 0))
        out = Vector((math.cos(a), math.sin(a), 0))
        height = rnd.uniform(0.25, 0.55)
        lean = rnd.uniform(0.1, 0.45)
        width = rnd.uniform(0.012, 0.022)
        twist = rnd.uniform(-0.6, 0.6)
        colour = rnd.choice(dry) if rnd.random() < 0.22 else rnd.choice(greens)
        tip_colour = tuple(min(1, c * 1.25) for c in colour)
        side = Vector((-out.y, out.x, 0)).normalized()
        pts = []
        N = 5
        for k in range(N + 1):
            t = k / N
            # Rises, bending over more towards the tip.
            p = base + out * (lean * height * t * t) + Vector((0, 0, height * t * (1 - 0.25 * t * lean)))
            sd = (side * math.cos(twist * t) + Vector((0, 0, 1)) * 0.0).normalized()
            w = width * (1 - t) ** 0.8
            pts.append((p - sd * w, p + sd * w, t))
        for k in range(N):
            (a0, b0, t0), (a1, b1, t1) = pts[k], pts[k + 1]
            c0 = tuple(colour[i] + (tip_colour[i] - colour[i]) * t0 for i in range(3))
            mb.face([tuple(a0), tuple(b0), tuple(b1), tuple(a1)], blade, c0 + (1.0,), tuple(out))
    obj = mb.finish(name)
    smooth(obj, 60)


def floating_rock(name):
    """The torn-out rock under a floating ruin: flat on top at z=0, 21 m by 18 m, 14 m deep."""
    rock = mat("rockGround", "#6b625a", 0.95)
    mb = K.MeshBuilder([rock])
    N = 18
    rnd = random.Random(21)
    rings = []
    for z, s in ((0.0, 1.0), (-1.5, 0.97), (-4.0, 0.82), (-7.0, 0.6), (-10.0, 0.36), (-12.5, 0.16), (-14.0, 0.03)):
        rings.append([tuple(Vector((math.cos(math.tau * i / N) * 10.5 * s * (1 + rnd.uniform(-0.12, 0.12)), math.sin(math.tau * i / N) * 9.0 * s * (1 + rnd.uniform(-0.12, 0.12)), z + rnd.uniform(-0.5, 0.5) * (z < 0)))) for i in range(N)])
    rings_mesh(mb, rings, rock, cap_bottom=False)
    mb.face(rings[0], rock, None, (0, 0, 1))
    mb.face(rings[-1][::-1], rock, None, (0, 0, -1))
    obj = mb.finish(name)
    roughen(obj, 2.2, scale=3.0, levels=2, flatten_top=0.0)
    decimate(obj, 2400)
    K.metre_uvs(obj, 0.5)
    smooth(obj, 35)


def rock_spike(name):
    """A jagged stalactite hanging from z=0 down to -9 m."""
    rock = mat("rockGround", "#6b625a", 0.95)
    mb = K.MeshBuilder([rock])
    rnd = random.Random(31)
    N = 9
    rings = [[tuple(Vector((math.cos(math.tau * i / N) * 2.4 * s * (1 + rnd.uniform(-0.15, 0.15)), math.sin(math.tau * i / N) * 2.4 * s * (1 + rnd.uniform(-0.15, 0.15)), z))) for i in range(N)] for z, s in ((0, 1), (-2.5, 0.78), (-5.5, 0.45), (-8.0, 0.14), (-9.0, 0.02))]
    rings_mesh(mb, rings, rock)
    mb.face(rings[0], rock, None, (0, 0, 1))
    mb.face(rings[-1][::-1], rock, None, (0, 0, -1))
    obj = mb.finish(name)
    roughen(obj, 0.7, scale=1.5, levels=2, flatten_top=0.0)
    decimate(obj, 900)
    K.metre_uvs(obj, 0.5)
    smooth(obj, 35)


def arch_broken(name, extent, seed):
    """Voussoir blocks round a 6 m arc in the XZ plane from angle 0 (+X) up through `extent`, the
    last block broken off; 0.9 m thick (the game turns and places it like the old torus)."""
    stone = K.lib()["academyStone"]
    mb = K.MeshBuilder([stone])
    rnd = random.Random(seed)
    R, t = 6.0, 0.9
    blocks = max(4, int(extent * R / 0.75))
    step = extent / blocks
    for k in range(blocks):
        a0, a1 = k * step + 0.006, (k + 1) * step - 0.006
        last = k == blocks - 1
        corners = []
        for a in (a0, a1):
            for r in (R - t / 2, R + t / 2):
                for y in (-t / 2, t / 2):
                    jag = rnd.uniform(-0.25, 0.1) if last and a == a1 else 0
                    aa = a + jag / R
                    corners.append(Vector((math.cos(aa) * r, y, math.sin(aa) * r)))
        c = sum(corners, Vector()) / 8
        idx = lambda ai, ri, yi: corners[ai * 4 + ri * 2 + yi]  # noqa: E731
        quads = [
            [idx(0, 0, 0), idx(0, 1, 0), idx(0, 1, 1), idx(0, 0, 1)],
            [idx(1, 0, 0), idx(1, 0, 1), idx(1, 1, 1), idx(1, 1, 0)],
            [idx(0, 0, 0), idx(0, 0, 1), idx(1, 0, 1), idx(1, 0, 0)],
            [idx(0, 1, 0), idx(1, 1, 0), idx(1, 1, 1), idx(0, 1, 1)],
            [idx(0, 0, 0), idx(1, 0, 0), idx(1, 1, 0), idx(0, 1, 0)],
            [idx(0, 0, 1), idx(0, 1, 1), idx(1, 1, 1), idx(1, 0, 1)],
        ]
        for q in quads:
            mid = sum(q, Vector()) / 4
            mb.face([tuple(p) for p in q], stone, None, tuple(mid - c))
    obj = mb.finish(name)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    mod = obj.modifiers.new("Chip", "BEVEL")
    mod.width = 0.04
    mod.segments = 1
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.select_set(False)
    K.metre_uvs(obj)
    smooth(obj, 30)


def column(name, height, r0, r1, broken=False, shaft="academyStone", trim="academyStone", seed=1, plinth=1.6):
    """A fluted column standing on z=0: square plinth, moulded base, 20-flute shaft tapering from r0 to
    r1, and a moulded capital (or a jagged break where it snapped)."""
    lib = K.lib()
    sm, tm = mat(shaft), mat(trim)
    mb = K.MeshBuilder([sm, tm])
    rnd = random.Random(seed)
    obox(mb, (0, 0, 0.18), (plinth, plinth, 0.36), tm)
    K.lathe(mb, [(r0 * 1.38, 0.36), (r0 * 1.4, 0.44), (r0 * 1.3, 0.5), (r0 * 1.18, 0.56), (r0 * 1.2, 0.62), (r0 * 1.05, 0.68)], tm, segments=32, cap_top=False)
    top = height - (0 if broken else 0.75)
    N, flutes = 60, 20
    rings = []
    zs = [0.68 + (top - 0.68) * i / 8 for i in range(9)]
    jag = [rnd.uniform(0, 0.55) for _ in range(N)] if broken else None
    for zi, z in enumerate(zs):
        u = (z - 0.68) / max(0.01, height - 0.68)
        r = r0 + (r1 - r0) * u
        ring = []
        for i in range(N):
            a = math.tau * i / N
            rr = r * (1 - 0.035 * (0.5 + 0.5 * math.cos(a * flutes)))
            zz = z - (jag[i] * (0.4 + 0.6 * abs(math.sin(a * 2.3))) if broken and zi == len(zs) - 1 else 0)
            ring.append((math.cos(a) * rr, math.sin(a) * rr, zz))
        rings.append(ring)
    rings_mesh(mb, rings, sm)
    if broken:
        # A rough, slightly dished break across the top.
        centre = (rnd.uniform(-0.1, 0.1), rnd.uniform(-0.1, 0.1), top - 0.3)
        for i in range(N):
            j = (i + 1) % N
            mb.face([rings[-1][i], rings[-1][j], centre], sm, None, (0, 0, 1))
    else:
        r = r1
        K.lathe(mb, [(r * 1.02, top), (r * 1.12, top + 0.06), (r * 1.08, top + 0.12), (r * 1.18, top + 0.22), (r * 1.42, top + 0.42), (r * 1.5, top + 0.5)], tm, segments=32, cap_top=False)
        obox(mb, (0, 0, top + 0.62), (r * 3.2, r * 3.2, 0.25), tm)
    obj = mb.finish(name)
    if broken:
        # Chip the break so it reads as snapped stone, not a cut.
        for v in obj.data.vertices:
            if v.co.z > top - 0.7 and math.hypot(v.co.x, v.co.y) < r1 * 1.2:
                v.co += Vector((rnd.uniform(-0.03, 0.03), rnd.uniform(-0.03, 0.03), rnd.uniform(-0.06, 0.04)))
    K.metre_uvs(obj)
    smooth(obj, 35)
    del lib


def column_fallen(name):
    """A 6 m fluted drum lying along X with its axis 0.55 m up, both ends broken."""
    stone = K.lib()["academyStone"]
    mb = K.MeshBuilder([stone])
    rnd = random.Random(12)
    N, flutes, r = 60, 20, 0.55
    rings = []
    for k in range(9):
        x = -3 + 6 * k / 8
        ring = []
        for i in range(N):
            a = math.tau * i / N
            rr = r * (1 - 0.035 * (0.5 + 0.5 * math.cos(a * flutes)))
            dx = (rnd.uniform(-0.35, 0.1) if k == 0 else rnd.uniform(-0.1, 0.35) if k == 8 else 0)
            ring.append((x + dx, math.cos(a) * rr, 0.55 + math.sin(a) * rr))
        rings.append(ring)
    for a_ring, b_ring in zip(rings, rings[1:]):
        for i in range(N):
            j = (i + 1) % N
            pts = [a_ring[i], a_ring[j], b_ring[j], b_ring[i]]
            mid = sum((Vector(p) for p in pts), Vector()) / 4
            mb.face(pts, stone, None, (0, mid.y, mid.z - 0.55))
    for ring, sx in ((rings[0], -1), (rings[-1], 1)):
        centre = (ring[0][0] + sx * 0.15, 0, 0.55)
        for i in range(N):
            j = (i + 1) % N
            mb.face([ring[i], ring[j], centre], stone, None, (sx, 0, 0))
    obj = mb.finish(name)
    smooth(obj, 35)


# ---------------------------------------------------------------------------- registry

BUILDERS = {
    "mosaic_clue": lambda: mosaic_clue("mosaic_clue"),
    "grimoire_chain": lambda: grimoire_chain("grimoire_chain"),
    "orrery_stand": lambda: orrery_stand("orrery_stand"),
    "orrery_sun": lambda: orrery_sun("orrery_sun"),
    "orrery_arm_1": lambda: orrery_arm("orrery_arm_1", 1.0, "academyStone", 0.12),
    "orrery_arm_2": lambda: orrery_arm("orrery_arm_2", 1.6, "wardBlue", 0.14),
    "orrery_arm_3": lambda: orrery_arm("orrery_arm_3", 2.2, "marble", 0.12),
    "practice_wand": lambda: practice_wand("practice_wand"),
    "crystal_pedestal": lambda: crystal_pedestal("crystal_pedestal"),
    "vine_deck": lambda: vine_deck("vine_deck"),
    "sky_lantern": lambda: sky_lantern("sky_lantern"),
    "lantern_post": lambda: lantern_post("lantern_post"),
    "round_tower": lambda: round_tower("round_tower"),
    "belfry_roof": lambda: belfry_roof("belfry_roof"),
    "iron_brazier": lambda: iron_brazier("iron_brazier"),
    "iron_stake": lambda: iron_stake("iron_stake"),
    "quill_shard": lambda: quill_shard("quill_shard"),
    "beach_shell": lambda: beach_shell("beach_shell"),
    "beach_boat": lambda: beach_boat("beach_boat"),
    "stepping_stone": lambda: stepping_stone("stepping_stone"),
    "floating_rock": lambda: floating_rock("floating_rock"),
    "gorge_slope": lambda: gorge_slope("gorge_slope"),
    "gorge_end": lambda: gorge_end("gorge_end"),
    "grass_tuft": lambda: grass_tuft("grass_tuft"),
    "rock_spike": lambda: rock_spike("rock_spike"),
    "arch_broken_a": lambda: arch_broken("arch_broken_a", math.pi * 0.45, 1),
    "arch_broken_b": lambda: arch_broken("arch_broken_b", math.pi * 0.38, 2),
    "column_hall": lambda: column("column_hall", 10.0, 0.65, 0.55),
    "column_hall_broken": lambda: column("column_hall_broken", 4.5, 0.65, 0.6, broken=True, seed=3),
    "column_fallen": lambda: column_fallen("column_fallen"),
    "column_citadel": lambda: column("column_citadel", 13.0, 0.8, 0.7, shaft="academyStoneDark", trim="volcanicStone", plinth=2.0),
    "column_passage_tall": lambda: column("column_passage_tall", 5.2, 0.55, 0.5, broken=True, seed=5, plinth=1.3),
    "column_passage_short": lambda: column("column_passage_short", 3.2, 0.55, 0.52, broken=True, seed=6, plinth=1.3),
    "beach_lantern": lambda: beach_lantern("beach_lantern"),
    "inkwell": lambda: inkwell("inkwell"),
    "rune_ring": lambda: rune_ring("rune_ring"),
    "sealed_book_body": lambda: sealed_book_body("sealed_book_body"),
    "sealed_book_cover": lambda: sealed_book_cover("sealed_book_cover"),
    "grimoire_clasp": lambda: grimoire_clasp("grimoire_clasp"),
}

os.makedirs(OUT, exist_ok=True)
wanted = [a for a in args if not a.startswith("--")] or list(BUILDERS)
for name in wanted:
    C.reset_scene()
    BUILDERS[name]()
    path = os.path.join(OUT, f"{name}.glb")
    K.export_kit(path)
    print(f"{name}: {C.triangle_count()} tris -> {path}")
    if "--preview" in args:
        size = max(max(o.dimensions) for o in bpy.context.scene.objects if o.type == "MESH")
        C.render_previews(os.path.join(ROOT, "assets-src", "previews", name), max(0.5, size))
