# LEVEL1_DESIGN.md — Level 1: First Day, First Spell

Authoritative content specification for Level 1 of Spellcaster Academy: The Broken Ward.

Game-wide rules (on-rails format, audience, technology, typing system, combat rules, asset pipeline, performance, testing) live in `CLAUDE.md`. Owner decisions made during development, which override this document where they conflict, are recorded in `BUILD_NOTES.md`. Levels 2 and 3 are specified in `LEVEL2_DESIGN.md` and `LEVEL3_DESIGN.md`.

Section numbers are kept from the original single-file specification so that references in code and notes (for example §14A.19, LD-11, MD-6 and GD-18) stay valid. Where the LD, MD and GD sections conflict with the earlier numbered sections, the LD, MD and GD sections take precedence.

---

## LD-0. Excitement Revision (2026-10-04)

Owner feedback: **Level 1 is quite boring.** This section rewrites the slow parts of Level 1 to meet the attention rules in `CLAUDE.md` §1B. Where it conflicts with LD-7 to LD-18 or with §7, **this section wins**.

Level 1 keeps its bright, sunny look; the drama comes from action, comedy, speed and spectacle, not fire (fire starts in Level 2). The story beats, anchors, bosses and checkpoints stay the same, so saves and the route structure keep working.

### What was boring, and the fix

| Problem in the current Level 1 | Fix |
| --- | --- |
| Long opening before the first typing | The first word appears within 7 seconds of START at Fast |
| Stationary training dummies | Dummies leap off their stands and charge |
| East Hall and Hall of Portraits are calm walks | Both become action sequences |
| Long dialogue stops | Two lines at most, played over travel |
| Enemies appear and wait politely | Surprise entrances, smash-throughs and chases |
| Little feedback per word | Hit-stop, combo popups, growing spells, score and medals (§1B) |
| Bosses start quietly | Name cards, health bars and dramatic entrances |

### Rewritten sequences

#### Opening (replaces LD-7)

1. **Fly-over:** a fast swoop over the treetops towards the academy, with the title card. **Spark gems** float in the air along the swoop from the first second (`go`, `fly`, `zap`, `sky`), with Pip's first line: "Type it! Quick!"
2. **Cold open:** about 4 seconds in, a **mischief sprite snatches Pip right out of the air**. Pip squeals, and the camera dives after them. The sprite carries a word; typing it makes the sprite drop Pip.
3. **The gate:** the camera lands at the Arrival Gate. The three crystal words (`star`, `moon`, `open`) **blast the gate doors open** with an explosion of light and flying leaves.

The first typeable word appears within about 2 seconds of the level starting.

#### Arrival Gate fracture (shortens LD-8)

- The ward fracture plays at full drama during the gate passage:
  - The sky cracks with a thunderclap.
  - Pieces of the gold dome fall like shooting stars, crashing into the hills.
  - The Warden appears for one second on the tower, silhouetted against lightning.
- Orin's warning is one line. Pip's reaction is one line.

#### Courtyard (revises LD-9)

- **C1:** the three dummies **leap off their stands** and hop towards the player. They are still harmless, but now each one has a word and a charge.
- **Rooftop chase:** after C2, the sprite carrying the star page runs across the rooftops. The camera chases it along the arcade roof in a fast rail move while the player types two quick words. Catching it gives the star page.
- **Warden sighting:** the Warden **lands in the courtyard with a crash** for two seconds, scattering dust and pigeons, raises its arm at the anchor, then leaps away. Pip's "I think" gag stays.
- **Anchor:** each anchor word fires a beam. The final word makes the anchor blast a pillar of light into the sky, with the camera looking up and a power-up card for Spark Bolt.

#### East Hall (replaces LD-10): the Book Stampede

- No calm walk. Mira bursts through a door at a run, chased by **a stampede of runaway books**.
- **The chase:** the camera **runs backwards down the corridor** beside her (a fast rail move) while books swoop in. Each book gets a 3–4 letter word.
- **Dialogue:** short lines shouted mid-chase: "You're the new apprentice?!" / "Terrible first day, though!" The Pip and Mira banter is two lines, played while running.
- **The chest:** an optional **speed round**: "Open the chest: 3 words in 8 seconds!" Success bursts it open with a fanfare (the Starlight trail).
- **End:** the chase ends by slamming the library doors on the last books. Mira gives her "the Warden looked worried" line in one breath.

#### Library (revises LD-11)

- **L1:** books dive-bomb from the galleries. A whole shelf topples in slow motion after wave 2 (cosmetic) and spills a swarm of books.
- **L2:** ink wisps **burst up out of an overturned inkwell** like a geyser.
- **Clue scene:** the mosaic beat is cut to one line ("The Warden protects the ward... it's asking for help!"). The rest of the lore moves to the lore card.
- **Grimoire intro:**
  - The chains snap one by one with sparks.
  - The Grimoire rises, roars a gust of pages that blows out the lamps, and the name card appears: **THE GREAT GRIMOIRE**.
  - Boss health bar.
- **G2:** paper gusts now **smash furniture** across the room (cosmetic), with clear telegraphs.
- **G3:** the final sentence becomes a **beam struggle**. Each word pushes a beam of light against the Grimoire's storm of pages, and on the last word the Grimoire is blasted back onto its pedestal.

#### Hall of Portraits (replaces LD-12): the Paint Ambush

- No longer a rest stop. The portraits **come alive and leap out of their frames** as cheeky **paint imps**: harmless splashy creatures with 3–4 letter words that throw paint splats at the screen.
  - The splats are telegraphed and cost a little HP on Standard.
  - The screen-edge paint they leave never covers a word.
- **Portrait gags:** the "ceiling became a whale" lines stay as quick shouted gags from the frames mid-fight.
- **Fountain:** the healing fountain arrives **after** the ambush as a short breather with healing-droplet spark gems to catch, and Mira's mirror call (one line) over it.
- **Constellations:** the challenge becomes a **speed round** for the score multiplier.

#### Greenhouse (revises LD-13)

- **Vine bridge, the Snapvine Chase:** typing the bridge words grows the bridge **while a giant snapping vine-plant lunges behind the player**. Each word moves the camera forward, out of reach, just in time. It is scripted and never a fail: it always just misses.
- **H1 and H2:** thorn pods **burst up out of the soil** with a shower of dirt, and mosslings **charge in a stampede**.
- **Warden scene:** the glass roof panel **shatters**. The Warden smashes through the glass above, catches the falling sheet in one hand, sets it down and leaps away, all in four seconds.

#### Lower Stairwell (replaces LD-14): the Banister Slide

- The apprentice and Pip **ride a tea tray down the spiral stair banister**. It is fast and fun, and the camera spirals down smoothly with no full spins per §1A.
- The three armour guardians step out onto the landings ahead. Each command word (`stand`, `honour`, `yield`) must be typed before the tray reaches them, as an authored slowdown with a generous window that never fails: the guardian simply leaps aside at the last moment if the word isn't finished.
- **Landing 3:** the malfunctioning guardian **falls apart and re-assembles** in front of the player, then the short three-word fight.

#### Practice Gallery (revises LD-15): the Arcade

- The gallery becomes a **target-range arcade**:
  - targets pop up and spin
  - a score board in an HTML frame
  - medal fanfares per zone
  - an optional final **speed round** with a local best score to beat on replay
- Mira's lines are cut to the minimum. Pip commentates like a sports announcer: "And the apprentice goes for the COMBO!"

#### Moon Tower (revises LD-16)

- The climb becomes a **runaway lift ride**. A brass lift rockets up the tower shaft while mosslings and ink wisps leap at it from passing floors. The lift pauses at each floor for its fight, then rockets on.
- **Floor 3:** the armour guardian **smashes through the floor** of the lift landing.

#### Observatory (revises LD-17)

- **Intro:**
  - The dome **splits open with a boom**, the ward energy storms overhead, and the Warden rises with a roar of light.
  - Name card **THE WARD WARDEN** and boss health bar.
- **W1 and W2:** plates **blast off** the Warden and orbit; light arcs **scorch** clear floor telegraphs. Pip's lines stay at one each.
- **W3:** the six value words become a **beam struggle against the fracture**. The ward cracks spread across the dome while the player's beams push them back word by word. On the last word, the ward re-seals with a huge flash and a shock wave.
- The Warden still bows: it was never the villain. That twist stays, because it sets up Levels 2 and 3.

#### Ending (shortens LD-18)

- The celebration starts with **fireworks** over the courtyard. The dialogue is four lines at most, then straight to results with the medal summary.

### Pacing budget

The rewrite aims at about **10–13 minutes at Fast** for a first play (the whole game is 30–45 minutes at Fast, CLAUDE.md §1). Every area must follow the 7-second rule in §1B. Measure this in the Playwright bot run with travel speed set to **Fast**: log the longest gap between typing prompts per area. Any gap over 7 s at Fast is a bug, except boss intros (up to 8 s) and the ending.

### Implementation notes

- **Routes:** route changes live in `src/level/areas/*.ts`. Beat ids should be preserved where possible so existing saves resume sensibly. New beats get new ids.
- **New shared systems** (also used by Levels 2 and 3):
  - hit-stop and impact feedback
  - combo popups and the score counter
  - encounter medals
  - spark-gem pickups
  - optional speed rounds
  - boss name cards and health bars
  - fast-rail set-piece support (camera speed curves with typing slowdowns)
- **New assets:**
  - paint imps
  - the giant snapvine
  - the tea tray (first-person hands holding the rim)
  - the runaway lift
  - the fireworks VFX
  - cosmetic debris pieces (crates, vases, shelf books, glass shards)
- **Tests:** unit-test speed-round timing and medal thresholds, combo multiplier rules (a mistake halves it), and the 7-second gap metric helper.
- **Status (2026-10-04):** built. Every sequence above is in the game; see `BUILD_NOTES.md` for the details and the placeholder assets still to be replaced with Blender models.

---

## 5. Level 1 Definition

### Level 1 title

**First Day, First Spell**

### Player fantasy

The player is a new apprentice arriving for their first day. A magical ward protecting the academy has fractured, causing training dummies, enchanted books, garden sprites, and a discarded suit of armour to become unruly. The player travels across the academy grounds, restores three ward anchors, and seals the broken ward at the Moon Observatory.

### Level objective

Restore three ward anchors:

1. Courtyard Anchor
2. Library Anchor
3. Greenhouse Anchor

Then reach the observatory and defeat the **Ward Warden** boss.

---

## 6. Level 1 Structure

Level 1 is a continuous **authored on-rails sequence** through connected areas. The camera transports the player automatically. Loading between major areas is permitted, but transitions should feel like one continuous story journey through the academy.

