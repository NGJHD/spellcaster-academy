# LEVEL2_DESIGN.md — Level 2: The Siege of Asterfall

Authoritative content specification for Level 2 of Spellcaster Academy: The Broken Ward.

Game-wide rules live in `CLAUDE.md`: the on-rails format, audience and IP rules, technology, typing system, combat rules, asset pipeline, performance, testing, campaign rules and the owner decisions that override everything. Level 2 reuses Level 1's systems unless this document says otherwise. Autosave, resume, results timing and metric rules follow `LEVEL1_DESIGN.md` LD-5, LD-6, LD-19 and LD-20 exactly. The shared mob rules in MD-1 also apply.

Section ids use the prefix `L2-` for level design, `M2-` for mobs, `A2-` for the asset bible and `G2-` for general design.

Every area in this level follows the attention rules in `CLAUDE.md` §1B: the 10-second rule, powerful-feeling words, boss name cards and health bars, fast-rail set pieces, spark gems, optional speed rounds and encounter medals. The sequences below are the minimum; add surprise entrances and destruction wherever they fit.

---

# LEVEL DESIGN

## L2-1. Level Identity

**Level 2:** The Siege of Asterfall
**Target first-play duration:** 18–25 minutes at the owner's brisk pace
**Format:** first-person on-rails typing shooter (unchanged)
**Tone:** a dramatic night siege. The academy is on fire under a blood-red sky, smoke rolls across the courtyards, and menacing creatures pour over the walls. This must look and feel completely different from Level 1's sunny first day, so that an 8–10-year-old knows instantly that this is serious. Dramatic, not horror: nobody is hurt, and everything that burns can be restored.
**Core objective:** relight the four Lantern Beacons to raise an emergency Lantern Ward over the academy, get the first-years to safety, and stop the Vellum Wyrm before it carries the Whispering Library away.

## L2-2. Story Premise

A week after the ward was repaired, Asterfall celebrates the **Lantern Festival**. Students float paper lanterns over Lantern Lake to thank the stars. Pip has organised the event and has been insufferable about it.

During the festival, the hairline seam left in the sky by Level 1 tears open above the lake. The **Rift** opens like a wound of red fire across the sky. Through it pours **the Hush**: creatures of ink, ash and smouldering paper, armed with **inkfire**, red-and-black flames that burn without heat. Whatever inkfire touches burns away into grey ash and is "unwritten":

- **What burns:** lanterns, banners, doors, bridges, even whole sections of wall.
- **The academy:** it is soon ringed with fire. Embers drift through the air, smoke hangs over the courtyards, and the sky glows red.
- **Burned things stop working.** A burned door won't open, and a burned bridge can't be crossed, until the apprentice's spells quench the fire and write the thing back.

Keeper Orin can't seal the Rift, but he can raise an emergency shield, the **Lantern Ward**, if four old signal beacons are relit around the academy:

1. **The Bell Beacon** on the Bell Bridge
2. **The Furnace Beacon** in the Alchemy Workshops
3. **The Lighthouse Beacon** on Lantern Lake
4. **The Rampart Beacon** on the east walls

Pip guides the apprentice; Mira leads the first-years to the Great Hall. The Ward Warden, now an ally, defends the walls but is slowly being scorched to grey ash itself.

Midway through the night a voice speaks from the Rift for the first time. It is calm, polite and very cold:

> "Such a noisy, untidy school. Let me tidy it."

The Hush's greatest weapon is the **Vellum Wyrm**, a dragon made of thousands of pages the Hush has stolen from the Whispering Library. It coils around the Moon Tower. With the four beacons lit, the apprentice climbs to the tower roof and calls the pages home. At the wyrm's heart is a shard of black crystal: a piece of the **Unwriting Quill**.

Keeper Orin recognises it. It belonged to **Magister Corvane Hale**, an archivist of the academy who vanished centuries ago. Pip's lights flicker strangely when it sees the shard; Pip doesn't know why. The Lantern Ward holds, but the Rift stays open. Orin admits it can only be closed from the other side.

## L2-3. Characters

### Returning

- **The Apprentice:** the player. They now have Spark Bolt, Frost Thread and Chain Spark from the start.
- **Pip:** proud festival organiser turned battlefield guide. Still confident and occasionally wrong, but braver than in Level 1. Pip shows the first signs of a hidden past: a flicker, a half-remembered phrase, a reaction to the quill shard.
- **Mira Vale:** leads the evacuation. She calls out first-years who need help and later steers the lake boat's lantern.
- **Keeper Orin:** holds the central shield spell from the Observatory. Appears as a projected magical message until the ending.
- **The Ward Warden:** a friend now. It fights beside the player at the ramparts and on the tower roof. The Hush erases parts of it, and the player can restore them.

