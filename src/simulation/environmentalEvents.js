import { TERRAIN_TYPES } from "./terrain";
import { pushWorldEvent } from "./eventBus";

export const ENVIRONMENTAL_EVENT_TYPES = {
  drought: {
    label: "Drought",
    description:
      "Grass growth is reduced and animals burn slightly more energy.",
    type: "warning",
    grassModifier: 0.34,
    hungerModifier: 1.08,
  },
  bloom: {
    label: "Resource bloom",
    description: "Grass grows rapidly for a short period.",
    type: "info",
    grassModifier: 2.15,
    hungerModifier: 0.96,
  },
  coldSnap: {
    label: "Cold snap",
    description: "Grass growth slows and hunger pressure rises.",
    type: "warning",
    grassModifier: 0.55,
    hungerModifier: 1.18,
  },
  preyDisease: {
    label: "Prey disease",
    description: "Prey have a small chance of dying each tick.",
    type: "danger",
    grassModifier: 1,
    hungerModifier: 1,
  },
  predatorDisease: {
    label: "Predator disease",
    description: "Predators have a small chance of dying each tick.",
    type: "warning",
    grassModifier: 1,
    hungerModifier: 1,
  },
  wildfire: {
    label: "Wildfire",
    description:
      "A burning region damages grass and can kill animals inside it.",
    type: "danger",
    grassModifier: 1,
    hungerModifier: 1.02,
  },
};

export function updateEnvironmentalEvents(world) {
  const settings = world.settings;

  world.activeEnvironmentalEvents = world.activeEnvironmentalEvents ?? [];
  world.environmentalEventCooldown = Math.max(
    0,
    (world.environmentalEventCooldown ?? 0) - 1,
  );

  world.activeEnvironmentalEvents = world.activeEnvironmentalEvents
    .map((event) => ({
      ...event,
      remaining: event.remaining - 1,
    }))
    .filter((event) => event.remaining > 0);

  if (!settings.environmentalEventsEnabled) return;
  if (world.environmentalEventCooldown > 0) return;

  const maxActive = settings.maxActiveEnvironmentalEvents ?? 2;

  if (world.activeEnvironmentalEvents.length >= maxActive) return;

  const chance = settings.environmentalEventChance ?? 0.00045;

  if (!world.random.chance(chance)) return;

  const event = createEnvironmentalEvent(world);
  world.activeEnvironmentalEvents.push(event);

  world.environmentalEventCooldown = settings.environmentalEventCooldown ?? 260;

  const info = ENVIRONMENTAL_EVENT_TYPES[event.kind];

  pushWorldEvent(
    world,
    info.type,
    `${info.label} started: ${info.description}`,
    {
      category: "disturbance",
    },
  );
}

export function getEnvironmentalModifiers(world) {
  const active = world.activeEnvironmentalEvents ?? [];

  let grassModifier = 1;
  let hungerModifier = 1;

  for (const event of active) {
    const info = ENVIRONMENTAL_EVENT_TYPES[event.kind];

    if (!info) continue;

    grassModifier *= info.grassModifier;
    hungerModifier *= info.hungerModifier;
  }

  return {
    grassModifier,
    hungerModifier,
  };
}

export function applyEnvironmentalEventEffects(world) {
  const active = world.activeEnvironmentalEvents ?? [];

  for (const event of active) {
    if (event.kind === "preyDisease") {
      applyDisease(
        world,
        "prey",
        world.settings.preyDiseaseMortalityChance ?? 0.00045,
      );
    }

    if (event.kind === "predatorDisease") {
      applyDisease(
        world,
        "predator",
        world.settings.predatorDiseaseMortalityChance ?? 0.0007,
      );
    }

    if (event.kind === "wildfire") {
      applyWildfire(world, event);
    }
  }

  world.prey = world.prey.filter((prey) => !prey.dead);
  world.predators = world.predators.filter((predator) => !predator.dead);
}

function createEnvironmentalEvent(world) {
  const settings = world.settings;

  const possible = [
    "drought",
    "bloom",
    "coldSnap",
    "preyDisease",
    "predatorDisease",
    "wildfire",
  ];

  const kind = world.random.pick(possible);

  const duration = world.random.int(
    settings.environmentalEventMinDuration ?? 220,
    settings.environmentalEventMaxDuration ?? 650,
  );

  const event = {
    id: `${kind}-${world.tick}-${Math.round(world.random.next() * 100000)}`,
    kind,
    startedAt: world.tick,
    duration,
    remaining: duration,
  };

  if (kind === "wildfire") {
    event.x = world.random.range(world.width * 0.15, world.width * 0.85);
    event.y = world.random.range(world.height * 0.15, world.height * 0.85);
    event.radius = world.random.range(5, 12);
  }

  return event;
}

function applyDisease(world, target, chance) {
  const agents = target === "prey" ? world.prey : world.predators;

  for (const agent of agents) {
    if (agent.dead) continue;

    const metabolismRisk = Math.max(0.75, agent.traits.metabolism ?? 1);
    const crowdingRisk = 1 + (agent.localCrowding ?? 0) * 0.045;

    if (world.random.chance(chance * metabolismRisk * crowdingRisk)) {
      agent.dead = true;
    }
  }
}

function applyWildfire(world, event) {
  const intensity = world.settings.wildfireIntensity ?? 0.45;
  const radiusSquared = event.radius * event.radius;

  const minX = Math.max(0, Math.floor(event.x - event.radius));
  const maxX = Math.min(world.width - 1, Math.ceil(event.x + event.radius));
  const minY = Math.max(0, Math.floor(event.y - event.radius));
  const maxY = Math.min(world.height - 1, Math.ceil(event.y + event.radius));

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - event.x;
      const dy = y - event.y;

      if (dx * dx + dy * dy > radiusSquared) continue;

      const cell = world.cells[y * world.width + x];

      if (!cell || cell.terrain === TERRAIN_TYPES.WATER) continue;

      cell.grass *= 1 - intensity * 0.12;

      if (
        cell.terrain === TERRAIN_TYPES.FOREST &&
        world.random.chance(0.0025)
      ) {
        cell.terrain = TERRAIN_TYPES.BARREN;
        cell.fertility *= 0.72;
      }
    }
  }

  killAgentsInWildfire(world.prey, world, event, 0.0015);
  killAgentsInWildfire(world.predators, world, event, 0.001);
}

function killAgentsInWildfire(agents, world, event, chance) {
  const radiusSquared = event.radius * event.radius;

  for (const agent of agents) {
    if (agent.dead) continue;

    const dx = agent.x - event.x;
    const dy = agent.y - event.y;

    if (dx * dx + dy * dy <= radiusSquared && world.random.chance(chance)) {
      agent.dead = true;
    }
  }
}
