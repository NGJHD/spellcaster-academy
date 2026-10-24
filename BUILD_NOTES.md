# Build Notes — Spellcaster Academy: The Broken Ward

How the game is built and run, and the technical lessons a future session needs. `CLAUDE.md` holds the game-wide rules; the level documents describe each level.

## Environment

- Windows 11, Node 24.19, npm 11.17. npm is the package manager.
- Blender 5.2 at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (not on PATH; call it by full path).
- Playwright drives the installed **Microsoft Edge** (`channel: 'msedge'`; the Playwright Chromium download times out on this network). WebGL runs on the GPU via `--use-angle=d3d11`.
- GPUs: an RTX 5060 Ti (16 GB, cuda device 0) and an RTX 3080 (10 GB, cuda device 1; `CUDA_DEVICE_ORDER=PCI_BUS_ID`). Before using either, check `nvidia-smi`: another session or the owner's `llama-server` may be holding it (keep to GPUs under 1.5 GB in use). With llama-server on both cards, Flux slowed from about 20 s to over 9 minutes per step.
- The owner's ComfyUI installs: Flux 2 Klein at `C:\AI\ComfyUI`, TRELLIS.2 at `C:\ai\ComfyUI-3D`.

## Stack

| Package | Version | Note |
| --- | --- | --- |
| react / react-dom | 19.3 | R3F 9 requires `<19.4` |
| three | 0.186 | `PCFSoftShadowMap` is gone in r186: use `PCFShadowMap` |
| @react-three/fiber / drei | 9.8 / 10.7 | |
| zustand | 5.0 | coarse state only |
| howler | 2.2 | sound effects; music runs on its own AudioContext |
| vite / vitest | 8.3 / 5.0 | vendor and three.js split into cached chunks |
| typescript | ~6.0.3 | typescript-eslint supports `<6.1` only |
| eslint 10, typescript-eslint 8, react-hooks 7 | | `react-hooks/immutability` is off for the R3F scene folders (imperative three.js updates in `useFrame`) |
| @playwright/test | 1.63 | |

## How to run

```bash
npm run dev            # http://localhost:5173
npm run test           # unit, content, headless playthroughs, asset validation (250 tests)
npm run test:e2e       # Playwright in Edge: 11 browser flows, including a full Level 1 run
npm run typecheck && npm run lint && npm run build
npm run audio          # regenerate the synthesised sound effects into public/audio/sfx
node scripts/fetch-cc0.mjs                         # re-download CC0 sources (raw models are git-ignored)
blender --background --python assets-src/scripts/repack_cc0.py [-- ids…]
blender --background --python assets-src/scripts/creatures/<name>.py -- [--preview]
blender --background --python assets-src/scripts/characters/humanoid.py -- <mira|orin|student_a|student_b> [--preview]
blender --background --python assets-src/scripts/props/kit_props.py -- [ids…]
blender --background --python assets-src/scripts/props/kit_scene.py -- [ids…] [--preview]   # scenery kit (towers, columns, braziers, rocks…)
python assets-src/scripts/ai/fx_sprites.py [names…] / mosaic.py [seeds…]                  # Flux 3 effect sprites, the clue mosaic
python assets-src/scripts/ai/ground_textures.py [name] [seeds…]                         # Flux 3 tiling ground textures (green_meadow: the grass; wild_meadow: Level 2's far bank; burned_ground_soft: the Blank's ground, softened so it does not shimmer)
python assets-src/scripts/ai/tree_cards.py [names…]                                     # Flux 3 tree impostors (beech, lime) for far forest rows
node scripts/build-manifests.mjs                   # refresh public/assets/manifests/*.json
node scripts/perf.mjs / scripts/breakdown.mjs      # frame rate and triangles per object
powershell -ExecutionPolicy Bypass -File scripts/release/package.ps1   # the release zip (RELEASE_GUIDE.md)
```

Development URL options (dev builds, or any build with `?test`):

