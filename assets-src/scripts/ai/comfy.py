"""
Minimal ComfyUI API client for the asset pipeline (CLAUDE.md §14.2: reproducible source scripts).

Concept images come from the owner's local Flux 2 Klein text-to-image setup (ComfyUI on port 8188);
image-to-3D meshes come from TRELLIS.2 (ComfyUI-3D on port 8189). Generated files are inputs to the
Blender scripts in assets-src/scripts, which clean up, rig, animate and export the runtime GLBs.

    python assets-src/scripts/ai/comfy.py concept <name> "<prompt>" [--seed N] [--size 1024]
    python assets-src/scripts/ai/comfy.py mesh <name> [--seed N]     (concept PNG -> textured GLB)
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import uuid

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CONCEPTS = os.path.join(ROOT, "assets-src", "concepts")
MESHES = os.path.join(ROOT, "assets-src", "ai-meshes")
FLUX = "http://127.0.0.1:8188"
TRELLIS = "http://127.0.0.1:8189"
TRELLIS_ROOT = os.path.join("C:" + os.sep, "ai", "ComfyUI-3D", "ComfyUI")
TRELLIS_WORKFLOW = os.path.join(TRELLIS_ROOT, "custom_nodes", "ComfyUI-Trellis2", "example_workflows", "MeshWithTexturing.json")
WIDGET_TYPES = {"INT", "FLOAT", "STRING", "BOOLEAN", "COMBO"}
SEED_NAMES = {"seed", "noise_seed"}
CONTROL_VALUES = {"fixed", "randomize", "increment", "decrement"}
CRLF = chr(13) + chr(10)


def post(base, path, body):
    req = urllib.request.Request(base + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(e.read().decode()[:3000]) from e


def get(base, path):
    with urllib.request.urlopen(base + path, timeout=120) as r:
        return r.read()


def run(base, graph, timeout=1800):
    """Queues an API-format graph and waits; returns the history entry."""
    prompt_id = post(base, "/prompt", {"prompt": graph, "client_id": str(uuid.uuid4())})["prompt_id"]
    start = time.time()
    while time.time() - start < timeout:
        try:
            hist = json.loads(get(base, f"/history/{prompt_id}"))
        except (TimeoutError, OSError):
            # The server can stall its HTTP thread during heavy GPU steps; keep waiting.
            time.sleep(5)
            continue
        if prompt_id in hist:
            entry = hist[prompt_id]
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError(json.dumps(status.get("messages", []))[:3000])
            if status.get("completed"):
                return entry
        time.sleep(2)
    raise TimeoutError(prompt_id)


def download(base, file_info, out_path):
    q = urllib.parse.urlencode({"filename": file_info["filename"], "subfolder": file_info.get("subfolder", ""), "type": file_info.get("type", "output")})
    data = get(base, f"/view?{q}")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as f:
        f.write(data)
    return out_path


def flux_graph(prompt, seed, width, height, prefix):
    """The owner's T2I - Flux2 workflow (Flux 2 Klein 9B, 4 steps, CFG 1) in API form."""
    return {
        "10": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "flux-2-klein-9b-Q8_0.gguf"}},
        "14": {"class_type": "CLIPLoader", "inputs": {"clip_name": "qwen_3_8b_fp8mixed.safetensors", "type": "flux2", "device": "default"}},
        "12": {"class_type": "VAELoader", "inputs": {"vae_name": "flux2-vae.safetensors"}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"clip": ["14", 0], "text": prompt}},
        "16": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["6", 0]}},
        "13": {"class_type": "EmptyFlux2LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["10", 0], "positive": ["6", 0], "negative": ["16", 0], "latent_image": ["13", 0],
                "seed": seed, "steps": 4, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "denoise": 1,
            },
        },
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["12", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
    }


def concept(name, prompt, seed=1, size=1024):
    entry = run(FLUX, flux_graph(prompt, seed, size, size, f"spellcaster/{name}"))
    images = [img for node in entry["outputs"].values() for img in node.get("images", [])]
    out = os.path.join(CONCEPTS, f"{name}.png")
    download(FLUX, images[0], out)
    with open(os.path.join(CONCEPTS, f"{name}.txt"), "w", encoding="utf-8") as f:
        f.write(f"seed: {seed}\nprompt: {prompt}\n")
    return out


