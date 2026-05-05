const SLIDERS = [
  {
    key: "initialPrey",
    label: "Initial prey",
    min: 20,
    max: 300,
    step: 5
  },
  {
    key: "initialPredators",
    label: "Initial predators",
    min: 0,
    max: 80,
    step: 2
  },
  {
    key: "initialGrassDensity",
    label: "Initial grass density",
    min: 0.1,
    max: 1,
    step: 0.05
  },
  {
    key: "grassRegrowth",
    label: "Grass regrowth",
    min: 0.05,
    max: 1.2,
    step: 0.05
  },
  {
    key: "preyHunger",
    label: "Prey hunger",
    min: 0.1,
    max: 1.2,
    step: 0.05
  },
  {
    key: "predatorHunger",
    label: "Predator hunger",
    min: 0.2,
    max: 1.8,
    step: 0.05
  },
  {
    key: "preyReproductionEnergy",
    label: "Prey reproduction energy",
    min: 50,
    max: 160,
    step: 5
  },
  {
    key: "predatorReproductionEnergy",
    label: "Predator reproduction energy",
    min: 80,
    max: 220,
    step: 5
  },
  {
    key: "preyVision",
    label: "Prey vision",
    min: 2,
    max: 16,
    step: 1
  },
  {
    key: "predatorVision",
    label: "Predator vision",
    min: 3,
    max: 22,
    step: 1
  }
];

function displayValue(value) {
  if (typeof value !== "number") return value;
  if (value < 2 && value % 1 !== 0) return value.toFixed(2);
  return Math.round(value * 100) / 100;
}

export default function SettingsPanel({ settings, setSettings }) {
  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <p className="eyebrow">Experiment controls</p>
        <h2>World parameters</h2>
      </div>

      <div className="settings-list">
        {SLIDERS.map((slider) => (
          <label className="slider-field" key={slider.key}>
            <span>
              {slider.label}
              <strong>{displayValue(settings[slider.key])}</strong>
            </span>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={settings[slider.key]}
              onChange={(event) => updateSetting(slider.key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>

      <p className="settings-note">
        Changing sliders affects the next reset. This keeps the running ecosystem stable while you inspect it.
      </p>
    </section>
  );
}