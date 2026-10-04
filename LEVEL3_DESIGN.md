# LEVEL3_DESIGN.md — Level 3: Into the Unwritten

Authoritative content specification for Level 3, the finale of Spellcaster Academy: The Broken Ward.

Game-wide rules live in `CLAUDE.md`: the on-rails format, audience and IP rules, technology, typing system, combat rules, asset pipeline, performance, testing, campaign rules and the owner decisions that override everything. Level 3 reuses the systems of Levels 1 and 2, including counter-words, erasure and restoration, ally beats and Starfall, unless this document says otherwise. Autosave, resume, results timing and metric rules follow `LEVEL1_DESIGN.md` LD-5, LD-6, LD-19 and LD-20 exactly. Shared mob rules follow MD-1, plus the Hush rules in `LEVEL2_DESIGN.md` §M2.

Section ids use the prefix `L3-` for level design, `M3-` for mobs, `A3-` for the asset bible and `G3-` for general design.

---

# LEVEL DESIGN

## L3-1. Level Identity

**Level 3:** Into the Unwritten
**Target first-play duration:** 20–28 minutes at the owner's brisk pace (the longest level, and the finale)
**Format:** first-person on-rails typing shooter (unchanged)
**Tone:** a strange, beautiful journey through a world made of erased things. The level should feel brave and hopeful rather than dark. The colour the player brings back is the visual reward of the whole game.
**Core objective:** cross the Blank, reach the Throne of Blank Pages, and stop the Unwriter from erasing Asterfall, without destroying him.

## L3-2. Story Premise

The Rift above Lantern Lake leads to **the Blank**: the realm where everything Magister Corvane Hale ever erased ended up. It is a world drawn in grey pencil on white paper:

- half-finished forests
- waterfalls of ink
- libraries of books with no words
- statues of creatures someone gave up on before finishing them
- pieces of Asterfall itself that Corvane erased centuries ago, including a tower and a bridge the academy has forgotten it ever had

The apprentice, Pip, Mira and the Ward Warden cross through. Keeper Orin stays behind to hold the Rift open and the Lantern Ward up.

Everything the apprentice's spells touch regains its colour. The route through the Blank is often unfinished: the path ahead is missing until the apprentice **writes it in**.

Along the way, **Memory Pages** (collectibles and story beats) reveal the truth:

- Corvane was once Asterfall's kindest teacher. He was devastated by a mistake he made: an experiment that went wrong and cost the academy its east tower.
- He made the **Unwriting Quill** to undo that one mistake. Then he couldn't stop. He erased every error, then every imperfect thing, until the founders had to seal him away.
- **Pip was Corvane's guide orb.** Corvane built Pip, found that Pip "was wrong too often", and tried to unwrite it. Pip fled through the ward as it was being sealed, and its memory was wiped by the crossing. That is why Pip glitched at the quill shard.

At the Throne of Blank Pages the Unwriter tries to "correct" Pip, then all of Asterfall. In the final phase the apprentice doesn't attack. Word by word, they write the sentence Corvane himself once taught his students:

```text
every mistake teaches us something new
```

The quill breaks. The paper robes fall away, and Corvane is an old, tired, astonished man again. The Blank floods with colour. Its lost places, including Asterfall's east tower, sail home through the Rift, which closes behind them.

Back at the academy at sunrise, Corvane apologises to Pip. Keeper Orin names the apprentice the first **Wardkeeper** in a hundred years, and the game ends with a celebration and credits.

## L3-3. Characters

### Returning

- **The Apprentice:** has every earlier spell (Spark Bolt, Frost Thread, Chain Spark, Ward Shield, Starfall). Gains **Bright Quill** in this level.
- **Pip:** carries the emotional heart of the level. Pip glitches more often near the Unwriter's work: a cold formal voice saying "Correction required", followed by Pip's normal voice apologising. Pip learns its own past and chooses to be imperfect.
- **Mira Vale:** comes along as a fighting ally for the first time. She casts **Shield Song**, a support shield (L3-4), and sails the paper ship. Brave, practical, kind to Pip.
- **The Ward Warden:** carries the party through the Rift and across gaps. The Unwriter's Perfect Warden copy is its personal confrontation.
- **Keeper Orin:** stays in Asterfall. Speaks only as a faint message through the Rift, then in person in the ending.

