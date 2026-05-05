function buildPath(points, getValue, minValue, maxValue, width, height) {
  if (points.length < 2) return "";

  const range = Math.max(0.001, maxValue - minValue);

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const normalized = (getValue(point) - minValue) / range;
      const y = height - Math.max(0, Math.min(1, normalized)) * height;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export default function TraitChart({ history }) {
  const width = 520;
  const height = 150;

  const preySpeedPath = buildPath(
    history,
    (item) => item.preyTraits?.speed ?? 0,
    0.35,
    1.25,
    width,
    height
  );

  const predatorSpeedPath = buildPath(
    history,
    (item) => item.predatorTraits?.speed ?? 0,
    0.35,
    1.45,
    width,
    height
  );

  const preyVisionPath = buildPath(
    history,
    (item) => item.preyTraits?.vision ?? 0,
    3,
    16,
    width,
    height
  );

  const predatorVisionPath = buildPath(
    history,
    (item) => item.predatorTraits?.vision ?? 0,
    4,
    22,
    width,
    height
  );

  return (
    <section className="panel chart-panel">
      <div className="panel-heading horizontal">
        <div>
          <p className="eyebrow">Trait graph</p>
          <h2>Evolution over time</h2>
        </div>

        <div className="chart-legend">
          <span className="prey-label">Prey speed</span>
          <span className="predator-label">Predator speed</span>
          <span className="vision-label">Vision</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="chart trait-chart">
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

        <path d={preyVisionPath} className="chart-line prey-vision-line" />
        <path d={predatorVisionPath} className="chart-line predator-vision-line" />
        <path d={preySpeedPath} className="chart-line prey-line" />
        <path d={predatorSpeedPath} className="chart-line predator-line" />
      </svg>
    </section>
  );
}