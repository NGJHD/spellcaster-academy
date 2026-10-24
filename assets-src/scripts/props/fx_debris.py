"""
Debris for the spectacle layer (owner, 2026-10-23: "generate all the effects properly with ComfyUI and
Blender … don't go back to polygon"): real broken pieces in place of the code-built rubble.

    blender --background --python assets-src/scripts/props/fx_debris.py -- [--preview]

Outputs public/assets/props/fx_debris.glb, one object per piece, each about 1 m across with its origin at
its centre, textured with the game's CC0 sets (512 px, embedded):

  stone_1..3   broken masonry: flat fractured faces, chipped edges (castle sandstone)
  slate_1..2   thin roof-slate shards
  wood_1..2    splintered plank ends (worn planks)
  clod_1..2    lumps of earth (farm soil)
  glass_1..2   thin glass shards
  book_red/blue/green  closed books knocked off shelves (leather covers in the library's colours, paper edges)
  page_1..2    loose curled pages
  metal_1..2   bent plates of armour (worn iron; tinted per use in the game)
  leaf_1..3    oak, beech and linden leaves, folded along the midrib (Flux-painted cards, fx_sprites.py)
  bird_body, bird_wing_l, bird_wing_r   a dove for the scattering flocks: a rounded body and two cambered
               wings cut from one Flux painting; each wing's origin is its shoulder, so the game flaps it there
"""
import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import bmesh  # noqa: E402
import bpy  # noqa: E402
import creature as C  # noqa: E402
from mathutils import Vector  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
TEX = os.path.join(ROOT, "public", "assets", "textures")
CARDS = os.path.join(ROOT, "assets-src", "concepts", "fx", "cards")
OUT = os.path.join(ROOT, "public", "assets", "props", "fx_debris.glb")
PREVIEWS = os.path.join(ROOT, "assets-src", "previews")
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

C.reset_scene()


def pbr(name, texture, tint="#ffffff", size=512):
    """A material from one of the game's CC0 sets (diffuse, normal, packed AO/roughness/metal)."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]

    def image(file, colour):
        img = bpy.data.images.load(os.path.join(TEX, texture, file))
        img.scale(size, size)
        if colour and tint != "#ffffff":
            # The tint goes into the pixels: the glTF exporter drops colour-mixing nodes.
            import numpy as np

            px = np.empty(size * size * 4, dtype=np.float32)
            img.pixels.foreach_get(px)
            px = px.reshape(-1, 4)
            px[:, :3] *= np.array(C.hex_rgb(tint), dtype=np.float32) * 1.6
            img.pixels.foreach_set(np.clip(px, 0, 1).ravel())
        # Packed, so the export writes the scaled pixels rather than the 2K file on disk.
        img.pack()
        img.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        node = nt.nodes.new("ShaderNodeTexImage")
        node.image = img
        return node

    diff = image("diff.jpg", True)
    nt.links.new(diff.outputs["Color"], bsdf.inputs["Base Color"])
    nor = image("nor.jpg", False)
    nmap = nt.nodes.new("ShaderNodeNormalMap")
    nt.links.new(nor.outputs["Color"], nmap.inputs["Color"])
    nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    arm = image("arm.jpg", False)
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(arm.outputs["Color"], sep.inputs["Color"])
    nt.links.new(sep.outputs["Green"], bsdf.inputs["Roughness"])
    nt.links.new(sep.outputs["Blue"], bsdf.inputs["Metallic"])
    return mat


def glass_material():
    mat = bpy.data.materials.new("glass")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.82, 0.92, 1.0, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.05
    bsdf.inputs["Alpha"].default_value = 0.45
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "BLENDED"
    else:
        mat.blend_method = "BLEND"
    return mat


def plain(name, colour, roughness=0.8, double=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*C.hex_rgb(colour), 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    mat.use_backface_culling = not double
    return mat


def hull(name, points):
    """A convex hull of scattered points: flat broken faces, like a real fragment."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    for p in points:
        bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def finish(obj, material, bevel=0.03, noise=0.0, seed=1, tris=320):
    """Chipped edges, a rough surface, UVs and the material; centred and about 1 m across."""
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    if bevel > 0:
        mod = obj.modifiers.new("Chip", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if noise > 0:
        mod = obj.modifiers.new("Subdiv", "SUBSURF")
        mod.levels = 2
        mod.subdivision_type = "SIMPLE"
        bpy.ops.object.modifier_apply(modifier=mod.name)
        tex = bpy.data.textures.new(f"{obj.name}_noise", "CLOUDS")
        tex.noise_scale = 0.35
        tex.noise_depth = 2
        mod = obj.modifiers.new("Rough", "DISPLACE")
        mod.texture = tex
        mod.strength = noise
        mod.mid_level = 0.5
        bpy.ops.object.modifier_apply(modifier=mod.name)
    if tris:
        obj.data.calc_loop_triangles()
        have = len(obj.data.loop_triangles)
        if have > tris:
            mod = obj.modifiers.new("Budget", "DECIMATE")
            mod.ratio = tris / have
            bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    C.smart_uv(obj)
    # UVs at roughly texture scale: a 1 m piece shows about a third of a 2 m texture tile.
    for loop in obj.data.uv_layers.active.data:
        loop.uv = loop.uv * 0.45
    obj.data.materials.clear()
    obj.data.materials.append(material)
    # Centre the origin and fit the piece to about 1 m.
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    obj.location = (0, 0, 0)
    size = max(obj.dimensions)
    obj.scale = (1 / size,) * 3
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)
    return obj


