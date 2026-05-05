export function buildRunSummary(world, scenario) {
  if (!world?.history?.length || !world.stats) {
    return null;
  }

  const history = world.history;
  const timeline = world.timelineEvents ?? [];
  const latest = world.stats;

  const peakPrey = maxBy(history, "prey");
  const peakPredators = maxBy(history, "predators");
  const highestGrass = maxBy(history, "grassPercent");
  const lowestGrass = minBy(history, "grassPercent");

  const migrationEvents = timeline.filter(
    (event) => event.category === "migration",
  );
  const disturbanceEvents = timeline.filter(
    (event) => event.category === "disturbance",
  );
  const extinctionEvents = timeline.filter(
    (event) => event.category === "extinction",
  );
  const evolutionEvents = timeline.filter(
    (event) => event.category === "evolution",
  );

  const trend = getDominantTrend(history, latest);

  return {
    tick: latest.tick,
    status: latest.status,
    scenarioStatus: scenario?.status ?? "sandbox",
    peakPrey,
    peakPredators,
    highestGrass,
    lowestGrass,
    finalPrey: latest.prey,
    finalPredators: latest.predators,
    finalGrassPercent: latest.grassPercent,
    migrationCount: migrationEvents.length,
    disturbanceCount: disturbanceEvents.length,
    extinctionCount: extinctionEvents.length,
    evolutionCount: evolutionEvents.length,
    trend,
    generatedAt: new Date().toISOString(),
  };
}

export function formatRunSummaryText(summary, scenario) {
  if (!summary) return "";

  const lines = [
    "EcoPulse run summary",
    "",
    `Status: ${summary.status}`,
    `Ticks simulated: ${summary.tick.toLocaleString("en-US")}`,
    `Scenario: ${scenario?.title ?? "Sandbox mode"}`,
    `Scenario result: ${formatScenarioStatus(summary.scenarioStatus)}`,
    "",
    "Final state:",
    `- Prey: ${summary.finalPrey.toLocaleString("en-US")}`,
    `- Predators: ${summary.finalPredators.toLocaleString("en-US")}`,
    `- Grass cover: ${percent(summary.finalGrassPercent)}`,
    "",
    "Peaks and lows:",
    `- Peak prey: ${summary.peakPrey.value.toLocaleString("en-US")} at tick ${summary.peakPrey.tick.toLocaleString("en-US")}`,
    `- Peak predators: ${summary.peakPredators.value.toLocaleString("en-US")} at tick ${summary.peakPredators.tick.toLocaleString("en-US")}`,
    `- Highest grass: ${percent(summary.highestGrass.value)} at tick ${summary.highestGrass.tick.toLocaleString("en-US")}`,
    `- Lowest grass: ${percent(summary.lowestGrass.value)} at tick ${summary.lowestGrass.tick.toLocaleString("en-US")}`,
    "",
    "Timeline:",
    `- Migration events: ${summary.migrationCount}`,
    `- Disturbance events: ${summary.disturbanceCount}`,
    `- Extinction events: ${summary.extinctionCount}`,
    `- Evolution signals: ${summary.evolutionCount}`,
    "",
    `Dominant trend: ${summary.trend}`,
  ];

  return lines.join("\n");
}

function maxBy(items, key) {
  let best = items[0];

  for (const item of items) {
    if ((item[key] ?? 0) > (best[key] ?? 0)) {
      best = item;
    }
  }

  return {
    tick: best.tick,
    value: best[key] ?? 0,
  };
}

function minBy(items, key) {
  let best = items[0];

  for (const item of items) {
    if ((item[key] ?? 0) < (best[key] ?? 0)) {
      best = item;
    }
  }

  return {
    tick: best.tick,
    value: best[key] ?? 0,
  };
}

function getDominantTrend(history, latest) {
  if (latest.prey <= 0 && latest.predators <= 0) {
    return "Full animal collapse";
  }

  if (latest.prey <= 0) {
    return "Prey collapse";
  }

  if (latest.predators <= 0) {
    return "Predator collapse";
  }

  const first = history[0];
  const midpoint = history[Math.floor(history.length / 2)] ?? first;

  const preyGrowth = latest.prey - midpoint.prey;
  const predatorGrowth = latest.predators - midpoint.predators;
  const grassChange = latest.grassPercent - midpoint.grassPercent;

  if (latest.prey > latest.predators * 12 && grassChange < -0.08) {
    return "Prey expansion with grazing pressure";
  }

  if (latest.predators > latest.prey * 0.55) {
    return "High predator pressure";
  }

  if (
    Math.abs(preyGrowth) < 40 &&
    Math.abs(predatorGrowth) < 20 &&
    Math.abs(grassChange) < 0.12
  ) {
    return "Relative coexistence";
  }

  if (preyGrowth > 80 && predatorGrowth > 15) {
    return "Both populations expanding";
  }

  if (grassChange > 0.12 && preyGrowth < 0) {
    return "Resource recovery after grazing pressure";
  }

  return "Oscillating ecosystem";
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatScenarioStatus(status) {
  if (status === "complete") return "Completed";
  if (status === "failed") return "Failed";
  if (status === "active") return "Active";
  return "Sandbox";
}
