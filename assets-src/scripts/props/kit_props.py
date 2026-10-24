"""
Kit props for the realism pass (owner: "improve the graphics for the smaller stuff, like books").

    blender --background --python assets-src/scripts/props/kit_props.py -- [ids…] [--preview]

Outputs public/assets/kit/<id>.glb. Materials are named after the runtime library (kitgeo.lib) and
every mesh carries metre UVs, so the game dresses them with its shared CC0 PBR textures.

  bookrow_tall_0..7   0.5 m runs of shelved books (standing sets, leaning books, flat stacks)
  bookrow_short_0..3  the same for shelves under 0.68 m apart
"""
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "shared"))
import bpy  # noqa: E402
import creature as C  # noqa: E402
import kitgeo as K  # noqa: E402

sys.path.insert(0, os.path.dirname(__file__))
import small_props as S  # noqa: E402
from mathutils import Matrix, Vector  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
OUT = os.path.join(ROOT, "public", "assets", "kit")
args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []

# ---------------------------------------------------------------------------- books

# Old leather and cloth bindings (sRGB); a run of a set shares one colour.
BINDINGS = [
    (0.36, 0.10, 0.12),
    (0.43, 0.13, 0.16),
    (0.14, 0.25, 0.18),
    (0.12, 0.23, 0.20),
    (0.11, 0.16, 0.27),
    (0.16, 0.25, 0.43),
    (0.54, 0.38, 0.22),
    (0.35, 0.21, 0.13),
    (0.11, 0.10, 0.09),
    (0.24, 0.14, 0.21),
    (0.54, 0.42, 0.17),
    (0.18, 0.29, 0.29),
    (0.60, 0.54, 0.42),
    (0.45, 0.30, 0.18),
]


def book(mb, m, w, h, d, colour, matrix, bands=2, label=False, simple=False):
    """One book standing on z=0: spine (rounded) faces -Y, back at y=+d/2, page edges on top.

    Only faces that can be seen on a shelf are built (no bottom, no back). `simple` is the distant
    version: flat spine, no gilt bands, no label (same footprint, so layouts match)."""
    if simple:
        bands, label = 0, False
    r = min(0.012, w * 0.45, d * 0.2)
    c_y = -d / 2 + r
    arc = []
    n = 1 if simple else 3
    for i in range(n + 1):
        a = math.pi + math.pi * i / n
        arc.append(((w / 2) * math.cos(a), c_y + r * math.sin(a)))
    section = [(-w / 2, d / 2)] + arc + [(w / 2, d / 2)]
    # Height cuts: bands of gilt and an optional title label on the spine.
    cuts = [0.0]
    band_spans = []
    if bands:
        top_gap = h * 0.08
        for k in range(bands):
            z = h - top_gap - k * h * 0.11
            band_spans.append((z - 0.008, z))
        z = h * 0.12
        band_spans.append((z - 0.008, z))
    label_span = (h * 0.6, h * 0.67) if label else None
    for a, b in band_spans:
        cuts += [a, b]
    if label_span:
        cuts += list(label_span)
    cuts.append(h)
    cuts = sorted(set(round(z, 5) for z in cuts if 0 <= z <= h))
    centre = Vector((0, 0, h / 2))

    def mat_for(edge, z0, z1):
        on_spine = 1 <= edge <= n
        if not on_spine:
            return m["bookLeather"], colour
        mid = (z0 + z1) / 2
        for a, b in band_spans:
            if a <= mid <= b:
                return m["agedBrass"], None
        if label_span and label_span[0] <= mid <= label_span[1] and n // 2 - 1 <= edge - 1 <= n // 2:
            return m["parchment"], None
        return m["bookLeather"], colour

    last = len(section) - 2
    for e in (0, last):
        # Flat sides span the full height in one face.
        (x0, y0), (x1, y1) = section[e], section[e + 1]
        pts = [(x0, y0, 0), (x1, y1, 0), (x1, y1, h), (x0, y0, h)]
        out = Vector(((x0 + x1) / 2, (y0 + y1) / 2, 0))
        mb.face(K.transform_points(pts, matrix), m["bookLeather"], colour, matrix.to_3x3() @ out)
    for zi in range(len(cuts) - 1):
        z0, z1 = cuts[zi], cuts[zi + 1]
        for e in range(1, last):
            (x0, y0), (x1, y1) = section[e], section[e + 1]
            pts = [(x0, y0, z0), (x1, y1, z0), (x1, y1, z1), (x0, y0, z1)]
            mat, col = mat_for(e, z0, z1)
            mid = Vector(((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
            out = mid - centre
            out.z = 0
            mb.face(K.transform_points(pts, matrix), mat, col, matrix.to_3x3() @ out)
    up = matrix.to_3x3() @ Vector((0, 0, 1))
    if simple:
        mb.face(K.transform_points([(x, y, h) for x, y in section][::-1], matrix), m["pageEdge"], None, up)
        return
    # Top: a leather rim (the boards) around the page edges.
    inset = min(0.003, w * 0.15)
    top_outer = [(x, y, h) for x, y in section]
    top_inner = [(max(-w / 2 + inset, min(w / 2 - inset, x)), min(d / 2, max(-d / 2 + inset * 2, y)), h + 0.0005) for x, y in section]
    mb.face(K.transform_points(top_inner[::-1], matrix), m["pageEdge"], None, up)
    for e in range(len(section) - 1):
        pts = [top_outer[e], top_outer[e + 1], top_inner[e + 1], top_inner[e]]
        mb.face(K.transform_points(pts, matrix), m["bookLeather"], colour, up)


def tinted(rand, base):
    k = 0.82 + rand.random() * 0.3
    return tuple(min(1.0, c * k) for c in base)


def book_row(name, seed, max_h, length=0.5, simple=False):
    m = K.lib()
    rand = K.rng(seed)
    mb = K.MeshBuilder([m["bookLeather"], m["pageEdge"], m["agedBrass"], m["parchment"]])
    back = 0.17
    x = 0.004
    while x < length - 0.03:
        roll = rand.random()
        room = length - x
        if roll < 0.14 and room > 0.2:
            # A flat stack (spines out), two to five books.
            count = rand.randint(2, 5)
            depth_w = 0.16 + rand.random() * 0.1
            z = 0.0
            for _ in range(count):
                w = 0.03 + rand.random() * 0.035
                d = 0.17 + rand.random() * 0.07
                h = min(depth_w, room - 0.01)
                colour = tinted(rand, rand.choice(BINDINGS))
                # Lying book: rotate the standing book onto its side (its "w" becomes vertical).
                mat = Matrix.Translation((x + h / 2 + rand.uniform(-0.01, 0.01), back - d / 2, z + w / 2)) @ Matrix.Rotation(math.pi / 2, 4, "Y") @ Matrix.Translation((0, 0, -h / 2))
                book(mb, m, w, h, d, colour, mat, bands=rand.choice((0, 1, 2)), simple=simple)
                z += w
            x += depth_w + 0.02
        elif roll < 0.22 and room > 0.12 and x > 0.06:
            # A book leaning back onto the previous run, its foot pulled out across a gap.
            w = 0.03 + rand.random() * 0.03
            h = max_h * (0.7 + rand.random() * 0.28)
            d = 0.18 + rand.random() * 0.07
            tilt = math.radians(12 + rand.random() * 12)
            colour = tinted(rand, rand.choice(BINDINGS))
            foot = x + h * math.sin(tilt) + w / 2
            # Pivot on the outer bottom corner so the book rests on the shelf.
            mat = Matrix.Translation((foot + w / 2, back - d / 2, 0)) @ Matrix.Rotation(-tilt, 4, "Y") @ Matrix.Translation((-w / 2, 0, 0))
            book(mb, m, w, h, d, colour, mat, bands=2, label=rand.random() < 0.3, simple=simple)
            x = foot + w / 2 + 0.01 + rand.random() * 0.03
        else:
            # A run of standing books; sets share height and binding.
            count = rand.randint(3, 9)
            is_set = rand.random() < 0.45
            set_colour = rand.choice(BINDINGS)
            set_h = max_h * (0.66 + rand.random() * 0.32)
            set_w = 0.03 + rand.random() * 0.03
            set_d = 0.19 + rand.random() * 0.07
            for _ in range(count):
                w = set_w * (0.95 + rand.random() * 0.1) if is_set else 0.022 + rand.random() * 0.055
                if x + w > length - 0.004:
                    break
                h = set_h if is_set else max_h * (0.6 + rand.random() * 0.4)
                d = set_d if is_set else 0.17 + rand.random() * 0.1
                colour = tinted(rand, set_colour if is_set else rand.choice(BINDINGS))
                mat = Matrix.Translation((x + w / 2, back - d / 2, 0))
                book(mb, m, w, h, d, colour, mat, bands=2 if is_set else rand.choice((0, 0, 1, 2)), label=(is_set and rand.random() < 0.5) or rand.random() < 0.15, simple=simple)
                x += w + 0.0015
    obj = mb.finish(name)
    smooth_by_angle(obj, 40)


def smooth_by_angle(obj, degrees):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(degrees))


# ---------------------------------------------------------------------------- windows


def clip_polygon(subject, clip):
    """Sutherland–Hodgman: clip a polygon (list of (x, z)) by a convex polygon (counter-clockwise)."""

    def inside(p, a, b):
        return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= -1e-9

    def intersect(p, q, a, b):
        x1, y1 = p
        x2, y2 = q
        x3, y3 = a
        x4, y4 = b
        den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        if abs(den) < 1e-12:
            return q
        t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den
        return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))

    out = list(subject)
    for i in range(len(clip)):
        a, b = clip[i], clip[(i + 1) % len(clip)]
        src, out = out, []
        if not src:
            break
        for j in range(len(src)):
            p, q = src[j], src[(j + 1) % len(src)]
            if inside(q, a, b):
                if not inside(p, a, b):
                    out.append(intersect(p, q, a, b))
                out.append(q)
            elif inside(p, a, b):
                out.append(intersect(p, q, a, b))
    return out