def upload_image(base, path):
    """Multipart upload to ComfyUI's input folder; returns the stored file name."""
    boundary = uuid.uuid4().hex
    name = os.path.basename(path)
    with open(path, "rb") as f:
        data = f.read()
    head = f'--{boundary}{CRLF}Content-Disposition: form-data; name="image"; filename="{name}"{CRLF}Content-Type: image/png{CRLF}{CRLF}'
    tail = f'{CRLF}--{boundary}{CRLF}Content-Disposition: form-data; name="overwrite"{CRLF}{CRLF}true{CRLF}--{boundary}--{CRLF}'
    req = urllib.request.Request(base + "/upload/image", data=head.encode() + data + tail.encode(), headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())["name"]


def _has_control(name, kind, definition):
    extra = definition[1] if len(definition) > 1 and isinstance(definition[1], dict) else {}
    return kind == "INT" and (name in SEED_NAMES or bool(extra.get("control_after_generate")))


def ui_to_api(workflow, object_info, drop=("Preview3D", "Note", "MarkdownNote")):
    """Converts a ComfyUI UI-format workflow to an API graph using the server's node definitions."""
    links = {l[0]: l for l in workflow["links"]}
    graph = {}
    for node in workflow["nodes"]:
        cls = node["type"]
        if cls in drop or cls not in object_info:
            continue
        spec = object_info[cls]["input"]
        ordered = list(spec.get("required", {}).items()) + list(spec.get("optional", {}).items())
        linked = {i["name"]: i.get("link") for i in node.get("inputs", []) if i.get("link") is not None}
        values = list(node.get("widgets_values") or [])
        inputs = {}
        for name, definition in ordered:
            kind = definition[0] if isinstance(definition[0], str) else "COMBO"
            is_widget = kind in WIDGET_TYPES
            value = None
            if is_widget and values:
                value = values.pop(0)
                if _has_control(name, kind, definition) and values and values[0] in CONTROL_VALUES:
                    values.pop(0)
            if name in linked:
                src = links[linked[name]]
                inputs[name] = [str(src[1]), src[2]]
            elif is_widget and value is not None:
                inputs[name] = value
        # Inputs added to a node after the workflow was saved take their defaults.
        for name, definition in spec.get("required", {}).items():
            if name in inputs:
                continue
            extra = definition[1] if len(definition) > 1 and isinstance(definition[1], dict) else {}
            if "default" in extra:
                inputs[name] = extra["default"]
            elif isinstance(definition[0], list) and definition[0]:
                inputs[name] = definition[0][0]
        graph[str(node["id"])] = {"class_type": cls, "inputs": inputs}
    for n in graph.values():
        for k, v in list(n["inputs"].items()):
            if isinstance(v, list) and v[0] not in graph:
                del n["inputs"][k]
    return graph


def mesh(name, seed=12345):
    """Concept PNG -> TRELLIS.2 textured GLB (and the untextured white mesh) in assets-src/ai-meshes."""
    object_info = json.loads(get(TRELLIS, "/object_info"))
    with open(TRELLIS_WORKFLOW, encoding="utf-8") as f:
        workflow = json.load(f)
    graph = ui_to_api(workflow, object_info)
    # Blackwell (sm_120) GPUs break the CuMesh remeshing kernels (see ComfyUI-Trellis2/blackwell_fix.py):
    # rebuild the surface with the CPU voxel-to-mesh node and simplify with Meshlib instead.
    for node in list(graph.values()):
        if node["class_type"] == "Trellis2SimplifyMesh":
            node["inputs"]["method"] = "Meshlib"
            if node["inputs"].get("mesh") == ["161", 0]:
                # Feed the decoded surface straight in (skip CuMesh hole filling and quad reconstruction).
                node["inputs"]["mesh"] = ["217", 0]
            elif node["inputs"].get("mesh") == ["250", 0]:
                # Meshlib's hole filler runs out of memory on the raw decoded surface; Blender cleans up later.
                node["inputs"]["mesh"] = ["218", 0]
    for key in [k for k, n in graph.items() if n["class_type"] in ("Trellis2FillHolesWithCuMesh", "Trellis2ReconstructMeshWithQuad", "Trellis2FillHolesNicelyWithMeshlib")]:
        del graph[key]
    # Stage 1 only needs the raw shape: texturing happens on the cleaned mesh (prep_raw.py, texture()).
    for key in [k for k, n in graph.items() if n["class_type"] in ("Trellis2MeshTexturing", "Trellis2Continue")]:
        del graph[key]
    for key in [k for k, n in graph.items() if n["class_type"] == "Trellis2ExportMesh" and n["inputs"].get("trimesh", [None])[0] not in graph]:
        del graph[key]
    image = upload_image(TRELLIS, os.path.join(CONCEPTS, f"{name}.png"))
    stamp = f"spellcaster_{name}_{int(time.time())}"
    for node in graph.values():
        c, i = node["class_type"], node["inputs"]
        if c == "Trellis2LoadModel":
            # flash-attn is not installed in the owner's ComfyUI-3D; xformers is.
            i["backend"] = "xformers"
            i["sparse_backend"] = "xformers"
        elif c == "Trellis2LoadImageWithTransparency":
            i["image"] = image
        elif c == "Trellis2PreProcessImage":
            i["remove_background"] = True
        elif c == "PrimitiveString":
            i["value"] = stamp
        elif c in ("Trellis2SparseGenerator", "Trellis2MeshTexturing"):
            i["seed"] = seed
    run(TRELLIS, graph, timeout=3600)
    found = []
    for dirpath, _, files in os.walk(os.path.join(TRELLIS_ROOT, "output")):
        for fn in files:
            if fn.startswith(stamp) and fn.endswith(".glb"):
                found.append(os.path.join(dirpath, fn))
    os.makedirs(MESHES, exist_ok=True)
    results = []
    for src in found:
        kind = "white" if "_WhiteMesh" in src else "textured"
        dst = os.path.join(MESHES, f"{name}_{kind}.glb")
        with open(src, "rb") as a, open(dst, "wb") as b:
            b.write(a.read())
        results.append(dst)
    return results