### New

- **The Unwriter (Magister Corvane Hale):**
  - **Look:** a tall, serene figure in long robes of white paper that rustle like turning pages. A smooth white porcelain mask with a single straight ink line where a face would be, and hands of flowing ink. The **Unwriting Quill**, a long feather of black crystal (now missing one shard), floats beside him.
  - **Manner:** calm, courteous and never cruel in words. He genuinely believes he is helping. He never threatens anyone with harm, only with "correction" and "tidying".
  - **Must not** look evil, monstrous or frightening. He should look cold and sad. When unmasked he is a frail old man with ink-stained fingers and kind, tired eyes.
- **The Unfinished:** half-drawn creatures of the Blank (deer, birds, a great tortoise) that Corvane abandoned. When restored they become colourful allies for a moment; they are never enemies.
- **The Perfect Warden:** the Unwriter's grey, flawless copy of the Ward Warden. Mini-boss (L3-11).

## L3-4. New Mechanics

### Writing the path

- In the Blank, the rail path ahead is often missing: blank paper where a bridge, a stair or a stepping stone should be.
- **Path words** appear in a row along the gap. Each completed word draws the next section in coloured ink, and the camera advances onto it.
- Path writing outside combat has no time pressure. In a few set pieces, a slow, clearly visible erasure creeps behind the party:
  - the Inkfall descent
  - the Citadel climb

  The erasure creeps behind, never ahead. If it catches up, the party simply gets pushed back one section, with no HP cost on Gentle.

### Restoring colour

- Every area starts almost colourless. Restoring optional objects adds colour to the area (a soft wash spreading over the sketch), and each area tracks **Colour restored %**.
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

### Ink tides

- The Unwriter's large area attacks, used in a few set pieces: long sweeping waves of ink that cross the view slowly.
- Each is countered by a **two-word counter-phrase** (for example `hold fast`). Both words are typed in order on a single tag.
- Telegraph time is at least 1.5 s on Gentle and 1.0 s on Standard.

## L3-5. Level Flow

```text
Title Screen (START begins Level 3 once Level 2 is complete)
→ Through the Rift            (opening cinematic; the Warden carries the party)
→ Rift Shore                  (path-writing and colour tutorial)
→ Sketchwood                  (the Unfinished; erased-letter words introduced)
→ Inkfall Cascades            (page-raft descent; ink tides)
→ Margin Library              (Memory Pages: Corvane and Pip; Bright Quill)
→ Gallery of Unfinished Things (mini-boss: the Perfect Warden)
→ Paper Sea                   (paper-ship voyage; Hush fleet)
→ Eraser Works                (sabotage the Hush assembly lines)
→ Citadel of Clean Pages      (climb; the Unwriter's voice and Pip's glitches peak)
→ Throne of Blank Pages       (final boss: the Unwriter, four phases)
→ Homecoming                  (colour returns; the Rift closes; ceremony; credits)
→ Level results and campaign summary
```

### Checkpoints

```text
rift-crossed
rift-shore-written
sketchwood-coloured
inkfall-descended
margin-library-remembered
perfect-warden-calmed
paper-sea-crossed
eraser-works-stopped
citadel-summit
level-3-complete
```

Boss-phase autosaves follow LD-6 (before and after each phase).

## L3-6. Opening Cinematic — Through the Rift

### Shot 1 — Lantern Lake at dawn (7 s)

The Rift hangs over the lake, its edges held back by the gold Lantern Ward. Keeper Orin stands on the jetty, staff raised, keeping it open.

Keeper Orin:

> I'll hold the door. Bring back what was taken — and bring yourselves back too.

### Shot 2 — The Warden lifts the party (6 s)

The Warden kneels. Mira and the apprentice step onto its palm, and Pip settles on its shoulder. It rises into the Rift.

Pip:

> For the record, I am not scared. I am... accurately concerned.

### Shot 3 — The Blank (8 s)

White light, then a vast landscape drawn in grey pencil on paper: hills, a forest of outline trees, a distant citadel of perfect white. The sky is a blank page ruled with faint lines.

Mira:

> It's like someone started drawing the world... and stopped.

Checkpoint: `rift-crossed`.

## L3-7. Rift Shore

**Purpose:** teach path-writing and colour restoration safely.

