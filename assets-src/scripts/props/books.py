"""
Hero books (realism pass 2): the Great Grimoire and the runaway book as real two-half book rigs.

Used by hero_props.py. Materials are runtime-library names (kitgeo.lib) except 'Leather' (tinted per
runaway-book instance) and 'Energy' (glowing runes, pulsed per instance).
"""
import math

import creature as C
import kitgeo as K
from mathutils import Vector


def book_half(mb, lib, side, width, height, board, pages, overhang, leather, pages_below, gutter=0.0, text=False, corners=True, seed=1):
    """One half of an open book along +X (side=+1) or -X (side=-1) from the spine at x=0.

    pages_below: the pages hang under the board (a face-down book) instead of sitting on it."""
    x_out = side * (width + overhang)
    xs = sorted((0.0, x_out))
    if pages_below:
        bz0, bz1 = pages, pages + board
        pz0, pz1 = 0.0, pages
    else:
        bz0, bz1 = 0.0, board
        pz0, pz1 = board, board + pages
    hy = height / 2 + overhang
    K.box_faces(mb, (xs[0], -hy, bz0), (xs[1], hy, bz1), leather)
    # Page block, inset from the board edges; its open face dips into the gutter near the spine.
    px = sorted((side * 0.012, side * width))
    hp = height / 2
    face_z = pz0 if pages_below else pz1
    sgn = -1 if pages_below else 1
    K.box_faces(mb, (px[0], -hp, pz0), (px[1], hp, pz1), lib["pageEdge"], skip=("-z" if pages_below else "+z",))
    steps = 8

    def dip(x):
        t = 1 - min(1.0, abs(x) / width)
        return gutter * t ** 3

    for i in range(steps):
        x0 = px[0] + (px[1] - px[0]) * i / steps
        x1 = px[0] + (px[1] - px[0]) * (i + 1) / steps
        z0 = face_z - sgn * dip(x0)
        z1 = face_z - sgn * dip(x1)
        mb.face([(x0, -hp, z0), (x1, -hp, z1), (x1, hp, z1), (x0, hp, z0)], lib["parchment"], None, (0, 0, sgn))
    if text:
        # Lines of handwriting: thin ink strokes read as text at a glance.
        rnd = K.rng(seed)
        margin = width * 0.14
        line_h = height * 0.028
        xa, xb = px[0] + margin, px[1] - margin
        y = hp - height * 0.12
        while y > -hp + height * 0.1:
            if rnd.random() < 0.08:
                y -= line_h * 1.6
                continue
            length = (xb - xa) * (0.55 + rnd.random() * 0.45)
            x0 = xa if side > 0 else xb - length
            z = face_z - sgn * dip((x0 + length / 2)) + sgn * 0.0015
            mb.face([(x0, y - line_h * 0.35, z), (x0 + length, y - line_h * 0.35, z), (x0 + length, y, z), (x0, y, z)], lib["ink"], None, (0, 0, sgn))
            y -= line_h * 1.5
    if corners:
        # Brass corner pieces on the outer face of the board.
        outer_z = bz1 + 0.002 if pages_below else bz0 - 0.002
        out_sgn = 1 if pages_below else -1
        c = min(0.18, width * 0.2)
        for cy in (-hy, hy):
            ky = -1 if cy > 0 else 1
            tri = [(x_out, cy, outer_z), (x_out - side * c, cy, outer_z), (x_out, cy + ky * c, outer_z)]
            mb.face(tri, lib["agedBrass"], None, (0, 0, out_sgn))


def spine(mb, material, height, thickness, bulge, bands, band_material, rings=10):
    """Rounded spine at x=0 bulging to +X, from z=0 to z=thickness, with raised bands across it."""
    hy = height / 2
    mid_z = thickness / 2
    arc = []
    for i in range(rings + 1):
        a = -math.pi / 2 + math.pi * i / rings
        arc.append((bulge * math.cos(a), mid_z + thickness / 2 * math.sin(a)))
    cuts = [-hy]
    for b in bands:
        cuts += [b - 0.012, b + 0.012]
    cuts.append(hy)
    for k in range(len(cuts) - 1):
        y0, y1 = cuts[k], cuts[k + 1]
        is_band = k % 2 == 1
        grow = 1.25 if is_band else 1.0
        for i in range(rings):
            (x0, z0), (x1, z1) = arc[i], arc[i + 1]
            pts = [(x0 * grow, y0, z0), (x0 * grow, y1, z0), (x1 * grow, y1, z1), (x1 * grow, y0, z1)]
            out = Vector(((x0 + x1) / 2, 0, (z0 + z1) / 2 - mid_z))
            mb.face(pts, band_material if is_band else material, None, out)


