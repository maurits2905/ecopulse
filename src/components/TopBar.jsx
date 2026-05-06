import { PRESETS } from "../simulation/presets";

const SPEED_MARKS = [0.25, 0.5, 1, 2, 4, 8, 12];

function getSpeedLabel(speed) {
  if (speed < 1) return `${speed.toFixed(2).replace(/0+$/, "")}x`;
  return `${speed}x`;
}

function fmt(n) {
  if (!Number.isFinite(n) || n == null) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
}

function getStatusVariant(status) {
  const s = (status ?? "").toLowerCase();
  if (s.includes("thri") || s.includes("stable") || s.includes("balanced")) return "ok";
  if (s.includes("declin") || s.includes("stress") || s.includes("scarc")) return "warn";
  if (s.includes("collaps") || s.includes("extinct") || s.includes("crash")) return "danger";
  return "neutral";
}

export default function TopBar({
  running,
  setRunning,
  speed,
  setSpeed,
  presetKey,
  setPresetKey,
  onReset,
  onStep,
  stats,
}) {
  const grassPct = Math.round((stats?.grassPercent ?? 0) * 100);
  const status = stats?.status ?? "Initializing";
  const statusVariant = getStatusVariant(status);

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-logo" aria-hidden="true">EP</div>
        <div className="topbar-wordmark">
          <span>EcoPulse</span>
          <small>Ecosystem Simulator</small>
        </div>
      </div>

      <div className="topbar-sep" aria-hidden="true" />

      <div className="topbar-run">
        <button
          className={`tb-btn tb-primary${running ? " tb-pause" : ""}`}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button className="tb-btn" onClick={onStep}>Step</button>
        <button className="tb-btn" onClick={onReset}>Reset</button>
      </div>

      <div className="topbar-sep" aria-hidden="true" />

      <label className="topbar-speed">
        <span>Speed <strong>{getSpeedLabel(speed)}</strong></span>
        <input
          type="range"
          min="0"
          max={SPEED_MARKS.length - 1}
          step="1"
          value={SPEED_MARKS.indexOf(speed)}
          onChange={(e) => setSpeed(SPEED_MARKS[Number(e.target.value)])}
        />
      </label>

      <label className="topbar-preset">
        <span>Preset</span>
        <select value={presetKey} onChange={(e) => setPresetKey(e.target.value)}>
          {Object.entries(PRESETS).map(([key, p]) => (
            <option key={key} value={key}>{p.label}</option>
          ))}
        </select>
      </label>

      <div className="topbar-spacer" />

      <div className="topbar-live">
        <div className="tb-stat">
          <i className="tb-dot" style={{ background: "#56e88d", boxShadow: "0 0 8px #56e88d66" }} />
          <span>Grass</span>
          <strong>{grassPct}%</strong>
        </div>
        <div className="tb-stat">
          <i className="tb-dot" style={{ background: "#d7fce8", boxShadow: "0 0 8px #d7fce866" }} />
          <span>Prey</span>
          <strong>{fmt(stats?.prey)}</strong>
        </div>
        <div className="tb-stat">
          <i className="tb-dot" style={{ background: "#ff6b6b", boxShadow: "0 0 8px #ff6b6b66" }} />
          <span>Pred</span>
          <strong>{fmt(stats?.predators)}</strong>
        </div>
        <div className="tb-stat tb-stat-tick">
          <span>Tick</span>
          <strong>{fmt(stats?.tick)}</strong>
        </div>
        <div className={`tb-status tb-status-${statusVariant}`}>
          {status}
        </div>
      </div>
    </header>
  );
}