- `/dev/assets`: the asset viewer.
- `?beat=<beat-id>`: START begins a new run at that beat. `?speed=<n>`: time scale (up to 20). `?rails`: show the camera rails. `?nowand`: hide the first-person arm.
- `?test` exposes `window.__spellcaster` for Playwright: `beat()`, `labels()`, `subtitle()`, `choice()`, `music()`, `area()`, `focus()`, `targets()`, `render()`, `scene()`, `camera()`, `breakdown()`.
- Tests and scratch specs named `e2e/zz_*.spec.ts` are git-excluded dev tools (screenshots at beats, camera probes, frame-rate probes).

## Architecture

- **Levels** (`src/level/levels.ts`): each level is a route of beats assembled from area scripts (`src/level/areas`, `areas2`, `areas3`), its encounters and its bosses. `forYoungTypists` and `trimChase` (`youngTypists.ts`) trim every level when it is assembled. `BEAT_ALIASES` maps removed beat ids to their replacements for old saves.
- **Area scripts** use the builders in `src/level/areas/builders.ts` (`travel`, `reveal`, `hold`, `fade`, `fight`, `talk`, `checkpoint`, `target`, `marker`, `powerWave`). Each area has its own origin; camera nodes and look points are named. `validateRoute` proves the camera never jumps.
- **LevelDirector** advances camera beats on time and waits for gated beats; nothing else advances the story. Frame delta is clamped to 0.1 s. `PACE` in `rail/railMath.ts` scales travel, pans, holds and fades.
- **EncounterRunner**: waves (parallel or one at a time), wave rules (`qualify`: extra targets until enough words meet an accuracy bar), arena hazards with wind-ups and `hazardBuild`, optional targets, speed rounds, beam struggles, conditional rewards. Each wave is a resume point.
- **Enemy brains** (`EnemyBrain.ts`): data-driven state machines with authored movement. `closeInEncounter` (`encounters/closeIn.ts`) ends every walking melee path 2.6 m from the camera. Off-screen movers rush in (`GameRun.updateRush`).
- **Typing** (`src/typing`): the framework-free engine (initial-letter targeting, Tab, counter-word interrupts that take and hand back the lock), the metrics recorder built on accepted-input segments, and the deterministic word assigner (unique initials, no repeats, seeded per encounter, wave and attempt).
- **GameRun** (`src/game/GameRun.ts`): one playthrough: beats, encounters, chase words, typing, HP and resets, spells, rewards, lines and their queue, autosave and results. Plain TypeScript, fully playable headless (`playthrough.test.ts`).
  - `bossThreat()` reports an arena attack winding up, seconds since the boss struck, and its build-up (0–1). `pipAt` is Pip's world position each frame; `aroundPip` places a target beside Pip.
  - Lines: barks queue with their beat; a camera move waits at its end for its own lines, a fight waits up to 12 s for earlier story lines, and stale instructions are dropped once their fight ends.
