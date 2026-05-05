function format(value, digits = 1) {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(digits);
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function titleCase(value) {
  if (!value) return "Unknown";
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default function InspectorPanel({ inspected }) {
  if (!inspected) {
    return (
      <section className="panel inspector-panel">
        <div className="panel-heading">
          <p className="eyebrow">Inspector</p>
          <h2>Hover the world</h2>
        </div>

        <p className="inspector-empty">
          Move your mouse over the simulation to inspect terrain, grass, prey and predators.
        </p>
      </section>
    );
  }

  return (
    <section className="panel inspector-panel">
      <div className="panel-heading">
        <p className="eyebrow">Inspector</p>
        <h2>
          Cell {inspected.cellX}, {inspected.cellY}
        </h2>
      </div>

      <div className="inspector-grid">
        <Info label="Terrain" value={titleCase(inspected.terrain)} />
        <Info label="Grass" value={percent(inspected.grassPercent)} />
        <Info label="Fertility" value={`${format(inspected.fertility, 2)}x`} />
        <Info label="Local prey" value={inspected.localPrey} />
        <Info label="Local predators" value={inspected.localPredators} />
      </div>

      {inspected.agent ? (
        <article className={`agent-card ${inspected.agent.type}`}>
          <div className="agent-card-header">
            <span>{inspected.agent.type === "prey" ? "Prey" : "Predator"}</span>
            <strong>Gen {inspected.agent.generation}</strong>
          </div>

          <div className="inspector-grid compact">
            <Info label="Energy" value={format(inspected.agent.energy, 1)} />
            <Info label="Age" value={inspected.agent.age} />
            <Info label="Speed" value={format(inspected.agent.traits.speed, 2)} />
            <Info label="Vision" value={format(inspected.agent.traits.vision, 1)} />
            <Info label="Metabolism" value={format(inspected.agent.traits.metabolism, 2)} />

            {inspected.agent.type === "prey" ? (
              <Info label="Caution" value={format(inspected.agent.traits.caution, 2)} />
            ) : (
              <Info label="Aggression" value={format(inspected.agent.traits.aggression, 2)} />
            )}
          </div>
        </article>
      ) : (
        <p className="inspector-empty small">No animal directly under the cursor.</p>
      )}
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="info-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}