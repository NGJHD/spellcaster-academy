# Build Notes — Spellcaster Academy: The Broken Ward

Running log of decisions, environment facts and milestone status. `CLAUDE.md` is the spec; this file records how it is being built.

## Environment

- Windows 11, Node 24.19, npm 11.17 (package manager: **npm**; do not switch).
- Blender 5.2 at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (not on PATH — call by full path).
- Git repo initialised on `main` (2026-09-29). No remote yet.

## Stack (pinned majors)

| Package | Version | Note |
| --- | --- | --- |
| react / react-dom | 19.3 | R3F 9 requires `<19.4` |
| three | 0.186 | |
| @react-three/fiber | 9.8 | |
| @react-three/drei | 10.7 | |
| zustand | 5.0 | |
| vite | 8.3 | |
| vitest | 5.0 | |
| typescript | ~6.0.3 | TS 7 is out, but typescript-eslint supports `<6.1` only |
| eslint | 10 + typescript-eslint 8 + react-hooks 7 | flat config |

Not installed yet: `@react-three/rapier` (the on-rails camera needs no physics; add when something does), Howler (audio milestone), Playwright (added with the first critical browser-flow test).

## Decisions from the owner (2026-09-29)

1. Start with Milestone 1; build milestone by milestone.
2. Art: build gameplay with clearly labelled placeholders first, then replace them asset by asset via Blender `bpy` scripts. Hard-surface assets (architecture, props, anchors, Grimoire, armour, Warden) are well within scripted reach. Organic creatures and characters are the risk area; reference images and permission to use CC0 textures/HDRIs would raise quality. Still to confirm with the owner.
3. Sound effects are self-made (synthesised in code or generated WAVs).
4. No voice acting — all dialogue is subtitles.
5. British spelling everywhere, including typed words (`honour`, `colour`).
6. Git initialised.

## Spec conflict resolutions

The LD/MD/GD sections of `CLAUDE.md` take precedence over earlier sections:

- Runtime target is 20–30 minutes; the title screen offers START/RESUME; completion buttons follow LD-19.
- Checkpoint list is the extended LD set (`arrival-gate-complete`, `east-hall-complete`, `portrait-hall-complete`, `lower-stairwell-complete`, …).
- FP arm clips `FP_Walk/Run/Jump/Land` are dropped (on rails, no jumping).
- Grimoire "dodging" becomes telegraphed Focus hits — the player cannot move.
- Arrival Gate uses LD-8's three words; the Tab/Escape demos from §7.1 are short optional prompts.
- Positive rank titles from §7.11 are kept alongside the LD-19 metrics.
- Target platform: typical Windows laptop, Chrome/Edge primary, Firefox secondary.

## Architecture notes

### Rail system (`src/level/rail/`)

- Pure TypeScript, no React. Uses three.js math only (`CatmullRomCurve3`, centripetal).
- `railTypes.ts` — route data model. Camera nodes and look points are **named** records (GD-2); beats reference them by name.
- Beat kinds so far: `rail-travel` (spline glide), `camera-reveal` (fixed position, eased pans across look points, then holds), `loading-transition` (fade out → cut → fade in).
- Position and look target run on separate splines so framing can be art-directed.
- Reduced motion: travel beats marked `fade-cut` become a 0.9 s fade cut; reveal pans are halved.
- Travel-speed setting scales `rail-travel` durations only (between-encounter travel).
- `RailDirector` plays beats in order, carries leftover frame time across beat boundaries, and clamps frame delta to 0.1 s so a tab switch never jumps the camera.
- `validateRoute` checks names, timings, duplicate IDs and **camera continuity** (a beat must start where the previous one ended unless it is a fade transition). A unit test runs it on the authored Level 1 route.

## Milestone status

### Milestone 1 — Foundation (complete 2026-09-29)

- [x] Vite + React + strict TypeScript + ESLint + Vitest scaffold
- [x] Rail data model, math, director, validator
- [x] Level 1 preview route (Arrival Gate → Courtyard → East Hall), 17 beats, placeholder geometry
- [x] R3F canvas + `RailCameraController` (writes camera and fade overlay imperatively; store only sees beat changes)
- [x] Zustand game store + settings store (persisted, versioned, sanitised field by field; defaults to OS reduced-motion)
- [x] Title screen (START; RESUME disabled until autosave exists), pause menu (resume / controls / settings / return to title), Escape handling, auto-pause on window blur and tab hide
- [x] Area title card, dev beat label, `?rails` rail gizmos, dev-only `?beat=<id>` start
- [x] 21 unit tests passing; typecheck, lint and production build clean; no console errors in browser

Verified in Chrome: title screen, opening fade and flyover, crystal reveal, courtyard reveal, East Hall reveal pan.

Known limitations:
- Production bundle is ~1.2 MB (three.js); code-splitting comes with per-area loading.
- Placeholder art is intentionally flat primitives (see "Visual direction" below).
- The Claude-in-Chrome automation window reports `visibilityState: hidden`, so rAF does not run there; use `?beat=` plus screenshots for visual checks rather than real-time playback.

## Dev URLs

- `/?rails` — show camera splines (gold), look splines (blue dashed) and node names.
- `/?beat=courtyard-fountain-reveal` — dev build only; START begins at that beat.

## Visual direction

2026-09-29: the owner saw the placeholders and asked for a more realistic look. Next step is a look-development pass on the Arrival Gate to set the visual bar before building further areas.
