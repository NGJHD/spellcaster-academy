"""
The clue mosaic in the library (lib-mosaic, LEVEL1_DESIGN.md): the Warden below the arc of the sky-ward,
holding it shut, and a man with a glowing pen locked outside it. Flux 3 paints the tiled picture at the
panel's shape (1.22 m by 3.06 m); kit_scene.py sets it into its brass frame.

    python assets-src/scripts/ai/mosaic.py [seed ...]

Paintings: assets-src/concepts/mosaic/mosaic_<seed>.png; the chosen one is CHOSEN.
"""
import os
import sys

from comfy import CONCEPTS, FLUX, download, run
from loading_art import flux3_graph

OUT = os.path.join(CONCEPTS, "mosaic")
CHOSEN = 521
PROMPT = (
    "An ancient Byzantine wall mosaic made of small square glass and stone tiles with visible grout, a tall narrow "
    "vertical panel seen straight on, filling the whole frame. Deep blue night sky full of small gold stars. A wide "
    "glowing golden arc of light spans the panel like a dome. Above the arc, outside it, a dark hooded cloaked man "
    "holds up a glowing red quill pen. Below the arc, holding the golden arc shut with both arms raised, floats a huge "
    "guardian of white marble in gold-trimmed armour, a helmeted face with glowing blue eyes, a glowing blue star on its "
    "chest, a halo of small gold stars round its head and a long starry skirt instead of legs. At the very bottom three small castle towers with pointed roofs. Rich gold, blue and red tiles, "
    "no frame, no text"
)


def main():
    os.makedirs(OUT, exist_ok=True)
    for seed in [int(a) for a in sys.argv[1:]] or [CHOSEN]:
        path = os.path.join(OUT, f"mosaic_{seed}.png")
        if os.path.exists(path):
            continue
        entry = run(FLUX, flux3_graph(PROMPT, seed, f"spellcaster/mosaic/{seed}", 608, 1520), timeout=1800)
        images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
        download(FLUX, images[0], path)
        print(seed, flush=True)


if __name__ == "__main__":
    main()
