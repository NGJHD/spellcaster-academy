# LEVEL2_DESIGN.md — Level 2: The Siege of Asterfall

Level 2 as it plays. Game-wide rules are in `CLAUDE.md`; the exact words of every line are in `src/content/dialogue.ts` and the route in `src/level/areas2/` (assembled by `src/level/level2Route.ts`).

## Identity

- **Length:** about 10–15 minutes at Fast.
- **Look:** the academy at night, burning under a red sky. Red-black inkfire, smoke and embers everywhere, the Rift tearing across the sky over Lantern Lake, and the gold light of the beacons pushing back. Inkfire never covers a word.
- **Tone:** urgent and dramatic. Nobody is hurt; everything that burns can be put out and restored.
- **Goal:** rescue the first-years, light the four beacons that raise the Lantern Ward, and stop the Page Dragon.

## Story

The crack left in the sky tears open into the Rift. The Unwriter's voice greets the school ("Hello again, little school. Did you miss me?") and his army, the Hush, pours in and sets the academy alight with inkfire, which burns things to grey ash. The apprentice rescues the first-years trapped in the Dormitory Tower; Keeper Orin explains the four beacons that raise the Lantern Ward, a shield the Hush can't cross. A dragon made of the library's stolen pages is building itself on the Moon Tower. With the ward up, the Warden carries the apprentice up the tower to beat it. In its heart is a red crystal: a shard of the Unwriting Quill. Keeper Orin names its owner, Corvane Hale; Pip glitches ("Correction required."); the Rift can only be closed from the other side, so someone has to go through.

## Characters

- **Pip**, **Mira** (leads the first-years to safety), **the Ward Warden** (an ally: it holds the ramparts and carries the apprentice up the tower), **Keeper Orin** (directs the defence).
- **Prefect Idris:** holds the Great Hall's barrier.
- **Oarsby:** the boatkeeper who rows to the lighthouse.
- **The Unwriter:** heard, not seen; his voice speaks through the Rift and through the Grey Herald.
- **The Hush:** ink-and-ember constructs that burst into sparks and ash when beaten.

## Mechanics introduced

- **Counter-words:** fireballs and ink blasts fly at the camera carrying a short word on a pale tag. Typing it blocks them; an unblocked one bursts on the apprentice and comes back again until its word is typed. They take the lock even mid-word.
- **Inkfire and restoring:** burning objects carry a restore word that blasts the fire out and repaints them; doors, planks and the Warden must be restored to continue.
- **Beacons:** each takes three words and sends a beam into the growing Lantern Ward. A beacon map card shows the beacons lit and the next stop as each area is left.
- **Starfall:** learned from the furnace beacon's fire; every eighth perfect word in a row rains stars on every weak enemy.

Spark Bolt, Frost Thread and Chain Spark carry over from Level 1.

## Flow

### Bedroom (top of the Dormitory Tower)

- Pip shouts the apprentice awake (`wake`). Through the window: the academy on fire, and the crack tearing open into the Rift. The Unwriter's voice; Pip recognises it from the observatory.
- Scribble imps climb in at the window (two). Someone is calling for help downstairs: the first-years.

### Dormitory Tower

- Down the burning spiral stair. On each of three landings imps are setting a door alight with a first-year trapped behind it, backed against the door inside a half-ring of flames. Blast the imps, then restore the door (`open`, `free`, `safe`); the student calms, walks off down the stairs and the flames go out.
- On landing 3 a smudgehound climbs the stairs to the player.
- Mira takes the first-years to the Great Hall. Checkpoint `dormitory-rescued`. Out of the tower door onto the lawn.

### Lantern Festival Lawn

- Keeper Orin: "Watch the sky!" **Fireballs:** the counter-word tutorial (`ink`, then `run` and another), time freezing on the first.
- The lawn burns. Orin names the Hush; blotlings with a fireball.
- A festival stall on fire: `stall` puts it out and repaints it.
- Eraser moths and blotlings while the students cross. Orin explains the four beacons and the Lantern Ward. Checkpoint `festival-lawn-complete`. The Bell Bridge beacon is closest.

### Bell Bridge (Beacon 1)

- **Set piece: the collapsing bridge.** The camera races along the burning covered bridge as it falls into the gorge behind; burning planks ahead need `plank`, `beam`, `rail`.
- Eraser moths cover the bell to keep it quiet (a moth and a fireball).
- **Bell Beacon:** `ring`, `bright`, `signal`; the bell tolls loudly with each word and blasts the moths away. Checkpoint `bell-beacon-lit`.
- Pip: the Hush are attacking the students at the Great Hall.

### Great Hall

- Prefect Idris holds a barrier at the far end over the first-years. Hush push through three side doors (a blotling and an imp), then two hollow knights with two words each.
- **Boss: THE GREY HERALD** ("Voice of the Unwriter"): a hooded figure of charred paper, a glowing book in one hand. It bursts through the doors; the Unwriter speaks through it: "Such a noisy, untidy school. Let me tidy it."
  - It preaches from its book, its free hand rising and falling, while wisps rise from the pages and circle its head, faster as more gather. When it attacks it points its hand at the player and the wisps rush in.
  - **Phase 1, the decree:** its decree words, one at a time, beside it; an arena attack builds.
  - **Phase 2, the wisps:** counter-words for the wisp blasts, an imp, and a word beside its book.
  - **Phase 3:** a beam struggle, `not on my watch`.