### New

- **Prefect Idris Kade:** a calm, steady senior student. Holds the Great Hall doors with a barrier spell and trusts the apprentice to keep the Hush off them.
- **Oarsby:** the academy's brass ferryman automaton. Polite, slow-speaking and fond of nautical phrases. He rows the apprentice across Lantern Lake.
- **The Voice in the Rift:** the Unwriter, heard but not seen. Calm and courteous, and absolutely certain that mistakes and mess should be removed. Never shouts, never threatens violence, and only ever speaks of tidying, correcting and erasing.
- **The Hush:** the Unwriter's army (§M2). They are constructs, not living things. When beaten they burst into sparks, ink and ash.

## L2-4. New Mechanics

Each mechanic is introduced once with no danger, then used under light pressure, then combined with others.

### Counter-words (Ward Shield spell)

- Some attacks fly at the player carrying a short word of 2–4 letters on a small pale-blue tag.
- Typing the counter-word raises a **Ward Shield** that deflects that attack into harmless sparkles.
- Counter-words never share a first letter with any visible target word.
- Counter-words lock automatically on their first letter even while another word is locked. Finishing one returns the lock to the previous word with its progress intact.
- On Gentle, counter-word attacks also hit for nothing (HP is unlimited), but they are still shown and still reward score.
- Unlocked during the Festival Lawn tutorial.

### Inkfire and restoration

- **Burning objects** are wreathed in red-and-black inkfire.
- **Burnt-out objects** become grey ash sculptures: a grey, cracked, charcoal look with glowing ember edges.
- Burning or burnt objects carry a **restore word**. Typing it blasts the fire out with a burst of gold-blue light, then repaints the object in a wave of colour.
  - Objects **on the rail path** (bridges, doors) must be restored to continue, with no time pressure.
  - **Optional ones** give score and collectibles.
- Hush fire attacks on the environment spread visibly but slowly, with clear telegraphs. They are never a fail state.

### Lanes

- Some encounters stage enemies in two or three readable **lanes**, for example the barricades in the Great Hall.
- Pip marks which lane is closest to breaking through, but never forces a target.
- A broken lane costs HP and score, then the Hush in it is pushed back. The encounter continues and never fails outright.

### Ally protection

- **The Warden fights alongside at the ramparts and on the tower roof.** When Hush enemies erase part of it, a restore word appears on the Warden.
- Restoring the Warden powers its **Warden Strike**: after every five perfect words, the Warden sweeps one lane clear.
- The ally can never be lost. If it isn't restored, it simply stops helping until it is.

### Boat rail (Lantern Lake)

- A slow, smooth, authored boat ride with Oarsby. Targets come from the water, the shore and the air.
- The boat slows almost to a stop while the player types (camera comfort rules, `CLAUDE.md` §1A).

### Beacon lighting

- Each beacon takes a short sequence of themed words, like Level 1's anchors.
- A lit beacon sends a beam up into the growing Lantern Ward dome, which is visible from everywhere for the rest of the level.

### Starfall spell (unlocked in the Alchemy Workshops)

- After an **eight-word perfect streak**, a shower of small stars calms every weak enemy on screen and deflects all incoming counter-word attacks.
- The streak counter in the HUD shows progress towards both Chain Spark (5) and Starfall (8).

## L2-5. Level Flow

```text
Title Screen (START begins Level 2 once Level 1 is complete)
→ Lantern Festival Lawn       (opening, Rift tears open, counter-word tutorial)
→ Dormitory Tower             (rescue the first-years, first erasures)
→ Bell Bridge                 (Beacon 1: Bell)
→ Great Hall                  (lane defence and mini-boss: the Grey Herald)
→ Alchemy Workshops           (Beacon 2: Furnace; Starfall unlocked)
→ Lantern Lake                (boat rail with Oarsby; Beacon 3: Lighthouse)
→ Whispering Library          (the library being stolen; rescue the Star Atlas)
→ East Ramparts               (Warden ally defence; Beacon 4: Rampart)
→ Moon Tower Roof             (boss: the Vellum Wyrm)
→ Observatory Aftermath       (the quill shard and the cliffhanger)
→ Results
```

Areas reuse Level 1 locations where it makes sense: the library, the Moon Tower and the courtyard architecture. They are shown at night, under siege, with new staging. New spaces are the lawn, the dormitory tower, the Bell Bridge, the Great Hall, the workshops, the lake and the ramparts.

### Checkpoints

```text
festival-lawn-complete
dormitory-rescued
bell-beacon-lit
great-hall-held
furnace-beacon-lit
lighthouse-beacon-lit
star-atlas-recovered
rampart-beacon-lit
level-2-complete
```