def span_at(outline, z):
    """Horizontal extent of a convex outline at height z."""
    xs = []
    for i in range(len(outline)):
        (x0, z0), (x1, z1) = outline[i], outline[(i + 1) % len(outline)]
        if (z0 - z) * (z1 - z) <= 0 and z0 != z1:
            xs.append(x0 + (z - z0) / (z1 - z0) * (x1 - x0))
    return (min(xs), max(xs)) if xs else None


def height_at(outline, x):
    zs = []
    for i in range(len(outline)):
        (x0, z0), (x1, z1) = outline[i], outline[(i + 1) % len(outline)]
        if (x0 - x) * (x1 - x) <= 0 and x0 != x1:
            zs.append(z0 + (x - x0) / (x1 - x0) * (z1 - z0))
    return max(zs) if zs else 0.0


def extrude_outline_ring(mb, outer, inner, y0, y1, material):
    """A frame: the band between two closed outlines (XZ), extruded from y0 to y1 (y1 nearer the player is smaller)."""
    centre = (0, (y0 + y1) / 2, sum(z for _, z in outer) / len(outer))
    n = len(outer)
    for i in range(n):
        j = (i + 1) % n
        # Front face (towards -Y)
        mb.face([(outer[i][0], y1, outer[i][1]), (outer[j][0], y1, outer[j][1]), (inner[j][0], y1, inner[j][1]), (inner[i][0], y1, inner[i][1])], material, None, (0, -1, 0))
        # Outer edge
        pts = [(outer[i][0], y0, outer[i][1]), (outer[j][0], y0, outer[j][1]), (outer[j][0], y1, outer[j][1]), (outer[i][0], y1, outer[i][1])]
        mid = Vector(((outer[i][0] + outer[j][0]) / 2, 0, (outer[i][1] + outer[j][1]) / 2))
        mb.face(pts, material, None, mid - Vector((0, 0, centre[2])))
        # Inner reveal
        pts = [(inner[i][0], y0, inner[i][1]), (inner[j][0], y0, inner[j][1]), (inner[j][0], y1, inner[j][1]), (inner[i][0], y1, inner[i][1])]
        mid = Vector(((inner[i][0] + inner[j][0]) / 2, 0, (inner[i][1] + inner[j][1]) / 2))
        mb.face(pts, material, None, Vector((0, 0, centre[2])) - mid)


def offset_outline(outline, d):
    """Grow a convex outline (CCW) by d along vertex normals (good enough for frames)."""
    n = len(outline)
    out = []
    for i in range(n):
        p0, p1, p2 = outline[i - 1], outline[i], outline[(i + 1) % n]
        e1 = Vector((p1[0] - p0[0], p1[1] - p0[1])).normalized()
        e2 = Vector((p2[0] - p1[0], p2[1] - p1[1])).normalized()
        n1 = Vector((e1.y, -e1.x))
        n2 = Vector((e2.y, -e2.x))
        nv = (n1 + n2).normalized()
        k = d / max(0.35, nv.dot(n1))
        out.append((p1[0] + nv.x * k, p1[1] + nv.y * k))
    return out


