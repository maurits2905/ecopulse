import { getCurrentSeason } from "./seasons";
import { getTerrainCounts } from "./terrain";
import { pushWorldEvent } from "./eventBus";

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
  const season = getCurrentSeason(world);

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

  const activeEnvironmentalEvents = world.activeEnvironmentalEvents ?? [];

  let status = "Stable";

  if (activeEnvironmentalEvents.some((event) => event.kind === "wildfire")) {
    status = "Wildfire";
  } else if (
    activeEnvironmentalEvents.some((event) => event.kind === "drought")
  ) {
    status = "Drought";
  } else if (world.prey.length === 0 && world.predators.length === 0) {
    status = "Animal extinction";
  } else if (world.prey.length === 0) {
    status = "Prey extinct";
  } else if (world.predators.length === 0) {
    status = "Predators extinct";
  } else if (season.key === "winter" && grassTotal / grassCapacity < 0.28) {
    status = "Winter stress";
  } else if (grassTotal / grassCapacity < 0.18) {
    status = "Overgrazing";
  } else if (world.predators.length > world.prey.length * 0.7) {
    status = "Heavy predator pressure";
  } else if (world.prey.length > world.predators.length * 12) {
    status = "Prey expansion";
  }

  const civilization = world.civilization ?? {
    enabled: false,
    population: 0,
    food: 0,
    wood: 0,
    huts: 0,
    pressure: 0,
  };

  return {
    tick: world.tick,
    grassTotal,
    grassPercent: grassTotal / grassCapacity,
    prey: world.prey.length,
    predators: world.predators.length,
    civilization,
    humans: world.humans?.length ?? 0,
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
    activeEnvironmentalEvents,
    terrain: getTerrainCounts(world),
    season,
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

export function addEvent(
  world,
  type,
  message,
  flagKey = null,
  category = "system",
) {
  if (flagKey && world.lastEventFlags[flagKey]) return;

  pushWorldEvent(world, type, message, {
    category,
  });

  if (flagKey) {
    world.lastEventFlags[flagKey] = true;
  }
}

export function evaluateEvents(world) {
  const stats = world.stats;
  const season = stats.season;

  if (stats.prey === 0) {
    addEvent(
      world,
      "danger",
      "Prey went extinct. Predators will starve unless the world is reset or migration brings prey back.",
      "prey-extinct",
      "extinction",
    );
  }

  if (stats.predators === 0) {
    addEvent(
      world,
      "warning",
      "Predators went extinct. Prey may expand rapidly unless migration reintroduces predators.",
      "predator-extinct",
    );
  }

  if (stats.grassPercent < 0.12) {
    addEvent(
      world,
      "warning",
      "Predators went extinct. Prey may expand rapidly unless migration reintroduces predators.",
      "predator-extinct",
      "extinction",
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
      "evolution",
    );
  }

  if (stats.predatorGeneration > 5 && stats.predatorTraits.aggression > 1.2) {
    addEvent(
      world,
      "info",
      "Predators are becoming more aggressive over generations.",
      "predator-aggression-rising",
      "evolution",
    );
  }

  if (stats.preyGeneration > 5 && stats.preyTraits.metabolism < 0.88) {
    addEvent(
      world,
      "info",
      "Low-metabolism prey are becoming more common.",
      "prey-efficient",
      "evolution",
    );
  }

  if (season.key === "winter" && season.progress < 0.02) {
    addEvent(
      world,
      "info",
      "Spring has returned. Grass recovery is accelerating.",
      `spring-${Math.floor(world.tick / world.settings.seasonLength)}`,
      "season",
    );
  }

  if (season.key === "spring" && season.progress < 0.02 && world.tick > 20) {
    addEvent(
      world,
      "info",
      "Spring has returned. Grass recovery is accelerating.",
      `spring-${Math.floor(world.tick / world.settings.seasonLength)}`,
    );
  }

  const total =
    Object.values(stats.terrain).reduce((sum, value) => sum + value, 0) || 1;
  const forestRatio = stats.terrain.forest / total;
  const waterRatio = stats.terrain.water / total;

  if (forestRatio > 0.18) {
    addEvent(
      world,
      "info",
      "Forest cover is creating refuge zones for prey.",
      "forest-refuge",
    );
  }

  if (waterRatio > 0.06) {
    addEvent(
      world,
      "info",
      "Water is fragmenting the map into smaller movement zones.",
      "water-fragmentation",
    );
  }
}
