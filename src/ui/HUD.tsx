import { strings } from '../content/strings';
import { useGameStore } from '../state/gameStore';

export function HUD() {
  const areaId = useGameStore((s) => s.currentAreaId);
  const beatId = useGameStore((s) => s.currentBeatId);

  return (
    <div className="hud" aria-live="polite">
      {/* Keyed so the card animation replays on every area change. */}
      {areaId && (
        <div key={areaId} className="area-card">
          {strings.areas[areaId]}
        </div>
      )}
      <div className="hud__pause-hint">{strings.pause.hint}</div>
      {import.meta.env.DEV && beatId && <div className="hud__debug">beat: {beatId}</div>}
    </div>
  );
}
