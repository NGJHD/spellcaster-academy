# LEVEL3_DESIGN.md — Level 3: Into the Unwritten

Authoritative content specification for Level 3, the finale of Spellcaster Academy: The Broken Ward.

Game-wide rules live in `CLAUDE.md`: the on-rails format, audience and IP rules, technology, typing system, combat rules, asset pipeline, performance, testing, campaign rules and the owner decisions that override everything. Level 3 reuses the systems of Levels 1 and 2, including counter-words, erasure and restoration, ally beats and Starfall, unless this document says otherwise. Autosave, resume, results timing and metric rules follow `LEVEL1_DESIGN.md` LD-5, LD-6, LD-19 and LD-20 exactly. Shared mob rules follow MD-1, plus the Hush rules in `LEVEL2_DESIGN.md` §M2.

Section ids use the prefix `L3-` for level design, `M3-` for mobs, `A3-` for the asset bible and `G3-` for general design.

Every area in this level follows the attention rules in `CLAUDE.md` §1B: the 7-second rule, powerful-feeling words, boss name cards and health bars, fast-rail set pieces, spark gems, optional speed rounds and encounter medals. The sequences below are the minimum; add surprise entrances and destruction wherever they fit.

## As built (v1.0.0)

This document is the original design. Where the shipped game differs, the game and the owner decisions in `BUILD_NOTES.md` win. The script is `src/content/dialogue.ts`; the route is `src/level/level3Route.ts` and `src/level/areas3/`.

- **Erased letters** were removed (2026-10-16): a child thought faded letters needn't be typed.
- **Inkfall to Margin Library to Gallery:** the raft runs ashore below a cliff at the foot of the falls, and the erased books' scraps fly in at a stone doorway in it; that is the library's door. The Margin Library is a roofless ruined hall under the red sky, broken by a chasm that the walkways are written across, with torn bookcases floating upside down above it (not a library hanging from the sky). An arch at its far end opens on a landing of statues and the gallery's front door.
- **Gallery:** the stolen treasures are Asterfall's fountain, the Bell Bridge bell and the Great Hall clock. The mini-boss is named THE PERFECT GUARDIAN; it floats, gathers a ring of fire orbs and blasts it at the player. When it falls, the back wall collapses to show the paper sea, and the party walks to the gap.
- **Unwriter, phase U3:** Pip stays beside the apprentice. The Unwriter points his quill at Pip and a stream of fire runs to Pip, with the ring words `brave`, `curious`, `kind` floating next to Pip.
- **The Warden** is bound in ropes of fire at the Throne during the fight. They break when the Unwriter is sealed, and it carries everyone home.
- **Homecoming:** the Level 1 courtyard at night (not dawn), with Keeper Orin's thanks, the Wardkeeper ceremony, cheering students and fireworks. Orin's vault line is said there; there is no vault visit, no returning east tower and no credits flight.
- **Not built:** the colour meter and Colour restored %, the Memory Book, the Prism trail, the creeping erasure.
- **Settings:** spark gems and Memory Pages exist but are off by default. The 7-second rule is on hold.

---

# LEVEL DESIGN

## L3-1. Level Identity

**Level 3:** Into the Unwritten
**Target first-play duration:** 12–17 minutes at the Fast travel speed (the longest level, and the finale; the whole game is 30–45 minutes at Fast, CLAUDE.md §1)
**Format:** first-person on-rails typing shooter (unchanged)
**Tone:** the climax. A journey through a scorched world of ash under a red sky to the villain's stronghold, a black fortress of iron, molten ink and roaring fire, ending in an all-out battle with the Unwriter. It is darker and more dramatic than Level 2, and the most epic part of the game. Dramatic, not horror (`CLAUDE.md` §2). The colour and light the player blasts back into the world is the visual reward of the whole game.
**Core objective:** cross the Blank, reach the Throne of Ash, and stop the Unwriter from erasing Asterfall, without destroying him.

## L3-2. Story Premise

The Rift above Lantern Lake leads to **the Blank**: the realm where everything Magister Corvane Hale ever burned away with his quill ended up. It is a world of grey ash and charred paper under a **red sky that never darkens**. Fires that never go out burn on the horizon, ash falls like snow, and rivers of molten red ink cut through the land. It contains:

- half-finished forests
- waterfalls of ink
- libraries of books with no words
- statues of creatures someone gave up on before finishing them
- pieces of Asterfall itself that Corvane burned away centuries ago, including a tower and a bridge the academy has forgotten it ever had

At the heart of the Blank stands the Unwriter's stronghold, **the Cinder Citadel**: a towering black fortress of iron and folded paper wrapped in fire, where the Hush are forged.

The apprentice, Pip, Mira and the Ward Warden cross through. Keeper Orin stays behind to hold the Rift open and the Lantern Ward up.

Everything the apprentice's spells hit is quenched of fire and regains its colour. The route through the Blank is often burned away: the path ahead is missing until the apprentice **writes it in**.

Along the way, **Memory Pages** (collectibles and story beats) reveal the truth:

- Corvane was once Asterfall's kindest teacher. He was devastated by a mistake he made: an experiment that went wrong and cost the academy its east tower.
- He made the **Unwriting Quill** to undo that one mistake. Then he couldn't stop. He erased every error, then every imperfect thing, until the founders had to seal him away.
- **Pip was Corvane's guide orb.** Corvane built Pip, found that Pip "was wrong too often", and tried to unwrite it. Pip fled through the ward as it was being sealed, and its memory was wiped by the crossing. That is why Pip glitched at the quill shard.

