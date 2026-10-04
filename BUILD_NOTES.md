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
  - New game-wide attention rules in `CLAUDE.md` §1B: the 15-second rule, juicy feedback, boss name cards, fast-rail set pieces, spark gems, speed rounds and medals.
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

## Known limitations / next steps

- Still code-built (clearly labelled placeholders, same gameplay hooks): pollen puffs, gate crystals, clasps/plates/runes/flying pages of the bosses, star pages, and the stairwell/gallery/observatory architecture details. Each can be swapped for a Blender GLB without gameplay changes.
- Character faces are stylised volume sculpts — readable at dialogue distance, not close-up hero quality. Creature LOD1/LOD2 files are not yet generated (single LOD within budget).
- Manual checks in §17 that need a human at a real keyboard have not been done by a person: deliberately slow Gentle play, intentional-mistake Standard play by feel, focus loss / tab switching by hand, browser resizing at several resolutions, refresh at every checkpoint. Automated equivalents exist for most flows.
- Firefox is out of scope by owner decision (Edge/Chromium only). Text-to-speech voice quality depends on the voices installed in the browser/OS.
- Music is procedural placeholder material; SFX are synthesised.