Autosave triggers and save boundaries follow LD-6, including boss-phase saves.

## L2-6. Opening Cinematic

### Shot 1 — Lantern Festival (8 s)

Night. Hundreds of paper lanterns drift over Lantern Lake. The repaired ward shimmers faintly overhead. Students cheer on the lawn. This is the last calm, warm image of the level, and the contrast with what follows should be strong.

Pip:

> Welcome to the Lantern Festival! Organised by me. Mostly. Entirely, if anyone asks.

### Shot 2 — The seam (6 s)

The camera tilts up. A thin crack in the sky that nobody else has noticed. It begins to glow red. A lantern drifting near it bursts into red-black flame and falls as grey ash.

Pip:

> That lantern just... burned. Grey. That is NOT a festival effect.

### Shot 3 — The Rift opens (6 s)

With a deep boom the crack splits into a long, ragged Rift of red fire. The sky turns red. Burning shapes rain down like comets and crash into the lawn, the boathouse and the rooftops, which catch fire. The Hush climb out of the flames. Students scatter towards the halls. The music cuts from festival to siege.

Keeper Orin (projected message):

> Students, to the Great Hall. Apprentice, Pip — I need the four beacons lit. Go!

## L2-7. Lantern Festival Lawn

**Purpose:** teach counter-words and erasure safely; establish the stakes.

- **Camera:** stops on the lawn among overturned festival stalls, then pans to reveal three Blotlings dropping out of the sky.
- **Encounter F1 (tutorial, no damage):** three Blotlings, one at a time, with 3–4 letter words.
- **Counter-word tutorial:** a Blotling flicks an ink drop at the player with the counter-word `ink`. Time freezes until the player types it, the first time only.

  Pip:

  > Words can block, too! Type the little word on anything flying at you.

- **Fire tutorial:** a festival stall catches inkfire and starts burning to ash. Its restore word, `stall`, appears. Typing it blasts out the flames and repaints the stall in colour.

  Pip:

  > Inkfire! It burns things right out of the world — but your spells can put it out. Write it back!

- **Encounter F2:** two waves of Blotlings and Eraser Moths, mixing targets and counter-words.
- **Exit:** the camera follows the path to the Dormitory Tower, where students are trapped behind a burning door.

**Optional:** two Festival Lanterns (collectibles) float near the stalls, each needing a bonus word.

Checkpoint: `festival-lawn-complete`.

## L2-8. Dormitory Tower

**Purpose:** a rescue sequence: restore paths and protect the first-years.

- The tower door is burning. Restore word: `open`.
- Inside, a spiral stair (reusing the stairwell kit, decorated with student life). On each of three landings a first-year is hiding behind a door the Hush is erasing.
- **At each landing:** blast 2–3 Scribble Imps setting the door alight, then restore the door before the fire takes it. The freed student runs downstairs, thanking the apprentice with a short line.
- **Escalation:** a Smudgehound appears on landing 3, the first fast enemy. Its approach is clearly telegraphed by smoke-paw prints on the floor.

Mira (arriving to lead the first-years away):

> I've got them. Go — the Bell Bridge beacon is closest.

Checkpoint: `dormitory-rescued`.

## L2-9. Bell Bridge — Beacon 1

**Purpose:** first beacon; travel under pressure.

- A long covered bridge between the dormitory and the Great Hall. A huge bronze bell in a central belfry is the Bell Beacon.
- **Travel:** the bridge is on fire. The camera moves along it through smoke and falling embers. Burning planks ahead must be restored (`plank`, `beam`, `rail`) before the camera can continue. There's no timer; the Hush wait on the far side, howling.
- **Encounter B1:** Eraser Moths swarm the belfry. Each carries a 4–5 letter word, and some throw dust bursts (counter-words).
- **Beacon:** three words relight it: `ring`, `bright`, `signal`. Each word swings the bell. On the third, the bell rings and a gold beam rises into the sky.

Pip:

> One beacon lit! Hear that? That's the sound of us winning. Probably.

Checkpoint: `bell-beacon-lit`.

## L2-10. Great Hall — Mini-boss: the Grey Herald

**Purpose:** lane defence; first mini-boss of the siege.

- The Great Hall is a long vaulted dining hall with tables pushed into barricades. Prefect Idris holds a barrier at the far end, shielding the first-years. Three tall doors along one side are the three **lanes**.
- **Encounter H1 (lanes):** Blotlings and Scribble Imps push through the doors in three waves. Pip calls out the most threatened lane.

  Idris:

  > Keep them off the doors. I'll keep the barrier up.

- **Encounter H2:** a pair of **Hollow Knights** (empty grey suits of armour) enter, each with two-word commands. They introduce armoured multi-stage enemies in Level 2.

