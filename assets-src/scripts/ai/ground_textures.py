"""
Ground textures painted by Flux 3 (owner, 2026-10-24: the far bank's grass "looks like minecraft"): a top-down
photo of the ground, made to tile (each half blended across the seams), with a normal map from its
brightness and a packed AO/roughness/metal map, written like the CC0 sets the game uses.

    python assets-src/scripts/ai/ground_textures.py [name] [seeds…]
    python assets-src/scripts/ai/ground_textures.py burned_ground_soft   # the softened CC0 burnt ground

Candidates go to assets-src/concepts/ground/<name>_<seed>.png; the chosen seed (CHOSEN) is written to
public/assets/textures/<name>/ (diff.jpg, nor.jpg, arm.jpg, 1024 px): green_meadow is the grass everywhere,
wild_meadow the drier ground of Level 2's far bank.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from comfy import CONCEPTS, FLUX, ROOT, download, run  # noqa: E402
from loading_art import flux3_graph  # noqa: E402

TEXTURES = {
    "wild_meadow": (
        "Seamless texture, a photograph looking straight down at a real wild meadow, dense uneven tufts of long and "
        "short grass blades in many greens and dry yellow-browns, small bare patches of dark soil, a few fallen leaves "
        "and twigs, natural random variation, soft even overcast light, no shadows of objects, no sky, no horizon, "
        "photorealistic ground material, highly detailed",
        [611, 612, 613],
    ),
    "green_meadow": (
        "Seamless texture, a photograph looking straight down at a lush green summer meadow lawn, dense soft grass "
        "in many fresh greens with a few lighter and darker patches, tiny clover leaves and a few small daisies, "
        "natural random variation, soft even daylight, no shadows of objects, no sky, no horizon, photorealistic "
        "ground material, highly detailed",
        [631, 632, 633],
    ),
}
CHOSEN = {"wild_meadow": 611, "green_meadow": 633}
SIZE = 1024
OUT = os.path.join(ROOT, "public", "assets", "textures")


def seamless(img):
    """Make the image tile, one axis at a time: blend it with itself shifted half a width, using the shifted
    copy near the left and right edges (where it runs on seamlessly) and the original in the middle (where
    the shifted copy has its own seam); then the same top to bottom on the result."""
    a = np.asarray(img).astype(np.float32)
    for axis in (1, 0):
        n = a.shape[axis]
        b = np.roll(a, n // 2, axis=axis)
        ramp = np.clip((1 - np.abs(np.arange(n) / (n - 1) * 2 - 1)) * 3.0, 0, 1)
        m = ramp[None, :, None] if axis == 1 else ramp[:, None, None]
        a = a * m + b * (1 - m)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def even_out(img, radius=48):
    """Remove the painting's large light and dark patches (keeping the fine detail), so when it repeats
    across a field there are no rows of blotches (owner, 2026-10-24: the grass striped into the distance)."""
    a = np.asarray(img).astype(np.float32)
    # Blur with wrap-around, so the tile's own edges stay seamless.
    pad = radius * 2
    big = np.pad(a, ((pad, pad), (pad, pad), (0, 0)), mode="wrap")
    low = np.asarray(Image.fromarray(np.clip(big, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))).astype(np.float32)
    low = low[pad:-pad, pad:-pad]
    out = a - low + a.reshape(-1, 3).mean(axis=0)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


#: Textures laid over wide fields, evened out so their repeat does not show.
EVEN = {"green_meadow"}


def maps(diff):
    """Normal map from brightness as height, and arm (AO, roughness, metalness) from the same."""
    g = np.asarray(diff.convert("L").filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32) / 255
    dx = (np.roll(g, -1, axis=1) - np.roll(g, 1, axis=1)) * 3.5
    dy = (np.roll(g, -1, axis=0) - np.roll(g, 1, axis=0)) * 3.5
    n = np.dstack([-dx, dy, np.ones_like(g)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    nor = Image.fromarray(((n * 0.5 + 0.5) * 255).astype(np.uint8))
    ao = 0.55 + 0.45 * np.clip(g / max(1e-3, float(np.percentile(g, 90))), 0, 1)
    rough = np.full_like(g, 0.92)
    arm = Image.fromarray((np.dstack([ao, rough, np.zeros_like(g)]) * 255).astype(np.uint8))
    return nor, arm


def soften(source, dest, blur=2.6, keep=0.45):
    """A CC0 set with its finest detail turned down (owner, 2026-10-24: the Blank's ground "vibrated"): the
    photo of burnt ground is all sub-centimetre needles, which sparkle and crawl whenever the camera kicks or
    turns a little. Keeps the broad look; the finest contrast is cut to `keep` of itself."""
    src = os.path.join(OUT, source)
    out = os.path.join(OUT, dest)
    os.makedirs(out, exist_ok=True)
    im = Image.open(os.path.join(src, "diff.jpg")).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    b = np.asarray(im.filter(ImageFilter.GaussianBlur(blur))).astype(np.float32)
    Image.fromarray(np.clip(b + (a - b) * keep, 0, 255).astype(np.uint8)).save(os.path.join(out, "diff.jpg"), quality=92)
    for f in ("nor.jpg", "arm.jpg"):
        Image.open(os.path.join(src, f)).filter(ImageFilter.GaussianBlur(blur)).save(os.path.join(out, f), quality=92)
    print("wrote", out)


def main():
    if sys.argv[1:2] == ["burned_ground_soft"]:
        soften("burned_ground_01", "burned_ground_soft")
        return
    name = sys.argv[1] if len(sys.argv) > 1 else "wild_meadow"
    prompt, seeds = TEXTURES[name]
    if len(sys.argv) > 2:
        seeds = [int(s) for s in sys.argv[2:]]
    folder = os.path.join(CONCEPTS, "ground")
    os.makedirs(folder, exist_ok=True)
    for seed in seeds:
        path = os.path.join(folder, f"{name}_{seed}.png")
        if not os.path.exists(path):
            entry = run(FLUX, flux3_graph(prompt, seed, f"spellcaster/ground/{name}", SIZE, SIZE), timeout=1800)
            images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
            download(FLUX, images[0], path)
        print(path, flush=True)
    chosen = os.path.join(folder, f"{name}_{CHOSEN[name]}.png")
    if os.path.exists(chosen):
        diff = seamless(Image.open(chosen).convert("RGB").resize((SIZE, SIZE), Image.LANCZOS))
        if name in EVEN:
            diff = even_out(diff)
        nor, arm = maps(diff)
        dest = os.path.join(OUT, name)
        os.makedirs(dest, exist_ok=True)
        diff.save(os.path.join(dest, "diff.jpg"), quality=90)
        nor.save(os.path.join(dest, "nor.jpg"), quality=92)
        arm.save(os.path.join(dest, "arm.jpg"), quality=90)
        print("wrote", dest)


if __name__ == "__main__":
    main()
