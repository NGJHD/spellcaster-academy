/**
 * All Level 1 subtitle lines (LD-7 … LD-18). No voice acting; text only.
 * Keep lines short: one or two subtitle lines suitable for a ten-year-old.
 */
import type { AreaId } from '../game/types';

export type Speaker = 'pip' | 'mira' | 'orin' | 'portrait-1' | 'portrait-2' | 'warden' | 'unwriter';

export interface DialogueLine {
  readonly speaker: Speaker;
  readonly text: string;
}

export const SPEAKER_NAMES: Record<Speaker, string> = {
  // Owner feedback: make it clear Pip is the guide orb, not the player.
  pip: 'Guide Orb',
  mira: 'Mira',
  orin: 'Keeper Orin',
  'portrait-1': 'Portrait',
  'portrait-2': 'Another Portrait',
  warden: 'Ward Warden (translated by Pip)',
  // Unnamed in Level 1: Orin names him in the ending.
  unwriter: '???',
};

const line = (speaker: Speaker, text: string): DialogueLine => ({ speaker, text });

export const LINES = {
  // Opening and Arrival Gate
  'open-1': line('pip', 'Asterfall Academy! Quick — type the sparks as we fly!'),
  'open-snatch': line('pip', 'HEY! Put me DOWN! Type its word — quick!'),
  'open-rescued': line('pip', 'Thank you! That sprite looked scared, not naughty. Strange.'),
  'open-2': line('pip', "I'm Pip, your guide orb. Odd — the gate should already be open for you."),
  'open-3': line('pip', 'The gate crystals have gone dim. Type their words to wake them!'),
  'gate-first-correct': line('pip', 'Good! Each correct letter gathers magic.'),
  'gate-first-word': line('pip', 'And the final letter casts it. Very neat.'),
  'gate-first-mistake': line('pip', 'Almost. Backspace can pull that letter back.'),
  'gate-pause-tip': line('pip', 'If you ever need a rest, press Escape to pause.'),
  'gate-done': line('pip', 'Open! But crystals never fall asleep. Something is wrong today.'),
  'fracture-1': line('pip', 'That is… not part of the welcome ceremony.'),
  'fracture-2': line('orin', 'All students, stay inside! The celestial ward is breaking!'),
  'fracture-3': line('pip', "Breaking? It's kept us safe for a hundred years! Quick — the anchors, courtyard first!"),

  // Sunlit Courtyard
  'court-1': line('pip', 'The dummies are fighting by themselves? The whole academy has gone jumpy.'),
  'court-first': line('pip', 'Perfect. You did not need to aim — the word guided your spell.'),
  'court-sprites': line('pip', 'Sprites? They never leave the forest. What scared them out here?'),
  'court-tab-tip': line('pip', 'Start any word you like. Tab also switches targets, if you ever need it.'),
  'court-breathe': line('pip', 'Breathe. Read the whole word, then begin.'),
  'court-warden': line('pip', 'The Warden! Is it breaking the ward… or trying to fix it?'),
  'court-chase': line('pip', 'That sprite stole a star page! After it — along the roof!'),
  'court-chase-caught': line('pip', 'Got it! Look — half the page has gone grey, like the ink was rubbed out.'),
  'court-anchor-intro': line('pip', "The anchor's runes are scratched out. Someone did this on purpose!"),
  'court-anchor-done': line('pip', "Fixed! But runes don't scratch themselves. Who did this?"),
  'page-hint': line('pip', 'A star page! Type its word to catch it — only if you want to.'),

  // East Hall
  'east-1': line('mira', "You're the new apprentice?! RUN — the books are escaping!"),
  'east-run-1': line('mira', "They're not chasing us — they're running AWAY from something!"),
  'east-run-2': line('pip', "Running from what? Books don't get scared!"),
  'east-run-3': line('mira', 'These ones do! Their pages are going blank!'),
  'east-2': line('pip', 'We restored the courtyard anchor entirely according to plan.'),
  'east-3': line('mira', 'Your plan began after the ward broke.'),
  'east-4': line('pip', 'The best plans are flexible.'),
  'east-5': line('mira', 'The library anchor is next. Watch the floating books. They hate being read backwards.'),
  'east-chest': line('pip', 'A constellation chest! Quick — crack it open!'),
  'east-chest-done': line('pip', 'A Starlight wand trail! Very stylish.'),
  'east-6': line('mira', 'And I saw the Warden carry a piece of the sky into the tower. It looked worried.'),
  'east-7': line('pip', 'Stone faces cannot look worried.'),
  'east-8': line('mira', 'That one did.'),

  // Whispering Library
  'lib-1': line('pip', 'Listen… the books are whispering. They keep saying "the crack".'),
  'lib-books': line('pip', "Runaway books! Type their words and they'll settle back on the shelves."),
  'lib-wisps': line('pip', 'Spilled ink, come alive! Shield word first, then the binding word.'),
  'lib-mosaic': line('pip', 'This mosaic shows the Warden locking a man with a pen behind the sky. Who is he?'),
  'lib-grim-1': line('pip', "The Grimoire is awake — the oldest book in the school. And it's terrified!"),
  'lib-grim-clasps': line('pip', 'Its clasps! Type each word to loosen one.'),
  'lib-grim-pages': line('pip', 'Flying pages! Watch for the gusts — they glow before they blow.'),
  'lib-grim-sentence': line('pip', 'Push it back! Every word makes your beam stronger!'),
  'lib-grim-done': line('pip', "It's calm. It whispered one word before it slept: \"Unwriter\"."),
  'lib-anchor-intro': line('pip', 'The library anchor wants four words. Read carefully.'),
  'lib-anchor-done': line('pip', 'Two anchors — and Frost Thread! Now… what is an Unwriter?'),

  // Hall of Portraits
  'por-ambush': line('pip', 'The portraits are ALIVE! Paint imps — dodge the splats!'),
  'por-1': line('portrait-1', 'The ink is waking up! Last time this happened, a wizard was banished!'),
  'por-2': line('portrait-2', "Hush, you old fool! We don't say his name!"),
  'por-3': line('pip', "Whose name? Why won't anyone tell us?"),
  'por-fountain': line('pip', 'A healing fountain! HP full. Catch the droplets!'),
  'por-4': line('mira', "There's an empty frame down here. The name on it is scratched out — right next to the Warden's."),
  'por-5': line('pip', 'Scratched-out names. Grey pages. Someone is rubbing things out of our world.'),
  'por-const': line('pip', 'Constellation plaques! Name all three, fast, for a big bonus!'),
  'por-const-done': line('pip', 'Star-reader! Your next spells will shine extra bright.'),

  // Enchanted Greenhouse
  'gh-1': line('pip', 'A SNAPVINE! Grow the bridge — quick, before it bites!'),
  'gh-snap': line('pip', 'Missed us! Ha! Keep going!'),
  'gh-stampede': line('pip', 'Mossling stampede! Here they come!'),
  'gh-pods': line('pip', 'The glowing pod is about to fire. Type its word first!'),
  'gh-moss': line('pip', "They're frightened. Look — every plant near the crack's light has gone grey."),
  'gh-warden': line('pip', "The Warden saved the seedlings! It's not our enemy — it's fighting the crack!"),
  'gh-anchor-intro': line('pip', 'Three vine knots: weather, plants and colours.'),
  'gh-anchor-done': line('pip', 'Three anchors! The Warden is holding the crack shut all alone. To the observatory!'),
  'gh-chain': line('pip', 'Chain Spark unlocked! Five perfect words in a row send sparks to nearby foes.'),

  // Lower Stairwell
  'st-1': line('pip', 'No time for stairs — hop on the tea tray! WHEEEE!'),
  'st-2': line('pip', 'Guards ahead! Command them out of the way!'),
  'st-3': line('pip', 'Uh-oh. This one needs a little more convincing.'),
  'st-done': line('pip', 'Even the guards are nervous. Whatever is outside the ward, they can feel it.'),

  // Practice Gallery
  'gal-1': line('mira', 'Every strange thing points to the observatory. Tune your wand here first!'),
  'gal-2': line('pip', 'Welcome to the GALLERY GAUNTLET! Targets UP!'),
  'gal-p1': line('pip', 'Zone one: ACCURACY! Clean letters, folks — the crowd goes wild!'),
  'gal-p2': line('pip', 'Zone two! Two quick dummies and a big guard. Who goes first?'),
  'gal-p3': line('pip', 'Zone three! And the apprentice goes for the COMBO! Five perfect in a row!'),
  'gal-bonus': line('pip', 'BONUS ROUND! Six targets, one clock — can you beat your best?'),
  'gal-bonus-done': line('pip', 'What a finish! Somebody frame that score!'),
  'gal-assist': line('pip', "Let's try some shorter words. Same magic, smaller spells."),
  'gal-5': line('mira', "The crack is right above the tower. Whatever's pushing on it — we stop it tonight."),
  'gal-6': line('pip', 'Ready enough. Fully ready would require six more forms and a signed—'),
  'gal-7': line('mira', 'Go.'),

  // Moon Tower
  'tw-1': line('pip', 'Mosslings on the lift landing! Clear them, then we go UP!'),
  'tw-lift': line('pip', 'Going UP! Hold on to something — anything!'),
  'tw-moss-done': line('pip', 'Look — their moss is settling safely in the planters.'),
  'tw-2': line('pip', 'Shielded wisps. Shield word first, then the binding word.'),
  'tw-3': line('pip', 'WHOA — it came through the FLOOR! Three commands should calm it!'),
  'tw-guard-done': line('pip', "It's kneeling. And opening the door for us!"),
  'tw-pre': line('pip', 'The crack is behind this door. Read first. Type clearly. Ready?'),

  // Observatory
  'obs-1': line('pip', 'The Warden is holding the crack shut — and its defences think WE are the danger!'),
  'obs-symbol': line('warden', 'PROTECT — SEAL — NO ENTRY'),
  'obs-2': line('pip', "It thinks keeping everyone out is the only safe choice. Let's prove there is another way."),
  'obs-w1': line('pip', 'Each word loosens one plate. Watch for the light — it glows before it swings.'),
  'obs-plate3': line('pip', 'The core is close. Keep your rhythm.'),
  'obs-w2': line('pip', 'Runes! Each one starts with a different letter. Pick any you like.'),
  'obs-anchors': line('pip', 'It can feel the anchors. It knows we restored them.'),
  'obs-w3': line('pip', 'The ward is cracking! Push it back — type the academy values!'),
  'obs-restored': line('warden', 'WARD RESTORED · APPRENTICE RECOGNISED'),
  'obs-end': line('pip', 'It was never our enemy. It was holding the door shut… against someone on the other side.'),

  // Power-up waves (first use of each new spell)
  'power-spark': line('pip', 'Try out your Spark Bolt — BLAST them!'),
  'power-frost': line('pip', 'Perfect words freeze the rest! Show them Frost Thread!'),
  'power-chain': line('pip', 'Five perfect in a row and the sparks LEAP! Go, go, go!'),

  'lib-mosaic-2': line('pip', "I… don't know. That part of my memory is blank. That's never happened before."),
  'seam-1': line('unwriter', 'Clever little apprentice. But one crack is all I need.'),
  'seam-2': line('pip', 'That voice… I know that voice. But how?'),
  // Shared
  'focus-reset': line('pip', "Let's take a breath and try that part again."),
  'assist-offer': line('pip', "I'll make the words a little shorter for this part. You've got this."),
  'spell-frost': line('pip', 'Frost Thread! A perfect word slows the others down.'),
  'spell-chain': line('pip', 'Chain Spark! Five perfect words in a row!'),

  // Ending
  'end-1': line('orin', 'You mended the ward, apprentice. But it was not broken from in here.'),
  'end-2': line('orin', 'It was torn from OUTSIDE — by the only wizard who ever wrote in fire. The Unwriter.'),
  'end-3': line('mira', "And how to survive Pip's planning."),
  'end-4': line('pip', 'The man with the pen. My blank memory. Keeper… who IS he?'),
  'end-5': line('mira', 'Eventually.'),
  'end-6': line('orin', 'A story for another night. Welcome to Asterfall, apprentice. Rest — we may need you soon.'),
} satisfies Record<string, DialogueLine>;

