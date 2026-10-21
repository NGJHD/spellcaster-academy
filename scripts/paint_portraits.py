"""
Painterly finish for the Hall of Portraits paintings.

Input:  assets-src/paintings/raw/*.png  (Blender still lifes / bust studies, game landscapes)
Output: public/assets/textures/paintings/<name>.jpg

Steps: crop around the subject, old-master grading (deep shadows, warm aged varnish, softened
saturation), Kuwahara filter for brushwork, canvas weave, vignette. Deterministic (fixed seeds).

    python scripts/paint_portraits.py
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(ROOT, "assets-src", "paintings", "raw")
OUT = os.path.join(ROOT, "public", "assets", "textures", "paintings")


def box_mean(a, r):
    """Mean over a (2r+1)^2 window (edge-padded), via summed-area tables."""
    p = np.pad(a, ((r + 1, r), (r + 1, r)) + ((0, 0),) * (a.ndim - 2), mode="edge")
    s = p.cumsum(0).cumsum(1)
    k = 2 * r + 1
    total = s[k:, k:] - s[:-k, k:] - s[k:, :-k] + s[:-k, :-k]
    return total / (k * k)


def kuwahara(img, r):
    """Classic 4-quadrant Kuwahara filter: flattens detail into brush-like patches, keeps edges."""
    h, w, _ = img.shape
    lum = img @ np.array([0.299, 0.587, 0.114])
    q = r // 2
    mean_c = box_mean(img, q)
    mean_l = box_mean(lum, q)
    var_l = box_mean(lum * lum, q) - mean_l**2
    best = np.full((h, w), np.inf)
    out = np.zeros_like(img)
    for dy in (-q, q):
        for dx in (-q, q):
            v = np.roll(np.roll(var_l, dy, 0), dx, 1)
            c = np.roll(np.roll(mean_c, dy, 0), dx, 1)
            take = v < best
            best = np.where(take, v, best)
            out[take] = c[take]
    return out


def centre_crop(img, aspect):
    """Crop to `aspect` (w/h) about the centre (the renders are composed centrally)."""
    h, w, _ = img.shape
    if w / h > aspect:
        cw, ch = int(h * aspect), h
    else:
        cw, ch = w, int(w / aspect)
    x0 = (w - cw) // 2
    y0 = (h - ch) // 2
    return img[y0 : y0 + ch, x0 : x0 + cw]


def grade(img, landscape):
    lum = img.mean(2, keepdims=True)
    # Soften saturation, deepen shadows, lift highlights a touch (chiaroscuro).
    img = lum + (img - lum) * (0.8 if landscape else 0.7)
    # Soft shoulder so highlights never flatten into blank paper.
    img = img * 1.3 / (img + 0.3)
    img = np.clip((img - 0.06) / 0.94, 0, 1) ** (1.5 if landscape else 2.2)
    # Aged varnish: warm, slightly green-yellow highlights and brown shadows.
    varnish = np.array([1.0, 0.88, 0.62])
    img = img * varnish
    img = img + np.array([0.035, 0.022, 0.008]) * (1 - img)
    return np.clip(img, 0, 1)


def canvas(h, w, seed):
    rng = np.random.default_rng(seed)
    ys, xs = np.mgrid[0:h, 0:w]
    weave = 0.5 + 0.25 * np.sin(xs * 1.9) * np.sin(ys * 0.35) + 0.25 * np.sin(ys * 1.9) * np.sin(xs * 0.35)
    noise = rng.normal(0, 1, (h, w))
    noise = box_mean(noise, 1)
    return 1 - 0.06 * weave - 0.035 * noise


def vignette(h, w, strength):
    ys, xs = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xs - w / 2) / (w / 2)) ** 2 + ((ys - h / 2) / (h / 2)) ** 2)
    return np.clip(1 - strength * np.clip(d - 0.15, 0, None) ** 2.2, 0.2, 1)


def paint(name, seed):
    src = Image.open(os.path.join(SRC, name)).convert("RGB")
    img = np.asarray(src, dtype=np.float64) / 255
    landscape = name.startswith("landscape")
    aspect = 1.45 if landscape else 1.1 / 1.4
    img = centre_crop(img, aspect)
    size = (640, 440) if landscape else (512, 652)
    img = np.asarray(Image.fromarray((img * 255).astype(np.uint8)).resize(size, Image.LANCZOS), dtype=np.float64) / 255
    img = grade(img, landscape)
    # Light brushwork: a small Kuwahara pass blended back over the form.
    img = kuwahara(img, 4) * 0.75 + img * 0.25
    h, w, _ = img.shape
    img = img * canvas(h, w, seed)[..., None] * vignette(h, w, 1.3 if not landscape else 0.7)[..., None]
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, os.path.splitext(name)[0] + ".jpg")
    Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(out, quality=86)
    print("painted", out)


if __name__ == "__main__":
    names = sys.argv[1:] or sorted(n for n in os.listdir(SRC) if n.endswith(".png"))
    for i, n in enumerate(names):
        paint(n, 100 + i)