### Mini-boss: the Grey Herald

A tall, thin herald made of charred black paper with glowing red edges, carrying a long trumpet. It reads the Unwriter's decree aloud, and every sentence sets something in the hall ablaze.

- **Phase 1 — The Decree:** the Herald unrolls a scroll. Each of its four lines is a short 4–6 letter word. Completing a word tears that line before it can be read out. Any line the player doesn't tear sets a banner or table on fire, which is cosmetic only and restorable afterwards.
- **Phase 2 — Trumpet Blasts:** the Herald blows long counter-word blasts (a 3–4 letter word each) between summoning pairs of Scribble Imps.
- **Phase 3 — Last Word:** the Herald tries to burn through Idris's barrier. The player completes the phrase `not on my watch`, word by word. Each word punches a blast of light through the Herald. On the last word it bursts into a shower of sparks and ash, and its trumpet clatters to the floor.

Before Phase 1, the Voice in the Rift speaks through the Herald for the first time:

> "Such a noisy, untidy school. Let me tidy it."

Pip:

> Who was THAT? And how rude!

After the fight, the student-hall erasures can be restored as optional bonus words.

Checkpoint: `great-hall-held`.

## L2-11. Alchemy Workshops — Beacon 2

**Purpose:** environmental variety; unlock Starfall.

- Workshops lit by copper stills, glass alembics and a great furnace (the Furnace Beacon). The Hush has choked the furnace with grey ash, and inkfire runs along the pipes.
- **Encounter W1:** Smudgehounds dart between workbenches along authored paths. Some knock over alembics; the spilled liquid is never harmful, only colourful.
- **Puzzle beat (typing only):** three valves need restoring (`copper`, `steam`, `spark`) to get air to the furnace.
- **Beacon:** `ember`, `flame`, `forge`, `blaze`. The furnace roars back to life, and Starfall is unlocked.

Pip:

> New spell! Eight perfect words in a row and the stars do the rest.

Checkpoint: `furnace-beacon-lit`.

## L2-12. Lantern Lake — Boat Rail, Beacon 3

**Purpose:** spectacle and pacing contrast: a dramatic ride across a burning lake with light pressure.

Oarsby's boat glides across a lake that reflects the red Rift. Burning lanterns float on the water, and the boathouse is on fire on the shore. Fire and its reflection make this the most dramatic view of the level.

Oarsby:

> All aboard, apprentice. Mind the oars, mind the ink, mind your manners.

- **Segment 1:** Eraser Moths swoop over the water. Counter-words come from Blotlings bobbing on the waves.
- **Segment 2:** passing the boathouse, Hollow Knights stand on the jetty. The boat stops for each, then moves on.
- **Lighthouse island:** the boat docks. Climb the lighthouse (an authored lift ride up its centre) while Moths circle outside the windows.
- **Beacon:** `harbour`, `guide`, `shine`, `homeward`. The lighthouse lamp turns, and its beam sweeps the lake and adds to the dome.

**Optional:** four Festival Lanterns float on the lake; each needs a 3–5 letter bonus word as the boat passes.

Checkpoint: `lighthouse-beacon-lit`.

## L2-13. Whispering Library — the Library Being Stolen

**Purpose:** story escalation, and the first sight of the Vellum Wyrm.

- The library from Level 1 at night, half in flames. Pages stream out of the books and fly out through a shattered window towards the Moon Tower. Whole sections of shelving are burnt to grey ash, and embers swirl under the galleries.
- **Story beat:** through the window, the Vellum Wyrm is glimpsed coiling around the Moon Tower: a long dragon of burning pages, roaring and breathing red fire across the rooftops.

  Pip:

  > Those are OUR books! It's building itself out of our library!

- **Encounter L1:** Paper Sprites (loose pages folded into tiny fighters) mixed with returning ink wisps. Wisps now carry counter-word shield pulses.
- **Objective:** Keeper Orin's **Star Atlas**, a huge book of star charts needed to steady the Lantern Ward. It is on the Grimoire's pedestal. The Great Grimoire from Level 1, now friendly, is guarding it and is under attack.
  - **Protect the Grimoire:** Scribble Imps scratch at its clasps. Blasting them saves it, and it hands the Atlas over with a happy flap.
- **Optional:** restore three burnt shelves for score and a cosmetic (Inkwell Blue wand trail).

Checkpoint: `star-atlas-recovered`.

## L2-14. East Ramparts — Warden Ally Defence, Beacon 4

**Purpose:** set-piece defence with the Warden at your side.

