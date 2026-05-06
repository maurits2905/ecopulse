import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CivilizationPanel from "./components/CivilizationPanel";
import ControlPanel from "./components/ControlPanel";
import DisturbancePanel from "./components/DisturbancePanel";
import EventLog from "./components/EventLog";
import EvolutionPanel from "./components/EvolutionPanel";
import ExperimentPanel from "./components/ExperimentPanel";
import GuidePanel from "./components/GuidePanel";
import InspectorPanel from "./components/InspectorPanel";
import MobileSummaryBar from "./components/MobileSummaryBar";
import PanelDock from "./components/PanelDock";
import PopulationChart from "./components/PopulationChart";
import RunSummaryPanel from "./components/RunSummaryPanel";
import ScenarioPanel from "./components/ScenarioPanel";
import SeasonPanel from "./components/SeasonPanel";
import SettingsPanel from "./components/SettingsPanel";
import SimulationCanvas from "./components/SimulationCanvas";
import StatsPanel from "./components/StatsPanel";
import TerrainPanel from "./components/TerrainPanel";
import TimelinePanel from "./components/TimelinePanel";
import TraitChart from "./components/TraitChart";
import { initializeCivilization } from "./simulation/civilization";
import { createWorld } from "./simulation/createWorld";
import { getPresetSettings, PRESETS } from "./simulation/presets";
import { buildRunSummary } from "./simulation/runSummary";
import { evaluateScenario } from "./simulation/scenarios";
import { collectStats } from "./simulation/stats";
import { updateWorld } from "./simulation/updateWorld";
import {
  createExperimentPayload,
  decodeExperimentFromUrl,
  deleteExperiment,
  downloadExperimentJson,
  encodeExperimentForUrl,
  loadSavedExperiments,
  saveExperiment,
  validateExperimentPayload
} from "./utils/experiments";
import { getSafePresetKey, getSafeSettings } from "./utils/settings";