### Full route

```text
Arrival Gate
  → Sunlit Courtyard
  → East Hall
  → Whispering Library
  → Hall of Portraits
  → Enchanted Greenhouse
  → Lower Stairwell
  → Practice Gallery
  → Moon Tower Ascent
  → Observatory Boss Arena
  → Celebration Courtyard
```

### Recommended pacing

```text
0–3 min     Arrival, movement and interaction tutorial
3–6 min     First typing encounters and Courtyard Anchor
6–10 min    Library exploration and Mini-boss
10–15 min   Greenhouse encounters and Greenhouse Anchor
15–19 min   Practice Gallery mixed challenge
19–24 min   Tower ascent and final boss
24–25 min   Results, rewards, and return to menu
```

Do not require speedrunning. A slower child must be able to complete the level without a timer.

---

## 6A. Level 1 Story Rail

The rail and encounter architecture itself is game-wide (`CLAUDE.md` §6A).


```text
Arrival Gate tutorial
→ automatic gate passage
→ Courtyard encounter and first anchor
→ East Hall character scene
→ Library encounters and Great Grimoire
→ Portrait Hall recovery scene
→ Greenhouse encounters and third anchor
→ Stairwell armour sequence
→ Practice Gallery mastery sequence
→ Moon Tower ascent
→ Ward Warden boss
→ automatic return to Celebration Courtyard
→ results
```

The player cannot revisit previous areas during a run. Checkpoint restart places the camera at the beginning of the relevant authored sequence.

## 7. Detailed Area Design

### 7.1 Arrival Gate — Safe Tutorial Zone

**Purpose:** Teach the on-rails presentation, typing interaction, target selection, and pausing.

Environment:

- Bright academy entrance
- Banners with original moon-and-star symbols
- Friendly floating guide orb named **Pip**
- Closed gate that opens after the tutorial

Tutorial sequence:

1. The camera automatically glides through the gate approach and pauses at Pip.
2. Pip points toward three glowing objects while the camera frames each one.
3. Type three short prompted words to activate the objects.
4. Use `Tab` once to demonstrate optional target cycling.
5. Press `Enter` to interact with Pip and continue.
6. Open and close the pause menu with `Escape`.
7. The gate opens and the camera automatically travels into the courtyard.

No enemies appear here.

Checkpoint: **Arrival Gate**

Acceptance criteria:

- Instructions adapt if the player has already completed the on-rails interaction tutorial.
- The player can reopen control instructions from the pause menu.
- The gate cannot trap the player.

---

### 7.2 Sunlit Courtyard — Typing Tutorial and First Anchor

**Purpose:** Introduce target selection, typing, accuracy, enemy waves, health, and the first anchor.

Environment:

- Central fountain
- Training circles
- Benches and planters
- Four navigable sides, but exits remain locked until the encounter ends

Encounter A: Training dummies

- Three stationary enchanted dummies
- Words contain 3–4 lowercase letters
- Only one dummy activates at a time
- Examples: `sun`, `map`, `star`, `book`, `moon`

Teach:

- Looking toward a target
- Typing the displayed word
- Correct-letter feedback
- Backspace behaviour
- Spell completion

Encounter B: Mischief sprites

- Three slow enemies approach one at a time, then two together
- Active enemies must be assigned words with unique first letters
- Words contain 3–5 letters
- Typing the first valid letter locks a target

Anchor event:

- The courtyard ward anchor has three cracked runes.
- Completing three short words repairs it.
- Restoring it unlocks **Spark Bolt** and opens the East Hall.

Checkpoint: **Courtyard Restored**

Collectibles:

- 2 hidden star pages
- 1 optional plaque with a short typing fact

---

### 7.3 East Hall — Exploration and Low-Pressure Practice

**Purpose:** Give the player a breathing-room story sequence and teach interactions outside combat.

Features:

- Lockers or alcoves
- Doors that briefly display destination names
- A friendly student NPC represented by a simple stylised model
- Optional typing interaction to open a charm-locked chest

Chest challenge:

- Type three untimed words
- Reward: cosmetic wand trail colour stored in `localStorage`

No mandatory combat. The camera moves slowly through the hall, pauses at the NPC and chest, then continues automatically. Include ambient movement and distant magical effects to make the academy feel alive.

---

### 7.4 Whispering Library — Second Anchor and Mini-Boss

**Purpose:** Introduce moving targets, environmental hazards, longer words, and shielded enemies.

Environment:

- Two floors connected by stairs
- Bookshelves create readable paths but never form a confusing maze
- Floating books circle above the central reading area
- Falling-book effects are visual only and cannot damage the player

Encounter A: Runaway books

- Books move laterally or hover in place
- 4–6 letter words
- The targeting system should favour the enemy nearest the crosshair
- Enemies pause briefly when targeted to maintain readability

Encounter B: Ink wisps

- Two or three slow wisps approach from different aisles
- One wisp may have a shield icon
- Shielded enemies require two words: one to break the shield and one to dispel the enemy

Mini-boss: **The Great Grimoire**

Phases:

1. **Closed Cover:** Type three 4–5 letter words to unlock its clasps.
2. **Flying Pages:** Type four 5–6 letter words while dodging slow, clearly telegraphed paper gusts.
3. **Final Sentence:** Complete one short sentence assembled word-by-word. Punctuation is not required.

Suggested final sentence:

```text
bright minds make strong magic
```

On defeat, the grimoire settles safely onto a pedestal.

Anchor event:

- Restore the Library Anchor using four words.
- Unlock **Frost Thread**, a blue spell effect awarded for 100% accuracy on a word.

Checkpoint: **Library Restored**

Collectibles:

- 3 star pages
- 1 lore card about Pip

---

### 7.5 Hall of Portraits — Rest and Story Transition

**Purpose:** Prevent encounter fatigue and introduce the next objective.

Features:

- Original animated magical portraits; no references to existing franchises
- The portraits use brief, optional text bubbles rather than spoken dialogue
- A fountain fully restores player focus/health
- Pip explains that vines have trapped the Greenhouse Anchor

During an authored camera pause, offer this optional challenge:

- Type the names of three fictional constellations shown on plaques
- Reward: bonus score multiplier for the next encounter

No mandatory enemies.

---

### 7.6 Enchanted Greenhouse — Third Anchor

**Purpose:** Introduce environmental interactions, enemy priority, and accuracy streaks.

Environment:

- Large glass roof
- Bright magical plants
- Two connected greenhouse chambers
- Clear central path with optional side areas

Environmental typing:

- Withered bridge-vines display short words.
- Completing each word grows a safe walkable vine bridge.
- Missing a letter has no punishment except losing the perfect-word bonus.

Enemies:

- Thorn pods: stationary ranged enemies with 4–6 letter words
- Mosslings: slow melee enemies with 3–5 letter words
- Pollen puffs: harmless distractions that briefly obscure part of the view but never cover the active word

Encounter design:

- Prioritise thorn pods before mosslings reach the player.
- Never spawn more than four active enemies.
- Active words must remain readable against the background.

Anchor event:

- The anchor is wrapped in three vine knots.
- Each knot uses a themed word set: weather, plants, and colours.
- Restoring it unlocks **Chain Spark**, triggered after five perfect words.

Checkpoint: **Greenhouse Restored**

Collectibles:

- 3 star pages
- 1 hidden wand-trail cosmetic

---

### 7.7 Lower Stairwell — Transition Challenge

**Purpose:** Combine movement with short, separated typing actions without demanding both simultaneously.

The camera descends a broad spiral stairwell along an authored path. Animated armour pieces block three landings.

For each landing:

1. The camera arrives at a safe marked position.
2. Movement is gently locked.
3. A 5–7 letter word appears on the armour.
4. The player completes the word.
5. The armour bows and steps aside.
6. Automatic camera travel resumes.

This section teaches the rhythm later used in the tower ascent.

---

### 7.8 Practice Gallery — Mastery Arena

**Purpose:** Test all mechanics learned so far in a controlled, non-boss arena.

Environment:

- Long duelling hall
- Three marked encounter zones
- Doors close per zone and reopen after success

Zone 1: Accuracy

- Five enemies, one at a time
- Completing four words with 90%+ session accuracy passes the zone
- There is no hard failure; lower accuracy simply adds another practice enemy

Zone 2: Target priority

- One slow strong enemy and two fast weak enemies
- Unique initial letters are mandatory
- The HUD marks the closest threat but does not force the target

Zone 3: Streak

- Build a five-perfect-word streak to demonstrate Chain Spark
- After three failed attempts, Pip enables assist mode and reduces words to 3–4 letters

Reward:

- Maximum focus/health restored
- Final checkpoint before the tower

Checkpoint: **Practice Gallery Complete**

---

### 7.9 Moon Tower Ascent — Pre-Boss Sequence

**Purpose:** Create spectacle and tension without exhausting the player.

Structure:

- Three short circular floors
- One combat encounter per floor
- A brief safe landing between floors

Floor 1:

- Three mosslings
- Simple 4–5 letter words

Floor 2:

- Two shielded ink wisps
- Two words per enemy

Floor 3:

- One animated armour guardian
- Three 6–7 letter words
- No timer

At the roof door, Pip offers:

- Continue
- Review controls
- Change difficulty
- Return to the Practice Gallery checkpoint

Checkpoint: **Observatory Door**

---

### 7.10 Observatory — Final Boss

Boss: **The Ward Warden**

Visual design:

- An original floating stone-and-light guardian
- Large readable silhouette
- Glowing cracked core
- No human face and no frightening body horror

Arena:

- Circular observatory
- Clear floor
- Starry magical dome
- Four safe positions around the arena
- The camera remains first-person

Boss phases:

#### Phase 1 — Outer Shell

- Boss displays five 4–6 letter words, one at a time.
- Each completed word removes one armour plate.
- Boss attacks are slow arcs of light with clear floor telegraphs.
- While the player types, movement pauses and the targeted attack timer slows substantially.

#### Phase 2 — Orbiting Runes

- Three runes orbit the boss.
- Each has a word with a unique first letter.
- The player looks toward a rune and begins typing to lock it.
- Completing all three exposes the core.
- Repeat for two rounds with 5–7 letter words.

#### Phase 3 — Repair the Ward

This is a constructive finale rather than a violent finishing move.

- The boss becomes inactive while the cracked ward fills the dome.
- The player types six words representing academy values.
- Suggested words: `brave`, `focus`, `learn`, `kind`, `create`, `wonder`
- Correct words send beams from the wand to repair the ward.
- The Warden returns to normal and bows.

