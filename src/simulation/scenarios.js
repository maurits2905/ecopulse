const SCENARIOS = {
  stableEcosystem: {
    title: "Long coexistence",
    description:
      "Keep both prey and predators alive long enough for evolution and population cycles to become visible.",
    objectives: [
      {
        key: "survive3000",
        label: "Reach tick 3,000 with prey and predators alive",
        type: "surviveWithBoth",
        target: 3000,
      },
      {
        key: "preyGenerations",
        label: "Reach average prey generation 6",
        type: "preyGeneration",
        target: 6,
      },
      {
        key: "predatorGenerations",
        label: "Reach average predator generation 4",
        type: "predatorGeneration",
        target: 4,
      },
    ],
  },

  predatorPressure: {
    title: "Predator pressure",
    description:
      "Predators start strong. The goal is to avoid prey extinction and reach a more balanced cycle.",
    objectives: [
      {
        key: "preySurvival",
        label: "Keep prey alive until tick 2,000",
        type: "preySurviveUntil",
        target: 2000,
      },
      {
        key: "predatorControl",
        label: "Avoid predators exceeding 120",
        type: "predatorBelow",
        target: 120,
      },
      {
        key: "grassRecovery",
        label: "Keep grass cover above 20%",
        type: "grassAbove",
        target: 0.2,
      },
    ],
  },

  recoveryLab: {
    title: "Ecosystem recovery",
    description:
      "The world starts fragile. Help it recover into a functioning ecosystem with prey, predators and grass.",
    objectives: [
      {
        key: "grassRecovery",
        label: "Recover grass cover to 45%",
        type: "grassAbove",
        target: 0.45,
      },
      {
        key: "preyRecovery",
        label: "Reach 120 prey",
        type: "preyAbove",
        target: 120,
      },
      {
        key: "survive2500",
        label: "Reach tick 2,500 with animals alive",
        type: "surviveWithAnyAnimals",
        target: 2500,
      },
    ],
  },

  migrationCorridor: {
    title: "Migration corridor",
    description:
      "Migration can rescue or destabilize the ecosystem. Observe whether outside arrivals help long-term survival.",
    objectives: [
      {
        key: "survive2500",
        label: "Reach tick 2,500 with prey and predators alive",
        type: "surviveWithBoth",
        target: 2500,
      },
      {
        key: "migrationActive",
        label: "Run long enough to observe migration pressure",
        type: "tick",
        target: 1500,
      },
      {
        key: "grassStable",
        label: "Keep grass cover above 18%",
        type: "grassAbove",
        target: 0.18,
      },
    ],
  },

  volatileWorld: {
    title: "Volatile world",
    description:
      "Drought, disease, wildfire and resource blooms can reshape the ecosystem. Try to survive the chaos.",
    objectives: [
      {
        key: "survive3000",
        label: "Reach tick 3,000 with prey and predators alive",
        type: "surviveWithBoth",
        target: 3000,
      },
      {
        key: "disturbanceExposure",
        label: "Survive until at least tick 1,500",
        type: "tick",
        target: 1500,
      },
      {
        key: "avoidCollapse",
        label: "Avoid full animal extinction",
        type: "animalsAlive",
        target: 1,
      },
    ],
  },

  behaviorLab: {
    title: "Behavior lab",
    description:
      "Watch how herding, shelter seeking and pack behavior change survival pressure.",
    objectives: [
      {
        key: "preyGeneration",
        label: "Reach average prey generation 5",
        type: "preyGeneration",
        target: 5,
      },
      {
        key: "predatorGeneration",
        label: "Reach average predator generation 4",
        type: "predatorGeneration",
        target: 4,
      },
      {
        key: "survive2000",
        label: "Reach tick 2,000 with both species alive",
        type: "surviveWithBoth",
        target: 2000,
      },
    ],
  },

  forestRefuge: {
    title: "Forest refuge",
    description:
      "Forests create prey refuge zones. The goal is to keep prey alive under predator pressure.",
    objectives: [
      {
        key: "preySurvival",
        label: "Keep prey alive until tick 2,500",
        type: "preySurviveUntil",
        target: 2500,
      },
      {
        key: "predatorsAlive",
        label: "Keep predators present",
        type: "predatorAbove",
        target: 8,
      },
      {
        key: "grassCover",
        label: "Keep grass cover above 22%",
        type: "grassAbove",
        target: 0.22,
      },
    ],
  },

  plainWorld: {
    title: "Open world baseline",
    description:
      "A simple open map without blocked terrain. Use this as a clean baseline for behavior and balance.",
    objectives: [
      {
        key: "survive2000",
        label: "Reach tick 2,000 with prey and predators alive",
        type: "surviveWithBoth",
        target: 2000,
      },
      {
        key: "avoidPreyTakeover",
        label: "Keep prey below 650",
        type: "preyBelow",
        target: 650,
      },
      {
        key: "grassStable",
        label: "Keep grass cover above 20%",
        type: "grassAbove",
        target: 0.2,
      },
    ],
  },
};