- The Warden sets the party down on a paper beach. The path ahead is blank.
- **Path tutorial:** three path words, `step`, `stone`, `shore`, draw stepping stones across a stream of ink.

  Pip:

  > No path? Then we write one!

- **Colour tutorial:** a grey sketch of a seashell, a boat and a lantern on the beach. Typing their bonus words repaints them, and the area's colour meter fills.
- **Encounter S1:** Blotlings and Scribble Imps (familiar from Level 2), one wave. A gentle start.
- **Memory Page 1:** a sketch of a young teacher in an Asterfall robe, laughing with students over a spilled inkpot. It is hidden inside a grey shell that gives up the page when restored.

Checkpoint: `rift-shore-written`.

## L3-8. Sketchwood

**Purpose:** wonder; the Unfinished; erased-letter words introduced.

- **Setting:** a forest of outline trees whose leaves are scribbled loops. Some branches end in mid-air where the drawing stopped.
- **The Unfinished:** a half-drawn deer stands frozen beside the path. Restoring it (`gentle`, then `graceful`) gives it colour. It bounds ahead and its hoofprints become path. A restored flock of birds later carries a star page-like Memory Page down.
- **Encounter K1:** Unwriter-made **Correction Moths**, Eraser Moths with erased-letter words. This is where the erased-letter mechanic is introduced.

  Pip:

  > Some letters are faded — but you know the word. Type all of it!

- **Encounter K2:** **Redactors** (M3-2) try to strike out the restored deer. The player shields it by calming them first: a priority lesson without a fail state.
- **Exit:** a great outline tortoise carries the party to the ink falls once restored with `ancient`.

Checkpoint: `sketchwood-coloured`.

## L3-9. Inkfall Cascades

**Purpose:** a fast-feeling set piece (gentle in practice); ink tides.

- The party rides a raft made of a single huge page, down a series of ink waterfalls. Mira kneels at the front steering with a pole.
- **Segment 1:** Blotlings bob up from the ink on both sides. The raft slows while the player types.
- **First ink tide:** a great wave rolls across a basin. Counter-phrase: `hold fast`. The Warden plunges an arm into the ink beside the raft to steady it, the first time.
- **Segment 2:** a broken drop ahead. Path words write a slide of coloured ink down to the next pool. A slow erasure creeps behind the party (L3-4).
- **Bottom pool:** Hollow Knights wade out. Two words each, with counter-sweeps.

Mira:

> Never doing that again. ...Can we do that again?

Checkpoint: `inkfall-descended`.

## L3-10. Margin Library

**Purpose:** the revelation of Pip's past; unlock Bright Quill.

- **Setting:** an upside-down library hanging from a paper sky, full of books whose pages are blank. Erased books sigh softly when touched.
- **Path:** walkways between the hanging shelves are written in one by one. There is no combat on the first crossing.
- **Encounter M1:** Paper Sprites gone grey and Ink Wisps with erased letters.
- **Memory scene:** at the library's heart, a lectern holds Corvane's own erased journal. Pip touches it, and three Memory Pages restore on their own, played as a short illustrated sequence:
  1. Corvane building a small brass orb with three rings: Pip.
  2. Corvane frowning at Pip's mistakes and raising the quill.
  3. Pip fleeing through a closing ward.

  Pip (quietly):

  > He made me. And then he tried to unmake me. Because I was... wrong too often.

  Mira:

  > You're wrong ALL the time. It's one of your best features.

  Pip:

  > ...Thank you. I think.

- **Unlock:** the journal's last page teaches **Bright Quill**. Pip learns it can also restore colour by the apprentice's side.

Checkpoint: `margin-library-remembered`.

## L3-11. Gallery of Unfinished Things — Mini-boss: The Perfect Warden

**Purpose:** confrontation for the Warden; first full use of erased letters under pressure.

- **Setting:** a vast gallery of things the Unwriter took from the world and froze as grey sculptures: a fountain, a carousel, a constellation, and pieces of Asterfall's lost east tower. Restoring them is optional and lifts the area's colour.
- **The Perfect Warden:** at the far end stands a copy of the Ward Warden: identical but flawless and grey, with no cracks, no repairs and no warmth.

  The Unwriter (voice, first heard in the Blank):

  > "Your guardian is cracked. I have made a better one. A perfect one."

