# LEVEL1_DESIGN.md — Level 1: First Day, First Spell

Level 1 as it plays. Game-wide rules are in `CLAUDE.md`; the exact words of every line are in `src/content/dialogue.ts` and the route in `src/level/areas/` (assembled by `src/level/level1Route.ts`).

## Identity

- **Length:** about 10–13 minutes at Fast.
- **Look:** Asterfall Academy on a bright, sunny first day: warm sandstone, dark oak, brass, deep blue cloth, gold-blue ward magic. The celebration is at dawn.
- **Tone:** wonder, comedy and a mystery. Creatures are confused or scared, not evil; the boss turns out to be a friend.
- **Goal:** repair the ward's three anchors (courtyard, library, greenhouse), then reach the Moon Tower observatory.

## Story

On the apprentice's first day the celestial ward cracks. Pip, the apprentice's guide orb, and Mira, a student, follow the clues: dark gate crystals, a scared sprite, an anchor's runes scratched out on purpose, books whose words are vanishing, a library mosaic of the Warden locking a man with a pen behind the sky, the Grimoire whispering "Unwriter", portraits that won't say a banished wizard's name and an empty frame with its name scratched out. Pip wonders aloud: "is someone rubbing things out of our school?"

The Ward Warden seems to be the threat, but it is holding the crack shut. Once its defence is calmed, the apprentice repairs the ward with what the school stands for. A burning seam is left in the sky and a voice speaks through it: "one crack is all I need". At the celebration Keeper Orin explains that the ward was broken from the outside, by a wizard they locked away long ago: the Unwriter.

## Characters

- **The apprentice:** the player; never seen or named. First-person forearm and wand.
- **Pip:** a floating brass guide orb with three rings, warm, excited and sometimes wrong. Speaker name "Guide Orb". Gets most lines; wonders, then says what to do.
- **Mira:** a student who joins in the East Hall and stays with the party.
- **The Ward Warden:** a huge floating stone guardian. Speaks in short capital-letter lines.
- **Keeper Orin:** head of Asterfall; appears at the celebration.
- **Two portraits** in the Hall of Portraits.

## Mechanics introduced

Typing a word, locking by its first letter, Backspace, shielded targets (shield word, then binding word), chase words on moving rails, beam struggles, speed rounds, and three spells: Spark Bolt (courtyard anchor), Frost Thread (library anchor), Chain Spark (greenhouse anchor). Each new spell's light flows from the anchor into the wand, gets a power-up card, then a wave of three easy enemies.

## Flow

### Arrival Gate

- A fast swoop over the trees to the academy while Pip introduces themself.
- **Cold open:** a sprite dives straight through Pip and carries Pip off in its chest; its word, `drop`, makes it let go.
- The gate crystals are dark: two crystals, `star` and `open`, blast the gate open. Pip's tips play on the first correct letter and the first mistake.
- Just inside, the Warden floats down; the player types `hi`. A boom from the tower makes it turn, say where it is going ("I MUST CHECK THE TOWER") and fly there at a pace you can follow.
- **The ward cracks:** the sky splits, pieces of the dome fall like shooting stars, and a tear stays above the Moon Tower until the Warden is helped. Checkpoint `arrival-gate-complete`.

### Sunlit Courtyard

- Training dummies hop off their stands at the player (two words).
- Sprites burst out of the planters (two sprites).
- **Rooftop chase:** a sprite has grabbed a page; the camera chases it along the arcade roof (an optional sprite with two words). Caught, the page is half erased: a clue.
- The Warden crash-lands, points at the broken anchor ("THREE ANCHORS HOLD THE WARD. THIS ONE IS BROKEN. HELP, APPRENTICE.") and leaps back to the tower.
- **Courtyard Anchor:** `light`, `steady`, `shine`, one at a time. A pillar of light, then Spark Bolt and three easy sprites. Checkpoint `courtyard-restored`.
- Leaving: Pip notices the scratches look new, and says the next anchor is in the library.

### East Hall: the Book Stampede

- Mira bursts out of an alcove: "Run, the library books are loose!" The camera runs backwards down the hall with Mira while books swoop in (two chase words per stretch). The books are fleeing, and their words are disappearing.
- **Optional speed round:** a treasure chest, `lock` and `key` in 8 seconds, for the Starlight wand trail.
- Mira runs off down the hall to the library doors and turns to hold the line; the doors slam on the last books. Checkpoint `east-hall-complete`.

### Whispering Library

- Through the doors the books are whispering; the Grimoire is chained on its pedestal.
- Runaway books dive from the galleries (two words); a shelf topples in slow motion and spills more.
- Ink wisps erupt from a spilled inkwell (two shielded wisps).
- **The mosaic:** the Warden locking a man with a pen behind the sky.
- **Boss: THE GREAT GRIMOIRE** ("Keeper of a Thousand Pages"). It snaps its chains, rises and roars a gust of pages that blows out the lamps.
  - **G1 Clasps:** two clasp words; paper gusts are telegraphed attacks.
  - **G2 Flying pages:** two page words while gusts smash furniture.
  - **G3 Sentence:** a beam struggle, `bright minds make strong magic`. It settles on its pedestal and whispers "Unwriter".