- Burning battlements overlooking the lake and the red Rift. The Ward Warden stands at the wall, holding off a column of Hush climbing the cliffs with flaming ladders. Scorched grey streaks show where inkfire has burned its stone.
- **Encounter R1:** three lanes along the wall: left tower, centre gate, right tower. The Warden covers one lane at a time, and Pip shows which. The player covers the other two.
- **Restore the Warden:** each time inkfire scorches the Warden, a restore word appears on it (`stone`, `steady`, `guard`, `return`). Restoring it powers its next Warden Strike.
- **Hollow Knight Captain:** a larger Hollow Knight with three command words and a slow, broad sweep (counter-word: `halt`).
- **Beacon:** `rampart`, `stand`, `together`, `dawn`. The fourth beam joins the dome and the Lantern Ward closes over the academy.

Keeper Orin:

> The Lantern Ward holds! But that dragon is inside it — it must be stopped before it takes the tower.

Checkpoint: `rampart-beacon-lit`.

## L2-15. Moon Tower Roof — Boss: The Vellum Wyrm

### Introduction

The Warden lifts the apprentice to the tower roof on its open palm (an authored ride). The Vellum Wyrm rears up out of the smoke: thirty metres of burning pages, its head a great horned book with blazing red eyes, fire roaring in its throat, and a black crystal heart pulsing red between its "ribs" of book spines. It roars, and the roof shakes.

Pip:

> It's made of our books — and it's on FIRE. Hit it with everything!

The Voice in the Rift:

> "Every book corrected. Every error gone. Wouldn't that be lovely?"

### Phase V1 — Page Scales

- Five large page-scales glow on the wyrm's body, one at a time, each with a 5–6 letter word.
- Each completed word peels a scale away. It flies back towards the library as a stream of pages.
- **Attacks:**
  - **Fire breath:** a telegraphed sweep of red flame across one side of the roof that costs HP. The wyrm's throat glows for at least the MD-1 minimum wind-up first.
  - **Fireballs:** counter-words, 3–4 letters.
- The Warden blocks one telegraphed gust per round with a stone arm, as a visible, reassuring beat.
- Autosave before and after the phase.

### Phase V2 — Sky Chase

- The wyrm takes off and circles the tower. The camera tracks it in smooth authored orbits, never spinning fast.
- Three Ink Glands along its flank (unique initials, 6–7 letters) open as it passes. Close all three across two passes.
- Between passes the wyrm dives, raining a **firestorm**: a chain of three counter-words in quick, readable succession. Each one deflects a fireball into a burst of sparks. The chain slows to one at a time on Gentle.
- If the Warden has been restored at least twice this level, it catches the wyrm's tail at the end of the phase. Otherwise the wyrm lands on its own.
- Autosave before and after the phase.

### Phase V3 — Calling the Pages Home

- The wyrm crashes onto the roof in a storm of sparks, its burning heart exposed: the quill shard, pulsing red.
- The player types the library's motto as a final spell, one word at a time:

  ```text
  every page has a place
  ```

- Each word fires a lance of gold-blue light into the heart, tearing pages free.
- On the last word the heart cracks. The wyrm's fire goes out with a thunderous blast, and the dragon bursts apart into a storm of pages and ash. The pages that survive flutter back to the library.
- The shard falls onto the roof, cracked and smoking. The wyrm is beaten, not killed: it was only ever pages.

### Failure behaviour

- As LD-17: HP reaching zero restarts the current phase, and assist mode is offered after two failed attempts.
- Never shame the player.

## L2-16. Observatory Aftermath and Ending

- **The quill shard:** Keeper Orin examines it in the Observatory.

  Keeper Orin:

  > This is part of the Unwriting Quill. It belonged to Magister Corvane Hale — our archivist, centuries ago. The founders sealed him beyond the ward.

  Pip's lights flicker; Pip's voice briefly drops to a strange, formal tone.

  Pip (strangely):

  > "Correction required." ...Sorry. I don't know why I said that.

- **The Rift:** still burning red above the lake, held back by the Lantern Ward. Smoke still rises from parts of the academy.

  Keeper Orin:

  > The ward will hold for a while. But a rift opened from that side can only be closed from that side.

  Mira:

  > Then someone has to go through.

  Everyone looks at the apprentice. Pip floats forward bravely, then backs up a little, then forward again.

  Pip:

  > We'll go. Obviously. After a short rest. And a snack.

- Fade to the results screen.

## L2-17. Results and Rewards

- Same metrics and timing rules as LD-19 and LD-20, plus:
  - Beacons lit (4/4)
  - Burnt objects restored (optional count)
  - Counter-words blocked
  - Warden Strikes triggered
- **Collectibles:** 8 **Festival Lanterns** (2 lawn, 4 lake, 1 library, 1 ramparts), shown as `LANTERN FOUND 3 / 8`.
- **Cosmetics:**
  - **Inkwell Blue** wand trail (library shelves)
  - **Lantern Glow** wand trail (all 8 lanterns)