def window(name, width, height, seed, frame=True):
    """Arched leaded window, origin at the bottom centre of the opening on the wall face (Y=0).

    frame=False builds only the leaded glazing (facades bring their own stone surround)."""
    m = K.lib()
    rand = K.rng(seed)
    mb = K.MeshBuilder([m["academyStoneDark"], m["darkSteel"], m["windowGlass"]])
    stone, lead, glass = m["academyStoneDark"], m["darkSteel"], m["windowGlass"]
    pointed = height / width > 1.9
    opening = K.arch_outline(width, height, segments=20, pointed=pointed)
    if not frame:
        lights = 1
    # Surround: a moulded frame in two steps, plus a projecting sill.
    frame1 = offset_outline(opening, 0.1)
    frame2 = offset_outline(opening, 0.2)
    if frame:
        extrude_outline_ring(mb, frame1, opening, 0.0, -0.14, stone)
        extrude_outline_ring(mb, frame2, frame1, 0.0, -0.08, stone)
        K.box_faces(mb, (-width / 2 - 0.3, -0.2, -0.12), (width / 2 + 0.3, 0.0, 0.0), stone, skip=("+y",))
        K.box_faces(mb, (-width / 2 - 0.22, -0.16, -0.24), (width / 2 + 0.22, 0.0, -0.12), stone, skip=("+y",))
    # Mullions and a transom divide the lights.
    lights = (1 if width < 1.5 else (2 if width < 2.3 else 3)) if frame else 1
    spring = opening[2][1]
    for k in range(1, lights):
        x = -width / 2 + width * k / lights
        top = height_at(opening, x)
        K.box_faces(mb, (x - 0.05, -0.12, 0.0), (x + 0.05, -0.02, top), stone, skip=("+y",))
    if frame:
        transom = spring * 0.62
        K.box_faces(mb, (-width / 2, -0.12, transom - 0.05), (width / 2, -0.02, transom + 0.05), stone, skip=("+y",))
    # Leaded quarries: glass cells clipped to the arch, each with its own old-glass tint.
    qw, qh = width / max(2, round(width / 0.26)), 0.32
    ccw = opening[:]  # arch_outline is counter-clockwise in (x, z)
    x = -width / 2
    while x < width / 2 - 1e-6:
        z = 0.0
        while z < height - 1e-6:
            cell = [(x, z), (x + qw, z), (x + qw, z + qh), (x, z + qh)]
            poly = clip_polygon(cell, ccw)
            if len(poly) >= 3:
                warm = rand.random()
                b = 0.78 + rand.random() * 0.24
                tint = (b, b * (0.95 + warm * 0.04), b * (0.86 + (1 - warm) * 0.16))
                mb.face([(px, -0.03, pz) for px, pz in poly], glass, tint, (0, -1, 0))
            z += qh
        x += qw
    # Lead cames along the grid lines (thin bars just in front of the glass).
    t = 0.008
    xs = [-width / 2 + qw * i for i in range(1, round(width / qw))]
    for cx in xs:
        top = height_at(opening, cx)
        K.box_faces(mb, (cx - t, -0.04, 0.0), (cx + t, -0.03, top), lead, skip=("+y",))
    zc = qh
    while zc < height - 0.02:
        sp = span_at(opening, zc)
        if sp:
            K.box_faces(mb, (sp[0], -0.04, zc - t), (sp[1], -0.03, zc + t), lead, skip=("+y",))
        zc += qh
    mb.finish(name)


# ---------------------------------------------------------------------------- furniture & fittings

BALUSTER = [(0.035, 0.0), (0.035, 0.06), (0.026, 0.08), (0.03, 0.12), (0.045, 0.26), (0.03, 0.38), (0.022, 0.45), (0.022, 0.6), (0.03, 0.66), (0.022, 0.7), (0.022, 0.76)]


def balustrade(name, length=2.0, height=1.0):
    """Oak gallery railing: plinth rail, turned balusters, moulded handrail. Runs along +X from 0."""
    m = K.lib()
    mb = K.MeshBuilder([m["darkOak"]])
    oak = m["darkOak"]
    K.box_faces(mb, (0, -0.06, 0), (length, 0.06, 0.1), oak)
    K.box_faces(mb, (0, -0.075, 0.09), (length, 0.075, 0.12), oak)
    top = height - 0.09
    K.box_faces(mb, (0, -0.055, top), (length, 0.055, top + 0.05), oak)
    K.box_faces(mb, (0, -0.075, top + 0.05), (length, 0.075, top + 0.09), oak)
    scale_z = (top - 0.12) / BALUSTER[-1][1]
    profile = [(r, 0.12 + z * scale_z) for r, z in BALUSTER]
    count = int(length / 0.16)
    for i in range(count):
        x = (i + 0.5) * length / count
        K.lathe(mb, profile, oak, centre=(x, 0, 0), segments=8, cap_top=False)
    obj = mb.finish(name)
    smooth_by_angle(obj, 50)


def pedestal(name, radius=0.8, height=1.05):
    """Carved stone reading pedestal (Grimoire): stepped base, fluted drum, moulded cap."""
    m = K.lib()
    mb = K.MeshBuilder([m["academyStoneDark"], m["agedBrass"]])
    stone = m["academyStoneDark"]
    r = radius
    base = [(r * 1.12, 0.0), (r * 1.12, 0.08), (r * 1.02, 0.1), (r * 1.02, 0.16), (r * 0.9, 0.2)]
    drum = [(r * 0.78, 0.24), (r * 0.74, 0.3), (r * 0.72, height - 0.24), (r * 0.76, height - 0.2)]
    cap = [(r * 0.86, height - 0.16), (r * 0.98, height - 0.1), (r * 1.02, height - 0.06), (r * 1.0, height - 0.02), (r * 0.98, height)]
    K.lathe(mb, base + drum + cap, stone, segments=48)
    # Brass reading ring inlaid in the top.
    K.lathe(mb, [(r * 0.62, height), (r * 0.62, height + 0.012), (r * 0.66, height + 0.012), (r * 0.66, height)], m["agedBrass"], segments=48, cap_top=False)
    # Flutes: shallow vertical ribs around the drum.
    for i in range(16):
        a = math.tau * i / 16
        c = Vector((math.cos(a) * r * 0.73, math.sin(a) * r * 0.73, 0.32))
        K.lathe(mb, [(0.022, 0.0), (0.022, height - 0.62)], stone, centre=tuple(c), segments=6)
    obj = mb.finish(name)
    smooth_by_angle(obj, 35)


