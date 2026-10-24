"""
Particle sprites for the spectacle layer (owner, 2026-10-23: "generate all the effects properly with
ComfyUI and Blender", replacing the soft dots). Flux 3 Klein paints each element alone on pure black;
it is then cut out (alpha from brightness, a soft radial fade so no square edge shows) and saved small.

    python assets-src/scripts/ai/fx_sprites.py [name ...]

Raw paintings: assets-src/concepts/fx/<name>.png. Game sprites: public/assets/textures/fx/sprites/<name>.png.
- "grey": dust, smoke and liquid splashes are made grey, so the game tints them (sandy dust, slate dust,
  dark citadel smoke, blue library ink, molten red ink).
- "glow": fire, magic motes and sparks keep their colour and glow (additive).
- "wide" / "tall": glowing pieces that keep the painting's proportions (the crack in the sky, lightning
  bolts): cropped to what was painted and stretched to (width, height) instead of a square.
- "card": leaves and a dove (the scattering birds) keep their colour with a crisp cut-out edge and no fade. They are
  textures for the modelled pieces (fx_debris.py), saved to assets-src/concepts/fx/cards/<name>.png.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

from comfy import CONCEPTS, FLUX, ROOT, download, run
from loading_art import flux3_graph

RAW = os.path.join(CONCEPTS, "fx")
OUT = os.path.join(ROOT, "public", "assets", "textures", "fx", "sprites")

BLACK = "isolated on a pure solid black background, centred in the frame with empty black space all around it, VFX element for a video game, no ground, no text"

CARDS = os.path.join(RAW, "cards")

# name: (prompt, seed, mode, size); "wide"/"tall" sizes are (width, height), painted at that shape.
SPRITES = {
    "dust_1": (f"A single soft billowing cloud of dry pale sandy dust kicked up from the ground, wispy rolling edges, volumetric, photographic, {BLACK}", 301, "grey", 256),
    "dust_2": (f"A single round puff of fine light grey stone dust, soft fluffy rolling billows, volumetric, photographic, {BLACK}", 302, "grey", 256),
    "dust_3": (f"A single drifting wisp of thin pale dust cloud, soft and feathery, volumetric, photographic, {BLACK}", 303, "grey", 256),
    "smoke_1": (f"A single thick billowing puff of grey smoke, dense rolling curls, volumetric, photographic, {BLACK}", 311, "grey", 256),
    "smoke_2": (f"A single soft rounded cloud of light grey smoke with curling edges, volumetric, photographic, {BLACK}", 312, "grey", 256),
    "fireball": (f"A single bright explosion fireball, a burst of orange and yellow flame with a white hot core and curling fiery edges, photographic, {BLACK}", 321, "glow", 256),
    "mote": (f"A single small glowing white magical sparkle of light, a bright soft glowing orb with a gentle halo and four thin star rays, {BLACK}", 331, "glow", 128),
    "spark": (f"A single tiny bright white hot glowing ember spark, a small round point of light with a soft glow, {BLACK}", 341, "glow", 64),
    "splash_1": (f"A single splash of white milk thrown upwards, a tall liquid crown with flying droplets and curling liquid tendrils, high speed photography, {BLACK}", 351, "grey", 256),
    "splash_2": (f"A single round blob of white milk in mid air breaking apart into droplets, glossy liquid, high speed photography, {BLACK}", 352, "grey", 256),
    "droplet": (f"A single round glossy droplet of white milk in mid air, high speed photography, {BLACK}", 353, "grey", 64),
    "leaf_1": (f"A single fresh bright green oak leaf lying flat, seen straight from above, crisp edges, fine veins, botanical photograph, {BLACK}", 361, "card", 256),
    "leaf_2": (f"A single fresh green beech leaf lying flat, seen straight from above, oval with a pointed tip, fine veins, botanical photograph, {BLACK}", 362, "card", 256),
    "leaf_3": (f"A single yellow-green linden leaf lying flat, seen straight from above, heart shaped, fine veins, botanical photograph, {BLACK}", 363, "card", 256),
    "ember": (f"A single tiny glowing orange ember, a fleck of burning ash with a bright yellow hot core and a soft orange glow, {BLACK}", 381, "glow", 64),
    "ash": (f"A single small curled flake of pale grey wood ash, thin and papery with ragged burnt edges, macro photograph, {BLACK}", 382, "grey", 64),
    "tear_1": ("A huge glowing rip in a pitch black sky, a long horizontal almond shaped opening, widest in the middle and tapering to sharp points at the left and right ends, filled with blazing white hot fire turning gold then deep red at its torn ragged edges, small cracks branching from the rim, on pure black, VFX element, no ground, no text", 393, "wide", (1024, 384)),
    "tear_2": ("A narrow ragged rift splitting a pitch black sky horizontally, a long tapering jagged tear of blazing white and orange fire with deep red burnt edges and fine forked cracks spreading from it, on pure black, VFX element, no ground, no text", 392, "wide", (1024, 384)),
    "bolt_1": ("A single bright forked lightning bolt striking straight down from top to bottom of the frame, crackling white blue core with a violet glow, a few thin branches, on a pure black night sky, VFX element, no ground, no clouds, no text", 401, "tall", (256, 1024)),
    "bolt_2": ("A single jagged lightning strike running vertically from the top of the frame to the bottom, intense white core with a soft blue glow and small zigzag forks, on a pure black background, VFX element, no ground, no clouds, no text", 402, "tall", (256, 1024)),
    "script_ring": (f"A perfect circle of glowing red and orange burning handwritten script, fiery calligraphy letters running round a closed ring, the middle of the ring empty, molten ink, {BLACK}", 411, "glow", 512),
    "dove": (f"A single bird wing fully spread open, seen straight from above, soft grey and white dove feathers with darker grey tips, flat lay, natural history photograph, {BLACK}", 371, "card", 512),
}


def cut_card(src, size):
    """A leaf or wing: its own colours, alpha from what was painted, a crisp edge and no fade."""
    im = src.convert("RGB")
    lum = np.asarray(im).max(axis=2)
    ys, xs = np.nonzero(lum > 24)
    if len(xs):
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        half = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 + 6
        im = im.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half)))
    im = im.resize((size, size), Image.LANCZOS)
    rgb = np.asarray(im).astype(np.float32) / 255.0
    lum = rgb.max(axis=2)
    alpha = np.clip((lum - 0.07) / 0.1, 0.0, 1.0)
    # Pull the colour out of the black fringe so the cut edge carries no dark halo.
    colour = np.clip(rgb / np.maximum(lum[..., None], 0.2) * np.maximum(lum[..., None], 0.55), 0, 1)
    out = np.concatenate([colour, alpha[..., None]], axis=2)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def cut_rect(src, size):
    """A glowing piece kept at its painted shape: cropped to its content, stretched to (w, h), alpha
    from brightness, with the outermost edge faded so no hard border shows."""
    w, h = size
    im = src.convert("RGB")
    lum = np.asarray(im).max(axis=2)
    ys, xs = np.nonzero(lum > 18)
    if len(xs):
        pad = 6
        im = im.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad), min(im.height, ys.max() + pad)))
    im = im.resize((w, h), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
    rgb = np.asarray(im).astype(np.float32) / 255.0
    lum = rgb.max(axis=2)
    alpha = np.clip((lum - 0.04) / 0.8, 0.0, 1.0)
    yy, xx = np.mgrid[0:h, 0:w]
    edge = np.minimum(np.minimum(xx, w - 1 - xx) / (w * 0.04), np.minimum(yy, h - 1 - yy) / (h * 0.04))
    alpha *= np.clip(edge, 0.0, 1.0)
    colour = np.clip(rgb / np.maximum(alpha[..., None], 1e-3), 0, 1)
    out = np.concatenate([colour, alpha[..., None]], axis=2)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def taper_ends(img, zone=0.22):
    """Pinch a horizontal piece to a point at both ends (owner: the crack above the Warden looked
    cropped off): within `zone` of each end, every column is squeezed towards the line it follows and
    faded, so a tear painted running off the canvas closes up instead of stopping square."""
    a = np.asarray(img).astype(np.float32) / 255.0
    h, w = a.shape[:2]
    weight = a[..., 3] + 1e-4
    ys = np.arange(h, dtype=np.float32)
    line = (weight * ys[:, None]).sum(axis=0) / weight.sum(axis=0)
    # Smooth the line the tear follows so the pinch does not wobble column to column.
    k = max(3, w // 40)
    line = np.convolve(np.pad(line, k, mode="edge"), np.ones(2 * k + 1) / (2 * k + 1), mode="same")[k:-k]
    out = a.copy()
    for x in range(w):
        t = min(x, w - 1 - x) / (w * zone)
        if t >= 1:
            continue
        s = 0.06 + 0.94 * (t * t * (3 - 2 * t))
        src = line[x] + (ys - line[x]) / s
        for c in range(4):
            out[:, x, c] = np.interp(src, ys, a[:, x, c], left=0.0, right=0.0)
        out[:, x, 3] *= min(1.0, t / 0.35)
    return Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), "RGBA")


#: Wide pieces painted running off the canvas, pinched shut at both ends.
TAPERED = {"tear_2"}


def cut_out(src, grey, size):
    """Black background to alpha; a radial fade keeps the edges soft. Returns an RGBA image."""
    im = src.convert("RGB")
    # Crop to what was painted (a spark is a dot in a big black frame), as a padded square.
    lum = np.asarray(im).max(axis=2)
    ys, xs = np.nonzero(lum > 18)
    if len(xs):
        cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
        half = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2 * 1.15 + 4
        im = im.crop((int(cx - half), int(cy - half), int(cx + half), int(cy + half)))
    im = im.resize((size * 2, size * 2), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
    rgb = np.asarray(im).astype(np.float32) / 255.0
    lum = rgb.max(axis=2)
    alpha = np.clip((lum - 0.04) / 0.8, 0.0, 1.0)
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2))
    alpha *= np.clip((1.0 - r) / 0.25, 0.0, 1.0)
    if grey:
        # Neutral, evenly bright smoke or dust: shape lives in the alpha, colour comes from the game.
        g = rgb.mean(axis=2, keepdims=True)
        colour = np.clip(0.75 + 0.25 * (g / max(1e-3, float(g.max()))), 0, 1).repeat(3, axis=2)
    else:
        colour = np.clip(rgb / np.maximum(alpha[..., None], 1e-3), 0, 1)
    out = np.concatenate([colour, alpha[..., None]], axis=2)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA").resize((size, size), Image.LANCZOS)


def main():
    names = sys.argv[1:] or list(SPRITES)
    os.makedirs(OUT, exist_ok=True)
    for name in names:
        prompt, seed, mode, size = SPRITES[name]
        raw = os.path.join(RAW, f"{name}.png")
        if not os.path.exists(raw):
            # Wide and tall pieces are painted at their own shape (about 1.5 megapixels).
            pw, ph = (1024, 1024) if mode not in ("wide", "tall") else ((1536, 576) if mode == "wide" else (576, 1536))
            entry = run(FLUX, flux3_graph(prompt, seed, f"spellcaster/fx/{name}", pw, ph), timeout=1800)
            images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
            download(FLUX, images[0], raw)
        if mode in ("wide", "tall"):
            piece = cut_rect(Image.open(raw), size)
            if name in TAPERED:
                piece = taper_ends(piece)
            piece.save(os.path.join(OUT, f"{name}.png"))
        elif mode == "card":
            os.makedirs(CARDS, exist_ok=True)
            cut_card(Image.open(raw), size).save(os.path.join(CARDS, f"{name}.png"))
        else:
            cut_out(Image.open(raw), mode == "grey", size).save(os.path.join(OUT, f"{name}.png"))
        print(name, flush=True)


if __name__ == "__main__":
    main()
