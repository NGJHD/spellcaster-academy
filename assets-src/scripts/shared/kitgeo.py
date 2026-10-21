"""
Low-level geometry helpers for kit props (bookshelves, windows, furniture, hero books).

Conventions: 1 Blender unit = 1 metre, Z up; the glTF exporter turns Blender -Y into the
game's +Z (the side facing the player). Materials are named after the runtime material library
(src/scene/materials.ts `MAT` keys) so the game swaps in its shared CC0-textured materials; every
mesh gets metre-scaled box-projected UVs so those textures keep their real-world size.
"""
import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

import creature as C


def library_material(name, color="#ffffff", roughness=0.7, metallic=0.0, emission=None, strength=1.0, vertex_colors=False):
    """A placeholder material whose *name* selects the runtime material (see partsGlb.ts / kitGlb.ts)."""
    existing = bpy.data.materials.get(name)
    if existing:
        return existing
    return C.make_material(name, color=color, roughness=roughness, metallic=metallic, emission=emission, emission_strength=strength, vertex_colors=vertex_colors)


def lib():
    """The shared library, by runtime name."""
    return dict(
        darkOak=library_material("darkOak", "#4a3122", 0.62),
        lightOak=library_material("lightOak", "#9a6f47", 0.6),
        agedBrass=library_material("agedBrass", "#c49a4f", 0.32, 0.92),
        steel=library_material("steel", "#7d8796", 0.38, 0.9),
        darkSteel=library_material("darkSteel", "#3e4552", 0.42, 0.85),
        academyStone=library_material("academyStone", "#cdb18a", 0.86),
        academyStoneDark=library_material("academyStoneDark", "#a88f6c", 0.9),
        marble=library_material("marble", "#ece7dd", 0.35),
        parchment=library_material("parchment", "#ecdcb7", 0.85),
        pageEdge=library_material("pageEdge", "#e4d2a8", 0.9),
        ink=library_material("ink", "#2a2018", 0.6),
        bookLeather=library_material("bookLeather", "#ffffff", 0.55, vertex_colors=True),
        burgundyLeather=library_material("burgundyLeather", "#6e1f28", 0.55),
        navyCloth=library_material("navyCloth", "#22355f", 0.95),
        velvet=library_material("velvet", "#22355f", 0.9),
        jacquard=library_material("jacquard", "#22355f", 0.9),
        greenIron=library_material("greenIron", "#2b3a33", 0.45, 0.6),
        glass=library_material("glass", "#d9efe8", 0.08),
        windowGlass=library_material("windowGlass", "#fff1d8", 0.3, emission="#ffe1b0", strength=1.0, vertex_colors=True),
        wardGold=library_material("wardGold", "#ffe3a0", 0.3, emission="#ffb640", strength=1.6),
        crystal=library_material("crystal", "#cfe8ff", 0.15, emission="#5aa8ff", strength=1.6),
        soil=library_material("soil", "#4a3726", 1.0),
    )


# ---------- Mesh assembly ----------


class MeshBuilder:
    """Collects faces (with material slot and optional per-face colour) into one bmesh."""

    def __init__(self, materials):
        self.bm = bmesh.new()
        self.materials = list(materials)
        self.col = None
        self.face_colours = {}

    def slot(self, material):
        if material not in self.materials:
            self.materials.append(material)
        return self.materials.index(material)

    def face(self, points, material, colour=None, outward=None):
        verts = [self.bm.verts.new(p) for p in points]
        f = self.bm.faces.new(verts)
        f.material_index = self.slot(material)
        f.normal_update()
        if outward is not None and f.normal.dot(Vector(outward)) < 0:
            f.normal_flip()
        if colour is not None:
            self.face_colours[f] = colour
        return f

    def quad_strip(self, ring_a, ring_b, materials, colour=None, centre=None, closed=False):
        """Faces between two rings of points; `materials` is one material per segment (or a single one)."""
        n = len(ring_a)
        count = n if closed else n - 1
        for i in range(count):
            j = (i + 1) % n
            mat = materials[i] if isinstance(materials, (list, tuple)) else materials
            pts = [ring_a[i], ring_a[j], ring_b[j], ring_b[i]]
            out = None
            if centre is not None:
                mid = sum((Vector(p) for p in pts), Vector()) / 4
                out = mid - Vector(centre)
            self.face(pts, mat, colour, out)

    def finish(self, name, merge=True):
        bm = self.bm
        if merge:
            bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.0002)
        me = bpy.data.meshes.new(name)
        colours = {f.index: c for f, c in self.face_colours.items() if f.is_valid}
        bm.to_mesh(me)
        bm.free()
        for m in self.materials:
            me.materials.append(m)
        obj = bpy.data.objects.new(name, me)
        bpy.context.collection.objects.link(obj)
        paint_face_colours(obj, colours)
        metre_uvs(obj)
        return obj