def gallery_bench(name, length=1.8, depth=0.5, height=0.48):
    """Upholstered gallery bench: turned oak legs, apron rails, rounded velvet cushion (runs along X)."""
    m = K.lib()
    mb = K.MeshBuilder([m["darkOak"], m["velvet"]])
    oak = m["darkOak"]
    hl, hd = length / 2, depth / 2
    leg = [(0.035, 0.0), (0.03, 0.04), (0.04, 0.09), (0.028, 0.16), (0.03, 0.24), (0.045, 0.3), (0.045, height - 0.12)]
    for x in (-hl + 0.07, hl - 0.07):
        for y in (-hd + 0.07, hd - 0.07):
            K.lathe(mb, leg, oak, centre=(x, y, 0), segments=10)
    rail_z = height - 0.12
    K.box_faces(mb, (-hl + 0.04, -hd + 0.04, rail_z - 0.08), (hl - 0.04, -hd + 0.07, rail_z + 0.01), oak)
    K.box_faces(mb, (-hl + 0.04, hd - 0.07, rail_z - 0.08), (hl - 0.04, hd - 0.04, rail_z + 0.01), oak)
    K.box_faces(mb, (-hl + 0.04, -hd + 0.04, rail_z - 0.08), (-hl + 0.07, hd - 0.04, rail_z + 0.01), oak)
    K.box_faces(mb, (hl - 0.07, -hd + 0.04, rail_z - 0.08), (hl - 0.04, hd - 0.04, rail_z + 0.01), oak)
    K.box_faces(mb, (-hl, -hd, rail_z + 0.01), (hl, hd, rail_z + 0.04), oak)
    # Cushion: a rounded slab (super-ellipse plan, domed top).
    nu, nv = 20, 6
    top = height + 0.03
    base = rail_z + 0.04
    grid = {}
    for i in range(nu + 1):
        for j in range(nv + 1):
            u = -1 + 2 * i / nu
            v = -1 + 2 * j / nv
            x = u * (hl - 0.01)
            y = v * (hd - 0.01)
            edge = max(abs(u) ** 6, abs(v) ** 4)
            z = top - 0.035 * edge ** 0.5
            grid[i, j] = (x, y, z)
    for i in range(nu):
        for j in range(nv):
            mb.face([grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]], m["velvet"], None, (0, 0, 1))
    ring = [grid[i, 0] for i in range(nu + 1)] + [grid[nu, j] for j in range(1, nv + 1)] + [grid[i, nv] for i in range(nu - 1, -1, -1)] + [grid[0, j] for j in range(nv - 1, 0, -1)]
    low = [(x, y, base) for x, y, _ in ring]
    for k in range(len(ring)):
        a, b = ring[k], ring[(k + 1) % len(ring)]
        c, d = low[(k + 1) % len(ring)], low[k]
        mid = Vector(((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0))
        mb.face([a, b, c, d], m["velvet"], None, tuple(mid))
    obj = mb.finish(name)
    smooth_by_angle(obj, 40)


def fountain_basin(name):
    """Carved stone healing fountain: moulded pedestal, wide basin with a lip and a small upper bowl."""
    m = K.lib()
    mb = K.MeshBuilder([m["academyStone"]])
    stone = m["academyStone"]
    profile = [
        (0.0, 0.0), (0.62, 0.0), (0.62, 0.08), (0.55, 0.12), (0.4, 0.18), (0.3, 0.3), (0.26, 0.5), (0.3, 0.58),
        (0.55, 0.64), (0.72, 0.76), (0.78, 0.86), (0.8, 0.92), (0.74, 0.94), (0.7, 0.88), (0.6, 0.84), (0.0, 0.84),
    ]
    K.lathe(mb, profile, stone, segments=40, cap_top=False)
    bowl = [(0.0, 0.84), (0.06, 0.84), (0.08, 1.2), (0.12, 1.28), (0.26, 1.34), (0.3, 1.4), (0.27, 1.42), (0.24, 1.37), (0.0, 1.36)]
    K.lathe(mb, bowl, stone, segments=28, cap_top=False)
    obj = mb.finish(name)
    smooth_by_angle(obj, 35)


def bar_between(mb, a, b, w, material, outward):
    """A square-section bar from a to b (w wide), oriented so one face looks along `outward`."""
    a, b = Vector(a), Vector(b)
    d = (b - a).normalized()
    side = d.cross(Vector(outward)).normalized() * (w / 2)
    up = Vector(outward).normalized() * (w / 2)
    corners = [(-side - up), (side - up), (side + up), (-side + up)]
    ra = [tuple(a + c) for c in corners]
    rb = [tuple(b + c) for c in corners]
    mb.quad_strip(ra, rb, material, centre=tuple((a + b) / 2), closed=True)


def greenhouse_bay(name, half_width=10.5, wall_h=8.0, rise=4.7, length=4.0):
    """One 4 m bay of the Victorian glasshouse: stone dwarf walls, iron ribs, glazing bars, purlins and
    glass, running from y=0 to y=+length (the game places bays along -Z)."""
    m = K.lib()
    iron, glass, stone = m["greenIron"], m["glass"], m["academyStoneDark"]
    mb = K.MeshBuilder([iron, glass, stone])
    # Profile across the house (x, z): up the side wall, over the elliptical roof, down the other side.
    prof = []
    for k in range(5):
        prof.append((-half_width, 0.6 + (wall_h - 0.6) * k / 4))
    arc = 12
    for k in range(1, arc):
        a = math.pi - math.pi * k / arc
        prof.append((half_width * math.cos(a), wall_h + rise * math.sin(a)))
    for k in range(4, -1, -1):
        prof.append((half_width, 0.6 + (wall_h - 0.6) * k / 4))
    # Glass panes between consecutive profile points across the bay (two panes along the length).
    for k in range(len(prof) - 1):
        (x0, z0), (x1, z1) = prof[k], prof[k + 1]
        for j in range(2):
            y0, y1 = length * j / 2, length * (j + 1) / 2
            mid = Vector(((x0 + x1) / 2, 0, (z0 + z1) / 2))
            out = Vector((mid.x, 0, mid.z - wall_h * 0.5)) if abs(mid.x) < half_width - 0.01 else Vector((math.copysign(1, mid.x), 0, 0))
            mb.face([(x0, y0, z0), (x1, y0, z1), (x1, y1, z1), (x0, y1, z0)], glass, None, tuple(out))
    # Main rib at y=0 (deep T-section reads as cast iron), glazing bars at mid-bay, purlins along.
    for y, w in ((0.0, 0.12), (length / 2, 0.05)):
        for k in range(len(prof) - 1):
            (x0, z0), (x1, z1) = prof[k], prof[k + 1]
            mid = Vector(((x0 + x1) / 2, 0, (z0 + z1) / 2))
            out = Vector((mid.x, 0, mid.z - wall_h * 0.5)) if abs(mid.x) < half_width - 0.01 else Vector((math.copysign(1, mid.x), 0, 0))
            bar_between(mb, (x0, y, z0), (x1, y, z1), w, iron, out)
    for k in range(len(prof)):
        x, z = prof[k]
        out = Vector((x, 0, z - wall_h * 0.5)) if abs(x) < half_width - 0.01 else Vector((math.copysign(1, x), 0, 0))
        bar_between(mb, (x, 0.0, z), (x, length, z), 0.045, iron, out)
    # Stone dwarf walls with a coping course.
    for sgn in (-1, 1):
        x0, x1 = sorted((sgn * half_width, sgn * (half_width - 0.35)))
        K.box_faces(mb, (x0, 0.0, 0.0), (x1, length, 0.55), stone)
        K.box_faces(mb, (x0 - 0.05, 0.0, 0.55), (x1 + 0.05, length, 0.62), stone)
    mb.finish(name)


def greenhouse_end(name, half_width=10.5, wall_h=8.0, rise=4.7):
    """Glazed gable end in the XZ plane (faces -Y): dwarf wall, iron grid following the roof, double doors.
    It follows the bays' own 12-sided roof arch exactly (owner, 2026-10-24: the bars did not line up where
    the end wall met the roof), with a rib round its edge and transoms at the bays' purlin heights."""
    m = K.lib()
    iron, glass, stone, oak = m["greenIron"], m["glass"], m["academyStoneDark"], m["darkOak"]
    mb = K.MeshBuilder([iron, glass, stone, oak])
    # The roof arch as greenhouse_bay builds it: 12 straight segments from eave to eave.
    arch = [(half_width * math.cos(math.pi - math.pi * k / 12), wall_h + rise * math.sin(math.pi * k / 12)) for k in range(13)]

    def roof_z(x):
        """Height of the arch above x."""
        for (x0, z0), (x1, z1) in zip(arch, arch[1:]):
            if x0 <= x <= x1:
                return z0 + (z1 - z0) * (x - x0) / max(1e-6, x1 - x0)
        return wall_h

    def roof_x(z):
        """Half-width of the arch at height z (right side)."""
        if z <= wall_h:
            return half_width
        right = arch[6:]
        for (x0, z0), (x1, z1) in zip(right, right[1:]):
            if z1 <= z <= z0:
                return x0 + (x1 - x0) * (z0 - z) / max(1e-6, z0 - z1)
        return 0.0

    outline = [(-half_width, 0.6), (half_width, 0.6)] + list(reversed(arch))
    # Glass as a fan of triangles from the centre of the gable.
    c = (0.0, (wall_h + 0.6) / 2)
    for k in range(len(outline)):
        p0, p1 = outline[k], outline[(k + 1) % len(outline)]
        mb.face([(c[0], 0.0, c[1]), (p0[0], 0.0, p0[1]), (p1[0], 0.0, p1[1])], glass, None, (0, -1, 0))
    # The edge rib: up each side wall and round the arch, as deep as the bays' main ribs.
    edge = [(-half_width, 0.6)] + arch + [(half_width, 0.6)]
    for (x0, z0), (x1, z1) in zip(edge, edge[1:]):
        mid = Vector(((x0 + x1) / 2, 0, (z0 + z1) / 2))
        out = Vector((mid.x, 0, mid.z - wall_h * 0.5)) if abs(mid.x) < half_width - 0.01 else Vector((math.copysign(1, mid.x), 0, 0))
        bar_between(mb, (x0, -0.06, z0), (x1, -0.06, z1), 0.12, iron, out)
    # Mullions every 1.5 m up to the arch.
    x = -half_width + 1.5
    while x < half_width - 0.1:
        bottom = 3.2 if abs(x) < 1.35 else 0.6  # keep the doorway clear
        K.box_faces(mb, (x - 0.04, -0.08, bottom), (x + 0.04, 0.0, roof_z(x)), iron)
        x += 1.5
    # Transoms at the bays' purlin heights, so the bars run on round the corners: the side wall's four
    # courses, then each corner of the roof arch.
    heights = [0.6 + (wall_h - 0.6) * k / 4 for k in range(1, 5)] + [z for _, z in arch[7:12]]
    for z in heights:
        hw = roof_x(z)
        if z < 3.25:
            for a, b in ((-hw, -1.3), (1.3, hw)):
                K.box_faces(mb, (a, -0.07, z - 0.03), (b, 0.0, z + 0.03), iron)
        else:
            K.box_faces(mb, (-hw, -0.07, z - 0.03), (hw, 0.0, z + 0.03), iron)
    K.box_faces(mb, (-half_width, -0.3, 0.0), (half_width, 0.0, 0.55), stone)
    K.box_faces(mb, (-half_width - 0.05, -0.35, 0.55), (half_width + 0.05, 0.05, 0.62), stone)
    # Double door with an iron frame and glazed upper panels.
    K.box_faces(mb, (-1.3, -0.12, 0.0), (1.3, 0.02, 3.2), iron, skip=("+y",))
    for sx in (-1, 1):
        x0, x1 = sorted((sx * 0.05, sx * 1.2))
        K.box_faces(mb, (x0, -0.16, 0.05), (x1, -0.1, 1.2), oak)
        K.box_faces(mb, (x0, -0.16, 1.2), (x1, -0.1, 1.28), oak)
        K.box_faces(mb, (x0, -0.16, 3.0), (x1, -0.1, 3.1), oak)
        K.box_faces(mb, ((x0 + x1) / 2 - 0.03, -0.16, 1.28), ((x0 + x1) / 2 + 0.03, -0.1, 3.0), oak)
    mb.finish(name)


def observatory_dome(name, radius=14.0, slit_deg=46.0):
    """Planked oak dome seen from inside, iron ribs, and an open shutter slit (centred on +Y = the
    game's -Z, over the arena) through which the night sky shows. Spring line at z=0."""
    m = K.lib()
    oak, iron, brass = m["darkOak"], m["greenIron"], m["agedBrass"]
    mb = K.MeshBuilder([oak, iron, brass])
    seg_az, seg_el = 64, 14
    half = math.radians(slit_deg / 2)

    def p(az, el, r=radius):
        return (r * math.cos(el) * math.cos(az), r * math.cos(el) * math.sin(az), r * math.sin(el))

    for i in range(seg_az):
        a0 = math.tau * i / seg_az
        a1 = math.tau * (i + 1) / seg_az
        mid = (a0 + a1) / 2
        d = abs((mid - math.pi / 2 + math.pi) % math.tau - math.pi)
        for j in range(seg_el):
            e0 = (math.pi / 2) * j / seg_el
            e1 = (math.pi / 2) * (j + 1) / seg_el
            if d < half and j < seg_el - 1:
                continue  # the open shutter (stops short of the crown so the slit reads as a cut)
            pts = [p(a0, e0), p(a1, e0), p(a1, e1), p(a0, e1)]
            c = sum((Vector(q) for q in pts), Vector()) / 4
            mb.face(pts, oak, None, tuple(-c))
    # Ribs (16) and the two shutter edges, standing proud of the planking.
    for i in range(16):
        az = math.tau * i / 16
        if abs((az - math.pi / 2 + math.pi) % math.tau - math.pi) < half:
            continue
        for j in range(seg_el):
            e0 = (math.pi / 2) * j / seg_el
            e1 = (math.pi / 2) * (j + 1) / seg_el
            a, b = p(az, e0, radius - 0.12), p(az, e1, radius - 0.12)
            bar_between(mb, a, b, 0.18, iron, tuple(-Vector(a)))
    for edge in (math.pi / 2 - half, math.pi / 2 + half):
        for j in range(seg_el - 1):
            e0 = (math.pi / 2) * j / seg_el
            e1 = (math.pi / 2) * (j + 1) / seg_el
            a, b = p(edge, e0, radius - 0.15), p(edge, e1, radius - 0.15)
            bar_between(mb, a, b, 0.26, brass, tuple(-Vector(a)))
    # Ring beam at the spring line.
    for i in range(seg_az):
        a, b = p(math.tau * i / seg_az, 0.0, radius - 0.15), p(math.tau * (i + 1) / seg_az, 0.0, radius - 0.15)
        bar_between(mb, a, b, 0.32, iron, tuple(-Vector(a)))
    mb.finish(name)


def telescope(name):
    """Great brass refractor on an equatorial head and cast-iron pier. Tube points along +Y, tilted up."""
    m = K.lib()
    brass, iron, dark = m["agedBrass"], m["greenIron"], m["darkSteel"]
    mb = K.MeshBuilder([brass, iron, dark])
    # Pier with tripod feet.
    K.lathe(mb, [(0.0, 0.0), (0.42, 0.0), (0.42, 0.08), (0.28, 0.14), (0.2, 0.3), (0.16, 1.6), (0.22, 1.7), (0.22, 1.8)], iron, segments=24)
    for k in range(3):
        a = math.tau * k / 3
        m4, ln = along((0.0, 0.0, 0.25), (math.cos(a) * 0.95, math.sin(a) * 0.95, 0.03))
        K.lathe(mb, [(0.06, 0.0), (0.045, ln)], iron, segments=8, cap_top=True, matrix=m4)
    # Equatorial head and counterweight shaft.
    K.box_faces(mb, (-0.22, -0.18, 1.8), (0.22, 0.18, 2.05), dark)
    m4, ln = along((0.0, 0.0, 2.0), (0.0, -0.7, 1.55))
    K.lathe(mb, [(0.03, 0.0), (0.03, ln)], dark, segments=8, matrix=m4)
    K.lathe(mb, [(0.0, 0.0), (0.12, 0.0), (0.12, 0.18), (0.0, 0.18)], dark, segments=16, matrix=Matrix.Translation((0.0, -0.62, 1.6)))
    # The tube: objective cell, dew cap, rings, draw tube and eyepiece; tilted up 35 degrees.
    tilt = Matrix.Translation((0.0, 0.0, 2.15)) @ Matrix.Rotation(math.radians(-55), 4, "X")
    tube = [(0.12, -1.5), (0.14, -1.45), (0.15, -0.8), (0.17, 2.4), (0.2, 2.45), (0.2, 3.0), (0.19, 3.0)]
    K.lathe(mb, [(r, z) for r, z in tube], brass, segments=28, cap_top=False, matrix=tilt)
    for z in (-1.0, 0.0, 1.2, 2.3):
        K.lathe(mb, [(0.165, z - 0.04), (0.185, z - 0.03), (0.185, z + 0.03), (0.165, z + 0.04)], brass, segments=28, cap_top=False, matrix=tilt)
    K.lathe(mb, [(0.05, -1.95), (0.06, -1.5)], dark, segments=12, cap_top=False, matrix=tilt)
    K.lathe(mb, [(0.0, -2.1), (0.035, -2.1), (0.04, -1.95)], dark, segments=12, cap_top=False, matrix=tilt)
    # Finder scope on two brackets.
    finder = tilt @ Matrix.Translation((0.24, 0.0, 0.0))
    K.lathe(mb, [(0.035, -0.4), (0.04, 0.5), (0.05, 0.55)], brass, segments=12, cap_top=False, matrix=finder)
    obj = mb.finish(name)
    smooth_by_angle(obj, 40)


def along(a, b):
    a, b = Vector(a), Vector(b)
    d = b - a
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    return Matrix.Translation(a) @ rot, d.length


def planter_stone(name, w=1.6, d=1.0, h=0.7):
    """Moulded stone planter: plinth, recessed panels, coping lip and soil (origin at floor centre)."""
    m = K.lib()
    stone, dark, soil = m["academyStone"], m["academyStoneDark"], m["soil"]
    mb = K.MeshBuilder([stone, dark, soil])
    hw, hd = w / 2, d / 2
    K.box_faces(mb, (-hw - 0.04, -hd - 0.04, 0.0), (hw + 0.04, hd + 0.04, 0.1), dark)
    K.box_faces(mb, (-hw, -hd, 0.1), (hw, hd, h - 0.08), stone)
    # Sunk panels on the long faces.
    for sy in (-1, 1):
        y = sy * (hd + 0.001)
        K.box_faces(mb, (-hw + 0.12, min(y, y + sy * 0.012), 0.2), (hw - 0.12, max(y, y + sy * 0.012), h - 0.18), dark)
    K.box_faces(mb, (-hw - 0.05, -hd - 0.05, h - 0.08), (hw + 0.05, hd + 0.05, h), stone)
    K.box_faces(mb, (-hw + 0.06, -hd + 0.06, h - 0.04), (hw - 0.06, hd - 0.06, h + 0.005), soil, skip=("-z",))
    mb.finish(name)


def door_leaf(name, w=1.2, h=3.2):
    """Oak door leaf (hinge at x=0, opening to +X): vertical planks, ledges, iron strap hinges, studs, ring."""
    m = K.lib()
    oak, iron = m["darkOak"], m["darkSteel"]
    mb = K.MeshBuilder([oak, iron])
    planks = 5
    for k in range(planks):
        x0 = w * k / planks + 0.003
        x1 = w * (k + 1) / planks - 0.003
        K.box_faces(mb, (x0, -0.06, 0.0), (x1, 0.0, h), oak)
    for z in (0.35, h / 2, h - 0.35):
        K.box_faces(mb, (0.04, 0.0, z - 0.09), (w - 0.04, 0.05, z + 0.09), oak)
        # Strap hinge running across the face from the hinge side, with a fleur end.
        K.box_faces(mb, (-0.03, -0.075, z - 0.035), (w * 0.72, -0.06, z + 0.035), iron)
        K.box_faces(mb, (w * 0.72, -0.075, z - 0.06), (w * 0.78, -0.06, z + 0.06), iron)
        for x in [w * t for t in (0.15, 0.32, 0.5, 0.66)]:
            K.lathe(mb, [(0.012, 0.0), (0.008, 0.008), (0.0, 0.01)], iron, segments=6, cap_top=False, matrix=Matrix.Translation((x, -0.075, z)) @ Matrix.Rotation(math.radians(90), 4, "X"))
    # Ring pull.
    K.lathe(mb, [(0.03, 0.0), (0.03, 0.01)], iron, segments=10, matrix=Matrix.Translation((w - 0.18, -0.06, 1.1)) @ Matrix.Rotation(math.radians(90), 4, "X"))
    ring = Matrix.Translation((w - 0.18, -0.085, 1.0))
    for i in range(16):
        a0, a1 = math.tau * i / 16, math.tau * (i + 1) / 16
        p0 = ring @ Vector((math.sin(a0) * 0.09, 0, math.cos(a0) * 0.09))
        p1 = ring @ Vector((math.sin(a1) * 0.09, 0, math.cos(a1) * 0.09))
        bar_between(mb, tuple(p0), tuple(p1), 0.018, iron, (0, -1, 0))
    obj = mb.finish(name)
    smooth_by_angle(obj, 30)


def banner_cloth(name, w=1.1, h=3.6):
    """Hanging academy banner: brass rod with finials, folded navy cloth with a forked tail, gilt
    border and a crescent-and-star emblem. Hangs down from z=0, faces -Y."""
    m = K.lib()
    cloth, gold = m["navyCloth"], m["agedBrass"]
    mb = K.MeshBuilder([cloth, gold])
    nu, nv = 12, 24
    tail = 0.45

    def depth(u, v):
        # Soft vertical folds, deeper towards the hem; a gentle belly.
        return 0.035 * math.sin(u * math.pi * 5) * (0.4 + 0.6 * v) + 0.02 * math.sin(v * math.pi)

    def point(i, j):
        u = i / nu
        v = j / nv
        x = (u - 0.5) * w
        z = -v * h
        # Forked tail: the centre is cut up into a V.
        cut = tail * max(0.0, 1 - abs(u - 0.5) * 2)
        if v * h > h - cut:
            z = -(h - cut) - (v * h - (h - cut)) * 0.0
        return (x, -depth(u, v), z)

    grid = {(i, j): point(i, j) for i in range(nu + 1) for j in range(nv + 1)}
    for i in range(nu):
        for j in range(nv):
            q = [grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]]
            if len({tuple(round(c, 5) for c in p) for p in q}) < 3:
                continue
            mb.face(q, cloth, None, (0, -1, 0))
    # Gilt border down both sides and along the top.
    for i in (0, nu - 1):
        for j in range(nv):
            a, b = grid[i, j], grid[i, j + 1]
            x = a[0] + (0.06 if i == 0 else -0.06)
            mb.face([a, b, (x, b[1] - 0.003, b[2]), (x, a[1] - 0.003, a[2])], gold, None, (0, -1, 0))
    # Emblem: a crescent moon and a five-pointed star.
    cy = -h * 0.36
    for k in range(20):
        a0 = math.pi * 0.25 + math.pi * 1.5 * k / 20
        a1 = math.pi * 0.25 + math.pi * 1.5 * (k + 1) / 20
        r_out, r_in = w * 0.26, w * 0.2
        off = w * 0.05
        p = [(math.cos(a0) * r_out, cy + math.sin(a0) * r_out), (math.cos(a1) * r_out, cy + math.sin(a1) * r_out), (off + math.cos(a1) * r_in, cy + math.sin(a1) * r_in), (off + math.cos(a0) * r_in, cy + math.sin(a0) * r_in)]
        mb.face([(x, -depth(x / w + 0.5, -z / h) - 0.004, z) for x, z in p], gold, None, (0, -1, 0))
    star = []
    for k in range(10):
        a = math.pi / 2 + math.tau * k / 10
        r = w * 0.09 if k % 2 == 0 else w * 0.035
        star.append((w * 0.06 + math.cos(a) * r, cy + w * 0.02 + math.sin(a) * r))
    c = (w * 0.06, cy + w * 0.02)
    for k in range(10):
        pts = [c, star[k], star[(k + 1) % 10]]
        mb.face([(x, -depth(x / w + 0.5, -z / h) - 0.005, z) for x, z in pts], gold, None, (0, -1, 0))
    # Rod and finials.
    K.lathe(mb, [(0.025, -w / 2 - 0.15), (0.025, w / 2 + 0.15)], gold, segments=10, matrix=Matrix.Translation((0, -0.02, 0.03)) @ Matrix.Rotation(math.radians(90), 4, "Y"))
    for sx in (-1, 1):
        K.lathe(mb, [(0.0, 0.0), (0.04, 0.03), (0.045, 0.06), (0.0, 0.12)], gold, segments=10, matrix=Matrix.Translation((sx * (w / 2 + 0.15), -0.02, 0.03)) @ Matrix.Rotation(math.radians(90 * sx), 4, "Y"))
    obj = mb.finish(name)
    smooth_by_angle(obj, 50)


