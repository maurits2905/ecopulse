function buildPath(points, getValue, maxValue, width, height) {
  if (points.length < 2 || maxValue <= 0) return "";

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - (getValue(point) / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function PopulationChart({ history }) {
  const width = 520;
  const height = 170;

  const maxGrass = Math.max(...history.map((item) => item.grassPercent * 100), 100);
  const maxPrey = Math.max(...history.map((item) => item.prey), 100);
  const maxPredators = Math.max(...history.map((item) => item.predators), 50);

  const grassPath = buildPath(history, (item) => item.grassPercent * 100, maxGrass, width, height);
  const preyPath = buildPath(history, (item) => item.prey, maxPrey, width, height);
  const predatorPath = buildPath(history, (item) => item.predators, maxPredators, width, height);

  return (
    <section className="panel chart-panel">
      <div className="panel-heading horizontal">
        <div>
          <p className="eyebrow">Population graph</p>
          <h2>Emergence over time</h2>
        </div>

        <div className="chart-legend">
          <span className="grass-label">Grass</span>
          <span className="prey-label">Prey</span>
          <span className="predator-label">Predators</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        <defs>
          <linearGradient id="chartFade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        <rect width={width} height={height} rx="16" fill="url(#chartFade)" />

        {[0.25, 0.5, 0.75].map((line) => (
          <line
            key={line}
            x1="0"
            x2={width}
            y1={height * line}
            y2={height * line}
            className="chart-grid-line"
          />
        ))}

        <path d={grassPath} className="chart-line grass-line" />
        <path d={preyPath} className="chart-line prey-line" />
        <path d={predatorPath} className="chart-line predator-line" />
      </svg>
    </section>
  );
}