Boss failure behaviour:

- The player cannot lose permanent progress.
- If focus/health reaches zero, restart at the beginning of the current phase.
- After two failed attempts, offer assist mode automatically.
- Never shame the player or label the attempt a failure.

Checkpoint after completion: **Level 1 Complete**

---

### 7.11 Celebration Courtyard and Results

Move the player automatically back to a decorated courtyard for the ending sequence.

Show:

- Level time
- Words completed
- Accuracy percentage
- Best word streak
- Approximate words per minute
- Star pages found, e.g. `6 / 8`
- New cosmetic unlocks
- A positive rank title

Suggested rank titles:

```text
Getting Started
Careful Caster
Bright Apprentice
Swift Spellcaster
Master of the First Ward
```

Do not use letter grades. Always provide at least one specific positive message, such as:

```text
Your accuracy improved during the final battle!
```

Buttons:

- Replay Level
- Replay Celebration Sequence
- Return to Main Menu

---

## 14A. Level 1 Asset Design Bible

Claude must follow these briefs when creating Level 1 assets. Minor interpretation is allowed, but the core silhouette, materials, scale, animation set, and child-friendly tone must remain consistent.

### 14A.1 Player first-person arms and wand

**View:** visible constantly at close range; consequently this needs the highest polish.

**Design:**

- Two age-neutral apprentice forearms and hands wearing a deep navy robe with warm brown leather cuffs.
- Realistic hand proportions, softly stylised to avoid uncanny detail.
- Five properly separated fingers with deformation topology suitable for gripping and spell gestures.
- Robe sleeves have layered cloth folds, stitched cuff edges, subtle weave normal detail, and a small original star-thread motif.
- Wand is approximately 32 cm long, made from warm walnut wood, gently tapered, with a twisted silver inlay ending in a small moonstone-like crystal.
- Wand must be original and not resemble a recognisable prop from another franchise.

**Materials:** skin, woven cloth, worn leather, walnut, tarnished silver, translucent/emissive crystal.

**Rig:** forearm twist bones, wrist, thumb, three finger segments per digit where practical, wand socket.

**Animations:**

```text
FP_Idle
FP_Walk
FP_Run
FP_Jump
FP_Land
FP_Cast_Spark
FP_Cast_Frost
FP_Cast_Chain
FP_Interact
FP_HitReaction
FP_FocusReset
```

Casting must include anticipation, a clear forward action, and recovery. Hands must never intersect the camera or visibly detach from sleeves.

### 14A.2 Pip, the guide orb

**Scale:** approximately 24 cm diameter.

**Design:**

- A floating brass astrolabe-like device with three thin rotating rings around a warm opalescent core.
- Small hinged fins suggest expressive eyebrows or ears without forming a human face.
- The inner light changes from warm gold to blue-white when explaining magic.
- Surfaces show fine engraved constellations, slight tarnish in recesses, and polished contact edges.
- Movement should feel curious and alive through orientation, height changes, and ring motion.

**Animations:**

```text
IdleHover
Greet
Point
Encourage
Concerned
Celebrate
LeadForward
```

Hovering must include subtle inertia and overlap; it must not move like a perfectly linear UI icon.

### 14A.3 Friendly apprentice NPC

**Scale:** approximately 1.45 m tall.

**Design:**

- A friendly student around the player's implied age, with a non-specific, inclusive appearance.
- Practical academy robe, tunic, trousers, ankle boots, book satchel, and an original embroidered moon-and-leaf badge.
- Natural stylised facial planes, believable eyes and eyelids, groomed hair cards or carefully modelled stylised hair clumps.
- Avoid exaggerated anime anatomy and avoid photorealistic skin pores.

**Animations:**

```text
Idle
Wave
TalkShort
PointHallway
ReadBook
Celebrate
```

Facial movement may use a small number of blend shapes: blink, smile, mouth-open, brow-up. Dialogue does not require lip-sync in Level 1.

### 14A.4 Training dummy

**Scale:** 1.65 m tall.

**Design:**

- Articulated hardwood practice figure on a weighted stone base.
- Wrapped canvas torso, leather joint straps, brass hinge pins, painted circular ward target on the chest.
- Worn but well maintained, with chipped varnish only at believable impact points.
- Silhouette resembles a sparring mannequin rather than a human enemy.

**Animations:**

```text
Dormant
Wake
Idle
ReactLight
ReactHeavy
Reset
Deactivate
```

Reactions should transfer force through the torso and base with diminishing overlap.

### 14A.5 Mischief sprite

**Scale:** 55 cm tall when upright.

**Design:**

- Small woodland magical creature with a lemur-like body plan, long expressive ears, dexterous hands, leaf-shaped tail tuft, and large but anatomically seated eyes.
- Fine mossy fur represented through groom cards or baked texture/normal detail, not millions of strands.
- Russet-brown body with teal bioluminescent freckles and translucent leaf membranes on the ears.
- Appealing and cheeky, not babyish.

**Animations:**

```text
Idle
Skitter
Approach
Taunt
AttackPounce
Hit
Stunned
Dispel
```

Locomotion should include planted hands and feet, spine flexion, and tail follow-through.

### 14A.6 Runaway enchanted book

**Scale:** 35–50 cm along its longest edge.

**Design:**

- A substantial leather-bound book with embossed brass corners, layered page block, stitched spine ribs, clasp, and subtle animated runes.
- Cover opens like wings, with pages flexing in grouped sections rather than as rigid blocks.
- Several colour variants share one rig and animation set.

**Animations:**

```text
ClosedIdle
WakeOpen
Hover
FlyForward
PageGust
Hit
Stunned
SettleClosed
```

Flight needs banking, lift anticipation, and page drag. It must not translate like a static mesh.

### 14A.7 Ink wisp

**Scale:** 0.9–1.2 m tall depending on pose.

**Design:**

- A floating magical being made of dark indigo ink suspended inside a faint translucent membrane.
- Suggest a narrow upper torso, trailing lower body, two tapered arms, and two soft cyan eye lights.
- Edges curl into calligraphic tendrils; avoid skulls, hollow faces, or horror imagery.
- Core body should be a deforming mesh; secondary wisps may use restrained particles or ribbon trails.

**Animations:**

```text
Form
IdleFloat
Glide
CastInk
ShieldUp
ShieldBreak
Hit
Dissolve
```

The body must compress before acceleration and trail afterward. Shield is a separate luminous rune disc.

### 14A.8 The Great Grimoire mini-boss

**Scale:** approximately 1.4 m wide when open.

**Design:**

- Massive ancient reference book with burgundy leather, reinforced brass spine, moonstone clasps, layered parchment, silk bookmarks, and restrained gold tooling.
- The cover bears an original circular diagram of stars and vines.
- Four articulated corner ornaments act like expressive limbs while hovering.
- Page edges are irregular and physically layered; use cards or grouped page geometry efficiently.
- It should feel imposing through scale and motion, not frightening.

**Rig:** cover, spine, grouped page sections, clasps, bookmarks, four corner ornaments.

**Animations:**

```text
DormantPedestal
Awaken
HoverIdle
ClaspStrain
ClaspBreak
Open
PageVolley
PaperGust
Stagger
FinalSentence
SettlePedestal
```

The book must demonstrate believable hinge movement, page inertia, and heavy cover weight.

### 14A.9 Thorn pod

**Scale:** flower head approximately 55 cm across; total height 1.4 m.

**Design:**

- Rooted magical plant with layered burgundy petals surrounding a glowing amber seed chamber.
- Thick green stem, branching leaves, protective thorns, and visible root tension at the soil.
- Plant anatomy should be botanically plausible enough to feel grown rather than assembled.
- Attack telegraph: petals tighten, stem draws backward, amber chamber brightens, then a harmless energy seed launches.

**Animations:**

```text
Dormant
GrowUp
IdleSway
Aim
AttackSeed
Hit
Stunned
WiltDispel
```

Use secondary motion on leaves and petals, baked or driven safely at runtime.

### 14A.10 Mossling

**Scale:** approximately 1.05 m tall.

**Design:**

- A compact forest guardian with mammalian anatomy beneath thick moss and rooted bark armour.
- Broad shoulders, long forearms, short stable legs, small deer-like ears, amber eyes, and fern growth along the back.
- Hands have three thick fingers suitable for readable animation.
- Moss is represented with layered cards, textured clumps, and baked detail; body silhouette remains smooth.
- Bark armour follows anatomical planes rather than appearing as random boxes.

**Animations:**

```text
SleepCrouched
Rise
Idle
Walk
RunShort
AttackSwipe
AttackBump
Hit
Stunned
DispelToMoss
```

Movement should feel heavy but not slow-motion: planted feet, visible compression, shoulder-led turns, and fern overlap.

### 14A.11 Pollen puff

**Scale:** 30 cm core with a 70 cm soft pollen halo.

**Design:**

- Floating seed creature inspired by dandelion structure, with a small pale-green seed core and hundreds of implied fibres represented through layered transparent cards or clustered geometry.
- Two tiny reflective eyes provide charm without turning it into a cartoon face.
- It is harmless and curious.

**Animations:**

```text
FloatIdle
Drift
Startled
PuffRelease
Settle
```

Pollen particles must never obscure the target word and must respect reduced-effects settings.

### 14A.12 Animated armour guardian

**Scale:** approximately 2.05 m tall.

**Design:**

- Original ceremonial academy armour combining darkened steel, engraved brass trim, quilted navy underlayers, and a moon-shaped chest ward.
- Realistic plate construction at shoulders, elbows, hips, and knees so the figure can move without impossible intersections.
- Helmet has a closed, non-human visor with gentle blue internal light—no skull imagery.
- Surfaces show subtle brushed metal, edge polish, and old scratches.

**Animations:**

```text
DisplayStill
Assemble
IdleGuard
WalkHeavy
BlockPath
AttackSweep
Hit
Stunned
Bow
DisassembleSafe
```

Motion must communicate metal weight. Feet plant firmly; armour plates overlap and follow the body with small delayed movement and suitable metal audio.

### 14A.13 Ward Warden final boss

**Scale:** 3.6 m tall while fully assembled.

**Design:**

- A majestic floating protector built from carved pale stone armour segments held together by streams of gold-blue ward energy.
- Broad torso, long articulated arms, crown-like ring behind the head, and a faceless polished stone mask with a narrow warm light seam.
- Central chest core resembles a fractured celestial instrument, not an eye.
- Outer plates contain original star, wave, leaf, and book motifs representing academy study.
- Phase damage is shown by plates safely separating and orbiting, not breaking into violent debris.
- Final repaired form becomes symmetrical, calm, and warmly illuminated.

