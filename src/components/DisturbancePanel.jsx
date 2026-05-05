const LABELS = {
  drought: "Drought",
  bloom: "Resource bloom",
  coldSnap: "Cold snap",
  preyDisease: "Prey disease",
  predatorDisease: "Predator disease",
  wildfire: "Wildfire"
};

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

export default function DisturbancePanel({ stats }) {
  const active = stats?.activeEnvironmentalEvents ?? [];

  return (
    <section className="panel disturbance-panel">
      <div className="panel-heading">
        <p className="eyebrow">Disturbances</p>
        <h2>Environmental pressure</h2>
      </div>

      {active.length === 0 ? (
        <p className="inspector-empty small">
          No active disturbance. The ecosystem is currently only shaped by seasons, terrain,
          migration and species behavior.
        </p>
      ) : (
        <div className="disturbance-list">
          {active.map((event) => {
            const progress = 1 - event.remaining / event.duration;

            return (
              <article className={`disturbance-item ${event.kind}`} key={event.id}>
                <div className="disturbance-top">
                  <strong>{LABELS[event.kind] ?? event.kind}</strong>
                  <span>{event.remaining} ticks left</span>
                </div>

                <div className="disturbance-bar">
                  <i style={{ width: percent(progress) }} />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}