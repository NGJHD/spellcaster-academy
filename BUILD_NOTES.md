# Build Notes — Spellcaster Academy: The Broken Ward

Running log of decisions, environment facts, architecture and milestone status. `CLAUDE.md` is the spec; this file records how it was built and what is verified.

## Environment

- Windows 11, Node 24.19, npm 11.17 (package manager: **npm**; do not switch).
- Blender 5.2 at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (not on PATH — call by full path).
- Playwright drives the locally installed **Microsoft Edge** (`channel: 'msedge'`) — the Chromium download from cdn.playwright.dev timed out on this network. WebGL runs on the GPU via `--use-angle=d3d11`.
- The Claude-in-Chrome automation window reports `visibilityState: hidden` (rAF never runs), so visual checks use `scripts/screens.mjs` (Playwright + Edge) instead.

## Stack

| Package | Version | Note |
| --- | --- | --- |
| react / react-dom | 19.3 | R3F 9 requires `<19.4` |
| three | 0.186 | `PCFSoftShadowMap` is removed in r186 — use `PCFShadowMap` |
| @react-three/fiber / drei | 9.8 / 10.7 | |
| zustand | 5.0 | coarse state only |
| howler | 2.2 | SFX; music is a Web Audio engine on Howler's context |
| @fontsource/opendyslexic | 5.3 | OFL-licensed dyslexia-friendly font |
| vite / vitest | 8.3 / 5.0 | vendor and three.js split into cached chunks |
| typescript | ~6.0.3 | typescript-eslint supports `<6.1` only |
| eslint 10 + typescript-eslint 8 + react-hooks 7 | | `react-hooks/immutability` is off for R3F scene folders only (imperative three.js updates in `useFrame` are mandated by §4.4) |
| @playwright/test | 1.63 | |

`@react-three/rapier` is intentionally **not** installed: nothing in an on-rails level needs physics (engineering principle 9). Add it only if a later feature truly needs collision.

## Decisions from the owner

- 2026-09-29: build milestone by milestone; sound effects self-made; no voice acting (subtitles only); **British spelling** everywhere including typed words; git initialised.
- 2026-10-01: "continue through all the milestones without stopping"; **CC0 assets approved** (Poly Haven textures, HDRIs and models are used; sources recorded in `assets-src/cc0/sources.json`).
- Owner feedback on Milestone 1 placeholders: "Looks quite cartoonish. Can it be more realistic" → realism pass in Milestone 8 (see Visual direction).
- 2026-10-02 playtest feedback (20 points), all implemented:
  - **Platforms:** low-end laptops and Firefox are no longer targets (Edge/Chrome on a capable GPU).
  - **Voice:** text to speech is now wanted. Lines are spoken with the browser's Web Speech API (`src/audio/voice.ts`, en-GB voices, per-speaker pitch/rate), with a Settings toggle and a Voices volume.
  - **Dialogue:** no "press Enter". Lines advance by themselves when spoken or read; typing a letter skips the line. A conversation lets the camera carry on: early when followed by travel, at its last line when followed by a fight. The rest of the lines continue as subtitles.
  - **Pace** (the owner nearly fell asleep):
    - Old "fast" travel is the new "normal", and "fast" is 2.4×.
    - Pans run at 0.45× and holds at 0.5× of their authored length, both divided by travel speed, so looking around is about 3× quicker than before.
    - Travel runs at 0.8×, fades at 0.55×, and encounter intro/resolve/gaps are roughly halved; the HP reset is 1.8 s.
    - `PACE` in `railMath.ts` holds the global factors.
    - The bot playthrough is now about 7 minutes (the test floor was lowered from 8 to 5).
  - **Bug "gle" for "glint":** a bonus window closed under the player mid-word. The camera now waits while the player is locked on a bonus target, and optional targets never leave while locked.
  - **Bug "damage after a kill":** arena hazards and creature attacks kept running while the next word was still arriving. Now:
    - Every completed word restarts the attack and hazard clocks.
    - A defeat cancels a hazard wind-up.
    - Hazards pause when nothing is typeable.
    - Creatures cannot attack during their next-word delay.
    - Labels show "Attacking!" during a wind-up.
  - **Word labels:** new words fly in large and settle. The locked word has a TARGET tag; other words show "Tab ⇥ to switch". Tab now also works mid-word, dropping the partial word.
  - **Grimoire sentence:** the final sentence shows as one sentence (`phrase: true` spawns).
  - **HUD:**
    - "Focus" is now "HP", with a number and a tooltip.
    - The streak and star-page chips have visible labels and tooltips.
    - A level progress bar sits at the top centre.
    - the speaker name for Pip reads "Guide Orb", and Pip introduces themself in the opening.
  - **Pause menu:** Resume sits at the bottom, with Return to Title beside it in red.
  - **Music:**
    - The procedural score is louder and richer: lead melody per mood, synthetic hall reverb, driving bass and snare in battle moods.
    - Battle music starts whenever an encounter can lower HP.
    - It returns to the area's story mood 3 s after the fight.

- 2026-10-02 second playtest:
  - **Gentle HP:** HP is unlimited on Gentle and the HP bar is hidden. A hit still shows a soft glow.
  - **Progress bar:** labelled "Level Progress", with a chapter mark where each area begins and the current chapter name below.
  - **Bonus words:** each bonus word now stays typeable for at least 3 s ("glint" was skipped after the pace-up). The camera finishes its move and waits at the end pose; it also waits while the player is mid-word.
  - **Fly-in:** new words appear 5× size in the centre of the screen, hold briefly, then glide to their target (1.1 s, ease-in-out) and land with a golden shockwave. The label projector sets `--fly-dx/--fly-dy` on first placement.
  - **Settings removed** by owner decision, overriding §8 and §15: reduced motion, reduced shake, reduced particle effects, high-contrast panels and the dyslexia font. The OpenDyslexic package was removed too. Rail data keeps its `reducedMotion` fields, but the setting is always off.
  - **Music:**
    - The score was silent in game. It shared Howler's AudioContext, which Howler suspends or replaces, leaving the engine waiting on a dead context.
    - The music now runs on its own AudioContext, continuously underneath all sound effects. It is about 1.8× louder, with a compressor to prevent clipping.
    - The music ducks to 35% while any subtitle is on screen: 80 ms to soften, about 1 s to swell back. Measured average level was 0.019 while talking versus 0.052 between lines.
    - `window.__spellcaster.music()` (with `?test`) reports the context state, the mood and the output level.

- 2026-10-04: **specification split.** `CLAUDE.md` now holds only the game-wide rules, including a new §5 covering the campaign, the overall story and the owner decisions that override the spec.
  - Level 1 content moved to `LEVEL1_DESIGN.md`, with section numbers kept so code comments stay valid.
  - New `LEVEL2_DESIGN.md` (The Siege of Asterfall) and `LEVEL3_DESIGN.md` (Into the Unwritten; the finale against the Unwriter).

