# CLAUDE.md — Spellcaster Academy: The Broken Ward

Game-wide rules for every level: format, audience, technology, engineering, controls, typing, combat, content, state, asset pipeline, performance, audio, testing and working practice.

Level content lives in separate design documents:

- `LEVEL1_DESIGN.md` — Level 1: First Day, First Spell (built)
- `LEVEL2_DESIGN.md` — Level 2: The Siege of Asterfall
- `LEVEL3_DESIGN.md` — Level 3: Into the Unwritten (finale)

Section numbers are unchanged from the original single-file specification, which code comments still cite. Sections 6, 7, 14A, 18 and 19, plus the LD, MD and GD sections, were Level 1 content and now live in `LEVEL1_DESIGN.md`.

`BUILD_NOTES.md` records the build history and the owner's decisions. Where an owner decision conflicts with this file or a level document, the owner decision wins (see §5).

## 1. Project Mission

Build a polished, child-friendly, browser-based **first-person 3D typing adventure** for players around age 10.

The player follows a directed, cinematic route through an original magical academy, encounters fantasy creatures, and casts spells by typing words accurately. The game is a **first-person on-rails typing shooter**: camera movement, travel, staging, and target presentation are authored by the game, while **typing—not aiming or navigation—is the primary player skill**.

The game is a campaign of three levels (§5). Each level must be a complete playable on-rails level, not a single-room prototype. The **whole game takes 30–45 minutes** on a first playthrough at the **Fast** travel speed (owner decision, §5): about 10–13 minutes for Level 1, 10–15 for Level 2 and 12–17 for Level 3. Each includes cinematic travel, new mechanics introduced gently, multiple encounters, short story pauses, optional targets, checkpoints, collectibles, a mid-level set piece and a boss finale. No level may become an open world, a free-roaming hub, a maze or a walking simulator.

### Non-negotiable design principle

> Present the action like an FPS, but control it like an on-rails typing shooter: the game moves and aims the camera; the player observes, chooses targets through typing, and casts spells.

When typing combat begins, movement slows or pauses, camera motion is reduced, and the game assists with targeting.

---

## 1A. Authoritative On-Rails Format

This requirement overrides any wording elsewhere that could imply free exploration.

### Format

- The game is an **on-rails first-person typing shooter**, inspired structurally by arcade rail shooters.
- The player does not freely roam the academy.
- The player does not control normal locomotion, jumping, strafing, or precise mouse aiming during the level.
- The game controls the player's position, facing direction, camera path, stops, pans, transitions, and encounter staging.
- The camera travels along authored splines or between authored camera nodes.
- At combat stops, the camera automatically frames valid targets and uses subtle cinematic pans to reveal threats.
- The player's main controls are typing, target selection through typed initials, optional target cycling, interaction choices, pause, and settings.
- The path must always serve the story and cannot become lost, blocked, or navigationally ambiguous.

### Moment-to-moment loop

```text
Cinematic camera travel
→ story event or environmental reveal
→ camera stops and frames an encounter
→ enemies enter from authored positions
→ player types words to cast spells
→ short reaction or dialogue beat
→ camera automatically continues along the route
```

### Player agency without free roaming

Agency should come from:

- Choosing which visible threat to type first
- Accuracy, speed, streaks, and spell outcomes
- Optional side targets and collectibles visible during travel
- Brief two-choice route moments that rejoin the same main story
- Optional bonus words during safe pauses
- Difficulty and accessibility settings

Route choices must be explicit, short, and controlled. They do not create an open world. For example, the player may type `library` or `garden` at one junction; both are authored sequences and later rejoin before the tower.

### Camera comfort

- Use smooth, authored acceleration and deceleration.
- Avoid constant head bob, sudden roll, rapid spins, and uncontrolled camera shake.
- Pause camera travel while the player is actively typing unless a deliberately slow scripted move has been tested for readability.
- Give the player a reduced-motion option that shortens pans, removes head bob, reduces shake, and uses fades for fast repositioning.
- Never move the camera in a way that makes the active word hard to read.
- Do not simulate walking continuously when a short cinematic transition or fade would be more comfortable.

### Prohibited gameplay

Do not implement:

- WASD free movement during the story level
- Free-look mouse aiming as a combat requirement
- Platforming
- Searching rooms to find the correct exit
- Physics puzzles requiring navigation
- Backtracking through completed areas
- Open hubs inside any level
- Enemies attacking from behind without an automatic camera reveal
- Collectibles that require leaving the rail path

A separate non-story asset viewer or optional celebration diorama may allow orbit-camera inspection, but every playable level remains on rails.

## 1B. Keeping It Exciting (attention rules)

Owner feedback (2026-10-04): playtesters found Level 1 boring. The audience is 8–10-year-olds with short attention spans. These rules apply to every level and override any calmer pacing elsewhere in the specification.

### The 7-second rule

