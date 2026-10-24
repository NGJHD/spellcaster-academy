"""
Key art for the loading screen shown while the game first loads (owner, 2026-10-23: a painted
background with a loading bar at the bottom; then "more 3D like the game … like the academy is fighting
the Unwriter or the Hush, like a battle scene", no parchment or map). The defenders hold the left, the
Unwriter and the Hush the right, and their magic clashes in the middle in front of the besieged academy;
the top and bottom are left calmer for the title and the bar, which the page draws.

    python assets-src/scripts/ai/loading_art.py <krea2|flux3> [seed ...]

Writes assets-src/concepts/loading_<model>_<seed>.png. The game uses `flux3 204` (owner's pick), saved as
public/assets/ui/loading.webp (Krea2 Turbo looked more polished but armed the monsters with swords and
dressed the students in striped school ties, both off-limits by CLAUDE.md section 2).
"""
import os
import sys

from comfy import CONCEPTS, FLUX, download, run

PROMPT = (
    "Cinematic 3D video game key art render, stylised realistic like a modern fantasy adventure game, Unreal Engine "
    "style lighting, wide battle scene at dusk. In the background a grand fairytale magic academy castle of pale "
    "stone with tall towers and blue slate roofs, under siege, a shimmering golden dome of protective magic over it, "
    "a burning red sky with a glowing crack torn across it, embers in the air. On the left the defenders charge "
    "forward: a young child apprentice wizard in a navy blue robe casting a blazing golden spell bolt from a wooden "
    "wand, a small glowing white orb with golden rings orbiting it flying beside the child, a brave girl student in a "
    "navy robe with gold trim, and a tall old keeper with a long white beard in a deep red robe raising a staff of "
    "light. On the right the enemy army advances: a towering hooded villain in charred black paper robes wearing a "
    "cracked white porcelain mask with a burning red line, pointing a long black quill pen that shoots red fire, "
    "monsters made of bubbling black ink with glowing ember eyes, a snarling wolf made of smouldering charcoal with "
    "glowing red cracks, huge moths with burning wings, and a great dragon made of burning book pages in the sky. "
    "Golden magic and red fire collide in the centre in a bright burst of light. Dramatic, exciting, epic, child "
    "friendly, no blood, no gore, no swords, no text, no letters, no logo, no user interface"
)

WIDTH, HEIGHT = 1920, 1088


def krea2_graph(prompt, seed, prefix):
    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "krea2_turbo-Q8_0.gguf"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_4b_fp8_scaled.safetensors", "type": "krea2", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "qwen_image_vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["4", 0]}},
        "6": {"class_type": "EmptyLatentImage", "inputs": {"width": WIDTH, "height": HEIGHT, "batch_size": 1}},
        "7": {"class_type": "KSampler", "inputs": {"model": ["1", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0], "seed": seed, "steps": 8, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "denoise": 1}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
    }


def flux3_graph(prompt, seed, prefix, width=WIDTH, height=HEIGHT):
    shift = 2.77259  # log(16): the workflow's alpha of 16
    return {
        "1": {"class_type": "UNETLoader", "inputs": {"unet_name": "flux3-image-klein-int8-convrot.safetensors", "weight_dtype": "default"}},
        "2": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen3vl_4b_int8_convrot.safetensors", "type": "flux3", "device": "default"}},
        "3": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "4": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "5": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["2", 0]}},
        "6": {"class_type": "EmptyFlux2LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "10": {"class_type": "ModelSamplingFlux", "inputs": {"model": ["1", 0], "max_shift": shift, "base_shift": shift, "width": width, "height": height}},
        "7": {"class_type": "KSampler", "inputs": {"model": ["10", 0], "positive": ["4", 0], "negative": ["5", 0], "latent_image": ["6", 0], "seed": seed, "steps": 16, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "denoise": 1}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["7", 0], "vae": ["3", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
    }


GRAPHS = {"krea2": krea2_graph, "flux3": flux3_graph}


def main():
    model = sys.argv[1] if len(sys.argv) > 1 else "krea2"
    seeds = [int(s) for s in sys.argv[2:]] or [201, 202]
    for seed in seeds:
        name = f"loading_{model}_{seed}"
        entry = run(FLUX, GRAPHS[model](PROMPT, seed, f"spellcaster/{name}"), timeout=5400)
        images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
        out = os.path.join(CONCEPTS, f"{name}.png")
        download(FLUX, images[0], out)
        with open(os.path.join(CONCEPTS, f"{name}.txt"), "w", encoding="utf-8") as f:
            f.write(f"model: {model}\nseed: {seed}\nsize: {WIDTH}x{HEIGHT}\nprompt: {PROMPT}\n")
        print(out, flush=True)


if __name__ == "__main__":
    main()
