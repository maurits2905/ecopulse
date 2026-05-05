import { clamp } from "../utils/clamp";
import { TRAIT_LIMITS } from "./presets";
import { TERRAIN_TYPES } from "./terrain";
import { pushWorldEvent } from "./eventBus";

function varyTrait(random, value, variance, min, max) {
  const varied = value + random.range(-variance, variance) * value;
  return clamp(varied, min, max);
}

function createPreyTraits(random, settings) {
  return {
    speed: varyTrait(
      random,
      settings.preySpeed,
      settings.traitVariance,
      ...TRAIT_LIMITS.prey.speed,
    ),
    vision: varyTrait(
      random,
      settings.preyVision,
      settings.traitVariance,
      ...TRAIT_LIMITS.prey.vision,
    ),
    caution: varyTrait(
      random,
      settings.preyCaution,
      settings.traitVariance,
      ...TRAIT_LIMITS.prey.caution,
    ),
    metabolism: varyTrait(
      random,
      settings.preyMetabolism,
      settings.traitVariance,
      ...TRAIT_LIMITS.prey.metabolism,
    ),
    reproductionEnergy: varyTrait(
      random,
      settings.preyReproductionEnergy,
      settings.traitVariance,
      ...TRAIT_LIMITS.prey.reproductionEnergy,
    ),
  };
}

function createPredatorTraits(random, settings) {
  return {
    speed: varyTrait(
      random,
      settings.predatorSpeed,
      settings.traitVariance,
      ...TRAIT_LIMITS.predator.speed,
    ),
    vision: varyTrait(
      random,
      settings.predatorVision,
      settings.traitVariance,
      ...TRAIT_LIMITS.predator.vision,
    ),
    aggression: varyTrait(
      random,
      settings.predatorAggression,
      settings.traitVariance,
      ...TRAIT_LIMITS.predator.aggression,
    ),
    metabolism: varyTrait(
      random,
      settings.predatorMetabolism,
      settings.traitVariance,
      ...TRAIT_LIMITS.predator.metabolism,
    ),
    reproductionEnergy: varyTrait(
      random,
      settings.predatorReproductionEnergy,
      settings.traitVariance,
      ...TRAIT_LIMITS.predator.reproductionEnergy,
    ),
  };
}

function nextMigrationId(world) {
  world.nextMigrationId = (world.nextMigrationId ?? 1000000) + 1;
  return world.nextMigrationId;
}

function getEdgePosition(world) {
  const random = world.random;
  const settings = world.settings;

  for (let attempt = 0; attempt < 300; attempt++) {
    const side = random.int(0, 3);

    let x;
    let y;

    if (side === 0) {
      x = random.range(0, settings.worldWidth);
      y = 0.2;
    } else if (side === 1) {
      x = settings.worldWidth - 0.2;
      y = random.range(0, settings.worldHeight);
    } else if (side === 2) {
      x = random.range(0, settings.worldWidth);
      y = settings.worldHeight - 0.2;
    } else {
      x = 0.2;
      y = random.range(0, settings.worldHeight);
    }

    const cellX = Math.max(0, Math.min(settings.worldWidth - 1, Math.floor(x)));
    const cellY = Math.max(
      0,
      Math.min(settings.worldHeight - 1, Math.floor(y)),
    );
    const cell = world.cells[cellY * settings.worldWidth + cellX];

    if (cell?.terrain !== TERRAIN_TYPES.WATER) {
      return { x, y };
    }
  }

  return {
    x: world.width / 2,
    y: world.height / 2,
  };
}

function createMigratingPrey(world) {
  const random = world.random;
  const settings = world.settings;
  const position = getEdgePosition(world);

  return {
    id: nextMigrationId(world),
    type: "prey",
    x: position.x,
    y: position.y,
    energy: random.range(
      settings.preyStartEnergy * 0.85,
      settings.preyStartEnergy * 1.45,
    ),
    age: random.int(0, 80),
    generation: Math.max(1, Math.round(world.stats?.preyGeneration ?? 1)),
    cooldown: random.int(20, 90),
    dead: false,
    recentFood: 0,
    localCrowding: 0,
    migrant: true,
    traits: createPreyTraits(random, settings),
  };
}

function createMigratingPredator(world) {
  const random = world.random;
  const settings = world.settings;
  const position = getEdgePosition(world);

  return {
    id: nextMigrationId(world),
    type: "predator",
    x: position.x,
    y: position.y,
    energy: random.range(
      settings.predatorStartEnergy * 0.85,
      settings.predatorStartEnergy * 1.35,
    ),
    age: random.int(0, 100),
    generation: Math.max(1, Math.round(world.stats?.predatorGeneration ?? 1)),
    cooldown: random.int(30, 120),
    huntCooldown: random.int(0, settings.predatorHandlingTime ?? 10),
    dead: false,
    localCrowding: 0,
    migrant: true,
    traits: createPredatorTraits(random, settings),
  };
}

export function applyMigration(world) {
  const settings = world.settings;

  if (!settings.migrationEnabled) return;

  const preyCanEnter = world.prey.length < settings.maxPrey;
  const predatorsCanEnter = world.predators.length < settings.maxPredators;

  const preyRecoveryBoost =
    world.prey.length < settings.initialPrey * 0.35 ? 2.8 : 1;
  const predatorRecoveryBoost =
    world.predators.length < settings.initialPredators * 0.35 ? 2.2 : 1;

  if (
    preyCanEnter &&
    world.random.chance(settings.preyMigrationChance * preyRecoveryBoost)
  ) {
    const groupSize = world.random.int(1, settings.preyMigrationGroupSize);

    let added = 0;

    for (let i = 0; i < groupSize; i++) {
      if (world.prey.length >= settings.maxPrey) break;
      world.prey.push(createMigratingPrey(world));
      added += 1;
    }

    if (added > 0) {
      pushWorldEvent(
        world,
        "info",
        `${added} prey migrated into the ecosystem from the edge of the map.`,
        {
          category: "migration",
        },
      );
    }
  }

  if (
    predatorsCanEnter &&
    world.prey.length > settings.predatorMigrationMinimumPrey &&
    world.random.chance(
      settings.predatorMigrationChance * predatorRecoveryBoost,
    )
  ) {
    const groupSize = world.random.int(1, settings.predatorMigrationGroupSize);

    let added = 0;

    for (let i = 0; i < groupSize; i++) {
      if (world.predators.length >= settings.maxPredators) break;
      world.predators.push(createMigratingPredator(world));
      added += 1;
    }

    if (added > 0) {
      pushWorldEvent(
        world,
        "warning",
        `${added} predator${added === 1 ? "" : "s"} entered the ecosystem from the edge.`,
        {
          category: "migration",
        },
      );
    }
  }
}