- **Saves** (`saveData.ts`): versioned, written to a temporary key, validated and promoted, the previous valid save kept. Only committed metrics are saved. Unknown cosmetics are dropped on load.
- **Rendering:** `RunDriver` advances the run, places the camera (with framing that turns towards edge words), drives the fade and projects the HTML word labels (clamped above the subtitle band; a fireball's label lifts at most 0.12 m per metre of distance). `World` mounts the current area, keeps the previous one briefly and mounts the next one hidden ahead of time; the hidden area's shaders and textures are readied in the background as its models stream in (`warmUp.ts`), and the creatures of every fight up to the end of the next area are loaded and readied before they spawn (`CreatureWarmup.tsx`). `Atmosphere` holds per-area HDRI lighting, one camera-following shadow sun, sky and fog (`areaLooks.ts`).
- **Audio:** Howler plays the synthesised sound effects with per-category volumes. `MusicEngine` maps each mood to a recorded track (`TRACKS`), crossfading and resuming where it stopped; a procedural mood plays until the track has loaded. Music ducks to 35% under lines (12% under the soft voices). `voice.ts` casts a distinct English voice per character with its own pitch, rate and gain.

## Scene techniques

- **Kit and materials:** static architecture batches through `MergeStatic`. Shared materials (`materials.ts`) are dressed with CC0 PBR textures; geometry helpers make metre-based UVs (`surfaces.ts`). Kit GLBs built by `kit_props.py` and `kit_scene.py` name their materials after the runtime `MAT` keys; `KitModel overrides` swaps one per use (the Blank's braziers in iron plate, the Quill shard's red glow).
- **Creatures:** `CreatureModel` clones the skinned GLB per target with its own mixer; the Attack clip's wind-up (frames 0–14 of 30) is scrubbed by the gameplay wind-up. When a Suspense boundary re-shows a model, its clip tracker must reset to Idle (`CreatureModel` and `CharacterModel` do), or it freezes.
- **Boss scenery** (`SceneCreature` in `src/scene/areas2/common.tsx`): `threat` (winds up and strikes with the arena attack), `clip` (plays a model's own extra clip, overriding attacks), `effects` (drawn in the creature's space, following bones through `rigPoint`, the skinning transform of a bind-pose point), `flying`, `rearing`, `wander`. Boss effects are in `src/scene/bossFx.tsx`: `HeraldWisps`, `DragonFireCharge`, `GuardianOrbs`, `UnwriterQuill`.
- **Rides:** `Carried` puts a group (raft, boat, ship, lift) under the camera during its beats, turned by the camera's own matrix so its bow stays ahead; `hold` beats keep it still while the camera moves about on it.
- **Grass and forests:** open ground uses the Flux-painted meadow textures; where the camera is close, `GrassField` instances the Blender grass tuft (`kit_scene.py grass_tuft`), thinning with distance. `Woodland` fills far forest rows with impostors (crossed cards of a whole tree, normals pointing up so every card is lit alike); full tree models stay in the near rows.
- **Spectacle effects** (`FxLayer.tsx`): particles are drawn with Flux 3 sprites (`assets-src/scripts/ai/fx_sprites.py`: dust, smoke, fireball, magic motes, sparks, ink splashes and droplets, painted on black and cut out to `public/assets/textures/fx/sprites/`, loaded through `fxSprite`), and debris with modelled pieces (`assets-src/scripts/props/fx_debris.py` → `public/assets/props/fx_debris.glb`: stone, slate, wood, earth, glass, books, pages, armour, leaves), one instanced mesh per piece. Leaves and pages flutter down; scattering birds are the modelled dove, its wings flapped at the shoulders. The same sprites draw the smoke billowing over every fire (`Fire.tsx`), the sky's embers and ash, the crack in the sky (`SkyTear`), lightning and Pip's ring of burning script; the fireballs and the bosses' fire orbs are a ball of flame drawn in code (`glow.tsx` `fireballTexture`). A cue names its pieces (`pieces`). Impacts are a `dustwave` (landings, slams), an `explosion` (fireball, flung pieces that land at `landY`, smoke) or a magic `pulse`; there are no flat rings of light.
- **Fire:** `Fire.tsx` is a per-pixel noise flipbook on camera-facing sprites. `FireRope.tsx` draws a Flux-painted burning rope (`public/assets/textures/fx/fire_rope.png`, seamless, black made transparent) as a camera-facing ribbon along a ring or line. Additive blending vanishes against white or bright models; use normal blending there.
- **Light:** three.js builds the number of lights into every shader, so a light appearing or vanishing (an area shown or unmounted, a loader hiding its Suspense boundary) recompiles every material in view; under ANGLE that froze area changes for 2–6 s. Scenes place `PoolLight` markers, never `<pointLight>`: a fixed pool of nine real point lights (the most any area shows at once) (`LightPool.tsx`) shines for the markers that matter most to the camera. The sun and both hemisphere lights always exist (dark when unused), and every HDRI is preloaded so the environment map never drops out.
- **Loading screen:** the first run of a page session starts in the `loading` game mode: the run stands still at its first camera pose while `LoadTracker` waits for the files (drei `useProgress`) and the scene's shaders, then `LoadingScreen` fades and the level begins. Its art is `public/assets/ui/loading.webp` (`assets-src/scripts/ai/loading_art.py`, Flux 3 Klein seed 204).
- **Fire flipbooks are baked:** `fireSheets.ts` holds the flame maths; `npm run gen:fire` renders them to `public/assets/textures/fx/flames_*.png`, loaded like any texture (painting them in the browser cost about 2 s).
- **No refracting glass:** a material with `transmission` makes three.js re-render the scene every frame with a second variant of every shader. `repack_cc0.py` turns Poly Haven transmission glass into plain alpha glass, and code-built materials use opacity only.
- **Erased things:** `Restorable erased` cuts a model with a slanted clip plane and a pencil ghost (`gl.localClippingEnabled`).
- **Passages** (`src/scene/areas3/passages.tsx`): `StoneDoorway` (a wall with an arched opening that reads from both sides), `BookHall`, statue landings. Use these where two separately loaded areas meet, so the way on is visible from both.

## AI asset pipeline

Models come from the owner's local ComfyUI installs, scripted and reproducible in `assets-src/scripts/ai`:

1. **Concept:** `comfy.py concept` runs Flux 2 Klein (port 8188). Prompts and seeds are in `concepts_level1.py`, `concepts_level23.py` and `concepts_env23.py`; images and prompts are kept in `assets-src/concepts/`.
2. **Shape:** `comfy.py mesh` runs TRELLIS.2 image-to-3D (port 8189). With the 1024 cascade on the 5060 Ti; `--no-cascade` decodes at 512 to fit the 3080.
3. **Clean:** `prep_raw.py` (Blender) remeshes the raw surface into a watertight mesh, drops cavity walls by signed volume, relaxes and decimates (300k by default, 400k for full quality).
4. **Colour:** `comfy.py texture` runs TRELLIS.2 texturing with per-vertex colour (port 8190).
5. **Build:** `build_ai_creature.py` (Blender) scales and faces the model, decimates to its budget, unwraps with xatlas, bakes the vertex colour (sRGB-corrected) into a texture, optionally bakes a normal map from the detailed mesh, rigs it, authors its clips and exports the GLB. `pipeline.py <names>` runs steps 3–5.

Scripts: `build_hq.sh <names>` runs steps 2–5 at full quality on the 5060 Ti (about 10 minutes a model); `build_on_3080.sh <names>` runs steps 1–5 on the 3080 alone (512 shape, coarser), skipping a model whose concept failed. `CONCEPTS=concepts_level23.py` selects the creature prompts. Run a 15-minute watchdog during long builds. Raw meshes live in the git-ignored `assets-src/ai-meshes/`.

### `build_ai_creature.py` configuration

Each model is a `CFG` entry:

- **Basics:** `height` (metres) or `fit="width"` with `width`, `tris`, `tex`, `folder`, `metallic`, `roughness`, `defeat` (vanish, slump, bow, wilt).
- **Rig:** `rig` is `biped` (height bands: pelvis, spine, chest, head), `rigid` (one bone; `sway` scales its roll), `floater`, `plant`, `dragon` (plus a bone per wing) or `none` (static props).
- **Limbs:** `limbs` adds bones for limbs that stand clear of the body: `bone`, `side`, `x` (the line beyond which vertices belong to it, as a fraction of width), `z` (height band), `head`/`tail` (as fractions of width and height, with an optional third value in metres along −Y for limbs held in front), `ramp`, `parent` (chains: a wrist under an arm). List children first; a child takes its share and its parent the rest. A limb bone connects only if it starts at its parent's tail.
- **Clips:** `moves` names a boss's own clips (`herald`, `guardian`, `foreman`, `unwriter`). `aim_bone(bone, direction, roll, parent, along)` aims a bone in armature space, twisted by `roll`, through a posed parent, or along a held prop instead of the bone (`along`). Attack clips are 30 frames with the wind-up peak at frame 14.
- **Look:** `yaw` turns the source mesh (applied through the matrix: glTF imports use quaternions, so `rotation_euler` is ignored); `saturation`/`value` grade the baked colour; `smooth_colours`; `smooth_shape` relaxes faceted shapes (above about 4 it makes spikes); `normal_map=True` bakes the detailed surface.
- **Environment switches:** `TRIS=<n>` overrides the budget for one build; `MEASURE=1` prints where the body is, slice by slice, for placing limbs; `--preview` renders front, side and three-quarter views, the Attack wind-up and strike, three Idle frames for bosses, the `Point` clip and the dragon's wingbeat into `assets-src/previews/`.

### Lessons

- **The concept decides the model.** Ask for a single subject with a solid, unbroken silhouette, nothing loose (drips, smoke, floating flames), and limbs held clear of the body in the pose the game needs. Bending generated limbs far from their pose breaks them at the joints; regenerate in the wanted pose instead. Faces and masks need a head behind them.
- **Remesh mode** (`prep_raw.py`): octree for armour and thin or smoky shapes (it keeps plates, petals and drips); voxel for smooth blobs (`VOXEL` set: sprite, mossling, ink wisp, blotling). The voxel shell can shatter a thin robe into thousands of pieces that the cleanup throws away.
- **Quality:** full quality (1024 cascade, denser prep, normal map) gives clearly cleaner shapes and seams than the 3080's 512 path. Denser game meshes do not: a 200k-triangle Unwriter looked the same as the 60k one in play and ran at the same speed. xatlas unwraps slowly on very dense meshes (a 400k build did not finish in an hour).
- TRELLIS colour can come out over-saturated (the Guardian came out 75% red); grade it with `saturation`/`value`.
- The owner's ComfyUI-3D install: flash_attn is missing (use the xformers backends); the CuMesh remesh and UV-atlas nodes corrupt meshes on both GPUs, so stage 1 exports the raw shape and Blender cleans it; ComfyUI caches LoadMesh by path, so `texture()` copies to a fresh file name.
- Texturing memory on the 3080 scales with surface area, not triangles: texture big subjects on the 5060 Ti (`texture(name, base=TRELLIS)`).
- The shape server stops answering HTTP during its CPU simplify step (15–20 minutes); that is not a crash.
- Never chain jobs with a "wait until no process matches X" loop: the waiter's own command line matches X. Wait on a log line or output file instead.
- AI props are made for mid-distance; frame them from about 10 m.
- Models built on the 3080 at 512 (accepted as they are): the page dragon, the Grey Herald, the citadel gate, the vine tangle, the lift cage and the oars.

## Other assets

- **Hand-scripted Blender assets** (`assets-src/scripts/`): the Level 1 creatures, the humanoids (`humanoid.py`: Mira, Orin, two students; skin weights from the volumes they are built from, separate sleeve and hand parts hinged on the arm bones, and a `Run` clip), hero props (`props/hero_props.py`: forearm and wand, Pip, dummy, runaway book, thorn pod, ward anchor, Grimoire), the kit (`kit_props.py`: books, bookcases, windows, doors, glowing pages, clasps, plates, crystals), the fire sky and molten ink (`sky/`).
- **CC0:** Poly Haven textures, HDRIs and models, repacked to budget by `repack_cc0.py` (trees decimated, WebP textures, LOD1 for trees and shrubs). Sources in `assets-src/cc0/sources.json`.
- **Paintings** in the Hall of Portraits: still lifes and bust studies rendered from CC0 props (`paintings.py`) and two academy views captured from the game (`capture-landscapes.mjs`), finished by `paint_portraits.py`.
- **Music:** twelve CC0 recordings from OpenGameArt in `public/audio/music/` (Ogg Vorbis, about 18 MB), loudness-matched to about −13 LUFS; licences and composers in `public/audio/music/CREDITS.md`.
- **Sound effects:** synthesised by `scripts/generate-audio.mjs` (about 2 MB), including a church-bell toll for the Bell Bridge (no CC0 toll was found).

## Known limitations

- Still code-built (labelled placeholders with the same gameplay hooks): the pollen puffs and the Ward Warden's rune rings.
- Character faces are stylised volume sculpts: fine at dialogue distance, not close-ups. Creatures have a single LOD (within budget).
- No person has yet done the manual checks in a real browser: slow Gentle play, Standard with deliberate mistakes, switching tabs and focus mid-fight, resizing, refreshing at every checkpoint. Automated equivalents cover most flows.
- Text-to-speech quality depends on the voices installed in the browser and system.
