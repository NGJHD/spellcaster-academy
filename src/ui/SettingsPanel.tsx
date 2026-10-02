import type { ReactNode } from 'react';
import { strings } from '../content/strings';
import type { FontSize, Quality, Settings, TravelSpeed, Volumes } from '../state/settings';
import { useSettingsStore } from '../state/settingsStore';

const s = strings.settings;

function Toggle({ label, value, onChange, help }: { label: string; value: boolean; onChange: (v: boolean) => void; help?: string }) {
  const id = `toggle-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="setting-row">
      <div>
        <div className="setting-row__label" id={id}>{label}</div>
        {help && <div className="setting-row__help">{help}</div>}
      </div>
      <button type="button" role="switch" aria-checked={value} aria-labelledby={id} className="toggle" onClick={() => onChange(!value)}>
        {value ? s.on : s.off}
      </button>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  names,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  names: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const id = `seg-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="setting-row">
      <div className="setting-row__label" id={id}>{label}</div>
      <div className="segmented" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} className="segmented__option" onClick={() => onChange(o)}>
            {names[o]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="setting-row setting-row--slider">
      <span className="setting-row__label">{label}</span>
      <input type="range" min={0} max={100} step={5} value={Math.round(value * 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} />
    </label>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="settings-section">
      <h3 className="settings-section__title">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const settings = useSettingsStore();
  const update = (patch: Partial<Settings>) => settings.update(patch);
  const setVolume = (key: keyof Volumes, v: number) => update({ volumes: { ...settings.volumes, [key]: v } });
  const toggleFullScreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen?.();
  };

  return (
    <>
      <h2 className="modal-panel__heading">{s.heading}</h2>
      <div className="settings-scroll">
        <Section title={s.sections.motion}>
          <Toggle label={s.reducedMotion} help={s.reducedMotionHelp} value={settings.reducedMotion} onChange={(v) => update({ reducedMotion: v })} />
          <Toggle label={s.reducedShake} value={settings.reducedShake} onChange={(v) => update({ reducedShake: v })} />
          <Toggle label={s.reducedEffects} value={settings.reducedEffects} onChange={(v) => update({ reducedEffects: v })} />
          <Segmented<TravelSpeed> label={s.travelSpeed} value={settings.travelSpeed} options={['slow', 'normal', 'fast']} names={s.travelSpeeds} onChange={(v) => update({ travelSpeed: v })} />
          <Segmented<Quality> label={s.quality} value={settings.quality} options={['low', 'medium', 'high']} names={s.qualities} onChange={(v) => update({ quality: v })} />
        </Section>
        <Section title={s.sections.text}>
          <Segmented<FontSize> label={s.fontSize} value={settings.fontSize} options={['normal', 'large', 'extra-large']} names={s.fontSizes} onChange={(v) => update({ fontSize: v })} />
          <Toggle label={s.highContrast} value={settings.highContrast} onChange={(v) => update({ highContrast: v })} />
          <Toggle label={s.dyslexiaFont} value={settings.dyslexiaFont} onChange={(v) => update({ dyslexiaFont: v })} />
        </Section>
        <Section title={s.sections.game}>
          <Toggle label={s.spokenDialogue} value={settings.spokenDialogue} onChange={(v) => update({ spokenDialogue: v })} />
          <Toggle label={s.showWpm} value={settings.showWpm} onChange={(v) => update({ showWpm: v })} />
          <div className="setting-row">
            <div className="setting-row__label">{s.fullScreen}</div>
            <button type="button" className="toggle" onClick={toggleFullScreen}>⛶</button>
          </div>
        </Section>
        <Section title={s.sections.audio}>
          <Slider label={s.master} value={settings.volumes.master} onChange={(v) => setVolume('master', v)} />
          <Slider label={s.music} value={settings.volumes.music} onChange={(v) => setVolume('music', v)} />
          <Slider label={s.sfx} value={settings.volumes.sfx} onChange={(v) => setVolume('sfx', v)} />
          <Slider label={s.ui} value={settings.volumes.ui} onChange={(v) => setVolume('ui', v)} />
          <Slider label={s.voice} value={settings.volumes.voice} onChange={(v) => setVolume('voice', v)} />
        </Section>
      </div>
      <button type="button" className="menu-button" onClick={onBack} autoFocus>{strings.pause.back}</button>
    </>
  );
}

export function ControlsPanel({ onBack }: { onBack: () => void }) {
  const c = strings.controls;
  return (
    <>
      <h2 className="modal-panel__heading">{c.heading}</h2>
      <table className="controls-table">
        <tbody>
          {c.rows.map((row) => (
            <tr key={row.keys}>
              <th scope="row"><kbd>{row.keys}</kbd></th>
              <td>{row.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="modal-panel__note">{c.note}</p>
      <button type="button" className="menu-button" onClick={onBack} autoFocus>{strings.pause.back}</button>
    </>
  );
}