**Materials:** carved limestone, aged brass inlay, subtle marble veining, emissive energy, restrained translucent core layers.

**Rig and structure:** root, floating pelvis/core, segmented spine, shoulders, upper/lower arms, hands, head, halo ring, chest plates, six removable armour plates, three rune objects.

**Animations:**

```text
Dormant
Awaken
BossIdle
LightArcLeft
LightArcRight
GroundTelegraph
PlateRelease
Stagger
SummonRunes
RuneCycle
CoreExpose
WardFracture
WardRepair
CalmBow
ReturnToPost
```

Despite floating construction, its motion must have inertia and deliberate mass. Energy connections stretch and settle. Attack anticipation must be clear for a child.

### 14A.14 Ward anchor

**Scale:** 1.8 m tall.

**Design:**

- Triangular standing instrument combining a carved stone base, brass rotating rings, three crystal nodes, and a suspended central shard.
- Each location uses the same core design with small thematic differences:
  - Courtyard: sun motifs and warm sandstone
  - Library: book and constellation motifs with dark oak base details
  - Greenhouse: vine reliefs and green-veined stone
- Broken state has misaligned rings, dim crystals, and intermittent energy—not dangerous sparks.
- Repaired state rotates smoothly and emits a soft vertical light column.

**Animations:**

```text
BrokenIdle
RuneAccepted
RingAlign
NodeIgnite
FullyRestore
RestoredIdle
```

### 14A.15 Academy architecture kit

The academy should feel constructed by skilled craftspeople and used over many years.

**Architectural language:**

- Warm honey-coloured stone
- Dark oak doors and beams
- Aged brass fixtures
- Deep blue fabrics
- Pointed and rounded arches blended into an original style
- Star, leaf, wave, and book motifs
- Large windows admitting warm daylight or cool moonlight
- Real-world plausible stairs, railings, door heights, wall thicknesses, and structural supports

**Required modular pieces:**

```text
Wall_Stone_Straight_2m
Wall_Stone_Straight_4m
Wall_Stone_Window
Wall_Stone_Arch
Wall_Stone_Doorway
Column_Whole
Column_Half
Floor_Stone_2m
Floor_Stone_4m
Ceiling_Vault_Module
Stair_Straight
Stair_Spiral_Quarter
Railing_Stone
Railing_Brass
Door_Oak_Single
Door_Oak_Double
Door_MagicSeal
Arch_Transition
Trim_Base
Trim_Cornice
```

Each module must snap to a documented grid, have consistent texel density, use bevelled edges that catch light, and include LODs where repeated heavily. Architecture should use trim sheets and atlases where practical.

### 14A.16 Arrival Gate assets

Required hero assets:

- Tall wrought-brass and dark-oak academy gate with mechanical celestial lock
- Stone gatehouse walls and roof caps
- Original hanging academy banners with cloth thickness and baked folds
- Fallen banner pole for jump tutorial
- Three glowing orientation markers
- Exterior trees, hedges, path stones, lamps, and distant academy facade

The vista must imply a larger campus without modelling an entire city. Distant geometry may use lower detail and baked lighting.

### 14A.17 Sunlit Courtyard assets

Required assets:

- Central carved-stone fountain with shallow animated water
- Four training circles inset into paving
- Benches with wood slats and brass supports
- Stone planters containing believable shrubs and flowers
- Enclosed arcade modules
- Training dummies
- Courtyard Ward Anchor
- Decorative practice targets
- Star-page collectible hiding places

Use realistic paving variation and subtle dirt at edges. Avoid perfectly clean repeated tiles.

### 14A.18 East Hall assets

Required assets:

- Hallway wall and vaulted ceiling modules
- Student alcoves and notice frames
- Charm-locked oak chest with brass constellation lock
- Wall lamps
- Runner carpet with original geometric star-and-leaf pattern
- Book satchel and scattered benign student props
- Destination plaques with readable game UI overlays rather than baked text where localisation matters

### 14A.19 Whispering Library assets

Required assets:

- Two-storey bookshelf modules with believable shelf thickness and book variation
- Rolling ladder and upper gallery railing
- Reading tables, chairs, desk lamps, lectern, parchment, quills, and telescoping book stands
- Central Grimoire pedestal
- Library Ward Anchor
- Tall windows with dust-light atmosphere
- Stairs and clear navigational landmarks
- Book variants suitable for instancing

Bookshelves should look full but remain performant through atlases, instancing, and grouped book meshes. Do not create every book as a separate draw call.

### 14A.20 Hall of Portraits assets

Required assets:

- Ornate but original portrait frames in several proportions
- Painted portrait images depicting fictional academy figures
- Subtle animated portrait layers or separate head/eye meshes where used
- Restoration fountain
- Upholstered benches
- Wall sconces
- Constellation plaques
- Corridor carpet and end-window landmark

Portraits must not visually imitate recognisable characters or actors.

### 14A.21 Enchanted Greenhouse assets

Required assets:

- Iron-and-brass glazed frame modules
- Stone planting beds and moist soil
- Condensation and dirt variation on selected glass panes
- Vine bridge with growth animation
- Thorn pods, mosslings, and pollen puffs
- Greenhouse Ward Anchor
- Benches, pots, tools, watering devices, labels, trellises, and drainage grates
- At least eight plant families with distinct leaf shapes and colour variation

Foliage must combine modelled hero leaves with atlased cards for density. Avoid excessive transparency overdraw. Plants should have restrained ambient motion.

### 14A.22 Lower Stairwell assets

Required assets:

- Broad spiral stair modules
- Central stone column
- Brass handrails
- Tall slit windows
- Armour display plinths
- Three armour guardian variants distinguished by trim and pose
- Floor inlays marking safe typing circles

The stairs must use simple invisible ramp or step colliders that do not snag the player.

### 14A.23 Practice Gallery assets

Required assets:

- Long vaulted hall kit
- Wood-and-stone duelling floor
- Three distinct encounter-zone floor emblems
- Retractable brass-and-glass barriers
- Score display frame using HTML UI for changing text
- Practice targets and equipment racks
- Observation balcony silhouettes
- Focus-restoration pedestal

The gallery should feel prestigious and purpose-built, with excellent visibility and restrained background contrast behind word labels.

### 14A.24 Moon Tower assets

Required assets:

- Round tower wall modules
- Curved stairs and landings
- Moonlit windows
- Hanging celestial instruments
- Wall-mounted star maps
- Roof-door mechanism
- Distant campus backdrop
- Cloud and night-sky environment elements

The ascent should transition gradually from warm interior light to cool moonlight.

### 14A.25 Observatory assets

Required assets:

- Circular boss arena with engraved ward diagram
- Mechanical opening dome
- Large original telescope
- Orrery and celestial instruments
- Four clearly marked safe positions
- Boss entry structure
- Ward energy dome
- Distant stars and campus lights
- Repaired and fractured arena states

Floor patterns should support gameplay telegraphs rather than compete with them.

### 14A.26 Celebration Courtyard variants

Reuse the Courtyard architecture while adding:

- Fabric streamers with restrained cloth movement
- Floating lanterns
- Restored fountain lighting
- Friendly NPC silhouettes
- Small tables with academy refreshments
- Sparkle effects
- Visible restored Ward Anchor

Keep the results UI in HTML. Do not bake scores into 3D textures.

### 14A.27 Shared props and collectibles

**Star page:** thick parchment page with gold-leaf edge, embossed star seal, handwritten abstract marks, gentle fold deformation, and a restrained magical shimmer.

**Charm chest:** dark oak, brass straps, padded interior, rotating constellation lock, physically plausible hinges and lid weight.

**Focus fountain:** carved stone basin, clean animated water, suspended droplet effect, blue-white healing light.

**Academy lamp:** aged brass cage, frosted crystal, warm emissive core, wall and standing variants.

**Doors:** visible thickness, hinges and handles; opening animation with ease-in/ease-out and appropriate weight.

**Benches and furniture:** believable joinery, bevelled wear edges, roughness variation, and proper floor contact.

### 14A.28 Environmental animation and realism

Use limited, purposeful ambient animation:

- Tree branches and greenhouse foliage move with low-amplitude irregular wind.
- Hanging banners lag behind gust changes.
- Fountain water and ward energy loop without visible seams.
- Floating dust appears mainly in strong light beams.
- Doors accelerate and decelerate with weight.
- Books, equipment, and furniture do not hover or intersect floors.
- Background NPCs move on authored short paths rather than random jitter.

Physics simulation may assist authoring, but final repeatable actions should be baked where necessary for deterministic runtime behaviour.

### 14A.29 Visual consistency controls

Create shared Blender libraries or Python constructors for:

- Academy stone
- Dark oak
- Aged brass
- Navy robe cloth
- Ward gold-blue energy
- Moonstone crystal
- Greenhouse iron
- Parchment
- Book leather
- Creature eye materials

Use a shared scale convention: **1 Blender unit = 1 metre**. Document standard door, stair, railing, player-eye, desk, and creature dimensions. Generate neutral turntable previews for every unique asset under the same camera, background, and lighting so visual inconsistency is obvious.

## 18. Definition of Done for Level 1

Level 1 is complete only when all of the following are true:

- The player can start from the main menu and finish at the results screen.
- All ten listed areas exist and are connected through a coherent level flow.
- On-rails camera travel, interactions, combat stops, pause, and settings work.
- Three ward anchors can be restored.
- The library mini-boss is complete.
- The Ward Warden final boss has all three phases.
- Checkpoints persist across refreshes.
- Gentle, Standard, and Challenge modes work.
- Typing accuracy, WPM, streak, and completed-word counts are calculated.
- At least eight star pages can be collected.
- At least two cosmetic rewards can be unlocked.
- The game provides readable enemy word labels at common desktop resolutions.
- The player is never required to aim precisely while actively typing.
- The full level can be completed without encountering a blocking bug.
- Critical typing-engine and save-system tests pass.
- A production build completes without TypeScript errors.
- The browser console has no recurring errors during a full playthrough.

---

## 19. Implementation Order

Build vertically, keeping the project runnable after every milestone.

### Milestone 1 — Foundation

- Vite + React + TypeScript project
- R3F canvas
- Authored camera rail/node system
- Cinematic camera controller
- Pause menu
- Simple authored academy camera route

### Milestone 2 — Typing combat slice

- Typing engine
- HTML enemy word labels
- One dummy enemy
- Target lock
- Wand projectile
- Focus and restart behaviour
- Unit tests for typing

### Milestone 3 — Courtyard complete

- Arrival Gate tutorial
- Sunlit Courtyard encounters
- First anchor
- Checkpoint persistence
- HUD and settings

