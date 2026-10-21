# LEVEL3_DESIGN.md — Level 3: Into the Unwritten

Level 3, the finale, as it plays. Game-wide rules are in `CLAUDE.md`; the exact words of every line are in `src/content/dialogue.ts` and the route in `src/level/areas3/` (assembled by `src/level/level3Route.ts`).

## Identity

- **Length:** about 12–17 minutes at Fast, the longest level.
- **Look:** the Blank, a scorched land of grey ash and burnt paper under a red sky full of smoke and firelight, with rivers and falls of molten red ink, and fires that never go out. At its heart, the Cinder Citadel: black iron, molten ink and roaring fire. Typing quenches fires and brings colour back. The homecoming is the Level 1 courtyard at night, with fireworks.
- **Tone:** the climax: darker and more dramatic than Level 2, never horror.
- **Goal:** cross the Blank to the Cinder Citadel and stop the Unwriter.

## Story

Keeper Orin holds the Rift open while the Warden carries the apprentice, Pip and Mira through. Pip somehow knows the fortress's name: the Cinder Citadel. Everything the Unwriter erased ends up in the Blank, the academy's own books, fountain and bell among it. In the Margin Library Corvane's journal burns, and its pages show that he built Pip, called Pip "wrong too often" and raised the quill; Pip fled through the ward as it closed. Mira: "You're wrong ALL the time, Pip. It's your best feature." The journal's last page teaches Bright Quill.

The Unwriter's Perfect Guardian, a flawless copy of the Warden, guards his gallery; the real Warden and the apprentice break it together ("cracks are not flaws"). Across the paper sea and through the forge that makes the Hush, the party climbs the Citadel as fire races up behind them, and Pip's glitches peak ("Correction required"), until Mira tells Pip to say something wrong ("The moon is made of… SOUP!").

At the Throne of Ash the Unwriter has chained the Warden in ropes of fire. He tries to erase Pip, burning Pip's rings; the apprentice restores them (brave, curious, kind) and Pip chooses to stay as Pip. The six words he forgot, "every mistake teaches us something new", break the Quill, and he is sealed in his own book. Colour returns to the Blank, the Warden is freed and carries everyone home, and in the courtyard Keeper Orin thanks the apprentice and names them Asterfall's first Wardkeeper in a hundred years.

## Characters

- **Pip**, **Mira** (a fighting ally: she folds the paper ship and sings the Shield Song), **the Ward Warden** (carries the party, fights beside the apprentice, is chained at the throne), **Keeper Orin** (at the start and the homecoming).
- **The Unwriter (Corvane Hale):** a tall hooded figure in charred black robes with glowing ember cracks, a cracked white porcelain mask with a burning red line, and the Unwriting Quill in his hand. Cold, quiet and certain; he laughs as he talks. He grows larger and more fiery through the fight. Frightening in a family-film way: no gore, no threats to anyone's body; his threat is unwriting things.
- **The Unfinished:** a deer and a great tortoise, half rubbed out; restored, they help.

## Mechanics introduced

- **Path words:** where the way has burned away, words write it back: stepping stones, a slide, walkways, stairs.
- **Colour words:** bonus words on burnt, smouldering things that quench them and repaint them (on the paper sea).
- **Fire tides:** a wall of inkfire rolling at the camera, countered by a two-word phrase on one tag (`hold fast`, `steady on`, `hold on`).
- **Bright Quill:** a perfect word splashes colour and extra score.
- **Mira's Shield Song:** when HP is low, Mira offers a song word that heals 25 and blocks the next hit (at most every 20 s).

All earlier spells carry over (Spark Bolt, Frost Thread, Chain Spark, Starfall).

## Flow

### Through the Rift and the Rift Shore

- **Set piece:** the Warden surges up into the Rift with the party while burning debris flies at them (two counter-words). Orin: "bring back what he took!"
- The first view of the Blank: ash plains, burnt forest, rivers of glowing ink, and far away the Citadel wrapped in fire. The Warden dives to the shore while correction moths rise to meet it (two chase words). Checkpoint `rift-crossed`.
- The path has burned away: `step` and `stone` write stepping stones across the ink.
- A blotling and an imp burst up out of the ash. Checkpoint `rift-shore-written`.

### Cinderwood