- **Library Anchor:** `read`, `listen`, `learn`. Frost Thread, then three easy books. Checkpoint `library-restored`.
- Mira: the last anchor is in the greenhouse, through the Hall of Portraits.

### Hall of Portraits: the Paint Ambush

- The portraits come alive: paint imps leap out of their frames and throw splats that land at the screen edges, never over a word (two imps). The portraits gossip about a banished wizard; Pip asks whose name nobody will say.
- **Fountain:** a short breather. Healing droplets fly beside the camera (`drip`, `heal`, optional).
- **The empty frame** next to the Warden's, its name scratched out. Pip puts the clues together.
- **Optional speed round:** star plaques, `lark` and `crown` in 7 seconds, for a ×1.5 score multiplier in the next fight. Checkpoint `portrait-hall-complete`.
- The far end is an open arched doorway; the greenhouse is through it.

### Enchanted Greenhouse

- **The Snapvine Chase:** a giant snapping vine lunges from the water; each word (`leaf`, `root`, `bloom`) grows the bridge and the camera hops forward just out of reach.
- A thorn pod glows before it shoots (type its word first) with a mossling; then a mossling stampede (two). The mosslings look scared, not angry.
- **The turning point:** a roof panel shatters, the Warden smashes down through the glass, catches the falling sheet, sets it down and leaps away. Pip: it is trying to protect everything at once.
- **Greenhouse Anchor**, tied up in vines that loosen with each knot: `rain`, `fern`, `amber`. The vines sink away; Chain Spark, then three easy mosslings. Checkpoint `greenhouse-restored`.
- Pip: if the anchors are fixed, why is the sky still cracked? Mira: the Warden flew to the Moon Tower.

### Lower Stairwell: the Banister Slide

- The tower is across the school: Pip and the apprentice hop on a tea tray and slide down the spiral stairs (only the tray's front shows while riding).
- Armour guards stand on the landings; each word (`stand`, `honour`, `yield`) moves one aside, once its word is typed.
- The third guard falls apart and re-assembles, then a short two-word fight. Checkpoint `lower-stairwell-complete`.
- The stairs end at an open arched doorway into the practice gallery.

### Practice Gallery

- Mira: the tower door is past the gallery; warm up on the way. Pip announces like a sports commentator.
- **Zone 1, accuracy:** practice dummies one at a time; three words at 90% accuracy pass (a lower one adds another dummy).
- **Zone 2, priority:** an armour guardian and a quick dummy. Checkpoint `practice-gallery-complete`.
- The gallery's castle door leads to the Moon Tower.

### Moon Tower: the runaway lift

- Mosslings on the lift (two), then a brass lift rockets up the shaft; creatures leap at it between floors (two chase words per stretch).
- Shielded wisps (two), then a stone guard smashes up through the floor (two words). It calms, and the door to the top opens onto a stone passage with stairs up to a moonlit arch. Pip: "The crack is through this door. Ready?" Checkpoint `observatory-door`.

### Observatory

- The dome splits open with a boom; the Warden rises with a roar of light, holding the crack shut. "PROTECT. SEAL. NO ENTRY."
- **Boss: THE WARD WARDEN** ("Guardian of Asterfall"):
  - **W1 Shell:** plate words one at a time; light arcs and ground pulses are telegraphed.
  - **W2 Runes:** two rounds of two runes. It can feel the anchors we fixed.
  - **W3 Repair:** a beam struggle against the crack with the school's values, `brave` and `focus`.
- "WARD RESTORED. THANK YOU, APPRENTICE." Pip: it was holding the crack shut against someone on the other side. A burning seam remains; the Unwriter's voice: "one crack is all I need". Checkpoint `level-1-complete`.

### Celebration Courtyard

At dawn, with fireworks. Keeper Orin introduces himself and names the Unwriter; Pip links him to the man with the pen; Orin: "That's a story for another night." Then the results.

## Checkpoints

`arrival-gate-complete`, `courtyard-restored`, `east-hall-complete`, `library-restored`, `portrait-hall-complete`, `greenhouse-restored`, `lower-stairwell-complete`, `practice-gallery-complete`, `observatory-door`, `level-1-complete`.

## Enemies

| Enemy | Behaviour | Defeat |
| --- | --- | --- |
| Training dummy | Hops at the player; practice targets in the gallery | Spins back to its stand |
| Mischief sprite | Skitters along a curve, pounces | Spins into leaf sparkles |
| Runaway book | Dives, patrols, page-gust attack | Flaps back to the shelves |
| Ink wisp | Shield word, then binding word; casts ink | Ink flows away |
| Thorn pod | Rooted; glows, then fires a seed | Petals close, dormant |
| Mossling | Charges in, swipes | Settles into a moss mound |
| Armour guardian | Blocks the path; two command words | Calms and steps aside |
| Paint imp | Leaps from a frame, throws paint | Splashes apart |

## Music

Light-hearted: Once Upon a Time for wonder and calm moments, Treasure Hunter in the library and tower, Medieval: Battle for fights, Battle Theme B for the bosses, A Legend Will Rise for the ward repair and celebration.