### Milestone 4 — Library complete

- East Hall
- Library encounters
- Shielded enemies
- Great Grimoire mini-boss
- Second anchor

### Milestone 5 — Greenhouse complete

- Hall of Portraits
- Greenhouse traversal interactions
- Enemy priority encounter
- Third anchor

### Milestone 6 — Final path

- Lower Stairwell
- Practice Gallery
- Tower ascent
- Observatory boss

### Milestone 7 — Completion features

- Celebration Courtyard
- Results and scoring
- Collectibles and cosmetics
- Audio
- Accessibility settings
- Quality presets

### Milestone 8 — Polish and verification

- Replace key placeholders
- Browser testing
- Performance profiling
- Full Playwright path
- Balance all three difficulties
- Fix blockers before adding optional features

Do not implement later milestones while an earlier milestone has an unresolved blocking defect.

---


# LEVEL DESIGN

This section is the authoritative content specification for Level 1. If any earlier section conflicts with it, this section takes precedence. The level is a linear, first-person, on-rails typing shooter. The player cannot freely roam, become lost, backtrack, jump, strafe, or manually aim.

## LD-1. Level Identity

**Game:** Spellcaster Academy: The Broken Ward  
**Level 1:** First Day, First Spell  
**Target first-play duration:** 10–13 minutes at Fast (superseded by LD-0 and CLAUDE.md §1), excluding pauses  
**Format:** Story-driven first-person on-rails typing shooter  
**Tone:** Bright fantasy adventure, mild peril, humour, discovery, and accomplishment  
**Core objective:** Restore three ward anchors and help the Ward Warden repair the academy's damaged protective ward.

## LD-2. Complete Story Premise

The player is a new apprentice arriving at **Asterfall Academy**, a school built around an ancient celestial ward. The player is met by **Pip**, a floating brass guide orb responsible for welcoming new students.

During the welcoming ritual, the academy's protective ward unexpectedly fractures. The disruption causes training dummies, enchanted books, garden creatures, and ceremonial armour to become confused or overcharged. The apparent threat is the **Ward Warden**, an ancient stone guardian seen briefly at several points in the level.

Pip initially assumes the Ward Warden caused the crisis. As the player restores the Courtyard, Library, and Greenhouse anchors, clues reveal the opposite: the Warden has been trying to hold the ward together. Its increasingly aggressive actions are emergency defence routines, not malice.

At the observatory, the player defeats the Warden's unstable outer defences through typing combat. The final phase is not a destructive finishing attack. The player types six academy values to repair the celestial ward. The Warden returns to its calm state and acknowledges the apprentice. The Head Keeper then arrives, praises the player's focus, and formally welcomes them to the academy.

## LD-3. Main Characters

### The Apprentice

The player character. The character is not given a spoken name, gender, face, or fixed personality. Their personality is expressed through actions, typing achievements, and Pip's reactions. First-person sleeves and hands use an age-neutral design.

### Pip

A floating brass guide orb. Pip is warm, energetic, slightly overconfident, and occasionally wrong. Pip provides tutorials without sounding like a teacher giving a test. Pip never insults the player for mistakes.

Dialogue style:

- Short sentences suitable for a ten-year-old
- Usually one or two subtitle lines
- Excited but not constantly noisy
- Gives one instruction at a time
- Praises accuracy and persistence, not only speed

### Mira Vale

A friendly second-year apprentice encountered in the East Hall and Celebration Courtyard. She carries a satchel of books and provides story context. Mira is calm, observant, and encouraging. She does not fight for the player.

### Keeper Orin

The academy's Head Keeper. He appears only as a distant magical message during the crisis and in person at the ending. He communicates that the ward is unstable but does not explain the Warden's true role until the ending.

### The Ward Warden

An ancient guardian made from stone, brass, and celestial energy. It does not speak in normal sentences. It communicates through resonant tones, projected symbols, protective gestures, and short translated phrases displayed by Pip.

## LD-4. Level Flow and Story Beats

The authoritative sequence is:

```text
Title Screen
→ New Game opening or Resume transition
→ Arrival Gate
→ Sunlit Courtyard
→ East Hall
→ Whispering Library
→ Hall of Portraits
→ Enchanted Greenhouse
→ Lower Stairwell
→ Practice Gallery
→ Moon Tower Ascent
→ Observatory and Ward Warden
→ Celebration Courtyard
→ Performance Summary
→ Title Screen with Level 1 completed state
```

Each area is a deterministic sequence of camera travel beats, dialogue beats, target reveals, combat stops, optional bonus targets, checkpoint commits, and recovery beats.

## LD-5. Title Screen and Continue Flow

### Presentation

Show the academy at dusk in the background. The camera is static except for subtle clouds, window lights, trees, and slow ward energy. Pip occasionally drifts across the foreground after 20 seconds of inactivity. Music is calm and magical.

Title:

```text
SPELLCASTER ACADEMY
The Broken Ward
```

The title screen has exactly two primary options:

```text
START
RESUME
```

Secondary icons for Settings, Credits, and Full Screen may appear separately and must not be styled as primary options.

### START behaviour

- Starts Level 1 from its opening cinematic.
- If an autosave exists, selecting START opens a small confirmation panel:

```text
Start Level 1 from the beginning?
Your current checkpoint will remain available until the new game reaches its first checkpoint.

START FROM BEGINNING
CANCEL
```

- Do not destroy the existing resume save immediately. Keep a backup until the new run reaches the Arrival Gate checkpoint.

### RESUME behaviour

- Enabled only when a valid incomplete autosave exists.
- If no save exists, display RESUME in a disabled state with the caption `No journey to resume`.
- Show a small summary below RESUME:

```text
Whispering Library
Standard difficulty
Last saved 4 minutes ago
```

- Resume from the beginning of the most recently committed story beat or combat wave, not from an arbitrary camera frame.
- Restore collectibles, anchor progress, settings, difficulty, score accumulators, completed encounters, and current boss phase.
- Do not resume amid an animation, dialogue line, projectile flight, or partially typed word.
- After resume, show a two-second location card and a brief safe camera establishing shot before threats activate.

### Completed-game behaviour

After Level 1 is completed, RESUME becomes disabled because there is no incomplete run. START remains available and begins a new run. A small `Level 1 Complete` crest and best performance summary may be shown.

## LD-6. Autosave and Recovery Design

Autosave must protect the player from accidentally closing or refreshing the browser.

### Autosave triggers

Commit an autosave:

- At the beginning of every named area
- After every ward anchor is restored
- After every combat wave
- Before and after each boss phase
- After collecting a star page or cosmetic
- After changing difficulty or accessibility settings
- When the browser receives `visibilitychange` and becomes hidden
- On `pagehide`
- At safe intervals during non-combat story travel

### Save boundaries

The save stores a stable resume beat, never raw live simulation state. If the browser closes during combat, resume at the start of that wave. If it closes during a boss phase, resume at the start of that phase. Previously collected items and earlier completed waves remain saved.

### Save data requirements

```ts
type Level1Autosave = {
  schemaVersion: number;
  runId: string;
  status: 'in-progress' | 'complete';
  resumeBeatId: string;
  checkpointId: string;
  areaId: string;
  difficulty: 'gentle' | 'standard' | 'challenge';
  restoredAnchors: string[];
  completedEncounterIds: string[];
  completedBossPhases: string[];
  collectedStarPageIds: string[];
  unlockedCosmeticIds: string[];
  metrics: PersistedRunMetrics;
  settingsSnapshotVersion: number;
  savedAtIso: string;
};
```

Write to a temporary key first, validate it, then promote it to the active autosave key. Keep one previous valid save as recovery. Save writes must be debounced when many metrics change rapidly.

### Recovery messaging

After a crash or interrupted session, do not mention failure. Display:

```text
Welcome back.
Your journey will continue from the last safe moment.
```

## LD-7. Opening Cinematic

### Shot 1 — Academy reveal

Duration: 8 seconds.

The camera flies above treetops at dusk. Asterfall Academy rises ahead, with warm windows and a faint gold-blue dome across the sky. The title appears and fades.

Pip, off-screen:

> There it is! Asterfall Academy. First day, first wand, first adventure.

### Shot 2 — Gate approach

Duration: 7 seconds.

The camera descends toward the Arrival Gate. Pip enters frame too quickly, brakes, overshoots slightly, and returns.

Pip:

> Apprentice detected! Robes tidy... wand ready... yes, you'll do nicely.

### Shot 3 — First interaction

The camera stops. Three gate crystals illuminate with short words.

Pip:

> This gate listens to letters. Type the word you see, and your wand will do the rest.

Control passes to the player.

## LD-8. Arrival Gate Sequence

### Gameplay

The player completes three tutorial words:

```text
star
moon
open
```

Each word activates one crystal. Typing begins only after the first character. There is no enemy pressure.

### Tutorial dialogue

After first correct character:

> Good! Each correct letter gathers magic.

After first complete word:

> And the final letter casts it. Very neat.

After an incorrect character:

> Almost. Backspace can pull that letter back.

This line plays at most once.

After all three words:

> Gate unlocked! I knew I had selected the correct apprentice.

The gate opens. The camera travels toward the courtyard.

### Ward fracture event

Halfway through the gate, the sky ward flickers. A deep but non-frightening tone sounds. Gold-blue cracks race through the dome. The camera turns toward the central tower. The distant Ward Warden is briefly visible redirecting energy.

Pip:

> That is... not part of the welcome ceremony.

Keeper Orin, through magical announcement:

> All students, remain inside the marked halls. The celestial ward is unstable.

Pip:

> Three local anchors can steady it. Courtyard first. Hold on!

Checkpoint commit: `arrival-gate-complete`.

## LD-9. Sunlit Courtyard Sequence

### Camera entrance

The camera enters through the arcade, reveals the fountain, and stops at the first training circle. A dummy turns its head with a wooden creak.

Pip:

> Training dummies should not train themselves. Let's settle them down.

### Encounter C1 — Single-target practice

Three dummies activate sequentially. Words are 3–4 letters. No Focus damage.

Pip after first target:

> Perfect. You did not need to aim—the word guided your spell.

### Encounter C2 — Mischief sprites

A planter shakes. One sprite appears, grabs a ribbon, and retreats. Two more enter from opposite sides. The camera reveals all targets before combat begins.

Pip:

> Sprites! Mischievous, quick, and extremely bad at following signs.

Wave design:

- Wave 1: one sprite, one 4-letter word
- Wave 2: two sprites, unique initials
- Wave 3: three sprites, one approaches faster and is visually marked as the priority threat

