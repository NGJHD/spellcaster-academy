# CLAUDE.md — Spellcaster Academy: The Broken Ward

Game-wide rules for every level. The levels themselves are described in:

- `LEVEL1_DESIGN.md` — Level 1: First Day, First Spell
- `LEVEL2_DESIGN.md` — Level 2: The Siege of Asterfall
- `LEVEL3_DESIGN.md` — Level 3: Into the Unwritten

`BUILD_NOTES.md` holds the environment, commands, architecture and technical lessons. `RELEASE_GUIDE.md` says how to publish a version. The game's script is `src/content/dialogue.ts`; each level's route is in `src/level/`. Section numbers below are cited in code comments, so keep them.

## 1. Mission

A polished, child-friendly, browser-based **first-person 3D typing adventure** for children of about 8–10. The player follows a directed, cinematic route through an original magical academy and casts spells by typing words. It is a **first-person on-rails typing shooter**: the game moves and aims the camera; typing is the only skill.

The game is a campaign of three levels (§5). The whole game takes **30–45 minutes** on a first play at the Fast travel speed, and a child typing at **12 words per minute** must finish it in **under an hour** (`src/game/pacing.report.test.ts` plays all three levels as such a child and fails above 45 simulated minutes).

> Present the action like an FPS, but control it like an on-rails typing shooter: the game moves and aims the camera; the player observes, chooses targets through typing, and casts spells.

## 1A. On-rails format

- The game controls the player's position, facing, camera path, stops, pans and transitions. The camera travels between named camera nodes along authored rails; nothing is physics-driven.
- There is no free movement, jumping, strafing, mouse aiming, searching for exits, backtracking or open hub.
- At a fight the camera frames the targets and turns towards any word near the edge of the screen. Every word is fully on screen within 1–2 seconds; a reveal that shows a word holds on it until it is typed.
- Camera travel slows while a chase word is being typed, and the camera holds at the end of its move until every word on that stretch is typed. No word ever disappears on a timer, except optional words.
- **Nobody just appears somewhere.** Every move to a new place has a line saying where we are going and why, and the way there is shown: a door we walk through, a boat we board, a doorway the erased pages fly into. Where two areas are separate scenes joined by a fade, the first one shows the way on (a door, an arch, a stair) and the next one opens just through it. On a boat, raft, ship or ride, its bow stays in front of the camera.
- No camera roll, rapid spins or uncontrolled shake.

## 1B. Keeping it exciting

The audience has a short attention span. Something should always be happening.

- **Dialogue never stops the action.** Lines play over travel or typing. A conversation with nothing to type has at most two short lines. Instructions for a fight play over its words, not before them.
- **Every word feels powerful:**
  - **Hit-stop:** a 50 ms freeze on the target when a word completes.
  - **Impact:** an impact sound, a burst of sparks and a small camera kick that never moves the active word.
  - **Size:** the spell bolt grows with the combo, from a thin bolt to a blazing comet.
  - **Defeats:** enemies burst, shatter, spin away or crash. Nothing just fades out.
- **Combo and score:** every word adds to the combo. The multiplier is ×2 at 3, ×3 at 6 and ×4 at 10, and a mistake halves the combo rather than resetting it. Cheers pop up at 3 (COMBO!), 5 (SUPER!), 8 (AMAZING!), 12 (UNSTOPPABLE!) and 20 (LEGENDARY!), and a perfect word shows PERFECT!. The score counts up in the HUD.
- **Medals:** every encounter of two words or more ends with 1–3 stars and bonus score (3 stars: 97% accuracy and no HP lost; 2 stars: 88%).
- **Bosses:** a camera move to the boss, a full-width name card that clears as the first word appears, and a boss health bar that drops with each word. A boss finale is a **beam struggle**: each word of a phrase pushes the player's beam against the boss's.
- **New spells** are announced like power-ups (a slow-motion beat and a title card), followed by a wave of easy enemies to try them on.
- **Set pieces:** each level has fast-rail moments (a chase, a slide, a ride, a climb) with light typing.
- **Surprise entrances and destruction:** enemies burst through floors, out of frames and out of the ground, always in view before they can attack. Spells and attacks smash cosmetic scenery.
- **Optional speed rounds:** a short countdown for bonus score. The countdown runs only while its words are on screen, it is never a fail state, and the words still count if time runs out.
- **Story:** short and funny, told from the player's side (§5). Characters are in danger and need rescuing.
- **Music** is always present and switches to a battle theme whenever something can cause damage.