def scatter(rand, n, radii):
    pts = []
    while len(pts) < n:
        v = Vector((rand.uniform(-1, 1), rand.uniform(-1, 1), rand.uniform(-1, 1)))
        if v.length <= 1:
            pts.append(Vector((v.x * radii[0], v.y * radii[1], v.z * radii[2])))
    return pts


stone = pbr("stone", "large_sandstone_blocks_01")
slate = pbr("slate", "roof_slates_02")
wood = pbr("wood", "worn_planks")
soil = pbr("soil", "farm_soil")
glass = glass_material()

for i in range(3):
    r = random.Random(10 + i)
    finish(hull(f"stone_{i + 1}", scatter(r, 14 + i * 3, (1.0, 0.75 + 0.1 * i, 0.6 + 0.1 * i))), stone, bevel=0.04, noise=0.04, seed=i)

for i in range(2):
    r = random.Random(20 + i)
    finish(hull(f"slate_{i + 1}", scatter(r, 12, (1.0, 0.7, 0.07))), slate, bevel=0.01, tris=160)

for i in range(2):
    r = random.Random(30 + i)
    # A plank end: long and flat, with a splintered, jagged break at one end.
    pts = [Vector((x, y, z)) for x in (-1.0,) for y in (-0.22, 0.22) for z in (-0.06, 0.06)]
    for k in range(9):
        pts.append(Vector((r.uniform(0.35, 1.0), r.uniform(-0.22, 0.22), r.choice((-0.06, 0.06)))))
    obj = hull(f"wood_{i + 1}", pts)
    # Splinters: thin slivers left sticking out of the break.
    for k in range(3):
        y = r.uniform(-0.18, 0.18)
        sliver = hull(f"wood_{i + 1}_s{k}", [Vector((0.4, y - 0.02, -0.03)), Vector((0.4, y + 0.02, 0.03)), Vector((0.4, y + 0.02, -0.03)), Vector((r.uniform(1.05, 1.3), y + r.uniform(-0.04, 0.04), 0))])
        bpy.ops.object.select_all(action="DESELECT")
        sliver.select_set(True)
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.join()
    finish(obj, wood, bevel=0.008, tris=260)

for i in range(2):
    r = random.Random(40 + i)
    finish(hull(f"clod_{i + 1}", scatter(r, 26, (1.0, 0.85, 0.7))), soil, bevel=0.06, noise=0.3, seed=i, tris=420)

for i in range(2):
    r = random.Random(50 + i)
    pts = [Vector((r.uniform(-1, 1), r.uniform(-1, 1), 0)) for _ in range(3)] + [Vector((r.uniform(-0.6, 0.6), r.uniform(-0.6, 0.6), 0.02))]
    finish(hull(f"glass_{i + 1}", pts), glass, bevel=0.0, tris=0)

paper = plain("paper", "#efe6d2", 0.9, double=True)
for i, (colour, tint) in enumerate((("red", "#8a2c26"), ("blue", "#2c4a82"), ("green", "#2f6a3c"))):
    cover = pbr(f"cover_{colour}", "leather_white", tint=tint)
    # A closed book: a cover box with the page block set in from three sides.
    w, h, d = (0.72, 1.0, 0.18 + 0.05 * i)
    bpy.ops.mesh.primitive_cube_add(size=1)
    book = bpy.context.active_object
    book.name = f"book_{colour}"
    book.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.03, 0, 0))
    pages = bpy.context.active_object
    pages.scale = (w - 0.02, d * 0.82, h - 0.05)
    bpy.ops.object.transform_apply(location=False, scale=True)
    pages.location = (0.025, 0, 0)
    bpy.ops.object.transform_apply(location=True)
    # Covers overhang the pages: pull the cover box's page-side faces back with a boolean cut.
    cut = book.modifiers.new("Pages", "BOOLEAN")
    cut.operation = "DIFFERENCE"
    cut.object = pages
    bpy.context.view_layer.objects.active = book
    bpy.ops.object.modifier_apply(modifier=cut.name)
    C.smart_uv(book)
    # The boolean leaves an empty material slot behind, which the cover's faces would use.
    book.data.materials.clear()
    book.data.materials.append(cover)
    for poly in book.data.polygons:
        poly.material_index = 0
    C.smart_uv(pages)
    pages.data.materials.append(paper)
    bpy.ops.object.select_all(action="DESELECT")
    pages.select_set(True)
    book.select_set(True)
    bpy.context.view_layer.objects.active = book
    bpy.ops.object.join()
    mod = book.modifiers.new("Round", "BEVEL")
    mod.width = 0.012
    mod.segments = 2
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    book.location = (0, 0, 0)
    book.scale = (1 / max(book.dimensions),) * 3
    bpy.ops.object.transform_apply(location=True, scale=True)
    book.select_set(False)