export function getScenarioForPreset(presetKey) {
  return SCENARIOS[presetKey] ?? null;
}

export function evaluateScenario(presetKey, world) {
  const scenario = getScenarioForPreset(presetKey);

  if (!scenario || !world?.stats) {
    return null;
  }

  const evaluatedObjectives = scenario.objectives.map((objective) =>
    evaluateObjective(objective, world),
  );

  const failed = evaluatedObjectives.some((objective) => objective.failed);
  const complete = evaluatedObjectives.every((objective) => objective.complete);

  return {
    ...scenario,
    status: failed ? "failed" : complete ? "complete" : "active",
    objectives: evaluatedObjectives,
  };
}

function evaluateObjective(objective, world) {
  const stats = world.stats;

  let value = 0;
  let progress = 0;
  let complete = false;
  let failed = false;

  if (objective.type === "tick") {
    value = stats.tick;
    progress = stats.tick / objective.target;
    complete = stats.tick >= objective.target;
  }

  if (objective.type === "surviveWithBoth") {
    value = stats.tick;
    progress = stats.tick / objective.target;
    failed = stats.prey <= 0 || stats.predators <= 0;
    complete = !failed && stats.tick >= objective.target;
  }

  if (objective.type === "surviveWithAnyAnimals") {
    value = stats.tick;
    progress = stats.tick / objective.target;
    failed = stats.prey <= 0 && stats.predators <= 0;
    complete = !failed && stats.tick >= objective.target;
  }

  if (objective.type === "preySurviveUntil") {
    value = stats.tick;
    progress = stats.tick / objective.target;
    failed = stats.prey <= 0;
    complete = !failed && stats.tick >= objective.target;
  }

  if (objective.type === "animalsAlive") {
    value = stats.prey + stats.predators;
    progress = value >= objective.target ? 1 : 0;
    failed = value < objective.target;
    complete = value >= objective.target;
  }

  if (objective.type === "grassAbove") {
    value = stats.grassPercent;
    progress = stats.grassPercent / objective.target;
    failed = stats.tick > 500 && stats.grassPercent < objective.target * 0.45;
    complete = stats.grassPercent >= objective.target;
  }

  if (objective.type === "preyAbove") {
    value = stats.prey;
    progress = stats.prey / objective.target;
    failed = stats.prey <= 0;
    complete = stats.prey >= objective.target;
  }

  if (objective.type === "predatorAbove") {
    value = stats.predators;
    progress = stats.predators / objective.target;
    failed = stats.tick > 800 && stats.predators <= 0;
    complete = stats.predators >= objective.target;
  }

  if (objective.type === "preyBelow") {
    value = stats.prey;
    progress =
      value <= objective.target ? 1 : objective.target / Math.max(1, value);
    failed = value > objective.target;
    complete = value <= objective.target;
  }

  if (objective.type === "predatorBelow") {
    value = stats.predators;
    progress =
      value <= objective.target ? 1 : objective.target / Math.max(1, value);
    failed = value > objective.target;
    complete = value <= objective.target;
  }

  if (objective.type === "preyGeneration") {
    value = stats.preyGeneration;
    progress = stats.preyGeneration / objective.target;
    failed = stats.prey <= 0;
    complete = stats.preyGeneration >= objective.target;
  }

  if (objective.type === "predatorGeneration") {
    value = stats.predatorGeneration;
    progress = stats.predatorGeneration / objective.target;
    failed = stats.predators <= 0;
    complete = stats.predatorGeneration >= objective.target;
  }

  return {
    ...objective,
    value,
    progress: Math.max(0, Math.min(1, progress)),
    complete,
    failed,
  };
}
