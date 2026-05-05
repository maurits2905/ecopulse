function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

function number(value) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-US");
}

export default function MobileSummaryBar({ stats }) {
  if (!stats) return null;

  return (
    <section className="mobile-summary-bar" aria-label="Simulation summary">
      <div>
        <span>Status</span>
        <strong>{stats.status}</strong>
      </div>

      <div>
        <span>Tick</span>
        <strong>{number(stats.tick)}</strong>
      </div>

      <div>
        <span>Grass</span>
        <strong>{percent(stats.grassPercent)}</strong>
      </div>

      <div>
        <span>Prey</span>
        <strong>{number(stats.prey)}</strong>
      </div>

      <div>
        <span>Predators</span>
        <strong>{number(stats.predators)}</strong>
      </div>
    </section>
  );
}