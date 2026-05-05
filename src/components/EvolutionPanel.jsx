function format(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(2);
}

function traitColor(value, low, high) {
  const ratio = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return `${Math.round(ratio * 100)}%`;
}

export default function EvolutionPanel({ stats }) {
  if (!stats) return null;

  const prey = stats.preyTraits;
  const predators = stats.predatorTraits;

  return (
    <section className="panel evolution-panel">
      <div className="panel-heading">
        <p className="eyebrow">Evolution</p>
        <h2>Average traits</h2>
      </div>

      <div className="trait-section">
        <div className="trait-header">
          <span className="trait-dot prey-dot" />
          <strong>Prey</strong>
        </div>

        <Trait label="Speed" value={prey.speed} low={0.35} high={1.2} />
        <Trait label="Vision" value={prey.vision} low={3} high={16} />
        <Trait label="Caution" value={prey.caution} low={0.1} high={1.8} />
        <Trait label="Metabolism" value={prey.metabolism} low={0.6} high={1.6} />
      </div>

      <div className="trait-section">
        <div className="trait-header">
          <span className="trait-dot predator-dot" />
          <strong>Predators</strong>
        </div>

        <Trait label="Speed" value={predators.speed} low={0.35} high={1.4} />
        <Trait label="Vision" value={predators.vision} low={4} high={22} />
        <Trait label="Aggression" value={predators.aggression} low={0.2} high={2} />
        <Trait label="Metabolism" value={predators.metabolism} low={0.6} high={1.8} />
      </div>

      <p className="settings-note">
        Offspring inherit parent traits with small mutations. Survival pressure decides which traits spread.
      </p>
    </section>
  );
}

function Trait({ label, value, low, high }) {
  return (
    <div className="trait-row">
      <div className="trait-row-top">
        <span>{label}</span>
        <strong>{format(value)}</strong>
      </div>
      <div className="trait-bar">
        <i style={{ width: traitColor(value, low, high) }} />
      </div>
    </div>
  );
}