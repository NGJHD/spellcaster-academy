"""
Raw renders for the Hall of Portraits paintings: still lifes and bust studies of photo-scanned CC0
props (Poly Haven). One painting per run:

    blender --background --python assets-src/scripts/paintings.py -- <index>

Then: python scripts/paint_portraits.py  (painterly finish -> public/assets/textures/paintings/)
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "shared"))
import bpy  # noqa: E402
import paint  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
P = lambda n: os.path.join(ROOT, "public", "assets", "props", f"{n}.glb")  # noqa: E731

# (props as (glb, x, y, height, rotation°), light side)
PAINTINGS = [
    ([(P("marble_bust_01"), 0.0, 0.1, 0.62, -20)], 1),
    ([(P("wooden_candlestick"), -0.24, 0.22, 0.42, 0), (P("seadogs_compass"), 0.02, -0.06, 0.07, 25), (P("tea_set_01"), 0.26, 0.16, 0.17, -30)], -1),
    ([(P("ceramic_vase_02"), -0.12, 0.16, 0.44, 0), (P("tea_set_01"), 0.2, 0.02, 0.16, 20)], 1),
    ([(P("vintage_microscope"), 0.18, 0.16, 0.46, -40), (P("wooden_candlestick"), -0.24, 0.2, 0.38, 0), (P("seadogs_compass"), -0.02, -0.08, 0.07, -10)], -1),
    ([(P("horse_statue_01"), 0.0, 0.1, 0.5, 30)], -1),
    ([(P("marble_bust_01"), 0.0, 0.1, 0.62, 35)], -1),
    ([(P("mantel_clock_01"), -0.16, 0.16, 0.32, 10), (P("brass_vase_01"), 0.22, 0.2, 0.42, 0), (P("seadogs_compass"), 0.05, -0.08, 0.07, 60)], 1),
    ([(P("Lantern_01"), -0.18, 0.18, 0.42, 20), (P("ceramic_vase_02"), 0.2, 0.2, 0.36, 0), (P("wooden_candlestick"), 0.0, -0.05, 0.3, 0)], -1),
    ([(P("watering_can_metal_01"), -0.15, 0.15, 0.32, 30), (P("wicker_basket_01"), 0.2, 0.18, 0.26, -10), (P("trowel_01"), 0.02, -0.1, 0.05, 70)], 1),
    ([(P("marble_bust_01"), 0.0, 0.1, 0.62, 85)], 1),
]

args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
index = int(args[0]) if args else 0
bpy.ops.wm.read_factory_settings(use_empty=True)
props, side = PAINTINGS[index]
paint.render_still_life(os.path.join(ROOT, "assets-src", "paintings", "raw", f"painting_{index}.png"), props, seed=index, light_side=side)
