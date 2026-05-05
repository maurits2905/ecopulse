function percent(value) {
  return `${Math.round(value * 100)}%`;
}

export default function SeasonPanel({ stats }) {
  if (!stats?.season) return null;

  const season = stats.season;

  return (
    <section className={`panel season-panel season-${season.key}`}>
      <div className="panel-heading">
        <p className="eyebrow">Climate cycle</p>
        <h2>{season.name}</h2>
      </div>

      <p className="season-description">{season.description}</p>

      <div className="season-progress">
        <div>
          <span>Season progress</span>
          <strong>{percent(season.progress)}</strong>
        </div>
        <div className="season-bar">
          <i style={{ width: percent(season.progress) }} />
        </div>
      </div>

      <div className="season-effects">
        <div>
          <span>Grass growth</span>
          <strong>{season.grassModifier.toFixed(2)}x</strong>
        </div>

        <div>
          <span>Hunger pressure</span>
          <strong>{season.hungerModifier.toFixed(2)}x</strong>
        </div>
      </div>
    </section>
  );
}