## 2. Content and audience

- An **original** fantasy game. Do not use or imitate protected characters, places, terms, insignia, music or designs from Harry Potter, One Piece, Roblox, Dragon Ball, Naruto or any other franchise.
- For children 8+. Level 1 is bright and gentle; Levels 2 and 3 escalate into dramatic peril (fire, red skies, burning buildings, menacing enemies) so a child can tell at once the stakes have changed.
- **Scary is fine:** creatures may snarl, bare fangs, have glowing eyes and loom large, in every level.
- **Never** show gore, blood, realistic weapons, injury to people or death. Enemies are magical constructs, mischievous creatures and animated objects; beaten, they burst into sparks, shatter, flee or are sealed away.
- No gambling, loot boxes, advertising or monetisation. Mistakes are met with encouragement, never shame.
- British spelling everywhere, including the typed words.

## 3. Technology

- TypeScript (strict), React, Vite, Three.js, React Three Fiber, `@react-three/drei`, Zustand (coarse state only), Howler (sound effects), Vitest, Playwright. npm is the package manager.
- The stable WebGL renderer, GLB assets, simple materials, one shadow-casting sun. No WebGPU, custom renderers or post-processing.
- Do not add without being asked: Next.js, Redux, an ECS, a physics engine (nothing on the rails needs one), Babylon.js, game-engine exports, networking, a backend or accounts, procedural levels, shader frameworks.
- `localStorage` holds settings, saves, best results and cosmetics.

## 4. Engineering principles

1. Small, explicit, testable systems; plain TypeScript for game rules.
2. React for composition, screens and HUD; `useFrame`, refs and imperative Three.js for per-frame work. Never set React state every frame.
3. Typing logic is separate from rendering and enemy behaviour.
4. No dependency for something doable in about 100 lines.
5. All player-facing text lives in `src/content/` (`strings.ts`, `dialogue.ts`).
6. A placeholder asset must be swappable without changing gameplay code.
7. Browser shortcuts are blocked only while gameplay is active.

## 5. The campaign

**Title:** Spellcaster Academy: The Broken Ward

| Level | Title | Setting | Bosses |
| --- | --- | --- | --- |
| 1 | First Day, First Spell | Asterfall Academy on the apprentice's first day, bright and sunny; the ward cracks | The Great Grimoire; the Ward Warden (a misunderstood protector) |
| 2 | The Siege of Asterfall | The academy at night, burning under a red sky, attacked by the Hush | The Grey Herald; the Page Dragon |
| 3 | Into the Unwritten | The Blank, a scorched land of ash under a red sky, up to the Unwriter's Cinder Citadel | The Perfect Guardian; the Unwriter |

### Visual tone

- **Level 1:** bright and peaceful: gold, blue and green.
- **Level 2:** a night siege lit by fire: red and orange inkfire against the dark, pushed back by the gold of the beacons.
- **Level 3:** a red sky over scorched grey land, and a stronghold of black iron, molten red ink and roaring fire.

Fire, embers and red light signal that the game has turned serious. They never cover an active word.

### Story

Long ago Corvane Hale, Asterfall's archivist, came to believe mistakes should not exist. He made the Unwriting Quill, which burns whatever it strikes out of the world, and became the Unwriter. The academy's founders sealed him beyond the celestial ward, guarded by the Ward Warden.