### Phase P1 — Mirror Strikes

- The Perfect Warden copies the real Warden's moves. Its attacks are slow light arcs (counter-words), and five plates carry erased-letter words.
- The real Warden blocks one telegraphed attack per round for the player.

### Phase P2 — Flawless Shell

- The copy raises a perfect shield. Only **perfect words** (no mistakes) crack it: three of them are needed.
- Words with mistakes still count as progress at half value, so the phase never stalls. On Gentle every word counts in full.

### Phase P3 — Crack of Kindness

- The real Warden holds out its own cracked, repaired hand to its copy. The player types: `cracks` `are` `not` `flaws`.
- The copy hesitates, gains one crack, then colour floods into it. It kneels and becomes a statue of the real Warden, which the real Warden touches gently before moving on.

Checkpoint: `perfect-warden-calmed`.

## L3-12. Paper Sea

**Purpose:** spectacle and calm voyage pacing, with one naval fight.

- **The ship:** Mira folds a huge sheet of paper into a ship with a spell, a story beat with Mira's first big moment of magic. The Warden walks through the shallows, towing it.
- **Segment 1:** quiet sailing. Optional colour targets drift past (paper islands, a lighthouse, a whale outline) to restore.
- **Hush fleet:** three paper galleons with Hollow Knight crews. Each galleon has a **mast word** that furls its sails (two words per mast, three masts), plus incoming ink-cannon counter-words.
- **Storm:** a paper storm with an ink tide (`steady on`). Then calm water, and the Citadel rises on the horizon.

Checkpoint: `paper-sea-crossed`.

## L3-13. Eraser Works

**Purpose:** take the fight to the enemy's machinery; a lane and sabotage set piece.

- **Setting:** a great grey workshop where the Hush are made. Assembly lines carry empty Hollow Knight shells; vats of ink are poured into Blotling moulds; giant erasers scrub fresh paper blank.
- **Sabotage:** the player shuts down three **lines** by typing the control words on each line's three levers. Each completed line stops Hush production in that lane.
- **Lanes:** while a line is running, it sends constructs down its lane, so shutting lines eases pressure. This teaches choice without fail states.
- **Foreman:** a **Hollow Knight Foreman** (three command words; counter-word sweeps) guards the final lever.
- **Freed things:** every stopped line releases the erased objects it was holding (lanterns, banners, a stolen Asterfall bell). They drift home in colour, a quiet echo of Level 2.

Checkpoint: `eraser-works-stopped`.

## L3-14. Citadel of Clean Pages

**Purpose:** climb to the finale; maximum tension, kept child-friendly.

- **Setting:** a tall white citadel of perfectly folded paper, perfectly tidy, perfectly silent. Its stairs are blank: every flight must be written.
- **The climb:** four flights of path words, with a slow erasure creeping up from below (L3-4).
  - Between flights, Correction Moths and Redactors hold landings.
  - Erased-letter words become common.
- **Pip's glitches peak:** in a cold formal tone Pip says "Correction required. Correction required." Mira steadies it:

  Mira:

  > Pip. Say something wrong.

  Pip:

  > ...The moon is made of... soup.

  Mira:

  > Perfect. Stay like that.

- **Summit:** great doors with no handles. The Warden opens them. Beyond, under an empty white sky, sits the Throne of Blank Pages.

Checkpoint: `citadel-summit`.

## L3-15. Final Boss — The Unwriter

### Introduction

The Unwriter rises from his throne. The Unwriting Quill turns in the air beside him, its missing shard a dark notch.

The Unwriter:

> "Little orb. You came home. You were always so very wrong. I can fix that now."

Pip:

> I'm not broken. I'm... learning.

The Unwriter:

> "And the apprentice. So many mistakes in every word you type. Let me take them away."

Pip (to the apprentice):

> Don't listen. Mistakes are how you got this far.

### Phase U1 — Erasure

- **Arena:** a circle of pages on a white void. The Unwriter's quill strokes cross the arena one at a time, each erasing a section of floor.
- **Strokes:**
  - Each stroke is telegraphed by a ruled line, with a counter-word (or a counter-phrase for the larger strokes).
  - Erased floor sections are redrawn with path words, so the camera keeps its footing at the four safe positions.