At the summit, the **Throne of Ash**, the Unwriter tries to burn Pip out of existence, then all of Asterfall. The battle is all-out. In the final phase the apprentice turns the sentence Corvane once taught his students into a spell of six words:

```text
every mistake teaches us something new
```

Each word is a blast of light that cracks the Unwriting Quill. On the last word the quill explodes. The Unwriter's fire is torn out of him, and he is pulled, still raging, into the pages of his own blank book. Pip slams it shut and seals it.

The citadel's fires die. Ash turns back into colour across the whole Blank. Its lost places, including Asterfall's east tower, sail home through the Rift, which closes behind them. Back at the academy at sunrise, Keeper Orin locks the sealed book in the deepest vault. He names the apprentice the first **Wardkeeper** in a hundred years, and the game ends with a celebration and credits.

## L3-3. Characters

### Returning

- **The Apprentice:** has every earlier spell (Spark Bolt, Frost Thread, Chain Spark, Ward Shield, Starfall). Gains **Bright Quill** in this level.
- **Pip:** carries the emotional heart of the level. Pip glitches more often near the Unwriter's work: a cold formal voice saying "Correction required", followed by Pip's normal voice apologising. Pip learns its own past and chooses to be imperfect.
- **Mira Vale:** comes along as a fighting ally for the first time. She casts **Shield Song**, a support shield (L3-4), and sails the paper ship. Brave, practical, kind to Pip.
- **The Ward Warden:** carries the party through the Rift and across gaps. The Unwriter's Perfect Warden copy is its personal confrontation.
- **Keeper Orin:** stays in Asterfall. Speaks only as a faint message through the Rift, then in person in the ending.

### New

- **The Unwriter (Magister Corvane Hale):** the big bad of the game.
  - **Look:**
    - A towering figure in long robes of charred black paper whose edges smoulder with red embers.
    - A cracked white porcelain mask with a single burning red line where a face would be, and hands of flowing ink that drip fire.
    - The **Unwriting Quill**, a long feather of black crystal burning with red flame (now missing one shard), floats beside him.
    - As the fight goes on, he grows larger and more fiery.
  - **Manner:** cold, commanding and utterly certain. His voice stays quiet even as everything around him burns, which makes him more imposing. He speaks of "correcting", "burning away errors" and "a perfect, silent world".
  - **Limits:** he may be frightening in a villain-in-a-family-film way. Never use gore, a skull or rotting imagery, or threats of hurting anyone's body; his threat is unwriting things.
  - **Defeat:** sealed inside his own blank book, not killed.
- **The Unfinished:** half-drawn creatures of the Blank (deer, birds, a great tortoise) that Corvane abandoned. When restored they become colourful allies for a moment; they are never enemies.
- **The Perfect Warden:** the Unwriter's copy of the Ward Warden in black iron, with a burning red core and no cracks. Mini-boss (L3-11).

## L3-4. New Mechanics

### Writing the path

- In the Blank, the rail path ahead is often missing: blank paper where a bridge, a stair or a stepping stone should be.
- **Path words** appear in a row along the gap. Each completed word draws the next section in coloured ink, and the camera advances onto it.
- Path writing outside combat has no time pressure. In a few set pieces, a slow, clearly visible erasure creeps behind the party:
  - the Inkfall descent
  - the Citadel climb

  The erasure creeps behind, never ahead. If it catches up, the party simply gets pushed back one section, with no HP cost on Gentle.

### Restoring colour

- Every area starts as ash and fire under the red sky. Restoring optional objects puts their fires out and adds colour to the area: a wave of light and colour spreading over the ash. Each area tracks **Colour restored %**.
- Finishing an area above 70% opens a bonus path or a Memory Page.
- It is a reward, never a requirement.

### Erased letters

- Some Unwriter-made enemies carry words with **erased letters**: those letters are faded to faint grey. The player still types the whole word, and each typed letter flashes back to full colour.
- **Rules by difficulty:**
  - Gentle: erased letters are only lightly faded.
  - Standard: up to two letters per word are faded.
  - Challenge: may show one letter as a blank slot `_`, in words of 6+ letters only.
- Erased letters are never the first letter, so targeting by initials always works.
- This mechanic builds spelling confidence. It must never make a word unreadable on Gentle or Standard.

### Mira's Shield Song

- When HP drops below 40%, Mira offers a **song word** in a rose-gold tag, never more than once every 20 seconds.
- Typing it restores 25 HP and raises a short shield that blocks the next hit.
- It is optional and never interrupts a locked word.

### Bright Quill spell (unlocked in the Margin Library)

- **Perfect** words cast with Bright Quill repaint a splash of colour around the target. A perfect word also calms any weak Unfinished-corruption nearby.
- Bright Quill fills the Colour meter faster.

### Fire tides

- The Unwriter's large area attacks, used in a few set pieces: walls of red-black inkfire that roll across the view slowly.
- Each is countered by a **two-word counter-phrase** (for example `hold fast`). Both words are typed in order on a single tag.
- Telegraph time is at least 1.5 s on Gentle and 1.0 s on Standard.

### Built engine features to reuse (from Level 1)

Level 1 already implements these game-wide systems; Level 3 scripts them through its area data rather than new code:

