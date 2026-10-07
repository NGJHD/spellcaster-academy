"""
Bakes the Level 3 fire sky (owner, 2026-10-07: "the sky is bland"): the cloud shapes of a CC0 Poly Haven
overcast sky (overcast_soil_puresky) recoloured into smoke lit from below by fire. Dark crimson
smoke overhead, an orange glow along the horizon, cloud edges catching the firelight.

    python assets-src/scripts/sky/fire_sky.py <input.hdr> [name]

Writes public/assets/sky/<name>.jpg, an equirectangular image used as the visible sky dome.
"""
import sys

import cv2
import numpy as np

src = sys.argv[1]
name = sys.argv[2] if len(sys.argv) > 2 else "fire_sky"
hdr = cv2.imread(src, cv2.IMREAD_ANYDEPTH | cv2.IMREAD_COLOR).astype(np.float32)
h, w = hdr.shape[:2]
lum = hdr @ np.array([0.0722, 0.7152, 0.2126], np.float32)  # BGR
lum = np.log1p(lum)
# Local cloud detail: luminance minus its large-scale blur, so the overall brightness of the source
# sky does not decide the colours, only the shapes of the clouds.
blur = cv2.GaussianBlur(lum, (0, 0), w / 40)
detail = np.clip((lum - blur) * 6.0, -1, 1)
# Elevation: 1 at the zenith, 0 at the horizon, negative below.
elev = np.linspace(1, -1, h, dtype=np.float32)[:, None].repeat(w, 1)
up = np.clip(elev, 0, 1)
# Fire gradient by height (RGB): glowing horizon → crimson → smoky near-black overhead.
stops = [(0.0, (255, 120, 45)), (0.08, (220, 70, 30)), (0.25, (130, 28, 16)), (0.55, (55, 12, 10)), (1.0, (22, 8, 8))]
if name.endswith("night"):
    # Level 2's burning night: near-black smoke overhead, a red glow only low down.
    stops = [(0.0, (230, 80, 30)), (0.07, (160, 40, 16)), (0.2, (70, 14, 8)), (0.45, (22, 6, 6)), (1.0, (6, 3, 4))]
xs = np.array([s[0] for s in stops], np.float32)
cols = np.array([s[1] for s in stops], np.float32) / 255
base = np.stack([np.interp(up, xs, cols[:, c]) for c in range(3)], -1)
# Clouds: dense parts darken into smoke, their lit edges glow orange (stronger near the horizon).
smoke = np.clip(-detail, 0, 1)[..., None]
glow = np.clip(detail, 0, 1)[..., None] * (0.35 + 0.65 * (1 - up[..., None])) * (0.55 if name.endswith('night') else 1.0)
img = base * (1 - 0.55 * smoke) + glow * np.array([1.0, 0.45, 0.15], np.float32) * 0.6
# Below the horizon: dark ash haze (never seen past the ground, but keeps the seam soft).
below = np.clip(-elev * 12, 0, 1)[..., None]
# Matches the Level 3 fog colour (#8a3018) so the far edge of the ground melts into the sky.
horizon = np.array([0x2a, 0x0d, 0x08] if name.endswith('night') else [0x8a, 0x30, 0x18], np.float32) / 255
img = img * (1 - below) + horizon * below
img = np.clip(img, 0, 1) ** (1 / 1.1)
out = (img[..., ::-1] * 255).astype(np.uint8)
out = cv2.resize(out, (4096, 2048), interpolation=cv2.INTER_AREA)
import os
os.makedirs("public/assets/sky", exist_ok=True)
cv2.imwrite(f"public/assets/sky/{name}.jpg", out, [cv2.IMWRITE_JPEG_QUALITY, 88])
cv2.imwrite(f"public/assets/sky/{name}_preview.jpg", cv2.resize(out, (1024, 512)))
print("wrote", name)