- **Seals:** five **Seal Pages** orbit the Unwriter (5–7 letters, a few with erased letters). Each completed seal tears and drifts away.
- Mira's Shield Song is available as usual.
- Autosave before and after.

### Phase U2 — Perfect Copies

- The Unwriter writes grey "perfect" copies of the player's past opponents, one after another: a Training Dummy, the Great Grimoire, the Grey Herald and finally the Vellum Wyrm's head.
- **Each copy:**
  - Is a short burst of 2–4 erased-letter words.
  - Shows a ghostly reminder of how it was beaten before. For example, the Grimoire copy shows a single clasp word, and the Wyrm head a short phrase.
- This is a celebration of the player's own journey: each defeated copy bursts into the colours of the level it came from.
- Autosave before and after.

### Phase U3 — Correcting Pip

- The Unwriter catches Pip in a ring of grey script and begins to unwrite it. Pip's rings fade to grey one by one.
- Hollow Knights engage Mira and the Warden, who hold them back (ally beats, never a fail state).
- **Saving Pip:**
  - The player types **restore words** that appear on Pip's rings: `brave`, `curious`, `kind`. These are the values Pip showed across the game.
  - At the same time, the player counters the quill's strokes towards Pip (counter-words and one ink tide).
  - Each restored ring lets Pip speak in its own voice again.
- When all three rings return, Pip breaks free and glows gold-blue.

  Pip:

  > I am Pip. I am wrong sometimes. And I am staying exactly like this.

- Autosave before and after.

### Phase U4 — The First Lesson

- **Constructive finale, as in Level 1.** The Unwriter stops attacking and raises the quill high to erase everything: the Blank, the Rift and Asterfall beyond it. Six words appear one at a time, each written on a page Corvane once wrote for his students:

  ```text
  every mistake teaches us something new
  ```

- **Each word:**
  - Sends a beam of colour from the wand.
  - Shows a Memory Page of the young Corvane teaching.
  - Puts a crack in the quill.
- **Timing:** each word's timer starts with its first typed character. The Unwriter cannot damage the player in this phase.
- **Resolution:**
  - On the last word the quill shatters into harmless sparkles of ink.
  - The paper robes fall away like autumn leaves. The mask slips, and an old man kneels where the Unwriter stood, looking at his ink-stained hands.

  Corvane:

  > "I taught that. I... taught that."

### Failure behaviour

- As LD-17: HP reaching zero restarts the current phase, and assist mode is offered after two failed attempts. Never shame the player.
- Mira's Shield Song appears more readily (HP below 50%) during the boss on Gentle and Standard.

## L3-16. Homecoming — Ending Cinematic

1. **The Blank fills with colour.** The forest, the falls, the sea, the gallery: everything the party restored, and everything else, washes into full colour from the throne outward.
2. **The lost places go home.** Asterfall's lost east tower, the forgotten bridge and the erased constellations rise and stream back through the Rift towards the academy.
3. **Through the Rift.** The party returns on the Warden's shoulders with Corvane walking beside them. Keeper Orin lowers his staff, and the Rift closes behind them like a book.
4. **Dawn at Asterfall.** The academy now has a tower it hasn't seen in centuries. Students cheer from the battlements.
5. **Corvane and Pip.**

   Corvane:

   > "You were never wrong too often. You were simply learning. I am sorry, Pip."

   Pip:

   > Apology accepted. Mostly. ...Entirely.

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

The Hush rules from `LEVEL2_DESIGN.md` §M2 apply. Constructs made directly by the Unwriter are cleaner and whiter than the Hush (paper white, ink black, with a faint silver line) and often carry erased-letter words.

## M3-1. Correction Moth

- **Role:** erased-letter flyer.
- **Look:** a white paper moth with ink-line veins.
- **Behaviour:** as the Eraser Moth, but its words use erased letters.
- **Words:** 4–6 letters.
- **Defeat:** its wings fill with colour and it flies away as a bright butterfly.

## M3-2. Redactor

- **Role:** priority threat to allies and objectives.
- **Look:** a tall, thin figure like a black bar of redaction ink, with a white line for a face.
- **Behaviour:** glides to restored objects or the Unfinished and slowly strikes them out (a long, visible telegraph). Rarely attacks the player.
- **Words:** 5–7 letters.
- **Defeat:** the black bar fades from the middle outward, revealing a line of handwriting that drifts away.