- **Level 1, a mystery:** on the apprentice's first day the ward cracks. Pip, Mira and the apprentice repair its three anchors and calm the Warden, which was only holding the crack shut. Clues build up (scratched runes, vanishing words, a mosaic of a man with a pen, a scratched-out portrait), and Keeper Orin names the Unwriter at the end.
- **Level 2:** the crack tears open into the Rift and the Unwriter's army, the Hush, sets the academy alight. The apprentice rescues the first-years, lights four beacons that raise the Lantern Ward, and beats the Page Dragon on the Moon Tower roof. In its heart is a shard of the Quill; the Rift can only be closed from the other side.
- **Level 3:** the apprentice, Pip, Mira and the Warden cross into the Blank. Corvane's journal reveals that Pip was his guide orb, which he tried to erase for "being wrong too often". At the Throne of Ash the apprentice breaks the Quill with six words, "every mistake teaches us something new", and the Unwriter is sealed in his own book. At home, in the courtyard at night, Keeper Orin names the apprentice Asterfall's first Wardkeeper in a hundred years.

The story is told from the player's side: characters notice something odd and wonder about it before acting, every move has a reason, and every new power has a cause (an anchor's light flowing into the wand). An 8-year-old must always know who someone is and why we are here. Lines that count things must match what is on screen (`src/game/story.test.ts`), and nothing may suggest a word can be skipped.

### Campaign rules

- The title screen has two primary options. START begins the next level not yet completed (Level 1 if none is); if an autosave exists it asks for confirmation first, and the old save is kept until the new run reaches its first checkpoint. RESUME continues the in-progress level and is disabled ("No journey to resume") when there is none.
- A **Chapters** button lists unlocked levels so completed ones can be replayed. Levels unlock in order.
- Spells learned in a level are known from the start of the next. Settings, cosmetics and best results persist across levels.
- Results are per level; after Level 3 the results add each chapter's best.
- **HP:** shown to players as HP (Focus in code), 100 at most. On Gentle HP is unlimited and its bar is hidden; a hit still glows.

## 6A. Rails and encounters

Each level is a deterministic list of **beats** built from area scripts (`src/level/areas*/`):

- **Camera beats:** `rail-travel` (along named nodes, with optional chase words), `camera-reveal` (a pan to look points and back), `loading-transition` (a fade to a new area).
- **Gated beats:** `encounter` (a fight or a typing interaction), `dialogue`, `checkpoint`, `results`.
- Beats carry lines (`barks`), music, objective text, spectacle cues (`fx`) and a role (`attention`: `boss-intro` and `spectacle` stay short; an `ending` conversation is said in full).
- Camera nodes and look points are named; `validateRoute` proves the camera never jumps.
- The level director owns progression; enemies never advance the story. An encounter runs its waves (all at once or one at a time) and completes when every required word is typed.

## 8. Controls

```text
Letter keys   type the active word
Backspace     correct the current input
Tab           switch to another visible target (works mid-word)
Enter / Space skip the current line; skip an optional speed round
Escape        pause
Mouse         menus only
```

There is no movement, jump, aiming or pointer lock.

### Settings

Travel speed (Slow 1×, Normal 1.6×, Fast 2.4×), font size, spoken dialogue, an optional live WPM display, quality (Low, Medium, High; Medium by default), full screen, and volumes for master, music, sound effects, interface and voices. Difficulty is chosen at START and can be changed from the pause menu outside a fight. There are no reduced-motion, reduced-shake, reduced-effects, high-contrast or dyslexia-font options.

## 9. Typing

The typing engine is framework-free TypeScript with unit tests (`src/typing/`).