export default function App() {
  const [presetKey, setPresetKey] = useState("balanced");
  const [settings, setSettings] = useState(() => getSafeSettings(getPresetSettings("balanced")));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [worldView, setWorldView] = useState(() => createWorld(getPresetSettings("balanced")));
  const [inspected, setInspected] = useState(null);
  const [savedExperiments, setSavedExperiments] = useState(() => loadSavedExperiments());
  const [importText, setImportText] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [importStatus, setImportStatus] = useState("");

  const worldRef = useRef(worldView);
  const animationRef = useRef(null);
  const frameCounterRef = useRef(0);
  const tickAccumulatorRef = useRef(0);
  const skipPresetResetRef = useRef(false);

  const selectedPreset = useMemo(() => PRESETS[presetKey] ?? PRESETS.balanced, [presetKey]);
  const scenario = useMemo(() => evaluateScenario(presetKey, worldView), [presetKey, worldView]);
  const runSummary = useMemo(() => buildRunSummary(worldView, scenario), [worldView, scenario]);

  const currentExperimentPayload = useMemo(
    () =>
      createExperimentPayload({
        name: `${selectedPreset.label} · ${settings.worldWidth}x${settings.worldHeight}`,
        presetKey,
        settings
      }),
    [presetKey, selectedPreset.label, settings]
  );

  const exportText = useMemo(
    () => JSON.stringify(currentExperimentPayload, null, 2),
    [currentExperimentPayload]
  );

  function loadSettingsAsWorld(nextPresetKey, nextSettings) {
    const safePresetKey = getSafePresetKey(nextPresetKey ?? "balanced");
    const safeSettings = getSafeSettings({
      ...nextSettings,
      civilizationEnabled: false
    });

    skipPresetResetRef.current = true;
    setRunning(false);
    setPresetKey(safePresetKey);
    setSettings(safeSettings);
    tickAccumulatorRef.current = 0;
    setInspected(null);

    const nextWorld = createWorld(safeSettings);
    worldRef.current = nextWorld;
    setWorldView({ ...nextWorld });
  }

  const resetWorld = useCallback(() => {
    tickAccumulatorRef.current = 0;
    setInspected(null);

    const resetSettings = getSafeSettings({
      ...settings,
      civilizationEnabled: false
    });

    setSettings(resetSettings);

    const nextWorld = createWorld(resetSettings);
    worldRef.current = nextWorld;
    setWorldView({ ...nextWorld });
  }, [settings]);

  const stepWorld = useCallback(() => {
    updateWorld(worldRef.current);
    setWorldView({ ...worldRef.current });
  }, []);

  const spawnCivilization = useCallback(() => {
    const nextSettings = getSafeSettings({
      ...worldRef.current.settings,
      ...settings,
      civilizationEnabled: true
    });

    setSettings(nextSettings);

    const world = worldRef.current;
    world.settings = nextSettings;

    initializeCivilization(world);

    world.stats = collectStats(world);

    if (world.history.length > 0) {
      world.history[world.history.length - 1] = world.stats;
    } else {
      world.history.push(world.stats);
    }

    setWorldView({ ...world });
  }, [settings]);

  const removeCivilization = useCallback(() => {
    const nextSettings = getSafeSettings({
      ...worldRef.current.settings,
      ...settings,
      civilizationEnabled: false
    });

    setSettings(nextSettings);

    const world = worldRef.current;
    world.settings = nextSettings;
    world.humans = [];

    if (world.civilization) {
      world.civilization.enabled = false;
      world.civilization.population = 0;
      world.civilization.food = 0;
      world.civilization.wood = 0;
      world.civilization.huts = 0;
      world.civilization.pressure = 0;
      world.civilization.stress = 0;
    }

    world.stats = collectStats(world);

    if (world.history.length > 0) {
      world.history[world.history.length - 1] = world.stats;
    } else {
      world.history.push(world.stats);
    }

    setWorldView({ ...world });
  }, [settings]);

  const handleSaveExperiment = useCallback(() => {
    const next = saveExperiment(currentExperimentPayload);
    setSavedExperiments(next);
    setCopyStatus("Setup saved locally.");
  }, [currentExperimentPayload]);

  const handleLoadExperiment = useCallback((experiment) => {
    loadSettingsAsWorld(experiment.presetKey ?? "balanced", experiment.settings);
  }, []);

  const handleDeleteExperiment = useCallback((id) => {
    const next = deleteExperiment(id);
    setSavedExperiments(next);
  }, []);

  const handleCopyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(currentExperimentPayload, null, 2));
      setCopyStatus("Setup JSON copied.");
    } catch {
      setCopyStatus("Could not copy JSON. Use the export text box instead.");
    }
  }, [currentExperimentPayload]);

  const handleCopyShareUrl = useCallback(async () => {
    try {
      const encoded = encodeExperimentForUrl(currentExperimentPayload);
      const url = new URL(window.location.href);

      url.searchParams.set("experiment", encoded);

      await navigator.clipboard.writeText(url.toString());
      setCopyStatus("Share URL copied.");
    } catch {
      setCopyStatus("Could not copy share URL.");
    }
  }, [currentExperimentPayload]);

  const handleDownloadJson = useCallback(() => {
    downloadExperimentJson(currentExperimentPayload);
    setCopyStatus("JSON downloaded.");
  }, [currentExperimentPayload]);

  const handleImportExperiment = useCallback(() => {
    try {
      const parsed = JSON.parse(importText);
      const valid = validateExperimentPayload(parsed);

      if (!valid) {
        setImportStatus("Invalid EcoPulse setup JSON.");
        return;
      }

      loadSettingsAsWorld(valid.presetKey ?? "balanced", valid.settings);
      setImportStatus("Setup imported and loaded.");
    } catch {
      setImportStatus("Could not read JSON. Check that the pasted text is valid.");
    }
  }, [importText]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedExperiment = params.get("experiment");

    if (!encodedExperiment) return;

    const sharedExperiment = decodeExperimentFromUrl(encodedExperiment);

    if (!sharedExperiment) {
      setImportStatus("Shared experiment URL could not be loaded.");
      return;
    }

    loadSettingsAsWorld(sharedExperiment.presetKey ?? "balanced", sharedExperiment.settings);
    setImportStatus("Shared experiment loaded from URL.");
  }, []);

  useEffect(() => {
    if (skipPresetResetRef.current) {
      skipPresetResetRef.current = false;
      return;
    }

    const presetSettings = getSafeSettings({
      ...getPresetSettings(getSafePresetKey(presetKey)),
      civilizationEnabled: false
    });

    setSettings(presetSettings);
    tickAccumulatorRef.current = 0;
    setInspected(null);

    const nextWorld = createWorld(presetSettings);
    worldRef.current = nextWorld;
    setWorldView({ ...nextWorld });
  }, [presetKey]);

  useEffect(() => {
    function loop() {
      if (running) {
        tickAccumulatorRef.current += speed;

        let updates = 0;
        while (tickAccumulatorRef.current >= 1 && updates < 20) {
          updateWorld(worldRef.current);
          tickAccumulatorRef.current -= 1;
          updates += 1;
        }

        frameCounterRef.current += 1;

        if (frameCounterRef.current % 2 === 0 || speed < 1) {
          setWorldView({ ...worldRef.current });
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    }

    animationRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [running, speed]);

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">EcoPulse</p>
          <h1>Emergent ecosystem simulator</h1>
          <p className="hero-text">
            Grass grows, prey feed, predators hunt, inherited traits mutate, seasons shift,
            migration changes pressure, and humans can be spawned into any world as a separate civilization layer.
          </p>
        </div>

        <div className="hero-card">
          <span>Current preset</span>
          <strong>{selectedPreset.label}</strong>
          <p>{selectedPreset.description}</p>
        </div>
      </header>

      <div className="layout">
        <section className="main-column">
          <SimulationCanvas world={worldView} onInspect={setInspected} />

          <ControlPanel
            running={running}
            setRunning={setRunning}
            speed={speed}
            setSpeed={setSpeed}
            presetKey={presetKey}
            setPresetKey={setPresetKey}
            onReset={resetWorld}
            onStep={stepWorld}
          />

          <MobileSummaryBar stats={worldView.stats} />

          <PopulationChart
            history={worldView.history}
            timelineEvents={worldView.timelineEvents}
          />
          <TraitChart history={worldView.history} />
        </section>

        <PanelDock
          groups={[
            {
              key: "overview",
              label: "Overview",
              title: "Ecosystem overview",
              description: "Current state, scenario goals and the run report.",
              badge: worldView.stats?.status,
              items: [
                <StatsPanel stats={worldView.stats} world={worldView} />,
                <ScenarioPanel scenario={scenario} />,
                <RunSummaryPanel summary={runSummary} scenario={scenario} />
              ]
            },
            {
              key: "world",
              label: "World",
              title: "World systems",
              description: "Terrain, seasons, disturbances and major timeline events.",
              items: [
                <SeasonPanel stats={worldView.stats} />,
                <TerrainPanel stats={worldView.stats} />,
                <DisturbancePanel stats={worldView.stats} />,
                <TimelinePanel timelineEvents={worldView.timelineEvents} />
              ]
            },
            {
              key: "lab",
              label: "Lab",
              title: "Experiment lab",
              description: "Inspect cells, track evolution and save or share setups.",
              items: [
                <InspectorPanel inspected={inspected} />,
                <EvolutionPanel stats={worldView.stats} />,
                <ExperimentPanel
                  savedExperiments={savedExperiments}
                  exportText={exportText}
                  importText={importText}
                  setImportText={setImportText}
                  copyStatus={copyStatus}
                  importStatus={importStatus}
                  onSaveExperiment={handleSaveExperiment}
                  onLoadExperiment={handleLoadExperiment}
                  onDeleteExperiment={handleDeleteExperiment}
                  onCopyJson={handleCopyJson}
                  onCopyShareUrl={handleCopyShareUrl}
                  onDownloadJson={handleDownloadJson}
                  onImportExperiment={handleImportExperiment}
                />
              ]
            },
            {
              key: "civilization",
              label: "Civilization",
              title: "Civilization layer",
              description: "Spawn humans into the current world, independent of the selected preset.",
              badge: worldView.stats?.civilization?.enabled
                ? `${worldView.stats?.humans ?? 0} humans`
                : "Off",
              items: [
                <CivilizationPanel
                  stats={worldView.stats}
                  onSpawnCivilization={spawnCivilization}
                  onRemoveCivilization={removeCivilization}
                />,
                <GuidePanel />
              ]
            },
            {
              key: "settings",
              label: "Controls",
              title: "Control center",
              description: "Grouped controls, toggles and recent events.",
              items: [
                <SettingsPanel settings={settings} setSettings={setSettings} />,
                <EventLog events={worldView.events} />
              ]
            }
          ]}
        />
      </div>
    </main>
  );
}