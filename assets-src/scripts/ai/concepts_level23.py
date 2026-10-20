"""
Level 2 (the Hush) and Level 3 (the Blank) mob and boss concepts for the image-to-3D pipeline.
Owner (2026-10-04): realistic, scary, fire and red; no gore. One full-body subject, neutral pose,
plain background (what TRELLIS.2 needs).

    python assets-src/scripts/ai/concepts_level23.py [name ...]
"""
import sys

from comfy import concept

STYLE = (
    "highly detailed realistic 3D creature render, physically based materials, soft even studio lighting, "
    "plain light grey background, entire body in frame, centered, no shadows, no text, no blood"
)

CONCEPTS = {
    # Level 2: the Hush (ink-and-ember constructs).
    "blotling": (
        "Full body of a knee-high monster made of glossy bubbling black ink, squat blob body on stubby legs, two burning "
        "orange ember eyes, a jagged glowing red crack running down its front like a mouth of fire, drips of ink, "
        "menacing, facing the camera", 21),
    "eraser_moth": (
        "A huge menacing moth monster seen from the front with wings spread, charred black wings edged with glowing orange "
        "embers, furry dark body, glowing red eyes, sparks drifting off the wings", 22),
    "scribble_imp": (
        "Full body of a small jittery imp creature made of tangled scribbled black ink lines, glowing ember eyes, sharp "
        "grin, holding a burning feather quill like a torch, standing facing the camera", 23),
    "smudgehound": (
        "Full body of a lean snarling wolf-like hound made of smouldering black charcoal, cracks of glowing red embers "
        "across its body, flames running along its spine, burning red eyes, bared fangs, standing side-on to the camera "
        "with head turned to the viewer", 24),
    "hollow_knight": (
        "Full body of an empty suit of spiked blackened iron armour, red fire burning inside the visor slit and glowing "
        "through the joints, heavy and menacing, no face, no weapons, standing facing the camera with arms slightly away "
        "from the body", 25),
    # Owner (2026-10-19): it reads from a book (reference: a hooded reader over a glowing open book).
    "grey_herald": (
        "Full body of a tall faceless hooded herald figure in long tattered robes of charred black paper with glowing "
        "red edges, holding a large open ancient spellbook in its left hand only at chest height, reading it with its "
        "hooded head bowed over the pages, the open pages glowing with red fire light, its other arm held out to the "
        "side well away from its body with the hand open and the palm facing up like a preacher, sinister, standing "
        "facing the camera, full arms visible", 26),
    "vellum_wyrm": (
        "A huge serpentine dragon made of burning book pages and leather book spines, a horned head made from an open "
        "book with blazing red eyes and a mouth full of fire, a black crystal heart glowing red between rib-like book "
        "spines, embers streaming off its body, coiled, facing the camera", 27),
    # Level 3: the Blank and the Cinder Citadel.
    "correction_moth": (
        "A menacing moth monster seen from the front with wings spread, wings made of burning paper with black ink veins "
        "and glowing ember edges, dark body, glowing red eyes", 31),
    "redactor": (
        "Full body of a tall thin sinister figure shaped like a thick black bar of ink, a burning red slit for a face, "
        "fire dripping from its edges, long thin arms, gliding, facing the camera", 32),
    "foreman": (
        "Full body of a hulking armoured forge-master construct of black iron, a furnace burning in its open chest, "
        "glowing red seams, carrying a huge forge hammer, massive shoulders, menacing, facing the camera", 33),
    "perfect_warden": (
        "Full body of a tall floating stone-and-iron guardian made of polished black iron plates held together by red "
        "fire, a faceless mask with a burning red light seam, a ring halo behind its head, red fire burning through its "
        "seams and chest core, cold and perfect, levitating in the air like a mystic, both arms held straight and "
        "spread out to the sides angled 45 degrees downward away from its body with open hands and the palms facing "
        "forward, one leg crossed behind the other with the toes pointing down, arms and legs clearly separated from "
        "the body, facing the camera", 34),
    # Made for a clean 3D build (2026-10-20: the first one fell apart into a floating mask and a robe full
    # of holes): a solid hooded head behind the mask, an unbroken robe, no drips or loose flames, and
    # the quill arm raised clear of the body.
    "unwriter": (
        "Full body of a tall imposing dark wizard villain, a heavy black hood over his head and a smooth cracked "
        "white porcelain mask with a burning red line across it covering his whole face, long thick solid robes of "
        "charred black paper with thin glowing ember cracks, a solid unbroken silhouette with no holes, his right "
        "arm raised up and held out to the side away from his body, elbow bent, his gloved hand gripping a long "
        "black quill pen that points upward with a glowing red nib, his other arm hanging at his side, menacing, "
        "standing facing the camera, plain grey background, no drips, no smoke, no loose flames, no gore", 35),
}

if __name__ == "__main__":
    names = sys.argv[1:] or list(CONCEPTS)
    for name in names:
        prompt, seed = CONCEPTS[name]
        print(concept(name, f"{prompt}, {STYLE}", seed))
