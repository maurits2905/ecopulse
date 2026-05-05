function formatValue(objective) {
  const value = objective.value;

  if (!Number.isFinite(value)) return "0";

  if (objective.type === "grassAbove") {
    return `${Math.round(value * 100)}%`;
  }

  if (objective.type.includes("Generation")) {
    return value.toFixed(1);
  }

  return Math.round(value).toLocaleString("en-US");
}

function statusLabel(status) {
  if (status === "complete") return "Completed";
  if (status === "failed") return "Failed";
  return "Active";
}

export default function ScenarioPanel({ scenario }) {
  if (!scenario) {
    return (
      <section className="panel scenario-panel">
        <div className="panel-heading">
          <p className="eyebrow">Scenario</p>
          <h2>Sandbox mode</h2>
        </div>

        <p className="inspector-empty small">
          This preset has no specific scenario yet. Use it as a free experiment.
        </p>
      </section>
    );
  }

  return (
    <section className={`panel scenario-panel ${scenario.status}`}>
      <div className="panel-heading scenario-heading">
        <div>
          <p className="eyebrow">Scenario</p>
          <h2>{scenario.title}</h2>
        </div>

        <span className={`scenario-status ${scenario.status}`}>
          {statusLabel(scenario.status)}
        </span>
      </div>

      <p className="scenario-description">{scenario.description}</p>

      <div className="scenario-objectives">
        {scenario.objectives.map((objective) => (
          <article
            className={`scenario-objective ${
              objective.failed ? "failed" : objective.complete ? "complete" : ""
            }`}
            key={objective.key}
          >
            <div className="objective-top">
              <span>{objective.label}</span>
              <strong>{formatValue(objective)}</strong>
            </div>

            <div className="objective-bar">
              <i style={{ width: `${Math.round(objective.progress * 100)}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}