- **Rank titles** (positive only): Brave Lamplighter, Steady Defender, Beacon Keeper, Shield of Asterfall, Hero of the Siege.
- Completing Level 2 unlocks Level 3 and adds Level 2 to the Chapters list.

---

# MOB DESIGN (Level 2)

Every Hush construct follows MD-1, with these rules on top:

- **Look:** Hush constructs are ink-black and ash-grey, with **glowing red-orange ember accents**: eyes, cracks and trailing embers. Many carry or breathe inkfire. They should look menacing and dangerous, like real villains' monsters in a children's adventure film, not cute.
- **Limits:** no gore, no realistic anatomy of injury, and no fanged human faces.
  - Snarls and glowing eyes are fine.
  - Teeth may be stylised (ink spikes, flame shapes).
- **Defeat:** defeated Hush **burst** into sparks, embers and ash with a satisfying punch of light. Big constructs crash, collapse or shatter.
- **Living characters are never burned or hurt:** inkfire only burns objects, scenery and the Warden's stone. Students are frightened, hidden, then rescued.

## M2-1. Blotling

- **Role:** basic Hush footsoldier and the counter-word teacher.
- **Look:** a knee-high mass of bubbling black ink with stubby legs, two burning ember eyes and a crack of glowing red down its front. It hisses when it moves.
- **Behaviour:** drips down from the sky, waddles along an authored path, and flicks ink drops (counter-words).
- **Words:** 3–5 letters; counter-words 2–3.
- **Defeat:** bursts in a splash of ink and sparks.

## M2-2. Eraser Moth

- **Role:** fast flyer.
- **Look:** a large moth with charred black wings edged in glowing embers, leaving a trail of sparks.
- **Behaviour:** swoops in loose arcs. Its target is slowed while locked. Some throw dust bursts (counter-words).
- **Words:** 4–5 letters.
- **Attack cue:** wings fold back, dust glows.
- **Defeat:** ignites and bursts into a shower of embers.

## M2-3. Scribble Imp

- **Role:** erasure agent.
- **Look:** a small, jittery creature of scribbled black lines with ember eyes, holding a burning torch-quill.
- **Behaviour:** runs to scenery and sets it alight. It doesn't attack the player directly; its threat is burning objectives, which are always restorable.
- **Words:** 3–4 letters.
- **Defeat:** snaps apart into sparks; its torch-quill drops and gutters out.

## M2-4. Smudgehound

- **Role:** fast, priority threat.
- **Look:** a lean, snarling hound of smouldering charcoal with burning red eyes and flame running down its spine. Paw prints of fire show its path a moment before it runs.
- **Behaviour:** dashes between cover along authored paths, pauses, then lunges.
- **Words:** 4–6 letters.
- **Attack cue:** crouches, smoke flares from its paws (≥ 700 ms Gentle, 500 ms Standard).
- **Defeat:** breaks apart into a burst of embers and a cloud of ash.

## M2-5. Hollow Knight

- **Role:** heavy, multi-stage enemy.
- **Look:** an empty suit of blackened iron armour with no one inside. Red fire burns through the visor slit and the joints. Spiked, heavy and menacing, and visually distinct from the academy's brass-trimmed ceremonial guardians.
- **Behaviour:** marches slowly, braces, sweeps.
- **Words:** two command words (5–7 letters). The Captain variant has three.
- **Defeat:** the fire inside goes out with a bang and the armour collapses into a smoking heap.

## M2-6. Paper Sprite

- **Role:** library-only swarm.
- **Look:** a single page folded into a tiny winged figure.
- **Behaviour:** flits in groups of three. Light threat.
- **Words:** 3–4 letters.
- **Defeat:** flares briefly, then the page flutters back to its book.

## M2-7. The Grey Herald (mini-boss)

- **Role:** mini-boss and the voice of the decree.
- **Look:** a three-metre figure of charred black paper with glowing red edges, a flaming trumpet and a burning scroll. Faceless, formal and threatening.
- **Behaviour:** the three-phase state machine in L2-10.
- **Defeat:** bursts into a pillar of sparks and ash.

## M2-8. The Vellum Wyrm (boss)

- **Role:** level boss.
- **Look:** a long serpentine dragon of burning pages and book spines. Its horned book head has blazing red eyes and a throat full of fire, and a black crystal heart pulses red between spine-ribs. Fire and embers stream from its whole body.
- **Behaviour:** the authored three-phase state machine in L2-15. It moves with weight and inertia, and its pages flutter with secondary motion.
- **Defeat:** the fire goes out in a thunderous blast and it bursts apart into a storm of pages and ash.