With the travel speed set to **Fast**, the player should never go more than about **7 seconds** without at least one of the moments below. Fast is the reference setting for this rule. At Normal (1.6× against Fast's 2.4×) the same route stretches to about 10.5 seconds, and at Slow (1×) to about 17 seconds, which suits players who choose a calmer pace.

- something to type
- something exploding, crashing, bursting or transforming on screen
- a new enemy entrance
- a reveal (a creature, a boss or a dramatic view)

At 7 seconds the game is close to continuous action:

- **Travel:** ordinary camera travel is never enough on its own. Every travel segment longer than 7 s at Fast needs spark gems, a bonus target or a scripted action moment along it, spaced no more than about 7 s apart.
- **Dialogue:** dialogue never stops the action. Lines play over typing or over an action moment. A beat with no typing at all has at most one short line.
- **Tutorials:** freezes such as the first counter-word are fine, because the player has something to type immediately.
- **Exceptions:**
  - Boss introductions may run up to **8 s at Fast** without typing. They must use the name card, camera move and roar, and the boss's first target appears as the card fades.
  - The ending cinematic of each level is exempt, but keeps lines short and skippable.
- **Measurement:** the gap check counts from the moment a typeable prompt disappears to the moment the next one appears. Story dialogue between fights is **at most two short lines** and plays over camera travel.

### Every word should feel powerful

- **Hit-stop:** a 40–60 ms freeze on the target when a word completes.
- **Impact:** a punchy impact sound, a burst of sparks, and a small camera kick. The kick is kept small and never moves the active label.
- **Size:** spells grow visibly bigger with the streak — a thin bolt at 0, a thick bolt at 3, a blazing comet at 5+.
- **Defeats:** enemies are knocked back, spin, crash, burst or shatter. Nothing just fades out.
- **Popups:** "PERFECT!", "x3 COMBO!", "SUPER!" and "UNSTOPPABLE!" pop near the target with a bounce, for streaks of 3, 5, 8 and 12. They are short, bright, and never cover the next word.
- **Score:** the score counts up visibly, with a combo multiplier that grows with the streak and resets kindly (a mistake halves it rather than zeroing it).

### Big moments

- **Boss intros:**
  - A dramatic camera move to the boss, then a full-width name card (for example "THE GREAT GRIMOIRE"), a music sting, and the boss roaring or rearing up.
  - Bosses show a **boss health bar** at the top of the screen that drops chunkily with each word.
- **Set pieces:** every level has at least three set pieces where the camera **moves fast on rails** while the player types slow-paced targets. Speed comes from the camera and scenery; the typing load stays light. Examples: a chase, a slide, a fall, a ride, a collapsing floor. The camera still pauses or slows for long words (§1A comfort rules still apply).
- **Surprise entrances:** enemies burst through windows, drop from ceilings, smash through doors or erupt from the ground, always revealed by the camera before they can attack (MD-1).
- **Destruction:** spells and boss attacks visibly smash scenery — crates, vases, statues, glass, shelves. Debris is cosmetic and cleared between encounters.

### Rewards every minute

- **Bonus pickups:** floating **spark gems** appear often along the rail. Each has a 2–4 letter word and gives score and a satisfying chime. Several per minute of travel.
- **Optional speed rounds:**
  - Short bonus challenges with a visible countdown, for example "SPEED ROUND: 5 words in 10 seconds!". They give big score and a medal.
  - Never required, and never a fail state.
  - On Gentle the countdown is generous.
- **Encounter medals:** every encounter ends with a quick **star rating** (1–3 stars) based on accuracy and speed, with a fanfare. There are no letter grades. Even 1 star is celebrated, and 3 stars gets a bigger fanfare.
- **Unlock moments:** new spells are announced like power-ups: a slow-motion beat, a big title card, and a first use against a wave of easy enemies so the player feels the power.

### Keep the story short and funny

- Pip gets most lines, and most of them are jokes or excitement. Lore goes into collectibles (star pages, Memory Pages) rather than dialogue.
- **The two-line rule:** no conversation beat has more than two lines without the player typing something.
- Characters should be in danger and need rescuing — Pip grabbed by a creature, Mira cornered. Rescues are quick, exciting typing moments.

### Music and sound

- Music is always present and usually energetic. Calm music is used only for short breathers of 20 seconds or less.
- Every attack has a clear wind-up sound, and every defeat a satisfying burst sound.

## 2. Intellectual Property and Audience Rules

This is an **original fantasy game**. Do not use or imitate protected characters, locations, terminology, insignia, music, dialogue, or visual designs from Harry Potter, One Piece, Roblox, Dragon Ball, Naruto, or other franchises.

Allowed broad inspirations include:

- Magical schools
- Wizard apprentices
- Fantasy libraries
- Enchanted gardens
- Elemental spells
- Friendly rivalries
- Colourful anime-style energy effects

The tone must be:

- Appropriate for children aged 8+
- Adventurous and exciting. Level 1 is bright and gentle. Levels 2 and 3 deliberately escalate into dramatic peril so that an 8–10-year-old can tell at once the stakes have changed:
  - fire and red-lit skies
  - burning buildings and smoke
  - menacing enemies
  - explosive spell effects
- Scary is fine (owner decision, §5): creatures may snarl, bare fangs, have glowing eyes and loom large, in every level. Never show gore, blood, realistic weapons, injury to people, or death.
- Defeated enemies may burst into embers, shatter, crash or be sealed away, but they never bleed or suffer.
- Free of gore, realistic violence, gambling, loot boxes, advertisements, and manipulative monetisation
- Encouraging when the player makes mistakes

Enemies are magical constructs, mischievous creatures, animated objects, and shadow-like fantasy beings. Defeated enemies dissolve into harmless sparkles, flee, or return to an inactive form.

---

## 3. Required Technology

Use a conventional, LLM-friendly stack.

### Core stack

- **TypeScript** with strict mode
- **React**
- **Vite**
- **Three.js**
- **React Three Fiber**
- **@react-three/drei**
- **@react-three/rapier** for physics and collision
- **Zustand** for central game state
- **Howler.js** for audio
- **Vitest** for unit tests
- **Playwright** for critical browser-flow tests
- CSS Modules or a small global CSS system for UI styling

### Rendering

- Use the stable **WebGL renderer** for the initial release.
- Do not introduce WebGPU, custom renderers, or complex post-processing.
- Use glTF/GLB for 3D assets.
- Prefer simple materials, baked detail, limited real-time lighting, and restrained shadows.

### Do not introduce without explicit instruction

- Next.js
- Redux
- An ECS framework
- A custom physics engine
- Babylon.js
- Unity or Godot exports
- Multiplayer or networking
- A backend or authentication
- Procedural level generation
- Custom shader frameworks
- Microservices

Use `localStorage` for settings, checkpoints, unlocked content, and best scores.

---

## 4. Engineering Principles

1. Keep systems small, explicit, and independently testable.
2. Prefer plain TypeScript functions and classes for game rules.
3. Use React for composition, screens, menus, and HUD—not for per-frame simulation state.
4. Use `useFrame`, refs, and imperative Three.js updates for frequent transforms.
5. Never call React state setters every frame.
6. Keep temporary combat values out of global state unless the HUD or another system needs them.
7. Separate typing logic from rendering and enemy behaviour.
8. Avoid premature abstractions.
9. Do not add dependencies for functionality that can be implemented clearly in fewer than roughly 100 lines.
10. Keep all user-facing text in a central content module to support later localisation.
11. Any generated placeholder asset must be easy to replace without changing gameplay code.
12. Preserve keyboard focus and prevent browser shortcuts only while gameplay is active.

---

## 5. Product Definition and Campaign

### Title

**Spellcaster Academy: The Broken Ward**

### The three levels

| Level | Title | Setting | Finale |
| --- | --- | --- | --- |
| 1 | First Day, First Spell | Asterfall Academy on the apprentice's first day; the celestial ward cracks | The Ward Warden (misunderstood protector) |
| 2 | The Siege of Asterfall | The academy at night, burning under a red sky, under attack by the Hush and their inkfire | The Vellum Wyrm, a fire-breathing dragon of stolen library pages |
| 3 | Into the Unwritten | The Blank, a scorched realm of ash under a red sky, leading to the Unwriter's burning stronghold | The Unwriter, the game's final villain |

### Visual tone across the campaign

- **Level 1:** bright and peaceful (gold, blue and green).
- **Level 2:** a night siege lit by fire. Red and orange inkfire against the dark is the dominant colour, with the gold of the beacons pushing it back.
- **Level 3:** a red sky over scorched grey lands, and the villain's stronghold of black iron, molten red ink and roaring fire.

Fire, embers, smoke and red light are the visual signal that the game has turned serious. They must be dramatic, but must never cover the active word (word labels keep their dark backing, §9).

### Overall story

Centuries ago Magister Corvane Hale, Asterfall's greatest archivist, came to believe that mistakes should not exist. He made the Unwriting Quill, which writes in fire: whatever it strikes out burns away to grey ash and is unwritten. First he erased his own errors, then anything he judged imperfect. The founders sealed him and everything he had erased beyond the celestial ward, in a realm of blank paper and grey pencil lines called the Blank. They built the Ward Warden to guard the seal. Over the centuries he became the Unwriter.

- **Level 1:** the Unwriter tests the seal and the ward fractures. The apprentice, Pip and the Warden repair it, but a hairline seam remains.
- **Level 2:** on the night of the Lantern Festival the seam tears open over Lantern Lake into a blazing red Rift. The Unwriter's Hush army pours in and sets the academy alight with inkfire, which burns whatever it touches to grey ash. The apprentice relights the four beacons that raise an emergency Lantern Ward, rescues students, and defeats the Vellum Wyrm on the Moon Tower roof. At its heart lies a shard of the Unwriting Quill. Keeper Orin recognises Corvane's work, and Pip glitches at the sight of it. The rift cannot be closed from this side.
- **Level 3:** the apprentice, Pip, Mira and the Warden cross into the Blank: a scorched land of ash under a red sky, with fires that never go out. Typing quenches the fires and restores colour to the world as they travel. Their goal is the Unwriter's stronghold, the **Cinder Citadel**. On the way they learn that Pip was Corvane's own guide orb, which he tried to erase for "being wrong too often". At the Throne of Blank Pages they face the Unwriter.
  - In an all-out battle the apprentice breaks the Unwriting Quill with a final spell of six words about mistakes being how we learn.
  - The Unwriter is defeated and sealed inside his own blank book, which Pip slams shut.
  - The fires of the Blank die and its stolen colours and places return home. The apprentice is named Asterfall's first Wardkeeper in a hundred years, and the credits roll.

Victories in Levels 2 and 3 are decisive and dramatic. Enemies are beaten, shattered, sent crashing or sealed away, but never killed or harmed on screen (§2).

### Campaign rules

- Levels unlock in order. Each level saves and resumes independently, following the autosave rules in `LEVEL1_DESIGN.md` LD-5 and LD-6, which apply to every level.
- The title screen keeps two primary options, START and RESUME:
  - RESUME continues the in-progress level.
  - START begins the next level that hasn't been completed, or Level 1 if none has been completed. When an autosave exists, START asks for confirmation first, as in LD-5.
- A secondary **Chapters** icon lists unlocked levels so completed ones can be replayed.
- Results are per level. After Level 3 the results screen adds a campaign summary covering all three levels.
- Settings, cosmetics, collectibles and best results persist across levels. Spells unlocked in a level are available from the start of the next level.

### Owner decisions that override this specification

These come from playtests and are recorded in `BUILD_NOTES.md`. They apply to every level:

- **Pace:** brisk, with no dead pauses. The old "fast" travel speed is now "normal". Camera pans are quick, and dialogue overlaps travel. Enter or Space skips a line.
- **Never skip a word (2026-10-06):** no word ever disappears on a timer. Chase, bonus and gem words hold the camera at the end of its move until they are typed, and a wave waits for every word it has shown.
- **Speech (2026-10-06):** typing never cuts a spoken line; a line stops only when it ends naturally or when the next scene's line is due. Lines belong to their scene: older queued lines are dropped when a new scene speaks, and a line that cannot start within 4 seconds is dropped rather than said late. Every character has their own voice.
- **Off-screen mobs (2026-10-06):** a mob that is off screen hurries in (3.5× speed) so it appears within about 1–2 seconds.
- **Speed rounds (2026-10-06):** the countdown runs only while its words are on screen, and its prompt goes as soon as the round ends.
- **Voice and music:** lines are spoken aloud by the browser's text-to-speech, and the music softens under dialogue. The music switches to battle themes whenever something can cause damage.
- **HP:** Focus is shown to players as **HP**. On Gentle, HP is unlimited and the HP bar is hidden.
- **Removed settings:** reduced motion, reduced shake, reduced particle effects, high-contrast word panels and the dyslexia font. Do not reintroduce them unless the owner asks.
- **Platforms:** low-end laptops and Firefox are out of scope; the target is Edge/Chrome on a capable GPU.
- **Word presentation:** new words fly in from the centre of the screen. The locked target shows a TARGET tag, other targets show a Tab hint, and Tab works mid-word.
- **HUD:** a level progress bar with chapter marks. Pip is labelled "Guide Orb".
- **Length:** the whole game takes 30–45 minutes at Fast (2026-10-04).
- **Scary mobs:** mobs may look scary (fangs, snarls, glowing eyes, menacing poses), in Level 1 too; kids "can handle a lot" (2026-10-04). No gore, blood or injury.

---


## 6A. Rail and Encounter Architecture

Every level is implemented as a deterministic sequence of rail segments, story beats, and combat stops. Each level document gives its own story rail.

### Core data model

```ts
type LevelBeat =
  | RailTravelBeat
  | CameraRevealBeat
  | DialogueBeat
  | CombatBeat
  | TypingInteractionBeat
  | RouteChoiceBeat
  | CheckpointBeat
  | LoadingTransitionBeat
  | ResultsBeat;
```

Each beat defines:

- Stable identifier
- Entry and exit camera node or spline position
- Camera duration and easing
- Look-at targets
- Dialogue and subtitle triggers
- Enemy spawn cues
- Combat completion condition
- Optional collectible windows
- Audio cues
- Checkpoint behaviour
- Reduced-motion alternative

### Camera rails

- Use authored Catmull–Rom splines or explicit camera-node interpolation.
- Store camera position and look target separately so framing can be art-directed.
- Support pause points, reveal pans, dolly movement, fades, and instant reduced-motion cuts.
- Camera rails are not physics-driven.
- Combat starts only after the camera reaches its defined combat pose.
- Combat completion releases the next beat after a short authored delay.

### Encounter director

The Level Director owns progression. Enemies cannot independently advance the story. Every encounter has explicit start, wave, completion, recovery, and exit states.

```text
Pending → CameraEntering → Intro → Active → Resolving → Complete
```

---

## 8. Core Controls

The story level must be playable primarily from the keyboard.

```text
Letter keys       Type the active target word
Backspace         Correct current input
Tab               Cycle visible valid targets when not locked
Left / Right      Choose an offered route or story option
Enter             Confirm an interaction or continue a story pause
Space             Optional quick-confirm where shown
Escape            Pause / release pointer lock if currently used
Mouse             Menus only; optional nonessential look offset during safe pauses
```

There is no normal WASD movement, jump control, strafing, or manual FPS aiming in any level. Do not make pointer lock mandatory. If a small mouse-look offset is offered during safe cinematic pauses, it must automatically recenter before action resumes and must not reveal otherwise inaccessible gameplay targets.

### Targeting

- The camera automatically presents enemies inside a readable combat composition.
- Typing a unique initial locks the corresponding enemy.
- `Tab` cycles targets for accessibility but is never required when unique initials are available.
- The game can briefly pan between target groups, but it must not move the active target off-screen.
- Off-axis threats receive a clear indicator and are automatically revealed before they can attack.

### Accessibility control options

- Adjustable cinematic camera sensitivity only if optional look offset exists
- Reduced motion
- Reduced camera shake
- Reduced particle effects
- Font-size options
- High-contrast word panel
- Dyslexia-friendly font option using an openly licensed asset
- Audio volume categories
- Full-screen toggle
- Adjustable travel speed between encounters
- Auto-continue or press-to-continue story pauses

## 9. Typing System Specification

The typing engine must be a framework-independent TypeScript module with unit tests.

### Required behaviour

- Accept printable alphabetical keys.
- Normalise uppercase input to lowercase for matching.
- Ignore modifier-only keypresses.
- Do not count `Shift`, `Control`, `Alt`, `Meta`, function keys, or navigation keys as mistakes.
- Support Backspace.
- Prevent browser find/quick-search behaviour during gameplay where appropriate.
- Track correct characters, incorrect characters, corrected mistakes, elapsed typing time, and completed words.
- Derive accuracy and WPM from documented formulas.
- Clear the active buffer when a target is cancelled or defeated.
- Never read keystrokes while a menu, text field, or settings screen is active.

### Target selection

1. Filter to alive, visible, targetable enemies.
2. Prefer candidates within the central screen region.
3. Match the entered first character against candidate word initials.
4. Word assignment should avoid duplicate initials among simultaneously active enemies.
5. If duplicate initials are unavoidable, use screen proximity and require the second character before fully locking.
6. Once locked, input goes only to that target until completion, cancellation, or defeat.

### Word presentation

Display words in HTML UI projected near the enemy, rather than relying exclusively on text rendered inside WebGL.

Word styling states:

- Completed prefix: gold or green
- Current character: underlined/highlighted
- Remaining characters: high-contrast light text
- Mistake flash: warm orange, not harsh red
- Targeted word: visible outline and subtle scale increase

The active word must remain readable even when the associated enemy is partially off-screen. Clamp its label to safe screen margins and provide a small directional indicator.

### Difficulty modes

#### Gentle

- Mostly 3–5 letter words
- Enemies move slowly
- Generous targeting
- Time slows heavily while typing
- Mistakes do not damage the player

#### Standard

- Mostly 4–7 letter words
- Moderate enemy speed
- Time slows while typing
- Accuracy affects spell strength

#### Challenge

- Mostly 5–9 letter words
- Less time slowing
- More simultaneous targets
- Still no graphic violence or punitive messaging

Difficulty can be changed at checkpoints without restarting the level.

---

## 10. Combat and Player Rules

### Player focus

Use **Focus** instead of health.

- Maximum Focus: 100
- Enemy contact or a telegraphed magical hit reduces Focus.
- At zero Focus, show a short calming reset animation and restart the current encounter or boss phase.
- Checkpoint progress and collectibles remain saved.

### Spell rules

#### Spark Bolt

- Default spell for a completed word
- Gold-blue projectile from wand to target

#### Frost Thread

- Triggered by completing a word with no mistakes
- Briefly slows nearby untargeted enemies

#### Chain Spark

- Triggered after five perfect words
- Harmless energy arcs automatically strike up to two additional weak enemies

Spell effects must not obscure the next word for longer than 250 ms.

### Enemy behaviour

Use simple finite-state machines:

```text
Dormant → Appearing → Approaching → Attacking → Stunned → Dispelled
```

Bosses have separate explicit phase state machines.

Do not use a general-purpose behaviour-tree package.

---

## 11. Word Content

Create curated word lists as TypeScript or JSON content files.

Categories:

- Common objects
- Nature
- Colours
- Weather
- School
- Positive values
- Gentle fantasy
- Animals

Requirements:

- Age-appropriate vocabulary
- No profanity or mature topics
- Avoid ambiguous punctuation
- Avoid proper nouns in combat words
- Avoid visually confusing words during early encounters
- Tag every word with difficulty, category, and letter count
- Ensure simultaneous enemies can receive different first letters
- Do not select the same word twice in one encounter unless the pool is exhausted

Content for each level should include at least:

- 60 easy words
- 80 standard words
- 50 challenge words
- 12 short optional phrases or sentences

Later levels may add themed word sets (each level document lists them). Reuse is fine, but each level should feel fresh: aim for at least 40% of words new to the level.

---

## 12. Game State

Use Zustand for coarse shared state only.

Suggested state:

```ts
type GameMode =
  | 'menu'
  | 'exploration'
  | 'combat'
  | 'dialogue'
  | 'paused'
  | 'results';

type Difficulty = 'gentle' | 'standard' | 'challenge';

type LevelId = 'level-1' | 'level-2' | 'level-3';

// Checkpoint ids are defined per level in its design document and namespaced by level in saves,
// e.g. Level 1: 'arrival-gate' | 'courtyard-restored' | ... | 'level-1-complete'.
type CheckpointId = string;
```

Persist:

- Settings
- Highest unlocked checkpoint
- Level completion
- Best results
- Collectibles
- Cosmetics
- Tutorial completion flags

Do not persist live enemy objects, Three.js references, physics handles, timers, or active key buffers.

Version the save data and provide a safe migration/default path.

---

## 13. Suggested Source Layout

```text
src/
├── app/
│   ├── App.tsx
│   ├── routes.ts
│   └── screens/
├── audio/
│   ├── AudioManager.ts
│   └── audioCatalog.ts
├── content/
│   ├── dialogue.ts
│   ├── level1Content.ts
│   ├── wordLists.ts
│   └── strings.ts
├── game/
│   ├── GameDirector.ts
│   ├── checkpoints.ts
│   ├── difficulty.ts
│   ├── saveData.ts
│   ├── scoring.ts
│   └── types.ts
├── level/
│   ├── Level1.tsx
│   ├── Level1Director.ts
│   ├── areas/
│   ├── encounters/
│   └── triggers/
├── player/
│   ├── RailCameraController.tsx
│   ├── PlayerFocus.ts
│   └── Wand.tsx
├── enemies/
│   ├── Enemy.tsx
│   ├── EnemyBrain.ts
│   ├── EnemyManager.tsx
│   ├── TargetingSystem.ts
│   └── bosses/
├── typing/
│   ├── TypingEngine.ts
│   ├── TypingSession.ts
│   ├── WordAssigner.ts
│   └── typingTypes.ts
├── spells/
│   ├── SpellSystem.ts
│   └── effects/
├── scene/
│   ├── GameCanvas.tsx
│   ├── Environment.tsx
│   ├── Lighting.tsx
│   └── QualityManager.ts
├── state/
│   ├── gameStore.ts
│   └── settingsStore.ts
├── ui/
│   ├── HUD.tsx
│   ├── EnemyWordLabel.tsx
│   ├── PauseMenu.tsx
│   ├── ResultsScreen.tsx
│   └── TutorialPrompt.tsx
├── utils/
└── test/
```

Keep files focused. Split files that become difficult to understand, but do not create a directory for every single component.

---

## 14. Visual Quality and Blender Asset Pipeline

The game must **not** use deliberately crude low-poly art, blocky placeholder characters in the final build, faceted humanoids, or visuals reminiscent of early 3D games. Geometry may be optimised for the browser, but final characters and hero props must have smooth, convincing silhouettes, physically plausible materials, believable proportions, and natural animation.

### 14.1 Target visual style

Use a **stylised-realistic fantasy** direction:

- Believable anatomy, weight, cloth, stone, wood, foliage, and metal
- Slightly softened, friendly facial and creature proportions suitable for children
- Realistic surface response and movement without photorealistic skin detail
- Controlled colour palette with warm academy interiors, rich natural greens, moonlit blues, and gold magical energy
- Moderate geometric and texture detail viewed from first-person gameplay distances
- Smooth silhouettes on faces, hands, joints, curved architecture, and creatures
- No visible polygon faceting on hero characters or objects near the camera
- No oversized chibi heads, voxel forms, block characters, or toy-like primitive assemblies in final assets
- No grimdark imagery, gore, decayed anatomy, exposed organs, or frightening facial distortion

The quality reference is a modern, polished, stylised 3D adventure—not photorealism and not retro low-poly. The player should believe the academy and its creatures have physical presence.

### 14.2 Required production method

Claude should create and revise assets with **Blender Python scripts using `bpy`**, executed in headless mode where possible. Store source scripts and editable `.blend` files in version control or reproducible build storage.

```text
assets-src/
├── briefs/
├── scripts/
│   ├── shared/
│   │   ├── materials.py
│   │   ├── rigging.py
│   │   ├── animation.py
│   │   ├── geometry.py
│   │   ├── uv.py
│   │   └── export.py
│   ├── characters/
│   ├── creatures/
│   ├── environments/
│   ├── props/
│   └── build_all.py
├── blend/
├── textures/
└── previews/

public/assets/
├── characters/
├── creatures/
├── environments/
├── props/
├── animations/
└── manifests/
```

Typical command:

```bash
blender --background --python assets-src/scripts/build_all.py
```

Export runtime assets as `.glb`. Keep `.blend` files as editable sources, not runtime files.

### 14.3 Modelling method

For organic characters and creatures, Claude should use a proper staged workflow rather than assembling visible primitive shapes:

1. Build a proportioned base mesh with clean major forms.
2. Use subdivision or multiresolution while shaping smooth anatomy.
3. Sculpt secondary forms such as muscles, folds, bark, leaf masses, eyelids, and facial planes.
4. Retopologise to animation-friendly topology with deformation loops around shoulders, elbows, hips, knees, neck, mouth, and eyes.
5. UV unwrap with sensible island density and minimal stretching.
6. Bake high-resolution normal and ambient-occlusion detail to the runtime mesh when useful.
7. Create PBR textures and materials.
8. Rig with named bones and tested deformation.
9. Animate using reference-informed key poses, arcs, overlap, anticipation, contact, and follow-through.
10. Export to GLB and validate inside the game, not only inside Blender.

Procedural scripts may use primitives as hidden construction inputs, but the final visible mesh must be joined, shaped, smoothed, retopologised, and shaded so it does not read as primitive geometry.

### 14.4 Materials and textures

Use glTF-compatible PBR materials based on Principled BSDF. Prefer authored or procedurally baked texture maps over flat material colours on characters and hero assets.

Expected texture channels:

- Base colour
- Normal
- Roughness
- Metallic where relevant
- Ambient occlusion where useful
- Emissive for magic, eyes, runes, and ward energy

Guidelines:

- Use subtle colour variation, edge wear, weave, grain, pores, veins, leaf variation, and dirt appropriate to the asset.
- Avoid noisy procedural textures that shimmer at gameplay distance.
- Skin and creatures should use restrained roughness variation; do not attempt expensive subsurface-scattering effects for the browser MVP.
- Metal should read as metal through correct metallic and roughness values, not merely grey colour.
- Glass should be used sparingly and tested for sorting and performance.
- Atlas minor props where practical.
- Hero characters and bosses may use 2K texture sets; normal enemies and prominent props should normally use 1K; small repeated props should use 512 px or atlases.

### 14.5 Rigging and realistic movement

Natural movement is mandatory. Animation should communicate weight, balance, intent, and contact with the floor.

Every animated asset must be checked for:

- Foot sliding
- Knee and elbow popping
- Shoulder collapse
- Intersections between body, clothing, and equipment
- Unnatural constant-speed motion
- Missing anticipation and recovery
- Abrupt animation transitions
- Floating above or sinking into the floor
- Wand or prop misalignment
- Incorrect root motion

Use a conventional humanoid rig for human characters and purpose-built rigs for creatures. Use IK during authoring for planted feet and hands, then bake deformation animation for export. Use constraints only if their results are correctly baked into exported actions.

Animation clips should begin and end on compatible poses when looping. Locomotion speed in the game must be matched to stride length. Use cross-fades between clips in Three.js.

If automated animation does not meet the acceptance checks, Claude must revise the rig, weights, curves, or timing rather than hiding the defect with camera distance.

### 14.6 LOD and optimisation without retro visuals

Optimisation must preserve the intended modern look.

- Create LOD0, LOD1, and LOD2 for normal creatures and major NPCs where beneficial.
- Reduce hidden and internal geometry first.
- Preserve silhouettes, faces, hands, joints, and large material boundaries.
- Use smooth shading and weighted normals where appropriate.
- Use normal maps for secondary detail rather than retaining excessive geometry.
- Never use aggressive decimation on a deforming character without checking animation deformation.
- Use impostors only for distant, noninteractive background elements.
- Use separate simple physics colliders; do not use render meshes as colliders.

### 14.7 Asset manifest and validation

Every runtime asset needs a JSON manifest containing:

```json
{
  "id": "mossling",
  "file": "/assets/creatures/mossling.glb",
  "unitScaleMeters": 1,
  "animations": ["Idle", "Walk", "Attack", "Hit", "Stunned", "Dispel"],
  "collision": {
    "shape": "capsule",
    "radius": 0.38,
    "height": 0.92
  },
  "wordAnchor": [0, 1.55, 0],
  "lodFiles": [
    "/assets/creatures/mossling_lod0.glb",
    "/assets/creatures/mossling_lod1.glb",
    "/assets/creatures/mossling_lod2.glb"
  ],
  "textureSet": "mossling_1k",
  "license": "original-project-asset"
}
```

Automated checks must verify:

- File exists and loads
- Meshes have normals and valid finite transforms
- Required animations are present and non-empty
- Scale and bounding box are plausible
- Word anchor is above the visible asset
- Triangle, material, bone, and texture budgets are respected
- Textures are present and use supported formats
- No unintended cameras or lights are exported
- No duplicate hidden meshes are included
- The asset renders correctly in the R3F asset viewer

Create a `/dev/assets` browser route with orbit controls, animation switching, neutral and game lighting, wireframe view, LOD switching, collider display, word-anchor display, bounding-box measurements, triangle counts, and material counts.

### 14.8 Asset acceptance gates

An asset is not complete merely because it exports. It must pass:

1. **Silhouette check:** recognisable in flat black from front, side, and three-quarter views.
2. **Close gameplay check:** convincing at its nearest expected camera distance.
3. **Motion check:** no visible foot sliding or broken joints at normal and half speed.
4. **Material check:** wood, cloth, foliage, stone, skin, paper, and metal are visually distinct.
5. **Readability check:** enemy face, attack pose, target state, and defeat state are readable during gameplay.
6. **Child-suitability check:** appealing or mysterious, never grotesque.
7. **Performance check:** maintains the scene budget on the target laptop.
8. **Export check:** looks materially consistent between Blender and Three.js.

## 15. Performance Budget

Target desktop and laptop browsers with physical keyboards.

Goals:

- 60 FPS on a typical modern laptop
- Graceful 30+ FPS on lower-end integrated graphics
- Initial playable download ideally below 60 MB, with later areas streamed or loaded between zones
- Maximum four normal active enemies for most encounters
- Maximum six lightweight targets in exceptional scenes
- One primary shadow-casting directional light, with carefully budgeted local lights
- Minimal transparent overdraw
- No unbounded particle emitters
- Pool frequently created projectiles and particles
- Preserve smooth silhouettes and convincing materials by using LODs, texture atlases, normal maps, instancing, and area-based loading—not by making nearby assets visibly crude

Suggested runtime budgets:

```text
First-person arms and wand:  35k–70k triangles, 2K textures
Friendly hero NPC:           30k–60k triangles, 2K textures
Normal organic enemy LOD0:   18k–35k triangles, 1K textures
Normal enemy LOD1:           8k–18k triangles
Normal enemy LOD2:           2k–6k triangles
Mini-boss LOD0:              35k–70k triangles, up to 2K textures
Final boss LOD0:             60k–110k triangles, up to 2K textures
Hero environment prop:       8k–30k triangles
Small repeated prop:         300–4k triangles
Visible scene target:        normally below 500k–800k rendered triangles after culling and LOD
Skinned characters visible:  normally 5 or fewer
```

Budgets may be adjusted after profiling, but quality changes must be verified in the asset viewer and gameplay camera.

Quality presets:

- Low: no dynamic shadows, reduced particles, lower pixel ratio
- Medium: limited shadows and particles
- High: full intended effects, capped pixel ratio

Automatically select Medium initially and allow manual override.

---

## 16. Audio Requirements

Use separate volume controls for:

- Master
- Music
- Sound effects
- Interface sounds

Required feedback:

- Soft click for correct character
- Gentle muted cue for an incorrect character
- Rising tone for word progress
- Satisfying spell completion
- Distinct perfect-word cue
- Chain Spark cue
- Enemy approach telegraph
- Checkpoint chime
- Boss phase transition sound

Repeated key sounds should vary slightly in pitch or sample to avoid fatigue.

The game must remain playable with all audio muted.

---

## 17. Testing Requirements

### Unit tests

At minimum, test:

- Correct character entry
- Incorrect character entry
- Backspace correction
- Completion detection
- Case normalisation
- Ignored modifier keys
- Accuracy calculation
- WPM calculation
- Duplicate-initial target handling
- Word assignment constraints
- Difficulty filtering
- Save-data defaults and migration
- Checkpoint progression
- Score calculation

### Integration tests

Test:

- Starting each level from the menu (and the next level unlocking after completion)
- Completing the on-rails interaction tutorial
- Locking a target by typing
- Completing a combat encounter
- Reaching and restoring an anchor
- Saving and loading a checkpoint
- Pausing during exploration and combat
- Changing difficulty at a checkpoint
- Losing focus and restarting the current encounter
- Completing the final boss
- Showing the results screen

### Manual checks

Before marking any level complete:

- Play using Gentle difficulty at deliberately slow typing speed.
- Play using Standard difficulty with intentional mistakes.
- Complete the on-rails level without audio.
- Complete the level with reduced effects.
- Resize the browser and verify word labels remain readable.
- Move browser focus away during an encounter and recover cleanly when focus returns.
- Switch tabs during an encounter and return safely.
- Refresh at every checkpoint.
- Confirm no section requires simultaneous precision movement and typing.

---

## 20. Instructions for Claude When Coding

When responding to an implementation request:

1. Inspect the existing repository before proposing changes.
2. State a short implementation plan, then make the changes without requesting confirmation unless essential information is missing.
3. Reuse established project patterns.
4. Do not replace working architecture merely because another approach is fashionable.
5. Use strict TypeScript and avoid `any`. If unavoidable at an external boundary, isolate and document it.
6. Do not invent package APIs. Inspect installed versions and type definitions when uncertain.
7. Keep code compilable after each change.
8. Run relevant tests, type checking, linting, and production build after material changes.
9. Report exactly what was changed, what was tested, and any remaining limitation.
10. Never claim a test passed unless it was executed successfully.
11. Add tests for bug fixes and pure game-rule changes.
12. Preserve accessibility and child-friendly behaviour.
13. Prefer deterministic encounter scripts over random spawning in every level.
14. Do not add placeholder TODOs for requested core behaviour; implement the smallest complete version.
15. If final art is unavailable, use a clearly labelled geometric placeholder and continue implementing gameplay.

### Commands

Use the package manager already present in the repository. Typical commands are:

```bash
npm run dev
npm run test
npm run test:e2e
npm run typecheck
npm run lint
npm run build
```

Do not change package managers during the project.

---

## 21. Out of Scope

Do not add these to the game. Also do not start building a level until the previous one meets its definition of done.

- Multiplayer
- Accounts or cloud saves
- Leaderboards
- Open-world or free-roaming exploration
- Mobile touchscreen controls
- Voice recognition
- Generative AI inside the game
- User-generated word lists
- Purchases or monetisation
- Procedural dungeons
- More than one playable wand type
- Complex inventory systems
- Character creation
- Dialogue trees
- WebGPU-only features

---

## 22. Final Creative Direction

The desired experience is:

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

Prioritise, in this order:

1. Typing readability and correctness
2. Child-friendly usability
3. Stable level progression
4. Satisfying audiovisual feedback
5. Performance
6. Visual detail

A polished, complete level is better than an unreliable attempt at photorealism. However, final art must still meet the stylised-realistic quality bar: smooth silhouettes, believable materials, carefully authored animation, and no retro low-poly appearance.
