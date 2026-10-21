"""
Creature builder for original Level 1 characters (CLAUDE.md §14.3).

Organic forms are modelled as blended volumes (metaball ellipsoids and capsules — like clay
blocked out over an armature), then:
  1. converted to a mesh and voxel-remeshed into one watertight surface,
  2. smoothed and decimated to the runtime budget (no visible primitive assembly),
  3. painted with material zones and subtle organic variation in vertex colours (COLOR_0),
  4. bound to an armature built from named joints with automatic weights,
  5. given rigid accessories (eyes, leaves, plates) parented to bones,
  6. animated with named, eased actions and exported to GLB.

Coordinates: Blender Z-up, metres; creatures face −Y (glTF converts to Y-up facing +Z).
Colours are authored in sRGB and converted to linear for vertex colours.
"""
import math
import random

import bmesh
import bpy
from mathutils import Vector

SURFACE_FACTOR = 0.575  # metaball surface radius / element radius (threshold 0.6, stiffness 2)


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def srgb_to_linear(c):
    def ch(x):
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4

    return tuple(ch(x) for x in c[:3])


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))


# ---------- Materials ----------


def make_material(name, color="#ffffff", roughness=0.6, metallic=0.0, emission=None, emission_strength=1.0, vertex_colors=False, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    rgb = srgb_to_linear(hex_rgb(color)) if isinstance(color, str) else color[:3]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        erg = srgb_to_linear(hex_rgb(emission)) if isinstance(emission, str) else emission[:3]
        bsdf.inputs["Emission Color"].default_value = (*erg, 1)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1.0:
        bsdf.inputs["Alpha"].default_value = alpha
        try:
            mat.surface_render_method = "BLENDED"
        except AttributeError:
            pass
    if vertex_colors:
        attr = nt.nodes.new("ShaderNodeVertexColor")
        attr.layer_name = "Col"
        nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


# ---------- Volumes ----------


class Volume:
    """An ellipsoid (radii) or capsule (a→b, radius); sizes are the desired *surface* sizes."""

    def __init__(self, kind, center, radii, zone="body", rotation=(0, 0, 0), end=None):
        self.kind = kind
        self.center = Vector(center)
        self.radii = Vector(radii) if kind == "ellipsoid" else Vector((radii, radii, radii))
        self.zone = zone
        self.rotation = Vector(rotation)
        self.end = Vector(end) if end is not None else None

    def distance(self, p):
        """Normalised distance from the volume (≈1 on its surface)."""
        if self.kind == "ellipsoid":
            m = euler_matrix(self.rotation)
            local = m.inverted() @ (p - self.center)
            return Vector((local.x / self.radii.x, local.y / self.radii.y, local.z / self.radii.z)).length
        a, b = self.center, self.end
        ab = b - a
        t = max(0.0, min(1.0, (p - a).dot(ab) / max(ab.length_squared, 1e-9)))
        return (p - (a + ab * t)).length / self.radii.x


def euler_matrix(deg):
    from mathutils import Euler

    return Euler(tuple(math.radians(d) for d in deg), "XYZ").to_matrix()


def ellipsoid(center, radii, zone="body", rotation=(0, 0, 0)):
    return Volume("ellipsoid", center, radii, zone, rotation)


def capsule(a, b, radius, zone="body"):
    return Volume("capsule", a, radius, zone, end=b)


def build_volume_mesh(name, volumes, voxel=0.006, smooth=6, target_tris=None):
    mb = bpy.data.metaballs.new(name + "Meta")
    mb.resolution = voxel * 1.5
    mb.render_resolution = voxel * 1.5
    mb.threshold = 0.6
    meta = bpy.data.objects.new(name + "Meta", mb)
    bpy.context.collection.objects.link(meta)
    for v in volumes:
        if v.kind == "ellipsoid":
            e = mb.elements.new(type="ELLIPSOID")
            r = max(v.radii)
            e.radius = r / SURFACE_FACTOR
            e.size_x, e.size_y, e.size_z = v.radii.x / r, v.radii.y / r, v.radii.z / r
            e.co = v.center
            e.rotation = euler_matrix(v.rotation).to_quaternion()
        else:
            e = mb.elements.new(type="CAPSULE")
            ab = v.end - v.center
            e.radius = v.radii.x / SURFACE_FACTOR
            e.size_x = ab.length / 2
            e.co = (v.center + v.end) / 2
            e.rotation = Vector((1, 0, 0)).rotation_difference(ab.normalized()) if ab.length > 1e-6 else e.rotation
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = meta
    meta.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.active_object
    obj.name = name

    rm = obj.modifiers.new("Remesh", "REMESH")
    rm.mode = "VOXEL"
    rm.voxel_size = voxel
    bpy.ops.object.modifier_apply(modifier=rm.name)
    sm = obj.modifiers.new("Smooth", "SMOOTH")
    sm.factor = 0.6
    sm.iterations = smooth
    bpy.ops.object.modifier_apply(modifier=sm.name)
    if target_tris:
        obj.data.calc_loop_triangles()
        tris = len(obj.data.loop_triangles)
        if tris > target_tris:
            dm = obj.modifiers.new("Decimate", "DECIMATE")
            dm.ratio = target_tris / tris
            bpy.ops.object.modifier_apply(modifier=dm.name)
    bpy.ops.object.shade_smooth()
    return obj


def paint_zones(obj, volumes, zone_colors, noise=0.04, seed=1, blend=0.25):
    """Vertex colours from nearby volumes' zones (soft blend at seams) with gentle variation."""
    rng = random.Random(seed)
    lin = {k: Vector(srgb_to_linear(hex_rgb(v))) for k, v in zone_colors.items()}
    mesh = obj.data
    if "Col" not in mesh.color_attributes:
        mesh.color_attributes.new(name="Col", type="FLOAT_COLOR", domain="POINT")
    col = mesh.color_attributes["Col"]
    for v in mesh.vertices:
        p = obj.matrix_world @ v.co
        dists = sorted(((vol.distance(p), vol.zone) for vol in volumes), key=lambda d: d[0])
        best_d, best_zone = dists[0]
        colour = lin.get(best_zone, Vector((0.2, 0.2, 0.2))).copy()
        for d, zone in dists[1:4]:
            if zone != best_zone and d - best_d < blend:
                w = 0.5 * (1 - (d - best_d) / blend)
                colour = colour.lerp(lin.get(zone, colour), w)
        n = math.sin(p.x * 41.0 + seed) * math.sin(p.y * 37.0) * math.sin(p.z * 43.0) * noise
        n += (rng.random() - 0.5) * noise * 0.5
        col.data[v.index].color = (max(0, colour.x * (1 + n)), max(0, colour.y * (1 + n)), max(0, colour.z * (1 + n)), 1.0)


# ---------- Armature ----------


class Joint:
    """A bone from `head` to `tail` (metres), parented to another joint by name."""

    def __init__(self, name, head, tail, parent=None, deform=True):
        self.name = name
        self.head = Vector(head)
        self.tail = Vector(tail)
        self.parent = parent
        self.deform = deform


def build_armature(name, joints, mesh_obj):
    """Builds the armature and binds the mesh with automatic (heat) weights."""
    arm_data = bpy.data.armatures.new(name + "Rig")
    arm = bpy.data.objects.new(name + "Rig", arm_data)
    bpy.context.collection.objects.link(arm)
    bpy.ops.object.select_all(action="DESELECT")
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.mode_set(mode="EDIT")
    bones = {}
    for j in joints:
        b = arm_data.edit_bones.new(j.name)
        b.head = j.head
        b.tail = j.tail
        b.use_deform = j.deform
        bones[j.name] = b
    for j in joints:
        if j.parent:
            bones[j.name].parent = bones[j.parent]
            bones[j.name].use_connect = (bones[j.parent].tail - j.head).length < 1e-4
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    mesh_obj.select_set(True)
    arm.select_set(True)
    bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    return arm


def weights_from_volumes(mesh_obj, arm, volumes, bones, blend=0.3):
    """
    Skin weights from the source volumes instead of bone heat (which fails on these blended-volume
    meshes and left the students and Mira with no skin at all, so their arms never moved). Each vertex
    belongs to the volumes it is nearest to, softly blended across seams, and each volume to one bone
    (`bones[i]` for `volumes[i]`).
    """
    for g in list(mesh_obj.vertex_groups):
        mesh_obj.vertex_groups.remove(g)
    groups = {name: mesh_obj.vertex_groups.new(name=name) for name in set(bones)}
    for vert in mesh_obj.data.vertices:
        p = mesh_obj.matrix_world @ vert.co
        dists = [(vol.distance(p), bone) for vol, bone in zip(volumes, bones)]
        d0 = min(d for d, _ in dists)
        acc = {}
        for d, bone in dists:
            if d <= d0 + blend:
                acc[bone] = acc.get(bone, 0.0) + (d0 + blend - d) / blend
        total = sum(acc.values())
        for bone, w in acc.items():
            groups[bone].add([vert.index], w / total, "REPLACE")
    arm_mod = next((m for m in mesh_obj.modifiers if m.type == "ARMATURE"), None)
    if arm_mod is None:
        arm_mod = mesh_obj.modifiers.new("Armature", "ARMATURE")
    arm_mod.object = arm
    print(f"weights_from_volumes: {len(mesh_obj.data.vertices)} vertices over {len(groups)} bones")


def attach(obj, arm, bone_name):
    """Rigidly parent an accessory mesh to a bone (keeps its world transform)."""
    world = obj.matrix_world.copy()
    obj.parent = arm
    obj.parent_type = "BONE"
    obj.parent_bone = bone_name
    obj.matrix_world = world


# ---------- Accessories ----------


def sphere(name, pos, radius, material, scale=(1, 1, 1), segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(8, segments // 2), radius=radius, location=pos)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(material)
    return obj


def spike(name, base, tip, radius, material, segments=10, curve=0.0):
    """
    A smooth tapered spike from `base` to `tip` (fang, claw, horn, thorn). `curve` bends the tip
    sideways (fraction of the length, along the spike's local X) for hooked claws and fangs.
    """
    base_v, tip_v = Vector(base), Vector(tip)
    axis = tip_v - base_v
    length = axis.length
    bpy.ops.mesh.primitive_cone_add(vertices=segments, radius1=radius, radius2=0.0, depth=length, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    mesh = obj.data
    # Rest the cone on its base, add rings so the curve bends smoothly, then hook the tip.
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.subdivide_edges(bm, edges=[e for e in bm.edges if abs(e.verts[0].co.z - e.verts[1].co.z) > 1e-6], cuts=4)
    for v in bm.verts:
        v.co.z += length / 2
        u = v.co.z / length
        v.co.x += curve * length * u * u
    bm.to_mesh(mesh)
    bm.free()
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(axis.normalized())
    obj.location = base_v
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(material)
    return obj


def leaf(name, pos, length, width, material, rotation=(0, 0, 0), curl=0.25, thickness=0.004):
    """Curved, slightly thick leaf/membrane: subdivided plane bent along its length."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=8, use_grid_fill=True)
    for v in bm.verts:
        u = v.co.y + 0.5
        across = v.co.x * 2
        v.co.x = across * width * 0.5 * (math.sin(u * math.pi) ** 0.8 * 0.95 + 0.05)
        v.co.y = u * length
        v.co.z = (u * u) * curl * length + (across * across) * 0.12 * width
    bm.to_mesh(obj.data)
    bm.free()
    solid = obj.modifiers.new("Solid", "SOLIDIFY")
    solid.thickness = thickness
    bpy.ops.object.modifier_apply(modifier=solid.name)
    obj.location = pos
    obj.rotation_euler = tuple(math.radians(a) for a in rotation)
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(material)
    return obj


# ---------- Animation ----------


def pose_action(arm, name, keys, loop=True):
    """
    keys: list of (frame, {bone: (rx, ry, rz) degrees | {"rot":…, "loc":…, "scale":…}}).
    Bones not listed in any key stay at rest. Creates an action on its own NLA track for export.
    """
    arm.animation_data_create()
    action = bpy.data.actions.new(name)
    arm.animation_data.action = action
    bpy.context.scene.render.fps = 30
    used = set()
    for _, pose in keys:
        used.update(pose.keys())
    for b in arm.pose.bones:
        b.rotation_mode = "XYZ"
    for frame, pose in keys:
        for b in arm.pose.bones:
            if b.name not in used:
                continue
            spec = pose.get(b.name, (0, 0, 0))
            rot, loc, scale = (spec.get("rot", (0, 0, 0)), spec.get("loc"), spec.get("scale")) if isinstance(spec, dict) else (spec, None, None)
            b.rotation_euler = tuple(math.radians(a) for a in rot)
            b.location = loc if loc is not None else (0, 0, 0)
            b.scale = scale if scale is not None else (1, 1, 1)
            b.keyframe_insert("rotation_euler", frame=frame)
            b.keyframe_insert("location", frame=frame)
            b.keyframe_insert("scale", frame=frame)
    track = arm.animation_data.nla_tracks.new()
    track.name = name
    strip = track.strips.new(name, int(keys[0][0]), action)
    strip.name = name
    arm.animation_data.action = None
    for b in arm.pose.bones:
        b.rotation_euler = (0, 0, 0)
        b.location = (0, 0, 0)
        b.scale = (1, 1, 1)
    return action


def export_glb(path):
    kwargs = dict(filepath=path, export_format="GLB", export_apply=False, export_animations=True, export_skins=True, export_cameras=False, export_lights=False)
    for extra in ({"export_animation_mode": "NLA_TRACKS"}, {"export_nla_strips": True}, {}):
        try:
            bpy.ops.export_scene.gltf(**kwargs, **extra)
            return
        except TypeError:
            continue


def triangle_count():
    total = 0
    for o in bpy.context.scene.objects:
        if o.type == "MESH":
            o.data.calc_loop_triangles()
            total += len(o.data.loop_triangles)
    return total


# ---------- Previews (neutral turntables) ----------


def render_previews(path_prefix, target_height, views=((0, "front"), (90, "side"), (35, "three-quarter")), pose_frame=None):
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "BLENDER_WORKBENCH"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    world = scene.world or bpy.data.worlds.new("PreviewWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value = (0.3, 0.32, 0.36, 1)
        bg.inputs["Strength"].default_value = 0.8
    lights = []
    for energy, rot in ((3.2, (50, 0, 35)), (1.2, (60, 0, -140))):
        data = bpy.data.lights.new("L", "SUN")
        data.energy = energy
        o = bpy.data.objects.new("L", data)
        o.rotation_euler = tuple(math.radians(a) for a in rot)
        scene.collection.objects.link(o)
        lights.append(o)
    cam_data = bpy.data.cameras.new("PreviewCam")
    cam_data.lens = 55
    cam = bpy.data.objects.new("PreviewCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    dist = target_height * 3.0
    centre = Vector((0, 0, target_height * 0.5))
    for angle, label in views:
        a = math.radians(angle)
        cam.location = centre + Vector((math.sin(a) * dist, -math.cos(a) * dist, target_height * 0.15))
        cam.rotation_euler = (centre - cam.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = f"{path_prefix}_{label}.png"
        bpy.ops.render.render(write_still=True)
    for o in lights + [cam]:
        bpy.data.objects.remove(o, do_unlink=True)


def render_close(path, centre, distance, angle=0):
    """Close-up render (faces) using the same neutral setup as the turntables."""
    import math as _m

    scene = bpy.context.scene
    lights = []
    for energy, rot in ((3.2, (50, 0, 35)), (1.2, (60, 0, -140))):
        data = bpy.data.lights.new("L", "SUN")
        data.energy = energy
        o = bpy.data.objects.new("L", data)
        o.rotation_euler = tuple(_m.radians(a) for a in rot)
        scene.collection.objects.link(o)
        lights.append(o)
    cam_data = bpy.data.cameras.new("CloseCam")
    cam_data.lens = 70
    cam = bpy.data.objects.new("CloseCam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    c = Vector(centre)
    a = _m.radians(angle)
    cam.location = c + Vector((_m.sin(a) * distance, -_m.cos(a) * distance, 0.02))
    cam.rotation_euler = (c - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    for o in lights + [cam]:
        bpy.data.objects.remove(o, do_unlink=True)


# ---------- Rigid, pivoted parts (bosses, armour) ----------


def smart_uv(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)
    bpy.ops.object.mode_set(mode="OBJECT")


def set_origin(obj, pivot):
    bpy.context.scene.cursor.location = pivot
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")


def part(name, volumes, pivot, material, voxel=0.012, smooth=3, target_tris=8000):
    """A smooth rigid part from volumes, with its origin at `pivot`, UVs and one material."""
    obj = build_volume_mesh(name, volumes, voxel=voxel, smooth=smooth, target_tris=target_tris)
    set_origin(obj, pivot)
    smart_uv(obj)
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj


def parent_keep(child, parent):
    # Matrices of freshly created/moved objects are stale until the view layer updates.
    bpy.context.view_layer.update()
    world = child.matrix_world.copy()
    child.parent = parent
    child.matrix_world = world


def torus(name, location, major, minor, material, rotation=(0, 0, 0), segments=(48, 12)):
    bpy.ops.mesh.primitive_torus_add(location=location, major_radius=major, minor_radius=minor, major_segments=segments[0], minor_segments=segments[1])
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_euler = tuple(math.radians(a) for a in rotation)
    bpy.ops.object.shade_smooth()
    obj.data.materials.append(material)
    return obj


def export_static(path):
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True, export_animations=False, export_cameras=False, export_lights=False)
