"""
Props for the 2026-10-07 playtest fixes: the Level 3 tortoise (it carries the party across the ink
river), the paper ship the party sails (its bow is in view), the Level 2 bedroom (bed, wardrobe) and a
rampart beacon brazier (beacon words need something to shoot at).

    python assets-src/scripts/ai/concepts_fix.py [name ...]
"""
import sys

from comfy import concept

STYLE = (
    "highly detailed realistic 3D render of a single object, physically based materials, soft even studio lighting, "
    "plain light grey background, entire object in frame, centered, no people, no text"
)

CONCEPTS = {
    "giant_tortoise": ("A giant gentle ancient tortoise creature with a huge domed shell covered in moss, glowing gold "
                       "patterns on the shell, wise kind eyes, sturdy elephant-like legs, full body side view", 61),
    "paper_ship": ("A large sailing ship folded entirely from white paper like origami, crisp folded hull, tall folded "
                   "paper sails, a small lantern at the bow, three-quarter view", 62),
    "dorm_bed": ("A cosy wooden four-poster student bed with a patchwork quilt, two pillows and a small wooden chest at "
                 "its foot, fantasy academy dormitory style", 63),
    "wardrobe": ("A tall old carved wooden wardrobe with two doors and brass handles, a wizard robe hanging on the "
                 "side, fantasy academy style", 64),
    "erased_deer": ("A graceful red deer stag with large antlers standing calmly, realistic fur, gentle eyes, full body "
                    "side view", 66),
    "beacon_brazier": ("A large iron beacon brazier on a stone pedestal with a wide iron fire bowl full of logs, "
                       "ornate gold star decorations, castle rampart style", 65),
}

if __name__ == "__main__":
    for name in sys.argv[1:] or list(CONCEPTS):
        prompt, seed = CONCEPTS[name]
        print(concept(name, f"{prompt}, {STYLE}", seed))
