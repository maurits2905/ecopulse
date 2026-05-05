import { MAP_SIZES, RENDER_DETAILS } from "../simulation/presets";

const SLIDERS = [
  {
    key: "initialPrey",
    label: "Initial prey",
    min: 20,
    max: 500,
    step: 5
  },
  {
    key: "initialPredators",
    label: "Initial predators",
    min: 0,
    max: 120,
    step: 2
  },
  {
    key: "maxPrey",
    label: "Max prey",
    min: 100,
    max: 3000,
    step: 50
  },
  {
    key: "maxPredators",
    label: "Max predators",
    min: 50,
    max: 900,
    step: 25
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
    key: "biomeScale",
    label: "Biome scale",
    min: 10,
    max: 60,
    step: 1
  },
  {
    key: "waterAmount",
    label: "Water / coast amount",
    min: 0,
    max: 0.12,
    step: 0.005
  },
  {
    key: "riverAmount",
    label: "River amount",
    min: 0,
    max: 1,
    step: 0.05
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
    key: "preyMigrationChance",
    label: "Prey migration chance",
    min: 0,
    max: 0.01,
    step: 0.0001
  },
  {
    key: "predatorMigrationChance",
    label: "Predator migration chance",
    min: 0,
    max: 0.004,
    step: 0.00005
  },
  {
    key: "preyMigrationGroupSize",
    label: "Prey migration group size",
    min: 1,
    max: 16,
    step: 1
  },
  {
    key: "predatorMigrationGroupSize",
    label: "Predator migration group size",
    min: 1,
    max: 8,
    step: 1
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
    key: "preyCrowdingEnergyCost",
    label: "Prey crowding cost",
    min: 0,
    max: 0.08,
    step: 0.002
  },
  {
    key: "predatorHandlingTime",
    label: "Predator handling time",
    min: 0,
    max: 30,
    step: 1
  },
  {
    key: "predatorPreyRatioForReproduction",
    label: "Predator prey ratio needed",
    min: 1,
    max: 12,
    step: 0.25
  },
  {
    key: "predatorCrowdingEnergyCost",
    label: "Predator crowding cost",
    min: 0,
    max: 0.12,
    step: 0.002
  },
  {
    key: "mutationRate",
    label: "Mutation rate",
    min: 0,
    max: 0.3,
    step: 0.01
  },
    {
    key: "environmentalEventChance",
    label: "Disturbance chance",
    min: 0,
    max: 0.004,
    step: 0.00005
  },
  {
    key: "environmentalEventCooldown",
    label: "Disturbance cooldown",
    min: 50,
    max: 1000,
    step: 25
  },
  {
    key: "environmentalEventMinDuration",
    label: "Min disturbance duration",
    min: 50,
    max: 800,
    step: 25
  },
  {
    key: "environmentalEventMaxDuration",
    label: "Max disturbance duration",
    min: 100,
    max: 1200,
    step: 25
  },
  {
    key: "wildfireIntensity",
    label: "Wildfire intensity",
    min: 0.1,
    max: 1,
    step: 0.05
  },
];

function displayValue(value) {
  if (typeof value !== "number") return value;

  if (value > 0 && value < 0.01) {
    return value.toFixed(5).replace(/0+$/, "");
  }

  if (value < 2 && value % 1 !== 0) {
    return value.toFixed(3).replace(/0+$/, "");
  }

  return Math.round(value * 100) / 100;
}

function getMapSizeKey(settings) {
  const match = Object.entries(MAP_SIZES).find(
    ([, size]) => size.width === settings.worldWidth && size.height === settings.worldHeight
  );

  return match?.[0] ?? "custom";
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

  function toggleGrid() {
    setSettings((current) => ({
      ...current,
      showGrid: !current.showGrid
    }));
  }

  function toggleMigration() {
    setSettings((current) => ({
      ...current,
      migrationEnabled: !current.migrationEnabled
    }));
  }

  function toggleEnvironmentalEvents() {
    setSettings((current) => ({
      ...current,
      environmentalEventsEnabled: !current.environmentalEventsEnabled
    }));
  }

  function updateMapSize(sizeKey) {
    const size = MAP_SIZES[sizeKey];

    if (!size) return;

    setSettings((current) => ({
      ...current,
      worldWidth: size.width,
      worldHeight: size.height,
      maxPrey: size.maxPrey,
      maxPredators: size.maxPredators,
      initialPrey: size.initialPrey,
      initialPredators: size.initialPredators,
      biomeScale:
        sizeKey === "compact"
          ? Math.min(current.biomeScale, 24)
          : sizeKey === "huge"
            ? Math.max(current.biomeScale, 34)
            : current.biomeScale,
      renderDetail: sizeKey === "huge" ? "performance" : current.renderDetail
    }));
  }

  return (
    <section className="panel settings-panel">
      <div className="panel-heading">
        <p className="eyebrow">Experiment controls</p>
        <h2>World parameters</h2>
      </div>

      <div className="settings-select-grid">
        <label className="field">
          <span>Map size</span>
          <select value={getMapSizeKey(settings)} onChange={(event) => updateMapSize(event.target.value)}>
            {Object.entries(MAP_SIZES).map(([key, size]) => (
              <option key={key} value={key}>
                {size.label} · {size.width}x{size.height}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Render detail</span>
          <select
            value={settings.renderDetail}
            onChange={(event) => updateSetting("renderDetail", event.target.value)}
          >
            {Object.entries(RENDER_DETAILS).map(([key, detail]) => (
              <option key={key} value={key}>
                {detail.label}
              </option>
            ))}
          </select>
        </label>
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

      <button
        type="button"
        className={settings.migrationEnabled ? "toggle-button active" : "toggle-button"}
        onClick={toggleMigration}
      >
        Migration {settings.migrationEnabled ? "enabled" : "disabled"}
      </button>

      <button
        type="button"
        className={settings.environmentalEventsEnabled ? "toggle-button active" : "toggle-button"}
        onClick={toggleEnvironmentalEvents}
      >
        Disturbances {settings.environmentalEventsEnabled ? "enabled" : "disabled"}
      </button>

      <button
        type="button"
        className={settings.showGrid ? "toggle-button active" : "toggle-button"}
        onClick={toggleGrid}
      >
        Grid {settings.showGrid ? "visible" : "hidden"}
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
        Migration can reintroduce prey or predators from the map edges, which can rescue or destabilize an ecosystem.
      </p>
    </section>
  );
}