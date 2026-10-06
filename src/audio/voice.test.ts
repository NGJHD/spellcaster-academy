import { describe, expect, it } from 'vitest';
import { castVoices, spokenText } from './voice';

const v = (name: string, lang = 'en-US') => ({ name, lang });

describe('voice casting', () => {
  it('gives every character a different voice when enough exist (Edge natural voices)', () => {
    const voices = [
      'Ana', 'Maisie', 'Libby', 'Sonia', 'Ryan', 'Thomas', 'Christopher', 'Eric', 'Guy', 'Andrew', 'Roger', 'Michelle', 'Steffan',
    ].map((n) => v(`Microsoft ${n} Online (Natural) - English`));
    const cast = castVoices(voices);
    const names = Object.values(cast).map((x) => x?.name);
    expect(names.length).toBe(9);
    expect(new Set(names).size).toBe(9);
    expect(cast.pip?.name).toContain('Ana');
    expect(cast.mira?.name).toContain('Libby');
    expect(cast.warden?.name).toContain('Christopher');
  });

  it('still casts everyone (sharing) on a machine with two voices', () => {
    const cast = castVoices([v('Microsoft Zira'), v('Microsoft David')]);
    expect(Object.keys(cast).length).toBe(9);
    expect(cast.pip?.name).toContain('Zira');
    expect(cast.orin?.name).toContain('David');
  });

  it('ignores non-English voices', () => {
    const cast = castVoices([v('Microsoft Hedda', 'de-DE'), v('Microsoft Ryan', 'en-GB')]);
    expect(cast.orin?.name).toContain('Ryan');
    expect(Object.values(cast).every((x) => x?.lang.startsWith('en'))).toBe(true);
  });
});

describe('spoken text', () => {
  it('speaks capitalised emphasis as a word, not letter by letter (owner: S-N-A-P-V-I-N-E)', () => {
    expect(spokenText('A SNAPVINE! Grow the bridge')).toBe('A snapvine! Grow the bridge');
    expect(spokenText("It's on FIRE.")).toBe("It's on fire.");
    expect(spokenText('Wait… then go — now')).toBe('Wait,  then go ,  now');
  });
});
