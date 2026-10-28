"""
The cover of the book that seals the Unwriter (owner, 2026-10-28: "the book that sealed the Unwriter seems a little
hand drawn… can we generate a nicer book?"): Flux 3 paints an antique tooled-leather front cover, seen flat and
square-on, which kit_scene.py `sealed_book_cover` lays on the cover board.

    python assets-src/scripts/ai/book_cover.py [seeds…]

Candidates go to assets-src/concepts/book/cover_<seed>.png; the chosen one (CHOSEN) is cropped to the board and
saved as assets-src/concepts/book/cover.png (1024 x 1408, the board's proportions). It also paints the blank parchment of
the open pages (pages.png).
"""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(__file__))
from comfy import CONCEPTS, FLUX, download, run  # noqa: E402
from loading_art import flux3_graph  # noqa: E402

PROMPT = (
    "The front cover of an ancient magical book seen perfectly flat and straight on, filling the whole frame edge to "
    "edge, deep oxblood red leather with fine creases and wear, an ornate gold-tooled border of interlaced vines and "
    "stars, gold filigree corners, and a large plain empty circle in the centre framed by a thin gold ring, no text, "
    "no letters, no title, even soft light, photorealistic product photograph, highly detailed"
)
SEEDS = [721, 722, 723]
CHOSEN = 721
# The open book's pages: blank, as the Unwriter's book is ("Not the blank pages!").
PAGES_PROMPT = (
    "A single blank page of very old thick parchment paper seen perfectly flat and straight on, filling the whole frame, "
    "warm cream colour with soft foxing, faint stains, subtle fibres and gently darkened edges, completely empty, no "
    "writing, no text, no lines, even soft light, photorealistic texture, highly detailed"
)
PAGES_SEED = 731
FOLDER = os.path.join(CONCEPTS, "book")
W, H = 1024, 1408


def crop_to_board(img):
    """Trim any dark background round the cover, then fit it to the board's proportions."""
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    lum = a.max(axis=2)
    ys, xs = np.nonzero(lum > 40)
    if len(xs):
        img = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    return img.convert("RGB").resize((W, H), Image.LANCZOS)


def main():
    seeds = [int(s) for s in sys.argv[1:]] or SEEDS
    os.makedirs(FOLDER, exist_ok=True)
    for seed in seeds:
        path = os.path.join(FOLDER, f"cover_{seed}.png")
        if not os.path.exists(path):
            entry = run(FLUX, flux3_graph(PROMPT, seed, "spellcaster/book/cover", 896, 1216), timeout=1800)
            images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
            download(FLUX, images[0], path)
        print(path, flush=True)
    pages = os.path.join(FOLDER, f"pages_{PAGES_SEED}.png")
    if not os.path.exists(pages):
        entry = run(FLUX, flux3_graph(PAGES_PROMPT, PAGES_SEED, "spellcaster/book/pages", 896, 1216), timeout=1800)
        images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
        download(FLUX, images[0], pages)
    Image.open(pages).convert("RGB").resize((W, H), Image.LANCZOS).save(os.path.join(FOLDER, "pages.png"))
    print("wrote", os.path.join(FOLDER, "pages.png"))
    chosen = os.path.join(FOLDER, f"cover_{CHOSEN}.png")
    if os.path.exists(chosen):
        crop_to_board(Image.open(chosen)).save(os.path.join(FOLDER, "cover.png"))
        print("wrote", os.path.join(FOLDER, "cover.png"))


if __name__ == "__main__":
    main()