If Focus is reduced below 50:

> Breathe. Read the whole word, then begin.

### First Warden sighting

After combat, the Ward Warden appears on a distant rooftop. It raises one arm toward the damaged anchor. A burst of unstable energy knocks loose harmless roof dust, then it vanishes toward the tower.

Pip:

> That stone guardian is making the damage worse. I think.

The words `I think` are delivered less confidently.

### Courtyard Anchor interaction

The camera approaches the cracked anchor. Three rune words appear:

```text
light
steady
shine
```

Each completed word aligns a ring. The restored anchor sends a beam toward the observatory.

Pip:

> One anchor restored. Your wand has learned Spark Bolt properly now.

Checkpoint commit: `courtyard-restored`.

Optional star pages:

1. On the fountain rim during entrance pan
2. Carried briefly by the third sprite; type its bonus word before the sprite exits

## LD-10. East Hall Sequence

The camera travels through the East Hall at a slower pace. Students are absent, but lights and animated portraits show the academy is inhabited.

Mira runs into view, catches a sliding stack of books, and looks toward the player.

Mira:

> You're the new apprentice, aren't you? Good timing. Terrible first day, though.

Pip:

> We restored the courtyard anchor entirely according to plan.

Mira:

> Your plan began after the ward broke.

Pip:

> The best plans are flexible.

Mira explains that the Library Anchor has gone dark.

Mira:

> The library anchor is next. Watch the floating books. They hate being read backwards.

Optional charm chest appears during a safe camera stop.

Prompt:

```text
Open the constellation chest?
TYPE: OPEN
or press Enter to continue
```

Success unlocks the `Starlight` wand trail.

Before departing:

Mira:

> I saw the Warden carrying broken ward pieces toward the tower. It looked more worried than angry.

Pip:

> Stone faces cannot look worried.

Mira:

> That one did.

Checkpoint commit: `east-hall-complete`.

## LD-11. Whispering Library Sequence

### Entrance reveal

The double doors open. Books circle the reading room. The camera follows one overhead, revealing the Great Grimoire chained to its pedestal.

Pip, whispering loudly:

> Library rule: quiet voices, careful steps, and absolutely no airborne dictionaries.

A dictionary flies past.

### Encounter L1 — Runaway books

- Three waves
- Lateral and arcing movement
- Targeted books slow and remain readable
- 4–6 letter words
- One optional star page floats among the books as a bonus target

### Encounter L2 — Ink wisps

An overturned inkwell stretches into two wisps.

Pip:

> Those are ink wisps. Break the shield word first, then type the binding word.

- Wave 1: one shielded wisp
- Wave 2: two wisps, one shielded
- Wave 3: three wisps entering from separate aisles, revealed in sequence

### Clue scene

The camera moves to a damaged wall mosaic. The mosaic shows the Ward Warden protecting the academy during an old storm.

Pip:

> Curious. The Warden was built to protect the ward, not command it.

Projected Warden symbol appears briefly: a shield surrounding three lights.

Pip translates:

> Three anchors... shield... tower. It may be asking for help.

### Great Grimoire mini-boss

The Grimoire breaks its clasps and rises.

Pip:

> Or the books may simply be having a very dramatic day.

#### Phase G1 — Clasps

Three clasp words. Completing each word releases a clasp.

#### Phase G2 — Flying pages

Four words while paper gusts are clearly telegraphed. Camera movement stops during active typing.

#### Phase G3 — Final sentence

Words appear one at a time:

```text
bright minds make strong magic
```

The first typed character starts the phrase timer. Punctuation is unnecessary.

After completion, the Grimoire settles.

Pip:

> Returned on time, undamaged, and only slightly enchanted. The librarian may never know.

### Library Anchor

Four words restore the anchor:

```text
read
listen
learn
remember
```

The player unlocks Frost Thread.

Pip:

> Two anchors. And a new spell for perfect words—Frost Thread.

Checkpoint commit: `library-restored`.

Optional star pages:

1. Flying bonus page in Encounter L1
2. On the upper balcony during a travel pan
3. Released by the Grimoire after a no-mistake clasp word

## LD-12. Hall of Portraits Sequence

The camera moves through a calm corridor. A Focus fountain restores the player fully. Portraits whisper as the player passes.

Portrait 1:

> A new apprentice during a ward fracture? How traditional.

Portrait 2:

> Nonsense. In my year, the ceiling became a whale.

Pip:

> Please ignore historical exaggeration.

Mira appears through a wall communication mirror.

Mira:

> The Greenhouse Anchor is wrapped in ward vines. The Warden passed that way, but it cleared falling glass away from the seedlings.

Pip:

> That is... unexpectedly considerate destruction.

Optional constellation challenge:

```text
lark
crown
river
```

Completing all three gives a temporary score multiplier in the first greenhouse encounter.

Checkpoint commit: `portrait-hall-complete`.

## LD-13. Enchanted Greenhouse Sequence

### Entrance

The camera enters the greenhouse. Condensation, warm light, and moving foliage create a lush environment. A vine blocks the rail path.

Pip:

> These bridge vines grow toward confident words. Convenient plants.

### Vine interaction V1

Type three plant words. Each completion grows part of the bridge while the camera remains stationary.

```text
leaf
root
bloom
```

The camera crosses automatically.

### Encounter H1 — Thorn pods

- Two stationary thorn pods begin charging harmless energy seeds
- One Mossling approaches along the central path
- Target priority is taught through threat framing
- Camera automatically reveals the closest threat

Pip:

> The glowing pod is about to fire. Type its word first!

### Encounter H2 — Mosslings and pollen

- Two Mosslings with visible weight and grounded locomotion
- Pollen puffs drift through but never obscure active words
- Reduced-effects mode replaces dense pollen with a faint halo

Mosslings are dispersed into harmless moss piles.

Pip:

> They are not monsters. The broken ward has frightened them.

### Warden protection scene

A glass roof panel loosens. Before it can fall, the Ward Warden appears outside and catches it. It places the panel safely aside, points toward the anchor, then is pulled away by unstable energy.

Pip:

> Mira was right. The Warden is trying to protect the academy.

This is the story's clear midpoint reversal.

### Greenhouse Anchor

Three vine knots require themed words:

```text
rain
fern
amber
```

After restoration, all three anchor beams converge toward the Moon Tower. Chain Spark unlocks.

Pip:

> Three anchors restored. The Warden has been carrying the broken energy alone. We need to reach the observatory.

Checkpoint commit: `greenhouse-restored`.

Optional star pages:

1. Behind a translucent leaf during the entrance pan
2. Released by the priority thorn pod if dispelled first
3. Visible beside the Warden's safely placed glass panel

## LD-14. Lower Stairwell Sequence

The camera descends automatically. Three armour guardians block separate landings.

Pip:

> Ceremonial guards. They respond to academy commands—or they did yesterday.

At each landing, type one command word:

```text
stand
honour
yield
```

The first two guardians step aside. The third briefly malfunctions, beginning a short three-word encounter before bowing.

Pip:

> Very formal. Even during an emergency.

The sequence reinforces combat-stop rhythm without free movement.

Checkpoint commit: `lower-stairwell-complete`.

## LD-15. Practice Gallery Sequence

Mira waits behind a safety barrier.

Mira:

> The tower is full of unstable ward energy. The gallery can tune your wand before you go.

Pip:

> A short practice examination.

Mira:

> Practice. Not examination.

Pip:

> A short practice that records several measurable results.

### Zone P1 — Accuracy

Five targets appear sequentially. The player needs four words at 90% accuracy. If fewer than four qualify, one additional word is offered until complete. No failure screen.

Mira:

> Speed comes later. Clean letters make strong spells.

### Zone P2 — Priority

One strong armour target and two quicker dummies. Unique initials allow target choice.

### Zone P3 — Perfect streak

Build five perfect words to trigger Chain Spark. After three broken streaks, Gentle assistance shortens the next words without changing overall difficulty.

On completion:

Mira:

> Your wand is steady. The Warden needs help, and you're ready to give it.

Pip:

> Ready enough. Fully ready would require six more forms and a signed—

Mira:

> Go.

The camera turns toward the tower doors.

Checkpoint commit: `practice-gallery-complete`.

## LD-16. Moon Tower Ascent

The ascent consists of three authored floors separated by short story travel.

### Floor T1 — Mosslings

Three frightened Mosslings block the path. After being dispersed, their moss reforms safely in planters.

### Floor T2 — Ink wisps

Two shielded wisps emerge from leaking ward symbols. Their shield and binding words reinforce two-stage targets.

### Floor T3 — Armour guardian

A large guardian blocks the observatory door. Three 6–7 letter command words calm it. It kneels and opens the door rather than being destroyed.

### Pre-boss pause

Pip floats close to the camera.

> Beyond this door, the Warden may not recognise us. Read first. Type clearly. We are here to repair, not destroy.

Options:

```text
CONTINUE
REVIEW CONTROLS
CHANGE DIFFICULTY
```

Checkpoint commit: `observatory-door`.

## LD-17. Observatory Final Boss

### Boss introduction

The dome opens. Ward energy streams chaotically above. The Ward Warden kneels at the centre, holding three energy fractures apart. When the player enters, an emergency defence symbol activates. The Warden rises unwillingly.

Pip:

> Its defence routine has locked us out. We must reach the core without harming the Warden.

The Warden projects a symbol translated as:

```text
PROTECT — SEAL — NO ENTRY
```

Pip:

> It thinks keeping everyone out is the only safe choice. Let's prove there is another way.

### Phase W1 — Outer shell

Five armour plate words. Each completed word causes one plate to detach and orbit safely.

Boss actions:

- Left light arc
- Right light arc
- Ground ring pulse

Attacks are telegraphed. Boss timers slow significantly while typing.

Pip after third plate:

> The core is close. Keep your rhythm.

Autosave before and after the phase.

### Phase W2 — Orbiting runes

Three runes orbit the Warden, each with unique initials. Complete all three for two rounds.

Round 1 words are 5–6 letters. Round 2 words are 6–7 letters.

Between rounds, the Warden projects images of the three restored anchors.

Pip:

> It can feel the anchors. It knows we restored them.

Autosave before and after the phase.

### Phase W3 — Repair the ward

The Warden stops attacking and uses its remaining energy to hold the fractures open. The player's objective changes from `BREAK THE DEFENCE` to `REPAIR THE WARD`.

Six values appear one at a time:

```text
brave
focus
learn
kind
create
wonder
```

Each word sends a beam through one anchor into the ward. Timing for each word begins with its first typed character.

After the final word, the dome repairs. Music resolves. The Warden's armour returns and aligns in a calm, symmetrical form.