def fountain_courtyard(name):
    """Courtyard centrepiece: octagonal pool with a moulded kerb, turned column, two carved
    bowls and a pine-cone finial. Water levels (set by the game): pool 0.55, lower bowl 2.04, upper 2.86."""
    m = K.lib()
    stone, dark = m["academyStone"], m["academyStoneDark"]
    mb = K.MeshBuilder([stone, dark])
    kerb = [(0.0, 0.25), (2.95, 0.25), (3.0, 0.6), (3.05, 0.72), (3.3, 0.68), (3.3, 0.6), (3.2, 0.55), (3.2, 0.14), (3.3, 0.1), (3.3, 0.0)]
    K.lathe(mb, kerb[::-1], stone, segments=8, cap_top=False)
    column = [(0.62, 0.25), (0.6, 0.36), (0.42, 0.45), (0.36, 0.6), (0.32, 1.35), (0.38, 1.45), (0.45, 1.6)]
    lower_bowl = [(0.7, 1.72), (1.05, 1.86), (1.28, 1.98), (1.33, 2.06), (1.3, 2.1), (1.22, 2.07), (0.5, 1.98), (0.24, 2.0)]
    upper = [(0.2, 2.2), (0.17, 2.5), (0.24, 2.62), (0.45, 2.72), (0.62, 2.84), (0.64, 2.9), (0.58, 2.88), (0.16, 2.82), (0.12, 2.9)]
    finial = [(0.14, 2.95), (0.16, 3.05), (0.13, 3.18), (0.08, 3.3), (0.0, 3.4)]
    K.lathe(mb, column + lower_bowl + upper + finial, stone, segments=32, cap_top=False)
    # Carved leaf ribs under the lower bowl (eight acanthus-like brackets).
    for k in range(8):
        a = math.tau * k / 8 + math.tau / 16
        c, sa = math.cos(a), math.sin(a)
        pts = [(0.4 * c, 0.4 * sa, 1.5), (1.05 * c, 1.05 * sa, 1.88), (0.95 * c, 0.95 * sa, 1.95), (0.36 * c, 0.36 * sa, 1.7)]
        side = Vector((-sa, c, 0)) * 0.05
        A = [tuple(Vector(p) - side) for p in pts]
        B = [tuple(Vector(p) + side) for p in pts]
        mb.face([A[0], A[1], A[2], A[3]], dark, None, tuple(-side))
        mb.face([B[3], B[2], B[1], B[0]], dark, None, tuple(side))
        mb.face([A[0], B[0], B[1], A[1]], dark, None, (c, sa, -0.6))
    obj = mb.finish(name)
    smooth_by_angle(obj, 35)