## M3-3. Unfinished (ally creatures)

- **Role:** not enemies.
- **Look:** half-drawn deer, birds and a great tortoise: grey outlines with parts missing.
- **Behaviour:** frozen until restored by words, then briefly helpful (drawing a path, carrying a Memory Page). Never attacked or harmed on screen. Redactors threaten them only with being greyed again, and that is undone at once.

## M3-4. Hollow Knight Foreman

- **Role:** heavy Eraser Works guard.
- **Look:** a larger Hollow Knight with a lantern-eye visor and a clipboard (a nice comic touch).
- **Behaviour:** three command words; broad counter-word sweeps.
- **Defeat:** folds neatly and stacks itself into a crate.

## M3-5. The Perfect Warden (mini-boss)

- **Role:** mini-boss.
- **Look:** the Ward Warden rig in flawless grey stone, with no cracks, no repairs and no glow.
- **Behaviour:** the authored three-phase machine in L3-11.
- **Defeat:** gains colour and kneels as a statue.

## M3-6. Paper Galleon

- **Role:** naval set piece.
- **Look:** a folded-paper ship with grey sails.
- **Behaviour:** sails in, fires ink cannon (counter-words), carries a Hollow Knight crew.
- **Words:** mast words (two per mast).
- **Defeat:** sails furl and the ship drifts away in colour.

## M3-7. Perfect Copies (U2)

- Grey re-skins of earlier assets (training dummy, Grimoire, Grey Herald, Vellum Wyrm head) using the erased material.
- Short word bursts with erased letters.
- Each bursts into its home level's colours when defeated.

## M3-8. The Unwriter (final boss)

- **Role:** the game's final boss and villain.
- **Look:**
  - About 3.4 m tall in robes of overlapping paper sheets that rustle and lift like turning pages.
  - A porcelain mask with a single ink line, flowing ink hands, and the Unwriting Quill orbiting.
  - Calm, upright, graceful movement with long, deliberate gestures and clear anticipation before every stroke.
- **Must not** look evil, monstrous or frightening.
- **Behaviour:** authored four-phase state machine (L3-15).
- **Defeat:** robes fall away, the quill shatters, and Corvane remains as an old man. He is never destroyed or harmed.

## M3-9. Difficulty Scaling

As MD-12 and M2-9, plus:

- **Erased letters:** Gentle lightly faded only; Standard up to two faded; Challenge one blank slot in 6+ letter words.
- **Ink tide telegraph:** Gentle 1.5 s, Standard 1.0 s, Challenge 0.8 s, never less.
- **Creeping erasure speed:** Gentle 0.6×, Challenge 1.2×. Its effect is never more than one path section of pushback.

---

# ASSET DESIGN BIBLE (Level 3)

All rules of `CLAUDE.md` §14 apply.

## A3-1. The Blank look (shared)

- **Base world:**
  - A white paper surface with faint ruled lines and a subtle fibre texture.
  - Objects drawn with graphite outline shading over off-white fills.
  - Crosshatched shadows (a tiling texture, not a shader framework).
- **Colour restoration:** areas blend from the sketch material to full PBR materials using one simple material-blend parameter per object group or per area. Shared materials only; no per-object materials.
- **Lighting:** soft, shadowless-looking ambient light with a single gentle key. It turns warm and golden as an area's colour fills.
- **Readability:** word labels must stay high-contrast against white paper. Use the darker label backing (navy) with a soft drop shadow, and check every Blank area for readability.

## A3-2. Environments

| Area | Key assets |
| --- | --- |
| Rift Shore | Paper beach, ink stream, stepping stones (path-writing kit), sketch shell, boat and lantern |
| Sketchwood | Outline tree kit (scribble-loop leaf cards, LOD), unfinished branches, deer, birds, great tortoise |
| Inkfall Cascades | Page raft, ink waterfall (animated scrolling textures, no fluid sim), basins, slide path |
| Margin Library | Inverted shelf kit (reuses library shelves with blank books), hanging walkways, Corvane's lectern and journal |
| Gallery of Unfinished Things | Gallery hall, grey sculptures of fountain, carousel, constellation and east-tower fragments (reusing earlier assets in the erased material) |
| Paper Sea | Paper ocean surface (folded-crease normal map, scrolling waves), paper ship, galleons, islands, whale outline |
| Eraser Works | Assembly lines (conveyor with authored motion), moulds, ink vats, giant erasers, levers |
| Citadel of Clean Pages | Folded-paper architecture kit (crisp crease normals), blank stair modules, handle-less doors |
| Throne of Blank Pages | Circular page arena, orbiting seal pages, throne of stacked blank paper, white void sky with ruled lines |
| Homecoming | Asterfall at dawn with the restored east tower (new hero building), the Rift closing effect, ceremony dressing reused from Level 1 |