def paint_face_colours(obj, colours, default=(1, 1, 1)):
    """Corner colour attribute 'Col' (exported as COLOR_0); faces without a colour stay white."""
    me = obj.data
    attr = me.color_attributes.get("Col") or me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    for poly in me.polygons:
        c = colours.get(poly.index, default)
        lin = C.srgb_to_linear(c) if isinstance(c, (tuple, list)) and max(c) <= 1 else c
        for li in poly.loop_indices:
            attr.data[li].color = (*lin[:3], 1.0)
    me.color_attributes.active_color = attr


def metre_uvs(obj, scale=1.0):
    """Box-projected UVs measured in metres in the object's (applied) space."""
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    uv = bm.loops.layers.uv.verify()
    for f in bm.faces:
        n = f.normal
        axis = max(range(3), key=lambda i: abs(n[i]))
        for loop in f.loops:
            c = loop.vert.co
            if axis == 0:
                u, v = c.y, c.z
            elif axis == 1:
                u, v = c.x, c.z
            else:
                u, v = c.x, c.y
            loop[uv].uv = (u * scale, v * scale)
    bm.to_mesh(me)
    bm.free()


def apply_all():
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        for mod in list(obj.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)


def join(objects, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    return obj


def export_kit(path):
    """Static kit export: vertex colours on, no cameras/lights."""
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_apply=True,
        export_animations=False,
        export_cameras=False,
        export_lights=False,
        export_vertex_color="ACTIVE",
    )


# ---------- Shapes ----------


def box_faces(mb, lo, hi, material, colour=None, skip=()):
    """Axis-aligned box from corner `lo` to `hi`; `skip` names faces to omit (-x,+x,-y,+y,-z,+z)."""
    x0, y0, z0 = lo
    x1, y1, z1 = hi
    c = ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    faces = {
        "-x": [(x0, y0, z0), (x0, y1, z0), (x0, y1, z1), (x0, y0, z1)],
        "+x": [(x1, y0, z0), (x1, y0, z1), (x1, y1, z1), (x1, y1, z0)],
        "-y": [(x0, y0, z0), (x0, y0, z1), (x1, y0, z1), (x1, y0, z0)],
        "+y": [(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)],
        "-z": [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0)],
        "+z": [(x0, y0, z1), (x0, y1, z1), (x1, y1, z1), (x1, y0, z1)],
    }
    for key, pts in faces.items():
        if key in skip:
            continue
        mid = sum((Vector(p) for p in pts), Vector()) / 4
        mb.face(pts, material, colour, mid - Vector(c))


def transform_points(points, matrix):
    return [tuple(matrix @ Vector(p)) for p in points]


def arch_outline(width, height, segments=16, pointed=False):
    """Outline of a window/door opening in the XZ plane, base at z=0, centred on x=0."""
    r = width / 2
    spring = height - (r * (1.25 if pointed else 1.0))
    pts = [(-r, 0.0), (r, 0.0), (r, spring)]
    for i in range(1, segments):
        ang = math.pi * i / segments
        x = r * math.cos(ang)
        # A pointed arch is a stretched, slightly sharpened semicircle (reads as gothic at a glance).
        z = spring + (height - spring) * math.sin(ang) ** 0.75 if pointed else spring + r * math.sin(ang)
        pts.append((x, z))
    pts.append((-r, spring))
    return pts


def lathe(mb, profile, material, centre=(0, 0, 0), segments=16, colour=None, cap_top=True, cap_bottom=False, matrix=None):
    """Revolve a (radius, z) profile (bottom to top) about Z — balusters, pedestals, finials."""
    cx, cy, cz = centre
    rings = []
    for r, z in profile:
        rings.append([(cx + r * math.cos(math.tau * i / segments), cy + r * math.sin(math.tau * i / segments), cz + z) for i in range(segments)])
    if matrix is not None:
        rings = [transform_points(ring, matrix) for ring in rings]
    axis_c = Vector(centre) if matrix is None else matrix @ Vector(centre)
    for a, b in zip(rings, rings[1:]):
        for i in range(segments):
            j = (i + 1) % segments
            pts = [a[i], a[j], b[j], b[i]]
            mid = sum((Vector(p) for p in pts), Vector()) / 4
            # Outward = away from the axis at this height.
            axis_pt = axis_c + ((mid - axis_c).project(Vector((0, 0, 1)) if matrix is None else matrix.to_3x3() @ Vector((0, 0, 1))))
            if (mid - axis_pt).length < 1e-6:
                continue
            mb.face(pts, material, colour, mid - axis_pt)
    up = Vector((0, 0, 1)) if matrix is None else matrix.to_3x3() @ Vector((0, 0, 1))
    if cap_top and profile[-1][0] > 1e-4:
        mb.face(rings[-1], material, colour, up)
    if cap_bottom and profile[0][0] > 1e-4:
        mb.face(rings[0][::-1], material, colour, -up)


def rng(seed):
    return random.Random(seed)


__all__ = [
    "Matrix",
    "MeshBuilder",
    "Vector",
    "apply_all",
    "arch_outline",
    "box_faces",
    "export_kit",
    "join",
    "lathe",
    "lib",
    "metre_uvs",
    "paint_face_colours",
    "rng",
    "transform_points",
]
