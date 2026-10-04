"""
Level 1 mob concepts for the image-to-3D pipeline (owner, 2026-10-04: realistic designs; mobs may
look scary). Each prompt asks for one full-body subject in a neutral pose on a plain background,
which is what TRELLIS.2 needs.

    python assets-src/scripts/ai/concepts_level1.py [name ...]
"""
import sys

from comfy import concept

PROP_STYLE = (
    "highly detailed realistic 3D render, physically based materials, soft even studio lighting, plain light grey "
    "background, entire object in frame, centered, no text"
)
PROPS = {"tea_tray", "lift_platform", "inkwell"}

STYLE = (
    "highly detailed realistic 3D creature render, physically based materials, soft even studio lighting, "
    "plain light grey background, entire body in frame, centered, no shadows, no text"
)

CONCEPTS = {
    "mossling": (
        "Full body of a hulking forest guardian monster about one metre tall, ape-like body covered in thick wet green moss "
        "and armoured with plates of dark rough tree bark, broad shoulders, very long heavy forearms with three thick clawed "
        "fingers, short sturdy legs, small antler-like branches, fern fronds growing along its back, a wide mouth of jagged "
        "wooden teeth, deep-set glowing amber eyes, menacing, standing upright facing the camera in a neutral pose with arms "
        "slightly away from the body", 7),
    "ink_wisp": (
        "Full body of a floating ink wraith monster, a tall thin humanoid figure made of glossy dark indigo ink with a "
        "glassy wet surface, long clawed fingers dripping ink, two narrow glowing cyan eyes and a jagged glowing mouth, "
        "the lower body tapering into twisting ink tendrils instead of legs, tattered ink trails at its shoulders, "
        "menacing, facing the camera with arms held slightly away from the body", 3),
    "armour_guardian": (
        "Full body of an animated suit of ceremonial knight armour standing guard, blackened steel plates with engraved "
        "brass trim, spiked pauldrons, a closed helmet with a narrow visor glowing with cold blue light and no face inside, "
        "a crescent moon emblem on the breastplate, dark navy quilted cloth under the plates, no weapons, imposing, standing "
        "upright facing the camera in a neutral pose with arms slightly away from the body", 5),
    "paint_imp": (
        "Full body of a small mischievous imp creature made of thick glossy wet oil paint, about 80 cm tall, red paint body "
        "with drips running down, swirls of other colours, big round yellow eyes with slit pupils, a wide grin full of sharp "
        "white teeth, little curved horns, long thin clawed fingers, short stubby legs, standing facing the camera", 4),
    "thorn_pod": (
        "A carnivorous magical plant monster rooted in a clump of soil, thick twisted green stem covered in sharp thorns, "
        "broad jagged leaves, a large burgundy flower head shaped like jaws lined with rows of needle teeth, a glowing amber "
        "seed chamber in its throat, about 1.4 metres tall, facing the camera", 9),
    "runaway_book": (
        "A monstrous flying spellbook seen from the front, thick antique leather-bound book with brass corner clasps, the "
        "covers half open like jaws, the page edges forming rows of sharp paper teeth, two glowing yellow eyes on the front "
        "cover, a long ribbon bookmark like a tongue, menacing", 2),
    "snapvine": (
        "The head of a giant carnivorous vine plant monster, a huge venus flytrap like flower head with thick burgundy and "
        "green petal jaws lined with long ivory thorn teeth, a glowing orange throat, on a thick twisting green vine stem "
        "with leaves, facing the camera", 6),
    "training_dummy": (
        "Full body of an old wooden training mannequin come to life, articulated hardwood limbs held together with leather "
        "straps and brass hinge pins, a canvas-wrapped torso with a painted red target on the chest, a carved wooden head with "
        "two glowing angry eyes burned into it, cracks in the varnish, standing on a weighted stone base, facing the camera", 8),
    "tea_tray": (
        "An ornate antique silver tea tray seen from above at an angle, oval with raised scalloped rim and two curved "
        "handles, engraved floral and star patterns, slightly tarnished, single object", 12),
    "lift_platform": (
        "A round antique brass elevator platform for a wizard tower, circular brass floor plate with riveted rim, a "
        "waist-high ornate brass railing with curled scrollwork, four thick chains rising from the railing, "
        "single object", 14),
    "inkwell": (
        "An overturned antique glass inkwell bottle lying on its side with a brass cap, a puddle of glossy dark "
        "indigo ink spreading from its mouth, single object", 15),
}

if __name__ == "__main__":
    names = sys.argv[1:] or list(CONCEPTS)
    for name in names:
        prompt, seed = CONCEPTS[name]
        print(concept(name, f"{prompt}, {PROP_STYLE if name in PROPS else STYLE}", seed))
