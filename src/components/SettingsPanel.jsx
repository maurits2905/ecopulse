import { useState } from "react";
import { MAP_SIZES, RENDER_DETAILS } from "../simulation/presets";

const SETTING_GROUPS = [
  {
    key: "world",
    title: "World",
    description: "Map, terrain, seasons and rendering.",
    defaultOpen: true,
    sliders: [
      { key: "initialGrassDensity", label: "Initial grass density", min: 0.1, max: 1, step: 0.05 },
      { key: "grassRegrowth", label: "Grass regrowth", min: 0.05, max: 1.2, step: 0.05 },
      { key: "biomeScale", label: "Biome scale", min: 10, max: 60, step: 1 },
      { key: "waterAmount", label: "Water / coast amount", min: 0, max: 0.12, step: 0.005 },
      { key: "riverAmount", label: "River amount", min: 0, max: 1, step: 0.05 },
      { key: "forestAmount", label: "Forest amount", min: 0, max: 0.3, step: 0.01 },
      { key: "barrenAmount", label: "Barren amount", min: 0, max: 0.25, step: 0.01 },
      { key: "fertileAmount", label: "Fertile amount", min: 0, max: 0.25, step: 0.01 },
      { key: "seasonLength", label: "Season length", min: 250, max: 1400, step: 50 }
    ]
  },
  {
    key: "population",
    title: "Population",
    description: "Starting populations, caps and natural pressure.",
    defaultOpen: true,
    sliders: [
      { key: "initialPrey", label: "Initial prey", min: 20, max: 500, step: 5 },
      { key: "initialPredators", label: "Initial predators", min: 0, max: 120, step: 2 },
      { key: "maxPrey", label: "Max prey", min: 100, max: 3000, step: 50 },
      { key: "maxPredators", label: "Max predators", min: 50, max: 900, step: 25 },
      { key: "preyCarryingPressureStrength", label: "Prey carrying pressure", min: 0, max: 2, step: 0.05 },
      { key: "preyGrassScarcityPressure", label: "Prey grass scarcity pressure", min: 0, max: 2, step: 0.05 },
      { key: "preyOverpopulationMortality", label: "Prey overpopulation die-off", min: 0, max: 0.01, step: 0.0001 },
      { key: "preyReproductionGrassRequirement", label: "Grass needed for prey reproduction", min: 0.05, max: 0.65, step: 0.01 },
      { key: "predatorOverpopulationMortality", label: "Predator overpopulation die-off", min: 0, max: 0.006, step: 0.0001 },
      { key: "predatorPreyScarcityPressure", label: "Predator prey scarcity pressure", min: 0, max: 2, step: 0.05 }
    ]
  },
  {
    key: "species",
    title: "Species behavior",
    description: "Hunger, reproduction, evolution and movement behavior.",
    defaultOpen: false,
    sliders: [
      { key: "preyHunger", label: "Prey hunger", min: 0.1, max: 1.2, step: 0.05 },
      { key: "predatorHunger", label: "Predator hunger", min: 0.2, max: 1.8, step: 0.05 },
      { key: "preyReproductionEnergy", label: "Base prey reproduction energy", min: 50, max: 160, step: 5 },
      { key: "predatorReproductionEnergy", label: "Base predator reproduction energy", min: 80, max: 220, step: 5 },
      { key: "preyVision", label: "Base prey vision", min: 2, max: 16, step: 1 },
      { key: "predatorVision", label: "Base predator vision", min: 3, max: 22, step: 1 },
      { key: "preyCrowdingEnergyCost", label: "Prey crowding cost", min: 0, max: 0.08, step: 0.002 },
      { key: "predatorHandlingTime", label: "Predator handling time", min: 0, max: 30, step: 1 },
      { key: "predatorPreyRatioForReproduction", label: "Predator prey ratio needed", min: 1, max: 12, step: 0.25 },
      { key: "predatorCrowdingEnergyCost", label: "Predator crowding cost", min: 0, max: 0.12, step: 0.002 },
      { key: "preyHerdingStrength", label: "Prey herding strength", min: 0, max: 1.5, step: 0.05 },
      { key: "preySeparationStrength", label: "Prey separation strength", min: 0, max: 1.8, step: 0.05 },
      { key: "preyShelterSeekingStrength", label: "Prey shelter seeking", min: 0, max: 2.5, step: 0.05 },
      { key: "predatorPackCohesionStrength", label: "Predator pack cohesion", min: 0, max: 1.2, step: 0.05 },
      { key: "predatorPackHuntBonus", label: "Predator pack hunt bonus", min: 0, max: 0.2, step: 0.005 },
      { key: "predatorRestChance", label: "Predator rest chance", min: 0, max: 1, step: 0.05 },
      { key: "mutationRate", label: "Mutation rate", min: 0, max: 0.3, step: 0.01 }
    ]
  },
  {
    key: "migration",
    title: "Migration and disturbances",
    description: "Outside arrivals and environmental events.",
    defaultOpen: false,
    sliders: [
      { key: "preyMigrationChance", label: "Prey migration chance", min: 0, max: 0.01, step: 0.0001 },
      { key: "predatorMigrationChance", label: "Predator migration chance", min: 0, max: 0.004, step: 0.00005 },
      { key: "preyMigrationGroupSize", label: "Prey migration group size", min: 1, max: 16, step: 1 },
      { key: "predatorMigrationGroupSize", label: "Predator migration group size", min: 1, max: 8, step: 1 },
      { key: "environmentalEventChance", label: "Disturbance chance", min: 0, max: 0.004, step: 0.00005 },
      { key: "environmentalEventCooldown", label: "Disturbance cooldown", min: 50, max: 1000, step: 25 },
      { key: "environmentalEventMinDuration", label: "Min disturbance duration", min: 50, max: 800, step: 25 },
      { key: "environmentalEventMaxDuration", label: "Max disturbance duration", min: 100, max: 1200, step: 25 },
      { key: "wildfireIntensity", label: "Wildfire intensity", min: 0.1, max: 1, step: 0.05 }
    ]
  },
  {
    key: "civilization",
    title: "Civilization settings",
    description: "Settings used when you spawn humans into the current world.",
    defaultOpen: false,
    sliders: [
      { key: "initialHumans", label: "Initial humans", min: 0, max: 40, step: 1 },
      { key: "maxHumans", label: "Max humans", min: 0, max: 220, step: 5 },
      { key: "humanHuntChance", label: "Human hunt chance", min: 0, max: 0.35, step: 0.01 },
      { key: "humanMinimumPreyBeforeHunting", label: "Human min prey before hunting", min: 0, max: 300, step: 5 },
      { key: "humanGrowthChance", label: "Human growth chance", min: 0, max: 0.08, step: 0.002 },
      { key: "humanLandPressure", label: "Human land pressure", min: 0, max: 1.5, step: 0.05 },
      { key: "humanDeforestationChance", label: "Human deforestation chance", min: 0, max: 0.005, step: 0.0001 },
      { key: "bridgeBuildChance", label: "Bridge build chance", min: 0, max: 0.08, step: 0.002 },
      { key: "bridgeBuildCooldown", label: "Bridge build cooldown", min: 100, max: 3000, step: 50 },
      { key: "bridgeMinimumSpacing", label: "Bridge spacing", min: 4, max: 40, step: 1 },
      { key: "bridgeWoodCost", label: "Bridge wood cost", min: 20, max: 250, step: 5 },
      { key: "roadCreateChance", label: "Road create chance", min: 0, max: 0.2, step: 0.005 },
      { key: "roadMaxDistanceFromSettlement", label: "Road max distance", min: 5, max: 70, step: 1 },
      { key: "maxRoadCells", label: "Max road cells", min: 0, max: 1500, step: 25 },
      { key: "roadMovementBonus", label: "Road movement bonus", min: 1, max: 1.5, step: 0.01 }
    ]
  }
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
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(SETTING_GROUPS.map((group) => [group.key, group.defaultOpen]))
  );

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value
    }));
  }

  function toggleSetting(key) {
    setSettings((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  function toggleGroup(key) {
    setOpenGroups((current) => ({
      ...current,
      [key]: !current[key]
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
    <section className="panel settings-panel control-center-panel">
      <div className="panel-heading">
        <p className="eyebrow">Control center</p>
        <h2>Simulation settings</h2>
      </div>

      <div className="control-center-top">
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

      <div className="toggle-grid compact-toggles">
        <Toggle label="Seasons" active={settings.seasonsEnabled} onClick={() => toggleSetting("seasonsEnabled")} />
        <Toggle label="Terrain" active={settings.terrainEnabled} onClick={() => toggleSetting("terrainEnabled")} />
        <Toggle label="Migration" active={settings.migrationEnabled} onClick={() => toggleSetting("migrationEnabled")} />
        <Toggle label="Disturbances" active={settings.environmentalEventsEnabled} onClick={() => toggleSetting("environmentalEventsEnabled")} />
        <Toggle label="Bridges" active={settings.bridgeBuildingEnabled} onClick={() => toggleSetting("bridgeBuildingEnabled")} />
        <Toggle label="Roads" active={settings.roadBuildingEnabled} onClick={() => toggleSetting("roadBuildingEnabled")} />
        <Toggle label="Grid" active={settings.showGrid} onClick={() => toggleSetting("showGrid")} />
      </div>

      <div className="settings-groups">
        {SETTING_GROUPS.map((group) => (
          <article className="settings-group" key={group.key}>
            <button className="settings-group-header" type="button" onClick={() => toggleGroup(group.key)}>
              <span>
                <strong>{group.title}</strong>
                <small>{group.description}</small>
              </span>
              <i>{openGroups[group.key] ? "−" : "+"}</i>
            </button>

            {openGroups[group.key] ? (
              <div className="settings-group-body">
                {group.sliders.map((slider) => (
                  <label className="slider-field compact-slider" key={slider.key}>
                    <span>
                      {slider.label}
                      <strong>{displayValue(settings[slider.key])}</strong>
                    </span>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={Number.isFinite(Number(settings[slider.key])) ? settings[slider.key] : slider.min}
                      onChange={(event) => updateSetting(slider.key, Number(event.target.value))}
                    />
                  </label>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <p className="settings-note">
        Choose a world preset first. Humans are spawned separately from the Civilization tab, so civilization is no longer locked to one map.
      </p>
    </section>
  );
}

function Toggle({ label, active, onClick }) {
  return (
    <button type="button" className={active ? "toggle-button active" : "toggle-button"} onClick={onClick}>
      {label}
    </button>
  );
}