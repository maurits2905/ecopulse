function percent(value) {
  return `${Math.round(value * 100)}%`;
}

const TERRAIN_ROWS = [
  {
    key: "grassland",
    label: "Grassland"
  },
  {
    key: "fertile",
    label: "Fertile"
  },
  {
    key: "forest",
    label: "Forest"
  },
  {
    key: "barren",
    label: "Barren"
  },
  {
    key: "water",
    label: "Water"
  }
];

export default function TerrainPanel({ stats }) {
  if (!stats?.terrain) return null;

  const terrain = stats.terrain;
  const total = Object.values(terrain).reduce((sum, value) => sum + value, 0) || 1;

  return (
    <section className="panel terrain-panel">
      <div className="panel-heading">
        <p className="eyebrow">Terrain</p>
        <h2>World composition</h2>
      </div>

      <div className="terrain-list">
        {TERRAIN_ROWS.map((row) => {
          const amount = terrain[row.key] ?? 0;
          const ratio = amount / total;

          return (
            <div className="terrain-row" key={row.key}>
              <div className="terrain-row-top">
                <span>
                  <i className={`terrain-swatch ${row.key}`} />
                  {row.label}
                </span>
                <strong>{percent(ratio)}</strong>
              </div>
              <div className="terrain-bar">
                <i className={row.key} style={{ width: percent(ratio) }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}