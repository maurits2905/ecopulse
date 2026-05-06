import { useState } from "react";

const TABS = {
  overview: "Overview",
  rules: "Rules",
  tips: "Tips",
  roadmap: "Roadmap"
};

export default function GuidePanel() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <section className="panel guide-panel">
      <div className="panel-heading">
        <p className="eyebrow">Guide</p>
        <h2>How EcoPulse works</h2>
      </div>

      <div className="guide-tabs">
        {Object.entries(TABS).map(([key, label]) => (
          <button
            key={key}
            className={activeTab === key ? "active" : ""}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? <Overview /> : null}
      {activeTab === "rules" ? <Rules /> : null}
      {activeTab === "tips" ? <Tips /> : null}
      {activeTab === "roadmap" ? <Roadmap /> : null}
    </section>
  );
}

function Overview() {
  return (
    <div className="guide-content">
      <p>
        EcoPulse is a browser-based ecosystem simulator. Grass grows, prey eat grass,
        predators hunt prey, and each species changes over generations through inherited
        traits and mutation.
      </p>

      <div className="guide-mini-grid">
        <Info title="Prey" text="Eat grass, flee predators, herd together and reproduce when energy is high." />
        <Info title="Predators" text="Chase prey, rest when starving, reproduce when prey are available." />
        <Info title="Terrain" text="Forests give shelter, water blocks movement, fertile land helps grass recover." />
        <Info title="Events" text="Migration, drought, disease, wildfire and seasons can change the balance." />
        <Info title="Humans" text="Optional civilization mode adds humans that gather food, cut forest, hunt prey, build huts and eventually create limited bridges over water." />
        <Info title="Humans" text="Optional civilization mode adds humans that gather food, cut forest, hunt prey, build huts, create roads and eventually build limited bridges over water." />
      </div>
    </div>
  );
}

function Rules() {
  return (
    <div className="guide-content">
      <ul className="guide-list">
        <li>Grass regrows based on terrain, season and environmental events.</li>
        <li>Prey gain energy by eating grass and lose energy through movement, hunger and crowding.</li>
        <li>Predators gain energy by eating prey and lose energy through movement, hunger and crowding.</li>
        <li>Animals reproduce when they have enough energy, but crowding and food availability matter.</li>
        <li>Offspring inherit traits from parents with small mutations.</li>
        <li>Predators have handling time after a kill, so they cannot instantly wipe out everything.</li>
        <li>Migration can reintroduce prey or predators from the edges of the map.</li>
        <li>Humans can build bridges over narrow water crossings when they have enough food and wood.</li>
        <li>Bridges are limited by placement rules, cooldown and spacing, and animals can use them too.</li>
        <li>Humans create roads naturally where they repeatedly move, and roads make travel slightly faster.</li>
        <li>Roads fade over time if they are no longer used, so old routes can disappear.</li>
      </ul>
    </div>
  );
}

function Tips() {
  return (
    <div className="guide-content">
      <ul className="guide-list">
        <li>Use <strong>Stable Ecosystem</strong> to observe long-running population cycles.</li>
        <li>Use <strong>Plain World</strong> as a clean baseline with no terrain blocking movement.</li>
        <li>Use <strong>Volatile World</strong> to see disturbances reshape the ecosystem.</li>
        <li>Hover over the canvas to inspect terrain, grass, fertility and animal traits.</li>
        <li>Use slower speeds like 0.25x or 0.5x when you want to watch movement behavior.</li>
        <li>Use the timeline to understand why population changes happened.</li>
        <li>Use export/share to send exact setups to someone else.</li>
        <li>Use the run report to copy a short summary of what happened in an experiment.</li>
      </ul>
    </div>
  );
}

function Roadmap() {
  return (
    <div className="guide-content">
      <ul className="guide-list">
        <li><strong>Status:</strong> EcoPulse is now a finished v1.0 portfolio project.</li>
        <li><strong>Included:</strong> ecosystem simulation, evolution, terrain, migration, disturbances, scenarios, reports and civilization mode.</li>
        <li><strong>Included:</strong> human infrastructure with roads and limited bridges that animals can also use.</li>
        <li><strong>Possible future:</strong> better terrain visuals, advanced scenario scoring and deeper civilization logistics.</li>
        <li><strong>Possible future:</strong> screenshots, GIFs and extra portfolio presentation material.</li>
      </ul>
    </div>
  );
}

function Info({ title, text }) {
  return (
    <article className="guide-info">
      <strong>{title}</strong>
      <span>{text}</span>
    </article>
  );
}