- **Attention rule:** the 7-second-at-Fast gap test, spark gems, `spectacle` and `boss-intro` beat types.
- **Feedback:** combo multiplier, hit-stop, camera kick, growing spells, PERFECT/cheer popups, encounter medals.
- **Set pieces:** chase targets on camera beats, camera-following targets, speed rounds, beam struggles, scripted cameos.
- **Spectacle FX:** bursts, debris, glass, dust, geysers, shockwaves, light pillars, meteors, lightning, fireworks, flocks of birds, screen flash and shake. Fire, embers and smoke will be added to this same layer for the fire tides and the Forge.
- **Bosses:** name cards, chunky health bars, power-up cards with a slow-motion beat.
- **Mobs:** the AI asset pipeline (`assets-src/scripts/ai`: Flux 2 concept → TRELLIS.2 shape → Blender clean, rig and clips) for realistic, scary creatures: the Blank's creatures, the Perfect Warden and the Unwriter.

## L3-5. Level Flow

```text
Title Screen (START begins Level 3 once Level 2 is complete)
→ Through the Rift            (opening cinematic; the Warden carries the party)
→ Rift Shore                  (path-writing and colour tutorial)
→ Cinderwood                  (the Unfinished; erased-letter words introduced)
→ Inkfall Cascades            (page-raft descent; fire tides)
→ Margin Library              (Memory Pages: Corvane and Pip; Bright Quill)
→ Gallery of Unfinished Things (mini-boss: the Perfect Warden)
→ Paper Sea                   (paper-ship voyage; Hush fleet)
→ The Forge of Unwriting      (the burning foundry where the Hush are made)
→ The Cinder Citadel          (the villain's stronghold; climb through fire)
→ Throne of Ash               (final boss: the Unwriter, four phases)
→ Homecoming                  (colour returns; the Rift closes; ceremony; credits)
→ Level results and campaign summary
```

### Attention pass (CLAUDE.md §1B)

| Area | Set piece or big moment | Spark gems / speed round | Gap-killers |
| --- | --- | --- | --- |
| Through the Rift | **Warden surge** through the Rift, then the dive into the Blank (fast rail) | Gems in the turbulence | Counter-words from about 2 s |
| Rift Shore | Hush burst up out of the ash | Colour words double as gems | Path words between waves |
| Cinderwood | The restored deer races ahead; tortoise ride | Speed round: restore the flock | Redactors threaten the deer |
| Inkfall Cascades | **Raft descent** down burning falls (fast rail); fire tide | Gems over the falls | Blotlings on both banks |
| Margin Library | Meteor books; **burning journal** tornado; Bright Quill power-up | Memory Pages as catch targets | Counter-words on falling books |
| Gallery | The Perfect Warden smashes out; name card | Speed round: restore sculptures | Sculpture colour words between phases |
| Paper Sea | Masts crash down in flames; firestorm | A constant stream of colour targets | Correction Moths dive at the sails |
| Forge of Unwriting | Lines explode as they shut down | Speed round: lever trios | Three lanes live |
| Cinder Citadel | **Fire race** up the stairwell (fast rail) | Gems on each landing | Path words without a break |
| Throne of Ash | Throne erupts; name card; beam-struggle finale | — | Boss phases are continuous typing |

Encounter medals (1–3 stars) appear after every encounter. Every dialogue line in this document plays over typing or action unless it is marked as the ending.

### Checkpoints

```text
rift-crossed
rift-shore-written
cinderwood-coloured
inkfall-descended
margin-library-remembered
perfect-warden-defeated
paper-sea-crossed
forge-stopped
citadel-summit
level-3-complete
```

Boss-phase autosaves follow LD-6 (before and after each phase).

## L3-6. Opening — Through the Rift (interactive)

### Beat 1 — Into the Rift (set piece)

- The level opens with the Warden already **surging up into the Rift**: the apprentice and Mira are on its palm and Pip is on its shoulder.
- Keeper Orin's line plays over the first second:

  Keeper Orin:

  > Bring back what was taken!

- Burning debris tumbles out of the Rift at them, with counter-words, from about 2 seconds in. Spark gems spin in the turbulence.

  Pip (over the typing):

  > I am not scared. I am... accurately concerned.

### Beat 2 — The Blank

- A white flash, then the first view of the Blank: a vast scorched landscape under a blood-red sky. Ash plains, a burnt forest, rivers of glowing red ink and ash falling like snow. Far away, a black citadel stands wrapped in fire.
- The Warden **dives** towards the ash shore. Hush Moths rise to meet them, so the player is fighting while taking in the view.

  Pip (one line, during the dive):

  > That fortress. That's where he is.

Visual note for this shot: it is the first view of the Blank. It must be breathtaking and ominous: the vast red sky, plains of grey ash, distant fires on the horizon, and, far away, the black Cinder Citadel wrapped in fire.

Checkpoint: `rift-crossed`.

## L3-7. Rift Shore

**Purpose:** teach path-writing and colour restoration safely.

- The Warden sets the party down on a beach of grey ash beside a glowing river of red ink. The path ahead has burned away.
- **Path tutorial:** three path words, `step`, `stone`, `shore`, draw stepping stones across a stream of ink.

  Pip:

  > No path? Then we write one!

- **Colour tutorial:** a shell, a boat and a lantern on the beach, burnt to grey ash and still smouldering. Typing their bonus words blasts the embers out and repaints them, and the area's colour meter fills.
- **Encounter S1:** Blotlings and Scribble Imps burst up out of the ash, mixed with the colour words. They're familiar from Level 2.
- **Memory Page 1:** a sketch of a young teacher in an Asterfall robe, laughing with students over a spilled inkpot. It is hidden inside the ash shell, which gives up the page when restored.

Checkpoint: `rift-shore-written`.

