"""
Raw renders for the Hall of Portraits paintings. scripts/paint_portraits.py applies the
painterly finish (brushwork, canvas weave, varnish) outside Blender.

  render_still_life  dramatic still life / bust study of photo-scanned CC0 props
"""
import math
import os

import bpy
from mathutils import Vector


def _engine(scene, w, h):
    for name in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = name
            break
        except TypeError:
            continue
    scene.render.resolution_x = w
    scene.render.resolution_y = h
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"


def _world(colour, strength=1.0):
    world = bpy.data.worlds.new("PaintWorld")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    bg.inputs["Color"].default_value = (*colour, 1)
    bg.inputs["Strength"].default_value = strength
    bpy.context.scene.world = world


def render_still_life(path, glbs, seed=1, light_side=1):
    """Still life on a draped table: GLB props placed by (file, x, y, height, rotation)."""
    scene = bpy.context.scene
    _engine(scene, 800, 640)
    _world((0.012, 0.009, 0.007), 1.0)
    drape = bpy.data.materials.new("Drape")
    drape.use_nodes = True
    bsdf = drape.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = ((0.11, 0.018, 0.02, 1) if seed % 2 else (0.025, 0.035, 0.08, 1))
    bsdf.inputs["Roughness"].default_value = 0.85
    bpy.ops.mesh.primitive_plane_add(size=3, location=(0, 0.3, 0))
    bpy.context.active_object.data.materials.append(drape)
    back = bpy.data.materials.new("Ground")
    back.use_nodes = True
    back.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.035, 0.026, 0.018, 1)
    bpy.ops.mesh.primitive_plane_add(size=4, location=(0, 0.75, 1.0), rotation=(math.radians(90), 0, 0))
    bpy.context.active_object.data.materials.append(back)
    for file, x, y, h, rot in glbs:
        before = set(scene.objects)
        bpy.ops.import_scene.gltf(filepath=file)
        new = [o for o in scene.objects if o not in before]
        roots = [o for o in new if o.parent is None]
        meshes = [o for o in new if o.type == "MESH"]
        bpy.context.view_layer.update()
        lo = min((o.matrix_world @ Vector(c)).z for o in meshes for c in o.bound_box)
        hi = max((o.matrix_world @ Vector(c)).z for o in meshes for c in o.bound_box)
        s = h / max(1e-6, hi - lo)
        for r in roots:
            r.scale = (r.scale[0] * s, r.scale[1] * s, r.scale[2] * s)
            r.rotation_euler[2] += math.radians(rot)
        bpy.context.view_layer.update()
        lo = min((o.matrix_world @ Vector(c)).z for o in meshes for c in o.bound_box)
        cx = sum((o.matrix_world @ Vector(c)).x for o in meshes for c in o.bound_box) / (8 * len(meshes))
        cy = sum((o.matrix_world @ Vector(c)).y for o in meshes for c in o.bound_box) / (8 * len(meshes))
        for r in roots:
            r.location = (r.location[0] + x - cx, r.location[1] + y - cy, r.location[2] - lo)
    key = bpy.data.lights.new("Key", "AREA")
    key.energy = 200
    key.size = 0.45
    key.color = (1.0, 0.86, 0.68)
    ko = bpy.data.objects.new("Key", key)
    ko.location = (1.4 * light_side, -0.9, 1.3)
    ko.rotation_euler = (Vector((0, 0.1, 0.25)) - ko.location).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(ko)
    fill = bpy.data.lights.new("Fill", "AREA")
    fill.energy = 6
    fill.size = 1.5
    fill.color = (0.75, 0.8, 1.0)
    fo = bpy.data.objects.new("Fill", fill)
    fo.location = (-1.5 * light_side, -1.4, 0.6)
    fo.rotation_euler = (Vector((0, 0.1, 0.25)) - fo.location).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(fo)
    cam_data = bpy.data.cameras.new("Cam")
    cam_data.lens = 60
    cam = bpy.data.objects.new("Cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    cam.location = (0.0, -1.55, 0.62)
    cam.rotation_euler = (Vector((0, 0.15, 0.24)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    _save(scene, path)


def _save(scene, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"painting raw -> {path}")