- A dense burnt forest. A deer half rubbed out: `gentle` draws it back, and it bounds ahead.
- A correction moth (with a fireball); redactors, tall black bars of ink, trying to rub out the woods (two).
- **Speed round:** a flock of birds, `wing` and `song` in 9 seconds.
- A great tortoise, half rubbed out: `ancient`. It offers a ride; its shell is fireproof. **Set piece:** it carries the party straight through the flames while correction moths keep pace beside it (two chase words). Checkpoint `cinderwood-coloured`.

### Inkfall Cascades

- A burning river of ink falls in terraces towards the Citadel. Mira waits on a raft made of one huge page; a hop on.
- The ink is burning hot: `shield` raises a frost bubble over the raft.
- **Set piece: the raft descent.** The raft rides each terrace to its lip, then drops. A blotling on the banks (with a fireball); a fire tide in the basin (`hold fast`).
- The falls are broken: the apprentice steps to the raft's bow and looks down as `slide` and `swoop` write a slide, then the raft rides it into the pool. A hollow knight wades out (with a fireball). Checkpoint `inkfall-descended`.
- **The way on:** the raft runs ashore below a cliff with a stone doorway in it, an open-air walk between bookcases beyond. Scraps of erased books stream off the falls and in through it. Pip: "Let's follow them!" Mira runs ahead; we walk through.

### Margin Library

- Asterfall's own library, erased: a roofless ruined hall of marble under the red sky, torn in two by a chasm over burning ink, with bookcases floating upside down above it. We come out of its front doorway; across the chasm, the far half of the hall has a stone arch in its back wall.
- Burning books fall (two counter-words) while `ledge` and `bridge` write the walkway across.
- A flying page and a shielded wisp.
- **Set piece: the burning journal.** At the hall's heart Corvane's journal bursts into a tornado of fire. Its pages (`orb`, `quill`) show Pip being built, then the quill raised. Wisps pour out of the tornado (two shielded); Pip and Mira's exchange plays over them.
- The last page glows: `bright` teaches Bright Quill (power-up card), then three easy grey sprites to repaint. Checkpoint `margin-library-remembered`.
- **The way on:** through the arch at the hall's far end, a landing lined with statues on plinths and the gallery's black stone front door, a firelit hall beyond. Mira: it is his gallery of stolen things, on the way to his Citadel.

### Gallery of Unfinished Things

- A roofless hall of black volcanic stone. We come in through its front door from the statue landing. Asterfall's stolen treasures stand on marble plinths, smouldering: the fountain, the Bell Bridge bell, the Great Hall clock.
- **Speed round:** `fountain` and `bell` in 10 seconds restore them.
- **Boss: THE PERFECT GUARDIAN** ("Keeper of the Unfinished Gallery"): the Unwriter's black-iron copy of the Warden, red fire in its seams, smashing out of the far wall. "Meet my PERFECT guardian." It floats with its arms spread down and its legs crossed; fire orbs gather in front of it and circle faster until they blur into a ring of fire, then it thrusts its palms and blasts the ring at the player as a stream.
  - **P1 Mirror:** plate words one at a time, then a counter-word for its arc.
  - **P2 Shell:** only perfect words crack it (a word with mistakes counts half; every word counts on Gentle).
  - **P3:** the real Warden pins it while the apprentice types the beam phrase `cracks are not flaws`; it shatters.
- The wall behind it collapses block by block, showing the paper sea below and the Citadel beyond. Mira: that was only his guard. We walk to the gap. Checkpoint `perfect-warden-defeated`.

### Paper Sea

- Mira folds a huge page into a ship. The camera stands at its origami prow with its lantern ahead. Folded-paper waves; half-sunk burning wrecks.
- A colour word and a correction moth stream past (two chase words).
- **Set piece: the Hush fleet.** Three black-sailed galleons; the ship sails through the gap between them. A cannon fireball and a hollow knight crew, then a mast word for each galleon: each mast crashes down in flames and the ship lists and burns.
- **Firestorm:** a correction moth and a fire tide (`steady on`). Then the Citadel looms out of the smoke. Checkpoint `paper-sea-crossed`.

### Forge of Unwriting

