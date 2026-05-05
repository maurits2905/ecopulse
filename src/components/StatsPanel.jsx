function formatNumber(value) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

export default function StatsPanel({ stats }) {
  if (!stats) return null;

  return (
    <section className="panel stats-panel">
      <div className="panel-heading">
        <p className="eyebrow">Ecosystem status</p>
        <h2>{stats.status}</h2>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span>Tick</span>
          <strong>{formatNumber(stats.tick)}</strong>
        </div>

        <div className="stat-card">
          <span>Grass cover</span>
          <strong>{percent(stats.grassPercent)}</strong>
        </div>

        <div className="stat-card">
          <span>Prey</span>
          <strong>{formatNumber(stats.prey)}</strong>
        </div>

        <div className="stat-card">
          <span>Predators</span>
          <strong>{formatNumber(stats.predators)}</strong>
        </div>

        <div className="stat-card">
          <span>Avg prey energy</span>
          <strong>{formatNumber(stats.preyEnergy)}</strong>
        </div>

        <div className="stat-card">
          <span>Avg predator energy</span>
          <strong>{formatNumber(stats.predatorEnergy)}</strong>
        </div>
      </div>
    </section>
  );
}