Warden translated message:

```text
WARD RESTORED
APPRENTICE RECOGNISED
```

Pip:

> It was never our enemy. It was waiting for someone who could finish the spell.

The Warden bows.

Checkpoint commit: `level-1-complete` with status `complete`.

## LD-18. Ending Cinematic

The camera returns automatically to the Celebration Courtyard at sunrise. Students and lanterns fill the arcade. Mira waves. Keeper Orin approaches with the restored Warden visible on a distant balcony.

Keeper Orin:

> An apprentice's first lesson is usually how to hold a wand.

He looks toward the repaired ward.

> Yours was how to understand one.

Mira:

> And how to survive Pip's planning.

Pip:

> My planning achieved a complete success rate.

Mira:

> Eventually.

Keeper Orin:

> Welcome to Asterfall Academy, apprentice.

The player's wand emits a gentle gold-blue light. Fade to the Level Complete screen.

## LD-19. Level Completion Screen

### Heading

```text
LEVEL 1 COMPLETE
First Day, First Spell
```

### Required metrics

Display:

- Average typing speed in WPM
- Peak rolling WPM
- Overall character accuracy
- First-attempt word accuracy
- Correct characters
- Incorrect characters
- Corrected mistakes
- Words completed
- Perfect words
- Best perfect-word streak
- Average word completion time
- Fastest correctly completed word of at least four letters
- Total active typing time
- Total level time
- Focus lost
- Checkpoint restarts
- Star pages collected, e.g. `7 / 8`
- Optional targets completed
- Difficulty
- Newly unlocked cosmetics

Do not display an insulting rank, fail grade, or comparison against other children.

### Timing rules

Typing speed must not count idle time before typing starts.

For every word or phrase:

1. Present the word with no active typing timer.
2. Start that attempt's timer on the first accepted printable character.
3. Stop the attempt timer when the word is completed, cancelled, the target becomes invalid, or the game is paused.
4. Pause timing when the browser tab becomes hidden, browser focus is lost, a menu is open, dialogue interrupts, or gameplay is suspended.
5. If there is no accepted input for five seconds during an active attempt, close the active timing segment at the time of the last accepted character. Resume with a new segment when another accepted character is typed.
6. Exclude cinematic travel, target entrance animations, loading, dialogue, and pre-word waiting from active typing time.

### WPM formula

Use the standard five-character word convention:

```text
averageWpm = (correctCharacters / 5) / (activeTypingMilliseconds / 60000)
```

Only completed gameplay attempts contribute correct characters to final WPM. Incorrect characters contribute to accuracy but not to the WPM numerator.

### Accuracy formulas

```text
overallCharacterAccuracy =
  correctKeyEntries / (correctKeyEntries + incorrectKeyEntries) * 100

firstAttemptWordAccuracy =
  wordsCompletedWithoutAnyIncorrectEntry / completedWords * 100
```

Backspace does not erase an incorrect entry from the accuracy calculation. It increments `correctedMistakes` when it removes an incorrect buffered character.

### Peak rolling WPM

Calculate peak WPM across completed words within rolling active-typing windows containing at least 25 correct characters. Do not show a peak based on one very short word.

### Positive summary

Generate two deterministic positive observations from actual metrics, for example:

```text
Your strongest skill was accuracy: 96%.
Your longest perfect streak was 8 words.
You grew faster during the Observatory battle.
You found every star page in the Library.
You kept going after a difficult wave.
```

Do not use an LLM at runtime to generate results messages.

### Completion screen actions

```text
PLAY LEVEL 1 AGAIN
RETURN TO TITLE
```

After completion, autosave status becomes `complete`. Best results are stored separately and must not be lost when starting a replay.

## LD-20. Metric Integrity and AFK Handling

Metrics must be calculated by a pure, unit-tested TypeScript module.

Track sessions as accepted input segments rather than one continuous wall-clock timer:

```ts
type TypingSegment = {
  startedAtMs: number;
  endedAtMs: number;
  correctEntries: number;
  incorrectEntries: number;
  targetId: string;
  completed: boolean;
};
```

Rules:

- A segment begins on the first accepted character, not when a target appears.
- Ignore key auto-repeat unless the repeated character is intentionally accepted by the typing engine.
- Time between words is not typing time.
- Time spent reading before the first character is not typing time.
- A five-second input gap closes the current timing segment at the previous accepted keystroke.
- Browser-hidden and paused intervals cannot contribute time.
- Reloading cannot duplicate completed metrics. Commit encounter metrics atomically with encounter completion.
- Replaying a checkpoint must not double-count previously committed words. Use stable attempt and encounter IDs.

# MOB DESIGN

This section is the authoritative gameplay and presentation specification for all Level 1 mobs. Blender appearance requirements in the Asset Design Bible still apply.

## MD-1. Shared Mob Rules

Every mob requires:

- A readable silhouette
- A word-label anchor
- A simple collision shape
- A deterministic spawn cue
- An idle, approach, attack, hit, stunned, and safe defeat state where applicable
- Clear attack anticipation of at least 700 ms on Gentle and 500 ms on Standard
- No graphic injury
- No attacks before the camera has revealed the mob
- No word assigned until the mob is visible and targetable
- Unique initial assignment among simultaneously targetable mobs where possible
- A short safe period after camera arrival

Mobs do not choose random positions. Every spawn and movement path is authored per encounter.

## MD-2. Training Dummy

**Role:** Tutorial target  
**Threat:** None in first encounter; low later  
**Behaviour:** Wakes, turns toward camera, presents chest ward, reacts to spell, resets or deactivates  
**Words:** 3–5 letters  
**Attack:** Wooden arm swing used only in Practice Gallery  
**Defeat:** Chest ward dims; dummy returns to stand  
**Teaching purpose:** Basic word completion and readable hit feedback

## MD-3. Mischief Sprite

**Role:** Quick low-Focus threat  
**Behaviour:** Enters from planter or arcade, skitters along an authored curve, taunts, approaches, pounces  
**Words:** 3–5 letters  
**Priority cue:** Ears lower, body crouches, teal freckles brighten  
**Attack:** Short pounce followed by immediate retreat  
**Defeat:** Spins into leaf sparkles and escapes into a planter  
**Teaching purpose:** Multiple targets and priority

Variants:

- Russet sprite: standard
- Grey sprite: slightly faster
- Teal-eared sprite: bonus target carrying a star page

## MD-4. Runaway Enchanted Book

**Role:** Mobile aerial target  
**Behaviour:** Hover, bank, pass laterally, page-gust attack  
**Words:** 4–6 letters  
**Attack cue:** Cover opens wide; pages bend backward  
**Attack:** Paper gust reduces Focus slightly  
**Defeat:** Closes and returns to shelf or pedestal  
**Teaching purpose:** Moving target labels without manual aim

Variants share rigging but differ in cover material, scale, and movement path.

## MD-5. Ink Wisp

**Role:** Shielded two-stage target  
**Behaviour:** Forms from ink, glides, raises rune shield, casts ink pulse  
**Words:** Shield 3–5 letters; binding 4–7 letters  
**Attack cue:** Body compresses; eyes and fingertips brighten  
**Defeat:** Ink flows harmlessly back into a bottle or page  
**Teaching purpose:** Multi-word enemies

Shield must visibly break before the second word appears.

## MD-6. Great Grimoire

**Role:** Mini-boss  
**Behaviour:** Heavy hovering book with staged clasp, page, and sentence phases  
**Threat:** Moderate and highly telegraphed  
**Words:** 4–6 letters plus one short phrase  
**Defeat:** Returns peacefully to pedestal  
**Teaching purpose:** Sustained typing and phase changes

It cannot damage the player during the final sentence phase.

## MD-7. Thorn Pod

**Role:** Stationary ranged priority threat  
**Behaviour:** Tracks camera with flower head, charges seed, fires along a scripted line  
**Words:** 4–6 letters  
**Attack cue:** Petals contract and amber core reaches full brightness  
**Defeat:** Petals relax and plant becomes dormant  
**Teaching purpose:** Threat prioritisation

## MD-8. Mossling

**Role:** Heavy approaching threat  
**Behaviour:** Rises from moss, walks with weight, accelerates briefly, swipes or bumps  
**Words:** 4–7 letters  
**Attack cue:** Plants feet, rotates shoulders, draws one arm back  
**Defeat:** Settles into a harmless moss mound that later sprouts a fern  
**Teaching purpose:** Reading progress against a closing distance

Mossling locomotion must match foot placement and authored path speed.

## MD-9. Pollen Puff

**Role:** Harmless visual distraction and optional bonus target  
**Behaviour:** Drifts, becomes startled, releases a light pollen halo  
**Words:** Optional 3–5 letter words  
**Attack:** None  
**Defeat:** Never destroyed; completing its word calms it and awards bonus score  
**Teaching purpose:** Distinguishing threats from optional targets

## MD-10. Armour Guardian

**Role:** Heavy command target and tower gatekeeper  
**Behaviour:** Assembles, blocks path, uses broad telegraphed sweep, responds to command words  
**Words:** 5–8 letters  
**Attack cue:** Metal plates lock and weaponless arms draw back  
**Defeat:** Bows, steps aside, or disassembles safely onto its stand  
**Teaching purpose:** Longer words and object weight

The guardian carries no realistic weapon in Level 1.

## MD-11. Ward Warden

**Role:** Final boss and misunderstood protector  
**Behaviour:** Authored three-phase state machine only  
**Words:** 4–7 letters plus the six final value words  
**Attacks:** Light arcs and ground pulses  
**Defeat:** Not destroyed; stabilised and restored  
**Teaching purpose:** Mastery, narrative reversal, constructive finale

The boss must never appear evil. Its defensive intent becomes progressively clearer through body language and projected symbols.

## MD-12. Mob Difficulty Scaling

Difficulty adjusts:

- Word length and familiarity
- Approach speed
- Attack wind-up duration
- Number of concurrent targets
- Between-wave recovery time
- Typing-time slowdown

Difficulty must not alter the story, remove checkpoints, make labels smaller, or increase visual noise.

# GENERAL DESIGN

This section covers non-mob assets, environment construction, paths, buildings, furniture, props, lighting, audio, UI, and cinematic staging.

## GD-1. World Construction Principle

Although Level 1 is on rails, environments must appear spatially believable and larger than the travelled path. Build complete camera-visible spaces with convincing off-rail depth, but do not build inaccessible areas beyond what cameras can see.

The authoritative gameplay path is represented by camera splines and combat nodes, not walkable navigation meshes.

## GD-2. Camera Paths

Each area requires:

