function number(value) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toLocaleString("en-US");
}

function decimal(value) {
  if (!Number.isFinite(value)) return "0";
  return value.toFixed(2);
}

function percent(value) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value * 100)}%`;
}

export default function CivilizationPanel({
  stats,
  onSpawnCivilization,
  onRemoveCivilization
}) {
  const civ = stats?.civilization;

  if (!civ?.enabled) {
    return (
      <section className="panel civilization-panel">
        <div className="panel-heading">
          <p className="eyebrow">Civilization</p>
          <h2>Spawn humans</h2>
        </div>

        <p className="inspector-empty small">
          Humans are no longer tied to a preset. Choose any world preset first, then spawn a settlement into the current world.
        </p>

        <button className="button save-button" onClick={onSpawnCivilization}>
          Spawn humans in this world
        </button>

        <p className="settings-note">
          This adds a settlement, humans, food, wood, huts, roads and bridge-building logic without changing the selected map.
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
        <Info label="Stress" value={percent(civ.stress)} />
        <Info label="Bridges" value={number(stats?.bridges ?? 0)} />
        <Info label="Roads" value={number(stats?.roads ?? 0)} />
      </div>

      <div className="civilization-stress">
        <div>
          <span>Settlement stress</span>
          <strong>{percent(civ.stress)}</strong>
        </div>
        <div className="civilization-stress-bar">
          <i style={{ width: percent(civ.stress) }} />
        </div>
      </div>

      <button className="button save-button" onClick={onRemoveCivilization}>
        Remove humans from this world
      </button>

      <p className="settings-note">
        Humans gather food, cut forest, hunt prey, build huts, create roads and can build limited bridges over useful water crossings.
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