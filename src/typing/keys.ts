/** Translates browser key events into gameplay intents. Framework-independent. */

export type KeyIntent =
  | { readonly kind: 'letter'; readonly char: string }
  | { readonly kind: 'backspace' }
  | { readonly kind: 'tab'; readonly reverse: boolean }
  | { readonly kind: 'enter' }
  | { readonly kind: 'space' }
  | { readonly kind: 'left' }
  | { readonly kind: 'right' }
  | { readonly kind: 'escape' }
  | { readonly kind: 'ignored' };

export interface KeyLike {
  readonly key: string;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly altKey?: boolean;
  readonly shiftKey?: boolean;
  readonly repeat?: boolean;
}

const IGNORED: KeyIntent = { kind: 'ignored' };

export function interpretKey(e: KeyLike): KeyIntent {
  // Browser and OS shortcuts are never gameplay input.
  if (e.ctrlKey || e.metaKey || e.altKey) return IGNORED;

  switch (e.key) {
    case 'Backspace':
      return { kind: 'backspace' };
    case 'Tab':
      return e.repeat ? IGNORED : { kind: 'tab', reverse: e.shiftKey === true };
    case 'Enter':
      return e.repeat ? IGNORED : { kind: 'enter' };
    case ' ':
      return e.repeat ? IGNORED : { kind: 'space' };
    case 'ArrowLeft':
      return { kind: 'left' };
    case 'ArrowRight':
      return { kind: 'right' };
    case 'Escape':
      return { kind: 'escape' };
  }

  // Auto-repeat of a held letter is not intentional typing.
  if (e.key.length === 1 && /^[a-z]$/i.test(e.key)) {
    return e.repeat ? IGNORED : { kind: 'letter', char: e.key.toLowerCase() };
  }
  return IGNORED;
}

/**
 * Keys whose default browser action must be suppressed during gameplay:
 * Tab (focus change), Backspace (history in some browsers), Space (scroll),
 * and `/` / `'` (Firefox quick find).
 */
export function shouldPreventDefault(e: KeyLike): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  return (
    e.key === 'Tab' ||
    e.key === 'Backspace' ||
    e.key === ' ' ||
    e.key === '/' ||
    e.key === "'" ||
    e.key === 'ArrowLeft' ||
    e.key === 'ArrowRight' ||
    (e.key.length === 1 && /^[a-z]$/i.test(e.key))
  );
}