## M2-9. Difficulty Scaling

As MD-12, plus:

- **Counter-word frequency:** Gentle 0.6×, Standard 1×, Challenge 1.3×.
- **Paper-storm chain speed:** Gentle one at a time, Standard about 1.2 s apart, Challenge about 0.9 s apart.
- **Lane pressure:** Gentle at most two active lanes.

---

# ASSET DESIGN BIBLE (Level 2)

All rules of `CLAUDE.md` §14 apply: Blender `bpy` scripts, kit materials named after the runtime library, metre UVs, previews, manifests and validation. Hush constructs share an **ink-and-ember look**: black ink and charcoal surfaces with emissive red-orange cracks and eyes. Burnt objects use a runtime **ash state**, a simple material swap or uniform blend with no custom shader framework (§3).

## A2-1. Inkfire, ash and restoration (shared)

- Every restorable object needs three states: normal, burning (normal plus inkfire flames on it) and ash (burnt out).
- **Ash state:**
  - Grey-charcoal fill with darker cracks, and glowing ember edges using an emissive rim.
  - A tiling crackle texture.
- **Restoration effect:** a burst of gold-blue light that blows the flames out, then a wave of colour spreading from the impact point over 0.6 s.
- **Performance:** one shared ash material per kind of surface; never one material per object.

## A2-1b. Fire and atmosphere VFX (shared, Levels 2 and 3)