## L3-8. Cinderwood

**Purpose:** wonder; the Unfinished; erased-letter words introduced.

- **Setting:** a burnt forest of black trees, with embers glowing in the bark and patches of inkfire still flickering. Some trees were burned away mid-trunk and end in mid-air.
- **The Unfinished:** a half-drawn deer stands frozen beside the path. Restoring it (`gentle`, then `graceful`) gives it colour. It bounds ahead and its hoofprints become path. A restored flock of birds later carries a star page-like Memory Page down.
- **Encounter K1:** Unwriter-made **Correction Moths**, Eraser Moths with erased-letter words. This is where the erased-letter mechanic is introduced.

  Pip:

  > Some letters are faded — but you know the word. Type all of it!

- **Encounter K2:** **Redactors** (M3-2) try to strike out the restored deer. The player shields it by calming them first: a priority lesson without a fail state.
- **Exit:** a great outline tortoise carries the party to the ink falls once restored with `ancient`.

Checkpoint: `cinderwood-coloured`.

## L3-9. Inkfall Cascades

**Purpose:** a fast-feeling set piece (gentle in practice); fire tides.

- The party rides a raft made of a single huge page down a series of waterfalls of glowing red ink, with walls of fire on both banks. Mira kneels at the front steering with a pole.
- **Segment 1:** Blotlings bob up from the ink on both sides. The raft slows while the player types.
- **First fire tide:** a wall of inkfire rolls across a basin. Counter-phrase: `hold fast`. The Warden plunges an arm into the ink beside the raft to steady it, the first time.
- **Segment 2:** a broken drop ahead. Path words write a slide of coloured ink down to the next pool. A slow erasure creeps behind the party (L3-4).
- **Bottom pool:** Hollow Knights wade out. Two words each, with counter-sweeps.

Mira:

> Never doing that again. ...Can we do that again?

Checkpoint: `inkfall-descended`.

## L3-10. Margin Library

**Purpose:** the revelation of Pip's past; unlock Bright Quill.

- **Setting:** an upside-down library hanging from the red sky, its shelves scorched black, full of books whose pages were burned blank. Embers drift upward past the hanging walkways.
- **Path:** walkways between the hanging shelves are written in one by one, while burning books drop from the shelves above like meteors. The falling books carry counter-words; dodging them is part of the crossing.
- **Encounter M1:** Paper Sprites gone grey and Ink Wisps with erased letters.
- **Memory scene, set piece: the burning journal.** At the library's heart, Corvane's journal bursts into flame and its pages whirl up into a fiery tornado. Three Memory Pages fly out of the fire. Each is a target the player catches by typing its word. Each caught page flashes its picture full-screen for about 1 second:
  1. Corvane building a small brass orb with three rings: Pip.
  2. Corvane frowning at Pip's mistakes and raising the quill.
  3. Pip fleeing through a closing ward.

  Then a short exchange plays while Ink Wisps pour out of the tornado:

  Pip:

  > He made me... then tried to unmake me. For being wrong.

  Mira:

  > You're wrong ALL the time. It's your best feature.

- **Unlock, a power-up moment:** the journal's last page teaches **Bright Quill**. Slow-motion beat and a big **BRIGHT QUILL** card, then a wave of easy grey Sprites to repaint with it straight away.

Checkpoint: `margin-library-remembered`.

## L3-11. Gallery of Unfinished Things — Mini-boss: The Perfect Warden

**Purpose:** confrontation for the Warden; first full use of erased letters under pressure.

