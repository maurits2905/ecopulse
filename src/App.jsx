import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ControlPanel from "./components/ControlPanel";
import DisturbancePanel from "./components/DisturbancePanel";
import EventLog from "./components/EventLog";
import EvolutionPanel from "./components/EvolutionPanel";
import ExperimentPanel from "./components/ExperimentPanel";
import GuidePanel from "./components/GuidePanel";
import InspectorPanel from "./components/InspectorPanel";
import PopulationChart from "./components/PopulationChart";
import ScenarioPanel from "./components/ScenarioPanel";
import SeasonPanel from "./components/SeasonPanel";
import SettingsPanel from "./components/SettingsPanel";
import SimulationCanvas from "./components/SimulationCanvas";
import StatsPanel from "./components/StatsPanel";
import TerrainPanel from "./components/TerrainPanel";
import TimelinePanel from "./components/TimelinePanel";
import TraitChart from "./components/TraitChart";
import MobileSummaryBar from "./components/MobileSummaryBar";
import RunSummaryPanel from "./components/RunSummaryPanel";
import CivilizationPanel from "./components/CivilizationPanel";
import { buildRunSummary } from "./simulation/runSummary";
import { createWorld } from "./simulation/createWorld";
import { getPresetSettings, PRESETS } from "./simulation/presets";
import { evaluateScenario } from "./simulation/scenarios";
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

export default function App() {
  const [presetKey, setPresetKey] = useState("balanced");
  const [settings, setSettings] = useState(() => getPresetSettings("balanced"));
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

  const selectedPreset = useMemo(() => PRESETS[presetKey], [presetKey]);
  const scenario = useMemo(() => evaluateScenario(presetKey, worldView), [presetKey, worldView]);
  const runSummary = useMemo(
  () => buildRunSummary(worldView, scenario),
  [worldView, scenario]
  );

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
    skipPresetResetRef.current = true;
    setRunning(false);
    setPresetKey(nextPresetKey ?? "balanced");
    setSettings(nextSettings);
    tickAccumulatorRef.current = 0;
    setInspected(null);

    const nextWorld = createWorld(nextSettings);
    worldRef.current = nextWorld;
    setWorldView({ ...nextWorld });
  }

  const resetWorld = useCallback(() => {
    tickAccumulatorRef.current = 0;
    setInspected(null);

    const nextWorld = createWorld(settings);
    worldRef.current = nextWorld;
    setWorldView({ ...nextWorld });
  }, [settings]);

  const stepWorld = useCallback(() => {
    updateWorld(worldRef.current);
    setWorldView({ ...worldRef.current });
  }, []);

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

    const presetSettings = getPresetSettings(presetKey);
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
            migration changes pressure, and environmental events disturb the balance.
          </p>
        </div>

        <div className="hero-card">
          <span>Current scenario</span>
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

        <aside className="side-column">
          <StatsPanel stats={worldView.stats} world={worldView} />
          <ScenarioPanel scenario={scenario} />
          <RunSummaryPanel summary={runSummary} scenario={scenario} />
          <GuidePanel />
          <InspectorPanel inspected={inspected} />
          <SeasonPanel stats={worldView.stats} />
          <DisturbancePanel stats={worldView.stats} />
          <CivilizationPanel stats={worldView.stats} />
          <TimelinePanel timelineEvents={worldView.timelineEvents} />
          <TimelinePanel timelineEvents={worldView.timelineEvents} />
          <TerrainPanel stats={worldView.stats} />
          <EvolutionPanel stats={worldView.stats} />
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
          <SettingsPanel settings={settings} setSettings={setSettings} />
          <EventLog events={worldView.events} />
        </aside>
      </div>
    </main>
  );
}