# ---------------------------------------------------------------------------- registry

BUILDERS = {}
for i in range(8):
    BUILDERS[f"bookrow_tall_{i}"] = (lambda i=i: book_row(f"bookrow_tall_{i}", 100 + i, 0.46))
    BUILDERS[f"bookrow_tall_{i}_lod"] = (lambda i=i: book_row(f"bookrow_tall_{i}_lod", 100 + i, 0.46, simple=True))
for w, h in ((2.2, 5.0), (1.4, 2.4), (1.8, 4.0), (2.4, 4.0), (0.7, 3.0), (0.8, 3.4)):
    key = f"window_{w:g}x{h:g}".replace(".", "_")
    BUILDERS[key] = (lambda w=w, h=h, key=key: window(key, w, h, int(w * 100 + h)))
BUILDERS["balustrade_2m"] = lambda: balustrade("balustrade_2m")
BUILDERS["pedestal_grimoire"] = lambda: pedestal("pedestal_grimoire")
BUILDERS["page_loose"] = lambda: S.page_loose("page_loose")
BUILDERS["star_page"] = lambda: S.star_page("star_page")
BUILDERS["star_page_teal"] = lambda: S.star_page("star_page_teal", glow_name="TealGlow")
BUILDERS["greenhouse_bay"] = lambda: greenhouse_bay("greenhouse_bay")
BUILDERS["greenhouse_end"] = lambda: greenhouse_end("greenhouse_end")
BUILDERS["observatory_dome"] = lambda: observatory_dome("observatory_dome")
BUILDERS["telescope"] = lambda: telescope("telescope")
BUILDERS["planter_stone"] = lambda: planter_stone("planter_stone")
BUILDERS["door_leaf"] = lambda: door_leaf("door_leaf")
BUILDERS["banner_cloth"] = lambda: banner_cloth("banner_cloth")
BUILDERS["fountain_courtyard"] = lambda: fountain_courtyard("fountain_courtyard")
BUILDERS["gallery_bench"] = lambda: gallery_bench("gallery_bench")
BUILDERS["fountain_basin"] = lambda: fountain_basin("fountain_basin")
for fw, fh in ((1.1, 1.4), (1.0, 1.3), (1.6, 1.1)):
    fkey = f"frame_{fw:g}x{fh:g}".replace(".", "_")
    BUILDERS[fkey] = (lambda fw=fw, fh=fh, fkey=fkey: S.picture_frame(fkey, fw, fh))
BUILDERS["crystal_cluster"] = lambda: S.crystal_cluster("crystal_cluster")
BUILDERS["warden_plate"] = lambda: S.warden_plate("warden_plate")
BUILDERS["leaded_light"] = lambda: window("leaded_light", 1.0, 2.0, 7, frame=False)
for i in range(4):
    BUILDERS[f"bookrow_short_{i}"] = (lambda i=i: book_row(f"bookrow_short_{i}", 200 + i, 0.38))

os.makedirs(OUT, exist_ok=True)
wanted = [a for a in args if not a.startswith("--")] or list(BUILDERS)
for name in wanted:
    C.reset_scene()
    BUILDERS[name]()
    path = os.path.join(OUT, f"{name}.glb")
    K.export_kit(path)
    print(f"{name}: {C.triangle_count()} tris -> {path}")
    if "--preview" in args:
        size = max(o.dimensions.z for o in bpy.context.scene.objects if o.type == "MESH")
        C.render_previews(os.path.join(ROOT, "assets-src", "previews", name), max(0.5, size))