- Entry spline
- Establishing camera node
- One or more combat camera nodes
- Target-reveal look points
- Optional bonus-target visibility windows
- Exit spline
- Reduced-motion cuts
- Resume camera node

Camera paths must have named control points and visible Blender empties or code-defined gizmos. Do not hard-code anonymous coordinate arrays without labels.

Naming example:

```text
COURTYARD_ENTRY_01
COURTYARD_REVEAL_FOUNTAIN
COURTYARD_COMBAT_C1
COURTYARD_COMBAT_C2
COURTYARD_ANCHOR
COURTYARD_EXIT_EAST_HALL
```

## GD-3. Asterfall Academy Exterior

The academy is a coherent stone campus built around a central Moon Tower. It combines warm sandstone, dark oak, aged brass, slate roofs, deep blue cloth, and gold-blue ward energy.

Required visible exterior structures:

- Arrival gatehouse
- Courtyard arcade
- Library wing with tall windows
- Greenhouse glasshouse attached to the east wing
- Central Moon Tower and observatory dome
- Distant dormitory roofs
- Connecting bridges and chimneys

The architecture must use original star, leaf, wave, and book motifs. Avoid recognisable franchise silhouettes.

## GD-4. Arrival Gate General Assets

- Brass-and-oak gate
- Stone gatehouse
- Academy crest
- Three typing crystals
- Path stones
- Boundary hedges
- Trees
- Brass lamps
- Cloth banners
- Distant academy facade
- Ward dome sky effect

The fallen banner pole remains decorative because there is no jump tutorial.

## GD-5. Courtyard General Assets

- Central fountain
- Training circles
- Arcades
- Benches
- Planters
- Tiled paths
- Drainage channels
- Wall lamps
- Courtyard anchor
- Dummy stands
- Sprite entrances hidden among plants
- Roofline used for the Warden sighting

Enemy paths, camera path, fountain water, and word labels must never overlap in ways that obscure words.

## GD-6. East Hall General Assets

- Vaulted corridor sections
- Oak doors
- Destination plaques
- Brass wall lamps
- Runner carpet
- Notice frames
- Student alcoves
- Mira's book stack
- Charm chest
- Satchels and school supplies
- Window views into the courtyard

The rail should pause beside Mira and the chest without placing the camera uncomfortably close to her face.

## GD-7. Library General Assets

- Two-storey shelves
- Upper gallery
- Safe railings
- Reading tables and chairs
- Rolling ladders
- Lecterns
- Book carts
- Lamps
- Rugs
- Windows
- Grimoire pedestal
- Mosaic clue wall
- Library anchor
- Ink bottles
- Parchment and quills

Use instanced book groups and atlased materials. Maintain broad visual landmarks so camera motion remains understandable.

## GD-8. Hall of Portraits General Assets

- Portrait frames and original paintings
- Communication mirror
- Focus fountain
- Benches
- Constellation plaques
- Wall sconces
- Carpet
- Tall end window
- Decorative side tables

Portrait animation is subtle: blinking, head turns, or small layer shifts. No portrait should distract from active subtitles.

## GD-9. Greenhouse General Assets

- Brass-and-iron glass frame
- Stone beds
- Soil
- Plant benches
- Pots
- Tools
- Trellises
- Water pipes
- Drainage grates
- Condensation decals
- Vine bridge
- Anchor alcove
- Roof panel for Warden scene
- Eight visually distinct plant families

The rail crosses the grown vine bridge automatically. Create a stable camera animation rather than applying physics to the camera.

## GD-10. Lower Stairwell General Assets

- Spiral stair modules
- Central column
- Brass railing
- Tall windows
- Armour plinths
- Safe-circle floor inlays
- Moon Tower glimpses
- Wall lamps transitioning toward cooler light

The camera descends smoothly without full rotations that may cause discomfort. Use cuts or partial arcs in reduced-motion mode.

## GD-11. Practice Gallery General Assets

- Long vaulted hall
- Duel floor
- Three encounter emblems
- Retractable barriers
- Practice devices
- Equipment racks
- Observation balcony
- Focus restoration pedestal
- Mira's safe position
- HTML score display mounted within a 3D frame

Background contrast must remain restrained behind target labels.

## GD-12. Moon Tower General Assets

- Circular interior
- Curved stairs
- Landings
- Celestial instruments
- Star maps
- Narrow windows
- Observatory door
- Door mechanism
- Campus backdrop
- Clouds and night sky

The colour script shifts from warm amber below to blue moonlight above.

## GD-13. Observatory General Assets

- Circular arena
- Engraved ward diagram
- Opening dome
- Telescope
- Orrery
- Four safe floor positions
- Boss entry plinth
- Ward energy dome
- Three anchor beams
- Fractured and repaired material states
- Distant campus lights

Telegraphs must use clean floor regions and cannot be hidden by decorative patterns.

## GD-14. Celebration Courtyard General Assets

- Reused courtyard with dawn lighting
- Streamers
- Lanterns
- Restored anchor
- Student background characters
- Tables and refreshments
- Mira and Keeper Orin staging marks
- Distant Warden balcony mark
- Celebration particle system

The ending camera path is fully authored and cannot be controlled by the player.

## GD-15. Lamps and Lighting Fixtures

Create a consistent family of academy lamps:

- Wall sconce
- Standing corridor lamp
- Desk lamp
- Exterior path lamp
- Greenhouse utility lamp
- Observatory instrument lamp

All use aged brass and frosted moonstone glass. Warm areas use amber light; ward-related states use gold-blue light. Most fixtures use emissive materials and baked contribution rather than individual real-time lights.

## GD-16. Tables, Chairs, Benches, and Storage

Furniture must have believable dimensions, joinery, floor contact, bevels, roughness variation, and signs of normal use.

Required set:

- Courtyard bench
- Library reading table
- Library chair
- East Hall side table
- Portrait Hall upholstered bench
- Greenhouse workbench
- Practice Gallery equipment rack
- Celebration table
- Book cart
- Charm chest
- Storage cabinet

Furniture is decorative and does not use runtime physics unless an authored story animation requires it.

## GD-17. Doors and Transitions

Door types:

- Oak single door
- Oak double door
- Magic-sealed door
- Library double door
- Greenhouse framed door
- Observatory mechanism door

Doors open with believable acceleration, hinge placement, weight, and audio. Camera travel waits until clearance is adequate. Area loading may occur behind doors, brief fades, or occluding arches.

## GD-18. Collectibles

Eight star pages exist:

```text
Courtyard: 2
Library: 3
Greenhouse: 3
```

Every collectible is visible from the rail during a defined window. Acquiring it requires typing a short optional word, not moving toward it. Missed pages do not block completion.

The HUD briefly shows:

```text
STAR PAGE FOUND
3 / 8
```

## GD-19. Interface Design

### HUD

Show only:

- Player Focus
- Active target word
- Perfect-word streak
- Current objective
- Optional star-page count after one has been found
- Pause hint when needed

Do not permanently show WPM during story gameplay by default; it can create pressure. An optional setting may enable it.

### Subtitles

- Large readable text
- Speaker name
- Maximum two lines
- Dark translucent backing
- Never overlap the active word
- Remain long enough for a child to read
- Dialogue pauses or slows camera movement when necessary

### Word labels

HTML overlays anchored to 3D targets. Maintain safe margins and high contrast. Completed characters, current character, remaining characters, and mistakes have distinct states.

## GD-20. Audio and Music Story Plan

Music states:

```text
Title theme
Arrival wonder
Ward fracture
Courtyard action
East Hall calm
Library mystery
Grimoire battle
Portrait rest
Greenhouse wonder
Greenhouse action
Tower ascent
Warden defence
Ward repair
Celebration
Results
```

Transitions should cross-fade at story beats. Dialogue, typing cues, and threat telegraphs take priority over music.

Environmental audio includes fountain water, leaves, library page movement, distant academy activity, greenhouse glass creaks, tower wind, and observatory machinery.

## GD-21. Checkpoint and Resume Presentation

After an autosave commit, show a small unobtrusive icon and text for no more than two seconds:

```text
Journey saved
```

On resume:

1. Load required area assets.
2. Restore committed progress.
3. Place camera at the resume node.
4. Show area title.
5. Play a short establishing shot.
6. If useful, let Pip summarise the current goal in one sentence.
7. Begin the saved beat.

Example:

> We restored the courtyard. The Library Anchor is next.

## GD-22. Start-to-Finish Acceptance Scenario

A valid complete run must support this exact experience:

1. Open title screen.
2. Select START.
3. Complete Arrival Gate tutorial.
4. Close browser during Courtyard Wave 2.
5. Reopen game.
6. Select RESUME.
7. Resume at the start of Courtyard Wave 2 with previous progress intact.
8. Complete all three anchors.
9. Complete the Grimoire and Warden battles.
10. Reach ending cinematic.
11. View accurate metrics based only on active typing intervals.
12. Return to title screen.
13. Confirm best results remain stored and RESUME is disabled.

## LD-21. Continuity into Levels 2 and 3

Level 1 plants three threads that later levels pay off (see `CLAUDE.md` §5 and the Level 2 and 3 design documents):

- **The seam.** After the ward is repaired, a burning hairline seam remains in the sky (the observatory reveal), faint over the Celebration Courtyard. It tears open in Level 2.
- **Who fractured the ward (owner revision, 2026-10-04: a mystery that is solved at the end).** Level 1 is an investigation. Every area adds a clue, in words an 8-year-old can follow:
  - Arrival: the gate crystals are asleep and a sprite is scared, not naughty.
  - Courtyard: a star page half rubbed out to grey; the anchor's runes scratched out on purpose.
  - East Hall: the books are fleeing, not attacking, because their pages are going blank.
  - Library: a mosaic of the Warden locking a man with a pen behind the sky; Pip's memory goes blank; the Grimoire whispers "Unwriter".
  - Hall of Portraits: the portraits refuse to say a banished wizard's name; his frame beside the Warden's is scratched out.
  - Greenhouse: plants turn grey in the crack's light; the Warden is holding the crack shut.
  - Observatory: after the ward is mended, a burning seam is left in the sky and a voice speaks through it ("one crack is all I need"). Pip knows the voice.
  - Ending: Keeper Orin names him: the ward was torn from outside by the only wizard who ever wrote in fire, the Unwriter. The seam lingers over the celebration.
  The Unwriter is not seen in Level 1. His army attacks in Level 2, and he is met in Level 3.
- **Pip's imperfection.** Pip is "occasionally wrong" by design. Level 3 reveals that Pip's creator tried to erase it for exactly that reason, and Pip chooses to stay imperfect.
