import { PRESETS } from "../simulation/presets";

export default function ControlPanel({
  running,
  setRunning,
  speed,
  setSpeed,
  presetKey,
  setPresetKey,
  onReset
}) {
  return (
    <section className="panel control-panel">
      <div className="control-row">
        <button className={running ? "button danger" : "button primary"} onClick={() => setRunning(!running)}>
          {running ? "Pause" : "Start"}
        </button>

        <button className="button" onClick={onReset}>
          Reset world
        </button>

        <label className="field compact">
          <span>Preset</span>
          <select value={presetKey} onChange={(event) => setPresetKey(event.target.value)}>
            {Object.entries(PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field speed-field">
          <span>Speed: {speed}x</span>
          <input
            type="range"
            min="1"
            max="12"
            value={speed}
            onChange={(event) => setSpeed(Number(event.target.value))}
          />
        </label>
      </div>
    </section>
  );
}