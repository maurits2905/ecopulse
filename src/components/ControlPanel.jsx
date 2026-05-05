import { PRESETS } from "../simulation/presets";

const SPEED_MARKS = [0.25, 0.5, 1, 2, 4, 8, 12];

function getSpeedLabel(speed) {
  if (speed < 1) return `${speed.toFixed(2).replace(/0$/, "")}x`;
  return `${speed}x`;
}

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
        <button
          className={running ? "button danger" : "button primary"}
          onClick={() => setRunning(!running)}
        >
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

        <label className="field speed-field">
          <span>Speed: {getSpeedLabel(speed)}</span>
          <input
            type="range"
            min="0"
            max={SPEED_MARKS.length - 1}
            step="1"
            value={SPEED_MARKS.indexOf(speed)}
            onChange={(event) => setSpeed(SPEED_MARKS[Number(event.target.value)])}
          />

          <div className="speed-marks">
            {SPEED_MARKS.map((mark) => (
              <span key={mark}>{getSpeedLabel(mark)}</span>
            ))}
          </div>
        </label>
      </div>
    </section>
  );
}