for i in range(2):
    # A loose page, curled along its width and twisted at a corner.
    bm = bmesh.new()
    nx, nz = 8, 10
    grid = {}
    for a in range(nx + 1):
        for b in range(nz + 1):
            u, v = a / nx - 0.5, b / nz - 0.5
            grid[a, b] = bm.verts.new((u * 0.75, 0.12 * (u * 2) ** 2 + (0.1 + 0.05 * i) * u * v * 4, v))
    for a in range(nx):
        for b in range(nz):
            bm.faces.new((grid[a, b], grid[a + 1, b], grid[a + 1, b + 1], grid[a, b + 1]))
    mesh = bpy.data.meshes.new(f"page_{i + 1}")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(f"page_{i + 1}", mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, paper, bevel=0.0, tris=0)

iron = plain("iron", "#9a9ca3", 0.42)
iron.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 0.85
for i in range(2):
    # A bent armour plate: a curved shell with a turned-over rim.
    bm = bmesh.new()
    nx, nz = 8, 6
    top, bottom = {}, {}
    for a in range(nx + 1):
        for b in range(nz + 1):
            u, v = a / nx - 0.5, b / nz - 0.5
            bend = 0.35 * (u * 2) ** 2 + (0.08 + 0.06 * i) * (v * 2) ** 2
            top[a, b] = bm.verts.new((u, bend, v * 0.7))
            bottom[a, b] = bm.verts.new((u, bend + 0.05, v * 0.7))
    for a in range(nx):
        for b in range(nz):
            bm.faces.new((top[a, b], top[a + 1, b], top[a + 1, b + 1], top[a, b + 1]))
            bm.faces.new((bottom[a, b + 1], bottom[a + 1, b + 1], bottom[a + 1, b], bottom[a, b]))
    edge = [(a, 0) for a in range(nx)] + [(nx, b) for b in range(nz)] + [(a, nz) for a in range(nx, 0, -1)] + [(0, b) for b in range(nz, 0, -1)]
    for k, p in enumerate(edge):
        q = edge[(k + 1) % len(edge)]
        bm.faces.new((top[p], bottom[p], bottom[q], top[q]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(f"metal_{i + 1}")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(f"metal_{i + 1}", mesh)
    bpy.context.collection.objects.link(obj)
    finish(obj, iron, bevel=0.01, tris=400)

def card_material(name, file, size):
    """A painted card (fx_sprites.py "card"): its colours, alpha-clipped edges, both sides shown."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    img = bpy.data.images.load(os.path.join(CARDS, file))
    img.scale(size, size)
    img.pack()
    node = nt.nodes.new("ShaderNodeTexImage")
    node.image = img
    nt.links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
    # A Round on the alpha exports as an alpha-clipped (MASK) material: crisp edges, no sorting.
    clip = nt.nodes.new("ShaderNodeMath")
    clip.operation = "ROUND"
    nt.links.new(node.outputs["Alpha"], clip.inputs[0])
    nt.links.new(clip.outputs[0], bsdf.inputs["Alpha"])
    bsdf.inputs["Roughness"].default_value = 0.7
    mat.use_backface_culling = False
    return mat


def card(name, material, nx, ny, rect, shape, origin=(0.0, 0.0, 0.0)):
    """A subdivided card over `rect` (x0, y0, x1, y1 in metres, Blender -Y forward), its UVs the matching
    part of the painting; shape(x, y) gives each vertex's height."""
    x0, y0, x1, y1 = rect
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    grid = {}
    for a in range(nx + 1):
        for b in range(ny + 1):
            x, y = x0 + (x1 - x0) * a / nx, y0 + (y1 - y0) * b / ny
            grid[a, b] = bm.verts.new((x - origin[0], y - origin[1], shape(x, y) - origin[2]))
    for a in range(nx):
        for b in range(ny):
            face = bm.faces.new((grid[a, b], grid[a + 1, b], grid[a + 1, b + 1], grid[a, b + 1]))
            for loop in face.loops:
                p = loop.vert.co
                loop[uv].uv = UV(p.x + origin[0], p.y + origin[1])
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    obj.location = origin
    bpy.context.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def UV(x, y):
    # Metres to the painting: x across, Blender +y (backwards in the game) down the image, centred.
    return (x + 0.5, 0.5 - y)


for i, (leaf, fold) in enumerate((("leaf_1", 0.1), ("leaf_2", 0.14), ("leaf_3", 0.08))):
    # Leaves fill their painting: the card is the whole image, 1 m square, folded along the midrib and arched.
    card(leaf, card_material(leaf, f"{leaf}.png", 256), 8, 8, (-0.5, -0.5, 0.5, 0.5), lambda x, y, f=fold: f * abs(x) * 2 - 0.12 * (2 * y) ** 2 + 0.06 * x * y)

# The dove painting (512 px) holds the bird seen from above, head up: the wings span the width between rows
# 0.21 and 0.49 with the head between them, and the body and fanned tail run on to row 0.8. One metre of
# card is the full width, so in metres the wings run y -0.29..-0.01 and the tail ends at +0.3 (head forward).
dove = card_material("dove", "dove.png", 512)
SHOULDER = 0.085


def body_height(x, y):
    # A rounded back over the middle strip, highest over the chest and falling away to head and tail.
    across = max(0.0, 1 - (x / SHOULDER) ** 2)
    along = max(0.0, 1 - ((y + 0.02) / 0.2) ** 2)
    return 0.07 * math.sqrt(across) * along


# The body: the strip between the wings (head and shoulders), then the full width behind them for the
# fanned tail; under each, the same parts curved the other way, so the bird is round from below as it
# climbs away.
body = card("bird_body", dove, 6, 8, (-SHOULDER, -0.3, SHOULDER, -0.01), body_height)
parts = [
    card("bird_tail", dove, 12, 8, (-0.3, -0.01, 0.3, 0.32), body_height),
    card("bird_chest", dove, 6, 8, (-SHOULDER, -0.3, SHOULDER, -0.01), lambda x, y: -0.6 * body_height(x, y)),
    card("bird_belly", dove, 12, 8, (-0.3, -0.01, 0.3, 0.32), lambda x, y: -0.6 * body_height(x, y)),
]
bpy.ops.object.select_all(action="DESELECT")
for part in parts:
    part.select_set(True)
body.select_set(True)
bpy.context.view_layer.objects.active = body
bpy.ops.object.join()
body.select_set(False)
for side, sign in (("l", -1), ("r", 1)):
    # A wing from the shoulder to the tip, cambered (arched up across its chord) and swept slightly back.
    rect = (-0.5, -0.3, -SHOULDER, -0.01) if sign < 0 else (SHOULDER, -0.3, 0.5, -0.01)

    def camber(x, y):
        span = (abs(x) - SHOULDER) / (0.5 - SHOULDER)
        chord = (y + 0.155) / 0.145
        return 0.025 * (1 - chord * chord) * (1 - 0.5 * span) + 0.03 * span * span

    card(f"bird_wing_{side}", dove, 10, 6, rect, camber, origin=(sign * SHOULDER, 0.0, 0.03))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_cameras=False, export_lights=False, export_image_format="JPEG", export_jpeg_quality=85)
print(f"fx_debris: {C.triangle_count()} tris -> {OUT}")

if "--preview" in args:
    # All the pieces in a 6-wide grid, tilted to show their broken faces; the dove assembled at the end,
    # seen from above with its wings raised mid-flap.
    bird = [bpy.data.objects[n] for n in ("bird_body", "bird_wing_l", "bird_wing_r")]
    pieces = [o for o in bpy.context.scene.objects if o.type == "MESH" and o not in bird]
    for k, obj in enumerate(pieces):
        obj.location = ((k % 6) * 1.3 - 3.25, 0, 3.25 - (k // 6) * 1.3)
        obj.rotation_euler = (0.6, 0.5, k * 0.7)
    body, left, right = bird
    left.parent = right.parent = body
    left.rotation_euler = (0, 0.45, 0)
    right.rotation_euler = (0, -0.45, 0)
    body.scale = (2.4,) * 3
    body.location = (1.3 * 3 - 3.25 + 0.65, 0, 3.25 - 3 * 1.3)
    body.rotation_euler = (1.25, 0, 0.0)
    C.render_close(os.path.join(PREVIEWS, "fx_debris_front.png"), (0, 0, 1.3), 18)
