function number(value) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-US");
}

function decimal(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(2);
}

export default function CivilizationPanel({ stats }) {
  const civ = stats?.civilization;

  if (!civ?.enabled) {
    return (
      <section className="panel civilization-panel">
        <div className="panel-heading">
          <p className="eyebrow">Civilization</p>
          <h2>Disabled</h2>
        </div>

        <p className="inspector-empty small">
          Turn on civilization mode to add humans, resource gathering, huts and settlement pressure.
        </p>
      </section>
    );
  }

  return (
    <section className="panel civilization-panel">
      <div className="panel-heading">
        <p className="eyebrow">Civilization</p>
        <h2>Settlement pressure</h2>
      </div>

      <div className="civilization-grid">
        <Info label="Humans" value={number(civ.population)} />
        <Info label="Huts" value={number(civ.huts)} />
        <Info label="Food" value={number(civ.food)} />
        <Info label="Wood" value={number(civ.wood)} />
        <Info label="Pressure" value={decimal(civ.pressure)} />
      </div>

      <p className="settings-note">
        Humans gather food, cut forest for wood, hunt prey and build huts when resources allow.
      </p>
    </section>
  );
}

function Info({ label, value }) {
  return (
    <div className="civilization-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}