export type KnownLineId = keyof typeof LINES;

export function getLine(id: string): DialogueLine | undefined {
  return (LINES as Record<string, DialogueLine>)[id];
}

/** One-sentence goal summaries Pip gives after resuming (GD-21). */
export const RESUME_SUMMARY: Record<AreaId, DialogueLine> = {
  'arrival-gate': line('pip', "Welcome back! Let's wake the gate crystals."),
  'sunlit-courtyard': line('pip', 'The Courtyard Anchor needs us. Ready your wand.'),
  'east-hall': line('pip', 'We restored the courtyard. The Library Anchor is next.'),
  'whispering-library': line('pip', 'Back in the library. Mind the books.'),
  'hall-of-portraits': line('pip', 'Two anchors restored. The greenhouse is next.'),
  'enchanted-greenhouse': line('pip', 'The Greenhouse Anchor is wrapped in vines. Let’s free it.'),
  'lower-stairwell': line('pip', 'Down the stairwell — the guards need commands.'),
  'practice-gallery': line('pip', 'A little practice, then the tower.'),
  'moon-tower': line('pip', 'Up the Moon Tower. The observatory is close.'),
  observatory: line('pip', 'The Warden needs our help. Read first, type clearly.'),
  'celebration-courtyard': line('pip', 'The ward is safe. Time to celebrate!'),
  'l2-festival-lawn': line('pip', 'The Hush are here. Get everyone off the lawn!'),
  'l2-dormitory': line('pip', 'The first-years are still in the dormitory. Up we go!'),
  'l2-bell-bridge': line('pip', 'Light the bridge beacon so the students can cross.'),
  'l2-great-hall': line('pip', 'Hold the Great Hall doors — everyone is gathering there.'),
  'l2-workshops': line('pip', 'The furnace beacon. Clear the ash and light it!'),
  'l2-lantern-lake': line('pip', 'The boats are leaving. Keep the lake clear!'),
  'l2-burning-library': line('pip', 'They are stealing the library pages. Stop them!'),
  'l2-ramparts': line('pip', 'The last beacon is on the ramparts. The Warden is with us.'),
  'l2-tower-roof': line('pip', 'The wyrm is on the tower. This is it!'),
  'l2-aftermath': line('pip', 'The fires are out. Everyone is safe.'),
  'l3-rift-shore': line('pip', "We're through the Rift. Stay close."),
  'l3-cinderwood': line('pip', 'Through the burnt forest. Bring the colour back!'),
  'l3-inkfall': line('pip', 'Down the ink falls — hold on!'),
  'l3-margin-library': line('pip', 'The pages here remember things. Find them.'),
  'l3-unfinished-gallery': line('pip', 'The Perfect Warden guards the gallery. Careful.'),
  'l3-paper-sea': line('pip', 'Across the Paper Sea to the Citadel.'),
  'l3-forge': line('pip', 'The Forge of Unwriting. Stop the hammers!'),
  'l3-citadel': line('pip', 'Up the Cinder Citadel. He is at the top.'),
  'l3-throne': line('pip', 'The Unwriter. Read first. Type clearly. We can do this.'),
  'l3-homecoming': line('pip', "We're home."),
};