- **Setting:** a vast gallery of things the Unwriter took from the world and froze as grey sculptures: a fountain, a carousel, a constellation, and pieces of Asterfall's lost east tower. Restoring them is optional and lifts the area's colour.
- **The Perfect Warden:** at the far end, a copy of the Ward Warden **smashes out of a wall of grey sculptures**. It's forged from black iron, with a burning red core and no cracks or repairs, and it's bigger, colder and more menacing than the original.
- **Name card:** **THE PERFECT WARDEN**, plus a boss health bar.

  The Unwriter (voice, during the intro; the Blank's first taste of his voice):

  > "Your guardian is cracked. I made a perfect one."

### Phase P1 — Mirror Strikes

- The Perfect Warden copies the real Warden's moves. Its attacks are slow light arcs (counter-words), and five plates carry erased-letter words.
- The real Warden blocks one telegraphed attack per round for the player.

### Phase P2 — Flawless Shell

- The copy raises a perfect shield. Only **perfect words** (no mistakes) crack it: three of them are needed.
- Words with mistakes still count as progress at half value, so the phase never stalls. On Gentle every word counts in full.

### Phase P3 — Crack of Kindness

- The real Warden and the apprentice attack together: the Warden pins the copy's arms while the player types a spell of four words: `cracks` `are` `not` `flaws`.
- Each word splits the copy's iron shell further. On the last word the real Warden drives a fist into the cracked core, and the Perfect Warden shatters into a storm of iron shards and sparks.

Checkpoint: `perfect-warden-defeated`.

## L3-12. Paper Sea

**Purpose:** spectacle: a voyage across a burning sea, with one big naval battle.

- **The sea:** a sea of grey paper waves under the red sky, with burning wrecks and the Cinder Citadel growing on the horizon.
- **The ship:** Mira folds a huge sheet of paper into a ship with a spell, a story beat with Mira's first big moment of magic. The Warden walks through the shallows, towing it.
- **Segment 1:** fast sailing through burning wreckage. Colour targets (paper islands, a lighthouse, a whale outline) and spark gems stream past constantly, and Correction Moths dive at the sails.
- **Hush fleet:** three black-sailed galleons with burning figureheads and Hollow Knight crews. Each galleon has a **mast word**; completing it brings the mast crashing down in flames (two words per mast, three masts). Incoming fireball-cannon counter-words.
- **Storm:** a firestorm with a fire tide (`steady on`). Then the Citadel looms out of the smoke ahead.

Checkpoint: `paper-sea-crossed`.

## L3-13. The Forge of Unwriting

**Purpose:** take the fight into the enemy's stronghold; a lane and sabotage set piece.

- **Setting:** a vast, roaring foundry in the roots of the Cinder Citadel, where the Hush are forged:
  - Rivers of molten red ink pour from huge cauldrons into Blotling moulds.
  - Chains drag black iron Hollow Knight shells through furnaces.
  - Hammers the size of houses pound; sparks fly everywhere.
  - It should look like the villain's lair in an adventure film: red, black, fire and iron.
- **Sabotage:** the player shuts down three **lines** by typing the control words on each line's three levers. Each completed line stops Hush production in that lane.
- **Lanes:** while a line is running, it sends constructs down its lane, so shutting lines eases pressure. This teaches choice without fail states.
- **Foreman:** a **Hollow Knight Foreman** (three command words; counter-word sweeps) guards the final lever.
- **Line shutdown:** each stopped line explodes into a cascade of sparks as its furnace blows out.
- **Freed things:** each stopped line releases the stolen things it was melting down (lanterns, banners, a stolen Asterfall bell). They drift home in colour.

Checkpoint: `forge-stopped`.

## L3-14. The Cinder Citadel

**Purpose:** climb the villain's stronghold to the finale. Maximum tension and spectacle.

- **Setting:**
  - A towering black fortress of iron and charred paper, wrapped in fire.
  - Red light pours through every arrow slit, banners of black paper burn on the walls, and fire tides roll down the stairwells.
  - Its stairs have burned away: every flight must be written.
- **The climb, set piece: the fire race.** Four flights of path words, with a **wall of fire racing up the stairwell** from below in place of the slow erasure. It always stops just short, scripted (L3-4). The camera surges up each written flight.
  - Between flights, Correction Moths and Redactors hold landings.
  - Erased-letter words become common.
- **Pip's glitches peak:** during the third flight, over the typing, Pip says in a cold formal tone, "Correction required." Mira's fix plays over the fourth flight:

  Mira:

  > Pip! Say something wrong!

  Pip:

  > The moon is made of... soup!

- **Summit:** great black doors ringed with fire. The Warden smashes them open. Beyond, on a platform of iron above a sea of flame and under the red sky, sits the Throne of Ash.

Checkpoint: `citadel-summit`.

## L3-15. Final Boss — The Unwriter

### Introduction

Within the 8 s boss-intro allowance:

- The throne erupts in a column of fire and the Unwriter rises out of it. The burning quill spins up beside him, and the whole arena ignites.
- Name card: **THE UNWRITER**, plus a boss health bar.

The Unwriter (as the card fades):

> "Little orb. You came home. I can fix you now."

The rest of the exchange plays over Phase U1's first Seal Pages:

Pip:

> I'm not broken. I'm learning!

The Unwriter:

> "So many mistakes in every word you type. Let me take them away."

### Phase U1 — Erasure

- **Arena:** a circular iron platform at the top of the Citadel above a sea of fire, ringed by burning braziers under the red sky. The Unwriter's quill strokes cross the arena one at a time, each burning a section of floor away into the flames.
- **Strokes:**
  - Each stroke is telegraphed by a ruled line, with a counter-word (or a counter-phrase for the larger strokes).
  - Erased floor sections are redrawn with path words, so the camera keeps its footing at the four safe positions.
- **Seals:** five **Seal Pages** orbit the Unwriter (5–7 letters, a few with erased letters). Each completed seal tears and drifts away.
- Mira's Shield Song is available as usual.
- Autosave before and after.

### Phase U2 — Perfect Copies

- The Unwriter forges burning black-iron "perfect" copies of the player's past opponents from the flames, one after another: a Training Dummy, the Great Grimoire, the Grey Herald and finally the Vellum Wyrm's head.
- **Each copy:**
  - Is a short burst of 2–4 erased-letter words.
  - Shows a ghostly reminder of how it was beaten before. For example, the Grimoire copy shows a single clasp word, and the Wyrm head a short phrase.
- This is a celebration of the player's own journey: each defeated copy shatters into sparks, then a burst of the colours of the level it came from.
- Autosave before and after.

### Phase U3 — Correcting Pip

- The Unwriter seizes Pip in a ring of burning red script and begins to burn it out of existence. Pip's rings blacken one by one.
- Hollow Knights engage Mira and the Warden, who hold them back (ally beats, never a fail state).
- **Saving Pip:**
  - The player types **restore words** that appear on Pip's rings: `brave`, `curious`, `kind`. These are the values Pip showed across the game.
  - At the same time, the player counters the quill's strokes towards Pip (counter-words and one fire tide).
  - Each restored ring lets Pip speak in its own voice again.
- When all three rings return, Pip breaks free and glows gold-blue.

  Pip:

  > I am Pip. I am wrong sometimes. And I am staying exactly like this.

- Autosave before and after.

### Phase U4 — The First Lesson

- **The final clash.** The Unwriter grows to full height, wreathed in fire. He raises the burning quill to unwrite everything: the Blank, the Rift and Asterfall beyond it. The apprentice answers with the final spell. Six words appear one at a time, each written on a page Corvane once wrote for his students:

  ```text
  every mistake teaches us something new
  ```

- **Each word:**
  - Fires a beam of gold-blue light from the wand that slams into the quill's red fire and pushes it back. This is a visible beam struggle, with the Unwriter straining against it.
  - Puts a crack in the quill.
  - Flashes a Memory Page of the young Corvane teaching.
- **Timing:** each word's timer starts with its first typed character. The Unwriter cannot damage the player in this phase.
- **Resolution:**
  - On the last word the beam breaks through and the quill explodes in a blast of light.
  - The Unwriter's fire is torn out of him in a roaring whirlwind of embers. His blank book opens beneath him and pulls him, still raging, into its pages.
  - Pip flies down and slams the book shut. The sealing rune burns gold across its cover.

  Pip:

  > Correction: you're done.

### Failure behaviour

- As LD-17: HP reaching zero restarts the current phase, and assist mode is offered after two failed attempts. Never shame the player.
- Mira's Shield Song appears more readily (HP below 50%) during the boss on Gentle and Standard.

## L3-16. Homecoming — Ending Cinematic

This is the campaign's ending, so it is exempt from the 7-second rule. Every line can be skipped, and the celebration includes optional fireworks words for fun.

1. **The fires die.** The flames of the Cinder Citadel gutter out, the red sky breaks, and the Blank washes from ash into full colour from the throne outward: the forest, the falls, the sea, the gallery.
2. **The lost places go home.** Asterfall's lost east tower, the forgotten bridge and the erased constellations rise and stream back through the Rift towards the academy.
3. **Through the Rift.** The party returns on the Warden's shoulders, Pip carrying the sealed book. Keeper Orin lowers his staff, and the Rift closes behind them like a book.
4. **Dawn at Asterfall.** The academy now has a tower it hasn't seen in centuries. Students cheer from the battlements.
5. **The vault.** Keeper Orin locks the sealed book away in the deepest vault of the library, behind the Grimoire.

   Keeper Orin:

   > He wanted a world without mistakes. He forgot that's how every one of us learned.

   Pip:

   > I am keeping all of mine. Every single one.

6. **The ceremony.** In the Celebration Courtyard (Level 1's space, now with the east tower restored), Keeper Orin names the apprentice:

   Keeper Orin:

   > For courage, care, and a great many well-typed words — Asterfall's first Wardkeeper in a hundred years.

   Mira:

   > Told you you'd survive Pip's planning.

   Pip:

   > My planning has now achieved THREE complete success rates.

7. **Credits** roll over a slow flight across the full-colour academy and the restored Blank seen through a now-peaceful sky window, with the game's themes reprised.

Checkpoint: `level-3-complete` (status `complete`). The campaign is marked complete.

## L3-17. Results, Campaign Summary and Rewards

- **Level 3 results:** the LD-19 metrics plus:
  - Colour restored % per area
  - Path words written
  - Erased letters restored
  - Memory Pages found
- **Campaign summary** (shown after Level 3 results; reachable from Chapters afterwards):
  - Total play time and active typing time across all three levels
  - Average WPM and accuracy per level, as three bars. Positive framing only, for example: "Your accuracy rose from 88% to 95% across the adventure!"
  - Best streak across the campaign
  - All collectibles: star pages (L1), Festival Lanterns (L2), Memory Pages (L3)
  - All cosmetics unlocked
- **Memory Pages:** 8 collectibles. Most are optional pickups; the Margin Library ones are story pages. A **Memory Book** reachable from Chapters lets the player reread them as an illustrated story of Corvane and Pip.
- **Cosmetics:**
  - **Bright Quill** wand trail (finish the level)
  - **Prism** wand trail (all 8 Memory Pages)
  - **Wardkeeper's Crest**: a title-screen crest for completing the campaign
- **Rank titles** (positive only): Wandering Scribe, Colour Bringer, Pagekeeper, Wardkeeper, Author of Asterfall.
- After completion, START offers to replay from Level 1. Chapters allows any level.

---

# MOB DESIGN (Level 3)

The Hush rules from `LEVEL2_DESIGN.md` §M2 apply. Constructs made directly by the Unwriter are bigger and more menacing than the Hush: burning paper, black iron and red fire. They often carry erased-letter words.

## M3-1. Correction Moth

- **Role:** erased-letter flyer.
- **Look:** a moth with wings of burning paper, black ink veins and ember edges.
- **Behaviour:** as the Eraser Moth, but its words use erased letters.
- **Words:** 4–6 letters.
- **Defeat:** bursts into embers, leaving a bright, coloured butterfly behind.

## M3-2. Redactor

- **Role:** priority threat to allies and objectives.
- **Look:** a tall, thin figure like a black bar of redaction ink, with a burning red slit for a face and fire dripping from its edges.
- **Behaviour:** glides to restored objects or the Unfinished and slowly strikes them out (a long, visible telegraph). Rarely attacks the player.
- **Words:** 5–7 letters.
- **Defeat:** splits down the middle with a crack of light and bursts apart into embers.

## M3-3. Unfinished (ally creatures)

- **Role:** not enemies.
- **Look:** half-drawn deer, birds and a great tortoise: grey outlines with parts missing.
- **Behaviour:** frozen until restored by words, then briefly helpful (drawing a path, carrying a Memory Page). Never attacked or harmed on screen. Redactors threaten them only with being greyed again, and that is undone at once.

## M3-4. Hollow Knight Foreman

- **Role:** heavy Eraser Works guard.
- **Look:** a hulking Hollow Knight forge-master: black iron, a furnace burning in its chest, and a huge forge hammer of ink-iron (a tool, not a weapon; it slams the floor in telegraphed shockwaves).
- **Behaviour:** three command words; broad counter-word sweeps.
- **Defeat:** its furnace blows out with a bang and it crashes to the forge floor.

## M3-5. The Perfect Warden (mini-boss)

- **Role:** mini-boss.
- **Look:** the Ward Warden rig rebuilt in black iron with red fire burning through its seams and core. No cracks, no repairs and no warmth.
- **Behaviour:** the authored three-phase machine in L3-11.
- **Defeat:** shatters into iron shards and sparks.

## M3-6. Paper Galleon

- **Role:** naval set piece.
- **Look:** a black-hulled ship with burning figureheads and torn black sails.
- **Behaviour:** sails in, fires ink cannon (counter-words), carries a Hollow Knight crew.
- **Words:** mast words (two per mast).
- **Defeat:** masts crash down in flames and the ship drifts away burning.

## M3-7. Perfect Copies (U2)

- Black-iron re-skins of earlier assets (training dummy, Grimoire, Grey Herald, Vellum Wyrm head) with burning red seams.
- Short word bursts with erased letters.
- Each bursts into its home level's colours when defeated.

## M3-8. The Unwriter (final boss)

- **Role:** the game's final boss and villain.
- **Look:**
  - 3.4 m tall, growing to about 6 m in phase U4, in robes of charred black paper with ember edges that lift in the heat.
  - A cracked porcelain mask with a burning red line, and ink hands dripping fire.
  - The burning Unwriting Quill orbits him.
  - Commanding, deliberate movement with clear anticipation before every stroke.
- **He is the villain and should look like one:** imposing and menacing. Never gory, skeletal or rotting.
- **Behaviour:** authored four-phase state machine (L3-15).
- **Defeat:** the quill explodes, his fire is torn out, and he is sealed inside his own blank book. He is never killed or shown harmed.

## M3-9. Difficulty Scaling

As MD-12 and M2-9, plus:

- **Erased letters:** Gentle lightly faded only; Standard up to two faded; Challenge one blank slot in 6+ letter words.
- **Fire tide telegraph:** Gentle 1.5 s, Standard 1.0 s, Challenge 0.8 s, never less.
- **Creeping erasure speed:** Gentle 0.6×, Challenge 1.2×. Its effect is never more than one path section of pushback.

---

# ASSET DESIGN BIBLE (Level 3)

All rules of `CLAUDE.md` §14 apply.

## A3-1. The Blank look (shared)

- **Base world:**
  - Grey ash and charred paper surfaces with ember-lit cracks.
  - Black burnt silhouettes, and rivers and falls of glowing molten red ink (emissive scrolling textures).
  - Falling ash, and distant fires on every horizon.
  - Fire VFX as specified in `LEVEL2_DESIGN.md` A2-1b.
- **Sky:** a red sky that never darkens: a red gradient skydome with slow-moving smoke clouds.
- **Colour restoration:** areas blend from the ash material to full PBR materials using one simple material-blend parameter per object group or per area. Fires in the area go out as it fills. Shared materials only; no per-object materials.
- **Lighting:**
  - **Before restoration:** low, red, high-contrast light, with orange rim light from fires and deep shadows.
  - **After restoration:** warm golden daylight breaks through.
- **Readability:** word labels must stay high-contrast against red and fire. Use the darker label backing with a soft drop shadow, and check every Blank area for readability.

## A3-2. Environments

| Area | Key assets |
| --- | --- |
| Rift Shore | Ash beach, glowing red ink river, stepping stones (path-writing kit), ash shell, boat and lantern |
| Cinderwood | Burnt tree kit (charred trunks with ember cracks, ash leaf cards, LOD), trees burned off mid-trunk, deer, birds, great tortoise |
| Inkfall Cascades | Page raft, ink waterfall (animated scrolling textures, no fluid sim), basins, slide path |
| Margin Library | Inverted shelf kit (reuses library shelves with blank books), hanging walkways, Corvane's lectern and journal |
| Gallery of Unfinished Things | Scorched gallery hall, ash sculptures of fountain, carousel, constellation and east-tower fragments (reusing earlier assets in the ash material) |
| Paper Sea | Paper ocean surface (folded-crease normal map, scrolling waves), paper ship, galleons, islands, whale outline |
| Forge of Unwriting | Molten-ink cauldrons and pour streams (emissive and scrolling), chain conveyors, giant hammers, furnaces, moulds, levers |
| Cinder Citadel | Black iron and charred-paper fortress kit, burning banners, arrow slits pouring red light, burnt-out stair modules, fire-ringed doors |
| Throne of Ash | Iron platform arena above a sea of fire, burning braziers, orbiting seal pages, a throne of black iron and scorched pages, the red sky |
| Homecoming | Asterfall at dawn with the restored east tower (new hero building), the Rift closing effect, ceremony dressing reused from Level 1 |

## A3-3. Characters and creatures

| Asset | Scale | Notes |
| --- | --- | --- |
| The Unwriter | 3.4 m | Layered paper-robe cards on a spine rig with secondary motion; porcelain mask; ink-hand ribbons; quill prop |
| Corvane (unmasked) | 1.75 m | Humanoid pipeline; elderly, kind, tired; ink-stained hands; simple robe |
| Correction Moth | 1.2 m wingspan | Variant of the Eraser Moth; colour-reveal defeat |
| Redactor | 2.2 m | Thin ink-bar body, glide, strike-out gesture |
| Unfinished deer, birds, tortoise | Various | Ash-grey frozen versions plus coloured restored states; short ally animations |
| Perfect Warden | 3.6 m | Ward Warden rig in the flawless grey material |
| Paper ship and galleons | 8–14 m | Folded-crease geometry; furl animation |
| Hollow Knight Foreman | 2.3 m | Hollow Knight variant |
| Pip (glitch state) | — | Grey-ring material state and a cold-blue core colour for glitch lines |

---

# GENERAL DESIGN (Level 3)

## G3-1. Colour script

| Stage | Look |
| --- | --- |
| Arrival | **Red sky, grey ash, black silhouettes, orange fire.** Almost no other colour, except the party, their spells and the Warden's gold-blue energy, which stand out sharply |
| Each area | Its fires go out and gold light and colour break through as it is restored. The player should feel they are beating the darkness back |
| Forge and Citadel | The reddest, darkest, most dramatic spaces in the game: black iron, molten red ink, roaring fire |
| Throne | Red and black, until phase U4's gold-blue beam struggle and the explosion of light and colour at the end |
| Homecoming | The warmest, brightest dawn of the game: a deliberate total contrast with the Citadel |

## G3-2. Music states

```text
Rift Crossing (awe)
The Blank (ominous, low drums and distant choir)
Cinderwood (eerie and tense)
Inkfall (adventurous)
Margin Library (melancholy, Pip's theme introduced)
Perfect Warden (mini-boss)
Paper Sea (sweeping voyage)
Forge of Unwriting (pounding, metallic battle theme)
Cinder Citadel (relentless, rising tension)
The Unwriter (epic final boss: choir, brass, drums; a dark version of the academy theme)
The Final Spell (the academy theme returns triumphantly over the beam struggle)
Homecoming (triumphant, warm)
Credits (all themes reprised)
Results / Campaign summary
```

Owner decisions apply: battle themes on damaging encounters, softening under dialogue.

## G3-3. HUD additions

- An area **Colour meter**: a small paint-drop icon beside the progress bar.
- **Path words** appear in a row along the gap in a warm ink-brown tag style.
- **Erased letters** render faded grey within normal labels and flash to full colour as typed.
- **Song words** (Mira) use a rose-gold tag; **counter-phrases** use the pale-blue counter-word style with two words.
- A **Memory Page** found toast with a thumbnail.

## G3-4. Audio

- **Blank ambience:** crackling distant fires, wind over ash, low rumbles.
- **The Forge:** roaring furnaces, pouring molten ink and pounding hammers.
- **Spells and boss:** the restoration whoosh that blows fires out; the quill stroke as a searing roar of flame; the beam struggle; the quill's explosion.
- **Pip:** the glitch voice as a filtered, colder Pip voice (the TTS voice with a different pitch and rate).
- **Ending:** the Rift closing like a great book shutting, and the ceremony bells.

---

## L3-18. Definition of Done for Level 3 (and the campaign)

Level 3 is complete, and the game is finished, when:

- **Campaign:** it starts from the title screen after Level 2 is completed, and Chapters lists all three levels.
- **Areas and mechanics:**
  - All eleven stages exist and connect in the L3-5 order.
  - The red sky, ash and fire are present throughout the Blank, and the Forge and Citadel read clearly as the villain's stronghold. Fire never obscures an active word.
  - Path writing, colour restoration, erased letters, Mira's Shield Song, fire tides and Bright Quill all work as specified.
  - Erased letters never make words unreadable on Gentle or Standard.
- **Bosses:** the Perfect Warden and all four Unwriter phases work, including phase autosaves.
- **Story:** the Homecoming cinematic and credits play.
- **Results and rewards:**
  - Level results and the campaign summary appear with accurate metrics, and the summary is reachable later.
  - The Memory Book can be reread.
  - All 8 Memory Pages and all Level 3 cosmetics can be collected.
- **Persistence:** checkpoints persist across refreshes. After completion, best results persist and START offers a fresh campaign.
- **Difficulty:** Gentle, Standard and Challenge work across the whole campaign.
- **Tests:** unit tests cover erased-letter typing, counter-phrases, path-writing progression, the colour meter, Shield Song gating and the campaign summary maths. The Playwright full-level path passes, and a campaign smoke test runs all three levels at high time-scale.
- **Performance and console:** no recurring console errors, and 60 fps on the reference GPU.

## L3-19. Implementation Milestones

1. **Blank look:** ash material, red sky, fire VFX reuse, colour-blend system, and Rift Shore with path writing and the colour meter.
2. **Cinderwood and Inkfall:** erased-letter typing support (unit-tested), the Unfinished, the page raft and fire tides.
3. **Margin Library and Gallery:** Memory Pages and the Memory Book, Bright Quill, and the Perfect Warden.
4. **Paper Sea and the Forge of Unwriting:** paper ship, galleons, the foundry, sabotage lanes and the Foreman.
5. **Cinder Citadel:** the stronghold kit, the climb, fire tides, creeping erasure and Pip's glitch dialogue.
6. **The Unwriter:** model, robe rig and quill; four phases; the Perfect Copies reusing earlier assets.
7. **Homecoming:** restored east tower, ending cinematic, credits, campaign summary and Wardkeeper crest.
8. **Polish:** music states, balancing all difficulties across the campaign, Playwright paths and performance.
