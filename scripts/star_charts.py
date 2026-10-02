"""
Hand-drawn celestial charts for the Moon Tower walls (original constellations, deterministic).

    python scripts/star_charts.py   -> public/assets/textures/paintings/star_chart_{0,1}.jpg
"""
import math
import os
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "public", "assets", "textures", "paintings")
W, H = 960, 660


def chart(seed):
    rnd = random.Random(seed)
    # Aged deep-blue paper with mottling.
    base = np.zeros((H, W, 3))
    base[:] = (24, 34, 66)
    noise = np.random.default_rng(seed).normal(0, 1, (H // 8, W // 8))
    noise = np.array(Image.fromarray(((noise - noise.min()) / (np.ptp(noise) + 1e-9) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)) / 255
    base *= (0.8 + 0.35 * noise)[..., None]
    img = Image.fromarray(np.clip(base, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)
    gold = (214, 180, 110)
    faint = (150, 140, 120)
    cx, cy, r = W / 2, H / 2, H * 0.44
    # Graticule: concentric declination circles, right-ascension spokes, an ecliptic.
    for k in range(1, 5):
        rr = r * k / 4
        d.ellipse((cx - rr, cy - rr, cx + rr, cy + rr), outline=faint, width=1)
    for k in range(24):
        a = math.tau * k / 24
        d.line((cx, cy, cx + math.cos(a) * r, cy + math.sin(a) * r), fill=faint, width=1)
    d.ellipse((cx - r * 0.9, cy - r * 0.55, cx + r * 0.9, cy + r * 0.55), outline=gold, width=2)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), outline=gold, width=4)
    d.ellipse((cx - r - 14, cy - r - 14, cx + r + 14, cy + r + 14), outline=gold, width=1)
    for k in range(72):
        a = math.tau * k / 72
        l1 = r + (10 if k % 6 else 16)
        d.line((cx + math.cos(a) * r, cy + math.sin(a) * r, cx + math.cos(a) * l1, cy + math.sin(a) * l1), fill=gold, width=1)
    # Background stars.
    for _ in range(420):
        a = rnd.random() * math.tau
        rr = math.sqrt(rnd.random()) * r
        x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr
        s = rnd.choice((0.8, 1.0, 1.2, 1.6, 2.2))
        d.ellipse((x - s, y - s, x + s, y + s), fill=(235, 228, 205))
    # Original constellations: joined bright stars with small eight-point glints.
    for _ in range(7):
        a = rnd.random() * math.tau
        rr = (0.2 + rnd.random() * 0.65) * r
        x, y = cx + math.cos(a) * rr, cy + math.sin(a) * rr
        pts = [(x, y)]
        for _ in range(rnd.randint(4, 7)):
            x += rnd.uniform(-60, 60)
            y += rnd.uniform(-45, 45)
            pts.append((x, y))
        d.line(pts, fill=gold, width=2)
        for px, py in pts:
            s = rnd.uniform(3, 5.5)
            d.line((px - s * 1.8, py, px + s * 1.8, py), fill=(255, 240, 200), width=1)
            d.line((px, py - s * 1.8, px, py + s * 1.8), fill=(255, 240, 200), width=1)
            d.ellipse((px - s, py - s, px + s, py + s), fill=(255, 236, 190))
    # Corner compass roses.
    for qx, qy in ((70, 70), (W - 70, 70), (70, H - 70), (W - 70, H - 70)):
        for k in range(8):
            a = math.tau * k / 8
            l = 44 if k % 2 == 0 else 24
            d.polygon([(qx, qy), (qx + math.cos(a + 0.15) * l * 0.3, qy + math.sin(a + 0.15) * l * 0.3), (qx + math.cos(a) * l, qy + math.sin(a) * l), (qx + math.cos(a - 0.15) * l * 0.3, qy + math.sin(a - 0.15) * l * 0.3)], outline=gold, fill=(60, 60, 80) if k % 2 else (190, 160, 100))
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    # Varnish and edge wear.
    arr = np.asarray(img, dtype=np.float64) / 255
    ys, xs = np.mgrid[0:H, 0:W]
    dist = np.sqrt(((xs - W / 2) / (W / 2)) ** 2 + ((ys - H / 2) / (H / 2)) ** 2)
    arr *= np.clip(1.05 - 0.45 * np.clip(dist - 0.5, 0, None) ** 1.5, 0.3, 1)[..., None]
    arr *= np.array([1.0, 0.95, 0.85])
    return Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for i in range(2):
        path = os.path.join(OUT, f"star_chart_{i}.jpg")
        chart(70 + i).save(path, quality=86)
        print("chart", path)