TRELLIS_AMPERE = "http://127.0.0.1:8190"


def texturing_inputs(seed):
    return {
        "seed": seed, "texture_steps": 12, "texture_guidance_strength": 5.0, "texture_guidance_rescale": 0.05,
        "texture_rescale_t": 3.0, "resolution": 1024, "texture_size": 2048, "texture_alpha_mode": "OPAQUE",
        "double_side_material": False, "texture_guidance_interval_start": 0.0, "texture_guidance_interval_end": 0.99,
        "max_views": 4, "bake_on_vertices": False, "use_custom_normals": False,
        "mesh_cluster_threshold_cone_half_angle_rad": 60.0, "sampler": "heun", "inpainting": "telea", "verbose": False,
        "dino_lock": 0.0, "dino_substeps": 4, "dino_foundation_cap": 1.0,
    }


def clean(name, seed=12345):
    """
    Stage 2 on an Ampere GPU (port 8190): rebuild the raw stage-1 surface into a clean, watertight mesh
    with TRELLIS.2's CuMesh hole filling and quad reconstruction (broken on Blackwell), then texture it.
    """
    image = upload_image(TRELLIS_AMPERE, os.path.join(CONCEPTS, f"{name}.png"))
    stamp = f"spellcaster_{name}_clean_{int(time.time())}"
    raw = os.path.join(MESHES, f"{name}_white.glb")
    graph = {
        "1": {"class_type": "Trellis2LoadModel", "inputs": {
            "modelname": "visualbruno/TRELLIS.2-4B-FP8", "backend": "xformers", "device": "cuda", "low_vram": True,
            "keep_models_loaded": False, "conv_backend": "flex_gemm", "sparse_backend": "xformers",
            "use_reconviagen": False, "pixal3d_multiview": False}},
        "2": {"class_type": "Trellis2LoadImageWithTransparency", "inputs": {"image": image}},
        "3": {"class_type": "Trellis2PreProcessImage", "inputs": {"image": ["2", 2], "padding": 10, "remove_background": True, "max_size": 1024}},
        "4": {"class_type": "Trellis2LoadMesh", "inputs": {"glb_path": raw, "only_vertices_and_faces": True}},
        "5": {"class_type": "Trellis2TrimeshToMeshWithVoxel", "inputs": {"trimesh": ["4", 0], "resolution": 1024}},
        "6": {"class_type": "Trellis2FillHolesWithCuMesh", "inputs": {"mesh": ["5", 0], "max_permieters": 1.0}},
        "7": {"class_type": "Trellis2ReconstructMeshWithQuad", "inputs": {"mesh": ["6", 0], "remesh_band": 1.0, "resolution": 1024, "remove_floaters": True, "remove_inner_faces": True}},
        "8": {"class_type": "Trellis2SimplifyMesh", "inputs": {"mesh": ["7", 0], "target_face_num": 300000, "method": "Cumesh"}},
        "9": {"class_type": "Trellis2FillHolesNicelyWithMeshlib", "inputs": {"mesh": ["8", 0]}},
        "10": {"class_type": "Trellis2SimplifyMesh", "inputs": {"mesh": ["9", 0], "target_face_num": 300000, "method": "Cumesh"}},
        "11": {"class_type": "Trellis2MeshWithVoxelToTrimesh", "inputs": {"mesh": ["10", 0], "reorient_vertices": "None"}},
        "12": {"class_type": "Trellis2ExportMesh", "inputs": {"trimesh": ["11", 0], "filename_prefix": f"{stamp}_WhiteMesh", "file_format": "glb"}},
        "13": {"class_type": "Trellis2MeshTexturing", "inputs": {"pipeline": ["1", 0], "image": ["3", 0], "trimesh": ["11", 0], **texturing_inputs(seed)}},
        "14": {"class_type": "Trellis2ExportMesh", "inputs": {"trimesh": ["13", 0], "filename_prefix": f"{stamp}_Textured", "file_format": "glb"}},
    }
    run(TRELLIS_AMPERE, graph, timeout=3600)
    results = []
    for dirpath, _, files in os.walk(os.path.join(TRELLIS_ROOT, "output")):
        for fn in files:
            if fn.startswith(stamp) and fn.endswith(".glb"):
                kind = "clean_white" if "_WhiteMesh" in fn else "textured"
                dst = os.path.join(MESHES, f"{name}_{kind}.glb")
                with open(os.path.join(dirpath, fn), "rb") as a, open(dst, "wb") as b:
                    b.write(a.read())
                results.append(dst)
    return results


