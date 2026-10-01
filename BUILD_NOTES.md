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

## Spec conflict resolutions

The LD/MD/GD sections of `CLAUDE.md` take precedence over earlier sections:

- Runtime target 20–30 min; START/RESUME title; LD-19 completion buttons; extended LD checkpoint list.
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

## Known limitations / next steps

- Still code-built (clearly labelled placeholders, same gameplay hooks): pollen puffs, gate crystals, clasps/plates/runes/flying pages of the bosses, star pages, and the stairwell/gallery/observatory architecture details. Each can be swapped for a Blender GLB without gameplay changes.
- Character faces are stylised volume sculpts — readable at dialogue distance, not close-up hero quality. Creature LOD1/LOD2 files are not yet generated (single LOD within budget).
- Manual checks in §17 that need a human at a real keyboard have not been done by a person: deliberately slow Gentle play, intentional-mistake Standard play by feel, focus loss / tab switching by hand, browser resizing at several resolutions, refresh at every checkpoint, low-end laptop performance profiling. Automated equivalents exist for most flows.
- Firefox has not been tested (Edge/Chromium only).
- Music is procedural placeholder material; SFX are synthesised.
