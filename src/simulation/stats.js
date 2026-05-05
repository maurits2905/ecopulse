function averageTrait(agents, key) {
  if (agents.length === 0) return 0;
  return (
    agents.reduce((sum, agent) => sum + agent.traits[key], 0) / agents.length
  );
}

function averageGeneration(agents) {
  if (agents.length === 0) return 0;
  return (
    agents.reduce((sum, agent) => sum + agent.generation, 0) / agents.length
  );
}

export function collectStats(world) {
  const grassTotal = world.cells.reduce((sum, cell) => sum + cell.grass, 0);
  const grassCapacity = world.cells.length * world.settings.grassMax;

  const preyEnergy =
    world.prey.length === 0
      ? 0
      : world.prey.reduce((sum, prey) => sum + prey.energy, 0) /
        world.prey.length;

  const predatorEnergy =
    world.predators.length === 0
      ? 0
      : world.predators.reduce((sum, predator) => sum + predator.energy, 0) /
        world.predators.length;

  let status = "Stable";

  if (world.prey.length === 0 && world.predators.length === 0) {
    status = "Animal extinction";
  } else if (world.prey.length === 0) {
    status = "Prey extinct";
  } else if (world.predators.length === 0) {
    status = "Predators extinct";
  } else if (grassTotal / grassCapacity < 0.18) {
    status = "Overgrazing";
  } else if (world.predators.length > world.prey.length * 0.7) {
    status = "Heavy predator pressure";
  } else if (world.prey.length > world.predators.length * 12) {
    status = "Prey expansion";
  }

  return {
    tick: world.tick,
    grassTotal,
    grassPercent: grassTotal / grassCapacity,
    prey: world.prey.length,
    predators: world.predators.length,
    preyEnergy,
    predatorEnergy,
    preyGeneration: averageGeneration(world.prey),
    predatorGeneration: averageGeneration(world.predators),
    preyTraits: {
      speed: averageTrait(world.prey, "speed"),
      vision: averageTrait(world.prey, "vision"),
      caution: averageTrait(world.prey, "caution"),
      metabolism: averageTrait(world.prey, "metabolism"),
      reproductionEnergy: averageTrait(world.prey, "reproductionEnergy"),
    },
    predatorTraits: {
      speed: averageTrait(world.predators, "speed"),
      vision: averageTrait(world.predators, "vision"),
      aggression: averageTrait(world.predators, "aggression"),
      metabolism: averageTrait(world.predators, "metabolism"),
      reproductionEnergy: averageTrait(world.predators, "reproductionEnergy"),
    },
    status,
  };
}

export function pushHistory(world) {
  const settings = world.settings;

  if (world.tick % settings.chartEveryTicks !== 0) return;

  world.history.push(collectStats(world));

  if (world.history.length > settings.historyLimit) {
    world.history.shift();
  }
}

export function addEvent(world, type, message, flagKey = null) {
  if (flagKey && world.lastEventFlags[flagKey]) return;

  world.events.unshift({
    tick: world.tick,
    type,
    message,
  });

  if (flagKey) {
    world.lastEventFlags[flagKey] = true;
  }

  world.events = world.events.slice(0, 12);
}

export function evaluateEvents(world) {
  const stats = world.stats;

  if (stats.prey === 0) {
    addEvent(
      world,
      "danger",
      "Prey went extinct. Predators will starve unless the world is reset.",
      "prey-extinct",
    );
  }

  if (stats.predators === 0) {
    addEvent(
      world,
      "warning",
      "Predators went extinct. Prey may expand rapidly.",
      "predator-extinct",
    );
  }

  if (stats.grassPercent < 0.12) {
    addEvent(
      world,
      "warning",
      "Grass is critically depleted. The ecosystem is overgrazed.",
      "grass-critical",
    );
  }

  if (stats.prey > 500) {
    addEvent(
      world,
      "info",
      "Prey population exploded. Watch for a grass crash.",
      "prey-boom",
    );
  }

  if (stats.predators > 150) {
    addEvent(
      world,
      "info",
      "Predator population is very high. Prey are under major pressure.",
      "predator-boom",
    );
  }

  if (stats.preyGeneration > 6 && stats.preyTraits.speed > 0.78) {
    addEvent(
      world,
      "info",
      "Prey speed is rising through selection.",
      "prey-speed-rising",
    );
  }

  if (stats.predatorGeneration > 5 && stats.predatorTraits.aggression > 1.2) {
    addEvent(
      world,
      "info",
      "Predators are becoming more aggressive over generations.",
      "predator-aggression-rising",
    );
  }

  if (stats.preyGeneration > 5 && stats.preyTraits.metabolism < 0.88) {
    addEvent(
      world,
      "info",
      "Low-metabolism prey are becoming more common.",
      "prey-efficient",
    );
  }
}
