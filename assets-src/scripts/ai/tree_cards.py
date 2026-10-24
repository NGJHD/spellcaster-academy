"""
Painted tree impostors for the far rows of a dense forest (owner, 2026-10-24: "can there be a dense forest?
the sprites are supposed to come from a forest"): Flux 3 paints one whole, full-crowned tree on pure white;
it is keyed out on its distance from white and saved as a cut-out the game stands on crossed cards
(src/scene/Woodland.tsx). The forest is a beech wood with some limes; full models fill the near rows.

    python assets-src/scripts/ai/tree_cards.py [names…]

Raw paintings: assets-src/concepts/trees/<name>.png. Cut-outs: public/assets/textures/impostors/<name>.png
(512 x 768, the trunk's foot at the bottom centre).
"""
import os
import sys

import numpy as np
from PIL import Image, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
from comfy import CONCEPTS, FLUX, ROOT, download, run  # noqa: E402
from loading_art import flux3_graph  # noqa: E402

WHITE = (
    "the whole tree from the roots to the top of the crown in frame, standing alone, isolated on a pure solid white "
    "background, no ground, no grass, no shadow, side view at eye level, natural history photograph, highly detailed"
)
TREES = {
    "beech_card": (f"A single tall beech tree in summer with a dense tall oval crown of fresh green leaves and a smooth grey trunk, {WHITE}", 702),
    "lime_card": (f"A single tall linden tree in summer with a full dense crown of bright green leaves and a straight dark trunk, {WHITE}", 703),
}
RAW = os.path.join(CONCEPTS, "trees")
OUT = os.path.join(ROOT, "public", "assets", "textures", "impostors")
W, H = 512, 768


def cut(src):
    """Alpha from how far each pixel is from white; cropped to the tree, its foot on the bottom edge."""
    rgb = np.asarray(src.convert("RGB")).astype(np.float32) / 255.0
    dist = np.max(1.0 - rgb, axis=2)
    alpha = np.clip((dist - 0.06) / 0.14, 0, 1)
    ys, xs = np.nonzero(alpha > 0.5)
    if len(xs):
        x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
        # Same aspect as the output, centred on the tree, bottom on its foot.
        h = y1 - y0 + 4
        w = max(x1 - x0 + 8, int(h * W / H))
        h = int(w * H / W)
        cx = (x0 + x1) // 2
        box = (cx - w // 2, y1 + 2 - h, cx - w // 2 + w, y1 + 2)
    else:
        box = (0, 0, rgb.shape[1], rgb.shape[0])
    rgba = np.dstack([rgb, alpha])
    img = Image.fromarray((rgba * 255).astype(np.uint8), "RGBA").crop(box).resize((W, H), Image.LANCZOS)
    a = np.asarray(img).astype(np.float32) / 255.0
    colour = a[..., :3]
    alpha = a[..., 3]
    # Every pixel that is not solid leaf takes the colour of the solid leaves around it, so no white from
    # the background survives in the canopy's many small gaps and edges (they looked pale and frosted).
    solid = (alpha > 0.92).astype(np.float32)
    fill = np.zeros_like(colour)
    weight = np.zeros_like(alpha)
    for radius in (2, 5, 12):
        mask = Image.fromarray((solid * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))
        wm = np.asarray(mask).astype(np.float32) / 255.0
        for ch in range(3):
            prem = Image.fromarray((colour[..., ch] * solid * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(radius))
            fill[..., ch] = np.where(weight < 1e-3, np.asarray(prem).astype(np.float32) / 255.0 / np.maximum(wm, 1e-3), fill[..., ch])
        weight = np.maximum(weight, (wm > 0.01).astype(np.float32))
    edge = (alpha < 0.92)[..., None]
    colour = np.where(edge, np.clip(fill, 0, 1), colour)
    out = np.concatenate([colour, alpha[..., None]], axis=2)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def main():
    names = sys.argv[1:] or list(TREES)
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    for name in names:
        prompt, seed = TREES[name]
        raw = os.path.join(RAW, f"{name}.png")
        if not os.path.exists(raw):
            entry = run(FLUX, flux3_graph(prompt, seed, f"spellcaster/trees/{name}", 896, 1216), timeout=1800)
            images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
            download(FLUX, images[0], raw)
        cut(Image.open(raw)).save(os.path.join(OUT, f"{name}.png"))
        print(name, flush=True)


if __name__ == "__main__":
    main()