def runaway_book(m, group):
    """Face-down open book that flaps its covers like wings: Cover_L (+X) / Cover_R (-X) hinge at the spine top."""
    lib = K.lib()
    leather = K.library_material("Leather", "#7a2a30", 0.55)
    W, H, board, pages = 0.29, 0.38, 0.012, 0.034
    hinge = pages + board
    for name, side in (("L", 1), ("R", -1)):
        mb = K.MeshBuilder([leather])
        book_half(mb, lib, side, W, H, board, pages, 0.012, leather, pages_below=True, gutter=0.006, text=True, seed=3 + side)
        half = mb.finish(f"CoverMesh_{name}")
        rune = C.torus(f"Rune_{name}", (0.155 * side, 0, hinge + 0.003), 0.06, 0.005, m["gold_glow"], segments=(40, 6))
        group(f"Cover_{name}", (0, 0, hinge), [half, rune])
    mb = K.MeshBuilder([leather])
    spine(mb, leather, H + 0.024, hinge, 0.02, (-0.1, 0.0, 0.1), lib["agedBrass"], rings=6)
    mb.finish("Spine")
    mb = K.MeshBuilder([lib["agedBrass"]])
    K.box_faces(mb, (0.29, -0.025, hinge - 0.004), (0.315, 0.025, hinge + 0.004), lib["agedBrass"])
    mb.finish("Clasp")


def grimoire(m, group):
    """The Great Grimoire (§14A.8) as a real book lying on its back.

    Cover_L: back board + lower page block (static). Cover_R: front board + upper pages, hinged at the
    spine's top edge and modelled OPEN (flat, to +X); the game rotates it by up to pi to close it.
    Spine, Clasp_0/1 and Bookmark_0/1 are separate parts. Diagram/PageRune rings glow ('Energy')."""
    lib = K.lib()
    leather = lib["burgundyLeather"]
    W, H, board, pages, over = 0.98, 1.3, 0.04, 0.13, 0.03
    hinge_z = board + pages
    mb = K.MeshBuilder([leather])
    book_half(mb, lib, -1, W, H, board, pages, over, leather, pages_below=False, gutter=0.03, text=True, seed=11)
    group("Cover_L", (0, 0, 0), [mb.finish("BackHalf")])
    mb = K.MeshBuilder([leather])
    book_half(mb, lib, 1, W, H, board, pages, over, leather, pages_below=False, gutter=0.03, text=True, seed=12)
    # Cover medallion on the outer face (the underside while open): brass rings and star studs.
    cx = (W + over) / 2
    for r_in, r_out in ((0.3, 0.33), (0.18, 0.2)):
        K.lathe(mb, [(r_in, -0.004), (r_out, -0.004)], lib["agedBrass"], centre=(cx, 0, 0), segments=48, cap_top=False)
    for i in range(8):
        a = math.tau * i / 8
        K.box_faces(mb, (cx + math.cos(a) * 0.25 - 0.015, math.sin(a) * 0.25 - 0.015, -0.01), (cx + math.cos(a) * 0.25 + 0.015, math.sin(a) * 0.25 + 0.015, 0.0), lib["agedBrass"])
    front = mb.finish("FrontHalf")
    diagram = [C.torus(f"Diagram_{k}", (cx, 0, -0.006), r, 0.006, m["gold_glow"], segments=(64, 6)) for k, r in enumerate((0.245, 0.12))]
    page_rings = [C.torus(f"PageRune_{k}", (W * 0.5, 0, hinge_z + 0.004), r, 0.004, m["gold_glow"], segments=(56, 6)) for k, r in enumerate((0.22, 0.14))]
    group("Cover_R", (0, 0, hinge_z), [front, *diagram, *page_rings])
    mb = K.MeshBuilder([leather])
    spine(mb, leather, H + 2 * over, 2 * hinge_z, 0.09, (-0.42, -0.14, 0.14, 0.42), lib["agedBrass"], rings=10)
    group("Spine", (0, 0, 0), [mb.finish("SpineMesh")])
    # Clasps: straps from the back board over the fore-edge, with brass catches.
    for k, y in enumerate((-0.38, 0.38)):
        mb = K.MeshBuilder([leather])
        x_edge = -(W + over)
        top = 2 * hinge_z
        K.box_faces(mb, (x_edge - 0.012, y - 0.05, 0.0), (x_edge, y + 0.05, top + 0.012), leather)
        K.box_faces(mb, (x_edge, y - 0.05, top), (x_edge + 0.2, y + 0.05, top + 0.012), leather)
        K.box_faces(mb, (x_edge + 0.14, y - 0.065, top + 0.005), (x_edge + 0.22, y + 0.065, top + 0.03), lib["agedBrass"])
        group(f"Clasp_{k}", (x_edge, y, top), [mb.finish(f"ClaspMesh_{k}")])
    # Silk bookmarks hanging from the foot of the book.
    for k, x in enumerate((-0.25, -0.4)):
        mb = K.MeshBuilder([lib["navyCloth"]])
        pts = [(x + t * 0.03, -H / 2 - t * 0.32, hinge_z - t * t * 0.25) for t in (i / 6 for i in range(7))]
        for i in range(6):
            a, b = pts[i], pts[i + 1]
            mb.face([(a[0] - 0.018, a[1], a[2]), (a[0] + 0.018, a[1], a[2]), (b[0] + 0.018, b[1], b[2]), (b[0] - 0.018, b[1], b[2])], lib["navyCloth"], None, (0, 0, 1))
        group(f"Bookmark_{k}", (x, -H / 2, hinge_z), [mb.finish(f"BookmarkMesh_{k}")])
