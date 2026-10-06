"""
Bakes the molten-ink texture (owner, 2026-10-07: Level 3 needs realistic rendering): the CC0
cracked_red_ground photo becomes a dark cooled crust (diff.jpg) with glowing cracks (glow.jpg, used
as the emissive map). Tiles like the source.

    python assets-src/scripts/sky/molten.py
"""
import os

import cv2
import numpy as np

N = 1024
src = cv2.resize(cv2.imread("public/assets/textures/cracked_red_ground/diff.jpg"), (N, N)).astype(np.float32) / 255
# Tileable Voronoi plates: cooled crust plates with glowing seams between them.
rng = np.random.default_rng(7)
# Seeds kept apart (with wrap-around): two close seeds would make a smeared, fan-shaped glow.
pts = []
while len(pts) < 40:
    q = rng.random(2)
    if all(np.hypot(*(((q - o) + 0.5) % 1 - 0.5)) > 0.11 for o in pts):
        pts.append(q)
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32) / N
d1 = np.full((N, N), 9.0, np.float32)
d2 = np.full((N, N), 9.0, np.float32)
for px, py in pts:
    for ox in (-1, 0, 1):
        for oy in (-1, 0, 1):
            d = np.hypot(xx - (px + ox), yy - (py + oy))
            d2 = np.minimum(d2, np.maximum(d1, d))
            d1 = np.minimum(d1, d)
edge = d2 - d1
# Wobble the seams with the photo's own detail so they are not geometric.
grey = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
edge = edge + (grey - cv2.GaussianBlur(grey, (0, 0), 4)) * 0.05
seam = np.clip(1 - edge / 0.018, 0, 1) ** 1.5
halo = cv2.GaussianBlur(seam, (0, 0), 7) * 1.6
glow = np.clip(seam + halo * 0.3, 0, 1)
crust = (src * 0.32 + 0.015) * (1 - seam[..., None] * 0.9)
heat = np.stack([glow * 0.02, glow * 0.2 + seam ** 3 * 0.35, glow], -1)  # BGR: red-orange, yellow only at the hottest core
os.makedirs("public/assets/textures/molten_ink", exist_ok=True)
cv2.imwrite("public/assets/textures/molten_ink/diff.jpg", (np.clip(crust, 0, 1) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
cv2.imwrite("public/assets/textures/molten_ink/glow.jpg", (np.clip(heat, 0, 1) * 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
print("ok")