- Letters only, case-insensitive. Modifier, function and navigation keys are never mistakes. Backspace corrects.
- **Targeting:** typing a word's first letter locks it. Targets on screen get different first letters where possible; when two share one, the second letter decides, then the most central. Once locked, input goes only to that word until it is done. A locked word shows a TARGET tag; the others show a Tab hint.
- **Counter-words** (short words on incoming attacks, Level 2 onwards) take the lock even mid-word and hand it back when typed.
- **Labels** are HTML projected near their target. A new word flies in large from the centre of the screen and lands on its target. Labels keep a dark backing, clamp to the screen edges with an arrow, and never drop into the subtitle band. Typed letters turn gold; the current letter is underlined; a mistake flashes orange.
- **Metrics** (`TypingMetrics.ts`): timing runs only from a word's first accepted letter; a five-second gap, a pause or a hidden tab closes the timing segment. WPM = (correct characters / 5) / active minutes. Accuracy = correct / (correct + incorrect) keys; Backspace never erases a mistake from it. First-attempt accuracy counts words with no mistake. Metrics are committed with each wave, so a reload never double counts.

### Difficulty

| | Gentle | Standard | Challenge |
| --- | --- | --- | --- |
| Generated word length | 3–5 | 3–7 | 4–9 |
| Enemy speed | 0.85× | 1× | 1.25× |
| Enemy time while mid-word | 0.55× | 0.7× | 0.85× |
| Attack warning | 1.4× (at least 0.7 s) | 1× (at least 0.5 s) | 0.85× (at least 0.5 s) |
| Damage | none (unlimited HP) | 1× | 1.15× |
| Mistakes | flashed, never entered | entered | entered |

Assist mode (offered after repeated failures) shortens generated words to 4 letters at most.

## 10. Combat