- Idris: the hall holds. Checkpoint `great-hall-held`. The next beacon is the furnace in the workshops behind the hall.

### Alchemy Workshops (Beacon 2)

- The furnace beacon is choked with ash. A smudgehound darts between the benches (with a fireball).
- **Optional speed round:** the valves, `copper` and `steam` in 8 seconds.
- **Furnace Beacon:** `ember`, `flame`, `forge`; the furnace roars back to life and its fire flows into the wand: Starfall, then three easy blotlings. Checkpoint `furnace-beacon-lit`. The third beacon is the lighthouse; we need a boat.

### Lantern Lake (Beacon 3)

- On the jetty Oarsby introduces himself; type `row` to board, and the boat pushes off across a lake reflecting the Rift, burning lanterns drifting on it.
- Moths over the water and blots in the waves; the boathouse burns, with a hollow knight and a moth on the jetty.
- **Set piece: the lighthouse lift.** A brass lift waits at the bottom of a shaft on the island's rim; it shoots straight up while moths smash through every window (two chase words).
- **Lighthouse Beacon:** `harbour`, `guide`, `shine`; the lamp turns and its beam sweeps the lake. Checkpoint `lighthouse-beacon-lit`. Pages are pouring out of the library; Oarsby rows there.

### Whispering Library

- The Level 1 library at night, half in flames, pages streaming out of a shattered window. Through it: the dragon of pages on the Moon Tower.
- Paper sprites and a shielded wisp; imps going for the Great Grimoire's star map (two). The Grimoire hands over the map.
- **Optional speed round:** save the shelves, `story` and `verse` in 9 seconds, for the Inkwell wand trail. Checkpoint `star-atlas-recovered`. The map shows the last beacon, on the ramparts.

### East Ramparts (Beacon 4)

- The Warden holds the wall, blasting the scribble imps that climb up beside it with bolts of starlight.
- Three ladders: a blotling and a smudgehound climb over. The inkfire burns the Warden: `stone` and `steady` put it out.
- A Knight Captain bursts onto the parapet in fire and hurls fireballs (`halt`) with two command words.
- **Rampart Beacon:** `rampart`, `stand`, `together`. The Lantern Ward closes over the academy. Orin: every student is safe, but the dragon is inside it. Checkpoint `rampart-beacon-lit`.

### Moon Tower Roof

- **Set piece: the palm ride.** The Warden lifts the apprentice up the outside of the burning tower on its palm, over the parapet; a fireball streaks down at them.
- **Boss: THE PAGE DRAGON** ("Thief of the Library"): a winged dragon of burnt pages, perched on the far parapet. Fire builds in its throat, chest and belly between attacks, flames lick from its jaws at the wind-up, then a jet of fire breath; each word typed sets the build back.
  - **V1 Scales:** page scales on its body, one at a time, while its breath sweeps the roof; the Unwriter's voice over the typing.
  - **V2 Sky chase:** it takes off and hovers to one side of the tower, then the other, facing the camera; the gland words sit on its chest and belly, and it breathes fireballs at the apprentice until they are hit.
  - **V3:** it crashes onto the roof with its heart exposed: a beam struggle, `every page has a place`. It bursts into pages that flutter home. Checkpoint `wyrm-defeated`.

### Aftermath (the roof at dawn)

Pip finds a red crystal from the dragon's heart; Orin names it and its owner, Corvane Hale, who became the Unwriter; Pip glitches. The ward will hold for a while, but the Rift can only be closed from the other side. Mira: "Then someone has to go through." Pip: "After a short rest. And a snack." Then the results.

## Checkpoints

`dormitory-rescued`, `festival-lawn-complete`, `bell-beacon-lit`, `great-hall-held`, `furnace-beacon-lit`, `lighthouse-beacon-lit`, `star-atlas-recovered`, `rampart-beacon-lit`, `wyrm-defeated`, `level-2-complete`.

## Enemies (the Hush)

Ink-black and ash-grey constructs with glowing red-orange eyes and cracks. Scary but never gory.

| Enemy | Behaviour | Defeat |
| --- | --- | --- |
| Blotling | A knee-high mass of bubbling ink; waddles in, flicks ink | Bursts in a splash of ink and sparks |
| Eraser moth | Charred wings edged in embers; swoops, throws dust | Ignites into embers |
| Scribble imp | A jittery scribble with a burning torch-quill; sets scenery alight | Snaps apart into sparks |
| Smudgehound | A snarling charcoal hound; dashes, pauses, lunges | Breaks into embers and ash |
| Hollow knight | Empty black armour with fire inside; two command words (the Captain hurls fire) | The fire goes out with a bang |
| Paper sprite | A folded page; flits in the library | The page flutters back |
| Fireball | A counter-word in a ball of fire flying at the camera | Deflected into sparks |

## Music

Darker than Level 1: Lament of the War for dread and hope, Determined Pursuit for battle, QaziJamJam for the dragon, A Legend Will Rise for the aftermath.
