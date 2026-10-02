import { memo, useEffect, useRef } from 'react';
import { strings } from '../content/strings';
import { useRunStore, type LabelInfo } from '../state/runStore';

/** Label DOM elements by target id. The label projector writes their screen positions each frame. */
export const labelElements = new Map<string, HTMLDivElement>();

const EnemyWordLabel = memo(function EnemyWordLabel({ label, mistakeKey }: { label: LabelInfo; mistakeKey: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    labelElements.set(label.id, el);
    return () => {
      if (labelElements.get(label.id) === el) labelElements.delete(label.id);
    };
  }, [label.id]);

  const done = label.locked ? label.correctLength : label.pendingPrefix;
  const word = label.word;
  const classes = [
    'word-label',
    label.locked && 'word-label--locked',
    label.pendingPrefix > 0 && 'word-label--pending',
    label.optional && 'word-label--optional',
    label.priority && 'word-label--priority',
    label.shielded && 'word-label--shielded',
    label.danger && 'word-label--danger',
    label.phrase && 'word-label--phrase',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={classes} data-target={label.id} style={{ transform: 'translate(-9999px, -9999px)' }}>
      <div className="word-label__box">
      {label.locked && <div className="word-label__tag">{strings.hud.target}</div>}
      {!label.locked && label.danger && <div className="word-label__tag word-label__tag--danger">{strings.hud.danger}</div>}
      <div className="word-label__inner">
        {label.shielded && <span className="word-label__badge" aria-label={strings.hud.shield}>🛡</span>}
        {label.optional && <span className="word-label__badge word-label__badge--bonus">★</span>}
        <span className="word-label__text" key={mistakeKey} data-mistake={label.wrongText ? 'true' : undefined}>
          {label.phrase && <span className="word-label__done">{label.phrase.slice(0, label.stage).map((w) => `${w} `).join('')}</span>}
          <span className="word-label__done">{word.slice(0, done)}</span>
          {label.wrongText && <span className="word-label__wrong">{label.wrongText}</span>}
          {!label.wrongText && done < word.length && <span className="word-label__current">{word[done]}</span>}
          <span className="word-label__rest">{word.slice(label.wrongText ? done : done + 1)}</span>
          {label.phrase && <span className="word-label__later">{label.phrase.slice(label.stage + 1).map((w) => ` ${w}`).join('')}</span>}
        </span>
        {label.stages > 1 && !label.phrase && (
          <span className="word-label__stages" aria-hidden="true">
            {Array.from({ length: label.stages }, (_, i) => (
              <span key={i} className={i < label.stage ? 'stage-dot stage-dot--done' : i === label.stage ? 'stage-dot stage-dot--now' : 'stage-dot'} />
            ))}
          </span>
        )}
      </div>
      {label.tabHint && <div className="word-label__hint">{strings.hud.tabHint}</div>}
      </div>
      <div className="word-label__arrow" aria-hidden="true" />
    </div>
  );
});

/** HTML word labels projected near their targets (§9 word presentation). */
export function LabelLayer() {
  const labels = useRunStore((s) => s.labels);
  const mistakeKey = useRunStore((s) => s.mistakeKey);
  const mistakeTarget = useRunStore((s) => s.mistakeTargetId);
  return (
    <div className="label-layer" aria-live="off">
      {labels.map((label) => (
        <EnemyWordLabel key={label.id} label={label} mistakeKey={mistakeTarget === label.id ? mistakeKey : 0} />
      ))}
    </div>
  );
}