- **HP** drops when an enemy's telegraphed attack lands. At zero, a short calm reset restarts the current wave or boss phase; checkpoint progress is kept. Assist mode is offered after two resets in a boss.
- Every attack has a clear wind-up (the creature's Attack pose, an "Attacking!" tag on its word and a warning sound). Every word typed restarts the attack clocks, a defeat cancels a wind-up, and nothing attacks while its next word is still arriving.
- An enemy off screen hurries into view (at least 3.5× its speed and 7 m/s). Every walking enemy's path ends a couple of metres from the camera, so its hits land up close.
- **Spells** (each unlocked by a story moment):
  - **Spark Bolt:** every completed word.
  - **Frost Thread:** a perfect word slows the other enemies.
  - **Chain Spark:** every fifth perfect word in a row jumps to the next enemy.
  - **Starfall** (Level 2): every eighth perfect word in a row rains stars on every weak enemy.
  - **Bright Quill** (Level 3): a perfect word splashes colour and extra score.
  - **Shield Song** (Level 3): when HP is low, Mira offers a word that heals 25 and blocks the next hit, at most every 20 s.
- **Enemy behaviour:** a small data-driven state machine (appearing → active ⇄ wind-up/hit/recover → stunned → dispelling). Movement is authored per encounter (approach, patrol, orbit, static); nothing spawns at random. Bosses are a list of phases, each its own encounter.

## 11. Words

- Curated lists in `src/content/wordLists.ts`, tagged by difficulty, category and length; generated words never repeat within an encounter and avoid proper nouns and confusing early words.
- **Young typists** (`src/level/youngTypists.ts`): every level is trimmed when assembled so a 12 WPM child can finish. An ordinary fight is one wave of at most two monsters; a boss phase is at most two rounds of two targets (phrases kept whole); a sequence is two words (anchors and beacons three); armour has two words; a power-up wave three monsters; a stretch of rail two chase words.

## 12. State and saves

- Zustand holds coarse state only: the game mode and settings (`gameStore`, `settingsStore`) and the HUD's view of the run (`runStore`). The run itself (`GameRun`) is plain TypeScript and fully playable headless.
- **Autosave** at every beat start, wave, checkpoint and boss phase, on hiding the tab and on leaving the page. It stores a stable resume beat and wave, never live simulation state: a reload resumes at the start of the wave or boss phase. The save is written to a temporary key, validated, then promoted; the previous valid save is kept.
- On resume: a two-second area card, a short safe establishing moment, "Welcome back.", and Pip says the current goal. A beat removed in a later version resumes at the beat that replaced it (`BEAT_ALIASES`).
- The profile keeps completed levels, best results per level and cosmetics. Save data is versioned with a safe default for anything unknown.
- "Journey saved" shows briefly after a checkpoint.

### Results screen

Average and peak WPM, average word time, fastest word, active typing time, accuracy, first-attempt accuracy, correct, incorrect and corrected keys, perfect words, best streak, words completed, level time, optional words typed, HP lost, restarts, difficulty, new cosmetics, the score, medals, a positive rank title and two true, encouraging observations. No grades and no comparisons.

### Cosmetics

Wand trails: Starlight (Level 1, the East Hall chest), Inkwell (Level 2, the library shelves), Bright Quill (finishing Level 3).

## 13. Source layout

```text
src/app/        App and screens (title, game)
src/audio/      Howler sound effects, the music engine, text-to-speech voices
src/content/    strings, dialogue, word lists
src/game/       GameRun, saves, scoring, combo, medals, speed rounds, difficulty
src/level/      level registry, routes, area scripts (areas, areas2, areas3), encounter runner, rails
src/enemies/    enemy brains, creature models and stand-ins
src/player/     camera driver, wand, Pip
src/scene/      canvas, each area's scenery (areas, areas2, areas3), kit, materials, fire, sky, effects
src/spells/     spell effects, beam struggle, effects layer
src/state/      Zustand stores and settings
src/typing/     typing engine, word assigner, metrics
src/ui/         HUD, word labels, menus, results
src/dev/        the /dev/assets asset viewer
```

## 14. Visual quality and assets

The game uses a **stylised-realistic** look: believable shapes, weight and materials, softened and friendly for children. No crude low-poly or blocky art, no faceted humanoids, no chibi or voxel forms, no grimdark imagery.

### 14.2 How assets are made

- **Generate models; don't hand-build them from polygons.** Every visible creature, character or prop is made with Blender (`bpy` scripts run headless) and, for most models, the local AI pipeline: a Flux 2 concept image, then TRELLIS.2 shape and colour, then a Blender build that cleans, rigs, animates and exports it (`assets-src/scripts/ai/`; details in `BUILD_NOTES.md`). Code-built boxes, cylinders and planes are only for invisible helpers, ground and wall surfaces, effects, or a short-lived placeholder kept as the `ModelBoundary` fallback while the real model is made.
- CC0 assets (Poly Haven textures, HDRIs and models; recorded music) are allowed and recorded in `assets-src/cc0/sources.json` and `public/audio/music/CREDITS.md`.
- The scripts are the editable source; no `.blend` files are kept. Runtime assets are GLB in `public/assets/` (`characters`, `creatures`, `props`, `kit`).
- **Check every new model in the game from the camera's real view**, not only in its Blender previews (`assets-src/previews/`).

### 14.3 Modelling

Final visible meshes are joined, smoothed and shaded so they never read as primitives. Bake fine surface detail into a normal map where useful.

### 14.4 Materials

glTF PBR materials (base colour, normal, roughness, metallic, emissive for magic and eyes). Avoid noisy textures that shimmer at play distance. Bosses and heroes may use 2K textures; ordinary enemies and props 1K.

### 14.5 Animation

Movement shows weight, anticipation and recovery. Check for broken joints, sliding feet, intersections and floating. Looping clips start and end on the same pose; clips cross-fade. Every creature has Idle, Move, Attack, Hit and Dispel; bosses have their own Idle and Attack, and every boss moves differently. An Attack clip's wind-up is scrubbed by the gameplay wind-up, so the pose matches the warning.

### 14.6 Optimisation

Reduce hidden geometry first; keep silhouettes, faces, hands and joints. Use normal maps rather than excess geometry. Never decimate a deforming character without checking it animated.

### 14.7 Manifests and validation

Each asset has a manifest entry (`public/assets/manifests/*.json`, generated by `scripts/build-manifests.mjs`). `scripts/validate-assets.test.mjs` checks that every GLB loads, has normals and finite transforms, has its required animations, has a plausible size and a word anchor above it, stays within the §15 budgets and exports no cameras or lights, and that every prop the scenes use exists. `/dev/assets` is the asset viewer: orbit, clips, wireframe, lighting, LOD, collider, anchor, bounds and triangle and material counts.

### 14.8 Acceptance

A model is done when it reads clearly in silhouette, convinces at its nearest camera distance, moves without broken joints, has distinct materials, shows its face, attack and defeat clearly, suits children, and holds the frame rate.

## 15. Performance

- The target is Edge or Chrome on a capable GPU at 60 fps. Firefox and low-end laptops are out of scope.
- Medium quality by default; Low turns off shadows and lowers the pixel ratio.
- At most four ordinary enemies at once (six light targets in exceptional scenes), one shadow-casting sun, bounded particles, few lights (switching a light on or off recompiles every material).
- Triangle budgets: ordinary enemy 18–35k, mini-boss 35–70k, final boss 60–110k, friendly character 30–60k, hero prop 8–30k, small prop up to 4k; a visible scene normally under 500–800k after culling.
- Areas stream: the current area is mounted, the previous one stays briefly, and the next one is mounted hidden ahead of time.

## 16. Audio

- Separate volumes: master, music, sound effects, interface, voices. The game is playable muted.
- **Sound effects** are synthesised (`scripts/generate-audio.mjs`): key clicks varied in pitch, a soft mistake cue, word and spell sounds, the perfect-word chime, wind-ups, defeats, checkpoints and more.
- **Music** is recorded CC0 tracks mapped to story moods (`MusicEngine`): light-hearted in Level 1, darker in Level 2, sinister in Level 3, and battle themes whenever something can cause damage. It ducks under dialogue.
- **Voices:** lines are spoken by the browser's text-to-speech, each character with its own voice, pitch, rate and loudness. A line is never cut short: lines queue and each finishes. A line carries on over the next walk or fight, but a camera move waits at its end when the next scene brings lines of its own, so speech never drifts out of its scene. Enter or Space skips a line.

## 17. Testing

- **Unit tests** (`npm run test`): typing, metrics, difficulty, word assignment, saves and migration, scoring, combo and medals, routes and content integrity, story and line checks, asset validation, and headless full playthroughs of every level at every difficulty (including save, reload and resume without double counting, and the 12 WPM pacing report).
- **Browser tests** (`npm run test:e2e`, Playwright in Edge): the title, the tutorial, locking and combat, pausing, checkpoints and resume, difficulty change, the final boss and results, a full Level 1 run with no console errors, and the campaign unlocking.
- Before calling a change done: run the tests, typecheck, lint and build, and look at the change in the running game.

## 20. Working on this project

1. Inspect the repository before changing it; reuse its patterns.
2. State a short plan, then make the changes.
3. Strict TypeScript; avoid `any`. Do not invent package APIs.
4. Keep the build passing after each change; run tests, typecheck, lint and build after material changes.
5. Report exactly what changed and what was tested. Never claim a test passed without running it.
6. Add tests for bug fixes and game-rule changes.
7. Deterministic encounter scripts, never random spawning.
8. Generate models rather than hand-building them (§14.2), and check them in the game.

### Commands

```bash
npm run dev
npm run test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```

## 21. Out of scope

Multiplayer, accounts or cloud saves, leaderboards, free roaming, touch controls, voice recognition, generative AI inside the game, user word lists, purchases, procedural levels, more than one wand, inventories, character creation, dialogue trees, WebGPU-only features.

## 22. Creative direction

```text
A bright first day at an original magical academy,
a night of defending it,
and a journey into a world of erased things to set it right,
seen through the apprentice's eyes,
with satisfying wand effects,
clear and forgiving typing combat,
cinematic travel between encounters,
and a complete beginning-to-end adventure.
```

Priorities, in order: typing readability and correctness; child-friendly usability; stable progression; satisfying audiovisual feedback; performance; visual detail.
