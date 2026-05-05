import { formatRunSummaryText } from "../simulation/runSummary";

function number(value) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-US");
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function scenarioLabel(status) {
  if (status === "complete") return "Completed";
  if (status === "failed") return "Failed";
  if (status === "active") return "Active";
  return "Sandbox";
}

export default function RunSummaryPanel({ summary, scenario }) {
  if (!summary) return null;

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(formatRunSummaryText(summary, scenario));
    } catch {
      // Ignore clipboard errors. The visible summary still works.
    }
  }

  return (
    <section className="panel run-summary-panel">
      <div className="panel-heading scenario-heading">
        <div>
          <p className="eyebrow">Run report</p>
          <h2>Experiment summary</h2>
        </div>

        <span className={`scenario-status ${summary.scenarioStatus}`}>
          {scenarioLabel(summary.scenarioStatus)}
        </span>
      </div>

      <div className="summary-highlight">
        <span>Dominant trend</span>
        <strong>{summary.trend}</strong>
      </div>

      <div className="summary-grid">
        <Info label="Ticks" value={number(summary.tick)} />
        <Info label="Final prey" value={number(summary.finalPrey)} />
        <Info label="Final predators" value={number(summary.finalPredators)} />
        <Info label="Final grass" value={percent(summary.finalGrassPercent)} />
      </div>

      <div className="summary-section">
        <h3>Peaks and lows</h3>

        <div className="summary-grid">
          <Info
            label="Peak prey"
            value={number(summary.peakPrey.value)}
            sub={`Tick ${number(summary.peakPrey.tick)}`}
          />
          <Info
            label="Peak predators"
            value={number(summary.peakPredators.value)}
            sub={`Tick ${number(summary.peakPredators.tick)}`}
          />
          <Info
            label="Highest grass"
            value={percent(summary.highestGrass.value)}
            sub={`Tick ${number(summary.highestGrass.tick)}`}
          />
          <Info
            label="Lowest grass"
            value={percent(summary.lowestGrass.value)}
            sub={`Tick ${number(summary.lowestGrass.tick)}`}
          />
        </div>
      </div>

      <div className="summary-section">
        <h3>Timeline counts</h3>

        <div className="summary-grid">
          <Info label="Migrations" value={number(summary.migrationCount)} />
          <Info label="Disturbances" value={number(summary.disturbanceCount)} />
          <Info label="Extinctions" value={number(summary.extinctionCount)} />
          <Info label="Evolution signals" value={number(summary.evolutionCount)} />
        </div>
      </div>

      <button className="button save-button" onClick={copySummary}>
        Copy run summary
      </button>
    </section>
  );
}

function Info({ label, value, sub }) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {sub ? <small>{sub}</small> : null}
    </div>
  );
}