def texture(name, seed=12345, base=TRELLIS_AMPERE):
    """
    Stage 2: texture the clean stage-1b mesh (prep_raw.py) with TRELLIS.2, writing colour per vertex
    (bake_on_vertices) so the CuMesh UV-atlas step, which corrupts meshes in this install, never runs.
    Blender then bakes those colours onto the game mesh's own UVs (build_ai_creature.py).
    """
    image = upload_image(base, os.path.join(CONCEPTS, f"{name}.png"))
    stamp = f"spellcaster_{name}_vc_{int(time.time())}"
    # ComfyUI caches node results by input; a fresh file name makes it re-read the newly prepared mesh.
    fresh = os.path.join(MESHES, f"{stamp}_input.glb")
    with open(os.path.join(MESHES, f"{name}_dec.glb"), "rb") as a, open(fresh, "wb") as b:
        b.write(a.read())
    inputs = texturing_inputs(seed)
    inputs["bake_on_vertices"] = True
    graph = {
        "1": {"class_type": "Trellis2LoadModel", "inputs": {
            "modelname": "visualbruno/TRELLIS.2-4B-FP8", "backend": "xformers", "device": "cuda", "low_vram": True,
            "keep_models_loaded": False, "conv_backend": "flex_gemm", "sparse_backend": "xformers",
            "use_reconviagen": False, "pixal3d_multiview": False}},
        "2": {"class_type": "Trellis2LoadImageWithTransparency", "inputs": {"image": image}},
        "3": {"class_type": "Trellis2PreProcessImage", "inputs": {"image": ["2", 2], "padding": 10, "remove_background": True, "max_size": 1024}},
        "4": {"class_type": "Trellis2LoadMesh", "inputs": {"glb_path": fresh, "only_vertices_and_faces": True}},
        "5": {"class_type": "Trellis2MeshTexturing", "inputs": {"pipeline": ["1", 0], "image": ["3", 0], "trimesh": ["4", 0], **inputs}},
        "6": {"class_type": "Trellis2ExportMesh", "inputs": {"trimesh": ["5", 0], "filename_prefix": stamp, "file_format": "glb"}},
    }
    run(base, graph, timeout=3600)
    for dirpath, _, files in os.walk(os.path.join(TRELLIS_ROOT, "output")):
        for fn in files:
            if fn.startswith(stamp) and fn.endswith(".glb"):
                dst = os.path.join(MESHES, f"{name}_vc.glb")
                with open(os.path.join(dirpath, fn), "rb") as a, open(dst, "wb") as b:
                    b.write(a.read())
                return [dst]
    return []


if __name__ == "__main__":
    args = sys.argv[1:]
    seed_arg = int(args[args.index("--seed") + 1]) if "--seed" in args else None
    if args and args[0] == "concept":
        size = int(args[args.index("--size") + 1]) if "--size" in args else 1024
        print(concept(args[1], args[2], seed_arg or 1, size))
    elif args and args[0] == "texture":
        for path in texture(args[1], seed_arg or 12345):
            print(path)
    elif args and args[0] == "clean":
        for path in clean(args[1], seed_arg or 12345):
            print(path)
    elif args and args[0] == "mesh":
        for path in mesh(args[1], seed_arg or 12345):
            print(path)
    else:
        print(__doc__)