- A roaring foundry in the Citadel's roots: rivers of molten ink pour from cauldrons into moulds, house-sized hammers slam. Its fire keeps the Citadel gates locked.
- **Three machines.** At each, beat its monsters, then pull its two levers; each stopped machine's furnace blows out:
  - a blotling and a fireball, then `stop`, `halt`;
  - two smudgehounds, then `brake`, `still`;
  - **the Foreman**, the forge's boss, who swings its hammer over its shoulder and smashes it down (`duck` blocks its fire), then `freeze`, `close`.
- The forge goes cold and the gates open. Checkpoint `forge-stopped`. Fire comes back up; a castle door on the forge's wall leads up into the Citadel.

### Cinder Citadel

- **Set piece: the fire race.** Its stairs have burned away; four flights are written as we climb (`stair`, `climb`; `higher`, `rising`; `ladder`, `summit`; `almost`, `there`) while a wall of fire races up the stairwell behind, always stopping short. Each flight ends at the front edge of its landing.
- Landings: a correction moth with a fireball; then two redactors.
- Pip says "Correction required" on the third flight; on the fourth Mira gets Pip to say something wrong.
- At the top the Warden smashes the great doors open. Checkpoint `citadel-summit`.

### Throne of Ash

- A circular iron platform above a sea of fire, ringed with braziers, under the red sky. The Unwriter rises from a column of fire before his throne of charred pages. The Warden is bound at the side in ropes of fire staked to the floor, straining against them. Pip: "he's chained up our Warden! It's up to us!"
- **Boss: THE UNWRITER** ("Lord of the Blank"). He laughs when he talks and charges his quill before he attacks.
  - **U1 Erasure:** seal pages around him, while his quill strokes fly at the camera as fireballs.
  - **U2 Perfect copies:** black-iron "perfect" copies of past foes rise from the flames: a training dummy, then the Page Dragon's motto, `every page`.
  - **U3 Correcting Pip:** the camera steps closer. He raises his quill overhead, then thrusts it at Pip, who stays beside the apprentice; a stream of fire runs from the quill's tip to Pip and a ring of burning script closes round Pip. Pip's ring words float beside Pip: `brave`, `curious`, `kind`, between his strokes and a fire tide (`hold on`). A hollow knight joins in (a bonus target). Pip breaks free: "I am Pip. I am wrong sometimes. And I am staying exactly like this."
  - **U4 The first lesson:** a beam struggle, `every mistake teaches us something new`. The Quill shatters, his fire is torn out of him and his own book seals him. Pip: "Correction: you're done."
- Colour pours back across the Blank; the ropes binding the Warden break. "THE WAY HOME IS OPEN. HOLD ON TO ME." Finishing unlocks the Bright Quill wand trail. Checkpoint `unwriter-sealed`.

### Homecoming

The Level 1 courtyard at night, every student out to cheer at their own rhythm, fireworks overhead and a victory theme. Keeper Orin thanks the apprentice ("brave when it was frightening, and kind when it was hard"), names them Asterfall's first Wardkeeper in a hundred years, and Mira leads three cheers. Then the results and each chapter's best.

## Checkpoints

`rift-crossed`, `rift-shore-written`, `cinderwood-coloured`, `inkfall-descended`, `margin-library-remembered`, `perfect-warden-defeated`, `paper-sea-crossed`, `forge-stopped`, `citadel-summit`, `unwriter-sealed`, `level-3-complete`.

## Enemies

The Hush from Level 2 return (blotlings, scribble imps, smudgehounds, hollow knights, flying pages, wisps, fireballs), with the Unwriter's own constructs:

| Enemy | Behaviour | Defeat |
| --- | --- | --- |
| Correction moth | Wings of burning paper; swoops at the party | Bursts into embers, leaving a bright butterfly |
| Redactor | A tall black bar of ink with a burning slit; glides to strike things out | Splits with a crack of light into embers |
| Foreman | A hulking forge-master in black iron with a furnace in its chest and a huge hammer | Its furnace blows out and it crashes down |
| Fire tide | A wall of inkfire with a two-word counter | Breaks into sparks |

## Music

Sinister: Dark Shrine Loop as the Blank's theme, Evil Approach for battle, Epic Endgame for the Unwriter, A Legend Will Rise as colour returns, and the Victory Theme for the homecoming.
