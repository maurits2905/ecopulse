import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ControlPanel from "./components/ControlPanel";
import EventLog from "./components/EventLog";
import EvolutionPanel from "./components/EvolutionPanel";
import PopulationChart from "./components/PopulationChart";
import SeasonPanel from "./components/SeasonPanel";
import SettingsPanel from "./components/SettingsPanel";
import SimulationCanvas from "./components/SimulationCanvas";
import StatsPanel from "./components/StatsPanel";
import TerrainPanel from "./components/TerrainPanel";
import TraitChart from "./components/TraitChart";
import { createWorld } from "./simulation/createWorld";
import { getPresetSettings, PRESETS } from "./simulation/presets";
import { updateWorld } from "./simulation/updateWorld";

export default function App() {
  const [presetKey, setPresetKey] = useState("balanced");
  const [settings, setSettings] = useState(() => getPresetSettings("balanced"));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [worldView, setWorldView] = useState(() => createWorld(getPresetSettings("balanced")));

  const worldRef = useRef(worldView);
  const animationRef = useRef(null);
  const frameCounterRef = useRef(0);
  const tickAccumulatorRef = useRef(0);

  const selectedPreset = useMemo(() => PRESETS[presetKey], [presetKey]);

  const resetWorld = useCallback(() => {
    tickAccumulatorRef.current = 0;

    const nextWorld = createWorld(settings);
    worldRef.current = nextWorld;
    setWorldView({ ...nextWorld });
  }, [settings]);

  const stepWorld = useCallback(() => {
    updateWorld(worldRef.current);
    setWorldView({ ...worldRef.current });
  }, []);

  useEffect(() => {
    const presetSettings = getPresetSettings(presetKey);
    setSettings(presetSettings);
    tickAccumulatorRef.current = 0;

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
            Grass grows, prey feed, predators hunt, inherited traits mutate, seasons shift and
            terrain shapes where life can survive.
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
          <SimulationCanvas world={worldView} />

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

          <PopulationChart history={worldView.history} />
          <TraitChart history={worldView.history} />
        </section>

        <aside className="side-column">
          <StatsPanel stats={worldView.stats} world={worldView} />
          <SeasonPanel stats={worldView.stats} />
          <TerrainPanel stats={worldView.stats} />
          <EvolutionPanel stats={worldView.stats} />
          <SettingsPanel settings={settings} setSettings={setSettings} />
          <EventLog events={worldView.events} />
        </aside>
      </div>
    </main>
  );
}