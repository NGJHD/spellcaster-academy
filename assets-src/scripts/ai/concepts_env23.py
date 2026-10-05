"""
Level 2/3 environment set pieces for the image-to-3D pipeline (owner: "it's not just the mobs, but the
environment as well"). Each is one object on a plain background; built as static props (rig="none").

    python assets-src/scripts/ai/concepts_env23.py [name ...]
"""
import sys

from comfy import concept

STYLE = (
    "highly detailed realistic 3D render of a single object, physically based materials, soft even studio lighting, "
    "plain light grey background, entire object in frame, centered, no people, no text"
)

CONCEPTS = {
    # Level 2: the academy at night under siege.
    "festival_stall": ("A wooden fantasy festival market stall with a striped red and gold fabric awning, carved posts, "
                       "a counter with paper lanterns and small jars, slightly scorched", 41),
    "boathouse": ("A small old stone and timber boathouse with a steep slate roof, a wide arched water door and a "
                  "little wooden jetty, partly burnt and charred", 42),
    "bronze_bell": ("A huge ornate bronze bell hanging from a heavy carved oak yoke frame, engraved with stars", 43),
    "alchemy_furnace": ("A massive old brick and iron alchemy furnace with a round arched fire door, copper pipes, a "
                        "tall chimney and riveted iron bands", 44),
    "copper_still": ("An antique copper alchemy still with a round pot, coiled copper pipes and brass valves on an "
                     "iron stand", 45),
    "lighthouse": ("A tall old stone lighthouse tower painted in red and white bands with a glass lantern room and "
                   "an iron balcony at the top, on a rocky base", 46),
    "rowing_boat": ("An old wooden rowing boat with oars resting inside and a small brass lantern on a pole at the "
                    "bow", 47),
    # Level 3: the Blank and the Cinder Citadel.
    "dead_tree": ("A tall dead charred black tree with twisted bare branches, cracks in the bark glowing with orange "
                  "embers", 51),
    "ash_rock": ("A large jagged scorched dark grey volcanic rock with glowing red molten cracks", 52),
    "black_galleon": ("A menacing black wooden galleon sailing ship with torn black sails, three masts and a burning "
                      "figurehead, side view", 53),
    # Original design (CLAUDE.md §2): the back is a giant open book of charred pages, not a mass of blades.
    "iron_throne": ("A tall sinister throne whose high back is a giant open book with charred black pages fanning "
                    "upward, a smooth black iron seat and armrests shaped like quill feathers, thin glowing red lines "
                    "on the pages, on round black stone steps", 59),
    "ink_cauldron": ("A huge black iron cauldron on a stand, overflowing with glowing molten red ink, heavy chains on "
                     "its handles", 55),
    "forge_hammer": ("A gigantic black iron industrial forge hammer machine with a heavy hammer head on a frame of "
                     "riveted beams and chains, glowing hot anvil", 56),
    "citadel_tower": ("A tall sinister fortress tower of black iron and charred stone with sharp spires and red "
                      "glowing windows, flames at the top", 57),
    "journal_lectern": ("An ornate carved dark wood lectern holding a large old open leather journal with burning "
                        "edges", 58),
}

if __name__ == "__main__":
    names = sys.argv[1:] or list(CONCEPTS)
    for name in names:
        prompt, seed = CONCEPTS[name]
        print(concept(name, f"{prompt}, {STYLE}", seed))