- 2026-10-04: **tone and excitement.**
  - Levels 2 and 3 now use fire and a red palette: inkfire siege in Level 2; scorched Blank and the Cinder Citadel stronghold in Level 3.
  - Boss defeats are decisive; the Unwriter is sealed in his own book.
  - Audience is now 8+, with dramatic peril allowed and horror and gore still ruled out.
  - New game-wide attention rules in `CLAUDE.md` §1B: the 7-second rule (measured at Fast), juicy feedback, boss name cards, fast-rail set pieces, spark gems, speed rounds and medals.
  - `LEVEL1_DESIGN.md` LD-0 rewrites Level 1's slow parts. This is a design change only; it isn't built yet.

## Spec conflict resolutions

The LD/MD/GD sections of `CLAUDE.md` take precedence over earlier sections:

- Runtime target 20–30 min (superseded by the owner's 2026-10-02 request for a much faster pace); START/RESUME title; LD-19 completion buttons; extended LD checkpoint list.
- FP arm clips `FP_Walk/Run/Jump/Land` dropped (on rails). Fallen banner pole is decorative.
- Grimoire "dodging" = telegraphed Focus hits (gusts) — the player never moves.
- Arrival Gate uses LD-8's three words; Tab/Escape are taught by short barks.
- The §1A `library`/`garden` route choice is **not** in the authoritative LD flow (LD-4), so it is not implemented; the pre-boss menu (LD-16) is the only choice beat.
- Difficulty can be changed from the pause menu at any time **outside** an active encounter (and at the pre-boss choice); it applies from the next encounter. Assist mode is a separate toggle and is auto-enabled after repeated failures (Warden: 2 Focus resets; Gallery P3: 3 broken streaks).
- Positive rank titles from §7.11 are shown alongside the LD-19 metrics.
- Practice Gallery dummies and gallery Mira are in the gallery; ending staging was moved clear of the fountain.

## How to run

```bash
npm run dev            # http://localhost:5173
npm run test           # unit + content + headless full playthroughs + asset validation (97 tests)
npm run test:e2e       # Playwright (Edge): 8 browser flows incl. a full Level 1 run
npm run typecheck && npm run lint && npm run build
npm run audio          # regenerate synthesised SFX into public/audio/sfx
node scripts/fetch-cc0.mjs                     # re-download CC0 sources (raw models are git-ignored)
blender --background --python assets-src/scripts/repack_cc0.py [-- ids…]
blender --background --python assets-src/scripts/creatures/<name>.py -- [--preview]
blender --background --python assets-src/scripts/characters/humanoid.py -- <mira|orin|student_a|student_b> [--preview]
node scripts/build-manifests.mjs               # refresh public/assets/manifests/{creatures,characters}.json
node scripts/screens.mjs http://localhost:5199/ "<beat>@<ms>" …   # screenshots of beats
```

Development/test URL options (dev builds, or any build with `?test`):

- `/dev/assets` — asset viewer: orbit, animation switching, wireframe, game/neutral lighting, LOD1 toggle, collider/anchor/bounds, triangle and material counts.
- `?beat=<beat-id>` — START begins a new run at that beat. `?speed=<n>` — time scale (≤20). `?rails` — show camera rails. `?test` exposes a read-only `window.__spellcaster` hook for Playwright.

## Architecture

- **Level data** (`src/level/areas/*.ts`, assembled in `level1Route.ts`): every area is a shot list of beats — camera beats (`rail-travel`, `camera-reveal`, `loading-transition`) and gated beats (`dialogue`, `encounter`, `checkpoint`, `choice`, `results`). Camera nodes and look points are **named** (GD-2). `validateRoute` proves the camera never jumps; `level1Content.test.ts` checks every line, encounter, star page and cosmetic resolves.
- **LevelDirector** advances camera beats on time and waits for gated beats; nothing else can advance the story. Frame delta is clamped to 0.1 s.
- **Encounters** (`EncounterRunner`): waves (parallel or sequential), wave rules (`clear`, `qualify` for Gallery P1, `streak` for P3), boss hazards with wind-ups, optional/bonus targets, conditional rewards. Each wave is a resume point.
- **Enemy brains** (`EnemyBrain.ts`): data-driven FSM (appear → active ⇄ wind-up/hit/recover → stunned → dispelling → gone) with authored movement (approach/patrol/orbit/static). Targeted enemies slow to 35 %; enemy time slows while mid-word per difficulty.
- **Typing** (`src/typing`): framework-free engine (initial-letter targeting, duplicate initials need a 2nd letter then fall back to the most central target, Tab cycling, buffered mistakes with Backspace, Gentle reject mode); metrics recorder built on accepted-input **segments** (5 s idle gap, pause/hidden suspend) with the LD-19 formulas; deterministic word assigner (unique initials, no repeats, seeded per encounter/wave/attempt).
- **GameRun** (`src/game/GameRun.ts`): one playthrough — beats, encounters, typing, Focus/resets, rewards, barks/dialogue, choice, autosave, results. Plain TS; fully playable headless (see `playthrough.test.ts`).
- **Saves** (`saveData.ts`): versioned autosave written to a temp key, validated, promoted; previous valid save kept as backup. Resume = beat + wave; only *committed* typing metrics are saved (committed at wave/encounter/checkpoint completion) so reloads never double count. Starting a new run while a save exists defers saving until the new run's first checkpoint (LD-5). Profile stores best results and cosmetics separately.
- **Rendering**: `RunDriver` advances the run, places the camera (with gentle locked-target framing and optional shake), drives the fade overlay and projects HTML word labels (clamped above the subtitle band, with off-screen arrows). `World` mounts only the current area plus the previous one briefly (area streaming). `Atmosphere` = per-area HDRI lighting, one camera-following shadow sun, sky/stars, fog.
- **Audio**: 19 synthesised SFX (`scripts/generate-audio.mjs`, ~1 MB) via Howler with per-category volumes; procedural music moods per GD-20 state with cross-fades. Game is fully playable muted.

## Visual direction and asset pipeline (Milestone 8)

- **Surfaces**: Poly Haven CC0 PBR sets (colour, normal, packed AO/roughness/metal) applied to the shared material library; geometry helpers generate **metre-based UVs** so textures keep real-world scale on any size (`src/scene/surfaces.ts`).
- **Lighting**: CC0 HDRIs for image-based lighting per area (day, interior, greenhouse, night, sunrise).
- **Architecture**: façade kit (plinth, pilasters, cornice, framed arched windows, crenellations) and gable roofs; dark glass outside, lit glass inside.
- **CC0 props** (41 Poly Haven models) repacked by Blender (`repack_cc0.py`): trees joined then decimated to budget (fir 7 M → 17 k tris), WebP textures, LOD1 for trees/shrubs used via drei `Detailed`. Raw downloads are git-ignored; repacked GLBs (~36 MB) are committed. The jacaranda tree was dropped (texture-heavy, 8 MB even at LOD1).
- **Original creatures & characters** (Blender scripts, `assets-src/scripts/`): organic forms are modelled as blended **volumes** (metaball ellipsoids/capsules → voxel remesh → smooth → decimate), coloured by zone, rigged with automatic weights, animated with eased keyframes, exported as GLB with named actions.
  - Mischief sprite (russet/grey/teal), Mossling, Ink wisp — rigged, Idle/Move/Attack/Hit/Dispel; Attack anticipation is scrubbed by the gameplay wind-up so telegraphs match timing exactly.
  - Mira, Keeper Orin, two students — carved eye sockets, seated eyes with iris/pupil, hair volumes, robe/satchel; Idle/Wave/TalkShort/Celebrate; characters gesture while their subtitle is showing.
  - Ward Warden (48 k tris) and armour guardian (31 k) — pivoted rigid parts driven by gameplay state (rise, attacks, plate release, repair, bow).
  - `assets-src/scripts/props/hero_props.py` (2026-10-02): first-person forearm + wand (moonstone `Tip` node feeds spell origin), Pip (engraved rings, hinged fins; core shifts warm gold → blue-white while Pip speaks), training dummy, runaway book (per-variant cover tint), thorn pod (petals close about their tangents while charging), ward anchor (per-node crystal glow, ring alignment), Great Grimoire (heavy hinged covers, flipped so open pages face the player). All are part-based GLBs loaded through `useParts` (`src/scene/partsGlb.ts`); stone/canvas parts take the shared CC0-textured materials; the code-built stand-ins remain as loading fallbacks.
- **Validation** (`scripts/validate-assets.test.mjs`): every GLB exists and parses, has normals and finite transforms, required animations present and non-empty, plausible scale, word anchor above the asset, §15 triangle budgets, no exported cameras/lights; every prop referenced in scene code exists. Manifests in §14.7 format are generated by `scripts/build-manifests.mjs`.
- Previews of every Blender asset are rendered to `assets-src/previews/` (front/side/three-quarter, faces close-up).

## Realism pass 2 (2026-10-02, owner: "improve the graphics for the smaller stuff, like books etc. Make the whole game a lot more realistic")

Kit pieces are built in Blender by `assets-src/scripts/props/kit_props.py`, which uses `shared/kitgeo.py`, `props/small_props.py` and `props/books.py`, and exported to `public/assets/kit/`. Their materials are named after the runtime `MAT` keys and every mesh has metre-scaled box UVs, so the game dresses them with the shared CC0 PBR materials. Loading goes through `src/scene/kitGlb.ts` (`useKit`, `useKitGlow`) and `KitModel` in `kit.tsx`. Static kit meshes batch through `MergeStatic`, which now keeps vertex colours and respects per-mesh shadow casting.

- **Books.** Twelve 0.5 m shelf rows: rounded spines, gilt bands and labels, leaning books and flat stacks.
  - Each binding colour is a vertex colour on a neutral `leather_white` grain, so a bookcase batches into about three draw calls.
  - Books cast no shadows. Rows on high shelves use same-layout low-detail twins.
  - New bookcases have a plinth, crown, pilasters, shelf lips and a panelled back.
- **Library.**
  - Leaded arched windows in moulded stone surrounds.
  - Turned-oak gallery balustrades replace the brass slabs, and a carved, fluted stone pedestal holds the Grimoire.
  - Circling books are real flapping books.
- **Grimoire and runaway book.** Rebuilt as real two-half book rigs: boards with attached page blocks, gutter curve, lines of handwriting, brass corners, rounded banded spine, clasps and silk ribbons.
  - The Grimoire lies closed on its pedestal, rises and turns its cover to the player, and swings its heavy front board open once the clasps break.
- **Targets.** Kit models for the curled flying pages, the gilt star pages with a wax seal, the brass clasps with a moonstone, the domed limestone Warden plates, and the quartz crystal clusters in brass claw cradles (gate crystals).
- **Armour guardian.** Rebuilt as real plate armour from turned elliptical shells; the rig names are unchanged.
- **Portrait Hall.**
  - Twelve oil paintings in moulded gilt frames. Ten are still lifes and bust studies rendered from photo-scanned CC0 props (`assets-src/scripts/paintings.py`); two are academy landscapes captured from the game (`scripts/capture-landscapes.mjs`, using the `?test&nowand` flag).
  - All are finished by `scripts/paint_portraits.py`: chiaroscuro grade, Kuwahara brushwork, canvas weave, varnish and vignette.
  - Oak wainscot, a carved two-tier fountain and velvet gallery benches.
  - Figure portraits of the game's own characters were tried and dropped: at portrait distance the faces read as uncanny.
- **Stairwell.** Dressed-stone inner wall (`insideCylinder`), metre-UV treads with nosings, a continuous brass handrail and leaded lancet windows.
- **Greenhouse.**
  - Victorian glasshouse kit: green iron ribs, glazing bars and purlins, stone dwarf walls, and glazed gables with doors.
  - Clear glass looking out on lawn, hedges and trees.
  - Coped beds, only photo-scanned plants (calathea, anthurium and money tree added), and a potting bench with tools.
  - Sky fix: the sky box now follows the camera; areas far from the origin were looking past its edge.
- **Observatory.** Planked oak dome with iron ribs and an open shutter slit, a stone drum wall with oak dado, and a brass refractor on a cast-iron pier.
- **Moon Tower.** Leaded windows (moonlit glass on the upper floors), framed hand-drawn star charts (`scripts/star_charts.py`), stone planters and oak door leaves with iron strap hinges.
- **Campus and courtyard.**
  - Octagonal two-tier courtyard fountain.
  - Leaded day glazing in every facade window, and cloth banners (folds, forked tail, gilt emblem).
  - Photo-scanned shrubs replace the sphere shrubs; stone planters.
  - Gate leaves rebuilt from the oak door kit.
  - Moon Tower exterior windows, parapet, ribs and lantern; chimney stacks.
  - The real glasshouse replaces the glass box seen across the grounds.
  - Clipped shrubs line the drive; tree LOD0 now holds to 45 m.
- **Textures and materials.**
  - New CC0 textures: white leather, velvet, jacquard (carpet runners), dark panelled wood, linen (navy cloth), and others.
  - New CC0 props: chandelier, compass, microscope, vases, tea set, garden tools, plants and more (`scripts/fetch-cc0.mjs`, `repack_cc0.py`).
  - Single-channel textures that WebP cannot store keep their original image format.

## Level 1 excitement pass, part 1: shared systems (2026-10-04)

Built to CLAUDE.md §1B and LEVEL1_DESIGN.md LD-0:

- **7-second attention rule, enforced.** A bot plays Level 1 at the Fast travel speed (`src/game/attention.report.test.ts`) and fails the test if any area goes more than 7 s with nothing to type. Boss intros (beats marked `attention: 'boss-intro'`) may run up to 8 s. The worst gap fell from 33.8 s to about 3 s.
- **Spark gems.** After about 1.8 s with nothing to type, a glowing gem with a 3–4 letter word swoops in and flies beside the camera. It never appears during combat, fades, menus or exempt beats. Typing a letter during dialogue now also types (it skips the line and still counts).
- **Combo and score.** Every word adds to the combo. The multiplier is ×2 at 3, ×3 at 6 and ×4 at 10, and a mistake halves the combo instead of zeroing it. The score counts up in the HUD. Popups show PERFECT! and cheers at combos of 3, 5, 8, 12 and 20.
- **Hit feedback.** 50 ms hit-stop on targets, a small forward camera kick, and spell bolts and bursts that grow with the combo.
- **Encounter medals.** 1–3 stars (accuracy, plus no HP lost for 3 stars) with bonus score. Encounters with fewer than 2 words are not rated.
- **Bosses.** Full-width name cards (THE GREAT GRIMOIRE, THE WARD WARDEN) that clear as the first word flies in, and a boss health bar across all phases. The Warden intro is trimmed to two lines; Pip's second line now plays during phase 1.
- Fixes found by the gap bot: a word half-typed on a gem or bonus is no longer dropped when an encounter starts or ends, and Backspace/Tab work during dialogue.

## Level 1 excitement pass, part 2: set pieces and area rewrites (2026-10-04)

Every area now follows LEVEL1_DESIGN.md LD-0:

| Area | What changed |
| --- | --- |
| Opening / Arrival Gate | Swoop with sky gems from the first second; a sprite snatches Pip (type `drop`); crystal words blast the gate open; the fracture has lightning, falling dome pieces and the Warden silhouetted on the tower |
| Courtyard | Dummies hop off their stands; sprites burst out of planters; rooftop chase for the star page; the Warden crash-lands; anchor pillar of light and the Spark Bolt power-up card |
| East Hall | Book Stampede: Mira crashes out of an alcove, the camera runs backwards with books swooping in, chest speed round (3 words in 8 s), Pip's ward stops the stampede |
| Library | Books dive-bomb from the galleries; a shelf topples; wisps erupt from an inkwell; the Grimoire snaps its chains, blows out the lamps, smashes furniture; beam-struggle finale |
| Hall of Portraits | Paint Ambush: imps leap out of the frames throwing screen-edge paint splats; fountain breather with droplet gems; constellation speed round |
| Greenhouse | Snapvine Chase across the bridge; pods burst from the soil; mossling stampede; the Warden smashes through the glass roof |
| Lower Stairwell | Banister Slide on a tea tray; command words on the slide (guardians leap aside at the last moment if needed); guardian 3 bursts apart and reassembles |
| Practice Gallery | Arcade: pop-up spinning targets, Pip as announcer, optional bonus speed round with a local best score |
| Moon Tower | Runaway lift up a shaft; creatures leap at it between floors; the floor-3 guardian smashes up through the floor |
| Observatory / ending | Dome splits open; the Warden rises with a roar of light; plates blast off; W3 beam struggle and a huge re-seal; fireworks ending with four lines |

Shared systems added: chase targets on camera beats, camera-following targets, spectacle FX (bursts, debris, glass, dust, geysers, leaves, shockwaves, pillars, meteors, lightning, fireworks, flash, shake) timed by beat progress, speed rounds, beam struggles, the Warden cameo prop, power-up cards with a slow-motion beat, `spectacle` beats (no gems, max 4 s at Fast) and beat aliases so pre-rewrite saves resume at the replacement beat.

New placeholder assets (code-built, clearly labelled, replaceable with Blender GLBs without gameplay changes): paint imp, snapvine, tea tray, runaway lift, book swarm, overturned inkwell, spark gem. Fireworks and debris are VFX.

Fixes found on the way: the greenhouse floor and grass covered the water channel (the vine bridge was never visible); the tower chandelier chain split the lift-camera view; boss and power-up cards could reappear; models lagged their labels by a frame during fast travel; the missing favicon caused a 404 on every load.

Verification: 197 unit tests (including the 7-second attention test at Fast, spectacle and boss-intro limits, speed rounds, combo, medals, beat aliases and an old-save resume), typecheck, lint, production build and all 8 Playwright flows pass. A full 4× bot playthrough has no console errors (only the browser autoplay and three.js deprecation warnings).

Measured length (bot that reads for about a second before each word, no mistakes): 10.0 min at Normal and 30 WPM, 12.3 min at Normal and 18 WPM, 9.2 min at Fast. Real first plays with mistakes will be longer, but may still fall short of LD-0's 14–18 minute target; nobody has played it by hand yet.

## Realistic mobs: AI asset pipeline (2026-10-04)

Owner: "realistic designs, not half baked polygons"; mobs may look scary (no gore). The hand-scripted
voxel sculpts were replaced by an AI-assisted pipeline, using the owner's local ComfyUI installs.
Everything is scripted and reproducible (`assets-src/scripts/ai`):

1. **Concept:** `comfy.py concept` runs the owner's Flux 2 Klein text-to-image workflow (ComfyUI, port 8188).
   Prompts and seeds are in `concepts_level1.py`; images and prompts are kept in `assets-src/concepts/`.
2. **Shape:** `comfy.py mesh` runs TRELLIS.2 image-to-3D (ComfyUI-3D, port 8189, RTX 5060 Ti) and exports the raw surface.
3. **Clean mesh:** `prep_raw.py` (Blender). The raw surface is non-manifold, and this install's CuMesh clean-up and
   UV-atlas nodes corrupt meshes on both GPUs (`blackwell_fix.py` in the node pack documents the Blackwell part).
   Blender rebuilds a watertight mesh with the octree remesh (keeps thin petals, drips and plates), drops cavity
   walls by signed volume, relaxes and decimates to 300k triangles.
4. **Colour:** `comfy.py texture` runs TRELLIS.2 texturing with per-vertex colour (ComfyUI-3D, port 8190, RTX 3080),
   avoiding the broken UV-atlas step.
5. **Game asset:** `build_ai_creature.py` (Blender) normalises scale and facing, decimates to the §15 budget,
   unwraps with xatlas (installed for Blender's Python in the git-ignored `.deps`), bakes the vertex colours
   (sRGB-corrected) into a 1K/2K texture, rigs a height-band skeleton (root, torso, chest, head; robust on any
   AI mesh) and authors Idle/Move/Attack/Hit/Dispel. Posed preview renders check deformation.
6. `pipeline.py <names>` runs steps 3–5. Raw meshes live in the git-ignored `assets-src/ai-meshes/`.

Rebuilt so far: mischief sprite, mossling, ink wisp, armour guardian, paint imp, thorn pod. Limits: the
height-band rig gives believable rearing, lunging, breathing, waddling and recoil, but no separate limb
animation; textures carry some baked lighting from the AI.

## Levels 2 and 3 (2026-10-04)

Owner: keep Level 1's pacing; Level 1's story is now a mystery solved at the end (the Unwriter tore the
ward from outside); Level 2 focuses on the evacuation; mobs may be scary; "polish up the graphics".

- **Engine:** `src/level/levels.ts` registry (route, encounters, bosses, collectibles, starting spells,
  beat aliases). Saves carry `levelId`; the profile keeps `completedLevels` and `bestByLevel` (old
  profiles migrate). START plays the next unbeaten level; a Chapters icon picks any unlocked level;
  results offer CONTINUE TO LEVEL N. `src/level/levels.test.ts` checks every level's content.
- **Level 2** (`src/level/areas2`, `src/scene/areas2`): counter-words (TypingEngine `interrupt`
  candidates take the lock mid-word and hand it back), inkfire and `Restorable` ash objects, Starfall,
  Festival Lanterns, the Grey Herald and the Vellum Wyrm (beam struggles).
- **Level 3** (`src/level/areas3`, `src/scene/areas3`): path words (`Written` sections), colour
  restoration, erased letters (`erasedLetters`, never the first letter), fire tides (two-word counter
  phrases), Mira's Shield Song (heal 25 + block one hit), Bright Quill, Memory Pages, the Perfect Warden
  and the Unwriter (four phases), homecoming in the Level 1 courtyard.
- **Look:** `RedSky.tsx` (inferno and Blank skies, the Rift, the horizon Citadel, embers/ash),
  `Fire.tsx` (flipbook flame sprites, smoke, lights), `surfaceTextures.ts` (procedural colour and
  roughness maps).
- **Models:** Level 2/3 mobs and bosses come from the AI pipeline (`concepts_level23.py`,
  `batch_l23.sh`). Until a model is checked and added to `BUILT_AI_MOBS` / `BUILT_AI_FILES`
  (`CreatureModel.tsx`) the game shows a code-built stand-in, so nothing breaks while they build.
  Remesh choice matters: octree for armour and thin/smoky shapes (the hound shreds under voxel), voxel
  for smooth blobs (the blotling faceted under octree).
- **Known limits:** the Prism trail
  (all Memory Pages) and the Memory Book screen are not built; set-piece props in
  Levels 2-3 are kit-built placeholders.

## Levels 2-3: realistic models and environments (2026-10-05)

- **Mobs and bosses (all live):** Hollow Knight, Eraser Moth, Correction Moth, Foreman, Blotling,
  Smudgehound, Redactor, Scribble Imp; the Grey Herald, Vellum Wyrm, Perfect Warden and Unwriter.
- **Environment set pieces** (`concepts_env23.py`, `batch_env23.sh`, static props with `rig="none"`):
  festival stalls, bronze bell, alchemy furnace, copper stills, lighthouse, rowing boat, dead trees, ash
  rocks, black galleons, the Unwriter's book-page throne (redesigned to avoid franchise likeness), ink
  cauldrons, forge hammers, citadel towers, journal lectern. Each sits in a `ModelBoundary` with its old
  kit shape as the fallback. Set dressing with the CC0 props (`src/scene/areas2/dressing.tsx`).
- **Rejected:** the AI boathouse (texturing invented pastel swirls on flat walls; a denser mesh did not
  help). The boathouse is kit-built with stone, oak and slate instead.
- **Pipeline lessons** (also in `assets-src/scripts/ai`):
  - Octree remesh for armour, thin or smoky shapes; voxel for smooth blobs.
  - Texturing OOM on the 3080 scales with surface area, not triangles: texture big subjects on the
    16 GB 5060 Ti (`texture(name, base=TRELLIS)`).
  - Never chain jobs with a "wait until no process matches X" loop (it matches itself); wait on a log
    line. `healthcheck.sh` reports liveness and flags stalls after 45 minutes; run it every 15 minutes
    during long batches.
  - AI props are made for mid-distance; frame them from about 10 m, not up close.

## Playtest fixes (2026-10-06)

Owner playtest: words skipped and vanished, speech was cut by typing and drifted out of step with the
scene, off-screen mobs took too long to appear, everyone sounded alike. Rules now in CLAUDE.md §5.

- No timed word removal anywhere (EncounterRunner); waves wait for every word shown; chase, bonus and
  gem words hold the camera at the end of its move (`GameRun.wordsPending`).
- Speech: letters never skip or silence a line (Enter/Space still skip). Queued lines carry their beat
  and queue time: a new scene's lines supersede older ones, stale lines (> 4 s) are dropped
  (`speech.test.ts`).
- Off-screen moving mobs rush in at 3.5x (`GameRun.updateRush`, `TargetRuntime.rush`).
- Voices: `castVoices` gives each character a distinct English voice (Edge natural voices preferred).
- Scene/speech audit across all three levels: the Hall of Portraits no longer shows the greenhouse
  objective; the "empty frame" clue is now actually on the wall; lines that described things not on
  screen were rewritten; speed-round countdowns wait for their words and their prompt clears on end.

## Young-typist word budget (2026-10-06)

Owner: "My son types at 12 words per minute… I still want to complete the game under an hour."
- `src/level/youngTypists.ts` trims every level when it is assembled: ordinary fights one wave of at
  most two monsters (mixed kinds), boss phases at most two rounds of two targets (finishing sentences
  whole), sequences 2 words (anchors/beacons 3), armour 2 words, power-up waves 3, chase words 2 per
  stretch. Collectibles are never trimmed; trimmed words' scenery flags move to the last kept word.
- Required words: Level 1 139 → 87, Level 2 140 → 89, Level 3 155 → 98. Gems after 6 s idle (was 1.8).
- `pacing.report.test.ts`: a 12 WPM bot (1.5 s to read a word, 1 letter/s, Gentle, Normal travel)
  finishes the campaign in about 35 minutes; the test fails above 45.

## Milestone status

- [x] **M1 Foundation** — Vite/R3F/strict TS, rail system, pause menu, authored route.
- [x] **M2 Typing combat slice** — typing engine + metrics + tests, HTML labels, target lock, wand projectile, Focus and restart.
- [x] **M3 Courtyard** — Arrival tutorial, courtyard encounters, first anchor, checkpoints/autosave/resume, HUD and settings.
- [x] **M4 Library** — East Hall, books, shielded wisps, Great Grimoire (3 phases), second anchor.
- [x] **M5 Greenhouse** — Portraits (fountain, constellations bonus), vine bridge, pods/mosslings/pollen priority encounters, Warden rescue, third anchor.
- [x] **M6 Final path** — Stairwell commands + malfunction, Practice Gallery (accuracy/priority/streak rules with assist), Tower floors, pre-boss menu, Ward Warden (shell, runes ×2, repair).
- [x] **M7 Completion** — Celebration ending, results (all LD-19 metrics, rank, two true positive messages), 8 star pages, 2 cosmetics, audio, accessibility (reduced motion/shake/effects, font size, high contrast, OpenDyslexic, auto-continue, optional WPM, volumes, full screen, travel speed), quality presets.
- [x] **M8 Polish & verification** — realism pass (above), asset validation and `/dev/assets`, Playwright full path, balance check via headless playthroughs.

## Verification (2026-10-01)

- `npm run test`: **104 passed** (2026-10-02; 97 on 2026-10-01) — typing engine, metrics formulas, word content, difficulty filtering, settings, store flow, route/content integrity, asset validation, and **headless full-level playthroughs** at Gentle (slow typist with mistakes), Standard and Challenge, plus save → reload → resume without double counting.
- `npm run test:e2e`: **8 passed** in Edge — title/RESUME state, Arrival tutorial by typing, target lock + combat, pause during combat freezes attacks, anchor + checkpoint + reload + RESUME, difficulty change at a checkpoint, final boss → results → RESUME disabled + completion crest, and a **complete Level 1 run from START to results with zero console errors**.
- Typecheck, lint, production build clean. Build JS: game 246 kB, vendor 472 kB, three.js 876 kB (gzip 69/147/229 kB).
- Measured headless level length (Standard, auto-continue dialogue, no reading pauses): 16 min at 28 WPM, 19 min at 19 WPM — real first plays with reading should land in the LD-1 20–30 min window.

## Performance (2026-10-02, RTX 5060 Ti, Edge, 1600×900, Medium)

Measured with `node scripts/perf.mjs` (render stats include the shadow pass) and `node scripts/breakdown.mjs` (visible triangles per object):

| View | fps | draw calls | rendered tris (incl. shadows) |
| --- | --- | --- | --- |
| Arrival flyover | 60 | 1088 | 1.48 M |
| Courtyard | 60 | 804 | 758 k |
| Library combat / Grimoire | 60 | 533–761 | 1.23–1.30 M |
| Hall of Portraits | 60 | 125 | 146 k |
| Greenhouse combat | 60 | 606 | 1.81 M |
| Stairwell | 60 | 148 | 74 k |
| Gallery | 60 | 238 | 265 k |
| Tower / Observatory boss | 60 | 157–251 | 144–214 k |
| Celebration | 60 | 1077–1214 | 1.34–1.41 M |

After realism pass 2 the triangle counts rose (books, photo-scanned plants, trees held at full detail to 45 m). Low-end laptops are out of scope by owner decision, and every view holds 60 fps on the reference GPU. The first celebration sample showed a one-off streaming stall while assets loaded.

Optimisations: static architecture batched per material (`MergeStatic`), tree LOD0 only within 16 m, fir LOD1 thinned to 5.8 k by removing leaf islands, street lamps 2.5 k, background students on LOD1 (11.8 k), indoor views skip campus foliage, East Hall Mira only mounted in the hall. Not yet profiled on integrated graphics — Low quality (no shadows, dpr 1) is the fallback.

## Playtest fixes (2026-10-07)

Owner feedback after a full play-through: Level 1 good but chunky dialogue, Level 2 weak transitions and visuals, Level 3 "horrendous" visuals and confusing plot.

- **Engine:** camera framing keeps every word on screen; reveals hold on their word; the camera-carried group (boat, raft, ship, tortoise) was turned 180° and so invisible behind the camera; spark gems no longer vanish when a fight starts; Chain Spark and Starfall label every word they take; capitalised emphasis is spoken as a word, not spelled out; the "press Enter to skip" option is gone.
- **Level 1:** the Warden greets the apprentice inside the gate (type "hi") before the ward cracks; the script was rewritten line by line; the snapvine uses its AI model; the practice gallery has two short zones.
- **Level 2:** opens in the apprentice's bedroom inside the Dormitory Tower (the window shows the real lawn, lake and Rift); a beacon map card and a "where next and why" line on every departure; the lake starts on a jetty (type "row" to board); the rampart beacon is a real brazier; photo-scanned surfaces replace the flat procedural ones; fireballs are soft additive glows.
- **Level 3:** a baked fire sky (CC0 overcast clouds recoloured into smoke and firelight, `assets-src/scripts/sky/fire_sky.py`); CC0 burnt ground, rock and volcanic stone; flowing molten ink (`molten.py`); the Cinder Citadel built from AI towers and volcanic walls; the Margin Library, gallery and citadel stairwell rebuilt; an origami prow on the paper sea; a frost bubble on the ink river; the tortoise carries the party through fire; clearer story beats (the Perfect Warden is only a guard, the forge locks the Citadel gates, the run up the stairs, the way home) and a night homecoming with Orin's thanks, fireworks and a victory theme.
- **New AI props:** giant tortoise (rebuilt at a higher budget), paper ship (built but not shipped: its sails filled the view from on board), dorm bed, wardrobe, beacon brazier, deer.

## Chrome playthrough (2026-10-07)

The owner asked for a full play in real Chrome, fixing everything that looked wrong, and that "anything that looks blockish polygon must go".

- **Speech:** with real voices, lines ran behind their scenes; a camera move now waits at its end until its own lines are said, every voice is about 10% faster, and the script was trimmed to keep the 7-second rule.
- **Rendered light:** the sky tear (Rift and seam), light beams, the boss push-back beams and the pillar effect are painted textures on camera-facing quads (`src/scene/glow.tsx`), not solid cylinders and tubes. Fire is a per-pixel noise flipbook; fireworks are rockets bursting into streaking sparks (`src/scene/Fireworks.tsx`).
- **Replaced blocky or broken pieces:** the Ward Warden (new AI model), the rowing boat (lofted hull), the four-poster bed, the workshop's walls, the roof and aftermath, the forge's furnaces, written paths (planks between glowing ink rails), the raft (folded page), the lighthouse island.
- **Loading:** the next area is mounted hidden and its materials compiled while the current one plays.
- **AI models rejected:** the AI bed (flat shard posts) and the first tortoise (faceted shape from a noisy source; regenerating from a cleaner concept). Colour smoothing (`smooth_colours`) is available in `build_ai_creature.py`; Laplacian shape relaxing was tried and dropped (it broke the texture projection).

## Script read-aloud pass (2026-10-07)

- Owner: the opening dialogue was "chunky", Pip should react ("oh no! a sprite. Hey put me down!") and words like "naughty" felt awkward. Every line is now read in the order it is heard: characters react first, then instruct, in everyday words.
- Owner decision: **"Ignore the 7s rule for now."** The 7-second attention test (`src/game/attention.report.test.ts`, which also holds the boss-intro and spectacle limits) is skipped while the script is rewritten. Lines are not shortened or moved just to fit it. Switch it back on when the owner asks.
- Settings for spark gems and collectibles (star pages) exist and are both off for now (owner: gems broke the pacing). Lines that mention them only play when they are on.

## Level 1 as a mystery from the player's side (2026-10-08)

Owner: the story felt "chunky"; Pip told the player what was happening instead of wondering about it.
"It should be a story from the player's point of view… let's get the story flowing and make this into
a mystery and adventure." The 7-second rule and the 45-minute limit stay on hold while the story is fixed.

- **Voice of the script:** characters notice something odd and ask about it before acting ("Huh? Why are
  the training dummies moving on their own? Quick, calm them down!"). Each clue is a question, and the
  clues build up: a scared sprite, dark crystals, the cracking ward, scratched anchor runes, a half-erased
  page, books whose words vanish, the mosaic of a man with a pen, "Unwriter", an empty frame with its name
  scratched out. Pip then puts them together ("is someone rubbing things out of our school?"), the Warden
  holds the crack shut against "someone on the other side", and Keeper Orin introduces himself and names
  the Unwriter at the end.
- **Every move has a reason:** lines on leaving the courtyard (the library anchor), the East Hall (the
  books ran from the library), the library (the greenhouse via the Hall of Portraits), the portraits and
  the greenhouse (the crack is over the Moon Tower). Mira joins the party in the East Hall.
- **Powers have a cause:** each anchor's light flows into the wand before its new spell is announced.
- **Gate:** two crystals (left and right), since the young-typist trim keeps two words; the centre crystal
  had no word.
- **Warden:** it floats down visibly; a blast at the tower makes it turn, say where it is going, and fly
  there at a pace you can follow (before, the flight took 0.2 s at Fast). In the courtyard it lands by the
  broken anchor, says three anchors hold the ward, and leaps back to the tower. The three-anchors line no
  longer plays over the dummies.
- **Pip's voice:** speech rate 1.22 → 1.0 and pitch 1.3 → 1.2 (owner: "I barely caught what pip said");
  Mira 1.17 → 1.05.
- 12 WPM pacing: Level 1 12.9 → 14.3 min; campaign 40.7 min (limit 45).

Second playtest (2026-10-08), fixed:
- **Scenes keep their lines:** a camera move now also waits at its end when earlier story lines are still
  being said and the next scene brings lines of its own (the fountain's line came after its droplets had
  gone; the plaques' speed-round line was lost behind the clue lines).
- **Library:** the mosaic lines play while looking at the mosaic; the balcony pan is a separate shot.
- **The crack is visible:** a tear above the Moon Tower from the moment the ward cracks until the Warden
  is helped, and the observatory crack is open from the moment you walk in (it narrows to the seam after).
- **Gate:** the "look at the sky" shot is shorter; "Who would break it?" plays over the walk in.
- **Stairwell:** "hop on the tea tray, we'll slide down the stairs" plays at the top, and the guards line on
  the first slide. Spells hit the guards: guards 1 and 2 wait for the spell before stepping aside, and the
  third guard's word sits on the guard (it was 1.9 m to its right).
- **Lines matched to the screen:** the tower guardian "calmed down… the door is opening" (it never bowed);
  Pip links the Unwriter to the man with the pen in the ending. The "no need to aim" and Tab tips are gone.
- **Levels 2 and 3** given the same pass: Pip recognises the Unwriter's voice, wonders why imps trap the
  dorm, why moths cover the bell, why the dragon steals pages; Orin names the Hush and sets up the
  Lantern Ward; Starfall comes from the furnace beacon's fire; Pip spots the red crystal before Orin
  explains it; in Level 3 Pip somehow knows the Citadel's name, the forge and journal are discovered,
  not announced. Campaign at 12 WPM: 41.1 min.

Chrome playthrough of all three levels (2026-10-08), every line checked against the screen:
- **Engine:** a fight that brings lines of its own now waits (up to 12 s) while earlier story lines finish,
  so back-to-back fights no longer stack their lines ("A spell! Type it!" was said in the next area).
  The `?test` hook exposes the word labels, subtitle and choice for scripted play-throughs.
- **Level 1:** the library mosaic is visible (it was hidden behind the shelves and showed no man with a
  pen; it is now a tall panel with the Warden below the ward arc and a dark figure with a glowing pen
  outside it, seen square on down the aisle); the Grimoire's whisper is said while looking at it; anchors
  are "broken", not "dark" (they glow); lines that pointed at things not in view were reworded (the
  greenhouse door, the crack over the Moon Tower, the tower door, mosslings "settling in flower pots"
  while more leapt onto the lift).
- **Level 2:** the bedroom window ends on the Rift while it is talked about; Idris, the barrier and the
  students are close enough to see in the Great Hall; the tower roof's parapet was a capped cylinder
  whose lid sat 1.1 m above the floor and sank Mira and Orin to the chest in the aftermath; the rampart
  line waits until the wall is in view; the Knight Captain line explains when to type halt.
- **Level 3:** the Perfect Warden lines are said in the gallery, not at sea; Mira's ship line fits being
  aboard; the Citadel line waits on the Citadel; lines claiming things not shown (colour spreading, the
  deer under attack, colour returning to the Blank) were matched to what is on screen.
- 12 WPM campaign: 41.5 min.

## Third playtest (2026-10-08)

- **Spells:** Chain Spark is a bright bolt that jumps from the struck foe to the next and bursts on
  arrival (it was a 1-px line from the wand); Starfall stars fall from above. A newly learned spell
  swirls its colour up the wand for six seconds.
- **Level 1:** the tea tray waits on the landing, a hop lands on it, and only its front half shows
  while riding; the stairwell ends at an open arched doorway; windows sit above the stairs and the
  handrail stops short of the door; the observatory door opens onto a moonlit stair passage (no window
  or brass ring in front). The camera eases back after the last word (no snap after speed rounds).
- **Level 2:** clearer transitions ("the Hush are attacking the students at the Great Hall", "the next
  beacon is the furnace", "the library is in trouble again"); fireballs twice the size, launched closer,
  their words above them; beaten knights burst instead of standing about; the bell bridge skyline sits on
  the ground; Oarsby's boat floats with floorboards; the page dragon swoops through the library; the
  Grimoire line names the imps as they attack; the rampart beacon words float just over the brazier;
  the Warden's palm rises over the parapet instead of through the tower.
- **Level 3:** a dense dead forest on the opening shore; the deer and tortoise are half rubbed out
  (`Restorable erased`: a slanted clip plane with a pencil ghost, swept away on restore; the renderer
  has `localClippingEnabled`); the page raft waits on the ink with handwriting and Mira aboard, then a hop;
  the written slide slopes down from the basin into the pool and the raft rides on it; the walkway spans
  the whole chasm; the ship sails through the gap between galleons; a top landing reaches the throne
  doors; Pip's "three success rates" joke is gone; boss names sit under the HP bar.
- **Generated models (3080 only):** `assets-src/scripts/ai/build_on_3080.sh` runs concept, shape (512,
  no 1024 cascade: `comfy.py mesh --no-cascade`) and colour/build on the RTX 3080 alone, starting and
  stopping each ComfyUI server. Built: `citadel_gate` (the Citadel's front: riveted iron curtain wall,
  spired towers, burning arched gate; the ink rivers now lie along the slope). The book stampede uses the
  generated `runaway_book`. New rule in CLAUDE.md §20.16: generate models, don't hand-build them.
- **Page dragon** (`vellum_dragon`, owner: the coiled wyrm "looks weird"): a dragon of burnt pages on all
  fours with a 15 m wingspan, built on the 3080 with a new `rig="dragon"` (height bands plus a bone per
  wing; wings weighted outside ±0.22 W above 45 % height; Idle breathes, Move beats the wings, Attack
  rears and lunges). It stands on the far parapet of the tower roof staring down (head/heart points moved
  to it) and beats its wings while circling; a smaller one flies through the burning library.
  `SceneCreature` takes `flying` to play Move. The coiled `vellum_wyrm` is no longer used.
- **Oars** (`wooden_oar`): two stowed along the page raft; the raft's folded edges are now a low rim (they
  were 4 m planes standing up, which read as giant planks or oars).
- **Stairwell:** windows and lamps sit above the stairs at their own angle (two were below the treads);
  the handrail stops at −236°, before the exit doorway it used to cross.

Fourth playtest (2026-10-08):
- Courtyard entry goes straight to the dummies (the fountain pan only exists with collectibles on).
- Hall of Portraits: no painting overlaps the Warden's frame; the far end is an open arched doorway with
  the statue moved aside (it was a window behind the statue).
- Stairwell guards step aside only once their word is typed (they leapt away as the tray arrived); the
  gold rings under them are gone.
- The Moon Tower door opens through a gap in the top floor's wall onto a stone passage with stairs up to
  a moonlit arch.
- Spells are textured sprites: the projectile is a glowing core, star flare and streak flying straight to
  the target (it was lobbed spheres); bursts use soft glows (they were square points); Chain Spark beads
  and the wand's power-up swirl are glows and twinkling stars.
- Celebration: no camera turn to the balcony fireworks mid-conversation.
- Greenhouse anchor wrapped in a generated `vine_tangle` that loosens with each knot and sinks once free.
- Doors: the greenhouse door (end of the Hall of Portraits) and the practice gallery door (foot of the
  stairwell) are the existing `large_castle_door` model, closed, on the wall (`src/scene/CastleDoor.tsx`).
  That model stands on its origin: the old `1.13 × h / 4.07` lift floated every use of it (Great Hall,
  dormitory) by about a metre, now fixed.
- Moon Tower top-floor wall: its doorway gap geometry lacked metre UVs, which smeared the stone (fixed).
- No separate stone surround on any of the three doors: the wall's own stone runs to the door frame; the
  Moon Tower door sits on the wall line with its jambs and lintel in the wall stone, set just behind it.
- Scripted Warden cameos decide visibility from the live beat (`run.director.currentIndex`): React's copy
  lags a frame, and for that frame the Warden was drawn at the start of its path (the "flash"). The gate
  flight climbs straight up and crosses above the roofs; the courtyard leap rises clear of the facade first.
- Moon Tower: the observatory door is the `large_castle_door` (its leaf nodes swing open); the stairs
  beyond have dark stone risers, oak treads with rounded noses and a red runner.
- Voices take a per-character `gain` (owner: too soft): Keeper Orin, Mira and both portraits 1.6×; Orin's
  pitch 0.85 → 0.92. The practice gallery's door to the Moon Tower is the castle door (was a flat panel).
- Speech volume is capped at 1 by the browser, so soft voices also get a deeper music dip (`duck`): Orin and
  the first portrait drop the music to 12 % while they talk (others 35 %).

## Fifth playtest (2026-10-16)

Level 2:
- Dormitory: the windows were 3 m tall and one stood in front of the first door and student. They are now
  2.2 m, and the dormitory has its own window angles, clear of the doors. The handrail breaks ±8° around
  each door; it used to run straight across them.
- Bell Bridge: the far end now lands on a rocky cliff topped with packed earth (`MAT.earth`, CC0
  `farm_soil`). The burning skyline used to stand over the empty gorge and looked as if it floated on water.
- Great Hall:
  - The lane doors are at z −4, −12 and −20, midway between columns. One door used to stand in front of a
    pillar.
  - The banners hang between windows and columns, away from the doors.
  - The Herald's doors moved to z −20, and `StoneHall` gained `noWindowAt` so no window sits over them.
- Herald intro: the reveal held for 10 s on each look (about 20 s in total), leaving a long silence after
  the Voice's line. The hold is now 1.6 s.
- Boss names: `strings.bosses` only listed the Level 1 bosses, so the Level 2 and 3 bosses had no name card
  and no name under the HP bar. Added: THE GREY HERALD, THE PAGE DRAGON, THE PERFECT GUARDIAN and THE
  UNWRITER. The objectives and Pip's lines now say "dragon" and "Perfect Guardian" to match.
- Oarsby: gain 1.6, music duck 0.12, and pitch 0.78 → 0.88 (very low pitches sound quiet).
- Dragon wings:
  - The real bug was in `CreatureModel`. When a Suspense boundary above re-showed a model, its effect
    stopped every action and replayed Idle, but the clip tracker still said "Move". The creature stayed
    stuck in Idle until its state changed. This affected every creature.
  - The effect now resets the tracker to Idle. The tower dragon always flies (wingbeats).
  - Verified by sampling the wing bones in the browser.
- Camera between sequential words: `GameRun.framingTarget` keeps the last framing until the encounter
  ends. Before, after "stone" at the Warden the camera swung back to the beacon and then out to the Warden
  again for "steady".

Level 3:
- Tortoise ride: the two words floated in front of trees with nothing to aim at. They are now spark gems
  flying beside the tortoise.
- Inkfall: the raft cut diagonally through each terrace. It now rides to the lip (`IF_RUN*`, `IF_LIP*`),
  then drops.
- Journal pages ("orb", "quill", "flee") were lowered from 5–7 m to about 3 m, so they sit inside the view.
- Faded letters removed (owner: a child thought faded letters needn't be typed). The `erased` target option,
  the label styling and Pip's "Some letters are faded" line are all gone.
- Citadel stairs: each flight now ends at the front edge of its landing (`flightChunk`). Before, only the
  last flight did; the others ran under their landings. The top landing reaches the last step.
- Forge: Mira's "To the stairs!" named stairs nobody had seen. A castle door now stands on the forge's east
  wall, the escape beat turns to it, and the line says "Through that door … it goes up into the Citadel!".
- Paper sea: the burning dark boxes are now `burning_wreck`, an AI-pipeline model built on the RTX 3080 (Flux
  concept → TRELLIS → Blender, 20k tris), still burning.
- Citadel mount: the "two long strips of solid orange" were flat emissive boxes, and some floated off the
  faceted rock.
  - They are now winding ribbons of the textured molten ink that hug the rock (`mountSurface` accounts for
    the facets).
  - The mount uses metre-UV cylinders, so the rock texture no longer smears into stripes.

## Known limitations / next steps

- Still code-built (clearly labelled placeholders, same gameplay hooks): pollen puffs, gate crystals, clasps/plates/runes/flying pages of the bosses, star pages, and the stairwell/gallery/observatory architecture details. Each can be swapped for a Blender GLB without gameplay changes.
- Character faces are stylised volume sculpts — readable at dialogue distance, not close-up hero quality. Creature LOD1/LOD2 files are not yet generated (single LOD within budget).
- Manual checks in §17 that need a human at a real keyboard have not been done by a person: deliberately slow Gentle play, intentional-mistake Standard play by feel, focus loss / tab switching by hand, browser resizing at several resolutions, refresh at every checkpoint. Automated equivalents exist for most flows.
- Firefox is out of scope by owner decision (Edge/Chromium only). Text-to-speech voice quality depends on the voices installed in the browser/OS.
- Music is procedural placeholder material; SFX are synthesised.
