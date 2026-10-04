"""
Runs the AI creature pipeline for each name whose raw TRELLIS.2 shape exists:
prep_raw.py (clean watertight mesh) -> comfy.py texture (per-vertex colour) -> build_ai_creature.py.

    python assets-src/scripts/ai/pipeline.py <name> [<name> ...] [--tris=N]

Big subjects (the Vellum Wyrm) can run the 10 GB texturing GPU out of memory at 300k triangles;
pass a lower --tris for them.
"""
import os
import subprocess
import sys

from comfy import MESHES, texture

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
BLENDER = r"C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
HERE = os.path.dirname(__file__)


def blender(script, *extra):
    out = subprocess.run([BLENDER, "--background", "--python", os.path.join(HERE, script), "--", *extra], capture_output=True, text=True)
    for line in out.stdout.splitlines():
        if line.startswith(("PREP", "BUILT", "UV ", "Error", "Traceback")):
            print("   ", line)
    if out.returncode != 0:
        print(out.stderr[-2000:])


TRIS = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--tris=")), "300000")

for name in [a for a in sys.argv[1:] if not a.startswith("--")]:
    print(f"== {name}")
    if not os.path.exists(os.path.join(MESHES, f"{name}_white.glb")):
        print("   no raw shape yet")
        continue
    blender("prep_raw.py", name, TRIS)
    print("   ", texture(name))
    blender("build_ai_creature.py", name, "--preview")
