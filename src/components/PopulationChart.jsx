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

function getMarkerClass(category) {
  if (category === "disturbance") return "marker-disturbance";
  if (category === "migration") return "marker-migration";
  if (category === "extinction") return "marker-extinction";
  if (category === "season") return "marker-season";
  if (category === "evolution") return "marker-evolution";
  return "marker-system";
}

export default function PopulationChart({ history, timelineEvents = [] }) {
  const width = 520;
  const height = 170;

  const firstTick = history[0]?.tick ?? 0;
  const lastTick = history[history.length - 1]?.tick ?? 1;
  const tickRange = Math.max(1, lastTick - firstTick);

  const maxGrass = Math.max(...history.map((item) => item.grassPercent * 100), 100);
  const maxPrey = Math.max(...history.map((item) => item.prey), 100);
  const maxPredators = Math.max(...history.map((item) => item.predators), 50);

  const grassPath = buildPath(history, (item) => item.grassPercent * 100, maxGrass, width, height);
  const preyPath = buildPath(history, (item) => item.prey, maxPrey, width, height);
  const predatorPath = buildPath(history, (item) => item.predators, maxPredators, width, height);

  const visibleMarkers = timelineEvents
    .filter((event) => event.tick >= firstTick && event.tick <= lastTick)
    .slice(-40);

  return (
    <section className="panel chart-panel">
      <div className="panel-heading horizontal">
        <div>
          <p className="eyebrow">Population graph</p>
          <h2>Population, resources and timeline markers</h2>
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

        {visibleMarkers.map((event) => {
          const x = ((event.tick - firstTick) / tickRange) * width;

          return (
            <g key={event.id ?? `${event.tick}-${event.message}`}>
              <line
                x1={x}
                x2={x}
                y1="0"
                y2={height}
                className={`timeline-marker-line ${getMarkerClass(event.category)}`}
              />
              <circle
                cx={x}
                cy="9"
                r="3.4"
                className={`timeline-marker-dot ${getMarkerClass(event.category)}`}
              />
            </g>
          );
        })}

        <path d={grassPath} className="chart-line grass-line" />
        <path d={preyPath} className="chart-line prey-line" />
        <path d={predatorPath} className="chart-line predator-line" />
      </svg>

      <div className="timeline-marker-legend">
        <span className="marker-disturbance">Disturbance</span>
        <span className="marker-migration">Migration</span>
        <span className="marker-season">Season</span>
        <span className="marker-evolution">Evolution</span>
        <span className="marker-extinction">Extinction</span>
      </div>
    </section>
  );
}