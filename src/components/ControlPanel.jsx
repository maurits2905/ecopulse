import { PRESETS } from "../simulation/presets";

const SPEED_OPTIONS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 4, label: "4x" },
  { value: 8, label: "8x" },
  { value: 12, label: "12x" }
];

export default function ControlPanel({
  running,
  setRunning,
  speed,
  setSpeed,
  presetKey,
  setPresetKey,
  onReset,
  onStep
}) {
  return (
    <section className="panel control-panel">
      <div className="control-row">
        <button className={running ? "button danger" : "button primary"} onClick={() => setRunning(!running)}>
          {running ? "Pause" : "Start"}
        </button>

        <button className="button" onClick={onStep}>
          Step
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

        <label className="field compact speed-select">
          <span>Speed</span>
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
            {SPEED_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}