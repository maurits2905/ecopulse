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
    key: "waterAmount",
    label: "Water amount",
    min: 0,
    max: 0.12,
    step: 0.005
  },
  {
    key: "forestAmount",
    label: "Forest amount",
    min: 0,
    max: 0.3,
    step: 0.01
  },
  {
    key: "barrenAmount",
    label: "Barren amount",
    min: 0,
    max: 0.25,
    step: 0.01
  },
  {
    key: "fertileAmount",
    label: "Fertile amount",
    min: 0,
    max: 0.25,
    step: 0.01
  },
  {
    key: "seasonLength",
    label: "Season length",
    min: 250,
    max: 1400,
    step: 50
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
    label: "Base prey reproduction energy",
    min: 50,
    max: 160,
    step: 5
  },
  {
    key: "predatorReproductionEnergy",
    label: "Base predator reproduction energy",
    min: 80,
    max: 220,
    step: 5
  },
  {
    key: "preyVision",
    label: "Base prey vision",
    min: 2,
    max: 16,
    step: 1
  },
  {
    key: "predatorVision",
    label: "Base predator vision",
    min: 3,
    max: 22,
    step: 1
  },
  {
    key: "mutationRate",
    label: "Mutation rate",
    min: 0,
    max: 0.3,
    step: 0.01
  }
];

function displayValue(value) {
  if (typeof value !== "number") return value;
  if (value < 2 && value % 1 !== 0) return value.toFixed(3).replace(/0$/, "");
  return Math.round(value * 100) / 100;
}

export default function SettingsPanel({ settings, setSettings }) {
  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  function toggleSeasons() {
    setSettings((current) => ({
      ...current,
      seasonsEnabled: !current.seasonsEnabled
    }));
  }

  function toggleTerrain() {
    setSettings((current) => ({
      ...current,
      terrainEnabled: !current.terrainEnabled
    }));
  }

  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <p className="eyebrow">Experiment controls</p>
        <h2>World parameters</h2>
      </div>

      <button
        type="button"
        className={settings.seasonsEnabled ? "toggle-button active" : "toggle-button"}
        onClick={toggleSeasons}
      >
        Seasons {settings.seasonsEnabled ? "enabled" : "disabled"}
      </button>

      <button
        type="button"
        className={settings.terrainEnabled ? "toggle-button active" : "toggle-button"}
        onClick={toggleTerrain}
      >
        Terrain {settings.terrainEnabled ? "enabled" : "disabled"}
      </button>

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
        Changing sliders affects the next reset. Terrain changes grass growth, shelter and movement.
      </p>
    </section>
  );
}