- **Flames:** camera-facing flame cards with animated flipbook textures, in two flavours:
  - **Inkfire:** red and orange with black cores (the enemy's fire).
  - **Ordinary fire:** warm orange, for beacons and the furnace.
- **Embers:** pooled particle sprites that rise and drift. Bounded counts per area (`CLAUDE.md` §15: no unbounded emitters).
- **Smoke:** a few large, slow, soft cards and a low red-tinted fog layer.
- **Light:** flickering point lights at a handful of hero fires only (budgeted per area); everything else is emissive.
- **Sky:** the Rift as a red, glowing tear in the night sky, using an emissive mesh and a bloom-free glow card (no post-processing, §3), with a red tint added to the night sky.
- **Readability:** flames and smoke must never sit between the camera and an active word label. Labels keep their dark backing. Flame cards near combat framing must be placed and tested so they stay behind or beside targets.

## A2-2. Lantern Festival dressing

- Paper lanterns (instanced, several shapes), festival stalls with striped awnings, bunting and lantern strings.
- Floating lake lanterns with gentle bobbing motion.

## A2-3. Dormitory Tower

- Spiral stair (reuses the stairwell kit), student doors with name plaques (UI text) and cosy landing dressing: rugs, trunks, bookshelves and plants.

## A2-4. Bell Bridge

- Covered timber bridge modules, a bronze bell in a carved belfry with a swinging rig, and burning and burnt plank variants.

## A2-5. Great Hall

- Hammer-beam roof, long refectory tables (barricade arrangement), tall doors (three lanes), banners and candle chandeliers.
- Prefect Idris's barrier: a soft gold dome effect.

## A2-6. Alchemy Workshops

- Copper stills, alembics, valve wheels, the great furnace (Beacon 2), workbenches, shelves of jars, and pipes with steam.

## A2-7. Lantern Lake

- Oarsby's boat: a rowing boat with brass fittings and a lantern on a pole.
- Oarsby: a brass automaton, about 1.6 m, barrel-chested, with a gentle face-plate (no mouth) and smooth rowing animation.
- Water surface with Rift reflection, boathouse and jetty.
- Lighthouse island with an interior lift and a rotating lamp (Beacon 3).

## A2-8. East Ramparts

- Battlement modules, a cliff face below, the rampart beacon brazier (Beacon 4), and a view of the Rift and lake.

## A2-9. Moon Tower Roof arena

- Open roof platform around the observatory dome, with low parapets, brass instruments and four clear floor regions for telegraphs.
- The Lantern Ward dome overhead, and the Rift in the sky.

## A2-10. Characters and creatures

| Asset | Scale | Notes |
| --- | --- | --- |
| Blotling | 0.5 m | Deforming ink body, idle wobble, waddle, flick, splash |
| Eraser Moth | 1.2 m wingspan | Felt wings with card fringe, dust trail (bounded particles) |
| Scribble Imp | 0.6 m | Animated line-art body (shader or ribbon), scrub, run, untangle |
| Smudgehound | 1.0 m long | Charcoal body, smoke paws, dash, crouch, lunge, fade |
| Hollow Knight | 2.0 m | Reuses the plate-armour construction, grey unpolished, fold-to-stack defeat |
| Paper Sprite | 0.3 m | Folded page, flap, unfold |
| Grey Herald | 3.0 m | Folded-paper figure, scroll, trumpet, crane defeat |
| Vellum Wyrm | ~30 m long | Spine chain of about 20 bones with page-card segments, book head, crystal heart; LOD; instanced pages |
| Oarsby | 1.6 m | Brass automaton, rowing loop |
| Prefect Idris | 1.7 m | Humanoid pipeline (as Mira), senior robe, barrier cast pose |

Animation acceptance gates (§14.8) apply to every animated asset.

---

# GENERAL DESIGN (Level 2)

## G2-1. Colour script

| Area | Light |
| --- | --- |
| Festival | Warm lantern gold under a deep blue night sky. The last calm image |
| Siege | **Red and black.** A red-glowing sky from the Rift, burning buildings, smoke and drifting embers. Strong orange rim light from fires, deep shadows, and ash-grey where things have burnt |
| Each beacon | Throws a pillar of clean gold-white light into the sky. The dome visibly pushes back the red as beacons light |
| Tower roof | The peak of the drama: the burning wyrm, a red sky, the gold dome above, and fire everywhere |
| Aftermath | Smouldering embers, a dark red horizon, quiet observatory gold indoors |

## G2-2. Music states

```text
Festival (gentle, celebratory)
Rift Opens (sudden, ominous: deep drums and brass)
Siege (driving, urgent battle theme)
Rescue (urgent but lighter: dormitory, workshops between fights)
Herald (formal, brassy mini-boss theme)
Lake Crossing (lilting, rowing rhythm)
Library Stolen (mysterious, urgent)
Ramparts (heroic)
Vellum Wyrm (boss)
Pages Home (soaring resolution)
Aftermath (quiet, ominous ending sting)
Results
```

Battle themes switch on whenever a damaging encounter starts and revert afterwards (owner decision). Music softens under dialogue.

## G2-3. HUD additions

- A **beacon tracker**: four small icons near the progress bar that light as beacons are lit.
- **Counter-word tags** are visually distinct from target words: a smaller, pale-blue rounded tag with a small shield icon. They fly in from the attack's position, not from the screen centre.
- Warden restore words use a stone-coloured tag with a heart-like rune.

## G2-4. Audio

- **Effects:** crackling inkfire, roaring flames, Hush snarls and hisses, the wyrm's roar, ember bursts on defeat, a bright restoration whoosh and chime, a beacon blast, a bell toll, the furnace roar, oar strokes, the lighthouse hum, and distant rumbles and falling debris during the siege.

## G2-5. Campaign flow additions (built in this level)

- The Chapters icon on the title screen, level unlocking, per-level saves and results, and spells carried over from Level 1 (`CLAUDE.md` §5).

---

## L2-18. Definition of Done for Level 2

Level 2 is complete when:

- **Campaign:** it starts from the title screen after Level 1 is completed, and Chapters lists it.
- **Areas and mechanics:**
  - All ten areas exist and connect in the L2-5 order.
  - Counter-words, inkfire and restoration, lanes, the Warden ally, the boat ride and Starfall all work and are introduced as specified.
  - Fire, embers, smoke and the red sky are present in every siege area and never obscure an active word.
  - All four beacons can be lit, and the dome visibly grows.
- **Bosses:** the Grey Herald and all three Vellum Wyrm phases work, including phase autosaves.
- **Story:** the aftermath cinematic plays and Level 3 unlocks.
- **Collectibles:** all 8 Festival Lanterns and both cosmetics can be collected.
- **Results and saves:** results show the Level 2 metrics; checkpoints persist across refreshes.
- **Difficulty:** Gentle, Standard and Challenge work.
- **Tests:** unit tests cover counter-word locking and returning the lock, restoration state, lane pressure, and Warden Strike triggering. The Playwright full-level path passes.
- **Performance and console:** no recurring console errors, and 60 fps on the reference GPU.

## L2-19. Implementation Milestones

1. **Campaign plumbing:** level registry, per-level saves, Chapters, spells carried over, and the Level 2 route skeleton with placeholder areas.
2. **Counter-words and inkfire:** typing-engine support for counter-words (unit-tested); fire VFX, ash material state and restoration effect; red sky and Rift; Festival Lawn complete.
3. **Dormitory, Bell Bridge and Great Hall:** lanes, Hollow Knights, and the Grey Herald.
4. **Workshops and lake:** Starfall, the boat rail and the lighthouse.
5. **Library and ramparts:** Paper Sprites, the Grimoire cameo, Warden ally and Warden Strike.
6. **Vellum Wyrm:** model, rig and LOD; three phases; aftermath cinematic.
7. **Polish:** Blender assets for every Hush construct; music states; balancing all difficulties; Playwright path; performance pass.