## A3-3. Characters and creatures

| Asset | Scale | Notes |
| --- | --- | --- |
| The Unwriter | 3.4 m | Layered paper-robe cards on a spine rig with secondary motion; porcelain mask; ink-hand ribbons; quill prop |
| Corvane (unmasked) | 1.75 m | Humanoid pipeline; elderly, kind, tired; ink-stained hands; simple robe |
| Correction Moth | 1.2 m wingspan | Variant of the Eraser Moth; colour-reveal defeat |
| Redactor | 2.2 m | Thin ink-bar body, glide, strike-out gesture |
| Unfinished deer, birds, tortoise | Various | Sketch-outline versions plus coloured restored states; short ally animations |
| Perfect Warden | 3.6 m | Ward Warden rig in the flawless grey material |
| Paper ship and galleons | 8–14 m | Folded-crease geometry; furl animation |
| Hollow Knight Foreman | 2.3 m | Hollow Knight variant |
| Pip (glitch state) | — | Grey-ring material state and a cold-blue core colour for glitch lines |

---

# GENERAL DESIGN (Level 3)

## G3-1. Colour script

| Stage | Look |
| --- | --- |
| Arrival | White and graphite with no colour at all, except the party, their spells and the Warden's gold-blue energy |
| Each area | Warms as it is restored; the player should feel the world changing because of them |
| Citadel | The coldest, whitest and most silent space |
| Throne | Pure white, until phase U4 floods it with every colour of the game |
| Homecoming | The warmest dawn of the game |

## G3-2. Music states

```text
Rift Crossing (awe)
The Blank (sparse, music-box quiet)
Sketchwood (gentle wonder)
Inkfall (adventurous)
Margin Library (melancholy, Pip's theme introduced)
Perfect Warden (mini-boss)
Paper Sea (sweeping voyage)
Eraser Works (mechanical, rhythmic battle)
Citadel (tense, sparse)
The Unwriter (final boss, built on a slowed, cold version of the academy theme)
The First Lesson (the academy theme returns in full)
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

- **Blank ambience:** soft paper rustle and distant pencil scratching.
- **Spells:** the colour-restoration swell; the quill stroke as a low, clean "shff".
- **Pip:** the glitch voice as a filtered, colder Pip voice (the TTS voice with a different pitch and rate).
- **Ending:** the Rift closing like a great book shutting, and the ceremony bells.

---

## L3-18. Definition of Done for Level 3 (and the campaign)

Level 3 is complete, and the game is finished, when:

- **Campaign:** it starts from the title screen after Level 2 is completed, and Chapters lists all three levels.
- **Areas and mechanics:**
  - All eleven stages exist and connect in the L3-5 order.
  - Path writing, colour restoration, erased letters, Mira's Shield Song, ink tides and Bright Quill all work as specified.
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

1. **Blank look:** sketch material, colour-blend system and Rift Shore with path writing and the colour meter.
2. **Sketchwood and Inkfall:** erased-letter typing support (unit-tested), the Unfinished, the page raft and ink tides.
3. **Margin Library and Gallery:** Memory Pages and the Memory Book, Bright Quill, and the Perfect Warden.
4. **Paper Sea and Eraser Works:** paper ship, galleons, sabotage lanes and the Foreman.
5. **Citadel:** the climb, creeping erasure and Pip's glitch dialogue.
6. **The Unwriter:** model, robe rig and quill; four phases; the Perfect Copies reusing earlier assets.
7. **Homecoming:** restored east tower, ending cinematic, credits, campaign summary and Wardkeeper crest.
8. **Polish:** music states, balancing all difficulties across the campaign, Playwright paths and performance.
