/**
 * All Level 1 subtitle lines (LD-7 … LD-18). No voice acting; text only.
 * Keep lines short: one or two subtitle lines suitable for a ten-year-old.
 */
import type { AreaId } from '../game/types';

export type Speaker = 'pip' | 'mira' | 'orin' | 'portrait-1' | 'portrait-2' | 'warden';

export interface DialogueLine {
  readonly speaker: Speaker;
  readonly text: string;
}

export const SPEAKER_NAMES: Record<Speaker, string> = {
  pip: 'Pip',
  mira: 'Mira',
  orin: 'Keeper Orin',
  'portrait-1': 'Portrait',
  'portrait-2': 'Another Portrait',
  warden: 'Ward Warden (translated by Pip)',
};

const line = (speaker: Speaker, text: string): DialogueLine => ({ speaker, text });

export const LINES = {
  // Opening and Arrival Gate
  'open-1': line('pip', 'There it is! Asterfall Academy. First day, first wand, first adventure.'),
  'open-2': line('pip', "Apprentice detected! Robes tidy… wand ready… yes, you'll do nicely."),
  'open-3': line('pip', 'This gate listens to letters. Type the word you see, and your wand will do the rest.'),
  'gate-first-correct': line('pip', 'Good! Each correct letter gathers magic.'),
  'gate-first-word': line('pip', 'And the final letter casts it. Very neat.'),
  'gate-first-mistake': line('pip', 'Almost. Backspace can pull that letter back.'),
  'gate-pause-tip': line('pip', 'If you ever need a rest, press Escape to pause.'),
  'gate-done': line('pip', 'Gate unlocked! I knew I had selected the correct apprentice.'),
  'fracture-1': line('pip', 'That is… not part of the welcome ceremony.'),
  'fracture-2': line('orin', 'All students, remain inside the marked halls. The celestial ward is unstable.'),
  'fracture-3': line('pip', 'Three local anchors can steady it. Courtyard first. Hold on!'),

  // Sunlit Courtyard
  'court-1': line('pip', "Training dummies should not train themselves. Let's settle them down."),
  'court-first': line('pip', 'Perfect. You did not need to aim — the word guided your spell.'),
  'court-sprites': line('pip', 'Sprites! Mischievous, quick, and extremely bad at following signs.'),
  'court-tab-tip': line('pip', 'Start any word you like. Tab also switches targets, if you ever need it.'),
  'court-breathe': line('pip', 'Breathe. Read the whole word, then begin.'),
  'court-warden': line('pip', 'That stone guardian is making the damage worse. I think.'),
  'court-anchor-intro': line('pip', "The anchor's runes are cracked. Type each one to line up the rings."),
  'court-anchor-done': line('pip', 'One anchor restored. Your wand has learned Spark Bolt properly now.'),
  'page-hint': line('pip', 'A star page! Type its word to catch it — only if you want to.'),

  // East Hall
  'east-1': line('mira', "You're the new apprentice, aren't you? Good timing. Terrible first day, though."),
  'east-2': line('pip', 'We restored the courtyard anchor entirely according to plan.'),
  'east-3': line('mira', 'Your plan began after the ward broke.'),
  'east-4': line('pip', 'The best plans are flexible.'),
  'east-5': line('mira', 'The library anchor is next. Watch the floating books. They hate being read backwards.'),
  'east-chest': line('pip', "A constellation chest! Type its word if you'd like to open it."),
  'east-chest-done': line('pip', 'A Starlight wand trail! Very stylish.'),
  'east-6': line('mira', 'I saw the Warden carrying broken ward pieces toward the tower. It looked more worried than angry.'),
  'east-7': line('pip', 'Stone faces cannot look worried.'),
  'east-8': line('mira', 'That one did.'),

  // Whispering Library
  'lib-1': line('pip', 'Library rule: quiet voices, careful steps, and absolutely no airborne dictionaries.'),
  'lib-books': line('pip', "Runaway books! Type their words and they'll settle back on the shelves."),
  'lib-wisps': line('pip', 'Those are ink wisps. Break the shield word first, then type the binding word.'),
  'lib-mosaic-1': line('pip', 'Curious. The Warden was built to protect the ward, not command it.'),
  'lib-mosaic-2': line('pip', 'Three anchors… shield… tower. It may be asking for help.'),
  'lib-grim-1': line('pip', 'Or the books may simply be having a very dramatic day.'),
  'lib-grim-clasps': line('pip', 'Its clasps! Type each word to loosen one.'),
  'lib-grim-pages': line('pip', 'Flying pages! Watch for the gusts — they glow before they blow.'),
  'lib-grim-sentence': line('pip', 'It wants a sentence. One word at a time — no rush.'),
  'lib-grim-done': line('pip', 'Returned on time, undamaged, and only slightly enchanted. The librarian may never know.'),
  'lib-anchor-intro': line('pip', 'The library anchor wants four words. Read carefully.'),
  'lib-anchor-done': line('pip', 'Two anchors. And a new spell for perfect words — Frost Thread.'),

  // Hall of Portraits
  'por-1': line('portrait-1', 'A new apprentice during a ward fracture? How traditional.'),
  'por-2': line('portrait-2', 'Nonsense. In my year, the ceiling became a whale.'),
  'por-3': line('pip', 'Please ignore historical exaggeration.'),
  'por-fountain': line('pip', "A focus fountain. Take a breath — you're fully refreshed."),
  'por-4': line('mira', 'The Greenhouse Anchor is wrapped in ward vines. The Warden passed that way, but it cleared falling glass away from the seedlings.'),
  'por-5': line('pip', 'That is… unexpectedly considerate destruction.'),
  'por-const': line('pip', 'Constellation plaques! Name all three for a bonus in the greenhouse.'),
  'por-const-done': line('pip', 'Star-reader! Your next spells will shine extra bright.'),

  // Enchanted Greenhouse
  'gh-1': line('pip', 'These bridge vines grow toward confident words. Convenient plants.'),
  'gh-pods': line('pip', 'The glowing pod is about to fire. Type its word first!'),
  'gh-moss': line('pip', 'They are not monsters. The broken ward has frightened them.'),
  'gh-warden': line('pip', 'Mira was right. The Warden is trying to protect the academy.'),
  'gh-anchor-intro': line('pip', 'Three vine knots: weather, plants and colours.'),
  'gh-anchor-done': line('pip', 'Three anchors restored. The Warden has been carrying the broken energy alone. We need to reach the observatory.'),
  'gh-chain': line('pip', 'Chain Spark unlocked! Five perfect words in a row send sparks to nearby foes.'),

  // Lower Stairwell
  'st-1': line('pip', 'Ceremonial guards. They respond to academy commands — or they did yesterday.'),
  'st-3': line('pip', 'Uh-oh. This one needs a little more convincing.'),
  'st-done': line('pip', 'Very formal. Even during an emergency.'),

  // Practice Gallery
  'gal-1': line('mira', 'The tower is full of unstable ward energy. The gallery can tune your wand before you go.'),
  'gal-2': line('pip', 'A short practice examination.'),
  'gal-3': line('mira', 'Practice. Not examination.'),
  'gal-4': line('pip', 'A short practice that records several measurable results.'),
  'gal-p1': line('mira', 'Speed comes later. Clean letters make strong spells.'),
  'gal-p2': line('pip', 'Two quick dummies and one strong guard. You choose who goes first.'),
  'gal-p3': line('pip', 'Now, five perfect words in a row. Steady and careful.'),
  'gal-assist': line('pip', "Let's try some shorter words. Same magic, smaller spells."),
  'gal-5': line('mira', "Your wand is steady. The Warden needs help, and you're ready to give it."),
  'gal-6': line('pip', 'Ready enough. Fully ready would require six more forms and a signed—'),
  'gal-7': line('mira', 'Go.'),

  // Moon Tower
  'tw-1': line('pip', 'Mosslings! Gently does it.'),
  'tw-moss-done': line('pip', 'Look — their moss is settling safely in the planters.'),
  'tw-2': line('pip', 'Shielded wisps. Shield word first, then the binding word.'),
  'tw-3': line('pip', 'A tower guardian. Three commands should calm it.'),
  'tw-guard-done': line('pip', "It's kneeling. And opening the door for us!"),
  'tw-pre': line('pip', 'Beyond this door, the Warden may not recognise us. Read first. Type clearly. We are here to repair, not destroy.'),

  // Observatory
  'obs-1': line('pip', 'Its defence routine has locked us out. We must reach the core without harming the Warden.'),
  'obs-symbol': line('warden', 'PROTECT — SEAL — NO ENTRY'),
  'obs-2': line('pip', "It thinks keeping everyone out is the only safe choice. Let's prove there is another way."),
  'obs-w1': line('pip', 'Each word loosens one plate. Watch for the light — it glows before it swings.'),
  'obs-plate3': line('pip', 'The core is close. Keep your rhythm.'),
  'obs-w2': line('pip', 'Runes! Each one starts with a different letter. Pick any you like.'),
  'obs-anchors': line('pip', 'It can feel the anchors. It knows we restored them.'),
  'obs-w3': line('pip', "It's holding the ward together. Type the academy values to repair it."),
  'obs-restored': line('warden', 'WARD RESTORED · APPRENTICE RECOGNISED'),
  'obs-end': line('pip', 'It was never our enemy. It was waiting for someone who could finish the spell.'),

  // Shared
  'focus-reset': line('pip', "Let's take a breath and try that part again."),
  'assist-offer': line('pip', "I'll make the words a little shorter for this part. You've got this."),
  'spell-frost': line('pip', 'Frost Thread! A perfect word slows the others down.'),
  'spell-chain': line('pip', 'Chain Spark! Five perfect words in a row!'),

  // Ending
  'end-1': line('orin', "An apprentice's first lesson is usually how to hold a wand."),
  'end-2': line('orin', 'Yours was how to understand one.'),
  'end-3': line('mira', "And how to survive Pip's planning."),
  'end-4': line('pip', 'My planning achieved a complete success rate.'),
  'end-5': line('mira', 'Eventually.'),
  'end-6': line('orin', 'Welcome to Asterfall Academy, apprentice.'),
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
};
