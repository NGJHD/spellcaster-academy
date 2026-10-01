/**
 * Curated Level 1 vocabulary (CLAUDE.md §11). British spelling, age-appropriate,
 * no proper nouns, no punctuation. Each word is tagged with difficulty, category and length.
 */

export type WordDifficulty = 'easy' | 'standard' | 'challenge';

export type WordCategory =
  | 'objects'
  | 'nature'
  | 'colours'
  | 'weather'
  | 'school'
  | 'values'
  | 'fantasy'
  | 'animals'
  | 'plants';

export interface WordEntry {
  readonly word: string;
  readonly difficulty: WordDifficulty;
  readonly category: WordCategory;
  readonly letters: number;
}

type Source = Record<WordDifficulty, Partial<Record<WordCategory, string>>>;

const SOURCE: Source = {
  easy: {
    objects: 'cup map key hat bag pen box lamp bell door rope kite coin ring',
    nature: 'sun sea tree rock pond hill moss sand twig',
    colours: 'red blue gold pink teal grey rust jade',
    weather: 'snow wind mist fog hail cloud storm',
    school: 'book desk ink note chalk quill page quiz',
    values: 'calm hope care fair glad true',
    fantasy: 'wand glow rune orb magic charm spell wish',
    animals: 'cat owl fox bat hen yak elk frog duck bear wolf mole newt lamb deer otter',
    plants: 'seed bud vine palm reed ivy',
  },
  standard: {
    objects: 'candle basket mirror ladder blanket kettle pillow lantern button bucket teapot saddle',
    nature: 'forest meadow valley petal pebble branch garden island acorn thicket',
    colours: 'silver violet orange crimson purple yellow scarlet indigo',
    weather: 'thunder breeze frost sunny shower drizzle rainbow gusty',
    school: 'pencil lesson ruler library answer letter number history science',
    values: 'honest gentle patient helpful curious cheerful loyal',
    fantasy: 'potion dragon wizard castle shield crystal sparkle portal enchant goblet',
    animals: 'rabbit badger beetle falcon parrot turtle kitten donkey salmon pigeon lizard panda',
    plants: 'blossom tulip clover thistle willow bramble daisy',
  },
  challenge: {
    objects: 'telescope compass umbrella notebook backpack fountain treasure',
    nature: 'mountain waterfall woodland seashore evergreen mushroom',
    colours: 'turquoise emerald sapphire burgundy chestnut magenta lavender',
    weather: 'lightning snowflake sunshine blizzard moonlight',
    school: 'alphabet calendar homework practice teacher question',
    values: 'kindness generous thoughtful courage wonderful creative',
    fantasy: 'enchanted spellbook guardian moonstone mystical amulet starlight',
    animals: 'squirrel hedgehog butterfly dolphin elephant penguin kangaroo flamingo tortoise',
    plants: 'sunflower foxglove bluebell snowdrop',
  },
};

export const WORDS: readonly WordEntry[] = (Object.keys(SOURCE) as WordDifficulty[]).flatMap((difficulty) =>
  (Object.entries(SOURCE[difficulty]) as [WordCategory, string][]).flatMap(([category, list]) =>
    list
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, difficulty, category, letters: word.length })),
  ),
);

/** Short optional phrases and sentences, typed word by word. */
export const PHRASES: readonly string[] = [
  'bright minds make strong magic',
  'the stars are watching',
  'every letter counts',
  'slow and steady wins',
  'magic grows with practice',
  'kind words are strong spells',
  'the ward will hold',
  'read the whole word first',
  'a calm mind casts true',
  'light the lamps of learning',
  'practice makes progress',
  'together we are brave',
];
